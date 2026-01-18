# Drafted – Project Context (READ FIRST)

This repository follows a strict backend–frontend contract model.

## Authoritative documents
The following files are normative and MUST be followed:

### Backend contracts
- contracts/response-contract.md
- contracts/block-schema-v1.md

### Backend flow responsibilities
- docs/backend/flows/flow-cv-upload.md
- docs/backend/flows/flow-editor-rewrite.md
- docs/backend/flows/flow-editor-chat.md

### Architecture
- docs/architecture/architecture-map.md

## Rules for changes
- blocks[] is the single source of truth.
- Frontend MUST NOT reconstruct CV state from rewrittenCv.
- If backend returns ok=false, frontend MUST fail loudly.
- Missing or malformed contract fields are treated as contract violations.
- No silent fallbacks are allowed.

If code suggestions conflict with these documents, the documents take precedence.
