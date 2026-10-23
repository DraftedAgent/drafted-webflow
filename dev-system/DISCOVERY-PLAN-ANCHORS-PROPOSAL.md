# Discovery plan source references — DEV-089, approval required

**DEV-090 delivery update:** owner approved this exact internal contract and deployment. It is now integrated and active in Discovery version `3478b0d8-8a3e-4bc5-aa19-40e19b377066`. [Implementation and deployment receipt](DISCOVERY-PLAN-ANCHORS-DEPLOYMENT.md). The document below retains the reviewed proposal and original test boundary as historical evidence. No external model test or frontend publication was performed.

2026-10-23. Owner's ongoing request is to resolve errors in Discovery. New reported header: `EVIDENCE_QUOTE_NOT_EXACT` at `$.topics[0].evidence[0].quote`. Fresh GET verifies Discovery `zeIzzxPwD2Y91OyD` saved/active `95648c64-008f-4cc4-93e3-df61556d27ff`, seven nodes. The latest catalog correction is deployed, but a prompt-only quotation requirement has failed again. No retained execution data is available; this report does not establish a particular private quote or model reasoning. No external model or workflow execution initiated.

## Proposed minimal durable change

Stop asking the model to reproduce evidence text or calculate numeric references. Give it request-bound source catalogs and accept selected IDs instead. Backend deterministically maps each known signal ID to the original field/index and each known evidence ID to its original blockId/full block text. The existing public response shape and validator remain the final gate. This is an **internal model request/response contract change**, not a silent repair of the old output.

The pure [local prototype](../backend/discovery-plan-anchors.cjs) is not imported by the real handler or definition. No integration, external mutation, activation, frontend publication or schema change has been made for this proposal. Prior deployed prompt corrections remain active. Approval is needed under the owner's instruction to show contract needs before introducing them and to present concrete external backend changes first.

## Exact synthetic model request/response example

Relevant internal model input, with one original CV block and one ad signal:

```json
{
  "modelFormat": "discovery-plan-anchors-1",
  "requestId": "req-1",
  "contextRevision": "ctx-1",
  "conversationLanguage": "en",
  "jobContext": {"topPriorities":[{"signal":"Plan deliveries","weight":5}],"mustHave":[]},
  "signals": [{"id":"signal_topPriorities_0","field":"topPriorities","index":0,"text":"Plan deliveries"}],
  "evidence": [{"id":"source_0","blockId":"experience-1","text":"Supported planning.\nI did not lead workshops."}]
}
```

This is a compact illustration of the model-side payload; real `jobContext` retains all existing fields unchanged. The public browser request remains Discovery1.0 with the original blocks, jobContext, requestId and contextRevision; the browser never supplies these internal source IDs.

New model output, strict keys only:

```json
{
  "modelFormat":"discovery-plan-anchors-1",
  "requestId":"req-1",
  "contextRevision":"ctx-1",
  "topics":[{
    "key":"planning",
    "question":"Have you helped plan a delivery?",
    "signalIds":["signal_topPriorities_0"],
    "support":"clear",
    "evidenceIds":["source_0"]
  }]
}
```

Backend compiles this to the existing public `result`:

```json
{"topics":[{"key":"planning","question":"Have you helped plan a delivery?","signalRefs":[{"field":"topPriorities","index":0}],"support":"clear","evidence":[{"blockId":"experience-1","quote":"Supported planning.\nI did not lead workshops."}]}]}
```

Existing public success envelope stays `{ok:true,schemaVersion:"1.0",operation:"plan",requestId,contextRevision,result}`. The quote is read from the original request, never from generated text. Whole-block text preserves adjacent negations/scope and exact punctuation, Unicode and line breaks; no heuristic sentence splitting or truncation is introduced.

When support is unclear, the new model item uses `support:"unclear",evidenceIds:[]`, yielding the same neutral public question with `evidence:[]`. It cannot create an experience statement or change the CV. No/skip/original question answers, revisions, Tailor and review-before-Apply remain separate and unchanged. The compiler only handles CV-backed planning; it does not reuse answer interpretations as evidence.

## Failure handling and limits

- Unknown IDs, wrong request/context binding, duplicate IDs, duplicate signal allocation, mismatched support/evidence, missing/extra fields and the old free-quote model format are rejected. No guessing, reindexing, quote repair, source dropping, fallback or automatic model retry.
- Model output cannot supply quote text, block identity or numeric indices. Those public fields come only from the current validated request. A stale model response cannot use matching catalog IDs from a different request/context.
- A valid source ID proves traceability, not that the selected block semantically supports the topic. The model must still preserve role, negation and scope when judging clear/unclear; that semantic risk is not eliminated. Existing advisory behavior remains, and CV changes still require Apply downstream.
- This is not a promise to eliminate all model failures. Unknown-source or malformed-model errors can still occur and remain explicit. The specific free-text quotation mismatch is removed from the model's responsibility for a valid selected source.

## Backend changes required after approval

1. **Build discovery prompt:** for `operation:plan` only, send the versioned catalog payload and new strict selection instruction. Preserve the existing interpret path exactly. Model/provider/configuration and workflow route need no change.
2. **Validate model response:** for plan only, parse the new internal shape, verify request/context and source IDs, compile through the pure function, then run the existing public result/envelope validation. Invalid internal output remains a safe422; no raw source or model content in error responses/headers. Keep existing header diagnostics meaningful. Interpret validation remains unchanged.
3. **Local injected handler/definition and fixtures:** explicit plan-only opt-in to the same compiler and new synthetic output; do not treat old-format fixtures as successful new output or silently fall back.

No frontend code, public request/response schema, canonical block schema, new blocks, persistent source profile, source-answer revision rules or Apply contract changes are required. Before deployment, prepare the exact two-node diff against a fresh saved/active version, reject drift, run the actual Code snippets locally, save/verify full encrypted rollback snapshots, save with `publishIfActive=false`, explicitly publish the verified version, and verify both saved and active projections. No live model smoke test is authorized/requested.

## Local verification

64 relevant tests pass, including five new prototype tests: exact original CRLF/tab/Unicode/negation preserved; model-supplied quotes/indices/old shape rejected; unknown/stale/duplicate sources fail closed; unclear topics remain neutral questions without CV mutation; empty source blocks are not offered and zero signals cannot support an invented topic. The prototype is not exercised as deployed n8n integration and no real model output is claimed. Branch/worktree remains `codex/discovery-exact-evidence`, preserving prior pending work.
