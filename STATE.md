# mission-control (fork) — STATE

Updated 2026-09-11. Live state only; reasoning lives in DECISIONS.md, session detail in handoffs/.
Upstream: MeisnerDan/mission-control. This fork is Basil's cross-project cockpit (workspace D-008).

## Focus
Phase 3 done. Phase 4 per workspace D-013 (2026-09-11): this app stays on the Mac as the cockpit with
local execution OFF — unattended coding runs in Anthropic-hosted routines; Run fires a routine (4.4);
the daemon's only jobs become the expiry sweep (4.5) and, later, nothing that spawns `claude` here.
First step is 4.0 lock-down: clear the Wild Pearl venture path, polling off, allowedTools trimmed.
Order and checks: workspace STATE.md.

## Threads
| Thread | Status | Next |
|---|---|---|
| Project.path — agents run in the project's folder | done 2026-09-10 (3 commits, 11d6649..16cd2ed) | — |
| macOS Keychain auth for spawned agents | fixed 2026-09-10 (16cd2ed) | offer upstream as a PR |
| Decision schema → proposals (recommended default, door, evidence, expiry) | built and verified 2026-09-11; committed 2026-09-11 (was uncommitted in the working tree until the close-out) | expiry sweep — Phase 4.5 |
| Own STATE/DECISIONS/handoffs in this repo | done 2026-09-10 | — |

## Verified end to end (2026-09-10)
- Venture "Wild Pearl" with path /Users/basil/Desktop/Wild Pearl, set from the dialog
- Relative path rejected server-side; stored path untouched
- Task on that venture, assigned to Researcher, run from the card: daemon log shows
  `will run in /Users/basil/Desktop/Wild Pearl`; agent's report shows the same `pwd`
- Suite 213/213, `pnpm tsc --noEmit` clean
- (2026-09-11) Three proposals POSTed via curl, resolved from the Decisions page: accepted,
  edited, rejected each present in data/decisions.json; suite 233/233, `pnpm check` clean
  apart from upstream's 7 unused-var warnings

## Layout (do not flatten)
Repo root = agent workspace (CLAUDE.md, commands/, skills/, .claude/commands/). The Next.js app
is at mission-control/ inside it; run pnpm commands there. WORKSPACE_ROOT in the daemon is the
repo root, and a project with no path runs its agents there.

## Known limits
- Next moves to :3001 if :3000 is taken at start-up (seen 2026-09-11; the occupant had exited
  by the time lsof ran, so it is unidentified — not the Ops Desk, which uses 5477/4477). The
  daemon hard-codes http://localhost:3000 in dispatcher.ts (:20 field-ops execute, :518 vault
  session) — if the app is on another port those calls miss. Dormant: autoExecute false.
  Fix if it ever matters: one MC_BASE_URL env-derived constant for both call sites.
- expiresAt / onExpiry are stored and displayed, not enforced — no sweep exists yet
- Proposal UI is untested (React, suite is node-env); verified by hand only
- A task whose project path is set but unusable exits with only a daemon.log line — no board
  trace, no decision item (same as upstream's blocked/already-running exits)
- Relative path → 400, but the UI toast is the generic "Failed to update project"
- src/app/api/ventures/route.ts is upstream's copy of projects/route.ts; both edited in step
- validatePathWithinWorkspace() in security.ts is exported and tested but called by nothing
- data/*.json are TRACKED from upstream's zip, not ignored (tasks, projects, decisions, inbox,
  activity-log, brain-dump). Marked skip-worktree 2026-09-11 so local changes never stage; never
  `git add -A` or `commit -a` in this repo. Six commits to date verified clean of data/

## Divergence from upstream
- Project.path + resolveProjectCwd (11d6649), dialog field (ea0ab45), Keychain env (16cd2ed)
- Proposal fields on DecisionItem + deriveResolution + ProposalMeta UI (MC-004)
- STATE.md, DECISIONS.md, handoffs/ at repo root — upstream has none
