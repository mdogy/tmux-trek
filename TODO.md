# TODO

This file is a roadmap snapshot. GitHub Issues are the canonical planning surface.

Primary planning documents:

- [Gameplay plan](/Users/michael/Documents/dev/tmux-trek/doc/gameplay-plan.md)
- [Delivery workflow](/Users/michael/Documents/dev/tmux-trek/doc/delivery-workflow.md)
- [Software engineering guide](/Users/michael/Documents/dev/tmux-trek/doc/software-engineering-practices.md)

## Current State

- The repository is initialized, documented, tested, and deployed through GitHub Actions and GitHub Pages.
- The current vertical slice is feature-incomplete but playable.
- The world is tile-based, keyboard-driven, collision-aware, and covered by browser acceptance tests.
- The current implemented lesson arc runs through session basics, Act 2's Redshirt window rescue, and Act 3's Commander Sock pane scanner.
- The GitHub Pages test build deploys from `main` after pull-request CI passes and the PR is merged.

## Open Roadmap Issues

- [#1 automate Nano Banana asset generation and download pipeline](https://github.com/mdogy/tmux-trek/issues/1)
- [#2 start on the CLULIX bridge and descend to session 0](https://github.com/mdogy/tmux-trek/issues/2)
- [#3 change world navigation from WASD to vim hjkl](https://github.com/mdogy/tmux-trek/issues/3)
- [#4 add overflow buffer, armory session, and delete loop](https://github.com/mdogy/tmux-trek/issues/4)
- [#5 add fog of war to exploration](https://github.com/mdogy/tmux-trek/issues/5)
- [#6 generate initial artwork with Google Gemini / Nano Banana](https://github.com/mdogy/tmux-trek/issues/6)
- [#7 add Redshirt, Commander Sock, and Vrex companion arc](https://github.com/mdogy/tmux-trek/issues/7)

## Requested But Not Yet Implemented

- The captain should begin on the CLULIX bridge and use `tmux` to descend to surface session `0`.
- Zrix should introduce the overflow buffer as a threat that cannot be solved without leaving for another Rift.
- `tmux new -s armory` should be the only way to reach the armory and obtain an energy weapon.
- `Ctrl+b d` should return the captain to the ship while leaving the armory Rift intact.
- `tmux ls` should act as the ship's manifest of reachable destinations.
- `tmux attach -t 0` should send the captain back to the planet to delete the overflow buffer.
- World navigation should migrate from WASD to vim `h/j/k/l`.
- Fog of war should limit visibility and improve exploration readability.
- Generated art should progressively replace placeholder visuals.
- Expand Act 2's implemented Redshirt window rescue into a larger multi-Rift mission.
- Expand Act 3's implemented Commander Sock pane scanner into a fog-of-war mission.
- Before the scanner is acquired, the party should suffer from limited visibility so the upgrade feels meaningful.
- Once acquired, Sock's scanner should reveal threats through fog of war and sense activity in other Rifts.
- Vrex should eventually be rescued and become guide and protector for the expedition party.
- Rift storms should become a recurring theme that throws party members into other Rifts and forces rescue-driven use of sessions, windows, and panes.
- Future level design should explicitly explore setting up panes so one operation can be performed while another situation is monitored in parallel.

## Maintenance Notes

- Do not close roadmap issues until the implementation, tests, and docs are actually complete.
- Keep browser acceptance tests keyboard-only and DOM-driven by default.
- Prefer updating GitHub Issues first, then refresh this file as a summary snapshot.
- Use the standard branch, pull request, CI, merge, and GitHub Pages deployment workflow for deployable changes.
