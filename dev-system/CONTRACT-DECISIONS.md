# Pending contract decision queue

2026-10-05, DEV-004. Three owner choices; none is approved or a formal DD. These recommendations do not change product contracts. Relevant tests are BLOCKED_BY_CONTRACT_DECISION only for the unresolved assertion. Existing invariants remain enforceable.

## DECISION REQUIRED: Commit lifecycle and version ownership (CDQ-01)

Current implementation: frontend applyProposal commits pending blocks locally. Explicit Apply can call rewrite and immediately consume returned full blocks; Tailor directly consumes a canonical response after its click. Rewrite n8n reuses the base cvVersionId. Preview replaces the same state read by export.

Existing documented contract: architecture says rewrite yields a detached proposal and a separate apply flow is the only mutation path, producing a new cvVersionId. Rewrite flow permits returned full blocks suitable for replacement. No apply-specific document or separately visible workflow was found.

Why they conflict: the documents prescribe different commit boundaries/owners; current direct actions and version reuse do not implement the architecture lifecycle.

User-visible consequence: whether Apply/Tailor means "generate and commit now" or "generate a proposal, then confirm" affects interaction count and expectations. Meaningful commits need distinguishable representation versions, independent of latent professional capacity.

Architectural consequence: who checks base-version conflicts, issues the next version and commits selected representation state; whether n8n computes candidates or also owns commit validation. Do not infer durable persistence from an apply endpoint.

Safest options:

- A. Frontend owns explicit representation commits; n8n computes candidates. Keep pending proposals detached and commit atomically on an explicit action, with version/conflict policy documented. Specify which labelled direct actions count as that explicit intent.
- B. Keep architecture's distinct apply operation: n8n validates base version and emits a new representation version; frontend commits only the approved result. Define source-of-truth/version storage before claiming server concurrency guarantees.
- C. Retain both explicit direct and proposal paths with one shared version/commit protocol; allow direct Tailor only if its label and scope clearly authorize a meaningful change. Higher validation burden.

Codex recommendation: A is the smallest fit for the observed in-memory frontend, while preserving advisory AI and explicit commit. This requires approval to revise ownership contracts; until then, do not replace B by assumption. Version issuance and direct Tailor semantics must be explicit in that approval.

Preview isolation, preserving canonical text and user-controlled commit are already required invariants: they are implementation defects to investigate/fix in an authorized task, not separate owner choices.

## DECISION REQUIRED: Contract family and authoritative precedence (CDQ-02)

Current implementation: upload/rewrite/tailor use CV envelopes; chat uses message plus optional advisory metadata; jobContext has its own envelope; export uses PDF binary or JSON error. General CV document includes chat; several flow failure examples are shorter than runtime envelopes. Locked export defines a minimum input projection without all canonical fields.

Existing documented contract: general response-contract declares its fields always present for chat too, while chat flow forbids state mutation and returns message. Export docs disagree on error shape/required language, and general blocks require fields absent from export minimum.

Why they conflict: no explicit precedence rule establishes authoritative operation-specific envelopes or whether export minimum is a validated projection of full canonical blocks.

User-visible consequence: failures may be reported incorrectly and otherwise valid operations rejected; misleading AI success/fallback must not be normalized into state success.

Architectural consequence: frontend/backend share operation-specific validators versus one mandatory common payload, and define exact error and export validation boundaries.

Safest options:

- A. Approve explicit per-operation contract profiles: CV, advisory chat, jobContext and binary export; common ok/error semantics only where applicable. Require full canonical blocks as export source with an explicitly documented render projection. Define precedence of these profiles over legacy general examples.
- B. Adopt one common JSON envelope for JSON operations, keeping export binary separate; update callers/backend together. Chat would carry read-only context fields without becoming a mutation.
- C. Permit versioned old/new profiles during a bounded migration with explicit discriminators; avoids immediate compatibility break but adds complexity.

Codex recommendation: A, closest to actual isolated flows and existing principles. Approve exact profile/precedence changes before rewriting normative contracts. Strict no-error-on-success, fail-closed input/output validation, no partial PDFs, bounds/allowlist enforcement and preventing model fallbacks from masking failure are already required, not optional human choices.

## DECISION REQUIRED: Explicit language versus detection (CDQ-03)

Current implementation: direct Apply omits language; rewrite backend detects language and does not preserve/require the supplied field. The suggestion path supplies language. JobContext enforcement returns English. Export requires sv/en.

Existing documented contract: rewrite input requires language sv/en; upload detects source language; first-class job context is preserved, but no coherent output-language precedence is documented.

Why they conflict: a supplied/requested language and inferred source language can differ, and detection cannot safely be assumed to represent requested output intent.

User-visible consequence: Swedish CV plus English job description may produce a rewrite in a language the user did not intend.

Architectural consequence: separate source-language detection, requested representation language and language-neutral/context-analysis signals; backend must not infer missing intent.

Safest options:

- A. Explicit output language controls rewrite/tailor/export; detection helps upload/source parsing only. Missing required intent fails or prompts at the product UI according to an approved contract.
- B. Preserve representation language by default, with an explicit user language switch; backend detection is a diagnostic check, not overriding authority.
- C. Detection drives output unless the user explicitly overrides; requires documenting the product default and conflict handling, with higher risk of implicit intent.

Codex recommendation: B for ordinary preservation, with explicit output language sent after UI state is established; A where the contract deliberately demands a choice. Resolve the product default before modifying language routing. This does not require changing the English jobContext schema without a separate need.

## Removed from the human queue

No new decision is needed for build token substitution (expected), stale tailor route text (both implementations agree; any normative edit still requires explicit approval), canonical-text mutation, shared preview/export state, strict error gates, PDF normalized handoff/bypass graph, validation bounds, MIME/bytes checks, or snapshot/permission plumbing. Codex can determine these technical corrections under an explicit implementation task without asking about each detail. Deployment and contract edits retain their separate approval gates. Historical inactive workflows need no cleanup decision now; do not activate/delete automatically.

Only discuss DD creation after the user selects a significant architectural option; no formal records are created by this queue.
