# DEV-104 — Gemensamma modellkontrakt för Discovery och Tailor

Lokal kandidat, 2026-10-24. Ingen workflowändring, aktivering, publicering eller extern modellkörning har gjorts. DEV-103 säkrades först i lokal commit `75a05f6`. Arbetet ligger på `codex/discovery-tailor-contracts`.

## Verifierad utgångspunkt och leveransomfattning

Aktiva och sparade definitioner kontrollerades via läsning. Discovery `zeIzzxPwD2Y91OyD`: `6336f54e-9913-4976-bd32-78d8508338d5`. Tailor `H8oAioy58R1v3PvRe3YUa`: `a5196f17-4ccc-41db-8993-9b6c5fe466dd`. Exakta projektioner, före/efter-hashar och parameterändringar finns i [samlat leveransunderlag](prepared/model-contracts.review.json). Kandidaten avvisar avvikande sparad/aktiv bas. Definitionsläsningen körde inga workflows.

Discovery-kandidaten ändrar fem noder:

- **Validate request:** samma publika validering, kompletterad med säker gemensam diagnostik vid avvisad begäran.
- **Build discovery prompt:** bygger profil `plan-2` respektive `interpret-2` från betrodd begäran. Separata systeminstruktioner och användardata.
- **Discovery model:** två separata meddelanden i stället för sammanslagen systemtext, explicit `simplify=false` och `store=false`. Modell `gpt-4.1-mini`, temperatur 0,2 och befintligt JSON-läge behålls; ingen ny tokeninställning i workflowet.
- **Validate model response:** strikt provider-envelope, internt schema, källreferenser och publik svarskomposition via samma versionssatta kod som lokalt.
- **Respond discovery:** befintliga valideringsheaders samt säkert request-ID exponeras för klienten med `Access-Control-Expose-Headers`.

Tailor-kandidaten ändrar tre noder: **Validate + Normalize** (endast källgrenen), **Compose source suggestion**, **Respond with source suggestion**. Den vanliga CV/annons-grenen, modellnoden, modellval, temperatur, tokeninställning, credentials, graf och workflowinställningar bevaras. Inga nya noder eller endpoints. CV-importens och annonssignalernas modeller ändras inte.

Ingen av dessa nodändringar är externt levererad. Ny aktivering kräver pilotutfall och separat leveransgodkännande. Då behövs nya verifierade krypterade snapshots av aktuell sparad/aktiv definition, ny driftkontroll, exakt versionsaktivering och efterkontroll. Tidigare profiler och adaptrar finns kvar för återställning; det är inget automatiskt fallbackflöde.

## En kodväg och ansvarsfördelning

`backend/model-contracts.cjs`, version `drafted-model-contracts-2`, äger instruktioner, interna scheman, validering, provider-extraktion och komposition. Node-runtime injicerar de frysta publika kontrakten och referenskompilatorerna. Kandidatadaptern bäddar in **samma källkod**, inte en omskriven n8n-variant. Harnesset kör de faktiska förberedda Code-noderna i isolerad VM. Giltiga och ogiltiga syntetiska svar har också repeterats mot kandidater byggda från de faktiska aktiva definitionerna.

Modellen bedömer innehåll och väljer bara tillhandahållna semantiska referenser:

- `plan-2`: `{assessments:{signal_reference:decision}}`. Varje signal kräver en bedömning. `question` äger sin fråga; `same_question` pekar direkt på en annan frågeägare. `cv_supported` väljer befintliga evidensreferenser. Backend hämtar originalblock och numeriska referenser och skapar kanoniska ämnes-ID:n. Inga modellkopierade request-ID:n, kontextrevisioner eller formatmarkörer.
- `interpret-2`: `{drafts:[{proposedText,coveredQuestionKeys}]}`. Tillfälliga frågereferenser ersätter verkliga fråge-ID:n. Modellen återger varken svars-ID, revision eller citat. Backend binder varje rådgivande tolkning till **hela det aktuella originalsvaret**, dess ID och revision. Originaltexten skrivs aldrig över av tolkningen.
- `tailor-2`: `{additions:[{sourceKey,targetKey,text}],contextQuestions:[{sourceKey,reason}]}`. Backend skapar källidentiteter, revisionskopplingar, hela originalcitaten och Apply-spårningen. Formuleringen placeras i relevant befintligt block när innehåll och uttryckligt sammanhang stöder det. En tillåten sektionsreferens är ingen semantisk faktagaranti.

Publika JSON-format och schema 1.0 behålls. [Exakta syntetiska request-, interna modell- och responseexempel](prepared/model-contracts.examples.json) visar planering, tolkning, Tailor och saknat sammanhang. Nya block införs inte: `new_block_required` är fortsatt ett tydligt behov som måste redovisas före ett framtida kontraktsbeslut.

## Tre skilda utfall

**Giltigt resultat:** alla signaler är bedömda och verifierade; frågor eller giltig nollplan returneras. Noll frågor får inte uppstå genom att felaktiga ämnen filtreras bort. Tailor ger ett separat granskningsförslag, aldrig implicit Apply.

**Saknat innehåll/sammanhang:** tomma rådgivande konton efter ett vagt svar ger befintlig kort följdfråga. Saknad arbetsplats/projektkoppling ger `context_unclear`; en uttryckligen annan arbetsplats utan block ger `new_block_required`. Ingen gissad placering i en anställning eller förflyttning till Summary för att kringgå frågan. Ingen individuell faktabekräftelse införs.

**Tekniskt fel:** felaktig struktur, okänd referens, ofullständig bedömning, vägran, avklippt output, timeout eller otillgänglig modell stoppar aktuell operation. Discovery-planen är atomisk. Ingen tyst nollplan, automatisk modellomkörning eller Tailor utan svar.

Den redan godkända begränsade Tailor-kontextåterhämtningen behålls: en källas osäkert placerade tillägg hålls tillbaka och ger kontextfråga; oberoende säkra källor kan fortfarande ge förslag. Okända referenser och strukturella fel återhämtas inte. Detta räknas separat från rå modellföljsamhet i piloten.

Nej och överhoppning är inga positiva källor. Blandade svar behåller negationer, ansvar och intern/extern avgränsning. Rättelse skapar ny källrevision; alla exakt spårbara gamla tillägg från berörd källa hanteras tillsammans även efter flera Apply. Manuellt förändrad eller osäker tidigare text lämnas orörd och markeras för granskning. Strukturell spårbarhet bevisar inte att modellen förstått innehållet korrekt; detta återstår för mänsklig pilotgranskning.

## Säker diagnostik och editor

`webflow/src/model-diagnostics.js` används av backend och båda klienterna. Endast operation, säkert korrelations-ID, HTTP-status, tillåten felkod/felklass samt tillåten valideringsorsak/sökväg serialiseras. Okända meddelanden, godtyckliga egenskapsnamn och felaktiga ID:n tas inte med. Inga CV-texter, svar eller råa modellmeddelanden kopieras till feldetaljer.

Editorn visar ihopfällda **Error details** och **Copy error details** för planfel, bakgrundstolkning och Tailor-fel. Saknade äldre headers ger neutrala tomma fält. Laddning avslutas även när svarskroppen hänger; avbrutna eller inaktuella svar kan inte ersätta nytt underlag. Återförsök är uttryckliga och behåller aktuella svar/revisioner. Felfält hålls utanför källornas originaldata.

Befintligt flöde bevaras: högst fem prioriterade frågor initialt, resten frivilligt, räknaren försvinner när frågorna är besvarade, en enda förberedelsestatus, granskningsförslag fram till Apply/Dismiss och ren Chat efter Apply. Originalsvar och rättelser nås fortsatt via Review your answers.

## Lokal verifiering och nästa grind

Enhetstester och isolerade browserflöden täcker accepterat CV/annonsunderlag → frågor → original/rättelser → Tailor → granskning → Apply; även kontextfråga, nya blockbehov, nej/skip, osäker text, flera Apply, inaktuella svar, timeout, tekniska fel och uttryckligt återförsök. Teststatus och begränsningar finns i DEV-104 i CHANGE-LOG.

Lokal syntetisk preview: http://127.0.0.1:8805/?sample=1. Scenario `sources-contracts` använder de förberedda Code-noderna och en uttrycklig syntetisk provider; dess status rapporterar noll externa modellanrop. Previewn visar fungerande lokal komposition, inte verifierad modellföljsamhet i drift.

[Utvärderarens instruktioner](../evaluation/README.md), [exakt material och körspecifikation](prepared/model-pilot/manifest.json), [icke godkänt godkännandeunderlag](prepared/model-pilot/approval.template.json). Ingen pilot körs utan ett nytt exakt godkännande. Ingen automatisk aktivering efter pilot.
