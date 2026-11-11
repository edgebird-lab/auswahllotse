/**
 * Hauptkriterien und Gewichte (Spezifikation 6.8, Regeln G1 bis G4).
 *
 * Hauptkriterien sind die Gruppen mit mindestens einer aktiven Soll- oder
 * Kann-Anforderung. Ihr Gewicht W_g kommt direkt aus Prozent oder aus dem
 * Paarvergleich (ahp.ts). Innerhalb einer Gruppe verteilen die Punkte v_i
 * das Gewicht: global = W_g · v_i / Σ v.
 */
import type { AhpErgebnis, Befund } from '../modell/ergebnisse'
import { fest, prozent } from '../modell/zahlformat'
import { GRUPPEN_REIHENFOLGE, gruppenName, type Anforderung, type Gewichtung, type Gruppe } from '../modell/typen'
import { ahpMatrix, berechneAhp, fehlendeVergleiche } from './ahp'

/** Soll- und Kann-Anforderungen tragen den Nutzwert; Muss wirkt nur als K.-o. */
export const istBewertet = (a: Anforderung) => a.status === 'aktiv' && (a.prioritaet === 'soll' || a.prioritaet === 'kann')
export const istKo = (a: Anforderung) => a.status === 'aktiv' && a.prioritaet === 'muss'

export interface Kriterien {
  /** G1: Gruppen mit mindestens einer aktiven Soll- oder Kann-Anforderung, feste Reihenfolge */
  haupt: Gruppe[]
  /** Gruppen mit aktiven Muss-Anforderungen, aber ohne Soll und Kann: „wirkt nur als K.-o.“ */
  nurKo: Gruppe[]
}

export function hauptkriterien(anforderungen: readonly Anforderung[]): Kriterien {
  const haupt = GRUPPEN_REIHENFOLGE.filter((g) => anforderungen.some((a) => a.gruppe === g && istBewertet(a)))
  const nurKo = GRUPPEN_REIHENFOLGE.filter((g) => !haupt.includes(g) && anforderungen.some((a) => a.gruppe === g && istKo(a)))
  return { haupt, nurKo }
}

/**
 * Verfahren des größten Rests: Anteile auf ganze Zahlen mit fester Summe
 * runden. Reste absteigend; bei Gleichstand bekommt die frühere Stelle zuerst.
 */
export function groessterRest(anteile: readonly number[], summe = 100): number[] {
  const gesamt = anteile.reduce((s, x) => s + x, 0)
  if (anteile.length === 0) return []
  const genau = gesamt > 0 ? anteile.map((x) => (x / gesamt) * summe) : anteile.map(() => summe / anteile.length)
  const ganz = genau.map((x) => Math.floor(x + 1e-9))
  let rest = summe - ganz.reduce((s, x) => s + x, 0)
  const reihenfolge = genau.map((x, i) => ({ i, r: x - ganz[i] })).sort((a, b) => b.r - a.r || a.i - b.i)
  for (const { i } of reihenfolge) {
    if (rest <= 0) break
    ganz[i] += 1
    rest -= 1
  }
  return ganz
}

/** „Gleich verteilen“ (G2): 100 durch die Zahl der Gruppen, nach dem größten Rest. */
export function gleichVerteilen(haupt: readonly Gruppe[]): Partial<Record<Gruppe, number>> {
  const werte = groessterRest(haupt.map(() => 1))
  return Object.fromEntries(haupt.map((g, i) => [g, werte[i]]))
}

/** „Auf 100 % bringen“ (G2): Eingaben proportional skalieren; ohne Eingaben gleich verteilen. */
export function aufHundertBringen(direkt: Partial<Record<Gruppe, number>>, haupt: readonly Gruppe[]): Partial<Record<Gruppe, number>> {
  const werte = groessterRest(haupt.map((g) => Math.max(0, direkt[g] ?? 0)))
  return Object.fromEntries(haupt.map((g, i) => [g, werte[i]]))
}

export interface GewichtsErgebnis {
  /** W_g je Hauptkriterium (0 bis 1, Summe 1), leer bei Fehlern */
  gewichte: Partial<Record<Gruppe, number>>
  ahp: AhpErgebnis | null
  befunde: Befund[]
}

/** Text der Konsistenzwarnung (AHP6). */
export function widerspruchText(cr: number, x: Gruppe, y: Gruppe): string {
  return `Die Vergleiche widersprechen sich (CR ${fest(cr, 2)}). Prüfen Sie „${gruppenName(x)}“ gegen „${gruppenName(y)}“.`
}

/** G2 und G3: Gewichte der Hauptkriterien aus der gewählten Methode. */
export function berechneGewichte(gewichtung: Gewichtung, haupt: readonly Gruppe[]): GewichtsErgebnis {
  const befunde: Befund[] = []
  if (haupt.length === 0) {
    return { gewichte: {}, ahp: null, befunde: [{ schwere: 'fehler', code: 'G1', text: 'Es gibt kein Hauptkriterium: Keine Gruppe hat eine aktive Soll- oder Kann-Anforderung.', bezug: null }] }
  }
  // Ein einziges Hauptkriterium trägt das ganze Gewicht, ohne Eingabe.
  if (haupt.length === 1) return { gewichte: { [haupt[0]]: 1 }, ahp: null, befunde }

  if (gewichtung.methode === 'direkt') {
    const werte = haupt.map((g) => gewichtung.direktProzent[g] ?? 0)
    if (werte.some((x) => !Number.isInteger(x) || x < 0)) {
      befunde.push({ schwere: 'fehler', code: 'G2', text: 'Gewichte müssen ganze Prozent ab 0 sein.', bezug: null })
      return { gewichte: {}, ahp: null, befunde }
    }
    const summe = werte.reduce((s, x) => s + x, 0)
    if (summe !== 100) {
      befunde.push({ schwere: 'fehler', code: 'G2', text: `Summe ist ${summe} %`, bezug: null })
      return { gewichte: {}, ahp: null, befunde }
    }
    return { gewichte: Object.fromEntries(haupt.map((g, i) => [g, werte[i] / 100])), ahp: null, befunde }
  }

  const matrix = ahpMatrix(haupt, gewichtung.paare)
  const fehlend = fehlendeVergleiche(matrix)
  if (fehlend > 0) {
    befunde.push({ schwere: 'fehler', code: 'G3', text: fehlend === 1 ? '1 Vergleich fehlt' : `${fehlend} Vergleiche fehlen`, bezug: null })
    return { gewichte: {}, ahp: null, befunde }
  }
  const ahp = berechneAhp(matrix)
  if (!ahp.stimmig && ahp.widerspruch) {
    const [i, j] = ahp.widerspruch
    befunde.push({ schwere: 'warnung', code: 'AHP6', text: widerspruchText(ahp.cr, haupt[i], haupt[j]), bezug: null })
  }
  return { gewichte: Object.fromEntries(haupt.map((g, i) => [g, ahp.gewichte[i]])), ahp, befunde }
}

/** G4: globales Gewicht je Soll- und Kann-Anforderung; Gruppen mit Punktesumme 0 sind ein Fehler. */
export function globaleGewichte(anforderungen: readonly Anforderung[], gewichte: Partial<Record<Gruppe, number>>): { gewichte: Map<string, number>; befunde: Befund[] } {
  const ergebnis = new Map<string, number>()
  const befunde: Befund[] = []
  for (const [g, w] of Object.entries(gewichte) as [Gruppe, number][]) {
    const inGruppe = anforderungen.filter((a) => a.gruppe === g && istBewertet(a))
    const summe = inGruppe.reduce((s, a) => s + a.punkte, 0)
    if (summe === 0) {
      befunde.push({ schwere: 'fehler', code: 'G4', text: `„${gruppenName(g)}“: Die Punkte der Anforderungen ergeben 0; bitte mindestens einer Anforderung Punkte geben.`, bezug: `gruppe:${g}` })
      continue
    }
    for (const a of inGruppe) ergebnis.set(a.id, (w * a.punkte) / summe)
  }
  return { gewichte: ergebnis, befunde }
}

/** Gewicht als Text mit einer Nachkommastelle: „50,0 %“. */
export function gewichtText(w: number): string {
  return `${prozent(w)} %`
}
