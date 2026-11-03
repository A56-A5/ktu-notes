# Supabase setup

1. Create a project at supabase.com and open it.
2. **Authentication → Providers → Email**: enable Email. For a personal single-user notebook, turn off "Confirm email" so the first sign-in works immediately. Otherwise confirm the address before signing in.
3. Open **SQL Editor → New query**. Paste the entire contents of `supabase/schema.sql`. Run it. This creates:
   - `content_nodes` (recursive typed tree, primary key `(user_id, id)`)
   - `documents` (note HTML)
   - `assets` (image metadata)
   - `import_history`
   - RLS policies `auth.uid() = user_id`
   - private storage bucket `note-assets` and per-user storage policies
4. **Project settings → API**: copy the Project URL and the publishable/anon key.
5. Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
   ```
6. Restart `npm run dev`.
7. Click the storage pill in the header → create an account → choose which copy to keep.

## Verifying

- Header pill says **Synced** after the first push.
- Supabase **Table editor → content_nodes** shows rows for your user.
- **Storage → note-assets → &lt;user-id&gt;/** contains uploaded images.
- RLS: with a second account, the first account's rows are invisible (queries return an empty array).

## Common problems

| Symptom | Cause / fix |
|---|---|
| “Cloud tables are missing” | `supabase/schema.sql` was not run, or was run in another project. Run it in this project's SQL editor. |
| Sign-up succeeds but no session | Email confirmation is on. Confirm the email, then sign in (or disable confirmation for personal use). |
| `new row violates row-level security policy` | The client is not signed in, or the policy was edited. Re-run the RLS section of the schema. |
| Images upload but do not appear on another device | The bucket is private by design; the app downloads through an authenticated session. Check the storage policies use `(storage.foldername(name))[1] = auth.uid()::text`. |
| Two devices overwrite each other | Whole-notebook last-writer-wins. Export a ZIP before switching devices and avoid simultaneous edits. |
