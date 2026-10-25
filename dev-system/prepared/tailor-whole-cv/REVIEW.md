> Uppdaterad lokal implementationsstatus och konkret driftpaket: [IMPLEMENTED.md](IMPLEMENTED.md). Den ursprungliga presentationen nedan behålls som historik.

# Tailor med frågesvar: konstaterad begränsning och minsta kontraktsrättning

2026-10-25. Investigation/local review-display fix only. **Backendrättningen nedan är ett förslag, inte införd.** Inga nya modellanrop eller externa ändringar.

## Faktisk drift och senaste sparade körning

Management-GET verifierar Tailor `H8oAioy58R1v3PvRe3YUa`, sparad/aktiv version `c7503539-0e08-4a49-958b-6467aea8d911`. Senaste sparade körning är **249**, start2026-10-25T17:53:00.791Z (19:53 svensk tid). Det är den senaste tillgängliga körningen; utan ett request-ID från användaren går den inte att säkert binda till en viss visning i editorn.

Körning249 gick genom svarskopplade grenen och Luna, inte legacy TailorModel. Råformatet hade exakt additions/contextQuestions, med **två tillägg och en kontextfråga**. Kompositorn returnerade ok:true, två sourceUsage-kvitton och **en faktiskt ändrad CV-sektion, Summary**. Inga tidigare appliceringar behövde rensas; sourceReview var tom. Fem originalsvar fanns i begäran, tre med recorded-status. Inga persontexter eller råa modellmeddelanden har sparats i detta underlag.

Slutsats för249: inte noll faktiska ändringar, inte bortfiltrerade fristående omskrivningar. Alla två modellföreslagna svarstillägg nådde responsen. **Fristående CV-ändringar kunde inte föreslås över huvud taget.**

## Konstaterade orsaker

1. Den aktiva interna profilen tailor-source-references-1 tillåter exakt additions och contextQuestions. Prompten säger uttryckligen att befintlig text inte får skrivas om. Kompositorn börjar med nuvarande block och kan bara rensa verifierat återkallade svarstillägg och lägga till spårbara svarstexter. Därmed saknas den vanliga CV/annons-anpassningen i denna gren.
2. Klientens validateCandidate rekonstruerar hela resultatet från enbart sourceUsage/contextQuestions. Ett faktiskt omskrivet CV utan motsvarande svarstillägg avvisas som INVALID_SOURCE_CANDIDATE. Enbart en promptändring kan därför inte rätta detta.
3. Granskningskortets huvudlista skapades i svarsläget enbart från sourceUsage och återkallade tillägg. Den kunde därför missa fristående ändringar om ett utökat kontrakt senare tillät dem. Denna **visningsbegränsning är rättad lokalt**: listan utgår nu från faktisk textdiff för samtliga block. Svarskvitton förklarar ursprung under View details, men bestämmer inte vilka ändringar som får synas. Full före/efter-text, originalkällor, Dismiss och Apply-gränsen behålls.

## Minsta sammanhängande backend-/klientändring att godkänna

Utöka den befintliga svarskopplade Tailor-operationen med **cvEdits**, åtskilt från additions. Samma Luna-anrop får föreslå både vanlig CV/annons-anpassning och svarstillägg. Ingen extra modell/verifierare och ingen tyst övergång till ett annat flöde. Hela sourceContext följer fortfarande begäran, även när inget svar kan användas.

För att inte förstöra rättelser och tidigare källspårning skapar backend CV-mål av de **redigerbara textsegmenten mellan spårade svarstillägg**. Alla relevanta befintliga sektioner kan ingå; inget Summary-undantag. Först körs befintlig prepare för källrevisioner/återkallelser. Frysta granskningsblock får inga redigerbara mål. Bevarade svarstillägg lämnas som spårade segment, inte som ny ursprunglig CV-evidens. Vid omskrivning av omgivande CV-text räknar backend om tilläggens positioner/checkpointText utan att ändra deras ID:n, originalkällor eller revisioner.

Modellens CV-faktastöd får väljas enbart ur backendens katalog över befintlig CV-text, med redan svarshärledda segment undantagna. Nya uppgifter ur svar måste fortsatt gå via additions med originalsvarets källidentitet/revision. CV-referenser visar spårbarhet; de bevisar inte semantiskt stöd för en omskrivning. Modellen måste fortfarande bevara roll, negationer, placering och begränsningar, och användaren granskar före Apply. Inga nya block, metadata eller erfarenhetsuppgifter tillåts i cvEdits.

### Exakt nytt internt modellformat, exempel

```json
{
  "cvEdits": [
    {
      "targetKey": "cv1_run",
      "text": "Product specialist with experience interviewing users and sharing findings with digital teams.",
      "cvEvidenceKeys": ["cv_source_1_run", "cv_source_2_run"]
    }
  ],
  "additions": [],
  "contextQuestions": []
}
```

De syntetiska originalkällorna är Profile: “Product specialist working with digital teams.” och Experience: “Interviewed five users and shared their feedback.” Ändringen förtydligar befintliga uppgifter utan ett nytt erfarenhetspåstående. targetKey och cvEvidenceKeys väljs ur aktuell, körningsbunden backendkatalog; modellen skapar inte block-ID:n, revisioner, offsets eller originalcitat.

### Publikt kontraktsbehov

Nuvarande exakta sourcesSchemaVersion1.0 kan inte ta emot ytterligare kvittotyper. Föreslagen ny förhandlad version är **1.1**. Requestens struktur är i övrigt densamma; sourceContext behålls. Response får en separat cvEdits-lista. Befintliga sourceUsage/sourceApplications/sourceReview/contextQuestions behålls. Exakt exempel på den nya response-delen:

```json
{
  "sourcesSchemaVersion": "1.1",
  "cvEdits": [
    {
      "blockId": "summary-1",
      "start": 0,
      "end": 46,
      "originalText": "Product specialist working with digital teams.",
      "proposedText": "Product specialist with experience interviewing users and sharing findings with digital teams.",
      "cvEvidence": [
        {"blockId":"summary-1","quote":"Product specialist working with digital teams."},
        {"blockId":"experience-1","quote":"Interviewed five users and shared their feedback."}
      ]
    }
  ],
  "sourceUsage": []
}
```

Detta är ett **utsnitt ur** befintlig full respons, inte en komplett responsekropp. Backend kopierar originalText/kvittocitat och beräknar start/end från preparerade CV-block efter befintlig källrättelse, före nya CV-edits. Klienten rekonstruerar i samma ordning, kontrollerar segment, CV-källreferenser, orörda metadata och spårade tillägg, och validerar sedan svarskvittona. Offsets får inte lämnas åt modellen. Äldre1.0-anrop måste fortsatt hanteras uttryckligen som1.0; ingen tyst omtolkning till1.1 eller nedgradering/fallback. Den nya editorn begär1.1 för det utökade flödet.

## Konkret nod- och filskopegate

- Tailor `Validate + Normalize`: acceptera den nya förhandlade profilen, bygg körningsbundna CV-/svarskataloger, instruera modellen om både cvEdits och additions.
- Tailor `Compose source suggestion`: validera båda ändringstyperna, komponera i rätt ordning och bygg separata kvitton med omräknade källintervall. Okända/överlappande/frysta mål eller felaktig form avvisas; saknade svar fylls inte i.
- `Tailor sources model` behåller Luna och nuvarande modellinställningar; den använder de uppdaterade meddelandena. Ingen ny modellgren eller extra verifierare införs.
- Delad klient-/backendprofil `webflow/src/tailor-sources.js`: request-/response1.1, komposition, validering och Ledger för flera Apply-omgångar måste uppdateras tillsammans. Source-client och editor behöver begära den nya versionen och granska alla faktiska diffar. Ingen ändring av kanoniska blockschemat eller nya CV-block behövs.
- Generiska ändringslistan är redan lokalt rättad; ordinarie kontextfrågor, oanvända svar och originalsvar förblir åtkomliga. “Your CV will change when you apply.” och Apply changes/Dismiss behålls.

## Nollresultat och avgränsad verifiering

Om inga svar kan användas kan cvEdits ändå innehålla en stödd CV/annons-anpassning, medan sourceUsage är tom och originalsvaren finns kvar. Om inga meningsfulla förbättringar finns returneras tomma listor och oförändrade block. Klassificeringen bygger på **faktisk slutlig blockdiff**, inklusive borttagningar/rättelser, inte antalet svarskvitton. Inga kosmetiska ändringar ska skapas för att fylla en kvot.

För den lokala visningsrättningen kontrolleras CV/annons-ändring utan svarskvitto, blandad ändring i samma block, ren borttagning och verkligt oförändrat resultat samt befintlig granskning/Apply-livscykel. Backend1.1 är **inte implementerad eller driftsatt** i detta steg: det exakta interna och publika kontraktsbehovet redovisas här före införandet, enligt projektets kontraktsgate.
