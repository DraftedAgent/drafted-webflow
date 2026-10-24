'use strict';
// DEV-101 owner-approved one-Code-node preparation. No network/execution entry point.
const fs=require('node:fs'),path=require('node:path'),{hash}=require('./n8n-tailor-source-references.cjs');
const ID='H8oAioy58R1v3PvRe3YUa',BASE='f024a1b5-9907-446b-9321-ff2f31ac351d',BASE_HASH='4d62d46673f19f07d4a857606da0219867c37ef85e39184fa6766b292dfdad46';
function patch(code){
 const marker="const validated=$node['Validate + Normalize'].json,request=validated.sourceRequest,raw=$input.first().json;",before='sourceReferences.compile(request,JSON.parse(part.text),validated.sourceScope)';
 if(code.includes('const sourceContextRecovery=')||code.split(marker).length!==2||code.split(before).length!==2)throw Error('TAILOR_CODE_CHANGED');
 let library=fs.readFileSync(path.join(__dirname,'tailor-context-recovery-proposal.cjs'),'utf8').replace(/\r\n?/g,'\n');
 const dependency="const refs=require('./tailor-source-references.cjs');";
 if(library.split(dependency).length!==2||library.split('module.exports=').length!==2)throw Error('CONTEXT_LIBRARY_CHANGED');
 library='\nconst sourceContextRecovery=(()=>{\n'+library.replace(dependency,'const refs=sourceReferences;').replace('module.exports=','return ')+'\n})();\n';
 return code.replace(marker,()=>library+marker).replace(before,'sourceContextRecovery.compile(request,JSON.parse(part.text),validated.sourceScope)');
}
function prepare(w){
 if(w.id!==ID||!w.active||w.versionId!==BASE||w.activeVersionId!==BASE||hash({nodes:w.nodes,connections:w.connections,settings:w.settings})!==BASE_HASH)throw Error('TAILOR_BASE_CHANGED');
 if(w.activeVersion&&(hash(w.activeVersion.nodes)!==hash(w.nodes)||hash(w.activeVersion.connections)!==hash(w.connections)))throw Error('TAILOR_ACTIVE_DRIFT');
 const next=structuredClone(w),node=next.nodes.find(n=>n.name==='Compose source suggestion');if(node?.type!=='n8n-nodes-base.code')throw Error('TAILOR_NODE_CHANGED');node.parameters.jsCode=patch(node.parameters.jsCode);return next;
}
module.exports={ID,BASE,BASE_HASH,prepare,patch};
