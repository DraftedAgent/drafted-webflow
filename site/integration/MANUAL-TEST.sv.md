# Kort manuell testguide

**Nu, efter godkänd DEV-163:** http://127.0.0.1:8826/ är aktiverat för riktiga
n8n-/AI-anrop. Åtta avgränsade anslutningsanrop passerade med syntetiskt CV.
Öppna startsidan i en egen flik och kontrollera märkningen **Dev · Integration ·
riktiga anrop** innan du väljer ditt CV. Agentens testdata ligger i en separat
isolerad webbläsarsession och har inte kopierats till ditt arbete.

http://127.0.0.1:8825/ är fortsatt simulerat. Previewn visar vald fil men
bearbetningen returnerar exempeldata, inte en tolkning av ditt CV.
8827 är den frysta simulerade referensen. Vid omstart är vanliga
`node tools/local-versions.cjs dev-integration` spärrat som säker standard.
För det nu godkända manuella testet startas i stället
`node tools/serve-local-integration.cjs --enable-real-backend` efter behov.
Ditt CV, annons och frågor kan då skickas till befintlig n8n/AI och kosta pengar.
Testa först med påhittade dokument; därefter kan du välja ditt faktiska CV.

1. **Start och utan jobbannons.** Öppna startsidan, följ Start with your CV,
   lämna annonsen tom och välj ett ensidigt PDF-CV. Förstora previewn, stäng
   med Escape och fortsätt. `/editor` ska öppnas först efter lyckad bearbetning.
   I riktigt läge ska innehållet motsvara din fil. Fel ska lämna underlaget kvar.
2. **Med jobbannons.** I en separat testsession, klistra in en hel annons och
   välj ett flersidigt PDF-CV. Alla originalsidor ska kunna läsas. Fortsätt och
   kontrollera filnamn/annons i editorn. Annonsinmatning kan starta AI-anrop.
3. **Chatt och Apply.** Be om en ändring. CV:t ska ändras först efter Apply.
   Ladda om med väntande förslag och kontrollera att det finns kvar. Testa
   blockmarkering, flerval, Use full CV, zoom och Fit to width.
4. **Erfarenhetsfrågor och Tailor.** Svara konkret, börja nästa svar och ladda
   om: svar och utkast ska finnas kvar. Kör Tailor och granska innan Apply.
   Ändra jobbannonsen separat: CV:t får inte automatiskt skrivas om och gamla
   förslag får inte appliceras som om de gällde den nya annonsen.
5. **Original/Edited och PDF.** Efter Apply ska Original vara oförändrat och
   Edited innehålla ändringen. Testa Show changes. Exportera och granska alla
   sidor, teckensnitt och brytningar. PDF ska innehålla Edited, utan markeringar,
   knappar eller lägesrad. Exporten använder webbläsarens utskrift.
6. **Navigation och omladdning.** Back to setup ska behålla annons, filnamn och
   preview. Continue med oförändrat underlag ska återöppna samma arbete utan ny
   bearbetning. Testa bakåt/framåt och omladdning på både `/` och `/editor`.
   En helt ny testsession direkt på `/editor` ska visa vägen till uppladdningen.
7. **Byte och avbrott.** Välj nytt CV, avbryt ersättningsfrågan och kontrollera
   gamla arbetet. Testa sedan ersättning. Om du laddar om under en väntande
   förfrågan ska den markeras avbruten, utan automatisk omkörning.
8. **Riktig mobil, när anslutningen är ordnad.** Upprepa upload, preview, chatt/
   Apply, Original/Edited, export och tillbaka/omladdning. Öppna tangentbordet
   i chatten och annonsdialogen: inmatning, Skicka/Spara och stäng ska gå att nå.
   Prova båda panelernas scroll och liggande läge. Stäng tangentbordet och
   kontrollera att dokument/kontroller återkommer utan förlust.

**Mobilanslutning återstår:** 127.0.0.1 på telefonen betyder telefonen, inte datorn.
Servern öppnas inte mot LAN i detta underlag. Android kan exempelvis använda
USB-portvidarebefordran med `adb reverse tcp:8826 tcp:8826` om utvecklaranslutning
är tillgänglig/godkänd; då behålls samma origin på telefonen. Det är inte testat
på din enhet. iPhone kräver en separat lokal anslutningslösning. Byt inte till
en LAN-origin och anta att CORS/lagring fungerar. Fysiskt tangentbordstest är öppet.

Anteckna **steg, förväntat/faktiskt, enhet/webbläsare, läge och tid**. Stoppa vid
oväntat fel i riktigt läge; undvik upprepade Skicka-klick. Skicka inte hela ditt
CV eller känsliga backendloggar i felrapporter. Browserlagringen är per origin/
flik och flyttas inte automatiskt mellan lägen, Webflow, dator och mobil.
Rensad lagring eller avslutad privat session kan förlora arbetet.

Webflow-origin kontrollerades i samma testomgång genom en riktig upload från en
isolerad webbläsarsida på den origin-adressen. Det verifierar CORS och svaret,
inte hela den publicerade Webflow-sidans UI. Ingen webbplats har publicerats.

Inga anslutningsfel hittades i omgången. Återstår manuell kontroll av ditt faktiska
CV, fler filvarianter/storlekar, den fullständiga Tailor-granskningen/Apply,
PDF via ditt utskriftsdialogfönster samt fysisk mobil med skärmtangentbord.
Modellsvarens kvalitet är inte generellt bevisad av lyckade anslutningsanrop.
