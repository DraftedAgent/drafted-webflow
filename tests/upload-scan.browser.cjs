'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/upload-scan'),pdf=require('./fixtures/source-pdf.js');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=spawn(process.execPath,[path.join(root,'tools/serve-standalone.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise(r=>server.stdout.on('data',s=>{const m=String(s).match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)r(m[0]);})),browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];
 try{for(const entry of [{width:1440,long:true},{width:390},{width:1280,reduced:true},{width:1440,noText:true},{width:390,replace:true},{width:1440,reload:true},{width:1440,invalid:true}]){
  const context=await browser.newContext({viewport:{width:entry.width,height:900},reducedMotion:entry.reduced?'reduce':'no-preference'}),page=await context.newPage(),errors=[],external=[];let release,posts=0;
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await context.route('**/*',async r=>{if(!r.request().url().startsWith(base)){external.push(r.request().url());return r.abort();}if(new URL(r.request().url()).pathname==='/preview-api/upload'){
   posts++;const outcome=await new Promise(resolve=>release=resolve);try{if(outcome==='failure')return await r.fulfill({status:500,json:{ok:false,error:'Synthetic unavailable'}});return await r.continue();}catch{return;}
  }return r.continue();});
  const boot=()=>page.waitForFunction(()=>typeof workspacePages!=='undefined'&&workspacePages&&!workspacePages.restoring());
  await page.goto(base);await boot();await page.locator('#cv-file').setInputFiles({name:'Scan-source.pdf',mimeType:'application/pdf',buffer:entry.invalid?Buffer.from('Invalid PDF for preview failure test'):Buffer.from(pdf.create({pages:2}))});
  await page.waitForFunction(bad=>document.querySelector('.source-pdf-view').dataset.state===(bad?'error':'ready'),!!entry.invalid);
  if(!entry.invalid)await page.waitForFunction(()=>[...document.querySelectorAll('.source-pdf-slot')].every(n=>n.dataset.rendered==='true'));
  if(entry.noText)await page.locator('.source-pdf-text').evaluateAll(ns=>ns.forEach(n=>n.replaceChildren()));
  const before=await page.locator('.source-pdf-paper').evaluateAll(ns=>ns.map(n=>({w:n.offsetWidth,h:n.offsetHeight,text:n.querySelector('.source-pdf-text')?.textContent,canvas:n.querySelector('canvas')?.toDataURL()})));
  await page.locator('#upload-btn').click();await page.waitForFunction(()=>uploadInFlight);
  assert.equal(await page.locator('#preparation-status').textContent(),'Analyzing your CV…');assert.equal(await page.locator('.cv-preview-loading').count(),0);assert.equal(await page.locator('#upload-btn .drafted-upload-spinner').count(),0);
  if(!entry.invalid){await page.locator('.drafted-cv-scan').first().waitFor();
   if(entry.reduced)assert.equal(await page.locator('.drafted-scan-sweep').first().isVisible(),false);
   else {const first=await page.locator('.drafted-scan-sweep>path').first().getAttribute('d');await page.waitForTimeout(350);assert.notEqual(await page.locator('.drafted-scan-sweep>path').first().getAttribute('d'),first);}
   if(entry.noText)assert.equal(await page.locator('.drafted-scan-region').count(),0);
   else assert(await page.locator('.drafted-scan-region').count()>0);
  }else assert.equal(await page.locator('.drafted-cv-scan').count(),0);
  if(entry.long){
   await page.waitForTimeout(11500);assert.equal(await page.evaluate(()=>uploadInFlight),true);assert.equal(posts,1);
   assert.deepEqual(await page.locator('.source-pdf-paper').evaluateAll(ns=>ns.map(n=>({w:n.offsetWidth,h:n.offsetHeight,text:n.querySelector('.source-pdf-text')?.textContent,canvas:n.querySelector('canvas')?.toDataURL()}))),before);
   await page.getByRole('button',{name:'Enlarge CV preview'}).click();await page.locator('.preparation-pdf-dialog[open] .drafted-cv-scan').first().waitFor();await page.setViewportSize({width:1100,height:800});await page.waitForTimeout(150);
   assert(await page.evaluate(()=>{const p=document.querySelector('.source-pdf-paper'),t=p.querySelector('.source-pdf-text span'),r=p.querySelector('.drafted-scan-region rect'),b=p.getBoundingClientRect(),scale=b.width/p.offsetWidth;return Math.abs(Number(r.getAttribute('x'))-((t.getBoundingClientRect().left-b.left)/scale-4))<1;}));
   await page.keyboard.press('Escape');await page.setViewportSize({width:entry.width,height:900});
  }
  await page.locator('#section-input').screenshot({path:path.join(out,`waiting-${entry.width}-${entry.reduced?'reduced':entry.noText?'no-text':entry.invalid?'unavailable':entry.reload?'reload':entry.replace?'replace':'normal'}.png`)});
  if(entry.replace){
   await page.locator('#cv-file').setInputFiles({name:'Replacement.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf.create({pages:1}))});assert.equal(await page.locator('.drafted-cv-scan').count(),0);release('success');await page.waitForFunction(()=>!uploadInFlight);assert.equal(new URL(page.url()).pathname,'/');assert.equal(await page.locator('#file-name').textContent(),'Replacement.pdf');
  }else if(entry.reload){
   await page.evaluate(()=>workspacePages.save());await page.reload();release('success');await boot();assert.equal(await page.locator('.drafted-cv-scan').count(),0);assert.equal(posts,1);assert.match(await page.locator('#preparation-status').textContent(),/interrupted/i);
  }else{
   release('failure');await page.waitForFunction(()=>!uploadInFlight);assert.equal(await page.locator('.drafted-cv-scan').count(),0);assert.equal(new URL(page.url()).pathname,'/');assert.equal(await page.locator('#preparation-status').getAttribute('data-state'),'error');assert.equal(await page.locator('#file-name').textContent(),'Scan-source.pdf');
   await page.locator('#section-input').screenshot({path:path.join(out,`error-${entry.width}.png`)});
   if(!entry.invalid){await page.locator('#upload-btn').click();await page.waitForFunction(()=>uploadInFlight);await page.waitForTimeout(100);release('success');await page.waitForURL('**/editor');await page.waitForFunction(()=>!uploadInFlight);assert.equal(await page.locator('.drafted-cv-scan').count(),0);await page.getByRole('link',{name:'Back to setup'}).click();assert.equal(await page.locator('.drafted-cv-scan').count(),0);}
  }
  assert.equal(await page.locator('#restart,#slow,#fail,#complete').count(),0,'No prototype controls in the app');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({...entry,posts,passed:true});await context.close();
 }
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({results,realBackendRequests:0},null,2));console.log(JSON.stringify(results));
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
