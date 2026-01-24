## **Purpose**

Generate a **server-side PDF export** of a CV from the current deterministic state.

This flow is **purely representational**.

It **does not**:

* modify CV state

* create proposals

* involve AI decision-making

* persist anything

Its only responsibility is to **render an immutable snapshot** of an existing CV state into a PDF.

---

## **Trigger**

**Frontend**  
 `POST /webhook/webflow-export-pdf`

---

## **Input (Contract)**

`{`  
  `"cvVersionId": "string",`  
  `"cvTitle": "string",`  
  `"language": "sv | en",`  
  `"templateId": "string",`  
  `"blocks": [ /* blocks[] schema v1.0 */ ]`  
`}`

### **Rules**

* `blocks[]` is the **single source of truth**

* `cvVersionId` must match the current editor state

* No derived text (`rewrittenCv`, legacy text, etc.) is accepted

* Template selection is explicit via `templateId`

If required fields are missing or invalid:  
 **fail hard**.

---

## **Produces**

**On success**

* `application/pdf` (binary)

**On failure**

* `application/json`

`{`  
  `"ok": false,`  
  `"contractError": "..."`  
`}`

---

## **Flow Responsibilities**

1. **Validate input**

   * Enforce response contract

   * Verify `blocks[]` schema version

   * Reject empty or malformed block lists

2. **Select template**

   * Resolve `templateId` → HTML/CSS template

   * Templates are deterministic and versioned

3. **Render**

   * Convert `blocks[]` → HTML (layout-only transformation)

   * Apply template styles

   * Generate PDF server-side

4. **Return**

   * Stream PDF binary to caller

   * Do not store or cache unless explicitly designed later

---

## **AI Role**

**None.**

This flow must remain:

* deterministic

* reproducible

* debuggable

If AI is ever introduced here, the architecture is broken.

---

## **State Ownership**

| Data | Owner |
| ----- | ----- |
| blocks\[\] | System |
| cvVersionId | System |
| templateId | Frontend |
| rendered PDF | Ephemeral |
| file storage | None |

---

## **Invariants (Non-Negotiable)**

* Exported PDF must reflect **exactly** the provided `blocks[]`

* No hidden mutations

* No implicit defaults

* Same input → same PDF (byte-for-byte, given same template)

---

## **Failure Model**

* Invalid input → no PDF

* Rendering failure → no partial output

* Template error → explicit failure

**Invariant:**  
 Export failures must never affect editor state.

---

## **Why This Flow Exists**

* Keeps **presentation** separate from **state**

* Enables multiple templates without touching editor logic

* Allows future:

  * branded exports

  * recruiter formats

  * regional variants

Without contaminating core CV logic.

