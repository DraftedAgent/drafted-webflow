const input = $json;

function asArr(x) { return Array.isArray(x) ? x : []; }
function asStr(x) { return (x === null || x === undefined) ? "" : String(x); }

function sanitizeLeadingGarbage(str) {
  return String(str || "")
    .replace(/^\uFEFF/, "")
    .replace(/^=+/, "")
    .trim();
}

function extractModelText(json) {
  // n8n OpenAI node shapes vary
  const t1 = json?.output?.[0]?.content?.[0]?.text;
  if (t1) return asStr(t1);

  if (json?.text) return asStr(json.text);
  if (json?.content) return asStr(json.content);

  // Some nodes put it here:
  const t2 = json?.data?.output?.[0]?.content?.[0]?.text;
  if (t2) return asStr(t2);

  // Fallback
  try { return JSON.stringify(json); } catch { return asStr(json); }
}

// Note: chat can run with blocks present or not. We must not leak debug/meta.
const blocks = asArr(input.blocks);
const hasBlocks = Array.isArray(blocks) && blocks.length > 0;

const rawModel = extractModelText(input);
const modelText = sanitizeLeadingGarbage(rawModel);

let parsed = null;
let parseOk = false;

try {
  parsed = JSON.parse(modelText);
  parseOk = true;
} catch (e) {
  parsed = null;
}

// Model output normalization
const intentRaw = asStr(parsed?.intent || "answer").toLowerCase();
const assistantText = asStr(parsed?.assistantMessage || parsed?.message || "").trim() || "Okay.";

// Support both legacy proposal + new suggestion (optional)
const suggestion =
  (parsed?.suggestion && typeof parsed.suggestion === "object" && !Array.isArray(parsed.suggestion))
    ? parsed.suggestion
    : null;

const proposal =
  (parsed?.proposal && typeof parsed.proposal === "object" && !Array.isArray(parsed.proposal))
    ? parsed.proposal
    : null;

// If model suggested something but we have no blocks, degrade to answer (still ok=true)
let finalIntent = intentRaw;
let finalSuggestion = suggestion;

if ((intentRaw === "suggestion" || intentRaw === "proposal") && !hasBlocks) {
  finalIntent = "answer";
  finalSuggestion = null;
}

// Build minimal public response contract for chat
// IMPORTANT: response.message is ALWAYS the assistant output (request.message is user input).
const out = {
  ok: true,
  message: assistantText,
};

// Optional metadata fields (only include when present/valid)
if (finalIntent) out.intent = finalIntent;
if (proposal !== null) out.proposal = proposal;
if (finalSuggestion !== null) out.suggestion = finalSuggestion;

const changedBlockIds = asArr(input.changedBlockIds);
if (changedBlockIds.length > 0) out.changedBlockIds = changedBlockIds;

// Never include _debug in production response contract.
// If you need debug, log it in node execution or keep it internal.
// (parseOk is intentionally not returned)
if(parsed?.selectionRequest?.kind==='cv_selection'&&finalIntent==='answer'&&!finalSuggestion&&!proposal){
 if(typeof input.requestId!=='string'||!input.requestId.trim())throw new Error('Missing conversation request identity');
 out.selectionRequest={id:input.requestId,kind:'cv_selection'};
}
return { json: out };
