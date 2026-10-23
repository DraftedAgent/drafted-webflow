# A4 CV document layout — step 1

DEV-060 (local step 2): [CV-PDF-EXPORT.md](CV-PDF-EXPORT.md) now describes a real local PDF candidate reusing this renderer, packaged fonts, version guards and independent page-by-page raster/text verification. The deployed export/backend remains unchanged; the historical step 1 boundaries below still describe that release.

2026-10-22, DEV-058. Local implementation from `codex/discovery-draft-proposals` commit `ed749a6815756f3c038da2e846f13a889d4c7ce1`, in the separate `editor-isolated-base` worktree on `codex/editor-current-base`. The publication candidate is isolated on codex/a4-preview-delivery from main 3e26e896464725611cbb1400d91a8099d5dab570; unpublished discovery/source-proposal work from the preparation branch is excluded. This is a presentation change. No new CV schema, content rewriting, discovery/Tailor/backend changes or production delivery.

## Rendering and editor integration

`webflow/src/cv-document-layout.js` is the shared, endpoint-free DOM renderer. It consumes canonical ordered blocks and the document title, using `textContent` rather than interpolated source HTML. The shared physical template is `webflow/src/css/components/cv-document-layout.css`: A4 210 × 297 mm, 17 mm top / 18 mm side and bottom margins, 10.5 pt body, restrained dark blue headings, experience/education metadata, source-preserving lists, page-number footer. One design only. Metadata is displayed from its existing fields; unknown block types remain present. No source text is clipped or shortened, and no font size is reduced to fit a page.

Pagination runs in an unscaled, hidden-but-laid-out measurement host with exactly the same document classes/styles. It appends actual semantic content, checks rendered geometry and uses binary layout measurement to split oversized paragraphs/list items at fitting text boundaries. Word boundaries are preferred; unbroken words can wrap, and grapheme boundaries protect combined characters. Heading chains move with their next content when there is insufficient space for two measured lines. Ordinary short entries stay with their first content, while long entries can continue across pages. No character-count page estimate. Font readiness/loading triggers a fresh pagination pass. A completely empty document has no artificial blank page.

Viewer slots reserve each page's scaled dimensions. A ResizeObserver changes the visual scale only, capped at 100%; the fixed document geometry, font sizes, content and break positions do not change when the panel is resized. The outer `.cv-document` remains the scroll container. Narrow panels necessarily display small text when fitting an entire A4 width; there is no zoom control in this step.

All fragments of an original block retain the same `data-block-id`. Existing delegated click/Shift-click and the editor's selection set remain the authority; selection styling now reaches every fragment and range selection deduplicates repeated IDs. No canvas/raster/PDF overlay replaces selectable DOM. Native text dragging and click-to-select-block behavior remain. As before, completing a click/drag invokes block selection and clears native selection. Title/section headings remain presentation, not invented CV blocks. All editor render paths (upload, direct edit, proposal preview/restore, Apply, Dismiss) call the same renderer, and the preview heading reports the actual rendered page count.

The old editor's `buildStateFromBlocks` normalization is unchanged. This layout neither writes to incoming blocks nor reconstructs canonical state from the DOM. Copy text and PDF export continue reading the existing canonical state, never fragments/page numbers/section decoration. Existing ordinary proposal preview/state ownership is unchanged; this task does not resolve CDQ-01.

## Verification

Run with Node and Playwright available, using installed Edge:

```powershell
node tests/cv-pagination.browser.cjs
node tests/editor-discovery.browser.cjs
node tests/discovery-outcomes.browser.cjs
node --test tests/experience-discovery.test.cjs tests/discovery-transport.test.cjs tests/discovery-background.test.cjs tests/discovery-negative.test.cjs
```

The dedicated whole-editor A4 test uses synthetic upload/edit/export responses and blocks outside traffic. Short / multiple-entry / long-title-and-bullet fixtures render 1 / 5 / 4 pages in local Edge. It compares every source text character across fragments, checks fixed A4 dimensions, content/page bounds, no empty pages or orphaned heading chains, unbroken-word wrapping and unchanged font size. Eight desktop/tablet/mobile/landscape viewport sizes keep identical page contents/breaks. It covers selection across fragments, Shift range selection, native text drag at narrow width, actual mouse wheel scrolling, and page-count shrink and growth after the existing direct Apply flow (4 → 1 → 4). Export regression captures unchanged canonical blocks, title and `classic_v1` request; binary download is fulfilled locally, not claimed as a rendered PDF test.

Existing whole-editor geometry tests use measured text-line coordinates for dragging at small visual scales and count unique selected block IDs rather than the number of page fragments. Existing editor and outcome regressions run against the same production-bound bundle. The preparation branch also verified its unpublished source-proposal integration; that code is excluded from publication.

Local preview uses the existing whole-editor server with `DRAFTED_PREVIEW_CV=short`, `multi` or `long`. This environment switch selects synthetic input only, not another document design. Click **Try a synthetic CV and job ad**. The layout fixture uses an empty local advisory plan instead of inventing CV evidence for an unrelated mock job ad. The default preview scenario is unchanged. Do not enable `DRAFTED_REWRITE_TEST_APPROVAL`; all external execution remains outside this task.

## Exact PDF export — remaining step 2

The current Export PDF button still posts the original request to the existing backend `classic_v1` renderer. It does **not** use the new template and is not claimed to match the preview. No backend/PDF renderer was executed or changed here.

To achieve parity, the PDF service must run this exact versioned DOM renderer plus shared document CSS in a dedicated document shell, using the same canonical blocks/title. It must wait for identical fonts to finish loading and for pagination to finish, then print the already paginated page slots at A4 with zero printer margins, 100% document scale, no browser headers/footers, and backgrounds enabled. The stylesheet includes physical print-page rules; viewer scaling, interaction highlights and screen gaps must not enter the PDF. This is reuse of the same semantic document and pagination, not reimplementation as a different backend HTML template. The current endpoint/template allowlist integration needs its own reviewed step; this document changes no contract.

Parity requires pinning the browser engine/version, font files/font metrics and rendering settings. This step uses Arial with the operating-system sans-serif fallback: another OS/font or browser can produce different breaks. Supply the same legally available font resources in both environments (or adopt a shared bundled font in the common template), freeze a layout version and compare fixture page counts, text/order and page raster geometry before claiming exact correspondence. Matching visual layout does not imply byte-identical PDFs; timestamps/metadata need separate deterministic handling. Current local tests establish Edge preview behavior only; PDF page parity, runtime renderer support, print output, PDF accessibility and byte reproducibility remain unverified.

No merge, publication, n8n mutation or external model execution is authorized or performed by step 1.
