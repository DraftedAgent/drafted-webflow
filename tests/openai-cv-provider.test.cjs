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
