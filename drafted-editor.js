document.addEventListener("DOMContentLoaded", () => {
  console.log(
  "%cDrafted Editor loaded",
  "color:#18aa7f;font-weight:bold",
  "build=2026-01-03-1"
);

  console.log("DRAFTED_BUILD_CHECK", "upload-overlay-test", "2026-01-08-1");
  window.__DRAFTED_BUILD__ = "upload-overlay-test-2026-01-08-1";

  const N8N_UPLOAD_URL = "https://drafted.app.n8n.cloud/webhook/webflow-upload-cv";
  const N8N_EDITOR_URL = "https://drafted.app.n8n.cloud/webhook/webflow-editor-rewrite";
  const N8N_CHAT_URL = "https://drafted.app.n8n.cloud/webhook/webflow-chat-cv";


  
  /* ===============================
     ELEMENTS
     =============================== */
  const fileInput =
    document.querySelector("#cv-file-wrap input[type='file']") ||
    document.getElementById("cv-file") ||
    document.querySelector("input[type='file']");
  const uploadBtn = document.getElementById("upload-btn");
  const previewFrame = document.getElementById("cv-preview");
  const previewWrap = document.querySelector(".cv-preview-wrap");
  const editorDocument = document.querySelector(".cv-document"); 
  const editorPaper = document.querySelector(".cv-document-inner"); 
  
  console.log("previewWrap found:", !!previewWrap);

  // Original uploaded CV-preview (top one)
(function mountPreviewLoadingOverlayOnce() {
  if (!previewWrap) return;

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
          <div class="meta">This usually takes around 60 seconds. Keep this tab open.</div>
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
  editorPaper.classList.toggle("has-placeholder", !!isOn);
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

  setEditorProcessing(false);
  setEditorPlaceholder(true);
 
  const targetRoleInput = document.getElementById("target-role-input");
  const editorPreviewEl =
    document.getElementById("editor-preview-text") ||
    document.querySelector(".cv-document-text");
  const editorInput = document.getElementById("editor-input");
  const editorApplyBtn = document.getElementById("editor-send");       
  const editorChatBtn  = document.getElementById("editor-chat-send");   
  const contextChipEl  = document.getElementById("context-chip");
  const chatMessagesEl = document.querySelector(".chat-messages");

  // Hide these when a CV is loaded (add class "hide-when-cv-loaded" to both texts in Webflow)
  const hideWhenCvLoadedEls = document.querySelectorAll(".hide-when-cv-loaded");
  function setCvLoadedUI(isLoaded) {
    hideWhenCvLoadedEls.forEach(el => {
      el.style.display = isLoaded ? "none" : "";
    });
  }

  if (!fileInput || !uploadBtn || !editorPreviewEl || !editorInput || !editorApplyBtn || !contextChipEl) {
    console.error("❌ Missing required DOM elements", {
      fileInput: !!fileInput,
      uploadBtn: !!uploadBtn,
      editorPreviewEl: !!editorPreviewEl,
      editorInput: !!editorInput,
      editorApplyBtn: !!editorApplyBtn,
      contextChipEl: !!contextChipEl
    });
    return;
  }

  console.log("✅ Drafted editor loaded");
  editorPreviewEl.setAttribute("tabindex", "0");


  function forceButtonsActiveLook() {
    editorApplyBtn.disabled = false;
    editorApplyBtn.style.opacity = "1";
    editorApplyBtn.style.pointerEvents = "auto";

    if (editorChatBtn) {
      editorChatBtn.disabled = false;
      editorChatBtn.style.opacity = "1";
      editorChatBtn.style.pointerEvents = "auto";
    }
  }
  forceButtonsActiveLook();

  

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
              <div class="meta">This usually takes around 60 seconds. Keep this tab open.</div>
            </div>
          </div>
        </div>
      `;
      previewWrap.appendChild(overlay);
    }
    return overlay;
  }

  
  function setUploadLoading(isLoading) {
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
  
  let currentUrl = null;


  
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
    editorApplyBtn.disabled = isBusy;
    if (editorChatBtn) editorChatBtn.disabled = isBusy;
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

  
  function appendChat(role, text) {
  const msg = String(text || "").trim();
  if (!msg) return;

  chatHistory.push({ role: role === "user" ? "user" : "assistant", content: msg });
  if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

  // UI
  if (!chatMessagesEl) return;

  const wrap = document.createElement("div");
  const normalizedRole =
    role === "user" ? "user" :
    role === "system" ? "system" :
    "ai";

  wrap.className = `chat-message ${normalizedRole}`;

  // IMPORTANT: left aligned readability while keeping user bubble on right via CSS
  wrap.style.textAlign = "left";

  // Use textContent to avoid injection
  wrap.textContent = msg;

  chatMessagesEl.appendChild(wrap);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}


  
    /* ===============================
   PROPOSAL CARD UI (WITH LOADING)
   =============================== */
let isGeneratingSuggestionPreview = false; 

  
function appendProposalCard(meta) {
  if (!chatMessagesEl) return;

  const hasProposal = !!(pendingProposal && Array.isArray(pendingProposal.blocks) && pendingProposal.blocks.length);
  const hasSuggestion = !!(pendingSuggestion && pendingSuggestion.instruction);

  if (!hasProposal && !hasSuggestion) return;

  const changedCount = (meta?.changedBlockIds || []).length;
  const summary = Array.isArray(meta?.summaryOfChanges) ? meta.summaryOfChanges : [];
  const wrap = document.createElement("div");
  wrap.className = "chat-message ai drafted-proposal-card";
  wrap.style.textAlign = "left";
  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.textContent = hasProposal
    ? `Suggestion ready (${changedCount} block${changedCount === 1 ? "" : "s"})`
    : "Suggestion ready";

  const sub = document.createElement("div");
  sub.style.opacity = "0.85";
  sub.style.marginTop = "6px";
  sub.textContent = hasProposal
    ? "Preview it first, then Apply to make changes. Or Dismiss."
    : "Preview will generate a draft. Then Apply or Dismiss.";

  wrap.appendChild(title);
  wrap.appendChild(sub);

  if (summary.length) {
    const ul = document.createElement("ul");
    ul.style.margin = "10px 0 0 18px";
    ul.style.padding = "0";
    ul.style.opacity = "0.9";

    summary.slice(0, 3).forEach(s => {
      const li = document.createElement("li");
      li.textContent = String(s || "").trim();
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
  }

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  btnRow.style.marginTop = "12px";

  
  function makeBtn(label, { busy = false } = {}) {
    const btn = document.createElement("button");
    btn.type = "button";

    const spinner = document.createElement("span");
    spinner.className = "drafted-btn-spinner";
    spinner.hidden = !busy;

    const txt = document.createElement("span");
    txt.textContent = label;

    btn.appendChild(spinner);
    btn.appendChild(txt);

    if (busy) btn.disabled = true;

    return { btn, spinner, txt };
  }

  const previewLabel = isPreviewingProposal
    ? "Exit preview"
    : (isGeneratingSuggestionPreview ? "Generating preview…" : "Preview");

  const applyLabel = isGeneratingSuggestionPreview ? "Applying…" : "Apply";
  const { btn: btnPreview, spinner: spPreview } = makeBtn(previewLabel, { busy: isGeneratingSuggestionPreview });
  const { btn: btnApply, spinner: spApply } = makeBtn(applyLabel, { busy: isGeneratingSuggestionPreview });
  const btnDismiss = document.createElement("button");
  btnDismiss.type = "button";
  btnDismiss.textContent = "Dismiss";
  btnDismiss.disabled = !!isGeneratingSuggestionPreview;

  btnPreview.addEventListener("click", async () => {
    await handlePreviewClick();
  });

  btnApply.addEventListener("click", async () => {
    await handleApplyClick();
  });

  btnDismiss.addEventListener("click", () => {
    dismissProposal();
  });

  // If we're previewing already, Preview button should not show spinner
  if (isPreviewingProposal) {
    spPreview.hidden = true;
    btnPreview.disabled = false;
  }

  btnRow.appendChild(btnPreview);
  btnRow.appendChild(btnApply);
  btnRow.appendChild(btnDismiss);
  wrap.appendChild(btnRow);
  chatMessagesEl.appendChild(wrap);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}


  function clearAllProposalCards() {
  if (!chatMessagesEl) return;
  chatMessagesEl.querySelectorAll(".drafted-proposal-card").forEach(el => el.remove());
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
  let cvVersionId = null;
  let selectedBlockId = null;          // last clicked block (compat)
  let selectedBlockIds = new Set();  
  let lastClickedBlockId = null;       // shift anchor
  let chatHistory = [];        // { role: "user"|"assistant", content: string }
  let pendingProposal = null;      // { cvVersionId, cvTitle, blocks, summaryOfChanges? }
  let pendingProposalMeta = null;  // { changedBlockIds: [], summaryOfChanges: [] }
  let pendingSuggestion = null;    // { mode:"blocks|full", selectedBlockIds:[], instruction:"..." }
  let isPreviewingProposal = false;
  let previewSnapshot = null;

  
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
  let documentLanguage = "sv"; // "sv" | "en"

  
  function t(key) {
    const dict = {
      sv: {
        education: "Utbildningar",
        experience: "Erfarenheter"
      },
      en: {
        education: "Education",
        experience: "Experience"
      }
    };
    return (dict[documentLanguage] && dict[documentLanguage][key]) || (dict.sv[key] || key);
  }


  
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
      const el = editorPreviewEl.querySelector(`.cv-block[data-block-id="${CSS.escape(id)}"]`);
      if (el) el.classList.add("is-selected");
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
    const ids = blocks.map(b => b.getAttribute("data-block-id")).filter(Boolean);
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

  
  function getSelectedBlocksPreview(maxChars = 110) {
    if (!documentBlocksState || !documentBlocksState.length) return "";

    const selected = documentBlocksState.filter(b => selectedBlockIds.has(b.blockId));
    if (!selected.length) return "";

    const parts = [];
    for (const b of selected.slice(0, 2)) {
      const tt = stripLeakedFields(String(b.text || "")).replace(/\s+/g, " ").trim();
      if (tt) parts.push(tt);
    }

    const joined = parts.join(" / ").trim();
    if (!joined) return "";
    return joined.length > maxChars ? joined.slice(0, maxChars) + "…" : joined;
  }


  
  /* ===============================
     BUILD STATE FROM BLOCKS
     =============================== */
  function buildStateFromBlocks(blocks) {
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
      const rawText = stripLeakedFields(block.text ? String(block.text).trim() : "");

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
  function renderBlocksHtml(fullText) {
    if (!documentBlocksState || !documentBlocksState.length) {
      return escapeHtml(String(fullText || ""));
    }

    const htmlParts = [];
    let educationHeadingRendered = false;
    let experienceHeadingRendered = false;

    if (documentTitle) {
      htmlParts.push(`
<section class="cv-block cv-block--title">
  <h1 class="cv-title">${escapeHtml(documentTitle)}</h1>
</section>`.trim());
    }

  
    function extractEducationNameFromText(rawText) {
      const text = String(rawText || "").trim();
      if (!text) return { name: "", rest: "" };

      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) return { name: "", rest: text };

      const first = (lines[0] || "").replace(/^[-•\u2022]+\s*/, "").trim();
      const firstNorm = normLite(first);

      const banned = ["utbildning", "utbildningar", "education"];
      if (!first || banned.includes(firstNorm)) return { name: "", rest: text };

      if (first.length <= 80) {
        const rest = lines.slice(1).join("\n").trim();
        return { name: first, rest };
      }

      return { name: "", rest: text };
    }

    for (const block of documentBlocksState) {
      const id   = String(block.blockId || "");
      const type = String(block.type || "block");
      const rawText = String(block.text || "").trim();

      // ===== SUMMARY =====
      if (type === "summary") {
        const text = stripLeakedFields(rawText);
        if (!text) continue;

        htmlParts.push(`
<section class="cv-block cv-block--summary" data-block-id="${escapeHtml(id)}">
  <div class="cv-block-body">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
</section>`.trim());
        continue;
      }

      // ===== EXPERIENCE =====
      if (type === "experience") {
        if (!experienceHeadingRendered) {
          htmlParts.push(`
<section class="cv-section cv-section--experience">
  <h2 class="cv-section-heading">${escapeHtml(t("experience"))}</h2>
</section>`.trim());
          experienceHeadingRendered = true;
        }

        const title     = String(block.title || "").trim();
        const employer  = String(block.employer || "").trim();
        const startDate = String(block.startDate || "").trim();
        const endDate   = String(block.endDate || "").trim();

        const cleanText = stripFirstLineIfDuplicate(rawText, title, employer, startDate, endDate);

        let metaPieces = [];
        if (employer) metaPieces.push(`<span class="cv-exp-company">${escapeHtml(employer)}</span>`);

        if (startDate || endDate) {
          const period = `${startDate || ""}${(startDate || endDate) ? " – " : ""}${endDate || ""}`;
          metaPieces.push(`<span class="cv-exp-period">(${escapeHtml(period)})</span>`);
        }

        const metaLine = metaPieces.length
          ? `<div class="cv-exp-meta">${metaPieces.join(" ")}</div>`
          : "";

        const bodyHtml = cleanText
          ? escapeHtml(cleanText).replace(/\n/g, "<br>")
          : "";

        htmlParts.push(`
<section class="cv-block cv-block--experience" data-block-id="${escapeHtml(id)}">
  ${title ? `<div class="cv-exp-title">${escapeHtml(title)}</div>` : ""}
  ${metaLine}
  ${bodyHtml ? `<div class="cv-block-body">${bodyHtml}</div>` : ""}
</section>`.trim());
        continue;
      }

      // ===== EDUCATION =====
if (type === "education") {
  if (!educationHeadingRendered) {
    htmlParts.push(`
<section class="cv-section cv-section--education">
  <h2 class="cv-section-heading">${escapeHtml(t("education"))}</h2>
</section>`.trim());
    educationHeadingRendered = true;
  }

  const degree      = String(block.degree || "").trim();
  const program     = String(block.program || "").trim();
  const institution = String(block.institution || "").trim();
  const startDate   = String(block.startDate || "").trim();
  const endDate     = String(block.endDate || "").trim();

  // Line 1: Degree + Program (or whichever exists)
  const nameLine =
  (degree && program) ? `${degree}, ${program}` :
  (degree || program);

  const debugLine = `DEBUG: [${degree}] + [${program}] => [${nameLine}]`;
  
  // Line 2: Institution + Period
  let metaPieces = [];
  if (institution) metaPieces.push(`<span class="cv-edu-inst">${escapeHtml(institution)}</span>`);
  if (startDate || endDate) {
    const period = `${startDate || ""}${(startDate || endDate) ? " – " : ""}${endDate || ""}`;
    metaPieces.push(`<span class="cv-edu-period">(${escapeHtml(period)})</span>`);
  }
  const metaLine = metaPieces.length
    ? `<div class="cv-edu-meta">${metaPieces.join(" ")}</div>`
    : "";

  // Line 3: Description text
  const cleanText = stripFirstLineIfDuplicate(rawText, nameLine, institution, startDate, endDate);
  const bodyHtml = cleanText
    ? `<div class="cv-block-body">${escapeHtml(cleanText).replace(/\n/g, "<br>")}</div>`
    : "";

  // Skip only if truly empty
  if (!nameLine && !institution && !cleanText) continue;

  htmlParts.push(`
<section class="cv-block cv-block--education" data-block-id="${escapeHtml(id)}">
  ${nameLine ? `<div class="cv-edu-degree">${escapeHtml(nameLine)}</div>` : ""}
  ${metaLine}
  ${bodyHtml}
</section>`.trim());
  continue;
}

      // ===== SKILLS =====
      if (type === "skills") {
        const text = stripLeakedFields(rawText);
        if (!text) continue;

        htmlParts.push(`
<section class="cv-block cv-block--skills" data-block-id="${escapeHtml(id)}">
  <h2 class="cv-block-heading">Kompetenser</h2>
  <div class="cv-block-body">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
</section>`.trim());
        continue;
      }

      // ===== LANGUAGES =====
      if (type === "languages") {
        const text = stripLeakedFields(rawText);
        if (!text) continue;

        htmlParts.push(`
<section class="cv-block cv-block--languages" data-block-id="${escapeHtml(id)}">
  <h2 class="cv-block-heading">Språk</h2>
  <div class="cv-block-body">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
</section>`.trim());
        continue;
      }

      // ===== Fallback =====
      const text = stripLeakedFields(rawText);
      if (!text) continue;

      htmlParts.push(`
<section class="cv-block" data-block-id="${escapeHtml(id)}">
  <div class="cv-block-body">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
</section>`.trim());
    }

    return htmlParts.join("\n");
  }

  function renderDocument(text) {
    const safeText = String(text || "");
    editorPreviewEl.style.whiteSpace = "pre-wrap";

    if (documentBlocksState && documentBlocksState.length) {
      editorPreviewEl.innerHTML = renderBlocksHtml(safeText);
      applySelectedBlocksUI();
      return;
    }

    editorPreviewEl.innerHTML = escapeHtml(safeText);
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

  const mode = (pendingSuggestion.mode === "full") ? "full" : "blocks";
  const instruction = String(pendingSuggestion.instruction || "").trim();

  const selectedIds =
    mode === "blocks"
      ? (Array.isArray(pendingSuggestion.selectedBlockIds) && pendingSuggestion.selectedBlockIds.length
          ? pendingSuggestion.selectedBlockIds.map(String)
          : Array.from(selectedBlockIds))
      : [];

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

    const res = await fetch(N8N_EDITOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const raw = await res.text();
    const data = JSON.parse(sanitizeLeadingGarbage(raw));

    if (!data.ok) {
      return { ok: false, error: data.error || "Rewrite flow error" };
    }

    const nextBlocks = Array.isArray(data.blocks) ? data.blocks : null;
    if (!nextBlocks || !nextBlocks.length) {
      return { ok: false, error: "Rewrite flow returned no blocks" };
    }

    const nextTitle = String(data.cvTitle || "").trim() || (documentTitle || "");
    const nextCvVersionId = String(data.cvVersionId || "").trim() || (cvVersionId || null);
    const changedFromServer = Array.isArray(data.changedBlockIds) ? data.changedBlockIds.map(String) : null;
    const changedLocal = computeChangedBlockIds(documentBlocksState, nextBlocks);
    const changedBlockIds = (changedFromServer && changedFromServer.length) ? changedFromServer : changedLocal;

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
      changedBlockIds,
      summaryOfChanges: summary
    };

    if (commitImmediately) {
      applyProposal();
    }

    return { ok: true };

  } catch (e) {
    console.error(e);
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
     CONTEXT CHIP (BLOCK-ONLY)
     =============================== */
  function setChipMode(mode) {
    contextChipEl.classList.remove("chip--chat", "chip--full", "chip--selection", "chip--blocks");
    if (mode === "blocks") contextChipEl.classList.add("chip--blocks");
    else if (mode === "full") contextChipEl.classList.add("chip--full");
    else contextChipEl.classList.add("chip--chat");
  }

  function updateContextChip() {
    const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
    const selectedCount = selectedBlockIds?.size || 0;

    if (hasBlocks && selectedCount > 0) {
      const preview = getSelectedBlocksPreview(110);

      contextChipEl.innerHTML = `
        <span><strong>Selected blocks</strong></span>
        <span class="meta">${selectedCount}</span>
        ${preview ? `<span class="meta">"${escapeHtml(preview)}"</span>` : ""}
        <button type="button" id="chip-clear">Clear</button>
        <button type="button" id="chip-full">Use full CV</button>
      `;
      contextChipEl.classList.remove("is-hidden");
      setChipMode("blocks");

      contextChipEl.querySelector("#chip-clear")?.addEventListener("click", () => {
        clearBlockSelection("chat");
      });

      contextChipEl.querySelector("#chip-full")?.addEventListener("click", () => {
        clearBlockSelection("full");
      });

      return;
    }

    if (activeContext === "full") {
      contextChipEl.innerHTML = `
        <span><strong>Full CV</strong></span>
        <span class="meta">Applies changes to the whole document</span>
        <button type="button" id="chip-chat">Chat only</button>
      `;
      contextChipEl.classList.remove("is-hidden");
      setChipMode("full");

      contextChipEl.querySelector("#chip-chat")?.addEventListener("click", () => {
        activeContext = "chat";
        updateContextChip();
      });

      return;
    }

    contextChipEl.innerHTML = `
      <span><strong>Chat</strong></span>
      <span class="meta">No CV changes</span>
      <button type="button" id="chip-full">Use full CV</button>
    `;
    contextChipEl.classList.remove("is-hidden");
    setChipMode("chat");

    contextChipEl.querySelector("#chip-full")?.addEventListener("click", () => {
      activeContext = "full";
      updateContextChip();
    });
  }


  
  /* ===============================
     BLOCK CLICK SELECTION (MULTI)
     =============================== */
  editorPreviewEl.addEventListener("click", (e) => {
    if (!documentBlocksState || !documentBlocksState.length) return;

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
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(file);

    if (previewFrame) previewFrame.src = currentUrl;
    previewWrap?.classList.add("has-file");
  });


  
  /* ===============================
     UPLOAD -> RENDER (MAIN FLOW)
     =============================== */
  uploadBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  console.log("UPLOAD CLICKED");

  const file = fileInput.files?.[0];
  if (!file) {
    alert("Välj en PDF först.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetRole", targetRoleInput?.value?.trim() || "");

  try {
    setUploadLoading(true);
    setEditorPlaceholder(false);
    setEditorProcessing(true);

    const res = await fetch(N8N_UPLOAD_URL, { method: "POST", body: formData });
    const raw = await res.text();

    // Hard fail if server responded with error (you want to know)
    if (!res.ok) {
      console.error("Upload failed:", res.status, raw);
      throw new Error("Upload failed: " + res.status);
    }

    const data = JSON.parse(sanitizeLeadingGarbage(raw));

    const blocks = Array.isArray(data.blocks) ? data.blocks : null;

    const nextTitle = String(data.cvTitle || "").trim();
    if (nextTitle) documentTitle = nextTitle;

    const nextCvVersionId = String(data.cvVersionId || "").trim();
    cvVersionId = nextCvVersionId || cvVersionId || null;

    setCvLoadedUI(true);

    editorPreviewEl.textContent = "";

    if (blocks && blocks.length) {
      buildStateFromBlocks(blocks);
    } else {
      documentTextState = sanitizeLeadingGarbage(data.rewrittenCv || "");
      documentBlocksState = null;
      blockRangesById = {};
    }

    selectedBlockId = null;
    selectedBlockIds = new Set();
    lastClickedBlockId = null;
    activeContext = "chat";

    renderDocument(documentTextState);
    clearNativeSelection();
    updateContextChip();

    if (chatMessagesEl) chatMessagesEl.innerHTML = "";
    chatHistory = [];
    pendingProposal = null;
    pendingProposalMeta = null;
    isPreviewingProposal = false;
    previewSnapshot = null;
    clearAllProposalCards();
    setApplyLabel();

    const greeting =
      "Here’s your first rewritten draft. What would you like to refine? For example: stronger achievement metrics, tighter structure, or clearer positioning for your target role.";
    appendChat("assistant", greeting);
  } catch (err) {
    console.error(err);

    // Error UI state (but do NOT touch processing here)
    setEditorPlaceholder(true);

    alert("Fel vid uppladdning.");
  } finally {
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

  function applyProposal() {
  if (!pendingProposal?.blocks?.length) return;

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
  editorInput.value = "";

  clearAllProposalCards();
  setApplyLabel();
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

async function sendChat() {
  // Hard guard: Webflow can still fire handlers even if UI looks disabled
  if (editorPaper && editorPaper.classList.contains("is-processing")) {
    console.log("⛔ sendChat blocked: editor is processing");
    return;
  }

  console.log("✅ sendChat(fetch) is running", { N8N_CHAT_URL });

  const msg = (editorInput?.value || "").trim();
  if (!msg) return;

  const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
  if (!hasBlocks) {
    appendChat("assistant", "Upload a CV first so I can suggest improvements.");
    return;
  }

  appendChat("user", msg);
  editorInput.value = "";

  const mode =
    (selectedBlockIds.size > 0) ? "blocks" :
    (activeContext === "full") ? "full" :
    "chat";

  const payload = {
    cvVersionId: cvVersionId || null,
    cvTitle: documentTitle || "",
    targetRole: targetRoleInput?.value?.trim() || "",
    language: documentLanguage || "sv",
    mode,
    selectedBlockIds: mode === "blocks" ? Array.from(selectedBlockIds) : [],
    blocks: documentBlocksState, // chat flow may trim internally but we send full list
    history: chatHistory.slice(-12),
    message: msg
  };

  try {
    setBusy(true);

    const res = await fetch(N8N_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const raw = await res.text();
    console.log("CHAT_RAW", raw.slice(0, 1200));

    if (!res.ok) {
      console.error("Chat failed:", res.status, raw);
      appendChat("assistant", "Chat error. Try again.");
      pendingProposal = null;
      pendingProposalMeta = null;
      pendingSuggestion = null;
      clearAllProposalCards();
      setApplyLabel();
      return;
    }

    const data = JSON.parse(sanitizeLeadingGarbage(raw));

    if (!data.ok) {
      appendChat("assistant", data.error || "Chat error.");
      pendingProposal = null;
      pendingProposalMeta = null;
      pendingSuggestion = null;
      clearAllProposalCards();
      setApplyLabel();
      return;
    }

    const assistantMsg = String(data.assistantMessage || "").trim() || "Okay.";
    appendChat("assistant", assistantMsg);

    // reset pending states
    pendingProposal = null;
    pendingProposalMeta = null;
    pendingSuggestion = null;
    isPreviewingProposal = false;
    previewSnapshot = null;

    const intent = String(data.intent || "").trim().toLowerCase();

    // Legacy proposal support (if you ever re-enable it)
    if (
      intent === "proposal" &&
      data.proposal &&
      Array.isArray(data.proposal.blocks) &&
      data.proposal.blocks.length
    ) {
      pendingProposal = data.proposal;
      pendingProposalMeta = {
        changedBlockIds: Array.isArray(data.changedBlockIds) ? data.changedBlockIds : [],
        summaryOfChanges: Array.isArray(data.proposal.summaryOfChanges) ? data.proposal.summaryOfChanges : []
      };
      clearAllProposalCards();
      appendProposalCard(pendingProposalMeta);
      setApplyLabel();
      return;
    }

    // New suggestion support
    if (intent === "suggestion" && data.suggestion && typeof data.suggestion === "object") {
      const sugMode = String(data.suggestion.mode || "").toLowerCase();
      const sugInstruction = String(data.suggestion.instruction || "").trim();
      const sugIds = Array.isArray(data.suggestion.selectedBlockIds)
        ? data.suggestion.selectedBlockIds.map(String)
        : [];

      if (!sugInstruction) {
        clearAllProposalCards();
        setApplyLabel();
        return;
      }

      pendingSuggestion = {
        mode: (sugMode === "blocks" || sugMode === "full") ? sugMode : "blocks",
        selectedBlockIds: sugIds,
        instruction: sugInstruction
      };

      pendingProposalMeta = {
        changedBlockIds: sugIds,
        summaryOfChanges: [sugInstruction]
      };

      clearAllProposalCards();
      appendProposalCard(pendingProposalMeta);
      setApplyLabel();
      return;
    }

    clearAllProposalCards();
    setApplyLabel();

  } catch (err) {
    console.error(err);
    appendChat("assistant", "Something went wrong. Try again.");
    pendingProposal = null;
    pendingProposalMeta = null;
    pendingSuggestion = null;
    clearAllProposalCards();
    setApplyLabel();
  } finally {
    setBusy(false);
    forceButtonsActiveLook();
  }
}



  /* ===============================
   COMMAND BAR LOCK (processing)
   =============================== */

const EDITOR_PLACEHOLDER_DEFAULT =
  (editorInput && editorInput.getAttribute("placeholder")) || "Write a message…";
const EDITOR_PLACEHOLDER_PROCESSING = "Working on your draft…";

  
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
    btn.disabled = locked;
    btn.setAttribute("aria-disabled", locked ? "true" : "false");
    btn.classList.toggle("is-locked", locked);
  });

  const row = document.querySelector(".chat-input-row");
  if (row) row.classList.toggle("is-locked", locked);
}



  /* ===============================
   APPLY BUTTON (main Apply)
   =============================== */
async function sendApply() {
  // If preview/proposal exists, apply locally
  if (pendingProposal && Array.isArray(pendingProposal.blocks) && pendingProposal.blocks.length) {
    applyProposal();
    return;
  }

  // If suggestion exists but no proposal yet, generate+apply via rewrite flow
  if (pendingSuggestion && pendingSuggestion.instruction) {
    const r = await fetchProposalFromSuggestion({ commitImmediately: true });
    if (!r.ok) {
      appendChat("assistant", r.error || "Could not apply suggestion.");
    }
    return;
  }

  // Default: use editor input as instruction and call rewrite flow
  const instruction = editorInput.value.trim();
  if (!instruction) {
    alert("Skriv en instruktion först.");
    return;
  }

  const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
  if (!hasBlocks) {
    alert("Ladda upp ett CV först (block saknas).");
    return;
  }

  const hasSelectedBlocks = selectedBlockIds.size > 0;
  const mode = hasSelectedBlocks ? "blocks" : "full";

  const payload = {
    mode,
    instruction,
    targetRole: targetRoleInput?.value?.trim() || "",
    cvVersionId: cvVersionId || null,
    cvTitle: documentTitle || "",
    selectedBlockIds: mode === "blocks" ? Array.from(selectedBlockIds) : [],
    blocks: documentBlocksState
  };

  try {
    setBusy(true);

    const res = await fetch(N8N_EDITOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const raw = await res.text();
    const data = JSON.parse(sanitizeLeadingGarbage(raw));

    if (!data.ok) {
      console.error("n8n error:", data);
      alert(data.error || "n8n error");
      return;
    }

    const nextBlocks = Array.isArray(data.blocks) ? data.blocks : null;
    if (!nextBlocks || !nextBlocks.length) throw new Error("blocks missing in editor response");

    const nextTitle = String(data.cvTitle || "").trim();
    if (nextTitle) documentTitle = nextTitle;

    const nextCvVersionId = String(data.cvVersionId || "").trim();
    if (nextCvVersionId) cvVersionId = nextCvVersionId;

    buildStateFromBlocks(nextBlocks);

    const nextIds = new Set(documentBlocksState.map(b => b.blockId));
    selectedBlockIds = new Set(Array.from(selectedBlockIds).filter(id => nextIds.has(id)));

    pendingSuggestion = null;
    pendingProposal = null;
    pendingProposalMeta = null;
    isPreviewingProposal = false;
    previewSnapshot = null;

    clearAllProposalCards();
    setApplyLabel();

    renderDocument(documentTextState);
    applySelectedBlocksUI();
    updateContextChip();
    clearNativeSelection();
    editorInput.value = "";

  } catch (err) {
    console.error(err);
    alert("Apply-fel.");
  } finally {
    setBusy(false);
    forceButtonsActiveLook();
  }
}

  editorApplyBtn.addEventListener("click", e => {
    e.preventDefault();
    sendApply();
  });

    if (editorChatBtn) {
    editorChatBtn.addEventListener("click", e => {
      e.preventDefault();
      sendChat();
    });
  }

    editorInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Prefer chat on Enter
      sendChat();
    }
  });

  window.addEventListener("beforeunload", () => {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
  });

  /* ===============================
     INITIAL
     =============================== */
  setCvLoadedUI(false);
  renderDocument("");
  updateContextChip();
  setApplyLabel();
});
