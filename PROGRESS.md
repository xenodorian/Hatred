# Development Progress

## 2026-09-18

### Prototype 0.2
- Initialized GitHub repository.
- Added browser UI and canvas dungeon board.
- Added walls, goblins, zombies and ballistae.
- Added path validation and hero pathfinding.
- Added combat and defender cooldowns.
- Added armor and defender-health upgrades.
- Added gold and progression.
- Added hero history.
- Added escalating dialogue.
- Added localStorage persistence.
- Added permanent breach loss.
- Added Level 100 surrender ending.

### Bugfix pass (Claude)
Tested Prototype 0.2 end-to-end in a real headless browser and found the
game was not actually completable. Fixed three bugs in `game.js`, all
confirmed via automated browser runs before and after:

- `pathfind()` seeded its BFS queue as `[[ENTRY]]` (an array containing an
  array) instead of `[ENTRY]`, so the first `shift()` returned an array
  whose `.x`/`.y` were `undefined`. Every subsequent step computed on
  `NaN` and the search always returned no path — invasions could never
  start, even on an empty grid.
- `heroStats()` set `maxHp` but never set `hp`, so the very first point of
  damage taken computed `undefined - dmg`, permanently setting `hero.hp`
  to `NaN`. Since `NaN <= 0` is always `false`, the hero could never
  actually be defeated by damage — only a breach could end a run, so the
  overlord could never win.
- The hero locked into melee at a hardcoded distance of `1.15`, but
  goblins/zombies have `range: 1.1`. Once the hero's incremental movement
  (step size `.035`) landed it in the gap between those two numbers, it
  would attack a defender that could never attack back, and — because the
  movement code also had no snap-to-waypoint case, so a hero within `.02`
  of a path node would freeze there forever instead of continuing — combat
  could also just permanently stall with the hero stuck a fraction of a
  tile short of its target. Fixed the engage distance to use the target's
  own `range`, and added a snap-to-waypoint case for the `dist <= .02`
  boundary.

Net effect: before this pass, no run could ever be won or lost on damage —
only breach-only losses worked, and many configurations froze outright.
After it, kills, breaches, leveling, and the build/combat phase loop all
verified working end to end.

### Content pass (Claude)
Reviewed ChatGPT's gear/side-quest commit (`b61a9f5`) — no regressions, the
three prior fixes all held, and it fixed an unrelated double-count bug of
its own (`attempts` was being incremented in both `start()` and `victory()`;
the new commit dropped the `victory()` one, which is correct). Built on top
of it with pure content additions, no engine/combat changes:

- **3 new defender types** (`orc`, `arcane` cannon, `wraith`), each gated
  behind a `types[id].unlock` level threshold and filtered into
  `renderTools()` automatically. `DUNGEON RESEARCH: <name> is now
  available.` logs the moment a threshold is crossed, inside `victory()`.
- **Named companions**: `heroStats()`'s existing `companions` count (one per
  10 levels) previously had no identity. Added a 10-entry `COMPANION_JOIN`
  flavor list, announced the instant the count ticks up, escalating from a
  single disgraced Ranger to "an entire army" by level 100 — this is the
  concrete payoff for the "hero acquires a whole squad" part of the game's
  premise, which existed numerically but not narratively before.
- **Full dialogue rewrite**: `line()` previously returned one fixed string
  per event type, with only the `start` line varying by level (6 total
  lines in the whole game). Replaced with a `DIALOGUE` table of 6 level
  tiers × 3 events (`start`/`death`/`breach`) plus a separate `won` pool,
  3-5 lines per tier, randomly picked each time (`pick()`/`tierLines()`).
  `defeat()` now also uses tiered dialogue instead of one hardcoded taunt
  regardless of level.

All verified via headless-browser tests: unlock announcements and
companion-join lines fire at the exact right level transitions (tested
9→10 and 7→8 directly via `victory()`), dialogue resolves without error
across the full 1-100 range for every event type, and a full build→invade→
combat click-through still works end to end with zero console errors.

### Next milestone
Expand the map from a simple grid into a room-and-corridor dungeon and add hero equipment, side quests, companions and specialized defensive structures.

A real balance pass is still owed (flagged in Issue #1): verify gold income vs. new unlock costs over a full run, and whether melee vs. ranged defenders stay both viable as the hero out-scales them.
