# Datenmodell der Projektdatei

Kurzfassung für alle, die `.auswahllotse`-Dateien lesen oder erzeugen wollen. Maßgeblich sind die Typen in [`src/modell/typen.ts`](../src/modell/typen.ts) und die Prüfung beim Laden in [`src/modell/speicher.ts`](../src/modell/speicher.ts); die Herleitung steht in der [Spezifikation](spezifikation.md), Abschnitt 4.

## Datei

- JSON, UTF-8 ohne BOM, 2 Leerzeichen Einzug, Endung `.auswahllotse`, MIME-Typ `application/vnd.auswahllotse+json`.
- Kennzeichen: `"app": "auswahllotse"` und `"formatVersion": 1`. Eine Datei mit höherer Version lehnt der Auswahl-Lotse ab („stammt aus einer neueren Version“).
- Beim Laden wird jedes Feld geprüft und einzeln kopiert. Unbekannte Felder fallen weg; falsche Typen führen zu einer Meldung mit Pfad, nicht zu einem Absturz.
- **Berechnete Werte stehen nie in der Datei:** Häufigkeiten, Mengengerüst, Gewichte aus dem Paarvergleich, Nutzwerte, Kosten, Rang, Empfehlung und Sensitivität rechnet die App bei jedem Öffnen neu.

## Einheiten und Kennungen

| Art | Regel |
| --- | --- |
| Geld | Euro netto, Zahl mit Punkt als Dezimaltrenner |
| Zeiten | Felder auf `…Min`, `…Stunden`, `…Sek`, `…Tage`, `…Wochen`, `…Jahre` |
| Prozent | Felder auf `…Prozent` von 0 bis 100 |
| Anteile, Gewichte | 0 bis 1 |
| Datum | ISO-8601-Text, z. B. `2026-11-11T10:00:00.000Z`; Angebotsdatum `2026-11-10` |
| Kennungen | Projekt, Angebote, Positionen, Risiken: UUID; Anforderungen: stabile Kennung aus der Herkunft (siehe unten) |

## Aufbau

| Feld | Inhalt |
| --- | --- |
| `id`, `angelegtAm`, `geaendertAm` | Kennung und Zeitstempel |
| `rahmen` | Vorhaben, Betrieb, Ersteller, `softwareart` (`erp`, `shop`, `crm`, `dms`, `andere`), Antworten `ja`/`nein`/`offen` zu `personenbezogen`, `steuerrelevant`, `verbraucherverkauf`, `kleinstunternehmen`, `betriebsform` (`cloud`, `eigener_server`, `offen`), `betriebstageProJahr`, `spitzenfaktor`, `richtwerte` |
| `prozess` | Eingelesenes Prozessmodell oder `null`: Dateiname, Dateiart (`json`/`bpmn`), gelesenes Format, SHA-256 des Dateitexts, Zeitpunkt und das Projekt des Prozesslotsen in der Form von Format 3 (nur bekannte Felder) |
| `umfang` | Grundlage `ist`/`soll`, Status je System (`abloesen`, `anbinden`, `unberuehrt`), Ausnahmen `aufgabenAus` und `aufgabenEin` |
| `anforderungen` | Liste der Anforderungen, siehe unten |
| `naechsteNummer` | nächste freie Nummer je Gruppe; Nummern werden nie wiederverwendet |
| `gewichtung` | `methode` (`direkt`/`paarvergleich`), `direktProzent` je Gruppe (ganze Zahlen), `paare` (Urteile mit `a`, `b`, `wichtiger`, `staerke` 1 bis 9), `festgelegtAm`, `aenderungenNachBewertung` |
| `angebote` | Anbieter, Produkt, Betriebsform, Angebotsdatum, Notiz, `bewertungen` je Anforderung und `kosten` |
| `bewertungBegonnenAm` | Zeitpunkt der ersten Punktzahl oder des ersten K.-o.-Ergebnisses |
| `wirtschaftlichkeit` | Jahre (1 bis 10), Benutzer, interner Stundensatz, Stunden je Personentag, Preissteigerung, Zins (`null` = ohne Abzinsung), Kostenbasis (`nominal`/`barwert`), Nutzen pro Jahr, Budget, Budget als K.-o. |
| `entscheidung` | Regel (`nutzwert`/`preis_leistung`), Mindestnutzwert, gewähltes Angebot (`null` = Empfehlung), Begründung (leer = Entwurf), Risiken, Status (`entwurf`/`final`), Datum |

### Anforderung

| Feld | Inhalt |
| --- | --- |
| `id` | stabil: `aufgabe:{id}`, `entscheidung:{id}`, `medienbruch:{quelle}>{ziel}`, `rollen`, `freigabe:{id}`, `pruefung:{id}`, `menge:vorgaenge`, `menge:benutzer`, `menge:antwortzeit`, `menge:datenbestand`, `katalog:{id}`, `baustein:{id}`, `eigene:{uuid}` |
| `nummer` | z. B. `F-03`; erst bei der Aktivierung vergeben, sonst `null` |
| `gruppe` | `funktion`, `schnittstelle`, `benutzer`, `menge`, `datenschutz`, `ordnung`, `betrieb`, `barrierefreiheit`, `anbieter` |
| `titel`, `text`, `abnahme` | Titel, Anforderungstext, Abnahmekriterium |
| `prioritaet`, `prioritaetVorschlag` | `muss`, `soll`, `kann`, `nicht`; der Vorschlag kommt aus der Regel |
| `status` | `vorschlag`, `aktiv`, `verworfen` |
| `herkunft` | Art, Bezüge ins Prozessmodell, Katalogkennung |
| `begruendung`, `quelle`, `notiz` | Herleitung, Rechtsquelle mit Stand, eigene Notiz |
| `punkte` | Gewicht in der Gruppe, ganze Zahl 0 bis 10 (Standard: Soll 2, Kann 1) |
| `bearbeitet` | `text`, `prioritaet`, `status`: was der Nutzer selbst geändert hat; „Neu einlesen“ überschreibt das nicht |

### Bewertung und Kosten eines Angebots

- `bewertungen[anforderungId]`: `ko` (`erfuellt`, `nicht_erfuellt`, `offen` oder `null`, nur bei Muss), `punkte` (0 bis 10 oder `null`, nur bei Soll und Kann), `fundstelle`, `notiz`.
- `kosten`: `einmalig` (Positionen mit Art `lizenzkauf`, `einrichtung`, `datenuebernahme`, `anpassung`, `schulung`, `hardware`, `sonstiges`), `laufendJahr` (Art `abo`, `wartung`, `hosting`, `support`, `sonstiges`, Betrag je Jahr), `preisJeBenutzerMonatEuro`, `internEinfuehrungTage`, `internSchulungStundenJeBenutzer`, `internBetriebStundenMonat`.

## Prozesslotse-Dateien

Der Auswahl-Lotse liest Projekte des Prozesslotsen in den Formaten 1 bis 3 als `.prozesslotse` oder `.json` und BPMN-Dateien, in die der Prozesslotse sein Projekt eingebettet hat (Element `projekt` im Namensraum `https://olbricht-digital.de/prozesslotse/projekt`). Format 1 und 2 werden auf die Form von Format 3 umgestellt. Neuere Formate liest er mit Warnung; Bausteine, die er nicht kennt, übernimmt er als allgemeinen Schritt und meldet sie. Er schreibt nie in Prozesslotse-Dateien. Die Testdateien und ihre Herkunft stehen in [`testdaten/prozesslotse/README.md`](../testdaten/prozesslotse/README.md).
