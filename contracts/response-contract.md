### **Drafted Webhook Response Contract v1.0**

**Applies to:**

* Upload Rewrite (`/webflow-upload-cv`)

* Editor Rewrite (`/webflow-editor-rewrite`)

* Chat Suggest (`/webflow-chat-cv`)  
   (Export PDF får egen contract senare men ska följa samma principer.)

### **1\) Top-level response fields (always)**

**ok**: `boolean`

* `true` means request succeeded and payload is usable

* `false` means request failed and payload may be partial

**blocksSchemaVersion**: `string`

* Current: `"1.0"`

* Interprets the structure of `blocks[]`

**cvVersionId**: `string | null`

* Must be present when ok=true

* Can be null on hard failures (but prefer stable id if available)

**cvTitle**: `string`

* Can be empty string

**summaryOfChanges**: `string`

* Can be empty string

**blocks**: `Array<Block>`

* When ok=true: must be a non-empty array

* When ok=false: may be empty array

**rewrittenCv**: `string`

* Human readable legacy joined form

* Not the source of truth

**rewrittenCvLegacy**: `string`

* For transition only

* Mirrors rewrittenCv

### **2\) Error fields**

If `ok=true`

* No error fields are emitted (strict)

If `ok=false`

* **contractError**: `object | string | null`

  * Can contain structured error codes or fallback strings

  * No arrays of nulls should be emitted

### **3\) Invariants (hard guarantees)**

* `blocks[]` is the single source of truth for CV content

* `ok=true` implies:

  * `blocks.length > 0`

  * `contractError` is not present

* Blocks are ordered by `order` ascending

* Each block must have:

  * `blockId` non-empty string

  * `type` non-empty string

  * `label` string

  * `order` number

  * `text` string (can be empty)

* Unknown block types are allowed and must still respect the base block shape

### **4\) Block schema v1.0**

Base fields for all blocks:

* `blockId: string`

* `type: string`

* `label: string`

* `order: number`

* `text: string`

Typed extensions:

**summary**

* base only

**experience**

* `employer: string`

* `title: string`

* `startDate: string`

* `endDate: string`

**education**

* `institution: string`

* `degree: string`

* `program: string`

* `startDate: string`

* `endDate: string`

**skills**

* base only

**languages**

* base only

**certifications**

* base only

**otherSections**

* base only

