# Auswahl-Lotse – Spezifikation

Vom Prozessmodell zu Lastenheft und begründeter Softwareentscheidung. Läuft im Browser, ohne KI und ohne Server; später als Windows-Programm.

| | |
| --- | --- |
| Stand | 11.11.2026 |
| Ziel | Version 0.1.0 der App (MVP) |
| Vorbild | Prozesslotse, `C:\Users\Robin\Projekte\Apps\prozesslotse`, Commit `e482a9a` |
| Ablage | `C:\Users\Robin\Projekte\Apps\auswahllotse\docs\spezifikation.md` |
| Aufwand MVP | etwa 24,5 Arbeitstage (Spanne 21 bis 28), Windows-Programm zusätzlich 3 bis 5 |

Schreibweise: Zahlen im Text mit Dezimalkomma, im Code mit Punkt. Platzhalter stehen in `{geschweiften Klammern}`, austauschbare Modalverben in `[eckigen Klammern]`.

---

## 1 Ziel und Nutzer

Der Auswahl-Lotse führt einen Kleinbetrieb von seinem Prozessmodell zu einer begründeten Wahl von ERP, Shop, CRM oder DMS. Er leitet aus einer Datei des Prozesslotsen ein Lastenheft mit MoSCoW-Prioritäten und Abnahmekriterien ab. Danach gewichtet der Nutzer Kriterien, prüft K.-o.-Kriterien, bewertet Angebote per Nutzwertanalyse und vergleicht die Kosten über fünf Jahre. Am Ende stehen eine Sensitivitätsanalyse und eine druckbare Entscheidungsvorlage. Nutzer sind Inhaber und IT-Verantwortliche von Kleinbetrieben ohne eigene IT-Abteilung sowie Robin als Berater.

---

## 2 Umfang

### 2.1 Version 0.1 (MVP)

- **Projekt:** anlegen, als `.auswahllotse` speichern und öffnen, sofortige Sicherung im Browser, Beispielprojekt „Lieferdienst sucht Warenwirtschaft“.
- **Prozessmodell einlesen:** Prozesslotse-Projekt im Format 1 oder 2 (`.prozesslotse`, `.json`). BPMN mit eingebettetem Projekt nach dem Vertrag in 4.3. Ohne Prozessmodell nutzbar (nur Kataloge und eigene Anforderungen).
- **Umfang festlegen:** je System „ablösen“, „anbinden“ oder „unberührt“, je Aufgabe im Umfang oder nicht.
- **Lastenheft ableiten:** Funktionen aus Aufgaben, Schnittstellen aus Medienbrüchen, Benutzer und Rechte aus Rollen, Kontrollen aus Freigaben und Prüfungen, Mengengerüst aus Vorgängen pro Tag. Dazu ein Katalog nichtfunktionaler Anforderungen (Datenschutz, AO/GoBD, Betrieb, Barrierefreiheit, Anbieter) und Bausteine je Softwareart.
- **Anforderungen pflegen:** MoSCoW, Abnahmekriterium, eigene Anforderungen, Prüfung der Formulierung mit festen Regeln, Muss-Anteil, „Neu einlesen“ mit Abgleich.
- **Bewerten:** Gewichte direkt oder per Paarvergleich (AHP) mit Konsistenzprüfung, Muss als K.-o.-Kriterium, Punkte 0 bis 10, Nutzwertanalyse, Sensitivität der Gewichte.
- **Kosten:** Gesamtkosten über 1 bis 10 Jahre (Standard 5) mit einmaligen, laufenden und internen Kosten, optional Barwert, Kapitalwert und Amortisationsjahr.
- **Entscheiden:** Regel „höchster Nutzwert“ oder „bestes Preis-Leistungs-Verhältnis“, Budget, Begründungsentwurf aus Textbausteinen.
- **Ausgaben:** Druckansichten Lastenheft und Entscheidungsvorlage (PDF über den Browser), Anbieterfragebogen als CSV, Projekt als JSON.
- **Bedienung:** geführter Assistent in 7 Schritten, hell und dunkel, Lernmodus, vollständig per Tastatur, axe ohne schwere Befunde.

### 2.2 Ausdrücklich später

| Funktion | Wann | Grund |
| --- | --- | --- |
| Lastenheft und Vorlage als DOCX (`docx` 9.15.3, MIT) | 0.2 | Druck als PDF reicht für 0.1; eine Abhängigkeit weniger |
| Rücklauf des CSV-Fragebogens einlesen | 0.2 | Export allein ist schon nützlich; Import braucht Zuordnung und Fehlerbehandlung |
| Mehrere Prozessmodelle je Vorhaben (z. B. Verkauf und Einkauf) | 0.2 | braucht Dateiformat 2 und Regeln zum Zusammenführen von Rollen |
| Kosten als gewichtetes Kriterium (dritte Entscheidungsregel) | 0.2 | methodisch umstritten; zwei Regeln reichen für 0.1 |
| Windows-Programm mit Tauri | nach 0.1, Phase 9 | gleicher Weg wie beim Prozesslotsen |
| Mehrere Bewerter mit Zusammenführung | später | Kleinbetriebe bewerten meist zu zweit am Tisch |
| BPMN-Diagramm im Lastenheft | später | bräuchte bpmn-js und das Layout des Prozesslotsen |
| Lokale KI (Formulierungen, Angebots-PDF lesen) | frühestens 0.3, optional | siehe 2.3 |
| Anbieterdatenbank, Marktübersicht | nicht geplant | Pflegeaufwand; Ansatz ist das eigene Prozessmodell |

### 2.3 Prüfung der Ausgangsidee

Die Idee stammt aus der Ideensammlung (Rang 9). Abweichungen:

| Idee | Spezifikation | Grund |
| --- | --- | --- |
| Lokale KI markiert unklare Formulierungen und liest Angebote | 0.1 ohne KI; Formulierungsprüfung mit festen Regeln (6.6) | Grundsatz des Prozesslotsen; prüfbar; keine Ollama-Installation beim Kunden |
| Export mit `docx` | 0.1 druckt als PDF | wie der Prozesslotse; DOCX in 0.2 |
| „auf dem Datenmodell des Prozesslotsen“ | liest nur das veröffentlichte Dateiformat mit eigenen Typen | keine Code-Abhängigkeit (4.3) |
| AHP-Paarvergleich für die Gewichtung | nur für Hauptkriterien (höchstens 9) | bei 30 Einzelkriterien wären 435 Vergleiche nötig |
| Satzschablonen EARS, MASTeR | feste deutsche Satzmuster je Herkunft (6.5) | Schablonen-Quellen nicht geprüft; feste Muster sind testbar |
| Kapitalwert, Amortisation | in 0.1, optional | wenig Aufwand; Nutzenvorschlag aus den Medienbrüchen (6.3) |

### 2.4 Abgrenzung

- Keine Rechtsberatung. Rechtliche Anforderungen sind Hinweise mit Quelle und Stand.
- Kein Vergaberecht für öffentliche Auftraggeber.
- Der Auswahl-Lotse ändert keine Prozesslotse-Dateien.

---

## 3 Fachliche Grundlagen

| Thema | Was die App daraus macht | Quelle | Stand |
| --- | --- | --- | --- |
| MoSCoW | Muss, Soll, Kann, Nicht (dieses Mal); Warnung ab 60 % Muss | [Agile Business Consortium: What is MoSCoW Prioritization?](https://www.agilebusiness.org/?p=1907) | veröffentlicht 28.05.2026, abgerufen 11.11.2026 |
| Nutzwertanalyse, K.-o.-Kriterien | gewichtete Summe von Punkten; Muss nur als Voraussetzung | Standardverfahren; Primärquelle nicht abrufbar (10.3) | Festlegung in 6.9 |
| AHP | Saaty-Skala 1 bis 9, Eigenvektor, CI, CR, RI-Tabelle, Schwelle 0,10 | Saaty (1987), Mathematical Modelling 9(3–5), S. 161–176; nicht abrufbar (10.3) | Werte per Simulation geprüft (6.8) |
| Sensitivität | ein Gewicht variieren, übrige proportional anpassen | eigene Festlegung | 6.10 |
| Gesamtkosten, Barwert, Kapitalwert | Einführung in Jahr 0, laufende Kosten am Jahresende | Standardformeln der Investitionsrechnung; eigene Festlegung der Zeitpunkte | 6.11 |
| Datenschutz | Art. 17, 20, 25, 28, 32 und Kapitel V (Art. 44–46) DSGVO | [EUR-Lex, Verordnung (EU) 2016/679](https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32016R0679) | ABl. L 119 vom 04.05.2016, abgerufen 11.11.2026 |
| Unveränderbarkeit | gebuchte Daten nicht so ändern, dass der Ursprung verloren geht | [§ 146 AO](https://www.gesetze-im-internet.de/ao_1977/__146.html) | Seite ohne Standangabe, abgerufen 11.11.2026 |
| Aufbewahrung, Datenzugriff | 10, 8 und 6 Jahre; lesbar und maschinell auswertbar; Einsicht, Auswertung, Übergabe | [§ 147 AO](https://www.gesetze-im-internet.de/ao_1977/__147.html) | Seite ohne Standangabe, abgerufen 11.11.2026 |
| GoBD | nur als Hinweis; Katalog stützt sich auf die AO | BMF-Schreiben, laut Suche 2. Änderung vom 14.07.2025; Seite nicht abrufbar (10.3) | offen |
| Barrierefreiheit | Pflicht für Shops an Verbraucher, Ausnahme für Kleinstunternehmen | [BFSG](https://www.gesetze-im-internet.de/bfsg/BJNR297010021.html) § 1 Abs. 3 Nr. 5, § 2 Nr. 17 und 26, § 3 Abs. 3, § 38 | zuletzt geändert 06.05.2024, gilt seit 28.06.2025, abgerufen 11.11.2026 |
| BPMN-Erweiterung | `extensionElements` an jedem `tBaseElement`, Inhalt aus fremdem Namensraum, `processContents="lax"` | [OMG BPMN 2.0 Semantic.xsd](https://www.omg.org/spec/BPMN/20100501/Semantic.xsd) | abgerufen 11.11.2026 |
| Prozesslotse-Format | Format 2, Typen, Prüfung, Umstellung von Format 1 | `prozesslotse/docs/datenmodell.md`, `src/modell/typen.ts`, `src/modell/speicher.ts` | Commit `e482a9a`, 10.11.2026 |
| Häufigkeit je Aufgabe | Flussverfahren des Prozesslotsen, ohne Vorgängerverfolgung | `prozesslotse/src/analyse/kennzahlen.ts` (Abschnitt „Fluss“) | Commit `e482a9a` |
| Windows-Programm | Tauri 2, Installer pro Benutzer, nur vom Benutzer gewählte Pfade | [Prozesslotse – Arbeitsplan](https://claude.ai/artifact/GUoEBaUuu66sU9TdpoaeNJ), `prozesslotse/docs/windows-prototyp` | 10.11.2026 |

### 3.1 Kernaussagen der Quellen

- **MoSCoW:** Must Have ist die „Minimum Usable SubseT“, die das Vorhaben garantiert. Should ist wichtig, aber nicht lebensnotwendig; Could ist erwünscht. Won't Have gilt für diesen Zeitraum nicht. Richtwert: höchstens etwa 60 % Must-Aufwand, etwa 20 % Could-Aufwand. Der Auswahl-Lotse kennt keinen Aufwand und zählt deshalb Anforderungen.
- **§ 146 Abs. 4 AO:** Eine Buchung oder Aufzeichnung darf nicht so verändert werden, dass der ursprüngliche Inhalt nicht mehr feststellbar ist.
- **§ 147 AO:** Abs. 1 nennt die Unterlagen, darunter Arbeitsanweisungen und Organisationsunterlagen (Nr. 1). Abs. 2 verlangt jederzeitige Verfügbarkeit, unverzügliche Lesbarkeit und maschinelle Auswertbarkeit. Abs. 3: 10 Jahre für Nr. 1 und 4a, 8 Jahre für Buchungsbelege (Nr. 4), 6 Jahre für die übrigen. Abs. 6: unmittelbarer Zugriff, mittelbarer Zugriff, Datenträgerüberlassung; auch bei Dritten.
- **DSGVO:**
  - Art. 28 Abs. 1 und 3: Auftragsverarbeiter mit hinreichenden Garantien, Vertrag mit Pflichtinhalten.
  - Art. 32 Abs. 1 lit. a bis d: Verschlüsselung, Vertraulichkeit, Wiederherstellung, regelmäßige Prüfung.
  - Art. 25 Abs. 2: datenschutzfreundliche Voreinstellungen.
  - Art. 17: Löschung. Art. 20: Daten in strukturiertem, gängigem, maschinenlesbarem Format.
  - Art. 46: geeignete Garantien für Drittländer, etwa Standarddatenschutzklauseln.
- **BFSG:** gilt für Dienstleistungen im elektronischen Geschäftsverkehr an Verbraucher (§ 1 Abs. 3 Nr. 5). Kleinstunternehmen: weniger als 10 Beschäftigte und höchstens 2 Mio. € Jahresumsatz oder Jahresbilanzsumme (§ 2 Nr. 17). § 3 Abs. 3 nimmt Kleinstunternehmen aus, die Dienstleistungen erbringen.
- **BPMN-XSD:** `tBaseElement` enthält `documentation` (0..n) und `extensionElements` (0..1). `tExtensionElements` erlaubt beliebige Elemente aus fremden Namensräumen. `tCollaboration` und `tProcess` erben von `tBaseElement`.

---

## 4 Datenmodell

### 4.1 Grundsätze

- Fachlogik ohne React, alle Bezeichner deutsch in ASCII (`ae`, `oe`, `ue`, `ss`), wie beim Prozesslotsen.
- Einheiten: Geld in Euro netto; Zeiten in Minuten (`…Min`), Stunden (`…Stunden`) oder Sekunden (`…Sek`). Felder auf `…Prozent` haben 0 bis 100. Anteile, Gewichte und Häufigkeiten haben 0 bis 1.
- Datumsangaben als ISO-8601-Text. Kennungen aus `crypto.randomUUID()`.
- Berechnete Werte werden nie gespeichert, sondern bei Bedarf neu berechnet.

### 4.2 Projektdatei (`src/modell/typen.ts`)

```ts
import type { PlId, PlProjekt } from '../prozessdatei/format'

export type Id = string
/** Dateiformat des Auswahl-Lotsen. Bei inkompatiblen Änderungen erhöhen und umstellen. */
export const FORMAT_VERSION = 1
export const DATEIENDUNG = 'auswahllotse'
export const MIME_TYP = 'application/vnd.auswahllotse+json'

// ── Rahmen ────────────────────────────────────────────────────────────────
export type Softwareart = 'erp' | 'shop' | 'crm' | 'dms' | 'andere'
/** Antwort auf eine Rahmenfrage; „offen“ bedeutet „weiß nicht“. */
export type JaNeinOffen = 'ja' | 'nein' | 'offen'
export type Betriebsform = 'cloud' | 'eigener_server' | 'offen'

/** Richtwerte, die in Anforderungstexte eingesetzt werden (6.5). */
export interface Richtwerte {
  antwortzeitSek: number            // Standard 2
  aufbewahrungJahre: number         // Standard 10 (längste Frist, § 147 Abs. 3 AO)
  wiederherstellungStunden: number  // Standard 24
  verfuegbarkeitProzent: number     // Standard 99.5
  reaktionStunden: number           // Standard 4
  referenzen: number                // Standard 2
  einfuehrungWochen: number         // Standard 12
}

export interface Rahmen {
  vorhaben: string                  // z. B. „Neue Warenwirtschaft“
  betrieb: string
  ersteller: string
  softwareart: Softwareart          // Standard 'erp'
  personenbezogen: JaNeinOffen      // Standard 'ja'
  steuerrelevant: JaNeinOffen       // Standard 'ja' bei erp, shop, dms; sonst 'offen'
  betriebsform: Betriebsform        // Standard 'offen'
  verbraucherverkauf: JaNeinOffen   // nur bei shop gefragt; Standard 'offen', sonst 'nein'
  kleinstunternehmen: JaNeinOffen   // BFSG § 2 Nr. 17; Standard 'offen'
  betriebstageProJahr: number       // Standard 250, 1 bis 366
  spitzenfaktor: number             // Standard 2, mindestens 1
  richtwerte: Richtwerte
}

// ── Prozessmodell und Umfang ──────────────────────────────────────────────
export interface ProzessQuelle {
  dateiname: string
  dateiart: 'json' | 'bpmn'
  formatVersionGelesen: 1 | 2       // Format in der Datei vor der Umstellung
  exporterVersion: string | null    // aus dem BPMN-Kopf, sonst null
  sha256: string                    // Hex über den Dateitext
  eingelesenAm: string
  projekt: PlProjekt                // auf Format 2 umgestellt, nur bekannte Felder (4.3)
}

export type MediumStatus = 'abloesen' | 'anbinden' | 'unberuehrt'

export interface Umfang {
  grundlage: 'ist' | 'soll'         // Standard 'soll', wenn vorhanden
  medien: Record<PlId, MediumStatus>
  aufgabenAus: PlId[]               // trotz abgelöstem System ausgeschlossen
  aufgabenEin: PlId[]               // trotz anderem System eingeschlossen
}

// ── Anforderungen ─────────────────────────────────────────────────────────
export type Prioritaet = 'muss' | 'soll' | 'kann' | 'nicht'   // Must, Should, Could, Won't (dieses Mal)
export type AnforderungsStatus = 'vorschlag' | 'aktiv' | 'verworfen'
export type Gruppe =
  | 'funktion' | 'schnittstelle' | 'benutzer' | 'menge'
  | 'datenschutz' | 'ordnung' | 'betrieb' | 'barrierefreiheit' | 'anbieter'

/** Feste Reihenfolge; Kürzel für die Nummern. */
export const GRUPPEN: { gruppe: Gruppe; name: string; kuerzel: string }[] = [
  { gruppe: 'funktion', name: 'Funktionen', kuerzel: 'F' },
  { gruppe: 'schnittstelle', name: 'Schnittstellen und Datenfluss', kuerzel: 'S' },
  { gruppe: 'benutzer', name: 'Benutzer, Rechte und Kontrollen', kuerzel: 'R' },
  { gruppe: 'menge', name: 'Mengen und Leistung', kuerzel: 'M' },
  { gruppe: 'datenschutz', name: 'Datenschutz und Sicherheit', kuerzel: 'D' },
  { gruppe: 'ordnung', name: 'Ordnungsmäßigkeit (AO, GoBD)', kuerzel: 'G' },
  { gruppe: 'betrieb', name: 'Betrieb und Support', kuerzel: 'B' },
  { gruppe: 'barrierefreiheit', name: 'Barrierefreiheit', kuerzel: 'BF' },
  { gruppe: 'anbieter', name: 'Anbieter und Einführung', kuerzel: 'A' },
]

export type HerkunftArt =
  | 'aufgabe' | 'entscheidung' | 'medienbruch' | 'rollen' | 'freigabe' | 'pruefung'
  | 'mengengeruest' | 'katalog' | 'baustein' | 'eigene'

export interface Herkunft {
  art: HerkunftArt
  bezuege: PlId[]                   // Kennungen im Prozessmodell (Aufgaben, Rollen, Systeme)
  katalogId: string | null          // z. B. 'N-DS-1' oder 'ERP-3'
}

/** Was der Benutzer selbst geändert hat; „Neu einlesen“ überschreibt das nicht (6.14). */
export interface Bearbeitet { text: boolean; prioritaet: boolean; status: boolean }

export interface Anforderung {
  id: Id                            // stabil, Regel A0
  nummer: string | null             // 'F-03'; erst bei Aktivierung vergeben, nie wiederverwendet
  gruppe: Gruppe
  titel: string
  text: string
  abnahme: string                   // Abnahmekriterium
  prioritaet: Prioritaet
  prioritaetVorschlag: Prioritaet   // aus der Regel; Anzeige „geändert“, wenn abweichend
  status: AnforderungsStatus
  herkunft: Herkunft
  begruendung: string               // Herleitung in Klartext
  quelle: string | null             // Rechtsquelle mit Stand (Katalog und Bausteine)
  punkte: number                    // Gewicht in der Gruppe, ganze Zahl 0 bis 10
  bearbeitet: Bearbeitet
  notiz: string
}

// ── Gewichtung ────────────────────────────────────────────────────────────
export type Gewichtungsmethode = 'direkt' | 'paarvergleich'
export type Staerke = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** Ein Urteil im Paarvergleich; Stärke 1 heißt „gleich wichtig“. */
export interface Paarurteil { a: Gruppe; b: Gruppe; wichtiger: 'a' | 'b'; staerke: Staerke }

export interface Gewichtung {
  methode: Gewichtungsmethode       // Standard 'direkt'
  direktProzent: Partial<Record<Gruppe, number>>   // ganze Zahlen, Summe 100
  paare: Paarurteil[]
  festgelegtAm: string | null
  aenderungenNachBewertung: number  // Zähler, Regel G5
}

// ── Angebote und Kosten ───────────────────────────────────────────────────
export type KoErgebnis = 'erfuellt' | 'nicht_erfuellt' | 'offen'

export interface Bewertung {
  ko: KoErgebnis | null             // nur bei Muss
  punkte: number | null             // nur bei Soll und Kann, ganze Zahl 0 bis 10
  fundstelle: string                // z. B. „Angebot S. 4“, „Vorführung 12.11.“
  notiz: string
}

export type EinmaligArt = 'lizenzkauf' | 'einrichtung' | 'datenuebernahme' | 'anpassung' | 'schulung' | 'hardware' | 'sonstiges'
export type LaufendArt = 'abo' | 'wartung' | 'hosting' | 'support' | 'sonstiges'

export interface Kostenposition<A extends string> { id: Id; art: A; bezeichnung: string; betragEuro: number }

export interface Kosten {
  einmalig: Kostenposition<EinmaligArt>[]
  laufendJahr: Kostenposition<LaufendArt>[]         // Betrag je Jahr
  preisJeBenutzerMonatEuro: number                  // 0, wenn nicht nach Benutzern
  internEinfuehrungTage: number                     // Personentage
  internSchulungStundenJeBenutzer: number
  internBetriebStundenMonat: number
}

export interface Angebot {
  id: Id
  anbieter: string
  produkt: string
  betriebsform: 'cloud' | 'eigener_server'
  angebotsdatum: string | null
  notiz: string
  bewertungen: Record<Id, Bewertung>                // Schlüssel: Anforderung.id
  kosten: Kosten
}

export interface Wirtschaftlichkeit {
  jahre: number                     // 1 bis 10, Standard 5
  benutzer: number                  // Standard: Vorschlag aus dem Umfang (6.3)
  internerStundensatzEuro: number   // Standard: Vorschlag aus den Rollen (6.11)
  stundenProPersonentag: number     // Standard: arbeitsstundenProTag der Grundlage, sonst 8
  preissteigerungProzent: number    // laufende Kosten je Jahr, Standard 0
  zinsProzent: number | null        // Kalkulationszins; null = ohne Abzinsung
  kostenbasis: 'nominal' | 'barwert'
  nutzenProJahrEuro: number | null  // optional, gleich für alle Angebote
  budgetEuro: number | null         // über den Betrachtungszeitraum
  budgetAlsKo: boolean
}

// ── Entscheidung ──────────────────────────────────────────────────────────
export type Entscheidungsregel = 'nutzwert' | 'preis_leistung'

export interface Risiko { id: Id; text: string; massnahme: string }

export interface Entscheidung {
  regel: Entscheidungsregel         // Standard 'nutzwert'
  mindestNutzwert: number           // nur preis_leistung, 0 bis 10, Standard 5
  gewaehltId: Id | null             // null = Empfehlung der Regel
  begruendung: string               // leer = Entwurf anzeigen (6.13)
  risiken: Risiko[]
  status: 'entwurf' | 'final'
  datum: string | null
}

// ── Projekt ───────────────────────────────────────────────────────────────
export interface AuswahlProjekt {
  app: 'auswahllotse'
  formatVersion: typeof FORMAT_VERSION
  id: Id
  angelegtAm: string
  geaendertAm: string
  rahmen: Rahmen
  prozess: ProzessQuelle | null
  umfang: Umfang | null
  anforderungen: Anforderung[]
  naechsteNummer: Partial<Record<Gruppe, number>>   // nächste freie Nummer je Gruppe
  gewichtung: Gewichtung
  angebote: Angebot[]
  bewertungBegonnenAm: string | null                // erste Punktzahl oder erstes K.-o.-Ergebnis
  wirtschaftlichkeit: Wirtschaftlichkeit
  entscheidung: Entscheidung
}

/** Im Browser getrennt vom Projekt gespeichert. */
export interface Einstellungen { lernmodus: boolean; farbschema: 'system' | 'hell' | 'dunkel' }
```

### 4.3 Schnittstelle zum Prozesslotsen

**Grundsatz:** Der Vertrag ist das Dateiformat, nicht der Code. Der Auswahl-Lotse importiert nichts aus dem Prozesslotse-Repo und nutzt kein gemeinsames Paket.

**Eigene Typen** in `src/prozessdatei/format.ts`, Präfix `Pl`. Sie bilden das veröffentlichte Format 2 ab (`prozesslotse/docs/datenmodell.md`, `src/modell/typen.ts`, Commit `e482a9a`):

```ts
export type PlId = string
export const PL_FORMATE = [1, 2] as const

export type PlMediumArt = 'papier' | 'telefon' | 'email' | 'tabelle' | 'fachanwendung' | 'erp' | 'sonstiges'
export const PL_NICHT_DIGITAL: PlMediumArt[] = ['papier', 'telefon']

export interface PlMedium { id: PlId; name: string; art: PlMediumArt }
export interface PlRolle { id: PlId; name: string; stundensatz: number; personen: number; verfuegbarProzent: number }
export interface PlUebertragung { quelleMediumId: PlId | null; minuten: number }

export interface PlAufgabe {
  typ: 'aufgabe'; id: PlId; name: string
  rolleId: PlId | null; mediumId: PlId | null
  bearbeitungMin: number; liegezeitMin: number
  art: 'normal' | 'pruefung' | 'freigabe'; freigabeQuote: number
  brauchtVorgaenger: boolean | null
  uebertragung: PlUebertragung | null
}
export interface PlSequenz { id: PlId; schritte: PlBlock[] }
export interface PlZweig extends PlSequenz {
  bezeichnung: string; anteil: number
  ende: string | null; zurueckZu: PlId | null
  ereignis: { art: 'zeit' | 'nachricht'; dauerMin: number } | null
}
export interface PlEntscheidung { typ: 'entscheidung'; id: PlId; art: 'daten' | 'ereignis'; frage: string; zweige: PlZweig[] }
export interface PlParallel { typ: 'parallel'; id: PlId; zweige: PlSequenz[] }
export interface PlWiederholung {
  typ: 'wiederholung'; id: PlId; modus: 'anteil' | 'ruecksprung'
  zweck: 'nacharbeit' | 'menge'     // fehlt in der Datei → 'nacharbeit'
  frage: string; anteilWiederholung: number; koerper: PlSequenz
}
export interface PlWarten { typ: 'warten'; id: PlId; name: string; art: 'zeit' | 'nachricht'; dauerMin: number }
export type PlBlock = PlAufgabe | PlEntscheidung | PlParallel | PlWiederholung | PlWarten

export interface PlProzess {
  id: PlId; name: string; beschreibung: string
  ausloeser: { art: 'nachricht' | 'zeit' | 'bedingung' | 'manuell'; text: string }
  ergebnis: string
  vorgaengeProTag: number; arbeitsstundenProTag: number
  rollen: PlRolle[]; medien: PlMedium[]; ablauf: PlSequenz
}
export interface PlMassnahme { schluessel: string; titel: string; begruendung: string }
export interface PlProjekt { formatVersion: 2; ist: PlProzess; soll: PlProzess | null; massnahmen: PlMassnahme[]; verworfen: string[] }
```

**Lesen** (Regeln E1 bis E13 in 6.1):

1. Versionsprüfung zuerst. Format 1 wird umgestellt, Format 2 gelesen, jedes andere abgelehnt.
2. Toleranter Leser: Unbekannte Felder werden ignoriert und nicht übernommen. Unbekannte Werte bei Medienart und Aufgabenart bekommen einen sicheren Ersatz und einen Hinweis. Unbekannte Bausteintypen sind ein Formatfehler.
3. Projektion: Der Leser kopiert nur bekannte Felder einzeln in neue Objekte. So bleibt die Projektdatei des Auswahl-Lotsen unabhängig.
4. Strukturfehler (falsche Typen) führen zur Ablehnung. Modellfehler (Anteile ≠ 100 %, Rücksprung ins Leere) werden eingelesen und als Warnung gezeigt.

**Vertragstests:** Testdateien werden im Prozesslotsen erzeugt und mit Commit-Hash abgelegt (9.3). Ein neues Format des Prozesslotsen braucht einen eigenen Arbeitsschritt: neue `Pl`-Typen, Umstellung, neue Testdatei.

**BPMN mit eingebettetem Projekt (Vorschlag, mit dem Prozesslotsen abzustimmen, 10.1):**

```xml
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:pl="https://olbricht-digital.de/prozesslotse/projekt" …>
  <bpmn:collaboration id="Kollaboration">
    <bpmn:extensionElements>
      <pl:projekt formatVersion="2">{"formatVersion":2,"ist":{…},"soll":null,…}</pl:projekt>
    </bpmn:extensionElements>
    <bpmn:participant id="Teilnehmer" … />
  </bpmn:collaboration>
  …
```

- Namensraum `https://olbricht-digital.de/prozesslotse/projekt`, Element `projekt`, Attribut `formatVersion`.
- Inhalt: das Projekt-JSON als XML-Text. `&`, `<` und `>` werden maskiert; CDATA ist erlaubt.
- `extensionElements` steht als erstes Kind der Kollaboration (nach eventueller `documentation`), wie es die XSD verlangt.
- Der Leser sucht das Element im ganzen Dokument. Die genaue Stelle ist für ihn egal.
- Änderungen am Diagramm in anderen Werkzeugen sieht der Auswahl-Lotse nicht. Er zeigt dazu einen Hinweis.

### 4.4 Berechnete Ergebnisse (`src/modell/ergebnisse.ts`, nie gespeichert)

```ts
export type Schwere = 'fehler' | 'warnung' | 'hinweis'
export interface Befund { schwere: Schwere; code: string; text: string; bezug: Id | null }

export type MedienbruchFall = 'A' | 'B' | 'C' | 'D' | 'E'   // 6.4
export interface Medienbruch {
  quelleId: PlId | null; zielId: PlId; fall: MedienbruchFall
  aufgaben: PlId[]
  uebertragungenProTag: number; minutenProTag: number; euroProTag: number
}

export interface RollenMenge { rolleId: PlId; name: string; benutzer: number; aufgaben: PlId[]; arbeitMinProTag: number }

export interface Mengengeruest {
  vorgaengeProTag: number; vorgaengeSpitze: number; vorgaengeProJahr: number
  haeufigkeit: Map<PlId, number>              // Ausführungen je Vorgang, je Aufgabe der Grundlage
  imUmfang: PlId[]
  rollen: RollenMenge[]; benutzer: number
  medienbrueche: Medienbruch[]
  kostenProVorgangIst: number; kostenProVorgangSoll: number | null
  medienbruchkostenProJahr: number            // Fälle A, B, C; Nutzenvorschlag
  enden: { ergebnis: string; anteil: number; regulaer: boolean }[]
  datenbestand: number                        // Vorgänge über die Aufbewahrungsdauer
  befunde: Befund[]
}

export interface AhpErgebnis {
  gewichte: number[]; lambdaMax: number; ci: number; cr: number
  stimmig: boolean                            // cr ≤ 0,10
  widerspruch: [number, number] | null        // Indizes des widersprüchlichsten Urteils
}

export interface KostenErgebnis {
  einmalig: number; laufend: number[]; tco: number
  barwert: number | null; kapitalwert: number | null; amortisationJahr: number | null
}

export interface AngebotsErgebnis {
  angebotId: Id; gueltig: boolean; ausschluss: string[]
  koOffen: number; fehlend: number
  gruppenwerte: Partial<Record<Gruppe, number>>; nutzwert: number
  kosten: KostenErgebnis; kostenbasis: number; euroJePunkt: number | null; rang: number | null
}

export interface Stabilitaet {
  gruppe: Gruppe; gewicht: number; von: number; bis: number
  abstand: number | null                      // null = über den ganzen Bereich stabil
  knapp: boolean
}

export interface Auswertung {
  gewichte: Partial<Record<Gruppe, number>>; ahp: AhpErgebnis | null
  ergebnisse: AngebotsErgebnis[]; empfehlungId: Id | null; vorlaeufig: boolean
  stabilitaet: Stabilitaet[]; befunde: Befund[]
}
```

---

## 5 Oberfläche und Ablauf

### 5.1 Aufbau

- **Kopfleiste:** Neu, Öffnen, Speichern, Beispiel laden, Lernmodus, Hell/Dunkel. Ein Punkt im Titel zeigt Ungespeichertes.
- **Schrittleiste** mit 7 Schritten wie beim Prozesslotsen. Jeder erreichte Schritt bleibt anklickbar.
- **Sperren:** Schritt 4 braucht mindestens eine aktive Soll- oder Kann-Anforderung. Schritt 6 braucht mindestens ein Angebot.
- **Lernmodus:** kurze Erklärung neben jeder Methode (MoSCoW, K.-o.-Kriterium, Medienbruch, Abnahmekriterium, Paarvergleich und Konsistenz, Nutzwert, Sensitivität, Gesamtkosten, Barwert und Kapitalwert).
- **Rückgängig und Wiederholen** für alle Änderungen, wie im Prozesslotsen (`src/zustand.ts`).

### 5.2 Schritt 1 – Rahmen

| Frage | Antwort | Standard | Wirkung |
| --- | --- | --- | --- |
| Wie heißt das Vorhaben? | Text | – | Titel der Vorlagen |
| Für welchen Betrieb? | Text | – | Kopf der Vorlagen |
| Wer erstellt die Unterlagen? | Text | – | Kopf der Vorlagen |
| Welche Art Software wird gesucht? | ERP · Shop · CRM · DMS · andere | ERP | Bausteine, Standard-Umfang |
| Verarbeitet die Software Daten über Personen (Kunden, Beschäftigte)? | ja · nein · weiß nicht | ja | Datenschutz-Katalog |
| Erzeugt oder speichert sie steuerlich wichtige Unterlagen (Rechnungen, Belege, Buchungen)? | ja · nein · weiß nicht | ja bei ERP, Shop, DMS; sonst weiß nicht | AO-Katalog |
| Wo soll sie laufen? | beim Anbieter (Cloud) · auf eigenem Server · offen | offen | Auftragsverarbeitung, Verfügbarkeit |
| Verkauft der Betrieb darüber an Verbraucher? (nur Shop) | ja · nein · weiß nicht | weiß nicht | BFSG |
| Hat der Betrieb weniger als 10 Beschäftigte und höchstens 2 Mio. € Umsatz oder Bilanzsumme? | ja · nein · weiß nicht | weiß nicht | BFSG-Ausnahme |
| An wie vielen Tagen im Jahr arbeitet der Betrieb? | Zahl | 250 | Mengen und Nutzen pro Jahr |
| Wievielmal so viele Vorgänge gibt es an starken Tagen? | Zahl | 2 | Spitzenlast |
| Richtwerte (aufklappbar) | Zahlen | siehe 4.2 | Texte von M-03, M-04 und Katalog |

### 5.3 Schritt 2 – Prozess

**Teil A, Prozessmodell.** Knöpfe „Prozesslotse-Datei wählen“ (`.prozesslotse`, `.json`, `.bpmn`) und „Ohne Prozessmodell weiter“. Nach dem Einlesen zeigt eine Karte:

- Name des Prozesses, Format („Format 2“, bei Format 1 „umgestellt“), Datei und Zeitpunkt.
- Ist und Soll vorhanden, Anzahl Aufgaben, Rollen und Systeme, Vorgänge pro Tag.
- Befunde des Lesers.
- Auswahl der Grundlage: Soll-Prozess (empfohlen, wenn vorhanden) oder Ist-Prozess.
- Ist schon ein Modell geladen, heißt der Knopf „Neu einlesen“. Er zeigt vor dem Übernehmen eine Vorschau der Änderungen (6.14).

**Teil B, Umfang.**

- Tabelle der Systeme: Name, Art, Anzahl Aufgaben, Status als Optionsgruppe (ablösen · anbinden · unberührt). Der Standard trägt die Marke „Vorschlag“.
- Aufgabenliste in Prozessreihenfolge mit Einrückung: Kontrollkästchen „im Umfang“, Name, Rolle, System, Ausführungen pro Tag.
- Zählerzeile, z. B. „8 Aufgaben im Umfang · 4 Rollen · 7 Benutzer · 2 Medienbrüche betroffen“.

### 5.4 Schritt 3 – Anforderungen

- **Kopf:** aktive Anforderungen, Muss-Anteil als Balken mit Marke bei 60 %, offene Vorschläge, Befunde.
- **Filter:** Gruppe, Priorität, Status, „nur mit Befund“.
- **Liste je Gruppe.** Jede Karte zeigt Nummer und Titel, Text und Abnahmekriterium (bearbeitbar), MoSCoW als Optionsgruppe (Muss · Soll · Kann · Nicht). Dazu Herkunft mit Begründung, Quelle (bei Katalog) und Befunde. Eine Marke „geändert“ erscheint, wenn die Priorität vom Vorschlag abweicht.
- **Aktionen:** Übernehmen, Verwerfen, Wiederherstellen; „Eigene Anforderung“; „Alle Vorschläge dieser Gruppe übernehmen“.

### 5.5 Schritt 4 – Gewichtung

- **Hauptkriterien:** Gruppen mit mindestens einer aktiven Soll- oder Kann-Anforderung. Gruppen nur mit Muss stehen darunter als „wirkt nur als K.-o.“.
- **Methode direkt:** Prozentfelder je Gruppe, Summenanzeige, Knöpfe „gleich verteilen“ und „auf 100 % bringen“.
- **Methode Paarvergleich:** je Paar eine Zeile mit 17 Stufen von „links sehr viel wichtiger“ über „gleich wichtig“ bis „rechts sehr viel wichtiger“. Beschriftet sind die Stufen 9, 7, 5, 3 und 1: „sehr viel wichtiger“, „viel wichtiger“, „deutlich wichtiger“, „etwas wichtiger“, „gleich wichtig“. Ergebnis: Gewichte als Balken und Konsistenz als Ampel. Bei CR über 0,10 nennt die App das widersprüchlichste Urteil.
- **Unterpunkte:** je Gruppe die Soll- und Kann-Anforderungen mit Punkten 0 bis 10 und dem daraus folgenden Gesamtgewicht in Prozent.
- **Entscheidungsregel:** „höchster Nutzwert“ oder „bestes Preis-Leistungs-Verhältnis“ mit Mindestnutzwert. Dazu Budget, optional als K.-o.
- **Knopf „Gewichte und Regel festlegen“.** Ändert der Nutzer danach etwas, obwohl die Bewertung begonnen hat, erscheint ein Hinweis. Die Entscheidungsvorlage nennt die Zahl dieser Änderungen.

### 5.6 Schritt 5 – Angebote

- Angebotsliste mit „Angebot hinzufügen“: Anbieter, Produkt, Betriebsform, Angebotsdatum, Notiz.
- **Reiter „Bewertung“:** Tabelle der aktiven Anforderungen nach Gruppen. Muss-Zeilen: erfüllt · nicht erfüllt · offen. Soll- und Kann-Zeilen: Punkte 0 bis 10 mit Schnellwahl 0, 3, 5, 8, 10 („nicht“, „ansatzweise“, „teilweise oder mit Anpassung“, „weitgehend im Standard“, „vollständig im Standard“). Dazu Fundstelle und Notiz je Zeile. Fortschritt „27 von 35 bewertet“.
- **Reiter „Kosten“:** oben die Annahmen für alle Angebote (Jahre, Benutzer, interner Stundensatz, Stunden je Personentag, Preissteigerung, Zins, Kostenbasis, Nutzen). Vorschlagswerte stehen daneben mit Knopf „übernehmen“. Darunter je Angebot einmalige und laufende Positionen, Preis je Benutzer und Monat, interne Aufwände. Live-Summen: einmalig, laufend im 1. Jahr, Gesamtkosten.

### 5.7 Schritt 6 – Ergebnis

- **Empfehlung** nach der gewählten Regel, mit Marke „vorläufig“, wenn Bewertungen fehlen.
- **K.-o.-Übersicht:** je Angebot die nicht erfüllten und offenen Muss-Kriterien.
- **Nutzwert:** waagrechte, nach Gruppen gestapelte Balken je Angebot, darunter die Tabelle der Gruppenwerte.
- **Kosten:** Balken der Gesamtkosten und Tabelle (einmalig, laufend gesamt, Gesamtkosten, Barwert, Kapitalwert, Amortisationsjahr, € je Nutzwertpunkt).
- **Sensitivität:** je Hauptkriterium der stabile Bereich als Text („Funktionen: 0,0 bis 51,6 %, heute 50,0 %“) und ein kleines Liniendiagramm. Knappe Bereiche sind markiert.
- **Befunde** aller Stufen mit Sprung zur Ursache.

### 5.8 Schritt 7 – Vorlagen

Zwei Reiter, beide mit Vorschau und „Drucken / als PDF“.

**Lastenheft** (A4):

- **Abschnitt 1, Ausgangslage und Ziel.** Textmuster: „{Betrieb} sucht {Softwareart-Text} für den Prozess „{Prozess}“. Heute laufen {V} Vorgänge pro Tag. Dabei werden täglich {n} Datensätze von Hand übertragen ({h} Stunden).“
- **Abschnitt 2, Umfang:** abgelöste, anzubindende und unberührte Systeme; Aufgaben im Umfang mit Rolle und Häufigkeit.
- **Abschnitte 3 bis 11, je Gruppe eine Tabelle:** Nr., Anforderung, Priorität, Abnahmekriterium; Begründung und Quelle klein darunter. Eine Gruppe ohne aktive Anforderung zeigt „Keine Anforderungen in diesem Vorhaben.“
- **Abschnitt 12, Hinweise:** MoSCoW kurz erklärt; „Muss-Anforderungen sind K.-o.-Kriterien“; „Rechtliche Hinweise ohne Gewähr, Stand {Datum}“.
- **Anhang:** Gliederung des Prozesses als eingerückte Liste.

Softwareart-Text: ERP → „ein ERP-System“, Shop → „ein Shopsystem“, CRM → „ein CRM-System“, DMS → „ein Dokumentenmanagementsystem“, andere → „eine Software“.

**Entscheidungsvorlage** (A4, etwa 3 bis 5 Seiten):

1. Kopf: Vorhaben, Betrieb, Ersteller, Datum, Status (Entwurf oder final).
2. Empfehlung im Kasten: gewähltes Angebot, Begründung, Nutzwert, Kosten über {T} Jahre.
3. Ausgangslage: Prozess, Vorgänge pro Tag, Medienbrüche pro Tag, Arbeitszeitkosten des Prozesses pro Jahr (Ist, Soll falls vorhanden).
4. Vorgehen: Muss als K.-o., Gewichtungsmethode (bei AHP mit CR), Punkteskala, Entscheidungsregel, Datum der Festlegung, Änderungen nach Bewertungsbeginn.
5. Ergebnis: K.-o.-Tabelle, Nutzwerttabelle mit Balken, Rangfolge.
6. Kosten: Tabelle je Angebot, Barwert und Kapitalwert falls gesetzt.
7. Sensitivität: stabile Bereiche je Hauptkriterium.
8. Risiken und nächste Schritte (Liste aus dem Projekt).
9. Freigabe: Felder für Ort, Datum, Name, Unterschrift.

**Bedienelemente der Vorlage:** Angebot wählen (Standard: Empfehlung), Begründung mit Knopf „Entwurf erzeugen“, Risiken, Status. Weicht die Wahl von der Empfehlung ab und ist die Begründung leer, erscheint eine Warnung.

**Exporte:** Anbieterfragebogen (CSV, 6.15), Projekt speichern.

### 5.9 Barrierefreiheit der App

- Nur native Bedienelemente; Optionsgruppen in `fieldset` mit `legend`; jedes Feld beschriftet.
- Tabellen mit `th` und `scope`. Jedes SVG-Diagramm hat `role="img"`, eine Beschriftung und eine Datentabelle.
- Farbe trägt nie allein Bedeutung; Ampeln haben Text.
- Beim Schrittwechsel springt der Fokus auf die Überschrift des Schritts.
- axe meldet in keinem Schritt Befunde der Stufen „serious“ oder „critical“, weder hell noch dunkel.

---

## 6 Regeln, Berechnungen und Prüfungen

Alle Konstanten stehen in `src/regeln/schwellen.ts` mit Kommentar und Quelle. Rundung erst in der Anzeige: Nutzwert 2 Nachkommastellen, Euro ohne Nachkommastellen, Gewichte und Prozent 1 Nachkommastelle, Häufigkeiten pro Tag ab 10 ganzzahlig, darunter 1 Nachkommastelle. Formatierung mit `Intl.NumberFormat('de-DE')`. Vor „€“ steht dabei ein geschütztes Leerzeichen; Tests vergleichen Texte mit normalisiertem Leerraum.

### 6.1 Einlesen (`src/prozessdatei/`)

- **E1 Dateigröße:** höchstens 5 MB (5 242 880 Byte), sonst „Die Datei ist größer als 5 MB.“
- **E2 Dateiart:** Endung `.bpmn` oder erstes Nicht-Leerzeichen `<` → BPMN-Weg (E9). Sonst JSON-Weg.
- **E3 JSON:** `JSON.parse`; Fehler → „Die Datei ist kein gültiges JSON.“ Kein Objekt → „Die Datei enthält kein Prozesslotse-Projekt.“ Feld `app = 'auswahllotse'` → „Das ist ein Auswahl-Lotse-Projekt. Bitte über „Öffnen“ laden.“
- **E4 Version:** `formatVersion` 1 → Umstellung wie `migriereVon1` im Prozesslotsen: Entscheidung ohne `art` → `'daten'`; Ausgänge ohne `zurueckZu` oder `ereignis` → `null`; Wiederholung ohne `modus` → `'anteil'`. Version 2 → lesen. Sonst → „Diese Datei hat Format {n}. Der Auswahl-Lotse kennt Format 1 und 2. Bitte den Auswahl-Lotsen aktualisieren.“
- **E5 Struktur:** Pflichtfelder und Typen wie `speicher.ts` des Prozesslotsen. Meldungen mit Pfad, z. B. „Ist-Prozess, Ablauf, Schritt 3: unbekannter Baustein „schleife“.“ Prozess-`formatVersion`, falls vorhanden, muss 1 oder 2 sein.
- **E6 Grenzen:** Verschachtelungstiefe höchstens 50 Ebenen, höchstens 5 000 Bausteine je Prozess, höchstens 500 Rollen und 500 Systeme. Die Prüfung zählt mit und bricht ab, bevor der Stapel überläuft.
- **E7 Ersatzwerte mit Hinweis:** unbekannte Medienart → `'sonstiges'`; unbekannte Aufgabenart → `'normal'`; fehlender `zweck` → `'nacharbeit'`; Rollen- oder Systemkennung ohne Treffer → `null` mit Warnung.
- **E8 Modellprüfung (nur Warnungen):** Anteile einer Entscheidung ergeben nicht 100 % (Toleranz 0,001) → „Anteile ergeben {x} %; Häufigkeiten sind unsicher.“ `zurueckZu` zeigt auf keine umschließende Wiederholung im Modus `ruecksprung` → „Rücksprung ins Leere“.
- **E9 BPMN:** Enthält der Text `<!DOCTYPE` (ohne Beachtung der Groß- und Kleinschreibung) → Ablehnung vor dem Parsen: „BPMN-Dateien mit DOCTYPE liest der Auswahl-Lotse aus Sicherheitsgründen nicht.“ Sonst `DOMParser` mit `application/xml`. Ein `parsererror`-Element → „Die Datei ist kein gültiges XML.“
- **E10 BPMN-Wurzel:** Namensraum `http://www.omg.org/spec/BPMN/20100524/MODEL`, lokaler Name `definitions`; sonst „Die Datei ist keine BPMN-2.0-Datei.“ Das Attribut `exporterVersion` wird übernommen, falls vorhanden.
- **E11 Einbettung:** `getElementsByTagNameNS('https://olbricht-digital.de/prozesslotse/projekt', 'projekt')`. Kein Treffer → „Diese BPMN-Datei enthält kein Prozesslotse-Projekt. Bitte im Prozesslotsen mit eingebettetem Projekt exportieren.“ Mehrere → erster Treffer und Hinweis.
- **E12 Abgleich:** Attribut `formatVersion` ist eine ganze Zahl und gleich dem `formatVersion` im JSON (`textContent`). Sonst „Das eingebettete Projekt ist beschädigt.“ Danach weiter mit E3 bis E8.
- **E13 Prüfsumme:** SHA-256 über den Dateitext mit `crypto.subtle.digest`, als Hex in `ProzessQuelle.sha256`.

### 6.2 Häufigkeit je Aufgabe (Flussverfahren)

Skalare Fassung der Flussrechnung des Prozesslotsen. Ein Fluss `f` ist die erwartete Zahl, mit der eine Stelle je Vorgang erreicht wird. Jede Folge liefert `aus` (geht normal weiter) und `rueck` (springt je Rücksprungbereich zurück).

- **H1 Folge:** Bausteine nacheinander; `aus` des einen ist der Fluss des nächsten; `rueck` wird je Bereich addiert.
- **H2 Aufgabe:** `h(Aufgabe) += f`; `aus = f`.
- **H3 Warten:** `aus = f`.
- **H4 Entscheidung:** je Ausgang Folge mit `f · anteil`. Ausgang mit `ende` → `enden[ende] += aus_Ausgang`. Mit `zurueckZu` → `rueck[zurueckZu] += aus_Ausgang`. Sonst `aus += aus_Ausgang`. Gilt für beide Arten (Daten, Ereignis).
- **H5 Gleichzeitig:** jeder Zweig mit `f`; `aus = Minimum` der Zweig-Ausgänge; ohne Zweige `aus = f`.
- **H6 Wiederholung:** Probelauf des Körpers mit Fluss 1, ohne zu zählen, ergibt `aus₁` und `rueck₁`.
  - Modus `anteil`: `p = min(max(anteilWiederholung, 0), 0.999)`, `wieder = p · aus₁`.
  - Modus `ruecksprung`: `p = 0`, `wieder = rueck₁[eigene Kennung]` (0, wenn nicht vorhanden).
  - `r = min(wieder, 0.999)`, Eingang `E = f / (1 − r)`. Der Körper läuft zählend mit `E`.
  - `aus = aus_Körper · (1 − p)`; `rueck` des Körpers ohne die eigene Kennung wird weitergegeben.
- **H7 Regulär:** `aus` der Hauptfolge ist der Anteil des regulären Endes. Alle Enden ergeben zusammen 1, wenn das Modell fehlerfrei ist.

### 6.3 Mengengerüst (`src/prozessdatei/mengengeruest.ts`)

`V` = `vorgaengeProTag` der Grundlage, `T_B` = Betriebstage, `h` = Häufigkeit aus 6.2.

- **M1** `vorgaengeSpitze = ceil(V · spitzenfaktor)`, `vorgaengeProJahr = V · T_B`.
- **M2** Ausführungen pro Tag einer Aufgabe = `h · V`.
- **M3 Benutzer:** Rollen mit mindestens einer Aufgabe im Umfang; je Rolle `ceil(personen)`, bei `personen = 0` → 0 mit Hinweis. `benutzer` = Summe.
- **M4** Arbeitsminuten pro Tag je Rolle im Umfang = Σ `h · bearbeitungMin · V` über ihre Aufgaben im Umfang.
- **M5 Kosten je Vorgang** (Ist, und Soll falls vorhanden) = Σ `h · bearbeitungMin / 60 · stundensatz` über alle Aufgaben mit gültiger Rolle. Arbeitszeitkosten pro Jahr = Kosten je Vorgang `· V · T_B`.
- **M6 Medienbrüche:** je Paar (Quelle, Ziel) siehe 6.4. `uebertragungenProTag` = Σ `h · V`, `minutenProTag` = Σ `h · minuten · V`, `euroProTag` = Σ `h · minuten / 60 · stundensatz · V`.
- **M7 Nutzenvorschlag** `medienbruchkostenProJahr` = Σ `euroProTag · T_B` über die Fälle A, B und C.
- **M8** `datenbestand = vorgaengeProJahr · aufbewahrungJahre`.

### 6.4 Umfang und Medienbrüche

- **U1 Standardstatus je System:**

  | Medienart | Softwareart ERP | übrige Softwarearten |
  | --- | --- | --- |
  | erp | ablösen | anbinden |
  | tabelle | ablösen | ablösen |
  | fachanwendung | anbinden | anbinden |
  | email, papier, telefon, sonstiges | unberührt | unberührt |

  Für Shop, CRM und DMS markiert der Nutzer das abzulösende System selbst; die Seite weist darauf hin.
- **U2** Eine Aufgabe ist im Umfang, wenn ihr System „ablösen“ hat und sie nicht in `aufgabenAus` steht, oder wenn sie in `aufgabenEin` steht. Aufgaben ohne System sind nicht im Umfang und erzeugen einen Hinweis.
- **U3** Rollen im Umfang sind die Rollen der Aufgaben im Umfang.
- **U4 Medienbruch-Fälle.** Paar = (Quelle `q` der Übertragung, System `z` der Aufgabe). Status `s(q)`, `s(z)`; eine fehlende Quelle gilt als „unberührt, nicht digital“.

  | Fall | Bedingung | Ergebnis |
  | --- | --- | --- |
  | A | beide „ablösen“ | Integration in der neuen Software, aktiv |
  | B | eins „ablösen“, das andere „anbinden“ | Schnittstelle, aktiv |
  | C | eins „ablösen“, das andere „unberührt“ und nicht digital (Papier, Telefon) | Erfassung an der Quelle, aktiv |
  | D | eins „ablösen“, das andere „unberührt“ und digital | Schnittstelle als Vorschlag |
  | E | keins „ablösen“ | keine Anforderung, Liste „außerhalb des Umfangs“ |

- **U5 Ist und Soll:** Ist die Grundlage der Soll-Prozess, zählen die Übertragungen aus Ist und Soll, je Aufgabenkennung einmal. Werte kommen aus dem Soll, wenn die Aufgabe dort noch eine Übertragung hat, sonst aus dem Ist (mit `V` des Ist). So bleiben Medienbrüche sichtbar, die der Soll-Prozess durch Automatisierung beseitigt.

### 6.5 Ableitung des Lastenhefts (`src/lastenheft/`)

- **A0 Kennungen:** `aufgabe:{aufgabeId}`, `entscheidung:{id}`, `medienbruch:{quelleId oder 'ohne'}>{zielId}`, `rollen`, `freigabe:{aufgabeId}`, `pruefung:{aufgabeId}`, `menge:vorgaenge`, `menge:benutzer`, `menge:antwortzeit`, `menge:datenbestand`, `katalog:{id}`, `baustein:{id}`, `eigene:{uuid}`.
- **A1 Modalverb nach Priorität:** muss → „muss“, soll → „sollte“, kann → „kann“, nicht → „muss“ (mit Marke „nicht in diesem Vorhaben“). Ändert sich die Priorität und ist der Text unbearbeitet, wird er neu erzeugt.
- **A2 Funktion je Aufgabe im Umfang** (Gruppe `funktion`, Status aktiv):
  - Priorität: Muss, wenn `h ≥ 0.5` (Normalfall), sonst Soll (Sonderfall). Konstante `NORMALFALL_SCHWELLE = 0.5`, eigene Festlegung.
  - Titel: Name der Aufgabe.
  - Text: „Die Software [muss] die Aufgabe „{name}“ für die Rolle {rolle} unterstützen.“ Ohne Rolle: „… für alle Benutzer unterstützen.“
  - Abnahme: „Test mit Beispieldaten: Eine Person der Rolle {rolle} erledigt „{name}“ vollständig in der Software, ohne Daten abzutippen, in höchstens {bearbeitungMin} Minuten.“ Bei `bearbeitungMin = 0` entfällt der Zeitteil.
  - Begründung: „Aus dem Prozessmodell: {proTag} Ausführungen pro Tag, heute mit „{system}“.“
- **A3 Entscheidung als Vorschlag:** Entscheidung der Art `daten`, deren direkter Vorgänger in derselben Folge eine Aufgabe im Umfang ist. Gruppe `funktion`, Priorität Kann. Text: „Die Software [kann] die Angaben für die Entscheidung „{frage}“ auf einen Blick zeigen.“ Abnahme: „Test: Alle Angaben für „{frage}“ stehen auf einer Seite.“
- **A4 Medienbruch** (Gruppe `schnittstelle`), Priorität nach Minuten pro Tag: ab 60 Muss, ab 10 Soll, darunter Kann (`MEDIENBRUCH_MUSS_MIN = 60`, `MEDIENBRUCH_SOLL_MIN = 10`, eigene Festlegung). Begründung: „Heute {n} Übertragungen und {m} Minuten pro Tag ({k} € pro Tag).“

  | Fall | Text | Abnahme |
  | --- | --- | --- |
  | A | „Die Software [muss] Daten aus „{quelle}“ ohne erneute Eingabe für {aufgaben} bereitstellen.“ | „Test: Daten aus „{quelle}“ erscheinen in {aufgaben}, ohne sie abzutippen.“ |
  | B, D | „Die Software [muss] Daten mit „{system}“ austauschen ({richtung}), damit niemand sie von Hand überträgt.“ | „Test: Ein Datensatz gelangt ohne Abtippen von „{quelle}“ nach „{ziel}“; Fehler werden gemeldet.“ |
  | C, Quelle nicht digital | „Die Software [muss] die Erfassung direkt bei der Entstehung ermöglichen, damit niemand Daten von „{quelle}“ abtippt ({aufgaben}).“ | „Test: {aufgaben} gelingt ohne Papier- oder Telefonnotiz.“ |
  | C, Ziel nicht digital | „Die Software [muss] die Daten für {aufgaben} digital bereitstellen, damit niemand sie auf „{ziel}“ abschreibt.“ | „Test: {aufgaben} gelingt ohne Abschreiben.“ |

  `{aufgaben}` = Aufgabennamen in Anführungszeichen, mit Komma und „und“ verbunden. `{richtung}` = „von „{quelle}“ in die Software“ oder „von der Software nach „{ziel}““.
- **A5 Rollen** (eine Anforderung `rollen`, Gruppe `benutzer`, Muss, wenn mindestens eine Rolle im Umfang): „Die Software [muss] {r} Rollen mit eigenen Rechten abbilden: {Rolle} ({b} Benutzer): {Aufgaben}; …“ Abnahme: „Test: Jede Rolle erledigt ihre Aufgaben; Aufgaben anderer Rollen sind gesperrt.“
- **A6 Freigabe** je Aufgabe im Umfang mit `art = 'freigabe'` (Gruppe `benutzer`, Muss): „Die Software [muss] sicherstellen, dass nur die Rolle {rolle} „{name}“ ausführt, und jede Freigabe mit Person und Zeitpunkt protokollieren.“ Abnahme: „Test: Eine Person ohne die Rolle {rolle} kann nicht freigeben; das Protokoll zeigt Person und Zeitpunkt.“
- **A7 Prüfung** je Aufgabe im Umfang mit `art = 'pruefung'` (Gruppe `benutzer`, Soll): „Die Software [sollte] das Ergebnis der Prüfung „{name}“ mit Person und Zeitpunkt dokumentieren.“ Abnahme: „Test: Das Prüfergebnis ist am Vorgang sichtbar.“
- **A8 Mengengerüst** (Gruppe `menge`, nur mit Prozessmodell):

  | Kennung | Priorität | Text | Abnahme |
  | --- | --- | --- | --- |
  | menge:vorgaenge | Muss | „Die Software [muss] {V} Vorgänge pro Tag im Mittel und {Spitze} an starken Tagen verarbeiten ({Jahr} pro Jahr).“ | „Referenzbetrieb mit ähnlicher Menge oder Lasttest in der Teststellung.“ |
  | menge:benutzer | Muss (nur bei Benutzer > 0) | „Die Software [muss] {B} benannte Benutzer zulassen.“ | „Das Lizenzangebot deckt {B} benannte Benutzer.“ |
  | menge:antwortzeit | Soll | „Die Software [sollte] Standardaktionen (Öffnen, Speichern, Suchen) bei Spitzenlast in höchstens {antwortzeitSek} Sekunden ausführen.“ | „Messung in der Teststellung: keine von 10 Standardaktionen dauert länger als {antwortzeitSek} Sekunden.“ |
  | menge:datenbestand | Soll | „Die Software [sollte] den Datenbestand von {aufbewahrungJahre} Jahren vorhalten, rund {D} Vorgänge, und dabei die Antwortzeit einhalten.“ | „Der Anbieter bestätigt die Antwortzeit bei {D} Vorgängen schriftlich.“ |

- **A9 Katalog** (6.7): Bedingung „ja“ → aktiv, „offen“ → Vorschlag mit Hinweis „Rahmenfrage klären“, „nein“ → nicht anlegen. Einträge mit „nur Vorschlag“ starten immer als Vorschlag.
- **A10 Bausteine** (6.7) der gewählten Softwareart: immer als Vorschlag; Bedingung „nein“ → nicht anlegen.
- **A11 Ohne Prozessmodell:** nur A9, A10 und eigene Anforderungen.
- **A12 Reihenfolge:** Gruppen in fester Reihenfolge (4.2). Funktionen in Prozessreihenfolge (Tiefensuche: Hauptfolge, Ausgänge und Zweige der Reihe nach), dann Entscheidungen, dann Bausteine. Schnittstellen nach Minuten pro Tag absteigend. Benutzer: Rollen, Freigaben, Prüfungen. Katalog in Katalogreihenfolge.
- **A13 Punkte:** Soll 2, Kann 1, Muss und Nicht 0.

### 6.6 Prüfungen der Anforderungen (`src/lastenheft/pruefung.ts`)

- **P1 Unbestimmte Begriffe** (Hinweis je Fund, ganze Wörter, Groß- und Kleinschreibung egal): schnell, einfach, benutzerfreundlich, intuitiv, flexibel, modern, performant, möglichst, gegebenenfalls, ggf., usw., etc., ca., circa, optimal, angemessen, ausreichend, zeitnah, komfortabel, beliebig, bei Bedarf, und/oder. Text: „„{wort}“ ist unbestimmt; bitte messbar machen.“ Eigene Liste, keine Quelle.
- **P2 Kein Modalverb** (muss, müssen, sollte, sollten, soll, sollen, kann, können, darf, dürfen, wird, werden) → Hinweis „Verbindlichkeit fehlt“.
- **P3 Modalverb passt nicht:** Der Text enthält ein Modalverb einer anderen Priorität, aber keins der eigenen → Hinweis. Klassen: Muss {muss, müssen}, Soll {sollte, sollten, soll, sollen}, Kann {kann, können}. Nicht wird nicht geprüft.
- **P4** Aktive Muss- oder Soll-Anforderung ohne Abnahmekriterium → Warnung.
- **P5** Mehr als 40 Wörter → Hinweis „aufteilen“.
- **P6** Gleicher Text (klein geschrieben, Leerraum zusammengefasst) bei zwei aktiven Anforderungen → Hinweis an beiden.
- **P7 Muss-Anteil** = Muss / (Muss + Soll + Kann) über aktive Anforderungen. Über 0,60 → Warnung: „{x} % Muss. Empfohlen sind höchstens etwa 60 % (MoSCoW nach Aufwand; hier nach Anzahl).“
- **P8** Gruppe mit aktiven Anforderungen, aber ohne Soll und Kann → Hinweis „wirkt nur als K.-o.“.
- **P9** Keine aktive Anforderung → Fehler; Schritt 4 gesperrt.
- **P10** Offene Vorschläge → Hinweis „{n} Vorschläge noch offen“.
- **P11 Nummern:** Bei der ersten Aktivierung bekommt eine Anforderung `{kuerzel}-{nn}` aus `naechsteNummer`, zweistellig mit führender Null. Nummern werden nie neu vergeben, auch nicht nach Verwerfen.

### 6.7 Kataloge (`src/lastenheft/katalog.ts`, Kopie mit Quellen in `docs/kataloge.md`)

Bedingungen werden dreiwertig ausgewertet: Ein „nein“ macht das Ganze „nein“; sonst macht ein „offen“ es „offen“; sonst „ja“. „Betrieb ≠ eigener Server“ ist bei `cloud` ja, bei `eigener_server` nein, bei `offen` offen.

**Nichtfunktionale Anforderungen (21 Einträge):**

| ID | Gruppe | Bedingung | Prio | Text | Abnahme | Quelle |
| --- | --- | --- | --- | --- | --- | --- |
| N-DS-1 | datenschutz | personenbezogen; Betrieb ≠ eigener Server | Muss | „Der Anbieter [muss] einen Vertrag zur Auftragsverarbeitung nach Art. 28 Abs. 3 DSGVO abschließen. Er legt seine technischen und organisatorischen Maßnahmen offen.“ | „Unterschriebener Vertrag mit Anlage der Maßnahmen liegt vor Vertragsschluss vor.“ | Art. 28 DSGVO |
| N-DS-2 | datenschutz | wie N-DS-1 | Muss | „Der Anbieter [muss] alle Orte der Verarbeitung und alle Unterauftragnehmer nennen. Übermittlungen in Drittländer stützt er auf Kapitel V DSGVO.“ | „Liste der Standorte und Unterauftragnehmer liegt schriftlich vor, mit Rechtsgrundlage je Drittland.“ | Art. 28 Abs. 3, Art. 44–46 DSGVO |
| N-DS-3 | datenschutz | personenbezogen | Muss | „Die Software [muss] personenbezogene Daten gezielt löschen. Daten, die noch aufbewahrt werden müssen, löscht sie erst nach Fristende.“ | „Test: Testperson löschen; Suche und Auswertungen zeigen sie danach nicht mehr.“ | Art. 17 DSGVO; § 147 Abs. 3 AO |
| N-DS-4 | datenschutz | personenbezogen | Soll | „Die Software [sollte] die Daten einer Person in einem strukturierten, gängigen und maschinenlesbaren Format ausgeben.“ | „Export einer Testperson als CSV, JSON oder XML.“ | Art. 20 DSGVO |
| N-DS-5 | datenschutz | personenbezogen | Muss | „Die Software [muss] Rechte so vergeben, dass jede Rolle nur die Daten sieht, die sie für ihre Aufgaben braucht. Neue Benutzer haben zunächst keine Rechte.“ | „Test mit zwei Rollen: Rolle A sieht die gesperrten Daten von Rolle B nicht.“ | Art. 25 Abs. 2 DSGVO |
| N-DS-6 | datenschutz | immer | Muss | „Die Software [muss] Daten verschlüsselt übertragen und verschlüsselt sichern.“ | „Der Anbieter belegt Transportverschlüsselung und verschlüsselte Sicherungen schriftlich.“ | Art. 32 Abs. 1 lit. a DSGVO |
| N-SI-1 | datenschutz | immer | Soll | „Die Software [sollte] eine Anmeldung mit zweitem Faktor anbieten.“ | „Test: Anmeldung mit App-Code oder Sicherheitsschlüssel.“ | Art. 32 Abs. 1 DSGVO |
| N-GB-1 | ordnung | steuerrelevant | Muss | „Die Software [muss] verhindern, dass gebuchte Daten ihren ursprünglichen Inhalt verlieren. Änderungen protokolliert sie mit Person und Zeitpunkt.“ | „Test: abgeschlossene Rechnung ändern; die Software verhindert es oder zeigt alten und neuen Wert.“ | § 146 Abs. 4 AO |
| N-GB-2 | ordnung | steuerrelevant | Muss | „Die Software [muss] Bücher 10 Jahre, Buchungsbelege 8 Jahre und Geschäftsbriefe 6 Jahre lesbar und maschinell auswertbar bereithalten, auch nach Vertragsende.“ | „Der Vertrag regelt Aufbewahrung und Herausgabe; ein Test-Export ist maschinell auswertbar.“ | § 147 Abs. 2 und 3 AO |
| N-GB-3 | ordnung | steuerrelevant | Muss | „Die Software [muss] den Datenzugriff der Finanzverwaltung unterstützen: Einsicht, Auswertung nach Vorgabe und Übergabe in maschinell auswertbarem Format.“ | „Vorführung von Prüferzugang und Datenexport.“ | § 147 Abs. 6 AO |
| N-GB-4 | ordnung | steuerrelevant | Soll | „Der Anbieter [sollte] Unterlagen für die Verfahrensdokumentation liefern: Systembeschreibung, Einstellungen, Schnittstellen, Datensicherung.“ | „Die Unterlagen liegen vor dem Echtbetrieb vor.“ | § 147 Abs. 1 Nr. 1 AO; GoBD ungeprüft (10.3) |
| N-BT-1 | betrieb | immer | Muss | „Die Software [muss] mindestens täglich gesichert werden. Die Wiederherstellung gelingt binnen {wiederherstellungStunden} Stunden und wird jährlich getestet.“ | „Sicherungskonzept und Protokoll eines Wiederherstellungstests liegen vor.“ | Art. 32 Abs. 1 lit. c und d DSGVO |
| N-BT-2 | betrieb | immer | Muss | „Der Anbieter [muss] bei Vertragsende alle Daten und Belege vollständig in offenen, dokumentierten Formaten herausgeben. Frist und Kosten stehen im Vertrag.“ | „Probeexport aller Testdaten; die Vertragsklausel liegt vor.“ | eigene Festlegung; stützt § 147 Abs. 2 AO |
| N-BT-3 | betrieb | Betrieb ≠ eigener Server | Soll | „Die Software [sollte] zu den Geschäftszeiten zu mindestens {verfuegbarkeitProzent} % je Monat verfügbar sein.“ | „Zusage im Vertrag mit Messung und Gutschrift.“ | eigene Festlegung |
| N-BT-4 | betrieb | immer | Soll | „Der Anbieter [sollte] Support auf Deutsch zu den Geschäftszeiten bieten. Bei Störungen, die die Arbeit verhindern, reagiert er binnen {reaktionStunden} Stunden.“ | „Zusage im Vertrag.“ | eigene Festlegung |
| N-BT-5 | betrieb | immer | Soll | „Der Anbieter [sollte] Sicherheitsupdates ohne Aufpreis liefern und größere Änderungen vorher ankündigen.“ | „Zusage im Vertrag; Änderungsprotokoll der letzten 12 Monate liegt vor.“ | eigene Festlegung |
| N-BF-1 | barrierefreiheit | Softwareart Shop; Verbraucherverkauf; Kleinstunternehmen ≠ ja | Muss | „Der Shop [muss] für Verbraucher die Barrierefreiheitsanforderungen des BFSG erfüllen.“ | „Der Anbieter legt einen Nachweis zur Barrierefreiheit vor; eine Stichprobe mit axe zeigt keine schweren Befunde.“ | BFSG § 1 Abs. 3 Nr. 5, § 3; Ausnahme § 3 Abs. 3 mit § 2 Nr. 17 |
| N-BF-2 | barrierefreiheit | immer, nur Vorschlag | Kann | „Die Software [kann] für Beschäftigte vollständig mit Tastatur und Bildschirmleser bedienbar sein.“ | „Test eines Arbeitsablaufs nur mit Tastatur.“ | eigene Festlegung; das BFSG zielt auf Leistungen an Verbraucher (§ 1 Abs. 3) |
| N-AN-1 | anbieter | immer | Soll | „Der Anbieter [sollte] mindestens {referenzen} Referenzbetriebe ähnlicher Größe und Branche nennen.“ | „Ein Gespräch mit einem Referenzbetrieb ist geführt.“ | eigene Festlegung |
| N-AN-2 | anbieter | immer | Soll | „Der Anbieter [sollte] die Muss-Aufgaben in einer Vorführung mit Beispieldaten des Betriebs zeigen.“ | „Die Vorführung ist erfolgt und protokolliert.“ | eigene Festlegung |
| N-AN-3 | anbieter | immer | Kann | „Der Anbieter [kann] die Einführung bis zum Echtbetrieb in höchstens {einfuehrungWochen} Wochen abschließen.“ | „Projektplan des Anbieters.“ | eigene Festlegung |

Bei „Kleinstunternehmen ≠ ja“ ergibt „offen“ den Wert „offen“, also einen Vorschlag.

**Bausteine je Softwareart (24 Einträge, alle als Vorschlag):**

| ID | Gruppe | Bedingung | Prio | Text |
| --- | --- | --- | --- | --- |
| ERP-1 | funktion | – | Soll | „Die Software [sollte] Stammdaten für Kunden, Lieferanten und Artikel an einer Stelle führen und in allen Vorgängen verwenden.“ |
| ERP-2 | funktion | – | Soll | „Die Software [sollte] Bestände je Lagerort laufend führen; jede Bestandsänderung hat einen Beleg.“ |
| ERP-3 | funktion | – | Soll | „Die Software [sollte] aus einem Auftrag Lieferschein und Rechnung ohne erneute Eingabe erzeugen.“ |
| ERP-4 | funktion | – | Soll | „Die Software [sollte] Rechnungen als strukturierte E-Rechnung (XRechnung oder ZUGFeRD) erzeugen und empfangen.“ Hinweis: „Gesetzliche Pflichten und Fristen im Projekt prüfen.“ |
| ERP-5 | schnittstelle | – | Soll | „Die Software [sollte] Buchungsdaten an die Steuerkanzlei übergeben, zum Beispiel im DATEV-Format.“ |
| ERP-6 | funktion | – | Kann | „Die Software [kann] Umsatz, Bestand und offene Posten ohne Zusatzprogramm auswerten.“ |
| SHOP-1 | funktion | – | Soll | „Der Shop [sollte] Artikel mit Varianten, Bildern, Preisen und Bestand führen.“ |
| SHOP-2 | schnittstelle | – | Soll | „Der Shop [sollte] gängige Zahlungsarten anbinden: Karte, Lastschrift, Rechnungskauf und Online-Bezahldienste.“ |
| SHOP-3 | schnittstelle | – | Soll | „Der Shop [sollte] Bestellungen automatisch an die Warenwirtschaft übergeben und Bestände von dort übernehmen.“ |
| SHOP-4 | schnittstelle | – | Soll | „Der Shop [sollte] Versanddienstleister anbinden und Versandetiketten mit Sendungsnummer erzeugen.“ |
| SHOP-5 | funktion | – | Soll | „Der Shop [sollte] Impressum, AGB, Widerrufsbelehrung und Datenschutzerklärung pflegbar an den passenden Stellen zeigen.“ |
| SHOP-6 | funktion | – | Kann | „Der Shop [kann] auf Smartphones vollständig bedienbar sein.“ |
| CRM-1 | funktion | – | Soll | „Die Software [sollte] Kontakte und Firmen mit dem Verlauf aller Gespräche, E-Mails und Angebote führen.“ |
| CRM-2 | funktion | – | Soll | „Die Software [sollte] Verkaufschancen mit Phase, Wert und Abschlusswahrscheinlichkeit verfolgen.“ |
| CRM-3 | funktion | – | Soll | „Die Software [sollte] E-Mails und Termine dem passenden Kontakt zuordnen.“ |
| CRM-4 | datenschutz | personenbezogen | Muss | „Die Software [muss] Einwilligungen und Werbewidersprüche mit Datum und Herkunft dokumentieren.“ Quelle: Art. 7 Abs. 1 DSGVO |
| CRM-5 | funktion | – | Soll | „Die Software [sollte] Aufgaben und Wiedervorlagen mit Erinnerung verwalten.“ |
| CRM-6 | funktion | – | Kann | „Die Software [kann] den Vertriebstrichter auswerten.“ |
| DMS-1 | funktion | – | Soll | „Die Software [sollte] Dokumente per Scan, Upload und E-Mail übernehmen und verschlagworten.“ |
| DMS-2 | funktion | – | Soll | „Die Software [sollte] alle Dokumente im Volltext durchsuchen, auch gescannte (Texterkennung).“ |
| DMS-3 | ordnung | steuerrelevant | Muss | „Die Software [muss] Versionen mit Änderungsprotokoll führen; das Original bleibt unverändert.“ Quelle: § 146 Abs. 4 AO |
| DMS-4 | ordnung | steuerrelevant | Muss | „Die Software [muss] Aufbewahrungsfristen je Dokumentart verwalten und erst nach Fristende löschen.“ Quelle: § 147 Abs. 3 AO; Art. 17 DSGVO |
| DMS-5 | funktion | – | Soll | „Die Software [sollte] Freigabeabläufe, etwa für Eingangsrechnungen, mit Protokoll abbilden.“ |
| DMS-6 | funktion | – | Soll | „Die Software [sollte] Rechte je Ordner und Dokumentart vergeben.“ |

Abnahmekriterium der Bausteine: „Vorführung mit Beispieldaten des Betriebs.“ Die Inhalte sind ein Startbestand; Robin gibt sie fachlich frei (10.1).

### 6.8 Gewichte und AHP (`src/bewertung/`)

- **G1 Hauptkriterien:** Gruppen mit mindestens einer aktiven Soll- oder Kann-Anforderung, in fester Reihenfolge.
- **G2 Direkt:** ganze Prozent ≥ 0, Summe genau 100, sonst Fehler „Summe ist {x} %“. „Gleich verteilen“ teilt 100 durch die Zahl der Gruppen. „Auf 100 % bringen“ skaliert die Eingaben proportional. Beide runden nach dem Verfahren des größten Rests (Reste absteigend, bei Gleichstand die frühere Gruppe zuerst). `W_g = Prozent / 100`.
- **G3 Paarvergleich:** alle `n(n−1)/2` Paare nötig, sonst Fehler „{k} Vergleiche fehlen“. Bei `n = 1` ist `W = 1` ohne Vergleich.
- **G4 Unterpunkte:** globales Gewicht einer Anforderung `i` in Gruppe `g` = `W_g · v_i / Σ v` mit `v` = Punkte. Gruppe mit Punktesumme 0 → Fehler.
- **G5 Festlegen:** Der Knopf setzt `festgelegtAm`. Jede Änderung an Gewichten, Punkten oder Regel nach `bewertungBegonnenAm` erhöht `aenderungenNachBewertung` um 1.
- **AHP1 Matrix:** `a_ii = 1`. Urteil (a, b, wichtiger = a, Stärke s) → `a_ab = s`, `a_ba = 1/s`. Bei `wichtiger = b` umgekehrt. Stärke 1 → beide 1.
- **AHP2 Eigenvektor** per Potenzmethode: Start `w = (1/n, …)`; `w ← A·w / Σ(A·w)`; Abbruch, wenn sich kein Eintrag um mehr als 1e−12 ändert, spätestens nach 1 000 Schritten.
- **AHP3** `λmax = (1/n) · Σ_i (A·w)_i / w_i`.
- **AHP4** Für `n ≥ 3`: `CI = (λmax − n) / (n − 1)`, `CR = CI / RI(n)`. Für `n ≤ 2`: `CR = 0`.
- **AHP5 RI nach Saaty:** n = 3: 0,58 · 4: 0,90 · 5: 1,12 · 6: 1,24 · 7: 1,32 · 8: 1,41 · 9: 1,45 · 10: 1,49.
- **AHP6** `CR ≤ 0.10` → stimmig. Sonst Warnung mit dem widersprüchlichsten Urteil: Paar mit größtem `|ln(a_ij · w_j / w_i)|`, bei Gleichstand das erste in Matrixreihenfolge. Text: „Die Vergleiche widersprechen sich (CR {cr}). Prüfen Sie „{X}“ gegen „{Y}“.“

### 6.9 K.-o.-Prüfung und Nutzwert

- **N1 K.-o.:** Je aktive Muss-Anforderung zählt `Bewertung.ko`. „nicht erfüllt“ → Angebot ungültig, Grund „Muss-Kriterium {Nummer} nicht erfüllt“. `null` oder „offen“ → `koOffen += 1`.
- **N2 Budget:** `budgetAlsKo` und Kostenbasis > Budget → ungültig, Grund „über Budget“. Ohne `budgetAlsKo` nur Hinweis „über Budget“.
- **N3 Gruppenwert** `S_gj = Σ v_i · e_ij / Σ v_i` über die aktiven Soll- und Kann-Anforderungen der Gruppe. Fehlende Punkte zählen als 0 und erhöhen `fehlend`.
- **N4 Nutzwert** `N_j = Σ_g W_g · S_gj`, Wertebereich 0 bis 10.
- **N5 Rang** unter gültigen Angeboten nach der Regelgröße (6.12). Gleichstand, wenn sich Nutzwerte um weniger als 0,005 Punkte oder € je Punkt um weniger als 1 € unterscheiden; dann gleicher Rang, Anzeige alphabetisch.
- **N6 Vorläufig**, wenn ein gültiges Angebot `koOffen > 0` oder `fehlend > 0` hat.
- **N7** `euroJePunkt = Kostenbasis / N_j`; bei `N_j = 0` → `null` („nicht berechenbar“).

### 6.10 Sensitivität der Gewichte

- **S1** Nur bei mindestens zwei Hauptkriterien und zwei gültigen (bei Preis-Leistung: zulässigen) Angeboten. Sonst Hinweis.
- **S2** Für jedes Hauptkriterium `k` mit `W_k < 1` wird `x` = neues Gewicht von `k` betrachtet. Die übrigen Gewichte ändern sich proportional: `W_l(x) = W_l · (1 − x) / (1 − W_k)`. Daraus folgt `N_j(x) = R_kj + x · (S_kj − R_kj)` mit `R_kj = (N_j − W_k · S_kj) / (1 − W_k)`.
- **S3** `b` ist die heutige Empfehlung. Je Mitbewerber `j` eine lineare Funktion `d_j(x) = α + β·x`:
  - Regel Nutzwert: `d_j(x) = N_b(x) − N_j(x)`.
  - Regel Preis-Leistung: `d_j(x) = K_j · N_b(x) − K_b · N_j(x)` mit `K` = Kostenbasis.
- **S4** Stabiler Bereich `[von, bis]` = alle `x` in [0, 1] mit `d_j(x) ≥ 0` für alle `j`. Start [0, 1]; je `j` mit `β ≠ 0` Nullstelle `x* = −α/β`; `β > 0` → `von = max(von, x*)`, `β < 0` → `bis = min(bis, x*)`.
- **S5** `abstand` = kleinster Wert aus `W_k − von` (nur wenn `von > 0`) und `bis − W_k` (nur wenn `bis < 1`); sonst `null`. `knapp`, wenn `abstand < 0.05` (`KNAPP_SCHWELLE`, eigene Festlegung).
- **S6** Gleichstand an der Spitze (N5) → keine Analyse, Hinweis „Gleichstand an der Spitze; empfohlen ist das günstigere Angebot“. Der Mindestnutzwert bleibt in der Analyse fest; das steht als Grenze in der README.

### 6.11 Kosten (`src/kosten/`)

`T` = Jahre, `s` = Preissteigerung, `i` = Zins, `U` = Nutzen pro Jahr, `Benutzer` = Lizenzbedarf, `z` = interner Stundensatz, `P` = Stunden je Personentag. Prozentwerte gehen geteilt durch 100 in die Formeln ein.

- **K1 Einmalig** `E = Σ einmalig + internEinfuehrungTage · P · z + internSchulungStundenJeBenutzer · Benutzer · z`.
- **K2 Laufend im 1. Jahr** `L_1 = Σ laufendJahr + preisJeBenutzerMonatEuro · Benutzer · 12 + internBetriebStundenMonat · 12 · z`.
- **K3** `L_t = L_1 · (1 + s)^(t−1)` für `t = 1 … T`.
- **K4 Gesamtkosten** `TCO = E + Σ L_t`.
- **K5 Barwert** (nur mit Zins): `BW = E + Σ L_t / (1 + i)^t`. Einführung fällt in Jahr 0 an, laufende Kosten am Ende jedes Jahres.
- **K6 Kapitalwert** (mit Zins und Nutzen): `KW = −E + Σ (U − L_t) / (1 + i)^t`.
- **K7 Amortisationsjahr:** kleinstes `t` mit `Σ_{τ≤t} (U − L_τ) / (1 + i)^τ ≥ E`; ohne Zins gilt `i = 0`. Keins → `null` („nicht innerhalb von {T} Jahren“).
- **K8 Kostenbasis:** nominal → TCO; barwert → BW. Barwert ohne Zins → Fehler „Zins fehlt“.
- **K9** Negative Beträge, Jahre außerhalb 1 bis 10, Zins unter −50 % → Fehler. Alle Beträge sind netto; die Oberfläche schreibt „netto“ dazu.
- **K10 Vorschläge:** `Benutzer` aus M3. `z = round(Σ stundensatz · personen / Σ personen)` über die Rollen im Umfang (ohne Modell: 45 €, eigene Festlegung). `P` = `arbeitsstundenProTag` der Grundlage. `U` = M7.

### 6.12 Entscheidung

- **D1 Regel Nutzwert:** Empfehlung = gültiges Angebot mit dem höchsten `N`; bei Gleichstand das mit der niedrigeren Kostenbasis.
- **D2 Regel Preis-Leistung:** zulässig sind gültige Angebote mit `N ≥ mindestNutzwert`. Empfehlung = kleinster Wert `€ je Punkt`. Kein zulässiges Angebot → keine Empfehlung, Warnung „Kein Angebot erreicht den Mindestnutzwert“.
- **D3** Kein gültiges Angebot → keine Empfehlung, Fehler „Kein Angebot erfüllt alle Muss-Kriterien“.
- **D4** `gewaehltId` ≠ Empfehlung und `begruendung` leer → Warnung in der Vorlage.
- **D5** Status „final“ nur ohne Fehler-Befunde; sonst bleibt der Knopf gesperrt mit Grund.

### 6.13 Begründungsentwurf (`src/entscheidung/begruendung.ts`)

Feste Textbausteine, Singular und Plural beachten. Reihenfolge:

| Nr. | Bedingung | Text |
| --- | --- | --- |
| 1 | immer | „Empfohlen wird {anbieter} ({produkt}).“ |
| 2a | `koOffen = 0` | „Das Angebot erfüllt alle {m} Muss-Kriterien.“ |
| 2b | `koOffen > 0` | „Bei {o} von {m} Muss-Kriterien steht die Prüfung noch aus.“ |
| 3a | Nutzwert, mehrere gültige | „Es erreicht mit {N} von 10 Punkten den höchsten Nutzwert, {ΔN} Punkte vor {zweiter}.“ |
| 3b | Nutzwert, ein gültiges | „Es ist das einzige gültige Angebot; Nutzwert {N} von 10 Punkten.“ |
| 3c | Preis-Leistung | „Es hat mit {EP} € je Nutzwertpunkt das beste Preis-Leistungs-Verhältnis unter den Angeboten mit mindestens {min} Punkten.“ |
| 4 | immer | „Die Kosten über {T} Jahre betragen {K} € ({nominal oder „Barwert bei {i} % Zins“}), Platz {r} von {n}.“ |
| 5 | Nutzen gesetzt | „Bei {U} € Nutzen pro Jahr beträgt der Kapitalwert {KW} €; die Einführung hat sich im {t}. Jahr bezahlt gemacht.“ bzw. „… macht sich in {T} Jahren nicht bezahlt.“ |
| 6 | Ausgeschiedene | „Ausgeschieden: {Name} ({Grund}); …“ höchstens 3 Nummern je Angebot, dann „und {k} weitere“ |
| 7a | Sensitivität, nichts knapp | „Die Empfehlung bleibt gleich, solange die Gewichte in diesen Bereichen liegen: {Gruppe} {von}–{bis} %; …“ |
| 7b | etwas knapp | „Das Ergebnis ist knapp: Schon {d} Prozentpunkte mehr oder weniger Gewicht für „{Gruppe}“ ändern die Empfehlung.“ (Gruppe mit dem kleinsten Abstand) |
| 8 | `aenderungenNachBewertung > 0` | „Hinweis: Gewichte oder Regel wurden nach Beginn der Bewertung {z}-mal geändert.“ |
| 9 | vorläufig | „Das Ergebnis ist vorläufig: {f} Bewertungen fehlen, {o} K.-o.-Prüfungen sind offen.“ |

### 6.14 Neu einlesen (Abgleich)

1. Umfang übernehmen: Status bekannter Systeme bleibt, neue Systeme bekommen U1, entfallene fallen weg. `aufgabenAus` und `aufgabenEin` behalten nur vorhandene Kennungen.
2. Abgeleitete Anforderungen neu berechnen (6.5).
3. Gleiche Kennung: Text und Abnahme nur übernehmen, wenn `bearbeitet.text` falsch ist; Priorität nur, wenn `bearbeitet.prioritaet` falsch ist; Status nur, wenn `bearbeitet.status` falsch ist. Nummer, Punkte und Notiz bleiben immer.
4. Neue Kennung: neu anlegen (Status nach Regel).
5. Entfallene abgeleitete Anforderung: Status „verworfen“, Notiz „Quelle im Prozessmodell entfällt (Neu einlesen am {Datum}).“ Bewertungen bleiben erhalten.
6. Katalog und Bausteine werden mit dem aktuellen Rahmen gleich behandelt. Eigene Anforderungen bleiben unverändert.
7. Vorher zeigt eine Vorschau „{n} neu, {g} geändert, {e} entfallen“. Erst „Übernehmen“ ändert das Projekt.

### 6.15 CSV-Anbieterfragebogen (`src/export/csv.ts`)

- UTF-8 mit BOM (`EF BB BF`), Trennzeichen Semikolon, Zeilenende CRLF.
- Felder mit `;`, `"`, CR oder LF stehen in Anführungszeichen; `"` wird verdoppelt.
- **Formelschutz:** Beginnt ein Feld mit `=`, `+`, `-`, `@`, Tabulator oder CR, wird `'` vorangestellt.
- Spalten: `Nr.;Gruppe;Titel;Anforderung;Priorität;Abnahmekriterium;Erfüllt (ja/teilweise/nein);Erläuterung des Anbieters;Fundstelle im Angebot`. Die letzten drei Spalten bleiben leer.
- Zeilen: alle aktiven Anforderungen nach Gruppe und Nummer.
- Dateiname: `{Vorhaben} – Anbieterfragebogen.csv`. Die Zeichen `\ / : * ? " < > |` werden entfernt, höchstens 80 Zeichen.

### 6.16 Speichern (`src/modell/speicher.ts`)

- Datei: JSON mit 2 Leerzeichen Einzug, UTF-8 ohne BOM, Endung `.auswahllotse`, Dateiname aus dem Vorhaben.
- Laden prüft `app`, `formatVersion` und Struktur. Meldungen: Prozesslotse-Datei → „Das ist eine Prozesslotse-Datei. Bitte im Schritt „Prozess“ einlesen.“; Format > 1 → „Diese Datei stammt aus einer neueren Version des Auswahl-Lotsen.“
- Browser: `localStorage` `auswahllotse:projekt` bei jeder Änderung sofort, `auswahllotse:einstellungen` getrennt. Jeder Zugriff in `try/catch`; Fehler sind nicht kritisch.

---

## 7 Technik

### 7.1 Stack und Bibliotheken

Gleiche Bauweise wie der Prozesslotse: React 19, TypeScript, Vite, Vitest, Playwright mit axe, oxlint, GitHub Actions. Zur Laufzeit nur React. Keine Diagramm-, XML-, CSV- oder Datumsbibliothek: SVG selbst gezeichnet, `DOMParser`, eigene CSV-Funktion, `Intl`.

Versionen und Lizenzen mit `npm view <paket> version license` am 11.11.2026 geprüft:

| Paket | Version | Lizenz | Einsatz |
| --- | --- | --- | --- |
| react, react-dom | 19.3.1 | MIT | Laufzeit |
| typescript | 7.0.2 | Apache-2.0 | Entwicklung |
| vite | 8.3.7 | MIT | Entwicklung |
| @vitejs/plugin-react | 6.3.0 | MIT | Entwicklung |
| vitest | 5.1.0 | MIT | Entwicklung |
| jsdom | 31.0.0 | MIT | Entwicklung; Testumgebung nur für die BPMN-Tests (`// @vitest-environment jsdom`) |
| @playwright/test | 1.65.0 | Apache-2.0 | Entwicklung |
| @axe-core/playwright (mit axe-core 4.14.0) | 4.14.0 | MPL-2.0 | Entwicklung; wird nicht ausgeliefert |
| oxlint | 1.93.0 | MIT | Entwicklung |
| @types/react, @types/react-dom | 19.3.0 | MIT | Entwicklung |
| @types/node | 24.19.2 (passend zu Node 24; neueste ist 26.6.6) | MIT | Entwicklung |
| docx | 9.15.3 | MIT | später: DOCX-Export (0.2) |
| @tauri-apps/cli | 2.12.4 | Apache-2.0 OR MIT | später: Windows-Programm |
| @tauri-apps/api | 2.12.4 | Apache-2.0 OR MIT | später |
| @tauri-apps/plugin-dialog | 2.8.4 | MIT OR Apache-2.0 | später |
| @tauri-apps/plugin-updater | 2.14.1 | MIT OR Apache-2.0 | später, nach Entscheidung über Updates |

Rust-Crates für Phase 9 laut Prototyp des Prozesslotsen: `tauri` 2.12.5, `tauri-build` 2.7.4, `tauri-plugin-dialog` 2, `tauri-plugin-single-instance` 2, `webview2-com` 0.39.1, `windows` 0.62.2. Ihre Lizenzen beim Einbau mit cargo prüfen.

Der Auswahl-Lotse braucht kein bpmn-js. Damit entfällt die Logo-Pflicht der bpmn.io-Lizenz, die beim Prozesslotsen ein Risiko für SignPath ist.

### 7.2 Ordnerstruktur

```
auswahllotse/
  CLAUDE.md                   Arbeitsregeln (wie Prozesslotse)
  README.md
  docs/
    spezifikation.md          dieses Dokument
    datenmodell.md            Kurzfassung von 4 für Nutzer der Datei
    kataloge.md               Katalog und Bausteine mit Quelle und Stand
  e2e/                        Browsertests (Playwright, axe)
  public/favicon.svg
  scripts/readme-bilder.mjs   Bilder für die README
  src/
    prozessdatei/             format.ts, lesen.ts, bpmn.ts, haeufigkeit.ts, mengengeruest.ts
    modell/                   typen.ts, ergebnisse.ts, projekt.ts (Standardwerte), speicher.ts
    lastenheft/               umfang.ts, ableitung.ts, schnittstellen.ts, katalog.ts, pruefung.ts, abgleich.ts
    bewertung/                kriterien.ts, gewichte.ts, ahp.ts, nutzwert.ts, sensitivitaet.ts
    kosten/                   kosten.ts
    entscheidung/             regel.ts, begruendung.ts
    export/                   csv.ts, dateiname.ts
    regeln/schwellen.ts       alle Konstanten mit Quelle
    plattform/                plattform.ts (Schnittstelle), browser.ts; später desktop.ts
    ui/                       App, schritte/, druck/ (Lastenheft, Entscheidungsvorlage), diagramme/
    zustand.ts                Reducer mit Rückgängig und Wiederholen
  testdaten/                  siehe 9.3
```

Fachlogik in `prozessdatei`, `modell`, `lastenheft`, `bewertung`, `kosten`, `entscheidung`, `export` kennt kein React und ist vollständig getestet.

### 7.3 Zustand, Speicherung, Plattform

- Zustand mit `useReducer` und unveränderlichen Kopien; Rückgängig und Wiederholen wie im Prozesslotsen.
- Plattformschicht von Anfang an (Lehre aus Phase W1 des Prozesslotsen): `oeffnen`, `importieren`, `speichern`, `speichernUnter`, `drucken`, `setzeTitel`, `beimSchliessen`. Browser-Umsetzung: Dateiauswahl, Download, `window.print()`. Der Desktop-Teil wird später nur per dynamischem Import geladen.
- `crypto.randomUUID` und `crypto.subtle` brauchen einen sicheren Kontext (https, localhost, Tauri).

### 7.4 Export und Druck

- Druck-CSS für A4 mit 20 mm Rand; Bedienelemente ausgeblendet; Tabellen brechen nicht innerhalb einer Zeile um.
- Vor dem Drucken setzt die App `document.title` auf den Dateinamen-Vorschlag, z. B. „Neue Warenwirtschaft – Lastenheft“.
- Diagramme als Inline-SVG, damit sie im PDF scharf bleiben.

### 7.5 Später: Windows-Programm mit Tauri

Gleicher Weg wie der Prozesslotse (Arbeitsplan W0 bis W7, Prototyp `prozesslotse/docs/windows-prototyp`). Phase 9 beginnt erst, wenn der Prozesslotse W3 erreicht hat.

- App-ID `de.olbricht-digital.auswahllotse`; danach nie mehr ändern.
- NSIS-Installer pro Benutzer (`installMode: currentUser`), Sprache Deutsch, WebView2 per Bootstrapper; keine Admin-Rechte.
- Dateizuordnung nur für `.auswahllotse` (Rolle Editor, MIME `application/vnd.auswahllotse+json`). `.prozesslotse` und `.bpmn` werden nicht zugeordnet. Der Import läuft über einen Dialog mit Filtern.
- Rust-Befehle aus dem Prototyp übernehmen: `start_datei`, `oeffnen`, `importieren` (neu), `speichern`, `speichern_unter`, `als_pdf`. Nur vom Benutzer gewählte Pfade, atomares Speichern über Hilfsdatei, Single-Instance.
- CSP wie beim Prozesslotsen, aber ohne Ausnahmen für bpmn-js; zuerst `style-src 'self'` ohne `'unsafe-inline'` versuchen.
- `freezePrototype`: zuerst `true` testen. Beim Prozesslotsen musste es aus bleiben, sonst blieb die Seite weiß.
- Zertifikat, Store und Update-Quelle folgen den Entscheidungen beim Prozesslotsen.

### 7.6 CI

Workflow „Prüfung“ wie beim Prozesslotsen: Ubuntu, Node 24, `npm ci`, `npm run lint`, `npm test`, `npm run build`, Playwright mit dem Chrome des Runners. Zusätzlich `npm audit --omit=dev --audit-level=high`. Ab Phase 9 ein Windows-Job, der das Programm baut.

---

## 8 Sicherheit und Datenschutz

- **Alles lokal:** kein Server, keine KI, keine Telemetrie, keine CDN-Schriften. Alle Dateien liegen im Build.
- **Vertrauliche Daten:** Angebote und Preise sind Geschäftsgeheimnisse von Kunde und Anbieter. Sie bleiben in der Projektdatei und im Browser-Speicher des Geräts. Ein Knopf „Browser-Speicher leeren“ ist für gemeinsam genutzte Rechner gedacht.
- **Personenbezug minimal:** Rollen sind keine Personen. Personenbezogen sind nur Ersteller und optionale Notizen. Die App fragt keine weiteren Personendaten ab.
- **Eingaben:** Größen- und Tiefengrenzen (E1, E6); nur `JSON.parse`, kein `eval`. Eingelesene Objekte werden Feld für Feld kopiert, nie per `Object.assign`; so kann `__proto__` nichts verändern.
- **XML:** DOCTYPE wird vor dem Parsen abgelehnt (E9). Gelesen wird nur `textContent` eines Elements.
- **Anzeige:** React maskiert Text. `dangerouslySetInnerHTML` ist verboten; oxlint 1.93.0 prüft das mit `react/no-danger` (am 11.11.2026 an einer Probedatei bestätigt).
- **CSV:** Formelschutz (6.15), weil Anbieter die Datei in Excel öffnen.
- **CSP:** im Tauri-Programm per Konfiguration. Im Web-Build setzt ein kleines Vite-Plugin beim Build ein `<meta http-equiv="Content-Security-Policy">` mit `default-src 'self'` und `connect-src 'none'`. Das Beispielprojekt wird deshalb als Modul eingebunden, nicht per `fetch` geladen.
- **Abhängigkeiten:** zur Laufzeit nur React; Lockfile, `npm ci`, `npm audit` in der CI.
- **Recht:** Lastenheft und Vorlage tragen den Hinweis „Rechtliche Anforderungen ohne Gewähr, keine Rechtsberatung, Stand {Datum}“.

---

## 9 Tests

Toleranz für Zahlen: 1e−6, falls nicht anders angegeben. Fachlogik-Tests in `src/**/*.test.ts`, Browsertests in `e2e/`.

### 9.1 Unit-Tests

**Datenmodell und Speichern**

| ID | Fall | Erwartung |
| --- | --- | --- |
| T-D1 | `neuesProjekt()` | Jahre 5, Betriebstage 250, Spitzenfaktor 2, Regel nutzwert, Mindestnutzwert 5, Zins null, Kostenbasis nominal, Methode direkt, Softwareart erp |
| T-D2 | speichern und laden | tief gleich |
| T-D3 | Prozesslotse-Datei als Projekt öffnen | Meldung „Das ist eine Prozesslotse-Datei …“ |
| T-D4 | `formatVersion` 2 | Meldung „neueren Version“ |
| T-D5 | kein JSON | Meldung „kein gültiges JSON“ |
| T-D6 | `localStorage` wirft | kein Absturz, Rückgabe `false` |
| T-D7 | Einstellungen ohne Speicher | `lernmodus` true, `farbschema` 'system' |

**Einlesen** (Testdateien siehe 9.3)

| ID | Fall | Erwartung |
| --- | --- | --- |
| T-E1 | lieferdienst.prozesslotse | Format 2; 6 Rollen, 4 Systeme, 18 Aufgaben; Soll null; keine Fehler |
| T-E2 | onlinebestellung.prozesslotse | 3 Rollen, 4 Systeme, 8 Aufgaben |
| T-E3 | lieferdienst-format1.json | umgestellt; `formatVersionGelesen` 1; Entscheidungen `art` 'daten'; Ausgänge `zurueckZu` und `ereignis` null; Wiederholung `modus` 'anteil', `zweck` 'nacharbeit' |
| T-E4 | `formatVersion` 3 | Meldung „Format 3 … kennt Format 1 und 2“ |
| T-E5 | kein JSON; Zahl statt Objekt; Auswahl-Lotse-Datei | je die Meldung aus E3 |
| T-E6 | Baustein `typ: 'schleife'` im 3. Schritt | „Ist-Prozess, Ablauf, Schritt 3: unbekannter Baustein „schleife““ |
| T-E7 | 5 MB + 1 Byte; Tiefe 51; 5 001 Bausteine | je abgelehnt mit Meldung |
| T-E8 | Zusatzfeld `farbe`; Medienart `ki`; Rolle `rol_x` fehlt | Feld nicht übernommen; Art 'sonstiges' mit Hinweis; `rolleId` null mit Warnung |
| T-E9 | lieferdienst-eingebettet.bpmn | gleiches `PlProjekt` wie T-E1 |
| T-E10 | BPMN ohne Einbettung | „enthält kein Prozesslotse-Projekt“ |
| T-E11 | BPMN mit `<!doctype` | abgelehnt, `DOMParser` wird nicht aufgerufen |
| T-E12 | Attribut `formatVersion="2"`, JSON mit 1 | „Das eingebettete Projekt ist beschädigt.“ |
| T-E13 | kein XML; Wurzel `<html>` | „kein gültiges XML“; „keine BPMN-2.0-Datei“ |

**Häufigkeit** (Werte stimmen mit dem Prozesslotsen überein: dessen Tests bestätigen 2,952 Medienbrüche je Vorgang im Lieferdienst und die Rücksprung-Werte der Onlinebestellung)

| ID | Fall | Erwartung je Vorgang |
| --- | --- | --- |
| T-H1 | Lieferdienst | annehmen 1; erfassen 1; ersatz 0,08; aendern 0,056; stornieren 0,024; kommissionieren 1,22; kontrollieren 1,22; tour 0,976; verladen 0,976; ausliefern 0,976; quittieren 0,8784; benachrichtigen 0,0976; erneut 0,0976; abgeben, bestaetigen, rechnung, freigeben, versenden je 0,976 |
| T-H2 | Lieferdienst, Enden | „Bestellung storniert“ 0,024; regulär 0,976 |
| T-H3 | Onlinebestellung | erfassen 1/0,916 = 1,0917031; nachfragen 0,12/0,916 = 0,1310044; storno 0,0262009; verfall 0,0131004; rechnung, kommissionieren, verpacken, versenden je 0,88/0,916 = 0,9606987; Enden: storniert 0,0262009, verfallen 0,0131004, regulär 0,9606987; Summe 1 |
| T-H4 | Wiederholung Modus anteil 0,25, Körper eine Aufgabe X, danach Aufgabe Y | X 1,3333333; Y 1 |
| T-H5 | Wiederholung anteil 0,5; Körper: X, dann Entscheidung 0,2 → Ende „Abbruch“, 0,8 weiter | X 1,6666667; Ende „Abbruch“ 0,3333333; regulär 0,6666667 |
| T-H6 | Entscheidung mit Anteilen 0,6 und 0,3 | Warnung „Anteile ergeben 90 %“; Rechnung läuft |

**Mengengerüst** (Lieferdienst, ERP, Standard-Umfang; Onlinebestellung, ERP, Shopsystem „anbinden“)

| ID | Erwartung |
| --- | --- |
| T-M1 | 120 Vorgänge pro Tag, Spitze 240, 30 000 pro Jahr; 7 Benutzer (Innendienst 4, Disposition 1, Buchhaltung 1, Niederlassungsleitung 1) |
| T-M2 | Kosten je Vorgang Lieferdienst 28,49152 € (Arbeitszeitkosten 854 745,60 € pro Jahr); Onlinebestellung 11,199418 € |
| T-M3 | Lieferdienst: Medienbrüche 2,952 je Vorgang, 354,24 pro Tag, 594,24 Minuten pro Tag |
| T-M4 | Nutzenvorschlag Lieferdienst 3,364 € je Vorgang, 100 920 € pro Jahr; Onlinebestellung 72 780,20 € pro Jahr |
| T-M5 | Datenbestand 300 000 Vorgänge (10 Jahre); Rolle mit 0,5 Personen → 1 Benutzer |

**Umfang und Ableitung** (Rahmen L: ERP, personenbezogen ja, steuerrelevant ja, Cloud)

| ID | Erwartung |
| --- | --- |
| T-U1 | Lieferdienst: Warenwirtschaft und Excel-Tourenliste „ablösen“, Papier und Telefon „unberührt“ |
| T-U2 | 8 Aufgaben im Umfang: erfassen, aendern, stornieren, tour, bestaetigen, rechnung, freigeben, versenden; 4 Rollen |
| T-U3 | `aufgabenAus` mit `auf_aendern` → 7 Aufgaben; `aufgabenEin` mit `auf_annehmen` → 9; Aufgabe ohne System → Hinweis |
| T-A1 | 8 Funktionen F-01 bis F-08 in Prozessreihenfolge; Muss: erfassen, tour, bestaetigen, rechnung, freigeben, versenden; Soll: aendern, stornieren. Text F-06: „Die Software muss die Aufgabe „Rechnung erstellen“ für die Rolle Buchhaltung unterstützen.“ Abnahme F-06: „Test mit Beispieldaten: Eine Person der Rolle Buchhaltung erledigt „Rechnung erstellen“ vollständig in der Software, ohne Daten abzutippen, in höchstens 1,5 Minuten.“ |
| T-A2 | genau ein Entscheidungs-Vorschlag: „Ware vorrätig?“, Kann |
| T-A3 | Papier → Warenwirtschaft: Fall C, Aufgaben erfassen und bestaetigen, 237,12 Übertragungen und 477,12 Minuten pro Tag, Muss, S-01 |
| T-A4 | Warenwirtschaft → Excel-Tourenliste: Fall A, 117,12 Übertragungen und 117,12 Minuten pro Tag, Muss, S-02 |
| T-A5 | Onlinebestellung: Shopsystem → ERP Fall B, 218,34 Übertragungen und 436,68 Minuten pro Tag, Muss. Schwellen: 59,9 Minuten → Soll; 9,9 → Kann; Fall D → Status Vorschlag |
| T-A6 | R-01 nennt 4 Rollen und 7 Benutzer; R-02 Freigabe „Rechnung freigeben“ für Niederlassungsleitung, Muss; keine Prüfung im Umfang |
| T-A7 | M-01 „120 … 240 … (30.000 pro Jahr)“; M-02 7 Benutzer; M-03 2 Sekunden, Soll; M-04 10 Jahre, 300.000 Vorgänge, Soll |
| T-A8 | Katalog bei Rahmen L: 19 aktiv (alle außer N-BF-1 und N-BF-2), N-BF-2 Vorschlag, N-BF-1 nicht angelegt |
| T-A9 | N-BF-1: Shop + Verbraucher ja + Kleinst nein → aktiv; Kleinst ja → nicht angelegt; Kleinst offen → Vorschlag; Verbraucher nein → nicht angelegt; ERP → nicht angelegt |
| T-A10 | Bausteine: ERP 6 Vorschläge; andere 0; CRM bei personenbezogen nein → 5 (ohne CRM-4); DMS bei steuerrelevant nein → 4 |
| T-A11 | Neu einlesen: `auf_freigeben` entfernt → F-07 und R-02 verworfen, Nummern bleiben; F-06 mit bearbeitetem Text bleibt; `auf_tour` umbenannt → gleiche Nummer F-04, neuer Text |
| T-A12 | ohne Prozessmodell: nur Katalog und Bausteine, keine F-, S-, R-, M-Anforderungen aus dem Modell |

**Prüfungen**

| ID | Fall | Erwartung |
| --- | --- | --- |
| T-P1 | „Die Software muss schnell und benutzerfreundlich sein.“ | 2 Hinweise (schnell, benutzerfreundlich) |
| T-P2 | Text ohne Modalverb; Text mit „muss“ bei Priorität Kann | Hinweis „Verbindlichkeit fehlt“; Hinweis „passt nicht“ |
| T-P3 | Muss ohne Abnahme | Warnung |
| T-P4 | 41 Wörter; zwei gleiche Texte | Hinweis „aufteilen“; Hinweis an beiden |
| T-P5 | Lieferdienst nach Ableitung: 22 Muss von 35 aktiven | 62,9 % → Warnung; nach Herabstufen einer Muss-Anforderung (21 von 35 = 60,0 %) keine Warnung |
| T-P6 | Nummern | F-01 bis F-08 in Prozessreihenfolge; verworfene Nummer wird nicht neu vergeben; Vorschlag ohne Nummer bis zur Übernahme |

**Gewichte und AHP** (Urteile als Matrix der oberen Hälfte; „1/2“ heißt, das zweite Kriterium ist mit Stärke 2 wichtiger)

| ID | Fall | Erwartung |
| --- | --- | --- |
| T-G1 | Lieferdienst, Rahmen L | 6 Hauptkriterien: funktion, menge, datenschutz, ordnung, betrieb, anbieter; schnittstelle und benutzer „nur K.-o.“ |
| T-G2 | Direkt Summe 99; „gleich verteilen“ bei 6 Gruppen | Fehler „Summe ist 99 %“; 17, 17, 17, 17, 16, 16 |
| T-G3 | Gruppe mit Soll (2) und Kann (1), W = 0,3 | globale Gewichte 0,2 und 0,1; Punktesumme 0 → Fehler |
| T-G4 | Gewicht nach Bewertungsbeginn ändern | `aenderungenNachBewertung` = 1; Entwurf enthält Satz 8 |
| T-AHP1 | n = 3: a12 = 2, a13 = 4, a23 = 2 | w = (0,571429; 0,285714; 0,142857); λmax 3; CR 0 |
| T-AHP2 | n = 3: a12 = 3, a13 = 5, a23 = 3 | w = (0,636986; 0,258285; 0,104729); λmax 3,038511; CR 0,033199; stimmig |
| T-AHP3 | n = 3: a12 = 9, a23 = 9, a13 = 1/9 | w = (1/3; 1/3; 1/3); CR 6,130268; Warnung |
| T-AHP4 | n = 4: a12 = 3, a13 = 5, a14 = 7, a23 = 3, a24 = 5, a34 = 3 | w = (0,565009; 0,262201; 0,117504; 0,055285); CR 0,043327. Das geometrische Mittel gäbe (0,563813; 0,263378; 0,117786; 0,055022); der Test beweist das Eigenvektorverfahren |
| T-AHP5 | n = 4: a12 = 2, a13 = 1/2, a14 = 4, a23 = 3, a24 = 1/2, a34 = 5; außerdem n = 2 mit a12 = 3 | CR 0,534758; widersprüchlichstes Urteil Kriterium 2 gegen 3; n = 2: w = (0,75; 0,25), CR 0 |
| T-AHP6 | RI per Simulation: je n 5 000 zufällige reziproke Matrizen, Einträge gleichverteilt aus den 17 Werten 1/9 … 9, fester Startwert 20261111 | Abweichung zur Tabelle höchstens 0,08 bei n = 3, höchstens 0,05 bei n = 4 bis 10; Laufzeit unter 2 s. Probelauf am 11.11.2026 mit 4 000 Matrizen: größte Abweichung 0,051 bei n = 3 |

**Nutzwert, Sensitivität, Kosten, Entscheidung** (Beispiel ABC, Testdatei `testdaten/bewertung-abc.auswahllotse`)

Beispiel ABC: Gewichte Funktionen 0,5, Betrieb 0,3, Anbieter 0,2. Anforderungen F-01 (Soll, 2 Punkte), F-02 (Kann, 1), F-03 (Muss), B-01 (Soll, 2), A-01 (Soll, 2). Die Angebote heißen „Anbieter A“, „Anbieter B“ und „Anbieter C“, die Produkte „Produkt A“ bis „Produkt C“. Annahmen wie T-K1, kein Zins, kein Nutzen, Kostenbasis nominal.

| Angebot | F-03 | F-01 | F-02 | B-01 | A-01 | Kosten |
| --- | --- | --- | --- | --- | --- | --- |
| A | erfüllt | 8 | 5 | 6 | 10 | wie T-K1 |
| B | erfüllt | 10 | 10 | 4 | 5 | einmalig 8 000 €, laufend 4 600 € pro Jahr |
| C | nicht erfüllt | 10 | 10 | 10 | 10 | einmalig 5 000 €, laufend 3 000 € pro Jahr |

| ID | Fall | Erwartung |
| --- | --- | --- |
| T-N1 | Gruppenwerte und Nutzwert | A: 7,0 / 6 / 10 → N 7,30; B: 10 / 4 / 5 → N 7,20; C ungültig („Muss-Kriterium F-03 nicht erfüllt“), Nutzwert 10 nur zur Anzeige |
| T-N2 | Regel Nutzwert | Rang A 1, B 2; Empfehlung A |
| T-N3 | B ohne Punkte für F-02 | S_B,Funktionen = 6,666667; N_B = 5,533333; `fehlend` 1; vorläufig |
| T-N4 | F-03 bei A „offen“ | A gültig, `koOffen` 1, vorläufig |
| T-N5 | zwei Nutzwerte mit Abstand 0,004 | gleicher Rang |
| T-N6 | Budget 35 000 € als K.-o. | A (39 140 €) ungültig „über Budget“; Empfehlung B |
| T-S1 | Regel Nutzwert | Funktionen [0; 0,516129], Abstand 0,016129, knapp; Betrieb [0,263158; 1], Abstand 0,036842, knapp; Anbieter [0,183673; 1], Abstand 0,016327, knapp |
| T-S2 | Regel Preis-Leistung | Empfehlung B; Funktionen [0,266561; 1]; Betrieb [0; 0,757405]; Anbieter [0; 0,461509]; Abstände 0,233439, 0,457405, 0,261509; nicht knapp |
| T-S3 | nur ein gültiges Angebot | keine Analyse, Hinweis |
| T-S4 | nur ein Hauptkriterium (W = 1) | keine Analyse für dieses Kriterium |
| T-S5 | Gleichstand an der Spitze | keine Analyse; Hinweis „Gleichstand an der Spitze“; Empfehlung nach D1 das günstigere Angebot |
| T-K1 | Angebot A; Annahmen: 7 Benutzer, Stundensatz 45 €, 8 Stunden je Personentag. Einrichtung 6 000 €, Datenübernahme 2 000 €, Schulung 1 500 €; intern 10 Personentage und 4 Schulungsstunden je Benutzer; 39 € je Benutzer und Monat; Support 600 € pro Jahr; Betrieb 2 Stunden im Monat | E = 14 360 €; L = 4 956 € pro Jahr; TCO 5 Jahre = 39 140 € |
| T-K2 | wie T-K1, Preissteigerung 3 % | L = 4 956; 5 104,68; 5 257,82; 5 415,56; 5 578,02; TCO = 40 672,08 € |
| T-K3 | wie T-K1, Zins 5 % | Barwert 35 816,89 €; mit Zins 0 % Barwert = 39 140 € |
| T-K4 | Zins 5 %, Nutzen 20 000 € pro Jahr | Kapitalwert 50 772,65 €; Amortisation im 2. Jahr |
| T-K5 | Zins 5 %, Nutzen 4 000 € pro Jahr | Kapitalwert −18 498,98 €; keine Amortisation in 5 Jahren |
| T-K6 | Kostenbasis Barwert ohne Zins; Betrag −1 € | Fehler „Zins fehlt“; Fehler „negativer Betrag“ |
| T-K7 | Vorschläge Lieferdienst | Benutzer 7; Stundensatz 44 € (310/7 = 44,29); Stunden je Personentag 8; Nutzen 100 920 € |
| T-R1 | Regel Nutzwert, Entwurf | enthält Sätze 1, 2a, 3a, 4, 6, 7b: „7,30 von 10 Punkten“, „0,10 Punkte vor Anbieter B“, „39.140 €“, „Platz 2 von 2“, „Ausgeschieden: Anbieter C (Muss-Kriterium F-03 nicht erfüllt)“, knapp bei „Funktionen“ mit 1,6 Prozentpunkten |
| T-R2 | Regel Preis-Leistung | € je Punkt A 5 361,64, B 4 305,56; Empfehlung B |
| T-R3 | Preis-Leistung, Mindestnutzwert 7,25 | nur A zulässig; Empfehlung A |
| T-R4 | alle Angebote ungültig | keine Empfehlung; Fehler „Kein Angebot erfüllt alle Muss-Kriterien“ |
| T-R5 | gewählt B bei Empfehlung A, Begründung leer | Warnung in der Vorlage |
| T-C1 | CSV Lieferdienst | beginnt mit BOM; Kopfzeile wie 6.15; Trennzeichen `;`; CRLF; 36 Zeilen (35 aktiv + Kopf) |
| T-C2 | Feld mit `;`, `"` und Zeilenumbruch | in Anführungszeichen, `"` verdoppelt |
| T-C3 | „=SUMME(A1)“, „-5 Tage“, „@x“ | „'=SUMME(A1)“, „'-5 Tage“, „'@x“ |
| T-B1 | Fallbeispiel der README | Nutzwerte, Gesamtkosten und Empfehlung wie in der README (Zahlen entstehen in Schritt 5.4) |

### 9.2 Browsertests (Playwright, lokal Edge, in der CI Chrome)

| ID | Ablauf | Erwartung |
| --- | --- | --- |
| E1 | Beispiel laden, alle 7 Schritte | Vorlage zeigt „Empfohlen wird“ und den Namen des empfohlenen Angebots |
| E2 | lieferdienst.prozesslotse einlesen | „18 Aufgaben, 6 Rollen“; Umfang „8 Aufgaben im Umfang · 4 Rollen · 7 Benutzer“ |
| E3 | kaputte Datei einlesen | Meldung sichtbar; App bleibt bedienbar |
| E4 | bewertung-abc öffnen, Paarvergleich wie T-AHP3 | Warnung mit „Prüfen Sie“ sichtbar |
| E5 | ganzer Durchlauf nur mit Tastatur | jeder Schritt erreichbar und bedienbar |
| E6 | speichern, neu laden, öffnen | gleicher Inhalt (ohne `geaendertAm`) |
| E7 | CSV herunterladen | BOM, Kopfzeile, Zeilenzahl wie T-C1 |
| E8 | Druckansicht Lastenheft (`emulateMedia print`) | Überschriften der Abschnitte 1 bis 12 sichtbar, keine Bedienelemente |
| E9 | axe in jedem Schritt, hell und dunkel | keine Befunde „serious“ oder „critical“ |
| E10 | Anforderung bearbeiten: Text ändern, Priorität auf Soll, Vorschlag übernehmen | Marke „geändert“; Vorschlag bekommt eine Nummer; Muss-Anteil aktualisiert |
| E11 | Angebot anlegen, alle Zeilen bewerten, Kosten eingeben | Fortschritt „35 von 35 bewertet“; Gesamtkosten sichtbar |

### 9.3 Testdaten

| Datei | Inhalt | Herkunft | Lizenz |
| --- | --- | --- | --- |
| `testdaten/prozesslotse/lieferdienst.prozesslotse` | Projekt „Lieferdienst“, Format 2 | im Prozesslotsen (Commit `e482a9a`) per „Beispiel laden“ und „Speichern“ erzeugt; Zahlen laut `beispiel.ts` „ausgedacht, aber plausibel“ | Robins eigenes Werk, keine Fremdrechte |
| `testdaten/prozesslotse/onlinebestellung.prozesslotse` | Projekt „Onlinebestellung“, Format 2 | ebenso | ebenso |
| `testdaten/prozesslotse/lieferdienst-format1.json` | Format 1 | von Hand aus der ersten Datei: `art`, `modus`, `zurueckZu`, `ereignis`, `zweck` entfernt | eigenes |
| `testdaten/prozesslotse/lieferdienst-eingebettet.bpmn` | BPMN mit eingebettetem Projekt | vom Prozesslotsen exportiert, sobald er einbettet; bis dahin von Hand nach 4.3 | eigenes |
| `testdaten/prozesslotse/kaputt/*` | Fehlerfälle T-E4 bis T-E13 | von Hand | eigenes |
| `testdaten/bewertung-abc.auswahllotse` | Beispiel ABC | von Hand nach 9.1 | eigenes |
| `testdaten/beispiel-lieferdienst.auswahllotse` | Fallbeispiel mit drei erfundenen Angeboten | Schritt 5.4; Anbieter heißen „Anbieter Nord“, „Anbieter Süd“, „Anbieter West“ | eigenes |

`testdaten/prozesslotse/README.md` nennt je Datei den Commit des Prozesslotsen und das Erzeugungsdatum. Fremddaten gibt es nicht.

---

## 10 Risiken und offene Fragen

### 10.1 Offene Fragen für Robin

1. **Einbettung im BPMN:** Passt der Vorschlag aus 4.3 (Namensraum, Element `pl:projekt` in der Kollaboration, JSON als Text) zur Umsetzung im Prozesslotsen?
2. **Dateiendung und App-ID:** `.auswahllotse` und `de.olbricht-digital.auswahllotse` in Ordnung?
3. **Word-Datei:** Brauchst du das Lastenheft schon in 0.1 als DOCX? Vorschlag: 0.2.
4. **Kataloge:** Gibst du die 21 Anforderungen und 24 Bausteine fachlich frei? Soll es eine eigene Regel zu E-Rechnungspflichten geben?
5. **Festlegungen:** Normalfall ab 50 %, Medienbruch Muss ab 60 und Soll ab 10 Minuten pro Tag, „knapp“ unter 5 Prozentpunkten, Mindestnutzwert 5, 250 Betriebstage, Spitzenfaktor 2, Stundensatz ohne Modell 45 €. Passen diese Werte?
6. **Mehrere Prozessmodelle** je Vorhaben (z. B. Verkauf und Einkauf für ein ERP) in 0.2?
7. **Dritte Entscheidungsregel** „Kosten als gewichtetes Kriterium“ gewünscht?
8. **Repo:** eigenes privates Repo `edgebird-lab/auswahllotse` statt eines gemeinsamen mit dem Prozesslotsen?
9. **Lizenz:** wie beim Prozesslotsen noch offen.
10. **Lokale KI:** frühestens 0.3, nur lokal und nur als Vorschlag. Einverstanden?

### 10.2 Risiken

| Risiko | Folge | Gegenmaßnahme |
| --- | --- | --- |
| Der Prozesslotse ändert sein Format | Dateien werden abgelehnt | Versionsprüfung, Vertragstests mit Testdateien, eigener Arbeitsschritt je neuem Format |
| Häufigkeiten weichen vom Prozesslotsen ab | widersprüchliche Zahlen in zwei Werkzeugen | gleiche Regeln (6.2), Referenzwerte aus beiden Beispielen (T-H1 bis T-H3) |
| Zu viele Anforderungen aus dem Modell | Nutzer verliert den Überblick | Umfangsschritt, Normalfall-Regel, Vorschläge statt Zwang |
| Rechtsinhalte veralten oder sind falsch | falsche Muss-Kriterien | Quelle und Stand je Eintrag, jährliche Durchsicht, Hinweis „keine Rechtsberatung“ |
| Gewichte werden nach Ansicht der Angebote gedreht | Scheinobjektivität | Festlegen, Änderungszähler, Sensitivität in der Vorlage |
| Umfang des MVP (etwa 24,5 Tage) | Termin rutscht | Kürzungsreihenfolge: Neu einlesen (3.7), Regel Preis-Leistung, CSV-Export |
| Browser-Speicher geht verloren | Arbeit weg | Datei speichern, Hinweis beim Schließen |
| Ungeprüfte Quellen (RI-Tabelle, GoBD) | Fehler in Formeln oder Texten | Prüfschritt 4.3, Simulationstest T-AHP6, offene Frage 4 |
| Tauri-Weg hängt am Prozesslotsen | Phase 9 verzögert sich | Phase 9 erst nach W3 des Prozesslotsen; Plattformschicht ab Phase 6 |

### 10.3 In dieser Sitzung nicht geprüft

- **GoBD** (BMF-Seite, HTTP 503). Der Katalog stützt sich deshalb auf §§ 146 und 147 AO.
- **Nutzwertanalyse** im Organisationshandbuch des BMI (HTTP 400) und **WiBe 5.0** (HTTP 403). Die Formeln in 6.9 und 6.11 sind eigene Festlegungen nach Standardverfahren.
- **Saaty-RI-Tabelle** (ScienceDirect HTTP 403, Spiegel nicht erreichbar). Eine eigene Simulation bestätigt die Werte auf 0,06 genau (T-AHP6).
- **E-Rechnungspflichten** (§ 14 UStG nicht geöffnet). Baustein ERP-4 ist deshalb nur Soll mit Prüfhinweis.
- **Lizenzen der Rust-Crates** für Phase 9.

---

## 11 Arbeitsschritte zum Abhaken

Jeder Schritt braucht einen halben bis einen Arbeitstag und endet mit einem prüfbaren Ergebnis. Vor jedem Commit: `npm run lint`, `npm test`, `npm run build`; bei Oberflächenänderungen zusätzlich `npm run e2e`.

### Phase 0 – Einrichten (1 Tag)

- [ ] **0.1** Projekt mit Vite 8, React 19, TypeScript 7 und Vitest 5 anlegen, Einstellungen wie beim Prozesslotsen. Ergebnis: `npm run build` und ein Platzhaltertest laufen.
- [ ] **0.2** oxlint (mit `react/no-danger`), Playwright mit axe (lokal Edge) und ein Smoke-Test. Ergebnis: `npm run lint` und `npm run e2e` grün.
- [ ] **0.3** Privates Repo `edgebird-lab/auswahllotse`, Workflow „Prüfung“ mit `npm audit`, `CLAUDE.md` mit Arbeitsregeln. Ergebnis: erster CI-Lauf grün.

### Phase 1 – Datenmodell und Speichern (1,5 Tage)

- [ ] **1.1** `typen.ts` und `ergebnisse.ts` nach 4.2 und 4.4, `neuesProjekt()` mit allen Standardwerten. Ergebnis: Typprüfung grün, T-D1 grün.
- [ ] **1.2** Projektdatei speichern und laden mit Strukturprüfung und Meldungen (6.16). Ergebnis: T-D2 bis T-D5 grün.
- [ ] **1.3** Browser-Speicher und Einstellungen. Ergebnis: T-D6 und T-D7 grün.

### Phase 2 – Prozessmodell einlesen (3 Tage)

- [ ] **2.1** Testdateien im Prozesslotsen erzeugen und mit Herkunft ablegen; eigene `Pl`-Typen in `format.ts`. Ergebnis: Dateien und `testdaten/prozesslotse/README.md` im Repo.
- [ ] **2.2** JSON-Leser mit Versionsprüfung, Umstellung von Format 1, Grenzen, Ersatzwerten und Projektion (E1 bis E8, E13). Ergebnis: T-E1 bis T-E8 grün.
- [ ] **2.3** Häufigkeit nach dem Flussverfahren (6.2). Ergebnis: T-H1 bis T-H6 grün.
- [ ] **2.4** Mengengerüst, Prozesskosten, Medienbruchkosten (6.3). Ergebnis: T-M1 bis T-M5 grün.
- [ ] **2.5** BPMN mit eingebettetem Projekt (E9 bis E12), Testdatei nach 4.3. Ergebnis: T-E9 bis T-E13 grün.

### Phase 3 – Lastenheft ableiten (4 Tage)

- [ ] **3.1** Umfang mit Standardstatus und Aufgaben im Umfang (U1 bis U3). Ergebnis: T-U1 bis T-U3 grün.
- [ ] **3.2** Funktionen und Entscheidungs-Vorschläge mit Satzmustern (A0 bis A3). Ergebnis: T-A1 und T-A2 grün.
- [ ] **3.3** Schnittstellen aus Medienbrüchen, Fälle A bis E, Ist und Soll (U4, U5, A4). Ergebnis: T-A3 bis T-A5 grün.
- [ ] **3.4** Rollen, Freigaben, Prüfungen und Mengengerüst (A5 bis A8). Ergebnis: T-A6 und T-A7 grün.
- [ ] **3.5** Katalog und Bausteine mit dreiwertigen Bedingungen; `docs/kataloge.md`. Ergebnis: T-A8 bis T-A10 grün.
- [ ] **3.6** Prüfungen P1 bis P11 und Nummernvergabe. Ergebnis: T-P1 bis T-P6 grün.
- [ ] **3.7** Neu einlesen mit Abgleich und Vorschau (6.14); ohne Prozessmodell (A11). Ergebnis: T-A11 und T-A12 grün.

### Phase 4 – Gewichtung und Nutzwert (3 Tage)

- [ ] **4.1** Hauptkriterien, direkte Gewichte, Unterpunkte, Änderungszähler (G1 bis G5). Ergebnis: T-G1 bis T-G4 grün.
- [ ] **4.2** AHP mit Eigenvektor, λmax, CR und widersprüchlichstem Urteil. Ergebnis: T-AHP1 bis T-AHP5 grün.
- [ ] **4.3** RI-Tabelle gegen Saaty (1987) nachschlagen und Simulationstest einbauen. Ergebnis: T-AHP6 grün, Quelle in `schwellen.ts` vermerkt.
- [ ] **4.4** K.-o.-Prüfung, Budget, Nutzwert, Rang, „vorläufig“ (N1 bis N7). Ergebnis: T-N1 bis T-N6 grün.
- [ ] **4.5** Sensitivität für beide Regeln (S1 bis S6). Ergebnis: T-S1 bis T-S5 grün.

### Phase 5 – Kosten und Entscheidung (2,5 Tage)

- [ ] **5.1** Gesamtkosten mit einmaligen, laufenden und internen Kosten und Preissteigerung (K1 bis K4). Ergebnis: T-K1 und T-K2 grün.
- [ ] **5.2** Barwert, Kapitalwert, Amortisationsjahr, Prüfungen und Vorschläge (K5 bis K10). Ergebnis: T-K3 bis T-K7 grün.
- [ ] **5.3** Entscheidungsregeln und Begründungsentwurf (6.12, 6.13). Ergebnis: T-R1 bis T-R5 grün.
- [ ] **5.4** Fallbeispiel „Lieferdienst sucht Warenwirtschaft“ mit drei erfundenen Angeboten. Ergebnis: Testdatei im Repo, T-B1 sichert die README-Zahlen.

### Phase 6 – Oberfläche (5 Tage)

- [ ] **6.1** Gerüst: Plattformschicht (Browser), Zustand mit Rückgängig, Kopf- und Schrittleiste, hell und dunkel, Lernmodus. Ergebnis: Smoke-Test und axe grün.
- [ ] **6.2** Schritte Rahmen und Prozess, Teil A (Datei, Befunde, Grundlage, ohne Modell). Ergebnis: E3 grün.
- [ ] **6.3** Schritt Prozess, Teil B (Umfang). Ergebnis: E2 grün.
- [ ] **6.4** Schritt Anforderungen (Gruppen, MoSCoW, Bearbeiten, Vorschläge, Befunde, Muss-Anteil). Ergebnis: E10 grün.
- [ ] **6.5** Schritt Gewichtung (direkt, Paarvergleich mit Ampel, Unterpunkte, Regel, Festlegen). Ergebnis: E4 grün.
- [ ] **6.6** Schritt Angebote (Bewertung, Kosten, Annahmen, Fortschritt). Ergebnis: E11 grün.
- [ ] **6.7** Schritt Ergebnis mit SVG-Diagrammen und Datentabellen. Ergebnis: E1 bis Schritt 6 grün, axe ohne Befunde.

### Phase 7 – Vorlagen und Export (2,5 Tage)

- [ ] **7.1** Druckansicht Lastenheft (A4, Abschnitte 1 bis 12, Anhang). Ergebnis: E8 grün, PDF-Probe abgelegt.
- [ ] **7.2** Entscheidungsvorlage mit Begründung, Risiken, Status und Freigabefeldern. Ergebnis: E1 vollständig grün.
- [ ] **7.3** CSV-Anbieterfragebogen (6.15). Ergebnis: T-C1 bis T-C3 und E7 grün.
- [ ] **7.4** README mit Bildern, Formeln und Grenzen; `docs/datenmodell.md`. Ergebnis: README-Bilder per Skript erzeugt.

### Phase 8 – Qualität und Version 0.1.0 (2 Tage)

- [ ] **8.1** Alle Browsertests E1 bis E11 in der CI. Ergebnis: CI grün.
- [ ] **8.2** Barrierefreiheit und Tastatur prüfen und nachbessern (E5, E9). Ergebnis: beide grün, hell und dunkel.
- [ ] **8.3** Durchsicht mit Robin an einem echten Fall. Ergebnis: Befunde als Issues, kritische behoben.
- [ ] **8.4** Version 0.1.0 taggen (Repo bleibt privat), Arbeitsplan aktualisieren. Ergebnis: Tag `v0.1.0`.

### Phase 9 – Windows-Programm mit Tauri (3 bis 5 Tage, nach W3 des Prozesslotsen)

- [ ] **9.1** Desktop-Teil der Plattformschicht aus dem Prozesslotsen übernehmen. Ergebnis: Browser-Variante unverändert, alle Tests grün.
- [ ] **9.2** Tauri-Gerüst: App-ID, Fenster, CSP, minimale Rechte, Installer pro Benutzer. Ergebnis: `desktop:build` erzeugt ein Setup.
- [ ] **9.3** Dateien: Zuordnung `.auswahllotse`, Import-Dialog, Single-Instance, atomares Speichern. Ergebnis: Doppelklick öffnet ein Projekt.
- [ ] **9.4** PDF über WebView2 für beide Vorlagen. Ergebnis: PDF ohne Druckdialog.
- [ ] **9.5** Test in der Windows Sandbox ohne Admin; Windows-Job in der CI. Ergebnis: Installation, Doppelklick und Deinstallation protokolliert.

### Aufwand

| Phase | Tage |
| --- | --- |
| 0 Einrichten | 1 |
| 1 Datenmodell und Speichern | 1,5 |
| 2 Prozessmodell einlesen | 3 |
| 3 Lastenheft ableiten | 4 |
| 4 Gewichtung und Nutzwert | 3 |
| 5 Kosten und Entscheidung | 2,5 |
| 6 Oberfläche | 5 |
| 7 Vorlagen und Export | 2,5 |
| 8 Qualität und Version 0.1.0 | 2 |
| **MVP gesamt** | **24,5 (Spanne 21 bis 28)** |
| 9 Windows-Programm | 3 bis 5 |

---

## 12 Quellen

### 12.1 Webseiten (geöffnet am 11.11.2026)

- Agile Business Consortium: What is MoSCoW Prioritization? (veröffentlicht 28.05.2026) – https://www.agilebusiness.org/?p=1907
- Abgabenordnung § 146 – https://www.gesetze-im-internet.de/ao_1977/__146.html
- Abgabenordnung § 147 – https://www.gesetze-im-internet.de/ao_1977/__147.html
- Barrierefreiheitsstärkungsgesetz (BFSG), Volltext – https://www.gesetze-im-internet.de/bfsg/BJNR297010021.html
- Verordnung (EU) 2016/679 (DSGVO), EUR-Lex – https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32016R0679
- OMG BPMN 2.0 Semantic.xsd – https://www.omg.org/spec/BPMN/20100501/Semantic.xsd
- Prozesslotse – Arbeitsplan (Claude-Doc, Abschnitt „Windows-Programm (Plan)“) – https://claude.ai/artifact/GUoEBaUuu66sU9TdpoaeNJ

### 12.2 Projektunterlagen (gelesen)

- Prozesslotse, Commit `e482a9a`: `README.md`, `CLAUDE.md`, `package.json`, `docs/datenmodell.md`, `docs/fragenkatalog.md`, `docs/windows-prototyp/` (README, `tauri.conf.json`, `capabilities/default.json`, `Cargo.toml`, `src/lib.rs`, `src/plattform/desktop.ts`), `src/modell/typen.ts`, `src/modell/speicher.ts`, `src/modell/beispiel.ts`, `src/analyse/kennzahlen.ts`, `src/analyse/regeln.ts`, `src/bpmn/export.ts`, Tests in `src/analyse/*.test.ts` und `src/modell/ruecksprung.test.ts`.
- Ideensammlung `ideen.json`, Eintrag Rang 9 „Auswahl-Lotse“.
- npm-Registry per `npm view <paket> version license` am 11.11.2026.
- Nachrechnung aller Testwerte in 9.1 mit einem Python-Skript (Häufigkeiten, AHP, Nutzwert, Sensitivität, Kosten).

### 12.3 Versucht, nicht abrufbar (nicht verwendet)

- BMF, GoBD 2. Änderung vom 14.07.2025 (HTML und PDF): HTTP 503.
- Organisationshandbuch BMI, qualitative und quantitative Bewertungsmethoden: HTTP 400.
- WiBe 5.0 Fachkonzept (Spiegel Bremen): HTTP 403.
- Saaty (1987) bei ScienceDirect: HTTP 403; Spiegel der Masaryk-Universität mit Bot-Sperre; ISAHP-Spiegel nicht auflösbar.
