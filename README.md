# Auswahl-Lotse

Vom Prozessmodell zu Lastenheft und begründeter Softwareentscheidung. Der Auswahl-Lotse liest ein Projekt des Prozesslotsen, leitet daraus ein Lastenheft mit MoSCoW-Prioritäten und Abnahmekriterien ab, gewichtet Kriterien direkt oder per Paarvergleich (AHP), prüft K.-o.-Kriterien, bewertet Angebote per Nutzwertanalyse, vergleicht die Kosten über mehrere Jahre und schreibt eine druckbare Entscheidungsvorlage. Läuft im Browser, ohne KI und ohne Server; später auch als Windows-Programm.

> **Stand 11.11.2026:** in Arbeit, noch keine Version 0.1.0. Fachlogik und Oberfläche mit allen sieben Schritten, Druckvorlagen und CSV-Fragebogen sind fertig, getestet und kritisch gegen die Spezifikation geprüft. Es fehlen die Durchsicht an einem echten Fall, das GitHub-Repo mit CI und der Tag `v0.1.0`. Einzelheiten unter [Stand](#stand) und in [docs/stand.md](docs/stand.md).

![Ergebnis des Fallbeispiels: Empfehlung, K.-o.-Prüfung und Nutzwert als gestapelte Balken](docs/bilder/ergebnis.png)

## Was es kann

Ein geführter Assistent in sieben Schritten:

1. **Rahmen:** Vorhaben, Betrieb, Softwareart (ERP, Shop, CRM, DMS, andere) und die Fragen, die den Katalog steuern: Daten über Personen, steuerlich wichtige Unterlagen, Betrieb in der Cloud oder auf eigenem Server, Verkauf an Verbraucher, Kleinstunternehmen. Dazu Betriebstage, Spitzenfaktor und Richtwerte für die Texte.
2. **Prozess:** Prozesslotse-Projekt (`.prozesslotse`, `.json`) in den Formaten 1 bis 3 oder eine BPMN-Datei mit eingebettetem Projekt einlesen. Unbekannte Bausteine neuerer Formate werden als allgemeiner Schritt übernommen und gemeldet. Umfang festlegen: je System „ablösen“, „anbinden“ oder „unberührt“, je Aufgabe im Umfang oder nicht. „Neu einlesen“ zeigt vorher, was sich ändert.
3. **Anforderungen:** Funktionen aus Aufgaben, Schnittstellen aus Medienbrüchen, Rollen, Freigaben und Prüfungen, Mengengerüst aus Vorgängen pro Tag; dazu 21 Katalogeinträge (DSGVO, AO, Betrieb, Barrierefreiheit, Anbieter) und 24 Bausteine je Softwareart, alle mit Quelle. Prüfungen mit festen Regeln: unbestimmte Begriffe, fehlende oder unpassende Modalverben, fehlende Abnahmekriterien, Muss-Anteil über 60 %.
4. **Gewichtung:** Hauptkriterien direkt in Prozent oder per Paarvergleich auf 17 Stufen mit Konsistenzprüfung (CR) und Hinweis auf das widersprüchlichste Urteil; Punkte innerhalb der Gruppen; Entscheidungsregel und Budget; „Festlegen“ mit Zähler für spätere Änderungen.
5. **Angebote:** Muss-Kriterien als K.-o. (erfüllt, nicht erfüllt, offen), Soll und Kann mit 0 bis 10 Punkten, Fundstelle und Notiz; Kosten mit einmaligen, laufenden und internen Posten, Vorschläge für Benutzer, Stundensatz und Nutzen aus dem Prozessmodell.
6. **Ergebnis:** Empfehlung nach „höchster Nutzwert“ oder „bestes Preis-Leistungs-Verhältnis“, K.-o.-Übersicht, Nutzwert und Kosten als Diagramm und Tabelle, Barwert, Kapitalwert und Amortisation, Sensitivität der Gewichte, alle Befunde mit Sprung zur Ursache.
7. **Vorlagen:** Lastenheft und Entscheidungsvorlage zum Drucken oder als PDF, Begründungsentwurf aus Textbausteinen, Risiken, Status „final“ erst ohne Fehler; Anbieterfragebogen als CSV.

Dazu: Rückgängig und Wiederholen, Lernmodus mit kurzen Erklärungen der Methoden, hell und dunkel, vollständig per Tastatur bedienbar.

| Anforderungen | Gewichtung |
| --- | --- |
| ![Schritt Anforderungen mit Muss-Anteil und Karten](docs/bilder/anforderungen.png) | ![Schritt Gewichtung mit direkten Gewichten](docs/bilder/gewichtung.png) |
| **Sensitivität** | **Entscheidungsvorlage** |
| ![Stabile Bereiche der Gewichte als kleine Liniendiagramme](docs/bilder/sensitivitaet.png) | ![Entscheidungsvorlage mit Empfehlung im Kasten](docs/bilder/entscheidungsvorlage.png) |

## Fallbeispiel „Lieferdienst sucht Warenwirtschaft“

Ein regionaler Lieferdienst mit 120 Bestellungen am Tag sucht ein ERP-System. Grundlage ist das Prozessmodell „Bestellung bis Rechnung“ aus dem Prozesslotsen. Das Projekt liegt als [`testdaten/beispiel-lieferdienst.auswahllotse`](testdaten/beispiel-lieferdienst.auswahllotse) bei und öffnet sich in der App mit „Beispiel laden“. Betrieb und Angebote sind erfunden. Die Vorlagen als PDF: [Lastenheft](docs/proben/lastenheft-lieferdienst.pdf), [Entscheidungsvorlage](docs/proben/entscheidungsvorlage-lieferdienst.pdf).

- **Lastenheft:** 42 aktive Anforderungen, davon 23 Muss (54,8 %). Aus dem Modell stammen 8 Funktionen, 2 Schnittstellen (Papier → Warenwirtschaft, Warenwirtschaft → Excel-Tourenliste), Rollen, eine Freigabe und das Mengengerüst; dazu der Katalog (DSGVO, AO, Betrieb, Anbieter) und die ERP-Bausteine.
- **Gewichte (direkt):** Funktionen 35 %, Betrieb und Support 15 %, Anbieter und Einführung 15 %, Schnittstellen 10 %, Datenschutz 10 %, Mengen 5 %, Ordnungsmäßigkeit 5 %, Barrierefreiheit 5 %.
- **Annahmen:** 5 Jahre, 7 Benutzer, interner Stundensatz 44 € (aus den Rollen), Preissteigerung 3 %, Zins 5 %, Nutzen 40.000 € pro Jahr (der Vorschlag aus den Medienbrüchen wäre 100.920 €), Budget 80.000 €.

| Angebot | Muss-Kriterien | Nutzwert | Gesamtkosten 5 Jahre | Kapitalwert | Ergebnis |
| --- | --- | --- | --- | --- | --- |
| Anbieter Nord, „Warenwirtschaft Nord“ (Cloud) | alle 23 erfüllt | 8,52 | 54.517 € | 123.892 € | **empfohlen**, bezahlt im 1. Jahr |
| Anbieter West, „West Komplett“ (eigener Server) | alle 23 erfüllt | 7,70 | 93.088 € | 86.200 € | Rang 2, über Budget |
| Anbieter Süd, „ERP Süd Start“ (Cloud) | G-03 nicht erfüllt | 5,49 | 35.230 € | – | ausgeschieden |

Anbieter Nord liegt 0,82 Punkte vorn und ist günstiger als West. Die Empfehlung kippt erst, wenn Funktionen mehr als 57,1 % des Gewichts bekämen (heute 35 %); dann läge West mit den stärkeren Funktionen vorn. Anbieter Süd ist am günstigsten, bietet aber keinen Datenzugriff für die Finanzverwaltung nach § 147 Abs. 6 AO und scheidet deshalb aus.

## Formeln (Auszug)

| Größe | Berechnung |
| --- | --- |
| Häufigkeit einer Aufgabe | erwartete Ausführungen je Vorgang nach dem Flussverfahren des Prozesslotsen; Wiederholung mit Anteil r läuft 1 / (1 − r)-mal |
| Medienbruch | Paar (Quelle, Ziel) einer Übertragung von Hand; Fall A bis E nach dem Status beider Systeme; Minuten pro Tag = Σ h · Minuten · V |
| Priorität aus dem Modell | Aufgabe mit h ≥ 0,5 je Vorgang → Muss, sonst Soll; Schnittstelle ab 60 Minuten pro Tag Muss, ab 10 Soll, sonst Kann |
| Muss-Anteil | Muss / (Muss + Soll + Kann) über aktive Anforderungen; Warnung über 60 % |
| Gruppenwert | S = Σ vᵢ · eᵢ / Σ vᵢ über die Soll- und Kann-Anforderungen der Gruppe (v = Punkte, e = Erfüllung 0 bis 10) |
| Nutzwert | N = Σ W_g · S_g, Wertebereich 0 bis 10; Muss-Anforderungen wirken nur als K.-o.-Kriterium |
| Paarvergleich | Eigenvektor per Potenzmethode, CR = CI / RI, stimmig bis 0,10 (RI nach Saaty 1987, per Simulation geprüft) |
| Gesamtkosten | E + Σ L_t mit E = einmalig + interne Einführung und Schulung, L_t = L₁ · (1 + s)^(t − 1) |
| Barwert, Kapitalwert | BW = E + Σ L_t / (1 + i)^t; KW = −E + Σ (U − L_t) / (1 + i)^t; Einführung in Jahr 0, laufende Kosten am Jahresende |
| Amortisation | kleinstes t mit Σ_{τ≤t} (U − L_τ) / (1 + i)^τ ≥ E |
| Sensitivität | ein Gewicht variieren, die übrigen proportional anpassen; stabiler Bereich, in dem die Empfehlung gleich bleibt; knapp unter 5 Prozentpunkten Abstand |

Alle Schwellen stehen mit Quelle in [`src/regeln/schwellen.ts`](src/regeln/schwellen.ts), die Kataloge mit Quelle und Stand in [docs/kataloge.md](docs/kataloge.md).

## Daten und Sicherheit

- **Alles lokal:** kein Server, keine KI, keine Telemetrie. Das Projekt liegt im Browser-Speicher dieses Geräts und als `.auswahllotse`-Datei, die Sie selbst speichern. „Browser-Speicher leeren“ im Fuß ist für gemeinsam genutzte Rechner gedacht.
- **Nichts geht still verloren:** Lässt sich der im Browser gesicherte Stand beim Start nicht lesen, bleibt er als Kopie erhalten; eine Meldung nennt den Grund und bietet „Kopie herunterladen“ an.
- **Beim Öffnen geprüft:** Projektdateien werden Feld für Feld geprüft (Typen, Auswahlwerte, eindeutige Kennungen); eine beschädigte Datei ergibt eine Meldung mit der Stelle, das geöffnete Projekt bleibt unverändert.
- **Inhaltsrichtlinie:** Der Build erlaubt nur eigene Dateien und keine Verbindungen nach außen (`connect-src 'none'`).
- **Eingaben:** Größen- und Tiefengrenzen beim Einlesen, BPMN mit DOCTYPE wird vor dem Parsen abgelehnt, eingelesene Daten werden Feld für Feld kopiert.
- **CSV:** Formelschutz für Felder, die Excel als Formel lesen würde.
- Dateiformat: [docs/datenmodell.md](docs/datenmodell.md).

## Bedienung

| Taste | Wirkung |
| --- | --- |
| Strg+S | Projekt als Datei speichern |
| Strg+O | Projektdatei öffnen |
| Strg+Z, Strg+Y | Rückgängig, Wiederholen (außerhalb von Eingabefeldern) |

Prozesslotse-Dateien werden im Schritt „Prozess“ eingelesen, nicht über „Öffnen“.

Zahlen versteht die App deutsch geschrieben: „1.234,50“, „1234,5“ und „90.000“ (Punkte in Dreiergruppen sind Tausendertrennzeichen). Ein einzelner Punkt ohne Dreiergruppe gilt als Dezimalpunkt („2.5“ ist 2,5). Nach Beginn der Bewertung zählt jede Änderung an Gewichten, Anforderungen oder Regel einmal, auch wenn man Ziffer für Ziffer tippt; die Entscheidungsvorlage nennt die Zahl.

## Start

Voraussetzung: Node 24. Keine globalen Installationen nötig.

```bash
npm install
npm run dev        # Entwicklungsserver, Adresse steht in der Ausgabe
npm run build      # Typprüfung und Build nach dist/
npm run preview    # gebaute App auf http://localhost:4183 (fester Port)
```

Im Browser „Beispiel laden“ öffnet das Fallbeispiel; ein eigenes Prozessmodell liest man im Schritt „Prozess“ ein (`.prozesslotse`, `.json` oder `.bpmn` mit eingebettetem Projekt).

## Tests

```bash
npm run lint       # oxlint (mit react/no-danger)
npm test           # Unit-Tests der Fachlogik (Vitest)
npm run e2e        # Browsertests mit Playwright und axe (lokal Edge, Port 4183 fest)
```

- **255 Unit-Tests in 28 Dateien:** alle Testwerte der Spezifikation (Abschnitt 9.1, von Hand nachgerechnet), dazu Randfälle wie Tausenderpunkt, Rundung an Halbwerten, doppelte Kennungen und unlesbarer Browser-Speicher. Das Fallbeispiel prüft auch die Zahlen dieser README.
- **22 Browsertests:** E1 bis E11 der Spezifikation, axe in allen Schritten und Reitern hell und dunkel, ganzer Durchlauf nur mit Tastatur, Speichern und Öffnen, beschädigter Browser-Speicher, Zahleneingabe mit Änderungszähler und Sprung von Befunden zur Ursache.
- Vor jedem Commit laufen lint, Unit-Tests, Build und Browsertests. Der Port 4183 muss frei sein; ein laufender Vorschau-Server lässt `npm run e2e` abbrechen.

Bilder und PDF-Proben neu erzeugen: `npm run build`, dann `npx vite preview --port 4183 --strictPort` und `node scripts/readme-bilder.mjs`. Rundgang mit Bildschirmfotos: `node scripts/ansehen.mjs <ordner>`. Das Fallbeispiel neu schreiben: `npx vitest run -u src/beispiel`.

Aufbau: Fachlogik ohne React in `src/prozessdatei`, `src/modell`, `src/lastenheft`, `src/bewertung`, `src/kosten`, `src/entscheidung` und `src/export`; Oberfläche in `src/ui` mit Zustand in `src/zustand.ts` und Plattformschicht in `src/plattform`. Spezifikation in [docs/spezifikation.md](docs/spezifikation.md), Annahmen in [docs/entscheidungen.md](docs/entscheidungen.md).

## Stand

| Phase | Stand |
| --- | --- |
| 0 Einrichten | fertig bis auf das GitHub-Repo: `gh repo create` wurde in der Arbeitssitzung von der Rechteprüfung abgelehnt; daher noch kein Push und kein CI-Lauf |
| 1 bis 7 Datenmodell, Einlesen, Lastenheft, Gewichtung, Kosten, Oberfläche, Vorlagen | fertig und getestet |
| 8 Qualität | Browsertests, Barrierefreiheit und Tastatur fertig; die kritische Prüfung vom 11.11.2026 hat elf Fehler und Schwächen gefunden und behoben (Liste in [docs/stand.md](docs/stand.md)). Offen: Durchsicht mit Robin an einem echten Fall (8.3), danach Tag `v0.1.0` (8.4) |
| 9 Windows-Programm mit Tauri | später, nach Schritt W3 des Prozesslotsen |

Offene Fragen der Spezifikation (Kataloginhalte, Festlegungen, Lizenz) gelten als Annahmen, bis Robin entscheidet: [docs/entscheidungen.md](docs/entscheidungen.md).

## Grenzen

- Keine Rechtsberatung: Rechtliche Anforderungen im Katalog sind Hinweise mit Quelle und Stand (11.11.2026).
- Der Auswahl-Lotse ändert keine Prozesslotse-Dateien. Änderungen am BPMN-Diagramm in anderen Werkzeugen sieht er nicht; er liest nur das eingebettete Projekt.
- Neuere Formate des Prozesslotsen werden mit Warnung gelesen; Aufgaben in Bausteinen, die der Auswahl-Lotse noch nicht kennt, fehlen im Lastenheft.
- Sensitivität: Bei der Regel „bestes Preis-Leistungs-Verhältnis“ bleibt der Mindestnutzwert in der Analyse fest. Ein Angebot, das ihn heute nicht erreicht, wird auch dann nicht betrachtet, wenn es ihn bei anderen Gewichten erreichen würde.
- Ein Prozessmodell je Vorhaben, ein Bewerter, kein Rücklauf des CSV-Fragebogens und keine Word-Datei; das folgt frühestens in 0.2.
- Änderungszähler: Eine Eingabe zählt wie ein Rückgängig-Schritt; wer beim Tippen länger als 1,5 Sekunden pausiert, erzeugt zwei Änderungen.
- Ein auf „final“ gesetzter Status bleibt stehen, wenn später Fehler hinzukommen; die App warnt dann, setzt ihn aber nicht selbst zurück.
- Im Browser: PDF nur über den Druckdialog, keine Rückfrage beim Schließen des Tabs (das Projekt liegt ohnehin im Browser-Speicher), kein Ablegen von Dateien per Ziehen.
