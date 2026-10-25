# Discovery med Luna: avgränsat paket för ett samlat driftsbeslut

2026-10-25. **Lokalt förberett; ingen driftsättning eller modellkörning.** Återgång till GPT-4.1-mini är återkallad och har inte genomförts. Read-only management-GET verifierar fortfarande sparad/aktiv `8c5750c8-370b-4829-941a-b64ce90ddf03`, exakt nod-/graf-/inställningsprojektion från diagnostikleveransen och `gpt-6-luna`. Exekveringslistan är fortsatt tom. Den misslyckade outputens exakta nycklar är inte återfunna.

## A. Minsta diagnostik i den nuvarande kedjan

Ändra bara `Validate model response` och `Respond discovery`. Ingen modell, prompt, nodgraf, retry, godkännanderegel eller publik JSON-kropp ändras. Befintlig felkod och status422 behålls. Inget resultat fylls i eller filtreras till tom framgång.

Vid `INCOMPLETE_INLINE_ASSESSMENTS` får det befintliga diagnostikobjektet ett begränsat `assessmentShape`. Ny responseheader **`X-Drafted-Assessment-Shape`** gör samma uppgift tillgänglig i den befintliga Network-posten utan att rå modelloutput eller körningsdata sparas. Ingen ny frontend behövs; headern kan läsas i Network även om den inte exponeras för sidans JavaScript genom CORS. Befintliga reason/path-headers behålls.

Exakt syntetiskt exempel:

```json
{
  "containerType": "object",
  "expectedKeys": ["signal_topPriorities_0", "signal_mustHave_0"],
  "actualKeyCount": 2,
  "missingKeys": ["signal_mustHave_0"],
  "unexpectedSignalKeys": ["signal_mustHave_9"],
  "redactedUnexpectedKeyCount": 0,
  "omittedUnexpectedSignalKeyCount": 0
}
```

Om behållaren i stället är en array visas `containerType:"array"`, samma förväntade ID:n och `null` för actualKeyCount/missingKeys/unexpectedSignalKeys. En felaktig behållare tolkas alltså inte som ett objekt där alla bedömningar saknas. Null, sträng, nummer och boolean skiljs också åt.

Förväntade ID:n kommer enbart från backendens validerade katalog (högst20 signaler). Oväntade nycklar visas endast om de matchar den snäva tekniska grammatiken `^(?:signal_)?(?:topPriorities|mustHave)_\d{1,6}$`. Högst20 visas; fler räknas separat. Alla andra nyckelsträngar räknas endast i redactedUnexpectedKeyCount. Därmed kan en modell som råkat använda en CV-mening som nyckel inte få meningen loggad. Inga bedömningsvärden, frågor, CV-, annons- eller svarstexter ingår. Headerexemplen är under3kB vid testad överfyllnad. När uppgiften inte är tillämplig är headern `null`.

En precisering av tidigare beskrivning: om **hela** rotfältet assessments utelämnas avvisas det redan av `INVALID_INLINE_PLAN`. Det specifika `INCOMPLETE_INLINE_ASSESSMENTS` nås när rotfältet finns men är av fel typ eller har fel nyckeluppsättning. Felaktig struktur inne i en enskild bedömning har fortsatt andra detaljkoder. Ingen valideringsordning ändras här.

## B. Förebygger det redan förberedda discovery-plan-bound just detta fel?

**Ja för en fullständig output som faktiskt följer det skickade strikta schemat.** Paketets verkliga schemabyggare har följande egenskaper, med ID:n från samma begäran som backend senare validerar:

```json
{
  "type": "object",
  "properties": {
    "assessments": {
      "type": "object",
      "properties": {
        "signal_topPriorities_0": {"$ref":"#/$defs/assessment"},
        "signal_mustHave_0": {"$ref":"#/$defs/assessment"}
      },
      "required": ["signal_topPriorities_0", "signal_mustHave_0"],
      "additionalProperties": false
    }
  },
  "required": ["assessments"],
  "additionalProperties": false
}
```

Detta är ett förklarande utsnitt; den fullständiga `$defs` med de tre befintliga bedömningstyperna finns i originalpaketet och de genererade nodsträngarna. Typkravet utesluter null/array/sträng. required utesluter saknade nycklar. additionalProperties:false utesluter tillkomna nycklar. Både schema och komposition använder samma validerade begäran; körningsbindningen avvisar inaktuellt underlag.

Paketet skickar `text.format.type:"json_schema"` och **`strict:true` uttryckligen** i det planeringsspecifika Responses API-anropet. Det nöjer sig inte med instruktionstext eller native-nodens json_object-inställning. Den gamla `Discovery model` lämnas intakt för svarstolkning. Ett modellanrop per begäran, fortsatt Luna/low/default, högst3000 outputtoken, store:false, ingen fallback eller verifierare.

Detta är ingen garanti att hela kedjan fungerar i drift: API:t kan avvisa schema/behörighet, transporten kan fallera, output kan kapas eller vägras. Sådana fall ska fortsatt stoppas som fel. Schemat bevisar inte heller relevanta frågor, sakligt CV-stöd, korrekt gruppering eller stabilt antal frågor. Aktuell n8n/API-körning med denna strikta begäran är **inte** gjord. Den förlorade körningens exakta behållare/nycklar kan inte fastställas retroaktivt.

## Återanvändning och exakta noder

Originalpaketets låsta13 filer och dess kontrakts-/schemafabrik är oförändrade. Ny `current-adapter.cjs` återanvänder `discovery-plan-bound/n8n-patch.cjs` och samma `contract.cjs`, men binder leveranskandidaten till dagens diagnostikversion i stället för den äldre basen063ed025. Ingen parallell planeringskomposition eller ny modellprofil har byggts.

Den lilla `signal-shape.cjs`-funktionen injiceras identiskt i den nuvarande valideraren och den återanvända bound-valideraren. Den samlar bara diagnostik när samma befintliga avvisning inträffar.

Om B införs inklusive A omfattar totalen:

- Ändrade befintliga noder: `Build discovery prompt`, `Validate model response`, `Respond discovery` (endast den nya headern i den sistnämnda).
- Nya noder från det tidigare paketet: `Discovery planning?` och `Discovery plan model`.
- Oförändrade: ursprunglig `Discovery model`, `Luna output - Discovery model`, requestvalidering, inställningar, svarstolkning, andra workflow, Tailor, CV/Apply och frontend.

Den redan införda detaljdiagnostiken behålls. Backendägda frågor och fullständiga signalbedömningar behålls. Att ogiltig modelloutput injiceras syntetiskt även i B ger fortfarande422 och diagnostik; strikt schema används aldrig som skäl att hoppa över backendvalidering.

## Riktad lokal kontroll

Sex tester i `tests/discovery-assessment-shape.test.cjs` passerar. De kör de genererade Code-strängarna i den befintliga VM-grafharnessen. Kontrollerna avser just behållartyper, saknade/extra/utbytta ID:n inklusive lika antal, integritet för fria nycklar/värden och begränsad överfyllnad, originalschemats faktiska required/properties/type/additionalProperties, bibehållen strikt avvisning samt giltig plan/nollplan och oförändrad svarstolkning. Inga nya provideranrop, inga nya modellbedömningar och ingen bred testkampanj har gjorts. Schemaassertionerna är strukturella kontroller, inte ett låtsat bevis på API-acceptans.

`diagnostic-only.safe.json`, `schema-and-diagnostic.safe.json` och `node-changes.json` innehåller exakta kandidater/diffar, med credentialtyper men inga riktiga credentialreferenser eller värden. De är granskningsunderlag, inte filer att importera direkt. Vid en godkänd leverans ärvs befintlig credentialreferens i minnet efter ny bas-/driftkontroll och verifierad rollbackkopia.

## Föreslaget samlat beslut

Godkänn i så fall ett **avgränsat tvåstegspaket**:

1. A införs först; användarens nästa ordinarie försök ger behållartyp och nyckeldifferens om felet återkommer. Inga extra modellkörningar initieras av agenten.
2. Efter att denna felbild redovisats används B, det redan förberedda paketet, om den bekräftar typ-/nyckelavvikelse i modellens plan för samma validerade begäran. Om underlaget pekar på något annat stoppas införandet för nytt beslut. Det blir ingen ny gissad formatering, utfyllnad eller ny generell omdesign.

Ingen av dessa leveranser är utförd eller godkänd i detta steg. Målet är fungerande Discovery med Luna; lokala tester och schemastruktur ska inte beskrivas som att målet redan är uppnått.
