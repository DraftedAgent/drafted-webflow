# DEV-095 — Complete signal assessments

Owner explicitly approved implementation and deployment after a successful public plan returned topics:[] without justification. Internal model contract changes to discovery-plan-assessments-1; public Discovery1.0, interpretation, source revisions, Tailor and Apply stay unchanged. No external model execution authorized or initiated.

## Exact internal example

Input retains original source and signal catalogs, request/context binding, and sets modelFormat to discovery-plan-assessments-1. No null assignment template.

```json
{"modelFormat":"discovery-plan-assessments-1","requestId":"req","contextRevision":"ctx","topics":[{"key":"workshops","question":"Have you helped facilitate a workshop?"}],"assessments":{"signal_topPriorities_0":{"kind":"question","topicKey":"workshops"},"signal_topPriorities_1":{"kind":"cv_supported","evidenceIds":["source_1"],"explanation":"The original source describes internal system implementation; no external customer role is inferred."},"signal_mustHave_0":{"kind":"not_actionable","reason":"not_experience_requirement","explanation":"This synthetic requirement concerns availability, not experience to add to a CV."}}}
```

Every original signal key must occur in the assessment object. Exact branch shapes required. question points to one existing topic; every topic owns at least one signal. cv_supported requires at least one unique original evidence ID and a nonempty explanation. not_actionable requires a nonempty explanation and either not_experience_requirement or too_unspecific_to_form_question. Lack of CV evidence, duplicate topics, enough questions and output brevity are not accepted reason codes. Truly overlapping signals map to the same focused question. Nulls, missing/foreign keys, old shapes, unsupported kinds/reasons, unknown evidence/topics, orphan topics, stale identity and duplicates reject explicitly with422. No repair, fabricated questions or fallback.

The backend materializes exact full original block text and IDs in a transient assessmentAudit, keeping model explanations explicitly advisory. The audit exists only inside that execution, is not used as a user fact or Tailor source, and is not persisted under current no-execution-data settings. Public response remains topics with existing signalRefs/support/evidence. Question topics are unclear with no fabricated evidence. Supported/not-actionable assessments do not create questions.

A valid zero plan produces a safe diagnostic through existing response headers: EMPTY_PLAN_CV_SUPPORTED, EMPTY_PLAN_NOT_ACTIONABLE, EMPTY_PLAN_MIXED_ASSESSMENTS, or EMPTY_SIGNAL_CATALOG. Missing assessment produces INCOMPLETE_SIGNAL_ASSESSMENT; existing generic error/retry UI preserves sources. Headers contain no private text. This gives a zero-result category, not a public explanation payload.

## Evidence and deployment

Version-bound patch against saved/active8cd1ce3b-5745-45be-a1aa-040f05a72418 in workflow zeIzzxPwD2Y91OyD changes only Build discovery prompt and Validate model response jsCode. Original model/settings/credentials/graph/Respond headers/retention unchanged. Live read-only definition rehearsed locally: exact two-node diff and prepared synthetic Code/graph execution passed.

91 relevant unit/integration tests pass, including7 new cases covering unexplained zero/missing/null/legacy, complete supported zero with exact negative-qualified full source and separate interpretation, explicit non-experience reasons, bad/stale evidence, mixed plans/ownership, empty catalog, strict two-node diff and unchanged interpret response. Existing full editor source/Tailor and plan422/retry browser suites pass using the assessment candidate and synthetic provider. External traffic blocked. No actual model semantic evaluation: exact evidence selection validates provenance, not entailment; explanations can still be mistaken. This removes acceptance of unassessed empty plans, not all possible incorrect zero assessments.

Deployment uses fresh version/hash checks, verified encrypted saved/active/candidate snapshots before each mutation, publishIfActive=false save, explicit activation and exact saved/active projection checks. No frontend asset publication needed. Safe final receipt is recorded separately after verification.


## Verified delivery

Saved/active 8fc9596b-ca45-4ade-8697-34e27bc9ecce. Save and explicit activation returned200; full projections and encrypted snapshots verified. Safe receipt: [discovery-assessments.deployment.json](prepared/discovery-assessments.deployment.json). Local synthetic preview http://127.0.0.1:8801/?sample=1. No frontend changes or publication.
