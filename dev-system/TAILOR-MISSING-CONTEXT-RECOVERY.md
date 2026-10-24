# DEV-100 — Missing-context clarification instead of whole-proposal rejection

2026-10-24, DEV-101: owner approved the exact one-node change and frontend publication. Backend saved and active version a5196f17-4ccc-41db-8993-9b6c5fe466dd both match the prepared candidate; encrypted snapshots verified. Safe receipt: prepared/tailor-context-recovery.deployment.json. No external model executed. The diagnostic/proposal below records the inspected pre-change baseline.

## Observed production failure

Read-only inspection of existing Tailor execution214 confirms HTTP422/INVALID_SOURCE_OUTPUT at Compose source suggestion. At inspection, saved/active workflow H8oAioy58R1v3PvRe3YUa was f024a1b5-9907-446b-9321-ff2f31ac351d, projection SHA256 4d62d46673f19f07d4a857606da0219867c37ef85e39184fa6766b292dfdad46. One selection has valid source and target keys, but targets an experience entry whose employer/title is absent from the raw answer. Its allowed targets contain only summary/skills. A separate skills selection is valid. The completed single output_text string envelope is supported. The strict compiler rejects UNSUPPORTED_SOURCE_TARGET, causing the entire422. Earlier executions204/205 return200 with valid selections. No personal CV, source or model text is reproduced here or copied into fixtures.

The public console excerpt alone does not expose HTTP status or backendCode; saved execution214 provides the diagnosis. The frontend build marker question-rounds in the report also confirms older published UI; removal/cleanup changes remain local.

## Exact proposed change

Change only Compose source suggestion Code in that existing workflow. Keep Validate + Normalize, model configuration/messages/credentials/token limit, settings, graph, endpoint and legacy path unchanged. Inject backend/tailor-context-recovery-proposal.cjs beside the existing sourceReferences library and replace this call:

```js
sourceReferences.compile(request, JSON.parse(part.text), validated.sourceScope)
```

with:

```js
sourceContextRecovery.compile(request, JSON.parse(part.text), validated.sourceScope)
```

The proposed compiler first runs the strict current compiler. It only handles UNSUPPORTED_SOURCE_TARGET when all keys/schema/text are otherwise valid, the requested target is a named employment/education/project entry, the source has no eligible contextual entry, and the pair is not already applied. It validates every item before proceeding. Unknown/stale keys, malformed text, duplicate/conflicting decisions, frozen targets, already-applied pairs and a wrong target despite an available contextual entry still fail closed. It never guesses a placement or retries the model.

For each qualifying source, withhold ALL its proposed additions (including summary/skills attempts) and emit exactly one existing context_unclear question bound to the current original answer ID/revision. Independently valid sources can still generate detached, traceable suggestions. The existing frontend explicitly shows Where did this experience take place?; unused-source details explain that the setting is unclear. This changes the approved internal rejection policy, so deployment needs approval even though no public request/response schema changes.

Synthetic example: current answer a1 revision4 says `I ran internal AI workshops for colleagues, not customer sessions.` A valid-key selection for experience-1 without named context currently rejects422. The candidate returns a standard200 source receipt with that experience block unchanged and:

```json
{"contextQuestions":[{"answerId":"a1","answerRevision":4,"reason":"context_unclear"}]}
```

Other independent validated additions remain listed in sourceUsage. No unsupported wording is applied or relocated. The user can supply a workplace/project, preserved as a new raw-source revision with prior text/history retained, then explicitly run Tailor again. All resulting edits/removals remain reviewable before Apply. No new CV entry is created.

## Local verification and delivery boundary

Fifteen focused tests pass (existing source-reference suite plus five recovery tests). New discovery-actions browser flow verifies removed notices, centered wrapping buttons on desktop/mobile, synthetic reproduction of the unsupported placement, explicit clarification, current revision/negation preservation and detached review before Apply. Existing complete Chat lifecycle browser flow passes. Exact candidate Code prepared from the actual current live definition was rehearsed locally: same synthetic input returns422 before and200 with an explicit context question after; only Compose source suggestion changes. No external workflow or model executed, and no workflow write/activation occurred.

Adapters: backend/n8n-tailor-context-recovery-proposal.cjs, version/projection bound as above. Production source-reference compiler is unchanged. The optional sources-context-recovery preview uses the candidate solely with synthetic data at http://127.0.0.1:8803/?sample=1. Frontend build2026-10-24-question-actions also includes the already requested DEV-096/099 UI changes; root assets/latest are prepared locally, not published.

For approved delivery: reread saved/active versions and fail on drift; create and verify lossless encrypted saved/active/candidate rollback snapshots; save only the one-node candidate with publishIfActive=false; activate the exact saved version; verify full saved/active projections and unchanged model/graph/settings. Any frontend publication must explicitly cover the local note/count, clean Tailor lifecycle and centered question actions. No external model test is included.
