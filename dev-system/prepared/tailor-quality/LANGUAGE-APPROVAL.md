# Automatiskt CV-språk och fullständig dokumentöversättning — separat backendförslag

2026-11-04, DEV-250. Lokalt Dev-arbete och syntetisk granskning är begärda. Ingen extern mutation, aktivering, publicering eller betald körning är godkänd eller gjord. Den nya språkpolicyn ersätter föregående obligatoriska dialog i DEV-249. Integrationens ursprungliga käll-/versionsskydd behålls. Detta är inget godkännande att aktivera1.3 eller1.4.

## Lokalt beteende

1. Ett faktiskt bekräftat användarval (cvLanguageConfirmed=true och sv/en) har företräde.
2. Annonsens uttryckliga instruktion om CV-/ansökningsspråk används före annonsens huvudspråk. Språkkompetens som arbetskrav är inte en ansökningsinstruktion. Matchad originaltext behålls som ett exakt lokalt spann.
3. Annonsens huvudspråk används när den inte anger ett entydigt ansökningsspråk.
4. Utan annons används det aktuella canonical CV:ts språk. Det inför inget nytt Tailor-utan-annonsflöde; editorns befintliga krav på jobbkontext är oförändrat.

Språk avgörs lokalt, utan nytt AI-anrop, med en konservativ sv/en-detektor och avgränsade uttryck för direkta ansökningsinstruktioner. Oklara/blandade eller motstridiga instruktioner ger inget gissat språk. Andra uttryckligt begärda språk markeras som ej stödda; sv/en är fortfarande kontraktets stödda språk. Inga erfarenhetssvar läses för språkval. En äldre sparad language=en utan bekräftelseflagga ignoreras som preferens. Ogiltiga språk kan inte vara bekräftade.

Automatik sparas inte som uttryckligt användarval. Beslutet räknas om från aktuell aktiv annons och aktuella canonical block; annonsutkastet påverkar inte aktiv kontext. Uttryckliga val bevaras vid annonsbyte och reload, men nollställs för nytt CV som tidigare. Ändrat målspråk/val gör tidigare kandidater inaktuella. Preview påverkar inte beslutsunderlaget.

Den framträdande CV language-knappen i toppraden är borttagen. Nära Tailor my CV och i granskningen visas CV language: Svenska/English · Change. Change är frivilligt och erbjuder Svenska, English eller Automatic. Dialog visas automatiskt först när språkbeslut saknas. Cancel ändrar inget, startar inget anrop och behåller tailoring-ytan. Vid annan eller osäker källspråksbild visas information om att hela förslaget kommer att använda målspråket före start.

Detektorn är inte en semantisk analysmodell. Ovanliga formuleringar, korta eller starkt blandade texter kan kräva manuellt val; nyckelorden avgör inte CV-täckning eller personliga fakta. Ingen ny språkidentifieringsworkflow eller tjänst behövs.

## Varför en ny kandidatprofil behövs

1.2/1.3 tillåter textändringar men låser metadata. En konsekvent översättning behöver också omfatta sektionsetiketter, roll-/utbildningsbenämningar och datumord. Att bara översätta nya tillägg eller tyst tillåta metadataändringar i1.3 skulle bryta befintliga garantier.

Den lokala, ännu inte externt aktiverade profilen sourcesSchemaVersion1.4 bygger vidare på1.3, med samma befintliga editor och Preview/Accept. Versionerna ändrar inte varandras schema. Dev/simulering på8825 använder1.4. Riktig integration på8826 och publicerad implementation behåller befintlig profil. En begäran som kan kräva helöversättning stoppas före nätverksanrop på den gamla backendvägen; ingen delvis översatt kandidat presenteras som en färdig helöversättning.

### Exakt tillägg till request

Utöver1.3 tillkommer languagePlan:{policyVersion:'1.0',explicitLanguage:null|'sv'|'en',source:'user'|'ad_request'|'ad_main'|'cv',cvLanguage:null|'sv'|'en'} och languageApplications:[]. Befintliga language och jobText/canonical blocks ingår redan. Hela begäran, inklusive policy, val och översättningskvitton, är SHA-256-bunden. Servern räknar om språkbeslutet från samma annons/CV och avvisar annan target/source/source-CV-language. Ett självdeklarerat språkfält eller gammal standardflagga är inte tillräckligt.

### Exakt tillägg till modellformat

Modellen returnerar integrations/contextQuestions/reviewNotes som i1.3 och document:[{documentKey,textState:'translated'|'target_language'|'proper_name',fields:{...}}]. documentKey är exekveringsbundet. Varje befintligt block ska redovisas exakt en gång, även avsnitt som inte behöver nytt innehåll. Modellen får befintlig heltext och metadata med tydlig målspråksinstruktion.

Ändrad brödtext går genom samma källbundna integrationssegment som i1.3; översättning är en härledd formulering, ingen ny oberoende faktakälla. Samtliga ursprungliga CV-belägg och aktuella svarskällor måste behållas enligt befintlig validering. Text som markeras translated måste faktiskt ha en textändring. Ofullständigt dokumentmanifest eller okända nycklar avvisas; saknat källunderlag för tidigare applicerad text får inte ge en blandad halvöversättning.

fields har exakt de redan befintliga displayfälten bland label/title/degree/program/startDate/endDate. Endast deras visningstext får översättas. Inga fält läggs till eller tas bort. blockId/type/order/employer/institution och övriga faktafält är oförändrade. Datumens siffersekvenser bevaras och befintliga icke-tomma fält kan inte tömmas. Identifierade namn-/kontaktblock får inte ändrad brödtext. Instruktionerna förbjuder ändrade egennamn, kontaktvärden, tal, omfattning eller nya meriter även i övrig text.

Deterministiska kontroller av schema/identitet/citat garanterar inte semantisk översättningskvalitet. Modellen får inte deklarera kvarvarande originalprosa som proper_name för att undvika översättning. Full Current/Suggested och konkreta metadata före/efter visas därför för granskning; först Accept applicerar. Verklig modellkvalitet måste kontrolleras senare, utan löfte om perfekta automatiska översättningar.

### Kvitton och kontinuitet

Kandidaten tillför languageChanges/languageApplications med blockId, originalFields, beforeFields, afterFields, inputRef och deterministisk ID-hash. De befintliga textsegmentkvittona behåller originalcitat och källsvar, på originalspråket. Metadatahistoriken supersederas utan att raderas vid ett senare språkbyte. Original/Edited och PDF använder respektive riktiga canonical block, inte ett separat CSS-översättningslager.

Tidigare experienceContext kan innehålla den svenska roll-/datumetiketten. En verifierad metadataöversättning får lösa just den gamla referensen via originalFields när den aktuella posten fortfarande exakt matchar kvittots afterFields. Ingen gissning eller godtycklig blockompekning sker. En vanlig senare metadataändring som bryter checkpointen stoppar säker översättning. Källsvarens registrerade sammanhang och revisioner skrivs inte om. Frågeflödet startas inte om vid Accept.

## Exakta förberedda externa ändringar — ej genomförda

Befintligt workflow H8oAioy58R1v3PvRe3YUa, senast verifierade saved/active34815fa3-85d7-4102-a8c5-b839e0b158b1. Två Code-fält, inga nya workflows:

- Validate + Normalize (b770f40e-b1a0-49fe-94e6-e003c3f42b41), parameters.jsCode: language-v14/validate-before.js → validate-candidate.js. Ny1.4-förhandling, språkvalidering, komplett katalog och instruktion. Den ännu oaktiverade1.3-integrationen ingår som separat gren; äldre aktiva profiler behåller sin kod som oförändrat suffix.
- Compose source suggestion (tailor-sources-compose-v1), parameters.jsCode: language-v14/compose-before.js → compose-candidate.js. Fullt dokumentmanifest, metadataallowlist, käll-/språkkvitton och strikt kandidatvalidering.

backend/n8n-tailor-language.cjs genererar exakta filer från delad klient-/backendkod. language-v14/manifest.json anger SHA-256 per fil, nod-ID och scope. Modell gpt-6-luna, endpoints, credentials, routing, inställningar och övriga workflows ändras inte. Coverage-prompten och frågeproveniens ingår inte implicit. Ingen PUT, aktivering eller webhookkörning görs i denna etapp.

Den befintliga outputgränsen4000tokens behålls. Ett stort dokument kan ge ett ofullständigt modellsvar; det ska avvisas med befintlig felhantering, aldrig lämna en halvöversättning eller köras om automatiskt. En eventuell framtida höjning av modellbudget/normaliserarens gräns är ett separat konkret konfigurations-/kostnadsgodkännande. Nya testanrop och deras frysta1.4-underlag behöver separat godkännande; föregående föreslagna treanropsplan är fortfarande inte utförd eller godkänd genom denna ändring.

## Återställning

Verifierad krypterad full saved/active-snapshot och kvitton från DEV-249 finns utanför Git i %LOCALAPPDATA%/Drafted/tailoring-quality-audit/integration-v13/. Se integration-v13/manifest.json för kontrollhash/versionsidentitet och APPROVAL.md för full återställningsplan. Före en framtida mutation krävs en ny GET, ny krypterad verifierad snapshot och exakt före-diff. Stoppa vid drift. Återställ endast de godkända Code-fälten på samma workflow och verifiera sparad och aktiv definition; aktivering/återpublicering kräver sin godkända scope.

1.4-arbetsytor ska bevaras och kan inte nedgraderas till en skrivande äldre ledger. Kodrollback återställer inte CV/svar; använd separat före-test-export i separat arbetsyta. Ingen vanlig domän, hosting eller publicerad klient ändras nu.

## Lokal verifiering

Unit/kontrakt: automatisk prioritet, språkkrav kontra kompetenskrav/negation, oklart språk, saknad annons, gamla en-defaults utan flagga, explicit val, annonsbyte, komplett svensk/engelsk kandidat inklusive oförändrade avsnitt och rubriker, metadata-/datumskydd, stale kandidat, ofullständigt manifest, källrevisioner och översättningsreferenser efter JSON-reload. Exakta förberedda n8n-Code-filer exekveras i isolerad VM med syntetisk modell; detta är inte ett n8n-runtime- eller modellkvalitetsbevis.

Riktiga Dev-editorn i isolerad Edge: sv/sv, en/en, sv/en, en/sv, svensk annons som begär engelska, engelskt erfarenhetssvar till svenskt CV, äldre obekräftat en, frivilligt användarval och oklart språk med Cancel/retry. Preview lämnar canonical CV oförändrat, Accept applicerar hela kandidaten, originalidentiteter/namn/källhistorik kvar, inga nya frågeplaneringar, reload utan Tailor-replay. Språkbyte i väntande review spärrar Accept. Desktop1536 och mobil390. Utan annons verifieras CV-fallback separat i resolver; befintligt jobbkontextkrav är oförändrat.

Granskning: http://127.0.0.1:8825/evidence/tailor-language/index.html, som öppnar den faktiska editorn med separat syntetisk arbetsyta. Exempel är handgjorda syntetiska svar och översättningar, inte en påstådd riktig AI-körning.
