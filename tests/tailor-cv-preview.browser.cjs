'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const F=require('./fixtures/tailor-sources.cjs'),copy=x=>structuredClone(x),root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/tailor-cv-preview');fs.mkdirSync(out,{recursive:true});
const blocks=[{blockId:'name',type:'otherSections',label:'Name',order:0,text:'Alex Example'},...copy(F.blocks)];
const afterSummary='Product specialist who interviews users and shares findings with digital teams.',added='Coordinated release planning with two developers.';
function envelope(input,changed=false){const next=copy(input.blocks);if(changed){next.find(b=>b.type==='summary').text=afterSummary;next.find(b=>b.type==='experience').text+='\n\n'+added;next.find(b=>b.type==='skills').text='User interviews. Delivery planning.';}return {ok:true,blocksSchemaVersion:'1.0',cvVersionId:changed?'suggested-2':'current-1',cvTitle:'Alex Example',summaryOfChanges:'',blocks:next,rewrittenCv:next.map(b=>b.text).join('\n'),rewrittenCvLegacy:next.map(b=>b.text).join('\n')};}
(async()=>{
 const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_SCENARIO:'sources'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match)resolve(match[0]);});child.on('error',reject);});browser=await chromium.launch({headless:true,channel:'msedge'});
  async function open(width=1536){
   const page=await browser.newPage({viewport:{width,height:1000}}),outside=[],errors=[],requests=[];let candidate;
   page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async route=>{
    const url=route.request().url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
    if(url.endsWith('/webflow/preview/editor-fixture.js')){const response=await route.fetch();return route.fulfill({response,body:(await response.text()).replace('tailorSources:true','tailorSources:false')});}
    if(url.endsWith('/drafted-editor.js')){const response=await route.fetch();return route.fulfill({response,body:(await response.text()).replace('const payload={cvVersionId:cvVersionId||null',"window.__canonical=()=>({blocks:deepClone(documentBlocksState),text:documentTextState,title:documentTitle,version:cvVersionId,selected:[...selectedBlockIds],scope:activeContext});window.__editCurrent=()=>{documentBlocksState=deepClone(documentBlocksState);documentBlocksState.find(b=>b.type==='summary').text='Later explicit edit.';renderDocument(documentTextState);};const payload={cvVersionId:cvVersionId||null")});}
    if(url.endsWith('/preview-api/upload'))return route.fulfill({json:envelope({blocks})});
    if(url.endsWith('/preview-api/tailor')){const input=route.request().postDataJSON();requests.push(input);candidate=envelope(input,true);return route.fulfill({json:candidate});}
    return route.continue();
   });
   await page.goto(base+'?sample=1');await page.locator('#drafted-discovery-guidance').getByRole('button',{name:'Review questions',exact:true}).click();const panel=page.locator('.drafted-discovery');for(let i=0;i<2;i++){await panel.getByRole('textbox').fill('No.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();}await panel.getByRole('heading',{name:'Ready to tailor your CV.',exact:true}).waitFor();await panel.getByRole('button',{name:'Finish and tailor my CV',exact:true}).click();const review=page.getByRole('region',{name:'Tailoring suggestion',exact:true});await review.waitFor();await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
   const host=page.locator('#editor-preview-text'),toolbar=page.locator('.tailor-preview-switch'),state=await page.evaluate(()=>window.__canonical());
   const ready=()=>page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');
   const text=id=>host.locator('[data-cv-source="'+id+'"]').evaluateAll(nodes=>nodes.map(n=>n.textContent).join(''));
   const assertContent=async expected=>{await ready();for(const b of expected)assert.equal(await text(b.blockId),b.text,`${b.blockId}: exact rendered source text`);};
   const navigate=async id=>{await review.locator('[data-review-block-id="'+id+'"]').getByRole('button',{name:/Review .+ in CV/}).click();await ready();assert.equal(await toolbar.getByRole('button',{name:'Suggested',exact:true}).getAttribute('aria-pressed'),'true');};
   const toggle=async mode=>{await toolbar.getByRole('button',{name:mode,exact:true}).click();await ready();};
   return {page,host,toolbar,review,state,text,ready,navigate,toggle,assertContent,requests,get candidate(){return candidate;},async close(){assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);await page.close();}};
  }
  const t=await open();await t.assertContent(blocks);
  await t.page.getByRole('slider',{name:'Preview zoom percentage'}).fill('85');await t.page.getByRole('slider',{name:'Preview zoom percentage'}).dispatchEvent('input');
  for(const [id,name] of [['summary-1','summary'],['experience-1','experience']]){
   await t.navigate(id);await t.assertContent(t.candidate.blocks);assert.deepEqual(await t.page.evaluate(()=>window.__canonical()),t.state);assert.equal(await t.toolbar.getByText('Not applied',{exact:true}).count(),1);assert.equal(await t.page.getByRole('button',{name:'Export PDF',exact:true}).isDisabled(),true);
   assert(!(await t.review.innerText()).includes('Showing '));
   if(id==='summary-1')assert.equal(await t.text(id),afterSummary);else assert((await t.text(id)).includes(added));
   await t.page.locator('.cv-card').screenshot({path:path.join(out,name+'-suggested.png')});
   const target=()=>t.host.locator('[data-block-id="'+id+'"]').first().evaluate(el=>{const p=el.closest('.cv-document');return el.getBoundingClientRect().top-p.getBoundingClientRect().top;});
   const position=await target();await t.toggle('Current');await t.assertContent(blocks);assert(Math.abs(await target()-position)<3,'same block stays at its reading position');assert.equal(await t.page.getByRole('button',{name:'Export PDF',exact:true}).isEnabled(),true);assert.deepEqual(await t.page.evaluate(()=>window.__canonical()),t.state);
   await t.page.locator('.cv-card').screenshot({path:path.join(out,name+'-current.png')});
   await t.toggle('Suggested');await t.assertContent(t.candidate.blocks);assert.equal(await t.page.getByRole('slider',{name:'Preview zoom percentage'}).inputValue(),'85');
  }
  // Same renderer/template, full proposal, and unchanged manual zoom in either mode.
  await t.page.getByRole('combobox',{name:'CV design'}).selectOption('compact_v1');await t.ready();await t.assertContent(t.candidate.blocks);await t.toggle('Current');await t.assertContent(blocks);assert.equal(await t.host.getAttribute('data-cv-design'),'compact_v1');assert.equal(await t.page.getByRole('slider',{name:'Preview zoom percentage'}).inputValue(),'85');
  // A pending Current export cannot accidentally print a newly shown suggestion.
  const printMarks=await t.page.evaluate(async()=>{const frame=await DraftedCvBrowserPrint.prepare(document.querySelector('#editor-preview-text'),'Fixture',document.querySelector('link[href*="drafted-editor.css"]').href);const count=frame.contentDocument.querySelectorAll('.is-selected,.is-tailor-reviewed').length;frame.remove();return count;});assert.equal(printMarks,0);
  const race=await t.page.evaluate(async()=>{const p=DraftedCvBrowserPrint.prepare(document.querySelector('#editor-preview-text'),'Fixture',document.querySelector('link[href*="drafted-editor.css"]').href);document.querySelector('.tailor-preview-switch button:nth-child(2)').click();try{await p;return 'unexpected success';}catch(e){return e.message;}});assert.match(race,/Switch to Current|changed/);await t.ready();
  const blocked=await t.page.evaluate(async()=>{try{await DraftedCvBrowserPrint.prepare(document.querySelector('#editor-preview-text'),'Fixture','unused');return false;}catch{return true;}});assert.equal(blocked,true);assert.equal(await t.page.locator('iframe[data-cv-print]').count(),0);
  await t.page.getByRole('button',{name:'Export PDF',exact:true}).dispatchEvent('click');assert.equal(await t.page.locator('iframe[data-cv-print]').count(),0);
  assert.equal(await t.page.evaluate(()=>!document.dispatchEvent(new KeyboardEvent('keydown',{key:'p',ctrlKey:true,bubbles:true,cancelable:true}))),true);
  await t.page.getByRole('button',{name:'Close CV review',exact:true}).click();await t.assertContent(blocks);assert.equal(await t.toolbar.count(),0);assert.deepEqual(await t.page.evaluate(()=>window.__canonical()),t.state);
  await t.navigate('summary-1');await t.page.getByRole('button',{name:'Expand preview',exact:true}).click();await t.page.locator('.workspace-close-preview').click();await t.page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.cvPreviewMode==='current');await t.assertContent(blocks);assert.equal(await t.toolbar.count(),0);assert.deepEqual(await t.page.evaluate(()=>window.__canonical()),t.state);
  await t.navigate('experience-1');await t.review.getByRole('button',{name:'Apply all changes',exact:true}).click();await t.page.getByText('Your CV is updated. What would you like to change?',{exact:true}).waitFor();await t.assertContent(t.candidate.blocks);assert.deepEqual((await t.page.evaluate(()=>window.__canonical())).blocks,t.candidate.blocks);assert.equal(await t.toolbar.count(),0);assert.equal(await t.host.getAttribute('data-cv-preview-mode'),'current');assert.equal(t.requests.length,1);await t.close();console.log('PASS full exact Current/Suggested text, Summary/Experience screenshot pairs, zoom/template, anchor, export/print race, close and Apply');
  for(const action of ['dismiss','job','cv','source','removed']){
   const s=await open();await s.navigate('summary-1');if(action==='job')await s.page.locator('#job-ad-input').fill('A changed opportunity.');else if(action==='cv')await s.page.evaluate(()=>window.__editCurrent());else if(action==='source'){await s.page.getByRole('button',{name:'Review your answers',exact:true}).click();await s.page.locator('.discovery-history').evaluate(el=>el.open=true);await s.page.getByRole('button',{name:'Correct answer 1',exact:true}).click();await s.page.locator('.drafted-discovery').getByRole('textbox').fill('No.');await s.page.getByRole('button',{name:'Save correction',exact:true}).click();}else if(action==='removed')await s.review.evaluate(el=>el.remove());else await s.review.getByRole('button',{name:'Dismiss',exact:true}).click();await s.ready();assert.equal(await s.toolbar.count(),0);assert.equal(await s.host.getAttribute('data-cv-preview-mode'),'current');
   if(action==='cv'){assert.equal(await s.text('summary-1'),'Later explicit edit.');assert(!(await s.text('experience-1')).includes(added));}else await s.assertContent(blocks);
   if(!['dismiss','removed'].includes(action)){if(action==='source')await s.page.getByRole('button',{name:'Chat',exact:true}).click();assert.equal(await s.review.getByRole('button',{name:'Apply all changes',exact:true}).isDisabled(),true);await s.review.getByRole('button',{name:/Review .+ in CV/}).first().click();assert.equal(await s.toolbar.count(),0);}
   await s.close();console.log('PASS '+action+' exits Suggested and retains canonical CV; stale actions stay blocked');
  }
  const mobile=await open(390);await mobile.navigate('experience-1');await mobile.assertContent(mobile.candidate.blocks);assert.equal(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mobile.toolbar.screenshot({path:path.join(out,'mobile-toolbar.png')});await mobile.toggle('Current');await mobile.assertContent(blocks);await mobile.close();console.log('PASS mobile version controls and complete rendered content');
 }finally{if(browser)await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
