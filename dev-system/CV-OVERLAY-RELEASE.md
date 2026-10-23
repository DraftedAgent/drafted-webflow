# Overlay-only release

2026-10-23, DEV-066. Owner authorizes publishing only the overlay, with existing PDF export unchanged and no preview-only design selector. Browser print/PDF continues locally for review; no subscription, payment or n8n changes.

Isolated worktree cv-overlay-release, branch codex/overlay-only, starts at verified published main 6c8b2f7. The separate codex/a4-pdf-export candidate, design selector, fonts and PDF backend are excluded. Other checkouts are preserved.

One viewer-only module moves the existing CV card/page nodes into a native dialog. Expand preview beside count, Close/Escape, keyboard focus containment and keyboard scrolling, preserved block selection/reading anchor, restored pane/background scroll and focus. The new rescale hook exposes only existing viewer scaling. Physical document geometry, pagination/content builder, typography and font-loading behavior remain unchanged. Header markup becomes a labelled heading row. All new UI text is English.

The complete original export builder/download-handler region is checked against 6c8b2f7, identical after Git newline normalization. Endpoint, payload defaults, classic_v1, full blocks, response handling and filename behavior are untouched. This preserves the existing export path; no repaired backend or new PDF parity is claimed.

Validation reuses tests/cv-pagination.browser.cjs with bounded overlay assertions: short/multi/long 1/5/4 pages, original eight viewports, desktop/mobile same nodes/signatures/selection, Close/Escape focus/scroll restoration, zero open/close render calls and no selector. Existing editor flow/geometry regression passes. The actual-Webflow-DOM harness adds the same overlay checks for desktop/mobile; all backend/export traffic is intercepted with synthetic local responses. Preflight passes; no real backend/model execution.

Build 2026-10-23-overlay-only. Release through scoped PR and expected-head merge after verifying base/files/checks, then verify Pages completion, exact public JS/CSS/latest hashes and actual published editor behavior. No unrelated Webflow edits are published. Exact receipt follows execution.

Rollback baseline: main 6c8b2f7 and its exact root JS/CSS/latest and webflow/latest contents. Preserve intervening changes and restore scoped source/assets in a new commit/release if approved; no main reset/force-push. No rollback is performed automatically.


## Verified publication receipt

PR #13 https://github.com/DraftedAgent/drafted-webflow/pull/13 was inspected at exact head 108c32e7f8f9a7c0727688b7020a92f851d860ac/base 6c8b2f7ac997aa0f0f06d1c017de0e0ca84bbda0: twelve scoped files, mergeable/clean, no configured checks/statuses. Owner-authorized expected-head merge succeeded as 8889c586d1da87cd01d2eab7b44d2e1c8fe6ef99. Pages run 39914607975 completed success for that merge.

Public root asset SHA256 values match committed candidate blobs exactly: JS e23901df78028ba6cdef5bf15848b4e485b7819b87a9e313b4d0cddf7f97900b; CSS f704c2cff6199876556c1683df383eac4e82ce9a4886a05781ff3a9168cc4cf0; latest 9e1801e1d3de179d36ad549ac0045f381ec172b6dec4c4d615ab5a088783a741. Build 2026-10-23-overlay-only.

The actual published Webflow page passes short/multi/long 1/5/4 pages at desktop/mobile, no design selector, same live page nodes/breaks through overlay, Close/Escape focus/scroll restoration, source completeness, fragment selection, wheel scroll and unchanged Classic export request. All four backend requests per fixture were locally fulfilled; real backend/model requests zero. No private browser state or CV accessed. No n8n or Webflow publish action. Content-free receipts/screenshots remain under user TEMP drafted-overlay-*. This receipt is saved on the feature branch after release; no further main merge is required.
