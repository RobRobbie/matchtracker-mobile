# MatchTracker 2027.027 — Test Build

## Changes
- Bench selection stage now has a distinct green-tinted stage banner reading "STARTING XI COMPLETE · SELECT YOUR BENCH".
- Continue button is assigned a stable ID so its count refreshes after every bench selection/removal. It displays the actual total selected: starters + bench out of 17.
- Selected players remain interactive in the team editor. Tapping a selected starter removes them and returns to Starting XI selection; tapping a selected bench player removes them from the bench.
- Selected player tags indicate they can be tapped to remove.
- Existing player data, borrowed-player handling, availability filtering, and match services retained.

## Test
1. Confirm Home shows 2027.027.
2. Select 11 starters; confirm green bench-stage banner appears.
3. Select six bench players; Continue button must show 17/17.
4. Tap a selected bench player; count should reduce to 16/17 and player becomes selectable again.
5. Tap Edit Starting XI; remove one starter and select a replacement. Confirm bench players remain selected.
6. Continue to Match and verify saved team.

## Checks
- JavaScript syntax checks and ZIP integrity check are run during packaging.
- iPhone Safari testing is still required.
