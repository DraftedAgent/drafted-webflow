# Two fixed Drafted URLs — prepared, not published

Local candidate: `2026-10-27-editor-workspace-pages`. Production remains the earlier single-page build. No Webflow page, custom code, domain, backend or hosting setting was changed.

## Prepared files

- `bootstrap.html`: replacement for the existing Drafted `latest.json` footer loader, shared by Home and Editor. Install once; do not add it alongside the previous loader.
- `editor.html`: standalone local editor-page shell. The preview server serves this file at `/editor` and injects the shared bootstrap plus explicit localhost-only endpoint mocks. Its local `site-layout.css` link is a preview dependency; Webflow supplies the site's real stylesheet instead.
- Existing root JS/CSS and manifests contain the local candidate. The bundle uses the existing Webflow inputs and editor components, with one set of handlers.

## Exact Webflow work remaining before any approved release

1. Create a normal empty page named Editor with slug `editor` in the existing Drafted site (`69274d644620cf7c511b74e1`). Use the site's existing global stylesheet/body class `body`. The new page has no page ID yet. Do not add another copy of the editor or forms to this page.
2. Replace the existing Drafted footer bootstrap with `bootstrap.html` for both Home (`69274d654620cf7c511b7508`) and Editor. The live HTML currently contains one inline `latest.json` loader; check whether its editing location is the page footer or site footer and replace it there. Ensure it executes once on each page, not once at site level and again on the page.
3. Keep Home's current Webflow markup/component IDs. The shared bootstrap on a direct Editor load fetches Home's public HTML using `GET /`, imports only `.navbar` and `.page-scroll`, strips embedded scripts/code blocks, then loads the same app bundle once. This shares the actual component markup; it does not execute Home's bootstrap, copy private workspace data through HTML, add a second implementation or use an iframe. The inactive view is hidden/inert; it takes no space behind/below the active editor.
4. Add `interactive-widget=resizes-content` to the viewport meta setting where Webflow permits it; the app also handles VisualViewport resizing without relying on that setting. There must be only one viewport meta element.
5. Preview the new page with the exact candidate assets and isolated/mock endpoints. Verify direct `/editor` load and reload, `Back to setup`, native history, one app script/handler set and retained original-file preview. Confirm no old global wheel/touch suppression has been added in site/page custom code. The inspected published HTML and repository contain no such handlers; the obsolete shared snap-scroller is superseded by the candidate's scoped page layout.
6. Only after separate explicit approval, deliver candidate assets through the normal feature-branch/PR/Pages process and publish the concrete Home/Editor Webflow changes to the intended domain. Both the new URL and bootstrap must be included in that same approved delivery. Verify served hashes and actual `/editor` responses afterward. Do not release the asset change alone while `/editor` still returns a 404.

The local server and actual-Webflow-markup browser preflight exercise this prepared shell. No general router or new framework is needed. In-app navigation uses two explicit History API destinations; a direct visit/reload uses the actual Editor shell and browser-local saved state. CV/job text never appears in a URL.

See `dev-system/EDITOR-WORKSPACE-PAGES.md` for the state inventory, restore rules, validation and limits.
