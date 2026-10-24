'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
(async()=>{const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_SCENARIO:'sources-batches'},stdio:['ignore','pipe','pipe']});let browser,release;
try{
 const base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',s=>{out+=s;const m=out.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});
 browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage(),errors=[],outside=[];let hold=false;
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async route=>{const req=route.request();if(!req.url().startsWith(base)){outside.push(req.url());return route.abort();}
  if(req.url().endsWith('/webflow-experience-discovery')){const r=req.postDataJSON();if(r.operation==='plan'){const response=await route.fetch(),body=await response.json();body.result.topics=body.result.topics.slice(0,7);return route.fulfill({response,json:body});}if(hold)await new Promise(resolve=>release=resolve);}
  return route.continue();
 });
 await page.goto(base+'?sample=1');const guide=page.locator('#drafted-discovery-guidance'),panel=page.locator('.drafted-discovery'),badge=page.locator('#drafted-experience-count');await guide.getByRole('button',{name:'Review questions',exact:true}).waitFor();assert.equal(await badge.innerText(),'5');await guide.getByRole('button',{name:'Review questions',exact:true}).click();assert.equal(await panel.getByText('Your answers stay while this page is open. The questions do not change your CV.',{exact:true}).count(),0);
 for(let left=4;left>=0;left--){await panel.getByRole('button',{name:'Skip',exact:true}).click();if(left)assert.equal(await badge.innerText(),String(left));else assert.equal(await badge.isVisible(),false);}
 await panel.getByRole('button',{name:'Explore more questions (2)',exact:true}).click();assert.equal(await badge.innerText(),'2');await panel.getByRole('button',{name:'No',exact:true}).click();assert.equal(await badge.innerText(),'1');
 hold=true;await panel.getByRole('textbox').fill('At Example Studio, I supported internal testing.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();await panel.getByText('One answer is still being checked.',{exact:true}).waitFor();assert.equal(await badge.isVisible(),false);assert.equal(await badge.textContent(),'');await page.screenshot({path:path.join(require('node:os').tmpdir(),'drafted-question-count-complete.png')});hold=false;release();await panel.getByText('One answer is still being checked.',{exact:true}).waitFor({state:'hidden'});assert.equal(await badge.isVisible(),false);
 await panel.locator('.discovery-history').evaluate(e=>e.open=true);await panel.getByRole('button',{name:'Correct answer 7',exact:true}).click();assert.equal(await badge.innerText(),'1');await panel.getByRole('button',{name:'No',exact:true}).click();assert.equal(await badge.isVisible(),false);
 assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);console.log('PASS: 5 -> hidden -> 2 -> 1 -> hidden during pending check; correction reopens 1; redundant copy absent.');
}finally{release?.();await browser?.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
