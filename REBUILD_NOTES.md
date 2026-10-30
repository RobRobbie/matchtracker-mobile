# MatchTracker rebuild pass — 29 October 2026 (test build 2)

This is a separate test build based on the supplied `matchtracker-new-season` branch ZIP. It does not change GitHub or overwrite the user's existing September build/checkpoint.

## Decisions applied from the original design notes and 29 October testing

- Pre Season remains the first workflow to stabilise. Open Season is intentionally not developed in this pass.
- Match format is 11-a-side only; 7-a-side and 9-a-side options have been removed from match setup.
- The master squad may contain more than 17 players. A matchday squad is capped at 17, with a live `X/17 players selected` counter and a hard guard against selecting an 18th player. Existing saved selections over 17 are trimmed to the first 17 when opening match squad selection.
- The Starting XI requires exactly 11 players. The saved pitch placement remains available for this test build.
- After the Starting XI is saved, the remaining matchday-squad players are automatically assigned to the bench (maximum six). There is no separate manual bench-selection step.
- The match-details button is labelled `Prepare Match` to distinguish navigation from kick-off. The screen after Starting XI is called `Ready to Play`. Navigating to it does not start the match or clock. The clock, player-minute tracking, event timeline and live status start only when the coach presses `START MATCH` on that screen.
- Goals, cards and shots use a selectable player list rather than asking the coach to type a name. Goal scoring selects the scorer and then an optional assist. The player list is restricted to players currently on the pitch.
- Substitutions use pickers for the player coming off and the unused substitute coming on.
- Existing Home, Squad and Opponents areas have been left alone as far as possible. Open Season remains parked.
- Match summary/review UI remains in the Pre Season completed-fixture list; completed match records include score, events, player/team stats, timeline and report metadata.

## Checks performed in this pass

- `node --check` run against every JavaScript file under `src/` and `app-mobile.js`.
- ZIP archive integrity checked after packaging.
- Static code inspection confirms match squad selection caps saved and newly selected players at 17; Starting XI save requires exactly 11; the bench is explicitly saved as the remaining selected players (up to six); and the match-details action is labelled `Prepare Match`, separate from kick-off on `Ready to Play`.
- Service worker cache version incremented to reduce the chance of the browser continuing to use stale JavaScript files.

## Important test limitation

This build has not been verified in a real browser or on an iPhone from this environment. Please test with sample data before using it for a real match. In particular, test the full match lifecycle, goals/assists, substitutions, undo, Full Time, Review Match Summary, and confirm season totals are not double-counted. Open Season is intentionally left for later. No GitHub push has been made.


## Test build update — 29 October 2026
- Starting XI now opens directly into the Live Match screen in a NOT STARTED state.
- Start Match is on the Live Match screen; the clock and event buttons remain inactive until kick-off.
- Redesigned score/header hierarchy and larger, more clearly labelled match-action buttons.
- Added match-specific opposition jersey-number entry, opposition card recording, and opposition substitution recording.
- Test storage is namespaced separately from original MatchTracker storage. On first launch, the test build copies the master squad/opponent lists where available, then clears only test match history and test season totals. It does not remove or overwrite original storage keys.
