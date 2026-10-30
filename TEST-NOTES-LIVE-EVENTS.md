Football ONE / MatchTracker test build — Live Events iteration

Changes in this test:
- Reorganised live event entry around four prominent quick actions: Goal For, Goal Against, Our Sub, Opposition Sub.
- Moved less-frequent events into an expandable More Events section: shots, cards for both teams, corner, free kick, offside and penalty.
- Retained the existing navy / green / light grey visual identity and existing event handlers/data model.
- Bumped service-worker cache to v7 to help ensure updated files load.

Validation:
- JavaScript syntax checked with Node.js for all JavaScript files.
- ZIP integrity checked after packaging.
- This is a functional test build, not a full browser/device QA pass. Please test event recording, score/stat updates, substitutions, undo and refresh persistence before relying on match data.
