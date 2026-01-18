# **flow-editor-chat.md**

## **Purpose**

`flow-editor-chat` hanterar **icke-destruktiv AI-dialog i editorn**.

Flödet:

* genererar förslag, feedback och förbättringar

* **ändrar aldrig CV:t direkt**

* returnerar alltid textuella förslag som användaren aktivt måste välja att applicera

Detta flöde är **rådgivande**, inte exekverande.

---

## **Input (from webhook)**

**Source:** Editor chat input

### **Required**

* `cvVersionId`

* `blocks[]` – full CV state (read-only)

* `message` – user chat message

* `language` – `"sv"` | `"en"`

### **Optional**

* `activeContext` – `"chat" | "full" | "blocks"`

* `selectedBlockIds[]`

* `targetRole`

**Important:**  
 `blocks[]` skickas alltid som **context**, aldrig som något som ska muteras.

---

## **Nodes (in exact order)**

### **1\. Webhook**

Receives chat message from editor.

No validation. No logic.

---

### **2\. Validate \+ Normalize**

**Input safety layer**

Responsibilities:

* Validate presence of `message`

* Normalize `activeContext`

* Normalize `language`

* Ensure `blocks[]` is an array

* Ensure `selectedBlockIds` only exists when context requires it

Hard fail on invalid input.

---

### **3\. Build LLM Messages**

**Prompt construction**

Responsibilities:

* Build system \+ user messages

* Inject CV context (read-only)

* Inject selected blocks when relevant

* Apply tone, scope, and safety rules

This node defines:

* *what the AI is allowed to do*

* *what it is forbidden from doing*

---

### **4\. AI Chat Model**

**Pure text generation**

Produces:

* suggestions

* explanations

* rewrite proposals

* alternative formulations

No structure guarantees. No schema. No IDs.

This output is **untrusted**.

---

### **5\. Debug AI Output Size**

**Operational guardrail**

Responsibilities:

* Log response length

* Detect truncation risk

* Surface debugging info (non-functional)

Does not affect output.

---

### **6\. Merge (combine)**

Merges:

* original validated input

* AI raw output

Purpose:

* retain full context for response building

* avoid losing metadata

---

### **7\. Parse \+ Build Response**

**Contract authority**

Responsibilities:

* Extract assistant message

* Strip invalid or dangerous output

* Ensure response matches editor expectations

* Decide `ok` vs `contractError`

This node **owns the response contract**.

---

### **8\. Respond to Webhook**

Returns response verbatim.

No mutation.

---

## **Ownership Rules**

| Concern | Owner |
| ----- | ----- |
| Chat intent | Editor |
| Input validity | Validate \+ Normalize |
| Prompt rules | Build LLM Messages |
| Suggestion quality | AI Chat Model |
| Output safety | Parse \+ Build Response |
| Response shape | Parse \+ Build Response |

**Invariant:**  
 Chat flow must never mutate editor state implicitly.

---

## **Output Contract**

On success:

`{`  
  `"ok": true,`  
  `"message": "string"`  
`}`

Optional extensions:

`{`  
  `"proposal": {`  
    `"type": "rewrite",`  
    `"scope": "block | full",`  
    `"content": "string"`  
  `}`  
`}`

On failure:

`{`  
  `"ok": false,`  
  `"contractError": {`  
    `"code": "string",`  
    `"message": "string"`  
  `}`  
`}`

---

## **Non-Goals**

This flow does **not**:

* apply changes

* modify blocks

* generate block IDs

* persist CV state

* infer user intent silently

All application of changes happens via **explicit user actions** and **other flows**.

---

## **Design Truth**

This flow exists to **support thinking**, not execution.

If this flow breaks:

* no data corruption occurs

* editor state remains intact

* user can retry safely

That is intentional.