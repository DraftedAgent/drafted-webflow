'use strict';
// Run against `wrangler dev --local` with real backend disabled. No n8n requests.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base='http://127.0.0.1:8829',out=path.resolve(__dirname,'../output/pdf/invited-site');
const blocks=require('./fixtures/tailor-sources.cjs').blocks;
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const anonymous=await browser.newContext();assert.equal((await anonymous.request.get(base)).status(),401);assert.equal((await anonymous.request.get(base+'/editor')).status(),401);await anonymous.close();
  const context=await browser.newContext({httpCredentials:{username:'tester',password:'synthetic-test-password-123456789'},viewport:{width:1440,height:900}}),page=await context.newPage();const calls=[],outside=[],errors=[];
  await context.route('**/*',r=>{const url=new URL(r.request().url());if(url.origin!==base){outside.push(url.origin);return r.abort();}
   if(url.pathname.startsWith('/api/')){
    calls.push(url.pathname);if(url.pathname==='/api/webhook/webflow-upload-cv')return r.fulfill({json:{ok:true,blocksSchemaVersion:'1.0',cvVersionId:'invited-fixture',cvTitle:'Alex Example',summaryOfChanges:'',blocks,rewrittenCv:blocks.map(b=>b.text).join('\n'),rewrittenCvLegacy:blocks.map(b=>b.text).join('\n')}});
    return r.abort();
   }return r.continue();});page.on('pageerror',e=>errors.push(e.message));
  const boot=()=>page.waitForFunction(()=>typeof workspacePages!=='undefined'&&workspacePages&&!workspacePages.restoring());
  const ready=()=>page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');
  await page.goto(base+'/editor');await boot();await page.getByRole('heading',{name:'No CV is open yet'}).waitFor();await page.getByRole('link',{name:'Go to setup'}).click();await boot();
  assert.equal(await page.getByText('Invited test',{exact:true}).count(),1);
  await page.locator('#cv-file').setInputFiles({name:'Synthetic.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create({pages:2}))});await page.locator('#upload-btn').click();await page.waitForURL('**/editor');await ready();assert.equal(calls.length,1);
  const original=await page.evaluate(()=>captureWorkspace());await page.evaluate(()=>workspacePages.save());await page.reload();await boot();await ready();assert.equal(calls.length,1);assert.deepEqual((await page.evaluate(()=>captureWorkspace())).cv.documentBlocksState,original.cv.documentBlocksState);
  await page.getByRole('button',{name:'Original',exact:true}).click();await ready();assert(await page.getByRole('button',{name:'Export PDF',exact:true}).isVisible());await page.getByRole('button',{name:'Edited',exact:true}).click();
  await page.getByRole('link',{name:'Back to setup'}).click();await page.locator('#upload-btn').click();await page.waitForURL('**/editor');await ready();await page.goBack();await page.goForward();await boot();await ready();assert.equal(calls.length,1);
  await page.screenshot({path:path.join(out,'desktop.png')});await page.setViewportSize({width:390,height:844});assert(await page.locator('#editor-input').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'mobile.png')});
  assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed:true,runtime:'Cloudflare workerd local',realBackendRequests:0,checks:['authentication','direct editor without data','same-origin upload adapter','two-page original','reload','resume','back-forward','comparison','mobile']},null,2));console.log('PASS Cloudflare local runtime browser checks');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
