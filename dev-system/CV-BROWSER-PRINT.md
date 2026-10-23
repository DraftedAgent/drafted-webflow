# Browser printing and shared CV designs

2026-10-23. The owner reviewed DEV-067's local prototype and explicitly approved publication with "publicera". This scoped release starts from production main 8889c586d1da87cd01d2eab7b44d2e1c8fe6ef99 in a separate codex/browser-print-release worktree. It includes the reviewed Classic/Compact/Editorial shared renderer, packaged fonts, design selector and native print control. It excludes draft PR #12's Node PDF backend, CustomJS adapter, n8n definitions and unrelated work. No subscription, payment or n8n change.

The original export payload builder/transport/download/error handler is byte-identical after newline normalization to the overlay release (also checked against 6c8b2f7). Its button is labelled Export PDF (Classic); the adjacent English note distinguishes this legacy route from Print / Save as PDF, which uses the selected design. The legacy route does not claim to match the new preview. The already published overlay is retained.

## Try and save

Run node tools/serve-editor-preview.cjs using the existing synthetic preview server with DRAFTED_PREVIEW_PDF_CASE=long-special. Open the localhost URL in desktop Chrome, choose Try a synthetic CV and job ad, select Classic/Compact/Editorial, then Print / Save as PDF. Expand preview also supports the same print control. How to save a PDF opens the English instructions:

1. Choose Save as PDF in the print destination list.
2. Use A4, 100% scale and no margins.
3. Disable headers/footers and enable background graphics.
4. Save with the desired file name and location.

The filename can default to the parent page title; the user chooses it in the native save dialog. Mobile browsers expose different system print/save/share controls. Cancel/afterprint cleanup reports only that the dialog closed, never that a file was successfully saved: ordinary page JavaScript cannot reliably detect the user's final save decision. The existing Export PDF implementation is preserved; its visible label now states Classic.

## Shared-document implementation

cv-browser-print.js waits for the current shared renderer generation, clones only its already paginated document host/page nodes, keeps the selected design attribute, links and original source text, and removes viewer scale/selection styling from the copy. It never rebuilds content or paginates separately. A same-origin offscreen iframe loads the exact same bundled stylesheet/font files as the preview. It waits for both explicit font weights, styles and layout, checks the original page identities again to reject a stale CV/design, then calls that frame's native window.print(). A print begun in the overlay creates its frame within the active dialog, keeping modal behavior intact.

The iframe contains no editor controls. Its outer html/body override only editor-shell viewport/overflow constraints; physical CV page CSS is shared unchanged. An initial genuine native-save test exposed clipping to the first page because the editor's global height/overflow rules leaked into the frame. The frame shell was corrected to auto height/visible overflow; final native saves include all pages. afterprint removes the frame and restores button focus; preparation errors/stale design remove it without opening print. Print availability follows fonts/current pagination. No request goes to the PDF service or n8n.

## Focused verification

Reused tests/cv-pdf.browser.cjs, fixtures/cv-pdf.cjs and verify-cv-pdf.py. The new DRAFTED_TEST_NATIVE_PRINT=1 mode has three edited long-special cases, one for each existing design. This release retains only the native path of that proof driver; server-export modes/backend remain in draft PR #12. tests/native-print-context.cjs creates a disposable, signed-out Chrome profile with Save as PDF/A4/100%/no margins/backgrounds/no headers preset and --kiosk-printing solely for unattended testing. It triggers the actual product window.print() path and reads the files saved by Chrome; no page.pdf(), backend render call or substituted PDF response generates those files. It does not touch the user's browser/printer profile. Chrome 155.0.8059.84 is verified. An Edge kiosk attempt did not produce a file; native Edge save is not claimed verified.

Checks are limited to the changed path: stylesheet preparation keeps the new button busy, a design change during preparation rejects the obsolete copy, simulated cancel/afterprint cleans up, buttons fit 320/390px widths, instructions are visible, Apply precedes each print, and one actual save is initiated within the overlay. Source/page signatures remain unchanged; existing PDF export request count stays zero. Three final native PDFs contain 4/3/4 pages, 11 total. All final pages are rendered with Poppler and visually inspected against actual unscaled preview DOM proofs. The proof fonts and element geometry are checked against the real preview by the reused harness.

Pypdf verifies matching per-page normalized text in geometric-layout extraction, complete applied text, Swedish/accent/currency/Greek characters, embedded Liberation fonts, zero rasterized document images and no editor/print-help UI. Exact HTTP/HTTPS/www/email/long-URL annotation destinations survive: 17/15/17 annotations, including full long targets. Link destinations are inspected without opening external sites or mail apps. No page errors/outside browser requests or external model calls.

## Observed limitations — no full-parity claim

Native output's default raw content-stream extraction moves section headings ahead of earlier text on 7 of 11 pages. Geometric-layout extraction matches the visible preview per page exactly; all characters are retained and the PDFs are tagged. This does not establish every PDF reader/accessibility/ATS reading-order behavior. Raw stream equality is reported separately and is false for those pages; it is not hidden by claiming that geometric equality proves identical streams.

The native raster comparison does not pass the older server-renderer 2px visual tolerance on every page: minimum ink correspondence 0.969466, raw RGB MAE maximum 23.6403/255, blurred maximum 13.7278/255. Text/rules show rasterization differences; some thresholded ink bounds differ more. Original server-mode strict raster/content-stream assertions remain in force. Native mode asserts the requested page count/content/link checks and reports visual/raw-order differences instead of claiming server-level identity. No image alignment or rescaling is used. Paper boxes show the existing Chromium fractional A4 rounding. User print-dialog settings can alter scale/margins/backgrounds and must match the instructions.

Actual save is verified on desktop Chrome, not on physical mobile devices/iOS, Edge's native save, or the Codex embedded browser. Mobile viewport checks cover the local UI only. The owner approved this native-dialog alternative after reviewing those limits. Other supported browsers/devices still need verification; publication does not establish their native-save behavior. No purchase, n8n update or formal DD is made.

## Reproduce and inspect

```powershell
$env:DRAFTED_TEST_NATIVE_PRINT='1'
node tests/cv-pdf.browser.cjs
python tests/verify-cv-pdf.py --proof-root tmp/pdfs/browser-print --pdftoppm <path-to-pdftoppm>
```

Example native PDFs and help screenshots are under output/pdf/browser-print. Raw proofs/JSON are in tmp/pdfs/browser-print and copied to output/pdf/browser-print/proofs for review. They are ignored by Git. Release build: 2026-10-23-browser-print. The mixed draft PR #12 is not merged. Publication and served-version receipt are recorded separately in CV-BROWSER-PRINT-RELEASE.md.
