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

### Dungeon side-content pass (ChatGPT)
Expanded the dungeon's defensive roster and fixed several follow-on issues:

- Added 3 more combat defenders: Imp Slinger (level 12), Frost Spider (level 20), and Necromancer (level 28). The spider slows the hero and the necromancer heals nearby defenders.
- Added 3 wall types: Reinforced Wall (level 5), Rune Wall (level 18), plus the existing basic Wall. Rune Walls inflict contact damage while still functioning as path blockers.
- Added 3 traps: Spike Trap (level 3), Fire Rune (level 14), and Frost Rune (level 24). Traps trigger when the hero enters their tile; Frost Rune also slows the hero.
- Added 3 persistent upgrades: Fortified Masonry, Cruel Engineering, and Demonic Logistics, expanding the original damage/health/income upgrade set.
- Added simple projectile traces for defender attacks and more explicit trap rendering.
- Reworked hero movement to follow the nearest actual BFS waypoint rather than deriving a waypoint from the hero's x-coordinate.
- Fixed old saves so missing upgrade fields are migrated to zero instead of producing undefined/NaN behavior.
- Increased completed-level gold scaling so the new roster remains economically accessible.

Validation: game.js was compiled with JavaScript's Function constructor after the changes with no syntax error. A full browser click-through still needs to be rerun by Claude Code; this pass deliberately avoided claiming browser-level verification without that environment.

### Browser verification of the dungeon side-content pass (Claude)
Ran the requested full click-through in a headless browser. No regressions:
placed a mix of traps/walls/support units (spike trap, frost trap,
necromancer, frost spider, rune wall, imp, goblin) at level 30, ran a full
invasion to breach, zero console errors throughout.

Found and fixed one real bug along the way: trap defenses have no `hp`
field in `types`, so `place()`'s `hp = t.hp * (1 + ...)` computed `NaN`.
Harmless to trap logic itself (nothing reads a trap's hp except the
`defenseCount` HUD stat, which filters on `d.hp > 0`), but it meant every
placed trap silently vanished from that count. Fixed by giving traps a
fixed `hp: 1` instead of deriving it from a field they don't have.

### Hero-side expansion (Claude)
Per direct request: named gear/weapon progression and a fixed ally-join
cadence, replacing the flat "one companion per 10 levels" system.

- **Named gear tiers**: `heroStats()`'s numeric `gear` stat (unchanged) now
  has a `GEAR_TIERS` naming layer on top — 7 named weapon/armor sets from
  "Rusty Shortsword & Leather Rags" at level 1 to "The Last Thing You'll
  Ever See" at level 100. `victory()` announces the upgrade the moment the
  hero crosses into a new tier, and the CONSTRUCTION panel's objective text
  now always shows the hero's current gear name.
- **Allies now join at exactly levels 20/40/60/80** (`ALLY_LEVELS`) instead
  of every 10 levels — 4 named arrivals (Paladin, Witch, estranged sibling,
  a whole squad of volunteers) instead of 10 generic ones, each still tied
  to `heroStats().companions` so the stat contribution and the narrative
  beat can never drift apart.

**Balance note**: this reduces the companion stat contribution's ceiling
from 10x to 4x by level 100 (the previous every-10-levels cadence hit 10
companions by end-game; the new fixed-4 cadence caps at 4). That's a real
power reduction for the level-100 hero, not just a relabeling — worth
weighing in the still-owed balance pass, since it may now undershoot where
zombies/turrets top out relative to the hero. Didn't compensate for it
elsewhere since that wasn't asked for and would be guessing at numbers
without the full-run simulation the balance pass needs anyway.

Verified via headless browser: gear tier boundaries resolve correctly
across the full level range, companions tick up at exactly 20/40/60/80
(confirmed via direct `heroStats()` calls at 19/20/39/40/59/60/79/80),
both announcements fire correctly through real `victory()` transitions
with no duplicate or missing events, and a full build → invade → combat
run with the new content still completes with zero console errors.

### Next milestone
Expand the map from a simple grid into a room-and-corridor dungeon.

A real balance pass is still owed (flagged in Issue #1): verify gold income
vs. new unlock costs over a full run, whether melee vs. ranged defenders
stay both viable as the hero out-scales them, and now also whether the
hero's reduced companion ceiling (10x -> 4x by level 100, see above) needs
compensating elsewhere in the hero curve.


### Deep-dive repair pass (ChatGPT)

Reviewed current main at code level after the prior browser verification. Fixed the following issues:

- Made side-quest bonuses persistent through a new saved `heroBonus` object instead of modifying only the transient hero instance. Old saves migrate missing bonus fields to zero.
- Corrected reward descriptions/behavior: Extraction Routines now grants +25 gold per level, and Demonic Logistics now grants +5 gold per completed level.
- Added upgrade caps and escalating prices to prevent unlimited flat-price scaling. Damage/health/income/arsenal cap at 5; masonry/traps cap at 4.
- Replaced global nearest-defender hero targeting with route-aware targeting limited to defenders near the current BFS route. Hero attack range is now its own fixed melee radius rather than inheriting the target defender's range.
- Added basic wall line-of-sight blocking for ranged defenders.
- Added a moving projectile presentation instead of an instantaneous static line.
- Reworked canvas rendering so walls, traps, and every defender class have distinct silhouettes and visual motifs instead of uniform rectangles. The server, entry, path, hero, health bars, and slow state are also more readable.
- Added a selected-defense information panel to the construction UI.
- Fixed the earlier trap HP problem explicitly by giving traps a real HP value.
- Ran a JavaScript syntax compilation check after the changes. It passes. Full browser/headless regression testing remains the next validation step and has not been claimed here.

Known architectural limitations intentionally remaining: defenders are still stationary, companion characters are still represented primarily through hero progression rather than separate map units, room/corridor construction is not yet implemented, and the projectile system is visual rather than physically colliding. These are larger feature expansions rather than silent bug fixes.

### Critical regression fix (Claude) — reported directly by a player

A player screenshot showed the exact failure this pass's own notes flagged
as unverified: click START INVASION, hero icon appears at the entry tile,
and then nothing — no movement, no combat, forever. 6 goblins placed, gold
correctly spent to 0, hero frozen.

Root cause: the deep-dive pass's new `nearestTarget(path)` signature (for
route-aware targeting) was never updated at its one call site in `tick()`,
which still called `nearestTarget()` with zero arguments. With `path`
`undefined` inside the function, `routeIndexForHero(path, h)`'s
`path.forEach(...)` threw a `TypeError` on literally every tick, before the
movement code below it ever ran. `setInterval` doesn't stop on a thrown
callback, so this wasn't a crash — it was a silent, permanent no-op, every
100ms, forever. Confirmed via `page.on('pageerror', ...)` in a headless
browser: 15 identical "Cannot read properties of undefined (reading
'forEach')" errors in under 2 seconds of real time.

Also found and fixed a second regression in the same block introduced by
the same commit: the melee-engage distance had reverted to a hardcoded
`1.15` ("Hero attack range is now its own fixed melee radius rather than
inheriting the target defender's range" per that pass's own notes),
instead of `types[target.type].range`. This is the exact bug class fixed
in the very first bugfix pass (`9c2efd7`) — a defender with `range < 1.15`
(several exist) could again end up attacked but unable to attack back.

Fixed both with a two-line change: `nearestTarget(path)` at the call site,
and `types[target.type].range` for the engage check. The same two bugs
were also baked into `HATRED_Playtest.html`, which embeds its own full
copy of the game code rather than loading `game.js` — fixed there too
(`10b792b`).

Verified via headless browser: hero moves within the first tick of
starting an invasion, a full 6-defender gauntlet (matching the reported
scenario) resolves correctly end to end — movement, mutual damage, kills,
hero death, level-up, back to build — with zero console errors, in both
`index.html`/`game.js` and the standalone playtest build.

**Process note**: this is the second time a targeting/range change has
shipped without the call site or a browser check catching it (see the
original `9c2efd7` bugfix pass for the first). Given `tick()` is a hot,
tightly coupled path (movement, targeting, combat, traps, contact damage
all interact every 100ms), a small manual smoke test — start an invasion
with one defender placed on the path and confirm the hero actually moves
and takes damage — before pushing any change that touches `tick()` or its
helpers would catch this class of bug immediately, without needing a full
headless-browser setup.
