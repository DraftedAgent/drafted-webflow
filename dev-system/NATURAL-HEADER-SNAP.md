# Section snapping with a normal-flow header - local only

2026-10-23. Owner requests restoring snap-to-section while keeping the recently published ordinary-flow header. Separate clean codex/natural-header-snap from production 711479b016f85f60806e41b000c73225b640b036. Other worktrees untouched. No commit/push/PR/merge/publication or backend/n8n/model operation.

## Change

Native CSS y-mandatory snapping and always-stop section boundaries restored. Header and landing content share a first page-start wrapper and snap point. Existing live nodes/bindings move into it; header remains relative/normal flow, without visibility state, header-height measurements or scroll-direction logic. Upload, editor and CTA have start snap points at the viewport top. Editor remains full viewport height with Drafted branding.

The first section has at least viewport height and may grow for content on narrow/low screens. This avoids clipping the landing title or button. Native CSS snapping permits reading inside an oversized section between its start/end positions; another upward gesture can return to the header. No text/font/content changes or guessed header offset. Anchor navigation remains usable, with the landing snap point accounting for the header.

Reading-anchor capture recognizes the new first wrapper. While expanded preview is open, outer snapping is temporarily suspended and restored after returning the live card/scroll position. Normal scroll, keyboard focus, exact pane position and rotation anchoring preserved. Document rendering/designs/page CSS/browser-print preparation unchanged.

## Verification

- Existing editor-page-scroll.browser.cjs adapted to snapping and passes 1440x1000, 390x844, 320x640, 844x390. Real wheel gestures forward/back across landing/upload/editor/CTA, native oversized-section behavior, retained original header binding, ordinary-flow geometry/no header visibility toggle, anchor navigation, synthetic upload, full editor/input fit, Drafted branding, block selection, unsent draft, pane/outer scroll/focus and normal/expanded rotation. Zero outside requests/page errors.
- Existing cv-preview-toolbar.browser.cjs passes three designs/seven sizes and 46 prepared print contexts, touch, source/page text/count/order, selection/draft/scroll/focus, single Export PDF and stale-export rejection. No broad PDF generation/parity rerun for this scroll-only change.
- Physical CV render/layout/design CSS and browser-print module compared unchanged. Syntax and git diff --check pass. Responsive screenshots inspected, including low-height landing text and full-height editor.

Preview: http://127.0.0.1:8788/ and http://127.0.0.1:8788/?sample=1. Build 2026-10-23-natural-header-snap-local. Screenshots/results/review.diff under ignored output/pdf/natural-header-snap; existing toolbar results under output/pdf/preview-toolbar. Verification uses Edge viewport/touch emulation, not physical mobile devices. No publication.

## Owner-approved publication

Owner explicitly requests publicera after local review. Main rechecked 711479b, same isolated worktree and reviewed scroll-only scope. Release build 2026-10-23-natural-header-snap differs only in marker from local proof. Pages main-at-root is the delivery path. No Webflow/backend/n8n/billing/model operation. Rollback baseline 711479b through a new scoped restoration preserving intervening work. Exact-candidate actual-Webflow-DOM preflight, expected-head/base merge, then Pages/served hashes/published behavior checks. Final receipt follows.

## Publication receipt (2026-10-23)

Owner-approved delivery completed through PR [#21](https://github.com/DraftedAgent/drafted-webflow/pull/21). Exact release head 986616b92512b5f656f5483e5bb0283cc5d699aa, merged main d998ec45da871765a905835165868b93138da099, expected head/base/file list and clean mergeability verified before merge. No configured check runs/statuses; local suites and exact-candidate Webflow-DOM preflight are validation evidence. Pages [39960656409](https://github.com/DraftedAgent/drafted-webflow/actions/runs/39960656409) succeeded. Existing Webflow loader consumes root assets; no full Webflow publish performed.

Served root files match frozen exact-commit SHA256:
- drafted-editor.js: 1c4cda9786415c805242d6d952d7931f30fdb23c8761243d74efa95e3b35d996
- drafted-editor.css: 5275b283d31e7a61b036abfec1dc9140ce5de3cae400ee4424084d3cb3fbf263
- latest.json: 7d9e9ea53b5d2d4ce1a8751ea0cde744c9c9725cb53a9f9bb519fc115e1a68c6

Actual published Webflow DOM passes complete/long synthetic fixtures (one/five CV pages), forward/back wheel snapping across landing/upload/editor/CTA at 1440/390/320 widths, normal-flow header with constant height/display and no direction state, native oversized-section reading, full editor/input fit at desktop/mobile/low-height 844x390, same page text/order/count, selection, draft, pane/outer scroll, focus and modal rotation. All three designs prepare print with loaded fonts and no editor tools; no server export invoked. Screenshot reviewed. Zero real backend/model requests: three mocked requests per fixture. No broad PDF save/parity rerun, backend/n8n/billing/subscription changes.

Build 2026-10-23-natural-header-snap. Safe evidence: TEMP/drafted-snap-preflight-website.json, drafted-snap-published-website.json, drafted-snap-public-hashes.json and drafted-snap-{preflight,published}-{width}.png. Rollback baseline 711479b via a scoped new restoration after checking subsequent changes; never rewrite main.
