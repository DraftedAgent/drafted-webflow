# Erfarenhetsfrågor före CV-anpassning

DEV-025, 2026-10-19: Ägaren har ändrat riktningen för användartest i hela editorn. Tydliga konkreta svar tas emot direkt och kön går vidare; ingen individuell faktabekräftelse. Följdfråga endast vid saknat viktigt underlag, högst en per ämne. Tidigare svar kan rättas och original/revisioner behålls. Svaren är användarlämnade källor, inte bekräftelser av AI-fakta eller CV-ändringar. JSON-kontraktets strikta referens-/citatkontroller är kvar. Den lokala helhetsförhandsversionen och leveransgaten beskrivs i EXPERIENCE-EDITOR-USER-TEST.md. Äldre individuella bekräftelsekrav i detta dokument är supersederade av detta ägarbeslut. CV-förslag/Apply, profil/RAG och driftsättning är fortsatt separata.

Datum: 2026-10-14. DEV-011, uppdaterat DEV-013. Underlag: ägarens önskemål om befintliga annonssignaler, enkelt samtalsspråk, en räknad frågeomgång och förberedelse för en framtida professionell profil/RAG.

Status: dokumenterat produktflöde inför implementation, inte driftsatt funktion eller nytt API-kontrakt. Ägaren har godkänt dokumentationsarbetet och riktningen. Exakta transportfält, lagring och koppling till Apply/versionering är ännu inte beslutade. Inga befintliga schema-/webhookkontrakt ändras av detta dokument.

## Etapp 1 och kontraktsförslag (DEV-014, inväntar ägarbeslut)

DEV-015 supersederar etappens kontraktsväntan: ägaren godkände exakt discovery 1.0-profil och separat inaktiv endpoint-koppling. [experience-discovery-v1](../contracts/experience-discovery-v1.md) är normativ enbart för denna operation; chat/Tailor/CV-profiler och övriga CDQ-val ändras inte. Delad validering, rådgivande backendhandler, HTTP-klient och UI-fel/retry-koppling implementerade lokalt. Ny n8n-definition zeIzzxPwD2Y91OyD är inaktiv, snapshot/återläsning verifierad. Ingen produktion/AI-exekvering, ingen CV-mutation, permanent profil eller RAG. Isolerade tester verifierar syntetisk HTTP-lifecycle och n8n-Code-gater, inte verklig modellkvalitet.

Uppdatering under DEV-014: ägaren godkände uttryckligen den rådgivande discovery-riktningen i denna uppgift och att CV-kopplingen hålls separat. Exakt endpoint, slutligt transport-schema och normativ profil är fortfarande ett granskningsbart förslag; inga befintliga externa kontrakt ändrade. Den oberoende lokala etappen nedan är nu implementerad i `webflow/src/experience-discovery.js` och `experience-discovery-ui.js`, med syntetisk körbar preview i `webflow/preview/experience-discovery.html`. Inte kopplad till den publicerade editorn eller n8n. Bestående profil/RAG och CV-förslag/Apply är inte implementerade. Riktningens godkännande är ingen produktionsauktorisering eller formell DD.

Lokalt test: `node --test tests/experience-discovery.test.cjs` (12 modelltester). Browser: `node tests/experience-discovery.browser.cjs`, med Playwright tillgängligt i Node och installerad Chromium; valfri `PLAYWRIGHT_CHANNEL=msedge` använder befintlig Edge. Preview kan öppnas direkt som lokal HTML eller via en localhost-server från reporoten. Inga externa requests krävs. Sju mockade prioriteringar visar köns beteende; detta är inte en implementation av semantisk CV-/annonsjämförelse. Långa svar bevaras ordagrant, sammanfattningskandidater kan delas upp med individuella bekräftelser genom lokal adapter. Återkommande vaga ja blir inte erfarenhetsfakta. Bekräftade fakta överlever nytt CV/annons i sessionsmodellen men används aldrig automatiskt i den nya omgången. AI-taggar/retrieval är framtida steg, inte genererade fakta.

Aktuell GET-inspektion 2026-10-14: jobcontext `ytcb-PU8k9igpv5B7BmX7`, sparad/aktiv version f308bdb8-5ec5-4db6-a105-faf4c134bec2; Tailor `H8oAioy58R1v3PvRe3YUa`, f399ee97-764b-44e0-bc42-5c7517499890; chat `QQGNXYv4hej0HBwc`, 05267b96-2433-4c2e-965b-31b61358855a. Alla aktiva och versionerna matchar. Detta är statisk inspektion, ingen körning. Tailor Build Tailor förbjuder nya uppgifter/bullets och Guard kräver stöd i samma befintliga block, begränsar text till 1800 tecken. Chat skickar högst sex historikmeddelanden till modellen, kortar blockutdrag till 700 tecken och skickar inte jobContext eller separat erfarenhetsunderlag. Jobcontext använder en engelsk extraktionsprofil och fyller ibland nyckelord; sådana ord får inte ensamma bli erfarenhetsfrågor. Ingen av dessa vägar bär redan det planerade underlaget.

Oberoende lokal etapp: en privat versionsbar modell enbart i minnet under den öppna sessionen, separata identiteter för omgång/fråga/källsvar/erfarenhet, fulla källsvar och revisionshistorik. Ingen localStorage, kontodatabas, embedding eller retrieval. Modellen/UI arbetar mot uttryckligen mockad jämförelse, inte en påstått korrekt frontend-bedömning av erfarenhet. Inget ändrar blocks, chatthistorik, befintlig Tailor-knapp eller publicerade assets. Ett separat lokalt preview-gränssnitt visar faktiskt frågeantal, följdfråga under samma nummer, rättelse, bekräftelse, nej/vet inte/överhoppat och avslut. Lokal textgräns 50 000 UTF-16-kodenheter per svar visas före inmatning; övergräns behåller texten och ber om uppdelning, aldrig tyst kapning. Samtalsspråk väljs uttryckligen i preview och ändrar ingen CV-språkrouting. Modellen är intern implementationsförberedelse, inte godkänt externt JSON-schema.

Föreslagen kontraktsriktning att godkänna före livekoppling:

1. En explicit versionsmärkt rådgivande discovery-operation inom chat-familjen (exakt endpoint separat beslut), med operationer planera frågor och tolka svar. Request för plan innehåller requestId, contextRevision, cvVersionId, fulla read-only blocks, befintligt jobContext 1.0, explicit conversationLanguage samt endast uttryckligen erbjudet återanvänt confirmedEvidence. Response är ett eget strikt discovery-profile 1.0, aldrig CV-envelope: ok, requestId, contextRevision, operation och resultat; fel endast ok:false plus identitet/operation och strukturerat contractError. Kopplas fail-closed och stale-check till CDQ-02. Nuvarande chat/CV-kontrakt lämnas orörda tills profilen godkänts.
2. Planresultat grupperar viktiga prioriteringar/mustHave till stabila topicKey, signalRefs (fält/index), kort question och oklarhetsbedömning. Tydligt CV-stöd måste hänvisa till blockId och exakt textcitat; keywords ensamma är otillräckliga. Backend gör semantisk jämförelse; klienten validerar referenser, fryser kön och räknar ämnen. Negativt stöd betyder oklart CV-underlag, aldrig avsaknad av förmåga.
3. Tolka-svar request skickar full sourceAnswer med separat answerId/revision, currentQuestionId och samma kontextidentitet. Resultat ger föreslagna deluppgifter med exakta sourceQuotes/sourceAnswerId och eventuella coveredQuestionIds. Klienten kräver individuell användarbekräftelse; ingen modelltext blir ett faktum på egen hand. Tekniska gränser/fel bevarar källan. Tidigare revisioner och beroende förslag blir inaktuella vid rättelse; senare profil-samtycke/retention/åtkomst beslutas separat.
4. Ny föreslå-CV-operation eller uttryckligt Tailor-v2 måste bära confirmedEvidence separat (aldrig gömt i targetRole, annons eller blocks). Varje textförslag hänvisar till redan befintligt blockId och evidens-ID/revision; nytt material får inte maskeras som enbart omformulering. Dagens Guard/modellregler måste ändras samordnat först efter godkännande. Resultatet är en fristående kandidat med baseCvVersionId och evidensrevision; explicit användargodkännande av CV-ändring och versionsägarskap måste först beslutas enligt CDQ-01. Fram till dess finns ingen CV-apply-koppling.

Rekommendation: godkänn först den avgränsade rådgivande discovery-profilen och sessionsmodellen; besluta senare konkret CV-användning tillsammans med CDQ-01/02/03. Detta är ett förslag, inte införd normativ ändring eller godkännande av workflow-modifikation. Possible design decision detected. Ingen DD-post skapas utan separat ägargodkännande.

## Vad som finns idag

Frontend analyserar annonsfältet automatiskt när texten är minst 200 tecken, efter cirka 800 ms utan ny inmatning. `runJobContextExtract()` skickar endast `jobAdText`, inte CV, till job-context-flödet. Resultatet sparas i `window.__DRAFTED_JOBCONTEXT__`. För kort text tömmer kontexten; äldre svar ignoreras när annonsen ändrats.

`jobContext` innehåller roll, senioritet, arbetsområden, viktade `topPriorities`, `mustHave`, `successMetrics`, `keywords` och ton. Detta är signaler från annonsen, inte uppgifter om personens förmåga. Prioriteringar och krav är främsta frågeunderlaget; nyckelord hjälper tolkningen men räcker inte ensamma för att kräva ett svar.

`runTailor()` skickar fullständiga kanoniska `blocks[]` och `jobContext` när användaren klickar på Tailor. Därefter används svaret i editorn. Det finns ännu ingen dokumenterad automatisk frågeomgång eller bestående erfarenhetsprofil.

`sendChat()` skickar CV-block, meddelande, historik och bland annat `targetRole`, men inte strukturerat `jobContext` eller ett särskilt underlag med bekräftade svar. Det räcker därför inte att enbart ändra chattens ton för att genomföra detta flöde. Exakta aktuella n8n-modellinstruktioner har inte granskats på nytt i DEV-011; tidigare workflow-kartläggning är historisk statisk evidens.

Källor: [jobcontext-kontrakt](../contracts/jobcontext-contract.md), [Tailor-kontrakt](../docs/backend/flows/flow-tailor.md), [rådgivande chatt](../docs/backend/flows/flow-editor-chat.md), frontendfunktionerna ovan i [drafted-editor.js](../webflow/src/drafted-editor.js), [systemkarta](SYSTEM-MAP.md).

## Föreslaget användarflöde

1. CV och aktuell annonskontext finns. Analysera vilka viktiga annonssignaler som har tydligt stöd i CV:t och vilka där underlaget är oklart. Frånvaro av en formulering är aldrig bevis för att personen saknar erfarenheten.
2. Räkna först relevanta, unika ämnen där CV-underlaget är oklart. Erbjud sedan frågeomgången: ”Jag hittade 7 saker som är viktiga för rollen men inte syns tydligt i ditt CV. Vi kan gå igenom dem en i taget.” Antalet är det faktiska urvalet, inte alltid sju. Låt användaren välja ”Börja frågorna” eller ”Anpassa med det som finns”. Undvik ”Du saknar 7 kunskaper” och interna uttryck som ”7 signaler”. Det är information i CV:t som är oklar, inte bevisad avsaknad av förmåga.
3. Visa en kort fråga åt gången med ”Fråga 1 av 7” och synlig räknare 1/7, sedan 2/7 till 7/7. Förklara kort relevansen när det behövs. Fråga inte om något som redan framgår eller redan besvarats. Den tidigare gränsen på tre ämnen ersätts av en avgränsad, räknad kö av relevanta ämnen; fyll inte kön för att nå ett visst antal. Om inget viktigt är oklart, erbjud direkt anpassning utan 0/0-frågor.
4. Frågan ska normalt vara en eller två korta meningar; svaret får vara långt och innehålla flera exempel. Visa ett flerradigt skrivfält och hjälpen ”Svara kort eller berätta mer – båda funkar.” Användaren kan svara fritt, säga nej, säga ”jag vet inte”, hoppa över eller avsluta frågeomgången. Vid ett vagt ja, fråga högst en gång efter ett konkret exempel. Fråga vad personen själv gjorde; gör inte teamets resultat till personens egen prestation. Siffror och mätbara resultat är välkomna men aldrig obligatoriska. Be inte användaren korta ett informativt svar bara för att frågan är kort.
5. Återge det nya underlaget kort: ”Du prioriterade backloggen och höll ihop planeringen med utvecklarna. Har jag förstått dig rätt?” Användaren får rätta eller bekräfta. Ett överhoppat svar, AI:s förslag och användarens tystnad räknas inte som bekräftade fakta.
6. Föreslå hur bekräftat underlag kan uttryckas i just detta CV. Visa vad som skulle ändras och låt användaren godkänna innan det blir kanoniskt CV-innehåll. Ett chattmeddelande eller faktabekräftelse är inte i sig godkännande att ändra CV:t. Detaljerad Apply/versioneringskoppling följer CDQ-01, som fortfarande är olöst.
7. Användaren kan anpassa med befintligt CV om alla frågor hoppas över. Förklara neutralt vad vi kan använda; ge ingen negativ kompetensbedömning och lägg inte till påståenden för att täcka varje krav.

## Frågekö och framsteg

Bygg och gruppera kön före öppningsmeddelandet. Prioritera rollens viktiga krav och vikta ihop överlappande signaler: roadmap/backlog/prioritering kan vara ett ämne, inte tre likalydande frågor. Totalsiffran beskriver frågor/ämnen, inte kompetensbrister eller ett matchningsbetyg.

Räknaren visar den aktuella huvudfrågan. Följdfråga och faktabekräftelse ligger kvar under samma nummer. Ett inskickat långt svar ska först kunna bekräftas eller rättas innan nästa huvudfråga visas. Vid ”hoppa över” går räknaren vidare, men ämnet markeras som överhoppat, aldrig bekräftat. Om ett svar även täcker senare ämnen, markera dessa som täckta när uppgifterna bekräftats och behåll den ursprungliga köordningen/totalsiffran; visa exempelvis ”Det här besvarade också fråga 4, så vi går vidare till 5/7.” Frågor utan svar ska inte framställas som checkade kompetenser.

Ändra inte 1/7 till 2/12 i bakgrunden. Eventuella ytterligare ämnen erbjuds efter omgången som en separat valfri omgång med nytt antal. Byte av annons startar en tydligt ny kö; redan bekräftade erfarenheter kan återanvändas som underlag men inte behandlas som automatiskt relevanta eller godkända för ett nytt CV. Ett nytt CV gör tidigare jämförelse inaktuell. Användaren kan när som helst fortsätta med befintligt och hittills bekräftat underlag.

Efter sista ämnet, visa en enkel sammanfattning, exempelvis ”Vi gick igenom 7 frågor. Du berättade mer om 4 områden och hoppade över 3.” Skilj en genomgången omgång från ”allt är bekräftat”. Erbjud nästa steg att granska hur underlaget kan användas i CV:t. Progress, svar och rättelser bevaras inom sessionen vid tillfälliga fel. Återgång till en tidigare fråga behåller dess identitet och gör berörda senare förslag inaktuella när uppgifter rättas.

## Samtalsstil

Vänligt, rakt och vardagligt språk med korrekt stavning. Korta meningar, en huvudfråga åt gången. Samtalet ska hjälpa personen minnas, inte kännas som en intervju eller ett kompetenstest. Undvik fackspråk när ett vanligt ord fungerar, långa listor, överdriven pepp och återkommande standardfraser. Inga interna termer som jobContext, signalschema, latent kapacitet eller RAG i användartexten.

Säg ”Jag ser inte det tydligt i ditt CV” i stället för ”Du saknar erfarenhet”. Bekräfta vad användaren berättar utan att förstärka det: ”Tack, då vet jag lite mer om vad du gjorde” i stället för ”Fantastiskt, då är du expert på produktstrategi”. Ge utrymme för erfarenheter från projekt, föreningar eller andra sammanhang, men ange rätt sammanhang i förslaget.

Exempel på svenska:

- Introduktion: ”Jag hittade 7 saker som är viktiga för rollen men inte syns tydligt i ditt CV. Vi kan gå igenom dem en i taget.”
- Fråga 1/7: ”Har du varit med och bestämt vad ett produktteam ska bygga härnäst?”
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

Första etappen implementerar ingen bestående profil, RAG eller konto-/databasbygge, men underlaget utformas redan nu för senare återanvändning. Tillfälligt bekräftat underlag ska vara separat från den begränsade chattloggen: dagens `history.slice(-12)` kan inte vara enda faktakällan. Lagringsplats, livslängd och transport fastställs före implementation; dokumentet lovar inte att lagring redan finns. Framtida profil kräver separat beslut om samtycke, rättelse, radering och åtkomst.

## Förberedelse för professionell profil och RAG

Possible design decision detected. Ägaren har uttryckligen begärt RAG-förberedelse, inte implementation av permanent lagring. Följande krav beskriver hur nuvarande underlag ska kunna återanvändas utan att låsa ett databasval. Ingen formaliserad DD-post eller nytt externt schema skapas här.

- Ge fråga, källsvar och erfarenhetsuppgift separata stabila identiteter i den framtida modellen. Erfarenhetens identitet är inte ett CV-block-ID och får inte försvinna när en CV-representation byts eller raderas. Ett svar kan belägga flera uppgifter; flera svar kan belägga samma erfarenhet.
- Håll användarens fulla originalberättelse separat från AI:s föreslagna sammanfattning och användarbekräftade uppgifter. Bevara ursprung/sammanhang, egen roll, aktivitet, eventuellt resultat och tid endast där användaren faktiskt angett dem. Lägg inte till saknade fält genom gissningar. Erfarenhet kan komma från arbete, utbildning, egna projekt eller andra sammanhang.
- Koppla bekräftelse, källreferens och revision till varje uppgift. AI-härledda kompetenstaggar är sökförslag, inte användarbekräftade fakta. CV-extraktion är en separat källtyp; användaren behöver kunna rätta extraktionen. Ett AI-anpassat CV är en härledd representation, inte en ny oberoende faktakälla.
- Gör långa svar användbara genom uppdelning i sammanhängande erfarenheter och separata bekräftelser vid behov. Originalet ska kunna återfinnas från varje del. Korta modellsammanfattningar, chatthistorikgränser och framtida embedding-chunks får inte tyst ersätta eller kapa källan. Tekniska längdgränser måste kommuniceras innan text tas emot; behåll text och erbjud uppdelning om gränsen nås. Inget löfte om obegränsad text.
- Bekräftade erfarenheter ska kunna användas mot flera annonser utan att vara bundna till en enda annons. Frågekö/annonskoppling visar varför en uppgift kom fram, men bestämmer inte vad personen kan eller vilka CV:n som får finnas. Spara aldrig annonskrav som personliga fakta.
- Planera retrieval från ett versionshanterat, användaravgränsat faktaunderlag. Sökresultat behöver källa och bekräftelsestatus; en vektorträff är relevans, inte bevis. Föreslå relevant erfarenhet för vald representation och behåll explicit användargodkännande av CV-ändringar. Hela profilen ska inte automatiskt fylla varje CV.
- Rättelser ska ersätta tidigare uppgift i aktiv retrieval och göra beroende förslag/indexposter inaktuella. Liknande importer ska kunna dedupliceras med bibehållen källspårning, utan att olika erfarenheter slås ihop godtyckligt. Borttagning ska senare omfatta källuppgifter, aktiva index/embeddings och härledda cachekopior enligt beslutad retention; ett gammalt index får inte återintroducera borttagna uppgifter.
- Permanent profil kräver tydlig användarkoppling, åtkomstgräns och användarkontroll för vad som sparas, rättas, återanvänds och raderas. Att svara i chatten godkänner varken permanent profillagring eller en CV-ändring. Bestäm detta före bestående lagring; det är inte redan implementerat.

Första implementationen behöver därför en separat, versionsbar erfarenhetsmodell med källspårning även om den bara finns i sessionen. Val av databas, embeddings, chunkning, retrievalmodell och permanent retention skjuts upp tills profilsteget. Kontobyte via GitHub flyttar denna design och kod, inte användares personliga profiler eller deras dataåtkomst.

Misslyckad analys/bekräftelse/anpassning ska lämna CV:t oförändrat. Visa begripligt fel och möjlighet att försöka igen eller fortsätta med befintligt underlag. CV-/annonstext är underlag, inte instruktioner som får kringgå dessa regler.

## Vad som behövs före implementation

- Läs relevanta aktuella n8n-definitioner och modellinstruktioner med GET; kartlägg hur Tailor använder annonssignaler och vilken faktaöverföring som faktiskt stöds. Inga produktionskörningar behövs för kartläggningen.
- Förbered ett konkret, versionshanterat förslag för hur frågeunderlag/bekräftade svar passerar mellan frontend, rådgivande chat och Tailor. Det nuvarande Tailor-kontraktet förbjuder nya toppnivåfält. Lägg inte till sådana eller göm svar i `targetRole`/CV-text; kontraktsändring måste vara uttryckligen godkänd.
- Frontend ansvarar för fråga/svar, hoppa över, rättelse, begriplig presentation och explicit godkännande. Backend ansvarar för validering, evidensgrundad jämförelse och förslag som inte hittar på fakta. Inga automatiska kanoniska mutationer eller nya block-ID:n från modellen.
- Specificera kö/progress och en separat källspårbar erfarenhetsmodell innan implementation; skilj frågenummer från erfarenhets-/CV-identitet. Förbered långa svar, korrigeringar och senare retrieval utan att göra RAG eller permanent profil till ett krav för första steget.
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
9. Sju relevanta unika ämnen ger introduktion med sju och 1/7 till 7/7. Antalet bygger på faktiska ämnen; noll ger ingen frågeomgång. Följdfrågor ändrar inte numret; hoppade/täckta frågor hanteras begripligt; totalen växer inte tyst. Avslut anger genomgång/bekräftelser korrekt utan kompetensbetyg.
10. Korta frågor accepterar långa svar med flera erfarenheter. Full källtext kan spåras från föreslagna/bekräftade deluppgifter; inget resultat eller egen prestation fabriceras och text kapas inte tyst vid teknik-/historikgräns.
11. Källsvar, AI-sammanfattning, bekräftad erfarenhet, härledd kompetenstagg och vald CV-representation kan särskiljas. Erfarenhetsidentitet överlever kontextbyte; rättelser invaliderar gamla förslag; annonskrav blir inte personfakta. Framtida retrieval använder aktuella användaravgränsade källor; permanent sparande/radering är separat profilacceptans, inte ett redan genomfört test.

Scenarierna är dokumenterade testkrav, inte körda tester. Ingen formaliserad DD-post skapas utan ägarens separata godkännande.
