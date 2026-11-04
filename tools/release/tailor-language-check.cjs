'use strict';
// Read-only guard for the separately approved two-Code-node release. Definitions stay on stdin.
const fs=require('fs'),crypto=require('crypto'),C=require('../../webflow/src/cv-coverage-contract.js');
let data='';process.stdin.on('data',c=>data+=c);process.stdin.on('end',()=>{try{
 const {before,after}=JSON.parse(data.replace(/^\uFEFF/,'')),m=JSON.parse(fs.readFileSync('dev-system/prepared/tailor-quality/language-v14/manifest.json','utf8'));
 if(before.id!==m.workflowId||after.id!==m.workflowId||before.versionId!==m.savedVersion||before.activeVersionId!==m.activeVersion)throw Error('Baseline drift');
 const expected=structuredClone(before),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 for(const [i,n]of m.changedNodes.entries()){
  const a=before.nodes.find(x=>x.id===n.id),b=after.nodes.find(x=>x.id===n.id),code=fs.readFileSync('dev-system/prepared/tailor-quality/language-v14/'+(i?'compose':'validate')+'-candidate.js','utf8');
  if(a.name!==n.name||b.name!==n.name||hash(a.parameters.jsCode)!==n.beforeSHA256||hash(code)!==n.candidateSHA256||b.parameters.jsCode!==code||!code.endsWith(a.parameters.jsCode))throw Error('Code hash/scope mismatch');
  expected.nodes.find(x=>x.id===n.id).parameters.jsCode=code;
 }
 if(C.canonical(expected)!==C.canonical(after))throw Error('Unapproved definition change');
 console.log('Verified: exactly two approved Code fields; legacy suffix, model, routes and all other fields unchanged.');
}catch(e){console.error(e.message);process.exitCode=1;}});
