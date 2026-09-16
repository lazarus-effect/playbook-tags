# data/

One file per class or theme. Every file validates against `../schema/tags.schema.json`:

```bash
node ../validate.mjs
```

Phase 1 ships hand-tagged files for cleric, fighter (Battle Master), warlock, rogue, and wizard.
Everything else falls back to Playbook's runtime heuristics, which is fine — a missing entry means
"ranked by the sheet alone", never "dropped".

Keys are `kind` + `definitionId` (or `kind` + lowercased `name` for homebrew), unique across all
files.
