/* Presentation roles belong to the imported representation, not translated display labels. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DraftedCvStructure=factory();})(globalThis,function(){
 'use strict';
 const labels={name:['name','full name','namn'],headline:['professional headline','headline','yrkestitel','profilrad'],contact:['contact details','contact','kontaktuppgifter','kontakt']};
 const normalize=s=>String(s||'').trim().toLowerCase();
 function role(block){return ['otherSections','block'].includes(block.type)?Object.keys(labels).find(key=>labels[key].includes(normalize(block.label)))||null:null;}
 function create(blocks){return {version:1,entries:blocks.map(b=>({blockId:b.blockId,role:role(b),sectionKey:['experience','education','skills','languages','certifications','summary'].includes(b.type)?b.type:b.type+'\u0000'+normalize(b.label)}))};}
 function entry(structure,b){return structure?.version===1&&structure.entries?.find(e=>e.blockId===b.blockId)||create([b]).entries[0];}
 return {create,entry,role};
});
