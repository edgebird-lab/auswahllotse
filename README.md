# Auswahl-Lotse

Vom Prozessmodell zu Lastenheft und begründeter Softwareentscheidung. Der Auswahl-Lotse liest ein Projekt des Prozesslotsen, leitet daraus ein Lastenheft mit MoSCoW-Prioritäten und Abnahmekriterien ab, gewichtet Kriterien direkt oder per Paarvergleich (AHP), prüft K.-o.-Kriterien und bewertet Angebote per Nutzwertanalyse. Läuft im Browser, ohne KI und ohne Server; später auch als Windows-Programm.

> **Stand:** in Arbeit, noch keine Version 0.1.0. Fachlogik und Oberfläche mit allen sieben Schritten, Druckvorlagen und CSV-Fragebogen sind fertig und getestet; es fehlen README-Bilder und die Durchsicht. Einzelheiten in [docs/stand.md](docs/stand.md).

## Was es kann (Ziel für Version 0.1)

- **Prozessmodell einlesen:** Prozesslotse-Projekt (`.prozesslotse`, `.json`) in den Formaten 1 bis 3 oder eine BPMN-Datei mit eingebettetem Projekt. Unbekannte Bausteine neuerer Formate werden als allgemeiner Schritt übernommen und gemeldet.
- **Umfang festlegen:** je System „ablösen“, „anbinden“ oder „unberührt“, je Aufgabe im Umfang oder nicht.
- **Lastenheft ableiten:** Funktionen aus Aufgaben, Schnittstellen aus Medienbrüchen, Rollen und Kontrollen aus Freigaben und Prüfungen, Mengengerüst aus Vorgängen pro Tag; dazu ein Katalog nichtfunktionaler Anforderungen (DSGVO, AO, Betrieb, Barrierefreiheit, Anbieter) und Bausteine je Softwareart.
- **Anforderungen prüfen:** unbestimmte Begriffe, fehlende oder unpassende Modalverben, fehlende Abnahmekriterien, Muss-Anteil über 60 %.
- **Bewerten:** Gewichte direkt oder per Paarvergleich mit Konsistenzprüfung, Muss als K.-o.-Kriterium, Nutzwertanalyse, Sensitivität der Gewichte.
- **Kosten und Entscheidung:** Gesamtkosten über 1 bis 10 Jahre mit einmaligen, laufenden und internen Kosten, Barwert, Kapitalwert und Amortisationsjahr; Empfehlung nach „höchster Nutzwert“ oder „bestes Preis-Leistungs-Verhältnis“, Begründungsentwurf aus Textbausteinen.

## Fallbeispiel „Lieferdienst sucht Warenwirtschaft“

Ein regionaler Lieferdienst mit 120 Bestellungen am Tag sucht ein ERP-System. Grundlage ist das Prozessmodell „Bestellung bis Rechnung“ aus dem Prozesslotsen. Das Projekt liegt als [`testdaten/beispiel-lieferdienst.auswahllotse`](testdaten/beispiel-lieferdienst.auswahllotse) bei und öffnet sich in der App mit „Beispiel laden“. Betrieb und Angebote sind erfunden.

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
| Gruppenwert | S = Σ vᵢ · eᵢ / Σ vᵢ über die Soll- und Kann-Anforderungen der Gruppe (v = Punkte, e = Erfüllung 0 bis 10) |
| Nutzwert | N = Σ W_g · S_g, Wertebereich 0 bis 10; Muss-Anforderungen wirken nur als K.-o.-Kriterium |
| Paarvergleich | Eigenvektor per Potenzmethode, CR = CI / RI, stimmig bis 0,10 |
| Sensitivität | ein Gewicht variieren, die übrigen proportional anpassen; stabiler Bereich, in dem die Empfehlung gleich bleibt |

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Unit-Tests (Vitest)
npm run lint       # oxlint
npm run build      # Typprüfung und Build
npm run e2e        # Browsertests mit Playwright und axe (lokal Edge, Port 4183)
```

Aufbau: Fachlogik ohne React in `src/prozessdatei`, `src/modell`, `src/lastenheft`, `src/bewertung`, `src/kosten`, `src/entscheidung` und `src/export`; Oberfläche in `src/ui`. Spezifikation in [docs/spezifikation.md](docs/spezifikation.md), Annahmen in [docs/entscheidungen.md](docs/entscheidungen.md).

## Grenzen

- Keine Rechtsberatung: Rechtliche Anforderungen im Katalog sind Hinweise mit Quelle und Stand.
- Der Auswahl-Lotse ändert keine Prozesslotse-Dateien.
- Sensitivität: Bei der Regel „bestes Preis-Leistungs-Verhältnis“ bleibt der Mindestnutzwert in der Analyse fest. Ein Angebot, das ihn heute nicht erreicht, wird auch dann nicht betrachtet, wenn es ihn bei anderen Gewichten erreichen würde.
- Neuere Formate des Prozesslotsen werden mit Warnung gelesen; Aufgaben in Bausteinen, die der Auswahl-Lotse noch nicht kennt, fehlen im Lastenheft.
