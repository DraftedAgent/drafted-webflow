# Drafted development control

DEV-078, 2026-10-23, local only: [TAILOR-SOURCE-IMPLEMENTATION.md](TAILOR-SOURCE-IMPLEMENTATION.md) records approved raw-answer-to-Tailor support, relevant existing-section placement, context clarification, detached review and multi-Apply correction/register handling. [Local source profile](../contracts/tailor-sources-v1.md) is implemented only through an injected synthetic localhost provider; production Tailor/workflows are unchanged. Preview: http://127.0.0.1:8795/?sample=1 with DRAFTED_PREVIEW_SCENARIO=sources. New-block support is described as a separate contract need, not implemented. Original answers/revisions remain separate from AI interpretations and applied CV text.

DEV-025: Hela editorn har en lokal, syntetisk användartestförhandsversion: `node tools/serve-editor-preview.cjs` -> http://127.0.0.1:8771/. Befintlig discovery Session/Client/UI används i produktionseditorns kod. Konkreta svar går vidare direkt, individuell faktabekräftelse är borttagen, rättelser och källhistorik finns kvar. CV-användning är separat och frågesvar skickas inte dolt till Tailor. Läs [EXPERIENCE-EDITOR-USER-TEST.md](EXPERIENCE-EDITOR-USER-TEST.md) för avgränsning, exakta leveranssteg och samlad godkännandepunkt. Ingen leverans/aktivering är godkänd än. Tidigare fristående browserkontroller har ersatts av `tests/editor-discovery.browser.cjs`; historiska testresultat nedan är daterad evidens.

Överlämning till nytt konto, 2026-10-17 (DEV-016): börja med [EXPERIENCE-DISCOVERY-HANDOFF.md](EXPERIENCE-DISCOVERY-HANDOFF.md) på branchen `codex/experience-discovery`. Där finns exakt säkrat arbete, befintligt inaktivt n8n-ID, upprepbara testkommandon, verifieringsgränser, behörighetsgater och nästa steg. Detta är en utvecklingsleverans för granskning, inte en ändring av publicerad produkt.

DEV-015: exakt rådgivande discovery 1.0-kontrakt är godkänt i [contracts/experience-discovery-v1.md](../contracts/experience-discovery-v1.md). Backend/HTTP-klient och lokal syntetisk preview implementerade; separat n8n-workflow zeIzzxPwD2Y91OyD skapad och återläst inaktiv med verifierade krypterade snapshots. 21 modell/transporttester plus lokala browserkontroller passerar. Inga ändringar av befintliga produktionsflöden/published assets, ingen aktivering/exekvering eller live AI-kvalitetstest. CV-användning och permanent profil/RAG utanför etappen. Lokal server: `node tools/serve-discovery.cjs` -> port 8770, preview med `?backend=1`.

DEV-014 (2026-10-14): erfarenhetsflödets första lokala sessionsmodell och fråge-UI är implementerade på codex/experience-discovery från main c67ce5c, med syntetisk preview och 12 modelltester plus browserkontroller. Ingen live/backend-/CV-apply-koppling eller publicering. Ägaren godkände rådgivande discovery-riktning, med CV-användning separat; detaljerat transport-/kontraktsförslag och färsk n8n-inspektion finns i EXPERIENCE-DISCOVERY-FLOW.md. Frånvaron av livekoppling är avsiktlig för denna etapp; permanent profil/RAG är inte implementerat. Historisk PR #2-status nedan är supersederad av verifierad main c67ce5c.

Senaste planeringsuppdatering DEV-013: erfarenhetsfrågeflödet visar faktiskt antal relevanta ämnen och framsteg (t.ex. 1/7 till 7/7), ställer korta frågor och accepterar långa svar. Separat källspårbart erfarenhetsunderlag förbereds för senare professionell profil/RAG; permanent lagring/retrieval är inte implementerat. Detta ersätter DEV-011:s tidigare rekommendation om högst tre ämnen. Dokumentationsleverans finns i PR #2; ingen main-merge godkänd ännu i denna sidokonversation.

## Fortsätt från ett annat konto eller en annan dator (DEV-012)

Repositoryt är den gemensamma källan för kod, kontrakt, systemkarta, planerade flöden och utvecklingslogg. Chatthistorik behövs inte som canonical state. Root README och AGENTS.md ska hänvisa hit. Senaste genomförda produktleverans: DEV-010, PR #1, main merge e2793a5a9871fda288fa29ca7afca6212d0b75b2, publicerad demoändring. Senaste planerade produktarbete: DEV-011 erfarenhetsfrågor före Tailor; dokumenterat men inte implementerat. Läs nyare DEV-poster innan arbete, eftersom denna sammanfattning är en daterad utgångspunkt.

På nytt konto: anslut GitHub med åtkomst till DraftedAgent/drafted-webflow, öppna/klona repositoryt och säkerställ att den branch som innehåller dokumentationen används (dokumentations-PR först, main efter godkänd merge). Be Codex läsa AGENTS.md och dev-system/README.md, därefter alla nio startupdokument: README, DEVELOPMENT-CONTRACT, SYSTEM-MAP, INTEGRATION-MAP, EXECUTION-PLAYBOOK, CONTRACT-DECISIONS, TEST-STRATEGY, CHANGE-LOG och DECISION-LOG. Läs relevanta produktkontrakt och EXPERIENCE-DISCOVERY-FLOW inför frågeflödet. Börja med read-only kontroll av Git-status, aktuell branch och integrationsåtkomst; ingen automatisk deployment eller arbetsfortsättning från historiska godkännanden.

GitHub-anslutning gör kod/dokumentation tillgänglig men är inte samma sak som ett fungerande lokalt checkout eller Git-writeautentisering. Läsrättigheter och leveransrättigheter verifieras separat. Loggar innehåller historiska observationer och godkännanden av specifika genomförda åtgärder; de ger inte en ny session blanket approval att repetera dem.

n8n-nycklar, Webflow-anslutning, GCM-inloggning, krypterade snapshots och temporära testartefakter följer inte med via GitHub. Befintlig n8n-nyckel är ägarauktoriserad enligt DEV-008, men dess åtkomst måste kontrolleras på den nya miljön. DPAPI-filer är knutna till Windows-användare/dator och ska inte kopieras till Git eller betraktas som portabla. Konfigurera åtkomst genom skyddad lokal/integrationsmekanism när en uppgift behöver den; inga hemligheter i chatten eller repositoryt. Historiska C:/Users/...-sökvägar är evidens, inte fasta krav på en ny dator. Använd repo-relativa länkar; repo-kontrakt finns incheckade, externa personliga mappar är inte obligatorisk startupåtkomst. Saknad integration stoppar bara beroende externa steg; lokal analys/implementation kan fortsätta under ordinarie gates.

DEV-012 gör dokumentationsleverans granskningsbar i en separat branch/PR. Tillgänglighet på main ska inte påstås före verifierad merge. Inga credentials eller lokala rollbackfiler ingår. Ingen RAG/profilfunktion eller erfarenhetsfrågefunktion implementeras som del av portabiliteten.

Planerat frågeflöde (DEV-011, 2026-10-14): [EXPERIENCE-DISCOVERY-FLOW.md](EXPERIENCE-DISCOVERY-FLOW.md) beskriver återanvändning av befintliga annonssignaler, enkla samtalsfrågor, användarbekräftat underlag och uttryckligt godkännande av CV-ändringar. Endast dokumentation; inga nya API-kontrakt, profiler/RAG eller funktioner är implementerade.

Current state (DEV-008, 2026-10-05): **CONTROL_PLANE_SETUP_REQUIRED only for Webflow capability verification**, including existing CMS connector limitations. GitHub delivery capability is verified under DEV-007 governance. Existing encrypted n8n key is owner-confirmed full access and intentionally authorized for development: read verified, workflow write available/gated, create available for explicit approved task need, activation/deactivation always owner-approved, destructive actions always approved and production execution gated. No separate n8n key/setup is required. Snapshot/state recording/minimal diff/definition validation remain mandatory per workflow mutation. Ready for a real authorized product development task; unresolved contract choices and production approvals apply only where relevant. This current state supersedes older setup blockers below.

Historical capability result (DEV-007; n8n setup classification superseded by DEV-008): GitHub READ, BRANCH PUSH and PR CREATION verified through ManPanther; merge owner/production-approved. No credential refresh required. Main has no technical protection/rulesets and is logically protected by governance. Pages deploys main at /. See current capability matrix in INTEGRATION-MAP. No production state changed.

Discovery baseline: 2026-10-05, Europe/Stockholm. This area is documentation only; it does not install or enforce a permanent agent.

Read DEVELOPMENT-CONTRACT.md before future work. SYSTEM-MAP.md records implementation evidence and unresolved contradictions. INTEGRATION-MAP.md records actual access. TEST-STRATEGY.md defines validation gates. Append material work to CHANGE-LOG.md; formal decisions require user authorization under DECISION-LOG.md.

DEV-004 adds EXECUTION-PLAYBOOK.md for safe task/approval/rollback procedures and CONTRACT-DECISIONS.md for three pending owner choices. Verdict: ORCHESTRATOR_READY for gated read/local operation; no agent or technical enforcement has been installed. See the playbook for exact next action and mandatory task-specific production gates.

## Current repository baseline (DEV-002)

The user confirmed DraftedAgent/drafted-webflow and `main`. The canonical checkout is now established at `C:/Users/wallg/Documents/ChatGPT/Drafted Development`, origin `https://github.com/DraftedAgent/drafted-webflow.git`, branch `main` tracking `origin/main`. After fetch, both HEADs are `1f80a7aeec32c5b4445922695aabab7af8b62df4`, with ahead/behind `0/0`.

The clone was clean before dev-system integration. No canonical dev-system path existed, and no product-file conflicts existed. All seven original documents were hash-verified before subsequent authorized documentation edits. Exact originals and the initial empty Git metadata are retained at `C:/Users/wallg/Documents/ChatGPT/Drafted-checkout-backup-20261005/`. Current working changes consist only of seven untracked dev-system documents; tracked product files are unchanged. No commit or push occurred.

## Historical first-run baseline (DEV-001)

The current workspace was an empty Git repository on unborn `master`: no HEAD, commits, remotes, upstream, tracked product files, or pre-existing uncommitted files. `git fetch --all` had no configured remote to contact. Local/remote equality and ahead/behind counts are therefore undefined. No branch, remote, checkout, reset, commit, or push was changed.

Webflow Home custom code identified a public source candidate: https://github.com/DraftedAgent/drafted-webflow. Read-only `git ls-remote --symref` verified default branch `main` and HEAD `1f80a7aeec32c5b4445922695aabab7af8b62df4`. GitHub metadata reported last push 2026-03-08. The candidate is strongly supported by live asset equality, but the user's intended latest branch is not confirmed. Remote files were inspected over HTTP without importing product code into this workspace.

## Sources

- User's first-run request is the governing scope and supplies the broader career-representation principles.
- External contracts: `C:/Users/wallg/Documents/Personligt/Drafted/Contracts/` (nine files, all read).
- Canonical local contracts and implementation were re-inspected at the HEAD above during DEV-002; `.cursor/context.md` declares contracts normative. Initial remote inspection is retained as historical evidence.
- Webflow connector verified site/page metadata and freeform code; published HTML and GitHub Pages assets were inspected read-only.
- No n8n management or workflow execution was attempted. No research-system data was accessed.

## Completion limits and next work

Canonical local checkout and documentation integration are complete. DEV-003 verified official authenticated n8n GET access and mapped six active Drafted workflows plus five inactive predecessors; see SYSTEM-MAP.md and INTEGRATION-MAP.md. n8n management read access is no longer blocked. CMS inventory, write permissions, deployment settings and controlled execution validation remain unverified. Resolve contract contradictions with evidence and explicit user decisions before changing affected behavior. Do not request or store secret values in chat or these files. No Webflow/n8n writes occurred; DEV-002 used no integration calls, DEV-003 used n8n GET reads only.

## Future Drafted Development Orchestrator — design only

One entrypoint should: understand explicit user intent; inspect Git status and relevant repo/Webflow/n8n evidence; classify UI, product behavior, backend, contract, architecture, and operational scope; identify systems and approvals; implement requested local work; validate; append DEV record; flag possible DD; prepare a concrete deployment diff and rollback plan; obtain required production approval; verify deployed versions and behavior.

Use existing verified integrations rather than inventing connectors. Separate inspect, local implementation, validation, approval, deployment, and verification phases. A blocked connection stops dependent work. GitHub Pages asset publication is production-affecting even when Webflow is untouched. No orchestrator skill, agent, automation, hook, or integration has been created in this run.
