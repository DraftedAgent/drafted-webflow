'use strict';
const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const blocks=[{blockId:'name',type:'otherSections',label:'Name',order:0,text:'SYNTHETIC TEST'},{blockId:'skills',type:'skills',label:'Skills',order:1,text:'Python\nSQL\nWorkshop facilitation\nStakeholder communication'},{blockId:'summary',type:'summary',label:'Summary',order:2,text:'Product professional with delivery experience.'}];
const out=path.resolve('output/pdf/standalone/chat-review');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=spawn(process.execPath,['tools/serve-standalone.cjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;try{const base=await new Promise(resolve=>{let log='';server.stdout.on('data',d=>{log+=d;const m=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});});browser=await chromium.launch({headless:true,channel:'msedge'});
for(const width of [1440,390]){const page=await browser.newPage({viewport:{width,height:900}}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));let reply='answer',rewrites=0;
await page.route('**/*',async route=>{const r=route.request();if(!r.url().startsWith(base))throw Error('External call blocked: '+r.url());const p=new URL(r.url()).pathname;
const envelope=bs=>({ok:true,blocksSchemaVersion:'1.0',cvVersionId:'test-'+rewrites,cvTitle:'Synthetic test',blocks:bs,rewrittenCv:bs.map(b=>b.text).join('\n'),rewrittenCvLegacy:bs.map(b=>b.text).join('\n'),summaryOfChanges:''});
if(p==='/preview-api/upload')return route.fulfill({json:envelope(blocks)});
if(p==='/preview-api/chat'){const data=r.postDataJSON();requests.push(data);return route.fulfill({json:reply==='answer'?{ok:true,message:'The supplied CV includes Python and SQL. I can group the skills by subject.'}:{ok:true,message:'I will group your existing skills into technical and collaboration skills.',intent:'suggestion',suggestion:{mode:'blocks',selectedBlockIds:['skills'],instruction:'Group the existing Python and SQL under Technical; Workshop facilitation and Stakeholder communication under Collaboration. Preserve every skill.'}}});}
if(p==='/preview-api/rewrite'){rewrites++;const data=r.postDataJSON();return route.fulfill({json:envelope(data.blocks.map(b=>b.blockId==='skills'?{...b,text:'Technical: Python, SQL\nCollaboration: Workshop facilitation, Stakeholder communication'}:b))});}return route.continue();});
await page.goto(base);await page.locator('#cv-file').setInputFiles({name:'Synthetic.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create({pages:1}))});await page.locator('#upload-btn').click();await page.waitForURL('**/editor');await page.waitForFunction(()=>!document.querySelector('.workspace-transfer'));
const input=page.locator('#editor-input'),send=page.locator('#editor-chat-send');assert.equal(await page.locator('#editor-send').isVisible(),false);
await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');
const sample=()=>page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};return {heading:rect('.chat-title'),tabs:rect('.workspace-editor-toolbar>button'),right:rect('.workspace-preview-title'),comparison:rect('.document-comparison'),leftBody:rect('.workspace-conversation-body'),paper:rect('.cv-document'),overflow:document.documentElement.scrollWidth>innerWidth};});
const baseline=await sample();
if(width>800){
 for(const key of ['Home','End','Home']){
  await page.locator('.workspace-divider').press(key);await page.waitForTimeout(150);
  const state=await sample();assert.ok(Math.abs(state.tabs.top-baseline.tabs.top)<1,'Tabs remain at fixed top');
  assert.ok(Math.abs(state.comparison.top-state.right.top)<2,'Preview controls start at toolbar top');
  assert.ok(Math.abs(state.leftBody.top-state.paper.top)<2,'Workspace surfaces remain aligned');assert.equal(state.overflow,false);
  await page.screenshot({path:path.join(out,'toolbar-'+width+'-'+key+'.png')});
 }
}else{assert.equal(baseline.overflow,false);await page.screenshot({path:path.join(out,'toolbar-mobile.png')});}
assert.deepEqual(errors,[]);console.log('PASS',width,'toolbar top alignment, divider bounds and no overflow');await page.close();}

}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
