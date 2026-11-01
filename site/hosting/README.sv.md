# Öppen testversion på getmedrafted.com

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
