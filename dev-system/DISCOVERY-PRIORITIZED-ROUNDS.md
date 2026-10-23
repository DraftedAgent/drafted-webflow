> DEV-094: Owner approved remaining-count copy, backend activation and frontend publication. First batch shows prioritized count and a separate remaining count; completion uses Explore more questions (N), updated from unresolved reserve. 84 tests and rebuilt batch/source/error browser suites pass. Backend saved/active 8cd1ce3b-5745-45be-a1aa-040f05a72418 verified, only Build discovery prompt changed; encrypted snapshots verified, no external model execution. Frontend build2026-10-23-prioritized-question-rounds prepared for approved Pages publication. See prepared/discovery-prioritized.deployment.json.

# DEV-093 — Prioritized optional question batches (local, not published)

Owner explicitly requested implementation in this side conversation on 2026-10-23: 3–5 useful initial questions, optional further questions, no invented questions when exhausted. Existing prohibition on external model execution remains. New deployment approval is pending.

## Behavior

The validated question plan is ranked by existing ad priority weights (maximum referenced topPriority weight, mustHave weight3, original model order for ties). Up to five unresolved topics enter the first batch; fewer including zero are valid, never padded. Remaining topics are retained in a session reserve. Explore more questions releases up to five on explicit user action; no repeat plan request/model call, no new round identity. Twelve topics produce5/5/2. The button is absent when no unresolved reserve remains. This is continuation of the existing plan, not generation of fresh questions from later answers.

All asked questions/sources remain in the same round for Tailor, history and corrections across Apply. Interpret receives the existing reserve question IDs too, so a source-grounded answer may cover a later topic. Covered reserve topics are not offered; correcting their supporting answer reopens them. Original source IDs, revisions, negatives and scope are preserved. Reserved questions are not sent to Tailor until released. No Apply occurs automatically. Context changes invalidate the old question plan.

## Backend preparation

The prior anchors prompt retained wording/style rules but omitted the original leading compare/group/order instructions. The new prompt explicitly starts from CV evidence, avoids generic re-asking of described work, asks about relevant missing details, distinguishes internal from customer-facing work, prioritizes useful improvements, allows genuine zero and forbids padding. This addresses a prompt weakness; it does not prove why the unavailable previous zero response occurred.

Version-bound candidate: backend/n8n-discovery-prioritized-candidate.cjs, workflow zeIzzxPwD2Y91OyD, base saved/active720bf158-17f4-440d-9a29-a5a84fa3b3a3. Changes **only Build discovery prompt jsCode**. No model/settings/credentials/graph, validator, original quote compiler, response/request schema or single-owner format changes. Public Discovery1.0 and internal assignments1 stay unchanged. No new block/Tailor contract needed. Live definition was fetched read-only and rehearsed with synthetic provider: exact one-node diff and HTTP200 local graph result.

## Validation and boundaries

84 relevant unit/integration tests pass. New full-editor browser test verifies5/5/2, explicit continuation, one plan request, exhausted state, original answer and revision from batch1 reaching the Tailor proposal after later batches, no CV change before Apply, and no external traffic. Existing full source/Tailor test and error/retry test pass with the rebuilt assets, including multiple Apply/correction, no/skip, stale responses, uncertain earlier text and mobile. Completion screenshot reviewed; primary Finish and tailor my CV remains distinct from secondary Explore more questions and collapsed history.

Build2026-10-23-discovery-rounds-local. Local root/dist assets rebuilt; generated CSS line endings normalized. Local preview http://127.0.0.1:8800/?sample=1 uses synthetic12-topic data and prepared priority Code. Previous8799 uses the prior server scenario. No external model execution, workflow write/activation, Git push/merge or Pages/Webflow publication performed.

The first-batch maximum is enforced deterministically. Semantic completeness and repeat-run model stability are not proven by fixtures; a genuinely empty plan remains valid. Do not describe prompt-only changes as a guarantee against all zero results. Same-page continuation reuses the plan; fresh uploads/sessions can still produce different model assessments. The earlier supplied12-topic response demonstrated over-generic selection; the earlier zero response was unavailable. A bounded real-model quality evaluation requires separately approved scope under the no-external-model constraint.

## Approval requested

Publish the prepared frontend assets and activate the one-node backend prompt change together. Before external writes take verified lossless encrypted snapshots of saved/active definitions and exact candidate, recheck version/drift, save without auto-publication, then activate exact saved version and verify both saved/active projections. No external model run is included in this approval. Preserve the existing previous-version rollback process.
