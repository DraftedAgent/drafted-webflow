'use strict';
const path=require('node:path');
function snippets(){
 const esbuild=require(require.resolve('esbuild',{paths:[path.resolve('site/hosting-work/node_modules')]}));
 const bundled=esbuild.buildSync({entryPoints:[path.resolve('backend/editor-tailor-runtime.cjs')],bundle:true,write:false,platform:'node',format:'iife',globalName:'EditorTailor',minify:true}).outputFiles[0].text;
 const library="const crypto=require('crypto').webcrypto,structuredClone=v=>JSON.parse(JSON.stringify(v)),TextEncoder=class{encode(v){return Buffer.from(v)}};\n"+bundled;
 const failure="const fail=(status,code)=>[{json:{_tailorSources:true,status,body:{ok:false,contractError:{code,message:'Your CV, answers and current suggestions are unchanged.'}}}}];\n";
 return {
 validate:`{const r=$input.first().json.body??$input.first().json;if(r?.sourcesSchemaVersion==='1.5'||r?.schema==='selection-1'||r?.schema==='1.0'&&r.request&&r.candidate){\n${library}${failure}try{const scope=String($execution.id),result=await EditorTailor.prepare(r,scope);if(result.status!==200)return fail(result.status,'INVALID_SOURCE_REQUEST');return [{json:{_tailorSources:true,_draftedEditorStage:true,status:200,sourceRequest:r,sourceScope:scope,llmMessages:result.messages}}];}catch{return fail(400,'INVALID_SOURCE_REQUEST');}}}\n`,
 compose:`{const v=$node['Validate + Normalize'].json;if(v._draftedEditorStage){\n${library}${failure}const raw=$input.first().json;if(raw?.error||raw?._draftedTailorModelFailure)return fail(503,'MODEL_UNAVAILABLE');try{if(raw.status!=='completed'||raw.incomplete_details!=null||raw.output?.length!==1)throw Error();const m=raw.output[0],p=m.content?.[0];if(m.type!=='message'||m.role!=='assistant'||m.status!=='completed'||m.content.length!==1||p.type!=='output_text'||typeof p.text!=='string'||p.text.length>100000)throw Error();const result=await EditorTailor.complete(v.sourceRequest,JSON.parse(p.text),v.sourceScope);return [{json:{status:result.status,body:result.body}}];}catch{return fail(422,'INVALID_SOURCE_OUTPUT');}}}\n`
 };
}
module.exports={snippets};
