const {test}=require('node:test'),assert=require('node:assert/strict'),{createProvider}=require('../backend/openai-cv-provider.cjs');
test('approval/key gates prevent all network use; no fallback or automatic retry',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw Error('NETWORK');};await assert.rejects(createProvider({apiKey:'mock',fetchImpl})({prompt:'p',input:{}}),/APPROVAL/);await assert.rejects(createProvider({approved:true,fetchImpl})({prompt:'p',input:{}}),/API_KEY/);assert.equal(calls,0);
 const p=createProvider({approved:true,apiKey:'mock',maxCalls:1,fetchImpl});await assert.rejects(p({prompt:'p',input:{}}),/NETWORK/);await assert.rejects(p({prompt:'p',input:{}}),/CALL_LIMIT/);assert.equal(calls,1);
});
test('real adapter sends correct bounded Responses request, parses JSON and rejects incomplete/refused replies',async()=>{
 let sent;const payload={status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:'{"operations":[],"exceptionReason":""}'}]}]};const p=createProvider({approved:true,apiKey:'test-key',fetchImpl:async(url,options)=>{sent={url,...options};return {ok:true,json:async()=>payload};}});assert.deepEqual(await p({prompt:'Return JSON.',input:{synthetic:true}}),{operations:[],exceptionReason:''});const body=JSON.parse(sent.body);assert.equal(body.store,false);assert.equal(body.max_output_tokens,4000);assert.equal(body.model,'gpt-6-luna');assert.equal(body.text.format.type,'json_object');
 payload.status='incomplete';await assert.rejects(p({prompt:'p',input:{}}),/INCOMPLETE/);payload.status='completed';payload.output[0].content[0].type='refusal';await assert.rejects(p({prompt:'p',input:{}}),/INVALID_MODEL/);
});

test('selection handler uses real adapter path with mocked wire transport and preserves validation',async()=>{
 const P=require('../backend/cv-selection.cjs'),input={schema:'selection-1',versionId:'v',blocks:[{blockId:'a',type:'experience',label:'Experience',order:1,text:'One fact. One fact.'}]};let sent;
 const model=createProvider({approved:true,apiKey:'mock',fetchImpl:async(url,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({operations:[{blockId:'a',action:'shorten',text:'One fact.',reason:'Remove repeated source sentence.'}],exceptionReason:''})}]}]})};}});
 const response=await P.createHandler({model})(input);assert.equal(response.status,200);assert.equal(response.body.operations[0].action,'shorten');assert.match(sent.input[0].content,/unique contribution/);assert.deepEqual(input.blocks[0].text,'One fact. One fact.');
});


test('source tailoring uses real adapter with both employment links, validates proposal and rejects unexplained no-op',async()=>{
 const P=require('../webflow/src/tailor-sources-v15.js'),X=require('../webflow/src/experience-context.js'),handler=require('../backend/tailor-integration.cjs');
 const input=await require('./fixtures/tailor-language.cjs').request({cv:'en',ad:'en'});input.blocks.push({...input.blocks.find(b=>b.blockId==='experience-1'),blockId:'experience-2',title:'Delivery Coordinator'});input.sourcesSchemaVersion='1.5';input.sourceContext.answers[0].experienceContext=X.selection(input.blocks.filter(b=>b.type==='experience').map(b=>X.reference(input.cvVersionId,b)));input.inputRef=await P.inputRef(input);
 let sent,calls=0,noChange=false;
 const model=createProvider({approved:true,apiKey:'mock',fetchImpl:async(url,options)=>{calls++;sent=JSON.parse(options.body);const catalog=JSON.parse(sent.input[1].content);assert.equal(catalog.sources[0].allowedTargets.length,2);assert.equal(catalog.sources[0].experienceContext.entries.length,2);const result=noChange?require('../backend/tailor-language-fixture.cjs').model({...catalog,sources:[]}):require('../backend/tailor-language-fixture.cjs').model(catalog);return {ok:true,json:async()=>({status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify(result)}]}]})};}});
 const run=handler.createHandler({model:(catalog,prompt)=>model({input:catalog,prompt})});const result=await run(input);assert.equal(result.status,200);assert.equal(result.body.blocks.filter(b=>b.text.includes('coordinated acceptance')).length,1);assert.match(sent.input[0].content,/single best supported target/);assert.match(sent.input[0].content,/explain why in reviewNotes/);noChange=true;assert.equal((await run(input)).status,422);assert.equal(calls,2);
 const failed=await handler.createHandler({model:()=>{throw Error('Provider unavailable');}})(input);assert.equal(failed.status,503);assert.equal(failed.body.ok,false);
});
