'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
(async()=>{const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_SCENARIO:process.env.DRAFTED_PREVIEW_SCENARIO||'sources-n8n'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',s=>{out+=s;const m=out.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});
  browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage(),outside=[],errors=[],plans=[];let fail=true,tailorCalls=0;
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async route=>{
   if(!route.request().url().startsWith(base)){outside.push(route.request().url());return route.abort();}
   if(route.request().url().endsWith('/preview-api/tailor'))tailorCalls++;
   if(route.request().url().endsWith('/webflow-experience-discovery')){const r=route.request().postDataJSON();if(r.operation==='plan'){plans.push(r);if(fail)return route.fulfill({status:422,headers:{'x-drafted-validation-reason':process.env.DRAFTED_DISCOVERY_PLAN_REASON||'EVIDENCE_QUOTE_NOT_EXACT','x-drafted-validation-path':process.env.DRAFTED_DISCOVERY_PLAN_PATH||'$.topics[3].evidence[0].quote'},json:require('../webflow/src/experience-discovery-contract.js').error(r,'INVALID_MODEL_OUTPUT')});}}
   return route.continue();
  });
  await page.goto(base+'?sample=1');const launch=page.locator('.discovery-launcher'),cv=page.locator('.cv-document-inner'),panel=page.locator('.drafted-discovery');await page.waitForFunction(()=>document.querySelector('.discovery-launcher')?.dataset.planState==='error');const original=await cv.innerText();assert.equal(await launch.getAttribute('aria-busy'),'false');assert.equal(plans.length,1);
  await launch.click();await panel.getByRole('heading',{name:'Your questions could not be loaded',exact:true}).waitFor();assert.equal(await panel.getByText('Preparing your questions…',{exact:true}).count(),0);assert.equal(await cv.innerText(),original);
  fail=false;await panel.getByRole('button',{name:'Try loading the questions again',exact:true}).click();await panel.getByRole('textbox').waitFor();assert.equal(plans.length,2);assert.deepEqual(plans[1].blocks,plans[0].blocks);assert.equal(plans[1].contextRevision,plans[0].contextRevision);assert.equal(await cv.innerText(),original);assert.equal(tailorCalls,0);
  await panel.getByRole('textbox').fill('At Example Studio, I supported planning; I did not lead.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();await page.getByRole('button',{name:'Chat',exact:true}).click();await page.getByRole('button',{name:'Experience questions',exact:true}).click();await panel.locator('.discovery-history').evaluate(e=>e.open=true);assert.match(await panel.innerText(),/I did not lead/);assert.equal(await cv.innerText(),original);assert.equal(tailorCalls,0);assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  console.log('PASS: reported plan422 stops loading, explicit retry keeps context/CV, neutral questions reopen, originals retained, no Tailor or external request.');
 }finally{await browser?.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
