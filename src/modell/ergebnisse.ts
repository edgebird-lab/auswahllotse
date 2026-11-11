/**
 * Berechnete Ergebnisse (Spezifikation 4.4). Sie werden nie gespeichert,
 * sondern bei Bedarf aus dem Projekt neu berechnet.
 */
import type { PlId } from '../prozessdatei/format'
import type { Gruppe, Id } from './typen'

export type Schwere = 'fehler' | 'warnung' | 'hinweis'

export interface Befund {
  schwere: Schwere
  /** z. B. 'E7', 'P1', 'N2' */
  code: string
  text: string
  /** Kennung des betroffenen Objekts (Anforderung, Angebot, Baustein) oder null */
  bezug: Id | null
}

/** Fälle nach Regel U4 (6.4). */
export type MedienbruchFall = 'A' | 'B' | 'C' | 'D' | 'E'

export interface Medienbruch {
  quelleId: PlId | null
  zielId: PlId
  fall: MedienbruchFall
  /** Aufgaben mit dieser Übertragung, in Prozessreihenfolge */
  aufgaben: PlId[]
  uebertragungenProTag: number
  minutenProTag: number
  euroProTag: number
}

export interface RollenMenge {
  rolleId: PlId
  name: string
  benutzer: number
  aufgaben: PlId[]
  arbeitMinProTag: number
}

export interface Ende {
  ergebnis: string
  anteil: number
  regulaer: boolean
}

export interface Mengengeruest {
  vorgaengeProTag: number
  vorgaengeSpitze: number
  vorgaengeProJahr: number
  /** Ausführungen je Vorgang, je Aufgabe der Grundlage */
  haeufigkeit: Map<PlId, number>
  imUmfang: PlId[]
  rollen: RollenMenge[]
  benutzer: number
  medienbrueche: Medienbruch[]
  kostenProVorgangIst: number
  kostenProVorgangSoll: number | null
  /** Fälle A, B, C; Nutzenvorschlag */
  medienbruchkostenProJahr: number
  enden: Ende[]
  /** Vorgänge über die Aufbewahrungsdauer */
  datenbestand: number
  befunde: Befund[]
}

export interface AhpErgebnis {
  gewichte: number[]
  lambdaMax: number
  ci: number
  cr: number
  /** cr ≤ 0,10 */
  stimmig: boolean
  /** Indizes des widersprüchlichsten Urteils */
  widerspruch: [number, number] | null
}

export interface KostenErgebnis {
  einmalig: number
  laufend: number[]
  tco: number
  barwert: number | null
  kapitalwert: number | null
  amortisationJahr: number | null
}

export interface AngebotsErgebnis {
  angebotId: Id
  gueltig: boolean
  ausschluss: string[]
  koOffen: number
  fehlend: number
  gruppenwerte: Partial<Record<Gruppe, number>>
  nutzwert: number
  kosten: KostenErgebnis
  kostenbasis: number
  euroJePunkt: number | null
  rang: number | null
}

export interface Stabilitaet {
  gruppe: Gruppe
  gewicht: number
  von: number
  bis: number
  /** null = über den ganzen Bereich stabil */
  abstand: number | null
  knapp: boolean
}

export interface Auswertung {
  gewichte: Partial<Record<Gruppe, number>>
  ahp: AhpErgebnis | null
  ergebnisse: AngebotsErgebnis[]
  empfehlungId: Id | null
  vorlaeufig: boolean
  stabilitaet: Stabilitaet[]
  befunde: Befund[]
}
