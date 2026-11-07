# Stabil lokal referens och dev

Det här är två **kodversioner** av samma implementation. Det är separat från
valet mellan simulerad backend och riktiga n8n-/AI-anrop.

- **Stabil referens:** http://127.0.0.1:8827/ och `/editor`. Fryst Git-commit,
  simulerad backend. Exakt vald commit står i `stable.json` och i sidans lägesrad.
- **Dev:** http://127.0.0.1:8825/ och `/editor`. Arbetskoden på `codex/local-dev`,
  simulering som standard. Lägesraden visar commit och om bygget har lokala ändringar.
- **Dev, integration:** http://127.0.0.1:8826/ och `/editor`. Samma dev-kod men
  separat backendkonfiguration och lagring. Startkommandot är spärrat som standard.
  DEV-163 har separat godkänt/aktiverat riktiga anrop för ägarens manuella test;
  aktuell körning visar ”Integration · riktiga anrop”.

Inga nya hostingkonton, domäner, n8n-flöden eller AI-resurser skapas här.

## Starta

Kör från repositoryts rot, en terminal per önskad version:

```sh
node tools/local-versions.cjs stable
node tools/local-versions.cjs dev
node tools/local-versions.cjs dev-integration
```

Dev-kommandona bygger om aktuell kod innan de startar servern. Vid fortsatt
utveckling: kör om respektive byggkommando eller starta om dev-kommandot och
ladda om webbläsaren. De ändrar aldrig den stabila versionen. Portkonflikt ska
lösas genom att stoppa rätt tidigare server, inte genom att byta port slumpmässigt.
Använd `127.0.0.1`, inte ett annat värdnamn.

## Så fryses referensen

`site/local/stable.json` pekar på en fullständig Git-commit och en lokal tagg
`drafted-local-stable/<commit>`. Första referensen är dagens lokalt verifierade
standalone-version, inte en kopia av den äldre publicerade Webflow-sidan och
inte ett påstående om att riktig AI har verifierats.

`git archive` materialiserar exakt den committen i ignorerad
`site/.local-releases/<commit>/`. Samma byggverktyg bygger dess frontend.
Även server, syntetiska svar och hjälpkod kommer från den frysta committen;
de läses inte från den föränderliga dev-koden. Filhashar kontrolleras före start.
Ändrad fryst cache leder till ett tydligt stopp, inte en tyst ombyggnad från dev.
Byggcache är ett versionsbundet resultat, ingen separat implementation att redigera.

Git-commit/tagg/pointer är återställningskällan. Allt är lokalt tills en separat
push begärs; detta är inte en extern säkerhetskopia. `main` lämnas orörd.

## När granskade ändringar får bli stabila

1. Ändra och testa i dev på `codex/local-dev` eller en ny `codex/*`-arbetsbranch.
   Samla ändringarna i en lokal commit. Jämför mot committen i `stable.json`.
2. Visa dig exakt kandidat och testresultat. Ditt godkännande ska gälla den
   committen. Nya ändringar efter granskningen ingår inte automatiskt.
3. Först därefter: `node tools/local-versions.cjs promote FULL_SHA --approved
   "referens till ägarens godkännande"`. Kommandot kräver en ren arbetskatalog,
   bygger/verifierar committen innan pekaren byts och bevarar förra committen.
   Anteckningen är spårbarhet, inte teknisk verifiering av mänskligt godkännande;
   agenten måste fortfarande följa godkännanderegeln.
4. Committa den ändrade `stable.json` och loggen. Starta om den stabila servern.
   En redan startad server fortsätter visa sin gamla commit tills den startas om.

`prepare FULL_SHA` bygger bara en versionsbunden kandidat och ändrar ingen pekare.
Ingen push, merge till main, publicering eller backendaktivering ingår i promote.
Återgång använder samma godkända process med en tidigare commit; taggar och
historik skrivs inte om och gamla cacheversioner behålls.

## CV-arbete och delade resurser

Webbläsaren skiljer IndexedDB och sessionStorage mellan de tre olika origins
(portarna). Stabil, dev och dev-integration har därför separata CV-block,
originalfiler, chattar, frågesvar och förslag. Dev skriver inte till stabils
lagring. Befintligt arbete på 8825/8826 behålls; inget kopieras automatiskt till
8827. Ny stabil kod på samma port behåller dess lagring; framtida schemaändringar
måste ha granskad migration. Kodrollback återställer inte automatiskt CV-data.
Lagringen är fortfarande per flik/origin, inte ett konto eller en databasbackup.

Simuleringen är lokal i varje serverprocess; testkörningarnas anropshistorik delas
inte mellan versionerna. Ingen riktig backend används i nuvarande servrar.
Om integration senare godkänns använder den **befintlig gemensam n8n-instans,
samma workflow-ID:n, credentials, modeller och kvoter som nuvarande produkt**.
Stabil frontend fryser inte dessa externa resurser. En framtida n8n-ändring kan
alltså påverka flera frontendversioner. Ingen separat dev-backend har skapats.

Den separat godkända DEV-163 origin-ändringen gäller bara 8826 plus befintlig
Webflow-adress; 8827 behöver ingen n8n-åtkomst när den simulerar. Versionsverktyget
har ingen flagga för riktiga anrop. Den tidigare separat förberedda aktiveringen
och dess kostnads-/testgodkännande dokumenteras här:
[integrationsunderlag](../integration/APPROVAL.sv.md).
Detta arbete godkänner eller utför inte de externa stegen.

Interaktiv simulerad Dev på8825 väntar9sekunder innan ett nytt plan-svar för
upplevelsefrågorna skickas. Detta gör väntanimationen möjlig att granska.
Det är en lokal simulerad svarsfördröjning, inte en timer i produktgränssnittet.
8826/riktiga anrop och den frysta referensen påverkas inte. Alex Example är
syntetiskt underlag, inte cache av den uppladdade filens innehåll.
Omladdning återställer redan förberett arbete: använd ett nytt privat fönster
utan tidigare privat session och ladda upp CV + jobbannons för en ny körning.

## CV-täckning — DEV-189, 2026-11-02

Ägarens avgränsade godkännande har aktiverat en separat coverage-koppling på
8826. Dev8825 och stabil8827 fortsätter med simulering. Ingen publik frontend
har ändrats. Det nya workflowet är `JaUV7PezrztJGpr7`, aktiv version
`29b5205b-d4bc-4a93-86c2-7cb4604d4aca`, modell `gpt-6-luna`.

Ny separat DPAPI-credential ligger utanför Git. Den privata budgeten i
`%LOCALAPPDATA%/Drafted/coverage/budget.json` delas mellan flikar/omstarter:
100 coverageanrop totalt,10/minut,2 samtidiga. Sätt enbart `enabled:false`
för att stoppa nya coverageanrop; nollställ inte `used`. Övriga AI-flöden har
sina befintliga resurser och gränser. Kostnader använder befintliga konton.

Tre godkända syntetiska riktiga workflowanrop är förbrukade. Två avvisades;
ett komplett assessment efter JSON-formaträttning lyckades. Det använde en
syntetisk lokalt förankrad signalkatalog. Verklig ankargenerering efter
rättningen och komplett före/efter-jämförelse är inte verifierade. Inga fler
agentdrivna riktiga verifieringsanrop får göras på detta godkännande.
Detaljer och krypterade snapshotmanifest: `dev-system/prepared/cv-coverage/delivery.json`.


### Separat lokal Tailor-provider (DEV-296)

Standard är fortfarande simulering. Källintegrationen känner då bara sitt uttryckliga syntetiska exempelsvar; andra svar ger nu ett synligt fel och sparat underlag, inte ett färdigt oförändrat resultat. `DRAFTED_SELECTION_PROVIDER=openai` aktiverar inte källintegrationen. För ett nytt uttryckligen godkänt lokalt modelltest kan källintegrationen konfigureras separat med `DRAFTED_TAILOR_PROVIDER=openai`, `DRAFTED_TAILOR_MODEL_APPROVAL=tailoring-local-approved` och befintlig säker `OPENAI_API_KEY` i processmiljön. Detta är konfiguration, inte tillstånd att köra: tidigare förbrukade anropsbudgetar återanvänds inte. Adaptern har maximalt sex källanrop per process och inga automatiska återförsök; faktisk godkänd testbudget kan vara lägre. Urvalssteget har fortsatt sin separata provider och budget. Ingen ny modellkörning eller publicering genomfördes i DEV-296.
