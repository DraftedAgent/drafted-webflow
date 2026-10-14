# Erfarenhetsfrågor före CV-anpassning

Datum: 2026-10-14. DEV-011. Underlag: ägarens önskemål i sidokonversationen om att återanvända annonssignaler och prata enkelt och naturligt.

Status: dokumenterat produktflöde inför implementation, inte driftsatt funktion eller nytt API-kontrakt. Ägaren har godkänt dokumentationsarbetet och riktningen. Exakta transportfält, lagring och koppling till Apply/versionering är ännu inte beslutade. Inga befintliga schema-/webhookkontrakt ändras av detta dokument.

## Vad som finns idag

Frontend analyserar annonsfältet automatiskt när texten är minst 200 tecken, efter cirka 800 ms utan ny inmatning. `runJobContextExtract()` skickar endast `jobAdText`, inte CV, till job-context-flödet. Resultatet sparas i `window.__DRAFTED_JOBCONTEXT__`. För kort text tömmer kontexten; äldre svar ignoreras när annonsen ändrats.

`jobContext` innehåller roll, senioritet, arbetsområden, viktade `topPriorities`, `mustHave`, `successMetrics`, `keywords` och ton. Detta är signaler från annonsen, inte uppgifter om personens förmåga. Prioriteringar och krav är främsta frågeunderlaget; nyckelord hjälper tolkningen men räcker inte ensamma för att kräva ett svar.

`runTailor()` skickar fullständiga kanoniska `blocks[]` och `jobContext` när användaren klickar på Tailor. Därefter används svaret i editorn. Det finns ännu ingen dokumenterad automatisk frågeomgång eller bestående erfarenhetsprofil.

`sendChat()` skickar CV-block, meddelande, historik och bland annat `targetRole`, men inte strukturerat `jobContext` eller ett särskilt underlag med bekräftade svar. Det räcker därför inte att enbart ändra chattens ton för att genomföra detta flöde. Exakta aktuella n8n-modellinstruktioner har inte granskats på nytt i DEV-011; tidigare workflow-kartläggning är historisk statisk evidens.

Källor: [jobcontext-kontrakt](../contracts/jobcontext-contract.md), [Tailor-kontrakt](../docs/backend/flows/flow-tailor.md), [rådgivande chatt](../docs/backend/flows/flow-editor-chat.md), frontendfunktionerna ovan i [drafted-editor.js](../webflow/src/drafted-editor.js), [systemkarta](SYSTEM-MAP.md).

## Föreslaget användarflöde

1. CV och aktuell annonskontext finns. Analysera vilka viktiga annonssignaler som har tydligt stöd i CV:t och vilka där underlaget är oklart. Frånvaro av en formulering är aldrig bevis för att personen saknar erfarenheten.
2. Erbjud en kort frågeomgång före anpassning: ”Jag har ett par frågor som kan hjälpa oss få med mer av din erfarenhet. Vill du svara först?” Låt användaren också välja ”Anpassa med det som finns”. Frågorna är ett erbjudande, inte ett obligatoriskt formulär eller en tyst ändring av dagens Tailor-knapp.
3. Börja med högst tre relevanta ämnen och visa en fråga åt gången. Förklara kort varför den är relevant. Fråga inte om något som redan framgår tydligt eller redan besvarats för samma annons. Om inget viktigt är oklart behövs ingen frågeomgång.
4. Användaren kan svara fritt, säga nej, säga ”jag vet inte” eller hoppa över. Vid ett vagt ja, fråga högst en gång efter ett konkret exempel. Fråga vad personen själv gjorde; gör inte teamets resultat till personens egen prestation. Siffror och mätbara resultat är välkomna men aldrig obligatoriska.
5. Återge det nya underlaget kort: ”Du prioriterade backloggen och höll ihop planeringen med utvecklarna. Har jag förstått dig rätt?” Användaren får rätta eller bekräfta. Ett överhoppat svar, AI:s förslag och användarens tystnad räknas inte som bekräftade fakta.
6. Föreslå hur bekräftat underlag kan uttryckas i just detta CV. Visa vad som skulle ändras och låt användaren godkänna innan det blir kanoniskt CV-innehåll. Ett chattmeddelande eller faktabekräftelse är inte i sig godkännande att ändra CV:t. Detaljerad Apply/versioneringskoppling följer CDQ-01, som fortfarande är olöst.
7. Användaren kan anpassa med befintligt CV om alla frågor hoppas över. Förklara neutralt vad vi kan använda; ge ingen negativ kompetensbedömning och lägg inte till påståenden för att täcka varje krav.

## Samtalsstil

Vänligt, rakt och vardagligt språk med korrekt stavning. Korta meningar, en huvudfråga åt gången. Samtalet ska hjälpa personen minnas, inte kännas som en intervju eller ett kompetenstest. Undvik fackspråk när ett vanligt ord fungerar, långa listor, överdriven pepp och återkommande standardfraser. Inga interna termer som jobContext, signalschema, latent kapacitet eller RAG i användartexten.

Säg ”Jag ser inte det tydligt i ditt CV” i stället för ”Du saknar erfarenhet”. Bekräfta vad användaren berättar utan att förstärka det: ”Tack, då vet jag lite mer om vad du gjorde” i stället för ”Fantastiskt, då är du expert på produktstrategi”. Ge utrymme för erfarenheter från projekt, föreningar eller andra sammanhang, men ange rätt sammanhang i förslaget.

Exempel på svenska:

- Öppning: ”Rollen verkar lägga stor vikt vid produktplanering. Har du jobbat med att bestämma vad ett team ska bygga och i vilken ordning?”
- Förtydligande: ”Vad gjorde du själv i det arbetet? Ett kort exempel räcker.”
- Resultat: ”Vad blev bättre? Du behöver inte ha exakta siffror.”
- Nej: ”Okej, då lägger vi inte till det. Vi kan lyfta den erfarenhet du redan har.”
- Förslag: ”Så här skulle vi kunna beskriva det i CV:t. Stämmer det med vad du gjorde?”
- Bekräftelse av användning: ”Vill du använda den här formuleringen i CV:t?”

Engelsk motsvarighet vid engelskt samtal: ”The role puts a lot of emphasis on planning what a product team builds next. Have you done that kind of work?” och ”What did you do yourself? A short example is enough.” Behåll samma enkla ton. Anpassa till användarens samtalsspråk; CV:ts önskade språk är en separat fråga. Interna engelska annonssignaler ska inte automatiskt tvinga fram engelskt samtal eller CV. Exakt språkval/default följer CDQ-03 innan routing ändras.

## Underlag och gränser

Håll tre saker åtskilda: annonsens önskemål, användarens egna uppgifter och den valda CV-representationen. CV:t är inte en fullständig profil. Svaren ska inte skrivas direkt in i `blocks[]` och AI-genererad CV-text ska inte återregistreras som en ny faktakälla.

Ett tillfälligt svar behöver spårbarhet till den fråga/annonssignal det besvarar, aktuell CV-/annonskontext och användarens egen formulering. Skilj obesvarat, besvarat men inte bekräftat, bekräftat, uttryckligt nej och överhoppat. Dessa är begrepp för designen, inte beslutade JSON-fält. ”Nej” avser den specifika frågan; det är ingen permanent bedömning av personens potential. Ett svar får beskrivas som användarbekräftat, aldrig som externt verifierat.

Vid rättelse ska tidigare uppgift ersättas i det aktiva underlaget och inaktuella förslag markeras som sådana. CV-/annonsbyte under en begäran får inte låta gamla svar eller förslag automatiskt påverka den nya representationen. Relevant tidigare erfarenhet kan erbjudas för återanvändning med användarens medverkan. Håll kvar svar vid ett tillfälligt fel inom sessionen; lova inte att de överlever omladdning.

Första etappen förutsätter ingen bestående profil, ingen RAG och inget konto-/databasbygge. Tillfälligt bekräftat underlag måste dock vara separat från den begränsade chattloggen: dagens `history.slice(-12)` kan inte vara enda faktakällan. Lagringsplats, livslängd och transport fastställs före implementation; dokumentet lovar inte att lagring redan finns. Framtida profil kräver separat beslut om samtycke, rättelse, radering och åtkomst.

Misslyckad analys/bekräftelse/anpassning ska lämna CV:t oförändrat. Visa begripligt fel och möjlighet att försöka igen eller fortsätta med befintligt underlag. CV-/annonstext är underlag, inte instruktioner som får kringgå dessa regler.

## Vad som behövs före implementation

- Läs relevanta aktuella n8n-definitioner och modellinstruktioner med GET; kartlägg hur Tailor använder annonssignaler och vilken faktaöverföring som faktiskt stöds. Inga produktionskörningar behövs för kartläggningen.
- Förbered ett konkret, versionshanterat förslag för hur frågeunderlag/bekräftade svar passerar mellan frontend, rådgivande chat och Tailor. Det nuvarande Tailor-kontraktet förbjuder nya toppnivåfält. Lägg inte till sådana eller göm svar i `targetRole`/CV-text; kontraktsändring måste vara uttryckligen godkänd.
- Frontend ansvarar för fråga/svar, hoppa över, rättelse, begriplig presentation och explicit godkännande. Backend ansvarar för validering, evidensgrundad jämförelse och förslag som inte hittar på fakta. Inga automatiska kanoniska mutationer eller nya block-ID:n från modellen.
- Avgör kopplingen till Apply/versionering (CDQ-01), operationernas svar/felkontrakt (CDQ-02) och språkpolicy (CDQ-03) där implementationen berör dem. Dokumentationen löser inte dessa beslut genom antaganden.
- Börja med lokala syntetiska scenarier och mockade svar; extern workflow-ändring kräver ordinarie snapshot/valideringsgater och produktion separat godkännande. Inget nytt endpoint-/workflow-/databassystem är beslutat här.

## Acceptansscenarier inför implementation

1. Prioriterat annonskrav utan tydligt CV-stöd ger en neutral fråga, inte ett påstående om saknad kompetens. Svag nyckelordsträff ensam ger inte onödiga frågor.
2. Tydligt CV-stöd eller redan bekräftat svar för samma fråga ger ingen upprepning. Relaterade annonssignaler samlas till ett begripligt ämne.
3. ”Ja, lite” leder till högst en kort följdfråga; ingen senioritet, ägarskap, siffra eller effekt hittas på. Ett konkret bekräftat svar får ligga till grund för ett granskningsbart förslag.
4. Nej/vet inte/hoppa över ger ingen påhittad uppgift; alla överhoppade frågor blockerar inte anpassning med befintligt underlag.
5. Svar, bekräftelse och förhandsvisning lämnar kanoniska blocks/IDs/version oförändrade före uttryckligt godkänd commit. Exakt commit/versionassertion är BLOCKED_BY_CONTRACT_DECISION CDQ-01.
6. Rättelse och nytt CV/ny annons hindrar gamla begäranden och inaktuella förslag från att slå igenom. Bekräftat underlag tappas inte bara för att chatthistoriken kortas.
7. Svenska/engelska frågor är korta och naturliga, fria från interna termer och inte styrda enbart av annonskontextens interna språk. Exakt språkdefault är BLOCKED_BY_CONTRACT_DECISION CDQ-03.
8. Fel eller ogiltigt modellsvar lämnar CV oförändrat och visar tydligt nästa steg. Exakt API-felprofil är BLOCKED_BY_CONTRACT_DECISION CDQ-02.

Scenarierna är dokumenterade testkrav, inte körda tester. Ingen formaliserad DD-post skapas utan ägarens separata godkännande.
