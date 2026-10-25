> Historiskt granskningsunderlag. Ägaren har därefter godkänt driftsättning. Aktiv backend och frontendleverans dokumenteras i ../../deliveries/tailor-whole-cv-2026-10-25/receipt.json och release-validation.json; slutlig publiceringsverifiering ligger i frontend.json. Offlinegeneratorn och versionslåsta deploy-adaptern finns kvar i det ursprungliga arbetscheckoutet; kandidatens exakta nodkod är sparad i candidate.safe.json.

# Lokalt implementerat driftpaket — 2026-10-25

Ägaren godkände lokal implementation av sourcesSchemaVersion1.1/cvEdits. Paketet är implementerat och isolerat verifierat, **inte driftsatt eller publicerat**. REVIEW.md beskriver det ursprungliga förslaget; dess dåvarande uppgift om ej implementerad backend är historisk. Fullständiga syntetiska request-, modellinput/-output- och response-exempel finns i examples.synthetic.json.

## Separat rättning av förslagets livscykel

Körning249 gav två tillägg, ett kontextbehov och ett faktiskt ändrat Summary-block. Det var inget nollresultat. Ingen vanlig CV-omskrivning fanns att filtrera bort; den aktiva modellinstruktionen förbjöd sådana ändringar. Klientens granskningslista baserades dessutom enbart på svarskvitton. Nu visas alla faktiska blocktextändringar, inklusive CV/annons-ändringar och borttagningar.

Körningens frågestatusar var recorded, recorded, no, recorded, processing. Tailor kunde starta innan sista svarstolkningen var färdig. Den tidigare kontextstämpeln innehöll rådgivande tolkningar, frågefas och frågeindex; slutförd tolkning eller vanlig navigering kunde få ett giltigt förslag att kasseras som Context changed. Klienten väntar nu på redan pågående svarstolkningar före request/stämpel. Den startar inga nya tolkningar. Därefter jämförs sparad svarstext, identitet, revision och status samt CV/annons. Ofarlig navigering påverkar inte stämpeln; verkliga ändringar stoppar fortfarande ett inaktuellt förslag och erbjuder uttryckligt återförsök.

Den isolerade reproduktionen håller sista tolkningen och visar att ingen Tailor-request skickas förrän den släppts. Därefter hålls Tailor medan användaren navigerar; förslaget blir kvar. En sparad rättelse under pågående Tailor avvisar däremot resultatet och lämnar CV:t orört. Detta är en separat rättning från cvEdits. Historisk webbläsarstämpel/requestkorrelation saknas, så exakt kassering i ägarens gamla vy kan inte bevisas retroaktivt.

## Spårning och rättelser

CV-edits får mål i fria CV-textsegment mellan spårade svarstillägg. Svarshärledd text får aldrig bli ursprunglig CV-evidens. Omskrivning av sådan text går via additions med samma aktuella svarskälla/revision och relevant befintligt målblock. Backend ersätter berörda spårade intervall och skapar nya kvitton med full originaltext. Tidigare kvitton markeras superseded i klienthistoriken. Utelämnade kvarvarande tillägg bevaras. CV-edits räknar om positioner/checkpointText för bevarade tillägg.

En senare rättelse/ett nej drar tillbaka samtliga beroende tillägg över alla berörda block, även omskrivna tillägg. Andra källor lämnas kvar. Manuellt ändrade, osäkra block fryses och markeras för granskning utan automatisk ändring. Originaltext och revisioner bevaras separat från modellens föreslagna formuleringar.

## Kontroller och begränsningar

- 33 fokuserade enhet-/kontrakts-/Code-kedjetester passerar: blandat förslag, inga användbara svar, tomt resultat, borttagning, äldre1.0, exakta referenser/metadata, frysning, intervallomräkning och rättelse efter flera Apply med omskrivna tillägg.
- Ny whole-cv-webbläsarkontroll passerar: blandat förslag, originalsvar/revisioner under View details, oförändrat CV före Apply, ren Chat efter Apply, rättelse, no/no med vanlig CV-anpassning, väntan på sista tolkningen, ofarlig navigering och avvisat inaktuellt svar.
- Befintlig Tailor chat-livscykel och felwebbläsarkontroll passerar: nätfel, felaktigt kvitto,422 och timeout avslutar laddning, bevarar underlaget och erbjuder uttryckligt återförsök; ingen tyst fallback eller dubbelstart.
- Lokal provider kör de faktiska förberedda Code-nodernas kod och befintlig modellguard i VM. Endast modellens svar ersätts med syntetiskt underlag. Detta verifierar inte verklig modellföljsamhet eller driftsatt n8n-runtime. Externa modellanrop0, produktionsskrivningar0.

Källreferenser bevisar inte semantiskt innehållsstöd. Källstödd omskrivning, roll, negationernas innebörd och relevans är fortsatt modellberoende och granskas före Apply. Ingen verifierare, modellpilot, ny blocktyp eller automatisk fallback införs. Behov av nya block förblir ett separat beslut. Oklart sammanhang får inte kringgås via Summary/Skills.

Preview: http://127.0.0.1:8811/?sample=1. Svara exempelvis med sammanhanget Example Studio respektive Community Project. Då visas både vanlig CV-anpassning och svarstillägg i samma förslag. Details visar källor och full text. CV:t ändras först med Apply changes. Providern är avsiktligt begränsad syntetisk logik, ingen språkmodell.

## Samlat driftgodkännande återstår

package.json låser lokala filhashar, förväntad aktiv/sparad Tailor-version och före/efter-hashar för noderna. candidate.safe.json är en sanitiserad granskningsdefinition, **inte en förlustfri rollbackkopia eller en fil att skicka direkt utan credentials**. Offlinegenerator: `node backend/tailor-whole-cv/prepare.cjs`.

1. Återläs workflow H8oAioy58R1v3PvRe3YUa. Aktiv/sparad version måste fortfarande vara c7503539-0e08-4a49-958b-6467aea8d911 och matcha baselineprojektionen; stoppa vid avvikelse. Spara och hashverifiera fullständig krypterad rollbackkopia utanför Git före mutation.
2. Ändra enbart Code-noderna **Validate + Normalize** och **Compose source suggestion** enligt paketets kod. Behåll credentials, graf, inställningar, alla andra noder och Luna. Aktivera sparad version och återläs full sparad/aktiv definition. Inget produktionsmodellanrop ingår.
3. Publicera avgränsad frontend med förhandlad1.1-profil, klientvalidering/Ledger, samtliga faktiska ändringar i granskningen och den separata väntan-/kontextfixen. Behåll redan publicerad compact-followup. Exkludera tidigare opublicerad modell-diagnostik, V3 och andra workflowändringar vid releaseisolering. Ingen Webflow-designerändring behövs. Klienten börjar begära1.1 efter att backend stöder formatet. Äldre1.0 behåller sitt uttryckliga format; ingen tyst nedgradering från1.1.
4. Verifiera publicerade assethashar och aktiv backenddefinition. Därefter kan ägaren testa vanlig CV/annons-körning. Vid behov återställ matchande frontend och full workflowkopia.

Lokala kontroller passerar. Rättningen är inte driftsatt. Vanlig1.1-användning med den verkliga modellen är ännu inte verifierad.
