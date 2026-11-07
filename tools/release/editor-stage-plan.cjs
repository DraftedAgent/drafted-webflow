'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),C=require('../../webflow/src/cv-coverage-contract.js');
let text='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>text+=chunk);process.stdin.on('end',()=>{
 const w=JSON.parse(text.replace(/^\uFEFF/,''));
 if(w.id!=='H8oAioy58R1v3PvRe3YUa'||!w.active||w.versionId!==w.activeVersionId||C.canonical(w.nodes)!==C.canonical(w.activeVersion.nodes))throw Error('SAVED_ACTIVE_DRIFT');
 const prefix=require('./editor-stage-snippets.cjs').snippets(),dir=path.resolve('output/editor-stage-release'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');fs.mkdirSync(dir,{recursive:true});
 const changedNodes=[];
 for(const [name,key]of [['Validate + Normalize','validate'],['Compose source suggestion','compose']]){
  const node=w.nodes.find(n=>n.name===name);if(!node||node.parameters.jsCode.includes('_draftedEditorStage'))throw Error('NODE_BASELINE_DRIFT');
  const code=prefix[key]+node.parameters.jsCode;fs.writeFileSync(path.join(dir,key+'.js'),code);changedNodes.push({id:node.id,name,key,beforeSHA256:sha(node.parameters.jsCode),candidateSHA256:sha(code)});
 }
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({workflowId:w.id,version:w.versionId,updatedAt:w.updatedAt,changedNodes},null,2));
 console.log(JSON.stringify({workflowId:w.id,version:w.versionId,changedNodes:changedNodes.map(n=>n.name),modelNodes:w.nodes.filter(n=>/model/i.test(n.name)).map(n=>({name:n.name,type:n.type})),connectionsUnchanged:true}));
});
