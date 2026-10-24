> DEV-098 deployed: saved and active version f024a1b5-9907-446b-9321-ff2f31ac351d verified against the exact candidate. Complete encrypted rollback snapshots verified. No external model execution. Receipt: prepared/tailor-source-references.deployment.json.

# Tailor source references — owner-approved implementation

DEV-097 proposal; DEV-098 owner approval and implementation, 2026-10-24. Scope: existing Tailor workflow H8oAioy58R1v3PvRe3YUa, source branch only. Observed saved/active version c143d087-8803-40d5-8c94-6425780d8afe. Existing execution195 returns422. Local replay rejects contextQuestions referencing absent answers; five additions also contain non-exact context quotes. This proposal does not claim semantic validation of generated wording.

## Approved internal change

Replace model-written answer IDs, revisions and literal quotes with request-bound catalog references, analogous to the Discovery source-reference approach. Public webhook request/response, source ledger, corrections and Apply stay unchanged. No new block support. No model execution is proposed.

1. In Validate + Normalize, construct a private catalog from current recorded raw answers only, after existing request validation and correction preparation. Each catalog entry binds a generated source key to the original answer ID, exact current revision and complete unchanged original text. Keep non-recorded answers as constraints only; they have no addition key. Advisory interpretations remain separate and are never factual source material.
2. Construct allowed source/target pairs for existing non-frozen blocks only. Require the existing contextSupported check against the unchanged full answer for employment, education and projects. Context derived only from the CV, question or job ad does not qualify. Do not infer a unique employer merely because only one exists. Missing context remains a short clarification; do not route unclear employment into summary. Semantic relevance of placement remains part of model selection and user review.
3. Pass the catalog and internal format `tailor-source-references-1` to the source model. Output additions contain only sourceKey, targetKey and proposed text; clarification items contain sourceKey and the existing allowed reason. Unknown keys, duplicate/conflicting decisions and oversized output fail closed. No silent drops, invented repairs or source-free fallback.
4. In Compose source suggestion, reconstruct answerId, answerRevision, sourceQuote and contextQuote from the selected catalog entries, not the model. Both quote fields use the complete unchanged answer. Then run the existing candidate composer and receipt validator. Keep response422 for invalid model selections; retain original answers and all correction/application history.

Synthetic example of internal input:

```json
{"format":"tailor-source-references-1","sources":[{"sourceKey":"s1","text":"At Example Studio, I supported testing, not planning.","allowedTargets":["t1"]}],"targets":[{"targetKey":"t1","blockId":"experience-1","type":"experience","employer":"Example Studio"}]}
```

Proposed model output:

```json
{"additions":[{"sourceKey":"s1","targetKey":"t1","text":"Supported testing at Example Studio; did not own planning."}],"contextQuestions":[]}
```

Backend reconstruction before existing validation (synthetic original ID/revision):

```json
{"additions":[{"blockId":"experience-1","text":"Supported testing at Example Studio; did not own planning.","answerId":"answer-original-1","answerRevision":3,"sourceQuote":"At Example Studio, I supported testing, not planning.","contextQuote":"At Example Studio, I supported testing, not planning."}],"contextQuestions":[]}
```

For `I supported testing, not planning.` without named context, use a clarification instead:

```json
{"additions":[],"contextQuestions":[{"sourceKey":"s1","reason":"context_unclear"}]}
```

Backend resolves that key to the original current ID/revision and returns the existing clarification receipt. A new entry requires new_block_required; no block is created. No/skipped answers cannot become additions. Mixed answers keep their full original text, including exclusions, and proposed wording must preserve them. Full-answer traceability does not itself prove semantic entailment; review before Apply remains mandatory.

## Exact deployment boundary and validation

Two Code nodes change: Validate + Normalize and Compose source suggestion. Tailor sources model receives the changed generated messages through its existing connection; model configuration, credentials, token limits, legacy branch, endpoint and workflow settings stay unchanged. The owner approved this exact internal format and two-node implementation/deployment scope after the DEV-097 diagnosis. The implementation is in backend/tailor-source-references.cjs and backend/n8n-tailor-source-references.cjs. Before deployment, verify fresh version/content, create and verify lossless encrypted rollback snapshots, rehearse the actual candidate Code locally and verify saved and active projections. No external model test.

Required isolated cases: exact reconstruction at multiple source revisions; invalid/foreign source and target keys; wrong source/target pairing; negative/skipped/mixed sources; ambiguous or missing employment context; repeated Apply and corrections affecting all prior additions; frozen edited text; malformed/incomplete response; no fallback; CV unchanged before Apply. Existing execution data must not be copied into tests.

Frontend busy fix is independent and locally verified; publishing it does not fix this live422. Frontend publication must include the reviewed DEV-096/097 scope explicitly, excluding unrelated pending backend work.


Implementation detail: keys include the execution scope (for example s1_200 and t1_200), so keys from a different execution reject instead of rebinding. Original IDs/revisions remain backend bindings. alreadyAppliedTargets marks retained current-revision source/section pairs; these are excluded from allowedTargets to prevent duplicate paraphrases, including after migration from prior substring-quote receipts. A correction creates a new current revision, allowing a reviewed replacement after all old tracked additions are prepared for removal. Model input includes complete original sources, existing target blocks, separate non-recorded constraints, job context and frozen-section metadata. Backend performs no semantic interpretation of user text.

Validation: 42 focused tests plus full isolated editor/source-error browser flows. Existing saved execution195's response envelope was also checked read-only: one completed assistant message with one output_text string; the prior failure is invalid source content, not an unsupported envelope. The exact live candidate Code was rehearsed locally with synthetic success/correction and foreign-key422 cases. No production execution or external model call.
