# INVALID_SIGNAL_QUESTION: avgränsad diagnos

Den exakta avvisande regeln i användarens misslyckade körning är **inte återfunnen**. Aktiv sparad/publicerad version är fortfarande `063ed025-c1ee-4778-90cb-91b83e6f9be5`. Prompt- och valideringskod har återlästs via management-GET och matchar föregående aktiva version. Körningslistan är tom; befintliga inställningar sparar varken lyckade eller misslyckade körningar. Inställningarna har inte ändrats. Den publika felresponsen innehåller inte rå modelloutput. Ingen ny begäran, sidladdning eller modellkörning har initierats.

## Vilka regler kan ge just den rapporterade kombinationen?

Inline-validerarens `fail` ersätter sina egna specifika fel med `INVALID_SIGNAL_QUESTION` och använder alltid `$.assessments`. Följande olika regler blir därmed identiska utåt:

- `INVALID_INLINE_PLAN`: råresultatet måste vara ett objekt med exakt `modelFormat`, `requestId`, `contextRevision`, `assessments`.
- `INCOMPLETE_INLINE_ASSESSMENTS`: bedömningarna måste vara ett objekt med exakt alla katalogens signalnycklar, utan saknade eller okända nycklar.
- `INVALID_INLINE_ASSESSMENT`: en bedömning måste vara ett objekt och ha en tillåten `kind`.
- `LEGACY_QUESTION_REFERENCE`: `same_question` och fältet `questionSignalId` är förbjudna i modellresultatet.
- `INVALID_INLINE_QUESTION`: frågebedömningen måste ha exakt `kind` och `question`; frågan måste vara en icke-tom sträng om högst 500 tecken.

Fel i metadataidentitet har en separat befintlig stale-klass. Djupare källvalidering har egna befintliga detaljer. Inget av detta identifierar vilken av ovanstående regler just denna körning bröt mot.

## Modellinstruktion jämfört med validering

Båda aktiva Code-noder använder samma interna profil `discovery-inline-questions-1`. Instruktionen kräver de tre metadatafälten och en bedömning per signal, beskriver de tre bedömningstyperna och förbjuder gamla ägarreferenser. Ingen bevisad motsägelse mellan profilerna har hittats.

Instruktionen är däremot ofullständigt preciserad: den skriver inte ut hela rotobjektet, exakta tillåtna fält per bedömning, längdgränser eller de två tillåtna `not_actionable.reason`-värdena. Denna brist är konstaterad men **inte bevisad som orsak till det aktuella stoppet**. Ingen gissad promptändring har därför införts. Exakta accepterade former redovisas i `proposal.json`.

## Minsta förberedda diagnostik

Endast `Validate model response` ändras. Dess inline-fel behåller specifik regel och säker sökväg i befintliga `X-Drafted-Validation-Reason` och `X-Drafted-Validation-Path`. De fyra separata frågevillkoren får varsin diagnostikkod: fel fält, fel strängtyp, tom sträng och för lång sträng. Godkännandereglerna förblir samma.

Diagnostiken använder bara en fast lista med regelkoder samt sökvägar med backendgenererade signalfält/index. Okända modellnycklar, råa felmeddelanden, CV-text, annons, svar, frågetext och modelloutput tas aldrig med. Befintlig offentlig `INVALID_MODEL_OUTPUT`-respons, status422, modellinstruktion, nodgraf, Luna-inställningar och svarstolkning behålls. Ingen utökad körningslagring föreslås.

`proposal.json` innehåller exakt nod-ID, före-/efterhash och komplett förberedd Code-text. Källpatch: `migration/discovery-inline-diagnostics/patch.cjs`.

## Tre skilda statusar

- **Lokala tester:** fem riktade tester passerar; nio syntetiska avvisningsexempel får specifik diagnostik med oförändrad publik avvisning. Giltiga frågor, komplett nollresultat, källfel och sparade syntetiska tolkningsbegäranden behåller sitt beteende. Ingen generell testkampanj körd.
- **Driftsättning:** inte gjord. Den driftsatta Luna-migrationen och backendägda frågerättningen ligger kvar. Det pausade större granskningspaketets låsta filer är oförändrade.
- **Vanliga frågeflödet:** inte verifierat fungerande. Felorsaken är ännu okänd och ingen innehållsrättning påstås.

Nästa säkra steg, om godkänt, är att driftsätta endast denna diagnostiknod med verifierad rollback och återläsning. Vid nästa ordinarie användning kan regeln identifieras utan att samla textunderlaget. Därefter kan en rättning knytas till den faktiskt avvisande regeln. Repositoryts `AGENTS.md` kräver separat explicit godkännande av produktionspåverkande leverans; den nya begäran tolkas här som felsökning/lokal förberedelse, inte återupptaget införande av det pausade paketet.


## Senare driftsgodkännande och leverans

2026-10-25 godkände ägaren endast diagnostiknoden. Den är nu driftsatt och återläst som sparad/aktiv version 8c5750c8-370b-4829-941a-b64ce90ddf03. Fyra krypterade snapshots verifierades. Endast Validate model response ändrades; modell, instruktioner, strikt validering och övriga funktioner är oförändrade. Inga modellanrop gjordes. Grundorsaken och det vanliga frågeflödets funktion är fortfarande inte fastställda. Kvitto: ../../deliveries/discovery-diagnostics-2026-10-25/receipt.json.
