'use strict';
// Exact synthetic bilingual fixture, not a translation service.
const base=require('./tailor-integration-fixture.cjs');
const pairs=[
 ['Product specialist working with digital teams.','Produktspecialist som arbetar med digitala team.'],
 ['Interviewed five users and shared their feedback.','Intervjuade fem användare och sammanställde deras synpunkter.'],
 ['Volunteered with a local community group.','Arbetade ideellt med en lokal grupp.'],
 ['Delivery Coordinator','Leveranskoordinator'],
 ['Independent project','Eget projekt'],
 ['Documented a personal project.','Dokumenterade ett eget projekt.'],
 ['User interviews.','Användarintervjuer.'],['Profile','Profil'],['Experience','Erfarenhet'],['Summary','Sammanfattning'],['Skills','Färdigheter'],['Community Project','Lokalt projekt'],['Product Specialist','Produktspecialist'],['Present','Nuvarande'],['Name','Namn'],['Contact details','Kontaktuppgifter']
];
const dictionaries={en:Object.fromEntries(pairs.map(([en,sv])=>[sv,en])),sv:Object.fromEntries(pairs)};
function model(c){const m=base.model(c);if(!c.documentFields)return m;const dictionary=dictionaries[c.language],known=new Set(pairs.map(p=>p[c.language==='en'?0:1]));const translate=(text,metadata=false)=>{if(Object.hasOwn(dictionary,text))return dictionary[text];if(!text||known.has(text)||/^\d[\d –-]*$/.test(text)||text==='Alex Example'||metadata&&['2022','2024'].includes(text))return text;throw Error('Unknown synthetic wording');};const document=[];
for(const d of c.documentFields){const t=c.targets.find(t=>t.blockId===d.blockId),existing=t&&m.integrations.find(i=>i.targetKey===t.targetKey);let state='target_language';if(existing)state=existing.segments.map(s=>s.text).join('\n')===d.currentText?'target_language':'translated';else{const after=c.documentPolicy?.mode==='preserve_structure'?d.currentText:translate(d.currentText);if(after!==d.currentText){if(!t)throw Error('Source checkpoint is unavailable');m.integrations.push({targetKey:t.targetKey,segments:[{text:after,cvEvidenceKeys:c.cvEvidence.filter(e=>e.blockId===d.blockId).map(e=>e.evidenceKey),answerSourceKeys:[]}]});state='translated';}else if(d.currentText==='Alex Example')state='proper_name';}document.push({documentKey:d.documentKey,textState:state,fields:Object.fromEntries(Object.entries(d.fields).map(([k,v])=>[k,c.documentPolicy?.mode==='preserve_structure'?v:translate(v,true)]))});}
return {...m,document};}
module.exports={model,pairs};
