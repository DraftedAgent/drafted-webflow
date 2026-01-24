# **architecture-map.md**

## **System Purpose**

Drafted är ett **block-baserat CV-system med AI-assisterad redigering** där:

* **CV-state alltid är deterministisk**

* **AI aldrig är source of truth**

* **alla förändringar är explicita, reversibla och spårbara**

Arkitekturen är byggd för att:

* tåla fel

* tåla iteration

* tåla framtida features utan att implodera

---

## **Core Principles (Non-Negotiable)**

1. **Single Source of Truth**

   * `blocks[]` \+ `cvVersionId`

   * aldrig AI-text

   * aldrig sammanfogad plain text

2. **AI Is Advisory by Default**

   * chat \= rådgivning

   * rewrite \= förslag

   * apply \= enda platsen där state ändras

3. **Flows Are Isolated**

   * varje flow har ett syfte

   * inga sidobeteenden

   * inga dolda mutationer

4. **Response Contracts Are Law**

   * frontend litar på kontrakt

   * backend bryter hellre än gissar

---

## **High-Level Architecture**

`Editor (Webflow)`  
   `|`  
   `v`  
`n8n Orchestration Layer`  
   `|`  
   `+-- flow-upload-cv`  
   `+-- flow-editor-chat`  
   `+-- flow-editor-rewrite`  
   `+-- flow-apply-proposal`
   `+-- flow-export-pdf`


Frontend äger:

* UI

* state-visualisering

* användarens beslut

Backend äger:

* validering

* AI-interaktion

* kontrakt

* determinism

---

## **Flow Map (Canonical)**

### **1\. flow-upload-cv.md**

**Purpose:**  
 Skapa första deterministiska CV-state från PDF.

**Produces:**

* `blocks[]`

* `cvVersionId`

* `cvTitle`

**AI Role:**  
 Strukturerande, inte kreativ.

---

### **2\. flow-editor-chat.md**

**Purpose:**  
 Rådgivande dialog.

**Consumes:**

* read-only `blocks[]`

**Produces:**

* text

* ev. förslag (ej applicerade)

**Never:**

* ändrar state

* returnerar blocks

---

### **3\. flow-editor-rewrite.md**

**Purpose:**  
 Generera *förslag* på förändringar.

**Consumes:**

* `blocks[]`

* `selectedBlockIds`

* `scope`

**Produces:**

* `proposal`

* aldrig applicerat resultat

**Critical:**  
 Detta flöde **äger aldrig state**.

---

### **4\. flow-apply-proposal.md**

**Purpose:**  
 Enda flödet som muterar CV-state.

**Consumes:**

* `blocks[]`

* `proposal`

* explicit user intent

**Produces:**

* nya `blocks[]`

* nytt `cvVersionId`

---

### **5. flow-export-pdf.md**

**Purpose:**  
Skapa en *deriverad artefakt* (PDF) från existerande CV-state.

**Consumes:**
- `blocks[]`
- `cvVersionId`
- `cvTitle`
- `templateId`
- `language` (valfri, men stödd)

**Produces:**
- `application/pdf` (binary)

**Never:**
- muterar state
- returnerar nya `blocks[]`
- anropar AI för innehållsgenerering

**Notes:**
- PDF renderas server-side via HTML-template
- Artefakten är alltid slängbar

---


## **Data Ownership Map**

| Data | Owner |
| ----- | ----- |
| blocks\[\] | System |
| cvVersionId | System |
| rewrittenCv | Derived / legacy |
| proposals | AI (temporary) |
| applied changes | User decision |
| UI state | Frontend |

---

## **State Transitions (Strict)**

`UPLOAD`  
  `-> blocks v1`

`CHAT`  
  `-> no state change`

`REWRITE`  
  `-> proposal (detached)`

`APPLY`  
  `-> blocks v2`

  `EXPORT`  
  `-> PDF artifact (no state change)`


If a flow does not clearly fit one of these:  
 **it does not belong in the system**.

---

## **Failure Model (Important)**

Failures are expected.

Design guarantees:

* upload failure ≠ corrupted editor

* chat failure ≠ lost work

* rewrite failure ≠ partial apply

**Invariant:**  
 No partial state mutations. Ever.

