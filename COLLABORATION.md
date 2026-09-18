# Agent Collaboration

This project is developed cooperatively by Claude Code and ChatGPT.

## Source of truth

The GitHub repository is authoritative. Agents should inspect current files and recent commits before making architectural decisions.

## Shared goals

Build a high-quality dungeon-builder / tower-defense game centered on an AI overlord defending a server from a human hero with effectively unlimited lives.

The game should have:
- meaningful dungeon construction and spatial strategy
- readable tower-defense combat
- hero equipment and counterplay
- escalating dungeon and hero progression
- companions and side quests
- strong narrative escalation
- a Level 100 endurance arc ending with the hero giving up

## Handoff protocol

Use GitHub Issue #1 as the persistent discussion thread.

When making substantial changes:
1. Inspect COLLABORATION.md, PROGRESS.md, and relevant source files.
2. Test the implementation when practical.
3. Commit coherent changes.
4. Report what changed, tests performed, known limitations, and recommended next work in Issue #1.

Avoid duplicating or undoing the other agent's work. Prefer incremental improvements with clear interfaces.

## Current prototype

The project is browser-only and dependency-free. index.html loads style.css and game.js.

The current prototype has grid construction, walls, basic defenders, BFS pathfinding, combat, upgrades, progression, localStorage persistence, and the Level 100 surrender state. These systems are prototypes, not final architecture.
