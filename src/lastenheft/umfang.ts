/**
 * Umfang des Vorhabens (Spezifikation 6.4, Regeln U1 bis U3): welches System
 * abgelöst, angebunden oder nicht berührt wird und welche Aufgaben die neue
 * Software unterstützen soll.
 */
import type { Befund } from '../modell/ergebnisse'
import type { MediumStatus, Softwareart, Umfang } from '../modell/typen'
import type { PlId, PlMedium, PlMediumArt, PlProjekt, PlProzess, PlRolle } from '../prozessdatei/format'
import { aufgabenVon } from '../prozessdatei/struktur'

/**
 * U1: Standardstatus je System. Bei ERP wird das bisherige ERP abgelöst,
 * sonst angebunden; Tabellen werden immer abgelöst, Fachanwendungen
 * angebunden; E-Mail, Papier, Telefon und Sonstiges bleiben unberührt.
 */
export function standardStatus(art: PlMediumArt, softwareart: Softwareart): MediumStatus {
  switch (art) {
    case 'erp':
      return softwareart === 'erp' ? 'abloesen' : 'anbinden'
    case 'tabelle':
      return 'abloesen'
    case 'fachanwendung':
      return 'anbinden'
    default:
      return 'unberuehrt'
  }
}

/** Systeme aus Ist und Soll, je Kennung einmal (Grundlage zuerst). */
export function alleMedien(projekt: PlProjekt, grundlage: 'ist' | 'soll'): PlMedium[] {
  const prozesse = grundlage === 'soll' && projekt.soll ? [projekt.soll, projekt.ist] : [projekt.ist, ...(projekt.soll ? [projekt.soll] : [])]
  const gesehen = new Set<PlId>()
  const liste: PlMedium[] = []
  for (const p of prozesse) {
    for (const m of p.medien) {
      if (gesehen.has(m.id)) continue
      gesehen.add(m.id)
      liste.push(m)
    }
  }
  return liste
}

/** Umfang direkt nach dem Einlesen: Grundlage Soll, wenn vorhanden; Status nach U1. */
export function standardUmfang(projekt: PlProjekt, softwareart: Softwareart): Umfang {
  const grundlage = projekt.soll ? 'soll' : 'ist'
  return {
    grundlage,
    medien: Object.fromEntries(alleMedien(projekt, grundlage).map((m) => [m.id, standardStatus(m.art, softwareart)])),
    aufgabenAus: [],
    aufgabenEin: [],
  }
}

/** Status eines Systems: gewählt im Umfang, sonst Standard nach U1. */
export function statusVon(umfang: Umfang, medium: PlMedium, softwareart: Softwareart): MediumStatus {
  return Object.hasOwn(umfang.medien, medium.id) ? umfang.medien[medium.id] : standardStatus(medium.art, softwareart)
}

/** Ist der Status ein Vorschlag (nach U1) oder vom Benutzer abweichend gewählt? */
export function istStandardStatus(umfang: Umfang, medium: PlMedium, softwareart: Softwareart): boolean {
  return statusVon(umfang, medium, softwareart) === standardStatus(medium.art, softwareart)
}

export interface AufgabenUmfang {
  /** Aufgaben im Umfang in Prozessreihenfolge (U2) */
  imUmfang: PlId[]
  befunde: Befund[]
}

/**
 * U2: Eine Aufgabe ist im Umfang, wenn ihr System „ablösen“ hat und sie nicht
 * ausgeschlossen ist, oder wenn sie ausdrücklich eingeschlossen ist. Aufgaben
 * ohne System sind nicht im Umfang und erzeugen einen Hinweis.
 */
export function aufgabenImUmfang(p: PlProzess, umfang: Umfang, softwareart: Softwareart): AufgabenUmfang {
  const medien = new Map(p.medien.map((m) => [m.id, m]))
  const imUmfang: PlId[] = []
  const befunde: Befund[] = []
  for (const a of aufgabenVon(p)) {
    if (umfang.aufgabenEin.includes(a.id)) {
      imUmfang.push(a.id)
      continue
    }
    const medium = a.mediumId === null ? undefined : medien.get(a.mediumId)
    if (!medium) {
      befunde.push({ schwere: 'hinweis', code: 'U2', text: `Die Aufgabe „${a.name}“ hat kein System und ist deshalb nicht im Umfang. Bei Bedarf einschließen.`, bezug: a.id })
      continue
    }
    if (statusVon(umfang, medium, softwareart) === 'abloesen' && !umfang.aufgabenAus.includes(a.id)) imUmfang.push(a.id)
  }
  return { imUmfang, befunde }
}

/** U3: Rollen der Aufgaben im Umfang, in der Reihenfolge der Rollenliste. */
export function rollenImUmfang(p: PlProzess, imUmfang: readonly PlId[]): PlRolle[] {
  const menge = new Set(imUmfang)
  const ids = new Set(aufgabenVon(p).filter((a) => menge.has(a.id) && a.rolleId !== null).map((a) => a.rolleId))
  return p.rollen.filter((r) => ids.has(r.id))
}
