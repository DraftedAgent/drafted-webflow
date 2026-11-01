# Inbjuden testversion på thisismywork.app

Status 2026-11-01: publicerad på https://thisismywork.app, Cloudflare Free.
Publicerad källcommit: `8f8c40b098c259f2f64e58eeb9b2f838cd773ce6`.
Worker-version: `6f1b3b18-552d-4a90-b412-e4d499764d26`.
Exakt leverans och verifiering: `deployment-receipt.json`.

Domänen ersätter ägarens tidigare draftedagent.com. GoDaddy-zonen säkerhetskopierad
utanför Git under `%LOCALAPPDATA%/Drafted/dev-system-backups/dns/thisismywork.app/20261101/godaddy-before.txt`.
SHA256 FE4A36E66C9B58CFE7EE5A1C324E1E778AC88C5D40BC19FF6954D252743E8E3F.
Namnservrar nu achiel/edna.ns.cloudflare.com, tidigare ns63/ns64.domaincontrol.com.
Gamla apex A13.248.243.5 och76.223.105.230 ersatta av Worker-domänen.
DMARC, www och _domainconnect bevarade; inga MX/SPF/DKIM fanns och DNSSEC var av.

## Leverans

Samma standalone-builder och editor används, med ett separat resultat i
`site/hosting-dist/invited`. Bygg med `node tools/build-invited-test.cjs`.
Endast uttryckligt valda webbassets kopieras; äldre hostingutkast, lokala
backendunderlag och godkännandehandlingar följer inte med.
Dev och den frysta lokala referensen ändras inte av publicering.

Cloudflare Workers Free, SQLite Durable Object och statiska assets.
Verifierad lokal CLI: wrangler4.156.0. Inget abonnemang ska köpas eller uppgraderas.
`wrangler.jsonc` avaktiverar workers.dev och publika preview-URL:er.
Alla filer inklusive `/editor`, källkod och API passerar samma lösenordsskydd.
Uppladdningen använder exakt befintliga n8n-kontrakt genom `/api/webhook/...`.
Webbläsaren tillåts bara ansluta till samma origin; n8n-hemligheter placeras inte
i frontend. Den lilla fetch-adaptern ändrar endast transportadressen, inte
endpointvalet eller Tailors befintliga funktionsgater.

Hemligheten `TEST_PASSWORD` ska vara slumpmässig, minst24tecken och läggas som
Worker secret. Användarnamn: `tester`. Den får aldrig läggas i Git, URL eller
kommandoradsargument. Saknad hemlighet stänger åtkomsten. Variabeln
`LIVE_BACKEND=enabled` måste sättas uttryckligt vid godkänd leverans; annars
returnerar API503 utan anrop. Lokal testkonfiguration får aldrig publiceras.

## Anropsgräns och data

100 n8n-anrop sammanlagt för omgång1, högst2 samtidiga och20 per minut.
Räknaren är atomär och beständig över omstart/nya Worker-versioner. Misslyckade
och avbrutna vidarebefordringar räknas; inga automatiska omförsök/refunds.
Omladdning återställer inte budgeten. Automatisk jobbkontext/frågeplanering räknas.
Ny omgång eller höjt tak kräver ägarbeslut, inte en automatisk dagsnollställning.
Max15MiB inkommande request,180sekunders väntan; frontend kan ha kortare timeout.
Kvoten gäller anrop genom denna server, inte redan befintliga offentliga n8n-URL:er
eller hela AI-kontot. Ett workflow kan göra flera modellkörningar.

Serverdelen sparar endast antal, tidsstämplar och kortlivade anrops-ID:n.
Ingen ny CV-databas. Innehållet passerar Cloudflare och befintlig n8n/AI;
befintlig n8n-historik och datalagring påverkas inte. Browserarbetet är per
origin/flik; byt inte enhet/flik och förvänta dig automatisk synkronisering.

## Domän och rollback före leverans

1. Kontrollera registreringen i GoDaddy. Exportera hela DNS-zonen och dokumentera
   namnservrar och DNSSEC/DS, inklusive MX, TXT/SPF/DKIM/DMARC, CNAME och SRV.
   Publika DNS-frågor räcker inte för att hitta alla e-postposter.
2. Cloudflare Custom Domain kräver aktiv Cloudflare-zon. Kopiera/återläs ALLA
   befintliga poster innan namnservrar eventuellt byts. Mailvärdar ska vara DNS-only.
   Köp inte en ny domän. Bevara originalexport utanför Git om den innehåller
   verifieringstoken. Ändra bara webbposter efter kontroll av faktisk befintlig användning.
3. Kontrollera DNSSEC-övergången före NS-byte; lämna aldrig en gammal DS-post
   aktiv mot nya osignerade namnservrar. Dokumentera ändring/återställning exakt.
4. Upload-workflow6Bvk0NYcElT9OirH har senast återläst aktiv/sparad version
   dd665329-f992-4158-86ab-d5c32260e255 med Webflow och127.0.0.1:8826 som origins.
   Serverproxy behöver inte browser-CORS; om upload kräver ny origin tillkommer
   bara https://thisismywork.app. Bevara båda tidigare adresserna. Före varje
   sådan ändring: verifierad krypterad rollback, färsk versionskontroll och exakt
   efterdiff enligt projektets befintliga procedur. Ingen n8n-ändring är gjord här.
5. Bind den rena testreleasen till en Git-commit och spara build.json plus
   Worker-version, faktiska DNS-ändringar och testprotokoll i leveranskvittot.
   Publicera med `wrangler deploy --config site/hosting/wrangler.jsonc` först när
   rätt konto, gratisplan, hemlighet och uttrycklig livekonfiguration är kontrollerade.
6. Stäng anrop med LIVE_BACKEND=disabled. Stäng hela testet genom att ta bort
   domänrouten eller rotera lösenordet. Kodrollback använder föregående Worker-
   version; DNS-rollback använder den verifierade före-exporten. Återställ aldrig
   hela zonen över andra samtidiga ändringar. Backendrollback kräver färsk diff
   mot den krypterade snapshoten. Förbrukade AI-anrop kan inte återställas.

## Verifiering

Lokalt passerar5gatewaytester (auth, routes/CSP, requestgränser, exakt proxy,
beständig budget), Cloudflares workerd-browsertest (auth, direktbesök, upload,
reload/resume, tvåsidigt original, jämförelse, mobil), befintlig fullständig
standalone-flödessvit och4exportvyer. Alla backendresultat är syntetiska.
Wrangler dry-run passerar. Detta bevisar inte publik DNS/TLS eller riktig AI.

Efter publicering: en avgränsad omgång med högst12vidarebefordrade backendanrop
med påhittat CV/jobbad/svar. Kontrollera upload utan/med annons, chatt, Apply,
frågeplan/svar, Tailor, Original/Edited och PDF. Kontrollera anonym åtkomst,
direkt `/editor`, reload och back/forward utan nya anrop, mobilbredd och fel.
Stoppa vid oväntat backendfel och dokumentera innan någon ny testomgång.
Spara endast syntetiska skärmbilder/PDF och säkra svarskoder, inga riktiga CV:n.

## Bjuda in och testa efter verifierad publicering

Skicka länken https://thisismywork.app tillsammans med användarnamnet `tester`
och testlösenordet privat. Ett gemensamt lösenord är avsiktligt enkelt; det kan
inte återkalla bara en person. Vid läcka roteras det för alla. Inga inbjudningar
skickas automatiskt. Be testare återrapportera steg, förväntat/faktiskt beteende,
enhet/webbläsare och tid, utan att skicka hela CV:t i felrapporten.

Testa PDF med och utan annons; chatta och Apply; besvara erfarenhetsfrågor;
Tailor/granska/Apply; jämför Original/Edited/Show changes och Export PDF;
Back to setup, fortsätt igen, bakåt/framåt och omladdning. Testa även på riktig
mobil med öppet skärmtangentbord, dokument-scroll och PDF-utskrift/delning.
Ladda inte om under pågående AI-anrop: ett avbrott stoppar inte säkert redan
startad backendbearbetning, men anropet ska inte köras om automatiskt.

## Genomförd publik verifiering

10 riktiga workflowanrop med syntetiskt CV/annons/svar; ett tidigare transportfel
stoppades före n8n och räknas ändå i gatewaybudgeten.89av100återstår.
Upload utan/med annons, chatt, Apply, erfarenhetsplan/svar, Tailor,
Original/Edited-exportunderlag, direktbesök, reload och återgång/bakåt/framåt passerar.
Anonymt krävs lösenord även för assets. Publicerat build.json matchar exakt lokalt.
Ingen n8n-ändring behövdes eller genomfördes; tidigare origins/version är bevarade.

Mobil390x844 och reducerad tangentbordsvy390x450 kontrollerade; fysisk mobil
återstår. PDF-utskriftsunderlag verifierat från aktuell redigerad version,
operativsystemets spara-dialog inte automatiserad. Första mobilassertionen var
felaktig: erfarenhetsfliken var aktiv, så chattfältet var dolt som avsett.
Endast återstående kontroller kördes därefter, inga lyckade AI-steg upprepades.

DNS syns korrekt hos1.1.1.1 och8.8.8.8. Lokal standardresolver hade fortfarande
gammalt svar vid kontrollen. Publika browserprov använde den verifierade Cloudflare-
IP-adressen med thisismywork.app som hostname och normal TLS-validering.
Ingen certifikatvarning ignorerades. Länken kan tillfälligt visa gammal sida för
användare vars DNS-cache inte hunnit uppdateras. Använd adressen utan www.

Privat inbjudningsfil med lösenord: `%LOCALAPPDATA%/Drafted/invited-test/Invitation.txt`.
Den ligger utanför Git med begränsad filåtkomst. Ingen inbjudan har skickats.
Dev och fryst stabil version är bevarade. Senare dokumentationscommits ändrar
inte den publicerade källcommitten; publicering sker aldrig automatiskt från Dev.
