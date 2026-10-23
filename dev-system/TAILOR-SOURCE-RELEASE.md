# Source-aware Tailor release readiness

2026-10-23, DEV-079. Owner requests commit, push and publication of the reviewed local candidate. Base origin/main re-fetched and unchanged at 1e7b1e51fc671b385d26e217e6581c7fffee1bfb. This request authorizes saving/delivering the reviewed work. Readiness is evaluated separately from authorization; a synthetic provider is not a production backend.

## What the current candidate would publish

The built JS/CSS and latest pointers add compact question guidance, explicit Finish/Tailor actions, shared single-flight/stale guards and detached CV/ad tailoring review before Apply. The normal website continues calling the existing Tailor contract. Copy explicitly states that answers are not yet included on that path.

The source-aware module, contract, pure injected-provider handler and tests are also preserved in the branch. Source requests require all three of loopback hostname, explicit preview capability and exact /preview-api/tailor route. The synthetic provider is only served by tools/serve-editor-preview.cjs. Therefore merging the current candidate does NOT enable real use of experience answers on the website. Enabling the flag alone would not fix it: the existing remote workflow does not accept/forward/compose this profile.

## Missing before publishing the actual answer integration

Prepare a version-bound adapter for the existing Tailor workflow H8oAioy58R1v3PvRe3YUa: conditional request-profile validation, invalid-input model bypass, Build Tailor projection/prompt, actual model JSON parsing, deterministic source composer/register/receipt, failure propagation and exact response profile. Retain the ordinary request path. No new workflow or synthetic production fallback. Frontend enablement must target that actually supported profile instead of the localhost fixture gate.

The prior owner restriction against external workflow changes and external model execution was explicit. This branch contains no reviewed n8n adapter, verified real-provider routing or isolated external runtime result. General publication approval cannot turn those missing components into working behavior. No unprepared remote workflow edit, model call or synthetic backend publication is performed in DEV-079. A later approved production adapter needs fresh saved/active version checks, complete verified encrypted rollback snapshots and strict mutation/publication separation under EXECUTION-PLAYBOOK.md. External model execution stays excluded unless explicitly authorized.

## Concrete publication choices

1. Publish the existing reviewed frontend candidate, with its honest CV/ad-only production behavior and source integration still local-only. No backend/model changes. Expected GitHub Pages publication from main, no Webflow publish needed. Rollback baseline 1e7b1e5, with a new revert preserving intervening work if ever separately requested. Verify exact PR/base/head, build and served bytes, and actual-page behavior with every backend route mocked before loading CV/ad context.
2. Preserve this candidate in GitHub and prepare the real existing-workflow integration for review first. Do not merge the current candidate as if it publishes answer-aware tailoring. The production diff and its external scope must be concrete before dependent operations.

No production action has yet been executed. Commit/push outcome and PR reference are reported after verified delivery. Source-aware local preview remains localhost:8795 with sources scenario; existing synthetic tests do not prove live model semantic fidelity.
