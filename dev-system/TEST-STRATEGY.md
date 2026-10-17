# Validation strategy

DEV-015: 21 kombinerade sessions/transporttester och browserövergångar passerar. Nya discovery-transporttester täcker verklig localhost-HTTP, återanvänt befintligt jobContext, grupperade fixturekrav/antal, full lång källtext, innan-modell-invalid/oversize, strict svarsbinding, cite/coveredQuestion-validering, tom extraktion utan hallucination, retries med samma revision, stale plan/interpret, CV-oföränderlighet och isolerad VM av genererade n8n-Code-gater. `discovery-http.browser.cjs` kör hela UI över lokal HTTP i mobilviewport: cirka 40000 tecken, modellfailure -> bevarad text -> retry, individuell bekräftelse, progress, nej/skip/rättelse utan CV-mutation; inga utgående nätverksanrop. Tidigare statiska browserkontroller passerar också. Verklig LLM-frågerelevans/promptkvalitet, n8n-testlistener/runtime och produktion är INTE testade. Inaktiv skapad definition/hash/anslutningar verifierade via GET; det ersätter inte executionstest. Ingen fråga om CV-versionägarskap/permanent RAG är löst av denna profil.

DEV-014 lokal verifiering: tests/experience-discovery.test.cjs har 12 passerade tester för fast kö, högst en följdfråga, fulla långa källsvar, individuell bekräftelse, övergräns utan kapning, nej/vet inte/överhoppat, referensgrundat CV-stöd, signalgruppering, inga keyword-only-frågor, källcitat, senare täckta frågor, rättelser med stabil identitet/revision, inaktiva förslag, stale svar/kontext, nollfrågor och ingen automatisk återanvändning. tests/experience-discovery.browser.cjs passerade isolerat i Edge: 1/7 och samma nummer vid följdfråga, lång text, bekräftelse, bevarad övergränstext, hopp/nej/vet inte, tidigt avslut, rättelse, kontext/språk och mobilbredd. Inga externa requests. Preview är mockad; backendanalys/AI-kvalitet/transport, CV-commit/versionering, slutlig språkdefault och permanent RAG/profil har INTE verifierats och får inte rapporteras som passerade acceptansscenarier. Kandidatens språk väljs uttryckligen; befintlig CV-språkrouting är oförändrad.

DEV-011/013 tillägg: [EXPERIENCE-DISCOVERY-FLOW.md](EXPERIENCE-DISCOVERY-FLOW.md) innehåller elva ännu inte körda acceptansscenarier för frågeval, enkelt samtalsspråk, räknad frågekö/progress, långa svar, bekräftade källspårbara erfarenheter, framtida profil/RAG, hoppa över, rättelser, kontextbyte och icke-destruktiv CV-hantering. Använd dessa vid senare implementation; kontraktsberoende assertions behåller CDQ-gaterna och får inte rapporteras som passerade nu. Framtida bestående profil/retrieval kräver egen integrationstestning och dataåtkomstgräns, inte ett påstående om redan fungerande RAG.

DEV-008 capability correction: the existing encrypted full-access n8n key is owner-authorized for development; no separate write key or test-environment setup is a readiness prerequisite. Test isolation, supported listener/session access, synthetic fixture execution and mandatory rollback snapshots are checked for the concrete task. Do not perform production execution or activation/deactivation without explicit applicable approval. No workflows were modified/executed to establish this state.

## Smallest isolated n8n strategy (DEV-006)

No test infrastructure created or execution performed. Prefer existing inactive, non-production copies: Q5EYspCf7zcd1RUB (Main-UploadPreview copy) is a candidate for upload after approved snapshot/repurposing. Its model nodes still call external services. Inactive does not mean isolated. Legacy copies cannot validate current unrelated flows. WmXWs06zquBMjPoY has Gmail/Google Docs effects and must not be used unchanged.

For a later explicitly authorized test task: inspect full candidate and dependencies, snapshot it, verify no other user relies on it, preserve active=false, use unique test-only webhook paths, remove/replace all model/renderer/email/document/HTTP/subworkflow side effects with deterministic fixtures, remove unneeded production credential references, and prove no path reaches production assets/webhooks or external actions. Block network in local frontend tests; intercept all six production routes. Synthetic data alone does not isolate a workflow. Prefer mocks for contract/state tests; real-model/renderer integration requires its own bounded test scope.

If no suitable existing copy matches the affected current flow, create an explicitly approved inactive clone of that flow; do not maintain a duplicate environment for every workflow preemptively. Test URL calls work only after Listen for Test Event/Execute workflow arms the listener, and can run while inactive ([official webhook documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)). API write access alone does not arm that listener; no supported public initial-run endpoint was verified. For automation without manual copying, use an existing authenticated browser/editor session to arm the isolated copy only after approved test scope and verified UI control. If unavailable, user signs into the existing n8n browser once; session availability/control still must be checked. Do not invent a private API execution bridge or activate a clone silently. If editor execution cannot safely be automated, report that residual gap; only then consider a bounded approved staging activation or a separate environment if isolation genuinely requires it.

No activation permission is needed for the preferred inactive test-listener approach. No separate n8n instance, Webflow Enterprise upgrade or permanent active test endpoints are recommended at this stage. Webflow page-branch preview returned non-Enterprise 403; use local preview with isolated assets/endpoints instead. Existing network-blocked fixture runner still needs implementation within the first relevant development task, not user manual setup.

No test suite, package manifest, CI workflow, fixture directory, or n8n workflow export was found in the canonical local tree during DEV-002. Browser runtime validators exist in drafted-editor.js. Static inspection and exact Git/product-file checks were completed; no application/backend execution tests or build were run. This is a staged strategy, not a new framework.

## Before implementation

Canonical local main checkout is established. Before implementation, recheck Git state, establish deployed asset version and secure integration access, and identify the relevant authoritative contract. Record ambiguous contract interpretations before writing assertions. Use synthetic/anonymized CV fixtures; do not commit personal data or credentials.

## Local checks

- Validate base blocks, typed metadata, schema version, stable/unique IDs, finite order, ordering, unknown-type preservation and explicit removals. Check that rewrites affect only selected text and preserve metadata/IDs.
- Test strict success/failure envelopes, no error field on success, malformed JSON, unexpected fields, missing fields, unsupported schema versions, duplicate IDs and backend ok=false. Separate CV/chat/job-context/PDF contracts after ambiguity is resolved.
- Unit-test meaningful state transitions: proposal remains detached where approved, apply requires explicit action, dismiss restores state, failed requests preserve state, stale requests do not override newer state, and version conflicts cannot apply obsolete proposals.
- Use fixtures for Swedish/English, sparse CV, unknown blocks, long sections, duplicate IDs, missing metadata, job descriptions and missing jobContext. Do not assume a fixture CV captures all professional capacity.
- Verify build output, source/root parity and latest marker; missing imports must be surfaced. Compare generated assets against the intended served version before deployment.
- Target newly confirmed local paths: canonical text changes during buildStateFromBlocks, direct Apply missing language, export during proposal preview, and successful non-PDF MIME handling. Verify behavior with mocks/fixtures before proposing fixes; do not mutate production to prove these findings.

## Integration and UI checks

Use mock responses or an approved staging backend first. Production webhook calls may create executions/model costs and are not read-only. Test upload multipart, rewrite selected/full scope, advisory chat, job-context extraction and request races, tailor, proposal preview/apply/dismiss, and failure recovery. Confirm frontend/backend ownership and exact endpoint paths.

Webflow UI checks require actual DOM inspection: required IDs, event binding, desktop/mobile layout, selection, accessibility, loading/error states and artifact loading. Avoid real CV content in screenshots/logs. Verify preview does not accidentally feed committed-state operations such as export or tailor unless explicitly designed.

n8n checks require authenticated read-only inventory first, then approved test/staging executions. Validate input/output gates, error branches, model-output parsing, canonical-node ownership, node versions and activation state. Never activate/deactivate or modify production workflows as a test.

DEV-003 completed authenticated inventory and identified matching saved/active version IDs for six current workflows. Next validation must use an explicitly approved isolated test plan: rewrite invalid inputs/error short-circuit and version semantics; chat unusable model output; PDF normalized-input handoff, error-path bypasses, duplicate edges, exact JSON envelope/status, bounds/template allowlist and binary validity. No production executions have been approved or performed. Static mismatch evidence is sufficient to document issues, not to claim end-to-end test results.

PDF checks: validate request bounds/template allowlist, JSON error statuses/shape, binary success MIME and valid PDF bytes; render pages for visual QA, check text/order/metadata, pagination and long content, and prove editor state is unchanged. Compare reproducibility with a fixed renderer/template, including metadata effects on byte equality. Do not accept partial PDFs.

## Production gate

Report candidate commit/build, tested scenarios, unresolved limitations, exact production diff and rollback plan. Obtain explicit approval for Webflow publication, GitHub Pages asset deployment, n8n mutations/activation and any production test execution. After approval and execution, verify live version and behavior, append DEV outcome, and distinguish failed/unknown deployment from success. Scope checks to the change; do not build a giant framework during discovery.

## Minimum baseline scenario specifications (DEV-004)

This baseline is a reviewable set of synthetic fixture/scenario definitions, not an executable suite or new product contract. No runner, PDF fixture file, production request or test workflow was created. Future implementation starts with these six checks, adds only tests needed by the requested change, and reports pending/blocked tests honestly. It must never report BLOCKED_BY_CONTRACT_DECISION as passed.

Shared fixture F-CV-EN (one selected representation, not a whole career): schema 1.0, cvVersionId `fixture_cv_001`, cvTitle `Alex Example — Product`, language en. Four ordered blocks:

```json
[
  {"blockId":"summary_01","type":"summary","label":"Summary","order":10,"text":"Product specialist with delivery experience."},
  {"blockId":"experience_01","type":"experience","label":"Experience","order":30,"text":"Reduced onboarding steps from five to three.","employer":"Example Studio","title":"Product Specialist","startDate":"Jan 2022","endDate":"Dec 2024"},
  {"blockId":"education_01","type":"education","label":"Education","order":200,"text":"Studied systems design.","institution":"Example University","degree":"BSc","program":"Information Systems","startDate":"2018","endDate":"2021"},
  {"blockId":"custom_01","type":"portfolioNotes","label":"Portfolio","order":300,"text":"Community workshop facilitator."}
]
```

F-CV-SV uses the same IDs/metadata/order with Swedish summary/description strings and language sv. F-TEXT-PRESERVE changes experience text to `"  First line.\n\nSecond line.  "` for exact-content preservation. These are invented people/organizations, no real CV data. Invalid variants: duplicate blockId, non-string text, absent blocks/version, unknown selected ID, and an unrelated-field response. Add no fabricated experience when operating on either fixture.

F-JOB: a synthetic job ad, "Product specialist: improve onboarding; collaborate with design and engineering; measure activation. Clear communication required." F-JOBCONTEXT matches existing schema 1.0, language en, with roleTitle Product Specialist; seniority mid; surfaces [app]; topPriorities [{signal: Improve onboarding, weight:5}]; mustHave [Product delivery, Clear communication]; successMetrics [Activation rate]; keywords [product, onboarding, activation, delivery, design, engineering, metrics, collaboration, communication, prioritization]; tone clear. Use the documented fields, not an invented new schema. F-ERROR contains malformed model JSON or no usable output; fixture response profiles remain gated below.

### A. Upload CV

Input: one-page synthetic PDF rendered from F-CV-EN facts (and SV variant), multipart field file plus optional targetRole. Invalid case: non-PDF or empty file. Deterministic mock parser/model outputs protect known factual metadata without expecting live LLM wording.

Expected shape: success CV envelope in current block/response contracts (ok, blocksSchemaVersion 1.0, cvVersionId, cvTitle, summaryOfChanges, nonempty blocks, rewrittenCv, rewrittenCvLegacy; no contractError). Initial IDs derive deterministically from parsed facts, not fixed model-invented IDs; once assigned they remain stable in B–F. Exact failure profile: BLOCKED_BY_CONTRACT_DECISION CDQ-02 where flow examples conflict with general envelope.

Canonical invariants: facts preserved, unknown type round-tripped where present, order deterministic, metadata not duplicated into description, joined text derived, no hidden client sanitization of already canonical output. Failure leaves prior editor state intact; no partial replacement. Frontend+n8n integration required before release; first local mock, then explicitly approved isolated synthetic upload.

### B. Editor chat

Input: F-CV-EN, message "Suggest a clearer first experience bullet without inventing facts", language en, activeContext blocks, selectedBlockIds [experience_01]. Invalid cases: empty message and F-ERROR.

Expected shape: advisory chat success message, optional suggestion/proposal; current implemented profile is documented in SYSTEM-MAP. Exact normative envelope/metadata and error profile: BLOCKED_BY_CONTRACT_DECISION CDQ-02. Regardless of profile, no state mutation before an explicit subsequent Apply.

Canonical invariants: byte-equivalent blocks/text/IDs/version before and after chat; advice does not assert unprovided professional facts. Failure is visible and preserves state; absent/malformed model output must not be marked as usable success. Frontend+n8n integration required for release; mock response first, isolated model-output fixture next.

### C. Editor rewrite

Input: F-CV-EN, mode blocks, selectedBlockIds [experience_01], instruction "Make the sentence shorter without changing its facts", language en. Full-mode companion uses all blocks; unknown-ID failure variant and EN/SV context conflict variant included.

Expected shape: currently implemented full CV envelope; architecture's detached proposal profile is BLOCKED_BY_CONTRACT_DECISION CDQ-01/CDQ-02. Output language precedence: BLOCKED_BY_CONTRACT_DECISION CDQ-03.

Canonical invariants: exact same block IDs/type/order/metadata, only selected text changes in selected mode, unknown block preserved, no unrequested new facts. Failure stops model/apply path and does not partially replace state. Version-issuance expectation is blocked by CDQ-01; never invent it. Frontend+n8n integration required for release, using deterministic model fixtures in isolation.

### D. Proposal Apply / direct Apply

Input: F-CV-EN plus pending proposal changing only experience_01 text; record pre-state. Exercises preview -> dismiss, preview -> Apply, direct instruction -> Apply, stale base-version proposal and F-TEXT-PRESERVE.

Expected shape/commit location/new-version policy: BLOCKED_BY_CONTRACT_DECISION CDQ-01; exact rewrite/error envelope follows CDQ-02. Baseline invariants do not wait: chat alone cannot commit; explicit Apply affects only intended representation; dismiss restores exact pre-state; preview cannot silently alter committed export/input; text preservation is exact except for the approved content change. No latent capacity model is inferred from this selected CV.

Failure: conflicting version/invalid proposal must not partially apply. Exact conflict response profile remains pending CDQ-01/CDQ-02. Pure local proposal tests do not need n8n; direct Apply and suggestion-to-rewrite integration do require an isolated frontend+n8n check before release.

### E. Tailor with jobContext

Input: F-CV-EN plus F-JOB/F-JOBCONTEXT, block and jobContext schema 1.0, language en, explicit Tailor click. Invalid case: missing jobContext and unsupported schema. Current matching endpoint is tailor-cv; do not use a production webhook in tests.

Expected shape: implemented CV envelope; proposal-first versus direct-authorized commit and version handling are BLOCKED_BY_CONTRACT_DECISION CDQ-01. Exact normative error shape CDQ-02; requested output language precedence CDQ-03.

Canonical invariants: preserve IDs, metadata and facts; reframe only provided experience; unchanged unknown blocks survive; job input is contextual, never evidence that unlisted experience does not exist. No action before user click. Failure preserves entire pre-state. Frontend+n8n integration required before release; deterministic tailor output/guard fixtures and isolated dependencies first.

### F. PDF export

Input: committed F-CV-EN (then SV), cvVersionId/cvTitle, templateId classic_v1, language and full blocks. Invalid variants: duplicate IDs, forbidden template, oversized text/payload, absent language, successful HTTP with non-PDF MIME/bytes, render failure. Also try export while D is previewing and verify committed-state source, not implicit preview commit.

Expected shape: binary application/pdf success, no JSON success; error exact ok:false/structured contractError with appropriate 400/500 under locked export-contract. Competing string-error example and minimum-schema/profile precedence are BLOCKED_BY_CONTRACT_DECISION CDQ-02; shared-state ownership ties to CDQ-01. Existing locked bounds and no-partial-output guarantees can be checked without inventing defaults.

Canonical invariants: export never changes blocks/IDs/version, reflects exactly chosen committed representation and preserves ordered facts/metadata. Renderer/template fixed for reproducibility checks; no AI generation. Failure downloads nothing and cannot alter editor state. Frontend+n8n+renderer integration and rendered-page verification required for release, using mocked renderer first and approved isolated renderer credentials later. Known normalized handoff, bypass edges and error-helper leak are existing static failures, not passing tests.

Minimum execution plan: six happy scenarios plus failure variants above through a network-blocked local harness; then only changed flows on an approved isolated target. Contract-blocked assertions remain reported explicitly. No browser may run this baseline with its current production endpoint constants un-intercepted.
