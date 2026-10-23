# Source-aware Tailor — local implementation

2026-10-23, DEV-078. Owner authorizes local implementation and necessary existing-block contract support with synthetic tests; explicitly excludes external workflow changes, publication and external model calls. Branch codex/questions-to-tailoring, managed worktree questions-to-tailoring. Earlier DEV-077 guidance/review work is retained. No other worktree was modified.

## Implemented

The existing Session, question UI, editor, Tailor entry points and detached review are reused. New raw-source transport carries current IDs/revisions, original question/ref/state and the full current answer text; advisory discovery drafts/proposedText never enter Tailor. Prior original text, context replies and every correction revision remain inspectable. A context correction replaces active context while preserving the prior revision. There is no individual fact confirmation or automatic tailoring at the final answer.

The local injected-provider handler validates the exact source profile, projects only current sources/constraints and safe CV context, composes additions into relevant existing blocks, and returns a verifiable source-usage receipt plus the complete application register. The generic CV validator remains strict. Source-aware Apply installs the exact reviewed block text without the legacy canonical-text sanitizer changing it. Canonical IDs/metadata/order/unknown blocks are preserved.

Placement supports relevant existing block types, including employment, project/other section, skills and education; it is not restricted to summary. Employment/education/project require explicit identifying context for one entry. Missing/ambiguous context gets a short Where did this experience take place? request, not fact confirmation. The bounded synthetic provider demonstrates explicit settings and direct skill statements, including independently located paragraphs within one source. It preserves internal-only/negative qualifications. This fixture is not a general semantic parser or evidence of live-model quality.

Several Apply rounds retain a per-block register with exact full-text checkpoints, ordered ranges and source dependencies. Corrections replace all registered additions depending on an older source revision, across sections and across Apply rounds. Other sources remain intact. No/skip cannot become positive experience. Missing, pending/failed/editing/uncertain sources or changed earlier CV text freeze the affected block and produce explicit review warnings. Such text remains unchanged; it is excluded from model factual input, while its section metadata can explain that the section already exists. Old superseded original answers and application metadata are never independent factual input.

Before Apply, the card shows Current/Suggested text, source quote, context, revision, and proposed removals/replacements. Dismiss preserves CV/register. A correction does not silently undo previously approved wording. CV, raw ad/role, language/version, file and current source state are checked at response and Apply; all entry points share the in-flight lock. Applying a source candidate adopts the new CV base without discarding the question round or original source contexts. In-flight interpretations tied to the old CV are left saved/retryable rather than installed against the new base.

Local capability is explicitly loopback + tailorSources:true + /preview-api/tailor. The production frontend path and remote workflow still do not support this profile; there is no new external endpoint, credential, retry, relay or workflow patch. A provider exception/invalid output fails safely. The preview uses UTF-8 streaming decoding to preserve Unicode source text across network chunks.

## Reused unpublished work

DEV-051/052 Rewrite-source preparation supplied raw source ID/revision shapes, exact quote/proposed-text receipts, strict profile validation/composition, detached review and source correction principles. Its version-bound n8n patch was NOT applied: it targets another workflow, assumes English/summary-only additions and a single prior suffix. The new shared module generalizes the source/application handling for existing sections and multiple Apply cycles. Existing discovery block/jobContext validation is reused directly.

Approved local profile: contracts/tailor-sources-v1.md. Exact synthetic request/response and correction pairs: dev-system/prepared/tailor-sources.examples.json. The legacy remote Tailor contract remains intact, with a notice linking the separate local extension.

## New blocks remain unimplemented

When no appropriate existing entry fits, the response says new_block_required; the UI explains that no entry was created. Creating employment/project/other entries needs a separately approved create operation, supported type/metadata/unknown-date policy, canonicalizer-issued stable IDs, order/placement and full reviewed response plus provenance/correction/deletion lifecycle. No new block, schema expansion or fabricated employer/role/date is introduced here.

## Try the complete local flow

PowerShell, from this worktree:

    $env:PORT='8795'
    $env:DRAFTED_PREVIEW_SCENARIO='sources'
    node tools/serve-editor-preview.cjs

Open http://127.0.0.1:8795/?sample=1. The synthetic CV includes an existing Example Studio employment, Community Project and Skills section. Open Review questions and try:

1. First answer: I planned a release with two developers.
2. Second answer: In Community Project, I helped facilitate two internal workshops. I did not lead customer sessions.
3. Finish and tailor my CV. When asked where the first experience took place, enter At Example Studio and Save context. Choose Tailor my CV again.
4. Review the workplace/project suggestions and source links. Dismiss keeps the CV; Apply changes it. Open Review your answers to correct them, then generate/review another suggestion. Try a correction to No after several Apply rounds: the affected earlier additions are proposed for removal, never silently deleted.
5. At Another Company, I facilitated a workshop. demonstrates a new-entry need without creating a block. I use Python to prepare reports. demonstrates Skills placement. Several explicitly located examples can be separated with blank lines; every addition retains its source/revision.

All providers/endpoints are local, CSP blocks external requests, and the banner labels the CV/ad and behavior synthetic. Rendering, source quotes and canonical Apply run through the actual editor code. This does not simulate an external AI quality test or authorize production enablement.

## Validation

Final result: all 58 unit/session/transport tests and all three focused browser suites pass. Commands:

    node --test tests/tailor-sources.test.cjs tests/experience-discovery.test.cjs tests/discovery-transport.test.cjs tests/discovery-background.test.cjs tests/discovery-negative.test.cjs
    node tests/tailor-sources.browser.cjs
    node tests/questions-tailoring.browser.cjs
    node tests/discovery-outcomes.browser.cjs

Browser tests use bundled Playwright/Edge and block all non-local traffic. Source suite covers actual question-to-source transport, clarification, employment/project placement, skipped/No and mixed/internal scope, unchanged original/revision data, detached Dismiss/Apply, several Apply rounds, correction of the first round after later rounds, stale in-flight correction, new-block deferral, changed prior text and mobile. Unit tests also cover one answer with additions across several sections, multiple sources sharing a block, retained range offsets, uncertain source freeze, source absence versus withdrawal, explicit context replacement, unknown fields/references/metadata, source-output tampering, repeated-generation deduplication, provider failure, size bounds, and Unicode/UTF-16 span correctness. Existing CV-only transition/outcome regressions are retained.

The older full-editor browser test's obsolete server-PDF download assertion remains the previously documented DEV-077 compatibility issue; it was not claimed passed or repaired in this scoped task. Real model semantic fidelity and external n8n runtime remain untested and unauthorized. No contract claim that quote matching proves semantic truth.

Final verification: syntax, exact root/dist JS/CSS bytes, normalized source/bundle parity, matching latest pointers/build ID, no missing CSS imports, strict prepared request/response validation and git diff --check all pass. Desktop source-linked review and mobile uncertain-text screenshots inspected. Preview running on localhost:8795 with the current synthetic sources fixture. No commit/push/merge/publication or external execution.
