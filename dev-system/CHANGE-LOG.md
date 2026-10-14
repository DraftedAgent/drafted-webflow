# Development log

Append-only material records. Use consecutive DEV-### IDs. Correct earlier facts through a new linked entry; do not erase history. Do not log trivial commands or include secrets/personal CV content.

## DEV-001

- Date: 2026-10-05 (Europe/Stockholm).
- Task: Discovery and development-control documentation setup.
- Request/source: User's pasted Drafted Development Systems Architect first-run request.
- Systems touched: Local Git/files (inspection + documentation); public GitHub/Pages (read); Webflow plugin (read); scoped local n8n configuration discovery (read).
- Files/workflows/pages affected: Seven new dev-system Markdown files. Home page `69274d654620cf7c511b7508` inspected only; no page/workflow modified. External contracts read only.
- Behavior before: Empty local repository with no development-control area; published Webflow bootstraps GitHub Pages editor; existing remote behavior not locally imported.
- Behavior after: Product behavior unchanged. Evidence, boundaries, access limitations, discrepancy register, future orchestrator design and validation strategy documented.
- Tests/validation: Initial/final Git status and remote config checks; read nine external and ten remote contract/architecture files; verified candidate main HEAD; compared external/remote contracts; served JS matched remote root JS; published HTML bootstrap checked; Webflow site/page/freeform reads succeeded. CMS read schema validation failed. No application/backend execution tests.
- Deployment status: None. No Webflow change/publish, n8n workflow mutation/execution, deployment, commit, or push. No local branch/remote change.
- Unresolved issues: Local intended checkout absent; candidate branch not user-confirmed; n8n management authentication absent; CMS read blocked; contradictory ownership/envelopes; tailor route mismatch; source/root difference needs semantic comparison; build marker not commit identity.

## Future entry fields

DEV-###: date; task; request/source; systems touched; files/workflows/pages affected; behavior before; behavior after; tests/validation; deployment status; unresolved issues.

## DEV-002

- Date: 2026-10-05 (Europe/Stockholm).
- Task: Establish canonical local main checkout, preserve/integrate dev-system, and reassess local implementation.
- Request/source: User confirmed DraftedAgent/drafted-webflow, branch main, and authorized checkout/setup and documentation-only reassessment.
- Systems touched: Local Git/files and GitHub clone/fetch reads. No Webflow/n8n access or mutation in this task.
- Files/workflows/pages affected: Canonical repo files installed unchanged from main; dev-system README, DEVELOPMENT-CONTRACT, SYSTEM-MAP, INTEGRATION-MAP, TEST-STRATEGY updated; this log appended. DECISION-LOG preserved unchanged. No workflow/page affected.
- Behavior before: Workspace held empty Git metadata and seven discovery documents; no canonical product checkout.
- Behavior after: Main tracks origin/main, both `1f80a7aeec32c5b4445922695aabab7af8b62df4`. Seven documents integrated; product behavior unchanged. Existing code/contract mismatches documented, not fixed.
- Tests/validation: Staging clone clean; conflict inventory found only initial .git, no canonical dev-system path. All seven originals preserved and SHA-256 matched after integration. Backup originals and original empty Git metadata retained at `C:/Users/wallg/Documents/ChatGPT/Drafted-checkout-backup-20261005/`. Windows hidden-directory move initially nested clone metadata; corrected with explicit paths/Force, then clean checkout reverified with documents temporarily held outside root before reintegration. Fetch completed; ahead/behind 0/0. Local source/generated diff is only build-token substitution. Re-read local state/validators/callers/proposal/apply/tailor/export/build/contracts. Final tracked diff and untracked-file checks required only dev-system changes. No build or application/backend execution test.
- Deployment status: None. No product file modifications, Webflow changes, n8n changes, publish/deployment, commit, or push. Clone/fetch transfer existing history; they do not create commits.
- Unresolved issues: Authenticated read-only n8n management access still missing; actual workflow IDs/activation/response behavior unknown; prior CMS read limitation remains. Contract conflicts and confirmed frontend drift remain unresolved. GitHub Pages deployment settings/write permissions unknown.

## DEV-003

- Date: 2026-10-05 (Europe/Stockholm).
- Task: Verify user-provisioned official n8n management read access; inventory Drafted workflows and reassess cross-system discrepancies.
- Request/source: User's pasted existing-n8n connection task and confirmation that encrypted credential was saved; GET-only scope.
- Systems touched: n8n Cloud public management API (GET only); local repo reads and dev-system documentation edits; public official n8n capability docs.
- Files/workflows/pages affected: dev-system INTEGRATION-MAP, SYSTEM-MAP, README, TEST-STRATEGY updated; DEV log appended. Six active workflows and five inactive predecessors inspected, none modified. No Webflow page touched.
- Behavior before: Connection blocked on missing authentication; mappings were based on frontend/contracts only.
- Behavior after: Authenticated workflow list/details readable; six frontend routes mapped to active workflow IDs. Tailor route agrees across frontend/backend; rewrite language detection explains omitted language. Static PDF contract/graph/handoff mismatches and rewrite/chat failure limitations recorded. Product/workflow behavior unchanged.
- Tests/validation: GET list returned 23 visible metadata entries, no continuation cursor. Detailed reads restricted to six active Drafted workflows and five obvious predecessors. Saved/active version IDs match for all six. Selected validation/response code and connections inspected without raw snapshot/credential export. No webhook, model, renderer, or workflow execution tests. Tracked product diff remains empty; final untracked changes restricted to seven dev-system documents.
- Deployment status: None. No workflow modified, activated/deactivated, executed or retried; no credentials exposed; no Webflow/product-code changes; no deployment, commit or push.
- Unresolved issues: Contract precedence/apply lifecycle need explicit product decisions; write permissions untested; CMS/deployment configuration limitations remain; test/staging isolation and rollback process needed before approved implementation or production actions. Permanent orchestrator remains design-only.

## DEV-004

- Date: 2026-10-05 (Europe/Stockholm).
- Task: Establish safe execution layer before permanent orchestrator creation.
- Request/source: User's pasted safe-execution-layer request; documentation-only scope with read capability checks.
- Systems touched: Local repo/control docs; Webflow guidance/agent-instruction read and blocked branch-list read; existing encrypted n8n credential scope-metadata inspection in memory only; official public n8n/Webflow documentation.
- Files/workflows/pages affected: Created EXECUTION-PLAYBOOK.md and CONTRACT-DECISIONS.md. Updated DEVELOPMENT-CONTRACT, TEST-STRATEGY, INTEGRATION-MAP, SYSTEM-MAP, README and this log. DECISION-LOG unchanged. No workflow/page changed.
- Behavior before: Read access verified; task-specific safety/staging/snapshot procedures and minimal decision queue not consolidated.
- Behavior after: Defined phased execution, approval/delivery gates, lightweight feature branching, proposed separate read/write credentials, encrypted snapshot/rollback requirements, Webflow staging limits, six synthetic test scenario specs and three owner contract choices. ORCHESTRATOR_READY for gated read/local operation; permanent agent not created and no product contracts revised.
- Tests/validation: Read current docs/code references/Git status. Webflow site guidance empty; list_site_branches schema-rejected, staging not verified. Existing key has no exposed scopes claim, so technical restriction not inferred. Public official scope/staged-content docs checked. Reviewed fixture coverage and task/production boundaries. No executable runner, PDF fixture artifact, application test, workflow execution, branch, snapshot, credential or production mutation created.
- Deployment status: None. No product code or Webflow changes; no n8n definition/activation change; no production credential creation; no deployment/publish, commit or push.
- Unresolved issues: Three pending contract choices; task-specific test-target/rights/snapshot prerequisites; Webflow staging/CMS and GitHub hosted deployment/write verification. These gate affected tasks, not safe orchestrator creation. No formal DD recorded.

## DEV-005

- Date: 2026-10-05 (Europe/Stockholm).
- Task: Orchestrator first-run readiness check under the user's supplied operating instructions.
- Systems touched: Local repository/control documents, GitHub repository metadata and remote main ref, Webflow site list, official n8n management GET workflow list.
- Behavior after: ORCHESTRATOR OPERATIONAL for gated inspection and authorized local work in this chat; no persistent agent installation or technical enforcement claimed.
- Validation: All nine control documents read, plus .cursor/context.md. Local main and live remote main equal 1f80a7aeec32c5b4445922695aabab7af8b62df4; local tracking divergence 0/0; tracked diff empty. Existing untracked dev-system documents preserved. GitHub connector confirms pull=true, push=false. Webflow Drafted site visible. Authenticated n8n GET lists 23 workflows without a continuation cursor; no workflow executions or unrelated workflow contents read.
- Capability limits: GitHub connector cannot push; other Git transport write rights unverified. Separate n8n write credential absent; existing key write scope unverified. Isolated n8n test target not configured. Webflow write/publish permissions and staging remain unverified. No write probes performed.
- Unresolved decisions: CDQ-01 commit/version ownership; CDQ-02 contract profiles/precedence; CDQ-03 output-language policy. These gate dependent changes, not independent read/local work.
- Deployment status: None. Only this local DEV record appended. No product code, contracts, Webflow or n8n modified; no branch, commit, push, publish, activation or deployment. No formal DD created; research boundary preserved.

## DEV-006

- Date: 2026-10-05 (Europe/Stockholm).
- Task: Final delivery-capability audit; read-only integration checks and control-document updates only.
- Systems touched: Local Git/GCM status and encrypted credential use in memory; authenticated GitHub GET user/repository/Pages/protection/rulesets; Webflow guide/pages/custom-code/branch reads and capability discovery; authenticated n8n GET five previously identified inactive workflow definitions; official public documentation.
- Files affected: README, INTEGRATION-MAP, EXECUTION-PLAYBOOK, TEST-STRATEGY and this log only. No new documents/product files.
- Findings: GCM account ManPanther authenticates but repository push=false; local Git branch/commit capability and identity exist. gh absent; no usable conventional SSH setup or named token environment path established. Pages source main at /, legacy build. Rulesets zero; protection GET 404 does not conclusively establish absence. Webflow page/custom-code reads work; page branches explicitly rejected for non-Enterprise plan, Releases and CMS reads schema-rejected. Write/publish tools advertised, effective rights unknown. n8n write credential absent; five inactive candidates re-read, model/external effects remain.
- Result: CONTROL_PLANE_SETUP_REQUIRED. Documented smallest existing inactive-copy fixture strategy, separate minimal write scopes/DPAPI storage, complete encrypted raw-definition snapshots with hashes/provenance and exact same-ID saved/live rollback procedure. Specifications are finalized; helper implementation and rollback rehearsal were not performed. No scope enforcement, execution rights or restoration success claimed.
- Remaining setup: Git repository write authorization for current GCM account (or browser login as authorized account); separately stored n8n write key with verified effective boundary; authenticated n8n editor session for automated inactive test arming; Webflow admin review of write/publish authorization and CMS connector read-schema repair. Enterprise Webflow upgrade and separate n8n environment are not required by the recommended path. Existing CDQ decisions remain task-specific gates.
- Validation: Current docs/instructions read; credential values withheld, API GET outputs filtered to safe metadata; checked documented scope/test listener behavior. No authentication login/key creation/write probe, product/backend test execution, mutation, activation, PR, push, merge, publish or deployment. Final tracked diff empty; untracked paths restricted to existing dev-system directory. Documentation-only updates preserve earlier records; no formal DD created or research accessed.

## DEV-007

- Date: 2026-10-05 (Europe/Stockholm).
- Task: Adopt owner-confirmed verified GitHub delivery capability and mandatory main governance.
- Source/evidence: User confirmed ManPanther write access and accepted invitation; preceding read-only local GCM verification authenticated ManPanther, reported pull/push/triage=true, repo/workflow OAuth scopes, all merge methods enabled, main protected=false and no rulesets. User explicitly adopted READ/BRANCH PUSH/PR CREATION VERIFIED and MERGE AVAILABLE with explicit production approval required. No refresh needed. Verified means permissions/state, not an executed push/PR/merge test.
- Files affected: INTEGRATION-MAP (current matrix, historical audit labelled), README, EXECUTION-PLAYBOOK, DEVELOPMENT-CONTRACT and this log. No new documentation or product files.
- Behavior before/after: Earlier GitHub write blocker superseded; existing GCM HTTPS plus same-credential REST delivery path available. Main remains technically unprotected but logically protected by mandatory codex/<task> development, explicit owner-approved merges, diff/validation inspection, production gates and no force push/history rewriting. Earlier direct-main exception removed.
- Validation: Reviewed local document changes for consistent capability/protection wording and preserved historical DEV records. Tracked product diff empty; untracked paths limited to existing dev-system files. No remote calls required in this documentation task.
- Deployment status: None. No product code, repository settings/rulesets, credentials, remote branches, PRs, pushes, merges, external systems or production state changed. No formal DD created.
- Remaining issues: CONTROL_PLANE_SETUP_REQUIRED for existing n8n write/test and Webflow authorization/CMS gaps; no GitHub authentication setup remains. Contract decision queue unchanged.

## DEV-008

- Date: 2026-10-05 (Europe/Stockholm).
- Task/source: Owner correction: existing encrypted full-access Drafted n8n key is intentionally authorized for Drafted development; no separate credential setup needed.
- Files affected: INTEGRATION-MAP capability matrix, EXECUTION-PLAYBOOK, DEVELOPMENT-CONTRACT, README, TEST-STRATEGY and this log only.
- State: N8N READ VERIFIED; WORKFLOW WRITE AVAILABLE/GATED; CREATE AVAILABLE for explicit approved task need; ACTIVATE/DEACTIVATE AVAILABLE but ALWAYS owner-approved; destructive actions ALWAYS approved; production execution GATED. Historical separate-key requirements superseded, not silently treated as current prerequisites. No write/execution test performed; capability is owner-confirmed.
- Mandatory gates: Before every workflow mutation save/verify complete encrypted rollback snapshot, record workflow ID/current state, avoid unrelated changes and validate resulting definition. Test mechanism/isolation are task-specific checks, not credential setup blockers. Existing Git/main governance unchanged.
- Overall: CONTROL_PLANE_SETUP_REQUIRED only for remaining Webflow access/capability verification, including CMS read-schema restriction. Ready for a real authorized product task, with affected contract/production gates applied as needed.
- Validation/deployment: Documentation consistency checked; tracked product diff empty; no product files, credentials or external state changed. No workflow mutation/execution, remote delivery, publish, production action or formal DD.

## DEV-009

- Date: 2026-10-07 (Europe/Stockholm).
- Task/source: User requested clearly marked example conversation before upload and complete removal of example text when own CV/Tailor UI appears; supplied two reference screenshots.
- Classification/systems: UI/presentation and frontend bug fix; local JS/CSS and generated GitHub Pages assets. No backend/API/schema/architecture change and no dependent CDQ decision.
- Baseline: main/origin main equal 1f80a7aeec32c5b4445922695aabab7af8b62df4 after fetch; tracked checkout clean, existing untracked dev-system documents preserved. Created local codex/editor-demo-state branch before product edits. Published Home HTML read-only shows two static example message nodes; upload handler separately reintroduced the same greeting after clearing chat.
- Files: webflow/src/drafted-editor.js; webflow/src/css/components/chat.css; generated drafted-editor.js/css and both latest.json pointers; SYSTEM-MAP updated and this log appended. Ignored webflow/dist regenerated. No Webflow or n8n mutation.
- Behavior: Existing static messages wrapped in dashed neutral demo frame with Example conversation heading and explicit This is a demo guidance; not included in actual chat history. Successful CV upload removes demo and stops reinserting sample greeting, keeping chat clear for real conversation and existing Tailor readiness. Failed first upload retains example; repeated upload cannot restore it.
- Validation: JS syntax checks pass; standard build passes with no missing/unparsed-import warning; diff whitespace check passes. Temporary Playwright harness against read-only published Home DOM, static Webflow CSS and local built assets uses installed headless Edge, blocks all external requests and substitutes deterministic synthetic upload responses. Nine checks pass: labelled initial demo, two example nodes outside chatHistory, demo width fits 390px viewport, failed first upload preserves demo, successful upload clears every example, Tailor ready with CV+jobContext, fixture CV render, real chat append, repeated upload clears chat without demo. No production webhook/model/renderer run. Initial bundled Chromium unavailable; used existing Edge. Test initially expected CV text without title, corrected fixture assertion to match existing rendering; no implementation defect inferred. Desktop before/after screenshots visually inspected. Mobile width checked; full mobile visual availability remains limited by pre-existing snap/card layout collapsing the chat region at 390x844, outside this change. Test script/screenshots retained under user TEMP as drafted-demo-check.cjs and drafted-demo-before/mobile/after.png (synthetic content only).
- Candidate/deployment: Local build 2026-10-07-editor-demo; no commit, push, PR, main merge, deployment or publish. Publishing requires approved GitHub Pages main delivery; bounded fix needs no Webflow/n8n edits. Prior assets/latest are recoverable at baseline Git SHA; rollback via restoring exact prior root assets and latest pointer in a new owner-approved main delivery, never force push/history rewriting. Live verification would check served marker/JS/CSS and demo transition after approval.
- Decisions: No formal DD; no product-contract changes; research boundary preserved. Ready for local review; production approval still required by EXECUTION-PLAYBOOK.

## DEV-010

- Date: 2026-10-14 (Europe/Stockholm).
- Task/source: Owner explicitly approved GitHub delivery and main merge/Pages deployment of DEV-009 editor-demo fix by replying ja to the concrete production approval request.
- Scope: Six product/source/generated asset files only; all previously untracked dev-system documentation preserved locally and excluded from commit. No Webflow/n8n mutation or production execution.
- Validation: Re-read execution gates; confirmed branch/main baseline unchanged, existing GCM push permission and Pages main-at-root configuration; only active GitHub workflow is dynamic Pages deployment. Reviewed full source diff, staged six-file diff and whitespace validation; reran nine isolated browser checks, all passing.
- Delivery: Commit c3c1a8acc30ec0597e6f6c92816bb302612892c9 pushed to codex/editor-demo-state; PR https://github.com/DraftedAgent/drafted-webflow/pull/1 created via existing GCM-authenticated REST API and attached to chat. Verified PR exact head, original main base, mergeable=true/clean and six intended files. Owner-approved merge produced e2793a5a9871fda288fa29ca7afca6212d0b75b2. No force push/history rewrite; no auto-merge enabled.
- Deployment/verification: GitHub Pages run 38617158539 deploys merge SHA. Served latest.json now reports 2026-10-07-editor-demo; served JS contains Example conversation and no appendChat assistant greeting; served CSS contains demo styles. Fresh published Webflow HTML plus actual served JS/CSS passed all nine isolated Edge checks again with synthetic upload responses and external network blocked. No actual user CV/model/renderer execution performed. Previously noted mobile layout limitation unchanged.
- Rollback: Prior assets/latest at 1f80a7aeec32c5b4445922695aabab7af8b62df4 and marker 2026-02-20-1512 retained in Git history. If needed, restore bounded files through a new approved branch/PR/main delivery, never rewrite main history. No rollback needed.
- Outcome: Approved demo fix live; control log updated locally. No contract decisions or unrelated edits included.

## DEV-011

- Date: 2026-10-14 (Europe/Stockholm).
- Task/source: Side-conversation owner request to document an experience-question flow using existing ad signals, with simple, natural conversational language. Documentation-only scope; inherited parent deployment authorization not used.
- Files affected: New dev-system/EXPERIENCE-DISCOVERY-FLOW.md; small links/status additions in README, SYSTEM-MAP, TEST-STRATEGY and this log. Existing parent work preserved. New standalone specification needed because current Tailor/chat contracts cannot represent the cross-flow question/confirmation lifecycle without implying unapproved schema changes.
- Findings: Existing frontend extracts jobContext from jobAdText alone and combines it with canonical blocks for Tailor. sendChat lacks structured jobContext and a separate confirmed-answer context; recent history is truncated. Relevant local contracts/code inspected; current n8n prompts not re-read and no live behavior inferred from a proposed flow.
- Result: Documented opt-in pre-tailoring questions, at most three topics shown one at a time, existing-data path, neutral no/skip handling, short examples/follow-ups, fact confirmation separate from CV commit, temporary provenance/correction/context-change handling, plain Swedish/English tone examples and eight future acceptance scenarios. No RAG/persistent profile promised. Existing CDQ-01/02/03 remain pending; no external contract altered. Possible design decision detected: separate confirmed experience from selected CV representation; documented as implementation-planning consideration, no formal DD record created.
- Validation: Checked new specification links and consistency with current jobcontext/Tailor/advisory-chat contracts; confirmed product tracked diff remains empty and Git branch unchanged. Scenarios are specified, not executed tests.
- Delivery/deployment: Local documentation only; no source/build/credential/Git-state mutation, commit/push/PR, external call, workflow modification/execution, publish or deployment. Ready as planning input; technical schema/transport and live prompt inspection precede implementation.

## DEV-012

- Date: 2026-10-14 (Europe/Stockholm).
- Task/source: Owner wants to continue from another ChatGPT/Codex account using GitHub-held documentation rather than inherited chat history.
- Baseline: dev-system documents are all untracked locally; they were excluded from prior product delivery. Existing checkout remains codex/editor-demo-state; no product diff. Documentation delivery therefore required to make prior control state available remotely.
- Scope: Snapshot all dev-system Markdown documents, root README navigation and concise AGENTS.md startup/governance instructions onto separate codex/portable-control-plane GitHub branch/PR. No product source/assets/settings/workflow mutations; no local branch/index/checkout changes. Existing parent work preserved.
- Portability: Added new-account startup, latest shipped/planned work, repo-relative contracts and fresh access checks. GitHub carries documents/code, not credentials, GCM sessions, DPAPI snapshots or temporary test artefacts. Historical local paths and approvals are not portable prerequisites or permission to repeat actions. n8n/Webflow access needs separate secure configuration when required.
- Validation: Check exact documentation-only remote commit paths, relative links, no secret-token patterns, no personal CV content and read-back branch/PR. No product runtime testing required for documentation. Main remains logically protected.
- Delivery gate: Branch/PR publication within requested documentation scope; main merge not authorized in this side conversation and will be requested on the concrete PR. GitHub Pages source remains main at /; no deployment intended or performed by branch publication.
- DEV-012 delivery result: Documentation-only commit 679dcef5f44ea825972c0761959f6ce5a7acd396 published to codex/portable-control-plane from remote main e2793a5a9871fda288fa29ca7afca6212d0b75b2 via existing secure GCM-authenticated GitHub REST path; PR https://github.com/DraftedAgent/drafted-webflow/pull/2 created and attached. Twelve exact expected Markdown paths verified in remote compare; relative links and secret-pattern checks passed. Local parent branch/index/checkout unchanged. Main not merged; documentation currently accessible on PR branch, not main. This delivery-result line is a local post-publication record, not included in that commit.

## DEV-013

- Date: 2026-10-14 (Europe/Stockholm).
- Task/source: Owner requested counted sequential questions (e.g. 1/7 through 7/7), short natural questions with room for long replies and explicit preparation for future professional profile/RAG; authorized upload of updated documentation.
- Changes: EXPERIENCE-DISCOVERY-FLOW now derives actual unique topic count, communicates unclear CV evidence without claiming missing competence, defines progress/follow-up/skip/covered-topic/end behavior, removes earlier three-topic cap, and specifies long-source-answer handling. Added design requirements for separate experience/source/confirmation/revision identity, future user-scoped retrieval, deduplication/correction/deletion, and separate consent for persistent profile. README, SYSTEM-MAP and TEST-STRATEGY aligned; eleven future acceptance scenarios. Historical DEV-011 record preserved.
- Architecture: Possible design decision detected. Owner explicitly approved RAG preparation; implementation/storage/API schema and existing CDQ choices not silently resolved. No formal DD record, database, embeddings, profile, code or live workflow change.
- Delivery scope: Update existing codex/portable-control-plane branch and PR #2 with five Markdown files only using existing secure GitHub authentication. Upload approval is not main-merge/production approval; main remains unchanged. Correction to prior DEV-012 wording: PR link exists, but app attachment attempt returned thread-not-found in this side conversation; no successful attachment claimed.
- Validation: Relative-document links, intended paths and secret patterns checked; remote content read-back to be verified. Documented scenarios are not executed product tests. Local parent branch/index/checkout preserved.
