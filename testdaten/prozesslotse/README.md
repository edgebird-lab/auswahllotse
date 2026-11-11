# Testdateien aus dem Prozesslotsen

Vertragstests für das Einlesen (Spezifikation 4.3 und 9.3). Erzeugt am 11.11.2026 aus dem Prozesslotsen, Commit `0139e53` („E2E-Port über PL_PORT einstellbar“), Dateiformat 3. Der Prozesslotse wurde dabei nur gelesen: Ein einmaliges Skript (nicht im Repo) hat `beispielProjekt()`, `beispielOnlineProjekt()` (`src/modell/beispiel.ts`) und `bpmnFuerExport()` (`src/bpmn/export.ts`) aufgerufen und das Ergebnis so geschrieben, wie der Prozesslotse speichert (`JSON.stringify(projekt, null, 2)`).

Die Zahlen der Beispiele sind laut `beispiel.ts` „ausgedacht, aber plausibel“. Alle Dateien sind Robins eigenes Werk, ohne Fremdrechte.

| Datei | Inhalt | Herkunft |
| --- | --- | --- |
| `lieferdienst.prozesslotse` | Projekt „Bestellung bis Rechnung (Lieferdienst)“, Format 3, ohne Soll | `beispielProjekt()` |
| `onlinebestellung.prozesslotse` | Projekt „Onlinebestellung bis Versand“ mit Rücksprung, Ereignis-Entscheidung und Gleichzeitig, Format 3 | `beispielOnlineProjekt()` |
| `lieferdienst-eingebettet.bpmn` | BPMN 2.0 mit eingebettetem Projekt (`pl:projekt` im Prozess-Element, `formatVersion="3"`, `ansicht="ist"`) | `bpmnFuerExport(beispielProjekt(), 'ist')` |
| `lieferdienst-format2.json` | wie `lieferdienst.prozesslotse`, aber Format 2: ohne `teilnehmer`, `von`, `nachrichtAn`, `nachrichtVon` | per Skript aus dem Format-3-Projekt |
| `lieferdienst-format1.json` | Format 1: zusätzlich ohne `art` der Entscheidungen, `zurueckZu` und `ereignis` der Ausgänge, `modus` und `zweck` der Wiederholungen | per Skript aus der Format-2-Datei |
| `kaputt/*` | Fehlerfälle für T-E4 bis T-E13 und allgemeine Schritte | per Skript aus den gültigen Dateien, siehe unten |

## Fehlerfälle in `kaputt/`

| Datei | Fall | Erwartung |
| --- | --- | --- |
| `kein-json.prozesslotse` | abgeschnittenes JSON | „Die Datei ist kein gültiges JSON.“ |
| `zahl.json` | Zahl statt Objekt | „Die Datei enthält kein Prozesslotse-Projekt.“ |
| `auswahllotse-projekt.json` | Projekt des Auswahl-Lotsen | Hinweis auf „Öffnen“ |
| `format-0.prozesslotse` | `formatVersion` 0 | „Diese Datei hat Format 0 …“ |
| `format-4-teilprozess.prozesslotse` | Format 4 mit Baustein `teilprozess` | gelesen mit Warnung, Teilprozess als allgemeiner Schritt |
| `unbekannter-baustein.prozesslotse` | Format 3, im 3. Schritt Baustein `schleife` | gelesen, Warnung „Ist-Prozess, Ablauf, Schritt 3: unbekannter Baustein „schleife““ |
| `aufgabe-unvollstaendig.prozesslotse` | erste Aufgabe ohne `bearbeitungMin` | „Ist-Prozess, Ablauf, Schritt 1: Aufgabe unvollständig.“ |
| `ohne-einbettung.bpmn` | BPMN ohne `extensionElements` | „enthält kein Prozesslotse-Projekt“ |
| `doctype.bpmn` | BPMN mit `<!doctype …>` | abgelehnt vor dem Parsen |
| `format-passt-nicht.bpmn` | Attribut `formatVersion="2"`, JSON mit Format 3 | „Das eingebettete Projekt ist beschädigt.“ |
| `kein-xml.bpmn` | abgeschnittenes XML | „Die Datei ist kein gültiges XML.“ |
| `html.bpmn` | Wurzel `<html>` | „Die Datei ist keine BPMN-2.0-Datei.“ |

## Neues Format des Prozesslotsen

Ein neues Format braucht einen eigenen Arbeitsschritt (Spezifikation 4.3): `Pl`-Typen in `src/prozessdatei/format.ts` ergänzen, Umstellung im Leser, neue Testdatei aus dem Prozesslotsen hier ablegen und diese Tabelle um Commit und Datum ergänzen.
