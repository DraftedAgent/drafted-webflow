# Editor workspace height - local implementation

2026-10-23. Implements the owner-approved Mer arbetsyta for editorn plan. Isolated worktree editor-workspace-height, branch codex/editor-workspace-height, base c0cec3e2b0eaef97be5474e1be1c39009fac6048 (published compact toolbar). Other dirty worktrees are preserved. No commit, push, PR, merge, publication, backend, n8n, billing or model operation.

## Behavior

The fixed site header remains on the landing/upload sections. A workspace-only view controller identifies the dominant section after scrolling settles (native scrollend with a 140ms fallback), hides the header only for the editor, zeroes its reserved offset and uses 100dvh. Section-relative position is preserved while changing height. Resize keeps the current section anchored. The legacy nav-height setup is replaced rather than running competing observers.

The existing preview heading/page counter/Expand move into the workspace topbar, alongside the existing design/print controls. The CV scroll area starts beside the Editor heading on desktop. A4 margins, text sizes, page builder and pagination are unchanged. At <=1280px the original Classic export/Copy elements are in More actions; normal buttons use Tab/Shift+Tab, Escape and focus return. At <=700px identity/title/labels are compacted and accessible expansion/print/more icons keep page count and selected design visible. The original no-CV tools availability is retained, including its inline display state.

The existing overlay moves the same heading and design/print nodes into its header and restores their original positions. It suspends workspace section detection and outer scroll snapping during the DOM move, restoring position before releasing the suspension. This avoids mobile focus/snap events incorrectly returning the site header. Existing Close/Escape, reading position, block selection and focus remain. The local-only synthetic banner is placed at the bottom so it does not cover the reclaimed topbar.

## Verification

Reused tests/cv-preview-toolbar.browser.cjs: three designs, seven sizes (1920x1080, 1440x1000, 1366x768, 1024x600, 390x844, 320x640, 844x390), repeated landing/upload/editor navigation, full-height/anchor stability after modal/resize, one toolbar row, panel alignment, bottom input fit, real closed/open secondary controls, keyboard navigation, current design/page signatures and unsent input, 21 mocked window.print preparation/cleanup operations. All browser network traffic is local; no external model or renderer execution.

Reused tests/cv-pagination.browser.cjs: short/multi/long 1/5/4, eight sizes, complete source, no clipping/orphaned headings, fixed document type sizes, selection/wheel scroll, actual Apply/revert fixtures, overlay node identity/no repagination, both close methods and exact prior scroll/focus. The original export builder/handler is compared to the published 6c8b2f7 implementation; current full canonical payload and classic_v1 are checked with a mocked response. The new header lifecycle is awaited before taking a settled scroll baseline.

Independent file comparisons confirm cv-document-layout.js, cv-document-layout.css and cv-browser-print.js unchanged from the base. No native PDF file is regenerated for this chrome-only change; previously disclosed browser-print/reader limitations remain. Physical-mobile/browser-chrome and virtual-keyboard behavior are not established by desktop viewport tests.

## Review locally

Run node tools/serve-editor-preview.cjs with DRAFTED_PREVIEW_PDF_CASE=long-special. This session serves http://127.0.0.1:8784/?sample=1 with synthetic source and no real backend calls. Build 2026-10-23-editor-workspace-local.

Before/after and expanded screenshots, geometry/results JSON and review.diff are under output/pdf/editor-workspace (ignored local review artifacts). The desktop fixture at 1440x1000 gains 141 CSS px of CV scroll height (744 to 885); at 390x844 it gains about 90 CSS px (211.19 to 301.31). Both examples retain their page signatures. These are measured fixture/viewport results, not a claim of an identical gain on every device.

Reproduce: node tests/cv-preview-toolbar.browser.cjs; node tests/cv-pagination.browser.cjs with Playwright on NODE_PATH. Syntax and git diff --check are also required. Publication remains a separate decision; future release should recheck main, review this diff and use the same isolated synthetic checks before/after serving assets. No Webflow settings or n8n deployment is needed.


## Owner-approved publication candidate

2026-10-23. The owner explicitly requests publicera after reviewing this local implementation, screenshots and verification. Rechecked production main still c0cec3e2b0eaef97be5474e1be1c39009fac6048. Candidate remains isolated in codex/editor-workspace-height; existing dirty checkouts are untouched. Release build 2026-10-23-editor-workspace differs from the reviewed build only in its version marker. Original local checkpoints above are historical.

Publication scope is this workspace chrome change through a feature PR and main/Pages release. No Webflow settings/publish, backend, n8n, subscription, payment or model operation. Reuse the passing seven-size toolbar and eight-size A4 tests; exact committed assets are additionally exercised against actual published Webflow DOM with all backend requests fulfilled synthetically before navigation. No new PDF generation/parity claim.

Rollback baseline: c0cec3e. Restore only this release's changed files through a new reviewed revert commit, respecting intervening changes; never reset or force-push main. Final PR/head/merge/Pages/public-hash and served-behavior receipt follows verification.
