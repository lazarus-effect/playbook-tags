# data/

One file per class or theme. Every file validates against `../schema/tags.schema.json`:

```bash
node ../validate.mjs
```

Phase 1 ships files for cleric, fighter, rogue, warlock, and wizard, plus `common.json` (actions every
character has). Everything else falls back to Playbook's runtime heuristics, which is fine — a missing
entry means "ranked by the sheet alone", never "dropped".

- **Spells** are keyed by definition id. The 2014 and 2024 versions of a spell have different ids, so a
  spell can have two entries with the same name. A spell on several class lists lives in the first of
  `cleric.json`, `warlock.json`, `wizard.json`.
- **Class features** have no definition id in what Playbook reads, so they're keyed by name — the exact
  name DDB shows, curly apostrophes included.
- **Not yet covered:** Battle Master maneuvers other than the nine on the captured character, weapon
  mastery actions (DDB names them per weapon, e.g. "Graze (Greatsword)"), and spells only on other
  classes' lists.
- `source: "llm"` marks entries drafted with an LLM from real character data and not yet reviewed by a
  person. Review turns them into `"hand"`.

Keys are `kind` + `definitionId` (or `kind` + lowercased `name` for homebrew), unique across all
files.
