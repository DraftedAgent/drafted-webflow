# CV coverage 1.0 — local implementation

2026-11-02. Owner requested implementation of DEV-187's three dependencies: exact ad provenance, complete version-bound coverage, and focused signal entry. This profile is normative for the new local implementation only. No existing Discovery1.0, jobContext1.0, Tailor1.2 or canonical block contract is changed. The prepared private n8n endpoint has not been created/activated. No permanent profile or match score.

## Transport and operations

Private target prepared: `POST /webhook/drafted-cv-coverage-v1`, reached only through a server-held header and loopback gateway. Dev simulation uses `/preview-api/coverage`; future approved local integration uses `/api/coverage`. Missing capability/credentials is unavailable, never simulated success in integration.

Common request keys, exact: `coverageSchemaVersion:"1.0"`, `operation:"anchorSignals"|"assessCoverage"`, `requestId`, `jobText`, `jobContext` (existing1.0 object). Anchor requests have no extra keys and no CV. Assessment adds exactly `cvVersionId`, full canonical `blocks`, `catalog`, `inputRef`. Raw answers, interpretations and detached candidates are not coverage inputs.

Request/response maximum1,000,000 UTF-8 bytes, raw ad max60,000 JS code units. CV/jobContext retain existing Discovery validator bounds, including100 blocks and20 priority/mustHave signals. Do not truncate to fit.

Success: `{ok:true,coverageSchemaVersion:"1.0",operation,requestId,result}`. Failure has `ok:false`, the same profile/binding fields and `contractError:{code,message}`, with no result. Invalid input400/413, unsafe model output422, unavailable provider503. Gateway may return403/429/503 before provider invocation. No automatic retry, partial acceptance or fallback assessment.

## Exact original ad catalog

The model selects from a request-bound catalog of original, nonempty ad lines by IDs. It does not generate quote strings or offsets. The server deterministically materializes raw `{start,end,quote}` using UTF-16 indices, exclusive end, preserving original whitespace, Unicode and newline positions. Every `jobText.slice(start,end)` must equal quote.

Anchor result is exactly `{jobRef,revision,signals}`. `jobRef` contains `jobRevisionId`, `jobTextHash`, `jobContextHash`. Current jobRevisionId is the raw-text SHA256 identity. Catalog revision is SHA256 of canonical `{jobRef,signals}`. Re-extracted contexts also bind by their own digest.

Each catalog signal is exactly `{id,ref,text,anchorState,adEvidence,requirement,requirementEvidence}`. `id` is `topPriorities:N` or `mustHave:N`, scoped to this catalog revision (not global across jobs). Original field/index and wording must match; no missing/foreign/duplicate signals. Keywords/successMetrics do not inflate the catalog and no semantic deduplication silently changes the denominator.

`anchorState:"verified"|"unresolved"` denotes source-location validation, not a certified semantic inference. Verified requires original ad evidence. Unresolved has no ad evidence, unspecified requirement level and no requirement evidence. `requirement:"required"|"preferred"|"unspecified"` must have explicit original-ad evidence when required/preferred; that source must also be in adEvidence. Priority weight and legacy mustHave membership never determine requirement level.

## Complete advisory CV result

`inputRef` is exactly `{cvVersionId,cvBlocksHash,jobRevisionId,jobTextHash,jobContextHash,signalCatalogRevision,policyVersion}`. Hash all canonical block content, identity, order and metadata; a version ID alone is insufficient. SHA256 uses UTF-8 and canonical object-key order; array order and original text are preserved. Policy is `cv-coverage-1`.

Assessment result is exactly `{assessmentId,inputRef,rows,provenance}`. Provenance is `{advisory:true,model,generatedAt}`. Each row is exactly `{signalId,status,evidence,explanation,question}`. Status: `clear`, `partial`, `not_represented`, `needs_review`. There must be exactly one row per catalog entry. UI derives actual counts; no weighted match score or job-success probability.

Models select request-bound CV evidence IDs. Server materializes original full block text as `{blockId,quote}`; the exact quote must exist in that current block. Clear/partial require evidence; not_represented requires none. No keyword-only coverage. Preserve personal role, negation, scope, uncertainty, qualification equivalence and internal/external distinctions. Explanations remain advisory, never new user facts. A source-location check is not proof of semantic entailment.

Unresolved ad anchoring must be needs_review with no generated question. A nonempty question is at most500 code units and is a short neutral prompt for the focused experience flow. Use an empty question for conditions that cannot safely become an experience/qualification question. Do not infer personal gaps from missing CV content.

## Lifecycle and editor ownership

Coverage sits in a separate read-only panel entered from the right-aligned button in the left editor toolbar, beside Chat and the experience/review mode. On narrow panels the button wraps to its own right-aligned row. Existing chat/discovery nodes and drafts remain mounted. Original ad is still readable, with exact citation highlighting. CV block navigation switches the viewer to current Edited; it does not modify selection/data. On mobile it can use the existing preview modal.

`DiscoveryEditor.openSignal` awaits the existing plan, verifies current context, and reuses the matching current/reserved question. A supplied safe question may fill an otherwise absent topic. Session focus records the prior cursor/batch/phase; preserves round identity, original sources, draft map and queue order; and does not turn answering into CV mutation. Unanswered reserved focus returns to reserve with the same ID. Completed focused sources remain available to existing source-aware Tailor and correction. Native dictation attaches to that same field/identity.

Applicative changes trigger a new coverage assessment with cached ad anchors when valid. Input changes immediately make old results stale. An older result retains its own catalog even while a new catalog loads, so old CV judgments are never shown beside new ad sources. Stale UI disables actions and does not link current-job answers to old signal positions.

State is optional in existing workspace recovery: coverage cache, matching result catalog, active view/filter/open signals. Restored results are fully revalidated against current sources and digests. Missing old coverage state permits first assessment; interrupted/invalid saved requests require explicit retry. No paid request is replayed on reload. If older stale result sources cannot be revalidated, discard that assessment cache, preserve CV/answers and offer retry.

Changing preview mode, zoom, template or un-applied answer does not trigger coverage. Source links are informational only. No personal profile/history/goal inference or new authenticated ownership claim is introduced. Existing client-held data remains the current ownership boundary.

## Executable references

- Shared contract: `webflow/src/cv-coverage-contract.js`.
- Injectable provider/compiler: `backend/cv-coverage.cjs`.
- UI/state/client: `webflow/src/cv-coverage-{client,view}.js`.
- Focus integration: `experience-discovery{,-editor,-ui}.js` and `drafted-editor.js`.
- Simulation: `backend/cv-coverage-fixture.cjs`, explicit known synthetic input only; unknown inputs return Needs review with no invented anchoring.
- Private gateway: `backend/cv-coverage-gateway.cjs`, disabled until approved encrypted credential and persistent budget exist.
- Prepared n8n graph: `backend/n8n-cv-coverage-definition.cjs` and `dev-system/prepared/cv-coverage/receipt.json`.

DEV-189 (2026-11-02): owner-approved private workflow is active on local integration8826. One complete real assessment passed the actual n8n engine after JSON-object output normalization; two earlier requests were rejected. The successful assessment used synthetic, locally anchored catalog input. Real provider-generated ad anchoring after that fix and an initial/post-Apply real comparison remain unverified; the three-request approval is exhausted. Local VM/full-editor tests remain distinct from semantic evaluation. See `dev-system/prepared/cv-coverage/delivery.json` for exact active version, request outcomes and rollback manifests.


## Evidence navigation (DEV-192)

Opening a fresh clearly represented signal locates its validated evidence in the current Edited CV, disables comparison change marks and centers the cited range as far as scroll bounds permit. Find in current CV uses the same path for an individual citation. Exact quote mapping uses ordered data-cv-source text, including pagination and link text; mismatched sources are rejected instead of guessed. All cited text is marked; a large/multiple-page citation centers its first reachable portion. Multiple evidence ranges are marked together. Custom Highlight is preferred; a text-only mark fallback preserves text/geometry. Both treatments are screen-only. Re-render, comparison interaction or stale assessment clears navigation marks. Existing block-selection ownership is unchanged.

The currently deployed provider compiles selected source IDs into full-block quotes. The frontend therefore may mark an entire cited experience description; it does not invent finer evidence from keyword overlap or model explanations. Finer stored quotes can already be rendered by this navigator but require separately prepared/approved backend source granularity and validation, not an implicit new provider call here.


DEV-196 public delivery (2026-11-02): getmedrafted.com now uses the same contract through /api/coverage, with server-only gateway secret and the pre-existing shared public request budget. The dedicated workflow additionally permits the public origin; localhost8826 remains allowed. No assessment schema/model change or new paid semantic evaluation. Current delivery metadata is in site/hosting/current-release.json.
