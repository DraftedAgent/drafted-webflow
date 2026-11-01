'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/workspace-transition');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=spawn(process.execPath,['tools/serve-standalone.cjs'],{cwd:root,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
try{const base=await new Promise(r=>{let text='';server.stdout.on('data',s=>{text+=s;const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)r(m[0]);});});browser=await chromium.launch({headless:true,channel:'msedge'});
for(const scenario of ['desktop','mobile','slow','reduced','error']){
 const context=await browser.newContext({viewport:scenario==='mobile'?{width:390,height:844}:{width:1440,height:900},reducedMotion:scenario==='reduced'?'reduce':'no-preference',recordVideo:{dir:out}}),page=await context.newPage(),errors=[],outside=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const r=route.request();if(!r.url().startsWith(base)){outside.push(r.url());return route.abort();}if(r.url().includes('/preview-api/upload')){await new Promise(r=>setTimeout(r,1800));if(scenario==='error')return route.fulfill({status:503,json:{error:'Synthetic upload failure'}});}if(r.url().endsWith('/webflow-experience-discovery'))await new Promise(r=>setTimeout(r,3000));return route.continue();});
 await page.goto(base);await page.locator('#job-ad-input').fill('We need a product specialist to plan deliveries, prioritize with engineers, facilitate workshops and understand users. '.repeat(4));await page.locator('#cv-file').setInputFiles({name:'Synthetic.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create({pages:2}))});
 await page.locator('.source-pdf-slot[data-rendered=true] canvas').first().waitFor();
 if(scenario==='slow')await page.evaluate(()=>{const run=DraftedWorkspaceTransition.run;DraftedWorkspaceTransition.run=(prepare,commit)=>run(async()=>{await prepare();await new Promise(r=>setTimeout(r,2400));},commit);});
 await page.locator('#upload-btn').click();
 if(scenario==='error'){await page.waitForTimeout(3000);assert(!page.url().endsWith('/editor'));assert.equal(await page.locator('.workspace-transfer').count(),0);}
 else{
  if(scenario!=='reduced'){await page.locator('.workspace-transfer').waitFor();if(scenario==='slow')await page.getByText('Opening your workspace…',{exact:true}).waitFor();await page.screenshot({path:path.join(out,scenario+'-transfer.png')});}
  await page.waitForURL('**/editor');await page.waitForFunction(()=>!document.querySelector('.workspace-transfer'));assert(await page.locator('#editor-input').isVisible());assert.equal(await page.locator('.cv-document').evaluate(n=>getComputedStyle(n).visibility),'visible');await page.screenshot({path:path.join(out,scenario+'-editor.png')});await page.waitForTimeout(3200);
  await page.reload();await page.locator('#editor-input').waitFor();assert.equal(await page.locator('.workspace-transfer').count(),0);
  await page.getByRole('link',{name:'Back to setup',exact:true}).click();await page.waitForURL('**/#section-input');await page.goBack();await page.waitForURL('**/editor');assert.equal(await page.locator('.workspace-transfer').count(),0);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);const video=page.video();await context.close();fs.copyFileSync(await video.path(),path.join(out,scenario+'.webm'));console.log('PASS '+scenario);
}
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
