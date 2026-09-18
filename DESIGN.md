# HATRED Design

The player is an AI controlling a dungeon. A human hero repeatedly assaults it. Hero death advances the AI's run, while every successful breach ends the run.

Core systems:
- Grid dungeon construction with walls and defensive units.
- BFS pathfinding through the constructed dungeon.
- Goblins, zombies, orcs and wraiths as melee defenders; ballistae and an
  arcane cannon as ranged defenders. Orc/arcane/wraith unlock at hero
  levels 8/15/22 respectively (`types[id].unlock`), surfaced automatically
  in the build palette and announced via a combat-log line the moment the
  threshold is crossed.
- Hero stats that increase with dungeon level, plus named companions
  joining every 10 levels (`COMPANION_JOIN`) and periodic side-quest power
  spikes every 5 levels (`questEvent()`).
- Persistent dungeon upgrades.
- Repeated invasions and escalating dialogue — a `DIALOGUE` table of level
  tiers × event type (start/death/breach/won), several lines per tier,
  randomly picked so repeat playthroughs don't see identical text.
- Level 100 ending where the hero gives up rather than simply dying.
- Browser-only implementation with localStorage persistence.

Planned expansion:
- Rooms, doors, traps and specialized structures.
- Actual projectiles and richer unit AI.
- Counter-builds and party tactics (right now defender variety exists but
  there's no reason a given hero build should be weak to any particular
  defender type — worth a real rock-paper-scissors pass).
- More narrative events tied to *specific* build choices, not just level.
- Balancing pass: verify gold income vs. new unlock costs, and whether
  melee vs. ranged defenders both stay worth building as the hero
  out-scales them.
- Better save management (e.g. save slots, export/import).
