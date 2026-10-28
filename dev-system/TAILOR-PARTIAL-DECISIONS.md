# Beslut per tailoring-ändring — kartläggning, inte implementerat

2026-10-28. Tillhör den lokala presentationsändringen DEV-150. Ingen ny besluts-/appliceringsprofil är godkänd eller införd.

Nuvarande Apply validerar och applicerar ett helt förslag och uppdaterar dess källregister. `tailor-sources-v11.js` rekonstruerar hela resultatet i `validateCandidate`; `Ledger.commit` ersätter grupper och uppdaterar källhistorik. Ändringskortet visar diffhunkar, men har inga kontraktsbundna individuella ändrings-ID:n eller beslut. Previewns proposal-ID/block-ID identifierar vad som granskas, inte en applicerbar deloperation.

## Blocken är inte generellt oberoende

- `cvEdits[].cvEvidence` kan hänvisa till ett annat blocks ursprungstext. Om Experience accepteras först kan ett kvarvarande Summary-förslag förlora sin giltiga evidens. `tests/tailor-review-dependencies.test.cjs` verifierar att hela ursprungsförslaget är giltigt men att Summary inte kan valideras efter den partiella Experience-ändringen. Att bara byta basversion löser inte detta.
- Flera hunkar kan tillhöra samma block. Källsvar kan användas i flera block; rättelser drar tillbaka alla beroende tillägg. `sourceApplications` har exakta intervall/checkpointText, och CV-omskrivningar räknar om dessa intervall.
- Hela svaret binds till aktuell CV-/annons-/svarsstämpel. Det saknas ett protokoll för kvarvarande förslag efter partiellt accepterat eller avvisat innehåll. En DOM-diff eller ett block-ID räcker inte för att uppdatera historik och beroenden.

## Konkret nästa implementation, efter avgränsat kontraktsbeslut

1. Bestäm atomär beslutsenhet: en diffhunk, ett helt block eller en uttryckligt namngiven beroendegrupp. Ge den stabilt ändrings-ID inom ett proposal-ID och bunden originalversion/innehåll. Klargör hur användaren får fatta beslut när två ändringar delar evidens eller källintervall. Ingen knapp märkt Accept change får i hemlighet acceptera gruppen/hela CV:t.
2. Bygg en beroendekatalog från evidensreferenser, överlappande redigeringsintervall och källkvitton. Visa kopplingarna innan ett beslut. Besluta om berörda kvarvarande ändringar ska bli inaktuella och kräva ett nytt uttryckligt förslag, eller om en verifierbart oberoende grupp får valideras vidare. Ingen automatisk modellkörning följer av ett lokalt beslut.
3. Förbered en atomär deltransaktion via samma strikta kandidat-/källregistervalidering och befintlig historik. Beräkna sedan det entydiga kvarvarande förslaget mot det faktiskt nya Current, inklusive dess blocktext, evidens, källrevisioner och intervall. Avvisa/markera beroende delar som inaktuella om valideringen faller; flytta aldrig bara basstämpeln. Ett avvisat förslag får inte ändra canonical text.
4. Synkronisera beslut i kort och preview. Testa minst två oberoende ändringar, två evidensberoende ändringar, flera hunkar i samma block, källrättelse över flera block, stale/dubbelklick och stängning efter accepterad del. Behåll tydliga globala handlingar för alla återstående giltiga ändringar.

I den aktuella kandidaten finns därför Current, Suggested, Show changes och stängning vid det aktiva blocket. Apply all changes och Dismiss i chattkortet behåller sin globala betydelse. Inga lokala Accept change/Dismiss change-knappar visas utan korrekt kontraktsstöd.
