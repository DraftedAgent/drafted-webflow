# Experience answers -> existing Rewrite -> reviewed CV proposal

**DEV-054 restoration verified, 2026-10-22:** After explicit owner rollback approval, the published/active version is restored to `fb91e3d1-44a6-4224-a5c5-9ba08b8d1ba4`, active status unchanged. The saved definition was also restored using `publishIfActive=false`, creating saved version `39d17aac-c638-48ac-b48f-5f51a99e34e4`. Both saved and published definitions have 13 nodes and match the verified pre-incident snapshot structurally (including full node parameters/credentials/positions, connections, groups, settings and applicable metadata). Zero canonical mismatches. A complete encrypted post-restore snapshot was decrypted and verified outside Git. No testlistener/relay was armed, test requests 0, initiated model calls 0, model cost $0. The unintended candidate is no longer published or the current saved definition. DEV-053's pending-restoration state below is historical. Tests and prompt 3 remain stopped; do not infer renewed test/delivery approval from the rollback.

**DEV-053 execution notice, 2026-10-22:** The owner approved the exact backend diff as an unpublished draft plus two bounded tests. Snapshot/version/diff checks passed, but the agent used public API PUT without `publishIfActive=false`; the API automatically published the candidate as saved/active version `27c6522c-052d-482c-8dec-aa9c7b862887`. This violated the no-publication scope. The agent stopped before arming any listener/relay or submitting any test/model request. Test requests 0/2, initiated model calls 0/2, model cost $0. The verified prior saved/active encrypted snapshots remain outside Git. Explicit rollback approval was requested because publication changes are otherwise forbidden. Restoration is pending; do not treat the old baseline/version assertion below as current live state. No further test or prompt 3 is authorized by this incident handling. The following document is the frozen pre-execution approval bundle; its backend diff/manifest has not been changed.

2026-10-22, DEV-052. **PREPARED ONLY, NOT APPROVED FOR EXTERNAL EXECUTION.** Prompt 3 / automatic tailoring is deferred. Local work preserves the earlier unpublished DEV-050/051 work. No normative contract or formal DD record is silently changed.

## What exists and what is missing

1. **Mock only:** deterministic wording in `/preview-api/rewrite`, the synthetic plan/interpret provider and their end-to-end quality examples. The former DEV-051 mock appended raw answers verbatim; this candidate permits source-linked professional wording. Local VM tests execute the exact prepared n8n Code-node code, but do not prove n8n routing/expression/provider runtime or real model fidelity.
2. **Already real editor functionality, verified locally:** existing pendingSuggestion -> fetchProposalFromSuggestion -> pendingProposal -> the existing proposal card -> explicit Apply/Dismiss. Detached review leaves canonical CV, right preview, clipboard and export unchanged. Sources/revisions/history and corrections use the existing discovery Session/Client/adapter, with no new question engine. Apply is the existing session-level CV update, not new server persistence or a newly minted CV version.
3. **Missing from current live Rewrite:** typed current source answers, explicit English routing, a receipt linking actual proposed wording to answer IDs/revisions/quotes, source-profile output validation and truthful failure propagation. Current generic CV success cannot carry that receipt. Current Rewrite detects language with one model then rewrites with another; it ignores explicit `language`. Normalize failures can currently become a successful no-op in Apply. Tailor's current input and same-block-only facts are unsuitable for new answer evidence; it is unchanged.
4. **Still unverified after local tests:** real model wording, scope/negation preservation, provider availability, n8n saved-draft/testlistener runtime and response expressions. Quote validation proves provenance, not semantic entailment. The live frontend action stays disabled until the separate integration test and later delivery approval.

## Exact local candidate data flow

Existing CV/ad -> existing background discovery -> recorded full raw answers/revisions -> explicit **Use these answers to improve your draft** -> existing Rewrite request with a versioned source profile -> detached candidate/usage receipt -> existing review card -> **Apply** or **Dismiss**.

- `Session.proposalSources()` supplies current source context; advisory `drafts`/`proposedText` are excluded. No/unknown/skipped/needs-detail/unanswered/covered/error remain distinct question states, never positive answer evidence.
- The static `instruction` now carries intent only. Added proposed request fields are `sourcesSchemaVersion: "1.0"` and `sourceContext: {contextRevision,roundId,jobContext,questions,answers,previousApplication?}`. Questions contain exact original `id,question,signalRefs,status`; answers contain `id,questionId,revision,text`.
- The existing discovery transport validator is reused for blocks/jobContext; candidate-specific exact keys, references, ID uniqueness, recorded-source counts, revision and size checks add to it. Existing full metadata is preserved, not stripped or coerced. No change to discovery 1.0, canonical block schema or ordinary Tailor contract.
- **First integration scope is deliberately narrow:** professionally worded additions to the first existing summary only. Existing CV sentences, all other blocks/IDs/order/metadata/title remain unchanged. No employer/date association is inferred. A CV without a summary fails safely; no new block is fabricated. This is not full-CV rewriting or automatic tailoring.
- A model update has exact shape `{updates:[{blockId,additions:[{text,answerId,answerRevision,sourceQuote}]}]}`. Every addition needs a current recorded answer and an exact nonempty quote in it. The backend composes the original summary plus these separate additions, deriving the receipt itself. Empty updates is a valid supported no-change result.
- The proposed CV response adds exactly `sourcesSchemaVersion,sourceContextRevision,sourceRoundId,sourceUsage`. Each usage has `{blockId,answerId,answerRevision,sourceQuote,proposedQuote}`. No untraced extra text may appear in the candidate. Source context/revisions, metadata, base CV identity and derived plain text must match exactly.
- The generic CV validator stays unchanged and still rejects extra fields. Only the gated local source-response profile removes the four known receipt keys, runs the generic validator, then checks the receipt and candidate against the frozen request. Ordinary Rewrite/Tailor do not accept this extension accidentally. This candidate extension needs explicit approval before any backend draft change; normative contract approval/delivery remains separate from this local implementation.
- Review shows Current CV, Proposed text, raw answer, the proposed wording from that answer and its supporting quote. A supplied but unused answer says **Not included in this suggestion**. Per-answer used/applied status is based on the actual receipt, not all answers supplied. No whole-requirement score/claim.
- A previous **approved** addition is tracked as `{blockId,additionText,answers}`. After a relevant correction, a new explicit request first verifies that exact known suffix against the unchanged approved CV. Backend model input removes that earlier addition and all previous source answers; only current sources reach the model. The new detached candidate replaces that known addition without duplication. Dismiss retains the old approved CV. A later No can remove its earlier wording only through a new reviewed Apply. Unrelated CV changes block this reuse.
- CV/ad/base fingerprint and current answer/status/revision checks run after response and before Apply. Starting a correction removes the candidate; late responses cannot reinstall it. Existing editor draft/history survive view switches and Apply. No individual fact confirmation or automatic retry.

## Exact prepared backend diff

Read-only GET reverified existing Rewrite **3fy8qAJngSRWzP35**, active, saved and active version **fb91e3d1-44a6-4224-a5c5-9ba08b8d1ba4**. No execution data or CVs were read. The safe baseline fixture contains only node parameters, connections and version metadata; it omits credentials and is **not a complete deployable workflow or rollback backup**.

- [Exact before/after field diff](prepared/rewrite-sources.backend-diff.json), with version-bound [manifest and SHA256](prepared/rewrite-sources.manifest.json).
- [Readable code/config diff](prepared/rewrite-sources.backend.diff).
- Pure builder: `backend/n8n-rewrite-sources-candidate.cjs`; regenerate local review artifacts using `node tools/prepare-rewrite-sources.cjs`. It has no API client, deployment or model calls. A future mutation must transform a fresh complete encrypted-snapshotted definition, never upload the safe fixture.

The 13 changed paths cover:

- Validation + Normalization: conditional exact source-profile validation and separate current-only model input; existing no-source validation retained.
- Two If nodes **inside the same workflow**, for valid input and source-profile routing. Invalid input responds without a model; source requests go directly to the existing EN model; no-source requests retain the existing detector/Merge/language branch. No webhook path or workflow creation.
- Existing EN model: conditional source system/user messages; explicit source-only 1,600 output-token cap and unsimplified source response so incomplete status is detectable; old no-source prompt retained. `retryOnFail:false`; no tools or repair calls. The model stays **gpt-4.1-mini**.
- Existing EN Normalize/Apply: conditional strict source output/candidate/receipt assembly; empty, malformed, incomplete, refused or invalid source output fails closed without raw output in diagnostic errors.
- Both existing Apply nodes propagate Normalize failure instead of a fake successful no-op. This intentionally also fixes the same failure case on the ordinary language paths; successful no-source behavior is retained.
- Both Respond nodes: HTTP 400 for typed invalid input, 422 for failed model output, 200 for success. No credential, workflow setting, webhook or activation changes. In particular no settings-only mutation, which can republish automatically in n8n.

Before any authorized remote write: fresh complete saved/active encrypted snapshots with verified decrypt/hash, exact version/diff comparison and re-read. Save the candidate as an **unpublished draft only**. Confirm the published/active definition and activeVersionId remain exactly the baseline before any test. If draft isolation cannot be established, stop without executing or publishing. n8n's documented separation is a prerequisite to verify in this instance, not a reason to assume a successful mutation.

## Smallest proposed isolated external test

**Two synthetic Rewrite requests, maximum two model calls total, zero automatic retries.** No external discovery/interpret/Tailor calls: local discovery fixtures provide the completed answers. Test the **whole workflow** with Execute workflow and its existing `/webhook-test/webflow-editor-rewrite` listener, never just the Webhook node and never the production URL. Verify the listener before each request; a failed/uncertain attempt consumes its request budget. Stop on any unexpected call/routing/version/validation/quality failure; no third request or automatic prompt repair.

Exact factual test data and contract payload examples: [rewrite-sources.test-data.json](prepared/rewrite-sources.test-data.json). Runtime IDs, context revisions and the local CV version are fresh session identifiers; text, question states, blocks, requirements and request shape must match these synthetic templates. No private CV/ad content.

Base summary: **Product specialist working with digital teams.** Existing experience: interviewed five users at Example Studio, Product Specialist, 2022–2024. No changes to that experience block are allowed.

Job topics: release delivery; customer workshops/executive sessions; product outcomes; procurement; budget. Questions 3/4/5 are respectively skipped/No/unknown. They must not become positive CV facts or competence judgements.

Request 1 sources:

> I coordinated one product release with two developers.

> I designed and facilitated two internal AI workshops for colleagues in our design team. I have not facilitated customer workshops or executive sessions.

Inspect the real proposed text against full source answers and receipt. It may describe release coordination and **internal** AI workshop facilitation. It must not add customer/executive facilitation, metrics, ownership inflation, an employer/date association or claim a whole requirement is fulfilled. **Dismiss**: actual CV/version, preview, copy/export and source history stay unchanged.

Correct answer 2 to revision 2:

> I prepared the slides for two internal AI workshops; a colleague facilitated them. I have not facilitated customer workshops or executive sessions.

Request 2 uses only this current revision and the unchanged delivery source. The proposed addition may say **Prepared slides for two internal AI workshops facilitated by a colleague.** The user must not become the facilitator. Inspect raw source, exact quote/receipt, full proposed wording, unchanged baseline/metadata and current-source guard. Only when all pass, **Apply** in the isolated local editor; that candidate alone changes the local CV. No production CV is involved. Then begin a correction without another request and verify stale status/blocked reuse while the previously approved local CV stays intact. Live delivery stays disabled even after this test; report results for separate approval.

The test-only relay is prepared in the **existing local preview server**, unarmed by default. Only after approval may `DRAFTED_REWRITE_TEST_APPROVAL=two-synthetic-requests-no-retries` be set for that isolated server process. It is hardcoded to the testlistener URL, accepts at most two requests per process, consumes failed attempts, has no retry/fallback and never contacts production. Do not restart it to reset a consumed budget. The ordinary hostname/feature-flag/local-route gate remains; nothing enables the website's live action.

## Cost before any model call

Existing gpt-4.1-mini standard prices verified 2026-10-22: **$0.40 / million input tokens; $1.60 / million output tokens**. [Official OpenAI model/pricing page](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

Prepared full model input plus system prompt is 3,388 / 3,383 UTF-8 bytes for the two templates. Estimate approximately 2,000 input + 1,000 output tokens per call: about **$0.005 total**. Conservative 6,000 input + capped 1,600 output tokens per call costs **$0.00992 for both** at those list prices; proposed spend ceiling **$0.02**, excluding existing n8n subscription/execution allowance. No cache discount assumed. Confirm runtime serialized input stays within that budget before submitting. Model availability is unverified; failure stops the test with no substitute model or retry.

## Verified locally

- 44 tests: prior 33 discovery/session/transport/background tests plus 11 source-profile/actual prepared n8n Code-node VM tests. Typed boundaries, current references, actual used subset, changed metadata/response/receipt rejection, no-change, corrected-source replacement, negative states, provider/parse/incomplete failures and no-source regression covered.
- Existing whole-editor browser suite passes eight viewport sizes, scroll/selection and context-change/stale-response guards.
- Guidance, outcomes and draft browser suites pass. Source draft test verifies professional deterministic wording, partial/internal scope, skip/No/unknown, source revisions, detached review/copy/export, relevant and in-flight corrections, Dismiss, explicit Apply, correction after Apply, removal only on another Apply, preserved unrelated editor draft, mobile and feature-off gate.
- Zero external model calls, n8n writes, publication or merge. Browser network is blocked outside local fixtures. Normal runTailor remains unchanged. No real AI quality claim from these mock tests.

## One approval point — not granted yet

Approve the exact version-bound source-profile contract candidate and backend diff linked above **only as an unpublished draft in existing Rewrite 3fy8qAJngSRWzP35**, after verified encrypted saved/active snapshots and exact diff/version check. Then approve the two synthetic testlistener requests described above, maximum **two gpt-4.1-mini calls**, no retries, **$0.02 maximum estimated model budget**, and local Apply/Dismiss verification. Keep published/active version unchanged and live frontend gated. No publication, activation/deactivation, merge, production execution, new workflow, Tailor change or prompt 3. A changed diff/version or exceeded test budget requires fresh approval.

Sources for isolation prerequisites: [n8n save/publish separation](https://docs.n8n.io/build/understand-workflows/save-and-publish-workflows), [test webhook lifecycle](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/workflow-development).
