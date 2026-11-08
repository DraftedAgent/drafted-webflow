# Porträtt i CV – policy och lokal implementation

Status: ägaren beställde implementation och förenkling av bildhanteringen i huvudchatten 2026-11-08. Lokal funktion;
ingen produktionspublicering. Tillägg till CV-innehållspolicy v0.3, utan att
godkänna övriga kvarstående förslag i den policyn.

## Produktprinciper

- Varje mall har en avsiktligt formgiven variant med respektive utan porträtt.
  Bildlös layout reserverar ingen bildyta. Identitet och kontaktuppgifter får
  använda den frigjorda bredden; inga tomma bildplatshållare exporteras.
- Bildlöst CV är standard när uttryckliga ansökningskrav saknas. Användaren kan
  välja porträtt. Detta är ägarens produktbeslut, inte en generell forskningsregel
  om rekryteringsutfall, ATS eller alla marknader/branscher.
- Följ uttryckliga krav för den aktuella ansökan. Skilj porträtt **i CV:t** från
  separat ansökningsbild, portfolio och arbetsprov. Yrkesbenämning och
  arbetsgivarnamn räcker aldrig för att härleda ett bildkrav. Exempel:
  ”CV med foto” kräver CV-porträtt; ”bifoga separat ansökningsbild” gör det inte.
  ”Fotograf, Photo Studio” innebär inget bildkrav i sig.
- Bildinstruktioner hanteras i bakgrunden; ingen dropdown eller separat
  kravhantering i fotodialogen. Visa bara ett kort relevant besked vid behov.
  Otydliga instruktioner är inte verifierade krav. Annonsen kan granskas och
  korrigeras genom det befintliga jobbannonsflödet.
  Motstridiga detekterade CV-krav behöver förtydligas före export. Saknad obligatorisk
  bild ska ge ett konkret besked, inte en export som påstås uppfylla bildkravet.
- Mallens placering och bildstorlek är fasta; användaren väljer **Square / Rounded / Circle**.
  Båda använder samma kvadratiska beskärningsyta och sparade bildposition.
  Beskärningens position och förstoring
  får justeras; bildens proportioner bevaras. Bilden påverkar faktiskt
  innehållsutrymme och sidantal. Textstorlek/marginaler krymps inte automatiskt.
- Samma renderer, fysiska mått, typsnitt, beskärning och bildruta används för
  preview, sidräkning och PDF. Zoom är en visningstransform och påverkar inte
  sidantal. Bildresurser ska vara avkodade innan utskrift förbereds.
- Originalfil och beskärning bevaras separat från godkända textblock. Bildlöst
  läge ändrar bara den aktuella representationen. Inget automatiskt borttagande
  av originalbild vid byte av layout eller ansökningskrav. Nytt CV för en annan
  person återställer porträttvalet; samma arbetsytas omladdning bevarar det.
- Porträttval är ett uttryckligt presentationsval liksom mallval. Det godkänner
  inga textförslag. Export använder fortsatt godkända textblock; preview av
  föreslagen text innebär fortfarande inte Accept.

## Mallar och tekniskt kontrakt

Fasta porträttmått:
Classic: höger i headern, 28 × 28 mm och 6 mm mellanrum. Compact: höger,
28 × 28 mm och 4 mm mellanrum. Editorial: vänster, 30 × 30 mm och 6 mm till
namnkolumnen med mallens accentlinje. Studio: vänster under headerns tunna
topplinje, 32 × 32 mm och 6 mm till identiteten; bildlös variant ger identiteten
full bredd och en sammanhållen kontaktlinje. Executive: höger, 30 × 30 mm med
tunn neutral kontur och 6 mm mellanrum. Circle ger cirkulär mask, Square en
rak kvadrat och Rounded 6 px hörnradie vid fysisk CV-storlek; mallarna får inte ersätta användarens formval. Alla
varianter hanterar radbrytning i långa namn, titlar och kontaktuppgifter. Porträtt
visas endast på första sidan. Måtten är produktens formgivningsval, inte evidens.

Standardform definieras centralt i `cv-document-designs.js`: Classic och Compact
använder Rounded, Editorial och Studio Square, Executive Circle. Alla mallar
stöder alla tre former. `shapeOverrides` innehåller endast uttryckliga val,
nycklade med mall-ID, exempelvis `{classic_v1:"circle",executive_v1:"square"}`.
En mall utan eget val följer sin standard. Save ändrar bara dialogens aktiva
malls val; Cancel kastar utkastets ändringar. Mallbyte skriver inga overrides.
Dialogen visar aktuell malls effektiva form. Fil, position och zoom är fortsatt
gemensamma, och formkartan sparas i samma befintliga workspace-presentation.

Äldre globala `shapeOverride` eller `shape` migreras endast till arbetsytans
uttryckligen sparade aktiva mall (`saved.design`). Inga val uppfinns för andra
mallar. Saknas giltigt mall-ID skapas ingen historisk mallkoppling; mallarnas
standarder används. En befintlig ny formkarta har företräde över äldre fält.
Äldre null-val betyder inga overrides. Originalbild och beskärning bevaras.

Den gemensamma renderaren skapar en explicit `cv-header` med
`cv-header-content` och en separat `cv-photo-slot`. Bilden är presentationsdata,
aldrig ett CV-block. Headern använder en fast bildkolumn och en textkolumn
`minmax(0, 1fr)`. Mallarna väljer sida, mått och avstånd; användaren väljer mask.
Bilden fyller slotten med `width/height:100%` och `object-fit:cover`.
Sparad position och zoom appliceras inom slotten; bildens naturliga storlek
bestämmer aldrig dokumentgeometrin.

Namn, kontaktuppgifter och inledande profiltext hör till headern. Experience och
andra CV-sektioner är syskon efter headern, aldrig delar av bildens grid.
Deras bredd och datumkolumner är identiska med och utan bild. Studio behåller
sin separata datumkolumn på 34 mm; fotot skapar ingen ny kroppskolumn.
En kort header måste rymma porträttets fasta höjd. Det kan flytta ned nästa
sektion; oförändrad vertikal startposition utlovas därför inte. Det ersätter
DEV-310:s miniatyrbild och DEV-311:s flöde av Experience bredvid bilden.

Utan foto försvinner hela bildkolumnen och texten får full bredd. Lång profiltext
kan delas över sidor; fortsättningssidan har ingen bildkolumn. Källtext och stabila
block-ID:n bevaras. Ingen textstorlek, sidmarginal eller merit ändras.

`cv-portrait.js` äger lokal kravtolkning, originalfil,
val och beskärning. Automatisk kravigenkänning är avsiktligt begränsad till
tydliga svenska/engelska CV-formuleringar; den ersätter inte förståelse av alla
språk eller fri text. Äldre sparade manuella dropdownval används inte längre.
Nytt annonsunderlag återställer frivilligt bildval till standard,
men behåller fil och beskärning. Visningsmodellen använder tillfällig blob-URL
och originalets avkodade dimensioner; URL:en sparas inte som beständig data.

Bildhantering öppnas via **Add photo** vid den första sidans porträttposition,
eller genom klick på befintlig bild. Add photo ligger som en absolut placerad
redigeringskontroll ovanför innehållet i samma porträttkolumn, så att den inte
skymmer långa namn, reserverar bildyta eller påverkar sidräkning. Både den och
bildens klickyta tas bort ur utskriftskopian och döljs vid utskrift.
Dialogen väljer/byter fil genom klick i förhandsvisningen, utan separat filvalsknapp. Den innehåller **Square / Rounded / Circle**, dragbar beskärning,
**Zoom**, **Save**, **Cancel** och **Remove photo** när en bild finns.
Klick öppnar filväljaren; dragning flyttar bilden utan att öppna filväljaren. Enter/mellanslag öppnar filväljaren från beskärningsytan. Dragning stöder mus/pekdon; piltangenter i förhandsvisningen ger motsvarande
justering. Bildproportioner bevaras. Förhandsvisningen visar exakt vald form och
beskärning med samma bildkoordinater som CV och PDF. Formval sparas med övrig
beskärning och behålls vid omladdning/bildbyte. Save aktiverar bilden, Cancel lämnar sparat tillstånd
oförändrat. Remove photo tar bort porträttet ur representationen och behåller
original och beskärning. En tidigare bortvald bild kan återaktiveras via Save.
Uttryckligt krav på bildlöst CV förhindrar användning av porträtt och ger ett
kort besked; obligatoriskt saknat CV-porträtt ger ett konkret exportbesked.

Arbetsytan sparar originalets oförändrade `File` i befintlig IndexedDB-fillagring
och presentationsinställningar i arbetsytans tillstånd. Bildbyte ersätter denna
arbetsytas tidigare porträtt; full bildhistorik/profil är inte införd.
JPEG, PNG och WebP upp till 12 MB/40 megapixlar stöds. Ursprungliga PDF-foton
extraheras inte automatiskt; porträtt väljs uttryckligen av användaren.
Bilddata går inte till tailoring, Discovery eller andra AI-anrop. Ingen webhook-
eller canonical-block-schemaändring införs. Den aktuella browser-PDF-exporten
använder samma sid-DOM och inväntar bilder i utskriftsramen.

## Researchbedömning

Research considered: LIT-001 och LIT-002 bedömda för relevans; inget direkt stöd
för CV-porträtt, bildmått eller bildlöst standardläge i dessa poster. Lästa
2026-11-08 via [Research-indexet](https://drive.google.com/file/d/16km5FY1QIaoyLNbu8b_dB2tiqr5Q1rqy/view)
och [ledger-exporten](https://drive.google.com/file/d/1Cj7glneHE3P_3Pq3iu9KDtiEOwXcQj_8/view),
export 2026-11-07 19:14 CET, ledger-källa senast ändrad 2026-09-23 20:45.
Metod, population, osäkerhet och begränsningar lästa: systematisk review respektive
explorativ finländsk utbildnings-/karriärvägledningsstudie, inte CV-bildstudier.
Enskild acceptans för syntes och motsägelsesökning är fortsatt utestående;
exportens historiska täckning är ofullständig och automatisk uppdatering är inte
verifierad. Inga empiriska påståenden om porträttens effekt görs. Reglerna ovan
kommer från ägarens beställning; Research ändras inte.

## Verifiering

Avgränsade tester: explicita krav/negationer/separata bilder, inga titelbaserade
krav, beskärning, alla fem mallar med/utan bild, långa identitetsfält, inga
överlapp/klipp, bildlöst utrymmesutnyttjande, originalfil efter omladdning,
zoomoberoende sidantal och faktisk PDF från samma utskrifts-DOM. Textblock och
Accept/Decline/Edit-kontrakt ska förbli oförändrade. Ingen modellkvalitet påstås
vara verifierad av dessa deterministiska lokala kontroller.
