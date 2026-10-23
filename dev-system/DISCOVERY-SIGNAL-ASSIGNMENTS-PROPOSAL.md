> DEV-092: Owner approved; single ownership is integrated and deployed. [Verified result](DISCOVERY-SIGNAL-ASSIGNMENTS-DEPLOYMENT.md). Earlier proposal details below are historical.

# Single ownership of Discovery signals — DEV-091, local proposal

2026-10-23. Continuing owner's request to resolve Discovery errors, now `REF_REUSED_ACROSS_TOPICS` at `$.topics[8].signalRefs[0]`. This identifies reuse of one ad signal across multiple returned topics. It is not an exact-quote failure. Current deployed internal source-ID format leaves `signalIds[]` inside each topic, so an otherwise valid model response can still select the same ID twice. The public validator correctly rejects it. No private failing model output was retrieved or replayed.

## Concrete internal contract adjustment for approval

Retain the source catalogs, original text compiler, request/context binding and public Discovery1.0 response. Move signal ownership out of each model-generated topic into one request-wide object: every supplied signal ID is a key with exactly one topic key or null. Backend iterates each original signal once and derives the per-topic `signalRefs`. A signal cannot be allocated to multiple topics by this representation.

Current internal output:

```json
{"modelFormat":"discovery-plan-anchors-1","requestId":"req","contextRevision":"ctx","topics":[{"key":"planning","question":"Have you helped plan a delivery?","signalIds":["signal_topPriorities_0"],"support":"unclear","evidenceIds":[]},{"key":"workshops","question":"Have you helped run a workshop?","signalIds":["signal_topPriorities_1"],"support":"unclear","evidenceIds":[]}]}
```

Proposed internal output:

```json
{"modelFormat":"discovery-plan-assignments-1","requestId":"req","contextRevision":"ctx","topics":[{"key":"planning","question":"Have you helped plan a delivery?","support":"unclear","evidenceIds":[]},{"key":"workshops","question":"Have you helped run a workshop?","support":"unclear","evidenceIds":[]}],"signalTopics":{"signal_topPriorities_0":"planning","signal_topPriorities_1":"workshops"}}
```

Public result remains:

```json
{"topics":[{"key":"planning","question":"Have you helped plan a delivery?","signalRefs":[{"field":"topPriorities","index":0}],"support":"unclear","evidence":[]},{"key":"workshops","question":"Have you helped run a workshop?","signalRefs":[{"field":"topPriorities","index":1}],"support":"unclear","evidence":[]}]}
```

Internal model input gains an explicit `signalTopics` template with every original signal ID set to null. Null in the response means that signal is unused. Topic order remains model-selected. Several overlapping signals can own the same focused topic; unrelated questions are not merged. Every retained topic must have at least one assigned signal, or the response is rejected. If two proposed questions compete for one broad signal, the model must resolve the plan; backend must not guess or discard a question. Whether the public rule should ever permit multiple questions per one broad signal is a separate product/contract choice, not silently relaxed here.

## Implementation and safety

[Unconnected pure prototype](../backend/discovery-plan-assignments.cjs) validates the exact new format and source/request/context identity. All catalog signal keys must be present exactly once in the parsed assignment object; unknown/missing keys, arrays/multiple owners, unknown topic IDs, duplicate topic keys, orphan topics and old per-topic signal lists are rejected. The existing source-ID compiler reads original full CV text, retains negations/whitespace/source identity and runs the existing public validator. No quote repair, index guessing, silent deduplication, topic deletion, semantic merging, public validator relaxation or runtime fallback.

Only plan-side model input/output and its two existing n8n Code integrations would change after approval: Build discovery prompt builds the assignment template/instruction; Validate model response validates and compiles the new form before existing public checks. Local injected handler/fixture adapters would opt in explicitly. Interpret, original answers/corrections, public/browser schemas, model/settings/credentials, Tailor and review-before-Apply remain unchanged. No frontend release needed.

## Evidence and deployment boundary

74 relevant tests pass, including five new prototype cases: unique ownership, legitimate overlapping signals sharing one topic, disjoint questions preserved, missing/unknown/multiple/legacy assignments rejected, orphan topics not dropped, exact full negative-qualified source retained, stale context rejected and empty/null allocation handled without inventing questions. This prototype is not wired to the handler, candidate or preview; no actual n8n integration or external model test is claimed.

No external workflow change, activation, publication or model call was made for this proposal. Approval is requested because it changes the exact internal model response previously approved, under the owner's explicit rule to present contract changes before introducing them. After approval prepare a version-bound two-node patch against a fresh active definition, rehearse actual Code/graph locally, verify complete encrypted rollback snapshots, save with `publishIfActive=false`, explicitly publish the verified version and verify both saved and active content. Existing source-ID behavior remains deployed until then. General model noncompliance and semantic support errors can still occur; this removes duplicate signal ownership for a valid new-format response, not all possible model errors.
