# Shared CV presentation designs — local step 3

2026-10-22, DEV-061. Continued in the existing isolated `a4-preview-delivery` worktree, branch `codex/a4-pdf-export`, HEAD `6c8b2f7` plus the uncommitted, locally verified step-2 implementation. The starting point was reported before implementation. Other worktrees were inspected read-only and preserved. No commit, push, PR, merge, publication, n8n operation or external model execution.

## Implementation

`webflow/src/cv-document-designs.js` is the shared frozen allowlist: Classic (`classic_v1`), Compact (`compact_v1`), Editorial (`editorial_v1`). Both the browser bundle and local PDF renderer consume it. There is one content model, semantic document builder, real-layout paginator, font package and stylesheet. The selected ID is applied to the measurement root and visible root before pagination; export passes the same ID to that exact renderer. No separate PDF design template exists.

Classic retains the step-1 typography/geometry with step-2 shared fonts. Compact uses fixed 10pt body text, 1.4 line spacing, 16mm side margins and tighter entry spacing. Editorial uses 10.5pt body text, larger title/entry headings, pale section bands and restrained blue rules, with 18mm side margins. These are constant presentation rules, never content-dependent font reduction. All variants remain single column for predictable reading order and continuation across pages. The pagination engine handles long headings, words, bullets and entries identically for every design.

The labelled native select next to the preview supports keyboard navigation, exposes the selected name, wraps its explanatory text on small screens and says “Designs can have different page counts.” Optional thumbnail cards were omitted to keep the existing preview controls compact. The selection lives only in the editor closure, outside CV/proposal snapshots and discovery context. Switching invokes `renderDocument` only: no block rebuild, source mutation, approval, suggestion or request. It survives Chat/Experience questions view changes, Apply and proposal snapshot restoration during the open editor session. It deliberately is not a persisted candidate/profile field or a promise of cross-reload retention.

Existing block IDs, all page fragments, selection callback and scroll container are reused. Export waits for the selected layout/fonts. The existing snapshot comparison includes `templateId`, so a PDF prepared for a different currently selected design is discarded with an English message. Design changes do not discard unsent editor instructions. Text and links are inserted through the shared renderer as before.

## Verification and artifacts

Run with Playwright on NODE_PATH and installed Edge:

```powershell
node --test tests/cv-pdf.test.cjs tests/experience-discovery.test.cjs tests/discovery-transport.test.cjs tests/discovery-background.test.cjs tests/discovery-negative.test.cjs
$env:DRAFTED_TEST_DESIGNS='1'
node tests/cv-pdf.browser.cjs
python tests/verify-cv-pdf.py --designs --pdftoppm <path-to-pdftoppm>
node tests/cv-pagination.browser.cjs
node tests/editor-discovery.browser.cjs
node tests/discovery-outcomes.browser.cjs
```

The design mode exercises short and long-special CVs through the complete editor for all three designs. It cycles the entire allowlist, checks source text, actual counter updates, fixed font sizes, native keyboard selection, unchanged request counts, unsent instruction retention, view changes, selection across fragments, actual wheel scrolling and design retention after Apply. Each short case holds an in-flight real PDF while changing design and confirms that no obsolete download escapes. Long cases apply a synthetic edit before exporting. Final PDFs are downloaded through the actual editor button at desktop/mobile widths, and break signatures remain unchanged by panel size or export. Empty pages, overflowing element bounds and trailing orphan headings fail the browser test.

Final synthetic examples are in `output/pdf/designs`: each design has short and long-special PDFs. Independent pypdf/Poppler verification checks every exported page against the actual preview DOM proof, including the proof's unscaled element geometry and fonts. It checks complete text/order, page counts, embedded fonts, zero rasterized document pages, full URL/email annotations and Swedish/accent/currency/Greek characters. Comparison pairs and JSON evidence are under `tmp/pdfs/designs`; final review copies are in `output/pdf/designs/proofs`. See the appended DEV-061 record for final counts/metrics. The cumulative diff includes the retained step-2 work and is explicitly labelled accordingly.

Local interactive demo: set `DRAFTED_PREVIEW_PDF_CASE=long-special`, run `node tools/serve-editor-preview.cjs` and use “Try a synthetic CV and job ad”. Select a design, select CV fragments, switch editor views or export. For an explicit synthetic edit select “Use full CV”, enter exactly `Apply the synthetic PDF edit.` and click Apply. This is a local fixture response, not an AI call.

## Limits and rollout boundary

Observed layout parity is established using actual PDF rendering, not inferred from CSS reuse. Pixel identity is not claimed: screen subpixel text and Poppler PDF rasterization differ, with measured tolerance reported in the evidence. Chromium also rounds physical page boxes by fractions of a point; PDF timestamps vary. Other engines, unsupported glyphs/emoji and full tagged-PDF accessibility remain unverified as in step 2.

The two additional template IDs are allowed by the LOCAL candidate only. No normative export contract or production backend allowlist is changed. Production still uses the older independent classic renderer. Before release, deploy the shared registry/renderer/CSS/fonts together on an approved pinned browser runtime, update its explicit template allowlist, verify parity on that runtime, and wire the export endpoint. Frontend-only publication would not complete steps 2–3. No new external service has been introduced here; any required production render target remains a separate decision described in `CV-PDF-EXPORT.md`.
