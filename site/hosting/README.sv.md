# Inbjuden testversion på thisismywork.app

Status 2026-11-01: ägaren har ersatt den tidigare föreslagna draftedagent.com
med thisismywork.app. Inloggning och registrering hos GoDaddy är verifierade.
Cloudflare Free-zonen är förberedd, ännu ingen webbpublicering. GoDaddy-zonen
är exporterad, DNSSEC är av och alla fem dataposter är återlästa hos Cloudflare
(två A-adresser bakom GoDaddys WebsiteBuilder, www, _domainconnect och _dmarc).
Inga MX-poster fanns. Före-exportens SHA256:
FE4A36E66C9B58CFE7EE5A1C324E1E778AC88C5D40BC19FF6954D252743E8E3F.
Originalnamnservrar ns63.domaincontrol.com och ns64.domaincontrol.com;
tilldelade Cloudflare-servrar achiel.ns.cloudflare.com och edna.ns.cloudflare.com.

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
