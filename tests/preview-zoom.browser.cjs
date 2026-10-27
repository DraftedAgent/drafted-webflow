'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),output=path.join(root,'output/pdf/preview-zoom');fs.mkdirSync(output,{recursive:true});
const baselineRef='1e119ae';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),outside=[],errors=[],results=[];
 try{
  for(const fixture of ['short','multi']){
   const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_CV:fixture},stdio:['ignore','pipe','pipe']});
   try{
    const base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',chunk=>{out+=chunk;const m=out.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});
    async function configure(page,baseline=false){
     page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>{
      const url=route.request().url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
      const file=new URL(url).pathname.slice(1);if(baseline&&['drafted-editor.js','drafted-editor.css'].includes(file))return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/css',body:execFileSync('git',['show',baselineRef+':'+file],{cwd:root})});return route.continue();
     });
     await page.addInitScript(()=>{window.print=()=>{parent.__zoomPrint={html:document.documentElement.outerHTML,text:[...document.querySelectorAll('.cv-page-content')].map(el=>el.textContent),marks:!!document.querySelector('.is-selected,.workspace-zoom'),paint:[...document.querySelectorAll('.cv-page')].map(el=>({outline:getComputedStyle(el).outlineStyle,transform:getComputedStyle(el).transform,width:el.offsetWidth,height:el.offsetHeight}))};dispatchEvent(new Event('afterprint'));};});
    }
    async function load(baseline=false){const page=await browser.newPage({viewport:{width:1440,height:1000}});await configure(page,baseline);await page.goto(base+'?sample=1');await page.waitForFunction(()=>!document.querySelector('.workspace-print-button')?.disabled);await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));return page;}
    const signature=page=>page.locator('.cv-page').evaluateAll(pages=>pages.map(el=>({text:el.querySelector('.cv-page-content').textContent,width:el.offsetWidth,height:el.offsetHeight,blocks:[...el.querySelectorAll('.cv-block')].map(b=>[b.dataset.blockId,b.offsetTop,b.offsetHeight])})));
    async function print(page){await page.evaluate(()=>window.__zoomPrint=null);await page.getByRole('button',{name:'Export PDF',exact:true}).click();await page.waitForFunction(()=>!!window.__zoomPrint&&!document.querySelector('iframe[data-cv-print]'));return page.evaluate(()=>window.__zoomPrint);}
    async function pdf(proof,name,baseline=false){const page=await browser.newPage({viewport:{width:794,height:1123}});await configure(page,baseline);await page.goto(base);await page.setContent(proof.html.replace('<head>',`<head><base href="${base}">`));await page.emulateMedia({media:'print'});await page.evaluate(async()=>{await document.fonts.load('14px "Drafted Sans"');await document.fonts.load('700 14px "Drafted Sans"');await document.fonts.ready;});await page.pdf({path:path.join(output,name+'.pdf'),printBackground:true,preferCSSPageSize:true});await page.close();}
    const baseline=await load(true),signatures={},printed={};
    for(const design of ['classic_v1','compact_v1','editorial_v1']){await baseline.locator('#cv-design').selectOption(design);await baseline.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);signatures[design]=await signature(baseline);printed[design]=await print(baseline);await pdf(printed[design],`${fixture}-${design}-before`,true);}
    await baseline.close();const page=await load(),slider=page.getByRole('slider',{name:'Preview zoom percentage'}),fit=page.getByRole('button',{name:'Fit to width',exact:true});
    const zoom=async value=>{await slider.evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await page.waitForFunction(value=>document.querySelector('.workspace-zoom-value').textContent===value+'%',value);};
    const reading=()=>page.evaluate(()=>{const pane=document.querySelector('.cv-document'),bounds=pane.getBoundingClientRect(),y=bounds.top+pane.clientTop+pane.clientHeight*.35,x=bounds.left+pane.clientLeft+pane.clientWidth*.5,slots=[...document.querySelectorAll('.cv-page-slot')],i=slots.findIndex(el=>el.getBoundingClientRect().bottom>y),slot=slots[i],r=slot.getBoundingClientRect(),scale=r.width/slot.firstElementChild.offsetWidth;return {i,y:(y-r.top)/scale,x:(x-r.left)/scale};});
    for(const design of ['classic_v1','compact_v1','editorial_v1']){
     await page.locator('#cv-design').selectOption(design);await page.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);assert.deepEqual(await signature(page),signatures[design]);
     if(fixture==='multi')assert.ok(signatures[design].length>1);else assert.equal(signatures[design].length,1);
     await page.locator('#chip-full').click();
     const full=await page.locator('.cv-page').evaluateAll(pages=>pages.every(el=>getComputedStyle(el).outlineStyle==='solid'));assert.equal(full,true);
     assert.equal(await page.locator('.cv-document-inner').evaluate(el=>getComputedStyle(el,'::before').display),'none');
     for(const percent of [50,100,150]){
      await zoom(percent);assert.equal(await fit.getAttribute('aria-pressed'),'false');assert.deepEqual(await signature(page),signatures[design]);
      const geometry=await page.locator('.cv-page-slot').first().evaluate(slot=>{const page=slot.firstElementChild;return {width:slot.getBoundingClientRect().width,height:slot.getBoundingClientRect().height,paperWidth:page.offsetWidth,paperHeight:page.offsetHeight,scale:new DOMMatrix(getComputedStyle(page).transform).a};});
      assert.ok(Math.abs(geometry.scale-percent/100)<.001);assert.ok(Math.abs(geometry.width-geometry.paperWidth*percent/100)<.1);assert.ok(Math.abs(geometry.height-geometry.paperHeight*percent/100)<.1);
      const proof=await print(page);assert.equal(proof.marks,false);assert.deepEqual(proof.text,printed[design].text);assert.deepEqual(proof.paint,printed[design].paint,'Zoom/full scope cannot enter print');
      if(percent===150)await pdf(proof,`${fixture}-${design}-after`);
     }
     // The right and bottom edges remain reachable at maximum scale.
     const reachable=await page.locator('.cv-document').evaluate(pane=>{pane.scrollLeft=pane.scrollWidth;pane.scrollTop=pane.scrollHeight;const p=pane.getBoundingClientRect(),last=pane.querySelector('.cv-page-slot:last-child').getBoundingClientRect();return {right:last.right<=p.right+1,bottom:last.bottom<=p.bottom+1,overflow:pane.scrollWidth>pane.clientWidth};});assert.equal(reachable.right,true);assert.equal(reachable.bottom,true);assert.equal(reachable.overflow,true);
     await zoom(100);await page.locator('.cv-document').evaluate(pane=>{pane.scrollTop=300;pane.scrollLeft=60;});const before=await reading();await zoom(125);const after=await reading();assert.equal(after.i,before.i);assert.ok(Math.abs(before.y-after.y)<2,'Vertical reading point preserved');assert.ok(Math.abs(before.x-after.x)<2,'Horizontal reading point preserved');
     const ids=await page.locator('.cv-block').evaluateAll(els=>[...new Set(els.map(el=>el.dataset.blockId))]);await page.locator(`[data-block-id="${ids[0]}"]`).first().click();await page.locator(`[data-block-id="${ids[1]}"]`).first().click();assert.equal(await page.locator('.cv-document-inner').evaluate(el=>el.classList.contains('is-scope-full')),false);assert.ok((await page.locator('.chip-title').textContent()).includes('2 blocks'));const selected=await page.locator('.cv-block.is-selected').count();await zoom(80);assert.equal(await page.locator('.cv-block.is-selected').count(),selected);assert.deepEqual(await signature(page),signatures[design]);await page.locator('#chip-clear').click();await page.locator('#chip-full').click();
     await fit.click();assert.equal(await fit.getAttribute('aria-pressed'),'true');
     for(const viewport of [{width:1440,height:1000},{width:1024,height:768},{width:390,height:844},{width:320,height:640}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(100);
      const dimensions=await page.locator('#editor-preview-text').evaluate(host=>({host:host.clientWidth,paper:host.querySelector('.cv-page-slot').getBoundingClientRect().width}));assert.ok(Math.abs(dimensions.host-dimensions.paper)<1);assert.deepEqual(await signature(page),signatures[design]);
      const fits=await page.locator('.workspace-zoom button,.workspace-zoom input,.workspace-zoom-value').evaluateAll(els=>els.every(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth;}));assert.equal(fits,true);
      if(design==='classic_v1'){await page.locator('.cv-document').evaluate(el=>{el.scrollTop=0;el.scrollLeft=0;});await page.screenshot({path:path.join(output,`${fixture}-${viewport.width}.png`)});}
     }
     // Manual scale remains manual across a panel resize; native range keys work.
     await zoom(100);await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(100);assert.equal(await page.locator('.workspace-zoom-value').textContent(),'100%');await slider.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.workspace-zoom-value').textContent(),'101%');await page.getByRole('button',{name:'Zoom in',exact:true}).click();assert.equal(await page.locator('.workspace-zoom-value').textContent(),'111%');await page.getByRole('button',{name:'Zoom out',exact:true}).click();assert.equal(await page.locator('.workspace-zoom-value').textContent(),'101%');
     await page.getByRole('button',{name:'Expand preview',exact:true}).click();await zoom(150);assert.equal(await page.locator('#cv-preview-dialog .workspace-zoom').count(),1);assert.deepEqual(await signature(page),signatures[design]);await print(page);await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('.workspace-main-actions .workspace-print-button').waitFor();assert.equal(await page.locator('.workspace-zoom-value').textContent(),'150%');await fit.click();await page.locator('#chip-chat').click();assert.equal(await page.locator('.cv-page').first().evaluate(el=>getComputedStyle(el).outlineStyle),'none');
    }
    results.push({fixture,designs:3,zoom:[50,100,150,'fit'],geometryUnchanged:true,printUnchanged:true});await page.close();
   }finally{child.kill();}
  }
  assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,results,externalRequests:0,output}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
