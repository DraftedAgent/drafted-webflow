# CV-innehåll etapp 2 — lokalt implementerat, ej publicerat

Ägaren har godkänt lokal implementation och avgränsade kontraktsändringar. Inget godkännande för produktion. Källunderlag/svarsrevisioner, senaste godkända CV och aktuella förslag räcker; full historik eller profilsystem införs inte.

Research considered: LIT-001 / proxyutfall skiljs från karriärutfall; LIT-002 / relevant kontext, förklaringar och korrigerbarhet, enligt indexexport2026-11-07 19:14 CET och källregistrets redovisning. Sidmål och urvalskriterier är uttryckligt godkända produktval, inte bevisade effekter i dessa forskningsposter.

## Lokalt kontrakt selection-1

`cv-version-selection.js` skiljer `sources` (block och kompletta tillgängliga svarsrevisioner), `approved`, `omitted` och en separat `proposal` med basblock/operationer/beslut. Importerad originalrepresentation och fil ligger kvar i befintlig workspace-lagring. Källor kopieras vid skapande och skrivs inte över när kandidat eller godkänt CV ändras. Utelämning gäller bara den öppna CV-versionen. Sparning använder befintlig sessionsspegel/IndexedDB; ingen kontoprofil eller ny extern lagring.

`backend/cv-selection.cjs` tar schema, versionId, blocks, answers, målroll/annons, uppmätt sidantal och eventuell sektionsinstruktion. Providergränsen är `createHandler({model})`. Modellen får föreslå keep/shorten/omit för varje block en gång och ange reason och exceptionReason. Betydande ändringar kräver motivering. Förkortning ska vara kortare text i samma block. Identitet/kontakt skyddas mot utelämning. Alla block får inte utelämnas. Okända/duplicerade block eller extra gruppfält avvisas. Schemakontroller bevisar inte semantisk trohet; det kräver modellutvärdering och användarens granskning.

Den nya lokala routen `/preview-api/cv-selection` använder en uttrycklig syntetisk provider: den tar bort identiska upprepade rader och föreslår bortval endast av särskilt märkt syntetisk perifer erfarenhet. Den gör ingen verklig generell relevansbedömning. Fulla instruktioner och providergräns finns för en senare avgränsad modellkoppling. Inga produktionsflöden har ändrats och ingen faktisk modellkvalitet är verifierad.

## Produktflöde

Efter granskade formuleringar kan urvalsgranskningen starta automatiskt i lokal Dev; den kan också startas med Review content and length. Formuleringsgranskning och urvalsgranskning överlappar inte. Urvalet utgår från aktuellt godkänt CV och visar kandidat i befintlig preview. Accept/Decline/Edit finns i editorn och previewkontrollerna och använder samma tillstånd. Keep ändrar inget och räknas inte som användarens Accept. Motivering, före/efter och en helhetsöverblick med separat beslutsstatus visas. Revision förblir obeslutad. Återställning startas från listan över utelämnat innehåll och kan revideras före Accept.

Beroende textändringar inom ett block utgör ett gemensamt förslag och godkänns atomärt med hela blockets före/efter synligt. Det finns inte dolda separata delbeslut för rader som samma förkortning beror på. Inga grupper över olika anställningar tillåts. Utelämnade blocks källreceipts sparas separat och tas ur den aktiva ledgern; återställning för tillbaka motsvarande receipts. Om en underliggande svarsversion har ändrats måste återställningens källkoppling granskas på nytt; en gammal källa appliceras inte tyst över rättad information.

Återställning är en ny kandidat från den bevarade blockrepresentationen, aldrig en återgång till en gammal helversion. Senare ändringar i andra block bevaras. Om målblocket redan finns eller har ändrats efter förslagets bas avvisas beslutet som konflikt. Kandidater som återkommer efter ett asynkront anrop förkastas om CV, version eller annons ändrats under anropet.

## Layout och export

Sidantal kommer från samma A4-paginering, mallar, typsnitt och sidbrytningar som den befintliga PDF-förberedelsen. Kandidatens sidantal visas när kandidaten visas; efter beslut renderas aktuell projektion om. Zoom ändrar bara skalan. Inga automatiska ändringar av typsnitt, marginaler eller radavstånd införs. 1–2 sidor är ett flexibelt mål, med synlig möjlighet till motiverat undantag.

Exportens godkända kanoniska innehåll är fortsatt källan. Den befintliga spärren för obeslutad preview omfattar nu även selection-1. Den publika exportens payloadformat ändras inte. Original-vyn exporterar godkänd aktuell version via det befintliga flödet. Förslag eller preview blir aldrig implicit godkända.

## Verifiering och begränsningar

- Enhetstester: utelämning bevarar källor och svarsrevisioner, restore-as-proposal bevarar senare ändringar, Decline/Edit lämnar godkänt innehåll oförändrat, gamla målkonflikter stoppas.
- Providerkontroller: saknade/duplicerade block, otillåtna gruppfält, skyddad identitet och ogiltig förkortning avvisas. Befintliga sektions-/språk-/källkontroller fortsätter passera.
- Faktisk lokal webbläsare och simulerad backend: preview före Accept, beslut från preview synkas till editor, omladdning under granskning, bevarat källunderlag efter bortval, återställning efter senare godkänd korrigering och omladdning efter återställning. Även Decline och Edit från omit till shorten verifieras utan automatisk acceptans.
- Faktiska PDF-filer skapade av Chromium från det befintliga exportförberedda dokumentet, räknade med Poppler: godkänt urval 4 sidor, återställt 6 sidor och omladdat återställt 6 sidor. Varje PDF har samma sidantal som aktuell preview vid 50 %, 150 % och fit-zoom. Grundtypsnittet bevaras. Första sidan i godkänd PDF har renderats och inspekterats visuellt. Detta verifierar faktisk PDF/layout, inte verklig modellkvalitet eller rekryteringsutfall.
- Befintliga browserflöden för sektionsbeslut, Edit, språk och omladdning passerar. Standalone-bygget lämnar fryst referens och skyddade root-artefakter oförändrade.

Bevisfiler ligger lokalt i `output/pdf/selection/`. Ingen produktionspublicering, n8n-mutation eller betald modellkörning har utförts. För verklig modellkvalitet behövs en avgränsad modellutvärdering med provideranslutning, syntetiska yrkes-/senioritetsfall och semantisk granskning; simuleringsresultaten får inte beskrivas som sådan verifiering.
