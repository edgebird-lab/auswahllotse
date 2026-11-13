# Stand der Arbeit

Checkliste aller Phasen und Schritte aus [spezifikation.md](spezifikation.md), Abschnitt 11. Nach jedem Schritt aktualisieren, damit ein Nachfolger hier weitermachen kann. Annahmen stehen in [entscheidungen.md](entscheidungen.md).

Letzte Aktualisierung: 13.11.2026, Version 0.2.0 (B.3) mit dem Export im offenen Format Beratungsakte v1 (B.1, Nacharbeit B.2); davor 11.11.2026 Version 0.1.0 veröffentlicht

## Phase 0 – Einrichten

- [x] **0.1** Vite 8, React 19, TypeScript 7, Vitest 5; Einstellungen wie beim Prozesslotsen. `npm run build` und Platzhaltertest laufen.
- [x] **0.2** oxlint mit `react/no-danger` (an einer Probedatei geprüft), Playwright mit axe (lokal Edge, Port 4183 mit strictPort), Smoke-Test hell und dunkel. CSP-Meta-Tag per Vite-Plugin im Build.
- [x] **0.3** Workflow „Prüfung“ (`.github/workflows/ci.yml`, nur lint, test, build) und `CLAUDE.md`. Das private Repo `edgebird-lab/auswahllotse` gibt es seit 11.11.2026 (auf Robins Bitte angelegt); erster CI-Lauf am selben Tag grün.

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

- [x] **7.1** Druckansicht Lastenheft mit Abschnitten 1 bis 12 und Anhang, Druck-CSS A4 mit 20 mm Rand, Titel für „als PDF“ (`ui/druck/Lastenheft.tsx`, Texte in `export/vorlagen.ts`) (E8 grün); PDF-Proben beider Vorlagen in `docs/proben/` (Lastenheft 9 Seiten, Entscheidungsvorlage 3 Seiten)
- [x] **7.2** Entscheidungsvorlage mit Empfehlung im Kasten, Begründung oder Entwurf, Ausgangslage, Vorgehen, Ergebnis, Kosten, Sensitivität, Risiken, Freigabe; Bedienung mit Wahl, „Entwurf erzeugen“, Risiken und Status mit Sperre D5 (E1 vollständig grün)
- [x] **7.3** CSV-Anbieterfragebogen `export/csv.ts` (T-C1 bis T-C3 und E7 grün)
- [x] **7.4** README mit Bildern, Fallbeispiel, Formeln, Daten und Sicherheit, Bedienung und Grenzen; Bilder und PDF-Proben per `scripts/readme-bilder.mjs`; `docs/datenmodell.md` als Kurzfassung des Dateiformats

## Phase 8 – Qualität und Version 0.1.0

- [x] **8.1** Browsertests E1 bis E11 in `e2e/` (seit der Prüfung 22 Tests), lokal mit Edge grün. Laut Auftrag läuft die CI nur mit lint, test und build (U1); seit 11.11.2026 grün. `npm audit`: 0 Schwachstellen (11.11.2026).
- [x] **8.2** Barrierefreiheit und Tastatur: E9 (axe in allen Schritten und Reitern, hell und dunkel, dazu Farbschema-Wahl) und E5 (ganzer Durchlauf nur mit Tastatur, Fokus auf die Überschrift beim Schrittwechsel) grün; jedes Eingabefeld beschriftet.
- [ ] **8.3** Durchsicht mit Robin an einem echten Fall. **Offen, braucht Robin.** Vorschlag für die Durchsicht: ein eigenes Prozessmodell aus dem Prozesslotsen einlesen, Umfang und Vorschläge prüfen, zwei echte Angebote erfassen und die Entscheidungsvorlage als PDF lesen; besonders Kataloginhalte (offene Frage 4) und Satzmuster der Anforderungen. Befunde als Issues im Repo.
- [x] **8.4** Tag `v0.1.0` am 11.11.2026. **Hinweis:** Die Durchsicht 8.3 an einem echten Fall steht noch aus. Robin hat ausdrücklich entschieden, dass seine Freigabe zur Veröffentlichung auch für den Tag gilt (U52); Befunde der Durchsicht kommen in 0.1.x. Version 0.1.0 in `package.json` (daraus `tauri.conf.json`), `Cargo.toml` und `App.tsx` (Anzeige im Fuß und unter „Hilfe > Über“); der Release-Lauf bricht ab, wenn eine davon nicht zum Tag passt. Vorbereitung zur Veröffentlichung: ganze Git-Historie auf Geheimnisse, persönliche Daten und fremdes geschütztes Material geprüft (ohne Befund), README für Besucher (Download, Installieren, Rechte), `docs/fremdlizenzen.md` (erzeugt mit `scripts/fremdlizenzen.mjs`), Release-Notizen auf Deutsch. **Veröffentlicht am 11.11.2026:** Tag `v0.1.0` auf Commit `0bda0d2`, Release https://github.com/edgebird-lab/auswahllotse/releases/tag/v0.1.0 (latest) mit `Auswahl-Lotse_0.1.0_x64-setup.exe` und `Auswahl-Lotse-Setup.exe` (beide 1.324.534 Bytes, gleiche SHA-256). Das Repo ist seit dem 11.11.2026 öffentlich; der Download-Link funktioniert ohne Anmeldung.

## Phase 9 – Windows-Programm mit Tauri

Auf Robins ausdrücklichen Wunsch am 11.11.2026 vorgezogen („richtige Software mit exe“, vom Desktop zu starten); Vorbild ist das Windows-Programm des Prozesslotsen (W0 bis W5).

- [x] **9.1** Plattformschicht `src/plattform`: Schnittstelle `typen.ts` um Startdatei, weitere Dateien, Menü, PDF erweitert; `desktop.ts` ruft die Rust-Befehle und lädt `@tauri-apps/api` nur per dynamischem Import; `index.ts` wählt anhand von `__TAURI_INTERNALS__`. Oberfläche: Speichern an den bekannten Pfad, Speichern unter (Strg+Umschalt+S), Öffnen- und Einlese-Dialog, Rückfrage beim Schließen („Nicht speichern“ vergisst den gesicherten Stand), Dateien aus dem Explorer werden nach Endung und Merkmal `app` geöffnet oder eingelesen (`istProjektdatei`). Browser-Fassung unverändert (Texte, Knöpfe und Abläufe gleich; 22 Browsertests grün).
- [x] **9.2** Tauri-Gerüst in `src-tauri`: App-ID `de.olbricht-digital.auswahllotse`, Produktname „Auswahl-Lotse“, eigenes Symbol (`icons/symbol.svg`, drei Angebote als Balken, das beste mit Haken; erzeugt mit `npx tauri icon`), Fenster 1360 × 860, Menü „Datei“ und „Hilfe“. CSP ohne `'unsafe-inline'` (`style-src 'self'`, `connect-src` nur IPC), `freezePrototype: true` (läuft, anders als beim Prozesslotsen). Rechte: nur `core:event:default`, Fenstertitel, Schließen und die sechs eigenen Befehle; kein Dialog- oder Datei-Plugin für die Oberfläche. Das CSP-Meta-Tag des Web-Builds entfällt im Tauri-Build (`TAURI_ENV_PLATFORM`), sonst sperrte `connect-src 'none'` die IPC. NSIS pro Benutzer, deutsch, WebView2 per Bootstrapper. Installer `Auswahl-Lotse_0.0.0_x64-setup.exe`: 1,26 MiB; installiert 3,5 MB (`auswahllotse.exe`) plus Deinstaller.
- [x] **9.3** Zuordnung nur `.auswahllotse` (Rolle Editor, MIME `application/vnd.auswahllotse+json`); Einlese-Dialog für `.prozesslotse`, `.json`, `.bpmn`; Single-Instance (zweiter Start übergibt die Datei); Ziehen ins Fenster; atomares Speichern über `.speichern.tmp` und Umbenennen. Freigegeben zum Schreiben werden nur Pfade aus „Speichern unter“ und geöffnete Dateien mit `"app": "auswahllotse"`; eingelesene Prozesslotse-Dateien nie. Fehlt beim Speichern unter die Endung, wird sie angehängt, nicht ersetzt.
- [x] **9.4** PDF über WebView2 (`PrintToPdf`, A4, 20 mm Rand, ohne Kopf- und Fußzeile) für Lastenheft und Entscheidungsvorlage; der PDF-Titel ist der Dateiname-Vorschlag. Knopf „Als PDF speichern …“ nur im Programm, „Drucken …“ öffnet den Druckdialog.
- [x] **9.5** Tests: 6 Rust-Tests (`cargo test`), Desktop-Test `npm run desktop:test` mit 48 Prüfungen (Start, Speichern, Einlesen, Rechte, CSV, PDF beider Vorlagen, zweiter Start mit Projekt und Prozessdatei, Öffnen-Dialog, Rückfrage beim Schließen, Neustart). Windows Sandbox gibt es unter Windows 11 Home nicht; dafür installiert die CI (`windows.yml`) auf einem frischen Runner still, prüft Zuordnung und Verknüpfungen und deinstalliert (`src-tauri/windows/installer-test.ps1`). Ohne Admin-Rechte bestätigt die Installation auf Robins Rechner (siehe unten). `release.yml` legt bei einem Tag einen Release-Entwurf an, mit dem Installer und einer Kopie `Auswahl-Lotse-Setup.exe` mit festem Namen.

**Installation auf Robins Rechner (11.11.2026, auf seinen Wunsch):** Release-Build mit `npx tauri build`, Installer still (`/S`) ohne Admin-Rechte ausgeführt, Rückgabewert 0. Programm in `%LOCALAPPDATA%\Auswahl-Lotse\auswahllotse.exe`; Startmenü-Eintrag und Desktop-Verknüpfung „Auswahl-Lotse“ hat der Installer selbst angelegt; `.auswahllotse` zeigt auf `AuswahlLotse.Projekt` (`"…\auswahllotse.exe" "%1"`), `.prozesslotse` und `.bpmn` sind unberührt; Eintrag „Auswahl-Lotse 0.0.0“ unter Apps. Startprobe über die WebView2-Debugschnittstelle: direkter Start zeigt „1 · Rahmen“ mit Titel „Neues Vorhaben – Auswahl-Lotse“; Öffnen einer Kopie von `beispiel-lieferdienst.auswahllotse` über die Dateizuordnung (wie Doppelklick) zeigt „6 · Ergebnis“ mit dem Dateinamen im Titel; beide Male sauber geschlossen. Die dabei angelegten Programmdaten wurden danach entfernt, damit der erste eigene Start leer beginnt. Neue Fassung installieren: Installer erneut ausführen (ersetzt die alte); entfernen über Einstellungen > Apps.

## Export im offenen Format Beratungsakte v1

- [x] **B.1** Export „Für die Beratungsakte speichern“ im Schritt „Vorlagen“ (13.11.2026): Abbildung in `src/export/beratungsakte.ts` (Annahme U64), Dialog `src/ui/BeratungsakteDialog.tsx`, Befehl `beratungsakte` in `ui/datei.ts`, Dateiart `beratungsakte` in der Plattformschicht und in `speichern_unter` (zweiteilige Endung `.beratungsakte.json`). Kopie der Bibliothek 1.0.1 in `src/beratungsakte/`, Beispiele in `testdaten/beratungsakte/`. Version an einer Stelle in `src/version.ts` (der Release-Lauf prüft sie dort). Tests: 25 Unit-Tests, 4 Browsertests, 1 Rust-Test, 3 Prüfungen im Desktop-Test.
- [x] **B.2** Nacharbeit (13.11.2026): Hinweise werden `hinweis` statt `niedrig`; Hinweis im Dialog, dass die Datei unverschlüsselt ist und Daten des Mandanten enthält; `mit_endung` macht aus „x.json“ „x.beratungsakte.json“ statt „x.json.beratungsakte.json“ (Rust-Test); die reinen Hilfen `befundziel.ts` und `befundMitAnforderung`/`kostenbasisText` liegen jetzt in `src/modell/` statt in `src/ui/`.
- [x] **B.3** Version 0.2.0 (13.11.2026): Version in `package.json`, `Cargo.toml` und `src/version.ts`, `docs/fremdlizenzen.md` neu erzeugt. Geprüft: Lint, Unit-Tests, Build, Browsertests (`--workers=2`), `cargo test`, Debug-Build und `npm run desktop:test`. Tag `v0.2.0`, Release-Entwurf von `release.yml`, nach Prüfung veröffentlicht.

## Prüfung vom 11.11.2026

Kritische Prüfung gegen die Spezifikation für den gebauten Umfang (Phasen 0 bis 8.2). Vorgehen: Fallbeispiel unabhängig in Python nachgerechnet (Nutzwerte 8,52 / 7,70 / 5,49, Gesamtkosten 54.517 / 93.088 / 35.230 €, Kapitalwerte 123.892 / 86.200 €, Amortisation im 1. und 2. Jahr, Funktionen stabil bis 57,1 %: alles wie in App und README), T-K1 bis T-K5 und T-AHP3 von Hand nachgerechnet, Formeln Zeile für Zeile mit 6.2 bis 6.13 verglichen, ODER-Rechnung mit dem Prozesslotsen verglichen, App im Browser durchgeklickt (alle Schritte hell und dunkel, Handy-Breite, beschädigte Projektdateien, Format 4 speichern und neu öffnen, Angebote löschen, anderes Modell neu einlesen, Softwareart wechseln, ohne Modell), PDF-Proben Seite für Seite angesehen.

Gefunden und behoben, jeweils mit Test (Annahmen U53 bis U61 in [entscheidungen.md](entscheidungen.md)):

1. **Tausenderpunkt:** „90.000“ im Budget ergab 90 €, „1.234.567“ wurde gar nicht übernommen. `ui/texte.ts` `leseZahl` liest jetzt Dreiergruppen als Tausender (U53). Tests: `ui/texte.test.ts`, Browsertest „Beträge mit Tausenderpunkt …“.
2. **Änderungszähler beim Tippen (G5):** Jeder Tastendruck zählte; „90.000“ und „40“ ergaben „5-mal geändert“ in der Vorlage. Eine Eingabe zählt jetzt höchstens einmal, zurück zum Ausgangswert gar nicht (`bewertung/zaehler.ts`, `zustand.ts`, U54). Tests: `zustand.test.ts`, Browsertest.
3. **Änderungszähler bei Abgleichen (G5):** „Neu einlesen“ eines anderen Modells nach Bewertungsbeginn (8 Anforderungen entfallen) ließ die Vorlage „nicht geändert“ schreiben. Abgleiche, die aktive Anforderungen verschieben, zählen jetzt einmal; die Texte nennen „Gewichte, Anforderungen oder Regel“ (U61). Tests: `lastenheft/aenderungen.test.ts`.
4. **Rundung:** 35 % · 3/12 = 8,75 % erschien als 8,7 % (Gleitkommafehler); „-0,0“ war möglich. `modell/zahlformat.ts` bereinigt vor dem Runden (U55). Tests: `modell/zahlformat.test.ts`.
5. **P8:** Eine Gruppe nur mit „Nicht“ bekam „wirkt nur als K.-o.“ (U56). Test in `lastenheft/pruefung.test.ts`.
6. **D3:** Schied jedes Angebot nur am Budget aus (Budget als K.-o.), hieß es „Kein Angebot erfüllt alle Muss-Kriterien“ (U57). Test in `bewertung/nutzwert.test.ts`.
7. **D5 nach dem Festlegen:** Eine finale Entscheidung blieb ohne Hinweis final, wenn später Fehler dazukamen; jetzt Warnung D5 mit Sprung zur Bedienung (U58). Test in `entscheidung/begruendung.test.ts`.
8. **Einzahl:** „Heute laufen 1 Vorgänge pro Tag“, „1 Datensätze“, „1 Übertragungen“, „1 Rollen“ in Lastenheft, Vorlage und Prozess-Karte (U59). Test in `export/vorlagen.test.ts`.
9. **Stiller Datenverlust:** Ein unlesbarer Stand im Browser-Speicher wurde beim Start sofort vom neuen Projekt überschrieben. Jetzt Kopie, Meldung und „Kopie herunterladen“ (U60). Tests: `modell/speicher.test.ts`, Browsertest.
10. **Doppelte Kennungen:** Projektdateien mit doppelten Kennungen bei Anforderungen, Angeboten, Kostenpositionen oder Risiken wurden geöffnet; Bewertungen und Bearbeiten trafen dann den falschen Eintrag. Jetzt Meldung „Kennung … kommt doppelt vor“ mit Stelle. Test in `modell/speicher.test.ts`.
11. **Befunde ohne Bezug:** Die Gesamtliste im Ergebnis zeigte „Der Text hat 44 Wörter; bitte aufteilen.“ ohne zu sagen, welche Anforderung. Jetzt „R-01: …“ (`ui/texte.ts` `befundMitAnforderung`). Tests: `ui/texte.test.ts`, Browsertest „Befunde im Ergebnis …“.

Geprüft und in Ordnung: K1 bis K9 (T-K1 bis T-K5 nachgerechnet), AHP (T-AHP3 nachgerechnet), Nutzwert, Rang und Sensitivität (Fallbeispiel nachgerechnet), CSV mit BOM, CRLF und Formelschutz, Fehlerfälle beim Öffnen (leer, abgeschnitten, Liste, fremde App, neuere Version, falsche Typen mit Stelle), Format 4 mit unbekanntem Baustein (Warnung bleibt nach Speichern und Öffnen), Druckbild beider Vorlagen (A4, 20 mm, keine Bedienelemente), axe hell und dunkel, Tastatur. README-Bilder und PDF-Proben neu erzeugt.

Verbleibende Mängel stehen im Bericht der Prüfung und in der README unter „Grenzen“; die wichtigsten: keine Durchsicht an einem echten Fall (8.3), Kopfzeile bricht die Statusmeldung bei 1280 px in vier Zeilen um, Wertebereiche (z. B. negative Betriebstage) prüft nur die Eingabe, nicht das Öffnen einer von Hand geänderten Datei.

## Hinweise für den nächsten Durchgang

- **Repo:** `edgebird-lab/auswahllotse`, Zweig `main`. Workflows: „Prüfung“ (jeder Push), „Windows-Programm“ (nur bei Änderungen an `src-tauri`, `src/plattform`, `package*.json` oder von Hand), „Version vorbereiten“ (nur bei Tags `v*`: Release-Entwurf mit Installer und `Auswahl-Lotse-Setup.exe`; nach Prüfung von Hand veröffentlichen mit `gh release edit <tag> --draft=false --latest`). Die Website verlinkt fest `https://github.com/edgebird-lab/auswahllotse/releases/latest/download/Auswahl-Lotse-Setup.exe`; der Name der Kopie darf sich deshalb nie ändern.
- **Neue Version:** Version in `package.json` (mit `npm version <x.y.z> --no-git-tag-version`), `src-tauri/Cargo.toml` (danach `cargo update --workspace --offline`) und `src/version.ts` setzen, `node scripts/fremdlizenzen.mjs` laufen lassen, prüfen, committen, `git tag -a v<x.y.z>` pushen, Entwurf prüfen und veröffentlichen.
- **Prüfen vor jedem Commit:** `npm run lint`, `npm test`, `npm run build`, `npm run e2e` (Edge, Port 4183 fest). Bei Änderungen am Programmteil zusätzlich `cargo test`, Debug-Build und `npm run desktop:test` (siehe `CLAUDE.md`).
- **Nächster Schritt:** Durchsicht mit Robin (8.3), am besten gleich im installierten Programm; Befunde als Issues, Korrekturen als 0.1.x. Robins installierte Fassung meldet noch 0.0.0; ein neuer Installer (z. B. der aus dem Release) ersetzt sie.
- **Oberfläche:** `src/App.tsx` (Gerüst), `src/ui/schritte/*` (sieben Schritte), `src/ui/druck/*` (Vorlagen), `src/ui/diagramme/*` (SVG, Rechnungen in `geometrie.ts`). Alle Zahlen und Befunde liefert `berechneGesamt(projekt)` aus `entscheidung/gesamt.ts`; Änderungen laufen als reine Funktionen über `aendere` (Kontext in `ui/kontext.ts`).
- **Ansehen:** `npm run build`, dann `npx vite preview --port 4183 --strictPort` und `node scripts/ansehen.mjs <ordner>` (Bildschirmfotos aller Schritte, hell und dunkel). Den Vorschau-Server danach beenden, sonst scheitert `npm run e2e` am belegten Port.
- **Bausteine der Fachlogik:** Einlesen `prozessdatei/einlesen.ts` → `lastenheft/abgleich.ts` (`liesProzessEin`, `ohneProzessmodell`, `gleicheAb`) → Prüfungen `lastenheft/pruefung.ts` → Bewertung `bewertung/auswertung.ts` (`werteAus`). Alle Funktionen sind rein und geben neue Objekte zurück; die Oberfläche (Phase 6) braucht nur noch Zustand, Plattform und Darstellung.
- **Testhilfen:** `src/testhilfen/` (Testdateien per `?raw`, Testprozesse, Projekte mit Rahmen L, Beispiel ABC).
