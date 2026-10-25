# Discovery: återställningsbedömning efter INCOMPLETE_INLINE_ASSESSMENTS

2026-10-25. Endast läsning, backupinspektion och lokalt beslutsunderlag. Inga driftändringar, modellanrop, omkörningar eller nya tester. Fler punktfixar i drift stoppade. Det större granskningspaketet förblir pausat.

## Vad som faktiskt har fungerat i användning

Användarens sparade planrespons `49859e84-3a3a-42e9-b850-fc2ef749b8f3` är `ok:true` med tolv frågor. Den bifogade responsfilen skapades 2026-10-23 20:54:32 UTC och bilden av tolv frågor 20:55:01 UTC. Det ligger mellan publiceringen av `720bf158-17f4-440d-9a29-a5a84fa3b3a3` (DEV-092, cirka20:39 UTC) och nästa version `8cd1ce3b-5745-45be-a1aa-040f05a72418` (DEV-094, cirka21:06 UTC). Detta är verklig användningsoutput, inte ett syntetiskt test. Responsen innehåller inget backendversions-ID; tidskopplingen är stark men indirekt. Användaren rapporterade samtidigt oacceptabel variation och senare noll frågor, så detta visar inte stabilitet.

Det senaste tydliga belägget för att användaren faktiskt kunde få och besvara frågor är den senare bilden med avslutningen efter fem plus två frågor, skapad **2026-10-24 17:07:10 UTC**. Vid den tiden var `8fc9596b-ca45-4ade-8697-34e27bc9ecce` publicerad (DEV-095, 2026-10-23 21:20 UTC) och efterföljande `6336f54e-9913-4976-bd32-78d8508338d5` ännu inte publicerad (DEV-103, 2026-10-24 cirka18:59 UTC). Bilden visar Ready to tailor och en uppgift om att en tolkning fortfarande bearbetas. Den bevisar att frågor visades och användaren hade lämnat svar; den bevisar inte att alla tolkningar eller Tailor slutfördes. Inte heller bilden innehåller serverversion; versionskopplingen bygger på dokumenterat publiceringsfönster, inte en responsbunden serverstämpel.

**8fc9596b är därför den senaste underbyggda kandidaten med fungerande användning, inte en bevisat stabil eller exakt responsidentifierad version.** Samma version avvisade senare ett svar med `UNASSIGNED_TOPIC`, vilket dokumenteras i DEV-102 och föregick DEV-103. Att återställa den kan återinföra det kända felet.

DEV-103:s `6336f54e` är den senaste kompletta basen före Luna-migrationen, men leveranskvittot dokumenterar syntetiska kontroller och aktiverad kod, inte en lyckad efterföljande vanlig användarkörning. Den är därmed inte belagd som senaste fungerande drift. Luna-, inline- och diagnostikversionernas lyckade lokala tester/återläsningar utgör heller inget sådant belägg.

**Ingen dokumenterad felfri/stabil återställningspunkt har hittats.** Det finns däremot en återställbar historisk kandidat med verkliga framgångar och ett känt fel.

## Är en sammanhängande återställning möjlig?

DEV-095:s krypterade post-publiceringsbackup har lästs och verifierats, utan att publicera eller exportera credentialvärden. Krypterad filhash och de dekrypterade originalsträngarnas sparad/publicerad SHA-256 matchar backupmanifestet. Sparad och aktiv version är båda `8fc9596b-ca45-4ade-8697-34e27bc9ecce`; sparade/publicerade nod- och kopplingsprojektioner överensstämmer. Backupen innehåller den fullständiga definitionen.

Den versionen har sju noder:

1. Discovery webhook
2. Validate request
3. Input valid?
4. Build discovery prompt
5. Discovery model
6. Validate model response
7. Respond discovery

Requestvaliderarens kod och parametrarna för webhook, Input valid? och Respond discovery är identiska med den kända aktiva basen före den senaste diagnostikändringen. Diagnostikändringen berörde bara Validate model response. Publik Discovery1.0 med plan/interpret och public topics/drafts-format behålls, och fullständiga signalbedömningar krävs även i DEV-095. Den publika kompatibiliteten med nuvarande editor är därmed underbyggd av kodjämförelse. Ingen ny frontend, CV-/svarsdatamigrering, Tailorändring eller återställning av andra workflow behövs.

En sammanhängande rollback måste återställa prompt, intern modellprofil, validering, modell/API-inställningar och graf **tillsammans**. Det innebär:

- Återställ de två Code-noderna `Build discovery prompt` och `Validate model response` till DEV-095.
- Återställ `Discovery model` till dess dåvarande `gpt-4.1-mini`, temperatur0.2 och ursprungliga svarshantering. Att bara återställa Code och behålla Luna vore en ny oprövad kombination.
- Återställ sjunodsgrafen och ta bort den senare tillagda `Luna output - Discovery model`-vakten från just Discovery. Behåll övriga historiska parametrar/inställningar; ingen blandning av nya och gamla modelladaptrar.
- Övriga fem migrerade workflow behåller Luna. Detta vore ett uttryckligt, tillfälligt modellundantag för Discovery, inte en ny modellpolicy eller automatisk fallback.

Arkivets modellbehörighet/aktuella API-tillgänglighet är inte liveverifierad. Credentialreferens och aktiv bas måste jämföras före en eventuell godkänd leverans. Att definitionen kan återställas och att det publika kontraktet passar bevisar inte att den gamla modellkombinationen fungerar i dag.

## Exakt vad dagens fel visar och vad som saknas

Ny management-GET visar sparad/aktiv `8c5750c8-370b-4829-941a-b64ce90ddf03`. Exekveringslistan är tom och inställningarna är fortsatt `saveDataErrorExecution:none`, `saveDataSuccessExecution:none`, `saveManualExecutions:false`. Ingen misslyckad modelloutput finns tillgänglig där. Det publika422-svaret innehåller inte modellens assessments. Ingen privat modell-/CV-/svarstext har sparats eller skrivits ut i bedömningen.

`INCOMPLETE_INLINE_ASSESSMENTS` uppstår exakt vid detta aktiva villkor:

```js
!raw.assessments ||
typeof raw.assessments !== 'object' ||
Array.isArray(raw.assessments) ||
Object.keys(raw.assessments).length !== ids.length ||
ids.some(id => !Object.hasOwn(raw.assessments, id))
```

`ids` skapas av backend från samtliga `jobContext.topPriorities` och `jobContext.mustHave`, med nycklarna `signal_topPriorities_N` och `signal_mustHave_N`. Antingen har behållaren fel typ, eller så är nyckeluppsättningen inte exakt lika med katalogen. Det är **inte** diagnostiken för ett felaktigt frågeobjekt/ogiltig kind inne i en befintlig bedömning; sådana fel upptäcks senare och har andra detaljkoder. Ett utbytt signal-ID kan samtidigt ge både en saknad och en tillkommen nyckel, även om antalet är rätt.

För den rapporterade körningen är följande fortfarande okänt: behållarens faktiska typ, katalogens exakta nycklar, returnerade nycklar, mängden saknade och mängden tillkomna. Inga exakta nyckellistor kan ärligt anges från de tillgängliga uppgifterna. Ingen av dessa listor har fyllts i, antagits eller omvandlats till noll frågor.

## Minsta konkreta väg framåt

1. **Ingen ytterligare driftpatch nu.** Välj antingen att tillfälligt återställa hela DEV-095-kombinationen som ovan, eller låta nuvarande version ligga kvar medan mer underlag samlas. Min rekommendation för en faktisk återställningsåtgärd är DEV-095 som sammanhängande kandidat, med tydligt accepterad risk för det tidigare UNASSIGNED_TOPIC-felet. Rekommendationen bygger på verkliga användningsframgångar, inte på ett påstående om verifierad stabilitet.
2. För ett godkänt rollbackförsök: säkra dagens definition, matcha arkiv/current credentialreferens, spara och aktivera exakt återställd kandidat och återläs. Därefter behövs **en uttryckligen godkänd vanlig användarkontroll** av fråga → svar → avslut. Det är den nödvändiga kontrollen av återvunnen funktion; en bred syntetisk kampanj eller ny modellpilot föreslås inte. Ingen sådan körning har gjorts eller beställts automatiskt.
3. Om exakt rotorsak till den aktuella versionen ska fastställas krävs modellens nyckelstruktur från en misslyckad körning. Den förlorade körningen kan inte återskapas retroaktivt. Minsta framtida diagnostikunderlag är behållartyp, förväntade katalog-ID:n, saknade katalog-ID:n, extra tekniska ID:n och antal extra icke-tekniska nycklar. Okända fria nyckelsträngar och alla värden/textdelar ska uteslutas. Detta skulle behöva förberedas och godkännas separat; ingen ytterligare sådan driftpatch införs nu.

Att återställa bara föregående diagnostiknod kan inte rätta nyckeluppsättningen: diagnostikleveransen ändrade inte godkännandereglerna. Att gå tillbaka till `063ed025` eller `c1188d30` är inte heller en dokumenterad återgång till fungerande användning; dessa versioner har redan rapporterade stopp. Den pausade bredare planen används inte som rollback eller ny rättning.
