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


## Verified branch delivery — DEV-079

2026-10-23. Reviewed product/source candidate committed as d904791dd2d45122d051a5f6f16c53e1fbab623a and pushed to origin/codex/questions-to-tailoring. Remote SHA read-back matches. Draft PR #23: https://github.com/DraftedAgent/drafted-webflow/pull/23, base 1e7b1e51fc671b385d26e217e6581c7fffee1bfb, created and attached to this chat. Existing HTTPS/GCM account has push rights; connector remains read-only. Actual Pages settings rechecked: legacy build from main at /, no .github workflow files/changes.

Before push, all 58 unit/session/transport tests and the full source-driven browser suite were rerun and passed; all outside browser traffic blocked. No source code changed after those checks. Source feature remains loopback/fixture gated. The owner has been asked whether to publish only the deployable UI candidate or first prepare the actual production Tailor adapter. No merge/publication or remote workflow/model action has been performed. This receipt is a separate documentation-only follow-up on the same branch.
