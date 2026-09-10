# Handoff — Decisions become proposals

Session: 2026-09-10/11 (Cowork, cloud; tests, curl and commits run by Basil). Thread: Phase 3(b).

## What shipped
- Schema commit: DecisionItem proposal fields, Zod enums + cross-field refinements,
  deriveResolution(), POST/PUT/GET route changes, loop-detection writer sets Skip/two_way,
  fixtures. 20 tests in __tests__/proposal.test.ts.
- UI commit: ProposalMeta (door, expiry, evidence), recommended option filled + "· recommended",
  Reject action, resolution shown in the Answered list, activity summary fix.
- MC-004 in DECISIONS.md; STATE.md updated.

## Verified, with the artifact
- tsc: 11 errors from the new test before implementation, 0 after; two constructor sites
  (integration fixture, seed-demo route) found by tsc, not by grep — same lesson as 3(a)
- vitest: 20/20; full suite 233/233; pnpm check clean bar upstream's 7 warnings
- Browser on :3001: three curl-POSTed proposals rendered with badges and filled default;
  Skip → accepted, Retry → edited, Reject → rejected, all present in data/decisions.json

## NOT verified
- The pre-launch DecisionDialog (task-card path) — only the Decisions page was exercised
- The loop-detection proposal from run-task.ts on a real three-failure task
- Activity page text for the reject case (asked, not confirmed)
- Any of the UI by test — the suite is node-env, no DOM

## Lessons
- I hard-coded :3000 from upstream's constant and hid the HTTP status behind a grep, so three
  failed POSTs printed nothing. Show the status code; never pipe a verification through a
  filter that turns "failed" into silence.
- Miscounted my own tests (said 21, wrote 20). Count with grep, not by recollection.

## Next
- Phase 4: expiry sweep (daemon job: flip to expired, apply or reject per onExpiry), then the
  morning digest and research routines
- Optional upstream PRs: Keychain env (16cd2ed); the :3000 hard-code
