# TODO

This file is a roadmap snapshot. GitHub Issues are the canonical planning surface.

## Current State

- The repository is initialized, documented, tested, and deployed through GitHub Actions and GitHub Pages.
- The current vertical slice is feature-incomplete but playable.
- The world is tile-based, keyboard-driven, collision-aware, and covered by browser acceptance tests.
- The current implemented lesson arc reaches from spawn near the CLULIX beacon through Zrix and into Vrex's interaction flow.

## Open Roadmap Issues

- [#1 automate Nano Banana asset generation and download pipeline](https://github.com/mdogy/tmux-trek/issues/1)
- [#2 start on the CLULIX bridge and descend to session 0](https://github.com/mdogy/tmux-trek/issues/2)
- [#3 change world navigation from WASD to vim hjkl](https://github.com/mdogy/tmux-trek/issues/3)
- [#4 add overflow buffer, armory session, and delete loop](https://github.com/mdogy/tmux-trek/issues/4)
- [#5 add fog of war to exploration](https://github.com/mdogy/tmux-trek/issues/5)
- [#6 generate initial artwork with Google Gemini / Nano Banana](https://github.com/mdogy/tmux-trek/issues/6)

## Requested But Not Yet Implemented

- The captain should begin on the CLULIX bridge rather than already on the planet.
- The planet surface should be represented as session `0`.
- Creating a Rift with `tmux` should take the captain down to the planet.
- Zrix should introduce the overflow buffer as an urgent threat.
- The player should create `tmux new -s armory` to visit the armory and receive an energy weapon.
- Detaching should return the player to the ship.
- The player should use `tmux ls` and `tmux attach -t 0` to return to the planet and delete the overflow buffer.
- World navigation should migrate from WASD to vim `h/j/k/l`.
- Fog of war should limit visibility and improve exploration readability.
- Generated art should progressively replace placeholder visuals.

## Maintenance Notes

- Do not close roadmap issues until the implementation, tests, and docs are actually complete.
- Keep browser acceptance tests keyboard-only and DOM-driven by default.
- Prefer updating GitHub Issues first, then refresh this file as a summary snapshot.
