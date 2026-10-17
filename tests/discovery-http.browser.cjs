const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createServer}=require('../backend/discovery-http.cjs'),{createHandler}=require('../backend/experience-discovery.cjs'),{fixtureModel}=require('../backend/discovery-fixture-provider.cjs');
(async()=>{
  let failOnce=true,calls=0;const root=path.resolve(__dirname,'..');
  const server=createServer(createHandler({model:async data=>{calls++;if(data.operation==='interpret'&&failOnce){failOnce=false;throw Error('synthetic failure');}return fixtureModel(data);}}),{serve:(req,res)=>{
    const target=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!target.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
    fs.readFile(target,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':target.endsWith('.html')?'text/html': 'text/javascript'});res.end(err?'':data);});
  }});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
  try{const page=await browser.newPage({viewport:{width:390,height:844}}),outside=[],errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>{if(route.request().url().startsWith(base+'/'))return route.continue();outside.push(route.request().url());return route.abort();});
    await page.goto(base+'/webflow/preview/experience-discovery.html?backend=1');await page.getByRole('button',{name:'Börja frågorna',exact:true}).click();
    const before=await page.evaluate(()=>JSON.stringify(session.snapshot().context));assert.equal(await page.locator('.discovery-progress').innerText(),'1/7');
    const text='Jag höll ihop planeringen.\n\n'+ 'Jag pratade med utvecklarna om leveransen. '.repeat(1000);
    await page.getByRole('textbox').fill(text);await page.getByRole('button',{name:'Skicka svar',exact:true}).click();await page.getByRole('alert').waitFor();
    assert.equal(await page.getByRole('textbox').inputValue(),text);assert.equal(await page.evaluate(()=>session.confirmed().length),0);
    await page.getByRole('button',{name:'Försök igen',exact:true}).click();await page.getByRole('button',{name:'Det stämmer',exact:true}).first().waitFor();
    assert.equal(await page.evaluate(()=>session.snapshot().answers[0].currentRevision),1);
    for(let i=0;i<2;i++)await page.getByRole('button',{name:'Det stämmer',exact:true}).first().click();
    await page.getByRole('button',{name:'Nästa fråga',exact:true}).click();assert.equal(await page.locator('.discovery-progress').innerText(),'2/7');
    await page.getByRole('button',{name:'Hoppa över',exact:true}).click();assert.equal(await page.locator('.discovery-progress').innerText(),'3/7');
    await page.getByRole('button',{name:'Nej',exact:true}).click();assert.equal(await page.locator('.discovery-progress').innerText(),'4/7');
    await page.getByRole('button',{name:'Avsluta frågorna',exact:true}).click();await page.getByRole('button',{name:'Rätta svar 1',exact:true}).click();assert.equal(await page.getByRole('textbox').inputValue(),text);
    await page.getByRole('textbox').fill('Jag hjälpte till med planeringen.');await page.getByRole('button',{name:'Skicka svar',exact:true}).click();await page.getByRole('button',{name:'Det stämmer',exact:true}).click();
    assert.equal(await page.evaluate(()=>session.confirmed().length),1);assert.equal(await page.evaluate(()=>JSON.stringify(session.snapshot().context)),before);
    assert.ok(calls>=4);assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
    console.log('Real local HTTP/browser passed: planning, 1/7, 40k source, failure/retry, individual confirmations, skip/no, correction, unchanged CV and no outbound requests.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
