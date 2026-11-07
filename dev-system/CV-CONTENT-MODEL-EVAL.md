# Avgränsad modellutvärdering — väntar på externa anropsgodkännanden

## Granskningsresultat och korrigering

Före denna granskning var `/preview-api/cv-selection` hårdkopplad till den syntetiska providern. `createHandler({model})` och urvalsinstruktionerna fanns, men ingen nätverksadapter. Föregående lokala funktionsverifiering bevisade därför inte riktig AI-bedömning av relevans, komprimering eller utelämning.

Nu finns `backend/openai-cv-provider.cjs`, kopplad till samma validerade urvalshandler och lokala serverroute via explicit `DRAFTED_SELECTION_PROVIDER=openai`. Den använder OpenAI Responses API, modell `gpt-6-luna`, JSON-utdata, `store:false`, 4000 max_output_tokens, 90 sekunders timeout, högst sex anrop och inga automatiska återförsök. Fel, avbrutna svar och refusals blir fel, aldrig en simulerad framgång. Nyckeln stannar server-side i OPENAI_API_KEY. Verkligt läge kräver separat explicit anropsgodkännande; standard är fortsatt simulering. UI visar vilken urvalsprovider som gav svaret.

Officiellt API-underlag läst2026-11-07: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses . JSON-läget garanterar inte vårt applikationsschema; den befintliga lokala schema-/käll-/beslutsvalideringen används efter parsning. Transporten och dess inkoppling i urvalshandlern är testad med mockad fetch, inklusive noll anrop utan godkännande/nyckel, token-/anropsgränser och avvisat ofullständigt svar. Det är inte liveverifierad API-åtkomst eller modellkvalitet.

Direkt OpenAI API-nyckel finns inte konfigurerad i den inspekterade processen. Befintlig n8n-managementnyckel är inte en OpenAI-nyckel; inga hemligheter har exporterats från n8n. Ingen produktionsworkflow har ändrats. För verklig körning krävs säkert konfigurerad server-side OPENAI_API_KEY och godkännandet nedan, inte en nyckel i chatten.

## Exakt föreslagen körningsomfattning

Batch-ID `cv-content-six-calls-v1`: högst **6** externa anrop till `https://api.openai.com/v1/responses`, modell `gpt-6-luna`.

- Tre helt syntetiska CV/annons-par, ett urvalsanrop och ett frågeplaneringsanrop per par.
- Högst 24000 UTF-8-byte serialiserade inputmeddelanden per anrop; förberedda payloadstorlekar totalt47232byte. Ingen bilaga, webbverktyg eller riktig användardata.
- Högst4000 utmatningstoken per anrop, totalt högst24000, inklusive eventuell intern reasoning som räknas mot modellens outputtak. Verklig tokenåtgång sparas från usage. Ingen automatisk retry, reparationskörning eller ytterligare modell som betygsätter svaren. Batchen stannar vid första fel. En avbruten/felaktig förfrågan räknas mot sexgränsen.
- Befintlig fakturering enligt API-projektets modellpris; inget obestyrkt kostnadsbelopp anges. Taket är definierat i anrop och token ovan, inte som verifierat kronorbelopp.
- Alla layout-/PDF-kontroller och kvalitetsgranskning sker lokalt utan ytterligare AI-anrop. Inga produktionsanrop, workflowändringar eller publicering.

`tools/eval/cv-content-eval.cjs` har körts i preflight utan modelltrafik. Efter godkännande: sätt skyddat server-side nyckelvärde och DRAFTED_EXTERNAL_MODEL_APPROVAL till batch-ID, kör skriptet med --run-approved. Utan båda stoppar det före nätverksanrop. Kör inte den interaktiva real-servern parallellt med batchen: godkännandet gäller exakt dessa sex syntetiska anrop, inte valfri användartrafik. Modellens namn byts inte automatiskt om modellen saknas på kontot.

## Fallen och vad som ska bedömas

**Chef + gammal praktik, utgångslayout1sida.** Åtta egna direktrapporterande utvecklare, prioritering och utvecklingssamtal; samordning med produktchef; teamleverans; uttryckligen inget budgetansvar; incidentutfall20→15. Gammal sexveckorspraktik avser lager och adresslistor. Bedöm om praktikens begränsade relevans motiverar kortning/utelämningsförslag även utan sidbrist. Den behöver inte utelämnas för att modellen ska godkännas; motivering och proportioner avgör. Budget-/personalmandat och individ/team får inte blandas ihop. Frågorna ska inte be användaren återge redan angivna teamstorlekar eller kräva budgetansvar.

**Senior med mycket relevant innehåll, utgångslayout3sidor.** Åtta rollblock med72 separata, syntetiska projektbidrag inom arkitektur, API-livscykel, migrering, drift, säkerhet och handledning. Projekt-ID:n och sammanhang skiljer bidragen åt även när strukturen liknar varandra. Bedöm om modellen konsoliderar faktisk upprepning och skriver mer koncist utan att radera unika meriter eller göra samordning till ägarskap. Vid mer än två sidor ska granskningen peka ut vilka unika målrelevanta bidrag som motiverar utrymmet. Annars föreslås specifika komprimeringar, exempelvis återkommande metodbeskrivningar kortas medan skilda leveranser behålls. Ingen automatisk underkänning på sidantal och ingen font-/marginalkrympning.

**Kort junior, utgångslayout1sida.** Ett React-arbete med formulärvalidering, konkreta tester, stöd av senior och uttryckligen inget releasemandat; ett utbildningsprojekt. Bedöm om modellen förbättrar språket utan utfyllnad, erfarenhetsinflation eller påhittade resultat. Frågor ska gälla eventuellt saknad relevant detalj, inte ledarskap, budget eller sådant som redan står i texten. En kort, lättläst sida är ett legitimt utfall.

## Bedömningsprotokoll efter körning

För varje fall sparas råa modellsvar, validerat urval, frågor, usage, bas-/kandidatsidantal och faktisk PDF från samma A4-rendering som exporten. Källblocks-ID:n jämförs och inga modellresultat appliceras i användarens arbetsyta. Kandidaten är endast en utvärderingsartefakt.

Granska faktatrohet mening för mening mot CV/annons: antal, personer/team, negation, mandat, egna/teamresultat och kausalitet. Markera varje förstärkning eller ny merit som fel. Granska professionellt språk och begriplig ordning utan en tvingande resultatmall. Bedöm varje keep/shorten/omit utifrån målroll och unikt bidrag, och om motiveringen verkligen följer underlaget. Bedöm frågornas yrkes-/senioritetsnivå och om de redan är besvarade. Bedöm slutligen faktisk layout, fullständighet och läsbarhet; vid >2sidor krävs en konkret motivering eller komprimeringsrekommendation.

Resultat markeras inte godkänt enbart för att JSON och sidantal är giltiga. Mänsklig semantisk granskning återstår efter körning. Tre fall är en avgränsad produktkontroll, inte statistisk validering av rekryteringsutfall.
