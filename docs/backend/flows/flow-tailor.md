> DEV-081, 2026-10-23: owner-authorized [Tailor source profile 1.0](../../../contracts/tailor-sources-v1.md) is published in existing workflow H8oAioy58R1v3PvRe3YUa, saved/active ac02e245-1b06-43b1-812e-8ee0ebc720d8. It adds typed user-source additions to relevant existing blocks, traced receipts and multi-Apply correction handling. The no-new-fields rule below governs the unchanged no-source profile; source requests use the exact separate extension. No new-block support or external model test execution. Actual inspected route is /webhook/tailor-cv.

## **Endpoint**

POST /tailor-cv
Content-Type: application/json

## **Required Fields**

{  
 "cvVersionId": "string",  
 "cvTitle": "string",  
 "blocksSchemaVersion": "1.0",  
 "blocks": \[ /\* full canonical blocks\[\] \*/ \],  
 "jobContextSchemaVersion": "1.0",  
 "jobContext": { /\* extracted job context \*/ },  
 "language": "sv | en"  
}

## **Optional**

{  
 "targetRole": "string"  
}

## **Hard Rules**

* `blocks[]` must be full list (not partial)

* `blocksSchemaVersion` must equal `"1.0"`

* `jobContextSchemaVersion` must equal `"1.0"`

* `jobContext` must exist (otherwise hard fail)

* No rewrittenCv accepted as input

* No derived text accepted

* No new top-level fields allowed

If jobContext saknas → return:

{  
 "ok": false,  
 "blocksSchemaVersion": "1.0",  
 "contractError": {  
   "code": "MISSING\_JOB\_CONTEXT",  
   "message": "Tailoring requires jobContext"  
 }  
}  
