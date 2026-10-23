# Natural page-header scrolling - local only

2026-10-23. Ordinary-flow page header, no sticky/fixed header or scroll-dependent hiding/showing. Separate codex/natural-header-scroll from production d4df5361c33d1e4f6390889187bcf6e9105ef8c6. Other worktrees untouched. No commit/push/PR/merge/publication/backend/n8n action.

## Change

The existing live Webflow navbar moves once into the start of the existing page-scroll container, retaining identity and bindings. Relative positioning keeps it in normal flow. The shared scroller spans 100dvh without header-height reservation; Drafted and document title remain in the editor toolbar.

Removed dominant-section detection, scrollend/debounce timers, drafted-editor-active, nav measurement, changing --nav-h and the old modal lock. No scroll-direction tracking. Mandatory snapping removed for continuous scrolling; anchor navigation and upload-to-editor smooth scrolling remain. Editor retains viewport height. Native outer scroll anchoring is disabled to prevent competing adjustments when the preview moves into/out of the overlay.

The scroll listener only records a reading anchor, without changing layout, scroll or header visibility. A ResizeObserver corrects retained/clamped offsets only when viewport dimensions change, preserving rotation position and respecting navigation during resize. Modal close restores exact offsets at unchanged dimensions or section-relative position after resize.

## Verification

- New editor-page-scroll.browser.cjs passes 1440x1000, 390x844, 320x640, 844x390: header identity/binding, normal-flow geometry, bidirectional incremental scrolling without delayed shifts, anchor navigation/upload, full editor/input fit, branding, selection, draft, scroll/focus and normal/expanded rotation. Zero outside requests/page errors.
- Existing cv-preview-toolbar.browser.cjs passes three designs/seven sizes and 46 print preparations, including touch, unchanged page text/count/order, overlay/tooltips/copy/focus/scroll/draft and stale export rejection. Old active-header wait replaced by editor-position wait. Same expectation adapted in pagination suite; broader pagination/PDF suites not rerun for page-chrome changes.
- Document renderer/design registry, physical document CSS and browser-print module unchanged. No native PDF save/parity run or real backend/model call. Syntax/diff checks pass.

Local preview: http://127.0.0.1:8787/ (header flow), http://127.0.0.1:8787/?sample=1 (synthetic editor). Build 2026-10-23-natural-header-local. Reviewed desktop/mobile/low-height screenshots/results/review.diff under ignored output/pdf/natural-header. Viewport/touch emulation does not establish physical mobile browser-chrome/virtual-keyboard behavior.

## Owner-approved publication

Owner explicitly requests publicera after local review. Remote main rechecked d4df536; same isolated worktree and UI-only scope. Build 2026-10-23-natural-header changes only the local build marker. Pages main-at-root confirmed before delivery. No Webflow/backend/n8n/billing/model action. Rollback baseline d4df536, through a new scoped restoration preserving intervening work. Exact candidate Webflow-DOM preflight, expected-head/base merge, then Pages success, served hashes and published behavior verification. Final receipt follows.

## Publication receipt (2026-10-23)

PR [#20](https://github.com/DraftedAgent/drafted-webflow/pull/20), release head fef7b7efadcf5410e7a6719da2dffdf5bbc1014c, merged to main 711479b016f85f60806e41b000c73225b640b036 after expected-head/base/file-scope verification and clean mergeability. No configured check runs/statuses; local suites and actual-site preflight are the validation evidence. Pages [39958585089](https://github.com/DraftedAgent/drafted-webflow/actions/runs/39958585089) completed successfully. Existing Webflow loader consumes root assets; no full Webflow publish performed.

Root files fetched after deployment match frozen exact-commit SHA256:
- drafted-editor.js: 0130345c241aaabf1fc796cd25a6970c0dfe45117f9ec86ce4fca03caa95c08f
- drafted-editor.css: 254476082a2c7a17ad27d21f8835ce5e769156b898edb653603817c5f0a0b505
- latest.json: 677dfc7188bf9640943781b7eab89b0a5af9f8e63424ce5f08a6d54d29e2fa64

Actual published Webflow DOM passes complete/long synthetic CVs, all three designs, 1440/390/320/844 widths including low height, natural header position and bidirectional incremental scrolling without delayed shifts, full-height editor/input fit, retained branding, unchanged per-page text/order/count on resize, selection/draft/scroll/focus, and resize while expanded. Selected-design browser-print preparation passes for each design; no server export invoked. One/five pages retained. All backend traffic intercepted before navigation (three mocked requests per fixture); zero real backend/model calls. Prepared print is checked; no full native PDF save/parity rerun.

Safe evidence outside Git: TEMP/drafted-natural-preflight-website.json, drafted-natural-published-website.json, drafted-natural-public-hashes.json and drafted-natural-{preflight,published}-{width}.png. No backend/n8n/billing/subscription change. Build 2026-10-23-natural-header. Rollback remains a scoped new commit from d4df536, preserving subsequent changes.
