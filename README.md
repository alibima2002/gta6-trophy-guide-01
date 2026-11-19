# Leonida Trophy Guide — GTA VI

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun rank](https://make.fun/badge/gta6-trophy-guide-01/alibima2002/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun reward](https://make.fun/badge/gta6-trophy-guide-01/alibima2002/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI PlayStation 5 trophies** — built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **Checklist** of all 55 trophies with their official names, descriptions and grades, saved in the browser (localStorage) with **export/import** as a JSON file.
- **Filters** by kind (story, side missions, collectibles, activities, robberies, one-off stunts, 100% completion, platinum), by grade, by text search, missable-only and hide-earned.
- **Spoiler setting** (on by default): hidden and story trophies show no name or description until they are earned.
- **Platinum roadmap**: seven stages in play order — story first, side characters, exploring Leonida, activities, robberies, collectibles, then 100% cleanup — each with per-stage progress.
- **Missables view**: the one possibly-missable trophy (Positive Mental Attitude) flagged with its save advice, stated as a community report, not a certainty.
- **Guide pane**: every trophy's guide in our own words, its PSN progress target where PSN tracks one, and its sources beside it.

## Where the facts come from

- Trophy names, descriptions, grades and hidden flags: the official list on [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/).
- Grades and PSN progress counts: [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi).
- The missable warning for Positive Mental Attitude: PowerPyx and GTABase, as reported by [egamers.io](https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/) and [outputlag](https://outputlag.com/guides/gta-6-trophy-list/).

Guides are our own advice built from the official descriptions, not yet checked in the game. A place or exact step is given only where a cited source pins it down; where it is not pinned down, the guide says so plainly.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

No build step, no network: every file the page loads lives under `app/`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Tests

```sh
node tools/test.mjs   # Playwright checks: filters, spoiler mask, persistence, export/import, roadmap, missables, offline
node tools/shots.mjs  # regenerates the 4 screenshots in screenshots/
```

Playwright Chromium is used with the browser already on this machine (`playwright-core` + the cached Chromium build).

## License

MIT — see [LICENSE](LICENSE).
