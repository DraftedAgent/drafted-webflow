/* Embeddable local UI; caller supplies a Session, never a live endpoint. */
(function (root) {
  'use strict';
  function mount(container, session, { onContinue = () => {}, onAnswer=text=>session.submit(text), onRetry=null } = {}) {
    let draft = '', error = '', busy = false;
    const sv = () => session.round().language === 'sv';
    const text = (a, b) => sv() ? a : b;
    const element = (tag, content, className) => {
      const el = document.createElement(tag);
      if (content) el.textContent = content;
      if (className) el.className = className;
      return el;
    };
    const action = (label, fn) => {
      const button = element('button', label);
      button.type = 'button';
      button.disabled=busy;
      button.addEventListener('click', async () => {
        try { error = ''; const pending=fn();if(pending&&typeof pending.then==='function'){busy=true;render();await pending;busy=false;} render(); }
        catch (e) {
          busy=false;
          error = e.message === 'ANSWER_TOO_LONG'
            ? text('Texten är för lång. Behåll den och dela upp svaret i flera delar.', 'The text is too long. Keep it and split the answer into parts.')
            : text('Det gick inte. Ditt svar är kvar. Försök igen.', 'That did not work. Your answer is still here. Try again.');
          render();
        }
      });
      return button;
    };
    function render() {
      const r = session.round();
      container.replaceChildren();
      container.classList.add('experience-discovery');
      container.append(element('p', text('Det du berättar sparas bara i den här öppna sessionen. CV:t ändras inte.',
        'Your account stays in this open session only. Your CV is unchanged.'), 'discovery-note'));
      if (r.phase === 'offer') {
        const n = r.total;
        container.append(element('h2', n
          ? text(`Jag hittade ${n} saker som är viktiga för rollen men inte syns tydligt i ditt CV.`, `I found ${n} things that matter for the role but are not clear in your CV.`)
          : text('Vi kan gå vidare med det som finns.', 'We can continue with what is already there.')));
        if (n) container.append(element('p', text('Vi kan gå igenom dem en i taget.', 'We can go through them one at a time.')),
          action(text('Börja frågorna', 'Start the questions'), () => session.start()));
        container.append(action(text('Fortsätt med det som finns', 'Continue with what is available'), () => {session.finish(); onContinue(session.confirmedForRound());}));
      } else if (r.phase === 'complete') {
        const s = session.summary();
        container.append(element('h2', text('Här är det vi gick igenom', 'Here is what we went through')),
          element('p', text(`${s.confirmed} frågor med bekräftade svar, ${s.covered} täckta av andra svar, ${s.skipped} överhoppade, ${s.no} nej, ${s.unknown} osäkra och ${s.remaining} kvar av ${s.total}.`,
            `${s.confirmed} questions with confirmed answers, ${s.covered} covered by other answers, ${s.skipped} skipped, ${s.no} no, ${s.unknown} unsure and ${s.remaining} remaining out of ${s.total}.`)));
        for (const q of r.queue.filter(q => q.answerId)) {
          container.append(action(text(`Rätta svar ${r.queue.indexOf(q)+1}`, `Correct answer ${r.queue.indexOf(q)+1}`), () => {
            const a = session.snapshot().answers.find(a => a.id === q.answerId);
            draft = a.revisions.at(-1).text; session.correct(q.id);
          }));
        }
        container.append(action(text('Fortsätt med befintligt underlag', 'Continue with existing material'), () => onContinue(session.confirmedForRound())));
      } else {
        const progress = element('p', `${r.index+1}/${r.total}`, 'discovery-progress');
        progress.setAttribute('aria-label', text(`Fråga ${r.index+1} av ${r.total}`, `Question ${r.index+1} of ${r.total}`));
        container.append(progress);
        if (r.notice) container.append(element('p', r.notice));
        const q = session.current();
        container.append(element('h2', r.phase === 'followup'
          ? text('Vad gjorde du själv i det arbetet? Ett exempel räcker.', 'What did you do yourself? One example is enough.')
          : q.question));
        if (r.phase === 'interpreting') {
          container.append(element('p',text('Jag läser ditt svar…','I am reading your answer…')));
        } else if (r.phase === 'confirm') {
          const a = session.snapshot().answers.find(a => a.id === q.answerId);
          container.append(element('p', text('Har jag förstått dig rätt? Bekräfta varje uppgift eller rätta svaret.',
            'Have I understood you correctly? Confirm each item or correct your answer.')));
          a.drafts.forEach((d, index) => {
            container.append(element('p', d.proposedText, 'discovery-answer'));
            const details = element('details');
            details.append(element('summary', text('Ditt fullständiga svar', 'Your full account')),
              element('p', a.revisions.at(-1).text, 'discovery-answer'));
            container.append(details);
            if (!d.confirmed) container.append(action(text('Det stämmer', 'That is correct'), () => session.confirmDraft(index)));
            else container.append(element('p', text('Bekräftat av dig', 'Confirmed by you')));
          });
          container.append(action(text('Rätta mitt svar', 'Correct my answer'), () => {
            draft = a.revisions.at(-1).text; session.correct(q.id);
          }));
          if (a.drafts.every(d => d.confirmed)) container.append(action(text('Nästa fråga', 'Next question'), () => { draft=''; session.next(); }));
        } else {
          const label = element('label', text('Svara kort eller berätta mer – båda funkar.', 'A short answer or a longer story — both work.'));
          const input = element('textarea');
          input.rows = 8;
          input.value = draft;
          input.setAttribute('aria-label', label.textContent);
          input.addEventListener('input', () => { draft = input.value; });
          label.append(input);
          container.append(label, element('p', text('Upp till 50 000 tecken per svar. Längre berättelser kan delas upp. Inget kapas automatiskt.',
            'Up to 50,000 characters per answer. Longer accounts can be split. Nothing is automatically cut.'), 'discovery-note'),
            action(text('Skicka svar', 'Send answer'), async () => { await onAnswer(draft); draft=''; }));
          if(r.phase==='error'&&onRetry)container.append(action(text('Försök igen','Try again'),()=>onRetry()));
          container.append(action(text('Nej', 'No'), () => {session.submit(text('Nej','No'));draft='';}),
            action(text('Jag vet inte', 'I don’t know'), () => {session.submit(text('Jag vet inte',"I don't know"));draft='';}));
        }
        container.append(action(text('Hoppa över', 'Skip'), () => {session.skip();draft='';}),
          action(text('Avsluta frågorna', 'Finish the questions'), () => session.finish()));
      }
      if (error) { const alert=element('p',error);alert.setAttribute('role','alert');container.append(alert); }
    }
    render();
    return { render };
  }
  root.DraftedExperienceDiscoveryUI = { mount };
})(globalThis);
