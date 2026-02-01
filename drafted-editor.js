/**
 * IMPORTANT:
 * This file enforces the backend response contract defined in:
 * - contracts/response-contract.md
 * - contracts/block-schema-v1.md
 *
 * blocks[] is the single source of truth.
 * Any code suggestion violating this is invalid.
 */



console.log("DRAFTED_JS_SOURCE", "2026-02-01-1903");

console.log("🚀 drafted-editor.js executing");

// ===============================
// n8n endpoints (GLOBAL CONFIG)
// ===============================
const N8N_UPLOAD_URL = "https://drafted.app.n8n.cloud/webhook/webflow-upload-cv";
const N8N_EDITOR_URL = "https://drafted.app.n8n.cloud/webhook/webflow-editor-rewrite";
const N8N_CHAT_URL   = "https://drafted.app.n8n.cloud/webhook/webflow-chat-cv";
const N8N_EXPORT_PDF_URL = "https://drafted.app.n8n.cloud/webhook/webflow-export-pdf";



  const uploadBtn = document.getElementById("upload-btn");
  const previewFrame = document.getElementById("cv-preview");
  const previewWrap = document.querySelector(".cv-preview-wrap");
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
  if (!hasFileInput || !uploadBtn || !editorPreviewEl || !editorInput || !editorApplyBtn || !contextChipEl) {
    console.error("❌ Missing required DOM elements", {
      fileInput: hasFileInput,
      uploadBtn: !!uploadBtn,
      editorPreviewEl: !!editorPreviewEl,
      editorInput: !!editorInput,
      editorApplyBtn: !!editorApplyBtn,
      contextChipEl: !!contextChipEl
    });
    throw new Error("Missing required Drafted editor DOM elements");
  }

  console.log("✅ Drafted editor loaded");

  // ✅ NAV HEIGHT VAR (must run before snap layout is evaluated)
  (function setupNavHeightVar(){
    const root = document.documentElement;
  
    let last = 0;
  function setVar(px){
    const v = Math.max(0, Math.round(px));

    // Ignore insane jumps (mobile menu opening, etc)
    if (last && v > last * 1.8) return;

    last = v;
    root.style.setProperty("--nav-h", v + "px");
  }
  
    function findNavbar(){
      // Webflow navbar wrapper (recommended)
      return document.querySelector(".w-nav") 
        // fallback: your nav element
        || document.querySelector("nav[role='navigation']")
        || document.querySelector("nav");
    }
    
  
    const nav = findNavbar();
    console.log("setupNavHeightVar: nav found", nav);

    if (!nav) { setVar(0); return; }
  
    const measure = () => setVar(nav.getBoundingClientRect().height);
  
    measure();
  
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
  
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
  
    window.addEventListener("resize", measure, { passive: true });
  })();
  
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

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0] || null;

    if (fileName) fileName.textContent = file ? file.name : "No file selected";
    if (!file) return;

    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(file);

    if (previewFrame) previewFrame.src = currentUrl;
    previewWrap?.classList.add("has-file");
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

    return {
      ok: true,
      message: data.message,
      intent: data.intent,
      proposal: data.proposal ?? null,
      suggestion: data.suggestion ?? null,
      changedBlockIds: data.changedBlockIds ?? [],
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


function applyFullScopeUI(isFull) {
  if (!editorPaper) return;
  editorPaper.classList.toggle("is-scope-full", !!isFull);
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
    let skillsHeadingRendered = false;
    let languagesHeadingRendered = false;
    let certificationsHeadingRendered = false;

    function getHeadingFromBlocks(type, fallback) {
      if (!documentBlocksState || !documentBlocksState.length) return fallback;
      const match = documentBlocksState.find(block => String(block.type || "") === type);
      const label = match && match.label ? String(match.label).trim() : "";
      return label || fallback;
    }

    const experienceHeading = getHeadingFromBlocks("experience", "Experience");
    const educationHeading = getHeadingFromBlocks("education", "Education");
    const skillsHeading = getHeadingFromBlocks("skills", "Skills");
    const languagesHeading = getHeadingFromBlocks("languages", "Languages");
    const certificationsHeading = getHeadingFromBlocks("certifications", "Certifications");

    function pushSectionHeading(sectionType, headingText) {
      htmlParts.push(`
    <section class="cv-section cv-section--${escapeHtml(sectionType)}">
      <h2 class="cv-section-heading">${escapeHtml(headingText)}</h2>
    </section>`.trim());
    }
    
    

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
          pushSectionHeading("experience", experienceHeading);
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
          const period = (startDate && endDate)
            ? `${startDate} – ${endDate}`
            : (startDate || endDate);
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
    pushSectionHeading("education", educationHeading);
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

  // Line 2: Institution + Period
  let metaPieces = [];
  if (institution) metaPieces.push(`<span class="cv-edu-inst">${escapeHtml(institution)}</span>`);
  if (startDate || endDate) {
    const period = (startDate && endDate)
      ? `${startDate} – ${endDate}`
      : (startDate || endDate);
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

  if (!skillsHeadingRendered) {
    pushSectionHeading("skills", skillsHeading);
    skillsHeadingRendered = true;
  }

  htmlParts.push(`
<section class="cv-block cv-block--skills" data-block-id="${escapeHtml(id)}">
  <div class="cv-block-body">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
</section>`.trim());
  continue;
}


      // ===== LANGUAGES =====
if (type === "languages") {
  const text = stripLeakedFields(rawText);
  if (!text) continue;

  if (!languagesHeadingRendered) {
    pushSectionHeading("languages", languagesHeading);
    languagesHeadingRendered = true;
  }

  htmlParts.push(`
<section class="cv-block cv-block--languages" data-block-id="${escapeHtml(id)}">
  <div class="cv-block-body">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
</section>`.trim());
  continue;
}


      // ===== CERTIFICATIONS =====
if (type === "certifications") {
  const text = stripLeakedFields(rawText);
  if (!text) continue;

  if (!certificationsHeadingRendered) {
    pushSectionHeading("certifications", certificationsHeading);
    certificationsHeadingRendered = true;
  }

  htmlParts.push(`
<section class="cv-block cv-block--certifications" data-block-id="${escapeHtml(id)}">
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

    const data = await draftedFetchJson(
      N8N_EDITOR_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      "cv"
    );

    const nextBlocks = data.blocks;
    if (!nextBlocks || !nextBlocks.length) {
      return { ok: false, error: "Rewrite flow returned no blocks" };
    }

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

  const type = (first?.type || first?.section || "").toString().trim();
  const more = ids.length > 1 ? ` +${ids.length - 1} more` : "";

  return (type ? type : "Block") + more;
}

function updateContextChip() {
  const hasBlocks = !!(documentBlocksState && documentBlocksState.length);
  const selectedCount = selectedBlockIds?.size || 0;

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
        <button type="button" class="chip-btn chip-btn--primary" id="chip-full">Use full CV</button>
      </div>
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

  // 2) FULL CV MODE
  if (activeContext === "full") {
    applyFullScopeUI(true);

    contextChipEl.innerHTML = `
      <div class="chip-label">
        <span class="chip-badge">Scope</span>
        <span class="chip-title">Full CV</span>
        <span class="chip-sub">Applies changes to the whole document</span>
      </div>

      <div class="chip-actions">
        <button type="button" class="chip-btn chip-btn--ghost" id="chip-chat">Chat only</button>
      </div>
    `;

    contextChipEl.classList.remove("is-hidden");
    setChipMode("full");

    contextChipEl.querySelector("#chip-chat")?.addEventListener("click", () => {
      activeContext = "chat";
      updateContextChip();
    });

    return;
  }

  // 3) CHAT MODE (default when CV loaded)
  applyFullScopeUI(false);

  contextChipEl.innerHTML = `
    <div class="chip-label">
      <span class="chip-badge">Scope</span>
      <span class="chip-title">Chat</span>
      <span class="chip-sub">No CV changes</span>
    </div>

    <div class="chip-actions">
      <button type="button" class="chip-btn chip-btn--primary" id="chip-full">Use full CV</button>
    </div>
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
  onReady(setupFilePicker);


  
  /* ===============================
     UPLOAD -> RENDER (MAIN FLOW)
     =============================== */
  uploadBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  console.log("UPLOAD CLICKED");

  const fileInput = getFileInput();
  const file = fileInput?.files?.[0];

  if (!file) {
    alert("Välj en PDF först.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetRole", targetRoleInput?.value?.trim() || "");

  try {
    setUploadLoading(true);
    setEditorProcessing(true);

    const data = await draftedFetchJson(
      N8N_UPLOAD_URL,
      { method: "POST", body: formData },
      "cv"
    );

    const blocks = data.blocks;

    const nextTitle = String(data.cvTitle || "").trim();
    if (nextTitle) documentTitle = nextTitle;

    const nextCvVersionId = String(data.cvVersionId || "").trim();
    cvVersionId = nextCvVersionId || cvVersionId || null;

    setCvLoadedUI(true);
    setEditorPlaceholder(false);
    editorPreviewEl.textContent = "";

    buildStateFromBlocks(blocks);
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
    if (err && err.name === "DraftedContractError") {
      console.error("DraftedContractError", err.code, err.details, err);
    } else {
      console.error(err);
    }
  
    // Error UI state (do NOT advance editor state)
    setEditorPlaceholder(true);
  
    const msg =
      (err && err.name === "DraftedContractError")
        ? `Fel vid uppladdning (${err.code}).`
        : "Fel vid uppladdning.";
  
    alert(msg);
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

  const msg = (editorInput?.value || "").trim();
  if (!msg) return;

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
    cvVersionId: cvVersionId || null,
    cvTitle: documentTitle || "",
    targetRole: targetRoleInput?.value?.trim() || "",
    language: documentLanguage || "sv",
    mode,
    selectedBlockIds: mode === "blocks" ? Array.from(selectedBlockIds) : [],
    blocks: documentBlocksState,
    history: chatHistory.slice(-12),
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

    const assistantMsg = String(data.message || "").trim() || "Okay.";
appendChat("assistant", assistantMsg);

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

pendingSuggestion = nextSuggestion;
pendingProposal = nextProposal;

// Build meta used by your existing proposal card UI.
// Keep it compatible with fetchProposalFromSuggestion(), which uses appendProposalCard(pendingProposalMeta).
pendingProposalMeta = {
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
  appendProposalCard(pendingProposalMeta);
}

setApplyLabel();



  } catch (err) {
    if (err && err.name === "DraftedContractError") {
      console.error("DraftedContractError", err.code, err.details, err);
    } else {
      console.error(err);
    }
    appendChat("assistant", "Something went wrong. Try again.");
    pendingProposal = null;
    pendingProposalMeta = null;
    pendingSuggestion = null;
    clearAllProposalCards();
    setApplyLabel();
  } finally {
    // Always release lock
    window.__DRAFTED_CHAT__.inFlight = false;
    setBusy(false);
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

    const data = await draftedFetchJson(
      N8N_EDITOR_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      "cv"
    );

    const nextBlocks = data.blocks;
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
    if (err && err.name === "DraftedContractError") {
      console.error("DraftedContractError", err.code, err.details, err);
    } else {
      console.error(err);
    }
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
      language: "sv",
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
  const clickable = icon?.closest("button, a, [role='button'], .tool-btn, .tool-item, div");
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
      alert("Kan inte ladda ner ännu: CV-data saknas.");
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
        alert(err?.message || err?.contractError || "Export misslyckades.");
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Export HTTP error:", res.status, txt);
        alert("Export misslyckades (HTTP " + res.status + ").");
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
      alert("Export misslyckades (exception). Se console.");
    } finally {
      if (window.__DRAFTED_EXPORT__) window.__DRAFTED_EXPORT__.inFlight = false;
    }
  });
}





  window.addEventListener("beforeunload", () => {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
  });

  /* ===============================
     INITIAL
     =============================== */
  setCvLoadedUI(false);
  setEditorPlaceholder(true);
  renderDocument("");
  updateContextChip();
  setApplyLabel();
