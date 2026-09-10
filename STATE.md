# mission-control (fork) — STATE

Updated 2026-09-10. Live state only; reasoning lives in DECISIONS.md, session detail in handoffs/.
Upstream: MeisnerDan/mission-control. This fork is Basil's cross-project cockpit (workspace D-008).

## Focus
Phase 3: make the cockpit run agents in each project's own directory, then extend decisions
into proposals (workspace D-010).

## Threads
| Thread | Status | Next |
|---|---|---|
| Project.path — agents run in the project's folder | done 2026-09-10 (3 commits, 11d6649..16cd2ed) | — |
| macOS Keychain auth for spawned agents | fixed 2026-09-10 (16cd2ed) | offer upstream as a PR |
| Decision schema → proposals (recommended default, door, evidence, expiry) | next | tests-first on `decisionCreateSchema`; see workspace D-010 |
| Own STATE/DECISIONS/handoffs in this repo | done 2026-09-10 | — |

## Verified end to end (2026-09-10)
- Venture "Wild Pearl" with path /Users/basil/Desktop/Wild Pearl, set from the dialog
- Relative path rejected server-side; stored path untouched
- Task on that venture, assigned to Researcher, run from the card: daemon log shows
  `will run in /Users/basil/Desktop/Wild Pearl`; agent's report shows the same `pwd`
- Suite 213/213, `pnpm tsc --noEmit` clean

## Layout (do not flatten)
Repo root = agent workspace (CLAUDE.md, commands/, skills/, .claude/commands/). The Next.js app
is at mission-control/ inside it; run pnpm commands there. WORKSPACE_ROOT in the daemon is the
repo root, and a project with no path runs its agents there.

## Known limits
- A task whose project path is set but unusable exits with only a daemon.log line — no board
  trace, no decision item (same as upstream's blocked/already-running exits)
- Relative path → 400, but the UI toast is the generic "Failed to update project"
- src/app/api/ventures/route.ts is upstream's copy of projects/route.ts; both edited in step
- validatePathWithinWorkspace() in security.ts is exported and tested but called by nothing
- data/*.json are gitignored: ventures, tasks and decisions live only on this machine

## Divergence from upstream
- Project.path + resolveProjectCwd (11d6649), dialog field (ea0ab45), Keychain env (16cd2ed)
- STATE.md, DECISIONS.md, handoffs/ at repo root — upstream has none
