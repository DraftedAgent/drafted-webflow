# Tailor with source answers — local profile 1.0

2026-10-23. Owner-approved **local implementation and synthetic validation only**. This profile permits source-supported additions in relevant existing CV blocks. It supersedes the earlier proposed summary-only restriction and single `previousApplication` suffix. It does not change the deployed Tailor workflow, authorize external execution/publication, create blocks, resolve general commit/version ownership, or introduce persistent profiles.

Implementation: `webflow/src/tailor-sources.js`, injected-provider handler `backend/tailor-sources.cjs`, existing discovery Session/editor/review UI. Production source transport remains disabled. Local capability requires loopback hostname, explicit fixture capability `tailorSources:true`, and `/preview-api/tailor`; there is no external fallback. The deployed no-source Tailor contract remains unchanged.

## Exact request profile

Existing eight Tailor fields remain required in this local profile: `cvVersionId`, `cvTitle`, `targetRole` (possibly empty), `language`, `blocksSchemaVersion`, full canonical `blocks`, `jobContextSchemaVersion`, `jobContext`. Add both `sourcesSchemaVersion:"1.0"` and `sourceContext`. No other top-level keys. Language is explicitly sv/en, both existing schema versions are 1.0. Job context is not duplicated inside sourceContext and is never treated as personal evidence.

Exact sourceContext fields:

- `contextRevision`: opaque current snapshot identity, covering CV/ad and source state; echoed in success. The stateless backend does not certify that the client's revision is globally latest.
- `roundId`: current question round identity.
- `questions`: `{id, question, signalRefs, status}`. References resolve into current jobContext. Status is one of `recorded`, `no`, `unknown`, `skipped`, `covered`, `needs_detail`, `error`, `unanswered`, `processing`, `answered`, `editing`.
- `answers`: `{id, questionId, revision, text}`. Text is the complete current user-source revision, not an AI interpretation. IDs remain stable and revision is a positive integer. Non-recorded answers may be present as constraints but cannot support additions. Current answers only; full original/revision history remains in the session, separately from advisory drafts and derived CV text.
- `applications`: all registered approved additions for this CV lineage, grouped as `{blockId, checkpointText, additions}`. Every addition has `{id, start, end, text, source:{answerId,answerRevision,sourceQuote}}`. Ranges are half-open UTF-16 offsets in checkpointText, include the exact `\n\n` separator, and must equal that separator plus text. Groups/IDs/ranges are validated strictly. This client-held register is provenance and replacement metadata, not a new factual source or server-side persistence.

At most 100 questions/answers/groups, 100 additions per group; answer text 50,000 UTF-16 units, block/checkpoint text 100,000, individual addition 10,000. Total request at most 1,000,000 UTF-8 bytes, including the register. Existing canonical/discovery bounds and typed metadata validation are reused. No truncation or coercion to pass validation. The composed candidate must also fit a subsequent request with its updated register; reject otherwise. Original text remains available on failure.

## Source handling and placement

Only recorded raw user answers can support new wording. Recorded means submitted source, not individually confirmed AI facts. Advisory drafts/proposedText/competency inferences never enter this request or become sources. Whole-answer No, skip, unknown, pending/failed and editing states remain distinct; none is positive evidence. A mixed answer stays whole, including internal/external scope, negations, uncertainty and personal role. Do not promote a positive excerpt by ignoring its qualifications.

Use a relevant existing block according to source content and stated context: employment, project, education, skills or another appropriate existing section. Do not default new facts to summary. Employment needs explicit supporting employer context identifying one existing entry; multiple possible entries need more context. Education/project associations similarly need an explicit identifying context. No new employer, role, date, metric or project identity may be inferred. Existing metadata stays unchanged.

When context is unclear, return `contextQuestions` with reason `context_unclear`. The editor asks “Where did this experience take place?” and accepts a short free-text workplace/project/setting answer. This is context collection, not individual fact confirmation. Context is stored as a new source revision with its separate user reply and the prior revisions preserved. A further context correction replaces the active context, retaining the earlier revision; it does not stack contradictory contexts as current facts.

If no suitable existing entry exists, return reason `new_block_required`; explain that no new entry was created. Do not force the experience into another section.

## Exact success extension and deterministic composition

Keep the existing successful CV envelope; it is a detached candidate with the base cvVersionId, not a server commit or new persistent version. Add exactly:

- `sourcesSchemaVersion:"1.0"`, `sourceContextRevision`, `sourceRoundId`.
- `sourceUsage`: new additions actually composed, each `{applicationId,blockId,answerId,answerRevision,sourceQuote,proposedQuote,contextQuote}`. The source quote must occur verbatim in the named current recorded answer; the context quote must also occur verbatim, and identify the employment/education/project where applicable. ProposedQuote is exactly the added wording. IDs are unique. Existing retained additions are represented in sourceApplications, not falsely reported as new usage.
- `sourceApplications`: complete resulting register with updated exact checkpoints/ranges, including retained additions and excluding safely replaced ones.
- `sourceReview`: `{blockId,applicationIds,reason}` for prior text that cannot be replaced safely. Reasons: `text_changed`, `source_unavailable`, `source_uncertain`. Registered uncertain spans are retained, not silently dropped.
- `contextQuestions`: `{answerId,answerRevision,reason}` for current recorded sources requiring context or a new entry. The UI supplies short fixed question text; there is no AI fact-confirmation operation.

The injected provider returns exactly `{additions,contextQuestions}`. Addition items are `{blockId,text,answerId,answerRevision,sourceQuote,contextQuote}`. The composer validates these references, appends only validated text to existing blocks, and derives receipts/ranges itself. Full candidate and receipt are reconstructed/checked together in the frontend; untraced text or changed metadata/IDs/order fails. The generic CV validator is unchanged and runs after removing only these seven explicitly known extension keys.

The local profile deliberately preserves existing base text except for registered, precisely identifiable replaced additions. It does not allow an ordinary model rewrite to obscure tracked source ranges. Existing no-source Tailor remains its separate path. A later combined general rewrite/source operation must preserve the same application identities or mark affected wording for review.

A quote match proves traceability, not semantic entailment. Prompt rules preserve scope/negation and only user sources authorize new claims. Real model quality/placement remains unverified; this stage uses a bounded synthetic provider, not a general NLP implementation or external model.

## Several Apply rounds, corrections and uncertain text

The register accumulates across source Apply rounds and all blocks. Starting a correction invalidates pending requests/candidates. A changed recorded answer revision replaces every precisely identifiable addition depending on its earlier revision; No/skip can propose removing those additions without making positive claims. Other sources' additions remain intact with updated offsets. Repeating unchanged source input cannot duplicate its existing traced addition for the same block/supporting quote.

If a block's current text differs from its checkpoint, or its source is missing/uncertain, freeze that block, retain its text/register, and mark it for review. Do not search-and-replace an uncertain substring. Frozen text is excluded from factual model input; only its section metadata is available to explain that the section exists. An unknown source is not assumed withdrawn. No hidden undo, deletion, or automatic CV change occurs.

Before Apply, show current/proposed text, supporting source/context quotes and revision, proposed removals/replacements, and any review warnings. Copy/export/right-hand CV stay committed until explicit Apply. Dismiss preserves CV and register. Apply installs the validated candidate/register atomically within the existing session, retains an application history, and adopts the new representation without discarding the question round or original source contexts. No model request is made by Apply. Correction after Apply never silently changes that CV; the next candidate is reviewed again.

## Failure and local validation

Use existing complete CV failure envelope, without success receipt: HTTP 400 `INVALID_SOURCE_REQUEST`, HTTP 413 `INPUT_TOO_LARGE` for total bytes, HTTP 422 `INVALID_SOURCE_OUTPUT`, HTTP 503 `MODEL_UNAVAILABLE`. No model call on invalid input; no automatic retry, repair, external fallback or private source text in errors.

Exact synthetic request/response and correction examples: `dev-system/prepared/tailor-sources.examples.json`. Tests: `tests/tailor-sources.test.cjs`, `tests/tailor-sources.browser.cjs`, existing discovery regression suites. All test/provider traffic is local and deterministic. No n8n definition/credential/workflow changes are part of this contract.

## New-block support — not introduced

A separate approved extension must define explicit create operations, source-supported block type and metadata, stable IDs issued by the canonicalizer, placement/order, complete reviewed response, and provenance/correction/deletion behavior. It must permit unknown dates/roles without fabrication and distinguish a new employment/project from additions to an existing one. The current profile rejects unknown block IDs and never invents or creates blocks. A `new_block_required` response is a reviewable need, not approval or implementation of creation.
