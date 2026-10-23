> DEV-078 update, 2026-10-23: owner-approved local source-aware Tailor is now implemented with existing-section placement and several-Apply correction handling. See [TAILOR-SOURCE-IMPLEMENTATION.md](TAILOR-SOURCE-IMPLEMENTATION.md) and [local source contract](../contracts/tailor-sources-v1.md). The following DEV-077 CV/ad-only candidate is retained as dated history. No external workflow or production support was enabled.

# Questions to tailoring — local candidate

2026-10-23. Scope: frontend product flow and compact guidance, no backend/contract changes. Managed worktree questions-to-tailoring from origin/main 1e7b1e51fc671b385d26e217e6581c7fffee1bfb. Other worktrees and unpublished source-proposal preparation are untouched.

## Confirmed missing link

Frontend runTailor sends only the existing eight fields: cvVersionId, cvTitle, targetRole, language, blocksSchemaVersion, blocks, jobContextSchemaVersion, jobContext. contracts/experience-discovery-v1.md is advisory and explicitly does not connect sources to Tailor. docs/backend/flows/flow-tailor.md prohibits new top-level fields and derived text. Sources must not be hidden in targetRole, jobContext, chat history or canonical blocks.

Read-only management GET of existing Tailor H8oAioy58R1v3PvRe3YUa on 2026-10-23: active=true, saved version f399ee97-764b-44e0-bc42-5c7517499890, updatedAt 2026-02-20T15:42:43.114Z. Validate + Normalize projects the old eight fields only; Build Tailor passes no source answers and forbids claims not already in the same CV block. Tailor Guard restricts new bullets and phrases against that block. Thus sending an additional field alone would not make answers usable. No webhook/execution, external model call or mutation was made. Saved definition inspected, live execution not tested.

The separate unpublished Rewrite source-proposal preparation on codex/discovery-draft-proposals is not a working Tailor integration and is deliberately excluded from this candidate.

## Working local behavior and deliberate limit

A compact Next step card appears in the editor only after a validated plan with questions. It counts outstanding questions using singular/plural, opens the existing questions, and preserves the direct toolbar Tailor path. Completed/declined/skipped topics do not count as unanswered; early Finish leaves unanswered topics available to review. Closing questions retains sources/revisions and offers Tailor my CV. Finish and tailor my CV is an explicit action that closes questions and starts current CV/ad tailoring; submitting the final answer never starts it.

Because answer transport is missing, the candidate explicitly says: “Tailoring currently uses only your CV and the job ad. Your answers stay here for review.” It does NOT say “Drafted can now use your answers”. The requested completion body using answers is intentionally deferred. The requested introductory help sentence is replaced by honest current-capability wording to avoid implying answers already improve the result. This is a partial implementation pending approved answer support, not completion of answer-aware tailoring.

Tailoring returns a detached suggestion with Current/Suggested text per changed block. Copy, export and canonical CV remain untouched until Apply tailored CV. Dismiss changes nothing. No new backend commit/version protocol is introduced. Existing response version is consumed only at explicit Apply. Current CV, raw ad, target role, language, file identity and session source revision are checked at response and Apply. Changed sources/metadata or context invalidate the candidate; structural/metadata changes are rejected. All three entry points share one synchronous in-flight lock. Negative/skipped/advisory sources never enter a Tailor request. Session source and revision behavior is reused without introducing individual fact confirmation.

## Required before answer-aware tailoring

This is a reviewable proposal, not an adopted contract or DD:

1. Approve a versioned, explicit Tailor request extension for source answers and current context identity, independent of blocks and chat history. Each source needs answerId, questionId/roundId, topic and job signal references, original source text, current revision and user-submitted provenance. Bind to current CV/ad context. Preserve original/revisions in session; transport only relevant current sources, not superseded text. Bounds must reject clearly without truncation.
2. Define usable statuses and exclusions. No, unknown, skipped, pending/failed/needs-detail answers and advisory model interpretations must not become positive experience. Mixed positive/negative accounts retain their exact scope; semantic selection must preserve qualifications. Corrections invalidate prior extraction, pending requests and dependent proposals. No individual fact confirmation.
3. Update the existing Tailor validation/projection, prompt builder, deterministic guard and response builder together. The existing block-only prohibitions cannot silently be relaxed: explicitly allow source-supported text while retaining IDs, block metadata, limits and unknown types. Do not infer employer, role, dates or achievements from requirements. No new blocks or invented factual metadata in this stage.
4. Require evidence references for proposed new claims: source ID + revision + exact supporting quote and affected block. Distinguish advisory suggested wording from user-submitted source. Validate reference/revision/context and quoted text at the backend, echo an actual source-use receipt; only then may the UI truthfully claim answers were used. Unsupported content fails closed. Merely citing a quote is not proof of semantic correctness; bounded isolated model-quality evaluation is still needed before release.
5. Keep detached review/explicit Apply, rejection on changed CV/ad/sources, shared single-flight lock and retry preservation. Test synthetic positive/negative/skipped/uncertain/mixed answers, correction races, source bounds, unknown/stale references, failure, and same-context CV-only fallback. Backend candidates and changed normative contracts require owner approval before implementation; external writes additionally need exact scoped approval and verified snapshots. No such changes made here.

## Local preview and validation

From this worktree in PowerShell:

    $env:PORT='8794'
    $env:DRAFTED_PREVIEW_SCENARIO='transition'
    node tools/serve-editor-preview.cjs

Open http://127.0.0.1:8794/?sample=1. This explicit scenario adds a deterministic Tailor response using only existing CV content. All endpoints are localhost, CSP blocks external network, unrelated actions return 503. The example does not simulate use of answers or claim real-model quality.

Commands: node --test tests/experience-discovery.test.cjs tests/discovery-transport.test.cjs tests/discovery-background.test.cjs tests/discovery-negative.test.cjs; node tests/questions-tailoring.browser.cjs; node tests/discovery-outcomes.browser.cjs. Browser tests require bundled Playwright/Edge as documented in the handoff. Build 2026-10-23-questions-to-tailoring. Verification outcomes appended below.


Validation outcome: all 42 existing session/transport/background/negative tests pass. Focused questions-tailoring browser suite passes plural/singular, early exit, completed/No/all-skipped, correction, manual finish (no auto-run), same-request deduplication, detached Current/Suggested review, unchanged CV on Dismiss, explicit Apply, invalidation on corrected answers/new ad, structural metadata rejection, request failure/retry, direct tailoring with unanswered questions, and mobile 390px. Existing discovery-outcomes browser suite passes. All browser traffic restricted to localhost, zero external model calls. Desktop/review/mobile screenshots inspected. Source/JS-bundle parity allowing build line-ending normalization, exact dist assets/latest markers, syntax and git diff --check pass. Generated CSS retains unrelated baseline bytes rather than normalizing existing mixed line endings.

Existing older editor-discovery.browser.cjs was attempted but times out at its legacy server-PDF download expectation, before discovery regression steps. Current main exports through browser print; this old expectation does not validate the current export path. Reported as a test compatibility limitation, not a pass, and not repaired in this scoped task. Dedicated discovery/outcome/transition suites above pass. No live model semantics or use of answers in Tailor is claimed.

Preview running at http://127.0.0.1:8794/?sample=1, deterministic transition scenario. No commit, push, PR, merge, publishing, n8n changes, normative contract edit, DD record or external model execution. Owner approval of explicit source-aware Tailor contract/backend proposal is required before that dependent implementation.
