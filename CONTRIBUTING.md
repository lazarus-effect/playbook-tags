# Contributing

Fixing your own class's defaults fixes them for everyone using Playbook. Small pull requests are
perfect — one entry is a good pull request.

## The one rule

**Ids, names, and opinions only. No publisher content.**

Don't paste spell or feature text, descriptions, or stat blocks — not into `note`, not anywhere. If
you want to explain a ranking, write it in your own words:

- Good: `"Bonus-action damage that doesn't need concentration — usually turn one."`
- Not OK: a sentence copied from the spell's description.

The validator rejects notes that read like rules text. It can't catch everything, so this one is on
you.

## How to add or fix an entry

1. Find the D&D Beyond definition id. On your character sheet, the id is in the URL when you open
   the thing's detail pane. Homebrew has no stable id — leave `definitionId` out and it'll be keyed
   by name.
2. Put the entry in the file for its class or theme under `data/` (make a new file if none fits).
3. Run the validator:

   ```bash
   node validate.mjs
   ```

4. Open a pull request. Say what you play and why the old ranking was wrong — that's the useful part.

## How to pick `modes.combat`

The number is "how much room does this deserve on a phone-sized screen, mid-fight".

| Range | Means | Typical |
|---|---|---|
| 85–100 | The thing you do most turns | A cleric's Spiritual Weapon, a fighter's main attack |
| 60–84 | Strong, situational, you'll reach for it in a real fight | Save-or-suck control, a good heal |
| 30–59 | Occasionally right | Utility with a combat use, weak damage options |
| 1–29 | Rarely right, but don't hide it | Ribbon abilities |
| `null` | Drawer — reachable, not on screen | Out-of-combat utility, rituals, passives |

Two rules of thumb: **cost matters** (a bonus action that doesn't use concentration beats an action
that does), and **nothing is ever removed** — `null` means "in the drawer", not "gone".

## Tags

Use as many as fit, but be honest: `attack` is for things that roll against a target or force a save
for damage; `control` is for things that change what the enemy can do; `buff`, `heal`, `defensive`,
`movement` do what they say. `concentration`, `ritual`, `limited-use`, and `passive` describe cost
and availability, and `toggle` and `rider` need their own block (see the schema).

## What happens to your pull request

The validator runs in CI. Laz reviews for the content rule and for obviously wrong priorities, then
merges. Playbook ships a pinned release of this repository, so your change reaches players on the
next release.
