## **Purpose**

Handle initial CV upload and produce the **canonical rewritten CV representation** used by the entire Drafted system.

This flow is the **single source of truth** for:

* Block structure

* Stable block IDs

* CV versioning

* Response contract guarantees

No other flow is allowed to invent or reshape CV structure.

---

## **Input (from Webflow / webhook)**

**Transport**

* HTTP `POST`

* `multipart/form-data`

**Fields**

* `file` (required)  
   PDF CV uploaded by the user

* `targetRole` (optional)  
   Free text describing target role or pasted job ad

**Assumptions**

* File is a valid PDF

* targetRole may be empty

* No authentication logic handled here

---

## **Nodes (in execution order)**

### **1\. Webhook – Upload CV**

Receives file \+ targetRole.

* Response mode: **Using Respond to Webhook Node**

* Does not return data itself

---

### **2\. Extract from File**

Extracts raw text from uploaded PDF.

* Produces plain text CV

* No interpretation or structuring

---

### **3\. Language Detection**

Detects CV language.

* Used to guide prompt language

* Does not affect structure

---

### **4\. CV Parser**

Parses raw CV text into `parsedCvJson`.

Produces:

* experiences\[\]

* education\[\]

* skills (raw)

* personalInfo (best effort)

**Ownership**

* Parser owns *factual extraction only*

* No rewriting, no polishing

---

### **5\. CV Rewrite Model**

LLM node that rewrites CV **into block format**.

Produces a *model proposal*:

* `blocks[]` (unordered, unstable)

* `summaryOfChanges`

* `cvTitle` (suggested)

⚠️ Output here is **not trusted**.

---

### **6\. Normalize Model Output**

Finds and extracts the model’s JSON payload.

Responsibilities:

* Locate JSON in LLM output

* Ensure `blocks[]` exists

* No structural guarantees yet

---

### **7\. ValidateAndSanitizeBlocks**

Cleans model output defensively.

Responsibilities:

* Strip leaked key/value lines from text

* Normalize obvious mistakes (degree/program)

* Ensure text-only content in `text`

Still **not canonical**.

---

### **8\. EnsureBlocksAndJoin (CANONICAL NODE)**

**This is the most important node in the system.**

Responsibilities:

* Merge model blocks with `parsedCvJson`

* Assign **stable deterministic blockIds**

* Inject authoritative fields:

  * employer, title, dates

  * institution, degree, program

* Deduplicate blocks

* Enforce block ordering

* Guarantee presence of summary block

* Build `rewrittenCv` (flat text)

* Enforce **strict response contract**

**Ownership rules**

* This node OWNS:

  * block identity

  * block schema

  * ok / contractError semantics

* Downstream nodes may NOT reinterpret blocks

---

### **9\. BuildResponse (Contract Gatekeeper)**

Final response shaping.

Responsibilities:

* Enforce output shape

* Never emit `contractError` on `ok: true`

* Never leak upstream error arrays

* Output only the approved contract fields

No business logic allowed here.

---

### **10\. Respond to Webhook**

Returns final JSON response to Webflow.

---

## **Ownership Rules (Non-Negotiable)**

* **parsedCvJson**  
   Owned by CV Parser  
   Treated as factual ground truth

* **blocks\[\] (canonical)**  
   Owned exclusively by EnsureBlocksAndJoin  
   Stable across rewrites

* **ok / contractError**  
   Owned by EnsureBlocksAndJoin  
   BuildResponse may only suppress, never invent

* **Frontend**

  * Must trust `blocks[]`

  * Must not infer structure from `rewrittenCv`

  * Must not guess error states

---

## **Output Contract**

This flow MUST return **exactly** this shape on success:

`{`  
  `"ok": true,`  
  `"blocksSchemaVersion": "1.0",`  
  `"cvVersionId": "cv_v1",`  
  `"cvTitle": "string",`  
  `"summaryOfChanges": "string",`  
  `"blocks": [ /* canonical blocks */ ],`  
  `"rewrittenCv": "string",`  
  `"rewrittenCvLegacy": "string"`  
`}`

On failure:

`{`  
  `"ok": false,`  
  `"blocksSchemaVersion": "1.0",`  
  `"contractError": {`  
    `"code": "string",`  
    `"message": "string"`  
  `}`  
`}`

No other fields are allowed.

---

## **Why this document exists**

* Prevents ChatGPT / Cursor from hallucinating structure

* Makes refactors safe

* Allows new flows (editor rewrite, chat, PDF export) to rely on invariants

* Makes bugs traceable to **one node**, not “the system”

---

## **Related Documents**

* `response-contract.md`

* `block-schema-v1.md`

* `flow-editor-rewrite.md`

* `flow-chat-cv.md`

