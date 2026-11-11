/**
 * Hilfen zum Durchlaufen eines Prozessbaums in Prozessreihenfolge
 * (Tiefensuche: Hauptfolge, Ausgänge und Zweige der Reihe nach, Regel A12).
 */
import type { PlAufgabe, PlBlock, PlId, PlMedium, PlProjekt, PlProzess, PlRolle, PlSequenz } from './format'

export interface Fundstelle {
  block: PlBlock
  /** Folge, in der der Baustein steht */
  folge: PlSequenz
  index: number
  /** Verschachtelungstiefe, Hauptfolge = 0 */
  ebene: number
}

/** Alle Bausteine in Tiefensuche, jeweils vor ihren Kindern. */
export function* durchlaufe(seq: PlSequenz, ebene = 0): Generator<Fundstelle> {
  for (let index = 0; index < seq.schritte.length; index++) {
    const block = seq.schritte[index]
    yield { block, folge: seq, index, ebene }
    switch (block.typ) {
      case 'entscheidung':
      case 'oder':
      case 'parallel':
        for (const z of block.zweige) yield* durchlaufe(z, ebene + 1)
        break
      case 'wiederholung':
        yield* durchlaufe(block.koerper, ebene + 1)
        break
      default:
        break
    }
  }
}

/** Aufgaben in Prozessreihenfolge. */
export function aufgabenVon(p: PlProzess): PlAufgabe[] {
  const liste: PlAufgabe[] = []
  for (const { block } of durchlaufe(p.ablauf)) if (block.typ === 'aufgabe') liste.push(block)
  return liste
}

/** Prozess, auf dem das Lastenheft aufbaut: Soll, wenn gewählt und vorhanden, sonst Ist. */
export function grundlageVon(projekt: PlProjekt, grundlage: 'ist' | 'soll'): PlProzess {
  return grundlage === 'soll' && projekt.soll ? projekt.soll : projekt.ist
}

export function rolleVon(p: PlProzess, id: PlId | null): PlRolle | undefined {
  return id === null ? undefined : p.rollen.find((r) => r.id === id)
}

export function mediumVon(p: PlProzess, id: PlId | null): PlMedium | undefined {
  return id === null ? undefined : p.medien.find((m) => m.id === id)
}
