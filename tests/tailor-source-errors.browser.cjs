'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),os=require('node:os');
const f=require('./fixtures/tailor-sources.cjs'),{createHandler}=require('../backend/tailor-sources.cjs');
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_SCENARIO:process.env.DRAFTED_TEST_REFERENCE_FORMAT?'sources-references':'sources-n8n'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let output='';child.stdout.on('data',s=>{output+=s;const m=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});
  browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[],outside=[],errors=[],diagnostics=[];let mode='422',release;
  const invalidContext=createHandler({model:input=>{const out=f.model(input);out.additions[0].contextQuote='In an inferred role';return out;}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().startsWith('Tailoring failed'))diagnostics.push(m.text());});
  await page.addInitScript(()=>{const original=window.fetch;window.fetch=(url,options)=>{
   if(String(url)==='/preview-api/tailor'&&window.__testTailorTimeout)return new Promise(()=>{});
   return original(url,options);
  };const timer=window.setTimeout;window.setTimeout=(fn,ms,...args)=>timer(fn,ms===90000&&window.__testTailorTimeout?30:ms,...args);});
  await page.route('**/*',async route=>{
   if(!route.request().url().startsWith(base)){outside.push(route.request().url());return route.abort();}
   if(route.request().url().endsWith('/preview-api/tailor')){
    const payload=route.request().postDataJSON();requests.push(payload);assert.equal(payload.sourcesSchemaVersion,'1.0');assert.ok(payload.sourceContext.answers.length);
    if(mode==='422'){const result=await invalidContext(payload);assert.equal(result.status,422);return route.fulfill({status:result.status,json:result.body});}
    if(mode==='invalid')return route.fulfill({json:{ok:true,blocks:[]}});
    if(mode==='network')return route.abort();
    if(mode==='hold')await new Promise(r=>release=r);
   }
   return route.continue();
  });
  await page.goto(base+'?sample=1');const guide=page.locator('#drafted-discovery-guidance'),panel=page.locator('.drafted-discovery'),cv=page.locator('.cv-document-inner'),feedback=page.locator('.tailor-feedback'),suggestion=page.getByRole('region',{name:'Tailoring suggestion',exact:true});
  await guide.getByRole('button',{name:'Review questions',exact:true}).click();const input=panel.getByRole('textbox');
  await input.fill('At Example Studio, I planned a release.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();await input.fill('In Community Project, I helped with workshops, not customer sessions.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();await panel.getByRole('heading',{name:'Ready to tailor your CV.',exact:true}).waitFor();
  const original=await cv.innerText();await panel.getByRole('button',{name:'Finish and tailor my CV',exact:true}).click();
  const retry=feedback.getByRole('button',{name:'Try tailoring again',exact:true});await retry.waitFor();assert.match(await feedback.innerText(),/checked against your answers/);assert.equal(requests.length,1);assert.equal(await page.locator('#tailor-btn').isDisabled(),false);assert.equal(await page.locator('#tailor-minibar').evaluate(e=>e.classList.contains('is-minimized')),false);assert.equal(await cv.innerText(),original);assert.equal(await suggestion.count(),0);
  await page.screenshot({path:path.join(os.tmpdir(),'drafted-tailor-source-error.png')});const sources=structuredClone(requests[0].sourceContext);
  for(mode of ['invalid','network']){await retry.click();await retry.waitFor();assert.equal(await cv.innerText(),original);assert.deepEqual(requests.at(-1).sourceContext,sources);assert.equal(await page.locator('#tailor-btn').isDisabled(),false);}
  await page.evaluate(()=>{window.__snapshotBeforeTest=DraftedTailorSources.Ledger.prototype.snapshot;DraftedTailorSources.Ledger.prototype.snapshot=()=>{throw Error('synthetic snapshot failure');};});
  await retry.click();await retry.waitFor();assert.equal(requests.length,3);assert.equal(await page.locator('#tailor-btn').isDisabled(),false);assert.equal(await cv.innerText(),original);
  await page.evaluate(()=>{DraftedTailorSources.Ledger.prototype.snapshot=window.__snapshotBeforeTest;delete window.__snapshotBeforeTest;});
  await page.evaluate(()=>window.__testTailorTimeout=true);await retry.click();await feedback.getByText('Tailoring took too long. Your CV and answers have been kept. Try again.',{exact:true}).waitFor();assert.equal(await page.locator('#tailor-btn').isDisabled(),false);assert.equal(await cv.innerText(),original);await page.evaluate(()=>window.__testTailorTimeout=false);
  // Correction after failed requests is retained and the explicit retry must take a new snapshot.
  await page.getByRole('button',{name:'Review your answers',exact:true}).click();await panel.locator('.discovery-history').evaluate(e=>e.open=true);await panel.getByRole('button',{name:'Correct answer 1',exact:true}).click();assert.equal(await input.inputValue(),'At Example Studio, I planned a release.');await input.fill('At Example Studio, I supported testing, not planning.');await panel.getByRole('button',{name:'Save correction',exact:true}).click();await panel.getByRole('heading',{name:'Ready to tailor your CV.',exact:true}).waitFor();await page.getByRole('button',{name:'Chat',exact:true}).click();
  mode='hold';await retry.click();await page.waitForFunction(()=>document.querySelector('#tailor-btn').disabled);const count=requests.length;await page.screenshot({path:path.join(os.tmpdir(),'drafted-tailor-busy.png')});assert.equal(await guide.isVisible(),false);assert.equal(await page.locator('.tailor-progress').innerText(),'Preparing your suggestions…');assert.equal(await page.locator('#tailor-card').isVisible(),false);assert.equal(await guide.getByRole('button',{name:'Tailor my CV',exact:true}).count(),0);
  await page.evaluate(()=>document.querySelector('#tailor-btn').click());await page.waitForTimeout(50);assert.equal(requests.length,count);release();await suggestion.waitFor();assert.equal(requests.at(-1).sourceContext.answers[0].revision,2);assert.match(requests.at(-1).sourceContext.answers[0].text,/not planning/);assert.equal(await cv.innerText(),original);assert.match(await suggestion.innerText(),/not planning/);await suggestion.getByRole('button',{name:'Apply changes',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.cv-document-inner').innerText.includes('not planning'));
  assert.equal(requests.length,4);assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);assert.ok(diagnostics.some(x=>x.includes('INVALID_SOURCE_OUTPUT')&&x.includes('422')));assert.ok(diagnostics.every(x=>!x.includes('planned a release')));assert.equal((await (await page.request.get(base+'preview-status')).json()).externalModelCalls,0);
  console.log('PASS: synthetic invalid context -> real 422 shape; invalid receipt/network/body timeout; stopped loading, retained originals/corrections, explicit current-revision retry, no fallback/double request, Apply-only mutation; zero external traffic.');
 }finally{await browser?.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
