'use strict';
// Read-only inspection input: selected Code-node sources, never whole workflow credentials or personal execution data.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const {patchCanonicalizer}=require('../backend/cv-upload-header-integration.cjs');
const nodes=JSON.parse(fs.readFileSync(0,'utf8')),results=[];
for(const node of nodes){
 const code=patchCanonicalizer(node.code),source={fullName:'Åsa Example',currentTitle:'Research & delivery (interim)',email:'asa@example.org',otherContacts:['https://example.org']};
 const parsed={personalInfo:source,experiences:[{employer:'',title:'',startDateRaw:'2025',endDateRaw:'Present',descriptionRaw:'Built a synthetic service (with users).',bulletsRaw:[]}],education:[],skills:[],languages:[],certifications:[]};
 const model={cvVersionId:'synthetic-header-v1',cvTitle:'A document label',summaryOfChanges:'',blocks:[{type:'summary',label:'Profile',order:10,text:'Synthetic summary.'},{type:'experience',label:'Experience',order:30,employer:'',title:'',startDate:'2025',endDate:'Present',text:'• Built a synthetic service (with users).\n•\n(employer and title: blank, from the parsed CV; period: 2025 - Present)'}]};
 const run=(body,cv)=>vm.runInNewContext(`(function(){${body}\n})()`,{$json:{sanitizedModelJson:model,parsedCvJson:cv,cvVersionId:'synthetic-header-v1'},console:{log(){},warn(){},error(){}}},{timeout:2000}).json;
 const before=run(node.code,parsed),after=run(code,parsed);
 assert.equal(before.ok,true);assert.equal(after.ok,true);
 assert.equal(after.blocks.find(b=>b.label==='Name').text,source.fullName);assert.equal(after.blocks.find(b=>b.label==='Professional headline').text,source.currentTitle);
 assert.ok(after.blocks.find(b=>b.label==='Contact details').text.includes(source.email));
 const experience=after.blocks.find(b=>b.type==='experience');assert.ok(!experience.text.includes('from the parsed CV'));assert.ok(!/^\s*•\s*$/m.test(experience.text));assert.ok(experience.text.includes('(with users)'));
 assert.deepEqual(Array.from(after.blocks).filter(b=>!b.blockId.startsWith('source-header-')).map(b=>b.blockId),Array.from(before.blocks).map(b=>b.blockId));
 const missing=run(code,{...parsed,personalInfo:{}});assert.equal(missing.blocks.some(b=>b.blockId.startsWith('source-header-')),false);
 results.push({node:node.name,sourceSha256:crypto.createHash('sha256').update(node.code).digest('hex'),parserFactsRetained:true,modelArtefactsRepaired:true,bodyIdsUnchanged:true,missingFactsNotInvented:true});
}
const out=path.resolve(__dirname,'../output/pdf/cv-header');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'backend-node-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
