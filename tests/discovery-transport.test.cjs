const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {Session}=require('../webflow/src/experience-discovery.js');
const {Client}=require('../webflow/src/experience-discovery-client.js');
const c=require('../webflow/src/experience-discovery-contract.js');
const {createHandler}=require('../backend/experience-discovery.cjs');
const {createServer}=require('../backend/discovery-http.cjs');
const {definition}=require('../backend/n8n-discovery-definition.cjs');
function input(){return {schemaVersion:'1.0',operation:'plan',requestId:'req-1',contextRevision:'ctx-1',conversationLanguage:'sv',cvVersionId:'cv-1',blocksSchemaVersion:'1.0',blocks:[{blockId:'summary-1',type:'summary',label:'Summary',order:1,text:'Arbetade i ett produktteam.'}],jobContextSchemaVersion:'1.0',jobContext:{roleTitle:'Product specialist',seniority:'mid',surfaces:['app'],tone:'balanced',topPriorities:['Roadmap','Backlog','Customer interviews','Design collaboration','Measurement','Delivery','Communication','Onboarding'].map(signal=>({signal,weight:5})),mustHave:[],successMetrics:[],keywords:Array.from({length:10},(_,i)=>`keyword-${i}`)}};}
function plan(){return {topics:Array.from({length:7},(_,i)=>({key:`topic-${i}`,question:['Har du planerat nästa leverans?','Har du pratat med användare?','Har du arbetat med designers?','Har du följt upp en förändring?','Har du hjälpt till med leveransen?','Har du förklarat beslut?','Har du förenklat starten för användare?'][i],support:'unclear',evidence:[],signalRefs:i===0?[{field:'topPriorities',index:0},{field:'topPriorities',index:1}]:[{field:'topPriorities',index:i+1}]}))};}
function session(){let i=0;const s=new Session({id:()=>`id-${++i}`}),r=input();s.setContext({revision:r.contextRevision,cvVersionId:r.cvVersionId,blocks:r.blocks,jobContext:r.jobContext});return s;}
async function server(model,fn){const h=createHandler({model}),s=createServer(h);await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));try{return await fn('http://127.0.0.1:'+s.address().port+'/webflow-experience-discovery');}finally{await new Promise(resolve=>s.close(resolve));}}
test('HTTP backend and client use existing signals, group overlaps, freeze actual 7 questions and keep CV unchanged',async()=>{
  await server(({request:r})=>r.operation==='plan'?plan():{drafts:[{proposedText:r.sourceAnswer.text,sourceQuote:r.sourceAnswer.text,coveredQuestionIds:[]}]},async endpoint=>{
    const s=session(),before=JSON.stringify(s.snapshot().context),client=new Client({endpoint,id:()=>crypto.randomUUID()});await client.plan(s,'sv');assert.equal(s.round().total,7);assert.equal(s.current().signalRefs.length,2);s.start();
    await client.submit(s,'Jag planerade nästa leverans.\n\n'+ 'Återkoppling från användare. '.repeat(1300));assert.equal(s.round().phase,'question');assert.equal(s.accounts().length,1);
    const original=s.snapshot().answers[0].revisions.at(-1).text;assert.equal(s.round().index,1);assert.equal(s.accounts()[0].sourceText,original);
    await client.submit(s,'Nej');s.skip();assert.equal(s.round().index,3);assert.equal(JSON.stringify(s.snapshot().context),before);
    s.correct(s.round().queue[0].id);await client.submit(s,'Jag hjälpte till med planeringen.');assert.equal(s.accounts().length,1);assert.equal(s.accounts()[0].currentRevision,2);
  });
});
test('clear support excludes a question only with a valid source quote; keywords do not create questions',async()=>{
  const r=input(),p=plan();p.topics[0].support='clear';p.topics[0].evidence=[{blockId:'summary-1',quote:'Arbetade i ett produktteam.'}];c.validateResult(r,p);
  const s=session();s.plan({contextRevision:r.contextRevision,topics:p.topics},'sv');assert.equal(s.round().total,6);
  p.topics[0].evidence[0].quote='Owned product strategy';assert.throws(()=>c.validateResult(r,p));p.topics[0].signalRefs=[{field:'keywords',index:0}];assert.throws(()=>c.validateResult(r,p));
});
test('invalid input and oversize answers fail before any provider call',async()=>{
  let calls=0;const h=createHandler({model:()=>{calls++;return plan();}});const r=input();r.hiddenFacts=[];assert.equal((await h(r)).status,400);assert.equal(calls,0);
  const valid=input();valid.operation='interpret';Object.assign(valid,{roundId:'r',questionId:'q',questions:[{id:'q',topicKey:'t',question:'Vad gjorde du?',signalRefs:[{field:'topPriorities',index:0}]}],sourceAnswer:{id:'a',revision:1,text:'x'.repeat(50001)}});assert.equal((await h(valid)).status,413);assert.equal(calls,0);
});
test('model failures/citation invention never become success or confirmation, retry preserves full original and revision',async()=>{
  let failure=true;await server(({request:r})=>{if(r.operation==='plan')return plan();if(failure)return {drafts:[{proposedText:'Saved 90%',sourceQuote:'Saved 90%',coveredQuestionIds:[]}]};return {drafts:[{proposedText:r.sourceAnswer.text,sourceQuote:r.sourceAnswer.text,coveredQuestionIds:[]}]};},async endpoint=>{
    const s=session(),client=new Client({endpoint});await client.plan(s,'sv');s.start();await assert.rejects(client.submit(s,'Jag gjorde planeringen.'),/INVALID_MODEL_OUTPUT/);assert.equal(s.round().phase,'error');assert.equal(s.accounts().length,0);assert.equal(s.snapshot().answers[0].revisions[0].text,'Jag gjorde planeringen.');assert.equal(s.snapshot().answers[0].drafts.length,0);
    failure=false;await client.retry(s);assert.equal(s.snapshot().answers[0].currentRevision,1);assert.equal(s.round().phase,'question');assert.equal(s.accounts().length,1);
  });
});
test('empty extraction stays under same number without invented facts',async()=>{
  await server(({request:r})=>r.operation==='plan'?plan():{drafts:[]},async endpoint=>{const s=session(),client=new Client({endpoint});await client.plan(s,'en');s.start();await client.submit(s,'Perhaps.');assert.equal(s.round().phase,'followup');assert.equal(s.round().index,0);assert.equal(s.accounts().length,0);});
});
test('late plan and interpretation successes/errors are ignored after context change',async()=>{
  let release;const delayed=new Promise(resolve=>release=resolve);const s=session();const client=new Client({endpoint:'http://isolated.invalid',fetch:async(_url,options)=>{const request=JSON.parse(options.body);await delayed;return new Response(JSON.stringify(c.modelResult(request,request.operation==='plan'?plan():{drafts:[]})),{status:200});}});
  const pending=client.plan(s,'sv');s.setContext({...s.snapshot().context,revision:'ctx-new'});release();assert.deepEqual(await pending,{stale:true});assert.equal(s.snapshot().round,null);
  const t=session();t.plan({contextRevision:'ctx-1',topics:plan().topics},'sv');t.start();let failRelease;const waiting=new Promise(resolve=>failRelease=resolve);
  const failClient=new Client({endpoint:'http://isolated.invalid',fetch:async()=>{await waiting;throw Error('temporary');}});const answering=failClient.submit(t,'I planned work.');t.setContext({...t.snapshot().context,revision:'ctx-new'});failRelease();assert.deepEqual(await answering,{stale:true});assert.equal(t.accounts().length,0);
});
test('malformed model output is a safe 422; unavailable provider is 503 without sensitive error details',async()=>{
  const bad=await createHandler({model:()=>'{not-json'})(input());assert.equal(bad.status,422);assert.ok(!JSON.stringify(bad).includes('not-json'));
  const fail=await createHandler({model:()=>{throw Error('secret-debug')}})(input());assert.equal(fail.status,503);assert.ok(!JSON.stringify(fail).includes('secret-debug'));
});
test('model signal strings stay invalid; object references work without relaxing bounds or uniqueness',async()=>{
  const r=input(),original=plan();
  const strings=structuredClone(original);strings.topics[0].signalRefs=['Roadmap','Backlog'];
  const outOfRange=structuredClone(original);outOfRange.topics[0].signalRefs=[{field:'topPriorities',index:r.jobContext.topPriorities.length}];
  const duplicate=structuredClone(original);duplicate.topics[1].signalRefs=[{field:'topPriorities',index:0}];
  for(const invalid of [strings,outOfRange,duplicate]){
    const response=await createHandler({model:()=>JSON.stringify(invalid)})(r);
    assert.equal(response.status,422);assert.equal(response.body.ok,false);assert.equal(response.body.contractError.code,'INVALID_MODEL_OUTPUT');
    assert.equal('result' in response.body,false);assert.equal('blocks' in response.body,false);
  }
  const valid=await createHandler({model:()=>JSON.stringify(original)})(r);assert.equal(valid.status,200);c.validateResponse(r,valid.body);
});
test('strict response binding rejects extra fields, wrong IDs and unknown questions',()=>{
  const r=input(),body=c.modelResult(r,plan());body.blocks=[];assert.throws(()=>c.validateResponse(r,body));delete body.blocks;body.requestId='other';assert.throws(()=>c.validateResponse(r,body));
});
test('generated n8n gates execute same contract/prompt/result code with no bypass edge',()=>{
  const d=definition({type:'@n8n/n8n-nodes-langchain.openAi',typeVersion:2,parameters:{responses:{values:[]}},credentials:{}});assert.equal('active' in d,false);
  const run=(name,data,request)=>new vm.Script('(async()=>{'+d.nodes.find(n=>n.name===name).parameters.jsCode+'})()').runInNewContext({TextEncoder,$input:{first:()=>({json:data})},$items:()=>[{json:{request}}]});
  return (async()=>{const r=input();assert.equal((await run('Validate request',{body:r}))[0].json.ok,true);const invalid=await run('Validate request',{body:{...r,bogus:true}});assert.equal(invalid[0].json.httpStatus,400);
    for(const conversationLanguage of ['sv','en']){
      const request={...r,conversationLanguage},prompts=await run('Build discovery prompt',{request});
      assert.equal(prompts[0].json.promptText,c.prompts(request).map(m=>m.role.toUpperCase()+':\n'+m.content).join('\n\n'));
    }
    const valid=await run('Validate model response',{output:[{content:[{text:JSON.stringify(plan())}]}]},r);assert.equal(valid[0].json.httpStatus,200);
    const strings=plan();strings.topics[0].signalRefs=['Roadmap','Backlog'];
    const rejected=await run('Validate model response',{output:[{content:[{text:JSON.stringify(strings)}]}]},r);
    assert.equal(rejected[0].json.httpStatus,422);assert.equal(rejected[0].json.response.contractError.code,'INVALID_MODEL_OUTPUT');
    assert.equal('result' in rejected[0].json.response,false);
    assert.equal(d.connections['Input valid?'].main[1][0].node,'Respond discovery');assert.equal(d.connections['Validate request'].main[0].length,1);
  })();
});

test('an invalidated plan aborts its fetch and a new context can plan without retry',async()=>{
 const s=session();let activeSignal,calls=0;
 const client=new Client({endpoint:'http://fixture.invalid',fetch:(_url,options)=>{calls++;activeSignal=options.signal;if(calls===2){const r=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify(c.modelResult(r,plan())),{status:200}));}return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));}});
 const cancel=new AbortController(),work=client.plan(s,'en',{signal:cancel.signal});cancel.abort();s.setContext({...s.snapshot().context,revision:'replacement'});assert.equal(activeSignal.aborted,true);assert.deepEqual(await work,{stale:true});assert.equal(s.snapshot().round,null);
 await client.plan(s,'en');assert.equal(s.round().contextRevision,'replacement');assert.equal(calls,2);
});

test('a provider that completes an aborted old plan cannot overwrite the replacement plan',async()=>{
 const s=session(),pending=[];const client=new Client({endpoint:'http://fixture.invalid',fetch:(_url,options)=>new Promise(resolve=>pending.push({request:JSON.parse(options.body),resolve,signal:options.signal}))});
 const cancel=new AbortController(),old=client.plan(s,'en',{signal:cancel.signal});cancel.abort();s.setContext({...s.snapshot().context,revision:'new-context'});const current=client.plan(s,'en');
 const replacement=plan();replacement.topics=replacement.topics.slice(0,1);pending[1].resolve(new Response(JSON.stringify(c.modelResult(pending[1].request,replacement)),{status:200}));await current;assert.equal(s.round().total,1);
 pending[0].resolve(new Response(JSON.stringify(c.modelResult(pending[0].request,plan())),{status:200}));assert.deepEqual(await old,{stale:true});assert.equal(s.round().total,1);assert.equal(s.round().contextRevision,'new-context');assert.equal(pending.length,2);
});
