# DEV-102 — Questions owned directly by assessed ad signals

2026-10-24, DEV-103: owner approved the exact two-Code-node change. Saved/active version6336f54e-9913-4976-bd32-78d8508338d5 is deployed and both full projections match the candidate. Encrypted rollback snapshots verified; safe receipt: prepared/discovery-owned-questions.deployment.json. No external model run or frontend publication. The proposal/diagnosis below records the pre-change baseline.

## Confirmed failure

The owner supplied HTTP422/INVALID_MODEL_OUTPUT for plan request a73ff256-9e92-4ea9-9b92-c4e31665d1db, then the existing response headers: X-Drafted-Validation-Reason=UNASSIGNED_TOPIC and X-Drafted-Validation-Path=$.topics. In the deployed assessment format, this means at least one separately declared topic has no signal assigned to it. It does not identify the exact question, intended signal mapping or which other assessments were returned. Discovery stores no execution data; the raw failed model output is unavailable. No real model was rerun, no missing mapping was guessed, and no user CV/ad/answer text is retained here.

Read-only inspection confirms saved/active workflow zeIzzxPwD2Y91OyD at 8fc9596b-ca45-4ade-8697-34e27bc9ecce. Projection SHA256 d20151203f67ad5721004abac8c436745811694da84c4c5a09a527afc97fb6e2. Respond discovery already sends reason/path headers; the public error body intentionally remains generic. Header exposure to browser JavaScript is not configured. Those diagnostic limitations are not treated as the cause of UNASSIGNED_TOPIC and are not changed by this proposal.

## Smallest proposed format change that removes the orphan state

Replace the model-facing topics list plus topicKey references with direct question ownership inside the existing complete signal assessment map. Internal format becomes discovery-signal-questions-1. Public Discovery1.0 request/response, original evidence catalogs and the approved assessment/public validators remain unchanged. Every original ad signal is still assessed exactly once.

Before, the model could return a topics list containing an unused draft while assigning all signals elsewhere. Rejecting that inconsistency currently fails the entire request. The proposal does not filter drafts, repair model output, invent links or convert invalid output into zero questions.

After, the model returns only modelFormat, requestId, contextRevision and assessments. Question assessments own their question automatically:

```json
{
  "modelFormat": "discovery-signal-questions-1",
  "requestId": "synthetic-request",
  "contextRevision": "synthetic-context",
  "assessments": {
    "signal_topPriorities_0": {
      "kind": "question",
      "question": "Have you helped plan a delivery?"
    },
    "signal_mustHave_0": {
      "kind": "same_question",
      "questionSignalId": "signal_topPriorities_0"
    }
  }
}
```

This example groups two genuinely overlapping signals. The backend generates a stable topic key and original numeric signalRefs, yielding the same public shape:

```json
{
  "topics": [{
    "key": "question_signal_topPriorities_0",
    "question": "Have you helped plan a delivery?",
    "signalRefs": [
      {"field": "topPriorities", "index": 0},
      {"field": "mustHave", "index": 0}
    ],
    "support": "unclear",
    "evidence": []
  }]
}
```

same_question must point directly to a known signal whose assessment is question; unknown owners, self references, chains/cycles and references to supported/not-actionable signals reject. Backend-generated topics cannot be orphaned because their owner is also an unresolved assessed signal. An extra top-level topics field rejects rather than being silently dropped.

cv_supported and not_actionable retain their exact current fields, original evidence ID/explanation requirements and limited reasons. Their assessments are passed unchanged to the existing validator. Empty questions still require explicit validated non-question assessments for every original signal, or an empty signal catalog. Missing/null/unassessed signals never become a successful empty plan. Question-signal JSON key order preserves model ordering for equal ranks; existing UI signal weighting, first-five batch and optional continuation remain.

These are advisory questions, not new personal facts. Original CV evidence, negation, uncertainty and scope remain separate from model explanations. No source answers, Tailor contract, new blocks, CV edits or Apply behavior changes.

## Approved external scope

Two Code fields in the existing workflow: Build discovery prompt and Validate model response. The first uses the new internal prompt/catalog; the second constructs assigned topics from question decisions, then runs the existing complete-assessment and public-result validation. Interpret messages/result behavior remains identical. Model selection/options/credentials, workflow settings/log retention, graph, endpoint, headers and frontend assets remain unchanged. No frontend publication is required for the new public-compatible plan output.

Owner-approved implementation: backend/discovery-signal-questions-proposal.cjs plus backend/n8n-discovery-signal-questions-proposal.cjs. The version/projection guard refuses drift. Deployment protocol used: verify current saved/active content again; save/verify lossless encrypted rollback snapshots; save the exact two-node candidate with publishIfActive=false; explicitly activate its saved version; verify complete saved and active projections. No external model test is included.

## Validation and limits

15 focused tests pass: reported orphan rejection reproduced in old Code; generated question ownership/grouping; 27 complete decision combinations; invalid owners/chains/cycles; missing/null/extra/stale data; strict original source evidence including negation/scope; valid assessed zero versus invalid unassessed zero; string/parsed model output; unchanged interpretation; and13 assigned questions retaining first5 plus8 optional.

Two isolated browser flows pass using the candidate Code: reported UNASSIGNED_TOPIC422 stops loading, retry preserves context/CV and opens valid questions; full source/correction/review/Apply lifecycle retains originals and changes the CV only at Apply. Tests block external traffic. A background-interpretation synchronization was added to the browser test before inspecting nested revision history; no production history code was changed.

The candidate prepared from the actual live definition was rehearsed locally with synthetic data: old format422/UNASSIGNED_TOPIC versus new format200/two assigned questions. Only the two intended Code fields differ; candidate projection SHA256 a3d028c090cfd2490a37a8070819154e86f308445b7b730889494a4363f203cd. Model calls initiated:0. This proves removal of orphan-topic representation for valid new output, not real-model relevance, grouping or semantic correctness. Other invalid outputs must still fail safely.

Optional local synthetic scenario: sources-signal-questions. The production workflow now uses the approved new internal format. The standalone injected legacy handler is unchanged.
