# **block-schema-v1.md**

## **Block Schema – Drafted v1.0**

This document defines the **canonical block representation** used across all Drafted flows.

Blocks are the **single source of truth** for:

* Rendering

* Editing

* Rewriting

* Analysis

* Export (PDF, DOCX, etc.)

Flat text (`rewrittenCv`) is always derived and never authoritative.

---

## **Global Rules (Invariants)**

These rules apply to **all blocks**, without exception:

* `blockId` is **stable and deterministic**

* `blockId` MUST NOT change across rewrites of the same CV

* Order is controlled by `order`, not array position

* Text content lives in `text` only

* Metadata fields MUST NOT be duplicated in `text`

* Unknown block types MUST be preserved, not dropped

* Blocks are append-only across versions unless explicitly removed by the user

---

## **Base Block Shape**

All blocks conform to this base structure:

`Block {`  
  `blockId: string        // stable, deterministic`  
  `type: string           // see Block Types`  
  `label: string          // display label`  
  `order: number          // sort order`  
  `text: string           // human-readable content`  
`}`

---

## **Block Types**

### **1\. Summary Block**

`SummaryBlock extends Block {`  
  `type: "summary"`  
`}`

**Rules**

* Exactly one summary block SHOULD exist

* If missing, system injects an empty one

* No metadata fields allowed

---

### **2\. Experience Block**

`ExperienceBlock extends Block {`  
  `type: "experience"`

  `employer: string`  
  `title: string`  
  `startDate: string`  
  `endDate: string`  
`}`

**Rules**

* `employer`, `title`, and dates are authoritative

* `text` contains bullet points only

* Dates are display-friendly (e.g. “Jan 2023”, “Nuvarande”)

* Metadata MUST NOT be repeated in `text`

---

### **3\. Education Block**

`EducationBlock extends Block {`  
  `type: "education"`

  `institution: string`  
  `degree: string`  
  `program: string`  
  `startDate: string`  
  `endDate: string`  
`}`

**Rules**

* Degree and program are stored separately

* Display name is derived, never stored

* `text` contains description only

* Obvious degree/program parsing errors may be auto-corrected

---

### **4\. Skills Block**

`SkillsBlock extends Block {`  
  `type: "skills"`  
`}`

**Rules**

* Free-form list or grouped text

* No enforced structure (ATS-friendly)

* Typically singleton

---

### **5\. Languages Block**

`LanguagesBlock extends Block {`  
  `type: "languages"`  
`}`

**Rules**

* One language per line recommended

* Proficiency levels optional

* Typically singleton

---

### **6\. Certifications Block**

`CertificationsBlock extends Block {`  
  `type: "certifications"`  
`}`

**Rules**

* Optional block

* Free-form text

* Dates allowed inside text

---

### **7\. Other Sections Block**

`OtherSectionBlock extends Block {`  
  `type: "otherSections"`  
`}`

**Rules**

* Catch-all for future or custom sections

* Preserved verbatim

* Never dropped by the system

---

### **8\. Unknown / Fallback Block**

`GenericBlock extends Block {`  
  `type: "block"`  
`}`

**Rules**

* Used only when type is unknown

* Preserved and round-tripped

* Allows forward compatibility

---

## **Ordering Semantics**

* Blocks are sorted by `order`

* Recommended ranges:

  * Summary: `10`

  * Experience: `30–99`

  * Education: `200–229`

  * Skills: `240`

  * Languages: `260`

* Exact numbers are not significant, only relative order

---

## **Identity & Stability Rules**

* `blockId` is generated from **parsedCvJson**, not model output

* Rewrites must **reuse existing blockIds**

* Adding a new experience creates a new blockId

* Editing text MUST NOT change blockId

This enables:

* Block-level diffing

* Multi-select editing

* Per-block AI operations

* Stable references across sessions

---

## **Relationship to Other Documents**

* Output wrapping → see `response-contract.md`

* Upload flow → see `flow-cv-upload.md`

* Editor rewrite flow → see `flow-editor-rewrite.md`

---

## **Non-Goals (Explicitly Out of Scope)**

* Visual layout

* Typography

* PDF pagination

* ATS optimization rules

* Localization rules

These belong to **rendering layers**, not schema.

---

## **Why This Exists**

Without this document:

* “Small” changes break PDF export

* Chat/edit flows diverge

* Block selection becomes unreliable

* AI suggestions lose context

With this document:

* Every new feature has a place

* Every bug has a home

* Every refactor is survivable

