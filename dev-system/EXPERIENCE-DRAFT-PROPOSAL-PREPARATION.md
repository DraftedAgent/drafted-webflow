# Experience answers to a draft proposal — local preparation

2026-10-22. DEV-052 supersedes the DEV-051 mock-only preparation below: see [the exact approval bundle](REWRITE-SOURCES-APPROVAL.md). Typed source transport, a strict candidate usage receipt and a version-bound patch for the existing Rewrite are now implemented **as local candidates only**. No remote workflow change, publication or external model execution has occurred. Production remains gated. The following DEV-051 sections document the earlier mock baseline, not the current candidate contract. Existing DEV-050 guidance is retained locally.

## Inspected implementation and live definitions

The existing discovery Session owns full source answers, stable question/answer IDs, revisions, negative/unknown/skipped states and advisory drafts. `sourceQuote` must occur in the answer; `proposedText` is not an independent fact. Questions reference existing jobContext priorities/mustHave. Neither the discovery contract nor a plain CV response carries an actual answer-to-edit usage receipt.

The existing editor has `pendingSuggestion` -> `fetchProposalFromSuggestion()` -> `pendingProposal` -> proposal card -> Apply/Dismiss. Normal Tailor applies its returned blocks immediately; the normal proposal Preview temporarily swaps the same state used by copy/export. The new local answer-based path does neither: it reviews before/after text in that same proposal card, retaining the actual CV state until explicit Apply. Normal Tailor and unrelated proposal behavior are unchanged.

Read-only n8n GET on 2026-10-22 verified:

- Existing Rewrite `3fy8qAJngSRWzP35`, saved and active version `fb91e3d1-44a6-4224-a5c5-9ba08b8d1ba4`, active. The model accepts `instruction`, modifies only existing block text and forbids invention. The validation node normalizes the input but does not carry typed source answers. The language detector chooses a branch; explicit `language` is not propagated. Normalize returns failure for malformed/empty output, but the subsequent Apply node builds `ok:true` from a default empty updates list rather than propagating that failure. No provenance is returned.
- Existing Tailor `H8oAioy58R1v3PvRe3YUa`, saved and active version `f399ee97-764b-44e0-bc42-5c7517499890`, active. Its contract accepts only CV/jobContext/role/language. Build Tailor explicitly limits additions to what is already in the same CV block. Tailor Guard also rejects some new phrases/bullets and truncates long output. It cannot safely consume new answers through the existing contract. Answers must not be hidden in targetRole, jobContext or pretend CV blocks.

Only configuration code/metadata were read. No executions, CV records or credentials were retrieved in outputs. These are observations of those exact versions, not rollback snapshots or permission to change them.

## Exact local data flow

1. Existing upload/jobContext -> discovery plan -> frozen queue with real signalRefs. Existing submit/interpret records full raw source/revision plus separate advisory drafts. No individual fact confirmation.
2. At completion, `Session.proposalSources()` snapshots current CV blocks/version, jobContext, round/context IDs, question/status/ref list and **recorded raw answers only** as `{id,questionId,revision,text}`. It does not include `drafts`, `proposedText`, inferred competencies or model-written facts. Skip, no, unknown, failed and unresolved topics retain their states and are not positive experience.
3. Explicit **Use these answers to improve your draft** invokes the adapter callback. The main editor refuses to replace an existing proposal/suggestion or in-flight chat. It captures a base CV/job fingerprint and source versions; source generation never writes chatHistory or the user's editor draft.
4. Existing `pendingSuggestion` and `fetchProposalFromSuggestion({commitImmediately:false})` are reused. Existing Rewrite request keys only:

   ```json
   {
     "mode":"full",
     "instruction":"Static source-aware instructions + Source data (JSON): <current raw source snapshot>",
     "targetRole":"<unchanged optional role>",
     "cvVersionId":"<current version>",
     "cvTitle":"<current title>",
     "selectedBlockIds":[],
     "blocks":["<unchanged full canonical blocks>"],
     "language":"en"
   }
   ```

   `instruction` contains explicit user-authorized source data, not AI interpretations. No source is inserted into `blocks`, `targetRole` or the ad. This opaque instruction encoding is used **only in the local fixture**, not claimed as a new approved production evidence contract.
5. The bridge requires **all** of: localhost hostname, preview flag `discoveryProposals:true`, and exact rewrite endpoint `/preview-api/rewrite`. No production fallback exists for this bridge. The fixture uses that existing preview rewrite route and returns the existing strict CV envelope; no external service is called.
6. The fixture keeps all metadata/IDs/blocks and appends full source answers verbatim to one existing summary. For a previously approved fixture addition, it replaces only that exact known suffix with the current source text. This is a provenance/lifecycle demonstration, **not a professionally rewritten CV or a claim of model quality**. No employer/date/role attribution is guessed.
7. Existing CV-envelope validation runs first. A further local guard requires unchanged block count/order/metadata/title, and either unchanged text or the exact expected source-only summary addition/replacement. Unsupported paraphrases, invented customer/executive claims and structural changes fail; no candidate is installed. Full text is retained, not clipped to pass validation.
8. A current-source check runs after the request and again before showing/applying the candidate. The existing proposal card shows Current CV, Proposed text, source answer/revision and linked requirement. **Show/Hide proposed text** only toggles those card contents: canonical blocks/version/title, right-hand CV preview, clipboard and export remain unchanged.
9. Dismiss removes the pending candidate and records that it was dismissed; no CV write. Apply uses existing `applyProposal()` only after its explicit click. Then and only then the real blocks/version change and an approved-use message is shown. The unrelated editor draft is preserved.
10. The adapter adopts this specifically approved CV base without discarding the finished question round. Source answer IDs/revisions and their original context remain intact and correctable; the Session's active context gets a new revision, invalidating old tokens. No new plan or interpretation runs merely because that candidate was approved.
11. Beginning a relevant correction immediately invalidates pending/in-flight candidates; late responses cannot reinstall them. After Apply, correction does **not** undo the CV silently: the status explains the earlier approved wording remains. A new explicit request compares against the current approved CV and proposes replacing the known earlier source addition. Dismissing it keeps that approved CV. A new CV/ad or unrelated CV change invalidates the binding instead of reusing the old base.

Per-answer use status distinguishes not used, preparing, pending proposal, dismissed, stale and approved. Requirement links are relevance context, never a match score or proof of all subrequirements. An internal workshop answer is shown as internal; an advisory draft claiming customer/executive sessions is not sent to Rewrite as evidence.

## Separate backend preparation — not implemented

Production remains gated. Reuse the **existing Rewrite workflow/route**, its block canonicalizer, and the existing proposal UI; do not duplicate discovery/Tailor or create another workflow. Ordinary Tailor is not changed by this preparation.

Possible design decision detected: precise source transport and actual usage need an explicitly approved extension to the existing rewrite contract. This file is a reviewable proposal, not a normative contract change or DD record.

The smallest proposed live extension would add an explicitly versioned source context to the existing Rewrite request, and a versioned usage receipt to its existing CV response. For review only:

```json
{
  "sourcesSchemaVersion":"1.0",
  "sourceContext":{
    "contextRevision":"<revision>",
    "roundId":"<round>",
    "questions":[{"id":"q1","question":"<original>","signalRefs":[{"field":"topPriorities","index":0}],"status":"recorded"}],
    "answers":[{"id":"a1","revision":2,"questionId":"q1","text":"<full raw answer>"}]
  }
}
```

Proposed response addition (also unapproved):

```json
{
  "sourcesSchemaVersion":"1.0",
  "sourceUsage":[{"blockId":"<existing block>","answerId":"a1","answerRevision":2,"sourceQuote":"<exact quote>"}]
}
```

These fields are **not accepted by the current strict CV response validator**. Do not add them silently, hide them in `summaryOfChanges`, loosen the generic validator, or enable the local bridge against production. Approval of the exact request/response extension is required before implementation. If the existing CV envelope is kept with no usage receipt, the UI must say answers were supplied as context, not assert that specific answers were actually used.

Prepared changes for that later approved task:

- Validation + Normalization: exact-key, size/schema/ID/revision/ref validation for the source-aware request; preserve full source and full original block metadata; propagate explicit English for this path. Reject unsupported versions rather than infer or truncate. Keep the existing no-source path separate and unchanged.
- Model input: original CV and complete user sources are the factual inputs; exclude advisory drafts. Preserve negation, scope, audience, uncertainty and qualifiers. Related internal experience must not become customer/executive experience. No employer/date association without explicit support. Ask for internal per-edit source references; the model itself is never the fact source.
- Normalize + Apply: propagate every model/input failure as failure through to Respond, including empty/malformed output; no fallback success or automatic retry. Validate unique existing IDs, unchanged metadata/order/unknown blocks, output bounds and exact source references. A matching source quote proves traceability, not semantic entailment; unsupported extrapolation still requires model constraints and later separately approved quality checks. Do not pretend a keyword check proves factual correctness.
- Build the existing detached CV candidate plus the approved source-usage receipt, never a hidden CV commit. Frontend validates both profiles strictly and retains the current answer/base-version checks before review/Apply. Corrections mark affected receipts/candidates stale. Normal Tailor, discovery 1.0 and canonical block schema remain unchanged.
- Before any workflow mutation: fresh complete verified encrypted saved/active snapshots, exact before/after diff, source-version concurrency check and explicit task approval. No snapshot/mutation/activation/publication/model test is performed by DEV-051. Any real model-quality test needs separate execution/cost approval.

## Local verification

`node --test tests/experience-discovery.test.cjs tests/discovery-transport.test.cjs tests/discovery-background.test.cjs`

`node tests/discovery-draft.browser.cjs` with Playwright/Edge available. Whole-editor fixture only; outside requests blocked.

The browser case covers partial internal workshops, skipped/no/unknown states, excluded overstated advisory text, current raw source revisions, detached before/after review, unchanged copy/export, correction before/after Apply, invalidation during generation, unsupported output rejection, Dismiss, explicit Apply, preserved editor draft, mobile geometry, and absent action without the local feature flag. It verifies the exact local source lifecycle, not live rewrite semantics or n8n runtime.
