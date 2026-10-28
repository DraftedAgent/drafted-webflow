# Revision-scoped experience context / Tailor sources 1.2

Owner-approved implementation and publication, 2026-10-28. Backend publication is verified in [DEV-141 receipt](../dev-system/deliveries/structured-context-2026-10-28/receipt.json); frontend activation is part of the corresponding approved Pages release, with served verification recorded in CHANGE-LOG. This profile extends the existing source-answer session and negotiated Tailor source profile; it does not establish a professional profile, experience entity, database or RAG system. Earlier 1.0/1.1 requests and text-based context remain supported. Existing strict CV/block and source-receipt rules continue to apply.

## Source revision and identity

The existing session keeps `answers[].revisions[]`. A new revision may contain `experienceContext` in addition to its original `text` and revision number. The answer ID plus revision identifies this submitted source, not a permanent career experience. The answer's existing `context` is the CV/job snapshot for the question; it is not the new affiliation choice.

Selecting an existing entry stores this exact shape:

```json
{
  "kind": "cv_entry",
  "cvVersionId": "selected-representation-version",
  "blockId": "block-in-that-representation",
  "snapshot": {
    "type": "experience",
    "label": "Experience",
    "companyOrContext": "Example Studio",
    "roleOrProject": "Delivery Coordinator",
    "startDate": "2019",
    "endDate": "2021"
  }
}
```

Snapshot fields are copied from the canonical entry the user saw. All six fields are strings, with absent display values represented by empty strings. Exact keys only, maximum 1,000 characters per snapshot string. Version/block IDs are nonempty strings of at most 200 characters. Allowed entries: experience, project/projects, and otherSections explicitly labelled as a project (project/projekt). Summary, skills, education and arbitrary unknown blocks are not offered as new employment/project links. Unknown canonical blocks remain preserved elsewhere.

For experience, company/context is `employer` and role/project is `title`. For project entries, the actual title or project label is used. Label and dates are retained without inferred values. Incomplete entries remain selectable, using their actual label/text excerpt for display if needed. Same-company roles remain distinct by their representation references; employer-name equality never merges them.

New or independent context has exactly:

```json
{
  "kind": "other",
  "companyOrContext": "",
  "roleOrProject": "Independent project",
  "period": ""
}
```

All three values are strings of at most 1,000 characters. Role or project must contain non-whitespace text. Company/context and period are optional; no employer is required for an independent project. Whitespace, wording and optional free-text period are preserved. This is not a declaration of a new job or a relationship to an existing employment. No automatic entity merge or CV block creation follows.

## Atomic changes and correction

`Session.assignExperienceContext(answerId, currentRevision, value)` validates the entire selection against the current session representation before mutation. It then appends one revision containing the unchanged original source text and the cloned structured value, increments revision, invalidates advisory interpretations/obsolete coverage and notifies observers. Stale answer revisions or invalid local references fail before any state change. Duplicate Continue cannot create another revision with the same base revision. Changing a saved choice creates another revision; earlier text and choices remain readable. Text correction preserves the latest explicit context, which remains subject to validity checks.

For older generated context revisions, `sourceTextBeforeContext` permits recovery of the original answer when converting to a structured choice. No arbitrary user text is parsed or stripped merely because it contains `Context:`. Older revisions remain untouched. New structured choices do not append a derived `Context:` string or maintain a competing text source.

The current storage is browser memory only, with no authenticated account/session database or durable restore API. Reloading does not promise persistence. Future stable experience identities, ownership-backed storage, cross-CV linking, deduplication, migrations and RAG are explicitly deferred.

## Transport and server validation

Only negotiated `sourcesSchemaVersion: "1.2"` permits optional `sourceContext.answers[].experienceContext`. Its other fields remain exactly `id`, `questionId`, `revision`, `text`. The existing request byte bound includes the context. A 1.0/1.1 request containing the new field fails; no silent downgrade or stripping is allowed. Discovery interpretation remains on its existing 1.0 text contract; no field is added to that endpoint.

Shared client/server validation checks shape, types, lengths and exact fields. Server resolution additionally requires the supplied request's CV version to equal the reference version, exactly one matching block, an eligible type and complete metadata-snapshot equality. Snapshot text cannot override mismatching canonical metadata. A missing block, changed metadata or wrong version produces an unresolved reference, never a search or remap to a same-company role. Changed CV text alone does not change the identity of a still-valid entry within the supplied version.

**Existing trust boundary:** the current backend receives client-held canonical blocks and has no independent authenticated ownership store. These checks prove request-internal version/block/snapshot consistency; they do not certify account ownership or server-authoritative historical CV versions. A future authenticated repository must resolve the reference against that user's representation before applying the same checks. No such security guarantee is claimed by this local change.

The model receives the original answer and structured context separately. A resolved selection's only allowed answer target is the chosen block; metadata identifies the setting without rediscovering it from a string. A wrong model-selected role or summary/skills target is rejected. A redundant context question for a resolved explicit selection is removed without forcing an addition. Existing CV-only edits still require the existing original-CV evidence protocol; context is not evidence of new achievements.

For a new `other` context, no answer-addition target is allowed. The deterministic compiler preserves the source and returns `new_block_required`, even when the model omits that result. This retained enum means unplaced context; it does not assert that a new job or CV entry is necessary. For a well-formed but invalid/stale reference it returns new reason `reference_unresolved`, with the current original answer ID/revision. No CV text is relocated or block created. Malformed context is an invalid request; malformed/unknown model keys, duplicates/conflicts or unrelated invalid fields still fail closed. Client reconstruction also validates that the returned clarification reason matches the structured reference's actual resolution. All raw-source constraints and source receipt validation remain.

## UI and application

The picker is a native radio group with real entry data, no model-based preselection, keyboard focus and a visible selected state. A still-valid choice previously saved by the user may be restored. Another role or project reveals the three compact fields. Continue saves context and prepares a new detached Tailor suggestion using the current revision; Leave this out keeps its earlier meaning and does not invent a negative answer or erase the original source. Saved context is readable in answer history, revision history and correction, with a Change context action.

Context assignment never modifies canonical blocks. Preview remains current until explicit Apply, and the existing diff review/stale stamp/ledger rules apply. New unplaced context is acknowledged and retained even when No changes suggested is the only applicable outcome.

## Capability and deployment

Local previews enable the new UI only with explicit `tailorSourcesVersion: "1.2"`. The DEV-141 release sets `productionStructuredContext=true` after verifying active backend support for 1.2. Local preview: `DRAFTED_PREVIEW_SCENARIO=structured-context node tools/serve-editor-preview.cjs` (PowerShell: set the environment variable before invoking Node).

`backend/n8n-structured-context.cjs` generates pure prefixes to prepend, not replace, the existing **Validate + Normalize** and **Compose source suggestion** Code nodes in workflow H8oAioy58R1v3PvRe3YUa. Only 1.2 requests enter these prefixes; all older routes fall through to the unchanged existing definitions. The local provider executes these generated Code snippets in an isolated VM; only model output is synthetic. DEV-141 additionally verifies them in the real n8n engine through inactive test workflow JB7tjB16cncu4m5E, containing no model nodes or credentials; execution 299 succeeded. This verifies runtime compatibility, not real model quality or semantic entailment.

For each release: freshly read saved/active workflow and exact nodes, verify lossless rollback snapshots, review a version-bound two-node diff, validate in an approved isolated n8n runtime, and obtain publication authorization. Preserve routing, credentials, model settings and unrelated nodes. Only after the endpoint supports 1.2 may an approved frontend release enable its capability flag; it also switches the outgoing source version. No automatic downgrade. DEV-141 follows this sequence with a new bound manifest; historical 1.0 artifact hashes do not authorize the changed libraries. No database/profile migration is involved.
