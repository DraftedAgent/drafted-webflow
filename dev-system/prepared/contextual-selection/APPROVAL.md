# Structured selection request — not deployed

Proposed Editor Chat changes: replace only Build LLM Messages and Parse + Build Response with sibling candidate files. No model, endpoint or workflow change is proposed. Reread current active definitions and diff before deployment; save/verify encrypted rollback snapshot before any mutation. Requires separate owner approval and activation. No paid tests included.

Optional success response field: selectionRequest: {id: <requestId from this frontend request>, kind: "cv_selection"}. Model can request the kind only for genuinely ambiguous section focus. Parser supplies the ID, never derives intent from free text. Ordinary replies omit the field; actionable suggestions cannot request selection. Existing full CV model context remains available; never ask for a clear section already supplied.

Frontend sends a unique requestId and optional selectionRequestId when answering. Active request is scoped to this response turn, full CV/job baseline and most recent assistant message. Any successful send consumes it; a later reply replaces it; version/context changes make it invalid. Restored old historical questions without this state cannot enable section-only Send. Missing fields remain backward compatible and fail closed: typed/dictated messages with optional selection still work; selection-only Send is unavailable on current backend until approval.

Local tests use synthetic responses. No n8n mutation or real AI call. Same model/pricing/resources; no extra model request introduced by this field. Client reply identity is conversation control, not user authentication or permission to mutate CV.
