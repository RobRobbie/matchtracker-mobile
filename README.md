# matchtracker-mobile

## New test build — 29 October 2026
This is an isolated test copy. On first launch it clears only this test build's match history and season totals, while copying the existing master squad/opponent list into test-only storage when available. The original app's storage keys are not removed or overwritten.

### What to test
1. Open a Pre Season fixture and enter the team selection flow.
2. Select up to 17 matchday players and save the Starting XI.
3. Confirm it opens directly to Live Match and shows NOT STARTED with 00:00.
4. Add opposition jersey numbers in Opposition Players.
5. Confirm event buttons are disabled before kick-off. Press START MATCH and verify the clock starts.
6. Test goals, opposition cards, both substitution controls, timeline, undo, half time/second half and full time.
