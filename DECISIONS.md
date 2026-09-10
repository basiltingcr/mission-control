# mission-control (fork) — DECISIONS

Append-only. Workspace-level decisions live in ~/Desktop/Projects/workspace/DECISIONS.md
(D-008 adopt mission-control, D-009 `path` field, D-010 proposals, D-012 artifact as view).

## MC-001 — A configured-but-unusable project path aborts the task (2026-09-10)
Status: active.
Change: `resolveProjectCwd()` throws when Project.path is set but not absolute, contains `..`,
does not exist, or is not a directory. No path → workspace root, as before.
Why: falling back would have an agent silently do work in the wrong repository and report
success. A task that does not run, logged as an error, is the cheaper failure.
Carve-out: the abort leaves no trace on the board. Revisit once a real task hits it.

## MC-002 — Pass USER/LOGNAME/TMPDIR to spawned agents on non-Windows (2026-09-10)
Status: active.
Change: `buildSafeEnv()` forwards those three vars unless on win32.
Why: on macOS, Claude Code's OAuth credential lives in the login Keychain and the lookup fails
with "Not logged in" when the child has none of them. Repro: `env -i PATH=$PATH HOME=$HOME
claude -p …` fails; adding the three vars succeeds. Not bisected to a single var — all three
are non-secret, so over-passing costs nothing. Candidate upstream PR.

## MC-003 — Path validation regex is platform-independent; existence check is not (2026-09-10)
Status: active.
Change: the Zod rule accepts POSIX, Windows-drive and UNC absolute forms; `resolveProjectCwd`
uses `path.isAbsolute` + `statSync` on the machine the daemon runs on.
Why: validation runs in the Next server, the existence check in the daemon; on someone else's
install those need not be the same OS.
