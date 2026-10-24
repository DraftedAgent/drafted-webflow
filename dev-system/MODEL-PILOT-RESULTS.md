# DEV-106 — Genomförd modellpilot, 2026-10-24

**72 av 72 godkända anrop genomfördes. Kandidaten rekommenderas inte för aktivering.** Inga automatiska omkörningar, produktionswebhooks, workflowändringar eller publiceringar gjordes. Endast det i förväg godkända syntetiska materialet användes. Inga CV:n applicerades eller ändrades i en produkt.

## Genomförande och budget

- Godkänt runId: `3c3b6ffa-d233-41a7-8393-e0b7f0e5adcb`.
- Manifest: `690751f8f15367d7483fc4ed3963a375f5ea8d69105c22e9035c7281ef6b3288`.
- Faktiskt modellnamn: `gpt-4.1-mini-2025-04-14`; standardtier i samtliga svar. Temperatur 0,2, store=false, max_output_tokens=4000 enligt godkännandet.
- 88 310 indatatokens, 7 511 utdatatokens, inga rapporterade cachade indatatokens.
- Kostnad beräknad från tokenförbrukning och godkända standardpriser: **0,0473416 USD** av högst **1 USD**. Ingen faktura eller kontodebitering har lästs.
- Summerad anropstid 95,102 sekunder. Median 1,092 sekunder, p95 4,197 sekunder; intervall 0,577–6,311 sekunder. Detta är anropstid inklusive lokal hantering, inte ett produktionsmått.
- Alla 72 providersvar var completed. Körjournalen är stängd med 72 förbrukade platser och 0 USD kvar i ej avräknad reservation. Samma godkännande kan inte starta igen.

Ägaren godkände den konkreta piloten efter DEV-105 och konfigurerade den separata utvärderingsnyckeln före start. Det faktiska godkännandet ligger utanför Git. [Ursprungligt godkännandeunderlag](MODEL-PILOT-APPROVAL.md) och dess utkast behålls som frysta historiska underlag; de utgör inget nytt körningstillstånd.

## Rå följsamhet och slutligt utfall

Varje profil omfattade 36 anrop. Nedanstående avser rå modelloutput före eventuell backendåterhämtning:

- **Planering:** båda profiler 12/12 giltigt format och 12/12 giltiga referenser. Kandidaten missade ändå det förväntade nollresultatet för tillgänglighet i båda upprepningarna.
- **Svarstolkning:** basen 12/12 giltigt format men 8/12 giltiga källkopplingar; fyra resultat avvisades när modellen citerade CV:t i stället för aktuellt svar. Kandidaten 12/12 tekniskt giltiga resultat, men vaga och oklara svar gav påhittade tolkningar i stället för följdfrågor.
- **Tailor:** basen 12/12 tekniskt giltiga resultat. Kandidaten 10/12; båda avvisningarna gällde att ett fryst blocks verkliga ID användes som targetKey. Båda profilerna kringgick dessutom kontextbehov genom Summary/Skills trots tekniskt giltiga referenser.

Totalt hade basen 36/36 giltigt format och 32/36 giltiga referenser; kandidaten 34/36 för båda. Backend avvisade 4 respektive 2 resultat. **Ingen backendåterhämtning inträffade** och ingen avvisning räknades som framgång eller giltigt nollresultat.

De grova förhandskontrollerna av utfall/antal passerade 25/36 gånger för basen och24/36 för kandidaten. Dessa siffror är **inte** innehållskvalitet: flera semantiska fel passerar både schema, originalkoppling och sådana grova kontroller. Backendens bindning till hela originalsvaret styrker spårbarhet, inte att modellens formulering följer av svaret.

## Innehållsfynd

Samtliga72 råresultat har lästs separat mot de syntetiska originalen. [Agentgranskningen](evaluations/model-pilot-2026-10-24/agent-review.json) skiljer blockerande fynd, tekniska avvisningar och observationer. Detta är Codex granskning, inte ägarens leveransgodkännande.

1. **Vaga svar blir erfarenhetspåståenden.** Kandidaten gjorde i båda upprepningarna om `Yes, a little.` till konton om både leveransplanering och workshoparbete och angav båda frågereferenserna som täckta. Osäkerhet om vad frågan betyder blev påhittade uppgifter om osäker egen erfarenhet. Inget av detta är styrkt av originalsvaren. Dessa tolkningar är rådgivande, men det gör inte felaktigt innehåll eller täckning godtagbart.
2. **Roller och negationer ändras.** Kandidaten omtolkade samordning av interna releasetester till planeringserfarenhet och skärpte `not delivery ownership` till att inte ha deltagit i planering. I ett Tailor-resultat vardera för bas och kandidat blev `helped facilitate` till `facilitated`.
3. **Saknat sammanhang kringgås.** I samtliga fyra körningar av `tailor-context` valdes Skills/Summary utan context_unclear. I samtliga fyra körningar av `tailor-new-entry` flyttades Another Company-erfarenheten dit utan new_block_required. Inga nya block skapades, men den avsedda kontextfrågan uteblev och vissa förslag lade också till planeringsbidrag.
4. **Felaktig signalbedömning.** Kandidaten ställde erfarenhetsfrågor om närvaro på kontoret. I det långa planfallet klassade kandidaten kundutbildning som cv_supported utan positivt stöd; ena förklaringen sade till och med att erfarenheten inte var styrkt. Basen släppte i stället samma konkreta erfarenhetskrav som not_actionable med hänvisning till saknat CV-stöd. Båda strider mot avsedd skillnad mellan osäkerhet och positivt stöd.
5. **Frysta block ger fler problem än det syntetiska lyckofallet visade.** Kandidaten återgav `project-1` från granskningsmetadata i stället för en tillåten targetKey och avvisades korrekt i båda upprepningarna. Basen bad ena gången om sammanhang trots att projektet var namngivet och lade andra gången projektanknutet deltagande i Skills. Det frysta projektblocket lämnades orört, men det räcker inte som godkänt helhetsutfall. Att modellen får se verkliga block-ID:n kan ha bidragit till kandidatfelet; piloten isolerar inte den orsaken.

I sektionsfallet användes bara s2; s1 med Python och ytterligare projektstöd fick varken tillägg eller angiven orsak i någon av de fyra körningarna. Orsaken är okänd. Detta bokförs som en observation, inte som bevis för att alla utelämnanden är fel: relevans och överlapp kan påverka urval. Piloten demonstrerade däremot inte den avsedda fler-sektionsplaceringen för just den källan.

## Det som fungerade

Överlappande leveranskrav grupperades i alla fyra körningar. Fullständigt styrkta planfall gav giltiga nollresultat i alla fyra körningar. Kandidaten bevarade den uttryckliga rättelsen om kollegans planeringsansvar och eget testbidrag i båda upprepningarna.

Det nya **borttagningsfallet lyckades i samtliga fyra körningar**: tomma positiva modellförslag gav ändå ett granskningsförslag där alla tre tidigare tillägg drogs tillbaka i erfarenhet, färdigheter och projekt. Inga nej/skip-svar blev nya erfarenhetspåståenden.

Alla 72 sparade råsvar har dessutom spelats om lokalt genom exakt samma frysta kontrakts-/kompositionskod. Utfall och innehåll matchade körningen och inget ingångs-CV muterades. Både den frysta kompositionen och de faktiska förberedda Code-noderna repeterades. Nodernas sex HTTP422-avvisningar och66 publika ok:true-resultat matchade; endast nya, körningsgenererade tilläggs-ID:n normaliserades vid jämförelsen. Original-ID:n, revisioner och texter jämfördes exakt. Omspelet gjorde **0 modellanrop**. [Kompositionens protokoll](evaluations/model-pilot-2026-10-24/replay.json) · [De faktiska Code-nodernas protokoll](evaluations/model-pilot-2026-10-24/prepared-node-replay.json).

## Bedömning inför nästa steg

**Ingen aktivering rekommenderas.** Färre tekniska avvisningar i svarstolkningen är inte ett tillräckligt resultat när osäkerhet blir påhittat innehåll och kontextkraven kan kringgås.

Prioritera ett lokalt, konkret ändringsunderlag för säkra följdfrågor vid vaga/oklara svar, bevarad roll/negation, validerbara placeringsbeslut och ett modellreferensutrymme där frysta block inte exponeras som valbara verkliga ID:n. Ändra inte den avslutade pilotens kod, material eller mätregler i efterhand. Nya kontrakt och en ny modellutvärdering behöver ett nytt redovisat underlag och godkännande; samma runId får inte återanvändas.

Detta är 18 syntetiska fall med två upprepningar och en faktisk modellversion. Hela kontraktspaket jämfördes, inte en enskild ändring. Resultatet visar konkreta missar och några fungerande skydd, men fastställer varken en ensam felorsak eller produktionsstabilitet.

[Fullständig rå- och slutresultatrapport](evaluations/model-pilot-2026-10-24/report.json) · [Verifierat körningskvitto och sammanställning](evaluations/model-pilot-2026-10-24/receipt.json).
