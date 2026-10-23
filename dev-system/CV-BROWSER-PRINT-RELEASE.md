# Browser-print release receipt

2026-10-23. Owner-approved release of the reviewed native browser-print option and its three shared presentation variants. Production base: 8889c586d1da87cd01d2eab7b44d2e1c8fe6ef99. Branch: codex/browser-print-release. Build: 2026-10-23-browser-print.

Scope: shared renderer/readiness, Classic/Compact/Editorial, packaged fonts and license, design controls, Print / Save as PDF and English save instructions. Existing overlay retained. Legacy Export PDF (Classic) implementation and payload remain unchanged; selected design applies to browser print only. No server renderer, n8n, account, subscription, payment or Webflow-setting mutation. Draft PR #12 and unrelated changes remain separate.

Local candidate checks: node syntax; git diff --check; existing A4 whole-editor short/multi/long 1/5/4 across eight viewports, overlay node identity/Close/Escape/focus/scroll/block/text selection and unchanged canonical legacy-export payload. Reused native-print proof driver: real desktop Chrome saves after Apply, 4/3/4 pages; stale design/resource delay/cancel and narrow controls; Editorial prints from overlay. Independent Poppler/pypdf verifies all 11 pages, complete geometric text/order, embedded fonts, zero page images and full URL/mail annotations. All pages visually reviewed beside preview proofs. Existing raw reading-order/raster differences and unverified physical-mobile/native-Edge behavior are explicitly retained in CV-BROWSER-PRINT.md.

Deployment must verify exact PR head/base, Pages success, public asset hashes and actual Webflow DOM with synthetic backend interception. No real production upload/rewrite/export/model execution is part of verification. A receipt-only feature commit records the final deployed state after verification.

Rollback: restore files changed by this release from the recorded production base in a new reviewable revert commit, account for any intervening main changes, publish and verify through the same gates; no reset/force push or unrelated workflow restore.

## Verified publication

- PR #14: https://github.com/DraftedAgent/drafted-webflow/pull/14. Exact reviewed head eaa2a6812969cf0a703054ada6e596c5a4afb83d, expected base 8889c586d1da87cd01d2eab7b44d2e1c8fe6ef99, clean/mergeable, no configured PR checks/status contexts. Expected-head/base merge succeeded at c616de8188b4af38d8bf50949650704c622eb4a4.
- GitHub Pages run 39918748140 completed successfully: https://github.com/DraftedAgent/drafted-webflow/actions/runs/39918748140. Build 2026-10-23-browser-print. All five public asset SHA-256 values match the exact committed candidate; CORS permits cross-origin font loading.
- Actual https://drafted-cad750.webflow.io/ with published assets: short/multi/long Classic counts 1/5/4; design cycles Classic/Compact/Editorial give 1/1/1, 5/4/5 and 4/3/4. Each prepared print copy has identical current page text/count, selected design and loaded fonts, without UI/selection artifacts. Desktop/mobile overlay identity, focus/scroll, block selection and wheel scrolling pass. Legacy export intercepted after Editorial selection still sends classic_v1 and complete original blocks. Four synthetic mocked backend requests per fixture; zero real backend requests, unexpected calls or page errors. Native PDF files were produced locally from the exact candidate, not through a production backend.
- No full Webflow publish, n8n call/change, new service/account/subscription or model execution. No other worktree was modified. This final receipt is a feature-branch documentation commit, not another main asset release.

### Served asset SHA-256

- drafted-editor.js: e7e7690cd27bb57335dec2bd43fda1c9c5dfcba9f524242bbd49d0f7c46b89f3
- drafted-editor.css: 7c03c79cbc5985a42ad1ffc37ed1a23828fe5a9eb4f3208dd828b10db21a539a
- latest.json: 8a9c0e0e49b2635ce93c8de88c06a3d0e03df0aef2c5211e0b6ec37c256fec49
- webflow/assets/fonts/LiberationSans-Regular.ttf: f8ace1f892b2bd9dc1792ba7f097fa7588f84fed48321480e04de5390828221f
- webflow/assets/fonts/LiberationSans-Bold.ttf: 361c61b82d575c5c35fd9157fda8b0194bcfcd0d88ea8521a4fb5dd53d33dddc
