'use strict';
// DEV-098: owner-approved, exactly two Code nodes; pure preparation only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ID='H8oAioy58R1v3PvRe3YUa',BASE='c143d087-8803-40d5-8c94-6425780d8afe';
const BASE_HASH='315160d3114f5c41d39e530be4c355ee1f837122e0dbfbf1fb353bf0e91bbcca';
function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;}
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(sort(x))).digest('hex');
function library(){
 let code=fs.readFileSync(path.join(__dirname,'tailor-source-references.cjs'),'utf8').replace(/\r\n?/g,'\n');
 const dependency="const profile=require('../webflow/src/tailor-sources.js');";
 if(code.split(dependency).length!==2||code.split('module.exports=').length!==2)throw Error('REFERENCE_LIBRARY_CHANGED');
 const context=fs.readFileSync(path.join(__dirname,'../webflow/src/experience-context.js'),'utf8');
 return '\nconst sourceReferences=(()=>{\nconst contexts=(()=>{const globalThis={},module=undefined;\n'+context+'\nreturn globalThis.DraftedExperienceContext;})();\n'+code.replace(dependency,'const profile=sourceProfile;').replace("const contexts=require('../webflow/src/experience-context.js');",'').replace('module.exports=','return ')+'\n})();\n';
}
function once(code,before,after){if(code.split(before).length!==2)throw Error('TAILOR_CODE_CHANGED');return code.replace(before,()=>after);}
function patch(code,prompt){
 if(code.includes('const sourceReferences='))throw Error('ALREADY_PATCHED');
 if(prompt){
  const suffix=require('./n8n-tailor-context-prompt.cjs').AFTER;
  code=once(code,'const sourceRoot=$input.first().json,sourceRequest=sourceRoot?.body??sourceRoot;',library()+'const sourceRoot=$input.first().json,sourceRequest=sourceRoot?.body??sourceRoot;');
  code=once(code,'sourceProfile.validateRequest(sourceRequest);return [{json:{_tailorSources:true,status:200,sourceRequest,llmMessages:',"sourceProfile.validateRequest(sourceRequest);const sourceScope=String($execution.id),sourceCatalog=sourceReferences.catalog(sourceRequest,sourceScope);return [{json:{_tailorSources:true,status:200,sourceRequest,sourceScope,llmMessages:");
  code=once(code,suffix,'sourceReferences.prompt');
  return once(code,'JSON.stringify(sourceProfile.modelInput(sourceRequest))','JSON.stringify(sourceCatalog.modelInput)');
 }
 code=once(code,"const validated=$node['Validate + Normalize'].json,request=validated.sourceRequest,raw=$input.first().json;",library()+"const validated=$node['Validate + Normalize'].json,request=validated.sourceRequest,raw=$input.first().json;");
 return once(code,'sourceProfile.candidate(request,JSON.parse(part.text),{id})','sourceProfile.candidate(request,sourceReferences.compile(request,JSON.parse(part.text),validated.sourceScope),{id})');
}
function prepare(w){
 if(w.id!==ID||w.versionId!==BASE||w.activeVersionId!==BASE||w.active!==true||hash({nodes:w.nodes,connections:w.connections,settings:w.settings})!==BASE_HASH)throw Error('TAILOR_BASE_CHANGED');
 if(w.activeVersion&&(hash(w.activeVersion.nodes)!==hash(w.nodes)||hash(w.activeVersion.connections)!==hash(w.connections)))throw Error('TAILOR_ACTIVE_DRIFT');
 const next=structuredClone(w);
 for(const name of ['Validate + Normalize','Compose source suggestion']){const n=next.nodes.find(n=>n.name===name);if(n?.type!=='n8n-nodes-base.code')throw Error('TAILOR_NODE_CHANGED');n.parameters.jsCode=patch(n.parameters.jsCode,name==='Validate + Normalize');}
 return next;
}
module.exports={ID,BASE,BASE_HASH,hash,prepare,patch};
