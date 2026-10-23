const {test}=require('node:test'),assert=require('node:assert/strict');
const client=require('../webflow/src/tailor-source-client.js'),profile=require('../webflow/src/tailor-sources.js'),f=require('./fixtures/tailor-sources.cjs'),{createHandler}=require('../backend/tailor-sources.cjs');
const endpoint='http://isolated.invalid/tailor';
test('HTTP 422 from invented context stays a failure with safe diagnostics and original sources intact',async()=>{
 const payload=f.request(),before=JSON.stringify(payload);let calls=0;
 const handler=createHandler({model:input=>{const result=f.model(input);result.additions[0].contextQuote='At an inferred employer';return result;}});
 await assert.rejects(client.fetchSuggestion(endpoint,payload,{fetch:async(url,options)=>{
  calls++;assert.equal(url,endpoint);assert.deepEqual(JSON.parse(options.body),payload);const result=await handler(payload);
  assert.equal(result.status,422);return Response.json(result.body,{status:result.status});
 }}),error=>error.code==='SOURCE_HTTP_FAILED'&&error.status===422&&error.backendCode==='INVALID_SOURCE_OUTPUT');
 assert.equal(calls,1);assert.equal(JSON.stringify(payload),before);
});
test('retry is explicit and uses current source revisions; valid candidate remains detached',async()=>{
 const payload=f.request();payload.sourceContext.answers[0].revision=2;payload.sourceContext.answers[0].text='At Example Studio, I supported testing, not planning.';
 const before=JSON.stringify(payload),expected=profile.candidate(payload,f.model(profile.modelInput(payload)));
 const data=await client.fetchSuggestion(endpoint,payload,{fetch:async(_url,o)=>{assert.equal(JSON.parse(o.body).sourceContext.answers[0].revision,2);return Response.json(expected);}});
 assert.deepEqual(data,expected);assert.equal(JSON.stringify(payload),before);assert.ok(data.blocks[1].text.includes('not planning'));
});
test('HTTP/non-JSON/network/invalid receipt do not fall back or expose backend text',async()=>{
 const cases=[
  {response:()=>Response.json({ok:false,contractError:{code:'secret answer',message:'private CV'}},{status:503}),code:'SOURCE_HTTP_FAILED',status:503},
  {response:()=>new Response('private gateway body',{status:524}),code:'SOURCE_HTTP_FAILED',status:524},
  {response:()=>Response.json({ok:true,blocks:[]}),code:'SOURCE_RESPONSE_INVALID',status:200},
  {response:()=>new Response('{broken',{headers:{'Content-Type':'application/json'}}),code:'SOURCE_RESPONSE_INVALID',status:200},
  {response:()=>{throw Error('private network detail');},code:'SOURCE_NETWORK_FAILED',status:null}
 ];
 for(const c of cases){let calls=0;await assert.rejects(client.fetchSuggestion(endpoint,f.request(),{fetch:async()=>{calls++;return c.response();}}),e=>{
  assert.equal(e.code,c.code);assert.equal(e.status,c.status);assert.equal(e.backendCode,null);assert.ok(!JSON.stringify(e).includes('private'));assert.ok(!e.stack.includes('private'));return true;
 });assert.equal(calls,1);}
});
test('timeout includes body reads, aborts the request, and never retries automatically',async()=>{
 let signal,calls=0;await assert.rejects(client.fetchSuggestion(endpoint,f.request(),{timeoutMs:15,fetch:async(_url,o)=>{calls++;signal=o.signal;return {ok:true,status:200,headers:new Headers({'Content-Type':'application/json'}),json:()=>new Promise(()=>{})};}}),e=>e.code==='SOURCE_TIMEOUT');
 assert.equal(signal.aborted,true);assert.equal(calls,1);
});
test('invalid request fails before transport and receipt mismatches stay rejected',async()=>{
 let calls=0;await assert.rejects(client.fetchSuggestion(endpoint,{}, {fetch:async()=>{calls++;}}),e=>e.code==='SOURCE_REQUEST_INVALID');assert.equal(calls,0);
 const payload=f.request(),candidate=profile.candidate(payload,f.model(profile.modelInput(payload)));candidate.sourceRoundId='wrong';
 await assert.rejects(client.fetchSuggestion(endpoint,payload,{fetch:async()=>Response.json(candidate)}),e=>e.code==='SOURCE_RESPONSE_INVALID');
});
