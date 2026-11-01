(async()=>{
 const data=await (await fetch('content.json')).json(),params=new URLSearchParams(location.search),design=params.get('design')==='executive'?'executive':'studio',short=params.get('length')==='short';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const units=[];const header=el('header','header'),identity=el('div');identity.append(el('h1','name',data.name),el('p','headline',data.headline));const contacts=el('div','contacts');data.contacts.forEach(t=>contacts.append(el('div','',t)));header.append(identity,contacts);units.push(header,el('p','profile',data.summary));
 function section(label,items){const heading=el('h2','section-title',label);heading.dataset.keep='next';units.push(heading);for(const item of items){const entry=el('article','entry'),body=el('div','body');entry.append(el('div','date',item.date));body.append(el('h3','',item.title));if(item.role)body.append(el('p','role',item.role));if(item.bullets){const list=el('ul');for(const bullet of item.bullets)list.append(el('li','',bullet));body.append(list);}entry.append(body);units.push(entry);}}
 section('Experience',short?data.experience.slice(0,1):data.experience);
 section('Education',short?data.education.slice(0,1):data.education);
 const skillsTitle=el('h2','section-title','Technical expertise');skillsTitle.dataset.keep='next';units.push(skillsTitle,el('p','skills',data.skills));if(!short)section('Selected publications',data.publications);
 const host=document.querySelector('.pages');let page,flow;const pages=[];
 function addPage(){page=el('section','page '+design);flow=el('div','flow');page.append(flow);host.append(page);pages.push(page);if(pages.length>1)flow.append(el('div','continuation',data.name));}
 await document.fonts.ready;addPage();
 const fits=()=>flow.scrollHeight<=flow.clientHeight+1;
 for(let i=0;i<units.length;i++){const node=units[i];flow.append(node);let probe;if(node.dataset.keep&&units[i+1]){probe=units[i+1].cloneNode(true);flow.append(probe);}const ok=fits();probe?.remove();if(!ok&&flow.children.length>1){node.remove();addPage();flow.append(node);}}
 pages.forEach((p,i)=>{const footer=el('footer','footer');footer.append(el('span','',data.name),el('span','',`${String(i+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`));p.append(footer);});
 window.study={ready:true,design,short,pages:pages.length,overflow:pages.some(p=>p.querySelector('.flow').scrollHeight>p.querySelector('.flow').clientHeight+1),content:units.map(n=>n.textContent)};
})();
