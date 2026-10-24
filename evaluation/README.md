# Isolerad modellpilot — förberedd, inte körd

Alla 18 fall är syntetiska Alex Example/Example Studio-data i `materials.cjs`. Inga bilagor, användarsvar, produktionswebhooks eller privata körningar används. Befintliga frysta profiler är jämförelsebas; kandidaten använder samma kontraktskomposition som n8n. Att importera eller förbereda utvärderaren läser ingen API-nyckel och gör inga anrop.

Första föreslagna piloten: högst 72 anrop, sex fall per operation (plan/interpret/tailor), två upprepningar, befintligt respektive föreslaget kontrakt. Modell gpt-4.1-mini, temperatur 0,2, store=false, en begäran i taget, inga automatiska omkörningar. Discovery använder befintligt JSON-object-läge; Tailor använder befintligt textläge. Instruktioner och schema jämförs i de faktiska meddelandena.

**Kontrollerad avvikelse från drift:** piloten sätter samma max_output_tokens=4000 för båda profilerna. Nuvarande Discovery har ingen explicit gräns, nuvarande source-Tailor har 4000. Det är en begränsad jämförelse under en gemensam säkerhetsgräns, inte en exakt återgivning av obegränsad Discovery i drift. Workflowkandidaten ändrar inte deras tokeninställningar. Återgiven faktisk modellversion registreras och en ändrad modellversion stoppar försöket.

`node evaluation/cli.cjs prepare OUTPUT_DIRECTORY` fryser samtliga syntetiska begäranden, modellinställningar, 72 körspecifikationer och meddelande-/schema-/material-/källhashar. Förberedelsen innehåller inga slumpmässiga revisions- eller Apply-ID:n. All källdrift ogiltigförklarar manifestet och kräver nytt materialgodkännande. `approval.template.json` är uttryckligen `approved:false`, med tomma pris- och kostnadsfält.

`node evaluation/cli.cjs mock OUTPUT_DIRECTORY` testar alla 72 platser mot en deterministisk syntetisk provider. Det är **bara körmekanik**, ingen modellutvärdering eller kvalitetsmätning. Mockens medvetet enkla regler ställer exempelvis frågor även i täckta/icke handlingsbara planfall; dessa semantiska kontroller markeras underkända, inte bortförklarade. Mockrapporten får inte användas som skäl för aktivering.

Före en verklig körning måste ägaren separat godkänna exakt manifest/material, modellinställningar, kontraktshashar och ett kostnadstak. Aktuell in-/utdataprissättning måste kontrolleras då och skrivas i godkännandet; inga antagna priser är inbyggda. Godkännandet ska ange approved=true, identiska manifestSha256/materialsSha256/sourcesSha256, maxCalls=72 samt positiva maxCostUSD/inputUSDPerMillion/outputUSDPerMillion.

Endast efter detta godkännande finns den uttryckliga vägen `node evaluation/cli.cjs live OUTPUT_DIRECTORY APPROVAL_JSON`. Den kräver separat `DRAFTED_EVAL_OPENAI_API_KEY`, läser inga produktionscredentials och anropar endast OpenAI Responses. API-formatet följer [officiell OpenAI-dokumentation](https://developers.openai.com/api/docs/guides/text). Providerfabriken kontrollerar också godkännande, meddelandehashar, inställningar, engångskörning per plats och kostnadsreservation; den kan inte användas som oreglerad provider för andra data. Denna väg har endast testats med injicerad lokal HTTP-mock.

Varje anrop reserverar konservativt inmatningens UTF-8-byteantal plus 4096 tokens för inramning och hela utdatagränsen. Nästa anrop stoppas om budgeten kan överskridas. Providern reserverar dessutom kumulativt, vilket kan stoppa tidigare än faktisk förbrukning kräver. Faktisk tokenförbrukning valideras och prissätts separat. Om timeout/transportfel eller saknad/ogiltig usage gör kostnaden okänd stoppas försöket utan omkörning, och osäker kostnad samt reserverad möjlig exponering redovisas. Tidsgräns 30 minuter, inklusive sista anropets återstående tid; högst 90 sekunder per anrop. Detta är en klientspärr, inte garanti för att leverantören upphör att behandla en redan mottagen begäran.

CLI skriver en startmarkör före första försöket och avvisar upprepad körning i samma katalog även efter avbrott. Ingen återupptagning eller automatisk omkörning finns. Ett nytt försök kräver ett nytt uttryckligt godkännande, även om vissa platser återstår.

Rapporten skiljer:

- Rå format- och referensföljsamhet **före** backendkomposition från slutligt utfall och eventuell säker kontextåterhämtning.
- Tekniskt fel, kort följdfråga/kontextbehov, giltig nollplan och granskningsförslag. Fördefinierade utfall/antal hjälper kontrollen men ersätter inte innehållsgranskning.
- Tid, usage, känd kostnad och osäker kostnad. Externa anropsförsök är inte automatiskt framgångsrika modellkörningar.
- Variation per fall/profil och upprepning: utfall, frågeantal och rå hash. Rå hash kan skilja bara på grund av körningsbundna referenser; semantisk variation måste granskas manuellt.

Vid godkänd live-körning sparas syntetisk rå output och slutligt svar för separat mänsklig granskning av källstöd, relevans, placering, negationer, avgränsningar och variation. Varje rad har en konkret granskningslista med status pending. En lyckad backendåterhämtning ger aldrig rå modellen ett godkänt resultat. Rapporten har alltid productionReliabilityClaim=false och releaseApproved=false. Den begränsade piloten kan ge observationer, inte bevisa produktionsstabilitet. Ny aktivering kräver redovisat utfall och separat leveransgodkännande.
