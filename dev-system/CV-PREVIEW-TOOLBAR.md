# CV preview toolbar - local implementation

2026-10-23. Explicit owner request to implement here as main agent. Separate worktree `preview-toolbar`, branch `codex/preview-toolbar`, from fetched production `79484119dc9e24d5492a02db7831a56ff7311e47`. No other checkout edited. Presentation/UI only; no backend/API/model/n8n/subscription changes. No commit, push, PR, merge or publication.

## Change

Global topbar retains Drafted and ellipsized document title, including mobile. The single compact preview row lives directly above the right pane: CV preview, live count, selected design, native expand/export/copy buttons. On narrow screens the heading is visually hidden with its accessible name retained. No secondary menu or explanation row. Native touch targets are 36-40px with spacing. Tooltips display on hover/focus, dismiss on Escape/click, and controls have English accessible names.

The same toolbar/card/page DOM moves into the expanded dialog and back; expand is replaced by Close. The original dialog focus trap, Escape, source selection, reading anchor and exact prior pane/outer-scroll restoration remain. No control/document duplication.

The only visible PDF action is `Export PDF`, which invokes the existing browser print dialog. Classic controls are removed from DOM before their legacy binding; no server export request is reachable through this UI. Legacy server export code remains untouched, without an exposed button. No direct-download claim. Complete `prepare()` including font waiting, ready-layout, page identity/stale guards, same paginated DOM copy and selection/UI stripping is byte-equivalent after newline normalization. Document renderer/design registry unchanged. UI-only CSS rules leave physical pages/fonts/breaks intact.

The native select can match focus-visible after pointer activation in Chromium. Pointer-modality attribute suppresses only its outer ring; keyboard input clears it and shows a neutral grey outline. Native option highlighting and CV block selection unchanged.

## Verification

`node tests/cv-preview-toolbar.browser.cjs` PASS with Playwright supplied through NODE_PATH. Reuses existing local whole-editor server, synthetic long-special CV and toolbar regression. Three designs across seven viewports: 1920x1080, 1440x1000, 1366x768, 1024x600, 390x844, 320x640, 844x390. Normal and expanded placements/fit, single export button, keyboard/hover tooltips, mouse/keyboard select focus, copy, dialog trap/Close/Escape/focus, identical live nodes, selection, exact scroll restore and unsent instruction retained. Per-design page text/count/order compared with production baseline. Selected-design prepared print context checked 46 times, including design switches within expanded mobile preview and one successful retry after deliberately stale export rejection. Fonts ready and no tools/selection in the print DOM. Real touch emulation verifies one-tap expand/copy/export/close. Zero outside requests/page errors.

The print dialog is stubbed to capture its actual prepared document and emit afterprint; no native PDF save/full visual-PDF verification rerun for this toolbar-only change. Existing A4 and native PDF test expectations updated for the intentional single-export UI; those broader suites not rerun. No actual backend/model execution.

Screenshots of complete synthetic CV reviewed on desktop and expanded mobile. Before/after toolbar comparisons and 320px/mobile/expanded screenshots, `results.json` and `review.diff` are under ignored `output/pdf/preview-toolbar/`.

Local preview: http://127.0.0.1:8786/?sample=1 (complete synthetic header). Run `PORT=8786 DRAFTED_PREVIEW_HEADER_CASE=complete node tools/serve-editor-preview.cjs` using the shell's environment syntax. Build: `2026-10-23-preview-toolbar-local`. Source/root outputs match the build; generated CSS preserves historical bytes outside the two edited source imports and build marker. `git diff --check` passes.

## Owner-approved publication

Owner explicitly requests publicera after local review. Remote main rechecked at 7948411; same isolated worktree and exact UI-only scope. Build 2026-10-23-preview-toolbar differs from tested local assets only in version marker. Pages legacy main-at-root delivery verified. No Webflow/backend/n8n/billing/model operation. Rollback baseline 7948411 through a new scoped restoration, preserving intervening changes; do not rewrite main. Exact candidate preflight on actual Webflow DOM with all backend requests intercepted, then expected-head/base merge and Pages/served-hash/published-UI verification. No full native PDF save/parity rerun for toolbar-only work. Final receipt follows.
