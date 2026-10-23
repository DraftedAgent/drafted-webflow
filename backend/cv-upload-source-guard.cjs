'use strict';
// Local integration candidate. Not connected to a production workflow.
// Run where canonical block IDs already have authoritative parser provenance.
const value=x=>typeof x==='string'&&x.trim()?x:'';
const normalized=x=>String(x||'').normalize('NFKC').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim().toLowerCase();
function prepareUploadPresentation({blocks,parsedCvJson,sourceExperiencesByBlockId={}}){
  const result=blocks.map(block=>({...block})),changes=[];
  for(const block of result){
    const source=sourceExperiencesByBlockId[block.blockId];
    if(block.type!=='experience'||!source)continue;
    const raw=[source.descriptionRaw,...(source.bulletsRaw||[])].filter(x=>typeof x==='string').join('\n');
    const rawLines=raw.split(/\r?\n/).map(x=>x.trim());
    block.text=String(block.text||'').split(/(?<=\n)/).filter(line=>{
      const text=line.trim();
      if(/^[•▪‣]$/.test(text)&&!rawLines.includes(text)){
        changes.push({blockId:block.blockId,kind:'model-empty-list-marker'});return false;
      }
      const note=text.match(/^(?:[•▪‣]\s*)?\(employer and title: blank, from the parsed CV; period: ([^)]+)\)$/);
      if(note&&!value(block.employer)&&!value(block.title)&&!value(source.employer)&&!value(source.title)
        &&normalized(note[1])===normalized([block.startDate,block.endDate].filter(Boolean).join(' - '))
        &&!raw.includes(text.replace(/^[•▪‣]\s*/,''))){
        changes.push({blockId:block.blockId,kind:'model-parser-diagnostic'});return false;
      }
      return true;
    }).join('');
  }
  const person=parsedCvJson?.personalInfo||{};
  const contact=[person.location,person.email,person.phone,...(Array.isArray(person.otherContacts)?person.otherContacts:[])].map(value).filter(Boolean).join('\n');
  const fields=[['name','Name',value(person.fullName)],['headline','Professional headline',value(person.currentTitle)],['contact','Contact details',contact]];
  const header=fields.filter(([, ,text])=>text).map(([key,label,text],i)=>({blockId:`source-header-${key}`,type:'otherSections',label,order:-30+i*10,text}));
  if(header.some(h=>result.some(b=>b.blockId===h.blockId)))throw Error('Source header block ID collision');
  return {blocks:[...header,...result],changes};
}
module.exports={prepareUploadPresentation};
