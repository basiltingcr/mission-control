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

## MC-004 — Proposals keep upstream's two-state status; `resolution` records the how (2026-09-11)
Status: active. Refines workspace D-010, which said "status widened to open | accepted |
edited | rejected | expired".
Change: `status` stays `pending | answered`. New nullable fields on DecisionItem:
`recommendedOption` (must be one of options), `door` (one_way | two_way), `evidence`,
`expiresAt`, `onExpiry` (apply_recommendation | reject), and `resolution`
(accepted | edited | rejected | expired). `deriveResolution()` in src/lib/proposal.ts is the
one tested place the accept/edit rule lives; the PUT route calls it.
Why: 22 sites key on the literal strings "pending"/"answered", including the daemon's
`hasPendingDecision` and the untyped loop-detection writer in run-task.ts where tsc cannot
catch a missed rename. `pending` ≡ D-010's `open`; the four widened states are `answered` plus
a resolution. Same capability, a fraction of the surface.
Carve-outs: cross-field rules are enforced on create only, not on partial updates; the expiry
sweep (what makes two-way doors auto-fire) is Phase 4 — until then expiresAt is display-only.
Loop-detection default (Basil's call): recommend "Skip this task and continue mission",
two_way, evidence = last error, no expiry.
