# Erfarenhetsfrågor i hela editorn – användartestkandidat

DEV-044 (2026-10-22), lokal kandidat: Experience questions förbereds nu automatiskt i bakgrunden när CV och annons finns. Knappen visar spinner och sedan det validerade frågeantalet (inklusive 0); Chat ligger kvar. Klick under laddning/efter färdig plan ger inget extra anrop. Fel kräver manuellt omförsök. Bygg `2026-10-22-background-question-plan`, befintlig localhost:8773-preview. Ännu inte publicerat; inga externa modellanrop. Senare webbverifiering måste mocka/blockera discovery före uppladdning, eftersom planen då kan starta utan klick. Äldre uppgifter om klickstyrd plan nedan är historik.

DEV-039 (2026-10-22), lokal programram: gemensam toppbar med dokumentnamn och Export PDF/Copy text, panelrubriker Editor och CV preview, samlad verktygsrad Chat/Experience questions/Tailor to job och markerat arbetsläge. Samma editor och backend återanvänds; CV-förslag och godkännande behåller befintligt beteende. Bygg `2026-10-22-editor-app-frame` på localhost:8773. Åtta skärmstorlekar och lokalt simulerad export/kopiering verifierade. Ingen publicering eller extern modellkörning.

DEV-037 (2026-10-22), lokal arbetsyta: introduktionstexten är dold, editor/CV-paneler fyller skärmen under navigationen på en gemensam ljusgrå bakgrund. Panelinnehåll rullar internt och skrivfält/verktyg hålls inom skärmen. Smal stående skärm visar båda panelerna ovanför varandra. Åtta skärmstorlekar verifierade. Befintlig preview på 8773, bygg `2026-10-22-editor-workspace`. Inte publicerat; inga n8n-/modellkörningar.

DEV-036 (2026-10-22), ny lokal kandidat: chatten är standard efter uppladdning. En liten **Experience questions**-knapp i editorns hörn öppnar befintliga frågor i samma kort. **Back to editor**/Escape pausar med kvarvarande utkast; avslut återgår direkt till chatten och **Review your answers** öppnar historik/rättelser. Ingen modell körs före användarens klick. UI och samtal är engelska utan språkval. Bygg `2026-10-22-editor-question-mode`; befintlig hel editor-preview och browserkontroll återanvänds. Ännu inte publicerat; äldre beskrivningar nedan är daterad historik. Inga n8n-/prompt-/kontraktsändringar ingår.

2026-10-19, DEV-025. Lokal kandidat på `codex/experience-discovery`, utgående från `25d7e538b2edd097a1d2efe2b9dacfe6a240fc8d`. Inget i denna fil är ett produktionsgodkännande. Ingen publicering, aktivering eller produktionskörning har utförts för integrationen.

DEV-026: Ägaren svarade uttryckligen ja på det samlade leveranspaketet: commit/push/PR #3, main-merge/Pages, aktivering av samma workflow/version efter verifierad snapshot samt en syntetisk webbverifiering med högst två modellanrop utan retries. Genomförandet och faktiskt verifierat utfall redovisas i senaste CHANGE-LOG; förberedelsens väntande status nedan är historisk.

## Vad användaren kan testa

- Ladda CV och annons i samma Drafted-editor som hemsidan använder. När båda finns erbjuds erfarenhetsfrågor i chattkortet, med synligt val av samtalsspråk och möjlighet att avstå.
- Befintlig discovery Session/Client/UI och samma n8n-workflow återanvänds. Tydliga svar registreras som originalkällor och flödet går direkt till nästa fråga. Ingen individuell faktabekräftelse.
- Ett vagt ja eller en tolkning utan konkret underlag ger högst en följdfråga om vad personen själv gjorde. Nej, vet inte, hoppa över och avsluta finns kvar.
- Svaren kan visas och rättas både under omgången och efteråt. Identitet/original/revisioner behålls; inaktuella tolkningar/täckta frågor invalidieras vid rättelse. Ny annons/CV gör jämförelsen inaktuell, utan automatisk återanvändning av gamla källor.
- Svaren ändrar inte CV:t. AI-tolkningar är rådgivande, inte användarbekräftade fakta. Befintliga explicita CV-handlingar är separata.

Viktig testgräns: de nya erfarenhetssvaren skickas INTE till nuvarande Tailor/rewrite som dolda instruktioner eller CV-block. Dessa API-kontrakt bär ännu inte separat erfarenhetsunderlag; CDQ-01/02/03 är inte lösta av denna integration. Användartestet avser frågor/svar/rättelser i hela editorn. Att skapa CV-förslag från nya svar och därefter godkänna dem är ett separat nästa steg. Inget sådant stöd påstås finnas här.

## Lokal förhandsversion och verifiering

Kör från reporoten:

```sh
bash webflow/build.sh 2026-10-19-editor-discovery-preview
node tools/serve-editor-preview.cjs
```

Öppna http://127.0.0.1:8771/ och välj **Prova med syntetiskt CV och annons** i uppladdningsdelen. Detta använder hela editor-DOM:en från en sanitiserad läskopia av publicerad Home, samma byggda JS/CSS och oförändrad befintlig mockprovider för svarstolkning. Preview-knapp/fixturekonfiguration laddas separat och ingår inte i produktionsbundlen. Externa scripts/analysverktyg är borttagna; CSP blockerar externa anslutningar. Alla befintliga backend-URL:er ersätts uttryckligen lokalt; ej implementerade CV/chat/export-operationer avvisas i preview. Inga användarfiler läses av någon extern tjänst.

Verifierat: 19 sessions-/transporttester; en helhetskontroll i headless Edge för riktig upload/ad-hantering, opt-in, direkta svar, fel/retry, en följdfråga, rättelse, historik, språk-/annonsbyte, oförändrat CV och mobilbredd 390 px (svarsfält 298 x 116 px). Inga externa requests/modellanrop/Tailor-körningar. Den äldre layoutens hoptryckta editor på små skärmar är korrigerad inom discovery-editorns scope. Fixtures bevisar inte verklig LLM-kvalitet. Inga fler fristående stresstester har körts.

```sh
node --test tests/experience-discovery.test.cjs tests/discovery-transport.test.cjs
node tests/editor-discovery.browser.cjs
```

Browserkommandot kräver Playwright i NODE_PATH och installerad Edge (alternativt PLAYWRIGHT_CHANNEL). Lokal server och browserkontroll använder samma editor, inte ett parallellt discovery-system.

## Exakt webb-/workflowleverans efter ett samlat godkännande

1. Spara lokal kandidat i befintlig branch och uppdatera befintlig draft-PR #3: https://github.com/DraftedAgent/drafted-webflow/pull/3 . Skriv om titel/beskrivning för slutlig editorintegration och granska alla source/test/docs/build-filer. PR-head i nuläget är fortfarande 25d7e53; lokala ändringar är inte committade eller pushade. Gör ingen force-push.
2. Rechecka remote main/head, kandidatens hash och n8n-version samt Pages main-at-root-konfiguration. Main som senast lästs är c67ce5c134016e1f835c4874ead546eaa4d24bc5. Stoppa om orelaterat arbete tillkommit eller kandidaten skiljer sig från det godkända.
3. Efter ny verifierad krypterad snapshot: aktivera/publicera ENDAST befintlig n8n discovery `zeIzzxPwD2Y91OyD`, sparad version `18c94502-2224-4f92-956e-c5fa6d5f2758`. Senaste GET i DEV-025: active=false, activeVersionId=null, sju noder. Ingen ny workflow och ingen definitionsändring krävs av klientens ändrade svarslivscykel. Den produktionsroute som då kopplas in är `POST /webhook/webflow-experience-discovery`; testlistener-URL används inte på hemsidan. Kontrollera CORS/OPTIONS och JSON-svar från Webflow-origin inom den godkända verifieringen.
4. Merge den granskade kandidat-PR:n till main, vilket publicerar GitHub Pages-assets. Hemsidans befintliga loader läser redan root latest.json och editorbundle; inga ytterligare script-taggar, nytt discovery-system eller Webflow-publish behövs för funktionskopplingen.
5. Produktionsfiler: `drafted-editor.js` (innehåller befintliga discovery-moduler plus editoradapter och editor), `drafted-editor.css` (inkluderar discovery-/responsiv layout), `latest.json` (pekar på bygg-id `2026-10-19-editor-discovery-preview`). `webflow/latest.json` hålls identisk som källspegel. Befintliga sex n8n-flöden och Webflow-sidans innehåll är utanför denna leverans.
6. Verifiera serverade build/hashar och aktivitet. Högst EN syntetisk webbgenomgång med CV+annons och ett konkret svar får ingå om godkännandet omfattar den: högst en discovery-plan och en interpret (två modellanrop, inga retries). Använd fast syntetisk CV/jobContext utan att starta produktionens upload/jobcontext/Tailor/export/chat i verifieringsharnessen; därefter vanlig mänsklig användartestning inom godkänd testscope. Ingen annan produktionskörning får följa automatiskt. Modellkostnad för två korta discovery-anrop uppskattas under USD 0.02 exklusive n8n, inget hårt tak; redovisa igen före start.

## Fryst kandidat för granskning

- Build: `2026-10-19-editor-discovery-preview`.
- Root JS SHA256: `2d4614027fffe34f755c1cc1a60d209aaccf12fb099fcdcf46520be981aa8c35`.
- Root CSS SHA256: `e8b77ba2bf05b00cd5340bbd1deaddfbd796e3676500428e95e1b1e34761efde`.
- Root latest.json SHA256: `ddc5b4c572746c73c9828a31087364ac36fcbe48a757276649a3265dfccd3447`.

Källkods-/test-/dokumentationsfiler ska ingå i samma granskade commit; testfixtures i TEMP, krypterade snapshots och credentials ska inte checkas in. Ändras produktionsassets behöver hashlistan och relevant verifiering uppdateras innan leverans. Inga filer eller versioner får bytas ut efter godkännande utan att scope kontrolleras.

## Samlad godkännandepunkt och rollback

Ägaren godkänner vid ETT tillfälle: commit/push och uppdatering av PR #3; exakt ovanstående main-merge/Pages-leverans; aktivering av samma discovery-ID/version; den avgränsade syntetiska discovery-verifieringen om högst två modellcalls; därefter den avsedda manuella användartestningen. Detta är ännu INTE godkänt. Ingen Webflow-publicering, annan workflowändring, profil/RAG eller CV-evidensmigrering ingår.

Rollbackbas: de tidigare root-assets/latest finns vid main c67ce5c och kan återställas genom ny granskad commit/leverans, aldrig force-push eller historikomskrivning. Vid avvikande produktionsverifiering: stoppa vidare testning, redovisa läget och inhämta separat godkännande för eventuell deaktivering/återställning; aktiveringsgodkännandet ger inte automatiskt rätt att deaktivera. Befintliga krypterade workflow-snapshots finns utanför Git. Ingen rollback kan återställa redan gjorda modellkostnader.
