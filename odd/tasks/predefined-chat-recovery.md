# Feature: Recover the predefined chat after reload

Restore an unfinished conversation after reloading `/chat`, then verify the existing admin legal form and the closed momento 2 state locally. This prevents answers from being applied to a different server-side question.

## Scope and authority

- Authorized: local reload-recovery implementation and tests, followed by local legal-form and closed-state validation.
- Out of scope: Claude prompt changes, paid API calls or tokens, remote operations, production data, real credentials, payment-provider execution, push, PR creation, merge, and release.
- Start point: `develop` at `4c4ef02`. Feature branch `fix/predefined-chat-recovery` created before source edits.
- Preserve the existing untracked `.claude/` directory unchanged.
- RDD: off, clone-local; parent verified through native mode status. Use ordinary functional checks, not review consent or a fabricated approval.

## Problem and approach

`ChatWidget` resets to the initial greeting while the one-year session cookie still identifies an unfinished server conversation. The next POST therefore answers the wrong question. Restore the server-owned unfinished history and current question instead of creating a second persisted client-side conversation.

Preserve completed-demo rotation on ordinary `/chat` visits and the existing `?vista=sitio` reveal. Missing sessions must safely show the initial conversation. A conversation whose extraction failed must remain retryable without presenting a premature lead form.

## Execution and delivery

- TDD: **off**, explicitly inherited from `odd/tasks/chat-momento-2-bloques.md` and consistent with current ODD documents. Old SDD metadata does not enable TDD for this ODD continuation.
- Exact unit runner: `npm.cmd run test:unit -- --runInBand`.
- Route: delegated direct for both tasks. R1 requires multi-file implementation and preparation; R2 requires runtime execution and browser verification. No SDD artifacts or phase actors.
- Forecast: **180–320 authored changed lines**, excluding generated files and the out-of-scope Claude work. This is an advisory estimate, not a reason to omit tests or compress code.
- Delivery strategy: `ask-on-risk`; no chain strategy selected. If the forecast or running authored total exceeds about 400 lines, ask before the next commit.
- Each completed task closes with a Conventional Commit on the feature branch, with checks and documentation alongside its behavior. Never add AI attribution. Record exact commit IDs below; remote delivery remains unauthorized.
- Final authored count: 276 lines against branch point (193 source/tests + 83 documentation); cumulative work-unit/closure churn 292 lines, including documentation updates. RDD outcome: disabled/unmanaged. Native assessment unavailable because untracked candidate inventory was refused; high fallback independent verification completed with no candidate-caused blockers. Parent structural readback and diff check passed; independent verifier reran the three focused suites (26 tests) and diff check successfully. No RDD transaction started.

## Tasks and acceptance

- [x] **R1 — Restore unfinished chat state after reload.** Route: delegated; trigger: multi-file behavior and preparation reading.
  - Restore session identity, persisted history, current question, and relevant service suggestions coherently.
  - Preserve completed-demo rotation and `?vista=sitio` behavior; safely handle absent cookie or unknown session.
  - Keep extraction-failure recovery retryable without duplicating turns or exposing lead/reveal data prematurely.
  - Include focused regression tests and observed ordinary functional checks.
  - Browser acceptance: partial chat → reload → same active question → next answer advances correctly, at 390px and 1280px.
  - Implementation: server-side cookie lookup restores only unfinished predefined/demo sessions; serializable history, identity, service chips, and extraction retry initialize the widget. Real-mode recovery remains out of scope.
  - Automated evidence: focused recovery/page/API tests 3 suites / 26 tests passed; full unit suite 95 suites / 1396 tests passed; TypeScript passed; ESLint 0 errors / 22 existing warnings; production build passed after an approved retry to download Google Fonts (initial sandbox run failed to fetch Fredoka/Montserrat).
  - Browser acceptance passed on disposable localhost: at 390px, reload at question 3 restored history/current question and the next answer advanced; at 1280px, reload at question 4 restored service chips and subsequent answers completed the six-question flow and lead/reveal. The explicit `?vista=sitio` return preserved the reveal. An ordinary `/chat` visit after completion started a distinct new demo, whose question 2 also survived reload. Parent structural and independent verification accepted.
  - Commit: `c8b8531` (`fix(chat): recover unfinished predefined conversations`). Authored source/test lines: 193 (35 tracked additions/deletions + 158 new lines), documentation additional.
- [x] **R2 — Validate existing legal form and closed momento 2 locally.** Route: delegated; trigger: local runtime and browser verification.
  - Use disposable local Postgres data and synthetic local `ADMIN_SECRET`/`AUTH_SECRET` values; never inspect or reuse real secrets or authenticated remote sessions.
  - Legal form: reject incomplete pairs and invalid RUT; save a valid pair, verify persistence and footer, and verify clearing both fields removes the legal data.
  - With the same disposable chat session, confirm payment only through the local app/data flow, then verify `/chat/completar` is closed and rejects further saves.
  - Ensure email/notification integrations cannot use inherited remote credentials; no provider checkout or external API calls.
  - Check browser presentation at 390px and 1280px. Report unavailable environment or browser access as blocked/pending, not completed.
  - Browser evidence: synthetic admin login succeeded; incomplete legal pair and invalid RUT rejected; valid pair saved as `77.119.936-4`, survived reload, and appeared in the site footer; clearing both removed `legal` and restored the business-name footer. Legal layout inspected at actual 390px with no horizontal overflow and at 1280px.
  - Closed-state evidence: a disposable local ownership fixture change (no payment or notification call) made a stale momento 2 save return the closed screen. Reload confirmed the closed screen at actual 390px and 1280px; local DB readback proved services remained unchanged. This verifies the ownership-based closing contract, not the payment-provider flow.
  - Commit: `674d023` (`test(chat): record local legal and closed-state acceptance`). Authored source lines: 0; documentation only. Runtime acceptance and parent verification accepted.

## Verification

Run applicable focused regression tests first, then:

```powershell
npx.cmd tsc --noEmit
npx.cmd eslint src tests
npm.cmd run test:unit -- --runInBand
npm.cmd run build
```

Focused R1 command (passed):

```powershell
npm.cmd run test:unit -- --runInBand --runTestsByPath tests/unit/app/chat/recuperarChat.test.ts tests/unit/app/chat/page.test.ts tests/unit/app/api/chat.test.ts
```

Local browser checks require an explicitly local database, demo seed, and a local server. Record commands, viewport/scenario, observed results, and every failed, skipped, or pending check per task.

## Risk and rollback

The chat is the sales funnel: restoring the wrong session state could misassign answers or expose premature results. Pass only required serializable state and preserve existing session/reveal boundaries. Local validation must not inherit production database or external-service access.

R1 rollback boundary: remove only the new chat recovery behavior and its regression tests, restoring the prior initialization while retaining unrelated onboarding features. R2 rollback boundary: remove only disposable local fixture changes and this task's validation additions; do not revert prior legal-form or momento 2 functionality.

## Progress and next step

- 2026-10-17: R1 closed in `c8b8531` after automated/browser acceptance and parent independent verification. R2 closed in `674d023` after local runtime and parent verification. This final metadata-only update records both work-unit identities; its own identity is intentionally not recursively recorded. Existing untracked `.claude/` preserved.
- Runtime isolation: new Docker container `webbot-recovery-check-20261017`, database `webbot_recovery` bound only to `127.0.0.1:5437`; three migrations applied and demo seed run. Next served `localhost:3000` with synthetic `ADMIN_SECRET` and `AUTH_SECRET`, local database/app URLs, and explicitly empty external integration keys in the Node child environment. No `.env` contents read, no Claude/provider/payment calls, no production access. Dev font fetches failed and used fallback fonts; production build had passed with downloaded fonts, so local browser checks validate behavior/layout but not final font fidelity.
- Local DB readback: two separate sessions (completed original with six answers; new unfinished session with one answer), closed site ownership, no legal key after clear, unchanged services after rejected stale save.
- Cleanup: local Next process stopped, test browser tabs closed and temporary viewport reset. Disposable Docker container stopped, retained with its test data for reproducibility. Optional final cleanup: `docker rm -v webbot-recovery-check-20261017` removes only that disposable container/data. Do not touch pre-existing containers.
- Next: human chooses any remote delivery separately; no push, PR, merge, or release performed or authorized. Optional removal of the stopped disposable container remains local cleanup only.
- Recovery mirror: `odd/predefined-chat-recovery/tasks`; repository locator: `odd/tasks/predefined-chat-recovery.md`. Both copies must be read back and refreshed after each task.
