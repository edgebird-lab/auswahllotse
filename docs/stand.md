# Stand der Arbeit

Checkliste aller Phasen und Schritte aus [spezifikation.md](spezifikation.md), Abschnitt 11. Nach jedem Schritt aktualisieren, damit ein Nachfolger hier weitermachen kann. Annahmen stehen in [entscheidungen.md](entscheidungen.md).

Letzte Aktualisierung: 11.11.2026

## Phase 0 – Einrichten

- [x] **0.1** Vite 8, React 19, TypeScript 7, Vitest 5; Einstellungen wie beim Prozesslotsen. `npm run build` und Platzhaltertest laufen.
- [x] **0.2** oxlint mit `react/no-danger` (an einer Probedatei geprüft), Playwright mit axe (lokal Edge, Port 4183 mit strictPort), Smoke-Test hell und dunkel. CSP-Meta-Tag per Vite-Plugin im Build.
- [ ] **0.3** Privates Repo, Workflow „Prüfung“, `CLAUDE.md`.

## Phase 1 – Datenmodell und Speichern

- [ ] **1.1** `typen.ts`, `ergebnisse.ts`, `neuesProjekt()` (T-D1)
- [ ] **1.2** Speichern und Laden mit Strukturprüfung (T-D2 bis T-D5)
- [ ] **1.3** Browser-Speicher und Einstellungen (T-D6, T-D7)

## Phase 2 – Prozessmodell einlesen

- [ ] **2.1** Testdateien mit Herkunft, eigene `Pl`-Typen in `format.ts`
- [ ] **2.2** JSON-Leser E1 bis E8, E13 (T-E1 bis T-E8)
- [ ] **2.3** Häufigkeit nach dem Flussverfahren (T-H1 bis T-H6)
- [ ] **2.4** Mengengerüst, Prozesskosten, Medienbruchkosten (T-M1 bis T-M5)
- [ ] **2.5** BPMN mit eingebettetem Projekt E9 bis E12 (T-E9 bis T-E13)

## Phase 3 – Lastenheft ableiten

- [ ] **3.1** Umfang U1 bis U3 (T-U1 bis T-U3)
- [ ] **3.2** Funktionen und Entscheidungs-Vorschläge A0 bis A3 (T-A1, T-A2)
- [ ] **3.3** Schnittstellen aus Medienbrüchen U4, U5, A4 (T-A3 bis T-A5)
- [ ] **3.4** Rollen, Freigaben, Prüfungen, Mengengerüst A5 bis A8 (T-A6, T-A7)
- [ ] **3.5** Katalog und Bausteine, `docs/kataloge.md` (T-A8 bis T-A10)
- [ ] **3.6** Prüfungen P1 bis P11, Nummernvergabe (T-P1 bis T-P6)
- [ ] **3.7** Neu einlesen mit Abgleich und Vorschau, ohne Prozessmodell (T-A11, T-A12)

## Phase 4 – Gewichtung und Nutzwert

- [ ] **4.1** Hauptkriterien, direkte Gewichte, Unterpunkte, Änderungszähler G1 bis G5 (T-G1 bis T-G4)
- [ ] **4.2** AHP mit Eigenvektor, λmax, CR, widersprüchlichstem Urteil (T-AHP1 bis T-AHP5)
- [ ] **4.3** RI-Tabelle und Simulationstest (T-AHP6)
- [ ] **4.4** K.-o.-Prüfung, Budget, Nutzwert, Rang, „vorläufig“ N1 bis N7 (T-N1 bis T-N6)
- [ ] **4.5** Sensitivität für beide Regeln S1 bis S6 (T-S1 bis T-S5)

## Phase 5 – Kosten und Entscheidung

- [ ] **5.1** Gesamtkosten K1 bis K4 (T-K1, T-K2)
- [ ] **5.2** Barwert, Kapitalwert, Amortisation, Prüfungen, Vorschläge K5 bis K10 (T-K3 bis T-K7)
- [ ] **5.3** Entscheidungsregeln und Begründungsentwurf 6.12, 6.13 (T-R1 bis T-R5)
- [ ] **5.4** Fallbeispiel „Lieferdienst sucht Warenwirtschaft“ mit drei erfundenen Angeboten (T-B1)

## Phase 6 – Oberfläche

- [ ] **6.1** Plattformschicht, Zustand mit Rückgängig, Kopf- und Schrittleiste, hell und dunkel, Lernmodus
- [ ] **6.2** Schritte Rahmen und Prozess, Teil A (E3)
- [ ] **6.3** Schritt Prozess, Teil B, Umfang (E2)
- [ ] **6.4** Schritt Anforderungen (E10)
- [ ] **6.5** Schritt Gewichtung (E4)
- [ ] **6.6** Schritt Angebote (E11)
- [ ] **6.7** Schritt Ergebnis mit SVG-Diagrammen (E1 bis Schritt 6)

## Phase 7 – Vorlagen und Export

- [ ] **7.1** Druckansicht Lastenheft (E8)
- [ ] **7.2** Entscheidungsvorlage (E1 vollständig)
- [ ] **7.3** CSV-Anbieterfragebogen (T-C1 bis T-C3, E7)
- [ ] **7.4** README mit Bildern, `docs/datenmodell.md`

## Phase 8 – Qualität und Version 0.1.0

- [ ] **8.1** Alle Browsertests E1 bis E11 (laut Auftrag nur lokal, siehe entscheidungen.md)
- [ ] **8.2** Barrierefreiheit und Tastatur (E5, E9)
- [ ] **8.3** Durchsicht mit Robin an einem echten Fall
- [ ] **8.4** Tag `v0.1.0` (Repo bleibt privat)

## Phase 9 – Windows-Programm mit Tauri (später, nach W3 des Prozesslotsen)

- [ ] **9.1** Desktop-Teil der Plattformschicht
- [ ] **9.2** Tauri-Gerüst
- [ ] **9.3** Dateizuordnung, Import-Dialog, Single-Instance, atomares Speichern
- [ ] **9.4** PDF über WebView2
- [ ] **9.5** Test in der Windows Sandbox, Windows-Job in der CI
