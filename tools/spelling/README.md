# Local editor spelling

Runtime assets live in `webflow/assets/spelling/`; the standalone builder copies
them to its own assets. No CDN, API, AI call or paid service is involved. Worker
processing keeps dictionary work off the typing thread. Supported automatic
languages: Swedish and English (US/GB dictionary validity). Other languages and
uncertain words retain native browser spellcheck without automatic rewriting.

Only explicitly reviewed typo pairs in `engine.js` are automatic. Dictionary
neighbours alone are insufficient evidence for changing a name, technical term
or compound. Valid words in either dictionary, capitals, identifiers and words
found in the current CV/job context are protected. Ambiguous language context is
treated conservatively. This is spelling correction, not grammar or rewriting.

`editor-spelling.js` applies native editing transactions only at typed word
boundaries. It checks that the value, focus, generation and selection still match
before applying a worker result; otherwise it leaves the newer input alone.
Undo/manual restoration suppresses that spelling for the current draft. Emptying
the draft resets suppression. Paste, composition and dictation are left intact.
App input listeners receive the corrected text; canonical CV approval is unchanged.

Rebuild third-party assets with `npm ci --prefix tools/spelling` then
`node tools/spelling/build.cjs`. The engine and worker are maintained source files,
not generated. Package versions and licenses are recorded in `SOURCES.json`.
The unmodified Hunspell `.aff`/`.dic` files are distributed as source alongside
their notices, full LGPL/GPL license texts, and MIT/BSD dependency notices.
They can be replaced independently without rebuilding application code.
The runtime disables nspell compound regexes because its Swedish wildcard
interpretation can accept unknown words; automatic correction never infers a
replacement for an unknown compound. Dictionary entries/inflections still validate
the curated spelling pairs.

Verification: `tests/editor-spelling.test.cjs` and
`tests/editor-spelling.browser.cjs` use real dictionaries and local simulated UI
flows, with external requests blocked. No external model evaluation is involved.
