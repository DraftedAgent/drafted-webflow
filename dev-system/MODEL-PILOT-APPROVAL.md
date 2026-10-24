# Modellpilot för separat godkännande — DEV-105

Förberedd 2026-10-24, **inte godkänd eller körd**. Ersätter DEV-104:s tidigare material och godkännandeutkast. Ingen driftsättning ingår.

## Den konkreta körningen

- Unikt runId: `3c3b6ffa-d233-41a7-8393-e0b7f0e5adcb`.
- Högst **72 modellanrop**: 18 helt syntetiska fall, sex vardera för planering, svarstolkning och source-Tailor; två upprepningar av befintligt respektive föreslaget internt kontrakt.
- `gpt-4.1-mini`, temperatur 0,2, `service_tier=default`, `store=false`, `max_output_tokens=4000`. En begäran åt gången, högst 90 sekunder per anrop och 30 minuter totalt. Ingen retry eller återupptagning.
- Discovery använder JSON-object-läge, Tailor textläge. Den gemensamma 4000-gränsen avviker från driftsatt Discovery utan explicit motsvarande gräns. Produktionsworkflows ändras inte.
- Endast OpenAI Responses och separat utvärderingsnyckel. Ingen användardata, produktionswebhook, CV-importmodell eller annonssignalmodell körs.

Föreslaget kostnadstak för klienten: **1,00 USD**. Standardpriset är 0,40 USD per miljon indatatokens och 1,60 USD per miljon utdatatokens, kontrollerat 2026-10-24 i [officiell OpenAI-dokumentation](https://developers.openai.com/api/docs/models/gpt-4.1-mini). Alla konservativa förhandsreservationer summerar till cirka **0,7554 USD**. Standardtier väljs uttryckligen enligt [API-kontraktet](https://developers.openai.com/api/reference/cli/resources/responses/methods/create); avvikande faktisk tier stoppar försöket med bibehållen osäker reservation. Kontots åtkomst har inte provats med ett modellanrop.

## Exakt material och bindning

- Manifest SHA-256: `690751f8f15367d7483fc4ed3963a375f5ea8d69105c22e9035c7281ef6b3288`.
- Material SHA-256: `c1726b5e4bc340468ba811bc24ba36a7eb378999b5f1874238fbde3a27fb07d7`.
- Källpaket SHA-256: `ab0667e530a1e37e1deb150a4160b11c116a6bd8158a28db3141310131af771c`.

[Fullständigt manifest och syntetiska begäranden](prepared/model-pilot/manifest.json), [godkännandeutkast i version 2](prepared/model-pilot/approval.template.json), [maskinläsbart kostnads-/körningsförslag](prepared/model-pilot/proposal.json). Utkastet har fortfarande **approved:false**. Körningen får starta först efter ägarens separata uttryckliga godkännande av just detta runId, material, hashvärden, inställningar och kostnadstak. Gamla godkännanden avvisas genom både versionskravet och de nya hashvärdena.

Det tidigare nej/skip-fallet har förstärkts till **tailor-withdraw-all**, vilket behåller gränsen 72 anrop. Två svar har tidigare gett tre tillägg i erfarenhet, färdigheter och projekt. Nuvarande revision säger nej respektive är överhoppad. Inga positiva källor ska användas; samtliga tre exakt spårade tillägg ska föreslås tas bort. [Exakt request, modellinput, tomt modellresultat och båda profilernas granskningssvar](prepared/model-contracts.withdrawal.json). Tidigare Apply-spårs hela originaltexter och revisioner bevaras. CV ändras först efter Apply.

## En enda start och beständig budget

RunId förbrukas genom atomisk exklusiv filskapning i OS-användarens fasta `.codex/drafted-model-pilot-runs`. Plats och budgetreservation skrivs och fsyncas före varje HTTP-anrop. Känd förbrukning avräknas beständigt; okänd förbrukning hålls reserverad. Byte av resultatmapp, ny process eller parallell start kan inte återanvända godkännandet. Även krasch och tom/skadad journal blockerar ny start. Ett nytt försök kräver ett nytt separat godkännande med nytt runId; journalen får inte raderas för att kringgå detta. Spärren gäller denna OS-användares lokala register.

## Verifierat och återstående bedömning

**168 enhetstester passerar.** Isolerade barnprocesser använder temporär OS-hemkatalog och injicerad HTTP för att kontrollera ny process/resultatmapp, parallella starter/anrop, processdöd med reservation, timeout, transportfel, ogiltig usage, tieravvikelse och resultatskrivfel. Ingen riktig modell eller API-nyckel används. Faktisk förberedd kandidat-Code och jämförelsebas ger suggestion för de tre borttagningarna och no_changes först efter simulerad Apply. Ingångs-CV:t lämnas orört under granskningen.

Samtliga 72 uppdaterade platser har också körts mot deterministisk mockprovider: noll externa modellanrop. Detta verifierar mekaniken; mockens medvetna semantiska planmissar redovisas fortsatt. [Mockrapport](prepared/model-pilot/mock.report.json).

Den riktiga piloten ska mäta rå format-/referensföljsamhet separat från backendåterhämtning och slutligt utfall. Källstöd, placering, negationer, relevans och variation granskas manuellt. Tid, tokens, känd/osäker kostnad och stopp rapporteras. En lyckad återhämtning ger inte rå modellen godkänt. Utfallet är en begränsad observation, inte bevis på produktionsstabilitet. Aktivering kräver därefter separat redovisning och leveransgodkännande.
