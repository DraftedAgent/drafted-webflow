# Preview tooltip dismissal - local only

2026-10-23. Owner reports persistent Close/Expand preview tooltips after viewer transitions. Separate clean codex/preview-tooltip-focus from production d998ec45da871765a905835165868b93138da099. Other worktrees untouched. No commit/push/PR/merge/publication or backend/model operation.

## Cause and fix

The old shared icon-button handler showed a tooltip on every focus event, including the modal's automatic Close focus and restored Expand focus. Pointer leave did not dismiss while the button retained focus; a separate hovering flag could outlive DOM moves. This reproduced both reported tooltips against the committed production bundle on desktop and mobile-sized synthetic previews.

Tooltip hover now ends on pointer leave/cancel. Focus alone shows a tooltip only for keyboard focus-visible; blur, activation and Escape dismiss it. Removed persistent hover state. Overlay explicitly dismisses its tooltips after setting/restoring focus, including keyboard-triggered open/close; actual keyboard navigation to a button still shows its tooltip. Window blur dismisses tooltips too. Focus restoration, visible focus indication and accessible names/descriptions remain.

## Verification

- Existing cv-preview-toolbar.browser.cjs passes all three designs/seven viewports with added hover-leave while focused, automatic Close focus, restored Expand focus, actual Tab/Shift+Tab, Escape/window-blur dismissal, repeated keyboard open/close and no tooltip after touch activation. Existing page text/count/order, source selection, scroll/focus, unsent draft, export readiness/stale guards and 46 prepared print contexts pass. Zero external requests/page errors. No native PDF generation/parity rerun.
- Independent synthetic before/after proof at 1440x1000 and 390x844 reproduces Close and Expand stuck in production code, both absent after the fix with mouse away, while focus remains correctly restored. Six repeated keyboard-open/Escape-close cycles pass. Screenshots inspected.
- CV renderer/design registry, document CSS, browser-print module and section snapping compared unchanged. Syntax/diff checks pass. CSS bundle differs only in build marker.

Local preview: http://127.0.0.1:8789/?sample=1. Build 2026-10-23-preview-tooltip-local. Synthetic screenshots/results/review.diff under ignored output/pdf/preview-tooltip; full toolbar results under output/pdf/preview-toolbar. The before/after helper is TEMP/drafted-tooltip-proof.cjs. Physical mobile devices not tested. No publication.

DEV-076 continues in this worktree without discarding this tooltip fix. Current combined local build is 2026-10-23-source-preview-local; source-only demo uses port 8791. Both changes remain unpublished.

## Published with DEV-076

2026-10-23. Owner-approved PR22, candidate f33602e, production merge 1e7b1e5, release 2026-10-23-source-preview. Pages success, served asset hash verification and published actual-site mocked desktop/mobile/overlay tooltip checks pass. See ORIGINAL-CV-PREVIEW.md final receipt; earlier local-only statements are historical. No real upload/model/backend execution.
