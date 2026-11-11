# Auswahl-Lotse

Vom Prozessmodell zu Lastenheft und begründeter Softwareentscheidung. Der Auswahl-Lotse liest ein Projekt des Prozesslotsen, leitet daraus ein Lastenheft mit MoSCoW-Prioritäten und Abnahmekriterien ab, gewichtet Kriterien direkt oder per Paarvergleich (AHP), prüft K.-o.-Kriterien und bewertet Angebote per Nutzwertanalyse. Läuft im Browser, ohne KI und ohne Server; später auch als Windows-Programm.

> **Stand:** in Arbeit, Phase 0 (Einrichten) erledigt. Fachlogik, Oberfläche und Vorlagen folgen. Einzelheiten in [docs/stand.md](docs/stand.md).

## Was es kann (Ziel für Version 0.1)

- **Prozessmodell einlesen:** Prozesslotse-Projekt (`.prozesslotse`, `.json`) in den Formaten 1 bis 3 oder eine BPMN-Datei mit eingebettetem Projekt. Unbekannte Bausteine neuerer Formate werden als allgemeiner Schritt übernommen und gemeldet.
- **Umfang festlegen:** je System „ablösen“, „anbinden“ oder „unberührt“, je Aufgabe im Umfang oder nicht.
- **Lastenheft ableiten:** Funktionen aus Aufgaben, Schnittstellen aus Medienbrüchen, Rollen und Kontrollen aus Freigaben und Prüfungen, Mengengerüst aus Vorgängen pro Tag; dazu ein Katalog nichtfunktionaler Anforderungen (DSGVO, AO, Betrieb, Barrierefreiheit, Anbieter) und Bausteine je Softwareart.
- **Anforderungen prüfen:** unbestimmte Begriffe, fehlende oder unpassende Modalverben, fehlende Abnahmekriterien, Muss-Anteil über 60 %.
- **Bewerten:** Gewichte direkt oder per Paarvergleich mit Konsistenzprüfung, Muss als K.-o.-Kriterium, Nutzwertanalyse, Sensitivität der Gewichte.
- **Kosten und Entscheidung** (folgt): Gesamtkosten über mehrere Jahre, Barwert, Kapitalwert, Begründungsentwurf und druckbare Vorlagen.

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

Aufbau: Fachlogik ohne React in `src/prozessdatei`, `src/modell`, `src/lastenheft`, `src/bewertung` (später `src/kosten`, `src/entscheidung`, `src/export`); Oberfläche in `src/ui`. Spezifikation in [docs/spezifikation.md](docs/spezifikation.md), Annahmen in [docs/entscheidungen.md](docs/entscheidungen.md).

## Grenzen

- Keine Rechtsberatung: Rechtliche Anforderungen im Katalog sind Hinweise mit Quelle und Stand.
- Der Auswahl-Lotse ändert keine Prozesslotse-Dateien.
