# Erfarenhetsdialog – transport 1.0

2026-10-14, DEV-015. **Ägargodkänt för isolerad implementation, inte publicerat.** Ägaren godkände den konkreta profilen och isolerade kopplingen genom svar på förslaget i denna uppgift. Detta kontrakt är normativt för discovery 1.0, inte befintlig chat/Tailor. CV-mutation/profil/RAG ingår inte. Aktivering, produktion och publicering kräver separat godkännande.

## Avgränsat beslut

Godkänt val: egen rådgivande operation i chat-familjen på `POST /webflow-experience-discovery`, ett separat initialt inaktivt n8n-flöde. Befintlig chat/Tailor ändras inte. Lokal isolerad testserver använder samma route. Explicit samtalsspråk sv/en krävs, utan ny default eller ändrad CV-språkrouting. Denna profil är auktoritativ endast för discovery-operationen; general CV-envelope gäller inte här. Därmed lämnas övriga CDQ-01/02/03 öppna. Ingen aktivering/produktion godkänns av kontraktsbeslutet.

Inaktiv n8n-definition: `zeIzzxPwD2Y91OyD`, version `bea078b2-f83e-4c25-b640-b3b56bde7bdd`, active=false, activeVersionId=null. Sju noder och definition/anslutningar återlästa mot kandidaten. Använder befintlig modellkonfiguration/credentialreferens från jobcontext-extraktionen men ändrar dess prompt för discovery; inga credentialvärden exporterade. Ingen n8n- eller AI-exekvering utförd. Lokal HTTP-transport kör injicerad syntetisk modellprovider. Den verkliga modellens semantiska kvalitet/n8n-runtime är alltså ännu inte verifierad.

Implementation: delad strict validator `webflow/src/experience-discovery-contract.js`; klient `experience-discovery-client.js`; handler `backend/experience-discovery.cjs`; inaktiv n8n-builder `backend/n8n-discovery-definition.cjs`. Körbar isolerad HTTP-preview: `node tools/serve-discovery.cjs`, localhost-port 8770 (kan ändras med PORT). Inga produktions-endpoints är default/fallback. Tests: `node --test tests/experience-discovery.test.cjs tests/discovery-transport.test.cjs` samt `tests/discovery-http.browser.cjs` med Playwright installerad och valfri PLAYWRIGHT_CHANNEL. Backendvalidationskodens n8n-grenar testas i isolerad VM med injicerad n8n-input och modellfixtures.

## Gemensam request (exakta fält)

### Uppdaterad användarlivscykel – ägargodkänd 2026-10-19, DEV-025

Ägaren har ersatt individuell faktabekräftelse med direkt mottagning av konkreta källsvar i editorn. Ett begripligt svar registreras med originaltext/ID/revision och flödet går vidare. AI-tolkningar är fortsatt rådgivande kandidater, aldrig bekräftade fakta. Endast viktigt saknat underlag ger en följdfråga; användaren kan rätta tidigare svar. Ingen CV-ändring eller bestående profil följer av att lämna ett svar. CV-användning kräver separat godkännande och är inte kopplad till Tailor av denna ändring. Detta ersätter äldre krav nedan på individuell bekräftelse; JSON-request/response, strikta gates och källcitat är oförändrade. Ingen extern workflowändring krävs för klientens nya livscykel.

`schemaVersion: "1.0"`, `operation: "plan" | "interpret"`, `requestId: string`, `contextRevision: string`, `conversationLanguage: "sv" | "en"`, `cvVersionId: string`, `blocksSchemaVersion: "1.0"`, `blocks: canonical blocks[]`, `jobContextSchemaVersion: "1.0"`, `jobContext: existing 1.0 object`.

Plan har inga ytterligare fält. Återanvändning av gamla erfarenheter förutsätter en senare uttrycklig selection-operation; inget gammalt underlag transporteras automatiskt i v1. Befintligt strukturerat jobContext återanvänds utan ny annonsanalys. Annonskrav blir aldrig användarfakta. Keywords ensamma får inte skapa ett ämne.

Interpret tillför exakt `roundId`, `questionId`, `questions` och `sourceAnswer`. Questions är den frysta omgångens lista av `{id, topicKey, question, signalRefs}`. `signalRefs` är `{field:"topPriorities"|"mustHave",index:integer>=0}` och måste finnas i jobContext. `sourceAnswer` är `{id, revision:positive integer, text:full original string}`. Ingen begränsad chatthistorik är faktakälla. Svars-ID och revision måste följa med svaret från servern. Frontend kontrollerar även current round/answer/context innan resultat används.

## Success (exakta fält)

Gemensamt: `ok:true`, `schemaVersion:"1.0"`, `operation`, `requestId`, `contextRevision`, `result`. Inget contractError, blocks eller CV-versionresultat får förekomma.

Plan result: `{topics:[{key, question, signalRefs, support:"clear"|"unclear", evidence:[{blockId,quote}]}]}`. Alla nämnda signaler ska vara relevanta prioriteter/mustHave; överlapp grupperas och varje signalreferens förekommer högst en gång. Topic keys är unika inom en plan. Vid clear krävs minst ett exakt blockcitat; vid unclear är evidence tom. Tom topics ger noll frågor, inte 0/0. Klienten väljer endast unclear och räknar faktisk kö. Backend semantisk jämförelse är rådgivande, aldrig ett kompetensbetyg. Ingen ifyllnad för att nå sju.

Interpret result: `{roundId,questionId,answerId,answerRevision,drafts:[{proposedText,sourceQuote,coveredQuestionIds}]}`. Varje sourceQuote är ett exakt sammanhängande utdrag ur full sourceAnswer.text; inget får hänvisa till modelltext/annons som personkälla. coveredQuestionIds ska finnas i fryst questions. Drafts är rådgivande tolkningar, aldrig bekräftade fakta. Konkret underlag registreras med det oförändrade källsvaret och kön går vidare direkt. Tom drafts ger högst en följdfråga om saknat underlag och därefter möjlighet att gå vidare utan påhittade uppgifter. Ingen individuell faktabekräftelse eller CV-mutation.

## Failure (exakta fält)

`{ok:false,schemaVersion:"1.0",operation,requestId,contextRevision,contractError:{code,message}}` där ogiltiga/missing request-identiteter återges som null; operation kan vara null. Ingen result/debug/raw model/persontext returneras vid fel. HTTP 400 INVALID_REQUEST, 413 INPUT_TOO_LARGE, 422 INVALID_MODEL_OUTPUT, 503 MODEL_UNAVAILABLE. Frontend behåller full källtext och all redan bekräftad sessionsdata, visar retry/skip och behandlar aldrig fel som success. Ogiltig success från transporten avvisas också. Stale svar ignoreras oavsett success/error.

## Bounds och integritet

- Request max 1 000 000 UTF-8 bytes; sourceAnswer max 50 000 UTF-16-kodenheter. Alla gränser kontrolleras före modellcall; input/modeltext kapas aldrig för att passera validering. UI anger svarslängdgränsen före inmatning och bevarar text vid fel.
- ID max 200 tecken; max 100 CV-block och 100 frågor. Blocktext max 100 000 tecken. Jobcontext har exakt befintliga fält/enumvärden, priorities max 8 och mustHave max 12. Modellfråga max 500 tecken; max 20 tolkningskandidater, var och en max 50 000 tecken. Stora fulla requests kan kräva uppdelning; inget tyst bortfall.
- Strict JSON, inga odeklarerade topp-/operationfält. Kanoniska block-ID:n unika, order finite, text och typfält enligt block-schema-v1. Unknown block types bevaras. Ingen kodtolkning av CV, annons, svar eller modellutdata; de är data. Ingen credential/data i fel/logg.
- Servern har ingen session/faktalagring. Klienten äger session/kvittens/revision. Ingen bestående profil, konto, embeddings eller RAG. Modellprovider injiceras explicit; ingen automatisk produktion/fallback.

## Verifieringsgräns

Isolerad syntetisk provider testar validering, transportsvar, källcitat, relevanta fixture-planer och klientens lifecycle. Det är inte en verifiering av live-modellens semantiska kvalitet. En senare godkänd inaktiv n8n-definition/testsession kan använda samma payload, prompt och fail-closed gates. Produktion/aktivering kräver separat explicit godkännande och snapshots.
# Revision-scoped session extension (2026-10-28)

[Revision-scoped experience context](experience-context-v1.md) adds structured affiliation to saved answer revisions and Tailor sources 1.2 only. The Discovery 1.0 request/interpretation fields below are unchanged. No persistent profile or global experience identity is introduced.
