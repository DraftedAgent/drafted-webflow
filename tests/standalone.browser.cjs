'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/standalone'),pdf=require('./fixtures/source-pdf.js');
const F=require('./fixtures/structured-experience-context.cjs');
const envelope=(blocks,version)=>({ok:true,blocksSchemaVersion:'1.0',cvVersionId:version,cvTitle:'Alex Example',summaryOfChanges:'',blocks,rewrittenCv:blocks.map(b=>b.text).join('\n'),rewrittenCvLegacy:blocks.map(b=>b.text).join('\n')});
const fixture=pages=>({name:`Synthetic-${pages}.pdf`,mimeType:'application/pdf',buffer:Buffer.from(pdf.create({pages}))});
const ad='We are looking for a product specialist who can plan product deliveries and facilitate workshops with designers and engineers. The role includes user research, helping a team prioritize, and communicating clearly about delivery outcomes. '.repeat(2);
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=spawn(process.execPath,[path.join(root,'tools/serve-standalone.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let text='';server.stdout.on('data',s=>{text+=s;const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});server.on('error',reject);});
  browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1536,height:1024}}),errors=[],outside=[],calls=[];let failUpload=false,chatGate=null,chatRelease,uploads=0;
  page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.route('**/*',async route=>{
   const request=route.request(),u=new URL(request.url());if(u.origin!==new URL(base).origin){outside.push(request.url());return route.abort();}
   if(request.method()==='POST'){
    calls.push(u.pathname);
    if(u.pathname==='/preview-api/upload'){
     if(failUpload)return route.fulfill({status:503,json:{ok:false,contractError:{code:'SYNTHETIC_FAILURE'}}});
     uploads++;const blocks=structuredClone(F.blocks);if(uploads>1)blocks[0].text='Newly uploaded synthetic CV.';
     return route.fulfill({json:envelope(blocks,'synthetic-import-'+uploads)});
    }
    if(u.pathname==='/preview-api/chat'){
     const input=request.postDataJSON();if(chatGate)await chatGate;
     const blocks=structuredClone(input.blocks);blocks[0].text='Product specialist coordinating digital delivery.';
     return route.fulfill({json:{ok:true,message:'Here is a suggestion to review.',proposal:{cvTitle:input.cvTitle,cvVersionId:'synthetic-proposal',blocks},changedBlockIds:[blocks[0].blockId]}});
    }
   }
   return route.continue();
  });
  const boot=()=>page.waitForFunction(()=>window.DraftedWorkspacePages&&typeof workspacePages!=='undefined'&&workspacePages&&!workspacePages.restoring());
  const ready=()=>page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');
  const snap=()=>page.evaluate(()=>captureWorkspace());
  const save=()=>page.evaluate(()=>workspacePages.save());
  const reload=async()=>{await save();const before=calls.length;await page.reload();await boot();await ready();await page.waitForTimeout(80);assert.equal(calls.length,before,'Reload must not automatically process anything');};
  const continueEditor=async()=>{await page.locator('#upload-btn').click();await page.waitForURL('**/editor');await ready();};
  await page.goto(base+'editor');await boot();await page.getByRole('heading',{name:'No CV is open yet'}).waitFor();assert(await page.locator('.section-editor').isHidden());await page.getByRole('link',{name:'Go to setup'}).click();await page.waitForURL('**/#section-input');
  assert(await page.locator('.preparation-preview-open').isDisabled());
  await page.locator('#cv-file').setInputFiles(fixture(3));await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.pageCount==='3');await page.getByRole('button',{name:'Enlarge CV preview'}).click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');assert(await page.getByRole('button',{name:'Enlarge CV preview'}).evaluate(n=>n===document.activeElement));
  await continueEditor();const initial=await snap();assert.deepEqual(initial.cv.documentBlocksState,initial.comparison.original.blocks);
  // Multiple selections, zoom and full-CV marks belong to paper, not the viewport.
  const blockNodes=page.locator('#editor-preview-text .cv-block');await blockNodes.nth(0).click();await blockNodes.nth(1).click({modifiers:['Control']});assert.equal((await snap()).cv.selectedBlockIds.length,2);
  await page.getByRole('slider',{name:'Preview zoom percentage'}).fill('125');await page.getByRole('slider',{name:'Preview zoom percentage'}).dispatchEvent('input');await reload();assert.equal((await snap()).cv.selectedBlockIds.length,2);assert.equal((await snap()).zoom,1.25);
  await page.getByRole('button',{name:'Use full CV',exact:true}).click();assert.equal((await snap()).cv.activeContext,'full');
  await page.getByRole('button',{name:'Fit to width',exact:true}).click();
  await page.getByRole('link',{name:'Back to setup'}).click();await page.waitForURL('**/#section-input');assert(await page.locator('.section-editor').isHidden());await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.pageCount==='3');const count=uploads;await continueEditor();assert.equal(uploads,count);
  await page.goBack();await page.waitForURL('**/#section-input');await page.goForward();await page.waitForURL('**/editor');assert.deepEqual((await snap()).cv.documentBlocksState,initial.cv.documentBlocksState);
  // Pending chat suggestions remain detached and survive reload, then explicit Apply.
  await page.locator('#editor-input').fill('Suggest a clearer opening.');await page.locator('#editor-chat-send').click();await page.getByText('Here is a suggestion to review.',{exact:true}).waitFor();await reload();assert((await snap()).pendingProposal);assert.deepEqual((await snap()).cv.documentBlocksState,initial.cv.documentBlocksState);
  await page.locator('.drafted-proposal-card').getByRole('button',{name:'Apply',exact:true}).click();await ready();let edited=(await snap()).cv.documentBlocksState;assert.notDeepEqual(edited,initial.cv.documentBlocksState);
  await page.getByRole('button',{name:'Original',exact:true}).click();await page.getByRole('button',{name:'Show changes',exact:true}).click();await reload();assert.equal((await snap()).comparison.mode,'original');assert.equal((await snap()).comparison.marks,true);assert.deepEqual((await snap()).comparison.original,initial.comparison.original);assert.deepEqual((await snap()).cv.documentBlocksState,edited);
  await page.getByRole('button',{name:'Edited',exact:true}).click();
  // Original file is still the uploaded PDF, regardless of applied edits.
  await page.getByRole('link',{name:'Back to setup'}).click();await page.waitForURL('**/#section-input');await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready');assert.equal(await page.locator('#file-name').textContent(),'Synthetic-3.pdf');await continueEditor();
  // Job context changes use their existing extraction, never re-upload or rewrite.
  await page.getByRole('button',{name:'Job description',exact:true}).click();await page.locator('#workspace-job-input').fill(ad);await page.getByRole('button',{name:'Save job description',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.discovery-launcher').dataset.planState==='ready');assert.equal(uploads,count);assert.deepEqual((await snap()).cv.documentBlocksState,edited);
  await page.getByRole('button',{name:'Experience questions',exact:true}).click();const panel=page.locator('.drafted-discovery');await panel.getByRole('textbox').fill('At Example Studio, I helped plan internal deliveries.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();await panel.getByRole('textbox').fill('My unfinished second answer.');await save();await reload();assert.equal(await panel.getByRole('textbox').inputValue(),'My unfinished second answer.');assert.equal((await snap()).discovery.session.answers.length,1);
  await panel.getByRole('textbox').fill('No');await panel.getByRole('button',{name:'Send answer',exact:true}).click();await page.getByRole('button',{name:'Finish and tailor my CV'}).click();
  // The real 1.2 validation/composition path uses deterministic model fixtures.
  await page.waitForFunction(()=>!!document.querySelector('.tailor-suggestion')||!!document.querySelector('.tailor-feedback'));
  if(await page.locator('.tailor-context-mode').count()){
   await page.locator('.tailor-context-mode').screenshot({path:path.join(out,'experience-context.png')});
   const controls=await page.locator('.tailor-context-mode').innerText();fs.writeFileSync(path.join(out,'context-controls.txt'),controls);
  }
  await reload();assert((await snap()).tailorReview,'Pending tailoring/context survives reload');
  const context=page.getByRole('region',{name:'Tailoring context',exact:true});await context.getByRole('radio',{name:/Delivery Coordinator/}).check();await context.getByRole('button',{name:'Continue',exact:true}).click();const review=page.getByRole('region',{name:'Tailoring suggestion',exact:true});await review.waitFor();assert.deepEqual((await snap()).cv.documentBlocksState,edited);await reload();await review.getByRole('button',{name:'Apply all changes',exact:true}).click();await ready();await page.getByText('Your CV is updated. What would you like to change?',{exact:true}).waitFor();edited=(await snap()).cv.documentBlocksState;assert(edited.some(b=>b.text.includes('Coordinated internal planning sessions.')));assert.deepEqual((await snap()).comparison.original,initial.comparison.original);
  // A late response from the old job cannot become an applicable proposal.
  await page.getByRole('button',{name:'Chat',exact:true}).click();chatGate=new Promise(resolve=>{chatRelease=resolve});await page.locator('#editor-input').fill('A request for the previous job');await page.locator('#editor-chat-send').click();await page.waitForFunction(()=>window.__DRAFTED_CHAT__.inFlight);
  await page.getByRole('button',{name:'Job description',exact:true}).click();await page.locator('#workspace-job-input').fill(ad+' New focus.');await page.getByRole('button',{name:'Save job description',exact:true}).click();chatRelease();chatGate=null;await page.waitForFunction(()=>!window.__DRAFTED_CHAT__.inFlight);assert.equal((await snap()).pendingProposal,null);assert.deepEqual((await snap()).cv.documentBlocksState,edited);await page.waitForFunction(()=>document.querySelector('.discovery-launcher').dataset.planState==='ready');
  // A failed replacement retains the current work and all form inputs.
  await page.getByRole('link',{name:'Back to setup'}).click();await page.waitForURL('**/#section-input');await page.locator('#cv-file').setInputFiles(fixture(1));await page.locator('#upload-btn').click();await page.getByRole('button',{name:'Keep current work'}).click();assert.deepEqual((await snap()).cv.documentBlocksState,edited);
  failUpload=true;await page.locator('#upload-btn').click();await page.getByRole('button',{name:'Replace CV and continue'}).click();await page.waitForFunction(()=>document.querySelector('#preparation-status').dataset.state==='error');assert(new URL(page.url()).pathname==='/');assert.deepEqual((await snap()).cv.documentBlocksState,edited);assert.equal(await page.locator('#job-ad-input').inputValue(),ad+' New focus.');
  failUpload=false;await page.locator('#upload-btn').click();await page.getByRole('button',{name:'Replace CV and continue'}).click();await page.waitForURL('**/editor');await ready();assert.equal((await snap()).comparison.original.blocks[0].text,'Newly uploaded synthetic CV.');assert.equal((await snap()).discovery.archived.length,0);assert.equal((await snap()).chatHistory.length,0);
  // Responsive screen controls and natural setup flow.
  const viewports=[{width:1536,height:1024},{width:1366,height:768},{width:390,height:844},{width:320,height:640}];
  for(const viewport of viewports){await page.setViewportSize(viewport);await page.waitForTimeout(100);assert(await page.locator('#editor-input').isVisible());assert(await page.getByRole('link',{name:'Back to setup'}).isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'editor-'+viewport.width+'.png')});await page.getByRole('link',{name:'Back to setup'}).click();await page.waitForURL('**/#section-input');await page.screenshot({path:path.join(out,'setup-'+viewport.width+'.png')});await continueEditor();}
  await page.setViewportSize({width:390,height:450});await page.locator('#editor-input').focus();await page.waitForTimeout(100);const box=await page.locator('#editor-input').boundingBox();assert(box.y>=0&&box.y+box.height<=450,'Composer accessible with reduced mobile viewport');
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await mobile.route('**/*',r=>{if(!r.request().url().startsWith(base)){outside.push(r.request().url());return r.abort();}return r.continue();});await mobile.goto(base);await mobile.locator('#cv-file').setInputFiles(fixture(2));await mobile.waitForFunction(()=>document.querySelector('#cv-preview').dataset.pageCount==='2');await mobile.getByRole('button',{name:'Enlarge CV preview'}).tap();await mobile.locator('dialog[open]').waitFor();assert(await mobile.locator('dialog[open] .source-pdf-view').evaluate(n=>n.scrollHeight>n.clientHeight));await mobile.locator('dialog[open] .source-pdf-view').evaluate(n=>n.scrollTop=n.scrollHeight);await mobile.getByRole('button',{name:'Close CV preview'}).tap();assert(await mobile.getByRole('button',{name:'Enlarge CV preview'}).evaluate(n=>n===document.activeElement));await mobile.locator('#section-input').screenshot({path:path.join(out,'setup-mobile-full.png')});await mobile.close();
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);const report={passed:true,cases:['direct editor without data','3-page source and modal focus','upload without job','selection and zoom restoration','back-forward and unchanged resume','chat proposal reload and Apply','Original/Edited immutable restoration','job edit without upload','source answers and draft restoration','pending Tailor restoration','stale job response rejection','replacement cancellation and failure','new CV resets work','desktop/laptop/mobile','reduced keyboard viewport','touch modal with two-page PDF'],viewports,externalRequests:outside,externalBackendExecutions:0};fs.writeFileSync(path.join(out,'flows.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
