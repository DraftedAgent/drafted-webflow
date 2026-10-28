# CV review presentation — local DEV-154, 2026-10-28

This describes the local candidate, not a published behavior or a new storage/API contract.

## Lifetime of Original

The current editor has an in-memory selected representation (`documentBlocksState`, title, CV version), proposal snapshots and a source ledger. The CV version identifies an endpoint representation; it is not a retrievable document-history store. No verified durable original or session-reopening endpoint exists in this implementation.

After a successful import has produced the canonical blocks, the comparison controller takes a detached, recursively frozen copy of the blocks and title. This is Original, before the first edit. Failed uploads do not create or replace it. A new successful import starts new editing work and replaces the snapshot. Apply, manual canonical edits, switching tabs, template changes and opening/closing the preview retain it. Reopening the editor within the same loaded page retains the same controller. Reloading or opening a different tab loses this in-memory session; the current application does not resume that work or reconstruct its original from history.

If an integration supplies an already edited canonical document without that import snapshot, Original and Show changes are unavailable and the toolbar explains this. It must not call the current document its historical original. Durable resumption would require a separately specified session/snapshot store and is outside this local change.

## Two mutually exclusive views

Original/Edited belongs to the preview toolbar. Original is read-only; Edited uses canonical blocks. Canonical changes select Edited without replacing Original. Show changes compares the complete ID union against the original snapshot, including added/deleted blocks. Equal or restored text has no highlight. Paint uses the existing word diff and exact source-text range mapping; no deleted text is inserted into Edited, no text is normalized, and no document markup or pagination is changed. Highlighting requires the CSS Custom Highlight API; its control is disabled when unsupported. Metadata-only changes are shown by the full renderer but text highlights apply to canonical block `text`, as in the existing change cards.

Review in CV temporarily hides that toolbar group, clears its paint and opens the full Suggested representation belonging to the pending proposal. Its local Current/Suggested/Show changes layer retains proposal/block identity and existing whole-proposal decisions. Closing local review restores Edited and the document comparison without dismissing the proposal. Apply uses the existing commit path; Dismiss and stale-result guards retain their existing meaning. Legacy proposal-preview state suspends the original comparison so it cannot be mislabeled as canonical Edited.

## Placement and reading position

Review controls are outside the renderer/export host. A sufficiently wide right margin receives the compact rail. Otherwise actual rendered text ranges, including headings and metadata, determine a clear band above/below the active block. On crowded pages the nearest safe whitespace can be beyond an intervening section: exact immediate adjacency cannot be guaranteed without covering text or changing the document layout. Navigation prefers centering the block, then scrolls enough to keep the chosen controls reachable. Oversized documents retain the user's zoom and normal horizontal scrolling. Scroll, scale and resize update the layer; a layer that follows its target out of view is hidden rather than partly clipped. Long block fragments retain their logical ID. Persistent button DOM preserves keyboard focus.

Document-version switching preserves the visible logical block/fragment and approximate offset when present. If that block does not exist in the other version, it preserves the relative scroll position and reports the absent block. It never substitutes the name block as a review target.

## Export

Suggested remains blocked, including the print shortcut. Original explicitly labels the action **Export edited CV**. That action uses the same renderer on an offscreen detached canonical snapshot, verifies that the canonical content/design did not change during preparation, and prints a visible, physically sized clone. It leaves the visible Original unchanged. A direct attempt to print the Original host is rejected. Review controls/classes and CSS highlight registries do not enter the print document. No production endpoint or export contract was migrated.

## Local evidence

`tests/document-comparison.browser.cjs` exercises the actual editor and Apply path with isolated synthetic endpoint replies; explicit manual edits use the existing canonical builder through a test-only injected hook. It verifies two Apply operations separated by an edit, frozen/deeply detached Original, cumulative text ranges, add/delete/restore, unavailable-history state, a new successful import, template/reopening preservation, pending-mode isolation, reading position, keyboard focus, scroll/zoom/mobile placement and explicit Edited export while Original stays visible. It also checks unchanged document HTML/page count when paint is toggled and a visible print clone with no review content. The hooks are not part of the shipped bundle.

Existing preview/review-layer and Skills regressions cover full version text, stale sources/job/CV, close/Dismiss, whole Apply, high zoom, multi-page/long blocks, safe Before/After range paint and the preserved Skills fix. All backend traffic is synthetic, local or blocked. Screenshots in ignored `output/pdf/document-comparison/` show page-two Skills with the side rail and the same Summary in Original/Edited after two Apply operations.
