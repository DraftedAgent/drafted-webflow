'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
const Sources=require('../webflow/src/tailor-sources-v11.js');
const clone=x=>structuredClone(x);
const diff=(a,b)=>b.flatMap(next=>{const old=a.find(x=>x.blockId===next.blockId);return Object.keys(next).filter(k=>JSON.stringify(old?.[k])!==JSON.stringify(next[k])).map(field=>({blockId:next.blockId,field}));});
(async()=>{
 const server=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_SCENARIO:'sources'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let text='';server.stdout.on('data',d=>{text+=d;const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});server.on('error',reject);});
  browser=await chromium.launch({headless:true,channel:'msedge'});
  for(const sourced of [false,true])for(const changed of [false,true]){
   const page=await browser.newPage({viewport:{width:1440,height:1000}}),outside=[],errors=[];let payload,response;
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',async route=>{
    const url=route.request().url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
    if(url.endsWith('/webflow/preview/editor-fixture.js')){const r=await route.fetch();return route.fulfill({response:r,body:(await r.text()).replace('tailorSources:true',`tailorSources:${sourced},tailorSourcesVersion:'1.1'`)});}
    if(url.endsWith('/drafted-editor.js')){
     const r=await route.fetch();let script=await r.text();
     // Probes exist only in this intercepted test bundle, never in product code.
     script=script.replace("const payload={cvVersionId:cvVersionId||null", "window.__tailorBefore=structuredClone(documentBlocksState); window.__tailorCurrent=()=>documentBlocksState; const payload={cvVersionId:cvVersionId||null");
     script=script.replace('data=deepClone(data);request=deepClone(request);','data=deepClone(data);request=deepClone(request);window.__tailorStored={data,request};');
     return route.fulfill({response:r,body:script});
    }
    if(url.endsWith('/preview-api/tailor')){
     payload=route.request().postDataJSON();
     if(sourced){const old=payload.blocks.find(b=>b.blockId==='summary-1');response=Sources.candidate(payload,{cvEdits:changed?[{blockId:old.blockId,start:0,end:old.text.length,originalText:old.text,proposedText:'Product specialist who interviews users and shares feedback with digital teams.',cvEvidence:[{blockId:'experience-1',quote:payload.blocks.find(b=>b.blockId==='experience-1').text}]}]:[],additions:[],contextQuestions:[]});Sources.validateCandidate(payload,response);}
     else {const blocks=clone(payload.blocks);if(changed)blocks.find(b=>b.blockId==='summary-1').text='  Product specialist who interviews users and shares feedback with digital teams.\n';response={ok:true,blocksSchemaVersion:'1.0',cvVersionId:'candidate-version',cvTitle:'Candidate title',summaryOfChanges:'Claimed tailoring is not evidence of a content change.',blocks,rewrittenCv:blocks.map(b=>b.text).join('\n'),rewrittenCvLegacy:blocks.map(b=>b.text).join('\n')};}
     return route.fulfill({json:response});
    }
    return route.continue();
   });
   await page.goto(base+'?sample=1');
   const guide=page.locator('#drafted-discovery-guidance'),panel=page.locator('.drafted-discovery'),cv=page.locator('.cv-document-inner'),review=page.getByRole('region',{name:'Tailoring suggestion',exact:true});
   await guide.getByRole('button',{name:'Review questions',exact:true}).click();
   for(let n=0;n<2;n++){await panel.getByRole('textbox').fill('No.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();}
   await panel.getByRole('heading',{name:'Ready to tailor your CV.',exact:true}).waitFor();
   const previewBefore=await cv.innerText();
   await panel.getByRole('button',{name:'Finish and tailor my CV',exact:true}).click();
   if(changed)await review.waitFor();else await page.getByText('No changes suggested',{exact:true}).waitFor();
   const trace=await page.evaluate(()=>{
    const {data,request}=window.__tailorStored,current=window.__tailorCurrent();
    const objects=value=>{const found=new Set();const visit=x=>{if(!x||typeof x!=='object'||found.has(x))return;found.add(x);for(const v of Object.values(x))visit(v);};visit(value);return found;};
    const editor=objects(current),shared=objects(data).size&&[...objects(data)].some(x=>editor.has(x));
    return {before:window.__tailorBefore,current,stored:data,request,shared};
   });
   assert.deepEqual(trace.before,payload.blocks);assert.deepEqual(trace.request.blocks,payload.blocks);
   assert.deepEqual(trace.stored,response);assert.deepEqual(trace.current,trace.before);assert.equal(trace.shared,false);
   assert.equal(await cv.innerText(),previewBefore);
   assert.deepEqual(diff(payload.blocks,response.blocks),changed?[{blockId:'summary-1',field:'text'}]:[]);
   if(changed){
    assert.deepEqual(await review.locator('[data-review-block-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.reviewBlockId)),['summary-1']);
    assert.match(await review.locator('.tailor-block-change').innerText(),/Product specialist who interviews users/);
    await review.getByRole('button',{name:'Dismiss',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.__tailorCurrent()),trace.before);
    await guide.getByRole('button',{name:'Tailor my CV',exact:true}).click();await review.waitFor();
    await review.getByRole('button',{name:'Apply all changes',exact:true}).click();await page.getByText('Your CV is updated. What would you like to change?',{exact:true}).waitFor();
    assert.deepEqual(await page.evaluate(()=>window.__tailorCurrent()),response.blocks);assert.match(await cv.innerText(),/Product specialist who interviews users/);
   }else{
    assert.equal(await review.count(),0);assert.equal(await page.locator('.tailor-proposed-cv').count(),0);assert.equal(await page.getByRole('button',{name:'Apply all changes',exact:true}).count(),0);assert.equal(await page.locator('.tailor-applied-message').count(),0);
   }
   assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);console.log(`PASS ${sourced?'sources 1.1':'plain'} ${changed?'changed':'unchanged'}: canonical -> sent payload -> response -> detached stored candidate -> unchanged current preview; Apply/Dismiss/no-op verified`);await page.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
