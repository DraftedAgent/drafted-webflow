# Integration access

## Current capability matrix and governance (DEV-008; Git verification DEV-007)

Owner decision, 2026-10-05: existing encrypted Drafted n8n API key has full access and is intentionally authorized for Drafted development. N8N READ: VERIFIED; WORKFLOW WRITE: AVAILABLE, GATED; CREATE: AVAILABLE when explicitly required by an approved task; ACTIVATE/DEACTIVATE: AVAILABLE but ALWAYS explicit owner approval; DESTRUCTIVE ACTIONS: ALWAYS explicit approval; PRODUCTION EXECUTION: GATED. No separate write credential or new authorization setup is required. This supersedes all older n8n setup-incomplete/key-separation requirements below; capability is owner-confirmed, not verified through a mutation test. Existing encrypted credential remains default, with safe in-memory handling. Before every workflow mutation save and verify rollback snapshot, record workflow ID/current state, avoid unrelated changes and validate resulting definition. Test isolation, snapshot readiness and supported execution mechanisms are task-specific checks, not missing n8n credential setup.

2026-10-05. Supersedes all earlier GitHub write limitations below. Existing local HTTPS Git Credential Manager authentication as ManPanther is VERIFIED: authenticated GET reports pull=true, push=true, triage=true, admin=false, maintain=false; OAuth scopes include repo and workflow. Main branch metadata reports protected=false; repository rulesets list is empty. Existing credential recognizes accepted write access; no refresh is required. No push, PR or merge was performed: VERIFIED below means permission verification and the owner's explicitly adopted capability state, not an executed delivery test. Connector permissions are independent; use local GCM for push and GitHub REST API with the same in-memory credential for PR/approved merge where connector rights are insufficient.

| System | Read | Local/Stage Write | Production Write | Missing Setup |
|---|---|---|---|---|
| Git/GitHub | VERIFIED | Local branches/commits available; BRANCH PUSH: VERIFIED; PR CREATION: VERIFIED | MERGE: AVAILABLE, EXPLICIT PRODUCTION APPROVAL REQUIRED | None for GitHub authentication/write authorization |
| Webflow | Page/custom-code reads verified; CMS read schema-blocked | Write tools available, effective rights UNKNOWN; local preview available; page branching unavailable | Publish tool available, effective rights UNKNOWN; explicit approval required | Authorization review and CMS connector read-schema repair |
| n8n | VERIFIED | WORKFLOW WRITE: AVAILABLE, GATED; CREATE: AVAILABLE when explicitly required by approved task | ACTIVATE/DEACTIVATE: AVAILABLE, always owner approval; destructive actions always approval; production execution gated | None for credential/access setup; snapshot/validation/isolation gates apply per task |

Main is logically protected by governance, without GitHub technical enforcement. Never develop material changes directly on main; always use codex/<task>. Never merge to main without explicit owner approval. Inspect the exact candidate diff and validation results before merge; if the candidate changes, revalidate and confirm approval still covers it. Production-affecting merges remain gated because Pages deploys main at /. Never force-push to main or rewrite main history. This capability update grants no delivery or production approval and changes no repository settings. Overall CONTROL_PLANE_SETUP_REQUIRED remains solely for unresolved Webflow access/capability verification, including CMS connector read-schema limits. Ready for an authorized real product development task; check affected contracts and task-specific execution gates before dependent actions.

## Historical delivery-capability audit (DEV-006; Git state superseded by DEV-007)

2026-10-05: **CONTROL_PLANE_SETUP_REQUIRED** for the complete delivery lifecycle. Safe inspection/local work remains operational. No external mutation, authentication setup, workflow execution, push or PR occurred in this audit.

### Git/GitHub delivery

Git 2.53.0 and Git Credential Manager 2.7.3 are installed; HTTPS origin uses credential.helper=manager. Existing securely stored credential authenticates as ManPanther. Authenticated GitHub GET repository metadata reports pull=true, push=false, admin=false, maintain=false. Thus authentication exists, but the current credential cannot deliver codex/* branches or merge in this repository. GitHub connector also reported push=false in DEV-005. GitHub CLI is absent; GH_TOKEN/GITHUB_TOKEN are absent. SSH executable exists, but no active agent, SSH config or public-key files were found in the conventional user directory; no usable alternate SSH path is established. No private keys or credential values were displayed. Credential resolution was noninteractive and used only authenticated GETs afterward; no remote ref operation was attempted.

Local branches and local commits are available; commit name/email are configured. No branch or commit was created. PR/merge endpoints exist through the connector and GitHub REST API, but current authenticated remote delivery rights are not established. Future path: existing HTTPS GCM for branch push; connector if authorized, otherwise REST API with the same credential resolved in memory for PR creation and approved merge. No gh installation is necessary. Repository/token rights must be rechecked separately for contents delivery and PR management; never claim a successful push/PR from metadata alone.

Minimal setup: repository owner grants ManPanther collaborator write access and the user accepts the invitation. Alternatively, authenticate an already authorized account through `git credential-manager github login --username <authorized-account> --browser`; select that account for this repository and verify it, preserving unrelated credentials. If current OAuth authorization then lacks needed API rights, reauthorize through the browser; a repository-scoped fine-grained token with Contents and Pull requests read/write is a fallback stored through a protected credential UI, never chat or command-line token arguments. This is not authorization to push now.

Authenticated GET Pages configuration is readable: build_type=legacy, source main at /. Therefore codex/* is not the configured Pages source; changes merged/pushed to main can deploy root assets. Recheck automation before future delivery. Ruleset list returned zero; main branch-protection read returned 404 (absence versus visibility not conclusively distinguishable). Keep main protected procedurally; do not infer technical enforcement. Production-affecting main delivery requires concrete approval and post-deploy served-asset verification.

### Webflow delivery

Site/page/custom-code reads work. Home page list returns canBranch=true, but actual list_branches returns 403 not_enterprise_plan_site. Actual entitlement overrides that metadata hint. Page branching/branch preview is unavailable without Enterprise; no upgrade is recommended for this lifecycle. Releases list_site_branches remains connector-schema rejected; it is not a usable preview path. Local isolated HTML/asset preview is available and is the default.

WRITE_AVAILABLE: tool surface advertises page settings/content, headless elements/styles, staged CMS and site/page freeform custom-code writes. Actual granted write scopes/account rights are UNKNOWN, since no write probe was allowed and no token-introspection tool is exposed. CMS read get_collection_list is schema-rejected, so CMS inventory and its practical write path are UNKNOWN. PUBLISH_AVAILABLE: publish_site callable tool exists; actual granted sites:write/plan/domain eligibility is UNKNOWN. PREVIEW_AVAILABLE: local isolated preview; Webflow page-branch preview unavailable, Releases UNKNOWN. Published webflow.io domain remains production.

The official API has read-only token introspection, but the connector exposes neither that endpoint nor its token. Do not extract connector secrets. Minimum action: Webflow connection/workspace administrator reviews authorized Drafted site and page/CMS/custom-code write plus site-publish scopes/role, reauthorizing only if missing, and fixes/enables the connector's CMS read action schema. Releases are optional; do not require Enterprise. Current read failures are connector schema restrictions, not proof that another token or an upgrade fixes CMS. A supported direct site-token API path is a fallback only if the connector cannot be repaired; configure it securely under a separately requested setup task. No manual product-code transfer is required by the proposed path.

Sources: [Webflow authorization introspection](https://developers.webflow.com/data/reference/token/introspect); connected Webflow guide/tool descriptions and read responses. Every publish remains a separate explicit production approval, including full-site pending changes and independent GitHub Pages asset publication.

### n8n delivery

Existing DPAPI read credential remains default. Separate write file drafted-n8n-write.credential.xml is absent. Minimum proposed scope set and rollback procedure are finalized in EXECUTION-PLAYBOOK.md, DEV-006 section. Exact account plan and enforceable API scope availability remain UNKNOWN; a separately named key is not itself a least-privilege boundary. No workflow, key or snapshot was created.

Five known inactive predecessors were re-read by ID only; all active=false and activeVersionId=null. Main-UploadPreview copy Q5EYspCf7zcd1RUB has 24 nodes and model calls, and is the smallest existing upload test candidate after explicit repurposing/fixture replacement. Other old copies are not substitutes for current rewrite/chat/tailor/PDF/jobContext behavior. WmXWs06zquBMjPoY contains Gmail trigger/send and Google Docs nodes and is unsuitable as-is. No executions occurred. Prefer an approved existing inactive copy, then an inactive clone of the affected current flow where no suitable copy exists. Manual test registration/session access still needs verification; public API workflow:update does not establish execution capability.

Verified on 2026-10-05. READ/WRITE capability does not imply authorization to mutate production.

## Local Git and files

READ: verified on canonical local checkout. WRITE: available for authorized local documentation/implementation. Origin is configured; `main` tracks `origin/main`, both at `1f80a7aeec32c5b4445922695aabab7af8b62df4`, ahead/behind 0/0 after fetch. Checkout was clean before integrating seven preserved dev-system files. Tracked product files remain unchanged. DEPLOY/PUBLISH: not authorized/tested. No commit or push occurred. Initial unborn repository metadata and original documents are retained in the sibling backup documented in README.md.

## GitHub / GitHub Pages — historical baseline (current state above)

READ: canonical repository confirmed by user, cloned and fetched successfully. Origin `https://github.com/DraftedAgent/drafted-webflow.git`, canonical `main`, HEAD `1f80a7aeec32c5b4445922695aabab7af8b62df4`. WRITE: UNKNOWN; no authenticated write scope was tested, gh command was not found in the initial shell inspection, and no relevant named environment variable surfaced then. DEPLOY/PUBLISH: UNKNOWN permissions/configuration. Public Pages assets were readable during DEV-001; live systems were not re-read in DEV-002.

Webflow fetches `https://draftedagent.github.io/drafted-webflow/latest.json`, then root editor CSS/JS with build query parameters. Served JS equals inspected remote root JS. Publishing these assets could alter the running product without Webflow publishing. Any future push that triggers Pages requires explicit production approval; establish source branch, deployment configuration, exact asset diff and rollback version first.

## Webflow

READ: verified using the connected Webflow plugin. Accessible site Drafted: `69274d644620cf7c511b74e1`; workspace `69274d0b005396272f5b422a`. One returned page: Home `69274d654620cf7c511b7508`, published path `/`, non-draft/non-archived. No site agent instructions were returned. No custom domains returned. Site timezone Europe/Stockholm; lastPublished `2026-05-28T12:31:41.557Z`, lastUpdated `2026-10-04T18:54:58.677Z`. Update timestamps do not establish what was published.

Published HTML at https://drafted-cad750.webflow.io/ contains the GitHub Pages bootstrap and editor DOM. Home freeform head contains the asset bootstrap and cache-busting fallback; Home footer and site head/footer are empty. Registered-script inventory is empty; applied site scripts read returned 404. This does not rule out embeds or every other script source.

CMS: UNKNOWN. Both initial action attempt and guide-documented `get_collection_list` read were rejected by connector schema validation; no absence claim is possible. Page element/embed contents were not exhaustively inspected.

WRITE: tools advertise page/CMS/style/element/custom-code mutations, but permissions were not tested by writing. DEPLOY/PUBLISH: publish tool exists; eligibility was not tested. All production content/code writes and publish actions need explicit scope/approval. No writes or publishing occurred. Read tools used were the Webflow plugin's site, page, agent-instruction, and script tools; CMS read was blocked.

## n8n — current verified access (DEV-003)

Verified 2026-10-05: official management API at `https://drafted.app.n8n.cloud/api/v1`, n8n Cloud. Authenticated GET workflow list/details succeeded using the user-provisioned Windows DPAPI-encrypted PSCredential file at `C:/Users/wallg/.codex/secrets/drafted-n8n.credential.xml`. Instance URL is stored in user environment variable N8N_BASE_URL. No plaintext key is stored in repository/docs, printed, or passed on the command line. Import in memory, use the password only in X-N8N-API-KEY request headers, and clear credential/header references after requests. Do not dump HTTP errors, raw headers, credential objects, or complete workflow JSON.

Workflow list returned 23 visible entries with no nextCursor; six were active and matched all six frontend routes. Detailed inspection was limited to these six and five obvious inactive upload/rewrite predecessors. Unrelated workflow contents, credential endpoints, executions and research-system data were not read. No separate apply workflow was identified among visible metadata; absence outside this account's visibility is not established.

For all six active Drafted workflows, saved versionId matched activeVersionId and the API included activeVersion. Therefore the inspected saved versions correspond to the identified published version IDs. No workflow or webhook execution was performed; active=true does not prove operational success.

### Capability versus authorization

- READ: verified GET `/workflows` and `/workflows/{id}`. Use pagination when needed; project/account visibility limits may apply.
- MODIFY SAVED WORKFLOW: official API supports workflow update; actual permission of this credential is untested. Requires explicit development task and concrete reviewed scope. Active-workflow production effects must be assessed first.
- CREATE WORKFLOW: official API supports creation; permission untested. Requires an explicit task, not discovery authorization.
- ACTIVATE/DEACTIVATE: official API supports activation/deactivation; permission untested. Explicit user approval required for production activation state.
- DELETE: official API supports deletion; permission untested. Destructive action requires explicit approval.
- EXECUTE/TEST: not verified. Do not assume a general public run endpoint. Approved staging webhook tests or supported instance test mechanisms can execute workflows; public execution retry is a separate mutating capability. Production runs/retries require explicit approval. Never use a test call as a read-access probe.

API capabilities/scopes are documented by [official n8n authentication documentation](https://github.com/n8n-io/n8n-docs/blob/main/docs/connect/n8n-api/authentication.md) and [endpoint reference](https://github.com/n8n-io/n8n-docs/blob/main/docs/connect/n8n-api/api-reference.md). No write operation was used to infer permissions. Enterprise keys can be scoped; non-Enterprise keys may be broader than this task. The exact account plan/key write scope was not verified.

Remaining work before a permanent orchestrator: user-authorized agent creation; resolve contract/ownership choices; define staging/test isolation, workflow version backup/rollback and deployment gates. Read access is no longer a blocker. CMS inventory and GitHub deployment/write permissions remain separately unverified.

DEV-004 refinement: the existing key's local scope metadata did not expose a scopes claim; technical read-only privilege remains UNKNOWN. No write probe or new key was created. EXECUTION-PLAYBOOK defines future separate read/write storage, least-privilege scopes, encrypted lossless before-state backups and restore gates. Contract choices and staging/write access block dependent tasks, not creation of a read/local-only gated orchestrator.

## n8n — historical discovery (DEV-001/DEV-002)

READ: no usable management connection found during DEV-001. WRITE and DEPLOY/ACTIVATE: UNKNOWN and unauthorized. Discovery then found no n8n-named callable tool, matching installed skill folder, n8n reference in Codex MCP config, N8N-named environment variable, or n8n CLI. DEV-002 inspected the actual canonical local tree and found no management config/helper, workflow export, or secure management credential reference. Local code establishes instance host `drafted.app.n8n.cloud` and public webhook callers, not management authentication. Other uninspected credential stores may exist. No n8n request was sent in either task.

Safe caller mapping, paths relative to instance host:

- Upload: `/webhook/webflow-upload-cv` -> flow-cv-upload.
- Rewrite: `/webhook/webflow-editor-rewrite` -> flow-editor-rewrite.
- Chat: `/webhook/webflow-chat-cv` -> flow-editor-chat.
- Export: `/webhook/webflow-export-pdf` -> flow-export-pdf/export-contract.
- Job context: `/webhook/webflow-jobcontext-extract` -> jobcontext-contract.
- Tailor: `/webhook/tailor-cv` -> flow-tailor (documented endpoint differs).

These are publicly embedded route references, not credentials or proof of reachable/active workflows. No webhook was invoked. Workflow names in docs are logical names; actual workflow IDs, names, active state and node configurations remain unknown.

Missing connection: a securely configured authenticated read-only management route for the existing instance (existing connector/MCP or approved n8n API access). Configure credentials through a protected integration/environment mechanism; never paste values into chat/docs. Stop n8n discovery here until that access exists. Do not invent an integration or probe production webhook execution.

## Research boundary

Drafted-IRP-Research was not accessed and must not be attached to this development control plane automatically.

## DEV-004 Webflow capability verification

Read site guidance returned no instructions. Available tool descriptions distinguish freeform/Designer edits, CMS staged/live operations, branch staging and production publish. Read-only list_site_branches was rejected by connector schema validation; branch staging availability cannot be claimed. No creation/publish/write fallback was attempted. Use local isolated preview by default; current Webflow subdomain is published production. Site/CMS publish or live item endpoints and GitHub Pages root-asset deployment require explicit production scope. Rollback is bounded exact before-state restoration where supported; full native site restore remains unverified. See EXECUTION-PLAYBOOK for gates and sources.
