# Development contract

Established by the user's discovery/setup request on 2026-10-05. Existing product contracts remain authoritative except where implementation divergence is explicitly recorded; this document does not resolve competing contracts.

## Product invariants

- Drafted is a career representation system. A CV is a selected representation, never the complete professional truth. Multiple valid representations can coexist.
- Keep latent professional capacity, selected representations, and derived artifacts conceptually separate. Do not collapse them into one model or introduce one canonical CV for a person.
- Job descriptions are first-class context. Never assume the current CV contains all relevant experience; never infer missing user intent or invent facts.
- AI is advisory by default. Meaningful state changes require user action. Hidden mutations are forbidden.
- `blocks[]` is canonical for a selected CV representation; flat rewritten text is derived. Preserve stable block IDs, unknown types, explicit removal intent, and strict response shapes.
- Frontend owns presentation, user choices, and editor interaction; backend owns input/output validation, AI orchestration, and deterministic contract enforcement. Document concrete ownership before changing it.

## Change procedure

Inspect before changing: branch, HEAD, remotes, working tree, upstream divergence, applicable instructions, contracts, relevant code, and connected-system versions. Preserve all local changes. Do not reset or discard work to make inspection easier.

Classify both concern (product behavior / architecture / presentation and UI / operational configuration) and change type (bug fix / implementation change / contract change / research-informed experiment). State affected systems and observed behavior. Local implementation and testing may proceed when explicitly requested.

Never change webhook contracts silently, casually change canonical block schema, or justify backend drift through frontend convenience. Contract and architectural changes require explicit user approval. Conflicting sources must be recorded before dependent work proceeds, not silently reconciled.

Never mutate production outside explicit scope. Production-affecting deployment requires explicit approval of the concrete action. Never publish Webflow or activate/deactivate n8n workflows without approval. Workflow edits, credential changes, production executions, and publishing GitHub Pages assets also require explicit production scope. Preparing a reviewable change is separate from approval to execute it. Inspecting an integration does not authorize writing to it.

Before production, validate against TEST-STRATEGY.md, record the candidate version and rollback approach, and disclose unresolved limitations. After approved production actions, verify deployed state and append the outcome to the DEV log. Never imply success from an unverified response.

## Evidence and decisions

Use CONTRACT_MATCH for evidenced agreement; IMPLEMENTATION_DRIFT for a concrete mismatch; DOCUMENTATION_STALE for evidence of an outdated document; AMBIGUOUS when sources conflict or implementation/access is missing. Include source paths, functions or lines, and observed scope. Agreement among documents alone is not proof of live behavior.

For the user-requested local reassessment (DEV-002), use CONFIRMED_IMPLEMENTATION_DRIFT, DOCUMENTATION_STALE, CONTRACT_CONFLICT, NO_LONGER_APPLICABLE, and AMBIGUOUS. Preserve historical classifications, but clearly identify the current reassessment and evidence. A concrete local code mismatch does not prove production backend failure.

Say "Possible design decision detected." when a significant product/architecture choice emerges, explain alternatives and implications, and ask whether it should become a DD record. Do not create formal DD records automatically. Routine implementation details need no DD.

Append material work to CHANGE-LOG.md; do not log trivial commands. Protect credentials and personal CV content: document names and safe references, never secret values. Drafted-IRP-Research is outside this control plane: do not access or mutate it automatically. Research enters only when the user explicitly supplies or approves a finding for product work.

## Safe execution layer (DEV-004)

EXECUTION-PLAYBOOK.md defines the default inspection -> plan -> feature branch/local work -> isolated validation -> concrete approval -> production action -> verification -> DEV log path. It is procedural guidance, not technical enforcement or authorization to mutate an external system. Never develop material changes directly on main; use codex/<task> branches. Main is logically protected by governance although GitHub has no branch protection or rulesets. Never merge to main without explicit owner approval; inspect diff and validation results before merge; production-affecting merges remain gated. No force push or history rewriting on main. DEV-007 verifies GitHub read/branch-push/PR capability through local GCM as ManPanther; merge capability does not confer approval. Current setup remains uncommitted documentation only.

External edits require explicit task scope, exact target identification, before-state snapshots and verified isolation/permissions. Production publishing, activation/deactivation, execution/retry and destructive operations always require explicit scope/approval. Minimize interruptions by bundling approvals for concrete prepared actions and honoring already granted scope. Never ask for routine implementation details or reapprove already authorized local work.

Before any n8n modification, validate a lossless encrypted rollback snapshot with workflow/instance/saved/active version provenance. Before Webflow writes, preserve complete affected before-state and verify restore support. Missing snapshot/isolation blocks that write task. Production root asset changes are deployment even without Webflow publication. No rollback may discard unrelated intervening work.

DEV-008 owner decision: the existing encrypted Drafted n8n API key has full access and is intentionally authorized for development; use it for inspection and scoped approved workflow writes without requiring a separate key. N8N READ is VERIFIED; WORKFLOW WRITE is AVAILABLE, GATED; CREATE is AVAILABLE when explicitly required by an approved task. ACTIVATE/DEACTIVATE is AVAILABLE but ALWAYS requires explicit owner approval; destructive actions ALWAYS require explicit approval; production execution remains GATED. Before every workflow mutation save and verify rollback snapshot, record workflow ID/current state, avoid unrelated changes and validate resulting definition. Preserve encrypted storage and secret-safe handling. No capability test through mutation is required by this state correction. Disputed assertions remain BLOCKED_BY_CONTRACT_DECISION and linked to CONTRACT-DECISIONS.md, not silently treated as expected behavior or passing tests.
