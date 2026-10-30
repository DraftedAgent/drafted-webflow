# Drafted: isolated local site

Current local entrypoints and release procedure:
[stable reference and dev](local/README.sv.md). Stable is pinned to a local Git
commit on port 8827; dev uses the working tree on 8825. Both default to synthetic
responses. The independent dev integration mode on 8826 starts blocked by default.
DEV-163 separately approved its current live local session and exact upload-origin
change; see [connection verification](integration/connection-verification.json).

Local-only implementation, 2026-10-30. No Webflow publication, hosting choice,
domain change, production workflow execution or backend mutation is included.

## Run

From the repository root, with Node 22:

```sh
node tools/build-standalone.cjs
node tools/serve-standalone.cjs
```

Open `http://127.0.0.1:8825/`. The editor has the fixed address `/editor`.
The server binds only to loopback. `PORT` can select a different local port.
Upload any **synthetic** PDF to try the flow: the original preview reads that
file, while the local processing response deliberately returns an Alex Example
fixture. It does not parse the file into a real CV and does not call AI.

`site/dist/` is generated and ignored by Git. It is **not a production deployment
package**: backend endpoints are synthetic and the response CSP permits only
local resources. The fetch guard also rejects external destinations. The server
only forwards the seven allowlisted local endpoint paths to existing fixture
handlers; it has no upstream proxy. Do not expose this development server.

## Source selection and rollback

- Published baseline: `20ba13d806ac6bd45f582605600be239a4eefd6b`, build
  `2026-10-30-hero-motion-ready`. Fresh remote main still matches this revision.
- Retain the newer structured experience context, Skills protections, review
  controls and Original/Edited implementation from this baseline.
- Retain the local DEV-157 initial-HTML hero correction and exact approved
  2400 ms geometry. Geometry SHA-256:
  `c048913bc11db7a1f097f7f9dd217c9ea342c7abdd0d49990e4f86ea545869a5`.
- Adapt only storage/page-view support from the older `dff59b8` separate-editor
  candidate. Do not copy its older editor bundle over the current editor.
- Work is on `codex/standalone-local`. The earlier worktree is retained.
  `output/pdf/standalone/before.patch` and `protected-before.json` record the
  starting local diff and generated-output hashes; earlier untracked hero
  sources remain in place.

The new builder reads shared components and writes only `site/dist/`. It checks
that root `drafted-editor.js`, `drafted-editor.css`, `drafted-hero.js`, `latest.json`
and `webflow/latest.json` remain byte-for-byte unchanged. These root files already
contained the unpublished DEV-157 candidate at task start. They are deliberately
not rebuilt by this task. Returning to the public version requires no deployment
rollback, because nothing public has changed.

## HTML, navigation and persistence

`shell.html` and `base.css` replace the Webflow page skeleton/reset. There is no
Webflow script, generated site stylesheet, form wrapper, Turnstile integration,
jQuery, WebFont or CDN dependency in this build. Existing component selectors
remain, sharing the current editor implementation rather than duplicating it.

Both initial responses specify their correct view before painting. The homepage
contains the real hero/start SVG and critical styles in its response. Its small
early runtime is independent of editor initialization and `load`. Text and CTA
never wait for animation. Reduced motion, no JavaScript and failed animation
retain the approved static identity. The header logo remains static.

Two fixed views use native links/history, with no general router. Validated upload
finishes before entering `/editor`; `Back to setup` restores `/#section-input`.
Same-tab back/forward and unchanged-file continuation reuse current work without
new processing. A changed job ad invalidates stale proposals but does not rewrite
the CV. Replacing the CV requires the explicit replacement dialog; a failed
upload retains the previous work.

The workspace uses per-tab sessionStorage identity/mirror plus IndexedDB records.
It saves canonical blocks with IDs/order, version/title, immutable Original and
current Edited, comparison mode, selection/zoom/reading position, job context,
chat/drafts/pending suggestions, discovery source revisions/drafts/history,
tailoring review and application ledger. File/Blob bytes are stored separately;
fresh File objects and preview URLs are constructed after reload. A missing file
record is reported while recoverable editor state is retained.

An exit checkpoint runs before navigation aborts fetch. Later rejection/finally
callbacks cannot overwrite the pending-request snapshot. Restored requests show
an interruption message; they are not submitted again. Storage failure is visible
and blocks advancing into an unsaved workspace.

This is browser-local continuation, not an account database or a guarantee of
durable storage. Browser cleanup, eviction/private-mode restrictions and closing
the tab can remove access to the session. Storage does not transfer across origins,
browsers or devices. Existing live Webflow work is in-memory and is not silently
imported. Simultaneously editing duplicated tabs has not been validated.

## Read-only dependency inventory

Authenticated Webflow Designer inspection found Home as the only ordinary page,
plus Password and 404 utility pages. The Pages panel showed no CMS Collection
pages; the CMS panel independently showed no collections. The public Home
response uses Webflow's generated CSS/runtime, jQuery, WebFont/Google Inter,
generic Webflow icons and an `email-form-2` form with a Turnstile attribute. The
Drafted upload/chat handlers use their own transports. No CMS, ecommerce or
Webflow API calls were found in the active Drafted source.

Site-level and Home custom-code fields remain plan-locked. Their complete saved
or unpublished contents could not be re-read. Public HTML, published assets,
known local embeds and the current page/CMS inventory were inspected; this is
not a claim that inaccessible unpublished settings were verified. Webflow's
submissions archive and optional site services have not been migrated. Password
protection is not implemented; unknown local URLs receive a simple own 404.

Local resources include the owner-approved brand vectors/geometry, unchanged
Liberation Sans fonts (SIL OFL 1.1, license retained), and PDF.js 6.4.299 with its
upstream license, CMap/font/WASM resources and bundled notices. UI uses the same
system-font declarations as the current Drafted components. No Google font files
or proprietary Webflow icon font are copied. An original favicon is reused from
the approved wordmark asset. No new asset license has been inferred.

All seven current active n8n workflow definitions were read through GET requests,
without executing a workflow or model. The safe receipt is
`output/pdf/standalone/backend-audit.json`. **Upload (`6Bvk0NYcElT9OirH`) explicitly
allows `https://drafted-cad750.webflow.io` as its origin.** The other six inspected
definitions expose no explicit allowed-origins/header setting. Absence is not
proof of a working connection from another origin. No Webflow-specific references
were found in those six definitions. Existing endpoint paths and contracts remain
unchanged. Any new-origin configuration is a later separately scoped operation.

## Verification and evidence

Use the installed `playwright` package with Edge available. Tests launch isolated
browser contexts and local fixture servers; requests outside the local test
origin are aborted, including Webflow scripts/CDN/forms. No production execution.

```sh
node tests/standalone.browser.cjs
node tests/standalone-recovery.browser.cjs
node tests/standalone-first-paint.browser.cjs
node tests/standalone-document.browser.cjs
python tests/standalone-pdf-verify.py
```

PDF verification requires Poppler `pdftoppm` on PATH, Pillow, pypdf and pdfplumber.
Evidence is in ignored `output/pdf/standalone/`:

- `flows.json`: upload with/without job, errors/replacement, source preview/modal,
  history/reload, chat proposal Apply, discovery/source context, Tailor Apply,
  immutable Original/Edited, stale responses, zoom/selection, four viewport sizes.
- `recovery.json`: exact original PDF bytes, reading positions and independent
  scroll, interrupted request without replay, missing files and blocked storage,
  200% text. Small keyboard viewport is simulated, not a physical mobile keyboard.
- `verification.json`, cold-navigation MP4s and timestamped frames: fresh contexts,
  cache cleared/disabled, 1.6 Mbit/s, 180 ms latency, 4x CPU throttling, editor JS
  independently delayed six seconds. Both desktop/mobile measured CLS 0; hero
  started before editor/load, with no legacy content or final-to-start jump.
  Static/reduced-motion/failure cases also pass.
- `document-equivalence.json` and `pdf-equivalence.json`: published-baseline versus
  standalone Classic/Compact with one/two-page documents. Exact normalized DOM
  geometry/line breaks/font styles, equal exported text coordinates and dimensions,
  and pixel-identical Poppler renders. Export is invoked through the actual button;
  the native dialog is intercepted and its prepared DOM printed with Chromium.
  User-specific native printer/dialog settings were not changed or certified.
- Desktop/laptop/mobile screenshots, PDF page renders and the playable evidence
  gallery `http://127.0.0.1:8825/evidence/playback.html`.

55 targeted unit tests also pass for session restore, discovery transport/session,
structured contexts, source bindings/client and Skills delta behavior.

## Separate work before a real test deployment

**Current owner direction: continue locally; no hosting selection or preparation.**
See [local integration approval](integration/APPROVAL.sv.md) and
[manual test guide](integration/MANUAL-TEST.sv.md). Build the separate blocked
integration package with `node tools/prepare-local-integration.cjs`, then run
`node tools/serve-local-integration.cjs` at `http://127.0.0.1:8826/`.
The default synthetic site remains at port 8825. Both show an explicit mode bar.
Actual backend activation and the exact n8n origin change require approval first.
The following deployment considerations are deferred, not current tasks.

Select suitable hosting and configure `/editor`, redirects/404, HTTPS, caching,
security headers and backend configuration as one reviewed deployment. Verify the
actual new origin against every n8n endpoint, including preflight, multipart
upload/size limits and error responses. Fix the known upload origin restriction
with an approved rollback-backed change. Local synthetic tests cannot establish
those results. Revisit abuse controls/authentication and durable storage before
public use; the removed Webflow challenge is not replaced with pretend protection.
Check actual mobile browsers/keyboards and target print environments. Recover any
needed inaccessible Webflow settings before retiring the account. Domain, database,
hosting, publication and account cancellation remain outside this local stage.
