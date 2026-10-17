/* Local preparation only. No transport, persistence or CV mutation. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DraftedExperienceDiscovery = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const MAX_ANSWER_LENGTH = 50000;
  const copy = value => JSON.parse(JSON.stringify(value));
  const requireText = value => {
    if (typeof value !== 'string' || !value.trim()) throw new Error('INVALID_TEXT');
    return value;
  };
  class Session {
    constructor({ id = () => globalThis.crypto.randomUUID() } = {}) {
      this.id = id;
      this.state = { modelVersion: 'local-draft-1', revision: 0, context: null,
        round: null, answers: [], experiences: [], proposals: [] };
    }
    snapshot() { return copy(this.state); }
    // Context revision is caller-owned and must change for any CV/ad input change.
    setContext(context) {
      requireText(context.revision);
      requireText(context.cvVersionId);
      if (!Array.isArray(context.blocks) || !context.jobContext) throw new Error('INVALID_CONTEXT');
      if (this.state.context?.revision === context.revision && JSON.stringify(this.state.context) !== JSON.stringify(context)) throw new Error('CONTEXT_REVISION_REQUIRED');
      this.state.context = copy(context);
      this.state.round = null;
      this.state.proposals.forEach(p => { p.stale = true; });
      this.state.revision++;
    }
    plan(assessment, language) {
      const s = this.state;
      if (!s.context || assessment.contextRevision !== s.context.revision) throw new Error('STALE_CONTEXT');
      if (!['sv', 'en'].includes(language)) throw new Error('CHOOSE_CONVERSATION_LANGUAGE');
      if (!Array.isArray(assessment.topics)) throw new Error('INVALID_PLAN');
      if (s.round && s.round.phase !== 'complete') throw new Error('ROUND_ALREADY_PLANNED');
      const keys = new Set(), refs = new Set();
      const queue = [];
      for (const topic of assessment.topics) {
        requireText(topic.key);
        if (keys.has(topic.key)) throw new Error('DUPLICATE_TOPIC');
        keys.add(topic.key);
        if (!Array.isArray(topic.signalRefs) || !topic.signalRefs.length) throw new Error('MISSING_SIGNAL');
        for (const ref of topic.signalRefs) {
          if (!['topPriorities', 'mustHave'].includes(ref.field) || !Number.isInteger(ref.index)) throw new Error('INVALID_SIGNAL');
          const signal = s.context.jobContext[ref.field]?.[ref.index];
          if (!signal) throw new Error('UNKNOWN_SIGNAL');
          const key = `${ref.field}:${ref.index}`;
          if (refs.has(key)) throw new Error('REPEATED_SIGNAL');
          refs.add(key);
        }
        if (topic.support === 'clear') {
          if (!Array.isArray(topic.evidence) || !topic.evidence.length) throw new Error('MISSING_CV_EVIDENCE');
          for (const e of topic.evidence) {
            requireText(e.quote);
            const block = s.context.blocks.find(b => b.blockId === e.blockId);
            if (!block || !block.text.includes(e.quote)) throw new Error('INVALID_CV_EVIDENCE');
          }
          continue;
        }
        if (topic.support !== 'unclear') throw new Error('INVALID_SUPPORT');
        requireText(topic.question);
        queue.push({ id: this.id(), topicKey: topic.key, signalRefs: copy(topic.signalRefs),
          question: topic.question, status: 'unanswered', followupUsed: false, answerId: null });
      }
      s.round = { id: this.id(), contextRevision: s.context.revision, language,
        phase: 'offer', total: queue.length, index: 0, queue, notice: '' };
      s.revision++;
    }
    round() {
      if (!this.state.round || this.state.round.contextRevision !== this.state.context?.revision) throw new Error('NO_CURRENT_ROUND');
      return this.state.round;
    }
    start() {
      const r = this.round();
      if (r.phase !== 'offer') throw new Error('INVALID_PHASE');
      r.phase = r.total ? 'question' : 'complete';
    }
    current() { return this.round().queue[this.round().index] || null; }
    submit(text) {
      const r = this.round(), q = this.current();
      if (!q || !['question', 'followup', 'correct', 'error'].includes(r.phase)) throw new Error('INVALID_PHASE');
      requireText(text);
      if (text.length > MAX_ANSWER_LENGTH) throw new Error('ANSWER_TOO_LONG');
      let answer = this.state.answers.find(a => a.id === q.answerId);
      if (!answer) {
        answer = { id: this.id(), questionId: q.id, topicKey: q.topicKey,
          roundId: r.id, context: copy(this.state.context), revisions: [], currentRevision: 0, drafts: [], factIds: [] };
        this.state.answers.push(answer);
        q.answerId = answer.id;
      }
      this.invalidate(answer.id);
      answer.currentRevision++;
      // Exact original text is retained separately from any model summary.
      answer.revisions.push({ revision: answer.currentRevision, text });
      answer.drafts = [];
      q.status = 'answered';
      this.state.revision++;
      if (/^\s*(nej|no)\s*[.!]?\s*$/i.test(text)) { q.status = 'no'; this.advance(); return; }
      if (/^\s*(jag vet inte|vet inte|i don.?t know)\s*[.!]?\s*$/i.test(text)) { q.status = 'unknown'; this.advance(); return; }
      if (/^\s*(ja|yes|ja,? lite|yes,? a little)\s*[.!]?\s*$/i.test(text)) {
        if (!q.followupUsed) { q.followupUsed = true; r.phase = 'followup'; }
        else {
          r.phase = 'question';
          r.notice = r.language === 'sv'
            ? 'Ett ja räcker inte som erfarenhetsunderlag. Berätta gärna vad du gjorde, eller hoppa över.'
            : 'A yes alone is not an account of experience. You can share what you did, or skip.';
        }
        return;
      }
      // Preview default uses the verbatim account, with no invented extraction.
      answer.drafts = [{ proposedText: text, sourceQuote: text, coveredQuestionIds: [] }];
      r.phase = 'confirm';
    }
    token() {
      const q = this.current(), a = this.state.answers.find(a => a.id === q?.answerId);
      return { contextRevision: this.state.context?.revision, roundId: this.round().id,
        answerId: a?.id, answerRevision: a?.currentRevision };
    }
    beginInterpret() {
      const r=this.round(), a=this.state.answers.find(a=>a.id===this.current()?.answerId);
      if (!a || !['confirm','error'].includes(r.phase)) throw new Error('INVALID_PHASE');
      a.drafts=[]; r.phase='interpreting';
    }
    interpretFailed(token) {
      if (JSON.stringify(this.token())===JSON.stringify(token)) this.round().phase='error';
    }
    // Candidate extraction adapter: no API is implemented or called here.
    reviewDrafts(token, drafts) {
      const r = this.round(), q = this.current(), a = this.state.answers.find(a => a.id === q?.answerId);
      if (!a || !['confirm','interpreting'].includes(r.phase) || token.contextRevision !== r.contextRevision || token.roundId !== r.id ||
        token.answerId !== a.id || token.answerRevision !== a.currentRevision) throw new Error('STALE_ANSWER');
      if (a.drafts.some(d => d.confirmed)) throw new Error('ALREADY_CONFIRMED');
      if (!Array.isArray(drafts)) throw new Error('INVALID_DRAFTS');
      const text = a.revisions.at(-1).text;
      for (const draft of drafts) {
        requireText(draft.proposedText); requireText(draft.sourceQuote);
        if (!text.includes(draft.sourceQuote)) throw new Error('INVALID_SOURCE_QUOTE');
        if (!Array.isArray(draft.coveredQuestionIds) || draft.coveredQuestionIds.some(id => !r.queue.some(x => x.id === id))) throw new Error('UNKNOWN_QUESTION');
      }
      a.drafts = copy(drafts);
      r.phase=drafts.length?'confirm':'question';
      if (!drafts.length) r.notice=r.language==='sv'?'Jag fick inget konkret exempel ur svaret. Du kan berätta mer eller hoppa över.':'I did not find a concrete example in the answer. You can share more, or skip.';
    }
    confirmDraft(index) {
      const r = this.round(), q = this.current(), a = this.state.answers.find(a => a.id === q?.answerId);
      if (r.phase !== 'confirm' || !a?.drafts[index]) throw new Error('INVALID_PHASE');
      const draft = a.drafts[index];
      if (draft.confirmed) return;
      const factId = a.factIds[index] || this.id();
      a.factIds[index] = factId;
      const previousRevision = Math.max(0, ...this.state.experiences.filter(e => e.id === factId).map(e => e.revision));
      const fact = { id: factId, revision: previousRevision + 1, status: 'confirmed', confirmation: 'user',
        text: draft.proposedText, source: { kind: 'user_answer', answerId: a.id,
          answerRevision: a.currentRevision, quote: draft.sourceQuote },
        topicKey: q.topicKey, coveredQuestionIds: [...new Set(draft.coveredQuestionIds)] };
      this.state.experiences.push(fact);
      draft.confirmed = true;
      q.status = 'confirmed';
      this.state.revision++;
    }
    next() {
      const r = this.round(), a = this.state.answers.find(a => a.id === this.current()?.answerId);
      if (r.phase !== 'confirm' || !a?.drafts.length || !a.drafts.every(d => d.confirmed)) throw new Error('CONFIRM_EACH_FACT');
      this.advance();
    }
    advance() {
      const r = this.round();
      const covered = new Set(this.state.experiences.filter(e => e.status === 'confirmed').flatMap(e => e.coveredQuestionIds));
      let skippedCovered = 0;
      r.index++;
      while (r.index < r.total) {
        const next = r.queue[r.index];
        if (covered.has(next.id) && next.status === 'unanswered') {
          next.status = 'covered'; skippedCovered++;
        }
        if (!['confirmed','covered','skipped','no','unknown'].includes(next.status)) break;
        r.index++;
      }
      r.notice = skippedCovered ? (r.language === 'sv' ? 'Ditt bekräftade svar täckte också senare frågor.' : 'Your confirmed answer also covered later questions.') : '';
      r.phase = r.index >= r.total ? 'complete' : 'question';
    }
    skip() {
      const r = this.round(), q = this.current();
      if (!q || !['question','followup','confirm','correct','error'].includes(r.phase)) throw new Error('INVALID_PHASE');
      if (q.answerId) this.invalidate(q.answerId);
      q.status = 'skipped'; this.advance();
    }
    finish() { this.round().phase = 'complete'; }
    correct(questionId) {
      const r = this.round(), index = r.queue.findIndex(q => q.id === questionId);
      if (index < 0) throw new Error('UNKNOWN_QUESTION');
      const q = r.queue[index];
      if (q.answerId) this.invalidate(q.answerId);
      q.status = 'answered'; r.index = index; r.phase = 'correct';
    }
    invalidate(answerId) {
      for (const fact of this.state.experiences) if (fact.source.answerId === answerId && fact.status === 'confirmed') {
        fact.status = 'superseded';
        for (const q of this.state.round?.queue || []) if (q.status === 'covered' && fact.coveredQuestionIds.includes(q.id)) q.status = 'unanswered';
      }
      this.state.proposals.forEach(p => { if (p.answerIds.includes(answerId)) p.stale = true; });
    }
    confirmed() { return copy(this.state.experiences.filter(e => e.status === 'confirmed')); }
    confirmedForRound() {
      const answerIds = new Set(this.state.answers.filter(a => a.roundId === this.round().id).map(a => a.id));
      return this.confirmed().filter(e => answerIds.has(e.source.answerId));
    }
    summary() {
      const r = this.round();
      return { total: r.total, confirmed: r.queue.filter(q => q.status === 'confirmed').length,
        covered: r.queue.filter(q => q.status === 'covered').length,
        skipped: r.queue.filter(q => q.status === 'skipped').length,
        no: r.queue.filter(q => q.status === 'no').length,
        unknown: r.queue.filter(q => q.status === 'unknown').length,
        remaining: r.queue.filter(q => ['unanswered','answered'].includes(q.status)).length };
    }
  }
  return { Session, MAX_ANSWER_LENGTH };
});
