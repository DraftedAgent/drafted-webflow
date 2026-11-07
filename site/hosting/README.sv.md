# Öppen testversion på getmedrafted.com

Senast verifierad publicering: **DEV-263, 2026-11-07**, källcommit `65d3eb6`,
Worker-version `88fd1f67-cd1b-4850-96ad-aed1077d286f`. Se `current-release.json`.
Sektionsvisa Accept/Decline synkas mellan editor och preview; obeslutade förslag
är markerade oberoende av globala Show changes. Original/Current finns i verktygsraden.

Aktuell adress från DEV-175: https://getmedrafted.com är öppen utan lösenord,
inbjudan eller konto. Tidigare inbjudningsuppgifter behövs inte.

Samma Cloudflare Worker, Durable Object-binding, klass, migration och
`invited-test-round-1` behålls. Det interna namnet är avsiktligt oförändrat
så att den redan förbrukade budgeten inte nollställs vid övergången.
Alla anonyma API-anrop delar100anrop totalt,20per minut och2samtidiga.
Budgeten finns på servern och är oberoende av cookies, flikar och webbläsarlagring.
Ingen automatisk återställning. Befintliga direkta n8n-webhooks ligger fortsatt
utanför denna gateways budget. Ingen n8n-/DNS-ändring ingår i DEV-174.

## Snabb avstängning av AI

Sätt `LIVE_BACKEND=disabled` och publicera samma Worker:
`node site/hosting-work/node_modules/wrangler/bin/wrangler.js deploy --config site/hosting/wrangler.jsonc --var LIVE_BACKEND:disabled`

Det stoppar nya AI-anrop före budgetreservation och backendanrop, men avslutar
inte säkert körningar som redan startat. Sätt även konfigurationsfilens värde
till disabled om stoppet ska bestå vid kommande publiceringar.

## Verifiering och återgång

Sex isolerade gatewaytester verifierar anonym åtkomst, samtliga gränser,
ny anonym besökare efter100anrop, återstart med samma lagring samt AI-avstängning.
Lokalt workerd-browsertest passerar utan httpCredentials: direkt editor,
syntetisk upload, reload/resume/historik, jämförelse och mobil.
Publika kontroller använder inga riktiga AI-anrop i denna ändring.
Tidigare verkliga funktionstester finns i deployment-receipt.json och DEV-173.
Aktuell öppen publicering dokumenteras separat i open-release.json.

Historisk rollback till den tidigare skyddade versionen (använd inte direkt efter
domänbytet: den versionen kräver den gamla domänen):
`wrangler rollback 6f1b3b18-552d-4a90-b412-e4d499764d26 --config site/hosting/wrangler.jsonc`
Befintlig hemlighet lämnas oanvänd för att hålla denna återgång möjlig;
den läses inte av den öppna versionen och behövs inte för åtkomst.

## Testa och dela

Skicka bara https://getmedrafted.com. Testa uppladdning utan/med jobbannons,
chatt/Apply, erfarenhetsfrågor, Tailor, Original/Edited, Export PDF och
Back to setup, bakåt/framåt och omladdning. Testa riktig mobil med tangentbord.
CV-data skickas till befintlig n8n/AI och arbetet sparas lokalt i webbläsaren.
Ingen kontosynkronisering. Använd adressen utan www.

Tidigare publicerad version och DNS-rollback finns i deployment-receipt.json.
DNS-backup: `%LOCALAPPDATA%/Drafted/dev-system-backups/dns/thisismywork.app/20261101/godaddy-before.txt`.
Dev och stabil referens uppdateras inte automatiskt av en publicering.

## Domänbyte DEV-175

getmedrafted.com ersätter thisismywork.app på ägarens uttryckliga begäran.
Samma Worker och budgetobjekt används; inga n8n-flöden behöver ändras eftersom
webbläsarens anrop går via samma origin och serverproxyn vidare till n8n.
Tidigare lokalt CV-arbete flyttas inte automatiskt mellan domäner.

GoDaddy-zonen exporterades och verifierades före namnserverbytet.
Backup: `%LOCALAPPDATA%/Drafted/dev-system-backups/dns/getmedrafted.com/20261101/godaddy-before.txt`.
SHA256: `71E905F38023BA51C5E05A436E325F78D1CA6059C811C433DFD2706E4FD91D19`.
Tidigare namnservrar ns19/ns20.domaincontrol.com ersätts med
achiel/edna.ns.cloudflare.com på Cloudflare Free. Inga MX/SPF/DKIM fanns;
DMARC och CNAME-posterna www/_domainconnect bevaras. Parkeringsadresserna
15.197.148.33 och 3.33.130.190 ersätts av Worker-domänen. DNSSEC var redan av.

Återställ DNS genom att återgå till ns19/ns20.domaincontrol.com och den sparade
zonen; detta återställer GoDaddy-parkeringen, inte Drafted. För kodåtergång på
nya domänen: bygg föregående verifierade app med den nya origin-/route-konfigurationen
och samma budgetidentitet. Rulla inte blint tillbaka en Worker med gammal origin.
AI kan stoppas omedelbart med kommandot ovan. Publiceringskvitto: domain-release.json.

## Samlad Dev-leverans — DEV-196, 2026-11-02

Den godkända leveransen inkluderar nuvarande standalone Dev: hero/övergång,
Studio/Executive, tal-till-text, erfarenhetsfrågornas vänteläge och svarskontroller,
tailoring-ytan, versionsbunden signaltäckning/källnavigering samt D-favicon.
`tools/build-invited-test.cjs` använder samma komponenter och ger de två nya
funktionerna samma-origin-adresserna `/api/coverage` och `/api/dictation`.

Worker läser två serverhemligheter, COVERAGE_GATEWAY_KEY och DICTATION_GATEWAY_KEY.
Värdena ligger endast i Cloudflare Secrets och respektive befintlig privat
DPAPI-credential; de byggs aldrig in i HTML/JS eller sparas i Git. De två
nya flödena tillåter nu även https://getmedrafted.com, med localhost8826 bevarat.
Modeller, credentialreferenser, kontrakt och avstängd payload-retention behålls.

Samtliga nio API-vägar delar samma befintliga Durable Object, migrationsetikett,
100-total/20-minut/2-samtidiga och LIVE_BACKEND-kill switch. Ingen budgetreset,
ny hostingtjänst, DNS-ändring, prenumeration eller kontomodell ingår.
Riktig signaltäckning behöver två anrop för ny annons och ett efter CV-Apply;
varje transkribering ett. Befintlig förbrukning kvarstår.

Återställningsversion på nuvarande domän före denna leverans:
`418605a5-e0de-443a-b904-46682788186c`. Full krypterad Worker-/n8n-before-state
med verifierade hash/dekrypteringsrundor finns under
`%LOCALAPPDATA%/Drafted/dev-system-backups/n8n/` och privat release-baseline under
`%LOCALAPPDATA%/Drafted/public-release-20261102/`. Budgetidentiteten får inte bytas.
Se separat releasekvitto för slutlig publicerad källcommit och Worker-version.

Verifiering använder syntetiska svar med blockerade externa/API-POST-anrop i
webbläsaren. `node tools/release/verify-public-mocked.cjs` kör fulla UI-flödet mot
publicerade frontendfiler men utför inga riktiga modell-/workflowanrop. Tidigare
avgränsade riktiga prov upprepas inte av denna publicering. Svensk semantisk
kvalitet och fysisk mobil är inte fullständigt verifierade.

## Tailor1.4 — DEV-251

Automatiskt CV-språk, frivilligt Change-val, helöversättning och källbunden integrering använder de två separat godkända Tailor-noderna. Aktiv backendversion och exakta Code-hashar finns i `tailor-release.json`; webbbyggaren skickar1.4 först med detta verifierade kvitto. Modell/max4000tokens och alla övriga workflows är oförändrade. Äldre profiler behåller sina grenar. Preview ändrar inget; Accept validerar om och applicerar.

Åtta syntetiska språkfall kördes mot publicerade filer på desktop/mobil; alla API-skrivningar ersattes lokalt. Inga betalda testanrop. Riktig modellkvalitet och stora dokument är inte nyverifierade; ogiltig/ofullständig kandidat avvisas. Denna uppdatering skriver inte om tidigare accepterat CV-innehåll automatiskt. Återställningsunderlag/scope finns i `dev-system/prepared/tailor-quality/RELEASE-20261104.md`.
