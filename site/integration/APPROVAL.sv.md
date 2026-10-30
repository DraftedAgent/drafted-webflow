# Lokalt integrationsläge — för godkännande

**Status 2026-10-30, DEV-163:** Ägaren godkände den exakta ändringen och klargjorde
att just n8n-publiceringen ingår. Endast `allowedOrigins` har ändrats och
sparad/aktiv version `dd665329-f992-4158-86ab-d5c32260e255` har verifierats.
En enda testomgång med syntetiskt CV gjorde åtta av högst tio workflow-anrop;
alla åtta gav HTTP 200/ok. Ingen upprepad testserie. Se
[leveranskvitto](deployment-receipt.json) och [anslutningskontroll](connection-verification.json).
Integration på 8826 är aktiverad för ägarens manuella test. Simulerat dev och
stabil referens är oförändrade. Texten nedan bevarar det ursprungliga underlaget.

Förberett 2026-10-30. Ingen hosting väljs, köps eller publiceras. Domänen lämnas
orörd. Inga riktiga workflow-/AI-anrop eller externa ändringar har gjorts.

## Två separata lägen

- **http://127.0.0.1:8825/**: ”Simulerat lokalt”. Befintliga syntetiska svar,
  inga externa anrop. Filpreview visar vald fil; bearbetningen ger exempeldata.
- **http://127.0.0.1:8826/**: ”Integration · spärrad”. Förberedd riktig koppling,
  men anrop är avstängda. Ingen tyst återgång till simulerade svar.
  Efter godkänd aktivering visas ”Integration · riktiga anrop” och
  ”Ditt CV skickas till n8n och AI” på både startsida och editor.

Samma HTML/editor/hero byggs till separata kataloger. Lägesraden finns redan i
initial HTML. `/editor` kan öppnas direkt och laddas om. Lagringen är separat per
origin/flik: simulerat arbete importeras inte till integrationsläget. Servern
lyssnar bara på 127.0.0.1; den är ingen hosting eller backendproxy.

## Spärrar och konkret föreslagen ändring

Simulerat läge har lokala endpoint-överstyrningar, en fetch-spärr och CSP
`connect-src 'self'`. Integrationsläget använder befintliga produktionskontrakt
utan preview-överstyrningar. Det har också fetch-spärr och samma CSP tills
servern uttryckligen aktiveras. En URL-parameter eller knapp kan inte aktivera det.
Aktivering öppnar bara befintlig n8n-origin i CSP; fetch tillåter endast POST till
de sju befintliga webhook-sökvägarna. Inga nycklar läggs i frontend.

Färsk **GET-inspektion 2026-10-30 11:48 UTC** bekräftar samma sparade och aktiva
uppladdningsversion: `dbaffef6-c149-4bad-a016-83269c50e47a`.

- Workflow: **Main-UploadPreview**, ID `6Bvk0NYcElT9OirH`.
- Nod: **Webhook**, ID `35b25396-c4ba-41c3-8302-2cc7ea0c9fb0`.
- Fält: `parameters.options.allowedOrigins`.
- Nu: `https://drafted-cad750.webflow.io`.
- Föreslaget: `https://drafted-cad750.webflow.io,http://127.0.0.1:8826`.

Det är den enda planerade n8n-ändringen. En ren transformationsfunktion har
kontrollerats mot aktuell definition: när fältet återställs är hela definitionen
identisk. Befintlig Webflow-adress behålls. `localhost`, annan port och telefonens
LAN-adress är andra origins och omfattas inte av detta förslag.

De övriga sex granskade flödena har ingen explicit origin-begränsning i sina
definitioner. Det är **inte** bevis för fungerande CORS från lokal adress.
[n8n:s dokumentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
beskriver kommaseparerade origins; faktisk respons, preflight och felrespons måste
verifieras i nästa godkända etapp. CORS är inte autentisering.

## Godkännande som behövs innan aktivering

1. Tillåt exakt origin-ändringen ovan och publicering av den ändringen i det
   befintliga aktiva uppladdningsflödet. Först läses versionerna om och kompletta
   sparade/aktiva rollback-snapshots krypteras utanför Git samt hashverifieras.
   Versionsdrift stoppar ändringen. Inga andra noder eller inställningar ändras;
   flödet avaktiveras inte. Sparat och aktivt resultat kontrolleras efteråt.
2. Tillåt lokal serveraktivering av riktiga anrop. Då kan ditt valda CV och
   jobbannons skickas till befintlig n8n och de AI-tjänster flödena använder.
   Annonsanalys och planering av erfarenhetsfrågor kan startas automatiskt av
   användarens inmatning; det är inte bara chattknappen som kan ge AI-anrop.
3. Tillåt en första kontrollerad anslutningskontroll med syntetiska dokument,
   högst 10 avsiktligt initierade workflow-anrop totalt, inklusive kontroll från
   gammal Webflow-origin. Stoppa vid oväntat fel. En workflow-körning kan innehålla
   flera modellsteg; detta är ingen garanti om en viss AI-kostnad. Därefter kan
   du manuellt testa ditt faktiska CV enligt guiden. Agenten kör inte ditt CV
   automatiskt och kör inte hela den manuella guiden utan vidare godkännande.

Ingen ny hostingkostnad eller licens krävs för den lokala servern. Riktiga anrop
förbrukar befintlig n8n-kvot och kan ge AI-kostnad enligt ditt befintliga konto.
Återstående kvot, tokenmängd och kronor per CV är inte verifierade; därför finns
ingen påstådd kostnadsgaranti. Ingen uppgradering eller nytt abonnemang ingår.

## Återställning

Stoppa integrationsservern och stäng dess flikar; starta vid behov om utan
aktiveringsflaggan. Simulerat läge fortsätter fungera. Återställ endast
`allowedOrigins` till föregående värde med versionskontroll och verifiera sparad
och aktiv definition. Behåll krypterad full snapshot för nödfall; skriv inte över
senare orelaterade ändringar. Ingen lokal CV-lagring behöver raderas. Redan
startade backendkörningar eller uppkomna kostnader upphävs inte av återställning.

## Verifierat och återstående

Verifierat med lokala testdata: båda lägenas märkning, spärrat läge, tillåtna
endpoint-anrop med avlyssnade syntetiska svar, direktbesök, upload→editor,
omladdning, Original/Edited-återställning, oförändrat återupptagande och historik
på desktop/mobil. Befintlig syntetisk funktionssvit och återställningssvit passerar
även med lägesraden: chatt/Apply, frågor, Tailor, filbyte/fel, preview, zoom,
scroll och avbrutna anrop utan automatisk omkörning. Ingen riktig n8n-körning.

Återstår: riktig anslutning till alla använda endpoints, uppladdningens
filstorleksgränser, riktiga modellresultat/fel/latens och fysisk mobil med
skärmtangentbord. Tidigare PDF-jämförelse verifierade oförändrad dokumentgeometri
och export mot publicerad baseline; lägesraden ligger utanför exportens dokument
och döljs även vid sidutskrift. Resultat från modeller kan ändå ändra CV-innehåll
och därmed sidantal; det är inte en layoutregression.

Lokal start (spärrat): `node tools/prepare-local-integration.cjs` följt av
`node tools/serve-local-integration.cjs`. Först efter godkännande används samma
server med `--enable-real-backend`. Den flaggan har inte startats för verklig trafik.
Automatiska tester använder isolerade servrar med all extern trafik avlyssnad.
