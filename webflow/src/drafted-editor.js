/**
 * IMPORTANT:
 * This file enforces the backend response contract defined in:
 * - contracts/response-contract.md
 * - contracts/block-schema-v1.md
 *
 * blocks[] is the single source of truth.
 * Any code suggestion violating this is invalid.
 */



console.log("DRAFTED_JS_SOURCE", "__DRAFTED_BUILD_ID__");

console.log("🚀 drafted-editor.js executing");

// ===============================
// n8n endpoints (GLOBAL CONFIG)
// ===============================
const draftedEndpoints = window.__DRAFTED_PREVIEW_ENDPOINTS__ || {};
const draftedFeatures=window.__DRAFTED_EDITOR_FEATURES__||draftedEndpoints;
const N8N_UPLOAD_URL = draftedEndpoints.upload || "https://drafted.app.n8n.cloud/webhook/webflow-upload-cv";
const N8N_EDITOR_URL = draftedEndpoints.rewrite || "https://drafted.app.n8n.cloud/webhook/webflow-editor-rewrite";
const N8N_CHAT_URL = draftedEndpoints.chat || "https://drafted.app.n8n.cloud/webhook/webflow-chat-cv";
const N8N_EXPORT_PDF_URL = draftedEndpoints.export || "https://drafted.app.n8n.cloud/webhook/webflow-export-pdf";
const N8N_JOBCONTEXT_URL = draftedEndpoints.jobcontext || "https://drafted.app.n8n.cloud/webhook/webflow-jobcontext-extract";
const N8N_TAILOR_URL = draftedEndpoints.tailor || "https://drafted.app.n8n.cloud/webhook/tailor-cv";
const N8N_DISCOVERY_URL = draftedEndpoints.discovery || "https://drafted.app.n8n.cloud/webhook/webflow-experience-discovery";
let discoveryController = null;
let coverageController = null;
let coverageNavigation = null;
let discoveryCvFile = null;
let tailorInFlight = false;
let tailorFinishing=false;
let tailorAppliedStamp = null;
let tailorOverviewStamp = null;
let cvSelectionState=null,cvSelectionUI=null,tailorCompletionContext=null,automaticSelectionPending=false;
let workspacePages = null;
let tailorReviewState = null;
let workspaceContextRevision = 0;
let workspaceContinuing = false;
let workspaceReading = {chat:0,document:0};
let tailorReviewCheck = null;
let tailorReviewDispose = null;
const tailorSourcesEnabled=(!window.__DRAFTED_PREVIEW_ENDPOINTS__&&N8N_TAILOR_URL==="https://drafted.app.n8n.cloud/webhook/tailor-cv")||['localhost','127.0.0.1'].includes(location.hostname)&&draftedEndpoints.tailorSources===true&&draftedEndpoints.tailor==='/preview-api/tailor';
const tailorSourceLedger=new DraftedTailorSources.Ledger();
// Flip only in a separately approved release after the endpoint supports 1.2.
const productionStructuredContext=true;
// Public capability is emitted only by a release whose backend activation was verified.
const tailorSourcesVersion=window.__DRAFTED_PREVIEW_ENDPOINTS__?(draftedEndpoints.tailorSourcesVersion||'1.0'):(['1.4','1.5'].includes(window.__DRAFTED_TAILOR_SOURCES_VERSION__)?window.__DRAFTED_TAILOR_SOURCES_VERSION__:productionStructuredContext?'1.2':'1.1');
const structuredContextEnabled=tailorSourcesEnabled&&['1.2','1.3','1.4','1.5'].includes(tailorSourcesVersion);

// The editor is a workspace; remove the legacy Webflow section introduction.
onReady(() => {
  document.querySelectorAll(".section-editor > .editor-container > .editor-header").forEach(header => header.remove());
  document.querySelectorAll(".section-editor .chat-card > .paragraph-2.hide-when-cv-loaded").forEach(intro => intro.remove());
});




  const preparation = DraftedPreparationView.mount(document.getElementById('section-input'));
  let uploadInFlight = false;
  const uploadBtn = document.getElementById("upload-btn");
  const previewFrame = document.getElementById("cv-preview");
  const previewWrap = document.querySelector(".cv-preview-wrap");
  const uploadScan = window.DraftedCvScan?.create({host:previewWrap});
  document.getElementById('cv-file')?.addEventListener('change',()=>uploadScan?.stop());
  const editorDocument = document.querySelector(".cv-document"); 
  const editorPaper = document.querySelector(".cv-document-inner"); 

  function getFileInput() {
    return document.getElementById("cv-file");
  }

  function getFileNameEl() {
    return document.getElementById("file-name");
  }

  function getPreviewFrame() {
    return document.getElementById("cv-preview");
  }

  function getPreviewWrap() {
    return document.querySelector(".cv-preview-wrap");
  }

  
  // Global lock shared across all listeners / duplicate bindings
  window.__DRAFTED_CHAT__ = window.__DRAFTED_CHAT__ || { inFlight: false };
  
  console.log("previewWrap found:", !!previewWrap);

  // Original uploaded CV-preview (top one)
(function mountPreviewLoadingOverlayOnce() {
  if (!previewWrap || uploadScan) return;

  let overlay = previewWrap.querySelector(".cv-preview-loading");
  if (overlay) {
    console.log("cv-preview-loading already exists");
    return;
  }

  overlay = document.createElement("div");
  overlay.className = "cv-preview-loading";
  overlay.innerHTML = `
    <div class="inner">
      <div class="row">
        <span class="drafted-upload-spinner"></span>
        <div>
          <div class="title">Analyzing your CV</div>
          <div class="meta">Keep this tab open while we prepare your CV.</div>
        </div>
      </div>
    </div>
  `;
  previewWrap.appendChild(overlay);
  console.log("cv-preview-loading mounted");
})();

  
// Rewritten CV-preview (editor)
  (function mountEditorLoadingOverlayOnce() {
  if (!editorPaper) {
    console.log("editorPaper not found (cv-document-inner)");
    return;
  }

  let overlay = editorPaper.querySelector(".editor-processing");
  if (overlay) {
    console.log("editor-processing already exists");
    return;
  }

  editorPaper.style.position = editorPaper.style.position || "relative";
  overlay = document.createElement("div");
  overlay.className = "editor-processing";
  overlay.innerHTML = `
    <div class="editor-processing__inner">
      <div class="editor-processing__title">Shaping your rewritten CV</div>
      <div class="editor-processing__meta">
        We’re restructuring for clarity, relevance, and role fit.<br/>
        This usually takes about a minute.
      </div>
    </div>
  `;
  editorPaper.appendChild(overlay);
  console.log("editor-processing mounted");
})();

  
  function setEditorPlaceholder(isOn) {
  if (!editorPaper) return;

  const on = !!isOn;

  editorPaper.classList.toggle("has-placeholder", on);

  const ph = editorPaper.querySelector(".editor-placeholder");
  if (ph) {
    ph.style.display = on ? "" : "none"; // extra hard override
    ph.setAttribute("aria-hidden", on ? "false" : "true");
  }

  console.log("setEditorPlaceholder", { on, hasPh: !!ph, classOn: editorPaper.classList.contains("has-placeholder") });
}

  
function setEditorProcessing(isOn) {
  if (!editorPaper) return;

  const next = !!isOn;

  editorPaper.classList.toggle("is-processing", next);

  setCommandBarLocked(next);
}
  

(function mountEditorPlaceholderOnce() {
  if (!editorPaper) {
    console.log("editorPaper not found (cv-document-inner)");
    return;
  }

  let ph = editorPaper.querySelector(".editor-placeholder");
  if (ph) {
    console.log("editor-placeholder already exists");
    return;
  }

  ph = document.createElement("div");
  ph.className = "editor-placeholder";
  ph.innerHTML = `
    <div class="editor-placeholder__inner">
      <div class="editor-placeholder__title">Upload a CV to begin</div>
      <div class="editor-placeholder__meta">
        Your rewritten CV will appear here. You’ll be able to select any part and refine it through the editor.
      </div>
    </div>
  `;
  editorPaper.appendChild(ph);
  console.log("editor-placeholder mounted");
})();

  const targetRoleInput = document.getElementById("target-role-input");
  const editorPreviewEl =
    document.getElementById("editor-preview-text") ||
    document.querySelector(".cv-document-text");
  const editorInput = document.getElementById("editor-input");
  window.DraftedSpelling?.configure({getProtectedText:()=>JSON.stringify(documentBlocksState||[])+"\n"+(activeJobText||"")});
  const editorApplyBtn = document.getElementById("editor-send");       
  const editorChatBtn  = document.getElementById("editor-chat-send");   
  const contextChipEl  = document.getElementById("context-chip");
  const chatMessagesEl = document.querySelector(".chat-messages");
  // Webflow's initial conversation is an example, never real chat history.
  (function labelEditorDemo() {
    if (!chatMessagesEl || chatMessagesEl.querySelector(".drafted-chat-demo")) return;
    const examples = Array.from(chatMessagesEl.children).filter(el =>
      el.matches(".chat-message-ai, .chat-message-user")
    );
    if (!examples.length) return;

    const demo = document.createElement("section");
    demo.className = "drafted-chat-demo";
    demo.setAttribute("aria-label", "Example conversation — demo");
    const heading = document.createElement("div");
    heading.className = "drafted-chat-demo__heading";
    heading.textContent = "Example conversation";
    const note = document.createElement("p");
    note.className = "drafted-chat-demo__note";
    note.textContent = "This is a demo. Upload your CV to start your own conversation.";
    const messages = document.createElement("div");
    messages.className = "drafted-chat-demo__messages";
    examples.forEach(el => messages.appendChild(el));
    demo.append(heading, note, messages);
    chatMessagesEl.prepend(demo);
  })();
  const jobAdInputEl = document.getElementById("job-ad-input");
  let activeJobText=jobAdInputEl?.value||"";
  const jobContextStatusEl = document.getElementById("jobcontext-status");
  const jobContextStatusIconEl = document.getElementById("jobcontext-status-icon");
  const jobContextStatusTextEl = document.getElementById("jobcontext-status-text");

  // Hide these when a CV is loaded (add class "hide-when-cv-loaded" to both texts in Webflow)
  const hideWhenCvLoadedEls = document.querySelectorAll(".hide-when-cv-loaded");
  function setCvLoadedUI(isLoaded) {
    if (isLoaded) chatMessagesEl?.querySelector(".drafted-chat-demo")?.remove();
    hideWhenCvLoadedEls.forEach(el => {
      el.style.display = isLoaded ? "none" : "";
    });
  }

  
  function updatePreviewHeaderVisibility() {
  const hasCv = !!(documentBlocksState && documentBlocksState.length);

  const titleEl = document.querySelector(".cv-card-title");
  if (titleEl) titleEl.style.display = hasCv ? "none" : "";

  const descEl = document.querySelector(".cv-card-description");
  if (descEl) descEl.style.display = hasCv ? "none" : "";

  // show tools only when CV exists
  const toolsEl = document.querySelector(".cv-tools");
  if (toolsEl) toolsEl.style.display = hasCv ? "flex" : "none";
  if (hasCv) bindPdfDownloadButton();


  // optional: padding only when loaded
  const docEl = document.querySelector(".cv-document");
  if (docEl) docEl.classList.toggle("is-loaded", hasCv);
}



  const hasFileInput = !!getFileInput();
  if (
    !hasFileInput ||
    !uploadBtn ||
    !editorPreviewEl ||
    !editorInput ||
    !editorApplyBtn ||
    !contextChipEl ||
    !jobAdInputEl ||
    !jobContextStatusEl ||
    !jobContextStatusIconEl ||
    !jobContextStatusTextEl
  ) {
    console.error("❌ Missing required DOM elements", {
      fileInput: hasFileInput,
      uploadBtn: !!uploadBtn,
      editorPreviewEl: !!editorPreviewEl,
      editorInput: !!editorInput,
      editorApplyBtn: !!editorApplyBtn,
      contextChipEl: !!contextChipEl,
      jobAdInputEl: !!jobAdInputEl,
      jobContextStatusEl: !!jobContextStatusEl,
      jobContextStatusIconEl: !!jobContextStatusIconEl,
      jobContextStatusTextEl: !!jobContextStatusTextEl
    });
    throw new Error("Missing required Drafted editor DOM elements");
  }

  console.log("✅ Drafted editor loaded");

  DraftedWorkspaceView.flow();
  window.DraftedHeroView?.mount();

  // Initial UI state — safe to run now
  setEditorProcessing(false);
  setEditorPlaceholder(true);
  forceButtonsActiveLook();
  editorPreviewEl.setAttribute("tabindex", "0");
  



  function forceButtonsActiveLook() {
  const isProcessing = !!(editorPaper && editorPaper.classList.contains("is-processing"));

  // Never override lock state
  if (isProcessing) return;

  const btns = [editorApplyBtn, editorChatBtn].filter(Boolean);

  btns.forEach((btn) => {
    if (btn.disabled) {
      btn.style.opacity = "0.6";
      btn.style.pointerEvents = "none";
    } else {
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    }
  });

  if (editorInput) {
    editorInput.style.opacity = editorInput.disabled ? "0.7" : "1";
    editorInput.style.pointerEvents = editorInput.disabled ? "none" : "auto";
  }
}

   // ===============================
  // Upload loading UI 
  // ===============================
  const uploadBtnOriginalText = uploadBtn ? uploadBtn.textContent : "Upload CV";

  function ensureUploadButtonSpinner() {
    if (!uploadBtn) return null;

    let sp = uploadBtn.querySelector(".drafted-upload-spinner");
    if (!sp) {
      sp = document.createElement("span");
      sp.className = "drafted-upload-spinner";
      sp.hidden = true;
      uploadBtn.prepend(sp);
    }
    return sp;
  }

  
  function ensurePreviewLoadingOverlay() {
    if (!previewWrap) return null;

    let overlay = previewWrap.querySelector(".cv-preview-loading");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "cv-preview-loading";
      overlay.innerHTML = `
        <div class="inner">
          <div class="row">
            <span class="drafted-upload-spinner"></span>
            <div>
              <div class="title">Analyzing your CV</div>
              <div class="meta">Keep this tab open while we prepare your CV.</div>
            </div>
          </div>
        </div>
      `;
      previewWrap.appendChild(overlay);
    }
    return overlay;
  }

  
  function setUploadLoading(isLoading) {
    preparation?.loading(!!isLoading);
    if(uploadScan){
      previewWrap?.classList.remove('is-loading');
      if(isLoading)uploadScan.start();else uploadScan.stop();
      if(uploadBtn){uploadBtn.disabled=!!isLoading;uploadBtn.textContent=isLoading?'Analyzing…':uploadBtnOriginalText;}
      return;
    }
    const btnSpinner = ensureUploadButtonSpinner();
    ensurePreviewLoadingOverlay();

    if (previewWrap) previewWrap.classList.toggle("is-loading", !!isLoading);

    if (uploadBtn) {
      uploadBtn.disabled = !!isLoading;
      uploadBtn.textContent = isLoading ? "Analyzing…" : uploadBtnOriginalText;

      if (btnSpinner) {
        uploadBtn.prepend(btnSpinner);
        btnSpinner.hidden = !isLoading;
      }
    }
  }

  /* ===============================
     JOBCONTEXT AUTO-EXTRACT
     =============================== */
  let jobContextDebounceTimer = null;
  let jobContextReqSeq = 0;

  window.__DRAFTED_JOBCONTEXT__ = null;

  function jobContextDebugLog(...args) {
    if (window.__DRAFTED_DEBUG__ === true) {
      console.log("[jobcontext]", ...args);
    }
  }

  function setJobContextStatus(state, icon, text) {
    if (!jobContextStatusEl || !jobContextStatusIconEl || !jobContextStatusTextEl) return;
  
    const nextState = String(state || "idle");
    jobContextStatusEl.dataset.state = nextState;
  
    if (nextState === "idle") {
      jobContextStatusIconEl.textContent = "";
      jobContextStatusTextEl.textContent = "";
      return;
    }
  
    jobContextStatusIconEl.textContent = String(icon || "");
    jobContextStatusTextEl.textContent = String(text || "");
  }
  

  function clearJobContextDebounce() {
    if (jobContextDebounceTimer) {
      clearTimeout(jobContextDebounceTimer);
      jobContextDebounceTimer = null;
    }
  }

  async function runJobContextExtract() {
    if (!jobAdInputEl) return;

    const jobAdText = String(activeJobText || "").trim();
    if (jobAdText.length < 200) {
      // Invalidate any in-flight request and clear stale context/status.
      jobContextReqSeq += 1;
      window.__DRAFTED_JOBCONTEXT__ = null;
      setJobContextStatus("idle", "", "");
      maybeShowTailor();
      return;
    }

    const seq = ++jobContextReqSeq;
    setJobContextStatus("loading", "…", "Extracting role signals…");
    jobContextDebugLog("request:start", { seq, chars: jobAdText.length });

    try {
      const res = await fetch(N8N_JOBCONTEXT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobAdText })
      });

      const raw = await res.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (_e) {
        throw new Error("invalid-json");
      }

      if (!res.ok) throw new Error("http-not-ok");
if (!data || data.ok !== true) throw new Error("ok-false");

// NEW: require jobContext exists
if (!data.jobContext || typeof data.jobContext !== "object") {
  throw new Error("missing-jobContext");
}

if (seq !== jobContextReqSeq) {
  jobContextDebugLog("request:stale-success-ignored", { seq, latest: jobContextReqSeq });
  return;
}

window.__DRAFTED_JOBCONTEXT__ = data.jobContext;
setJobContextStatus("ready", "✓", "Signals ready");
maybeShowTailor();

      jobContextDebugLog("request:ready", { seq });
    } catch (err) {
      if (seq !== jobContextReqSeq) {
        jobContextDebugLog("request:stale-error-ignored", { seq, latest: jobContextReqSeq });
        return;
      }

      window.__DRAFTED_JOBCONTEXT__ = null;
      setJobContextStatus("error", "⚠", "Could not extract signals");
      maybeShowTailor();
      jobContextDebugLog("request:error", {
        seq,
        reason: String(err && err.message ? err.message : err)
      });
    }
  }

  function handleJobAdInput() {
    if (!jobAdInputEl) return;
    portraitController?.jobChanged();
    renderDocument(documentTextState);
    workspaceContextRevision++;
    jobContextReqSeq += 1;
    invalidateContextSuggestions();
    discoveryController?.invalidate();
    window.__DRAFTED_JOBCONTEXT__ = null;
    maybeShowTailor();

    const jobAdText = String(activeJobText || "").trim();
    if (jobAdText.length < 200) {
      clearJobContextDebounce();
      // Invalidate any in-flight request and clear stale context/status.
      jobContextReqSeq += 1;
      window.__DRAFTED_JOBCONTEXT__ = null;
      setJobContextStatus("idle", "", "");
      maybeShowTailor();
      return;
    }

    clearJobContextDebounce();
    setJobContextStatus('pending','…','Preparing job context…');
    jobContextDebounceTimer = setTimeout(() => {
      runJobContextExtract();
    }, 800);
  }

  setJobContextStatus("idle", "", "");

  /* ===============================
     TAILOR HIGHLIGHT CARD UI
     =============================== */

     function tailorContextStamp(sources=discoveryController?.sourceContentRevision()) {
       return JSON.stringify({revision:workspaceContextRevision,blocks:documentBlocksState,title:documentTitle,version:cvVersionId,language:cvLanguageDecision().language,explicitLanguage:cvLanguageConfirmed?documentLanguage:null,
         job:activeJobText,role:targetRoleInput?.value,context:window.__DRAFTED_JOBCONTEXT__,
         sources,ledger:tailorSourceLedger.groups,integrationApplications:tailorSourceLedger.integrations,integrationHistory:tailorSourceLedger.integrationHistory,languageApplications:tailorSourceLedger.languageApplications,languageHistory:tailorSourceLedger.languageHistory});
     }

     function tailorPresentationState() {
       if(tailorInFlight||tailorFinishing)return 'preparing';
       if(chatMessagesEl?.querySelector('.tailor-suggestion')||cvSelectionUI?.hasPending())return 'review';
       if(tailorAppliedStamp&&tailorAppliedStamp===tailorContextStamp(discoveryController?.sourceContentRevision()))return 'applied';
       return 'ready';
     }

     function refreshTailorPresentation() {
       coverageController?.refreshSources();
       tailorReviewCheck?.();
       const state=tailorPresentationState();
       if(tailorOverviewStamp&&tailorOverviewStamp!==tailorContextStamp()){chatMessagesEl?.querySelector('.tailor-feedback')?.remove();tailorOverviewStamp=null;}
       chatMessagesEl?.classList.toggle('is-tailor-preparing',state==='preparing');
       if(state!=='preparing')document.querySelectorAll('.tailor-progress').forEach(node=>node.remove());
       if(state==='preparing'){
         if(!chatMessagesEl.querySelector('.tailor-progress')){const progress=document.createElement('section');progress.className='tailor-progress';progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');progress.setAttribute('aria-atomic','true');const card=document.createElement('div');card.className='tailor-progress-card';const activity=document.createElement('span');activity.className='tailor-activity';activity.setAttribute('aria-hidden','true');const heading=document.createElement('h2');heading.textContent=tailorFinishing?'Tailoring your CV':'Preparing your suggestions';const note=document.createElement('p');note.textContent=tailorFinishing?'We’re using your review decisions to prepare the final result.':'We’re using your CV and available answers to prepare a suggestion for your review.';card.append(activity,heading,note);progress.append(card);chatMessagesEl.prepend(progress);chatMessagesEl.scrollTop=0;}
       }
       chatMessagesEl?.querySelectorAll('.tailor-applied-language,.tailor-applied-message').forEach(n=>n.remove());
       if(state==='ready'&&window.__DRAFTED_JOBCONTEXT__&&documentBlocksState?.length)setTailorReady();else setTailorHidden();
       discoveryController?.refreshTailorState();
       cvSelectionUI?.draw();
       if(state!=='ready'||tailorCompletionContext?.phase==='completed')chatMessagesEl?.querySelectorAll('.tailor-language-control').forEach(node=>node.remove());
       else document.querySelectorAll('.tailor-language-control').forEach(node=>node.replaceWith(createCvLanguageControl()));
       updateContextChip();
     }

     function showTailorSuggestion(data, stamp, request, omittedContext=new Set(), sectionSession=null) {
       // Own the review snapshots independently of transport and editor state.
       data=deepClone(data);request=deepClone(request);
       sectionSession=deepClone(sectionSession||{decisions:{},ledger:DraftedSectionReview.ledger(tailorSourceLedger)});
       tailorReviewState={data:deepClone(data),stamp,request:deepClone(request),omittedContext:[...omittedContext],sectionSession};
       tailorReviewDispose?.();
       document.querySelectorAll('.tailor-suggestion, .tailor-feedback').forEach(card=>card.remove());
       const card=document.createElement('section');card.className='tailor-suggestion discovery-guidance';card.setAttribute('aria-label','Tailoring suggestion');
       const add=(tag,text,host=card)=>{const node=document.createElement(tag);node.textContent=text;host.append(node);return node;};
       const sectionName=block=>[block?.type==='experience'?block.title:block?.type==='education'?[block.degree,block.program].filter(Boolean).join(', '):block?.label||({summary:'Summary',skills:'Skills',languages:'Languages',certifications:'Certifications'}[block?.type])||'CV block',block?.employer||block?.institution,['experience','education'].includes(block?.type)?[block.startDate,block.endDate].filter(Boolean).join('–'):''].filter((value,index,all)=>value&&all.indexOf(value)===index).join(' · ');
       // Preview actual proposed wording; never invent a new AI summary or use
       // an answer number in place of the change. Full text stays in details.
       const excerpt=text=>{const clean=String(text).replace(/\s+/g,' ').trim();return clean.length<=280?clean:clean.slice(0,280).replace(/\s+\S*$/,'')+'…';};
       const contextQuestion=(data.contextQuestions||[]).find(q=>['context_unclear','reference_unresolved'].includes(q.reason)&&!omittedContext.has(q.answerId));
       if(contextQuestion){
         const answer=request.sourceContext.answers.find(a=>a.id===contextQuestion.answerId&&a.revision===contextQuestion.answerRevision);
         if(!answer)throw Error('Missing context source');
         card.classList.add('tailor-context-mode');card.setAttribute('aria-label','Tailoring context');
         const existing=answer.text.includes('\n\nContext: ')?answer.text.split('\n\nContext: ').at(-1):'';
         const named=[...new Set(request.blocks.map(b=>b.employer||b.institution||(['project','projects'].includes(b.type)||b.type==='otherSections'&&/project|projekt/i.test(b.label||'')?b.label:'')).filter(name=>name&&answer.text.toLocaleLowerCase().includes(name.toLocaleLowerCase())))];
         const inferred=DraftedExperienceContext.infer(answer.text,request.cvVersionId,request.blocks);
         const question=structuredContextEnabled?inferred.question||'Which roles or projects does this example relate to? Select all that apply.':existing?'What additional role or project detail would help place this example?':named.length===1?('For the example mentioning '+named[0]+', what was your role?'):'Which roles or projects does this example relate to? Select all that apply.';
         add('h2',question);add('blockquote',excerpt(answer.text.split('\n\nContext: ')[0]));
         if(structuredContextEnabled){
           DraftedExperienceContextUI.mount(card,{blocks:request.blocks,cvVersionId:request.cvVersionId,selected:answer.experienceContext||(inferred.certainIds?.length?DraftedExperienceContext.selection(inferred.certainIds.map(id=>DraftedExperienceContext.reference(request.cvVersionId,request.blocks.find(b=>b.blockId===id)))):null),
             onContinue:value=>{if(stamp!==tailorContextStamp()||isPreviewingProposal)throw Error('STALE_CONTEXT');discoveryController.assignExperienceContext(contextQuestion.answerId,contextQuestion.answerRevision,value);card.remove();refreshTailorPresentation();runTailor();},
             onLeaveOut:()=>{if(stamp!==tailorContextStamp()||isPreviewingProposal){card.remove();showTailorFeedback('Your CV, job ad or answers changed. Prepare a new suggestion.',true);return;}if(!Array.isArray(data.blocks)){card.remove();refreshTailorPresentation();return;}showTailorSuggestion(data,stamp,request,new Set([...omittedContext,contextQuestion.answerId]));refreshTailorPresentation();}});
           chatMessagesEl.prepend(card);chatMessagesEl.scrollTop=0;return;
         }
         const input=add('textarea','');input.rows=3;input.value=existing;input.setAttribute('aria-label',question);input.placeholder='Add the missing context';
         const actions=add('div','');actions.className='tailor-actions';const save=add('button','Continue',actions),omit=add('button','Leave this out',actions);save.type=omit.type='button';save.className='tailor-primary';
         const current=()=>stamp===tailorContextStamp()&&!isPreviewingProposal;
         save.addEventListener('click',()=>{
           if(save.disabled)return;if(!input.value.trim()){input.setCustomValidity('Add the missing context or leave this example out.');input.reportValidity();return;}input.setCustomValidity('');
           if(!current()){add('p','Your CV, job ad or answers changed. Prepare a new suggestion.');return;}
           save.disabled=true;omit.disabled=true;
           try{discoveryController.appendContext(contextQuestion.answerId,contextQuestion.answerRevision,input.value);card.remove();refreshTailorPresentation();runTailor();}
           catch{save.disabled=false;omit.disabled=false;add('p','The context could not be saved. Your text is still here. Check the answer and try again.');}
         });input.addEventListener('input',()=>input.setCustomValidity(''));
         omit.addEventListener('click',()=>{if(!current()){card.remove();showTailorFeedback('Your CV, job ad or answers changed. Prepare a new suggestion.',true);return;}showTailorSuggestion(data,stamp,request,new Set([...omittedContext,contextQuestion.answerId]));refreshTailorPresentation();});
         document.querySelectorAll('.tailor-feedback').forEach(node=>node.remove());chatMessagesEl.prepend(card);chatMessagesEl.scrollTop=0;return;
       }
       const changed=DraftedSectionReview.changed(request,data).filter(id=>!sectionSession.decisions[id]);
       const previewData={...data,blocks:DraftedSectionReview.blocks(request,data,sectionSession.decisions,true)};
       const previewBaseline={blocks:deepClone(documentBlocksState)};
       if(!changed.length){
         tailorReviewState=null;
         automaticSelectionPending=true;
         tailorCompletionContext={request:deepClone(request),data:deepClone(data),decisions:{},phase:'ready-for-tailoring',preparedDemo:!!sectionSession.preparedDemo};
         for(const note of data.recipe?.reviewNotes||[]){const p=document.createElement('p');p.textContent=note.reason;chatMessagesEl.querySelector('.tailor-feedback')?.append(p);}
         if(data.sourceReview?.length){const p=document.createElement('p');p.textContent='Earlier integrated wording needs review and was left unchanged.';chatMessagesEl.querySelector('.tailor-feedback')?.append(p);}
         if(['1.2','1.3'].includes(data.sourcesSchemaVersion)&&data.contextQuestions?.some(q=>q.reason==='new_block_required')){const note=document.createElement('p');note.textContent='Your new context is saved with your answer. It has no selected CV entry; no new CV entry was created.';chatMessagesEl.querySelector('.tailor-feedback')?.append(note);}
         return;
       }
       const fullDetails=document.createElement('details');fullDetails.className='tailor-change-details';add('summary','View details',fullDetails);
       for(const note of data.recipe?.reviewNotes||[]){const section=add('section','',fullDetails);add('h3','Review note — not CV text',section);add('p',note.reason,section);}
       card.classList.add('tailor-review');
       card.dataset.proposalId=crypto.randomUUID();
       const body=add('div','');body.className='tailor-review-body';if(sectionSession.preparedDemo)add('small','Prepared demo example',body).className='prepared-demo-label';body.tabIndex=0;body.setAttribute('role','group');body.setAttribute('aria-label','Proposed changes');
       const endPreview=()=>{const preview=tailorCvPreview;tailorCvPreview=null;preview?.dispose();};
       const previewDialog=document.getElementById('cv-preview-dialog');
       const navigate=block=>{
         if(!checkCurrent())return;
         documentComparison?.edited();
         if(innerWidth<=700&&!previewDialog?.open)document.querySelector('.workspace-expand-preview')?.click();
         if(!tailorCvPreview)tailorCvPreview=DraftedTailorCvPreview.create({host:editorPreviewEl,candidate:previewData,baseline:previewBaseline,onDecision:(id,value)=>value==='edit'?openSectionEdit(id):decideSections([id],value),proposalId:card.dataset.proposalId,render:()=>renderDocument(documentTextState),isCurrent:checkCurrent,onClose:endPreview});
         tailorCvPreview.navigate(block.blockId);
       };
       // Actual text changes drive the review; source receipts stay optional.
       const proposed=DraftedTailorChangePreview.changes(request.blocks,data.blocks);for(const item of data.languageChanges||[])if(!proposed.some(c=>c.blockId===item.blockId))proposed.push({blockId:item.blockId,edits:[]});
       let noteTargets=[];
       if(data.recipe?.reviewNotes?.length){try{noteTargets=DraftedTailorSources.makeCatalog(request,data.scope).targets;}catch{ /* Older proposals may have no source catalog. */ }}
       for(const change of proposed.filter(change=>changed.includes(change.blockId))){
         const block=data.blocks.find(b=>b.blockId===change.blockId),section=add('section','',body);section.className='tailor-block-change';section.dataset.reviewBlockId=change.blockId;
         const title=add('div','',section);title.className='tailor-block-title';
         const heading=add('h3','',title),originalBlock=request.blocks.find(b=>b.blockId===change.blockId);
         const oldTitle=originalBlock?.title||'',newTitle=block.title||'';
         const translating=data.languagePlan&&data.languagePlan.cvLanguage!==request.language;
         const meaningfulTitle=oldTitle!==newTitle&&!(translating&&DraftedCvLanguage.equivalentTitle(oldTitle,newTitle));
         if(meaningfulTitle){
           heading.classList.add('tailor-title-diff');
           for(const run of DraftedTailorChangePreview.wordDiff(oldTitle,newTitle)){
             if(run.type==='equal')heading.append(document.createTextNode(run.text));
             else{const mark=add(run.type==='remove'?'del':'mark',run.text,heading);mark.className=run.type==='remove'?'tailor-mark-removed':'tailor-mark-added';}
           }
           const context=[block.employer,[block.startDate,block.endDate].filter(Boolean).join('–')].filter(Boolean).join(' · ');if(context)heading.append(document.createTextNode(' · '+context));
         }else heading.textContent=sectionName(block);
         const decisions=add('div','',section);decisions.className='tailor-section-actions';
         for(const [text,value]of [['Accept','accept'],['Decline','decline'],['Edit','edit']]){const button=add('button',text,decisions);button.type='button';if(value==='edit'&&window.DraftedWorkspacePages?.sample&&window.__DRAFTED_COVERAGE__?.mode==='simulated'&&!window.__DRAFTED_REVISION_LIVE__){button.disabled=true;button.title='Real AI revision is not enabled on this local server.';}button.addEventListener('click',()=>value==='edit'?openSectionEdit(change.blockId):decideSections([change.blockId],value));}
         const notes=(data.recipe?.reviewNotes||[]).filter(n=>noteTargets.some(t=>t.targetKey===n.targetKey&&t.blockId===change.blockId)).map(n=>n.reason);
         const revision=sectionSession.revisionDisplays?.[change.blockId]||(sectionSession.revisionInstructions?.[change.blockId]?{before:originalBlock.text,instruction:sectionSession.revisionInstructions[change.blockId]}:null);
         if(revision)notes.splice(0,notes.length,DraftedTailorChangePreview.describeRevision(revision.before,block.text,revision.instruction,block.type));
         const recommendation=DraftedTailorChangePreview.describe({before:originalBlock,after:block,request,data,notes,meaningfulTitle});
         const overview=add('div','',section);overview.className='tailor-recommendation';
         for(const [label,text]of [['Recommendation',recommendation.recommendation],['Why',recommendation.why]])if(text){const p=add('p','',overview);add('strong',label+': ',p);p.append(document.createTextNode(text));}
         if(revision){const updated=add('section','',section);updated.className='tailor-updated-suggestion';add('h4','Updated suggestion',updated);add('div',block.text,updated).className='tailor-updated-text';}
         const fields=[];
         for(const key of ['label','title','employer','startDate','endDate','degree','program','institution'])if((originalBlock?.[key]||'')!==(block[key]||''))fields.push({name:key,before:originalBlock?.[key],after:block[key]});
         DraftedTailorChangePreview.renderDetails(section,originalBlock?.text||'',block.text,fields);
       }
       if(data.sourcesSchemaVersion){
         const notes=[];
         for(const [index,q] of request.sourceContext.questions.entries()){
           const answer=request.sourceContext.answers.find(a=>a.questionId===q.id);if(!answer&&q.status!=='skipped')continue;
           if(answer&&data.sourceUsage.some(u=>u.answerId===answer.id))continue;
           const context=answer&&data.contextQuestions.find(c=>c.answerId===answer.id);
           const existing=answer&&q.status==='recorded'?data.sourceApplications.filter(g=>!data.sourceReview.some(r=>r.blockId===g.blockId)&&g.additions.some(a=>a.source.answerId===answer.id&&a.source.answerRevision===answer.revision)):[];
           const needsReview=answer&&q.status==='recorded'&&request.sourceContext.applications.some(g=>data.sourceReview.some(r=>r.blockId===g.blockId)&&g.additions.some(a=>a.source.answerId===answer.id));
           const reason=answer&&omittedContext.has(answer.id)?'Left out of this suggestion; your original answer is kept.':context?.reason==='context_unclear'?'The setting is unclear.':context?.reason==='new_block_required'?(answer?.experienceContext?.kind==='other'?'Context saved without a selected CV entry; not added to this CV.':'Needs a new CV entry; none was created.'):needsReview?'Earlier wording needs review before it can be updated.':existing.length?`Already in your CV in ${existing.map(g=>sectionName(data.blocks.find(b=>b.blockId===g.blockId))).join(', ')}; no new wording proposed.`:
             ({no:'You answered no; not used for new experience wording.',skipped:'Skipped; not used for new wording.',unknown:'The experience is still unclear.',needs_detail:'More detail is needed.',processing:'Still being checked.',answered:'Still being checked.',editing:'Being corrected.',error:'Could not be checked.'}[q.status]||'No new wording was proposed from this answer.');
           notes.push(`${answer?'Answer':'Question'} ${index+1}: ${reason}`);
         }
         if(notes.length){const section=add('section','',fullDetails);section.className='tailor-unused-answers';add('h3','Answers without new wording',section);const list=add('ul','',section);for(const note of notes)add('li',note,list);}
         for(const [index,answer] of request.sourceContext.answers.entries()){const section=add('section','',fullDetails),q=request.sourceContext.questions.find(q=>q.id===answer.questionId);add('h3',`Original answer ${index+1} · revision ${answer.revision}`,section);if(q)add('p',q.question,section);add('blockquote',answer.text,section);}
       }
       for(const review of data.sourceReview||[]){const box=add('section','',fullDetails);box.className='tailor-review-warning';const block=documentBlocksState.find(b=>b.blockId===review.blockId);add('h3','Earlier wording needs review',box);add('p',`${sectionName(block)}: left unchanged because the earlier wording or source could not be matched safely.`,box);for(const g of request.sourceContext.applications.filter(g=>g.blockId===review.blockId))for(const a of g.additions)add('blockquote',a.text,fullDetails);}
       for(const g of data.integrations||[]){const box=add('section','',fullDetails);add('h3','Integrated sources for '+sectionName(data.blocks.find(b=>b.blockId===g.blockId)),box);for(const seg of g.segments){add('p',seg.text,box);for(const v of seg.cvEvidence)add('blockquote',v.quote,box);for(const a of seg.answerSources){add('p','Original answer · revision '+a.answerRevision,box);add('blockquote',a.sourceQuote,box);}}}
       for(const edit of data.cvEdits||[]){const box=add('section','',fullDetails);add('h3',`Existing CV support for ${sectionName(data.blocks.find(b=>b.blockId===edit.blockId))}`,box);for(const source of edit.cvEvidence){add('p',sectionName(request.blocks.find(b=>b.blockId===source.blockId)),box);add('blockquote',source.quote,box);}}
       for(const usage of data.sourceUsage||[]){const box=add('section','',fullDetails);add('h3',`Source for ${sectionName(documentBlocksState.find(b=>b.blockId===usage.blockId))}`,box);add('p',`User answer · revision ${usage.answerRevision}`,box);add('blockquote',usage.sourceQuote,box);if(usage.contextQuote&&usage.contextQuote!==usage.sourceQuote){add('p','Context from your answer',box);add('blockquote',usage.contextQuote,box);}add('p','Proposed wording',box);add('blockquote',usage.proposedQuote,box);}
       if(fullDetails.childElementCount>1)body.append(fullDetails);
       const footer=add('footer','');footer.className='tailor-review-footer';
       const actions=add('div','',footer);actions.className='tailor-actions';
       const apply=add('button','Accept all remaining',actions);apply.type='button';apply.className='tailor-primary';
       const dismiss=add('button','Decline all remaining',actions);dismiss.type='button';
       const navigationNotice=add('p','',footer);navigationNotice.className='tailor-current-notice';navigationNotice.setAttribute('role','status');
       let stale=false,settled=false,removalObserver,reviewScroll=null;
       const checkCurrent=()=>{
         if(settled)return false;
         if(stale||stamp!==tailorContextStamp()||isPreviewingProposal){
           stale=true;apply.disabled=true;card.classList.add('is-stale');endPreview();
           navigationNotice.textContent='Your CV, job ad or answers changed. Dismiss this suggestion and tailor again.';
           return false;
         }return true;
       };
       const dispose=()=>{reviewScroll?.dispose();revisionAbort?.abort();settled=true;removalObserver?.disconnect();tailorReviewCheck=null;tailorReviewDispose=null;endPreview();jobAdInputEl?.removeEventListener('input',checkCurrent);targetRoleInput?.removeEventListener('input',checkCurrent);};
       tailorReviewDispose=dispose;
       tailorReviewCheck=()=>{if(!card.isConnected){dispose();return;}checkCurrent();};
       removalObserver=new MutationObserver(()=>{if(!card.isConnected)dispose();});removalObserver.observe(chatMessagesEl,{childList:true});
       jobAdInputEl?.addEventListener('input',checkCurrent);targetRoleInput?.addEventListener('input',checkCurrent);
       const nextReadingId=removed=>{const ids=[...body.querySelectorAll('[data-review-block-id]')].map(n=>n.dataset.reviewBlockId),last=Math.max(...removed.map(id=>ids.indexOf(id)));return ids.slice(last+1).find(id=>!removed.includes(id))||ids.slice(0,Math.max(0,last)).reverse().find(id=>!removed.includes(id))||null;};
       let deciding=false,revising=false,revisionAbort=null;
       function openSectionEdit(id){
         if(deciding||revising||!checkCurrent())return;
         const section=body.querySelector('[data-review-block-id="'+CSS.escape(id)+'"]');if(!section)return;
         section.querySelector('.tailor-section-edit')?.remove();
         const form=add('form','',section);form.className='tailor-section-edit';
         const label=add('label','What should change in this suggestion?',form),input=add('textarea','',label);input.maxLength=4000;input.rows=3;input.dataset.draftedSpelling='suggestion:'+request.cvVersionId+':'+id;
         input.value=sectionSession.editDrafts?.[id]||'';input.addEventListener('input',()=>{(sectionSession.editDrafts??={})[id]=input.value;});
         const notice=add('p','Describe the change. Your CV stays unchanged until you accept.',form);notice.setAttribute('role','status');
         const update=add('button','Update suggestion',form);update.type='submit';const cancel=add('button','Cancel',form);cancel.type='button';
         cancel.addEventListener('click',()=>{revisionAbort?.abort();revising=false;form.remove();});
         form.addEventListener('submit',async event=>{
           event.preventDefault();if(revising||!checkCurrent()||!input.value.trim())return;
           if(window.DraftedWorkspacePages?.sample&&window.__DRAFTED_COVERAGE__?.mode==='simulated'&&!window.__DRAFTED_REVISION_LIVE__){notice.textContent='Real AI revision is not enabled on this local server. Your instruction and suggestion are kept.';return;}
           const endpoint=draftedFeatures.tailorRevision;
           if(!endpoint){notice.textContent='Suggestion editing is available in local Dev; the live revision backend has not been published yet.';return;}
           revising=true;revisionAbort=new AbortController();const controller=revisionAbort;update.disabled=true;notice.textContent='Revising this suggestion…';
           try{
             const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schema:'1.0',request,candidate:data,blockId:id,instruction:input.value.trim()}),signal:controller.signal});
             const revised=await response.json();if(!response.ok||!revised.ok)throw Error('REVISION_FAILED');
             if(controller.signal.aborted||!form.isConnected||!checkCurrent())return;
             await DraftedTailorSources.validateCandidate(request,revised);
             for(const b of revised.blocks)if(b.blockId!==id&&DraftedCoverageContract.canonical(b)!==DraftedCoverageContract.canonical(data.blocks.find(old=>old.blockId===b.blockId)))throw Error('OUT_OF_SCOPE');
             const expected=await DraftedSectionReview.project(request,revised,sectionSession);
             if(!checkCurrent()||DraftedCoverageContract.canonical(expected.blocks)!==DraftedCoverageContract.canonical(documentBlocksState)||DraftedCoverageContract.canonical(expected.ledger)!==DraftedCoverageContract.canonical(DraftedSectionReview.ledger(tailorSourceLedger)))throw Error('STALE_REVISION');
             const noLongerNeeded=DraftedCoverageContract.canonical(revised.blocks.find(b=>b.blockId===id))===DraftedCoverageContract.canonical(request.blocks.find(b=>b.blockId===id));
             sectionSession.readingBlockId=noLongerNeeded?nextReadingId([id]):id;
             (sectionSession.revisionInstructions??={})[id]=input.value.trim();
             (sectionSession.revisionDisplays??={})[id]={before:data.blocks.find(b=>b.blockId===id).text,instruction:input.value.trim()};sectionSession.revealRevisionId=id;
             dispose();showTailorSuggestion(revised,stamp,request,omittedContext,sectionSession);
             document.dispatchEvent(new CustomEvent('drafted-review-action',{detail:{blockId:id,action:'edit'}}));
             if(noLongerNeeded){automaticSelectionPending=false;const notice=chatMessagesEl.querySelector('.tailor-suggestion .tailor-current-notice');if(notice)notice.textContent='The revised section matches your current CV, so this change is no longer needed.';else showTailorFeedback('The revised suggestion matches your current CV. No change is needed.');}
           }catch(error){if(!controller.signal.aborted)notice.textContent='Could not revise this suggestion. Your instruction and previous suggestion are kept. Try again.';}
           finally{if(revisionAbort===controller){revising=false;revisionAbort=null;}update.disabled=false;}
         });
         section.scrollIntoView({block:'nearest',behavior:'instant'});input.focus();
       }

       async function decideSections(ids,decision){
         if(deciding||revising||!checkCurrent())return;deciding=true;
         card.querySelectorAll('button').forEach(b=>b.disabled=true);
         try{
           const result=await DraftedSectionReview.decide({request,data,session:sectionSession,currentBlocks:deepClone(documentBlocksState),currentLedger:tailorSourceLedger,ids,decision});
           if(!checkCurrent())return;
           result.session.readingBlockId=nextReadingId(ids);
           dispose();card.remove();tailorReviewState=null;
           Object.assign(tailorSourceLedger,result.ledger);
           if(decision==='accept'){
             buildStateFromBlocks(result.blocks,{preserveCanonical:true});
             discoveryController?.adoptRepresentation(documentBlocksState,cvVersionId);
           }
           const remaining=DraftedSectionReview.changed(request,data).filter(id=>!result.session.decisions[id]);
           if(remaining.length)showTailorSuggestion(data,tailorContextStamp(),request,omittedContext,result.session);
           else{
             renderDocument(documentTextState);applySelectedBlocksUI();updateContextChip();
             tailorAppliedStamp=null;
             discoveryController?.showChat(true);refreshTailorPresentation();
             tailorCompletionContext={request:deepClone(request),data:deepClone(data),decisions:deepClone(result.session.decisions),phase:'ready-for-tailoring',preparedDemo:!!sectionSession.preparedDemo};
             if(draftedFeatures.cvSelection&&!window.DraftedWorkspacePages?.sample)cvSelectionUI?.prepare();else{tailorCompletionContext.phase='completed';finishTailoringMessage();}
           }
           for(const blockId of ids)document.dispatchEvent(new CustomEvent('drafted-review-action',{detail:{blockId,action:decision}}));
         }catch(error){
           navigationNotice.textContent='This section could not be applied safely. Your CV is unchanged.';
           card.querySelectorAll('button').forEach(b=>b.disabled=false);
         }finally{deciding=false;}
       }
       apply.addEventListener('click',()=>decideSections(changed,'accept'));
       dismiss.addEventListener('click',()=>{if(!checkCurrent()){dispose();card.remove();tailorReviewState=null;refreshTailorPresentation();return;}decideSections(changed,'decline');});
       chatMessagesEl.querySelectorAll('.tailor-followup').forEach(n=>n.remove());chatMessagesEl.append(card);revealEditorEvent(card);
       if(!sectionSession.showChangesInitialized){documentComparison?.edited({showChanges:true});sectionSession.showChangesInitialized=true;}else documentComparison?.edited();
       tailorCvPreview=DraftedTailorCvPreview.create({host:editorPreviewEl,candidate:previewData,baseline:previewBaseline,onDecision:(id,value)=>value==='edit'?openSectionEdit(id):decideSections([id],value),proposalId:card.dataset.proposalId,render:()=>renderDocument(documentTextState),isCurrent:checkCurrent,onClose:endPreview});
       tailorCvPreview.start();
       reviewScroll=DraftedReviewScroll.create({editor:body,preview:editorPreviewEl.closest('.cv-document'),host:editorPreviewEl,isActive:()=>!settled&&documentComparison?.mode()!=='original'&&document.documentElement.dataset.demoTourStart!=='true'});
       const revisionId=sectionSession.revealRevisionId;delete sectionSession.revealRevisionId;
       if(revisionId)requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
         if(settled||!body.isConnected)return;
         const updated=body.querySelector('[data-review-block-id="'+CSS.escape(revisionId)+'"] .tailor-updated-suggestion');
         if(updated){body.scrollTop+=(updated.getBoundingClientRect().top-body.getBoundingClientRect().top-10)/(body.getBoundingClientRect().height/body.offsetHeight||1);updated.classList.add('is-revision-highlight');setTimeout(()=>updated.classList.remove('is-revision-highlight'),2000);}
         Promise.resolve(DraftedCvLayout.ready(editorPreviewEl)).then(()=>{if(settled)return;const node=editorPreviewEl.querySelector('.cv-block[data-block-id="'+CSS.escape(revisionId)+'"]'),pane=editorPreviewEl.closest('.cv-document');if(node)pane.scrollTop+=node.getBoundingClientRect().top-pane.getBoundingClientRect().top-16;});
       })));
       const readingId=revisionId?null:sectionSession.readingBlockId;
       if(readingId)requestAnimationFrame(()=>{if(settled||!body.isConnected)return;const next=body.querySelector('[data-review-block-id="'+CSS.escape(readingId)+'"]');if(next){body.scrollTop+=next.getBoundingClientRect().top-body.getBoundingClientRect().top-3;reviewScroll.align(readingId,'editor');}});

     }

     let summaryTask=null;
     async function finishTailoringMessage(selection=cvSelectionState){
       if(tailorInFlight||tailorFinishing||cvSelectionUI?.isBusy()||cvSelectionUI?.hasPending()||tailorReviewState||!tailorCompletionContext||tailorCompletionContext.phase!=='completed')return;
       const context=tailorCompletionContext,stamp=tailorContextStamp();
       if(context.preparedDemo){showTailorFeedback('');const box=chatMessagesEl.querySelector('.tailor-feedback');box.classList.add('sample-workflow-complete');const heading=document.createElement('h2'),p=document.createElement('p'),link=document.createElement('a');heading.innerHTML='You’ve explored Drafted.<br><span>Now make it yours.</span>';p.textContent='Start with your own CV and a role you’re interested in.';link.href='/#section-input';link.className='discovery-primary';link.textContent='Use my own CV';box.replaceChildren(heading,p,link);chatMessagesEl.classList.add('is-sample-complete');chatMessagesEl.closest('.workspace-conversation-body')?.classList.add('is-sample-complete');document.getElementById('sample-chat-limit')?.remove();if(!context.endingShown&&!workspacePages?.restoring())box.classList.add('is-entering');context.endingShown=true;revealEditorEvent(box);tailorAppliedStamp=tailorContextStamp(discoveryController?.sourceContentRevision());return;}

       if(summaryTask?.context===context&&summaryTask.stamp===stamp)return;
       const task={context,stamp};summaryTask=task;
       let transition=null;
       if(!workspacePages?.restoring()&&!chatMessagesEl.querySelector('.tailor-completion')){
         transition=document.createElement('p');transition.className='tailor-summary-preparing';transition.setAttribute('role','status');transition.textContent='Preparing a summary of your choices…';chatMessagesEl.classList.add('is-summary-preparing');chatMessagesEl.prepend(transition);
         // A brief presentation transition, not simulated AI processing. Start
         // after a painted frame so the fast local path remains visible.
         await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
         await new Promise(resolve=>setTimeout(resolve,750));
       }
       if(summaryTask!==task||context!==tailorCompletionContext||stamp!==tailorContextStamp()){transition?.remove();if(summaryTask===task){summaryTask=null;chatMessagesEl.classList.remove('is-summary-preparing');}return;}
       const accepted=Object.values(context?.decisions||{}).some(v=>v==='accept');
       const ops=selection?.proposal?.operations||[],decisions=selection?.proposal?.decisions||{};
       const approved=ops.filter(o=>decisions[o.blockId]==='accept'),omitted=approved.some(o=>o.action==='omit'),shortened=approved.some(o=>o.action==='shorten');
       const role=context?.request?.jobContext?.roleTitle||context?.request?.targetRole||'';
       const acceptedUsage=(context.data?.sourceUsage||[]).filter(source=>context.decisions?.[source.blockId]==='accept');
       const acceptedBlocks=(context.data?.blocks||[]).filter(b=>context.decisions?.[b.blockId]==='accept');
       const compressed=shortened||acceptedBlocks.some(b=>b.text.length<(context.request.blocks.find(o=>o.blockId===b.blockId)?.text.length||0));
       const hasChanges=accepted||approved.length;
       const themes=[...new Set((context.request.jobContext?.keywords||[]).filter(k=>k.length>4&&acceptedBlocks.some(b=>b.text.toLowerCase().includes(k.toLowerCase()))))].slice(0,3);
       const focus=themes.join(', ');
       const title=hasChanges?'Your CV, refined'+(role?' for '+role:''):'Your original CV, retained';
       const intro=hasChanges?(focus?'The revised CV puts '+focus+' at the centre of the experience you chose to present.':'Your CV now reflects the changes you chose to keep, alongside the original experience you retained.'):'You chose to keep the original version. No proposed changes have been applied.';
       let what=hasChanges?(acceptedUsage.length?'The experience you shared is now part of the relevant roles, giving readers more detail about your contributions.':'The sections you accepted use the revised descriptions; the remaining experience stays as written.'):'The CV keeps its original wording, structure and emphasis.';
       if(compressed)what+=' Shorter descriptions reduce the amount a reader needs to work through.';
       if(omitted)what+=' Experience you chose to omit is left out of this version, with its source preserved.';
       if(approved.some(o=>o.action==='restore'))what+=' Experience you chose to restore is included again.';
       if(hasChanges&&Object.values(context.decisions||{}).includes('decline'))what+=' Where you declined a suggestion, the original wording remains.';
       let why=hasChanges?(focus?'For '+(role||'this role')+', the emphasis on '+focus+' helps a reader locate the relevant work and understand how it was carried out.':'The revised sections describe the work more directly, helping the reader assess your contributions against the role. Plan further changes only where you want to add detail.'):'The proposed emphasis was not adopted. You can continue refining the CV or ask about its fit for the role without changing the version you kept.';
       if(acceptedBlocks.some(b=>/product lead retained prioritisation and roadmap decisions/i.test(b.text)))why+=' Release coordination remains distinct from the Product Lead’s responsibility for priorities and the roadmap.';
       const text=[['What changed',what],['Why it matters for this role',why]];
       text.heading=title;text.intro=intro;
       transition?.remove();chatMessagesEl.classList.remove('is-summary-preparing');summaryTask=null;
       tailorAppliedStamp=tailorContextStamp(discoveryController?.sourceContentRevision());showTailorFeedback(text);tailorOverviewStamp=tailorContextStamp();
     }

     function showTailorFeedback(text,retry=false) {
       tailorOverviewStamp=null;
       document.querySelectorAll('.tailor-feedback').forEach(node=>node.remove());
       const feedback=document.createElement('div');feedback.className='tailor-feedback discovery-guidance';feedback.setAttribute('role','status');
       if(Array.isArray(text)){feedback.classList.add('tailor-completion');const heading=document.createElement('h2'),intro=document.createElement('p');heading.textContent=text.heading||'Your CV';intro.className='tailor-completion-intro';intro.textContent=text.intro||'';feedback.append(heading,intro);for(const [title,body]of text){const section=document.createElement('section'),heading=document.createElement('h3'),p=document.createElement('p');heading.textContent=title;p.textContent=body;section.append(heading,p);feedback.append(section);}}else{const message=document.createElement('p');message.textContent=text;feedback.append(message);}
       if(retry){const button=document.createElement('button');button.type='button';button.className='discovery-primary';button.textContent='Try tailoring again';button.addEventListener('click',()=>runTailor());feedback.append(button);}

       chatMessagesEl.querySelectorAll('.tailor-followup').forEach(n=>n.remove());
       chatMessagesEl.append(feedback);
       if(Array.isArray(text)&&!window.DraftedWorkspacePages?.sample){const follow=document.createElement('p');follow.className='tailor-followup';follow.textContent='Would you like to refine anything further, or ask a question about this CV? Select a section to focus your request, or use the whole CV.';feedback.after(follow);}
       if(window.DraftedWorkspacePages?.sample&&Array.isArray(text)){feedback.dataset.revealStart='true';document.getElementById('sample-chat-limit')?.remove();document.getElementById('sample-request-note')?.remove();}
       refreshTailorPresentation();revealEditorEvent(feedback);
     }

     async function fetchTailorSources(payload){
       const data=await DraftedTailorSourceClient.fetchSuggestion(N8N_TAILOR_URL,payload);
       assertDraftedCvResponse(DraftedTailorSources.withoutReceipt(data));return data;
     }

     function cvLanguageDecision(){return DraftedCvLanguage.resolve({explicitLanguage:cvLanguageConfirmed?documentLanguage:null,jobText:activeJobText,blocks:documentBlocksState||[]});}
     function needsWholeCvLanguage(decision){return !!decision.language&&decision.cvLanguage!==decision.language;}
     function createCvLanguageControl(){
       const decision=cvLanguageDecision(),area=document.createElement('div');area.className='tailor-language-control';const row=document.createElement('div');row.className='tailor-language-row';const label=document.createElement('span');label.textContent='CV language: '+(DraftedCvLanguage.names[decision.language]||'Needs clarification')+' · ';const change=document.createElement('button');change.type='button';change.className='tailor-language-change';change.textContent='Change';change.setAttribute('aria-label','Change CV language');change.onclick=()=>chooseCvLanguage(false,change);row.append(label,change);area.append(row);
       const note=document.createElement('p');note.className='tailor-language-note';if(needsWholeCvLanguage(decision)){note.textContent=decision.cvLanguage?'This suggestion will also translate your CV into '+DraftedCvLanguage.names[decision.language]+'.':'The entire suggestion will use '+DraftedCvLanguage.names[decision.language]+'.';area.append(note);}else if(!decision.language){note.textContent=decision.reason;area.append(note);}area.dataset.language=decision.language||'unclear';area.dataset.source=decision.source;return area;
     }
     async function chooseCvLanguage(required=false,opener=null){
       if(languagePromptPending)return false;languagePromptPending=true;const decision=cvLanguageDecision(),automatic=DraftedCvLanguage.resolve({jobText:activeJobText,blocks:documentBlocksState||[]});
       const dialog=document.createElement('dialog');dialog.className='workspace-job-dialog';dialog.setAttribute('aria-label','CV language');
       dialog.innerHTML='<h2>CV language</h2><p></p><label>Language <select aria-label="CV language"><option value="">Automatic</option><option value="sv">Svenska</option><option value="en">English</option></select></label><p class="tailor-language-dialog-note" role="status"></p><div><button type="button" data-cancel>Cancel</button><button type="button" data-save>Save language</button></div>';
       dialog.querySelector('p').textContent=required?(decision.reason+' Choose the language for your CV.'):'Choose a language, or follow the current job description automatically. Your experience answers do not control the CV language.';
       document.body.append(dialog);const select=dialog.querySelector('select'),go=dialog.querySelector('[data-save]');select.value=cvLanguageConfirmed?documentLanguage:'';if(required)go.textContent='Continue tailoring';const update=()=>{go.disabled=!select.value&&!automatic.language;const target=select.value||automatic.language,note=dialog.querySelector('.tailor-language-dialog-note');note.textContent=target&&decision.cvLanguage!==target?(decision.cvLanguage?'This suggestion will also translate your CV into '+DraftedCvLanguage.names[target]+'.':'The entire suggestion will use '+DraftedCvLanguage.names[target]+'.'):'';};update();select.onchange=update;let accepted=false;dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();go.onclick=()=>{if(!select.value&&!automatic.language)return;const before=JSON.stringify([cvLanguageConfirmed,documentLanguage,decision.language]);cvLanguageConfirmed=DraftedCvLanguage.supported(select.value);documentLanguage=cvLanguageConfirmed?select.value:automatic.language;accepted=true;if(before!==JSON.stringify([cvLanguageConfirmed,documentLanguage,cvLanguageDecision().language]))workspaceContextRevision++;refreshTailorPresentation();dialog.close();};
       const result=new Promise(resolve=>dialog.addEventListener('close',()=>{dialog.remove();languagePromptPending=false;refreshTailorPresentation();workspacePages?.schedule();const target=opener?.isConnected?opener:[...document.querySelectorAll('.tailor-language-change')].find(n=>n.getClientRects().length);target?.focus({preventScroll:true});resolve(accepted);},{once:true}));dialog.showModal();select.focus();return result;
     }
     async function runTailor() {
       const btn=document.getElementById('tailor-btn');
       if(!btn||tailorInFlight||isPreviewingProposal||tailorPresentationState()==='review'||tailorPresentationState()==='applied')return;
       const jobContext=window.__DRAFTED_JOBCONTEXT__;
       if(!jobContext||!documentBlocksState?.length)return;
       if(!cvLanguageDecision().language&&!await chooseCvLanguage(true))return;
       const languageDecision=cvLanguageDecision();if(!languageDecision.language)return;
       if(!['1.4','1.5'].includes(tailorSourcesVersion)&&needsWholeCvLanguage(languageDecision)){showTailorFeedback('Whole-document translation is available in simulated Dev. The real backend needs the prepared language-contract update before this request can run.',false);return;}
       // Lock is shared by the toolbar, guidance and finish actions.
       document.querySelectorAll('.tailor-feedback').forEach(node=>node.remove());
       tailorAppliedStamp=null;tailorCompletionContext=null;automaticSelectionPending=false;
       tailorInFlight=true;btn.disabled=true;
       let sourceRequest=tailorSourcesEnabled;
       try {
         discoveryController?.showChat();
         refreshTailorPresentation();
         // Finish can be clicked while the last answer is still interpreted.
         // Wait for existing requests; do not launch Tailor from a partial source set.
         const representationStamp=tailorContextStamp(null);
         await discoveryController?.waitForSources();
         const signalCatalog=['1.3','1.4','1.5'].includes(tailorSourcesVersion)?await coverageController?.model.waitForCatalog():null;
         if(representationStamp!==tailorContextStamp(null)||isPreviewingProposal){showTailorFeedback('Your CV or job ad changed. Prepare a new suggestion.',true);return;}
         for(const answer of currentTailorSourceContext()?.answers||[]){if(answer.experienceContext)continue;const inferred=DraftedExperienceContext.infer(answer.text,cvVersionId,documentBlocksState);if(inferred.status==='resolved')discoveryController.assignExperienceContext(answer.id,answer.revision,inferred.context,{origin:'answer'});}
         const stamp=tailorContextStamp();
         const payload={cvVersionId:cvVersionId||null,cvTitle:documentTitle||'',targetRole:targetRoleInput?.value?.trim()||'',
           language:languageDecision.language,blocksSchemaVersion:'1.0',blocks:deepClone(documentBlocksState),jobContextSchemaVersion:'1.0',jobContext:deepClone(jobContext)};
         const sourceContext=tailorSourcesEnabled?currentTailorSourceContext():null;
         sourceRequest=!!sourceContext;
         if(sourceContext?.answers.some(a=>a.experienceContext?.kind==='cv_entries')&&tailorSourcesVersion!=='1.5')throw Error('Multiple employment selections require Tailor profile 1.5. Use simulated Dev until the backend update is published.');
         if(sourceContext){payload.sourcesSchemaVersion=tailorSourcesVersion;if(!['1.3','1.4','1.5'].includes(payload.sourcesSchemaVersion)&&tailorSourceLedger.integrations?.length)throw Error('This workspace requires integration profile 1.3.');payload.sourceContext=sourceContext;if(['1.3','1.4','1.5'].includes(payload.sourcesSchemaVersion)){payload.jobText=activeJobText;payload.signalCatalog=deepClone(signalCatalog);payload.integrationApplications=deepClone(tailorSourceLedger.integrations||[]);if(!payload.signalCatalog)throw Error('A verified signal catalog is required before integrating sources.');if(['1.4','1.5'].includes(payload.sourcesSchemaVersion)){payload.languagePlan={policyVersion:'1.0',explicitLanguage:cvLanguageConfirmed?documentLanguage:null,source:languageDecision.source,cvLanguage:languageDecision.cvLanguage};payload.languageApplications=deepClone(tailorSourceLedger.languageApplications||[]);}payload.inputRef=await DraftedTailorSources.inputRef(payload);}}
         const data=sourceContext?await fetchTailorSources(payload):await draftedFetchJson(N8N_TAILOR_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)},'cv');
         if(stamp!==tailorContextStamp()||isPreviewingProposal){showTailorFeedback('Your CV, job ad or answers changed. Prepare a new suggestion.',true);return;}
         // Existing Tailor permits text changes only. Fail closed on structural drift.
         const metadata=b=>JSON.stringify(Object.fromEntries(Object.entries(b).filter(([key])=>key!=='text').sort(([a],[b])=>a.localeCompare(b))));
         if(!['1.4','1.5'].includes(data.sourcesSchemaVersion)&&(data.blocks.length!==payload.blocks.length||data.blocks.some(b=>{const old=payload.blocks.find(o=>o.blockId===b.blockId);return !old||metadata(old)!==metadata(b);})))throw Error('Tailor changed block structure');
         showTailorSuggestion(data,stamp,payload);
       }catch(err){
         // Log transport metadata only: no CV, answer text, arbitrary server message or response body.
         const endpoint=new URL(N8N_TAILOR_URL,location.href);
         console.error('Tailoring failed',{endpoint:endpoint.origin+endpoint.pathname,code:err instanceof DraftedTailorSourceClient.Failure?err.code:'TAILOR_FAILED',status:err instanceof DraftedTailorSourceClient.Failure?err.status:null,backendCode:err instanceof DraftedTailorSourceClient.Failure?err.backendCode:null});
         showTailorFeedback(err?.message==='SIGNAL_CATALOG_UNAVAILABLE'?'Job signals are not ready. Open Job signals to review or retry their preparation; your CV and answers are kept.':err?.message==='STALE_SIGNAL_CONTEXT'?'Your job context changed. Prepare a new suggestion.':sourceRequest?DraftedTailorSourceClient.message(err):'Tailoring failed. Try again.',true);
       }
       finally{tailorInFlight=false;btn.disabled=false;refreshTailorPresentation();if(automaticSelectionPending){automaticSelectionPending=false;if(draftedFeatures.cvSelection&&!window.DraftedWorkspacePages?.sample)cvSelectionUI?.prepare();else{tailorCompletionContext.phase='completed';finishTailoringMessage();}}}
     }

     function setTailorHidden() {
      const card = document.getElementById("tailor-card");
      const content = document.getElementById("tailor-content");
      const minibar = document.getElementById("tailor-minibar");
      const btn = document.getElementById("tailor-btn");
    
      if (card) {card.hidden=true;card.classList.remove("is-visible");}
      if (content) content.classList.remove("is-ready");
      if (minibar) minibar.classList.remove("is-minimized");
    
      // reset button so it works next time
      if (btn) btn.disabled = tailorInFlight||tailorFinishing;
    }
    
    function setTailorReady() {
      const card = document.getElementById("tailor-card");
      const content = document.getElementById("tailor-content");
      const minibar = document.getElementById("tailor-minibar");
      const btn = document.getElementById("tailor-btn");
    
      if (card) {card.hidden=false;card.classList.add("is-visible");}
      if (content) content.classList.add("is-ready");
      if (minibar) minibar.classList.remove("is-minimized");
    
      // ensure CTA is clickable when we re-enter ready state
      if (btn) btn.disabled = tailorInFlight||tailorFinishing;
    }
  function maybeShowTailor() {
    syncWorkspaceJobContext();
    if(!window.DraftedWorkspacePages?.sample&&!workspacePages?.restoring())coverageController?.sync();
    if(!window.DraftedWorkspacePages?.sample&&!workspacePages?.restoring())discoveryController?.sync();
    const hasJobContext =
      !!(window.__DRAFTED_JOBCONTEXT__ &&
        typeof window.__DRAFTED_JOBCONTEXT__ === "object" &&
        !Array.isArray(window.__DRAFTED_JOBCONTEXT__));

    const hasBlocks =
      !!(Array.isArray(documentBlocksState) && documentBlocksState.length);

    if (hasJobContext && hasBlocks) {
      refreshTailorPresentation();
    } else {
      setTailorHidden();
    }
  }

  (function bindTailorButtonOnce() {
    const btn = document.getElementById("tailor-btn");
    if (!btn) return;
    if (btn.dataset.draftedTailorBound === "1") return;
    btn.dataset.draftedTailorBound = "1";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (btn.disabled) return;
    
      const minibar = document.getElementById("tailor-minibar");
      if (minibar && minibar.classList.contains("is-minimized")) {
        return;
      }
    
      await runTailor();
    });
  })();

  if (
    jobAdInputEl &&
    jobContextStatusEl &&
    jobContextStatusIconEl &&
    jobContextStatusTextEl
  ) {
    if (jobAdInputEl.dataset.jobContextBound !== "1") {
      jobAdInputEl.dataset.jobContextBound = "1";
      jobAdInputEl.addEventListener('input',()=>{
        if(!documentBlocksState?.length){activeJobText=jobAdInputEl.value;handleJobAdInput();}
      });
    }
  } else {
    jobContextDebugLog("disabled: missing jobcontext DOM elements");
  }
  
  

function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

function setupFilePicker() {
  const fileInput = getFileInput();
  const fileName = getFileNameEl();
  const previewFrame = getPreviewFrame();
  const previewWrap = getPreviewWrap();

  if (!fileInput) {
    console.warn("setupFilePicker: #cv-file not found");
    return;
  }

  if (fileInput.dataset.bound === "1") return;
  fileInput.dataset.bound = "1";
  const originalPreview = DraftedUploadedPdf.create({frame:previewFrame,wrap:previewWrap});

  fileInput.addEventListener("change", () => {
    if(!workspacePages)discoveryController?.invalidate();
    const file = fileInput.files?.[0] || null;

    if (fileName) fileName.textContent = file ? file.name : "No file selected";
    void originalPreview.setFile(file);
  });
}



  
  /* ===============================
     HELPERS
     =============================== */
  function sanitizeLeadingGarbage(str) {
    return String(str || "")
      .replace(/^\uFEFF/, "")
      .replace(/^=+/, "");
  }

  
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  
  function clearNativeSelection() {
    try { window.getSelection().removeAllRanges(); } catch (e) {}
  }

  
  function setBusy(isBusy) {
  const busy = !!isBusy;

  editorApplyBtn.disabled = busy;
  if (editorChatBtn) editorChatBtn.disabled = busy;

  if (editorInput) {
    editorInput.disabled = busy;
    editorInput.setAttribute("aria-disabled", busy ? "true" : "false");

    // Placeholder swap (keep it clean)
    if (!editorInput.dataset.placeholderDefault) {
      editorInput.dataset.placeholderDefault = editorInput.getAttribute("placeholder") || "Describe the change…";
    }
    editorInput.setAttribute("placeholder", busy ? "Working on your draft…" : editorInput.dataset.placeholderDefault);

    if (busy && document.activeElement === editorInput) editorInput.blur();
  }

  forceButtonsActiveLook();
}

/* ===============================
   DRAFTED CONTRACT: fetch + assert
   =============================== */

class DraftedContractError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "DraftedContractError";
    this.code = code;
    this.details = details || null;
  }
}

function isPlainObject(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function requireBoolean(x, path) {
  if (typeof x !== "boolean") throw new DraftedContractError("CONTRACT_INVALID_TYPE", `${path} must be boolean`, { path, got: typeof x });
}
function requireString(x, path) {
  if (typeof x !== "string") throw new DraftedContractError("CONTRACT_INVALID_TYPE", `${path} must be string`, { path, got: typeof x });
}
function requireNumber(x, path) {
  if (typeof x !== "number" || Number.isNaN(x)) throw new DraftedContractError("CONTRACT_INVALID_TYPE", `${path} must be number`, { path, got: x });
}
function requireArray(x, path) {
  if (!Array.isArray(x)) throw new DraftedContractError("CONTRACT_INVALID_TYPE", `${path} must be array`, { path, got: typeof x });
}

function assertNoUnexpectedFields(obj, allowedKeys, label) {
  const keys = Object.keys(obj);
  for (const k of keys) {
    if (!allowedKeys.includes(k)) {
      throw new DraftedContractError(
        "CONTRACT_UNEXPECTED_FIELD",
        `${label}: unexpected field '${k}'`,
        { unexpectedField: k, allowedKeys }
      );
    }
  }
}

/**
 * Strict validation of upload/editor-rewrite response contract v1.0
 * Returns a normalized, safe object you can trust.
 */
function assertDraftedCvResponse(data) {
  if (!isPlainObject(data)) throw new DraftedContractError("CONTRACT_NOT_OBJECT", "Response JSON must be an object");

  // Allowed top-level keys for CV responses (success or failure)
  // Keep this strict. If backend adds fields later, you will notice immediately.
  const allowed = [
    "ok",
    "blocksSchemaVersion",
    "cvVersionId",
    "cvTitle",
    "summaryOfChanges",
    "blocks",
    "rewrittenCv",
    "rewrittenCvLegacy",
    "contractError",
  ];
  assertNoUnexpectedFields(data, allowed, "CV response");

  requireBoolean(data.ok, "ok");
  requireString(data.blocksSchemaVersion, "blocksSchemaVersion");
  if (data.blocksSchemaVersion !== "1.0") {
    throw new DraftedContractError("CONTRACT_UNSUPPORTED_SCHEMA", "Unsupported blocksSchemaVersion", { got: data.blocksSchemaVersion });
  }

  // blocks must always exist as array per contract doc (empty allowed only on ok=false)
  requireArray(data.blocks, "blocks");

  if (data.ok === true) {
    // contractError must NOT be present when ok=true
    if ("contractError" in data) {
      throw new DraftedContractError("CONTRACT_ERROR_FIELD_ON_SUCCESS", "contractError must not be present when ok=true");
    }

    // Required fields on success
    // cvVersionId must be present and non-empty string (or if you allow null on success, decide now. Contract says must be present when ok=true.)
    if (data.cvVersionId == null || typeof data.cvVersionId !== "string" || data.cvVersionId.trim() === "") {
      throw new DraftedContractError("CONTRACT_MISSING_FIELD", "cvVersionId must be a non-empty string when ok=true");
    }

    // These can be empty strings but must exist
    requireString(data.cvTitle, "cvTitle");
    requireString(data.summaryOfChanges, "summaryOfChanges");
    requireString(data.rewrittenCv, "rewrittenCv");
    requireString(data.rewrittenCvLegacy, "rewrittenCvLegacy");

    if (data.blocks.length <= 0) {
      throw new DraftedContractError("CONTRACT_EMPTY_BLOCKS", "blocks must be non-empty when ok=true");
    }

    // Validate each block base shape (typed fields validated lightly, but base is hard)
    for (let i = 0; i < data.blocks.length; i++) {
      const b = data.blocks[i];
      const p = `blocks[${i}]`;
      if (!isPlainObject(b)) throw new DraftedContractError("CONTRACT_INVALID_BLOCK", `${p} must be object`);

      // Base required
      requireString(b.blockId, `${p}.blockId`);
      if (!b.blockId.trim()) throw new DraftedContractError("CONTRACT_INVALID_BLOCK", `${p}.blockId must be non-empty`);
      requireString(b.type, `${p}.type`);
      if (!b.type.trim()) throw new DraftedContractError("CONTRACT_INVALID_BLOCK", `${p}.type must be non-empty`);
      requireString(b.label, `${p}.label`);
      requireNumber(b.order, `${p}.order`);
      requireString(b.text, `${p}.text`);

      // Typed extensions: only enforce when type matches, otherwise allow unknown types (forward compatible)
      if (b.type === "experience") {
        requireString(b.employer, `${p}.employer`);
        requireString(b.title, `${p}.title`);
        requireString(b.startDate, `${p}.startDate`);
        requireString(b.endDate, `${p}.endDate`);
      } else if (b.type === "education") {
        requireString(b.institution, `${p}.institution`);
        requireString(b.degree, `${p}.degree`);
        requireString(b.program, `${p}.program`);
        requireString(b.startDate, `${p}.startDate`);
        requireString(b.endDate, `${p}.endDate`);
      }
    }

    // Minimal normalization (allowed): ensure strings exist (already required), trim nothing to avoid hidden mutation.
    return {
      ok: true,
      blocksSchemaVersion: "1.0",
      cvVersionId: data.cvVersionId,
      cvTitle: data.cvTitle ?? "",
      summaryOfChanges: data.summaryOfChanges ?? "",
      blocks: data.blocks,
      rewrittenCv: data.rewrittenCv ?? "",
      rewrittenCvLegacy: data.rewrittenCvLegacy ?? data.rewrittenCv ?? "",
    };
  }

  // ok === false
  // contractError must exist (can be object|string|null per contract)
  if (!("contractError" in data)) {
    throw new DraftedContractError("CONTRACT_MISSING_FIELD", "contractError must be present when ok=false");
  }

  // cvVersionId may be null on hard failures, but field should exist in your contract doc.
  // If you want it always present, enforce it here. Your contract doc says it exists top-level always. :contentReference[oaicite:9]{index=9}
  if (!("cvVersionId" in data)) {
    throw new DraftedContractError("CONTRACT_MISSING_FIELD", "cvVersionId must be present (can be null) when ok=false");
  }

  return {
    ok: false,
    blocksSchemaVersion: "1.0",
    cvVersionId: (typeof data.cvVersionId === "string" ? data.cvVersionId : null),
    contractError: data.contractError,
    blocks: data.blocks,
  };
}

/**
 * Strict validation of chat response (flow-editor-chat).
 * Chat is advisory: no blocks here. :contentReference[oaicite:10]{index=10}
 */
function assertDraftedChatResponse(data) {
  if (!isPlainObject(data)) {
    throw new DraftedContractError("CONTRACT_NOT_OBJECT", "Response JSON must be an object");
  }

  const allowed = [
    "ok",
    "message",
    "intent",
    "proposal",
    "suggestion",
    "changedBlockIds",
    "selectionRequest",
    "contractError",
  ];
  assertNoUnexpectedFields(data, allowed, "Chat response");

  requireBoolean(data.ok, "ok");

  if ("intent" in data && data.intent != null) {
    requireString(data.intent, "intent");
  }

  if ("changedBlockIds" in data && data.changedBlockIds != null) {
    requireArray(data.changedBlockIds, "changedBlockIds");
    for (let i = 0; i < data.changedBlockIds.length; i++) {
      requireString(data.changedBlockIds[i], `changedBlockIds[${i}]`);
    }
  }

  if ("proposal" in data && data.proposal != null && !isPlainObject(data.proposal)) {
    throw new DraftedContractError("CONTRACT_INVALID_TYPE", "proposal must be object|null");
  }

  if ("suggestion" in data && data.suggestion != null && !isPlainObject(data.suggestion)) {
    throw new DraftedContractError("CONTRACT_INVALID_TYPE", "suggestion must be object|null");
  }

  if (data.ok === true) {
    if ("contractError" in data) {
      throw new DraftedContractError(
        "CONTRACT_ERROR_FIELD_ON_SUCCESS",
        "contractError must not be present when ok=true"
      );
    }
    requireString(data.message, "message");
    if(data.selectionRequest!=null){const r=data.selectionRequest;if(!isPlainObject(r)||Object.keys(r).some(k=>!['id','kind'].includes(k))||r.kind!=='cv_selection'||typeof r.id!=='string'||!r.id.trim()||r.id.length>128)throw new DraftedContractError('CONTRACT_INVALID_TYPE','Invalid selection request');if(data.suggestion||data.proposal)throw new DraftedContractError('CONTRACT_INVALID_TYPE','A suggestion cannot also request selection');}


    return {
      ok: true,
      message: data.message,
      intent: data.intent,
      proposal: data.proposal ?? null,
      suggestion: data.suggestion ?? null,
      changedBlockIds: data.changedBlockIds ?? [],
      selectionRequest: data.selectionRequest ?? null,
    };
  }

  if (!("contractError" in data)) {
    throw new DraftedContractError(
      "CONTRACT_MISSING_FIELD",
      "contractError must be present when ok=false"
    );
  }

  return {
    ok: false,
    contractError: data.contractError,
    intent: data.intent,
  };
}



/**
 * One single entrypoint you asked for.
 * kind must be: "cv" | "chat"
 */
function assertDraftedResponse(data, kind) {
  if (kind === "cv") return assertDraftedCvResponse(data);
  if (kind === "chat") return assertDraftedChatResponse(data);
  throw new DraftedContractError("CONTRACT_INTERNAL", "Unknown assert kind", { kind });
}

/**
 * Single fetch wrapper used everywhere.
 * Reads body ONCE, parses JSON, asserts contract, throws loud on violations.
 */
async function draftedFetchJson(url, options, kind) {
  const contextStamp=editorContextStamp();
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    throw new DraftedContractError(
      "HTTP_FETCH_FAILED",
      "Network error while calling server",
      { url, message: String(e && e.message ? e.message : e) }
    );
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const raw = await res.text(); // READ ONCE

  if (!raw || raw.trim() === "") {
    throw new DraftedContractError(
      "HTTP_EMPTY_BODY",
      "Server returned empty body",
      { url, status: res.status, statusText: res.statusText, contentType }
    );
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new DraftedContractError(
      "HTTP_INVALID_JSON",
      "Server returned non-JSON or invalid JSON",
      { url, status: res.status, statusText: res.statusText, contentType, sample: raw.slice(0, 240) }
    );
  }

  if(url!==N8N_UPLOAD_URL&&contextStamp!==editorContextStamp())throw new DraftedContractError('STALE_EDITOR_CONTEXT','Your CV or job description changed. Request a new suggestion.');
  const asserted = assertDraftedResponse(json, kind);

  if (asserted.ok === false) {
    throw new DraftedContractError(
      "BACKEND_OK_FALSE",
      "Backend returned ok=false",
      { url, status: res.status, contractError: asserted.contractError }
    );
  }

  return asserted;
}


  // --- Defense-in-depth sanitation for leaked fields ---
  const FORBIDDEN_PREFIX_RE = /^(employer|title|startDate|endDate|degree|program|institution|order|type|label|blockId)\s*:\s*/i;

  
  function stripLeakedFields(text) {
    const t = String(text || "");
    if (!t.trim()) return "";
    const lines = t.split(/\r?\n/);
    const kept = [];
    for (const line of lines) {
      const l = line.trim();
      if (!l) { kept.push(""); continue; }
      if (FORBIDDEN_PREFIX_RE.test(l)) continue;
      kept.push(line);
    }
    return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function normLite(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").replace(/[—–]/g, "-").trim();
  }

  function stripFirstLineIfDuplicate(text, a, b, startDate, endDate) {
    let cleaned = stripLeakedFields(text);
    if (!cleaned) return "";
    const lines = cleaned.split(/\r?\n/);
    if (!lines.length) return cleaned;

    const firstRaw = (lines[0] || "").trim().replace(/^[-•\u2022]+\s*/, "");
    const first = normLite(firstRaw);
    const period = String(`${startDate || ""}${(startDate || endDate) ? " – " : ""}${endDate || ""}`).trim();
    const needles = [a, b, period].map(normLite).filter(Boolean);
    const hit = needles.some(n => n && first.includes(n));
    if (hit) return lines.slice(1).join("\n").replace(/\n{3,}/g, "\n\n").trim();

    return cleaned;
  }

  
  function revealEditorEvent(node){
    if(!node||workspacePages?.restoring())return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!node.isConnected||!chatMessagesEl.contains(node)||workspacePages?.restoring())return;
      const pane=chatMessagesEl,r=node.getBoundingClientRect(),bounds=pane.getBoundingClientRect();
      if(node.dataset.revealStart==='true'||r.height>pane.clientHeight-16){pane.scrollTop+=r.top-bounds.top;node.querySelector('.tailor-review-body')?.scrollTo({top:0});}
      else pane.scrollTop=pane.scrollHeight;
    }));
  }
  function appendChat(role, text, association = null) {
  const msg = String(text || "").trim();
  if (!msg) return;

  chatHistory.push({ role: role === "user" ? "user" : "assistant", content: msg, ...(association?{association}: {}) });
  if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

  // UI
  if (!chatMessagesEl) return;

  const wrap = document.createElement("div");
  const normalizedRole =
    role === "user" ? "user" :
    role === "system" ? "system" :
    "ai";

  wrap.className = `chat-message ${normalizedRole}`;
  if(association)wrap.dataset.proposalAssociation=association;

  // IMPORTANT: left aligned readability while keeping user bubble on right via CSS
  wrap.style.textAlign = "left";

  // Use textContent to avoid injection
  wrap.textContent = msg;

  chatMessagesEl.appendChild(wrap);
  revealEditorEvent(wrap);
}


function activateFullContext(){
  if(!canUseFullCvContext())return;
  clearBlockSelection('full');
  let status=document.getElementById('full-context-feedback');if(!status){status=document.createElement('p');status.id='full-context-feedback';status.className='selection-send-hint';status.setAttribute('role','status');document.querySelector('.workspace-composer').append(status);}
  status.textContent='Full CV selected as context.';status.hidden=false;clearTimeout(activateFullContext.timer);activateFullContext.timer=setTimeout(()=>{status.hidden=true;},2000);
}
function positionContextHint(){
  let hint=document.getElementById('selection-send-hint');if(!hint){hint=document.createElement('p');hint.id='selection-send-hint';hint.className='selection-send-hint';hint.setAttribute('role','status');}
  contextChipEl.querySelector('.chip-label')?.append(hint);updateChatSendState();
}

function applyFullScopeUI(isFull) {
  if (!editorPaper) return;
  editorPaper.classList.toggle("is-scope-full", !!isFull);
}


  
    /* ===============================
   PROPOSAL CARD UI (WITH LOADING)
   =============================== */
let isGeneratingSuggestionPreview = false; 

  
function appendAppliedReceipt(receipt){
  const card=document.createElement('section');card.className='chat-message ai drafted-proposal-card is-completed suggestion-receipt';card.dataset.receiptId=receipt.id;card.setAttribute('aria-label','Accepted and applied');
  const heading=document.createElement('strong');heading.textContent='✓ Accepted and applied · '+receipt.sections.join(' · ');
  const description=document.createElement('p');description.textContent=receipt.description;
  const details=document.createElement('details'),toggle=document.createElement('summary');toggle.textContent='View change';details.append(toggle);
  for(const block of receipt.changes){const text=document.createElement('div');text.className='suggestion-text';text.textContent=block.text;details.append(text);}
  card.append(heading,description,details);chatMessagesEl.append(card);return card;
}

function appendProposalCard(meta) {
  if(!chatMessagesEl)return;
  const ready=!!pendingProposal?.blocks?.length;
  if(!ready){if(isGeneratingSuggestionPreview){const status=document.createElement('div');status.className='chat-message ai drafted-proposal-card';status.setAttribute('role','status');status.textContent='Preparing suggestion…';chatMessagesEl.append(status);}return;}
  const candidate=deepClone(pendingProposal),stamp=meta?.baseline;
  if(meta?.association){for(const node of chatMessagesEl.querySelectorAll('[data-proposal-association]'))if(node.dataset.proposalAssociation===meta.association)node.remove();chatHistory=chatHistory.filter(m=>m.association!==meta.association);}
  const changed=candidate.blocks.filter(b=>documentBlocksState.find(old=>old.blockId===b.blockId)?.text!==b.text);
  const card=document.createElement('section');card.className='chat-message ai drafted-proposal-card';card.setAttribute('aria-label','Suggestion');
  const header=document.createElement('header'),title=document.createElement('strong'),tag=document.createElement('span');title.textContent='Suggestion';tag.className='suggestion-section';tag.textContent=[...new Set(changed.map(b=>b.label||b.type))].join(' · ');header.append(title,tag);card.append(header);
  for(const block of changed){const text=document.createElement('div');text.className='suggestion-text';text.textContent=block.text;card.append(text);}
  const actions=document.createElement('div');actions.className='suggestion-actions';
  const current=()=>chatBaseline()===stamp&&pendingProposal?.blocks&&JSON.stringify(pendingProposal.blocks)===JSON.stringify(candidate.blocks);
  const stopPreview=()=>{if(tailorCvPreview){const view=tailorCvPreview;tailorCvPreview=null;view.dispose();}};
  const finish=status=>{card.classList.add('is-completed');actions.replaceChildren();const note=document.createElement('span');note.setAttribute('role','status');note.textContent=status;actions.append(note);};
  for(const name of ['Preview','Decline','Accept']){const button=document.createElement('button');button.type='button';button.textContent=name;button.className=name==='Accept'?'suggestion-accept':'';button.addEventListener('click',()=>{
    if(name==='Decline'){stopPreview();dismissProposal();finish('Declined');chatMessagesEl.append(card);return;}
    if(!current()){stopPreview();const note=document.createElement('p');note.setAttribute('role','status');note.textContent='This suggestion is out of date. Send your request again.';actions.replaceChildren(note);return;}
    if(name==='Accept'){
      stopPreview();const previousVersion=cvVersionId;
      if(applyProposal()!==true)return;
      const receipt={id:meta?.association||crypto.randomUUID(),previousVersion,appliedVersion:cvVersionId,appliedAt:new Date().toISOString(),sections:[...new Set(changed.map(b=>b.label||b.type))],changes:deepClone(changed),description:'Applied the reviewed changes.'};
      appliedChatReceipts.push(receipt);card.remove();appendAppliedReceipt(receipt);chatHistory.push({role:'assistant',content:'Accepted and applied · '+receipt.sections.join(' · '),association:receipt.id});workspacePages?.schedule();return;
    }
    stopPreview();tailorCvPreview=DraftedTailorCvPreview.create({host:editorPreviewEl,candidate,baseline:{blocks:deepClone(documentBlocksState)},proposalId:crypto.randomUUID(),render:()=>renderDocument(documentTextState),isCurrent:current,onClose:stopPreview});tailorCvPreview.navigate(changed[0]?.blockId);
    if(matchMedia('(max-width:800px)').matches)DraftedCvLayout.ready(editorPreviewEl).then(()=>document.querySelector('.workspace-expand-preview')?.click());
  });actions.append(button);}
  card.append(actions);chatMessagesEl.append(card);chatMessagesEl.scrollTop=chatMessagesEl.scrollHeight;
}


  function clearAllProposalCards() {
  if (!chatMessagesEl) return;
  chatMessagesEl.querySelectorAll(".drafted-proposal-card:not(.is-completed)").forEach(el => el.remove());
}

  
function setApplyLabel() {
  if (!editorApplyBtn) return;

  if (pendingProposal && Array.isArray(pendingProposal.blocks) && pendingProposal.blocks.length) {
    editorApplyBtn.textContent = isPreviewingProposal ? "Apply (keep previewed changes)" : "Apply suggested changes";
    return;
  }

  if (pendingSuggestion && pendingSuggestion.instruction) {
    editorApplyBtn.textContent = "Apply suggested changes";
    return;
  }

  editorApplyBtn.textContent = "Apply";
}


  
  /* ===============================
     STATE
     =============================== */
  let documentTextState = "";
  let documentBlocksState = null;
  let blockRangesById = {}; 
  let documentTitle = "";
  // Presentation only: never part of CV/proposal snapshots or discovery context.
  let selectedCvDesign = 'classic_v1';
  let portraitController = null;
  let previewView = null;
  let previewZoom = null;
  let browserPrint = null;
  let tailorCvPreview = null;
  let documentComparison = null;
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='p'){
    if(tailorCvPreview?.suggested()||cvSelectionUI?.hasPending())event.preventDefault();
    else if(documentComparison?.model()){event.preventDefault();document.querySelector('.workspace-print-button')?.click();}
  }},true);
  let cvVersionId = null;
  let selectedBlockId = null;          // last clicked block (compat)
  let selectedBlockIds = new Set();  
  let selectionSources = {};
  let activeSelectionRequest = null;
  let lastClickedBlockId = null;       // shift anchor
  let chatHistory = [];        // { role: "user"|"assistant", content: string }
  let appliedChatReceipts = [];
  let pendingProposal = null;      // { cvVersionId, cvTitle, blocks, summaryOfChanges? }
  let pendingProposalMeta = null;  // { changedBlockIds: [], summaryOfChanges: [] }
  let pendingSuggestion = null;    // { mode:"blocks|full", selectedBlockIds:[], instruction:"..." }
  let isPreviewingProposal = false;
  let previewSnapshot = null;

  // Enhance the existing editor DOM; preserve its controls and event bindings.
  (function mountWorkspaceChrome() {
    const section=chatMessagesEl?.closest('.section-editor'),container=section?.querySelector('.editor-container');
    if(!container||container.querySelector('.workspace-topbar'))return;
    const topbar=document.createElement('header');topbar.className='workspace-topbar';
    const identity=document.createElement('div');identity.className='workspace-identity';
    const brand=document.createElement('span');brand.className='workspace-brand';brand.textContent='Drafted';
    const title=document.createElement('span');title.className='workspace-document-title';title.textContent='Untitled CV';
    identity.append(brand,title);topbar.append(identity);
    const actions=document.createElement('div');actions.className='workspace-main-actions';topbar.append(actions);
    // Retire legacy server-export controls; the one export action uses browser print.
    section.querySelector('.cv-tools')?.remove();
    container.prepend(topbar);
    const jobRow=document.createElement('div');jobRow.className='workspace-job-context';jobRow.hidden=true;
    const jobLabel=document.createElement('span');jobLabel.className='workspace-job-label';jobLabel.textContent='Job context';
    const jobRole=document.createElement('span');jobRole.className='workspace-job-role';
    jobRow.append(jobLabel,jobRole);
    if(!window.DraftedWorkspacePages?.enabled){
      const jobDetails=document.createElement('details');jobDetails.className='workspace-job-details';
      const jobSummary=document.createElement('summary');jobSummary.textContent='View job description';
      const jobText=document.createElement('div');jobText.className='workspace-job-text';
      jobDetails.append(jobSummary,jobText);jobRow.append(jobDetails);
    }
    if(!window.DraftedWorkspacePages?.enabled)topbar.after(jobRow);
    const composer=document.createElement('div');composer.className='workspace-composer';
    const inputRow=section.querySelector('.chat-input-row'),scopeRow=section.querySelector('.context-chip-row');
    if(inputRow){inputRow.before(composer);if(scopeRow)composer.append(scopeRow);composer.append(inputRow);}
    const inputHelp=document.createElement('p');inputHelp.className='workspace-input-help';inputHelp.id='workspace-input-help';
    editorApplyBtn.hidden=true;editorApplyBtn.setAttribute('aria-hidden','true');
    const selectionHint=document.createElement('p');selectionHint.id='selection-send-hint';selectionHint.className='selection-send-hint';selectionHint.setAttribute('role','status');selectionHint.hidden=true;inputRow.before(selectionHint);
    editorInput.placeholder='Ask a question or describe a change…';editorInput.dataset.placeholderDefault=editorInput.placeholder;
    editorInput?.setAttribute('aria-describedby',inputHelp.id);
    const heading=section.querySelector('.chat-title');if(heading)heading.textContent='Editor';
    const previewTitle=document.createElement('div');previewTitle.className='workspace-preview-title';
    const previewLabel=document.createElement('h2');previewLabel.id='cv-preview-heading';previewLabel.className='workspace-preview-label';previewLabel.textContent='CV preview';
    const pageCount=document.createElement('span');pageCount.className='workspace-page-count';pageCount.setAttribute('role','status');pageCount.setAttribute('aria-live','polite');
    previewTitle.append(previewLabel,pageCount);
    section.querySelector('.cv-card')?.prepend(previewTitle);
    const designControls=document.createElement('div');designControls.className='workspace-design-controls';
    const designLabel=document.createElement('label');designLabel.htmlFor='cv-design';designLabel.textContent='Design';
    const designSelect=document.createElement('select');designSelect.id='cv-design';designSelect.setAttribute('aria-label','CV design');
    for(const design of DraftedCvDesigns){const option=document.createElement('option');option.value=design.id;option.textContent=design.name;designSelect.append(option);}
    designSelect.value=selectedCvDesign;
    // Native selects can match :focus-visible after a pointer click in Chromium.
    designSelect.addEventListener('pointerdown',()=>{designSelect.dataset.pointerFocus='true';});
    designSelect.addEventListener('blur',()=>{delete designSelect.dataset.pointerFocus;});
    document.addEventListener('keydown',()=>{delete designSelect.dataset.pointerFocus;},true);
    designSelect.addEventListener('change',()=>{
      selectedCvDesign=designSelect.value;
      renderDocument(documentTextState);
    });
    designControls.append(designLabel,designSelect);previewTitle.append(designControls);
    portraitController=DraftedCvPortrait.create({host:editorPreviewEl,getJob:()=>activeJobText,getDesign:()=>selectedCvDesign,onChange:()=>renderDocument(documentTextState)});
    previewZoom=DraftedCvPreviewZoom.create({host:editorPreviewEl,controls:previewTitle});
    const previewCard=editorPreviewEl.closest('.cv-card');
    if(previewCard)previewView=DraftedCvPreviewOverlay.create({section,card:previewCard,host:editorPreviewEl,heading:previewTitle,onMove:()=>{documentComparison?.afterRender();tailorCvPreview?.afterRender();}});
    documentComparison=DraftedCvDocumentComparison.create({host:editorPreviewEl,controls:previewTitle,getEdited:()=>tailorCvPreview?.model()||({blocks:documentBlocksState||[],cvTitle:documentTitle}),getCompared:()=>({blocks:documentBlocksState||[],cvTitle:documentTitle}),render:()=>renderDocument(documentTextState)});
    browserPrint=DraftedCvBrowserPrint.create({host:editorPreviewEl,controls:previewTitle,getError:()=>portraitController?.error(),getTitle:()=>documentTitle,getEdited:()=>({portrait:portraitController?.model(),blocks:deepClone(documentBlocksState||[]),title:documentTitle,templateId:selectedCvDesign,structure:DraftedCvStructure.create(documentComparison?.original()?.blocks||documentBlocksState||[])})});
    const exportButton=previewTitle.querySelector('.workspace-print-button');
    const exportLabel=document.createElement('span');exportLabel.className='workspace-action-label';exportLabel.textContent='Export PDF';exportButton.append(exportLabel);
    actions.append(exportButton,previewTitle.querySelector('.workspace-print-status'));

  })();

  function syncWorkspaceJobContext() {
    const row=document.querySelector('.section-editor .workspace-job-context');if(!row)return;
    const context=window.__DRAFTED_JOBCONTEXT__,text=activeJobText.trim()||'';
    row.hidden=!context||!text;
    row.querySelector('.workspace-job-role').textContent=context?.roleTitle||'';
    const legacyText=row.querySelector('.workspace-job-text');if(legacyText)legacyText.textContent=text;
    const legacyDetails=row.querySelector('details');if(row.hidden&&legacyDetails)legacyDetails.open=false;
  }

  if (window.DraftedDiscoveryEditor && chatMessagesEl) {
    discoveryController = window.DraftedDiscoveryEditor.create({
      host: chatMessagesEl,
      endpoint: N8N_DISCOVERY_URL,
      onTailor: runTailor,
      getTailorState:tailorPresentationState,
      onSourceStateChange:refreshTailorPresentation,
      sourceTailoring: tailorSourcesEnabled,
      getQuestionSources:async(q,context)=>{
        const current=currentCoverageInput(),C=window.DraftedCoverageContract;
        if(context?.jobText!==undefined&&context.jobText!==current.jobText||JSON.stringify(context?.jobContext)!==JSON.stringify(current.jobContext))return [{name:'Saved job signal',stale:true}];
        const catalog=coverageController?.model?.catalog;
        let valid=false;if(catalog&&context?.jobText!==undefined)try{await C.validateCatalog(current.jobText,current.jobContext,catalog);valid=true;}catch{}
        return (q.signalRefs||[]).map(ref=>{const raw=context?.jobContext?.[ref.field]?.[ref.index],signal=valid?catalog.signals.find(s=>s.ref.field===ref.field&&s.ref.index===ref.index):null;return {name:typeof raw==='string'?raw:raw?.signal||'Source reference unavailable',quotes:signal?.anchorState==='verified'?signal.adEvidence:[],jobText:current.jobText,legacy:context?.jobText===undefined};});
      },
      onViewJobSource:(span,text,opener)=>workspacePages?.openJobSource(span,text,opener),
      onEditExperienceContext:structuredContextEnabled?(id,revision)=>{
        const sourceContext=discoveryController.sourceContext(tailorSourceLedger.snapshot());
        discoveryController.showChat();showTailorSuggestion({contextQuestions:[{answerId:id,answerRevision:revision,reason:'context_unclear'}]},tailorContextStamp(),{cvVersionId,blocks:deepClone(documentBlocksState),sourceContext});refreshTailorPresentation();
      }:null,
      getSourceNotice:()=>{const c=discoveryController?.sourceContext(tailorSourceLedger.snapshot());if(!c)return '';const integrationReview=(tailorSourceLedger.integrations||[]).some(g=>documentBlocksState.find(b=>b.blockId===g.blockId)?.text!==g.after||g.segments.some(s=>s.answerSources.some(x=>{const a=c.answers.find(a=>a.id===x.answerId);return !a||a.revision!==x.answerRevision||a.text!==x.sourceQuote||c.questions.find(q=>q.id===a.questionId)?.status!=='recorded';})));return integrationReview||c.applications.some(g=>documentBlocksState.find(b=>b.blockId===g.blockId)?.text!==g.checkpointText||g.additions.some(x=>{const a=c.answers.find(a=>a.id===x.source.answerId);return !a||a.revision!==x.source.answerRevision||c.questions.find(q=>q.id===a.questionId)?.status!=='recorded';}))?'Earlier wording may use changed or unavailable answers. It remains unchanged until you review and apply an update.':'';},
      getContext: () => !isPreviewingProposal && documentBlocksState?.length && window.__DRAFTED_JOBCONTEXT__
        ? { cvVersionId, blocks: deepClone(documentBlocksState), jobContext: deepClone(window.__DRAFTED_JOBCONTEXT__),jobText:activeJobText }
        : null
    });
  }

  function currentCoverageInput(){
    const cv=isPreviewingProposal&&previewSnapshot?previewSnapshot:{cvVersionId,documentBlocksState};
    return {cvVersionId:cv.cvVersionId||'',blocks:deepClone(cv.documentBlocksState||[]),jobText:activeJobText||'',jobContext:deepClone(window.__DRAFTED_JOBCONTEXT__||null)};
  }
  if(window.DraftedCoverageNavigation){
    coverageNavigation=DraftedCoverageNavigation.create({host:editorPreviewEl,getBlocks:()=>documentBlocksState||[],prepare:async()=>{if(isPreviewingProposal)throw Error('PROPOSAL_PREVIEW_ACTIVE');documentComparison?.edited({clearChanges:true});await renderDocument(documentTextState);await DraftedCvLayout.ready(editorPreviewEl);if(innerWidth<=700&&!document.querySelector('#cv-preview-dialog')?.open)document.querySelector('.workspace-expand-preview')?.click();}});
    document.querySelector('.document-comparison')?.addEventListener('click',()=>coverageNavigation.clear());
  }
  if(window.DraftedCoverageView&&chatMessagesEl){
    coverageController=DraftedCoverageView.create({host:chatMessagesEl,getInput:currentCoverageInput,
      config:window.__DRAFTED_COVERAGE__||{enabled:false},onStateChange:()=>{if(!coverageController?.model.fresh())coverageNavigation?.clear();workspacePages?.schedule();},onOpen:()=>discoveryController?.showChat(),
      getAppliedSources:()=>[...(tailorSourceLedger.integrations||[]).filter(g=>documentBlocksState.find(b=>b.blockId===g.blockId)?.text===g.after).flatMap(g=>g.segments.flatMap(s=>s.answerSources)),...tailorSourceLedger.groups.flatMap(g=>{const b=documentBlocksState.find(b=>b.blockId===g.blockId);if(b?.text!==g.checkpointText)return [];return g.additions.filter(a=>b.text.slice(a.start,a.end)==='\n\n'+a.text).map(a=>a.source);})],
      getSources:ref=>discoveryController?.sourcesForSignal(ref)||[],onSignal:(signal,current)=>discoveryController.openSignal(signal,current),
      onFind:evidence=>coverageNavigation.show(evidence),
      onAd:span=>{const raw=activeJobText;if(raw.slice(span.start,span.end)!==span.quote)return;let dialog=document.getElementById('coverage-job-source');if(!dialog){dialog=document.createElement('dialog');dialog.id='coverage-job-source';dialog.className='workspace-job-dialog workspace-coverage-source-dialog';dialog.setAttribute('aria-label','Source in full job description');document.querySelector('.section-editor').append(dialog);}dialog.replaceChildren();const title=document.createElement('h2');title.textContent='Job description';const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();const content=document.createElement('div');content.className='coverage-original-job';const mark=document.createElement('mark');mark.textContent=span.quote;content.append(document.createTextNode(raw.slice(0,span.start)),mark,document.createTextNode(raw.slice(span.end)));dialog.append(title,close,content);dialog.showModal();requestAnimationFrame(()=>{dialog.scrollTop+=mark.getBoundingClientRect().top-dialog.getBoundingClientRect().top-80;});}
    });
  }

  
  function deepClone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; }
  }

  
  function snapshotCurrentState() {
    return {
      documentTextState,
      documentBlocksState: deepClone(documentBlocksState),
      blockRangesById: deepClone(blockRangesById),
      documentTitle,
      cvVersionId,
      selectedBlockId,
      selectedBlockIds: new Set(Array.from(selectedBlockIds)),
      lastClickedBlockId,
      activeContext
    };
  }

  
  function restoreSnapshot(snap) {
    if (!snap) return;

    documentTextState = snap.documentTextState || "";
    documentBlocksState = snap.documentBlocksState || null;
    blockRangesById = snap.blockRangesById || {};
    documentTitle = snap.documentTitle || "";
    cvVersionId = snap.cvVersionId || null;
    selectedBlockId = snap.selectedBlockId || null;
    selectedBlockIds = new Set(Array.from(snap.selectedBlockIds || []));
    lastClickedBlockId = snap.lastClickedBlockId || null;
    activeContext = snap.activeContext || "chat";

    renderDocument(documentTextState);
    applySelectedBlocksUI();
    updateContextChip();
  }

  let activeContext = "chat"; // "chat" | "blocks" | "full"
  let cvLanguageConfirmed=false,languagePromptPending=false;
  let documentLanguage = "en"; // "sv" | "en"


  
  /* ===============================
     MULTI SELECT HELPERS (BLOCKS)
     =============================== */
  function getAllBlockElements() {
    return Array.from(editorPreviewEl.querySelectorAll(".cv-block[data-block-id]"));
  }

  
  function clearSelectedBlockUI() {
    editorPreviewEl.querySelectorAll(".cv-block.is-selected").forEach(el => {
      el.classList.remove("is-selected");
    });
  }

  
  function applySelectedBlocksUI() {
    clearSelectedBlockUI();
    if (!selectedBlockIds || selectedBlockIds.size === 0) return;

    for (const id of selectedBlockIds) {
      editorPreviewEl.querySelectorAll(`.cv-block[data-block-id="${CSS.escape(id)}"]`).forEach(el => el.classList.add("is-selected"));
    }
  }

  
  function toggleBlockSelection(id) {
    if (!id) return;
    if (selectedBlockIds.has(id)) selectedBlockIds.delete(id);
    else selectedBlockIds.add(id);
    selectedBlockId = id;
  }

  
  function addRangeSelection(anchorId, clickedId) {
    if (!anchorId || !clickedId) return;

    const blocks = getAllBlockElements();
    const ids = [...new Set(blocks.map(b => b.getAttribute("data-block-id")).filter(Boolean))];
    const a = ids.indexOf(anchorId);
    const c = ids.indexOf(clickedId);
    if (a === -1 || c === -1) {
      selectedBlockIds.add(clickedId);
      return;
    }

    const start = Math.min(a, c);
    const end = Math.max(a, c);
    for (let i = start; i <= end; i++) selectedBlockIds.add(ids[i]);
  }

  
  function clearBlockSelection(keepContext = "chat") {
    selectedBlockIds = new Set();
    selectedBlockId = null;
    lastClickedBlockId = null;

    clearSelectedBlockUI();
    activeContext = keepContext;
    updateContextChip();
  }


  
  /* ===============================
     BUILD STATE FROM BLOCKS
     =============================== */
  function buildStateFromBlocks(blocks, {preserveCanonical=false} = {}) {
    queueMicrotask(() => {if(!window.DraftedWorkspacePages?.sample&&!workspacePages?.restoring())discoveryController?.sync();});
    if (!Array.isArray(blocks) || !blocks.length) {
      documentBlocksState = null;
      blockRangesById = {};
      documentTextState = "";
      return;
    }

    const sorted = [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));

    let doc = "";
    const ranges = {};

    for (const block of sorted) {
      const id = block.blockId || `${block.type || "block"}_${Object.keys(ranges).length}`;
      const start = doc.length;

      const rawLabel = block.label ? String(block.label).trim() : "";
      const rawText = preserveCanonical ? block.text : stripLeakedFields(block.text ? String(block.text).trim() : "");

      let labelPart = "";
      if (rawLabel) {
        labelPart = rawLabel + "\n";
        doc += labelPart;
      }

      if (rawText) {
        doc += rawText;
      }

      doc += "\n\n";
      const end = doc.length;

      ranges[id] = {
        start,
        end,
        labelLength: labelPart.length,
        type: block.type || "block"
      };

      block.blockId = id;
      block.text = rawText;
    }

    documentTextState = doc;
    documentBlocksState = sorted;
    blockRangesById = ranges;

    console.log("📄 Built block state", {
      chars: documentTextState.length,
      blocks: documentBlocksState.length
    });
  }


  
  /* ===============================
     RENDER BLOCK HTML
     =============================== */
  function renderDocument(text) {
    coverageNavigation?.clear();
    queueMicrotask(()=>{if(!workspacePages?.restoring())coverageController?.sync({automatic:!window.DraftedWorkspacePages?.sample});});
    tailorReviewCheck?.();
    tailorCvPreview?.beforeRender();
    documentComparison?.sync(isPreviewingProposal);
    documentComparison?.beforeRender();
    const showChanges=documentComparison?.changes()??false;
    const selection=showChanges?cvSelectionUI?.model():null;
    const suggestion=showChanges?tailorCvPreview?.model():null,original=documentComparison?.model(),presentation=original||selection||suggestion;
    tailorCvPreview?.setPresentation({active:!original&&showChanges,marks:showChanges});
    document.querySelectorAll('.cv-selection-preview-review').forEach(node=>{node.hidden=!!original||!showChanges;});
    editorPreviewEl.dataset.cvPreviewMode=original?'original':selection&&cvSelectionUI.hasPending()||suggestion?'suggested':'current';
    const workspaceTitle = document.querySelector('.workspace-document-title');
    if (workspaceTitle) {
      workspaceTitle.textContent = documentTitle || 'Untitled CV';
      workspaceTitle.title = documentTitle || 'Untitled CV';
    }
    return DraftedCvLayout.render(editorPreviewEl, {
      structure:DraftedCvStructure.create(documentComparison?.original()?.blocks||documentBlocksState||[]), blocks: presentation?.blocks || documentBlocksState || [], title: presentation?.cvTitle ?? documentTitle ?? '', templateId: selectedCvDesign,portrait:portraitController?.model(),
      onState(state) {
        previewView?.setState(state);
        previewZoom?.setState(state);
        browserPrint?.setState(state);
        const counter=document.querySelector('.workspace-page-count');
        if(counter){counter.setAttribute('aria-busy',String(state==='loading'));if(state==='loading')counter.textContent='Updating pages…';else if(state==='error')counter.textContent='Page count unavailable';}
      },
      onLayout(count) {
        portraitController?.mount();
        const heading = document.querySelector('.workspace-preview-title');
        if (heading) {
          let counter = heading.closest('.cv-card')?.querySelector('.workspace-page-count');
          if (!counter) {
            counter = document.createElement('span');
            counter.className = 'workspace-page-count';
            counter.setAttribute('role', 'status');
            counter.setAttribute('aria-live', 'polite');
            heading.append(counter);
          }
          counter.textContent = count ? `${count} ${count === 1 ? 'page' : 'pages'}` : '';
        }
        applySelectedBlocksUI();
        tailorCvPreview?.afterRender();
        documentComparison?.afterRender();
      }
    });
  }




/* ===============================
   PROPOSAL / SUGGESTION HELPERS
   =============================== */
function computeChangedBlockIds(oldBlocks, newBlocks) {
  const oldById = new Map((Array.isArray(oldBlocks) ? oldBlocks : []).map(b => [String(b.blockId), b]));
  const changed = [];

  for (const nb of (Array.isArray(newBlocks) ? newBlocks : [])) {
    const id = String(nb?.blockId || "");
    if (!id) continue;
    const ob = oldById.get(id);
    if (!ob) { changed.push(id); continue; }

    // Compare only fields that matter for rendering
    const keys = ["text", "title", "employer", "startDate", "endDate", "institution", "degree", "program", "label", "type", "order"];
    let diff = false;
    for (const k of keys) {
      const a = (ob && ob[k] !== undefined) ? String(ob[k] ?? "") : "";
      const b = (nb && nb[k] !== undefined) ? String(nb[k] ?? "") : "";
      if (a !== b) { diff = true; break; }
    }
    if (diff) changed.push(id);
  }

  return changed;
}


  
/* ===============================
   FETCH PROPOSAL FROM SUGGESTION (WITH LOADING)
   =============================== */
async function fetchProposalFromSuggestion({ commitImmediately = false } = {}) {
  if (!pendingSuggestion || !pendingSuggestion.instruction) {
    return { ok: false, error: "No pendingSuggestion" };
  }

  const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
  if (!hasBlocks) {
    return { ok: false, error: "No blocks loaded" };
  }

  const baseline=pendingProposalMeta?.baseline;
  if(!baseline||chatBaseline()!==baseline)return {ok:false,error:'This suggestion belongs to an earlier CV or job context. Please send your request again.'};
  const mode = (pendingSuggestion.mode === "full") ? "full" : "blocks";
  const instruction = String(pendingSuggestion.instruction || "").trim();
  if(!['blocks','full'].includes(pendingSuggestion.mode))return {ok:false,error:'The suggested scope was invalid. Please try again.'};

  const selectedIds =
    mode === "blocks"
      ? (Array.isArray(pendingSuggestion.selectedBlockIds) && pendingSuggestion.selectedBlockIds.length
          ? pendingSuggestion.selectedBlockIds.map(String)
          : Array.from(selectedBlockIds))
      : [];

  if(mode==='blocks'&&(!selectedIds.length||selectedIds.some(id=>!documentBlocksState.some(b=>b.blockId===id))))return {ok:false,error:'The suggested sections are no longer available.'};
  const payload = {
    mode,
    instruction,
    targetRole: targetRoleInput?.value?.trim() || "",
    cvVersionId: cvVersionId || null,
    cvTitle: documentTitle || "",
    selectedBlockIds: selectedIds,
    blocks: documentBlocksState // ALWAYS send full list
  };

  isGeneratingSuggestionPreview = true;
  clearAllProposalCards();
  appendProposalCard(pendingProposalMeta);
  setApplyLabel();

  try {
    setBusy(true);

    const data = await draftedFetchJson(
      N8N_EDITOR_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      "cv"
    );

    if(chatBaseline()!==baseline)return {ok:false,error:'Your CV or job context changed. Please send your request again.'};
    const nextBlocks = data.blocks;
    if (!nextBlocks || !nextBlocks.length) {
      return { ok: false, error: "Rewrite flow returned no blocks" };
    }

    validateChatCandidate(nextBlocks,{mode,selectedBlockIds:selectedIds});
    const nextTitle = String(data.cvTitle || "").trim() || (documentTitle || "");
    const nextCvVersionId = String(data.cvVersionId || "").trim() || (cvVersionId || null);
    const changedBlockIds = computeChangedBlockIds(documentBlocksState, nextBlocks);

    const summary = Array.isArray(data.summaryOfChanges)
      ? data.summaryOfChanges
      : (instruction ? [instruction] : []);

    pendingProposal = {
      cvVersionId: nextCvVersionId,
      cvTitle: nextTitle,
      blocks: nextBlocks,
      summaryOfChanges: summary
    };

    pendingProposalMeta = {
      baseline,
      association:pendingProposalMeta?.association,
      changedBlockIds,
      summaryOfChanges: summary
    };

    if (commitImmediately) {
      applyProposal();
    }

    return { ok: true };

  } catch (e) {
    if (e && e.name === "DraftedContractError") {
      console.error("DraftedContractError", e.code, e.details, e);
    } else {
      console.error(e);
    }
    return { ok: false, error: "Rewrite fetch failed" };
  } finally {
    setBusy(false);
    forceButtonsActiveLook();

    isGeneratingSuggestionPreview = false;
    clearAllProposalCards();
    appendProposalCard(pendingProposalMeta);
    setApplyLabel();
  }
}
  

  /* ===============================
   CONTEXT CHIP (BLOCK + MODES)
   =============================== */

function setChipMode(mode) {
  contextChipEl.classList.remove("chip--chat", "chip--full", "chip--selection");
  if (mode === "blocks") contextChipEl.classList.add("chip--selection");
  else if (mode === "full") contextChipEl.classList.add("chip--full");
  else contextChipEl.classList.add("chip--chat");
}

// Short, human label for the selection (no text dump)
function getSelectionLabel() {
  if (!documentBlocksState?.length || !selectedBlockIds?.size) return "";

  const ids = Array.from(selectedBlockIds);
  const first = documentBlocksState.find((b) => b?.blockId === ids[0]);

  const type = (first?.label || first?.type || first?.section || "").toString().trim();
  const more = ids.length > 1 ? ` +${ids.length - 1} more` : "";

  return (type ? type : "Block") + more;
}

function selectionRequestCurrent(){
  const last=chatHistory.at(-1);return !!activeSelectionRequest&&activeSelectionRequest.baseline===chatBaseline()&&last?.role==='assistant'&&last.association===activeSelectionRequest.turnId;
}
function updateChatSendState(){
  const active=selectionRequestCurrent(),typed=!!editorInput.value.trim(),chosen=selectedBlockIds.size>0;
  editorChatBtn.textContent='Send';editorChatBtn.dataset.canSend=String(typed||chosen&&active);
  editorChatBtn.disabled=!!editorInput.disabled||!!window.__DRAFTED_CHAT__?.inFlight||!(typed||chosen&&active);
  editorChatBtn.setAttribute('aria-disabled',String(editorChatBtn.disabled));
  const hint=document.getElementById('selection-send-hint');if(hint){hint.textContent=active?'Send your selection to continue.':chosen&&!typed?'Add a message about this section.':'';hint.hidden=!hint.textContent;}
}

function canUseFullCvContext() {
  return tailorCompletionContext?.phase==='completed'&&tailorPresentationState()==='applied';
}

function contextDisplayName(block) {
  if(!block)return 'Section';
  const name=block.title||[block.degree,block.program].filter(Boolean).join(' · ')||block.label||block.type||'Section';
  const duplicate=documentBlocksState.filter(b=>b.title&&b.title===block.title).length>1;
  return duplicate&&block.employer?name+' · '+block.employer:name;
}
function updateContextChip() {
  const focusedFull=document.activeElement?.id==='chip-full';
  const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
  const allowFull=canUseFullCvContext();
  if(!allowFull&&activeContext==='full')activeContext='chat';
  const selectedCount = selectedBlockIds?.size || 0;
  for(const id of Object.keys(selectionSources))if(!selectedBlockIds.has(id))delete selectionSources[id];
  for(const id of selectedBlockIds)if(!selectionSources[id]){const block=documentBlocksState?.find(b=>b.blockId===id);if(block)selectionSources[id]={version:cvVersionId,text:block.text};}
  updateChatSendState();

  // If no CV loaded yet: hide chip completely + remove full-scope UI
  if (!hasBlocks) {
    applyFullScopeUI(false);
    contextChipEl.classList.add("is-hidden");
    setChipMode("chat");
    return;
  }

  // 1) BLOCK SELECTION MODE
  if (selectedCount > 0) {
    applyFullScopeUI(false);

    const label = getSelectionLabel();
    const safeLabel = label ? escapeHtml(label) : "";

    contextChipEl.innerHTML = `
      <div class="chip-label">
        <span class="chip-badge">Selected</span>
        <span class="chip-title">${selectedCount} block${selectedCount === 1 ? "" : "s"}</span>
        ${safeLabel ? `<span class="chip-sub">${safeLabel}</span>` : ""}
      </div>

      <div class="chip-actions">
        <button type="button" class="chip-btn chip-btn--ghost" id="chip-clear">Clear</button>
        ${allowFull?'<button type="button" class="chip-btn chip-btn--primary" id="chip-full" aria-pressed="false" aria-label="Use full CV as message context">Use full CV</button>':''}
      </div>
    `;

    const list=contextChipEl.querySelector('.chip-label');list.replaceChildren();const clear=contextChipEl.querySelector('#chip-clear');if(clear)list.append(clear);
    for(const id of selectedBlockIds){const block=documentBlocksState.find(b=>b.blockId===id),label=contextDisplayName(block);const chip=document.createElement('button');chip.type='button';chip.className='shared-section-chip';chip.textContent=label+' ×';chip.title=label;chip.dataset.contextName=label;chip.dataset.contextBlockId=id;
      const tooltip=document.createElement('span');tooltip.className='context-full-name';tooltip.textContent=label;tooltip.hidden=true;
      chip.addEventListener('focus',()=>{tooltip.hidden=false;});chip.addEventListener('blur',()=>{tooltip.hidden=true;});chip.addEventListener('pointerenter',()=>{tooltip.hidden=false;});chip.addEventListener('pointerleave',()=>{tooltip.hidden=!chip.matches(':focus');});list.append(tooltip);
      chip.setAttribute('aria-label','Remove '+label+' from message');chip.addEventListener('click',()=>{selectedBlockIds.delete(id);applySelectedBlocksUI();updateContextChip();});list.append(chip);}
    contextChipEl.classList.remove("is-hidden");
    setChipMode("blocks");positionContextHint();if(focusedFull)contextChipEl.querySelector('#chip-full')?.focus({preventScroll:true});

    contextChipEl.querySelector("#chip-clear")?.addEventListener("click", () => {
      clearBlockSelection("chat");
    });

    contextChipEl.querySelector("#chip-full")?.addEventListener("click", () => {
      activateFullContext();
    });

    return;
  }

  // 2) FULL CV MODE
  if (activeContext === "full") {
    applyFullScopeUI(true);

    contextChipEl.innerHTML = `
      <div class="chip-label"></div><div class="chip-actions"><button type="button" class="chip-btn chip-btn--primary" id="chip-full" aria-pressed="true" aria-label="Use full CV as message context">Full CV ✓</button></div>
    `;

    contextChipEl.classList.remove("is-hidden");
    setChipMode("full");positionContextHint();if(focusedFull)contextChipEl.querySelector('#chip-full')?.focus({preventScroll:true});

    contextChipEl.querySelector("#chip-full")?.addEventListener("click", () => {
      activeContext = "chat";
      updateContextChip();
    });

    return;
  }

  // 3) CHAT MODE (default when CV loaded)
  applyFullScopeUI(false);
  if(!allowFull){
    contextChipEl.replaceChildren();
    contextChipEl.classList.add('is-hidden');
    setChipMode('chat');
    return;
  }

  contextChipEl.innerHTML = `
    <div class="chip-label"></div>

    <div class="chip-actions">
      <button type="button" class="chip-btn chip-btn--primary" id="chip-full" aria-pressed="false" aria-label="Use full CV as message context">Use full CV</button>
    </div>
  `;

  contextChipEl.classList.remove("is-hidden");
  setChipMode("chat");positionContextHint();if(focusedFull)contextChipEl.querySelector('#chip-full')?.focus({preventScroll:true});

  contextChipEl.querySelector("#chip-full")?.addEventListener("click", () => {
    activateFullContext();
  });
}


  
  /* ===============================
     BLOCK CLICK SELECTION (MULTI)
     =============================== */
  editorPreviewEl.addEventListener("click", (e) => {
    if(tailorCvPreview?.suggested()||cvSelectionUI?.hasPending()||documentComparison?.model())return;
    if (!documentBlocksState || !documentBlocksState.length) return;

    if (e.target.closest("a.cv-document-link")) return;
    const blockEl = e.target.closest(".cv-block[data-block-id]");
    if (!blockEl || !editorPreviewEl.contains(blockEl)) return;

    const id = blockEl.getAttribute("data-block-id");
    if (!id) return;

    if (e.shiftKey && lastClickedBlockId) {
      addRangeSelection(lastClickedBlockId, id);
    } else {
      toggleBlockSelection(id);
    }

    lastClickedBlockId = id;

    if (selectedBlockIds.size === 0) {
      activeContext = "chat";
      selectedBlockId = null;
    } else {
      activeContext = "blocks";
      selectedBlockId = id;
    }

    clearNativeSelection();
    applySelectedBlocksUI();
    updateContextChip();
  });


  
  /* ===============================
     FILE PREVIEW
     =============================== */
  onReady(setupFilePicker);


  
  /* ===============================
     UPLOAD -> RENDER (MAIN FLOW)
     =============================== */
  uploadBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (uploadInFlight || workspaceContinuing) return;

  console.log("UPLOAD CLICKED");

  const fileInput = getFileInput();
  const file = fileInput?.files?.[0];

  if (!file) {
    preparation?.missingFile();
    alert("Choose a PDF first.");
    return;
  }

  if(workspacePages){workspaceContinuing=true;try{const action=await workspacePages.beforeContinue(file);if(action!=='upload')return;}catch(error){workspacePages.notify(error.message);return;}finally{workspaceContinuing=false;}}
  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetRole", targetRoleInput?.value?.trim() || "");
  uploadInFlight = true;

  try {
    setUploadLoading(true);
    setEditorProcessing(true);

    const data = await draftedFetchJson(
      N8N_UPLOAD_URL,
      { method: "POST", body: formData },
      "cv"
    );
    uploadScan?.stop();

    // A response for a file replaced during upload must not restore its CV/questions.
    if (getFileInput()?.files?.[0] !== file) return;
    discoveryCvFile = file;
    await portraitController?.reset();
    cvLanguageConfirmed=false;
    DraftedCvLayout.setZoom(editorPreviewEl,1);
    workspaceContextRevision++;
    tailorSourceLedger.reset();
    tailorReviewState=null;tailorAppliedStamp=null;cvSelectionState=null;discoveryController?.reset();

    const blocks = data.blocks;

    // A new upload with no title must not inherit a previous person's heading.
    documentTitle = String(data.cvTitle || "").trim();

    const nextCvVersionId = String(data.cvVersionId || "").trim();
    cvVersionId = nextCvVersionId || cvVersionId || null;

    setCvLoadedUI(true);
    setEditorPlaceholder(false);
    editorPreviewEl.textContent = "";

    buildStateFromBlocks(blocks);
    isPreviewingProposal=false;
    documentComparison?.begin({blocks:documentBlocksState||[],cvTitle:documentTitle});
    setEditorPlaceholder(false);

    // hide preview card title when CV exists
    updatePreviewHeaderVisibility();

    selectedBlockId = null;
    selectedBlockIds = new Set();
    lastClickedBlockId = null;
    activeContext = "chat";

    renderDocument(documentTextState);
    clearNativeSelection();
    updateContextChip();

    if (chatMessagesEl) Array.from(chatMessagesEl.children).filter(el => !el.classList.contains('drafted-discovery') && el.id!=='drafted-discovery-guidance' && !el.classList.contains('workspace-earlier-answers') && !el.classList.contains('workspace-coverage-panel')).forEach(el => el.remove());
    chatHistory = [];
    pendingProposal = null;
    pendingProposalMeta = null;
    isPreviewingProposal = false;
    previewSnapshot = null;
    clearAllProposalCards();
    setApplyLabel();
    maybeShowTailor();
    await DraftedCvLayout.ready(editorPreviewEl);
    preparation?.complete(file,{navigate:!workspacePages});
    if(workspacePages)await workspacePages.complete(file);

  } catch (err) {
    uploadScan?.stop();
    preparation?.failed(file);
    if (err && err.name === "DraftedContractError") {
      console.error("DraftedContractError", err.code, err.details, err);
    } else {
      console.error(err);
    }
  
    // Preserve any existing editor work if replacement processing fails.
    if(!documentBlocksState?.length)setEditorPlaceholder(true);
  
    const msg =
      (err && err.name === "DraftedContractError")
        ? `Fel vid uppladdning (${err.code}).`
        : "Fel vid uppladdning.";
  
    alert(msg);
  } finally {
    uploadInFlight = false;
  
    // Single exit point: always restore UI here
    setUploadLoading(false);
    setEditorProcessing(false);
    forceButtonsActiveLook();
  }
});



  /* ===============================
   PREVIEW / APPLY / DISMISS (NO CHAT NOISE)
   =============================== */
  function previewProposal() {
  if (!pendingProposal?.blocks?.length) return;

  if (!isPreviewingProposal) {
    previewSnapshot = snapshotCurrentState();
    isPreviewingProposal = true;
  }

  const nextBlocks = deepClone(pendingProposal.blocks);
  const nextTitle = String(pendingProposal.cvTitle || "").trim();
  const nextCvVersionId = String(pendingProposal.cvVersionId || "").trim();

  if (nextTitle) documentTitle = nextTitle;
  if (nextCvVersionId) cvVersionId = nextCvVersionId;

  buildStateFromBlocks(nextBlocks);
  renderDocument(documentTextState);
  applySelectedBlocksUI();
  updateContextChip();

  setApplyLabel();
  clearAllProposalCards();
  appendProposalCard(pendingProposalMeta);
}

  function exitProposalPreview() {
  if (!isPreviewingProposal) return;
  isPreviewingProposal = false;

  const snap = previewSnapshot;
  previewSnapshot = null;
  restoreSnapshot(snap);

  setApplyLabel();
  clearAllProposalCards();
  if (pendingProposal || pendingSuggestion) appendProposalCard(pendingProposalMeta);
}

  function validateChatCandidate(candidate,scope){
    if(!Array.isArray(candidate)||candidate.length!==documentBlocksState.length)throw new Error('Suggestion changed the document structure.');
    const baseline=new Map(documentBlocksState.map(b=>[b.blockId,b])),seen=new Set();
    for(let i=0;i<candidate.length;i++){const b=candidate[i],old=baseline.get(b?.blockId);
      if(!old||seen.has(b.blockId)||b.blockId!==documentBlocksState[i].blockId||typeof b.text!=='string')throw new Error('Invalid suggestion sections.');
      seen.add(b.blockId);
      const {text:oldText,...oldMeta}=old,{text:newText,...newMeta}=b;
      if(Object.keys(oldMeta).length!==Object.keys(newMeta).length||Object.keys(oldMeta).some(key=>JSON.stringify(oldMeta[key])!==JSON.stringify(newMeta[key])))throw new Error('Suggestion changed section identity or metadata.');
      if(scope?.mode==='blocks'&&!scope.selectedBlockIds.includes(b.blockId)&&oldText!==newText)throw new Error('Suggestion changed a section outside the requested scope.');
    }
  }
  function chatBaseline(){return JSON.stringify({version:cvVersionId,blocks:documentBlocksState,job:activeJobText||'',revision:workspaceContextRevision});}
  function applyProposal() {
  if (!pendingProposal?.blocks?.length) return;
  if(!pendingProposalMeta?.baseline||chatBaseline()!==pendingProposalMeta.baseline){appendChat('assistant','This suggestion is out of date. Send your request again before applying changes.');return;}

  const nextBlocks = deepClone(pendingProposal.blocks);

  const nextTitle = String(pendingProposal.cvTitle || "").trim();
  const nextCvVersionId = String(pendingProposal.cvVersionId || "").trim();

  if (nextTitle) documentTitle = nextTitle;
  if (nextCvVersionId) cvVersionId = nextCvVersionId;

  buildStateFromBlocks(nextBlocks);

  // clear preview state + proposal + suggestion
  isPreviewingProposal = false;
  previewSnapshot = null;

  pendingProposal = null;
  pendingProposalMeta = null;
  pendingSuggestion = null;

  renderDocument(documentTextState);
  applySelectedBlocksUI();
  updateContextChip();

  clearNativeSelection();

  clearAllProposalCards();
  setApplyLabel();
  return true;
}

  function dismissProposal() {
  // If previewing, revert
  if (isPreviewingProposal) {
    isPreviewingProposal = false;
    const snap = previewSnapshot;
    previewSnapshot = null;
    restoreSnapshot(snap);
  }

  pendingProposal = null;
  pendingProposalMeta = null;
  pendingSuggestion = null;

  clearAllProposalCards();
  setApplyLabel();
}

  /* ===============================
   BUTTON HANDLERS (PREVIEW/APPLY)
   =============================== */

async function handlePreviewClick() {
  // toggle off
  if (isPreviewingProposal) {
    exitProposalPreview();
    return;
  }

  // If we already have a proposal, preview it
  if (pendingProposal?.blocks?.length) {
    previewProposal();
    return;
  }

  // If we only have a suggestion, generate the proposal first (rewrite flow), then preview
  if (pendingSuggestion?.instruction) {
    const r = await fetchProposalFromSuggestion({ commitImmediately: false });
    if (!r.ok) {
      appendChat("assistant", r.error || "Could not generate preview.");
      return;
    }
    previewProposal();
    return;
  }
}

  async function handleApplyClick() {
  // If we already have a proposal, apply it
  if (pendingProposal?.blocks?.length) {
    applyProposal();
    return;
  }

  // If we only have a suggestion, generate + apply immediately
  if (pendingSuggestion?.instruction) {
    const r = await fetchProposalFromSuggestion({ commitImmediately: true });
    if (!r.ok) {
      appendChat("assistant", r.error || "Could not apply suggestion.");
      return;
    }
    return;
  }
}

  
  /* ===============================
   CHAT SEND (supports suggestion + proposal)
   =============================== */

const sampleInstruction='Make this section more concise';
function fillPreparedSample(){selectedBlockIds.clear();selectedBlockIds.add('sample-product');applySelectedBlocksUI();updateContextChip();editorInput.value=sampleInstruction;editorInput.dispatchEvent(new Event('input',{bubbles:true}));editorInput.focus({preventScroll:true});}
function sampleMessage(text){let n=document.getElementById('sample-request-note');if(!n){n=document.createElement('p');n.id='sample-request-note';n.setAttribute('role','status');editorInput.closest('.workspace-composer').prepend(n);}n.textContent=text;}
function mountSampleChat(){
 document.getElementById('sample-chat-limit')?.remove();
 let limit=document.getElementById('sample-chat-scope');if(!limit){limit=document.createElement('p');limit.id='sample-chat-scope';limit.textContent='Demo: prepared example only. Custom chat requires your own CV. Suggestion Edit uses real AI when available.';editorInput.before(limit);}
 editorInput.placeholder='Follow the guided demo example';
 editorInput.title='This demo supports the prepared shortening example; custom requests require your own CV.';
}

async function sendPreparedSample(){
 if(tailorReviewState){sampleMessage('Finish the current suggestions before trying the prepared example.');return;}
 if(editorInput.value.trim()!==sampleInstruction||selectedBlockIds.size!==1||!selectedBlockIds.has('sample-product')){sampleMessage('This request is outside the prepared example. Choose Use guided example, or start with your own CV for custom requests.');return;}
 const prepared=window.DraftedSampleReviewData,b=documentBlocksState.find(b=>b.blockId==='sample-product'),initial=prepared.request.blocks.find(b=>b.blockId==='sample-product'),tailored=prepared.data.blocks.find(b=>b.blockId==='sample-product');
 if(!b||![initial.text,tailored.text].includes(b.text)||JSON.stringify({...b,text:initial.text})!==JSON.stringify(initial)){sampleMessage('This section has already changed. The prepared example will not replace your current work. Reset sample to try it again, or use your own CV.');return;}
 const text=b.text===initial.text?'• Coordinated monthly release planning with a designer and four developers; maintained the delivery board and updated customer support.\n• Interviewed eight customers about account setup and worked with the designer on a clearer checklist.\n• Collected weekly support feedback for team discussions of recurring issues before deciding next steps.':'• Coordinated monthly release planning with a designer and four developers; maintained the delivery board and support updates.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.';
 const stamp=tailorContextStamp(),r=deepClone(prepared.request);r.blocks=deepClone(documentBlocksState);r.cvVersionId=cvVersionId;r.sourceContext.applications=deepClone(tailorSourceLedger.groups||[]);r.integrationApplications=deepClone(tailorSourceLedger.integrations||[]);r.inputRef=await DraftedTailorSources.inputRef(r);
 const scope='prepared-guided-shortening',catalog=DraftedTailorSources.makeCatalog(r,scope),target=catalog.targets.find(t=>t.blockId===b.blockId);if(!target){sampleMessage('The prepared example no longer matches this section. Your current work is kept.');return;}
 const recipe={integrations:[{targetKey:target.targetKey,segments:[{text,cvEvidenceKeys:catalog.cvEvidence.filter(e=>e.blockId===b.blockId).map(e=>e.evidenceKey),answerSourceKeys:catalog.sources.filter(a=>a.allowedTargets.includes(target.targetKey)&&target.priorSources.some(p=>p.answerId===a.answerId)).map(a=>a.sourceKey)}]}],contextQuestions:[],reviewNotes:[{targetKey:target.targetKey,reason:'Keeps release coordination, customer interviews and feedback routines together while preserving the stated decision-making responsibility.'}]};
 try{const data=await DraftedTailorSources.candidate(r,recipe,{scope});if(stamp!==tailorContextStamp())return;editorInput.value='';document.getElementById('sample-chat-limit')?.remove();showTailorSuggestion(data,stamp,r,new Set(),{decisions:{},ledger:DraftedSectionReview.ledger(tailorSourceLedger),preparedDemo:true});sampleMessage('Prepared demo example — review the suggested wording in the card and preview. Nothing is accepted automatically.');}catch{sampleMessage('The prepared example does not match the current source state. Your CV is kept; Reset sample offers a fresh example.');}
}
async function sendChat() {
  if(window.DraftedWorkspacePages?.sample){await sendPreparedSample();return;}
  // Block during upload-processing lock
  if (editorPaper && editorPaper.classList.contains("is-processing")) {
    return;
  }

  // Hard global guard (works even if multiple listeners exist)
  if (window.__DRAFTED_CHAT__?.inFlight) {
    return;
  }

  // Also block if UI is already busy/disabled (extra defense)
  if ((editorChatBtn && editorChatBtn.disabled) || (editorInput && editorInput.disabled)) {
    return;
  }

  if(tailorCvPreview){const view=tailorCvPreview;tailorCvPreview=null;view.dispose();}
  if(isPreviewingProposal)exitProposalPreview();
  const typed=(editorInput?.value||'').trim();
  if(!typed&&(!selectedBlockIds.size||!selectionRequestCurrent())){updateChatSendState();return;}
  const invalid=[...selectedBlockIds].some(id=>{const b=documentBlocksState?.find(b=>b.blockId===id),source=selectionSources[id];return !b||!source||source.version!==cvVersionId||source.text!==b.text;});
  if(invalid){appendChat('assistant','The selected sections changed or were removed. Please select the current sections again. Your draft is kept.');clearBlockSelection('chat');return;}
  const shared=[...selectedBlockIds].map(id=>documentBlocksState.find(b=>b.blockId===id));
  const shareText=shared.length?'Shared section'+(shared.length===1?'':'s')+': '+shared.map(b=>b.label||b.type||'Section').join(', '):'';
  const msg=[typed,shareText,activeContext==='full'?'Context: Full CV':''].filter(Boolean).join('\n\n');
  const baseline=chatBaseline();
  const previousHistory=chatHistory.slice(-12);
  const respondingTo=selectionRequestCurrent()?activeSelectionRequest.id:null;
  activeSelectionRequest=null;

  const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
  if (!hasBlocks) {
    appendChat("assistant", "Upload a CV first so I can suggest improvements.");
    return;
  }

  // Lock immediately BEFORE any async work
  window.__DRAFTED_CHAT__.inFlight = true;
  setBusy(true);

  console.log("✅ sendChat(fetch) is running", { N8N_CHAT_URL });

  appendChat("user", msg);
  editorInput.value = "";

  const mode =
    (selectedBlockIds.size > 0) ? "blocks" :
    (activeContext === "full") ? "full" :
    "chat";

  const payload = {
    requestId:crypto.randomUUID(),
    cvVersionId: cvVersionId || null,
    cvTitle: documentTitle || "",
    targetRole: targetRoleInput?.value?.trim() || "",
    language: documentLanguage,
    mode,
    selectedBlockIds: mode === "blocks" ? Array.from(selectedBlockIds) : [],
    blocks: documentBlocksState,
    history: previousHistory,
    ...(respondingTo?{selectionRequestId:respondingTo}:{}),
    message: msg
  };

  try {
    const data = await draftedFetchJson(
      N8N_CHAT_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      "chat"
    );

    if(chatBaseline()!==baseline){appendChat('assistant','Your CV or job context changed while this answer was being prepared. Send your request again using the current version.');return;}
    if(data.selectionRequest&&data.selectionRequest.id!==payload.requestId)throw new Error('Selection request belongs to a different conversation step.');
    const association=crypto.randomUUID();
    const assistantMsg = String(data.message || "").trim() || "Okay.";
// Show ordinary replies immediately; actionable replies are represented by the concrete card.
if(!data.suggestion?.instruction&&!data.proposal?.blocks?.length)appendChat("assistant", assistantMsg,association);
activeSelectionRequest=data.selectionRequest?{id:data.selectionRequest.id,turnId:association,baseline}:null;

// Reset preview state on any new assistant answer
isPreviewingProposal = false;
previewSnapshot = null;

// Normalize incoming suggestion/proposal
const nextSuggestion =
  (data && data.suggestion && typeof data.suggestion === "object" && !Array.isArray(data.suggestion))
    ? data.suggestion
    : null;

const nextProposal =
  (data && data.proposal && typeof data.proposal === "object" && !Array.isArray(data.proposal))
    ? data.proposal
    : null;

if(nextProposal?.blocks)validateChatCandidate(nextProposal.blocks,{mode,selectedBlockIds:payload.selectedBlockIds});
if(nextSuggestion&&payload.selectedBlockIds.length&&(nextSuggestion.mode!=='blocks'||!Array.isArray(nextSuggestion.selectedBlockIds)||nextSuggestion.selectedBlockIds.some(id=>!payload.selectedBlockIds.includes(id))))throw new Error('Suggestion exceeded the shared scope.');
pendingSuggestion = nextSuggestion;
pendingProposal = nextProposal;

// Build meta used by your existing proposal card UI.
// Keep it compatible with fetchProposalFromSuggestion(), which uses appendProposalCard(pendingProposalMeta).
pendingProposalMeta = {
  baseline,
  association,
  intent: data.intent || (nextProposal ? "proposal" : nextSuggestion ? "suggestion" : "answer"),
  changedBlockIds: Array.isArray(data.changedBlockIds) ? data.changedBlockIds : [],
  // If your card expects summaryOfChanges, keep it as empty list.
  summaryOfChanges: []
};

// Render: clear old cards first, then show card if we have something actionable
clearAllProposalCards();

const hasActionableSuggestion = !!(pendingSuggestion && pendingSuggestion.instruction);
const hasReadyProposal = !!(pendingProposal && pendingProposal.blocks && pendingProposal.blocks.length);

if (hasReadyProposal || hasActionableSuggestion) {
  if(hasActionableSuggestion&&!hasReadyProposal){const result=await fetchProposalFromSuggestion();if(!result.ok){appendChat('assistant',assistantMsg,association);appendChat('assistant',result.error||'Could not prepare the suggestion. Your CV is unchanged.');}}
  else appendProposalCard(pendingProposalMeta);
}

setApplyLabel();



  } catch (err) {
    if (err && err.name === "DraftedContractError") {
      console.error("DraftedContractError", err.code, err.details, err);
    } else {
      console.error(err);
    }
    appendChat("assistant", "Something went wrong. Your CV is unchanged. Review your draft and try again.");
    if(!editorInput.value)editorInput.value=typed;
    pendingProposal = null;
    pendingProposalMeta = null;
    pendingSuggestion = null;
    clearAllProposalCards();
    setApplyLabel();
  } finally {
    // Always release lock
    window.__DRAFTED_CHAT__.inFlight = false;
    setBusy(false);
    updateContextChip();
    forceButtonsActiveLook();
  }
}





  /* ===============================
   COMMAND BAR LOCK (processing)
   =============================== */
function setCommandBarLocked(isLocked) {
  const locked = !!isLocked;
  const input = document.getElementById("editor-input");
  const chatBtn = document.getElementById("editor-chat-send");
  const applyBtn = document.getElementById("editor-send");

  if (input) {
    if (!input.dataset.placeholderDefault) {
      input.dataset.placeholderDefault =
        input.getAttribute("placeholder") || "Write a message…";
    }

    input.disabled = locked;
    input.setAttribute("aria-disabled", locked ? "true" : "false");

    input.setAttribute(
      "placeholder",
      locked
        ? "Working on your draft…"
        : input.dataset.placeholderDefault
    );

    if (locked && document.activeElement === input) {
      input.blur();
    }

    if (!input.dataset.processingKeyguard) {
      input.dataset.processingKeyguard = "1";

      input.addEventListener(
        "keydown",
        (e) => {
          const isProcessing =
            editorPaper && editorPaper.classList.contains("is-processing");

          if (!isProcessing) return;

          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        },
        true
      );
    }
  }

  // Buttons
  [chatBtn, applyBtn].forEach((btn) => {
    if (!btn) return;
    btn.disabled = locked || btn===chatBtn&&btn.dataset.canSend!=="true";
    btn.setAttribute("aria-disabled", String(btn.disabled));
    btn.classList.toggle("is-locked", locked);
  });

  const row = document.querySelector(".chat-input-row");
  if (row) row.classList.toggle("is-locked", locked);
}



  /* ===============================
   APPLY BUTTON (main Apply)
   =============================== */
  editorInput.addEventListener("input",()=>updateContextChip());

    if (editorChatBtn) {
    editorChatBtn.addEventListener("click", e => {
      e.preventDefault();
      sendChat();
    });
  }

    editorInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    const isProcessing = editorPaper && editorPaper.classList.contains("is-processing");
    const isInFlight = !!window.__DRAFTED_CHAT__?.inFlight;
    const isBusy = !!(editorChatBtn && editorChatBtn.disabled);

    if (isProcessing || isInFlight || isBusy) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    sendChat();
  }
});

/* ===============================
   EXPORT / DOWNLOAD (PDF)
   =============================== */

// 2) Bygg payload ENBART från blocks som source of truth
function buildPdfExportPayload() {
  if(tailorCvPreview?.suggested()||cvSelectionUI?.hasPending())return {ok:false,reason:'SUGGESTED_PREVIEW'};
  // documentBlocksState och cvVersionId och documentTitle ligger i closure-scope (STATE)
  if (!documentBlocksState || !Array.isArray(documentBlocksState) || documentBlocksState.length === 0) {
    return { ok: false, reason: "NO_BLOCKS" };
  }
  if (!cvVersionId) {
    return { ok: false, reason: "NO_CV_VERSION_ID" };
  }

  return {
    ok: true,
    payload: {
      cvVersionId,
      cvTitle: documentTitle || "CV",
      language: documentLanguage || "en",
      templateId: "classic_v1",
      blocks: documentBlocksState
    }
  };
}

// 3) Hitta download-knappen via SVG och bind click
function bindPdfDownloadButton() {
  const toolsEl = document.querySelector(".cv-tools");
  if (!toolsEl) return;

  // robust: hittar ikonen och går upp till närmaste klickbara wrapper
  const icon = toolsEl.querySelector("svg.feather.feather-download");
  const clickable = icon?.closest(".tool-btn") || icon?.closest("button, a, [role='button']");
  if (!clickable) return;

  // undvik dubbelbindningar
  if (clickable.dataset?.draftedBound === "1") return;
  if (clickable.dataset) clickable.dataset.draftedBound = "1";

  clickable.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // enkel lock (delad med chat om du vill, men du kan hålla den separat)
    if (window.__DRAFTED_EXPORT__?.inFlight) return;

    const built = buildPdfExportPayload();
    if (!built.ok) {
      console.warn("PDF export blocked:", built.reason);
      // här kan du återanvända din befintliga UI toast/appendChatMessage om du vill
      alert("Your CV cannot be downloaded yet. Upload a CV first.");
      return;
    }

    try {
      window.__DRAFTED_EXPORT__ = window.__DRAFTED_EXPORT__ || { inFlight: false };
      window.__DRAFTED_EXPORT__.inFlight = true;

      const res = await fetch(N8N_EXPORT_PDF_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/pdf, application/json"
        },
        body: JSON.stringify(built.payload),
      });

      const contentType = (res.headers.get("content-type") || "").toLowerCase();

      // Om backend failar ska den svara JSON (ok:false)
      if (contentType.includes("application/json")) {
        const err = await res.json().catch(() => null);
        console.error("Export JSON error:", err);
        alert(err?.message || err?.contractError || "PDF export failed.");
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Export HTTP error:", res.status, txt);
        alert("PDF export failed (HTTP " + res.status + ").");
        return;
      }

      // PDF binary
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const safeTitle = (documentTitle || "CV")
        .trim()
        .replace(/[^\w\d\- _åäöÅÄÖ]/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 80);

      const filename = `${safeTitle || "CV"}.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Export exception:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      if (window.__DRAFTED_EXPORT__) window.__DRAFTED_EXPORT__.inFlight = false;
    }
  });
}







  /* ===============================
     INITIAL
     =============================== */
  setCvLoadedUI(false);
  setEditorPlaceholder(true);
  renderDocument("");
  updateContextChip();
  setApplyLabel();

  function editorContextStamp(){return JSON.stringify({revision:workspaceContextRevision,version:cvVersionId,blocks:documentBlocksState,job:activeJobText||'',context:window.__DRAFTED_JOBCONTEXT__});}
  function invalidateContextSuggestions(){
    tailorReviewDispose?.();
    if(isPreviewingProposal)exitProposalPreview();
    const had=pendingProposal||pendingSuggestion||tailorReviewState;
    pendingProposal=null;pendingProposalMeta=null;pendingSuggestion=null;tailorReviewState=null;tailorAppliedStamp=null;cvSelectionState=null;
    document.querySelectorAll('.tailor-suggestion').forEach(el=>el.remove());clearAllProposalCards();setApplyLabel();
    if(had)appendChat('system','The job description changed. Prepare a new suggestion before applying changes.');
  }
  function currentTailorSourceContext(){
    const context=discoveryController?.sourceContext([]);if(!context)return null;
    // Applications from an earlier job round remain in saved history. They are
    // not presented as current answers to a different job's question set.
    const current=new Set(context.answers.map(answer=>answer.id+':'+answer.revision));
    context.applications=['1.3','1.4','1.5'].includes(tailorSourcesVersion)?tailorSourceLedger.snapshot():tailorSourceLedger.snapshot().filter(group=>group.additions.every(item=>current.has(item.source.answerId+':'+item.source.answerRevision)));
    return context;
  }
  function serialSnapshot(snapshot){return snapshot?{...snapshot,selectedBlockIds:[...snapshot.selectedBlockIds]}:null;}
  function captureWorkspace(){
    if(document.documentElement.dataset.workspacePage==='editor'&&document.documentElement.dataset.workspaceReady==='true'&&!document.documentElement.dataset.workspaceBooting)workspaceReading={chat:chatMessagesEl.scrollTop,document:editorPreviewEl.closest('.cv-document')?.scrollTop||0};
    const cv=documentBlocksState?.length?serialSnapshot(snapshotCurrentState()):null;
    return {cv,sampleVersion:window.DraftedWorkspacePages?.sample?3:undefined,portrait:portraitController?.snapshot(),tailorCompletionContext,cvSelection:cvSelectionState,comparison:documentComparison?.snapshot(),contextRevision:workspaceContextRevision,language:documentLanguage,cvLanguageConfirmed,design:selectedCvDesign,chatHistory,
      messages:[...chatMessagesEl.querySelectorAll(':scope > .chat-message:not(.drafted-proposal-card), :scope > .suggestion-receipt')].map(el=>({role:el.classList.contains('user')?'user':el.classList.contains('system')?'system':'assistant',text:el.textContent,receiptId:el.dataset.receiptId||null,association:el.dataset.proposalAssociation||null})),
      activeSelectionRequest,appliedChatReceipts,selectionSources,pendingProposal,pendingProposalMeta,pendingSuggestion,isPreviewingProposal,previewSnapshot:serialSnapshot(previewSnapshot),
      jobText:activeJobText,jobDraft:jobAdInputEl.value,jobContext:window.__DRAFTED_JOBCONTEXT__,jobStatus:jobContextStatusEl.dataset.state,
      setupStatus:{text:document.getElementById('preparation-status').textContent,state:document.getElementById('preparation-status').dataset.state,hidden:document.getElementById('preparation-status').hidden,processing:uploadInFlight},
      draft:editorInput.value,discovery:discoveryController?.snapshot(),coverage:coverageController?.snapshot(),ledger:{groups:tailorSourceLedger.groups,history:tailorSourceLedger.history,integrations:tailorSourceLedger.integrations,integrationHistory:tailorSourceLedger.integrationHistory,languageApplications:tailorSourceLedger.languageApplications,languageHistory:tailorSourceLedger.languageHistory},
      jobEditor:{open:false},
      tailorReview:tailorReviewState,tailorAppliedStamp,tailorDraft:chatMessagesEl.querySelector('.tailor-suggestion textarea')?.value||'',
      interrupted:!!window.__DRAFTED_CHAT__?.inFlight||tailorInFlight||tailorFinishing||isGeneratingSuggestionPreview,
      scroll:workspaceReading,
      zoom:document.querySelector('.workspace-zoom-fit')?.getAttribute('aria-pressed')==='true'?'fit':Number(document.querySelector('.workspace-zoom-slider')?.value||100)/100};
  }
  async function restoreWorkspace(saved,files){
    await portraitController?.restore(saved.portrait,files.portrait,saved.design);
    workspaceContextRevision=Number.isInteger(saved.contextRevision)?saved.contextRevision:0;
    workspaceReading=saved.scroll||{chat:0,document:0};
    // Restore real file bytes through DataTransfer, never a persisted blob URL.
    if(files.selected){const transfer=new DataTransfer();transfer.items.add(files.selected);getFileInput().files=transfer.files;getFileInput().dispatchEvent(new Event('change',{bubbles:true}));}
    discoveryCvFile=files.source||null;activeJobText=typeof saved.jobText==='string'?saved.jobText:'';jobAdInputEl.value=typeof saved.jobDraft==='string'?saved.jobDraft:activeJobText;
    window.__DRAFTED_JOBCONTEXT__=saved.jobContext||null;jobContextReqSeq++;
    const hint=document.getElementById('preparation-job-hint');if(hint)hint.hidden=!jobAdInputEl.value.trim()||jobAdInputEl.value.trim().length>=200;
    if(saved.setupStatus){const status=document.getElementById('preparation-status');status.textContent=saved.setupStatus.processing?'Processing was interrupted. Continue when you are ready to try again.':saved.setupStatus.text;status.dataset.state=saved.setupStatus.processing?'error':saved.setupStatus.state;status.hidden=saved.setupStatus.processing?false:!!saved.setupStatus.hidden;}
    if(['loading','pending'].includes(saved.jobStatus))setJobContextStatus('error','!','Signal extraction was interrupted. Save the job description again to retry.');
    else setJobContextStatus(saved.jobContext?'ready':'idle',saved.jobContext?'✓':'',saved.jobContext?'Signals ready':'');
    if(!DraftedWorkspaceStore.valid(saved))return;
    cvLanguageConfirmed=saved.cvLanguageConfirmed===true&&['sv','en'].includes(saved.language);documentLanguage=['sv','en'].includes(saved.language)?saved.language:'en';selectedCvDesign=DraftedCvDesigns.some(d=>d.id===saved.design)?saved.design:'classic_v1';document.getElementById('cv-design').value=selectedCvDesign;
    cvSelectionState=saved.cvSelection||null;tailorCompletionContext=saved.tailorCompletionContext||null;if(tailorCompletionContext?.phase==='tailoring')tailorCompletionContext.phase='failed';
    restoreSnapshot(saved.cv);documentComparison?.restore(saved.comparison);renderDocument(documentTextState);setCvLoadedUI(true);setEditorPlaceholder(false);
    isPreviewingProposal=!!saved.isPreviewingProposal;previewSnapshot=saved.previewSnapshot||null;pendingProposal=saved.pendingProposal||null;pendingProposalMeta=saved.pendingProposalMeta||null;pendingSuggestion=saved.pendingSuggestion||null;
    for(const el of [...chatMessagesEl.children])if(!el.matches('.drafted-discovery,.discovery-guidance,.workspace-earlier-answers,.workspace-coverage-panel'))el.remove();
    appliedChatReceipts=Array.isArray(saved.appliedChatReceipts)?saved.appliedChatReceipts:[];
    chatHistory=[];for(const message of saved.messages||[]){const receipt=appliedChatReceipts.find(r=>r.id===message.receiptId);if(receipt)appendAppliedReceipt(receipt);else appendChat(message.role,message.text,message.association);}chatHistory=Array.isArray(saved.chatHistory)?saved.chatHistory:[];
    activeSelectionRequest=saved.activeSelectionRequest||null;
    selectionSources=saved.selectionSources||{};editorInput.value=saved.draft||'';updateContextChip();tailorSourceLedger.groups=saved.ledger?.groups||[];tailorSourceLedger.history=saved.ledger?.history||[];tailorSourceLedger.integrations=saved.ledger?.integrations||[];tailorSourceLedger.integrationHistory=saved.ledger?.integrationHistory||[];tailorSourceLedger.languageApplications=saved.ledger?.languageApplications||[];tailorSourceLedger.languageHistory=saved.ledger?.languageHistory||[];
    if(saved.discovery)discoveryController?.restore(saved.discovery);
    await coverageController?.restore(saved.coverage);
    tailorAppliedStamp=saved.tailorAppliedStamp||null;tailorReviewState=saved.tailorReview||null;
    if(window.DraftedWorkspacePages?.sample&&saved.sampleReview&&!tailorReviewState)tailorReviewState={...saved.sampleReview,stamp:tailorContextStamp(),omittedContext:[],sectionSession:null};
    if(tailorReviewState){const review=tailorReviewState;try{if(review.stamp!==tailorContextStamp()||!cvLanguageDecision().language)throw Error('STALE_CONTEXT');if(review.data.sourcesSchemaVersion)await DraftedTailorSources.validateCandidate(review.request,review.data);if(review.sectionSession){const expected=await DraftedSectionReview.project(review.request,review.data,review.sectionSession);if(DraftedCoverageContract.canonical(expected.blocks)!==DraftedCoverageContract.canonical(documentBlocksState)||DraftedCoverageContract.canonical(expected.ledger)!==DraftedCoverageContract.canonical(DraftedSectionReview.ledger(tailorSourceLedger)))throw Error('STALE_SECTION_REVIEW');}showTailorSuggestion(review.data,review.stamp,review.request,new Set(review.omittedContext),review.sectionSession);const draft=chatMessagesEl.querySelector('.tailor-suggestion textarea');if(draft)draft.value=saved.tailorDraft||'';}catch{tailorReviewState=null;appendChat('system','The saved tailoring suggestion needs an update. Your CV and answers are unchanged.');}}
    cvSelectionUI?.sync();cvSelectionUI?.draw();
    if(pendingProposal||pendingSuggestion)appendProposalCard(pendingProposalMeta);setApplyLabel();syncWorkspaceJobContext();refreshTailorPresentation();
    if(tailorCompletionContext?.phase==='completed'&&!tailorReviewState&&!cvSelectionUI?.hasPending()&&tailorAppliedStamp===tailorContextStamp(discoveryController?.sourceContentRevision()))finishTailoringMessage();
    if(saved.interrupted){appendChat('system','An unfinished request was interrupted by reload. Your work is kept. Retry the request when you are ready.');if(!editorInput.value)editorInput.value=[...(saved.chatHistory||[])].reverse().find(m=>m.role==='user')?.content||'';}
    await DraftedCvLayout.ready(editorPreviewEl);DraftedCvLayout.setZoom(editorPreviewEl,saved.zoom||1);
    requestAnimationFrame(()=>{chatMessagesEl.scrollTop=saved.scroll?.chat||0;const pane=editorPreviewEl.closest('.cv-document');if(pane)pane.scrollTop=saved.scroll?.document||0;});
  }
  window.DraftedTailorLanguageControl={create:createCvLanguageControl};
  DraftedReviewHover.create({editor:chatMessagesEl,host:editorPreviewEl});
  cvSelectionUI=DraftedCvSelectionUI.create({host:chatMessagesEl,previewHost:editorPreviewEl,isChangesVisible:()=>!!documentComparison?.changes()&&documentComparison?.mode()!=='original',onReview:()=>{documentComparison?.edited({showChanges:true});tailorFinishing=false;if(tailorCompletionContext)tailorCompletionContext.phase='selection-review';refreshTailorPresentation();},onStart:()=>{tailorFinishing=true;tailorAppliedStamp=null;if(tailorCompletionContext)tailorCompletionContext.phase='tailoring';chatMessagesEl.querySelectorAll('.tailor-feedback,.tailor-applied-language').forEach(n=>n.remove());refreshTailorPresentation();},onError:()=>{tailorFinishing=false;if(tailorCompletionContext)tailorCompletionContext.phase='failed';refreshTailorPresentation();},onComplete:selection=>{if(selection?.tailoringStatus!=='completed')return;tailorFinishing=false;if(tailorCompletionContext)tailorCompletionContext.phase='completed';finishTailoringMessage(selection);},getProtectedBlocks:()=>Object.entries(tailorCompletionContext?.decisions||{}).filter(([,value])=>value==='decline').map(([id])=>id),getState:()=>cvSelectionState,setState:value=>{cvSelectionState=value;},getCurrent:()=>deepClone(documentBlocksState||[]),getAnswers:()=>deepClone(discoveryController?.snapshot()?.session?.answers||[]),getVersion:()=>cvVersionId,getJob:()=>({text:activeJobText,context:window.__DRAFTED_JOBCONTEXT__}),getPages:()=>Number(editorPreviewEl.dataset.pageCount)||null,canReview:()=>!tailorInFlight&&!tailorReviewState&&!isPreviewingProposal&&!pendingProposal,
   render:()=>renderDocument(documentTextState),
   commit:(blocks,{operation,state})=>{
    if(!blocks.length)throw Error('At least one CV block must remain.');
    const keys=['groups','history','integrations','integrationHistory','languageApplications','languageHistory'];
    if(operation.action==='omit'){const saved=state.omitted.find(o=>o.block.blockId===operation.blockId);saved.ledger=Object.fromEntries(keys.map(k=>[k,deepClone(tailorSourceLedger[k].filter(g=>g.blockId===operation.blockId))]));for(const k of keys)tailorSourceLedger[k]=tailorSourceLedger[k].filter(g=>g.blockId!==operation.blockId);}
    if(operation.action==='restore'){const saved=cvSelectionState.omitted.find(o=>o.block.blockId===operation.blockId);
     const currentAnswers=discoveryController?.snapshot()?.session?.answers||[];
     const checkReferences=value=>{if(!value||typeof value!=='object')return;if(typeof value.answerId==='string'&&Number.isInteger(value.answerRevision)){const answer=currentAnswers.find(a=>a.id===value.answerId),revision=answer?.currentRevision??answer?.revisions?.at(-1)?.revision;if(revision!=null&&revision!==value.answerRevision)throw Error('This source answer changed. Revise the restoration against the current answer before accepting.');}for(const child of Object.values(value))checkReferences(child);};checkReferences(saved?.ledger);

     for(const k of keys)tailorSourceLedger[k].push(...deepClone(saved?.ledger?.[k]||[]));}

    buildStateFromBlocks(blocks,{preserveCanonical:true});discoveryController?.adoptRepresentation(documentBlocksState,cvVersionId);
   }});

  onReady(()=>{if(!window.DraftedWorkspacePages?.enabled)return;workspacePages=DraftedWorkspacePages.create({capture:captureWorkspace,restore:restoreWorkspace,commitJobDraft:async()=>{const next=jobAdInputEl.value;if(next===activeJobText)return;activeJobText=next;handleJobAdInput();clearJobContextDebounce();if(next.trim().length>=200)await runJobContextExtract();},sourceFile:()=>discoveryCvFile,portraitFile:()=>portraitController?.file(),adoptSource:file=>{discoveryCvFile=file;},showEditor:()=>{chatMessagesEl.scrollTop=workspaceReading.chat;editorPreviewEl.closest('.cv-document').scrollTop=workspaceReading.document;if(!window.DraftedWorkspacePages?.sample&&!coverageController?.model.restoreBlocked)coverageController?.sync();previewZoom?.open(cvVersionId);}});if(window.DraftedWorkspacePages.sample)workspacePages.ready.then(()=>{mountSampleChat();return window.DraftedDemoTour.create({host:chatMessagesEl,getState:captureWorkspace,getSelection:()=>[...selectedBlockIds]});});});
