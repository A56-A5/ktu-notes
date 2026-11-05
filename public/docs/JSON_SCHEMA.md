# KTU Notes JSON format (v1)

A notebook file is a single JSON object:

```json
{
  "format": "ktu-notes",
  "version": 1,
  "exportedAt": "2025-11-03T12:00:00.000Z",
  "nodes": [ Node, ... ]
}
```

`format` must be exactly `ktu-notes`. `version` is currently `1`. `nodes` is an array of top-level nodes. When importing at the home/semester level, each top-level node must be a `subject`; when importing into a subject or folder, any type is allowed.

## Node

| field | required | type | notes |
|---|---|---|---|
| `type` | yes | string | `semester`, `subject`, `folder`, `module`, `topic`, `subtopic`, `note`, `resource` |
| `title` | yes | string | non-empty |
| `id` | no | string | used for duplicate/collision detection and replace-by-ID |
| `code` | no | string | course code, mainly on subjects |
| `description` | no | string | short summary |
| `subtitle` | no | string | e.g. official module title |
| `category` | no | string | e.g. `syllabus`, `subtopic` |
| `hours` | no | number | contact hours |
| `source` | no | string | `official`, `personal`, `imported` |
| `progress` | no | string | `done` or `todo` |
| `body` | no | string | TipTap HTML for notes |
| `children` | no | array | nested nodes, unlimited practical depth (validator caps at 60) |

Array order becomes display order. Unknown fields are ignored.

## Images and assets

In note HTML, images are referenced as:

```html
<img src="asset:a-abc123" data-width="75" data-align="center" data-caption="OSI layers">
```

- Plain JSON export keeps `asset:<id>` references but does not contain the binary files.
- ZIP export contains `data.json`, `assets/<id>.<ext>` and an `assets` manifest:
  ```json
  "assets": [{ "id": "a-abc123", "file": "assets/a-abc123.png", "name": "osi.png", "type": "image/png" }]
  ```
- Importing a ZIP creates fresh asset ids, stores the blobs, and rewrites each note's references so images stay attached to the correct note.
- Importing plain JSON with `asset:` references cannot restore missing binaries; use ZIP for portable backups.

## Import modes

- **Merge (default)** - every imported node gets a fresh id and is appended after existing siblings. Nothing is overwritten. Duplicate ids inside the file are reported and resolved with fresh ids.
- **Replace by ID** - nodes whose `id` matches an existing node replace that node after an explicit confirmation. Nodes not present in the file are left alone. This is the only mode that can overwrite content.

Validation runs before anything is written. Errors block the import; warnings (duplicate ids, version mismatch, collisions) are shown with the hierarchy preview.

## Minimal example

```json
{
  "format": "ktu-notes",
  "version": 1,
  "nodes": [
    {
      "type": "subject",
      "title": "Example Subject",
      "code": "EXAMPLE101",
      "children": [
        { "type": "note", "title": "Syllabus", "body": "<h2>Syllabus</h2>" },
        {
          "type": "module",
          "title": "Module 1",
          "children": [
            {
              "type": "topic",
              "title": "Example topic",
              "children": [
                { "type": "note", "title": "Example subtopic", "body": "<p>Notes…</p>" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

A downloadable copy lives at `public/example-import.json` and in the app under **Import & export → JSON format**.
