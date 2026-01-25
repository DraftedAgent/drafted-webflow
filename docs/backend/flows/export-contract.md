\# export-contract.md (v1)

\#\# Purpose  
flow-export-pdf generates a PDF artifact from canonical CV state.  
Export is derived-only and MUST NOT mutate or persist any state.

Hard invariants:  
\- stateless  
\- deterministic (same input \=\> same output, given same renderer/template)  
\- template-driven (templateId allowlist)  
\- discardable (PDF is not source of truth)

\#\# Request (JSON)  
POST application/json

Body MUST be a JSON object:

Required:  
\- cvVersionId: string (3..128, /^\[A-Za-z0-9.\_-\]+$/)  
\- cvTitle: string (0..140)  
\- templateId: string (1..64) MUST be allowlisted server-side  
\- language: "sv" | "en"  
\- blocks: array (1..200)

Size limits:  
\- total text chars across blocks\[\].text \<= 120000  
\- approximate JSON size \<= 350KB (hard fail)

\#\#\# Block minimum schema (v1 enforcement)  
Each block MUST be an object:  
\- blockId: string (1..80, /^\[A-Za-z0-9.\_-\]+$/) unique across blocks\[\]  
\- type: string (1..32)  
\- order: number (finite)  
\- text: string (0..6000)

Type constraints:  
\- experience: employer,title,startDate,endDate: string (1..120 for employer/title; 1..40 for dates)  
\- education: institution,degree,startDate,endDate: string (institution 1..120; others 0..120; dates 0..40)

Unknown block types allowed if minimum schema holds.

Normalization:  
\- backend sorts blocks deterministically by (order asc, blockId asc)

\#\# Success response (binary only)  
\- Status 200  
\- Content-Type: application/pdf  
\- Body: raw PDF bytes  
\- MUST NOT return JSON on success

\#\# Error response (JSON only)  
\- Status 400 for contract/input errors, 500 for render/internal  
\- Content-Type: application/json  
Body EXACTLY:  
{  
  "ok": false,  
  "contractError": { "code": "EXPORT\_\*", "message": "string" }  
}

No extra fields. No stack traces. No partial PDFs.

Recommended codes:  
EXPORT\_INVALID\_JSON  
EXPORT\_MISSING\_FIELD  
EXPORT\_INVALID\_FIELD\_TYPE  
EXPORT\_INVALID\_FIELD\_VALUE  
EXPORT\_BLOCK\_SCHEMA\_INVALID  
EXPORT\_BLOCK\_ID\_DUPLICATE  
EXPORT\_TEMPLATE\_NOT\_ALLOWED  
EXPORT\_PAYLOAD\_TOO\_LARGE  
EXPORT\_RENDER\_FAILED

