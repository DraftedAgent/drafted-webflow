'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const root=path.resolve(__dirname,'..'),output=path.join(root,'output/pdf/editor-visual-refresh');fs.mkdirSync(output,{recursive:true});
 const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_PDF_CASE:'long-special'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',s=>{out+=s;const m=out.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],outside=[],requests=[];
 try{
  const configure=async(page,baseline=false)=>{
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>{
    const url=route.request().url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
    const file=new URL(url).pathname.slice(1);
    if(baseline&&['drafted-editor.js','drafted-editor.css'].includes(file))return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/css',body:execFileSync('git',['show','5755d4a:'+file],{cwd:root})});
    if(file==='preview-api/chat'){requests.push(route.request().postDataJSON());return route.fulfill({json:{ok:true,message:'A synthetic advisory response.'}});}
    if(file==='preview-api/rewrite'){const request=route.request().postDataJSON();requests.push(request);return route.fulfill({json:require('./fixtures/cv-pdf.cjs').envelope(require('./fixtures/cv-pdf.cjs')['long-special'])});}
    return route.continue();
   });
   await page.addInitScript(()=>{window.print=()=>{const owner=parent;owner.__printProof={html:document.documentElement.outerHTML,pages:[...document.querySelectorAll('.cv-page-content')].map(el=>el.textContent),tools:!!document.querySelector('.is-selected,button,select'),styles:[...document.querySelectorAll('.cv-block')].map(el=>({outline:getComputedStyle(el).outlineStyle,background:getComputedStyle(el).backgroundColor})),geometry:[...document.querySelectorAll('.cv-page')].map(el=>[el.offsetWidth,el.offsetHeight])};dispatchEvent(new Event('afterprint'));};});
  };
  const signature=page=>page.locator('.cv-page').evaluateAll(pages=>pages.map(page=>({text:page.querySelector('.cv-page-content').textContent,width:page.offsetWidth,height:page.offsetHeight,blocks:[...page.querySelectorAll('.cv-block')].map(el=>[el.dataset.blockId,el.offsetTop,el.offsetHeight])})));
  const before=await browser.newPage({viewport:{width:1586,height:1000}});await configure(before,true);await before.goto(base+'?sample=1');await before.waitForFunction(()=>!document.querySelector('.workspace-print-button')?.disabled);
  const printImage=async(source,design,baseline)=>{const proof=await browser.newPage({viewport:{width:794,height:1123}});await configure(proof,baseline);await proof.goto(base);const html=await source.evaluate(()=>window.__printProof.html);await proof.setContent(html.replace('<head>',`<head><base href="${base}">`));await proof.emulateMedia({media:'print'});await proof.evaluate(async()=>{await document.fonts.load('14px "Drafted Sans"');await document.fonts.load('700 14px "Drafted Sans"');await document.fonts.ready;});const label=baseline?'before':'after';const png=await proof.screenshot({path:path.join(output,`${design}-${label}.png`)});await proof.pdf({path:path.join(output,`${design}-${label}.pdf`),preferCSSPageSize:true,printBackground:true});await proof.close();return png;};
  const signatures={},printImages={};for(const design of ['classic_v1','compact_v1','editorial_v1']){await before.locator('#cv-design').selectOption(design);await before.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);signatures[design]=await signature(before);await before.getByRole('button',{name:'Export PDF',exact:true}).click();await before.waitForFunction(()=>!!window.__printProof&&!document.querySelector('iframe[data-cv-print]'));printImages[design]=await printImage(before,design,true);}
  await before.close();
  const page=await browser.newPage({viewport:{width:1586,height:1000}});await configure(page);await page.goto(base);await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
  assert.equal(await page.locator('.workspace-job-context').isVisible(),false);assert.equal(await page.locator('.workspace-print-button').isDisabled(),true);await page.screenshot({path:path.join(output,'empty.png')});
  await page.goto(base+'?sample=1');await page.waitForFunction(()=>!document.querySelector('.workspace-print-button')?.disabled);await page.waitForFunction(()=>document.querySelector('.discovery-launcher').dataset.planState==='ready');
  assert.equal(await page.locator('.workspace-document-title').textContent(),require('./fixtures/cv-pdf.cjs').envelope(require('./fixtures/cv-pdf.cjs')['long-special']).cvTitle);
  await page.locator('.workspace-job-details summary').click();assert.equal(await page.locator('.workspace-job-text').textContent(),await page.locator('#job-ad-input').inputValue());await page.locator('.workspace-job-details summary').click();
  assert.equal(await page.locator('.workspace-main-actions #tailor-btn').count(),1);
  for(const design of ['classic_v1','compact_v1','editorial_v1']){
   await page.locator('#cv-design').selectOption(design);await page.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);
   assert.deepEqual(await signature(page),signatures[design],'Document pagination and block geometry stay identical to main');
   const ids=await page.locator('.cv-block').evaluateAll(els=>[...new Set(els.map(el=>el.dataset.blockId))]);
   await page.locator(`[data-block-id="${ids[0]}"]`).first().click();await page.locator(`[data-block-id="${ids[1]}"]`).first().click();
   assert.ok(await page.locator('.cv-block.is-selected').count()>=2);assert.ok((await page.locator('.chip-title').textContent()).includes('2 blocks'));
   assert.deepEqual(await signature(page),signatures[design],'Selection cannot move document content');
   assert.equal(await page.locator('.cv-block.is-selected').first().evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
   await page.getByRole('button',{name:'Export PDF',exact:true}).click();await page.waitForFunction(()=>!!window.__printProof&&!document.querySelector('iframe[data-cv-print]'));
   const printed=await page.evaluate(()=>window.__printProof);assert.equal(printed.tools,false);assert.deepEqual(printed.pages,signatures[design].map(p=>p.text));assert.ok(printed.styles.every(s=>s.outline==='none'&&s.background==='rgba(0, 0, 0, 0)'));
   assert.ok(printImages[design].equals(await printImage(page,design,false)),'Print raster must match main pixel for pixel');
   await page.getByRole('button',{name:'Expand preview',exact:true}).click();assert.equal(await page.locator('#cv-preview-dialog .workspace-print-button').count(),1);
   await page.getByRole('button',{name:'Export PDF',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('iframe[data-cv-print]'));await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.locator('.workspace-main-actions .workspace-print-button').waitFor();assert.equal(await page.locator('.workspace-main-actions .workspace-print-button').count(),1);await page.locator('#chip-clear').click();
  }
  await page.locator('#editor-input').fill('Give advice on this opening.');await page.locator('#editor-chat-send').click();await page.getByText('A synthetic advisory response.',{exact:true}).waitFor();assert.equal(requests.at(-1).mode,'chat');
  await page.locator('#chip-full').click();await page.locator('#editor-input').fill('Keep the facts.');await page.locator('#editor-send').click();await page.waitForFunction(()=>!document.querySelector('#editor-send').hasAttribute('disabled'));assert.equal(requests.at(-1).mode,'full');
  for(const viewport of [{width:1586,height:1000},{width:1366,height:768},{width:1024,height:600},{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(200);
   const geometry=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};return {left:rect('.editor-left'),editor:rect('.editor-container'),composer:rect('.workspace-composer'),preview:rect('.cv-document'),messages:rect('.chat-messages'),layout:rect('.editor-layout')};});
   assert.ok(geometry.composer.height>70&&geometry.composer.right<=viewport.width);assert.ok(geometry.messages.height>30,JSON.stringify({viewport,geometry}));assert.ok(geometry.preview.height>35);assert.ok(geometry.editor.bottom<=viewport.height+2);
   if(viewport.width>=1300)assert.ok(Math.abs(geometry.left.width/geometry.layout.width-.38)<.01);
   const fits=await page.locator('#cv-design,.workspace-page-count,.workspace-icon-button:not([hidden]),#editor-send,#editor-chat-send').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {id:el.id||el.className,left:r.left,right:r.right,width:r.width,fit:r.width>0&&r.left>=0&&r.right<=innerWidth};}));
   await page.screenshot({path:path.join(output,`workspace-${viewport.width}.png`)});
   assert.ok(fits.every(el=>el.fit),JSON.stringify({viewport,fits}));
  }
  await page.setViewportSize({width:320,height:640});
  await page.locator('#editor-send').evaluate(el=>el.textContent='Apply (keep previewed changes)');
  const longLabel=await page.locator('#editor-send').evaluate(el=>({right:el.getBoundingClientRect().right,scroll:el.scrollWidth,width:el.clientWidth}));assert.ok(longLabel.right<=320&&longLabel.scroll<=longLabel.width);
  await page.locator('#editor-send').evaluate(el=>el.textContent='Apply');
  await page.locator('#editor-input').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#editor-send').evaluate(el=>el===document.activeElement),true);assert.equal(await page.locator('#editor-send').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);console.log(JSON.stringify({ok:true,designs:3,viewports:6,printGeometry:'unchanged',externalRequests:outside.length,output}));
 }finally{await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
