'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_PDF_CASE:'long-special'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Preview startup timeout')),10000);child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('error',reject);});
 const output=path.resolve(__dirname,'../output/pdf/preview-toolbar');fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const baseline=await browser.newPage({viewport:{width:1440,height:1000}});
  await baseline.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(base))return route.abort();const file=new URL(url).pathname.slice(1);if(['drafted-editor.js','drafted-editor.css'].includes(file))return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/css',body:execFileSync('git',['show','7948411:'+file])});return route.continue();});
  await baseline.goto(base+'?sample=1');await baseline.waitForFunction(()=>!document.querySelector('.workspace-print-button')?.disabled);
  const signatures={};
  for(const design of ['classic_v1','compact_v1','editorial_v1']){await baseline.locator('#cv-design').selectOption(design);await baseline.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);signatures[design]=await baseline.locator('.cv-page-content').allTextContents();}
  await baseline.locator('#cv-design').selectOption('classic_v1');
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){await baseline.setViewportSize(viewport);await baseline.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await baseline.waitForTimeout(250);await baseline.screenshot({path:path.join(output,`before-${viewport.width}.png`)});}
  await baseline.close();
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],outside=[],prints=[];
  page.on('pageerror',error=>errors.push(error.message));let holdStyles=false,releaseStyles;
  await page.route('**/*',async route=>{const url=route.request().url();if(!url.startsWith(base)){outside.push(url);return route.abort();}if(holdStyles&&url.includes('drafted-editor.css')){holdStyles=false;await new Promise(resolve=>releaseStyles=resolve);}return route.continue();});
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copiedCv=text;}}});
   window.print=()=>{const f=window.frameElement,p=window.parent;p.__toolbarPrints=p.__toolbarPrints||[];p.__toolbarPrints.push({design:f.dataset.cvDesign,ready:f.dataset.cvPrint,pages:f.dataset.pageCount,text:[...document.querySelectorAll('.cv-page-content')].map(el=>el.textContent),noTools:!document.querySelector('button,select,.is-selected'),fonts:document.fonts.check('14px "Drafted Sans"')});window.dispatchEvent(new Event('afterprint'));};
  });
  await page.goto(base+'?sample=1');await page.waitForFunction(()=>!document.querySelector('.workspace-print-button')?.disabled);
  await page.waitForFunction(()=>Math.abs(document.querySelector('.section-editor').getBoundingClientRect().top)<2);
  await page.locator('#editor-input').fill('Preserve this unsent instruction.');
  assert.equal(await page.locator('.cv-tools,.workspace-more-toggle,.workspace-print-help,#cv-design-note').count(),0);
  assert.equal(await page.getByRole('button',{name:'Export PDF (Classic)',exact:true}).count(),0);
  assert.equal(await page.locator('.workspace-topbar').innerText(),'Drafted\n'+await page.locator('.workspace-document-title').textContent());
  const fit=()=>page.locator('#cv-design,.workspace-page-count,.workspace-icon-button:not([hidden])').evaluateAll(els=>els.every(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth;}));
  const checkPrint=async(design)=>{
   const count=await page.evaluate(()=>window.__toolbarPrints?.length||0);
   assert.equal(await page.getByRole('button',{name:'Export PDF',exact:true}).count(),1);
   await page.getByRole('button',{name:'Export PDF',exact:true}).click();
   await page.waitForFunction(n=>(window.__toolbarPrints?.length||0)>n,count);
   await page.waitForFunction(()=>!document.querySelector('iframe[data-cv-print]')&&!document.querySelector('.workspace-print-button').disabled);
   const result=await page.evaluate(()=>window.__toolbarPrints.at(-1));assert.equal(result.design,design);assert.equal(result.ready,'ready');assert.equal(result.noTools,true);assert.equal(result.fonts,true);assert.deepEqual(result.text,signatures[design]);prints.push(result);
  };
  for(const design of ['classic_v1','compact_v1','editorial_v1']){
   await page.locator('#cv-design').selectOption(design);await page.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);
   for(const viewport of [{width:1920,height:1080},{width:1440,height:1000},{width:1366,height:768},{width:1024,height:600},{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(200);
    assert.equal(await page.locator('.cv-card > .workspace-preview-title #cv-design').count(),1);
    const geometry=await page.evaluate(()=>{const bar=document.querySelector('.workspace-preview-title').getBoundingClientRect(),pane=document.querySelector('.cv-document').getBoundingClientRect(),card=document.querySelector('.cv-card').getBoundingClientRect(),editor=document.querySelector('.editor-container').getBoundingClientRect();return {bar:bar.height,distance:pane.top-bar.bottom,inside:bar.left>=card.left&&bar.right<=card.right,bottom:editor.bottom,paneHeight:pane.height};});
    assert.ok(geometry.inside);assert.ok(geometry.bar<=40);assert.ok(geometry.distance<=11);assert.ok(geometry.paneHeight>35);assert.ok(geometry.bottom<=viewport.height+1);assert.equal(await fit(),true);
    assert.deepEqual(await page.locator('.cv-page-content').allTextContents(),signatures[design]);
    // A real pointer click has no outer focus ring; keyboard Tab has a neutral ring.
    await page.locator('#cv-design').click();
    const mouseFocus=await page.locator('#cv-design').evaluate(el=>({outline:getComputedStyle(el).outlineStyle,shadow:getComputedStyle(el).boxShadow}));assert.equal(mouseFocus.outline,'none');assert.equal(mouseFocus.shadow,'none');await page.keyboard.press('Escape');
    await page.locator('.workspace-copy-button').focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Shift+Tab');await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#cv-design').evaluate(el=>el===document.activeElement),true);
    assert.equal(await page.locator('#cv-design').evaluate(el=>getComputedStyle(el).outlineColor),'rgb(112, 121, 128)');
    for(const name of ['Expand preview','Export PDF','Copy text']){
     const button=page.getByRole('button',{name,exact:true});await button.focus();assert.equal(await button.locator('[role=tooltip]').isVisible(),true);assert.equal(await button.locator('[role=tooltip]').textContent(),name);await page.keyboard.press('Escape');assert.equal(await button.locator('[role=tooltip]').isVisible(),false);await page.locator('.workspace-brand').hover();await button.hover();assert.equal(await button.locator('[role=tooltip]').isVisible(),true);
    }
    await page.getByRole('button',{name:'Copy text',exact:true}).click();assert.ok((await page.evaluate(()=>window.__copiedCv)).includes('Å'));
    await checkPrint(design);
    if(!await page.locator('.cv-block.is-selected').count())await page.locator('.cv-block').first().click();assert.ok(await page.locator('.cv-block.is-selected').count());
    const pane=page.locator('.cv-document');await pane.evaluate(el=>el.scrollTop=130);const scroll=await pane.evaluate(el=>el.scrollTop);
    await page.evaluate(()=>{window.__toolbarHost=document.querySelector('#editor-preview-text');window.__toolbarPages=[...document.querySelectorAll('.cv-page')];window.__toolbarControls=document.querySelector('.workspace-preview-title');});
    if(design==='classic_v1'&&[1440,390,320].includes(viewport.width))await page.screenshot({path:path.join(output,`after-${viewport.width}.png`)});
    await page.getByRole('button',{name:'Expand preview',exact:true}).click();
    assert.equal(await page.locator('#cv-preview-dialog .workspace-preview-title #cv-design').count(),1);assert.equal(await fit(),true);
    assert.equal(await page.evaluate(()=>window.__toolbarHost===document.querySelector('#editor-preview-text')&&window.__toolbarControls===document.querySelector('.workspace-preview-title')&&window.__toolbarPages.every((el,i)=>el===document.querySelectorAll('.cv-page')[i])),true);
    assert.equal(await page.getByRole('button',{name:'Close',exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Tab');assert.equal(await page.locator('.cv-document').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Tab');
    assert.ok(await page.locator('#cv-preview-dialog').evaluate(el=>el.contains(document.activeElement)));
    await checkPrint(design);assert.ok(await page.locator('.cv-block.is-selected').count());
    if(viewport.width===390){
     const alternate=design==='compact_v1'?'editorial_v1':'compact_v1';await page.locator('#cv-design').selectOption(alternate);await page.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);await checkPrint(alternate);
     await page.locator('#cv-design').selectOption(design);await page.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);
    }
    if(design==='classic_v1'&&[1440,390].includes(viewport.width))await page.screenshot({path:path.join(output,`expanded-${viewport.width}.png`)});
    if(viewport.width===390)await page.keyboard.press('Escape');else await page.getByRole('button',{name:'Close',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('#cv-preview-dialog').open);
    assert.equal(await page.getByRole('button',{name:'Expand preview',exact:true}).evaluate(el=>el===document.activeElement),true);
    assert.equal(await pane.evaluate(el=>el.scrollTop),scroll);assert.equal(await page.locator('#cv-design').inputValue(),design);
    assert.equal(await page.locator('#editor-input').inputValue(),'Preserve this unsent instruction.');
    assert.deepEqual(await page.locator('.cv-page-content').allTextContents(),signatures[design]);
   }
  }
  // An in-flight preparation may never print pages from an earlier design.
  holdStyles=true;const beforePrints=prints.length;await page.getByRole('button',{name:'Export PDF',exact:true}).click();
  await page.waitForFunction(()=>!!document.querySelector('iframe[data-cv-print="preparing"]'));
  assert.equal(await page.getByRole('button',{name:'Export PDF',exact:true}).isDisabled(),true);
  await page.locator('#cv-design').selectOption('compact_v1');releaseStyles();
  await page.waitForFunction(()=>!document.querySelector('iframe[data-cv-print]')&&!document.querySelector('.workspace-print-button').disabled);
  assert.ok((await page.locator('.workspace-print-status').textContent()).includes('changed'));assert.equal(await page.evaluate(()=>window.__toolbarPrints.length),beforePrints);
  await checkPrint('compact_v1');
  // Touch activates each action once; tooltips do not require a first tap.
  const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await touch.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await touch.addInitScript(()=>{window.print=()=>window.dispatchEvent(new Event('afterprint'));Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{window.__touchCopied=true;}}});});
  await touch.goto(base+'?sample=1');await touch.waitForFunction(()=>!document.querySelector('.workspace-print-button')?.disabled);
  await touch.getByRole('button',{name:'Expand preview',exact:true}).tap();assert.equal(await touch.locator('#cv-preview-dialog').evaluate(el=>el.open),true);
  await touch.getByRole('button',{name:'Copy text',exact:true}).tap();assert.equal(await touch.evaluate(()=>window.__touchCopied),true);
  await touch.getByRole('button',{name:'Export PDF',exact:true}).tap();await touch.waitForFunction(()=>!document.querySelector('iframe[data-cv-print]')&&!document.querySelector('.workspace-print-button').disabled);
  await touch.getByRole('button',{name:'Close',exact:true}).tap();await touch.waitForFunction(()=>!document.querySelector('#cv-preview-dialog').open);await touch.close();
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({designs:3,viewports:7,printPreparationCalls:prints.length,staleExportRejected:true,touch:true,outsideRequests:outside,pageErrors:errors},null,2));
  console.log('Preview toolbar PASS: three designs, seven viewports, normal/expanded controls/tooltips/focus/copy, same live pages/selection/scroll/draft, selected-design print preparation and stale-export rejection, touch; no external calls. Native PDF saving not rerun.');
 }finally{await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
