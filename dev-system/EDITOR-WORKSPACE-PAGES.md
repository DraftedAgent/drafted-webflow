# Separate editor workspace — local implementation

Owner scope: inspect and implement two URLs locally, retain work on navigation/reload, preserve backend contracts, prepare deployment requirements and do not publish. This is a bounded UI/navigation/recovery implementation, not a professional profile, account storage or new backend contract. No formal DD was created.

## Implementation observed before this change

The Webflow Home HTML contains hero, `#section-input`, `.section-editor` and `.section-cta` inside `.page-scroll`, with the navbar initially outside it. One footer loader fetches GitHub Pages `latest.json` and injects the root CSS/JS. `DraftedWorkspaceView.flow()` groups the live navbar with the hero. Editor startup requires both setup inputs and the editor DOM; multiple event handlers close over these same nodes.

`drafted-editor.js` owns current CV title/version/language, canonical blocks, derived text/ranges, selection, chat history, pending suggestion/proposal and its temporary preview/base snapshot. It has no existing durable workspace storage. Job text lives in `#job-ad-input`, extracted job context in `window.__DRAFTED_JOBCONTEXT__`; existing input handling debounces extraction. Discovery has its own `Session` with original answers, identities, revisions, current question round and advisory interpretations. Its editor adapter owns the current UI/drafts. Tailor source application groups/history live in `Ledger`; the review card has callback-bound proposal/request data. The uploaded original is a live `File` plus a PDF.js view, with no persistent blob URL guarantee. Editor zoom/design and pane scrolling are presentation state.

No global wheel/touchmove suppression was found in repository JS or the inspected published inline scripts. The problem is the shared fixed, mandatory-snap scroll container combined with nested work panes. The new page stylesheet uses ordinary document scrolling for setup and a fixed viewport workspace with independent pane overflow for the editor. The old shared-scroll tracking exits after grouping the existing header/hero; it does not manage the two-page layout.

## Fixed navigation and initialization

`workspace-pages.js` owns only `/` and `/editor`. It never parses CV/job text from a URL. The existing UI mounts once and its inactive view is hidden/inert; transitions use History API and the same live nodes/handlers. Setup shows hero and upload only. Editor shows only the full-window workspace, with `Back to setup` and the job-description modal in the existing topbar. Native Back/Forward toggles those views. A browser-restored older document reloads into the latest saved workspace rather than overwriting newer work from a stale bfcache instance. Stored sequence checks also reject older IndexedDB writes.

The existing upload response validator and block builder still run. Only valid, ready editor data can transition. The file's SHA-256 identifies unchanged original bytes: Continue reopens existing work without parsing/upload/model calls. A different file requires an explicit replacement dialog before processing; cancellation or processing failure preserves current work. Choosing a different file by itself does not reset the old workspace. A job-ad-only edit uses the existing extraction flow, invalidates obsolete suggestions and preserves CV blocks. Tailor still requires its explicit action. A double-click guard covers both the asynchronous file comparison and upload.

`pages/bootstrap.html` is the prepared shared Webflow footer. A direct Editor document imports Home's public component markup without running its scripts, then loads the existing bundle once. This is necessary because current startup binds both setup and editor nodes. It preserves one implementation and handler set. `pages/editor.html` is a runnable local shell, not an already-created Webflow page. `pages/README.md` lists the exact remaining configuration/publishing steps.

## Recovery scope

`workspace-store.js` creates a tab-scoped ID in sessionStorage. Its versioned state mirror contains structured data, never rendered chat HTML. IndexedDB stores the workspace record and the actual selected/committed original `File` bytes separately. Only the two currently referenced files are retained per workspace; superseded file records are pruned atomically. Edits do not rewrite an already-stored file on every scroll/keystroke. No personal content is sent to a new service or inserted in a URL.

Restored work includes:

- Current CV version/title/language and exact canonical block IDs, order and metadata, plus derived presentation state.
- Selected/full scope, design/zoom, chat transcript and backend history, editor draft, pending proposal/suggestion and the proposal-preview base snapshot. Cards are rebuilt through the existing code, not persisted as executable HTML. Proposal-card button text is not duplicated into the transcript.
- Raw job text, extracted context/status and an unsaved open job-edit draft.
- Discovery context, round IDs, original answers/revisions, current draft and archived earlier-context answers. Interrupted interpretations become retryable states; advisory output is never promoted to confirmed facts or CV text.
- Tailor review/request/omission state, current context draft, applied stamp and application ledger/history. Applications whose source IDs belong to an earlier question context are not submitted as current answers for a new job's round; original history and current CV wording remain available.
- Source-file identity and preview through reconstructed `File` objects/DataTransfer, plus workspace/pane reading state. Blob URLs are not stored or assumed to survive reload.

Reload does not resubmit upload, chat, extraction, Discovery or Tailor. Interrupted network work is visible and requires an explicit retry. Invalid/missing browser storage blocks Continue with a relevant message instead of claiming recoverability. Missing original bytes do not erase canonical editor work; the UI asks the user to choose the source again. Selecting the same bytes reattaches it without replacing the CV. This is one browser tab's workspace, not cross-device/account synchronization or a supported concurrent multi-tab editor. Browser storage deletion/private-mode restrictions can prevent restoration.

## Context safety and layout

A persisted context revision plus CV blocks/version/job stamp rejects late chat/rewrite replies after a job or CV change. Existing Tailor/source validators remain intact, with the current stamp checked before review/apply. Editing a job never invokes rewrite/tailor automatically. Prior experience answers are kept as earlier source history, separate from the new question round.

The editor container fills the visible viewport. Chat history and the document scroll independently; composer and workbars keep their existing component logic. The small-screen layout uses VisualViewport metrics, including keyboard resizing. While composing in a short visible viewport, chat receives the available space and the document returns after keyboard closure. The job-edit modal is constrained to the visible viewport and scrolls if needed. No home/footer exists in the editor's visible or scrollable layout.

## Validation and boundaries

Synthetic browser checks cover upload with/without ad, malformed/failed processing, direct empty Editor entry, real shell reload, unchanged-file reopen, replacement confirmation/cancel/failure/success, native history including cross-document navigation, original-file preview recovery, chat, pending proposal preview/dismiss/Apply, answer/draft restoration, Tailor/context clarification/review/Apply, late old-job replies, independent wheel scrolling, desktop/laptop/mobile and keyboard viewport geometry. Storage-unavailable behavior is tested without a backend request. Tests block external backend/model execution.

The prepared Editor shell was also exercised against the actual public Webflow markup and CSS with candidate assets and mocked backend replies. Existing preview-toolbar regression covers all three designs, seven widths, zoom, selected/full contours, expansion, focus, copy and print preparation/stale-export rejection. Native OS Save-as-PDF and a physical iOS/Android keyboard are not automated here; keyboard geometry is emulated. No real parsing/model quality evaluation or production backend execution was performed. No publication, new Webflow page or external configuration write occurred.
