# **flow-editor-rewrite.md**

## **Purpose**

`flow-editor-rewrite` rewrites an **already-loaded CV inside the editor** based on explicit user intent.

The flow:

* operates exclusively on the existing block structure

* rewrites text only (no parsing, no re-structuring)

* guarantees a stable, contract-safe response back to the editor

This flow is triggered from the editor when the user:

* rewrites selected blocks

* rewrites the full CV

* applies an AI proposal

---

## **Input (from webhook)**

**Source:** Editor (Webflow frontend)

### **Required**

* `cvVersionId`

* `blocks[]` – full block array (source of truth)

* `mode` – `"blocks"` or `"full"`

* `instruction` – user intent (free text)

* `language` – `"sv"` | `"en"`

### **Conditional**

* `selectedBlockIds[]` – required if `mode = "blocks"`

* `targetRole` – optional (may be a title or full job ad)

---

## **Nodes (in exact order)**

### **1\. Webhook**

Receives the editor rewrite request.

No logic. No validation.

---

### **2\. Validation \+ Normalization**

**Input gatekeeper**

Responsibilities:

* Validate required fields

* Normalize `mode`, `language`, IDs

* Ensure `blocks[]` exists and is an array

* Ensure `selectedBlockIds` aligns with `mode`

Failure here stops the flow.

---

### **3\. SV-EditorRewriteModel**

**AI rewrite step**

Receives:

* rewrite instruction

* rewrite scope (blocks vs full)

* selected blocks

* read-only context blocks

* optional job ad text

Produces:

* rewritten content only

* no block IDs

* no ordering

* no schema guarantees

The model is treated as **untrusted text output**.

---

### **4\. Normalize output**

**Model output extraction**

Responsibilities:

* Extract rewritten content from model output

* Handle JSON vs text ambiguity

* Fail if no usable rewrite payload exists

This node does **not** enforce schema or safety.

---

### **5\. Apply updates \+ Return main-format**

**Structural authority**

This node:

* applies rewritten text back onto existing blocks

* preserves `blockId`, `type`, and order

* enforces `blocksSchemaVersion`

* builds `rewrittenCv` and legacy text

* decides `ok` vs `contractError`

This node is the **single owner of correctness**.

---

### **6\. Respond to Webhook**

Returns the response as-is.

No mutation. No logic.

---

## **Ownership Rules**

| Concern | Owner |
| ----- | ----- |
| Input validity | Validation \+ Normalization |
| Rewrite quality | SV-EditorRewriteModel |
| Output parsing | Normalize output |
| Block identity | Apply updates \+ Return main-format |
| Schema version | Apply updates \+ Return main-format |
| ok / contractError | Apply updates \+ Return main-format |
| Response shape | Apply updates \+ Return main-format |

**Invariant:**  
 If `ok = true`, the editor may replace its state without inspection.

---

## **Output Contract**

On success:

`{`  
  `"ok": true,`  
  `"blocksSchemaVersion": "1.0",`  
  `"cvVersionId": "string",`  
  `"cvTitle": "string",`  
  `"summaryOfChanges": "string",`  
  `"blocks": [ ... ],`  
  `"rewrittenCv": "string",`  
  `"rewrittenCvLegacy": "string"`  
`}`

On failure:

`{`  
  `"ok": false,`  
  `"contractError": {`  
    `"code": "string",`  
    `"message": "string"`  
  `}`  
`}`

See:

* `block-schema-v1.md`

* `response-contract.md`

---

## **Non-Goals**

This flow does **not**:

* parse PDFs

* generate CV structure

* invent or remove blocks

* persist data

* apply editor state directly

Those concerns belong to other flows.

---

## **Design Truth (important)**

This flow is **editor-driven**, not backend-driven.

The backend:

* never decides structure

* never guesses intent

* never repairs editor mistakes silently

All authority flows **toward** the editor, not away from it.

