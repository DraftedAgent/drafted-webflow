'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/setup-scroll');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=spawn(process.execPath,[path.join(root,'tools/serve-standalone.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});const base=await new Promise(r=>server.stdout.on('data',s=>{const m=String(s).match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)r(m[0]);}));const browser=await chromium.launch({headless:true,channel:'msedge',ignoreDefaultArgs:['--hide-scrollbars']}),results=[];
 try{for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:1536,height:864},{width:1280,height:600},{width:390,height:844}]){
  const mobile=viewport.width<801,context=await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile}),page=await context.newPage(),outside=[],errors=[];
  await context.route('**/*',r=>{if(!r.request().url().startsWith(base)){outside.push(r.request().url());return r.abort();}return r.continue();});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>typeof workspacePages!=='undefined'&&workspacePages&&!workspacePages.restoring());
  await page.locator('#cv-file').setInputFiles({name:'Scrollable.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create({pages:3}))});await page.waitForFunction(()=>document.querySelector('.source-pdf-view').dataset.state==='ready');
  await page.locator('.drafted-hero-action').click();await page.waitForTimeout(200);
  await page.evaluate(()=>{document.querySelector('#job-ad-input').value='Synthetic job description.\n'.repeat(40);const status=document.querySelector('#jobcontext-status');status.dataset.state='ready';document.querySelector('#jobcontext-status-text').textContent='Signals ready';});
  for(const [state,text] of [['loading','Analyzing your CV…'],['ready','Your CV is ready in the editor.'],['error','Your CV could not be processed. Please try again.']]){
   await page.evaluate(({state,text})=>{const el=document.querySelector('#preparation-status');el.hidden=false;el.dataset.state=state;el.textContent=text;}, {state,text});
   if(!mobile){const sizes=await page.locator('#section-input').evaluate(n=>({height:n.getBoundingClientRect().height,top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom,viewport:innerHeight}));assert(sizes.height<=sizes.viewport+1,JSON.stringify({viewport,state,sizes}));assert(Math.abs(sizes.top)<2);assert((await page.locator('#preparation-status').boundingBox()).y+(await page.locator('#preparation-status').boundingBox()).height<=viewport.height);}
  }
  const pane=page.locator('.source-pdf-view');await pane.scrollIntoViewIfNeeded();await page.waitForTimeout(100);const windowY=await page.evaluate(()=>scrollY);
  assert.equal(await pane.evaluate(n=>n.inert),false);await pane.hover();await page.mouse.wheel(0,260);await page.waitForTimeout(300);assert(await pane.evaluate(n=>n.scrollTop>100),'Wheel scrolls the document');assert(Math.abs((await page.evaluate(()=>scrollY))-windowY)<2,'Page stays still');assert.equal(await page.locator('.preparation-pdf-dialog[open]').count(),0);
  await pane.evaluate(n=>n.scrollTop=n.scrollHeight);await page.mouse.wheel(0,300);await page.waitForTimeout(200);assert(Math.abs((await page.evaluate(()=>scrollY))-windowY)<2,'No page scroll chaining at document edge');
  await pane.evaluate(n=>n.scrollTop=0);await page.waitForTimeout(100);
  if(!mobile){
   const box=await pane.boundingBox(),gutter=await pane.evaluate(n=>n.offsetWidth-n.clientWidth);assert(gutter>0,'Native scrollbar has a gutter');
   await page.mouse.move(box.x+box.width-gutter/2,box.y+30);await page.mouse.down();await page.mouse.move(box.x+box.width-gutter/2,box.y+150,{steps:10});await page.mouse.up();await page.waitForTimeout(100);
   assert(await pane.evaluate(n=>n.scrollTop>0),'Native thumb drag scrolls');assert.equal(await page.locator('.preparation-pdf-dialog[open]').count(),0,'Scrollbar does not enlarge');
  }else{
   const box=await pane.boundingBox(),cdp=await context.newCDPSession(page),x=box.x+box.width/2,y=Math.min(viewport.height-35,box.y+box.height*.7);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*18}]});await page.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);assert(await pane.evaluate(n=>n.scrollTop>0),'Touch scrolls document');assert.equal(await page.locator('.preparation-pdf-dialog[open]').count(),0,'Swipe does not enlarge');
  }
  const reading=await pane.evaluate(n=>n.scrollTop);await page.getByRole('button',{name:'Enlarge CV preview'}).click();await page.locator('.preparation-pdf-dialog[open]').waitFor();await page.keyboard.press('Escape');await page.waitForTimeout(100);assert(Math.abs((await pane.evaluate(n=>n.scrollTop))-reading)<2,'Modal retains document reading position');
  await pane.evaluate(n=>n.scrollTop=0);await page.evaluate(()=>getSelection().removeAllRanges());
  if(!mobile){const text=await page.locator('.source-pdf-text span').first().boundingBox();await page.mouse.move(text.x+2,text.y+text.height/2);await page.mouse.down();await page.mouse.move(text.x+text.width*.8,text.y+text.height/2,{steps:8});await page.mouse.up();assert(await page.evaluate(()=>getSelection().toString().length>0));assert.equal(await page.locator('.preparation-pdf-dialog[open]').count(),0,'Text selection does not enlarge');await page.evaluate(()=>getSelection().removeAllRanges());}
  const paper=page.locator('.source-pdf-paper').first();await paper.click({position:{x:20,y:20}});await page.locator('.preparation-pdf-dialog[open]').waitFor();await page.keyboard.press('Escape');await page.waitForTimeout(100);assert(Math.abs((await page.evaluate(()=>scrollY))-windowY)<2);
  await page.getByRole('button',{name:'Enlarge CV preview'}).press('Enter');await page.locator('.preparation-pdf-dialog[open]').waitFor();await page.keyboard.press('Escape');
  await pane.evaluate(n=>n.scrollTop=0);await page.evaluate(()=>document.activeElement.blur());await page.mouse.move(1,1);await page.locator('#section-input').screenshot({path:path.join(out,`setup-${viewport.width}-${viewport.height}.png`)});
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);results.push({...viewport,nativeWheel:true,nativeDragOrTouch:true,viewportFit:!mobile});await context.close();
 }
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({results,realBackendRequests:0},null,2));console.log(JSON.stringify(results));
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
