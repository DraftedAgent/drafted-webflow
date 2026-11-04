> Historical pre-implementation review (DEV-248). Local implementation and current pending backend scope are now documented in APPROVAL.md (DEV-249); the observations below describe the earlier prototype.

# Granskning inför beslut — 2026-11-04

Ingen extern läsning/ändring eller betalt anrop utfördes under denna granskning. Underlaget var den tidigare säkrade, privata körning434 och aktuell lokal kod. APPROVAL.md har preciserats; den äldre översikten bevaras som APPROVAL-initial.md.

## Hinder för att godkänna aktivering nu

- Prototypens accept kontrollerar baseline men omvaliderar inte kandidatblocks/receipts; ändrad kandidat kan därmed accepteras i prototypen. Den är inte kopplad till produktions-Apply. Produktionskandidaten måste deterministiskt återberäknas och valideras från fryst request+patch. Nytt test krävs för muterat block, extra block, bytt kvitto, källrevision och annons.
- Prototypen antar trusted normalized input och allowedBlockIds; detta är inte en servervaliderad rårequest. Produktionsservern måste själv lösa befintligt experienceContext och ge exekveringsbundna keys.
- Prototypkvittot är på blocknivå. Den föreslagna1.3-varianten behöver segmentkopplingar till CV-original respektive alla aktuella svar, och uttrycklig supersession för tidigare integreringar. Den får inte kasta tidigare ledgerhistorik eller ta härledd text som oberoende CV-fakta.
- Prototypens baseline saknar komplett annons/katalog och ursprunglig ledger i normaliserade testfall.1.3 ska ha verifierade data plus inputRef för alla dessa. Befintlig cvVersionId kan vara cv_v1 över ändringar; hashkontroll är obligatorisk.
- Nuvarande språkdialog nås inte efter tidig return för applied/review. Befintligt en utan cvLanguageConfirmed är dessutom ett gammalt defaultvärde, inte ägarens val. Flaggans sanningsvärde ensamt validerar inte språkenum. Dessa två fall måste rättas och testas före release.
- Historisk coveragekörning är inte sparad i n8n; original PDF-bytes, full aktuell browserledger och katalog kan inte härledas ur434 ensam. Tre-anropstestet kräver först en privat webbläsarsnapshot, eller måste stoppas utan nya ankaranrop.

## Vad som redan stöds

Deterministisk append1.2, strikta original-citat, ursprungliga källsvar/revisioner, explicit sammanhang och blockidentitet, frikopplad Preview, separat användar-Apply och coveragehashar kan återanvändas. Ingen ny router, modell, databas eller personprofil krävs. De lokala testerna av befintligt flöde visar inte att1.3 redan är implementerat.

## Rekommenderat godkännande i två steg

1. Godkänn det preciserade1.3-kontraktet och lokal implementation inklusive språk/ledger/migrering, ingen extern aktivering eller kostnad. Därefter framställs exakta1.3-kandidater för de två Tailor Code-noderna, full diff, negativa tester och återställningsbevis.
2. När den leveransen har granskats: separat godkännande av exakt aktivering och högst3 riktiga workflow-/modelloperationer enligt APPROVAL.md, inga automatiska retries, inget webbsläpp. De valfria1.2-promptpatcharna är ett eget, begränsat scope och ska inte blandas ihop med full integration.

Ingen formell DD har skapats och kontraktsdokumentet i contracts/ är inte ändrat; detta är ett förslag till ägarbeslut.
