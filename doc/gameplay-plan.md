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

## Party Arc for Later Acts

The later acts should widen the story from a lone-captain tutorial into a party-based expedition where each companion changes what kinds of tmux problems make sense.

### Ensign Redshirt

- Redshirt should begin as the captain's eager but underprepared security escort.
- He follows the captain in future levels and helps establish the idea that the mission has human stakes beyond the player avatar.
- Early in Act 2, Redshirt is captured because he forgot his weapon.
- His capture should not be random. It should happen because the party failed to establish or reach the correct Rifted support location in time.
- Act 2 should therefore be structured around rescuing Redshirt by navigating through multiple Rifts, views, and operational contexts.

This gives later session and window commands a natural story frame:

- some places contain allies
- some places contain tools
- some places must be watched while the captain acts elsewhere

### Commander Sock

- In Act 3, the captain should travel with both Ensign Redshirt and Science Officer Commander Sock.
- By then, Redshirt has recovered and now carries a weapon, making him the party's security specialist.
- Commander Sock should not necessarily begin with the scanner already in hand.
- Acquiring Sock's scanner may itself be a mission.
- The party should meaningfully suffer from limited visibility before the scanner is obtained, so the scanner feels earned rather than decorative.
- Once acquired, the scanner should improve the party's survivability and open up richer level design in later acts.
- Sock's scanner should justify fog-of-war mechanics:
  - she can warn the captain about hidden threats before they are visible
  - she can detect anomalies in nearby obscured territory
  - at higher narrative stakes, she can even sense activity in other Rifts

This makes fog of war and cross-Rift awareness part of the fiction instead of a detached mechanics layer.

### Vrex

- At a later turning point, the party should rescue Vrex.
- Once rescued, Vrex becomes guide and protector for the expedition.
- Vrex should not merely give tutorial text. She should materially change the group's survivability, route confidence, and understanding of deeper Rift systems.

## Narrative Use of Later Commands

The party structure helps motivate later tmux concepts:

- sessions: reach different places where allies, tools, or threats reside
- windows: keep track of multiple rescue leads or systems inside the same mission space
- panes: monitor companions, threats, and instruments simultaneously during tense operations
- copy mode: recover codes, coordinates, and historical records needed to save allies

The rule remains the same: no command should appear unless the story first creates a reason the captain needs it.

## Rift Storm Theme

A recurring later-game theme should be **Rift storms**.

- Rift storms are unstable surges that tear party members away into other Rifts.
- They create rescue situations that force the captain to become fluent in navigating between sessions, windows, and panes under pressure.
- A storm should not just separate the party for drama. It should create a command-learning problem with clear operational consequences.

Possible design uses:

- a party member is thrown into another session and must be found and reattached to
- multiple windows represent different live rescue leads or ship systems affected by the storm
- pane layouts become necessary so the captain can perform one operation while watching another system, ally, or hazard in parallel
- storms can justify situations where the player must keep visual awareness in one pane while issuing recovery commands in another

The exact gameplay is not defined yet, but this theme should be developed intentionally in future planning rather than added ad hoc.

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

## Mid-Term Planned Story Beats

- Introduce Ensign Redshirt as the captain's companion
- Build Act 2 around Redshirt's capture and rescue across multiple Rifts
- Add Commander Sock as scanner specialist for fog-of-war and anomaly detection
- Rescue Vrex later so she becomes the party's guide and protector
- Develop Rift storms as a recurring cause of cross-Rift rescues and multi-pane coordination
