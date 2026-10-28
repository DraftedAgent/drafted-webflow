'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),{createHandler}=require('../backend/experience-discovery.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/experience-intro');fs.mkdirSync(out,{recursive:true});
(async()=>{const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_SCENARIO:'sources-batches'},stdio:['ignore','pipe','pipe']});let browser;
try{
 const base=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',chunk=>{text+=chunk;const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});browser=await chromium.launch({headless:true,channel:'msedge'});
 async function open({width=1536,height=1000,plain=false,zero=false,sample=true}={}){
  const page=await browser.newPage({viewport:{width,height}}),outside=[],errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async route=>{
   const req=route.request(),url=req.url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
   if(plain&&url.endsWith('/webflow/preview/editor-fixture.js')){const response=await route.fetch();return route.fulfill({response,body:(await response.text()).replace('tailorSources:true','tailorSources:false')});}
   if(zero&&url.endsWith('/webflow-experience-discovery')){const result=await createHandler({model:()=>({topics:[]})})(req.postDataJSON());return route.fulfill({status:result.status,json:result.body});}
   if(url.endsWith('/preview-api/chat'))return route.fulfill({json:{ok:true,message:'We can make the opening paragraph clearer.'}});
   if(plain&&url.endsWith('/preview-api/tailor')){const r=req.postDataJSON(),blocks=structuredClone(r.blocks);blocks.find(b=>b.type==='summary').text='A clearer product specialist summary.';const text=blocks.map(b=>b.text).join('\n');return route.fulfill({json:{ok:true,blocksSchemaVersion:'1.0',cvVersionId:'candidate-2',cvTitle:r.cvTitle,blocks,summaryOfChanges:'',rewrittenCv:text,rewrittenCvLegacy:text}});}
   return route.continue();
  });
  await page.goto(base+(sample?'?sample=1':''));const guide=page.locator('#drafted-discovery-guidance'),host=page.locator('.chat-messages'),input=page.locator('#editor-input'),panel=page.locator('.drafted-discovery');
  if(sample){await page.waitForFunction(()=>document.querySelector('.discovery-launcher').dataset.planState==='ready');await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(100);}
  return {page,guide,host,input,panel,async close(){assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);await page.close();}};
 }
 const t=await open();const before=await t.page.locator('.cv-document-inner').innerText();
 assert.match(await t.guide.innerText(),/Answer 5 questions to uncover experience relevant to this role\./);assert.equal(await t.guide.locator('h2,p,button').count(),3);assert(!/We have|Start with|Apply|afterwards/.test(await t.guide.innerText()));
 // System introduction alone does not start a conversation or push the group away.
 await t.host.evaluate(host=>{const note=document.createElement('div');note.className='chat-message system';note.textContent='Your CV is ready.';host.append(note);});await t.page.waitForFunction(()=>document.querySelector('.chat-messages').classList.contains('is-discovery-start'));assert.equal(await t.page.getByText('Your CV is ready.',{exact:true}).isVisible(),false);
 for(const size of [{width:1536,height:1000},{width:1024,height:768},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await t.page.setViewportSize(size);await t.page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await t.host.evaluate(el=>el.scrollTop=0);
  const g=await t.guide.boundingBox(),h=await t.host.boundingBox(),c=await t.page.locator('.workspace-composer').boundingBox();assert(g.width<=440.5);assert(Math.abs((g.x+g.width/2)-(h.x+h.width/2))<10);assert(h.y+h.height<=c.y+1,'composer stays below the scrolling area');assert.equal(await t.input.isVisible(),true);
  if(g.height<h.height)assert(Math.abs((g.y+g.height/2)-(h.y+h.height/2))<8,'start group centered in left work area');
  for(const target of [t.guide.locator('h2'),t.guide.getByRole('button',{name:'Review questions',exact:true})]){await target.scrollIntoViewIfNeeded();const r=await target.boundingBox(),pane=await t.host.boundingBox();assert(r.y>=pane.y-1&&r.y+r.height<=pane.y+pane.height+1,'heading/button reachable without composer overlap: '+JSON.stringify({size,r,pane,c}));}
  assert.equal(await t.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await t.page.screenshot({path:path.join(out,`start-${size.width}x${size.height}.png`)});
 }
 await t.page.setViewportSize({width:1536,height:1000});await t.guide.getByRole('button',{name:'Review questions',exact:true}).click();assert.equal(await t.host.evaluate(el=>el.classList.contains('is-discovery-start')),false);assert.equal(await t.panel.getByRole('textbox').isVisible(),true);
 await t.panel.getByRole('button',{name:'Back to editor',exact:true}).click();assert.equal(await t.guide.isVisible(),true);assert.equal(await t.host.evaluate(el=>el.classList.contains('is-discovery-start')),true);
 await t.guide.getByRole('button',{name:'Review questions',exact:true}).click();for(let i=0;i<4;i++)await t.panel.getByRole('button',{name:'Skip',exact:true}).click();await t.panel.getByRole('button',{name:'Back to editor',exact:true}).click();assert.match(await t.guide.innerText(),/Answer 1 question to uncover experience relevant to this role\./);assert.equal(await t.page.locator('.cv-document-inner').innerText(),before);
 await t.input.fill('Please make the opening paragraph clearer.');assert.equal(await t.guide.isVisible(),true);await t.page.locator('#editor-chat-send').click();await t.page.getByText('We can make the opening paragraph clearer.',{exact:true}).waitFor();assert.equal(await t.guide.isVisible(),false);assert.equal(await t.host.evaluate(el=>el.classList.contains('is-discovery-start')),false);assert.equal(await t.input.isVisible(),true);await t.page.getByRole('button',{name:'Experience questions',exact:true}).click();assert.equal(await t.panel.getByRole('textbox').isVisible(),true);await t.page.getByRole('button',{name:'Chat',exact:true}).click();assert.equal(await t.guide.isVisible(),false);assert.equal(await t.page.locator('.cv-document-inner').innerText(),before);await t.close();
 const proposal=await open({plain:true});await proposal.page.locator('#tailor-btn').click();await proposal.page.getByRole('region',{name:'Tailoring suggestion',exact:true}).waitFor();assert.equal(await proposal.guide.isVisible(),false);assert.equal(await proposal.host.evaluate(el=>el.classList.contains('is-discovery-start')),false);await proposal.close();
 const zero=await open({zero:true});assert.equal(await zero.guide.isVisible(),false);assert.equal(await zero.host.evaluate(el=>el.classList.contains('is-discovery-start')),false);await zero.close();
 const missing=await open({sample:false});assert.equal(await missing.guide.isVisible(),false);await missing.close();
 const removed=await open();await removed.page.locator('#job-ad-input').fill('');assert.equal(await removed.guide.isVisible(),false);assert.equal(await removed.page.locator('.discovery-launcher').isVisible(),false);await removed.close();
 console.log('PASS fresh upload, 5/1 dynamic questions, system-only intro, centered geometry/scroll at five sizes, form/back, chat/tab access, detached tailoring proposal, zero/missing job context; zero external calls');
}finally{if(browser)await browser.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
