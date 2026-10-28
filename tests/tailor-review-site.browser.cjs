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
  await page.route('**/*',async route=>{
   const req=route.request(),url=req.url(),u=new URL(url),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST, OPTIONS'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(u.hostname==='challenges.cloudflare.com')return route.abort();
   if(u.hostname.endsWith('n8n.cloud')||req.method()==='POST'){
    posts.push(u.pathname);
    if(u.pathname.endsWith('/webflow-upload-cv'))return route.fulfill({headers,json:envelope(blocks)});
    if(u.pathname.endsWith('/webflow-jobcontext-extract'))return route.fulfill({headers,json:{ok:true,jobContextSchemaVersion:'1.0',jobContext:F.jobContext}});
    if(u.pathname.endsWith('/webflow-experience-discovery')){const r=await createHandler({model:()=>({topics:[]})})(req.postDataJSON());return route.fulfill({headers,status:r.status,json:r.body});}
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
  await page.goto(site+'?release=2026-10-28-tailor-review',{waitUntil:'domcontentloaded'});
  await page.locator('.preparation-layout').waitFor();
  await page.locator('#job-ad-input').fill('A synthetic product specialist role involving digital teams, user interviews and sharing feedback. '.repeat(8));
  await page.waitForFunction(()=>document.querySelector('#jobcontext-status')?.dataset.state==='ready');
  await page.locator('#cv-file').setInputFiles({name:'synthetic-original.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create())});
  await page.getByRole('button',{name:'Continue to editor',exact:true}).click();
  const cv=page.locator('.cv-document-inner'),guide=page.locator('#drafted-discovery-guidance'),review=page.getByRole('region',{name:'Tailoring suggestion',exact:true});
  await page.waitForFunction(()=>document.querySelector('.discovery-launcher')?.dataset.planState==='ready').catch(async e=>{await page.screenshot({path:path.join(out,'failure.png')});console.log(JSON.stringify({posts,errors,outside,ui:await page.locator('.section-editor').innerText()}));throw e;});const before=await cv.innerText();await page.locator('#tailor-btn').click();
  if(changed){
   await review.getByRole('heading',{name:'3 changed blocks',exact:true}).waitFor();for(const type of ['Added','Removed','Rewritten'])assert(await review.locator(`[data-change-kind="${type}"]`).count());
   assert.equal(await cv.innerText(),before);assert.equal(await review.locator('.tailor-proposed-cv').count(),0);await page.screenshot({path:path.join(out,`${phase}-${width}.png`)});
   await review.getByRole('button',{name:'Apply all changes',exact:true}).click();await page.getByText('Your CV is updated. What would you like to change?',{exact:true}).waitFor();assert.match(await cv.innerText(),/Shared user feedback with the team/);assert(!(await cv.innerText()).includes('Generic project notes'));assert.equal(await review.count(),0);
  }else{await page.getByText('No changes suggested',{exact:true}).waitFor();assert.equal(await review.count(),0);assert.equal(await cv.innerText(),before);assert.equal(await page.getByRole('button',{name:'Apply all changes',exact:true}).count(),0);}
  assert.equal(requests.length,1);assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${phase} actual-site ${width}px ${changed?'changed review/Apply':'unchanged'}; external backend executions 0`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
