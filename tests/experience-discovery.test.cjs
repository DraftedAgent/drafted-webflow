const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Session, MAX_ANSWER_LENGTH } = require('../webflow/src/experience-discovery.js');
function setup(n=7) {
  let i=0;
  const session=new Session({id:()=>`fixture-id-${++i}`});
  const context={revision:'context-1',cvVersionId:'cv-1',blocks:[{blockId:'exp-1',text:'I planned delivery.'}],
    jobContext:{topPriorities:Array.from({length:n},(_,index)=>({signal:`priority ${index}`,weight:5})),mustHave:['Roadmap','Backlog'],keywords:['other']}};
  const plan={contextRevision:context.revision,topics:Array.from({length:n},(_,index)=>({key:`topic-${index}`,support:'unclear',question:`Har du arbetat med område ${index+1}?`,signalRefs:[{field:'topPriorities',index}]}))};
  session.setContext(context);session.plan(plan,'sv');return {session,context,plan};
}
test('seven topics freeze total and one followup remains under same number',()=>{
  const {session,context,plan}=setup();const cv=JSON.stringify(context.blocks);
  session.start();session.submit('Ja, lite');assert.equal(session.round().phase,'followup');assert.equal(session.round().index,0);
  session.submit('Ja');assert.equal(session.round().phase,'question');assert.equal(session.confirmed().length,0);assert.equal(session.round().total,7);
  session.submit('Jag planerade nästa leverans.');assert.equal(session.round().phase,'confirm');
  assert.throws(()=>session.plan(plan,'sv'),/ROUND_ALREADY_PLANNED/);
  session.confirmDraft(0);session.next();assert.equal(session.round().index,1);
  assert.equal(JSON.stringify(context.blocks),cv);assert.equal(session.snapshot().context.cvVersionId,'cv-1');
});
test('long source is preserved exactly, distinct from candidate summaries and individually confirmed facts',()=>{
  const {session}=setup();session.start();const text='  Jag gjorde planeringen själv.\n\n'+ 'Ett långt exempel. '.repeat(1500);
  session.submit(text);const token=session.token();
  session.reviewDrafts(token,[{proposedText:'Jag gjorde planeringen själv.',sourceQuote:'Jag gjorde planeringen själv.',coveredQuestionIds:[]},
    {proposedText:'Ett långt exempel.',sourceQuote:'Ett långt exempel.',coveredQuestionIds:[]}]);
  assert.equal(session.snapshot().answers[0].revisions[0].text,text);assert.equal(session.confirmed().length,0);
  session.confirmDraft(0);assert.throws(()=>session.next(),/CONFIRM_EACH_FACT/);session.confirmDraft(1);session.next();
  assert.equal(session.confirmed().length,2);assert.notEqual(session.confirmed()[0].id,session.snapshot().answers[0].id);
});
test('oversize input is rejected without replacing saved answer or cutting it',()=>{
  const {session}=setup();session.start();assert.throws(()=>session.submit('a'.repeat(MAX_ANSWER_LENGTH+1)),/ANSWER_TOO_LONG/);
  assert.equal(session.snapshot().answers.length,0);assert.equal(session.round().phase,'question');
});
test('no, unknown and skip never become personal experience',()=>{
  const {session}=setup(3);session.start();session.submit('Nej');session.submit('Jag vet inte');session.skip();
  assert.equal(session.round().phase,'complete');assert.equal(session.confirmed().length,0);
  assert.deepEqual(session.summary(),{total:3,confirmed:0,covered:0,skipped:1,no:1,unknown:1,remaining:0});
});
test('explicit clear CV support needs a real block and quote; grouping produces one topic',()=>{
  const {session,context}=setup();session.setContext({...context,revision:'new'});
  const plan={contextRevision:'new',topics:[{key:'delivery',support:'clear',signalRefs:[{field:'topPriorities',index:0}],evidence:[{blockId:'exp-1',quote:'I planned delivery.'}]},
    {key:'planning',support:'unclear',question:'Vad gjorde du?',signalRefs:[{field:'mustHave',index:0},{field:'mustHave',index:1}]}]};
  session.plan(plan,'sv');assert.equal(session.round().total,1);
  session.setContext({...context,revision:'bad'});plan.contextRevision='bad';plan.topics[0].evidence[0].quote='Invented ownership';
  assert.throws(()=>session.plan(plan,'sv'),/INVALID_CV_EVIDENCE/);assert.equal(session.snapshot().round,null);
});
test('keyword-only questions, duplicate topics and unknown signals fail closed',()=>{
  for(const change of [p=>p.topics[0].signalRefs=[{field:'keywords',index:0}],p=>p.topics[1].key=p.topics[0].key,p=>p.topics[0].signalRefs[0].index=99]){
    const {session,context,plan}=setup();session.setContext({...context,revision:'new'});plan.contextRevision='new';change(plan);assert.throws(()=>session.plan(plan,'sv'));assert.equal(session.snapshot().round,null);
  }
});
test('source citation and covered question references must resolve before any fact confirmation',()=>{
  const {session}=setup();session.start();session.submit('I planned delivery.');const token=session.token();
  assert.throws(()=>session.reviewDrafts(token,[{proposedText:'Invented metrics',sourceQuote:'Saved 80%',coveredQuestionIds:[]}]),/INVALID_SOURCE_QUOTE/);
  assert.throws(()=>session.reviewDrafts(token,[{proposedText:'I planned delivery.',sourceQuote:'I planned delivery.',coveredQuestionIds:['unknown']}]),/UNKNOWN_QUESTION/);
  assert.equal(session.confirmed().length,0);
});
test('a confirmed answer covers later questions without changing original total/order',()=>{
  const {session}=setup();session.start();session.submit('I planned delivery.');
  const second=session.round().queue[1].id;
  session.reviewDrafts(session.token(),[{proposedText:'I planned delivery.',sourceQuote:'I planned delivery.',coveredQuestionIds:[second]}]);
  session.confirmDraft(0);session.next();assert.equal(session.round().index,2);assert.equal(session.round().total,7);assert.equal(session.round().queue[1].status,'covered');
});
test('correction invalidates old facts/proposals and preserves experience ID with a new revision',()=>{
  const {session}=setup(2);session.start();session.submit('I planned delivery.');const stale=session.token();
  const first=session.current().id, second=session.round().queue[1].id;
  session.reviewDrafts(stale,[{proposedText:'I planned delivery.',sourceQuote:'I planned delivery.',coveredQuestionIds:[second]}]);
  session.confirmDraft(0);const old=session.confirmed()[0];session.next();
  session.state.proposals.push({id:'fixture-proposal',answerIds:[old.source.answerId],stale:false});
  session.correct(first);assert.equal(session.confirmed().length,0);assert.equal(session.round().queue[1].status,'unanswered');assert.equal(session.state.proposals[0].stale,true);
  session.submit('I supported the planner.');assert.throws(()=>session.reviewDrafts(stale,[]),/STALE_ANSWER/);
  session.confirmDraft(0);const revised=session.confirmed()[0];assert.equal(revised.id,old.id);assert.equal(revised.revision,2);
  assert.equal(session.snapshot().answers[0].revisions[0].text,'I planned delivery.');assert.equal(revised.source.answerRevision,2);
});
test('context changes invalidate requests/rounds but retain confirmed experiences without automatic reuse',()=>{
  const {session,context,plan}=setup(1);session.start();session.submit('I planned delivery.');const token=session.token();session.confirmDraft(0);session.next();const old=session.confirmed()[0];
  session.setContext({...context,revision:'context-2',cvVersionId:'cv-2'});
  assert.throws(()=>session.plan(plan,'sv'),/STALE_CONTEXT/);plan.contextRevision='context-2';session.plan(plan,'en');
  assert.equal(session.confirmed()[0].id,old.id);assert.equal(session.confirmedForRound().length,0);assert.equal(session.round().total,1);
  assert.throws(()=>session.reviewDrafts(token,[]));assert.equal(session.round().language,'en');
});
test('zero unclear topics avoids 0/0 and explicit finish permits the existing-data path',()=>{
  const {session}=setup(0);session.start();assert.equal(session.round().phase,'complete');assert.equal(session.current(),null);
  const other=setup().session;other.start();other.skip();other.finish();assert.equal(other.summary().remaining,6);
});
test('changing input under reused context revision is rejected; snapshots cannot mutate session',()=>{
  const {session,context}=setup();assert.throws(()=>session.setContext({...context,cvVersionId:'other'}),/CONTEXT_REVISION_REQUIRED/);
  const snapshot=session.snapshot();snapshot.context.blocks[0].text='mutated';assert.equal(session.snapshot().context.blocks[0].text,'I planned delivery.');
});
