# Discovery exact evidence — DEV-086, local candidate

**DEV-087 deployment update:** the owner explicitly approved this exact correction and activation. Discovery saved AND active version is now `3548a628-4767-4175-b46e-54652d384945`. Complete saved/active projection, unchanged other fields and encrypted rollback snapshots verified; [safe deployment receipt](prepared/discovery-evidence.deployment.json). No webhook/model request or frontend publication. The original candidate record below remains dated preparation evidence; compliance with new real model output has not been tested.

2026-10-23. Owner reports HTTP422 on `/webhook/webflow-experience-discovery`, reason `EVIDENCE_QUOTE_NOT_EXACT`, path `$.topics[3].evidence[0].quote`, then requests a fix. Local implementation and isolated tests completed on `codex/discovery-exact-evidence`, from main `f69c235`. External changes/publication await approval under the owner's explicit boundary. No external model/workflow execution or publication initiated.

## Diagnosis and scope

Read-only management GET confirms workflow `zeIzzxPwD2Y91OyD`, saved/active `be16ba37-66bb-424c-96c6-d944569e68e0`, active=true, seven nodes. Its active planning prompt requires exact quotes but does not spell out contiguous, block-specific copying or punctuation/whitespace constraints. The reported headers identify a rejected quote in the fourth topic's first evidence item. The failing personal quote/request is not available: workflow settings retain neither successful nor failed execution data. Do not claim to have replayed that personal example. This is Discovery planning, separate from Tailor and the earlier upload timeout.

## Concrete external change for approval

Only `/nodes/Build discovery prompt/parameters/jsCode`: replace the single existing planning-instruction sentence below, inside the embedded prompt builder. No change to interpret instructions, request/response shape, evidence validator, error diagnostics, model/configuration, credentials, connections, retention or activation settings. Keep 422 on model noncompliance; do not normalize, repair, silently omit a bad quote, or infer experience.

Before:

```text
Clear requires exact block quotes, unclear requires empty evidence.
```

After:

```text
Clear requires exact block quotes, unclear requires empty evidence. For every evidence item, copy quote verbatim as one contiguous substring of the text of the exact CV block identified by blockId. Preserve case, punctuation, whitespace and line breaks. Never paraphrase, translate, correct spelling, join separate passages, add ellipses, or borrow text from another block, block metadata, jobContext or an answer. Before returning a clear topic, check each quote against its identified block text. If no exact supporting quote is available, return support:"unclear" and evidence:[] with a short neutral experience question for that topic; missing CV evidence does not mean missing experience. Example: if block text is "Supported planning. Did not lead workshops.", quote "Led workshops" is invalid; do not remove the negation or treat it as positive evidence. An exact quote establishes traceability, not that a requirement is fulfilled; preserve role, negation, uncertainty and scope when judging support.
```

Version-bound pure preparation: [n8n-discovery-evidence-prompt.cjs](../backend/n8n-discovery-evidence-prompt.cjs). Reject changed saved/active version, unexpected fragment/node/count and repeated patch. Actual active Code was patched and run only in a local VM with synthetic plan/interpret input; verify exactly one code-string change, the stronger plan instruction, identical interpret prompt and identical remaining workflow projection. Full personal executions and credential values were not saved or printed.

The local injected backend and inactive-definition builder use the same server-side planning extension. The historical shared browser contract and frozen Tailor preparation artifacts are unchanged; no frontend rebuild/release is needed for this backend-only prompt correction.

## Verification and limits

54 relevant unit/session/transport/Code tests pass, including new cases for paraphrase, translation, punctuation, folded lines, wrong block, exact quote, unclear evidence, neutral question retention, unchanged CV, unchanged interpret input and version/duplicate rejection. A new browser regression reproduces the reported422 headers with a local fixture, verifies loading ends, manual retry keeps the same CV/context, questions reopen, an original negative-qualified answer remains available, and Tailor is not started. All requests stay local. Existing retry/error UI already meets these checks; no frontend runtime edit required.

This improves the model instruction; no new real-model output was generated, so it is not a guarantee of compliance or semantic fidelity. Invalid output continues to fail closed. Review before Apply remains unchanged downstream.

Before an approved deployment, re-read the saved/active workflow and reject drift; save and verify full encrypted saved/published/candidate snapshots; PUT with `publishIfActive=false`; verify saved projection with prior active retained; explicitly publish that exact new version; verify saved AND active definitions and log the receipt. No webhook/model smoke test is requested. No other workflow or frontend publication is needed.
