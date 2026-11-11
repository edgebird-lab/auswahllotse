import { describe, expect, it } from 'vitest'
import { RI } from '../regeln/schwellen'
import { ahpMatrix, ausObererHaelfte, berechneAhp, eigenvektor, fehlendeVergleiche, type Matrix } from './ahp'

function erwarteGewichte(ist: number[], soll: number[]) {
  expect(ist).toHaveLength(soll.length)
  ist.forEach((w, i) => expect(w, `w${i + 1}`).toBeCloseTo(soll[i], 6))
}

describe('Paarvergleich nach AHP (AHP1 bis AHP6)', () => {
  it('rechnet eine konsistente Matrix (T-AHP1)', () => {
    const e = berechneAhp(ausObererHaelfte(3, { 12: 2, 13: 4, 23: 2 }))
    erwarteGewichte(e.gewichte, [4 / 7, 2 / 7, 1 / 7])
    erwarteGewichte(e.gewichte, [0.571429, 0.285714, 0.142857])
    expect(e.lambdaMax).toBeCloseTo(3, 9)
    expect(e.cr).toBeCloseTo(0, 9)
    expect(e.stimmig).toBe(true)
    expect(e.widerspruch).toBeNull()
  })

  it('rechnet eine leicht inkonsistente Matrix (T-AHP2)', () => {
    const e = berechneAhp(ausObererHaelfte(3, { 12: 3, 13: 5, 23: 3 }))
    erwarteGewichte(e.gewichte, [0.636986, 0.258285, 0.104729])
    expect(e.lambdaMax).toBeCloseTo(3.038511, 6)
    expect(e.cr).toBeCloseTo(0.033199, 6)
    expect(e.stimmig).toBe(true)
  })

  it('erkennt widersprüchliche Urteile (T-AHP3)', () => {
    const e = berechneAhp(ausObererHaelfte(3, { 12: 9, 23: 9, 13: 1 / 9 }))
    erwarteGewichte(e.gewichte, [1 / 3, 1 / 3, 1 / 3])
    expect(e.cr).toBeCloseTo(6.130268, 6)
    expect(e.stimmig).toBe(false)
    expect(e.widerspruch).toEqual([0, 1])
  })

  it('nutzt den Eigenvektor, nicht das geometrische Mittel (T-AHP4)', () => {
    const e = berechneAhp(ausObererHaelfte(4, { 12: 3, 13: 5, 14: 7, 23: 3, 24: 5, 34: 3 }))
    erwarteGewichte(e.gewichte, [0.565009, 0.262201, 0.117504, 0.055285])
    expect(e.cr).toBeCloseTo(0.043327, 6)
    // geometrisches Mittel wäre (0,563813; 0,263378; 0,117786; 0,055022)
    expect(Math.abs(e.gewichte[0] - 0.563813)).toBeGreaterThan(1e-3)
  })

  it('nennt das widersprüchlichste Urteil und rechnet n = 2 (T-AHP5)', () => {
    const e = berechneAhp(ausObererHaelfte(4, { 12: 2, 13: 1 / 2, 14: 4, 23: 3, 24: 1 / 2, 34: 5 }))
    expect(e.cr).toBeCloseTo(0.534758, 6)
    expect(e.stimmig).toBe(false)
    expect(e.widerspruch).toEqual([1, 2])
    const zwei = berechneAhp(ausObererHaelfte(2, { 12: 3 }))
    erwarteGewichte(zwei.gewichte, [0.75, 0.25])
    expect(zwei.cr).toBe(0)
    expect(zwei.stimmig).toBe(true)
    expect(berechneAhp([[1]]).gewichte).toEqual([1])
  })

  it('baut die Matrix aus Urteilen über Gruppen (AHP1)', () => {
    const a = ahpMatrix(
      ['funktion', 'betrieb', 'anbieter'],
      [
        { a: 'funktion', b: 'betrieb', wichtiger: 'a', staerke: 3 },
        { a: 'anbieter', b: 'funktion', wichtiger: 'b', staerke: 5 },
        { a: 'betrieb', b: 'anbieter', wichtiger: 'a', staerke: 1 },
        { a: 'menge', b: 'funktion', wichtiger: 'a', staerke: 9 },
      ],
    )
    expect(a).toEqual([
      [1, 3, 5],
      [1 / 3, 1, 1],
      [1 / 5, 1, 1],
    ])
    expect(fehlendeVergleiche(a)).toBe(0)
    expect(fehlendeVergleiche(ahpMatrix(['funktion', 'betrieb', 'anbieter'], []))).toBe(3)
  })

  it('bestätigt die RI-Tabelle per Simulation (T-AHP6)', () => {
    const start = performance.now()
    const zufall = mulberry32(20261111)
    const werte = [1 / 9, 1 / 8, 1 / 7, 1 / 6, 1 / 5, 1 / 4, 1 / 3, 1 / 2, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const abweichung: Record<number, number> = {}
    for (let n = 3; n <= 10; n++) {
      let summe = 0
      for (let k = 0; k < 5000; k++) {
        const a: Matrix = Array.from({ length: n }, () => Array<number>(n).fill(1))
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const x = werte[Math.floor(zufall() * werte.length)]
            a[i][j] = x
            a[j][i] = 1 / x
          }
        }
        summe += (eigenvektor(a).lambdaMax - n) / (n - 1)
      }
      abweichung[n] = Math.abs(summe / 5000 - RI[n])
    }
    const dauer = performance.now() - start
    expect(abweichung[3]).toBeLessThanOrEqual(0.08)
    for (let n = 4; n <= 10; n++) expect(abweichung[n], `n = ${n}`).toBeLessThanOrEqual(0.05)
    expect(dauer).toBeLessThan(2000)
  })
})

/** Kleiner Zufallsgenerator mit festem Startwert (Mulberry32), damit der Test immer gleich rechnet. */
function mulberry32(startwert: number): () => number {
  let a = startwert >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
