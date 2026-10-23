# Overlay-only release

2026-10-23, DEV-066. Owner authorizes publishing only the overlay, with existing PDF export unchanged and no preview-only design selector. Browser print/PDF continues locally for review; no subscription, payment or n8n changes.

Isolated worktree cv-overlay-release, branch codex/overlay-only, starts at verified published main 6c8b2f7. The separate codex/a4-pdf-export candidate, design selector, fonts and PDF backend are excluded. Other checkouts are preserved.

One viewer-only module moves the existing CV card/page nodes into a native dialog. Expand preview beside count, Close/Escape, keyboard focus containment and keyboard scrolling, preserved block selection/reading anchor, restored pane/background scroll and focus. The new rescale hook exposes only existing viewer scaling. Physical document geometry, pagination/content builder, typography and font-loading behavior remain unchanged. Header markup becomes a labelled heading row. All new UI text is English.

The complete original export builder/download-handler region is checked against 6c8b2f7, identical after Git newline normalization. Endpoint, payload defaults, classic_v1, full blocks, response handling and filename behavior are untouched. This preserves the existing export path; no repaired backend or new PDF parity is claimed.

Validation reuses tests/cv-pagination.browser.cjs with bounded overlay assertions: short/multi/long 1/5/4 pages, original eight viewports, desktop/mobile same nodes/signatures/selection, Close/Escape focus/scroll restoration, zero open/close render calls and no selector. Existing editor flow/geometry regression passes. The actual-Webflow-DOM harness adds the same overlay checks for desktop/mobile; all backend/export traffic is intercepted with synthetic local responses. Preflight passes; no real backend/model execution.

Build 2026-10-23-overlay-only. Release through scoped PR and expected-head merge after verifying base/files/checks, then verify Pages completion, exact public JS/CSS/latest hashes and actual published editor behavior. No unrelated Webflow edits are published. Exact receipt follows execution.

Rollback baseline: main 6c8b2f7 and its exact root JS/CSS/latest and webflow/latest contents. Preserve intervening changes and restore scoped source/assets in a new commit/release if approved; no main reset/force-push. No rollback is performed automatically.
