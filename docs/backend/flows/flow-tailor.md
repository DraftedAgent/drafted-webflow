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
