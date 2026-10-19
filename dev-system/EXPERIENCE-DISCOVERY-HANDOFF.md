# Experience discovery — överlämning till nytt konto

Senaste verifierade läge DEV-026: PR #3 är mergad som f43d9e4 och de godkända editorfilerna är publicerade. Befintligt workflow zeIzzxPwD2Y91OyD är aktivt, sparad/aktiv version 18c94502-2224-4f92-956e-c5fa6d5f2758; ingen definitionsändring vid aktivering. En syntetisk webbgenomgång (en plan/en interpret, inga retries) passerade med direkta svar, källhistorik/rättelse och oförändrat CV. Underlag till CV-förslag är separat och ännu inte inkopplat. Utfallet/snapshots i senaste CHANGE-LOG; gör färsk läskontroll inför fortsatt arbete. Historiska godkännanden innebär inte nya körningar eller upprepad leverans.

Senare läge DEV-025, 2026-10-19: utgå nu från `EXPERIENCE-EDITOR-USER-TEST.md` och senaste DEV-logg. Ägaren har tagit bort individuell faktabekräftelse och beställt lokal integration i HELA editorn, med direkta källsvar, rättelser och separat CV-godkännande. Nytt browserkommando är `node tests/editor-discovery.browser.cjs`; de två äldre fristående browserfilerna är ersatta. `node tools/serve-editor-preview.cjs` startar den lokala hela editorn på 8771 med alla backendvägar isolerade. Stresstester avvaktar. Nuvarande befintliga n8n-version efter DEV-023 är 18c94502-2224-4f92-956e-c5fa6d5f2758 (inaktiv vid senaste GET); nytt GET krävs inför leverans. Handoffen nedan är daterad historik.

Verifierad 2026-10-17, DEV-016. Arbetet finns på `codex/experience-discovery`, utgående från main `c67ce5c134016e1f835c4874ead546eaa4d24bc5`. Detta är en utvecklingsbranch för granskning, inte en produktionsleverans. Läs AGENTS.md och startupdokumenten, sedan denna fil och det aktuella discovery-kontraktet. GitHub-branchens innehåll är överlämningen; gamla temporära filer/chattminne krävs inte.

## Klart och säkrat

- Sessionsmodell med räknad frågekö, en fråga åt gången, korta frågor och långa fullständiga svar, följdfråga, hoppa över/nej/vet inte, individuell faktabekräftelse och rättelser med ID/revision/källcitat. CV-state är read-only.
- Separata frågor, källsvar och bekräftade erfarenheter för senare profil/RAG; ingen permanent lagring, embeddings eller retrieval byggd.
- Discovery 1.0-kontrakt för `plan`/`interpret`, strikt delad validering, injicerbar backendhandler, HTTP-klient och lokal preview. [Kontrakt](../contracts/experience-discovery-v1.md), [flödesbeskrivning](EXPERIENCE-DISCOVERY-FLOW.md).
- Definitionbyggare för separat n8n-flöde. Produktionseditorns loader, befintliga sex n8n-flöden och publicerade root-assets är oförändrade.
- 21 modell-/transporttester och två isolerade Edge-webbläsarscenarier omkörda 2026-10-17 och godkända. HTTP-test täcker cirka 40 000 tecken, fel/retry utan dataförlust, bekräftelser, skip och rättelse. All modelltrafik använder syntetisk provider; ingen extern modell/workflow exekverad av överlämningen.

## Befintligt n8n-flöde — skapa inte en dubblett

Instance: `https://drafted.app.n8n.cloud`.

- ID: `zeIzzxPwD2Y91OyD`
- Namn: `Drafted Experience Discovery v1 (inactive development)`
- Saved version: `bea078b2-f83e-4c25-b640-b3b56bde7bdd`
- GET-verifierat 2026-10-17: `active=false`, `activeVersionId=null`, 7 noder, updatedAt `2026-10-14T19:40:42.89Z`.
- Föreskriven route: `POST /webflow-experience-discovery`. Inaktiv definition innebär inte en registrerad produktions-webhook eller ett test som är klart att köras. Inga webhook-anrop behövs för statuskontroll.

Ägarens tidigare godkännande gäller discovery 1.0-kontraktsprofilen och skapandet av detta separata initialt inaktiva flöde; se kontraktets beslut/status. Det godkänner inte aktivering, produktion, CV-mutation eller permanent profil. Dagens uppdrag godkänner endast att säkra arbetet på GitHub och skapa PR, inte merge/publicering.

Lokal skyddad backupkatalog på ursprungsdatorn: `C:/Users/wallg/AppData/Local/Drafted/dev-system-backups/n8n/zeIzzxPwD2Y91OyD/`. Manifest `20261014T194039526Z__DEV-015.manifest.json` och krypterad postdefinition finns där; ursprungligt arbetsförlopp rapporterade verifierad skapande-/återläsningssnapshot. Överlämningen verifierar närvaro och aktuell workflowmetadata, inte en ny rollbackrepetition. DPAPI-backup/credentials checkas inte in och är inte portabla mellan Windows-användare/datorer. Före nästa mutation: säkra och verifiera aktuell komplett snapshot enligt EXECUTION-PLAYBOOK; stoppa om nödvändig rollback inte går att verifiera i den nya miljön.

## Kör lokalt utan produktionsåtkomst

Node.js krävs. Från branchens reporot:

```sh
node --test tests/experience-discovery.test.cjs tests/discovery-transport.test.cjs
node tools/serve-discovery.cjs
```

Servern binder localhost `127.0.0.1:8770`; öppna `http://127.0.0.1:8770/webflow/preview/experience-discovery.html?backend=1`. `PORT` kan ändra port. Servern använder uttryckligen syntetisk modellprovider och gör inga externa modellanrop. Alternativ preview utan backend demonstrerar lokal mockad adapter. Detta är inte produktionseditorn.

Browserkontroller kräver Playwright i Nodes modulupplösning och installerad browser:

```sh
node tests/experience-discovery.browser.cjs
node tests/discovery-http.browser.cjs
```

På ursprungsdatorn användes bundlad Node/Playwright och `PLAYWRIGHT_CHANNEL=msedge`; `NODE_PATH` pekade på den bundlade paketkatalogen. På en ny dator får agenten lokalisera tillgänglig runtime/browsers och redovisa eventuell saknad testdependency; hårdkoda inte originaldatorns runtime-sökväg. Tester använder syntetiskt underlag och blockerar extern browsertrafik.

`tools/build-discovery-definition.cjs` är en definitionbyggare, inte en deployment- eller run-åtgärd. Den behöver en säkert inspekterad modellbeskrivning och kan innehålla credentialreferenser i genererad output. Dumpa inte raw output i chatten eller checka in genererade definitioner med miljödata; använd godkänd skyddad hantering vid senare arbete.

## Nästa steg och verifieringsgränser

1. Verifiera aktuell branch, diff och n8n-definition via GET efter anslutning av det nya kontot. Hämta samma befintliga workflow-ID; återanvänd inte versionsmetadata som bevis för oförändrat läge utan ny läsning.
2. Granska den säkrade implementationen och det godkända kontraktet. Lokala fixtures bevisar inte att verklig modell väljer relevanta frågor eller tolkar svar korrekt.
3. Förbered ett konkret, isolerat n8n-/modelltest med syntetiska data, verifierad session/testlistener och tydligt avgränsade externa modellkostnader. Genomför bara när detta täcks av uttrycklig testauktorisation. Ingen automatisk aktivering eller produktionskörning.
4. Utvärdera verklig frågekvalitet, kort vardagligt språk, att CV-frånvaro inte blir kompetensdom, korrekta källcitat och långa svar. Verifiera riktig n8n-runtime separat från de lokala VM-/HTTP-testerna.
5. Därefter kan integration i huvudeditorn förberedas. CV-användning/Apply/versionering är ett separat steg med kvarvarande CDQ-01. Befintliga chat/Tailor-/språkfrågor är inte generellt lösta av discovery-kontraktet. Ingen permanent profil/RAG eller datamigrering är godkänd här.

Merge till main, Pages-assetleverans, Webflow-publish, n8n-aktivering/deaktivering och destruktiva åtgärder behåller sina explicita godkännandegater. Skapa ingen ny formaliserad DD utan separat ägarbeslut.

## Startmeddelande i det nya kontot

> Öppna DraftedAgent/drafted-webflow på branchen codex/experience-discovery. Läs AGENTS.md, dev-system/README.md och dev-system/EXPERIENCE-DISCOVERY-HANDOFF.md. Fortsätt från befintlig implementation och workflow zeIzzxPwD2Y91OyD; skapa inte en dubblett. Börja med att verifiera lokala tester och aktuella integrationsrättigheter. Föreslå nästa isolerade n8n/modelltest. Ingen merge, aktivering, produktionskörning eller publicering utan mitt uttryckliga godkännande.
