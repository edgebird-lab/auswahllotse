/**
 * Eigene Typen für das veröffentlichte Dateiformat des Prozesslotsen
 * (Präfix `Pl`). Der Vertrag ist das Dateiformat, nicht der Code: Der
 * Auswahl-Lotse importiert nichts aus dem Prozesslotsen.
 *
 * Abgebildet ist Format 3 (Prozesslotse `src/modell/typen.ts`, Commit
 * `0139e53`): Format 2 plus externe Teilnehmer mit Nachrichtenverweisen und
 * die ODER-Verzweigung. Der Leser (`lesen.ts`) stellt Format 1 und 2 auf
 * diese Form um und kopiert nur bekannte Felder. Bausteine, die er nicht
 * kennt (etwa aus Format 4), übernimmt er als allgemeinen Schritt.
 */

export type PlId = string

/** Formate, die der Auswahl-Lotse vollständig kennt. */
export const PL_FORMATE = [1, 2, 3] as const
export const PL_FORMAT_AKTUELL = 3

/** Namensraum des eingebetteten Projekts in BPMN-Dateien des Prozesslotsen. */
export const PL_NAMENSRAUM = 'https://olbricht-digital.de/prozesslotse/projekt'

export type PlMediumArt = 'papier' | 'telefon' | 'email' | 'tabelle' | 'fachanwendung' | 'erp' | 'sonstiges'
export const PL_MEDIUM_ARTEN: readonly PlMediumArt[] = ['papier', 'telefon', 'email', 'tabelle', 'fachanwendung', 'erp', 'sonstiges']
/** Medien ohne digitale Daten: Hier entsteht beim Übertragen immer ein Abtippen. */
export const PL_NICHT_DIGITAL: readonly PlMediumArt[] = ['papier', 'telefon']

export const PL_MEDIUM_NAMEN: Record<PlMediumArt, string> = {
  papier: 'Papier',
  telefon: 'Telefon',
  email: 'E-Mail',
  tabelle: 'Tabelle',
  fachanwendung: 'Fachanwendung',
  erp: 'ERP-System',
  sonstiges: 'Sonstiges',
}

export function istDigital(art: PlMediumArt): boolean {
  return !PL_NICHT_DIGITAL.includes(art)
}

export interface PlMedium {
  id: PlId
  name: string
  art: PlMediumArt
}

export interface PlRolle {
  id: PlId
  name: string
  /** Vollkosten je Stunde in Euro. */
  stundensatz: number
  /** Personen (Vollzeitäquivalente, auch 0,5). */
  personen: number
  verfuegbarProzent: number
}

/** Externer Beteiligter mit eigenem Pool (seit Format 3), z. B. Kunde. */
export interface PlTeilnehmer {
  id: PlId
  name: string
}

export type PlAufgabenArt = 'normal' | 'pruefung' | 'freigabe'
export const PL_AUFGABEN_ARTEN: readonly PlAufgabenArt[] = ['normal', 'pruefung', 'freigabe']

/** Medienbruch: Daten werden von Hand aus einem anderen Medium übertragen. */
export interface PlUebertragung {
  quelleMediumId: PlId | null
  minuten: number
}

export interface PlAufgabe {
  typ: 'aufgabe'
  id: PlId
  name: string
  rolleId: PlId | null
  mediumId: PlId | null
  bearbeitungMin: number
  liegezeitMin: number
  art: PlAufgabenArt
  freigabeQuote: number
  brauchtVorgaenger: boolean | null
  uebertragung: PlUebertragung | null
  /** Nachricht an einen externen Teilnehmer (Format 3), sonst null. */
  nachrichtAn: PlId | null
  /** Wartet auf eine Nachricht eines externen Teilnehmers (Format 3), sonst null. */
  nachrichtVon: PlId | null
}

export interface PlSequenz {
  id: PlId
  schritte: PlBlock[]
}

export type PlWarteArt = 'zeit' | 'nachricht'

export interface PlZweigEreignis {
  art: PlWarteArt
  dauerMin: number
  von: PlId | null
}

export interface PlZweig extends PlSequenz {
  bezeichnung: string
  anteil: number
  ende: string | null
  zurueckZu: PlId | null
  ereignis: PlZweigEreignis | null
}

export interface PlEntscheidung {
  typ: 'entscheidung'
  id: PlId
  art: 'daten' | 'ereignis'
  frage: string
  zweige: PlZweig[]
}

/** Weg einer ODER-Verzweigung mit eigener, unabhängiger Wahrscheinlichkeit (Format 3). */
export interface PlOderZweig extends PlSequenz {
  bezeichnung: string
  anteil: number
}

/** ODER: Je nach Fall laufen einer, mehrere oder alle Wege (inklusives Gateway, Format 3). */
export interface PlOder {
  typ: 'oder'
  id: PlId
  frage: string
  zweige: PlOderZweig[]
  /** Weg, der genau dann läuft, wenn keiner der anderen zutrifft; null = mindestens einer läuft. */
  standard: PlId | null
}

export interface PlParallel {
  typ: 'parallel'
  id: PlId
  zweige: PlSequenz[]
}

export interface PlWiederholung {
  typ: 'wiederholung'
  id: PlId
  modus: 'anteil' | 'ruecksprung'
  /** Fehlt in der Datei → 'nacharbeit' (Standard des Formats). */
  zweck: 'nacharbeit' | 'menge'
  frage: string
  anteilWiederholung: number
  koerper: PlSequenz
}

export interface PlWarten {
  typ: 'warten'
  id: PlId
  name: string
  art: PlWarteArt
  dauerMin: number
  von: PlId | null
}

/**
 * Baustein, den der Auswahl-Lotse nicht kennt (z. B. aus einem neueren
 * Format). Er zählt als allgemeiner Schritt: Der Ablauf läuft unverändert
 * hindurch, enthaltene Aufgaben sind nicht sichtbar. Der Leser meldet ihn.
 */
export interface PlAllgemein {
  typ: 'allgemein'
  id: PlId
  /** Typ in der Datei, z. B. „teilprozess“. */
  originalTyp: string
  /** Name oder Frage des Bausteins, falls vorhanden. */
  name: string
}

export type PlBlock = PlAufgabe | PlEntscheidung | PlOder | PlParallel | PlWiederholung | PlWarten | PlAllgemein

export type PlAusloeserArt = 'nachricht' | 'zeit' | 'bedingung' | 'manuell'

export interface PlProzess {
  id: PlId
  name: string
  beschreibung: string
  ausloeser: { art: PlAusloeserArt; text: string; von: PlId | null }
  ergebnis: string
  vorgaengeProTag: number
  arbeitsstundenProTag: number
  rollen: PlRolle[]
  medien: PlMedium[]
  teilnehmer: PlTeilnehmer[]
  ablauf: PlSequenz
}

export interface PlMassnahme {
  schluessel: string
  titel: string
  begruendung: string
}

/** Prozesslotse-Projekt nach dem Einlesen, immer in der Form von Format 3. */
export interface PlProjekt {
  formatVersion: typeof PL_FORMAT_AKTUELL
  ist: PlProzess
  soll: PlProzess | null
  massnahmen: PlMassnahme[]
  verworfen: string[]
}
