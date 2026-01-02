document.addEventListener("DOMContentLoaded", () => {
  const N8N_UPLOAD_URL = "https://drafted.app.n8n.cloud/webhook/webflow-upload-cv";
  const N8N_EDITOR_URL = "https://drafted.app.n8n.cloud/webhook/webflow-editor-rewrite";

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

  // Force buttons visually active
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
  const FORBIDDEN_PREFIX_RE = /^(employer|title|startDate|endDate|degree|institution|order|type|label|blockId)\s*:\s*/i;

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

  /* ===============================
     STATE
     =============================== */
  let documentTextState = "";
  let documentBlocksState = null;
  let blockRangesById = {};
  let documentTitle = "";

  // Selection state (multi blocks)
  let pinnedSelection = null;
  let selectedBlockId = null;          // last clicked block (compat)
  let selectedBlockIds = new Set();    // MULTI
  let lastClickedBlockId = null;       // shift anchor

  let activeContext = "chat"; // "chat" | "selection" | "full"
  let lastSelectionKey = "";

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

    pinnedSelection = null;
    lastSelectionKey = "";

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
      const t = stripLeakedFields(String(b.text || "")).replace(/\s+/g, " ").trim();
      if (t) parts.push(t);
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

    if (documentTitle) {
      htmlParts.push(`
<section class="cv-block cv-block--title">
  <h1 class="cv-title">${escapeHtml(documentTitle)}</h1>
</section>`.trim());
    }

    for (const block of documentBlocksState) {
      const id   = String(block.blockId || "");
      const type = String(block.type || "block");
      const rawText = String(block.text || "").trim();

      if (type === "summary") {
        const text = stripLeakedFields(rawText);
        if (!text) continue;

        htmlParts.push(`
<section class="cv-block cv-block--summary" data-block-id="${escapeHtml(id)}">
  <div class="cv-block-body">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
</section>`.trim());
        continue;
      }

      if (type === "experience") {
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

      if (type === "education") {
        const degree      = String(block.degree || "").trim();
        const institution = String(block.institution || "").trim();
        const startDate   = String(block.startDate || "").trim();
        const endDate     = String(block.endDate || "").trim();

        const cleanText = stripFirstLineIfDuplicate(rawText, degree, institution, startDate, endDate);

        if (!cleanText && !degree && !institution) continue;

        const headingHtml = !educationHeadingRendered
          ? `<h2 class="cv-block-heading">Utbildning</h2>`
          : "";
        educationHeadingRendered = true;

        let metaPieces = [];
        if (institution) metaPieces.push(`<span class="cv-edu-inst">${escapeHtml(institution)}</span>`);
        if (startDate || endDate) {
          const period = `${startDate || ""}${(startDate || endDate) ? " – " : ""}${endDate || ""}`;
          metaPieces.push(`<span class="cv-edu-period">(${escapeHtml(period)})</span>`);
        }

        const metaLine = metaPieces.length
          ? `<div class="cv-edu-meta">${metaPieces.join(" ")}</div>`
          : "";

        const bodyHtml = cleanText
          ? `<div class="cv-block-body">${escapeHtml(cleanText).replace(/\n/g, "<br>")}</div>`
          : "";

        htmlParts.push(`
<section class="cv-block cv-block--education" data-block-id="${escapeHtml(id)}">
  ${headingHtml}
  ${degree ? `<div class="cv-edu-degree">${escapeHtml(degree)}</div>` : ""}
  ${metaLine}
  ${bodyHtml}
</section>`.trim());
        continue;
      }

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

      const text = stripLeakedFields(rawText);
      if (!text) continue;
      htmlParts.push(`
<section class="cv-block" data-block-id="${escapeHtml(id)}">
  <div class="cv-block-body">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
</section>`.trim());
    }

    return htmlParts.join("\n");
  }

  function renderDocument(text, pinnedSel) {
    const safeText = String(text || "");
    editorPreviewEl.style.whiteSpace = "pre-wrap";

    if (documentBlocksState && documentBlocksState.length) {
      editorPreviewEl.innerHTML = renderBlocksHtml(safeText);
      applySelectedBlocksUI();
      return;
    }

    if (pinnedSel && typeof pinnedSel.startIndex === "number" && typeof pinnedSel.endIndex === "number") {
      const start = Math.max(0, Math.min(safeText.length, pinnedSel.startIndex));
      const end = Math.max(0, Math.min(safeText.length, pinnedSel.endIndex));
      if (end <= start) {
        editorPreviewEl.innerHTML = escapeHtml(safeText);
        return;
      }

      const before = safeText.slice(0, start);
      const selected = safeText.slice(start, end);
      const after = safeText.slice(end);

      editorPreviewEl.innerHTML =
        escapeHtml(before) +
        `<span class="drafted-highlight" data-drafted-highlight="1">` +
        escapeHtml(selected) +
        `</span>` +
        escapeHtml(after);

      return;
    }

    editorPreviewEl.innerHTML = escapeHtml(safeText);
  }

  /* ===============================
     LEGACY TEXT SELECTION HELPERS
     =============================== */
  function clampRange(text, startIndex, endIndex) {
    const len = text.length;
    const s = Math.max(0, Math.min(len, startIndex));
    const e = Math.max(0, Math.min(len, endIndex));
    return { start: Math.min(s, e), end: Math.max(s, e) };
  }

  function snapToParagraphOrLine(text, startIndex, endIndex) {
    const { start, end } = clampRange(text, startIndex, endIndex);
    if (start === end) return { start, end };

    const before = text.slice(0, start);
    const after = text.slice(end);

    let paraStart = 0;
    {
      const matches = before.matchAll(/\n\s*\n/g);
      let last = null;
      for (const m of matches) last = m;
      if (last) paraStart = last.index + last[0].length;
    }

    let paraEnd = text.length;
    {
      const m = after.match(/\n\s*\n/);
      if (m && typeof m.index === "number") paraEnd = end + m.index;
    }

    const paragraphLooksValid =
      !(paraStart === 0 && paraEnd === text.length) &&
      paraEnd > paraStart;

    if (paragraphLooksValid) return { start: paraStart, end: paraEnd };

    const blockStart = text.lastIndexOf("\n", start - 1) + 1;
    let blockEnd = text.indexOf("\n", end);
    if (blockEnd === -1) blockEnd = text.length;

    return { start: blockStart, end: blockEnd };
  }

  function buildPinnedSelectionForRange(fullText, startIndex, endIndex, snap = true) {
    const { start, end } = snap
      ? snapToParagraphOrLine(fullText, startIndex, endIndex)
      : clampRange(fullText, startIndex, endIndex);

    const CONTEXT_CHARS = 600;

    return {
      startIndex: start,
      endIndex: end,
      selectedText: fullText.slice(start, end),
      contextBefore: fullText.slice(Math.max(0, start - CONTEXT_CHARS), start),
      contextAfter: fullText.slice(end, Math.min(fullText.length, end + CONTEXT_CHARS))
    };
  }

  function isSelectionInside(el, selection) {
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    const common = range.commonAncestorContainer;
    const node = common.nodeType === Node.ELEMENT_NODE ? common : common.parentElement;
    return !!node && el.contains(node);
  }

  function getTextNodesUnder(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: node =>
        node.nodeValue && node.nodeValue.length
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  function getNodeTextOffset(root, targetNode, targetOffset) {
    const textNodes = getTextNodesUnder(root);
    let offset = 0;
    for (const node of textNodes) {
      if (node === targetNode) return offset + targetOffset;
      offset += node.nodeValue.length;
    }
    return null;
  }

  function getSelectionPayload(root) {
    // When blocks exist: use click selection instead
    if (documentBlocksState && documentBlocksState.length) return null;
    if (root.getAttribute("data-placeholder") === "true") return null;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    if (!isSelectionInside(root, sel)) return null;

    const range = sel.getRangeAt(0);
    if (range.collapsed) return null;

    const startAbs = getNodeTextOffset(root, range.startContainer, range.startOffset);
    const endAbs = getNodeTextOffset(root, range.endContainer, range.endOffset);
    if (startAbs == null || endAbs == null) return null;

    const rawStart = Math.min(startAbs, endAbs);
    const rawEnd = Math.max(startAbs, endAbs);

    const fullText = documentTextState || (root.textContent || "");
    const rawSelected = fullText.slice(rawStart, rawEnd);
    if (!rawSelected.trim()) return null;

    const snapped = buildPinnedSelectionForRange(fullText, rawStart, rawEnd, true);
    if (!snapped.selectedText.trim()) return null;

    return snapped;
  }

  /* ===============================
     CONTEXT CHIP (NO :has)
     =============================== */
  function setChipMode(mode) {
    contextChipEl.classList.remove("chip--chat", "chip--full", "chip--selection");
    if (mode === "selection") contextChipEl.classList.add("chip--selection");
    else if (mode === "full") contextChipEl.classList.add("chip--full");
    else contextChipEl.classList.add("chip--chat");
  }

  function clearSelectionState(setContextTo = "chat") {
    pinnedSelection = null;
    selectedBlockId = null;
    selectedBlockIds = new Set();
    lastClickedBlockId = null;
    lastSelectionKey = "";
    renderDocument(documentTextState, null);
    clearNativeSelection();
    activeContext = setContextTo;
    updateContextChip();
    console.log("🧹 Cleared selection. context =", activeContext);
  }

  function updateContextChip() {
    const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
    const selectedCount = selectedBlockIds?.size || 0;

    if (hasBlocks && activeContext === "selection" && selectedCount > 0) {
      const preview = getSelectedBlocksPreview(110);

      contextChipEl.innerHTML = `
        <span><strong>Selected blocks</strong></span>
        <span class="meta">${selectedCount}</span>
        ${preview ? `<span class="meta">"${escapeHtml(preview)}"</span>` : ""}
        <button type="button" id="chip-clear">Clear</button>
        <button type="button" id="chip-full">Use full CV</button>
      `;
      contextChipEl.classList.remove("is-hidden");
      setChipMode("selection");

      contextChipEl.querySelector("#chip-clear")?.addEventListener("click", () => {
        clearBlockSelection("chat");
      });

      contextChipEl.querySelector("#chip-full")?.addEventListener("click", () => {
        clearBlockSelection("full");
      });

      return;
    }

    if (activeContext === "selection" && pinnedSelection?.selectedText) {
      const chars = pinnedSelection.selectedText.length;
      const preview = pinnedSelection.selectedText.trim().slice(0, 80).replace(/\s+/g, " ");
      contextChipEl.innerHTML = `
        <span><strong>Selected</strong></span>
        <span class="meta">${chars} chars</span>
        <span class="meta">"${escapeHtml(preview)}${chars > 80 ? "…" : ""}"</span>
        <button type="button" id="chip-clear">Clear</button>
        <button type="button" id="chip-full">Use full CV</button>
      `;
      contextChipEl.classList.remove("is-hidden");
      setChipMode("selection");

      contextChipEl.querySelector("#chip-clear")?.addEventListener("click", () => {
        clearSelectionState("chat");
      });

      contextChipEl.querySelector("#chip-full")?.addEventListener("click", () => {
        clearSelectionState("full");
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
  function buildSelectionFromBlockId(blockId) {
    const r = blockRangesById[blockId];
    if (!r) return null;
    return buildPinnedSelectionForRange(documentTextState, r.start, r.end, false);
  }

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
      pinnedSelection = null;
      selectedBlockId = null;
    } else {
      activeContext = "selection";
      pinnedSelection = buildSelectionFromBlockId(id);
      selectedBlockId = id;
      lastSelectionKey = `blocks:${Array.from(selectedBlockIds).join(",")}`;
    }

    clearNativeSelection();
    applySelectedBlocksUI();
    updateContextChip();
  });

  /* ===============================
     TEXT SELECTION (legacy)
     =============================== */
  let selectionTimer = null;
  document.addEventListener("selectionchange", () => {
    if (selectionTimer) clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => {
      const next = getSelectionPayload(editorPreviewEl);
      if (!next) return;

      const key = `${next.startIndex}:${next.endIndex}:${next.selectedText.length}`;
      if (key === lastSelectionKey) return;

      lastSelectionKey = key;
      pinnedSelection = next;

      selectedBlockId = null;
      selectedBlockIds = new Set();
      lastClickedBlockId = null;

      activeContext = "selection";

      renderDocument(documentTextState, pinnedSelection);
      updateContextChip();
    }, 150);
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
     UPLOAD -> RENDER
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

      const rewritten = sanitizeLeadingGarbage(data.rewrittenCv || "");
      const blocks = Array.isArray(data.blocks) ? data.blocks : null;

      const nextTitle = String(data.cvTitle || "").trim();
      if (nextTitle) documentTitle = nextTitle;

      editorPreviewEl.removeAttribute("data-placeholder");
      setCvLoadedUI(true);

      if (blocks && blocks.length) {
        buildStateFromBlocks(blocks);
      } else {
        documentTextState = rewritten;
        documentBlocksState = null;
        blockRangesById = {};
      }

      // reset selection
      pinnedSelection = null;
      selectedBlockId = null;
      selectedBlockIds = new Set();
      lastClickedBlockId = null;
      lastSelectionKey = "";
      activeContext = "chat";

      renderDocument(documentTextState, null);
      clearNativeSelection();
      updateContextChip();

    } catch (err) {
      console.error(err);
      alert("Fel vid uppladdning.");
    } finally {
      uploadBtn.disabled = false;
    }
  });

  /* ===============================
     CHAT SEND (placeholder)
     =============================== */
  async function sendChatMessageOnly() {
    const msg = editorInput.value.trim();
    if (!msg) return;
    clearSelectionState("chat");
    console.log("💬 CHAT:", msg);
    editorInput.value = "";
  }

  if (editorChatBtn) {
    editorChatBtn.addEventListener("click", e => {
      e.preventDefault();
      sendChatMessageOnly();
    });
  }

  /* ===============================
     APPLY (rewrite)
     =============================== */
  async function sendApply() {
    const instruction = editorInput.value.trim();
    if (!instruction) {
      alert("Skriv en instruktion först.");
      return;
    }

    const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
    const hasSelectedBlocks = hasBlocks && (selectedBlockIds.size > 0);

    // Mode priority:
    // 1) blocks (multi) if blocks exist and selection exists
    // 2) selection (legacy text)
    // 3) full
    const mode = hasSelectedBlocks
      ? "blocks"
      : ((activeContext === "selection" && pinnedSelection) ? "selection" : "full");

    const payload = {
      mode,
      instruction,
      targetRole: targetRoleInput?.value?.trim() || "",
      documentText: documentTextState || (editorPreviewEl.textContent || "")
    };

    if (mode === "blocks") {
      payload.selectedBlockIds = Array.from(selectedBlockIds);
      payload.blocks = documentBlocksState;
    }

    if (mode === "selection") {
      payload.selectionStart = pinnedSelection.startIndex;
      payload.selectionEnd = pinnedSelection.endIndex;
      payload.selectionText = pinnedSelection.selectedText;
      payload.contextBefore = pinnedSelection.contextBefore;
      payload.contextAfter = pinnedSelection.contextAfter;
    }

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

      // ---- BLOCKS RESPONSE ----
      if (data.mode === "blocks") {
        const blocks = Array.isArray(data.blocks) ? data.blocks : null;
        if (!blocks || !blocks.length) throw new Error("blocks missing in blocks response");

        const nextTitle = String(data.cvTitle || "").trim();
        if (nextTitle) documentTitle = nextTitle;

        buildStateFromBlocks(blocks);

        // keep selection if ids still exist
        const nextIds = new Set(Object.keys(blockRangesById));
        selectedBlockIds = new Set(Array.from(selectedBlockIds).filter(id => nextIds.has(id)));

        if (selectedBlockIds.size === 0) {
          pinnedSelection = null;
          selectedBlockId = null;
          lastClickedBlockId = null;
          activeContext = "full";
        } else {
          activeContext = "selection";
          if (!selectedBlockId || !selectedBlockIds.has(selectedBlockId)) {
            selectedBlockId = Array.from(selectedBlockIds)[selectedBlockIds.size - 1];
          }
          pinnedSelection = buildSelectionFromBlockId(selectedBlockId);
        }

        renderDocument(documentTextState, null);
        applySelectedBlocksUI();
        updateContextChip();
        clearNativeSelection();
        editorInput.value = "";
        return;
      }

      // ---- LEGACY SELECTION RESPONSE ----
      if (data.mode === "selection") {
        const replacementText = data.replacementText;
        if (typeof replacementText !== "string" || !replacementText) {
          throw new Error("replacementText missing");
        }

        const documentText = payload.documentText;
        const sel = pinnedSelection;

        const newText =
          documentText.slice(0, sel.startIndex) +
          replacementText +
          documentText.slice(sel.endIndex);

        documentTextState = newText;
        documentBlocksState = null;
        blockRangesById = {};
        selectedBlockId = null;
        selectedBlockIds = new Set();
        lastClickedBlockId = null;

        const newStart = sel.startIndex;
        const newEnd = sel.startIndex + replacementText.length;
        pinnedSelection = buildPinnedSelectionForRange(documentTextState, newStart, newEnd, false);
        activeContext = "selection";

        renderDocument(documentTextState, pinnedSelection);
        updateContextChip();
        clearNativeSelection();

        editorInput.value = "";
        return;
      }

      // ---- FULL RESPONSE ----
      if (data.mode === "full") {
        const rewrittenCv = sanitizeLeadingGarbage(data.rewrittenCv || "");
        if (!rewrittenCv && !Array.isArray(data.blocks)) throw new Error("rewrittenCv missing");

        const blocks = Array.isArray(data.blocks) ? data.blocks : null;

        const nextTitle = String(data.cvTitle || "").trim();
        if (nextTitle) documentTitle = nextTitle;

        if (blocks && blocks.length) {
          buildStateFromBlocks(blocks);
        } else {
          documentTextState = rewrittenCv;
          documentBlocksState = null;
          blockRangesById = {};
        }

        setCvLoadedUI(true);

        pinnedSelection = null;
        selectedBlockId = null;
        selectedBlockIds = new Set();
        lastClickedBlockId = null;
        lastSelectionKey = "";
        activeContext = "full";

        renderDocument(documentTextState, null);
        updateContextChip();
        clearNativeSelection();

        editorInput.value = "";
        return;
      }

      throw new Error("Unknown mode in response");

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

  editorInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendApply();
    }
  });

  window.addEventListener("beforeunload", () => {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
  });

  /* ===============================
     INITIAL
     =============================== */
  setCvLoadedUI(false);
  renderDocument("", null);
  updateContextChip();
});
