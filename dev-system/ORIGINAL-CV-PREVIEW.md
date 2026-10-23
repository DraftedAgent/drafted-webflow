# Original upload PDF without viewer menus - local only

2026-10-23. Owner requests that the original uploaded CV pane display only its PDF, without Download, Print, Save to Google Drive or native viewer menus. Continue in the isolated preview-tooltip-focus worktree from production d998ec4, preserving the separate unpublished DEV-075 tooltip fix. No commit/push/PR/merge/publication, backend/n8n, billing or model action.

## Cause and implementation

The upload pane used an embed with a blob URL, activating the browser PDF plugin. Its menus belong to browser UI. Replace that embed in the existing DOM with an original-file-only PDF.js viewer. This renders the selected File bytes directly, not parsed blocks, rewritten content or another CV template. Upload still sends the same selected File unchanged; file selection never triggers analysis or another server upload.

Pinned PDF.js 6.4.299 runtime/worker, fonts, CMaps, image decoders, ICC profiles and licenses are vendored under webflow/assets/pdfjs/6.4.299. Npm tarball SHA512 verified before extracting; UPSTREAM.json records provenance and each original asset's SHA256. About 5.26 MB of static assets stored; library/worker/resources load lazily when needed from the project's existing asset host, with no CDN subscription/service. [Official rendering examples](https://mozilla.github.io/pdf.js/examples/) describe the display API. No PDF viewer application/toolbars are included.

Pages retain source geometry/rotation; canvases draw original artwork with transparent selectable text layers and existing safe web/mail/telephone links. Pages scale to panel width and scroll inside the same pane. Later pages render near the reading position rather than all canvases at once; pixel allocation is bounded. PDF scripting, XFA/editor tools, embedded-file actions and native menus are not exposed. Password-protected/invalid/unrenderable files show an English error rather than switching back to native menus. No password-entry flow or OCR added. Full forms/tag-tree/internal-destination navigation parity with a native PDF application is not claimed.

File changes cancel prior tasks/workers and discard stale pages. Clearing selection restores the placeholder. Load errors do not replace editor content or silently send the file elsewhere. Original-file preview is independent of the shared edited CV renderer, designs, history, block marking and browser-print export; those remain unchanged.

Local server supports module/wasm MIME types and wasm-only CSP compilation. Production configuration unchanged. Local sample now uses valid synthetic PDF bytes and has a source-only URL that does not run Upload CV; demo button placed out of the upload layout flow. Legacy export test boundary adjusted to cover the same payload builder/handler after removing obsolete blob-URL cleanup.

## Verification

- cv-source-preview.browser.cjs PASS: a real three-page deterministic synthetic PDF, portrait/landscape, original text/artwork/Swedish characters and links, four panel widths, scroll, text selection, no plugin/menu controls, rapid 15-page-to-one-page replacement, malformed file, clearing/retry, exact original multipart file bytes and successful existing upload/editor response. Zero external requests/page errors. Source asset loading is lazy. A separately routed static-assets origin exercises the cross-origin blob worker arrangement used by Webflow/Pages; no actual external request.
- Existing cv-preview-toolbar.browser.cjs PASS after integration: all three designs/seven sizes/46 prepared print contexts, original tooltip regression, focus/scroll/marking/draft, design changes, touch and stale-export guard. Existing legacy builder/handler static comparison passes; full A4/native PDF suite not rerun for this source-pane change.
- Independent Poppler rendering of all three fixture pages from in-memory bytes, plus browser canvas screenshots visually inspected. No user CV written to Git, no new exported CV/PDF artifact, and no exact PDF.js-versus-Poppler pixel equality claim (font/antialiasing can differ). Editor document renderer/design/physical CSS/browser-print/section-snap source files compared unchanged.

The source page fits the existing host panel width. The pre-existing narrow two-column upload layout can still make the preview small on mobile; no broader upload-layout redesign included. Validation uses current Edge viewport emulation, not physical mobile devices or every PDF producer.

Preview: http://127.0.0.1:8791/?source=1 (original PDF only, no analysis) and ?sample=1 (editor). Build 2026-10-23-source-preview-local includes both this source-viewer change and unpublished DEV-075. Screenshots/results/Poppler pages/review.diff under ignored output/pdf/source-preview; tooltip proof under output/pdf/preview-tooltip. No publication.

## Owner-approved publication

Owner explicitly requests publicera after local review. Deliver DEV-076 original-file viewer and the reviewed pending DEV-075 tooltip fix together. Main rechecked at d998ec45da871765a905835165868b93138da099; other worktrees untouched. Release marker 2026-10-23-source-preview. GitHub Pages main-at-root only; no Webflow publish, backend/n8n/billing or real upload/model execution. Candidate actual-site preflight and expected-head/base merge required, followed by Pages, served asset hashes and published mocked behavior verification. Rollback baseline d998ec4 through a new scoped restoration preserving intervening work. Final receipt follows.
