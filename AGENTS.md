# Drafted development instructions

These instructions apply throughout this repository.

Before work, read all nine control documents:
- dev-system/README.md
- dev-system/DEVELOPMENT-CONTRACT.md
- dev-system/SYSTEM-MAP.md
- dev-system/INTEGRATION-MAP.md
- dev-system/EXECUTION-PLAYBOOK.md
- dev-system/CONTRACT-DECISIONS.md
- dev-system/TEST-STRATEGY.md
- dev-system/CHANGE-LOG.md
- dev-system/DECISION-LOG.md

Then read relevant product contracts and implementation. For planned experience questions, read dev-system/EXPERIENCE-DISCOVERY-FLOW.md. Distinguish shipped behavior, dated observations and proposed work. Recheck Git/integration state; never use chat history as canonical system state.

Drafted represents a person's career; a CV is one selected representation. blocks[] is canonical, flat text is derived, IDs remain stable. Missing CV evidence does not prove missing experience. AI is advisory; meaningful changes require explicit user intent. Keep confirmed user facts, selected CV and derived artifacts separate.

Use short, natural conversational language. Ask one clear question at a time; avoid judging competence or inventing facts. Follow the documented experience-question flow when implementing it; it is not already shipped.

Never develop material changes directly on main. Use codex/<task>. Inspect diff and validation before delivery. Never merge to main without explicit owner approval; production-affecting delivery remains gated. No force push or history rewriting on main. GitHub protection is procedural, not assumed technically enforced.

External changes require exact task scope. Before n8n mutations, save/verify rollback snapshot, record workflow ID/current state, avoid unrelated edits and validate resulting definition. Activation/deactivation, destructive actions and production execution require explicit approval. Never publish Webflow implicitly. GitHub Pages serves main at /, so main asset merges affect production.

Stop only work dependent on unresolved contract decisions; never invent their resolution. Validate with isolated synthetic data/mocks before production. Append meaningful DEV work to the log; formal DD records require separate owner approval.

Credentials and encrypted backups stay outside Git. Paths/access observations in logs refer to the original environment; verify access in a new account/machine. Historical approvals authorize only their recorded concrete actions, not repeated deployment. Missing integrations block dependent external steps, not independent local work.

Do not access or apply Drafted-IRP-Research automatically. No production action, new profile/RAG system or contract change is authorized merely by reading these instructions.