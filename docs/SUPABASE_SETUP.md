# Supabase setup (shared, login-free notebook)

This app has **no login**. Everyone who opens the site edits the same shared
notebook, so treat the deployment URL as a public link. Only the publishable /
anon key is used in the browser, and it is safe to ship because the tables are
world-writable by design.

## New project

1. Create a project at supabase.com. You do **not** need to configure
   Authentication (Email/Google/etc.).
2. Open **SQL Editor → New query**. Paste the entire contents of
   `supabase/schema.sql`. Run it. It creates:
   - `content_nodes` (recursive typed tree, primary key `(workspace_id, id)`)
   - `documents` (note HTML)
   - `assets` (image metadata)
   - `import_history`
   - shared RLS policies allowing `anon` + `authenticated` full access
   - public storage bucket `note-assets` with anonymous read/write policies
3. **Project settings → API**: copy the Project URL and the publishable/anon key.
4. Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
   ```
   Optional: `NEXT_PUBLIC_WORKSPACE=public` if you run several independent
   notebooks on one project.
5. Restart `npm run dev`. The header pill shows sync state - there is no sign-in.

## Upgrading a project that used the old login schema

`schema.sql` migrates in place, safely and idempotently:

- drops the foreign keys to `auth.users`,
- renames `user_id` → `workspace_id`,
- converts it `uuid` → `text` and sets every row to the `'public'` workspace
  (your notes are kept),
- replaces the per-user RLS policies and storage policies with shared ones,
  and makes the bucket public.

Just run the file again. It aborts with a clear message if two old users owned
the same node id (it would collide in the shared notebook) - delete those
duplicates first, then re-run.

## Verifying

- Header pill says **Shared · synced** after the first push.
- Supabase **Table editor → content_nodes** shows the shared rows.
- **Storage → note-assets → public/** contains uploaded images.
- Open the site in a second browser (or private window): it pulls the same
  notebook with no account.

## Common problems

| Symptom | Cause / fix |
|---|---|
| “Cloud tables are missing” | `supabase/schema.sql` was not run, or was run in another project. Run it in this project's SQL editor. |
| “Row Level Security blocked the request” | The project still uses the old per-user policies. Re-run `supabase/schema.sql`. |
| `new row violates row-level security policy` | The anon role has no grants/policies yet. Re-run the RLS/grants section of `supabase/schema.sql`. |
| Two people edit the same note at once | Merge is per item (newest `modified` wins). Last writer wins on that note; export a ZIP before a big shared edit session. |
| Someone deleted something | Anyone with the link can delete. There is no undo across devices; keep a ZIP backup. |

## Notebook modes

The header pill opens the notebook panel:

- **Shared notebook** syncs this browser with the workspace (default when the
  Supabase variables are set and `supabase/schema.sql` has been run).
- **Local only** disables push, pull and polling completely. Nothing leaves
  the browser, and the choice is remembered per browser.

Switching back to Shared notebook merges the local edits with the cloud copy
(newest `modified` wins per item). The mode is stored in `localStorage` under
`ktu-notes-cloud-mode`.

## Refreshing the built-in Data Mining modules

`lib/data/dm-modules.json` is versioned with `LIBRARY_VERSION` in `lib/seed.js`.
When it changes, bump that number: existing browsers replace the old seeded
Data Mining subtree on the next load, while notes the user created under it are
kept (re-parented to the subject). No manual clearing of site data is needed.
