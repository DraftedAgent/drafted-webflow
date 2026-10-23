# Browser-print release receipt

2026-10-23. Owner-approved release of the reviewed native browser-print option and its three shared presentation variants. Production base: 8889c586d1da87cd01d2eab7b44d2e1c8fe6ef99. Branch: codex/browser-print-release. Build: 2026-10-23-browser-print.

Scope: shared renderer/readiness, Classic/Compact/Editorial, packaged fonts and license, design controls, Print / Save as PDF and English save instructions. Existing overlay retained. Legacy Export PDF (Classic) implementation and payload remain unchanged; selected design applies to browser print only. No server renderer, n8n, account, subscription, payment or Webflow-setting mutation. Draft PR #12 and unrelated changes remain separate.

Local candidate checks: node syntax; git diff --check; existing A4 whole-editor short/multi/long 1/5/4 across eight viewports, overlay node identity/Close/Escape/focus/scroll/block/text selection and unchanged canonical legacy-export payload. Reused native-print proof driver: real desktop Chrome saves after Apply, 4/3/4 pages; stale design/resource delay/cancel and narrow controls; Editorial prints from overlay. Independent Poppler/pypdf verifies all 11 pages, complete geometric text/order, embedded fonts, zero page images and full URL/mail annotations. All pages visually reviewed beside preview proofs. Existing raw reading-order/raster differences and unverified physical-mobile/native-Edge behavior are explicitly retained in CV-BROWSER-PRINT.md.

Deployment must verify exact PR head/base, Pages success, public asset hashes and actual Webflow DOM with synthetic backend interception. No real production upload/rewrite/export/model execution is part of verification. A receipt-only feature commit records the final deployed state after verification.

Rollback: restore files changed by this release from the recorded production base in a new reviewable revert commit, account for any intervening main changes, publish and verify through the same gates; no reset/force push or unrelated workflow restore.
