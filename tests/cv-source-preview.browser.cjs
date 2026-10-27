'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const fixture=require('./fixtures/source-pdf.js');
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_HEADER_CASE:'complete'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Preview startup timeout')),10000);child.stdout.on('data',data=>{out+=data;const m=out.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),outside=[],errors=[],requests=[],out=path.resolve(__dirname,'../output/pdf/source-preview');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{const url=route.request().url();requests.push({url,method:route.request().method()});return url.startsWith(base)?route.continue():(outside.push(url),route.abort());});
  await page.goto(base);await page.locator('#section-input').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
  const view=page.locator('#cv-preview'),input=page.locator('#cv-file');
  assert.equal(await page.locator('.cv-preview-wrap embed,.cv-preview-wrap iframe,.cv-preview-wrap object').count(),0);
  assert.equal(requests.some(r=>r.url.includes('/pdfjs/')),false,'PDF library is lazy');
  const bytes=fixture.create({pages:3,landscape:true});
  await input.setInputFiles({name:'original-synthetic.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready');
  assert.equal(await view.getAttribute('data-page-count'),'3');
  const slots=view.locator('.source-pdf-slot');assert.equal(await slots.count(),3);
  for(let i=0;i<3;i++){
   await view.evaluate((el,index)=>el.scrollTop=el.children[index].offsetTop,i);
   await page.waitForFunction(index=>document.querySelectorAll('.source-pdf-slot')[index].dataset.rendered==='true',i);
   const text=await slots.nth(i).locator('.source-pdf-text').innerText();assert.ok(text.includes('Åsa Example - Göteborg, Sweden'));assert.ok(text.includes(`Page ${i+1} of 3`));
   assert.equal(await slots.nth(i).locator('a[href="https://example.org/portfolio"]').count(),1);
   const pixels=await slots.nth(i).locator('canvas').evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let dark=0;for(let j=0;j<data.length;j+=4)if(data[j]<200||data[j+1]<200||data[j+2]<200)dark++;return dark;});assert.ok(pixels>1000,'Real PDF page artwork rendered');
  }
  assert.equal(requests.filter(r=>r.method==='POST').length,0,'Choosing a file never starts upload/model calls');
  const signatures=await view.locator('.source-pdf-text').allTextContents();
  for(const size of [{width:1440,height:1000},{width:1024,height:768},{width:390,height:844},{width:320,height:640}]){
   await page.setViewportSize(size);await page.waitForTimeout(150);await view.evaluate(el=>el.scrollTop=0);
   const geometry=await slots.evaluateAll(els=>els.map(el=>({w:el.clientWidth,h:el.clientHeight,paper:el.firstElementChild.getBoundingClientRect().width})));
   for(const g of geometry){assert.ok(g.w>0);assert.ok(Math.abs(g.paper-g.w)<1);}
   assert.ok(Math.abs(geometry[0].h/geometry[0].w-842/595)<.02);assert.ok(Math.abs(geometry[2].h/geometry[2].w-595/842)<.02);
   assert.deepEqual(await view.locator('.source-pdf-text').allTextContents(),signatures);
   assert.equal(await page.locator('.cv-preview-wrap button,.cv-preview-wrap [role=toolbar]').count(),0);
   await view.screenshot({path:path.join(out,`original-${size.width}.png`)});
  }
  await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(100);await view.evaluate(el=>el.scrollTop=0);
  await page.getByRole('button',{name:'Enlarge CV preview',exact:true}).click();await page.waitForTimeout(100);
  const text=slots.first().locator('.source-pdf-text span').first(),rect=await text.boundingBox();
  await page.mouse.move(rect.x+2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width-2,rect.y+rect.height/2,{steps:12});await page.mouse.up();assert.ok(await page.evaluate(()=>getSelection().toString().includes('Synthetic')),'Original text remains selectable');
  await page.getByRole('button',{name:'Close CV preview',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#uploaded-cv-dialog').open);
  // Swapping files during lazy loading must never reinstate old pages.
  await input.setInputFiles({name:'old-large.pdf',mimeType:'application/pdf',buffer:Buffer.from(fixture.create({pages:15,title:'Obsolete file'}))});
  const latest=fixture.create({pages:1,title:'Latest selected CV'});
  await input.setInputFiles({name:'latest.pdf',mimeType:'application/pdf',buffer:Buffer.from(latest)});
  await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready'&&document.querySelector('#cv-preview').textContent.includes('Latest selected CV'));
  assert.equal(await slots.count(),1);assert.equal((await view.innerText()).includes('Obsolete file'),false);
  await input.setInputFiles({name:'broken.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nNot a valid document')});
  await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='error');assert.equal(await view.locator('canvas').count(),0);assert.equal(await page.locator('.source-pdf-status').isVisible(),true);
  await input.setInputFiles([]);assert.equal(await view.getAttribute('data-state'),'empty');assert.equal(await slots.count(),0);assert.equal(await page.locator('.cv-preview-placeholder').isVisible(),true);
  await input.setInputFiles({name:'latest.pdf',mimeType:'application/pdf',buffer:Buffer.from(latest)});await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready');
  const request=page.waitForRequest(r=>r.method()==='POST'&&r.url().endsWith('/preview-api/upload'));await page.locator('#upload-btn').click();
  assert.ok((await request).postDataBuffer().includes(Buffer.from(latest)),'Upload still carries the unmodified selected file');
  await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');assert.equal(await page.locator('#editor-preview-text .cv-person-name').textContent(),'Åsa Example');
  assert.equal(await view.getAttribute('data-page-count'),'1');
  // Production assets are cross-origin to Webflow. Exercise PDF.js's blob worker wrapper
  // with a routed static-assets origin; CV bytes still never leave the browser.
  const context=await browser.newContext(),cross=await context.newPage(),assetOrigin='https://pdf-assets.example.invalid';
  await context.route('**/*',async route=>{
   const url=route.request().url();
   if(url.startsWith(assetOrigin)){
    const pathname=new URL(url).pathname,filename=path.resolve(__dirname,'..','.'+pathname);assert.ok(filename.startsWith(path.resolve(__dirname,'..')+path.sep));
    return route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},contentType:pathname.endsWith('.mjs')||pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.wasm')?'application/wasm':'application/octet-stream',body:fs.readFileSync(filename)});
   }
   if(!url.startsWith(base)){outside.push(url);return route.abort();}
   if(url===base){const response=await route.fetch(),headers=response.headers();delete headers['content-security-policy'];return route.fulfill({response,headers,body:(await response.text()).replace('src="/drafted-editor.js"','src="'+assetOrigin+'/drafted-editor.js"')});}
   return route.continue();
  });
  cross.on('pageerror',e=>errors.push(e.message));await cross.goto(base);await cross.locator('#cv-file').setInputFiles({name:'cross-origin.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await cross.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready');assert.equal(await cross.locator('#cv-preview').getAttribute('data-page-count'),'3');await context.close();
  assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({pages:3,mixedSizes:true,viewports:4,selectableText:true,links:true,rapidReplacement:true,errorAndClear:true,unchangedUpload:true,crossOriginWorker:true,externalRequests:0,pageErrors:errors},null,2));
  console.log('Original PDF preview PASS: real three-page PDF artwork/text/links, portrait/landscape, four widths, no plugin/toolbars, file replacement/error/clear and unchanged upload/editor flow; zero external requests.');
 }finally{await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
