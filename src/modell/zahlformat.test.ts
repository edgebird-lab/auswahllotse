import { describe, expect, it } from 'vitest'
import { euro, fest, genau, nutzwert, normalisiereLeerraum, prozent, proTag, zahl } from './zahlformat'

const ohneNbsp = (t: string) => normalisiereLeerraum(t)

describe('Zahlen in der Anzeige', () => {
  it('rundet kaufmännisch auch dort, wo der Rechner knapp unter dem Halbwert landet', () => {
    // 35 % · 3 / 12 Punkte = 8,75 %; im Rechner 0,08749999999999998
    expect(0.35 * 3 / 12).toBeLessThan(0.0875)
    expect(prozent((0.35 * 3) / 12)).toBe('8,8')
    // 0,285 · 100 ergibt 28,499999999999996, gemeint ist 28,5
    expect(fest(0.285 * 100, 0)).toBe('29')
    // 14,5 Ausführungen pro Tag als 0,145 · 100 = 14,499999999999998
    expect(proTag(0.145 * 100)).toBe('15')
    expect(fest(2.675, 2)).toBe('2,68')
    expect(nutzwert(1.005)).toBe('1,01')
    expect(zahl(0.1 + 0.2, 2)).toBe('0,3')
  })

  it('zeigt nie ein Minus vor einer gerundeten Null', () => {
    expect(fest(-0.04, 1)).toBe('0,0')
    expect(zahl(-0, 2)).toBe('0')
    expect(ohneNbsp(euro(-0.4))).toBe('0 €')
    expect(fest(-1.25, 1)).toBe('-1,3')
    expect(genau(-0)).toBe(0)
  })

  it('lässt gewöhnliche Werte unverändert', () => {
    expect(ohneNbsp(euro(39140))).toBe('39.140 €')
    expect(ohneNbsp(euro(54517.49))).toBe('54.517 €')
    expect(nutzwert(7.3)).toBe('7,30')
    expect(prozent(0.516129)).toBe('51,6')
    expect(proTag(6.72)).toBe('6,7')
    expect(proTag(237.12)).toBe('237')
    expect(genau(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(genau(Number.NaN))).toBe(true)
  })
})
