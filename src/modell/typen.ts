/**
 * Datenmodell der Projektdatei des Auswahl-Lotsen (Spezifikation 4.2).
 *
 * Einheiten: Geld in Euro netto; Zeiten in Minuten (`…Min`), Stunden
 * (`…Stunden`) oder Sekunden (`…Sek`). Felder auf `…Prozent` haben 0 bis 100,
 * Anteile, Gewichte und Häufigkeiten 0 bis 1. Datumsangaben sind ISO-8601-Text.
 * Berechnete Werte werden nie gespeichert (siehe ergebnisse.ts).
 */
import type { PlId, PlProjekt } from '../prozessdatei/format'

export type Id = string

/** Dateiformat des Auswahl-Lotsen. Bei inkompatiblen Änderungen erhöhen und umstellen. */
export const FORMAT_VERSION = 1
export const DATEIENDUNG = 'auswahllotse'
export const MIME_TYP = 'application/vnd.auswahllotse+json'

// ── Rahmen ────────────────────────────────────────────────────────────────

export type Softwareart = 'erp' | 'shop' | 'crm' | 'dms' | 'andere'
export const SOFTWAREARTEN: readonly Softwareart[] = ['erp', 'shop', 'crm', 'dms', 'andere']

/** Antwort auf eine Rahmenfrage; „offen“ bedeutet „weiß nicht“. */
export type JaNeinOffen = 'ja' | 'nein' | 'offen'
export const JA_NEIN_OFFEN: readonly JaNeinOffen[] = ['ja', 'nein', 'offen']

export type Betriebsform = 'cloud' | 'eigener_server' | 'offen'
export const BETRIEBSFORMEN: readonly Betriebsform[] = ['cloud', 'eigener_server', 'offen']

/** Richtwerte, die in Anforderungstexte eingesetzt werden (6.5). */
export interface Richtwerte {
  antwortzeitSek: number
  aufbewahrungJahre: number
  wiederherstellungStunden: number
  verfuegbarkeitProzent: number
  reaktionStunden: number
  referenzen: number
  einfuehrungWochen: number
}

export interface Rahmen {
  /** z. B. „Neue Warenwirtschaft“ */
  vorhaben: string
  betrieb: string
  ersteller: string
  softwareart: Softwareart
  personenbezogen: JaNeinOffen
  steuerrelevant: JaNeinOffen
  betriebsform: Betriebsform
  /** nur bei Shop gefragt */
  verbraucherverkauf: JaNeinOffen
  /** BFSG § 2 Nr. 17 */
  kleinstunternehmen: JaNeinOffen
  betriebstageProJahr: number
  spitzenfaktor: number
  richtwerte: Richtwerte
}

// ── Prozessmodell und Umfang ──────────────────────────────────────────────

export interface ProzessQuelle {
  dateiname: string
  dateiart: 'json' | 'bpmn'
  /** Format in der Datei vor der Umstellung (1 bis 3, bei neueren Dateien deren Nummer). */
  formatVersionGelesen: number
  /** aus dem BPMN-Kopf, sonst null */
  exporterVersion: string | null
  /** Hex über den Dateitext */
  sha256: string
  eingelesenAm: string
  /** auf Format 3 umgestellt, nur bekannte Felder (4.3) */
  projekt: PlProjekt
}

export type MediumStatus = 'abloesen' | 'anbinden' | 'unberuehrt'
export const MEDIUM_STATUS: readonly MediumStatus[] = ['abloesen', 'anbinden', 'unberuehrt']

export interface Umfang {
  grundlage: 'ist' | 'soll'
  medien: Record<PlId, MediumStatus>
  /** trotz abgelöstem System ausgeschlossen */
  aufgabenAus: PlId[]
  /** trotz anderem System eingeschlossen */
  aufgabenEin: PlId[]
}

// ── Anforderungen ─────────────────────────────────────────────────────────

/** Must, Should, Could, Won't (dieses Mal) */
export type Prioritaet = 'muss' | 'soll' | 'kann' | 'nicht'
export const PRIORITAETEN: readonly Prioritaet[] = ['muss', 'soll', 'kann', 'nicht']

export type AnforderungsStatus = 'vorschlag' | 'aktiv' | 'verworfen'
export const ANFORDERUNGS_STATUS: readonly AnforderungsStatus[] = ['vorschlag', 'aktiv', 'verworfen']

export type Gruppe =
  | 'funktion'
  | 'schnittstelle'
  | 'benutzer'
  | 'menge'
  | 'datenschutz'
  | 'ordnung'
  | 'betrieb'
  | 'barrierefreiheit'
  | 'anbieter'

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

export const GRUPPEN_REIHENFOLGE: readonly Gruppe[] = GRUPPEN.map((g) => g.gruppe)

export function gruppenName(g: Gruppe): string {
  return GRUPPEN.find((x) => x.gruppe === g)?.name ?? g
}

export type HerkunftArt =
  | 'aufgabe'
  | 'entscheidung'
  | 'medienbruch'
  | 'rollen'
  | 'freigabe'
  | 'pruefung'
  | 'mengengeruest'
  | 'katalog'
  | 'baustein'
  | 'eigene'
export const HERKUNFT_ARTEN: readonly HerkunftArt[] = [
  'aufgabe',
  'entscheidung',
  'medienbruch',
  'rollen',
  'freigabe',
  'pruefung',
  'mengengeruest',
  'katalog',
  'baustein',
  'eigene',
]

export interface Herkunft {
  art: HerkunftArt
  /** Kennungen im Prozessmodell (Aufgaben, Rollen, Systeme) */
  bezuege: PlId[]
  /** z. B. 'N-DS-1' oder 'ERP-3' */
  katalogId: string | null
}

/** Was der Benutzer selbst geändert hat; „Neu einlesen“ überschreibt das nicht (6.14). */
export interface Bearbeitet {
  text: boolean
  prioritaet: boolean
  status: boolean
}

export interface Anforderung {
  /** stabil, Regel A0 */
  id: Id
  /** 'F-03'; erst bei Aktivierung vergeben, nie wiederverwendet */
  nummer: string | null
  gruppe: Gruppe
  titel: string
  text: string
  /** Abnahmekriterium */
  abnahme: string
  prioritaet: Prioritaet
  /** aus der Regel; Anzeige „geändert“, wenn abweichend */
  prioritaetVorschlag: Prioritaet
  status: AnforderungsStatus
  herkunft: Herkunft
  /** Herleitung in Klartext */
  begruendung: string
  /** Rechtsquelle mit Stand (Katalog und Bausteine) */
  quelle: string | null
  /** Gewicht in der Gruppe, ganze Zahl 0 bis 10 */
  punkte: number
  bearbeitet: Bearbeitet
  notiz: string
}

// ── Gewichtung ────────────────────────────────────────────────────────────

export type Gewichtungsmethode = 'direkt' | 'paarvergleich'
export type Staerke = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** Ein Urteil im Paarvergleich; Stärke 1 heißt „gleich wichtig“. */
export interface Paarurteil {
  a: Gruppe
  b: Gruppe
  wichtiger: 'a' | 'b'
  staerke: Staerke
}

export interface Gewichtung {
  methode: Gewichtungsmethode
  /** ganze Zahlen, Summe 100 */
  direktProzent: Partial<Record<Gruppe, number>>
  paare: Paarurteil[]
  festgelegtAm: string | null
  /** Zähler, Regel G5 */
  aenderungenNachBewertung: number
}

// ── Angebote und Kosten ───────────────────────────────────────────────────

export type KoErgebnis = 'erfuellt' | 'nicht_erfuellt' | 'offen'
export const KO_ERGEBNISSE: readonly KoErgebnis[] = ['erfuellt', 'nicht_erfuellt', 'offen']

export interface Bewertung {
  /** nur bei Muss */
  ko: KoErgebnis | null
  /** nur bei Soll und Kann, ganze Zahl 0 bis 10 */
  punkte: number | null
  /** z. B. „Angebot S. 4“, „Vorführung 12.11.“ */
  fundstelle: string
  notiz: string
}

export type EinmaligArt = 'lizenzkauf' | 'einrichtung' | 'datenuebernahme' | 'anpassung' | 'schulung' | 'hardware' | 'sonstiges'
export const EINMALIG_ARTEN: readonly EinmaligArt[] = ['lizenzkauf', 'einrichtung', 'datenuebernahme', 'anpassung', 'schulung', 'hardware', 'sonstiges']

export type LaufendArt = 'abo' | 'wartung' | 'hosting' | 'support' | 'sonstiges'
export const LAUFEND_ARTEN: readonly LaufendArt[] = ['abo', 'wartung', 'hosting', 'support', 'sonstiges']

export interface Kostenposition<A extends string> {
  id: Id
  art: A
  bezeichnung: string
  betragEuro: number
}

export interface Kosten {
  einmalig: Kostenposition<EinmaligArt>[]
  /** Betrag je Jahr */
  laufendJahr: Kostenposition<LaufendArt>[]
  /** 0, wenn nicht nach Benutzern */
  preisJeBenutzerMonatEuro: number
  /** Personentage */
  internEinfuehrungTage: number
  internSchulungStundenJeBenutzer: number
  internBetriebStundenMonat: number
}

export type AngebotsBetriebsform = 'cloud' | 'eigener_server'

export interface Angebot {
  id: Id
  anbieter: string
  produkt: string
  betriebsform: AngebotsBetriebsform
  angebotsdatum: string | null
  notiz: string
  /** Schlüssel: Anforderung.id */
  bewertungen: Record<Id, Bewertung>
  kosten: Kosten
}

export interface Wirtschaftlichkeit {
  /** 1 bis 10, Standard 5 */
  jahre: number
  benutzer: number
  internerStundensatzEuro: number
  stundenProPersonentag: number
  /** laufende Kosten je Jahr */
  preissteigerungProzent: number
  /** Kalkulationszins; null = ohne Abzinsung */
  zinsProzent: number | null
  kostenbasis: 'nominal' | 'barwert'
  /** optional, gleich für alle Angebote */
  nutzenProJahrEuro: number | null
  /** über den Betrachtungszeitraum */
  budgetEuro: number | null
  budgetAlsKo: boolean
}

// ── Entscheidung ──────────────────────────────────────────────────────────

export type Entscheidungsregel = 'nutzwert' | 'preis_leistung'

export interface Risiko {
  id: Id
  text: string
  massnahme: string
}

export interface Entscheidung {
  regel: Entscheidungsregel
  /** nur preis_leistung, 0 bis 10 */
  mindestNutzwert: number
  /** null = Empfehlung der Regel */
  gewaehltId: Id | null
  /** leer = Entwurf anzeigen (6.13) */
  begruendung: string
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
  /** nächste freie Nummer je Gruppe */
  naechsteNummer: Partial<Record<Gruppe, number>>
  gewichtung: Gewichtung
  angebote: Angebot[]
  /** erste Punktzahl oder erstes K.-o.-Ergebnis */
  bewertungBegonnenAm: string | null
  wirtschaftlichkeit: Wirtschaftlichkeit
  entscheidung: Entscheidung
}

/** Im Browser getrennt vom Projekt gespeichert. */
export interface Einstellungen {
  lernmodus: boolean
  farbschema: 'system' | 'hell' | 'dunkel'
}
