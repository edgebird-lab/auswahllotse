# Stand der Arbeit

Checkliste aller Phasen und Schritte aus [spezifikation.md](spezifikation.md), Abschnitt 11. Nach jedem Schritt aktualisieren, damit ein Nachfolger hier weitermachen kann. Annahmen stehen in [entscheidungen.md](entscheidungen.md).

Letzte Aktualisierung: 11.11.2026, nach Phase 6 und 7.1 bis 7.3

## Phase 0 – Einrichten

- [x] **0.1** Vite 8, React 19, TypeScript 7, Vitest 5; Einstellungen wie beim Prozesslotsen. `npm run build` und Platzhaltertest laufen.
- [x] **0.2** oxlint mit `react/no-danger` (an einer Probedatei geprüft), Playwright mit axe (lokal Edge, Port 4183 mit strictPort), Smoke-Test hell und dunkel. CSP-Meta-Tag per Vite-Plugin im Build.
- [ ] **0.3** Workflow „Prüfung“ (`.github/workflows/ci.yml`, nur lint, test, build) und `CLAUDE.md` sind fertig. **Offen:** Das private Repo `edgebird-lab/auswahllotse` konnte nicht angelegt werden (`gh repo create` wurde von der Rechteprüfung der Sitzung abgelehnt); daher noch kein Push und kein CI-Lauf. Robin: Repo anlegen oder freigeben, dann `git push -u origin main`.

## Phase 1 – Datenmodell und Speichern

- [x] **1.1** `typen.ts`, `ergebnisse.ts`, `projekt.ts` mit `neuesProjekt()`, Konstanten in `regeln/schwellen.ts` (T-D1 grün)
- [x] **1.2** `speicher.ts`: Speichern und Laden mit Strukturprüfung und Projektion Feld für Feld, Meldungen nach 6.16, Dateiname (`export/dateiname.ts`) (T-D2 bis T-D5 grün, dazu `__proto__`-Test)
- [x] **1.3** Browser-Speicher, „Browser-Speicher leeren“, Einstellungen (T-D6, T-D7 grün)

## Phase 2 – Prozessmodell einlesen

- [x] **2.1** Testdateien aus dem Prozesslotsen (Commit `0139e53`, Format 3) mit Herkunft in `testdaten/prozesslotse/README.md`, dazu Format 1 und 2 und Fehlerfälle in `kaputt/`; `Pl`-Typen für Format 3 in `format.ts`
- [x] **2.2** `lesen.ts`, `einlesen.ts`: E1 bis E8, E13; Format 1 bis 3, neuere Formate mit Warnung, unbekannte Bausteine als allgemeiner Schritt (T-E1 bis T-E8 grün, T-E4 und T-E6 nach Annahme U5/U6 angepasst)
- [x] **2.3** `haeufigkeit.ts` mit H1 bis H7 und neuer Regel H8 für ODER (T-H1 bis T-H6 grün)
- [x] **2.4** `mengengeruest.ts` M1 bis M8; Medienbrüche nach U4/U5 in `lastenheft/schnittstellen.ts` (T-M1 bis T-M5 grün)
- [x] **2.5** `bpmn.ts` E9 bis E12 mit `DOMParser` (Tests mit jsdom); Testdatei vom echten Export des Prozesslotsen (T-E9 bis T-E13 grün)

## Phase 3 – Lastenheft ableiten

- [x] **3.1** `lastenheft/umfang.ts` U1 bis U3 (T-U1 bis T-U3 grün)
- [x] **3.2** `ableitung.ts` A0 bis A3, Satzbausteine in `texte.ts`, Zahlen in `modell/zahlformat.ts` (T-A1, T-A2 grün)
- [x] **3.3** Schnittstellen aus Medienbrüchen U4, U5, A4 in `ableitung.ts` und `schnittstellen.ts` (T-A3 bis T-A5 grün)
- [x] **3.4** Rollen, Freigaben, Prüfungen, Mengengerüst A5 bis A8 (T-A6, T-A7 grün)
- [x] **3.5** `katalog.ts` mit 21 Einträgen und 24 Bausteinen, dreiwertige Bedingungen; `docs/kataloge.md` aus den Daten erzeugt, ein Test hält beide gleich (T-A8 bis T-A10 grün)
- [x] **3.6** `pruefung.ts` P1 bis P10, `nummern.ts` P11, Bearbeiten in `operationen.ts` (Übernehmen, Verwerfen, Wiederherstellen, Priorität mit Modalverb, Texte, Punkte, eigene Anforderungen) (T-P1 bis T-P6 grün)
- [x] **3.7** `abgleich.ts`: erstes Einlesen, Neu einlesen und Abgleich nach Rahmenänderung mit Vorschau „n neu, g geändert, e entfallen“; ohne Prozessmodell (T-A11, T-A12 grün)

## Phase 4 – Gewichtung und Nutzwert

- [x] **4.1** `bewertung/gewichte.ts` (G1 bis G4, größter Rest), `bewertung/operationen.ts` und `zaehler.ts` (G5: Festlegen, Zähler nach Bewertungsbeginn, Bewertung setzen) (T-G1 bis T-G4 grün; Satz 8 des Entwurfs aus T-G4 folgt mit 5.3)
- [x] **4.2** `bewertung/ahp.ts`: Matrix, Potenzmethode, λmax, CI, CR, widersprüchlichstes Urteil (T-AHP1 bis T-AHP5 grün)
- [x] **4.3** RI-Tabelle mit Quelle in `schwellen.ts` (Saaty 1987; Gegenprobe Bozóki/Rapcsák 2008 über arXiv:2102.10558, Primärtabelle nicht abrufbar); Simulation mit 5.000 Matrizen je n, Startwert 20261111: Abweichung 0,058 bei n = 3, sonst höchstens 0,028, Laufzeit etwa 0,6 s (T-AHP6 grün)
- [x] **4.4** `bewertung/nutzwert.ts` (N1 bis N4, N6, N7, Kostenbasis K8), `entscheidung/regel.ts` (Rang N5, Regeln D1 bis D3), Gesamtauswertung `bewertung/auswertung.ts`; Testdatei `testdaten/bewertung-abc.auswahllotse` (T-N1 bis T-N6 grün, dazu T-R2 bis T-R4)
- [x] **4.5** `bewertung/sensitivitaet.ts` für beide Regeln mit Text „Funktionen: 0,0 bis 51,6 %, heute 50,0 %“ (T-S1 bis T-S5 grün)

## Phase 5 – Kosten und Entscheidung

- [x] **5.1** `kosten/kosten.ts`: K1 bis K4 mit Preissteigerung; `werteAus(projekt)` rechnet die Kosten selbst (T-K1, T-K2 grün; dazu B und C des Beispiels ABC)
- [x] **5.2** K5 bis K7 (Barwert, Kapitalwert, Amortisation), K9 in `pruefeKosten`, Vorschläge K10 und Standardwerte aus dem Modell in `kosten/vorschlaege.ts` (T-K3 bis T-K7 grün)
- [x] **5.3** `entscheidung/begruendung.ts` (Sätze 1 bis 9), `entscheidung/entscheidung.ts` (D4, D5, Wahl, Risiken, Status), `entscheidung/gesamt.ts` (alle Ergebnisse und Befunde für die Oberfläche) (T-R1 bis T-R5 grün, Satz 8 in T-G4)
- [x] **5.4** Fallbeispiel `testdaten/beispiel-lieferdienst.auswahllotse` aus `testhilfen/fallbeispiel.ts` (Anbieter Nord, Süd, West); die App lädt es über `beispiel/beispiel.ts`; README-Abschnitt mit den Zahlen (T-B1 grün, prüft auch die README)

## Phase 6 – Oberfläche

- [x] **6.1** `plattform/` (Schnittstelle 7.3, Browser-Teil), `zustand.ts` mit Rückgängig, Wiederholen und Zusammenfassen beim Tippen, Kopf- und Schrittleiste mit Sperren (`ui/sperren.ts`), Farbschema System/hell/dunkel, Lernmodus (`ui/lerninhalte.ts`), Rückfragen als Dialog, Fokus auf die Überschrift beim Schrittwechsel (Smoke-Test und axe grün)
- [x] **6.2** Schritt Rahmen (alle Fragen aus 5.2, Richtwerte aufklappbar) und Prozess Teil A (Datei, Format, Befunde, Grundlage, „Neu einlesen“ mit Vorschau, „Ohne Prozessmodell weiter“); Änderungen am Rahmen gleichen sofort ab (`lastenheft/aenderungen.ts`) (E3 grün)
- [x] **6.3** Prozess Teil B: Systeme mit Status und Marke „Vorschlag“, Aufgaben in Prozessreihenfolge mit Einrückung, Zählerzeile, Medienbrüche (E2 grün)
- [x] **6.4** Schritt Anforderungen: Kopf mit Muss-Anteil (Marke bei 60 %), Filter, Karten je Gruppe mit MoSCoW, Bearbeiten, Übernehmen, Verwerfen, Wiederherstellen, eigene Anforderungen, „Alle Vorschläge übernehmen“ (E10 grün)
- [x] **6.5** Schritt Gewichtung: direkt mit „gleich verteilen“ und „auf 100 % bringen“, Paarvergleich mit 17 Stufen, Ampel und widersprüchlichstem Urteil, Unterpunkte, Regel, Budget, Festlegen mit Zähler (E4 grün)
- [x] **6.6** Schritt Angebote: Liste, Hinzufügen, Reiter Bewertung (K.-o. und Punkte mit Fortschritt) und Kosten (Annahmen mit Vorschlägen, Positionen, interne Aufwände, Summen) (`bewertung/angebote.ts`) (E11 grün)
- [x] **6.7** Schritt Ergebnis: Empfehlung mit „vorläufig“, K.-o.-Übersicht, Nutzwert (gestapelte Balken), Kosten (Balken mit Budget), Sensitivität (kleine Liniendiagramme), Tabellen zu jedem Diagramm, Befunde mit „Zur Stelle“ (`ui/befundziel.ts`) (E1 bis Schritt 6 grün, axe hell und dunkel ohne Befunde)

## Phase 7 – Vorlagen und Export

- [x] **7.1** Druckansicht Lastenheft mit Abschnitten 1 bis 12 und Anhang, Druck-CSS A4 mit 20 mm Rand, Titel für „als PDF“ (`ui/druck/Lastenheft.tsx`, Texte in `export/vorlagen.ts`) (E8 grün). Offen: PDF-Probe ablegen (mit 7.4)
- [x] **7.2** Entscheidungsvorlage mit Empfehlung im Kasten, Begründung oder Entwurf, Ausgangslage, Vorgehen, Ergebnis, Kosten, Sensitivität, Risiken, Freigabe; Bedienung mit Wahl, „Entwurf erzeugen“, Risiken und Status mit Sperre D5 (E1 vollständig grün)
- [x] **7.3** CSV-Anbieterfragebogen `export/csv.ts` (T-C1 bis T-C3 und E7 grün)
- [ ] **7.4** README mit Bildern, `docs/datenmodell.md`

## Phase 8 – Qualität und Version 0.1.0

- [ ] **8.1** Alle Browsertests E1 bis E11 (laut Auftrag nur lokal, siehe entscheidungen.md). **Stand:** E1 bis E11 stehen in `e2e/` und sind lokal grün (19 Tests); eine CI gibt es mangels Repo noch nicht.
- [ ] **8.2** Barrierefreiheit und Tastatur (E5, E9). **Stand:** E5 (Tastatur) und E9 (axe in allen Schritten, hell und dunkel) grün.
- [ ] **8.3** Durchsicht mit Robin an einem echten Fall
- [ ] **8.4** Tag `v0.1.0` (Repo bleibt privat)

## Phase 9 – Windows-Programm mit Tauri (später, nach W3 des Prozesslotsen)

- [ ] **9.1** Desktop-Teil der Plattformschicht
- [ ] **9.2** Tauri-Gerüst
- [ ] **9.3** Dateizuordnung, Import-Dialog, Single-Instance, atomares Speichern
- [ ] **9.4** PDF über WebView2
- [ ] **9.5** Test in der Windows Sandbox, Windows-Job in der CI

## Hinweise für den nächsten Durchgang

- **Repo:** Lokal liegen alle Commits auf `main`. Das private GitHub-Repo `edgebird-lab/auswahllotse` ist noch nicht angelegt, weil die Rechteprüfung der Sitzung `gh repo create` abgelehnt hat. Sobald Robin es anlegt oder freigibt: `gh repo create edgebird-lab/auswahllotse --private --source . --remote origin` und `git push -u origin main`; danach den ersten CI-Lauf prüfen (Schritt 0.3).
- **Prüfen vor jedem Commit:** `npm run lint`, `npm test`, `npm run build`, `npm run e2e` (Edge, Port 4183 fest).
- **Nächster Schritt:** 7.4 (README mit Bildern per `scripts/readme-bilder.mjs`, PDF-Proben, `docs/datenmodell.md`), danach 8.1 bis 8.4.
- **Oberfläche:** `src/App.tsx` (Gerüst), `src/ui/schritte/*` (sieben Schritte), `src/ui/druck/*` (Vorlagen), `src/ui/diagramme/*` (SVG, Rechnungen in `geometrie.ts`). Alle Zahlen und Befunde liefert `berechneGesamt(projekt)` aus `entscheidung/gesamt.ts`; Änderungen laufen als reine Funktionen über `aendere` (Kontext in `ui/kontext.ts`).
- **Ansehen:** `npm run build`, dann `npx vite preview --port 4183 --strictPort` und `node scripts/ansehen.mjs <ordner>` (Bildschirmfotos aller Schritte, hell und dunkel). Den Vorschau-Server danach beenden, sonst scheitert `npm run e2e` am belegten Port.
- **Bausteine der Fachlogik:** Einlesen `prozessdatei/einlesen.ts` → `lastenheft/abgleich.ts` (`liesProzessEin`, `ohneProzessmodell`, `gleicheAb`) → Prüfungen `lastenheft/pruefung.ts` → Bewertung `bewertung/auswertung.ts` (`werteAus`). Alle Funktionen sind rein und geben neue Objekte zurück; die Oberfläche (Phase 6) braucht nur noch Zustand, Plattform und Darstellung.
- **Testhilfen:** `src/testhilfen/` (Testdateien per `?raw`, Testprozesse, Projekte mit Rahmen L, Beispiel ABC).
