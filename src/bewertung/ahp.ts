/**
 * Paarvergleich nach dem Analytic Hierarchy Process (Spezifikation 6.8,
 * Regeln AHP1 bis AHP6): Saaty-Skala 1 bis 9, Gewichte als Eigenvektor zum
 * größten Eigenwert (Potenzmethode), Konsistenz über CI und CR.
 */
import type { AhpErgebnis } from '../modell/ergebnisse'
import type { Gruppe, Paarurteil } from '../modell/typen'
import { AHP_MAX_SCHRITTE, AHP_TOLERANZ, CR_GRENZE, RI } from '../regeln/schwellen'

export type Matrix = number[][]

/** AHP1: Matrix mit a_ii = 1 und a_ji = 1 / a_ij. Urteile außerhalb der Kriterien werden übergangen; bei doppelten gilt das letzte. */
export function ahpMatrix(kriterien: readonly Gruppe[], paare: readonly Paarurteil[]): Matrix {
  const n = kriterien.length
  const a: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : Number.NaN)))
  for (const p of paare) {
    const i = kriterien.indexOf(p.a)
    const j = kriterien.indexOf(p.b)
    if (i < 0 || j < 0 || i === j) continue
    // Stärke s: das wichtigere Kriterium ist s-mal so wichtig
    const wert = p.wichtiger === 'a' ? p.staerke : 1 / p.staerke
    a[i][j] = wert
    a[j][i] = 1 / wert
  }
  return a
}

/** Fehlende Urteile im Paarvergleich (G3): Zahl der Paare ohne Wert. */
export function fehlendeVergleiche(a: Matrix): number {
  let fehlend = 0
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (Number.isNaN(a[i][j])) fehlend += 1
  return fehlend
}

/** Matrix aus der oberen Hälfte (a_ij für i < j), z. B. für Tests nach Spezifikation 9.1. */
export function ausObererHaelfte(n: number, oben: Record<string, number>): Matrix {
  const a: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : Number.NaN)))
  for (const [schluessel, wert] of Object.entries(oben)) {
    const [i, j] = schluessel.split('').map((z) => Number(z) - 1)
    a[i][j] = wert
    a[j][i] = 1 / wert
  }
  return a
}

function mal(a: Matrix, w: readonly number[]): number[] {
  return a.map((zeile) => zeile.reduce((s, x, j) => s + x * w[j], 0))
}

/** AHP2 und AHP3: Eigenvektor per Potenzmethode und λmax. */
export function eigenvektor(a: Matrix): { gewichte: number[]; lambdaMax: number; schritte: number } {
  const n = a.length
  let w = Array<number>(n).fill(1 / n)
  let schritte = 0
  while (schritte < AHP_MAX_SCHRITTE) {
    schritte += 1
    const aw = mal(a, w)
    const summe = aw.reduce((s, x) => s + x, 0)
    const neu = aw.map((x) => x / summe)
    const aenderung = Math.max(...neu.map((x, i) => Math.abs(x - w[i])))
    w = neu
    if (aenderung <= AHP_TOLERANZ) break
  }
  const aw = mal(a, w)
  const lambdaMax = aw.reduce((s, x, i) => s + x / w[i], 0) / n
  return { gewichte: w, lambdaMax, schritte }
}

/** AHP1 bis AHP6 für eine vollständige Matrix. */
export function berechneAhp(a: Matrix): AhpErgebnis {
  const n = a.length
  if (n === 0) return { gewichte: [], lambdaMax: 0, ci: 0, cr: 0, stimmig: true, widerspruch: null }
  const { gewichte, lambdaMax } = eigenvektor(a)
  // AHP4: für n ≤ 2 ist jede Matrix konsistent
  const ci = n >= 3 ? (lambdaMax - n) / (n - 1) : 0
  const cr = n >= 3 ? ci / (RI[n] ?? RI[10]) : 0
  const stimmig = cr <= CR_GRENZE
  return { gewichte, lambdaMax, ci, cr, stimmig, widerspruch: stimmig ? null : widerspruechlichstes(a, gewichte) }
}

/** AHP6: Paar mit der größten Abweichung |ln(a_ij · w_j / w_i)|; bei Gleichstand das erste in Matrixreihenfolge. */
export function widerspruechlichstes(a: Matrix, w: readonly number[]): [number, number] | null {
  let best: [number, number] | null = null
  let groesste = -1
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      const abweichung = Math.abs(Math.log((a[i][j] * w[j]) / w[i]))
      if (abweichung > groesste + 1e-12) {
        groesste = abweichung
        best = [i, j]
      }
    }
  }
  return best
}
