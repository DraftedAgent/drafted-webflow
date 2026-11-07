# CV-innehåll: etapp 1 och beslut inför nästa etapp

## Mandat och lokal leverans

Ägaren godkände riktningen i policy v0.3 och implementation/verifiering av etapp 1 den 2026-11-07. Ingen produktionspublicering eller ändring av godkännande-/exportkontrakt ingår. Nästa etapp nedan är förslag – ej godkänd för implementation.

Research considered: LIT-001 / teknisk kvalitet är inte karriärutfall; LIT-002 / relevans, förklaringar och korrigerbar kontext. Underlag: indexexport 2026-11-07 19:14 CET och ledger enligt källregistrets v0.2. Kontext-/kontrollprinciperna är forskningsinformerade produktval, inte belagd effekt av denna implementation. Ingen direkt evidens i de lästa accepterade posterna för sidmål eller punktbudgetar.

Lokala ändringar:

- Tailor1.5 och dess sektionrevision använder utökade instruktioner för aktiv professionell språkbearbetning, flexibel ansvar/handling/resultat-ordning, bevarade fakta/mandat och inga obligatoriska siffror. Alla unika uppgifter och befintliga block ska bevaras. Befintliga käll-/schema-/beslutsvalideringar är oförändrade.
- Discoverys gemensamma instruktioner, inklusive planeringens assessment-format, återanvänder tillgängliga uppgifter och anpassar frågor till yrkeskontext, faktiskt mandat och senioritet. Tydliga användaruppgifter kräver inte externa bevis. Intervjutolkningen hålls fortsatt i enkelt språk; CV-poleringen hör till Tailor. Frågeplanerarens interna indata innehåller nu även rollmetadata (titel, arbetsgivare, datum) som kontext, separat från citerbar textevidens. Befintlig korrigerbar anställningskoppling återanvänds.
- En kort överblick visar innehåll från de granskade sektionerna, kortare formuleringar och separat antal godkända, obeslutade och avvisade sektioner. Överblicken beräknas från kandidat och beslut, uppdateras vid revision/delbeslut och visar slutresultat när allt är granskat. Den är härledd visning, aldrig nya CV-fakta eller exportinnehåll. Föråldrad överblick döljs när underlaget ändras.

Överblicken använder korta utdrag ur faktisk text och sektionsnamn för att undvika en obunden AI-berättelse om kompetenser eller effekter. Den gör inte anspråk på att analysera global utrymmesfördelning eller bortval som inte finns i etapp 1. Slutöverblicken är tillfällig sessionsvisning; den inför ingen ny beslutshistorik. Pågående granskning återställs med sina beslut och beräknad överblick vid omladdning.

Backendinstruktionerna finns i lokal källkod och genererade/testade n8n-kodvägar. De publicerade arbetsflödena är inte ändrade. Simulerade tester kan verifiera transport, källbindning, promptkoppling och tillstånd, men inte att en verklig modell konsekvent väljer rätt formulering eller frågenivå. Den semantiska kvaliteten behöver en separat, avgränsad modellutvärdering före produktionsleverans; inga externa modellkörningar ingår här.

## Rekommenderade beslut för etapp 2 — förslag

1. **Bevarat underlag:** bevara importerade block och samtliga användarsvarsrevisioner separat från varje ansökningsversion. Spara originalfilen där den redan hanteras; inför inte ett nytt permanent karriär-/RAG-system. Versionsspecifikt bortval ska vara ett explicit urvalsbeslut med stabila käll-ID:n och revisionsreferenser, aldrig destruktiv radering av underlaget. Spara även kandidatens basversion och motivering så att beslutet kan förstås senare. Om lagringen inte kan garantera detta ska utelämning vara avstängd.
2. **Återställning:** erbjud ”Återställ i denna CV-version” för utelämnat innehåll och före/efter för komprimering. Återställning skapar ett nytt granskningsbart förslag från bevarad källa och kräver Accept. Den får inte återställa hela CV:t över senare godkända ändringar. Vid konflikt mellan gammal text och nya fakta visas en avgränsad konflikt; användaren väljer, systemet skriver inte över tyst.
3. **Beroende godkännanden:** självständiga ändringar förblir sektionsvisa. Gruppering, flytt och gemensam ersättning behandlas som en uttryckligt namngiven ändringsgrupp med alla berörda block synliga. Accept gäller hela gruppen atomärt; Decline behåller tidigare godkänt innehåll. När ett användarbeslut ändrar förutsättningarna ska en beroende kandidat markeras inaktuell och räknas om, inte automatiskt accepteras eller tappa fakta. Börja gärna utan gruppering för att minska beroendena.
4. **Faktisk längd:** använd den renderade godkända versionens A4-layout med vald mall, teckensnitt och sidbrytningar som mätning. Visa separat sidantal för kandidat om det skiljer sig. Textlängd och skärmzoom får inte fungera som sidmått. Behåll 1–2 sidor som flexibel svensk riktlinje; hårt tak endast från uttryckligt ansökningskrav. Minska inte läsbarheten automatiskt.
5. **Utrymme och urval:** bedöm relevans för målrollen, källstöd, aktualitet, unikt bidrag och karriärens begriplighet. Ge ingen anställning en fast punktkvot. Pröva först kortare formuleringar och verkliga upprepningar, därefter föreslagen reducering av perifert innehåll och sist utelämning. Visa konkret före/efter, urvalsmotivering och effekt i layouten. Äldre erfarenhet kan vara särskilt relevant; ålder eller kronologi avgör inte ensamt.

**Rekommenderad minsta nästa leverans:** faktisk layoutmätning och förslag till komprimering/utelämning per enskilt block, med bevarad källa och återställning som nytt förslag. Vänta med gruppering och flytt över flera anställningar tills ändringsgrupperna är definierade. Ägaren behöver godkänna lagrings-/återställningsmodellen och godkännandebeteendet ovan innan dessa funktioner implementeras. Längdmätning kan utvecklas oberoende när den uttryckligen beställs.

Detta dokument ändrar inte Research, etablerar ingen formell DD och godkänner ingen publicering.


## Verifiering

Lokala enhets-/integrationstester passerar för policyinstruktioner genom planeringens formatomvandling, rollkontext, källvalidering, blandade beslut, revisioner, språk, sektionstillstånd och exportspärr. Två webbläsarflöden med simulerad backend passerar: Accept/Decline i båda vyerna och omladdning under pågående granskning, samt Edit → reviderat förslag/överblick → Accept. Exportens payloadbyggare är identisk med publicerad baslinje `aca2aaf`; obeslutad preview blockeras och godkända kanoniska block används efter granskning.

Det äldre `cv-pagination.browser.cjs` stoppade före webbläsarstart vid sin bytejämförelse mot `6c8b2f7`, som föregår redan publicerat `SUGGESTED_PREVIEW`-skydd. Det gamla testet ändrades inte. En ny riktad regression verifierar den aktuella publicerade exportbaslinjen och spärrens beteende. Ingen ändring gjordes i exportkoden. Standalone-bygget passerar och rapporterar skyddade root-/referensartefakter oförändrade. Semantisk modellkvalitet är inte verifierad med verkliga modellkörningar.
