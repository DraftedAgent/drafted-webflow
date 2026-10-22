const {test}=require('node:test'),assert=require('node:assert/strict');
const {Session}=require('../webflow/src/experience-discovery.js'),{Client}=require('../webflow/src/experience-discovery-client.js');
const contract=require('../webflow/src/experience-discovery-contract.js');
function setup(n=3){
 let id=0;const s=new Session({id:()=>`id-${++id}`});
 s.setContext({revision:'context',cvVersionId:'cv',blocks:[{blockId:'b',type:'summary',label:'Summary',order:1,text:'Worked in a team.'}],jobContext:{roleTitle:'Specialist',seniority:'mid',surfaces:['app'],tone:'balanced',topPriorities:Array.from({length:n},(_,i)=>({signal:'topic '+i,weight:5})),mustHave:[],successMetrics:[],keywords:Array.from({length:10},(_,i)=>'keyword '+i)}});
 s.plan({contextRevision:'context',topics:Array.from({length:n},(_,i)=>({key:'topic-'+i,question:'Example '+i+'?',support:'unclear',signalRefs:[{field:'topPriorities',index:i}],evidence:[]}))},'en');s.start();
 const pending=[];const client=new Client({endpoint:'http://fixture.invalid',background:true,fetch:(_url,options)=>new Promise((resolve,reject)=>{pending.push({request:JSON.parse(options.body),resolve,reject});})});
 const respond=(i,drafts)=>{const p=pending[i];p.resolve(new Response(JSON.stringify(contract.modelResult(p.request,{drafts:drafts===undefined?[{proposedText:p.request.sourceAnswer.text,sourceQuote:p.request.sourceAnswer.text,coveredQuestionIds:[]}]:drafts})),{status:200}));};
 return {s,client,pending,respond};
}
test('next question is available before transport settles; reverse-order responses keep sources and CV bound',async()=>{
 const {s,client,pending,respond}=setup(),before=JSON.stringify(s.snapshot().context),first=s.current().id;
 const a=client.submit(s,'I led an AI workshop.');assert.equal(s.round().index,1);assert.equal(s.round().phase,'question');assert.equal(s.results().pending,1);
 const second=s.current().id,b=client.submit(s,'I helped customers get started.');assert.equal(s.round().index,2);assert.equal(s.results().pending,2);
 respond(1);await b;assert.equal(s.round().index,2);assert.equal(s.accounts()[0].questionId,second);
 respond(0);await a;assert.equal(s.round().index,2);assert.equal(s.accounts().find(x=>x.questionId===first).sourceText,'I led an AI workshop.');assert.equal(s.results().pending,0);assert.equal(JSON.stringify(s.snapshot().context),before);assert.equal(pending.length,2);
});
test('a late coverage response never skips the active next question',async()=>{
 const {s,client,respond}=setup(),next=s.round().queue[1].id,future=s.round().queue[2].id;
 const work=client.submit(s,'I explained AI in a workshop.');respond(0,[{proposedText:'Explained AI.',sourceQuote:'I explained AI',coveredQuestionIds:[next,future]}]);await work;
 assert.equal(s.current().id,next);assert.equal(s.current().status,'unanswered');assert.equal(s.round().queue[2].status,'covered');s.skip();assert.equal(s.round().phase,'complete');
});
test('correction invalidates an older pending response without losing the corrected source',async()=>{
 const {s,client,respond}=setup(),first=s.current().id;
 const old=client.submit(s,'I led the workshop.');s.correct(first);const corrected=client.submit(s,'I helped run the workshop.');
 respond(1);await corrected;respond(0);assert.deepEqual(await old,{stale:true});
 assert.equal(s.accounts().length,1);assert.equal(s.accounts()[0].currentRevision,2);assert.equal(s.accounts()[0].sourceText,'I helped run the workshop.');assert.equal(s.round().index,1);
});
test('background failure is attached to its own source; manual retry is deduplicated and does not move current question',async()=>{
 const {s,client,pending,respond}=setup();const work=client.submit(s,'I organised a workshop.');pending[0].reject(Error('unavailable'));await assert.rejects(work,/unavailable/);
 assert.equal(s.round().index,1);assert.equal(s.round().phase,'question');assert.equal(s.results().failed,1);assert.equal(s.snapshot().answers[0].revisions[0].text,'I organised a workshop.');
 const answerId=s.snapshot().answers[0].id,one=client.retry(s,answerId),two=client.retry(s,answerId);assert.equal(one,two);assert.equal(pending.length,2);respond(1);await one;
 assert.equal(s.accounts().length,1);assert.equal(s.accounts()[0].currentRevision,1);assert.equal(s.round().index,1);assert.equal(s.results().failed,0);
});
test('empty extraction queues one followup after original questions; no positive result is invented',async()=>{
 const {s,client,respond}=setup(2);const work=client.submit(s,'It depends on the situation.');respond(0,[]);await work;
 assert.equal(s.round().index,1);assert.equal(s.round().phase,'question');s.submit('No');assert.equal(s.round().index,0);assert.equal(s.round().phase,'followup');assert.equal(s.accounts().length,0);
 const followup=client.submit(s,'There is no example.');respond(1,[]);await followup;assert.equal(s.round().phase,'complete');assert.equal(s.results().examples.length,0);assert.equal(s.results().needsDetail,1);assert.equal(s.summary().unknown,0);
});
test('completion distinguishes pending and failed interpretation from no new examples; finishing early stays finished',async()=>{
 const {s,client,respond}=setup(1);let updates=0;s.observe(()=>updates++);
 const work=client.submit(s,'I explained the service.');assert.equal(s.round().phase,'complete');assert.equal(s.results().pending,1);assert.equal(s.results().examples.length,0);
 s.finish();respond(0,[]);await work;assert.equal(s.round().phase,'complete');assert.equal(s.results().needsDetail,1);assert.equal(updates,1);
});
test('late background response after context change cannot populate the new round',async()=>{
 const {s,client,respond}=setup();const work=client.submit(s,'I led a workshop.');s.setContext({...s.snapshot().context,revision:'new'});s.plan({contextRevision:'new',topics:[]},'en');s.start();respond(0);assert.deepEqual(await work,{stale:true});assert.equal(s.accountsForRound().length,0);assert.equal(s.results().pending,0);
});

test('clarification retains the original source and full combined source is validated and sent once',async()=>{
 const {s,client,pending,respond}=setup(1),first='I ran internal AI workshops for colleagues.';
 const work=client.submit(s,first);respond(0,[]);await work;assert.equal(s.round().phase,'followup');
 const token=s.token(),reply='I prepared the exercises and facilitated two sessions for our design team.';
 const next=client.submit(s,reply);assert.equal(pending.length,2);assert.equal(pending[1].request.sourceAnswer.text,first+'\n\n'+reply);
 assert.equal(s.snapshot().answers[0].revisions[0].text,first);assert.equal(s.snapshot().answers[0].revisions[1].followupReply,reply);
 respond(1,[{proposedText:'Internal workshops.',sourceQuote:first,coveredQuestionIds:[]}]);await next;
 assert.equal(s.accounts()[0].sourceText,first+'\n\n'+reply);assert.throws(()=>s.answerForToken(token),/STALE_ANSWER/);assert.equal(s.round().phase,'complete');
});

test('a clarification over the combined source limit leaves the original answer untouched',async()=>{
 const {s,client,respond}=setup(1),work=client.submit(s,'x'.repeat(49999));respond(0,[]);await work;
 const before=JSON.stringify(s.snapshot());assert.throws(()=>client.submit(s,'More details.'),/ANSWER_TOO_LONG/);assert.equal(JSON.stringify(s.snapshot()),before);
});

test('proposal sources contain raw answers and statuses, never advisory text; revisions and context invalidate them',async()=>{
 const {s,client,respond}=setup(3),first=s.current().id,raw='I ran internal workshops, not customer workshops.';
 const work=client.submit(s,raw);respond(0,[{proposedText:'Led customer executive sessions.',sourceQuote:raw,coveredQuestionIds:[]}]);await work;s.skip();s.submit('No');
 const source=s.proposalSources();assert.equal(source.answers.length,1);assert.equal(source.answers[0].text,raw);assert.equal(source.questions[1].status,'skipped');assert.equal(source.questions[2].status,'no');assert.equal(JSON.stringify(source).includes('Led customer executive sessions.'),false);assert.equal(s.sourcesCurrent(source),true);
 s.correct(first);s.submit('I prepared materials for internal workshops.');assert.equal(s.sourcesCurrent(source),false);const updated=s.proposalSources();assert.equal(updated.answers[0].revision,2);assert.equal(s.sourcesCurrent(updated),true);s.setContext({...s.snapshot().context,revision:'replacement'});assert.equal(s.sourcesCurrent(updated),false);
});

test('explicitly adopted approved CV retains correctable sources without silently reusing old proposal tokens',()=>{
 const {s}=setup(1);s.submit('I prepared slides for an internal workshop.');const source=s.proposalSources(),before=s.accounts()[0],context=s.snapshot().context;
 s.adoptApprovedCV({...context,revision:'approved-context',cvVersionId:'approved-cv',blocks:context.blocks.map(b=>({...b,text:b.text+' Approved source text.'}))});assert.equal(s.round().id,source.roundId);assert.equal(s.sourcesCurrent(source),false);assert.equal(s.accounts()[0].context.cvVersionId,before.context.cvVersionId);assert.equal(s.accounts()[0].sourceText,before.sourceText);s.correct(before.questionId);s.submit('I only prepared the title slide.');assert.equal(s.proposalSources().cvVersionId,'approved-cv');assert.equal(s.proposalSources().answers[0].revision,2);
});
