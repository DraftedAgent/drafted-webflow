> DEV-250: Språkpolicy och helöversättning är nu omarbetade lokalt. Se LANGUAGE-APPROVAL.md för den aktuella separata backendkandidaten1.4. Beskrivningen nedan av obligatoriskt språkval avser föregående etapp. Ingen aktivering är godkänd eller gjord.

# Tailor 1.3 — lokal implementation och separat backendgodkännande

2026-11-04. Ägaren har godkänt lokal implementation av kontraktsförslaget. Denna fil redovisar den färdiga lokala kandidaten och framtida externa steg; den ger inget aktiverings- eller testgodkännande. Föregående specifikation finns i CONTRACT-approved-20261104.md. Ingen publicering, backendmutation eller betald körning har gjorts.

## Lokal leverans

Dev/simulering på http://127.0.0.1:8825 använder sourcesSchemaVersion 1.3. Riktig integration på 8826 och publicerad klient behåller 1.2. Samma befintliga editor och granskning används; inget parallellt editorflöde eller ny modell.

Starta granskning via http://127.0.0.1:8825/evidence/tailor-integration/index.html. Startknappen öppnar den riktiga /editor med en separat syntetisk arbetsyta. Befintliga arbetsytor och originalfiler skrivs inte över. Länk tillbaka återställer föregående flikidentitet. Review in CV visar kandidaten, Accept applicerar och Dismiss avvisar. Simulatorn är inte en allmän AI: endast dokumenterade testexempel har genererade svar; övriga underlag ändras inte automatiskt. Okända täckningsunderlag får Needs review.

Implementationen i webflow/src/tailor-sources-v13.js återanvänds i klient, lokal provider och förberedda n8n-filer:

- Begäran binds med SHA-256 till hela canonical CV inklusive metadata, titel, CV-version, annons/katalog, samtliga aktuella frågesvar/revisioner, befintliga appliceringskvitton, omgång och valt språk. Servern räknar om bindningen och kontrollerar annonsens exakta katalog/ankare. Ett oförändrat cv_v1 räcker inte som versionsskydd.
- Modellen får aktuellt dokument separat från original-CV-belägg och registrerade källsvar. Inget tidigare applicerat svar blir oberoende originalbelägg. Endast explicit valt experienceContext tillåter ett svar att stödja en befintlig post; oplacerade källor kräver befintligt kontextval, inte en gissning.
- Befintliga block ersätts en gång med segment som kan stödjas av flera originalcitat och flera aktuella källsvar. Block-ID, ordning, typ, arbetsgivare, roll och datum bevaras. Inga nya block skapas i denna avgränsade etapp.
- Samtliga ursprungliga CV-belägg måste redovisas i ett ändrat block. Ett oredovisat belägg avvisar hela kandidaten. Detta är striktare än den tidigare möjligheten att motivera borttagning: ingen borttagning av unika originalfakta introduceras här. CV-nycklar är spårbarhet, inte maskinellt bevis på semantisk bevaring.
- Kvitton innehåller before/after och deras SHA-256, exakta UTF-16-intervall, ursprungliga CV-citat samt answerId/revision/full sourceQuote/registrerat sammanhang. Ersatta kvitton markeras superseded och ligger kvar i historiken. Originala svar och rättelser ligger kvar i frågehistoriken.
- Gamla append-kvitton används bara med verifierade checkpoint/intervall. Deras tillägg räknas inte som original-CV. Avvikande manuellt redigerade poster lämnas oförändrade och kräver granskning; inga heuristiska borttagningar görs. Korrigering av en källa ändrar aldrig CV automatiskt.
- Kandidaten räknas om helt från fryst begäran/recept när svaret tas emot, när en väntande kandidat återställs och igen vid Accept. Aktuell kontext kontrolleras även efter asynkron validering, innan CV och det förberedda källregistret skrivs. Dubbel Accept låses. Samma tillämpade baseline kan inte committas igen och 1.3-ledger får inte nedgraderas till 1.2.
- Preview är separat från canonical CV och PDF. Täckningen bedömer den nya applicerade texten med ny CV-hash; den får inte förväxla ett applicerat källsamband med en viss semantisk täckningsklass. Frågor och svar startas inte om.
- Ingen ändring är giltigt resultat. Granskningsnoteringar visas utanför CV-texten. Instruktionerna bevarar CV-språk/stil, intern/personlig omfattning och skiljer negativa/osäkra svar från positiva faktakällor.

## Språk i befintliga sessioner

language=en utan cvLanguageConfirmed=true är inte ett uttryckligt val. Endast sv/en kan återställas som bekräftat. Ogiltig sparad kod blir ett obekräftat basvärde, inte samtycke. Nästa Tailor kräver språkval. Engelska svar ändrar inte output language.

CV language i toppraden ger tillgång även när Tailor redan är applied eller review. Språkbyte skriver varken CV eller svar men gör väntande kandidater inaktuella. Avbryt ändrar inget. Nytt CV nollställer bekräftelsen. Ingen automatisk språkdetektion påstås; äldre blandat dokument repareras först genom ett granskat nytt förslag och uttrycklig Accept.

## Exakt framtida backendpatch

Färska GET-inspektioner 2026-11-04 13:56 UTC, inga körningar:

- Tailor H8oAioy58R1v3PvRe3YUa: saved/active 34815fa3-85d7-4102-a8c5-b839e0b158b1, 17 noder. Sparad och aktiv noddefinition samt connections är lika.
- Coverage JaUV7PezrztJGpr7: saved/active b7825185-6927-4dac-b089-11344fb5e185, 7 noder, sparad och aktiv definition lika.

Endast två Tailor-fält behöver ändras för 1.3:

1. Validate + Normalize, node b770f40e-b1a0-49fe-94e6-e003c3f42b41, parameters.jsCode: integration-v13/validate-before.js → validate-candidate.js.
2. Compose source suggestion, node tailor-sources-compose-v1, parameters.jsCode: integration-v13/compose-before.js → compose-candidate.js.

Exakta bytehashar, nod-ID och rollback-receipt finns i integration-v13/manifest.json. backend/n8n-tailor-integration.cjs genererar de två filerna från samma lokalt testade moduler. Diffen mot färsk definition ändrar enbart /nodes/1/parameters/jsCode och /nodes/13/parameters/jsCode. Kandidatfilerna inleder med en strikt 1.3-gren och behåller tidigare kod som oförändrat suffix. Modell, endpoints, credentials, anslutningar, settings och andra workflows är oförändrade.

Den befintliga source-grenen testar _tailorSources/status och Respond returnerar json.body; den är inte låst till 1.2. Tailor Guard ligger på den andra, äldre grenen. Luna-normaliseraren och source-modellvägen återanvänds. Inga extra guard-/respond-noder behövs. gpt-6-luna, low reasoning, default service tier, store=false och maxTokens=4000 behålls. Node retryOnFail=false på båda Tailor-modellerna, inga automatiska omkörningar i den testade source-vägen. 1.3-filerna använder samma crypto/Buffer-mönster som befintliga Coverage Code-noder; syntetisk VM-test är inte en verifiering av den framtida n8n-körmiljön.

Coverage-kontraktet behöver ingen ändring. Separat valfri promptpatch: endast Build coverage prompt.parameters.jsCode, coverage-before.js → coverage-candidate.js. Färsk GET bekräftar exakt samma before-kod. Den förbjuder ogrundad utvidgning av annonskrav och betonar semantisk flerspråkig bedömning; den ändrar inte kategorier, signaler eller antal. Denna patch är inte en förutsättning för källintegrering och aktiveras inte implicit med de två Tailor-patcharna. Frågeproveniens är utanför detta godkännande.

## Återställningsunderlag och plan

Färska kompletta definitioner med både saved och activeVersion har krypterats med Windows DPAPI utanför Git, dekrypterats, jämförts byte för byte och JSON-kontrollerats:

- %LOCALAPPDATA%/Drafted/tailoring-quality-audit/integration-v13/H8oAioy58R1v3PvRe3YUa.saved-active.clixml. SHA-256 över dekrypterad JSON: b2d31ff055c229670f4038fba0e228f7e7089f68539817c29043c4e9ee1acbf9.
- Samma mapp, JaUV7PezrztJGpr7.saved-active.clixml. SHA-256: a727992d3023fd15b975142ccca459a78c625281fbee850e43ef736d85e4c7ad.
- Respektive .receipt.json anger ID, saved/active-version, tid, hash och verifierad roundtrip. Krypteringen är bunden till aktuell Windows-användare/maskin. Kopian från körning434 finns dessutom kvar separat.

Före framtida mutation krävs ny GET och ny verifierad snapshot, jämförelse mot manifestets exakta before-filer och stopp vid drift. Spara sedan endast de godkända nodfälten, läs tillbaka/diffa, och aktivera endast efter separat godkännande. Kontrollera aktiv definition efteråt. Ingen mutation har gjorts nu.

Vid fel stoppas lokal 1.3-trafik. Återställ de två Code-fälten från det verifierade före-underlaget och aktivera tidigare definition med separat återställningsbehörighet; läs tillbaka. Bevara alla 1.3-arbetsytor. Rulla inte tillbaka en 1.3-ledger till en skrivande äldre klient. Återöppna en separat före-test-export i separat arbetsyta. En kodrollback återställer inte användardata. Ingen webbversion eller domän behöver ändras för det avgränsade lokala integrationstestet.

## Högst tre föreslagna riktiga anrop — ej godkända eller körda

För att faktiskt kontrollera reparation av den misslyckade versionen används en fryst kopia av den aktuella applicerade arbetsytan, inte en skrivning tillbaka över ägarens publika session. Körning434 används som jämförelse och källkontroll. Före testgodkännandet behövs en verifierad privat arbetsyteexport med canonical blocks, Original/Edited, faktiskt aktuell CV-hash, gammal append-ledger, ursprungliga fyra svar inklusive revisioner/experienceContext, hel annons och verifierad signalkatalog. Körning434 ensam innehåller inte hel annons/katalog eller den senaste klientens ledger. Om något saknas stoppas testet; inga extra upload/anchor/discovery-anrop körs inom budgeten.

1. Ett Tailor 1.3: fryst aktuell CV-version med identiteter/ordning och gamla giltiga appliceringskvitton, samma fyra källsvar (tre positiva registrerade exempel och ett No), korrekt annons/jobContext/katalog, explicit sv. Modellen får text, metadata och källor; ingen ny PDF-fil, ljudinspelning eller hel chatthistorik skickas. Kontrollera svenskt integrerat förslag, bevarade originalfakta och intern omfattning, inga upprepningar/analyskommentarer, källkvitton och motiverad total längd. Ingen bestämd sidgräns eller Clear-siffra utlovas.
2. En assessCoverage för exakt samma frysta applicerade baseline, med befintliga verifierade ankare och utan frågesvar som CV-belägg. Ingen ny ankargenerering. Detta ger reproducerbar förebedömning.
3. En assessCoverage för exakt kandidatens applicerade canonical CV, först efter ägarens uttryckliga Accept. Annons/katalog är oförändrade, CV-hash ny. Om förslaget avvisas, är oförändrat eller ett tidigare steg misslyckas körs inte steg3. Täckningen får ändras sakligt eller förbli oförändrad; applicerad källa är inte automatiskt Clear.

En operation åt gången, inga retries, fallbacks eller extra modellgrenar. Använd separerad lokal integrationsarbetsyta på8826 först efter godkänd backendaktivering och uttryckligt lokalt 1.3-val. Stäng automatiska coverage-anrop i just testkörningsverktyget så att de två bedömningarna är de enda. Nuvarande interaktiva editor ska inte användas okontrollerat för en treanropsbudget. Ingen upload, extract, Chat, discovery eller diktering ingår. Vid första kontrakts-/scopefel stoppas testet. Alla försök räknas före transmission, även misslyckade HTTP-anrop; inga automatiska nya försök. Preview, reload och Accept är lokala.

### Data och uppskattad kostnad

Färsk definition visar gpt-6-luna för både Tailor och Coverage. Tailor max4000 output tokens; Coverage max3000 per anrop. No retries i noddefinitionerna. Modellens resultatkvalitet kan inte fastställas utan dessa senare riktiga test.

OpenAI Standard-pris hämtat2026-11-04: USD0,10/1M input, USD0,50/1M output; cache writes USD0,125/1M, cached input USD0,01/1M. Källa: https://developers.openai.com/api/docs/models/gpt-6-luna och https://developers.openai.com/api/docs/pricing. Regionalt tillägg kan vara10%; faktisk kontoregion/skatt är inte verifierad. Inga priser från äldre modeller används.

Planeringsantagande för de tre operationerna tillsammans: cirka18000–45000 input tokens och3000–10000 output tokens (inklusive modellens reasoning). Beräknat utan cacheread-rabatt, med eventuell cache-write och10% regionpåslag blir ungefär USD0,004–0,012. Avrundad försiktig uppskattning: **USD0,005–0,02 totalt**, utöver befintlig n8n-kvot/avtalskostnad och eventuell skatt. Ingen ny tjänst eller prenumeration. Detta är en uppskattning, inte ett kontosatt kostnadstak; verklig fryst payload ska storlekskontrolleras före separat testgodkännande. Körning434 använde4918input/415output, men den nya katalog-/källspårningen gör det inte till en exakt prognos.

## Verifierat och kvarstående

Syntetiska enhets-/kontraktstester kontrollerar ersättning/sammanslagning, flera källor, no-change, alla originalbelägg, oförändrade metadata, falska källnycklar, candidate tampering, samma CV-ID med ändrat innehåll, negativa/osäkra källor, korrigering/supersession och JSON-återställning, gamla append-kvitton och manuell checkpoint-avvikelse. De exakta förberedda Code-filerna exekveras isolerat med mockad modell; 1.2 före/efter är lika.

Den faktiska editorn testas i Edge på1536px och390px med syntetisk upload/discovery/Tailor/coverage: engelskt svar till svensk CV-punkt, Preview utan applicering, separat Accept, väntande och accepterad kandidat efter reload utan replay, ny coverage-hash, inga nya frågeplaneringar, full svarshistorik, korrigerat svar, explicit språk i applied/review, gammalt en-standardvärde samt ogiltigt sparat språk. Skärmbilder finns i den lokala granskningsmappen.

Återstår: verklig modellkvalitet, semantisk bevaring av varje unik sakuppgift och det riktiga ägarfallet efter ny integration, n8n-exekvering av1.3 och verklig täckningsbedömning. Validering av källnycklar kan inte bevisa att en modell formulerat alla fakta korrekt. Därför visas före/efter och källor och endast användarens Accept applicerar. Inga saknade CV-belägg tolkas som saknad personlig erfarenhet.
