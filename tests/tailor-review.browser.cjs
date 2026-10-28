'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const F=require('./fixtures/tailor-sources.cjs'),copy=x=>structuredClone(x);
const output=path.resolve(__dirname,'../output/pdf/tailor-review');fs.mkdirSync(output,{recursive:true});
const original=copy(F.blocks);
original.unshift({blockId:'name',type:'otherSections',label:'Name',order:0,text:'Alex Example'});
original.find(b=>b.blockId==='experience-1').text=Array.from({length:30},(_,i)=>`• Documented project ${i+1}, coordinated review meetings and shared findings with the team.`).join('\n');
original.find(b=>b.blockId==='skills-1').text='User interviews.\n\nSelf-motivated and detail-oriented.';
const addition='Managed several project deliveries over many years.',html='• Granskade <img src=x onerror="window.__unsafe=true"> och förklarade ändringar för åtta kollegor.';
function result(request,kind){
 const blocks=copy(request.blocks),get=id=>blocks.find(b=>b.blockId===id);
 if(['added','mixed','long'].includes(kind))get('experience-1').text+='\n\n'+addition;
 if(['removed','mixed'].includes(kind))get('skills-1').text='User interviews.';
 if(['rewritten','mixed','long'].includes(kind))get('summary-1').text='Product specialist who interviews users and shares findings with digital teams.';
 if(kind==='mixed')get('experience-1').text=get('experience-1').text.replace('project 1,','project one,').replace('project 20,','project twenty,');
 if(kind==='unsafe')get('experience-1').text+='\n\n'+html;
 if(kind==='spacing')get('project-1').text=get('project-1').text.replace('Volunteered with','Volunteered  with');
 if(kind==='long')get('project-1').text=Array.from({length:60},(_,i)=>`• Planned workshop ${i+1}; documented the outcome in Swedish: å, ä, ö.`).join('\n');
 if(kind==='structural')get('experience-1').employer='Unexpected new employer';
 return {ok:true,blocksSchemaVersion:'1.0',cvVersionId:'candidate-2',cvTitle:request.cvTitle,summaryOfChanges:'Model claim is never used as a diff.',blocks,rewrittenCv:blocks.map(b=>b.text).join('\n'),rewrittenCvLegacy:blocks.map(b=>b.text).join('\n')};
}
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_SCENARIO:'sources'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',d=>{text+=d;const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});
  browser=await chromium.launch({headless:true,channel:'msedge'});
  async function open(kind,viewport={width:1536,height:1000}){
   const page=await browser.newPage({viewport}),requests=[],outside=[],errors=[];
   page.on('pageerror',e=>errors.push(e.message));let candidate;
   await page.route('**/*',async route=>{
    const url=route.request().url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
    if(url.endsWith('/webflow/preview/editor-fixture.js')){const r=await route.fetch();return route.fulfill({response:r,body:(await r.text()).replace('tailorSources:true','tailorSources:false')});}
    if(url.endsWith('/drafted-editor.js')){const r=await route.fetch();const body=(await r.text()).replace("const payload={cvVersionId:cvVersionId||null", "window.__reviewState=()=>({blocks:documentBlocksState,selected:[...selectedBlockIds],scope:activeContext});window.__editCurrent=()=>{documentBlocksState=deepClone(documentBlocksState);documentBlocksState.find(b=>b.blockId==='summary-1').text='Later explicit editor change.';renderDocument(documentTextState);refreshTailorPresentation();};const payload={cvVersionId:cvVersionId||null");return route.fulfill({response:r,body});}
    if(url.endsWith('/preview-api/upload'))return route.fulfill({json:{...result({blocks:original,cvTitle:'Alex Example'},'unchanged'),cvVersionId:'original-1'}});
    if(url.endsWith('/preview-api/tailor')){const r=route.request().postDataJSON();requests.push(r);candidate=result(r,kind);return route.fulfill({json:candidate});}
    return route.continue();
   });
   await page.goto(base+'?sample=1');const cv=page.locator('.cv-document-inner'),review=page.getByRole('region',{name:'Tailoring suggestion',exact:true});
   await page.locator('#drafted-discovery-guidance').getByRole('button',{name:'Review questions',exact:true}).click();const panel=page.locator('.drafted-discovery');
   for(let n=0;n<2;n++){await panel.getByRole('textbox').fill('No.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();}
   await panel.getByRole('heading',{name:'Ready to tailor your CV.',exact:true}).waitFor();const before=await cv.innerText();
   await panel.getByRole('button',{name:'Finish and tailor my CV',exact:true}).click();
   if(kind==='unchanged')await page.getByText('No changes suggested',{exact:true}).waitFor();else if(kind==='structural')await page.getByText('Tailoring failed. Try again.',{exact:true}).waitFor();else await review.waitFor();
   await page.locator('.section-editor').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
   assert.equal(await cv.innerText(),before);assert.deepEqual((await page.evaluate(()=>window.__reviewState())).blocks,requests[0].blocks);
   assert.equal(await page.locator('.tailor-proposed-cv').count(),0);assert(!((await review.count())&&(await review.innerText()).includes('Model claim')));
   return {page,cv,review,before,requests,outside,errors,get candidate(){return candidate;},async close(){assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);await page.close();}};
  }
  for(const kind of ['added','removed','rewritten','mixed','unsafe','spacing','long','unchanged','structural']){
   const t=await open(kind),{page,review,cv,requests}=t;
   if(['unchanged','structural'].includes(kind)){assert.equal(await review.count(),0);assert.equal(await page.getByRole('button',{name:'Apply all changes',exact:true}).count(),0);await t.close();continue;}
   const ids=await review.locator('[data-review-block-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.reviewBlockId));
   assert.equal(new Set(ids).size,ids.length);assert(!ids.includes('name'));assert(!ids.includes('project-1')||['long','spacing'].includes(kind));
   await review.getByRole('heading',{name:`${ids.length} changed ${ids.length===1?'block':'blocks'}`,exact:true}).waitFor();
   assert.equal(await review.locator('.tailor-review-status').innerText(),'Not applied');
   if(kind==='added'){
    const change=review.locator('[data-review-block-id="experience-1"]');assert.equal((await change.locator('.tailor-diff-text').innerText()).trim(),addition);assert.equal(await change.locator('[data-change-kind="Added"]').count(),1);assert(!(await change.innerText()).includes('project 1,'));
   }
   if(kind==='removed'){assert.equal((await review.locator('[data-change-kind="Removed"] del').innerText()).trim(),'Self-motivated and detail-oriented.');}
   if(kind==='rewritten'){assert.equal(await review.getByText('Before',{exact:true}).count(),1);assert.equal(await review.getByText('After',{exact:true}).count(),1);assert(await review.locator('.tailor-mark-added').count());assert(await review.locator('.tailor-mark-before').count());}
   if(kind==='mixed'){assert.equal(ids.length,3);assert.equal(await review.locator('[data-review-block-id="experience-1"] .tailor-edit').count(),3);}
   if(kind==='unsafe'){assert((await review.locator('.tailor-diff-text').innerText()).includes(html));assert.equal(await review.locator('img,script').count(),0);assert.equal(await page.evaluate(()=>window.__unsafe),undefined);}
   if(kind==='spacing')await review.getByText('Spacing or line breaks changed',{exact:true}).waitFor();
   // Footer occupies its own row, never overlays or scrolls over the text.
   const geometry=await review.evaluate(card=>{const body=card.querySelector('.tailor-review-body').getBoundingClientRect(),footer=card.querySelector('footer').getBoundingClientRect(),chat=card.closest('.chat-messages').getBoundingClientRect();return {bodyBottom:body.bottom,footerTop:footer.top,footerBottom:footer.bottom,chatBottom:chat.bottom};});
   assert(geometry.bodyBottom<=geometry.footerTop+1);assert(geometry.footerBottom<=geometry.chatBottom+1);
   if(['added','removed','rewritten','mixed'].includes(kind)){await page.screenshot({path:path.join(output,kind+'-desktop.png')});await review.screenshot({path:path.join(output,kind+'-card.png')});}
   await cv.locator('[data-block-id="experience-1"]').first().click();
   const state=await page.evaluate(()=>window.__reviewState());assert.equal(state.scope,'blocks');assert.deepEqual(state.selected,['experience-1']);
   await review.getByRole('button',{name:/Review .+ in CV/}).first().click();await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');assert.deepEqual(await page.evaluate(()=>window.__reviewState()),state);assert(await cv.locator('.is-tailor-reviewed').count());assert.equal(await page.locator('.tailor-preview-switch').getByRole('button',{name:'Suggested',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(requests.length,1);
   if(kind==='long'){await review.locator('.tailor-review-body').focus();await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('.tailor-review-body').scrollTop>0);}
   if(kind==='mixed'){for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.locator('.section-editor').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await review.locator('.tailor-review-body').evaluate(e=>e.scrollTop=0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const body=await review.boundingBox(),footer=await review.locator('footer').boundingBox();assert(footer.y>=body.y&&footer.y+footer.height<=body.y+body.height+1);await page.screenshot({path:path.join(output,`mixed-${width}.png`)});}}
   await review.getByRole('button',{name:'Apply all changes',exact:true}).click();await page.getByText('Your CV is updated. What would you like to change?',{exact:true}).waitFor();assert.deepEqual((await page.evaluate(()=>window.__reviewState())).blocks,t.candidate.blocks);assert.equal(requests.length,1);assert.equal(await review.count(),0);assert.equal(await page.getByRole('button',{name:'Apply all changes',exact:true}).count(),0);
   await t.close();console.log('PASS '+kind+' visible text, deterministic count/markers, safe DOM, navigation preserves scope, unchanged current CV, explicit one-request Apply');
  }
  for(const stale of ['dismiss','job','cv']){
   const t=await open('added');if(stale==='job')await t.page.locator('#job-ad-input').fill('A different opportunity.');if(stale==='cv')await t.page.evaluate(()=>window.__editCurrent());
   if(stale!=='dismiss'){await t.page.getByText('Needs update',{exact:true}).waitFor();assert(await t.review.getByRole('button',{name:'Apply all changes',exact:true}).isDisabled());const later=await t.page.evaluate(()=>window.__reviewState());await t.review.getByRole('button',{name:'Apply all changes',exact:true}).evaluate(b=>b.click());assert.deepEqual(await t.page.evaluate(()=>window.__reviewState()),later);}
   const before=await t.cv.innerText();await t.review.getByRole('button',{name:'Dismiss',exact:true}).click();assert.equal(await t.review.count(),0);assert.equal(await t.cv.innerText(),before);assert.equal(t.requests.length,1);await t.close();console.log('PASS '+stale+' preserves current work and removes active Apply');
  }
 }finally{await browser?.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
