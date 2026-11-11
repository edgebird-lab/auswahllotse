/**
 * Medienbrüche und Schnittstellen (Spezifikation 6.4, Regeln U4 und U5, sowie
 * M6 aus 6.3). Ein Medienbruch ist ein Paar (Quelle der Übertragung, System
 * der Aufgabe); sein Fall richtet sich nach dem Status beider Systeme.
 */
import type { Befund } from '../modell/ergebnisse'
import type { Medienbruch, MedienbruchFall } from '../modell/ergebnisse'
import type { MediumStatus, Softwareart, Umfang } from '../modell/typen'
import { istDigital, type PlAufgabe, type PlId, type PlMedium, type PlProjekt, type PlProzess } from '../prozessdatei/format'
import { berechneHaeufigkeiten } from '../prozessdatei/haeufigkeit'
import { aufgabenVon, mediumVon, rolleVon } from '../prozessdatei/struktur'
import { statusVon } from './umfang'

/** Seite eines Medienbruchs: Status und ob das System digitale Daten liefert. */
interface Seite {
  status: MediumStatus
  digital: boolean
}

/** U4: Fall eines Paars. Eine fehlende Quelle gilt als „unberührt, nicht digital“. */
export function medienbruchFall(quelle: Seite | null, ziel: Seite): MedienbruchFall {
  const q = quelle ?? { status: 'unberuehrt', digital: false }
  const qa = q.status === 'abloesen'
  const za = ziel.status === 'abloesen'
  if (qa && za) return 'A'
  if (!qa && !za) return 'E'
  const anderes = qa ? ziel : q
  if (anderes.status === 'anbinden') return 'B'
  return anderes.digital ? 'D' : 'C'
}

/** Eine Übertragung mit den Werten des Prozesses, aus dem sie stammt (U5). */
interface Uebertragung {
  aufgabe: PlAufgabe
  prozess: PlProzess
  haeufigkeit: number
}

function uebertragungen(projekt: PlProjekt, grundlage: 'ist' | 'soll'): Uebertragung[] {
  const mitUebertragung = (p: PlProzess): Uebertragung[] => {
    const h = berechneHaeufigkeiten(p).haeufigkeit
    return aufgabenVon(p)
      .filter((a) => a.uebertragung !== null)
      .map((a) => ({ aufgabe: a, prozess: p, haeufigkeit: h.get(a.id) ?? 0 }))
  }
  if (grundlage !== 'soll' || !projekt.soll) return mitUebertragung(projekt.ist)
  // U5: Soll und Ist, je Aufgabe einmal; Werte aus dem Soll, wenn die Aufgabe dort noch überträgt.
  const soll = mitUebertragung(projekt.soll)
  const imSoll = new Set(soll.map((u) => u.aufgabe.id))
  return [...soll, ...mitUebertragung(projekt.ist).filter((u) => !imSoll.has(u.aufgabe.id))]
}

export interface MedienbruchAuswertung {
  /** nach Minuten pro Tag absteigend (A12) */
  medienbrueche: Medienbruch[]
  befunde: Befund[]
}

/** M6: Medienbrüche je Paar mit Übertragungen, Minuten und Euro pro Tag. */
export function ermittleMedienbrueche(projekt: PlProjekt, umfang: Umfang, softwareart: Softwareart): MedienbruchAuswertung {
  const seite = (m: PlMedium): Seite => ({ status: statusVon(umfang, m, softwareart), digital: istDigital(m.art) })
  const paare = new Map<string, Medienbruch>()
  const befunde: Befund[] = []
  for (const { aufgabe, prozess, haeufigkeit } of uebertragungen(projekt, umfang.grundlage)) {
    const ziel = mediumVon(prozess, aufgabe.mediumId)
    if (!ziel) {
      befunde.push({ schwere: 'hinweis', code: 'U4', text: `Die Aufgabe „${aufgabe.name}“ überträgt Daten, hat aber kein System; dieser Medienbruch wird nicht ausgewertet.`, bezug: aufgabe.id })
      continue
    }
    const quelleId = aufgabe.uebertragung!.quelleMediumId
    const quelle = mediumVon(prozess, quelleId) ?? null
    const schluessel = `${quelle?.id ?? 'ohne'}>${ziel.id}`
    const mb = paare.get(schluessel) ?? {
      quelleId: quelle?.id ?? null,
      zielId: ziel.id,
      fall: medienbruchFall(quelle ? seite(quelle) : null, seite(ziel)),
      aufgaben: [],
      uebertragungenProTag: 0,
      minutenProTag: 0,
      euroProTag: 0,
    }
    const v = prozess.vorgaengeProTag
    const minuten = aufgabe.uebertragung!.minuten
    const stundensatz = rolleVon(prozess, aufgabe.rolleId)?.stundensatz ?? 0
    if (!mb.aufgaben.includes(aufgabe.id)) mb.aufgaben.push(aufgabe.id)
    mb.uebertragungenProTag += haeufigkeit * v
    mb.minutenProTag += haeufigkeit * minuten * v
    mb.euroProTag += ((haeufigkeit * minuten) / 60) * stundensatz * v
    paare.set(schluessel, mb)
  }
  // stabil sortiert: bei gleichen Minuten bleibt die Reihenfolge des Auftretens
  const medienbrueche = [...paare.values()].sort((a, b) => b.minutenProTag - a.minutenProTag)
  return { medienbrueche, befunde }
}

/** Kennung eines Medienbruchs nach A0 (ohne Präfix). */
export function medienbruchSchluessel(mb: Pick<Medienbruch, 'quelleId' | 'zielId'>): string {
  return `${mb.quelleId ?? 'ohne'}>${mb.zielId}`
}

/** Medium eines Projekts aus Ist oder Soll (für Namen und Art). */
export function findeMedium(projekt: PlProjekt, id: PlId | null, grundlage: 'ist' | 'soll'): PlMedium | undefined {
  const reihenfolge = grundlage === 'soll' && projekt.soll ? [projekt.soll, projekt.ist] : [projekt.ist, projekt.soll]
  for (const p of reihenfolge) {
    const m = p ? mediumVon(p, id) : undefined
    if (m) return m
  }
  return undefined
}
