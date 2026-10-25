# Discovery-planering: lokalt leveranspaket

Status: lokalt implementerat och syntetiskt verifierat. Inte driftsatt. Inga modellanrop, workflowändringar, aktiveringar, frontendändringar eller publiceringar har utförts.

## En avgränsad leverans

Workflow: `zeIzzxPwD2Y91OyD`, **Drafted Experience Discovery v1 (inactive development)**. Namnet är historiskt; workflowet är aktivt. Verifierad sparad och aktiv basversion: `063ed025-c1ee-4778-90cb-91b83e6f9be5`. Basen lästes via management-API, utan webhookanrop. Fullständig projektion verifierades mot föregående leveranskvitto före lokal förberedelse.

De tre godkända förenklingarna införs tillsammans:

1. Backend binder identitet och format till den validerade begäran och n8n-körningens ID. Modellen returnerar bara `assessments`. Källtext/revision/koppling till den ursprungliga begäran ligger kvar på serversidan. Modellen får fortfarande välja bland kända signal- och källreferenser; frågeägare skapas endast av backend.
2. Systeminstruktion och användarunderlag blir separata API-meddelanden. CV- och annonstext skickas i datameddelandet, med ursprunglig text bevarad. Att skilja roller är ingen garanti mot innehållsfel eller promptinjektion.
3. Ett begäransspecifikt JSON-schema kräver samtliga signalnycklar och begränsar källvalen till den aktuella katalogen. `strict:true` skickas uttryckligen till Responses API. Backend gör fortsatt samma fullständiga innehållsstruktur-, referens- och resultatvalidering som tidigare. Inga signaler filtreras bort, inget ogiltigt resultat omvandlas till tom framgång.

## Exakta nod- och kopplingsändringar

**Två befintliga Code-noder ändras:**

- `Build discovery prompt`: en tidig gren för `operation:plan` skapar serverbindning, två meddelanderoller och API-schema. Den befintliga kodvägen som bygger svarstolkningens `promptText` lämnas kvar.
- `Validate model response`: endast planeringsgrenen läser bindningen från `Build discovery prompt` i samma körning, kontrollerar aktuell begäran/körnings-ID och kompletterar modellresultatet med backendens identitet före befintlig komposition. Svarstolkningens resultatgren lämnas kvar.

**Två noder läggs till:**

- `Discovery planning?`, IF v2.2: dirigerar den bundna planeringen till den nya transporten, annars till befintlig `Discovery model`.
- `Discovery plan model`, HTTP Request v4.2: ett POST-anrop till `https://api.openai.com/v1/responses`, med uttryckligt strikt schema och samma befintliga OpenAI-credentialreferens. Nyckeln läses eller kopieras inte till paketet. Ingen automatisk retry eller fallback.

Kedja: `Build discovery prompt → Discovery planning? → Discovery plan model (plan) / Discovery model (interpret) → Luna output - Discovery model → Validate model response → Respond discovery`.

`Discovery model`, dess parametrar/credentialreferens, den gemensamma Luna-vakten, indata-valideringen, svarsnoden och workflowinställningarna ändras inte. Det blir fortfarande **ett modellanrop per giltig begäran**, aldrig båda grenarna. Tailor och andra workflow ingår inte.

Varför separat transport: den granskade [officiella n8n-mappningen](https://raw.githubusercontent.com/n8n-io/n8n/master/packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/v2/actions/text/helpers/responses.ts) bygger JSON-schemaformat med typ, namn och schema, utan `strict`. Den installerade källversionen har inte lästs; paketet förlitar sig därför inte på den inställningens vidarebefordran. Samma källa visar att UI-värdet `summary:none` utelämnas i API-begäran. Direktanropet skickar följaktligen endast `reasoning:{effort:"low"}`.

Modell: `gpt-6-luna`; reasoning `low`; service tier `default`; högst 3 000 outputtoken; `store:false`; timeout 90 sekunder. Ingen temperaturparameter, Sol-fallback, verifierare, V3-aktivering eller extra modellkörning.

## Exakta interna och publika exempel

Fullständiga syntetiska exempel inklusive hela schemat finns i `examples.json`. Detta är modellens nya råformat för exempelbegärans tre signaler:

```json
{
  "assessments": {
    "signal_topPriorities_0": {"kind":"question","question":"What did you personally do in example 0?"},
    "signal_topPriorities_1": {"kind":"question","question":"What did you personally do in example 1?"},
    "signal_mustHave_0": {"kind":"question","question":"What did you personally do in example 2?"}
  }
}
```

Exempelfrågorna är avsiktligt strukturella testdubblar, inte godkänd produktformulering. Modellen ska inte längre återge `requestId`, `contextRevision` eller `modelFormat`. Sådana extra fält avvisas; de ignoreras inte tyst. Backend återställer den befintliga interna inline-profilens identitet och anropar exakt samma godkända kompositionskod. Publik begäran och svar är fortsatt version `1.0` med samma fält, frågor, signalreferenser och felkoder.

Alternativen `cv_supported` med giltiga `evidenceIds`/förklaring och `not_actionable` med befintlig anledning/förklaring behålls. Finns inga originalkällor utelämnas stödgrenen ur schemat, i stället för en ogiltig tom enum. Alla signaler krävs även vid noll frågor. En tom signalkatalog förblir tillåten. Käll-ID-enum delas genom `$defs`/`$ref`, så 20 signaler × 100 källor inte upprepar hela källistan.

## Kontrollresultat och vad de betyder

`local-checks.json` innehåller namngivna resultat. Kontrollerna kör **den exakta genererade Code-koden** från nodpaketet i VM och går genom den förberedda grafen med syntetisk transport. Delad fabrik injiceras i både lokal körning och n8n-kod; ingen förenklad alternativ kompositionsimplementation används.

- Godkända planer behåller varje signal exakt en gång, kompletta bedömningar och samma publika komposition. 27 olika fullständiga frågetilldelningar kontrolleras separat inne i en testkontroll.
- Saknade/okända signaler, modellstyrda ägare, extra identitetsfält, felaktiga källval, upprepade källor, tomma/för långa frågor och otillåtna skäl stoppas. Aktuell begäran, CV-text, annonssignal och körnings-ID kontrolleras mot serverbindningen.
- Noll frågor accepteras bara efter komplett giltig bedömning. Exakta originalcitat inklusive blanksteg kopieras av befintlig backendkod. Detta visar spårbarhet, inte semantiskt stöd.
- Timeout, HTTP-fel, avbruten output, refusal, tokentrunkering och ogiltig JSON stoppas av den **oförändrade** gemensamma vakten. De ger inte tom framgång eller ett nytt försök. Vaktens befintliga hårda n8n-felväg omarbetas inte i detta paket.
- Sparade syntetiska tolkningsbegäranden ger identiskt promptinnehåll, modellnodskonfiguration och publikt resultat före/efter. Endast planering väljer den nya transporten. Originalunderlag ändras inte.
- Kandidatbygget avvisar annan basversion eller ändrad basprojektion. Syntetisk credentialreferens ärvs utan att ändra ursprungsnoden. Historiska pilotmanifest kontrolleras mot tidigare låsta SHA-256 och lämnas orörda.

API-schemat använder [OpenAI:s dokumenterade subset](https://developers.openai.com/api/docs/guides/structured-outputs): objekt med obligatoriska fält och `additionalProperties:false`, nästlad `anyOf`, referenser, enum, strängmönster och arraygränser. Backend behåller dessutom längdgränser och kontroll av upprepade källor; dessa fel blir inte konstruktionsmässigt omöjliga av det nya schemat.

## Kvarvarande begränsningar

Detta är **minskad teknisk skörhet**, inte belägg för korrekt innehåll eller stabilt frågeantal. För en accepterad plan kan modellen inte längre orsaka fel genom kopierad request-identitet eller frågeägarreferenser. Kanoniska ID:n, signalindex och originalcitat skapas av backend. Tekniskt ogiltiga bedömningar kan fortfarande stoppas. Schemafel, transportfel, refusals och budgetavbrott kan fortfarande inträffa.

Modellen bedömer fortfarande CV-stöd, betydelse, negationer, egen roll, frågornas relevans och vilka krav som inte handlar om erfarenhet. Ett strukturellt giltigt men sakligt felaktigt nollresultat kan fortfarande passera. Exakt likadan frågetext grupperas som tidigare: variation i ordval/skiljetecken/blanksteg kan skapa flera frågor; en identisk generisk fråga kan felaktigt gruppera olika krav. Paketet löser inte semantiska dubbletter eller variation i antal frågor.

Lokal VM-verifiering ersätter inte körning i installerad n8n. Inga nya modellresultat eller formatföljsamhetsfrekvenser har mätts. HTTP-nodens credentialkoppling och denna strikta begärans acceptans av aktuell API-/kontokonfiguration är förberedda utifrån dokumenterade gränssnitt men inte livekörda. Basen använder `openAiApi`; ett eventuellt anpassat credential-base-URL har inte lästs. Förslaget använder officiella OpenAI-endpointen. Befintlig vakt kontrollerar inputtoken i efterhand; paketet inför ingen ny kostnads-/kvotfunktion.

## Ett samlat driftsgodkännande

Paketets `package-lock.json` låser källfiler, verifierad bas, exakta nodsträngar, kopplingsändringar, syntetiska exempel och kontrollresultat. `node-changes.json` innehåller fullständig före/efter-kod och de två nya nodernas alla parametrar. `candidate.safe.json` saknar riktiga credentialreferenser och är ett granskningsunderlag, inte en fil att importera direkt i drift.

Ett framtida godkännande avser endast detta workflow och dessa två ändrade/två nya noder. Vid leverans måste aktiv bas återläsas och matcha, krypterad rollbackkopia säkras/verifieras, befintlig credentialreferens ärvas i minnet, kandidat sparas utan automatisk aktivering och jämföras, den exakta versionen aktiveras och återläsas. Ingen extern modellkörning eller bredare förändring ingår automatiskt. Nuvarande status är fortsatt **lokalt, inväntar ett driftsgodkännande**.
