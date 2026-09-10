# Handoff — Project.path and macOS Keychain auth

Session: 2026-09-10 (Cowork, cloud; tests and commits run by Basil in Terminal). Thread: Phase 3(a).

## What shipped
- 11d6649 Project.path: type, Zod schemas, resolveProjectCwd, wired into run-task.ts and
  dispatcher.dispatchTask, API passthrough (projects + ventures routes), fixtures. 19 tests.
- ea0ab45 "Working directory" field in create/edit venture dialogs; four callers widened.
- 16cd2ed buildSafeEnv passes USER/LOGNAME/TMPDIR on non-Windows. 1 test.
- STATE.md, DECISIONS.md (MC-001..003), this handoff.

## Verified, with the artifact
- tsc: 7 errors from the new test before implementation, 0 after
- vitest: 19/19 on project-path.test.ts; full suite 212 → 213 after the Keychain test
- Keychain test failed first (`expected undefined to be 'testuser'`), passed after the fix
- Browser: path saved to data/projects.json line 12; relative path → toast, stored value intact
- daemon.log: `Task task_TYLCLlIURo8Y will run in /Users/basil/Desktop/Wild Pearl`, first run
  failed "Not logged in", second run after the fix `status=completed`; agent's report shows
  `pwd` = /Users/basil/Desktop/Wild Pearl

## NOT verified
- pnpm lint (eslint could not resolve plugins from the Cowork VM; Basil did not paste a run)
- The abort path in resolveProjectCwd on a live task (only unit-tested)
- dispatcher.dispatchTask's cwd (only run-task.ts exercised; dispatchTask is the daemon's
  direct-poll path, which was not running)
- Which of USER/LOGNAME/TMPDIR the Keychain lookup needs

## Lessons
- I claimed the commit gate would run on Basil's Terminal commit; it fires only on Claude Code
  tool calls, which the session had already established. Held the wrong fact for one message.
- "He has been using Claude Code today, so he is logged in" was an assumption presented as a
  check. The error message was the evidence; the assumption delayed the diagnosis one round.
- grep for `: Project = {` missed two typed literals (seed-demo route, data.test.ts) that tsc
  caught. tsc is the authority for "what constructs this type", not grep.

## Next
- Decision schema → proposals (workspace D-010), tests-first
- Optional: upstream PR for 16cd2ed
