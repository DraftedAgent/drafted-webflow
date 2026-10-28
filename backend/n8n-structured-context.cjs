'use strict';
// Offline prefixes for TWO existing Code nodes. No API, execution or migration.
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,p),'utf8').replace(/\r\n?/g,'\n');
function library(){
 const profiles=['experience-context.js','experience-discovery-contract.js','tailor-sources.js','tailor-sources-v11.js'].map(f=>read('../webflow/src/'+f)).join('\n;\n');
 const refs=read('tailor-source-references.cjs').replace("const profile=require('../webflow/src/tailor-sources.js');",'const profile=Lib.profile;').replace("const contexts=require('../webflow/src/experience-context.js');",'const contexts=Lib.contexts;').replace('module.exports=','return ');
 const recovery=read('tailor-context-recovery-proposal.cjs').replace("const refs=require('./tailor-source-references.cjs');",'').replace('module.exports=','return ');
 const contract=read('tailor-whole-cv/contract.cjs').replace('module.exports={create};','return create(Lib.profile,refs,recovery);');
 const encoder=`const TextEncoder=class{encode(value){let length=0;for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);if(c<128)length++;else if(c<2048)length+=2;else if(c>=55296&&c<=56319&&i+1<value.length&&value.charCodeAt(i+1)>=56320&&value.charCodeAt(i+1)<=57343){length+=4;i++;}else length+=3;}return {length};}};\n`;
 return encoder+`const Lib=(()=>{const globalThis={},module=undefined;\n${profiles}\nreturn {profile:globalThis.DraftedTailorSources,contexts:globalThis.DraftedExperienceContext};})();\nconst refs=(()=>{${refs}})();\nconst recovery=(()=>{${recovery}})();\nconst runtime=(()=>{${contract}})();\n`;
}
function snippets(){
 const fail=`const failure=(status,code)=>[{json:{_tailorSources:true,status,body:{ok:false,blocksSchemaVersion:'1.0',cvVersionId:null,cvTitle:'',summaryOfChanges:'',blocks:[],rewrittenCv:'',rewrittenCvLegacy:'',contractError:{code,message:'Your answer and context are kept. A safe suggestion could not be prepared.'}}}}];\n`;
 const validate=`{const request=$input.first().json.body??$input.first().json;if(request?.sourcesSchemaVersion==='1.2'){\n${library()}${fail}try{Lib.profile.validateRequest(request);const sourceScope=String($execution.id),catalog=runtime.catalog(request,sourceScope);return [{json:{_tailorSources:true,status:200,sourceRequest:request,sourceScope,llmMessages:[{role:'system',content:runtime.prompt},{role:'user',content:JSON.stringify(catalog.modelInput)}]}}];}catch(e){return failure(e.message==='INPUT_TOO_LARGE'?413:400,e.message==='INPUT_TOO_LARGE'?'INPUT_TOO_LARGE':'INVALID_SOURCE_REQUEST');}}}\n`;
 const compose=`{const validated=$node['Validate + Normalize'].json,request=validated.sourceRequest;if(request?.sourcesSchemaVersion==='1.2'){\n${library()}${fail}const raw=$input.first().json;if(raw?.error)return failure(503,'MODEL_UNAVAILABLE');try{if(raw.status!=='completed'||raw.incomplete_details!=null||raw.output?.length!==1)throw Error();const message=raw.output[0];if(message.type!=='message'||message.role!=='assistant'||message.status!=='completed'||message.content?.length!==1)throw Error();const part=message.content[0];if(part.type!=='output_text'||typeof part.text!=='string'||part.text.length>100000)throw Error();let n=0;const used=new Set(request.sourceContext.applications.flatMap(g=>g.additions.map(a=>a.id)));const id=()=>{let value;do{value='context_'+String($execution.id)+'_'+(++n);}while(used.has(value));used.add(value);return value;};const candidate=Lib.profile.candidate(request,runtime.compile(request,JSON.parse(part.text),validated.sourceScope),{id});Lib.profile.validateCandidate(request,candidate);return [{json:{status:200,body:candidate}}];}catch{return failure(422,'INVALID_SOURCE_OUTPUT');}}}\n`;
 return {validate,compose};
}
module.exports={snippets};
