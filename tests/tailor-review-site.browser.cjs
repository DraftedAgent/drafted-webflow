'use strict';
// Actual Webflow shell and (after release) served assets. Every backend call is mocked.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const F=require('./fixtures/tailor-sources.cjs'),S=require('../webflow/src/tailor-sources-v11.js'),{createHandler}=require('../backend/experience-discovery.cjs');
const phase=process.argv[2]==='published'?'published':'preflight',root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/tailor-review/release'),site='https://drafted-cad750.webflow.io/',assets='https://draftedagent.github.io/drafted-webflow/';fs.mkdirSync(out,{recursive:true});
const blocks=structuredClone(F.blocks);blocks.find(b=>b.blockId==='skills-1').text+='\n\nGeneric project notes.';
const envelope=blocks=>({ok:true,blocksSchemaVersion:'1.0',cvVersionId:'synthetic-site-1',cvTitle:'Alex Example',summaryOfChanges:'',blocks,rewrittenCv:blocks.map(b=>b.text).join('\n'),rewrittenCvLegacy:blocks.map(b=>b.text).join('\n')});
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 for(const width of [1536,390])for(const changed of [true,false]){
  const page=await browser.newPage({viewport:{width,height:1000}}),outside=[],errors=[],requests=[],posts=[];let response;
  page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/*',async route=>{
   const req=route.request(),url=req.url(),u=new URL(url),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST, OPTIONS'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(u.hostname==='challenges.cloudflare.com')return route.abort();
   if(u.hostname.endsWith('n8n.cloud')||req.method()==='POST'){
    posts.push(u.pathname);
    if(u.pathname.endsWith('/webflow-upload-cv'))return route.fulfill({headers,json:envelope(blocks)});
    if(u.pathname.endsWith('/webflow-jobcontext-extract'))return route.fulfill({headers,json:{ok:true,jobContextSchemaVersion:'1.0',jobContext:F.jobContext}});
    if(u.pathname.endsWith('/webflow-experience-discovery')){const r=await createHandler({model:F.discovery})(req.postDataJSON());return route.fulfill({headers,status:r.status,json:r.body});}
    if(u.pathname.endsWith('/tailor-cv')){
     const r=req.postDataJSON();requests.push(r);const next=structuredClone(r.blocks);
     if(changed){next.find(b=>b.blockId==='summary-1').text='Product specialist collaborating with digital teams.';next.find(b=>b.blockId==='experience-1').text+='\n\nShared user feedback with the team.';next.find(b=>b.blockId==='skills-1').text='User interviews.';}
     response=r.sourcesSchemaVersion?S.candidate(r,{cvEdits:next.filter(b=>b.text!==r.blocks.find(old=>old.blockId===b.blockId).text).map(b=>{const old=r.blocks.find(x=>x.blockId===b.blockId);return {blockId:b.blockId,start:0,end:old.text.length,originalText:old.text,proposedText:b.text,cvEvidence:[{blockId:b.blockId,quote:old.text}]};}),additions:[],contextQuestions:[]}):envelope(next);
     return route.fulfill({headers,json:response});
    }
    outside.push(url);return route.abort();
   }
   if(phase==='preflight'&&url.startsWith(assets)){const file=u.pathname.split('/').at(-1);if(['drafted-editor.js','drafted-editor.css','latest.json'].includes(file))return route.fulfill({headers,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/json',body:fs.readFileSync(path.join(root,file))});}
   if(req.method()==='GET'&&[u.hostname==='drafted-cad750.webflow.io',u.hostname==='draftedagent.github.io',u.hostname.endsWith('website-files.com'),u.hostname==='ajax.googleapis.com',u.hostname==='d3e54v103j8qbb.cloudfront.net',u.hostname==='cdn.jsdelivr.net',u.hostname==='fonts.googleapis.com',u.hostname==='fonts.gstatic.com',u.hostname==='cdnjs.cloudflare.com'].some(Boolean))return route.continue();
   outside.push(url);return route.abort();
  });
  await page.goto(site+'?release=2026-10-28-centered-experience-intro',{waitUntil:'domcontentloaded'});
  await page.locator('.preparation-layout').waitFor();
  await page.locator('#job-ad-input').fill('A synthetic product specialist role involving digital teams, user interviews and sharing feedback. '.repeat(8));
  await page.waitForFunction(()=>document.querySelector('#jobcontext-status')?.dataset.state==='ready');
  await page.locator('#cv-file').setInputFiles({name:'synthetic-original.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create())});
  await page.getByRole('button',{name:'Continue to editor',exact:true}).click();
  const cv=page.locator('.cv-document-inner'),guide=page.locator('#drafted-discovery-guidance'),review=page.getByRole('region',{name:'Tailoring suggestion',exact:true});
  await page.waitForFunction(()=>document.querySelector('.discovery-launcher')?.dataset.planState==='ready').catch(async e=>{await page.screenshot({path:path.join(out,'failure.png')});console.log(JSON.stringify({posts,errors,outside,ui:await page.locator('.section-editor').innerText()}));throw e;});
  await guide.getByText('Answer 2 questions to uncover experience relevant to this role.',{exact:true}).waitFor();assert.equal(await page.locator('.chat-messages').evaluate(el=>el.classList.contains('is-discovery-start')),true);assert.equal(await page.locator('#editor-input').isVisible(),true);
  const heading=await guide.locator('h2').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return {lines:range.getClientRects().length,overflow:el.scrollWidth>el.clientWidth+1,whiteSpace:getComputedStyle(el).whiteSpace};});assert.equal(heading.overflow,false);assert.notEqual(heading.whiteSpace,'nowrap');if(width===1536)assert.equal(heading.lines,1);
  await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));await page.waitForFunction(()=>Math.abs(document.querySelector('.section-editor').getBoundingClientRect().top)<2);
  await page.screenshot({path:path.join(out,`${phase}-intro-card-${width}.png`)});
  await guide.getByRole('button',{name:'Review questions',exact:true}).click();await page.getByRole('button',{name:'Back to editor',exact:true}).click();await guide.getByRole('button',{name:'Review questions',exact:true}).waitFor();
  const before=await cv.innerText();await page.locator('#tailor-btn').click();
  if(changed){
   await review.getByRole('heading',{name:'3 changed blocks',exact:true}).waitFor();for(const type of ['Added','Removed','Rewritten'])assert(await review.locator(`[data-change-kind="${type}"]`).count());
   assert.equal(await cv.innerText(),before);assert.equal(await review.locator('.tailor-proposed-cv').count(),0);await page.screenshot({path:path.join(out,`${phase}-${width}.png`)});
   assert.equal(await page.locator('.chat-messages').evaluate(el=>el.classList.contains('is-discovery-start')),false);
   const assertText=async blocks=>{await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');for(const b of blocks){const actual=await page.locator('#editor-preview-text [data-cv-source="'+b.blockId+'"]').evaluateAll(nodes=>nodes.map(n=>n.textContent).join(''));assert.equal(actual,b.text);}};
   for(const id of ['summary-1','experience-1']){
    await review.locator('[data-review-block-id="'+id+'"]').getByRole('button',{name:/Review .+ in CV/}).click();await assertText(response.blocks);assert.equal(await page.locator('.tailor-preview-switch').getByRole('button',{name:'Suggested',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.getByRole('button',{name:'Export PDF',exact:true}).isDisabled(),true);
    await page.locator('.tailor-preview-switch').getByRole('button',{name:'Current',exact:true}).click();await assertText(requests[0].blocks);assert.equal(await page.getByRole('button',{name:'Export PDF',exact:true}).isEnabled(),true);
   }
   await page.locator('.tailor-preview-switch').getByRole('button',{name:'Suggested',exact:true}).click();await assertText(response.blocks);
   await review.getByRole('button',{name:'Apply all changes',exact:true}).click();await page.getByText('Your CV is updated. What would you like to change?',{exact:true}).waitFor();assert.match(await cv.innerText(),/Shared user feedback with the team/);assert(!(await cv.innerText()).includes('Generic project notes'));assert.equal(await review.count(),0);
   assert.equal(await page.locator('.tailor-preview-switch').count(),0);assert.equal(await page.locator('#editor-preview-text').getAttribute('data-cv-preview-mode'),'current');
  }else{await page.getByText('No changes suggested',{exact:true}).waitFor();assert.equal(await review.count(),0);assert.equal(await cv.innerText(),before);assert.equal(await page.getByRole('button',{name:'Apply all changes',exact:true}).count(),0);}
  assert.equal(requests.length,1);assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${phase} actual-site ${width}px ${changed?'changed review/Apply':'unchanged'}; external backend executions 0`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
