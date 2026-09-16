# Playbook tags

Playbook's opinions about what each spell, feature, action, and item is **for at the table** — what
belongs on screen in combat, what belongs in a drawer, and what it costs to use.

Playbook is a browser extension that re-lays-out your own D&D Beyond character sheet for table play.
It knows what your character *has*, because your sheet is open in front of it. What it can't know is
what matters **right now, in this fight**. That's what this database is: the priorities that make
Playbook open on your best options instead of on Unarmed Strike.

## What's in here, and what never will be

**In:** D&D Beyond definition ids, names, and Playbook's own metadata — a combat priority, an action
cost, a recharge, and a handful of tags.

**Never in:** spell text, feature descriptions, item descriptions, stat blocks, or any other
publisher content. Not a sentence of it. This repository is public precisely because it contains
none: it is a list of opinions keyed to ids. If a contribution would need rules text to make sense,
it belongs in a `note` written in your own words, or nowhere.

## Layout

```
schema/tags.schema.json   the schema (v0)
validate.mjs              the validator — zero dependencies, same command CI runs
data/*.json               the tags, one file per class or theme
```

## An entry

```json
{
  "definitionId": "2019",
  "name": "Spiritual Weapon",
  "kind": "spell",
  "modes": { "combat": 85 },
  "action": "bonus",
  "tags": ["attack", "limited-use"],
  "source": "hand",
  "note": "Bonus-action damage that doesn't need concentration — usually turn one."
}
```

- `modes.combat` — 0–100, how much room it deserves in combat. `null` means the drawer.
- `action` — `action` · `bonus` · `reaction` · `free` · `none`.
- `recharge` — `short` · `long` · `dawn` · `charges` · `none`.
- `tags` — attack, control, buff, heal, utility, defensive, movement, social, knowledge, ritual,
  concentration, passive, limited-use, rider, toggle.
- `source` — `hand`, `heuristic`, or `llm`. Hand-curated entries win.

Full field list, including `toggle` and `rider`: [`schema/tags.schema.json`](schema/tags.schema.json).

## Validate

```bash
node validate.mjs
```

Node 18 or newer, nothing to install. CI runs the same command on every pull request.

## Contributing

A Rune Knight player who fixes their own defaults fixes them for everyone. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Anything not listed here still works

Playbook falls back to heuristics — action cost, recharge, and whether something attacks, heals, or
buffs, read from your own sheet — so homebrew and brand-new content are never dropped, just ranked
less well. Fixing that is what a pull request here is for.

## Licence

Tags and schema: CC0 1.0 (public domain). See [LICENSE](LICENSE).
