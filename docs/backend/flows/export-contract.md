# export-contract.md (v1 – locked)

## Purpose
flow-export-pdf generates a PDF artifact from canonical CV state.

Export is DERIVED-ONLY and MUST NOT mutate, persist, or enrich state.

Hard invariants:
- stateless
- deterministic (same input => same output, given same template + renderer)
- template-driven (templateId allowlist)
- discardable (PDF is not a source of truth)

---

## Request

POST  
Content-Type: application/json

### Body
Body MUST be a single JSON object.

### Required fields
- cvVersionId: string  
  - length: 3..128  
  - pattern: /^[A-Za-z0-9._-]+$/

- cvTitle: string  
  - length: 0..140  
  - MAY be empty  
  - MUST be present (empty string allowed)

- templateId: string  
  - length: 1..64  
  - MUST be allowlisted server-side

- language: string  
  - allowed values: "sv" | "en"

- blocks: array  
  - length: 1..200

### Size limits (hard fail)
- Sum of blocks[].text length <= 120000 characters
- Approximate request JSON size <= 350 KB

---

## Block schema (v1)

Each item in blocks[] MUST be an object.

### Common fields (required)
- blockId: string  
  - length: 1..80  
  - pattern: /^[A-Za-z0-9._-]+$/  
  - MUST be unique across blocks[]

- type: string  
  - length: 1..32

- order: number  
  - MUST be finite (Number.isFinite)

- text: string  
  - length: 0..6000  
  - MAY be empty

### Type-specific constraints

If type === "experience":
- employer: string (1..120)
- title: string (1..120)
- startDate: string (1..40)
- endDate: string (1..40)

If type === "education":
- institution: string (1..120)
- degree: string (0..120)
- startDate: string (0..40)
- endDate: string (0..40)

### Unknown types
- Unknown block types are allowed
- They MUST still satisfy the common field requirements

---

## Normalization

Backend MUST normalize input before rendering:
- blocks are sorted deterministically by:
  1. order ascending
  2. blockId ascending

No other mutations are allowed.

---

## Success response (binary only)

- HTTP status: 200
- Content-Type: application/pdf
- Body: raw PDF bytes

On success:
- MUST NOT return JSON
- MUST NOT include ok, metadata, or headers beyond Content-Type / Content-Disposition

---

## Error response (JSON only)

On any failure:
- MUST return JSON
- MUST NOT return partial or corrupted PDF bytes

### Status codes
- 400: contract / input violation
- 500: render or internal failure

### Response body (exact shape)
```json
{
  "ok": false,
  "contractError": {
    "code": "EXPORT_*",
    "message": "string"
  }
}
