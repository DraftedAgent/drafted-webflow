> Local-only extension approved 2026-10-23: [Tailor source profile 1.0](../../../contracts/tailor-sources-v1.md) defines typed user-source additions to relevant existing blocks, traced receipts and multi-Apply correction handling. Implemented only in the isolated localhost handler; the deployed workflow and the legacy endpoint contract below are unchanged. No new-block support or external execution is authorized. The no-new-fields rule below continues to govern requests to the deployed workflow.

## **Endpoint**

POST /webflow-tailor-cv  
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
