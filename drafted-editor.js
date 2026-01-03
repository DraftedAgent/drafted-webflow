document.addEventListener("DOMContentLoaded", () => {
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
  const targetRoleInput = document.getElementById("target-role-input");

  const editorPreviewEl =
    document.getElementById("editor-preview-text") ||
    document.querySelector(".cv-document-text");

  const editorInput = document.getElementById("editor-input");
  const editorApplyBtn = document.getElementById("editor-send");        // Apply
  const editorChatBtn  = document.getElementById("editor-chat-send");   // Send (chat)
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
  editorPreviewEl.setAttribute("data-placeholder", "true");

  // Force buttons visually active (your UX choice)
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

    // State
    chatHistory.push({ role: role === "user" ? "user" : "assistant", content: msg });
    // Keep history bounded
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    // UI (optional)
    if (!chatMessagesEl) return;

    const wrap = document.createElement("div");
    wrap.className = role === "user" ? "chat-message user" : "chat-message ai";

    // Use textContent to avoid injection
    wrap.textContent = msg;

    chatMessagesEl.appendChild(wrap);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  function setApplyLabel() {
    if (!editorApplyBtn) return;
    editorApplyBtn.textContent = pendingProposal ? "Apply suggested changes" : "Apply";
  }

  
  /* ===============================
     STATE
     =============================== */
  let documentTextState = "";
  let documentBlocksState = null;
  let blockRangesById = {}; // kept because buildStateFromBlocks populates it (useful for debug)
  let documentTitle = "";
  let cvVersionId = null;

  // Selection state (multi blocks)
  let selectedBlockId = null;          // last clicked block (compat)
  let selectedBlockIds = new Set();    // MULTI
  let lastClickedBlockId = null;       // shift anchor

  let chatHistory = [];        // { role: "user"|"assistant", content: string }
  let pendingProposal = null;  // { cvVersionId, cvTitle, blocks, summaryOfChanges }

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

    // Title on top
    if (documentTitle) {
      htmlParts.push(`
<section class="cv-block cv-block--title">
  <h1 class="cv-title">${escapeHtml(documentTitle)}</h1>
</section>`.trim());
    }

    // helper: try to extract a "degree/title line" from education text
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
  console.log("EDU nameLine", { id, degree, program, nameLine });

  
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
    if (editorPreviewEl.getAttribute("data-placeholder") === "true") return;

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
  uploadBtn.addEventListener("click", async e => {
    e.preventDefault();

    const file = fileInput.files?.[0];
    if (!file) {
      alert("Välj en PDF först.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetRole", targetRoleInput?.value?.trim() || "");

    try {
      uploadBtn.disabled = true;

      const res = await fetch(N8N_UPLOAD_URL, { method: "POST", body: formData });
      const raw = await res.text();
      const data = JSON.parse(sanitizeLeadingGarbage(raw));

      const blocks = Array.isArray(data.blocks) ? data.blocks : null;

      const nextTitle = String(data.cvTitle || "").trim();
      if (nextTitle) documentTitle = nextTitle;

      const nextCvVersionId = String(data.cvVersionId || "").trim();
      cvVersionId = nextCvVersionId || cvVersionId || null;

      editorPreviewEl.removeAttribute("data-placeholder");
      setCvLoadedUI(true);

      if (blocks && blocks.length) {
        buildStateFromBlocks(blocks);
      } else {
        documentTextState = sanitizeLeadingGarbage(data.rewrittenCv || "");
        documentBlocksState = null;
        blockRangesById = {};
      }

      // reset selection / context
      selectedBlockId = null;
      selectedBlockIds = new Set();
      lastClickedBlockId = null;
      activeContext = "chat";

      renderDocument(documentTextState);
      clearNativeSelection();
      updateContextChip();

      // Reset chat UI + state for new CV
      if (chatMessagesEl) chatMessagesEl.innerHTML = "";
      chatHistory = [];
      pendingProposal = null;
      setApplyLabel();

      const greeting = "Here’s your first rewritten draft. What would you like to refine? For example: stronger achievement metrics, tighter structure, or clearer positioning for your target role.";
      appendChat("assistant", greeting);



    } catch (err) {
      console.error(err);
      alert("Fel vid uppladdning.");
    } finally {
      uploadBtn.disabled = false;
      forceButtonsActiveLook();
    }
  });

  /* ===============================
     CHAT SEND 
     =============================== */
   async function sendChat() {

     console.log("✅ sendChat(fetch) is running", { N8N_CHAT_URL });

  const msg = editorInput.value.trim();
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
    blocks: documentBlocksState,     // ALWAYS full list
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
    const data = JSON.parse(sanitizeLeadingGarbage(raw));

    if (!data.ok) {
      appendChat("assistant", data.error || "Chat error.");
      pendingProposal = null;
      setApplyLabel();
      return;
    }

    // 1) show assistant message first
    const assistantMsg = String(data.assistantMessage || "").trim() || "Okay.";
    appendChat("assistant", assistantMsg);

    // 2) store proposal (if any) + validate it's full blocks list
    if (data.proposal && Array.isArray(data.proposal.blocks) && data.proposal.blocks.length) {
      const proposedBlocks = data.proposal.blocks;

      if (proposedBlocks.length < (documentBlocksState?.length || 0)) {
        pendingProposal = null;
        appendChat("assistant", "I have suggestions, but couldn’t produce a complete patch. Try again with a more specific request.");
      } else {
        pendingProposal = data.proposal;
      }
    } else {
      pendingProposal = null;
    }

    setApplyLabel();

  } catch (err) {
    console.error(err);
    appendChat("assistant", "Something went wrong. Try again.");
    pendingProposal = null;
    setApplyLabel();
  } finally {
    setBusy(false);
    forceButtonsActiveLook();
  }
}


  /* ===============================
     APPLY (BLOCK-ONLY REWRITE)
     =============================== */
  async function sendApply() {
    // If we have a chat proposal, Apply should apply it instantly (no rewrite call)
    if (pendingProposal && Array.isArray(pendingProposal.blocks) && pendingProposal.blocks.length) {
      const nextBlocks = pendingProposal.blocks;

      const nextTitle = String(pendingProposal.cvTitle || "").trim();
      if (nextTitle) documentTitle = nextTitle;

      const nextCvVersionId = String(pendingProposal.cvVersionId || "").trim();
      if (nextCvVersionId) cvVersionId = nextCvVersionId;

      buildStateFromBlocks(nextBlocks);

      // Clear proposal after applying
      pendingProposal = null;
      setApplyLabel();

      // Keep current selection if ids still exist
      const nextIds = new Set(documentBlocksState.map(b => b.blockId));
      selectedBlockIds = new Set(Array.from(selectedBlockIds).filter(id => nextIds.has(id)));
      applySelectedBlocksUI();
      updateContextChip();

      renderDocument(documentTextState);
      clearNativeSelection();
      editorInput.value = "";

      appendChat("assistant", "Applied the suggested changes.");
      return;
    }

    
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
  blocks: documentBlocksState // ALWAYS send full list
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

      // Expect main-format response: cvTitle + blocks[]
      const nextBlocks = Array.isArray(data.blocks) ? data.blocks : null;
      if (!nextBlocks || !nextBlocks.length) {
        throw new Error("blocks missing in editor response");
      }

      const nextTitle = String(data.cvTitle || "").trim();
      if (nextTitle) documentTitle = nextTitle;

      const nextCvVersionId = String(data.cvVersionId || "").trim();
      if (nextCvVersionId) cvVersionId = nextCvVersionId;

      buildStateFromBlocks(nextBlocks);

      // keep selection if ids still exist
      const nextIds = new Set(documentBlocksState.map(b => b.blockId));
      selectedBlockIds = new Set(Array.from(selectedBlockIds).filter(id => nextIds.has(id)));

      if (selectedBlockIds.size === 0) {
        selectedBlockId = null;
        lastClickedBlockId = null;
        activeContext = "full"; // after a full rewrite, this makes sense
      } else {
        activeContext = "blocks";
        if (!selectedBlockId || !selectedBlockIds.has(selectedBlockId)) {
          // pick last from set
          selectedBlockId = Array.from(selectedBlockIds)[selectedBlockIds.size - 1];
        }
      }

      renderDocument(documentTextState);
      applySelectedBlocksUI();
      updateContextChip();
      clearNativeSelection();
      editorInput.value = "";
      pendingProposal = null;
      setApplyLabel();


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
