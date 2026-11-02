# Editor chat: approval needed for the backend correction

Status: local candidate only. No workflow changes, activation or model executions.

## Verified cause (read-only inspection, 2026-11-02)

Workflow Editor Chat, QQGNXYv4hej0HBwc; saved and active version ae916f25-ffac-4b84-8575-d2683ca46862.

Frontend sends all canonical blocks, selected IDs, CV version and conversation history. Validate + Normalize preserves these. Build LLM Messages then sets contextBlocks=[] in mode=chat and instructs the model that suggestion MUST be null in that mode. Selected/full modes reduce every block to a 700-character excerpt. History is further reduced from12 to6 messages. The AI Chat Model reads promptText. This is a confirmed context/instruction defect; no individual production execution or private conversation was read to attribute a particular reply.

The existing model is gpt-6-luna. No model replacement is proposed.

## Exact proposed external change

Replace ONLY the jsCode in Build LLM Messages with [build-llm-messages.js](build-llm-messages.js). The observed three relevant node definitions and version receipt are in observed.json, without credentials or execution/user data.

The replacement:
- Provides all current CV text and relevant metadata in every mode. Selection remains optional focus.
- Provides twelve structured history messages and the current message once. The frontend separately fixes duplicate inclusion of the current message in history.
- Allows an explicit edit request to return the existing suggestion shape without manual section sharing. Advice/questions can still return answer.
- Requires a self-contained rewrite instruction that carries the requested change and relevant conversation context. The rewrite endpoint itself receives the full current blocks and scoped IDs.
- Removes the silent700-character truncation. A60000-character serialized CV-context limit fails explicitly rather than presenting an incomplete CV to the model.
- Treats CV/history as source data, preserves facts, and instructs the model never to claim changes are applied.

No endpoint, response field, model, credential, ownership, DNS or hosting change. The established advisory suggestion response remains; semantic behavior is broadened to permit suggestions in ordinary chat. The older flow document's advisory-only behavior is preserved.

## Costs and effects

No new service or subscription. Reading the full CV increases input tokens compared with today's empty/truncated context. Explicit edit requests that produce an instruction then use the existing rewrite endpoint to prepare a concrete draft before review: normally one chat call plus one rewrite call. Ordinary answers use only the chat call; Apply and Dismiss are local and require no AI call. Existing server rate limits still apply to both requests and can reject the second call; the UI keeps the CV unchanged and offers preparation retry.

## Approval scope and rollback

Required approval: replace that single node and activate/publish the resulting Editor Chat workflow version. Before mutation, reread the exact saved/active versions and save/verify a complete encrypted rollback snapshot using the established procedure. If versions differ, compare before proceeding. Rollback restores the previous node/workflow snapshot and reactivates it. No other backend workflow is included.

Real model tests are separate: none have been run or are implied by this candidate. If approved, agree the bounded test scope before paid execution.

## Local verification and limits

The observed node reproduces contextBlocksCount=0 for normal chat. The proposed node's deterministic test preserves the last skill after700characters and conversation history; it validates selected IDs and fails oversized context. Browser tests use synthetic chat/rewrite responses; they prove UI/data handling, not live model quality or successful n8n deployment.

Until backend approval, Dev UI changes are usable, but the unchanged real chat backend can still ask for already available information or decline to generate a suggestion in chat mode. This limitation is not bypassed by forcing every message into full-CV edit scope.
