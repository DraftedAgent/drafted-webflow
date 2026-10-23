'use strict';
const base=require('./cv-pagination.cjs');
const {prepareUploadPresentation}=require('../../backend/cv-upload-source-guard.cjs');
const person={fullName:'Åsa Example',currentTitle:'Digital Transformation · Product Development · Innovation',location:'Göteborg, Sweden',email:'asa@example.org',phone:'+46 70 000 00 00',otherContacts:['https://example.org/portfolio','https://www.linkedin.com/in/synthetic-example']};
const cases={};
for(const name of ['complete','no-name','no-headline','no-contact','none','long','source-artifacts','legitimate-parentheses']){
  const personalInfo=structuredClone(person),body=structuredClone(name==='long'?base.multi:base.short);
  if(name==='no-name')personalInfo.fullName='';
  if(name==='no-headline')personalInfo.currentTitle='';
  if(name==='no-contact')for(const key of ['location','email','phone','otherContacts'])delete personalInfo[key];
  if(name==='none')for(const key of Object.keys(personalInfo))delete personalInfo[key];
  if(name==='long')personalInfo.currentTitle='Designing humane services — research, delivery, mentoring and cross-functional collaboration (part-time). '.repeat(8).trim();
  const sourceExperiencesByBlockId={};
  if(name==='source-artifacts'||name==='legitimate-parentheses'){
    const block=body.blocks.find(b=>b.type==='experience');Object.assign(block,{title:'',employer:'',startDate:'2025',endDate:'Present',text:'• Built a synthetic service (with explicit user feedback).\n•\n(employer and title: blank, from the parsed CV; period: 2025 - Present)'});
    sourceExperiencesByBlockId[block.blockId]={title:'',employer:'',descriptionRaw:name==='legitimate-parentheses'?block.text:'Built a synthetic service (with explicit user feedback).',bulletsRaw:[]};
  }
  const modelBlocks=structuredClone(body.blocks),prepared=prepareUploadPresentation({blocks:modelBlocks,parsedCvJson:{personalInfo},sourceExperiencesByBlockId});
  cases[name]={title:name==='no-headline'?'Legacy document label':'',blocks:prepared.blocks,personalInfo,changes:prepared.changes,modelBlocks};
}
module.exports={cases,envelope:base.envelope};
