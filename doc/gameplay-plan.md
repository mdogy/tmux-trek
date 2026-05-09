# TMUX Trek Gameplay Plan

## Goal

TMUX Trek should teach tmux by making each command the only sensible way to solve a story problem. The player should not feel like they are stopping the game to do a tutorial. The command should be the action.

## Design Rule

Every tmux command introduced in the game must answer three questions:

- What place, threat, or resource in the story makes this command necessary?
- What does the player gain by using the command correctly?
- Why would a less capable workflow fail inside the fiction?

If those questions are not answered, the mechanic is not ready for implementation.

## Revised Narrative Frame

The CLULIX has not crashed yet. The game opens on the ship's bridge during a systems anomaly. HELIX reports that the planet below, Z-shell, can only be reached safely through a Zshellian Rift protocol. In tmux terms, the surface is session `0`.

The captain is told explicitly:

> "The planet is not reachable by shuttle. The Zshellians travel by persistent Rifts. Open one with `tmux` and you will descend into surface session `0`."

This makes the first session command a world transition, not a classroom prompt.

## Revised Act 1 Story

### Bridge Opening

- Start on the CLULIX bridge.
- The player can move around the bridge and inspect systems.
- A transmission from the surface invites the captain to visit Z-shell.
- HELIX explains that the planet is represented by session `0`.
- The captain uses `tmux` to create the surface Rift and descend to the planet.

### Session 0: Surface Arrival

- The captain arrives on the planet inside session `0`.
- Zrix greets the captain and warns that an **overflow buffer** is advancing across the surface.
- The captain cannot delete it yet because they do not have the correct weapon.
- Zrix explains that the Zshellians use different named Rifts as access points to different facilities.

### Armory Rift

- Zrix directs the player to create `tmux new -s armory`.
- This is not "practice naming a session." It is the only way to reach the armory.
- Inside the `armory` session, the captain meets the armorer and receives an energy weapon capable of deleting the overflow buffer.
- The armory should visually and narratively reinforce the lesson: named sessions are destinations you can return to intentionally.

### Detach as Return to the Ship

- The captain cannot carry out the planet-side deletion while still stationed in the armory.
- `Ctrl+b d` becomes the action of stepping out of the armory Rift and returning to the CLULIX.
- The fiction should make clear that the armory continues to exist even after the captain leaves it.

### Finding the Right Rift Again

- Back on the ship, the captain now needs to return to the surface, not the armory.
- `tmux ls` becomes the ship's Rift manifest.
- The player sees at least:
  - `0` for the planet surface
  - `armory` for the weapon room
- `tmux attach -t 0` becomes the deliberate action of going back down to the planet with the weapon.

### Delete the Overflow Buffer

- Re-entering session `0` returns the captain to the surface problem.
- The captain uses the acquired weapon to delete the overflow buffer and secure the landing zone.
- This closes the opening loop:
  - `tmux` to travel to session `0`
  - `tmux new -s armory` to reach a new place with a needed item
  - `Ctrl+b d` to leave without destroying the destination
  - `tmux ls` to inspect available places
  - `tmux attach -t 0` to return to the correct place and finish the job

## Why This Works Better

- `tmux` is now travel.
- `tmux new -s armory` is now access to a needed resource.
- `detach` is now returning to the ship while preserving the place you left.
- `ls` is now orientation across known destinations.
- `attach` is now intentional return to the correct location with the correct equipment.

The player learns the command because the story withholds progress until that command is used correctly.

## Command-to-Narrative Mapping

### Sessions

- `tmux`: open a Rift to the currently available default destination, first used to descend to session `0`
- `tmux new -s name`: create a named destination such as `armory`, `medbay`, or `reactor`
- `Ctrl+b d`: step out of the current Rift and return to the ship without collapsing it
- `tmux ls`: inspect the active Rift manifest to see what places exist
- `tmux attach -t name`: return to a specific destination with intent
- `tmux kill-session -t name`: collapse a corrupted or hostile place that must no longer exist

### Windows

Windows should represent multiple active views or tasks inside one place.

- `Ctrl+b c`: open a new view inside the same location, such as sensors, comms, or tactical feed
- `Ctrl+b n/p`: move between views while staying in the same Rift
- `Ctrl+b 0-9`: jump instantly to a specific ship system or camera feed
- `Ctrl+b w`: inspect available views when time pressure matters
- `Ctrl+b ,`: rename a view so it reflects what the player is monitoring
- `Ctrl+b &`: close a bad or noisy view without abandoning the whole place

### Panes

Panes should represent simultaneous operations inside one active view.

- `Ctrl+b %` and `Ctrl+b "`: divide attention between two live tasks
- navigation keys: move the captain's operational focus between parallel subtasks
- `Ctrl+b z`: magnify one urgent subtask without destroying the others
- `Ctrl+b x`: terminate one bad sub-process while preserving the rest

### Copy Mode

Copy mode should exist because the player must retrieve or move information between places.

- scrollback navigation: inspect archived logs, old transmissions, and historical traces
- selection/copy/paste: move codes, commands, and evidence between locations and systems

## Implementation Guidance

- The current prototype is not yet aligned with this narrative frame.
- Do not add more commands until the opening loop has a coherent story reason for each one.
- Prefer destinations, resources, hazards, and system dependencies over abstract "use this command now" lesson text.

## Near-Term Planned Features

- Start on the bridge instead of the planet surface
- Replace overworld navigation with vim `h/j/k/l`
- Add fog of war so unexplored territory feels unknown
- Generate real art to replace placeholder geometry
- Build the overflow buffer and armory loop before expanding into later acts
