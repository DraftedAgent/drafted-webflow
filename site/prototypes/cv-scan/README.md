# CV scan motion study

Standalone local prototype controls and synthetic document. The approved renderer in `site/cv-analysis-scan.js` and its stylesheet are now shared with the local Dev upload flow; the prototype page and its controls are never imported into Drafted.

Start from the repository root:

```sh
node tools/serve-cv-scan.cjs
```

Open http://127.0.0.1:8828/. This server only serves the study and the existing logo. Its CSP blocks all fetch/WebSocket connections; it has no POST/API routes. The CV is synthetic HTML, not the owner's document or an OCR result.

The SVG overlays are measured against the rendered text elements, including after resize. A 4.8-second downward pass has a 0.8-second quiet interval. Local highlights and small registration details follow the line. No percentage, completed-stage labels, random particles or document movement. The sequence repeats indefinitely and suspends in a background tab.

Preview controls provide replay, pause, slow playback, reduced motion, a simulated response and a simulated error. The OS reduced-motion preference always wins: static subdued outlines, no scan movement. State changes remain available in that mode.

`window.DraftedScanPreview.start()`, `.complete()` and `.fail()` are synchronous visual lifecycle controls for this study. Completing or failing cancels animation immediately and removes the overlay without waiting for a cycle. No automatic completion timer exists. Error copy and retry are visible; the paper stays intact. Dev now connects the shared renderer to its actual upload request and derives regions from the original PDF.js text layer. If no text layer exists, it shows the line without inventing regions. The standalone controls remain a review tool only.

Verification: `node tests/cv-scan.browser.cjs` with Playwright available through NODE_PATH and installed Edge. Tests use an isolated server and synthetic document, block external traffic, and cover stable text/layout, aligned regions, looping, immediate completion/error, retry, pause and mobile/system reduced motion. Screenshots and verification receipt are in ignored `output/pdf/cv-scan/`.
