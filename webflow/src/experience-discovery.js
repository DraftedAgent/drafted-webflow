/* Session-only source answers. Interpretation is advisory, never confirmation or a CV edit. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DraftedExperienceDiscovery=api;})(globalThis,function(){
  'use strict';
  const MAX_ANSWER_LENGTH=50000,copy=x=>JSON.parse(JSON.stringify(x));
  const requireText=x=>{if(typeof x!=='string'||!x.trim())throw Error('INVALID_TEXT');};
  class Session{
    constructor({id=()=>globalThis.crypto.randomUUID()}={}){this.id=id;this.state={modelVersion:'source-answers-2',revision:0,context:null,round:null,answers:[]};}
    snapshot(){return copy(this.state);}
    setContext(c){requireText(c.revision);requireText(c.cvVersionId);if(!Array.isArray(c.blocks)||!c.jobContext)throw Error('INVALID_CONTEXT');if(this.state.context?.revision===c.revision&&JSON.stringify(this.state.context)!==JSON.stringify(c))throw Error('CONTEXT_REVISION_REQUIRED');this.state.context=copy(c);this.state.round=null;this.state.revision++;}
    plan(p,language){
      const c=this.state.context;if(!c||p.contextRevision!==c.revision)throw Error('STALE_CONTEXT');if(!['sv','en'].includes(language))throw Error('CHOOSE_CONVERSATION_LANGUAGE');if(!Array.isArray(p.topics))throw Error('INVALID_PLAN');if(this.state.round&&this.round().phase!=='complete')throw Error('ROUND_ALREADY_PLANNED');
      const keys=new Set(),refs=new Set(),queue=[];
      for(const t of p.topics){requireText(t.key);if(keys.has(t.key))throw Error('DUPLICATE_TOPIC');keys.add(t.key);if(!Array.isArray(t.signalRefs)||!t.signalRefs.length)throw Error('MISSING_SIGNAL');
        for(const ref of t.signalRefs){if(!['topPriorities','mustHave'].includes(ref.field)||!Number.isInteger(ref.index)||ref.index<0)throw Error('INVALID_SIGNAL');if(!c.jobContext[ref.field]?.[ref.index])throw Error('UNKNOWN_SIGNAL');const key=ref.field+':'+ref.index;if(refs.has(key))throw Error('REPEATED_SIGNAL');refs.add(key);}
        if(t.support==='clear'){if(!t.evidence?.length)throw Error('MISSING_CV_EVIDENCE');for(const e of t.evidence){requireText(e.quote);if(!c.blocks.some(b=>b.blockId===e.blockId&&b.text.includes(e.quote)))throw Error('INVALID_CV_EVIDENCE');}continue;}
        if(t.support!=='unclear')throw Error('INVALID_SUPPORT');requireText(t.question);queue.push({id:this.id(),topicKey:t.key,signalRefs:copy(t.signalRefs),question:t.question,status:'unanswered',followupUsed:false,answerId:null});
      }
      this.state.round={id:this.id(),contextRevision:c.revision,language,phase:'offer',total:queue.length,index:0,queue,notice:''};this.state.revision++;
    }
    round(){if(!this.state.round||this.state.round.contextRevision!==this.state.context?.revision)throw Error('NO_CURRENT_ROUND');return this.state.round;}
    current(){return this.round().queue[this.round().index]||null;}
    start(){const r=this.round();if(r.phase!=='offer')throw Error('INVALID_PHASE');r.phase=r.total?'question':'complete';}
    submit(text,{defer=false}={}){
      const r=this.round(),q=this.current();if(!q||!['question','followup','correct','error'].includes(r.phase))throw Error('INVALID_PHASE');requireText(text);if(text.length>MAX_ANSWER_LENGTH)throw Error('ANSWER_TOO_LONG');
      let a=this.state.answers.find(a=>a.id===q.answerId);if(!a){a={id:this.id(),questionId:q.id,topicKey:q.topicKey,roundId:r.id,context:copy(this.state.context),revisions:[],currentRevision:0,drafts:[],status:'pending'};this.state.answers.push(a);q.answerId=a.id;}
      this.invalidate(a.id);a.currentRevision++;a.revisions.push({revision:a.currentRevision,text});a.drafts=[];a.status='pending';q.status='answered';r.notice='';this.state.revision++;
      if(/^\s*(nej|no)[.!]?\s*$/i.test(text)){a.status=q.status='no';this.advance();return;}
      if(/^\s*(jag vet inte|vet inte|i don.?t know)[.!]?\s*$/i.test(text)){a.status=q.status='unknown';this.advance();return;}
      if(/^\s*(ja|yes|ja,? lite|yes,? a little|kanske|maybe|jag var med|det gick bra)[.!]?\s*$/i.test(text)){this.askFollowup();return;}
      r.phase='ready';if(!defer)this.reviewDrafts(this.token(),[{proposedText:text,sourceQuote:text,coveredQuestionIds:[]}]);
    }
    token(){const q=this.current(),a=this.state.answers.find(a=>a.id===q?.answerId);return {contextRevision:this.state.context?.revision,roundId:this.round().id,answerId:a?.id,answerRevision:a?.currentRevision};}
    beginInterpret(){if(!['ready','error'].includes(this.round().phase))throw Error('INVALID_PHASE');this.round().phase='interpreting';}
    interpretFailed(token){try{if(JSON.stringify(this.token())===JSON.stringify(token))this.round().phase='error';}catch{}}
    reviewDrafts(token,drafts){
      const r=this.round(),q=this.current(),a=this.state.answers.find(a=>a.id===q?.answerId);if(!a||!['ready','interpreting'].includes(r.phase)||JSON.stringify(this.token())!==JSON.stringify(token))throw Error('STALE_ANSWER');if(!Array.isArray(drafts))throw Error('INVALID_DRAFTS');
      for(const d of drafts){requireText(d.proposedText);requireText(d.sourceQuote);if(!a.revisions.at(-1).text.includes(d.sourceQuote))throw Error('INVALID_SOURCE_QUOTE');if(!Array.isArray(d.coveredQuestionIds)||d.coveredQuestionIds.some(id=>!r.queue.some(q=>q.id===id)))throw Error('UNKNOWN_QUESTION');}
      if(!drafts.length){this.askFollowup();return;}
      a.drafts=copy(drafts);a.status=q.status='recorded';this.state.revision++;this.advance();
    }
    askFollowup(){const r=this.round(),q=this.current();if(!q.followupUsed){q.followupUsed=true;r.phase='followup';r.notice=r.language==='sv'?'Vad gjorde du själv i det arbetet? Ett kort exempel räcker.':'What did you do yourself? A short example is enough.';}else{const a=this.state.answers.find(a=>a.id===q.answerId);if(a)a.status='unknown';q.status='unknown';this.advance();}}
    advance(){const r=this.round(),covered=new Set(this.state.answers.filter(a=>a.roundId===r.id&&a.status==='recorded').flatMap(a=>a.drafts.flatMap(d=>d.coveredQuestionIds)));r.index++;let n=0;
      while(r.index<r.total){const q=r.queue[r.index];if(covered.has(q.id)&&q.status==='unanswered'){q.status='covered';n++;}if(!['recorded','covered','skipped','no','unknown'].includes(q.status))break;r.index++;}
      r.notice=n?(r.language==='sv'?'Ditt svar besvarade också en senare fråga.':'Your answer also covered a later question.'):'';r.phase=r.index>=r.total?'complete':'question';
    }
    invalidate(answerId){const a=this.state.answers.find(a=>a.id===answerId);if(!a)return;a.status='pending';for(const q of this.state.round?.queue||[])if(q.status==='covered'&&a.drafts.some(d=>d.coveredQuestionIds.includes(q.id)))q.status='unanswered';}
    correct(id){const r=this.round(),index=r.queue.findIndex(q=>q.id===id);if(index<0)throw Error('UNKNOWN_QUESTION');r.index=index;r.phase='correct';r.notice='';}
    skip(){const r=this.round(),q=this.current();if(!q||!['question','followup','correct','error'].includes(r.phase))throw Error('INVALID_PHASE');if(q.answerId){this.invalidate(q.answerId);this.state.answers.find(a=>a.id===q.answerId).status='skipped';}q.status='skipped';this.advance();}
    finish(){this.round().phase='complete';}
    accounts(){return copy(this.state.answers.filter(a=>a.status==='recorded').map(a=>({...a,sourceText:a.revisions.at(-1).text,verification:'user_submitted',interpretationsAreAdvisory:true})));}
    accountsForRound(){return this.accounts().filter(a=>a.roundId===this.round().id);}
    summary(){const r=this.round(),count=s=>r.queue.filter(q=>q.status===s).length;return {total:r.total,answered:count('recorded'),covered:count('covered'),skipped:count('skipped'),no:count('no'),unknown:count('unknown'),remaining:r.queue.filter(q=>['unanswered','answered'].includes(q.status)).length};}
  }
  return {Session,MAX_ANSWER_LENGTH};
});
