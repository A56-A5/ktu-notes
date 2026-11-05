# KTU Notes

A personal semester notebook for **APJ Abdul Kalam Technological University, B.Tech Computer Science and Engineering, 2024 Scheme, Semester 5**.

It opens with the five requested subjects, four modules and a syllabus entry each, and every node is editable. The visual language is deliberately scrapbook-like: torn paper, masking tape, binder rings, ruled note sheets and handwritten headings. This is a working local-first application, not a mockup.

## What it does

- **Home page** with the five subjects (`PECDT525 Data Mining`, `PCCST501 Computer Networks`, `PCCST502 DAA`, `PCCDT503 Data Analytics`, `PBCDT504 Big Data Processing`), search, pinned subjects, recently opened items, note/module counts and study progress. Data Mining is pinned and first.
- **Unlimited recursive tree** of semesters, subjects, folders, modules, topics, subtopics, notes and resources. Add, rename, edit, delete, duplicate, move, reorder, expand/collapse and drag-and-drop. Breadcrumbs everywhere.
- **Rich-text notes** (TipTap): bold/italic/underline/strike/highlight, headings, lists, checklists, tables, quotes, dividers, links, inline code, highlighted code blocks, LaTeX inline and block equations.
- **Images**: upload, paste, drag/drop, resize, align, caption, remove. Stored as blobs (never Base64 in the database) and referenced as `asset:<id>`.
- **Local-first persistence** in IndexedDB, with a localStorage fallback. Data survives refresh and restart.
- **Optional shared Supabase sync** - no login: everyone who opens the app edits the same notebook, and rows are open to the anon key by design.
- **Local only mode** - switch the notebook to this browser from the cloud panel. Nothing is uploaded, downloaded or polled until you switch back.
- **JSON and ZIP import/export** with validation, hierarchy preview, merge or replace-by-ID, collision detection and progress summaries. ZIP exports include images and work as portable restores.
- **Responsive layout**: desktop binder sidebar, mobile drawer, full-screen editing, readable typography, empty/loading/error states, toasts and confirmation dialogs.
- **Default content is not immutable**: every syllabus note, module, topic and subtopic can be changed or deleted. “Restore defaults” re-adds only missing entries without touching your edits.
- **Ready-made Data Mining modules**: `lib/data/dm-modules.json` holds Modules 1–4 (16 + 16 + 18 + 16 notes, 240 KB of written material) as module → topic → note trees and is seeded as the default Data Mining content. Each module also exists as a standalone, importable JSON file (`mod1.json`–`mod4.json`) in the development home folder.

## Run locally

```bash
npm install --legacy-peer-deps   # TipTap peer versions need this flag
npm run dev                      # http://localhost:3000
```

Without Supabase variables the app is in local mode and stores everything in the browser. With them configured, the notebook syncs by default; open the cloud panel (header pill) and choose **Local only** to keep it private to this browser. Clear site data and the local notebook is gone - use **Export → ZIP + images** for backups.

## Supabase setup (optional shared sync)

This project uses a deliberately login-free, shared notebook. There is no sign-up, no email confirmation and no per-user isolation: anyone who can open the site can read **and edit** the same notes. That is intended - treat the deployment URL as a public link.

1. Create a project at [supabase.com](https://supabase.com). You do **not** need to configure Authentication.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql` and run it. It creates the tables, shared RLS policies, indexes and the public `note-assets` bucket. Running it on a project that used the old login-based schema migrates it in place (keeps the rows, moves them into the `public` workspace).
3. Copy `.env.example` to `.env.local` and fill:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable or anon key>
   ```
   Only the publishable/anon key belongs in the browser, and it is safe to ship because the tables are world-writable. Never put the service-role key in a `NEXT_PUBLIC_` variable.
4. Restart `npm run dev`. The header pill shows the sync state; no account step is needed. Edits push ~1.4 s after they settle, and other people’s edits are pulled every 20 s while the tab is visible.

**Notebook modes:** the header pill opens a panel with two modes. *Shared notebook* keeps this browser in sync with everyone else who opens the site. *Local only* stops all uploads, downloads and polling, so the notebook never leaves this browser (use it to keep a private copy or to work offline); switching back merges the local edits with the cloud copy.

**Sync model:** the notebook is merged per item - the copy with the newest `modified` timestamp wins, local deletes of previously synced items are propagated, and items only present on one side are kept. This is not a full per-field merge: two people typing in the same note at the same moment can still overwrite each other. Export a ZIP backup before a large edit session.

Manual copy controls live in the header pill → **Shared notebook**: *Sync now*, *Pull cloud copy* and *Overwrite cloud with this browser*.

### Schema design

`content_nodes` is one recursive table keyed `(workspace_id, id)` with `parent_id` self-reference, a constrained `type`, and `sort_order`. Note bodies live in `documents`, binaries in the `note-assets` bucket with metadata in `assets`, and imports are logged in `import_history`. This supports arbitrary depth without hard-coding semester → subject → module.

`workspace_id` defaults to `'public'` and has no foreign key to auth users. RLS is enabled but the policies allow `anon` and `authenticated` full access. Storage policies allow anonymous uploads and reads on `note-assets`. Override the workspace with `NEXT_PUBLIC_WORKSPACE` if you run several independent notebooks on one project.

## JSON format

Full documentation: [`docs/JSON_SCHEMA.md`](docs/JSON_SCHEMA.md). A ready template is downloadable from **Import & export → JSON format** and at [`public/example-import.json`](public/example-import.json).

```json
{
  "format": "ktu-notes",
  "version": 1,
  "nodes": [
    {
      "type": "subject",
      "title": "Computer Networks",
      "code": "PCCST501",
      "children": [
        { "type": "module", "title": "Module 1", "children": [
          { "type": "topic", "title": "Protocol layering", "children": [
            { "type": "note", "title": "OSI model", "body": "<h2>OSI model</h2><p>…</p>" }
          ] }
        ] }
      ]
    }
  ]
}
```

The app validates before writing, shows the hierarchy, reports errors and warnings, detects duplicate IDs and collisions, and previews exactly what will be added. Merge mode gives every imported node a fresh id and never overwrites. Replace-by-ID asks first.

Images in note HTML are `asset:<id>` references. Plain JSON keeps the references; ZIP backups also contain `assets/` so the importer can re-link them. **Always use ZIP for a backup that must restore images.**

## Backups

- Per note / folder / subject / whole notebook: **Export** in the header, a node menu, or a folder header.
- ZIP includes `data.json`, `assets/`, and a README.
- `npm run backup` writes `ktu-notes-backup.zip` to the project root (excludes `node_modules`, `.next`, `.screens`, env files).
- restores: **Import** accepts the ZIP, re-links images and imports into the chosen folder.

## Syllabus sources

Module numbering and topic wording follow the published KTU 2024 Scheme curriculum:

- B.Tech Curriculum 2024, Computer Science and Engineering (Group A), Semester 5 - PCCST501, PCCST502.
- B.Tech Curriculum 2024, Computer Science and Engineering (Data Science), Semester 5 - PCCDT503, and **PBCDT504** Big Data Processing (PBL).
- KTU S5 syllabus compilation (mgmits.ac.in) - PECDT525 Data Mining.

Official content is tagged `official`, import content `imported`, your own work `personal`. Syllabus entries can be edited or deleted; `Syllabus` notes carry a source/verification section. If a university revision changes a module, edit the entry - nothing is locked.

## Project layout

```
app/                 page shell, layout, global scrapbook design system
components/          tree, editor, folder view, dialogs, import/export, shared-notebook panel
lib/                 store, indexdb, cloud, tree helpers, seeded syllabus, io
docs/                JSON schema and Supabase setup
public/              example import template + icon
supabase/schema.sql  tables, RLS, storage policies
scripts/backup.sh    source-only ZIP backup
```

## Known limitations

- Local-only mode is per browser/profile; it is not shared between devices.
- Shared cloud mode has no login: anyone with the URL can edit or delete notes. Keep private material out of a public deployment.
- Search is client-side and scans the data already in the notebook.
- Cloud sync merges per item (newest `modified` wins), not per field.
- PDF export is not implemented; printing the note page uses the print stylesheet.
- The Supabase project given for development may still need `supabase/schema.sql` run before sync works; the header shows “Cloud not ready” and the reason until then.

## Checks

`npm run build` must pass. The app was exercised in Chromium at desktop and 390×844 mobile widths: subject CRUD, five levels of nesting, note editing, image upload/paste persistence, drag reorder/move, refresh persistence, valid/invalid JSON import, ZIP export/import with images, and scoped JSON export.
