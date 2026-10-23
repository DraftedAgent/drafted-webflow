'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),os=require('node:os');
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_SCENARIO:'transition'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',s=>{out+=s;const m=out.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],outside=[],tailors=[];
 page.on('pageerror',e=>errors.push(e.message));let release=null,hold=false,fail=false,structural=false;
 await page.route('**/*',async route=>{
   if(!route.request().url().startsWith(base)){outside.push(route.request().url());return route.abort();}
   if(route.request().url().endsWith('/preview-api/tailor')){
     tailors.push(route.request().postDataJSON());if(hold)await new Promise(r=>release=r);
     if(fail)return route.fulfill({status:503,json:{ok:false,contractError:{code:'TEST',message:'Synthetic failure'}}});
     if(structural){const response=await route.fetch(),data=await response.json();data.blocks[0].label='Wrong metadata';return route.fulfill({response,json:data});}
   }
   return route.continue();
 });
 const guidance=page.locator('.discovery-guidance:not(.tailor-suggestion)'),panel=page.locator('.drafted-discovery'),cv=page.locator('.cv-document-inner');
 async function sample(){await page.goto(base);await page.getByRole('button',{name:'Try a synthetic CV and job ad',exact:true}).click();await guidance.getByRole('button',{name:'Review questions',exact:true}).waitFor();}
 await sample();const initial=await cv.innerText();assert.match(await guidance.innerText(),/We have 2 questions/);
 assert.ok(!(await guidance.innerText()).includes('can now use your answers'));assert.equal(tailors.length,0);
 await page.screenshot({path:path.join(os.tmpdir(),'drafted-tailor-questions.png')});
 await guidance.getByRole('button',{name:'Review questions',exact:true}).click();await panel.getByRole('button',{name:'Skip',exact:true}).click();
 await panel.getByRole('button',{name:'Back to editor',exact:true}).click();assert.match(await guidance.innerText(),/We have 1 question .* Review it/);
 await guidance.getByRole('button',{name:'Review questions',exact:true}).click();await panel.getByRole('button',{name:'No',exact:true}).click();
 await panel.getByRole('button',{name:'Back to the editor',exact:true}).click();assert.match(await guidance.innerText(),/Ready to tailor your CV/);assert.equal(tailors.length,0);
 // Two simultaneous entry points produce one request, and a detached review.
 hold=true;await guidance.getByRole('button',{name:'Tailor my CV',exact:true}).click();await guidance.getByRole('button',{name:'Tailor my CV',exact:true}).click();
 await page.waitForRequest(r=>false,{timeout:150}).catch(()=>{});assert.equal(tailors.length,1);assert.equal(await cv.innerText(),initial);
 release();hold=false;const suggestion=page.getByRole('region',{name:'Tailoring suggestion',exact:true});await suggestion.waitFor();assert.equal(await cv.innerText(),initial);
 assert.deepEqual(Object.keys(tailors[0]).sort(),['cvVersionId','cvTitle','targetRole','language','blocksSchemaVersion','blocks','jobContextSchemaVersion','jobContext'].sort());
 await suggestion.locator('summary').click();assert.ok((await suggestion.innerText()).includes('Suggested'));await page.screenshot({path:path.join(os.tmpdir(),'drafted-tailor-review.png')});
 await suggestion.getByRole('button',{name:'Dismiss',exact:true}).click();assert.equal(await cv.innerText(),initial);
 // Original and corrected source remain in history; no automatic tailoring on final answer.
 await page.getByRole('button',{name:'Review your answers',exact:true}).click();await panel.getByRole('button',{name:'Answer question 1',exact:true}).click();
 const input=panel.getByRole('textbox');await input.fill('I planned a release with two developers and coordinated testing.');await panel.getByRole('button',{name:'Save correction',exact:true}).click();
 await panel.getByRole('heading',{name:'What your answers added',exact:true}).waitFor();assert.equal(tailors.length,1);
 await panel.locator('.discovery-history').evaluate(e=>e.open=true);await panel.getByRole('button',{name:'Correct answer 1',exact:true}).click();await input.fill('I helped test the release; I did not plan it.');await panel.getByRole('button',{name:'Save correction',exact:true}).click();
 await panel.getByRole('heading',{name:'What your answers added',exact:true}).waitFor();assert.ok((await panel.innerText()).includes('I helped test the release; I did not plan it.'));assert.equal(tailors.length,1);
 await panel.getByRole('button',{name:'Finish and tailor my CV',exact:true}).click();await suggestion.waitFor();assert.equal(await panel.isVisible(),false);assert.equal(tailors.length,2);assert.equal(await cv.innerText(),initial);
 // Correction invalidates a detached candidate, preserving canonical CV.
 await page.getByRole('button',{name:'Review your answers',exact:true}).click();await panel.locator('.discovery-history').evaluate(e=>e.open=true);await panel.getByRole('button',{name:'Correct answer 1',exact:true}).click();await input.fill('No');await panel.getByRole('button',{name:'Save correction',exact:true}).click();await panel.getByRole('button',{name:'Back to the editor',exact:true}).click();
 await suggestion.getByRole('button',{name:'Apply tailored CV',exact:true}).click();assert.ok((await suggestion.innerText()).includes('answers changed'));assert.equal(await cv.innerText(),initial);await suggestion.getByRole('button',{name:'Dismiss',exact:true}).click();
 // Accept only a current candidate, with no additional model request at Apply.
 await guidance.getByRole('button',{name:'Tailor my CV',exact:true}).click();await suggestion.waitFor();await suggestion.getByRole('button',{name:'Apply tailored CV',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.cv-document-inner').innerText.includes('Erfarenhet av arbete'));assert.equal(tailors.length,3);
 // Early exit keeps unanswered topics; all skipped allows a plain CV/ad proposal.
 await sample();await guidance.getByRole('button',{name:'Review questions',exact:true}).click();await panel.getByRole('button',{name:'Finish the questions',exact:true}).click();await panel.getByRole('button',{name:'Back to the editor',exact:true}).click();assert.match(await guidance.innerText(),/We have 2 questions/);
 await guidance.getByRole('button',{name:'Review questions',exact:true}).click();await panel.getByRole('button',{name:'Answer question 1',exact:true}).click();await panel.getByRole('button',{name:'Skip',exact:true}).click();await panel.getByRole('button',{name:'Skip',exact:true}).click();await panel.getByRole('button',{name:'Back to the editor',exact:true}).click();assert.match(await guidance.innerText(),/Ready to tailor/);
 const before=await cv.innerText();fail=true;await guidance.getByRole('button',{name:'Tailor my CV',exact:true}).click();await page.getByText('Tailoring failed. Try again.',{exact:true}).waitFor();assert.equal(await cv.innerText(),before);fail=false;
 structural=true;await guidance.getByRole('button',{name:'Tailor my CV',exact:true}).click();await page.getByText('Tailoring failed. Try again.',{exact:true}).waitFor();assert.equal(await suggestion.count(),0);assert.equal(await cv.innerText(),before);structural=false;
 hold=true;await guidance.getByRole('button',{name:'Tailor my CV',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#tailor-btn').disabled);await page.locator('#job-ad-input').fill('Changed synthetic advertisement. '.repeat(20));release();hold=false;await page.getByText('Context changed. Tailor again.',{exact:true}).waitFor();assert.equal(await suggestion.count(),0);assert.equal(await cv.innerText(),before);
 await sample();await page.setViewportSize({width:390,height:844});await guidance.getByRole('button',{name:'Review questions',exact:true}).waitFor();await page.locator('.section-editor').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(os.tmpdir(),'drafted-tailor-mobile.png')});
 const mobileBox=await guidance.boundingBox();assert.ok(mobileBox.x>=0&&mobileBox.x+mobileBox.width<=391);
 // Direct toolbar tailoring remains possible with questions unanswered.
 await page.getByRole('link',{name:'Tailor to job',exact:true}).click();await suggestion.waitFor();assert.equal(await panel.isVisible(),false);assert.match(await guidance.innerText(),/We have 2 questions/);
 assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert.equal((await (await page.request.get(base+'preview-status')).json()).externalModelCalls,0);
 console.log('PASS: plural/singular, early exit, completion, skip/No, corrections, manual finish, deduplication, detached review, dismiss/apply, stale answers/ad, structural rejection, failure, mobile; zero external traffic.');
 }finally{await browser.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
