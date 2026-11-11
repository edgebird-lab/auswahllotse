import { describe, expect, it } from 'vitest'
import { werteAus } from '../../bewertung/auswertung'
import { GRUPPEN_REIHENFOLGE } from '../../modell/typen'
import { abcProjekt } from '../../testhilfen/abc'
import { achsenSchritt, balkenWeg, nutzwertBei, serienVon } from './geometrie'

describe('Rechnungen der Diagramme', () => {
  it('wählt runde Achsenschritte', () => {
    expect(achsenSchritt(93088)).toBe(50000)
    expect(achsenSchritt(10)).toBe(5)
    expect(achsenSchritt(12000, 2)).toBe(10000)
    expect(achsenSchritt(0)).toBe(1)
  })

  it('vergibt höchstens acht Farben und fasst den Rest zusammen', () => {
    expect(serienVon(['funktion', 'betrieb']).map((s) => s.farbe)).toEqual(['var(--serie-1)', 'var(--serie-2)'])
    const alle = serienVon(GRUPPEN_REIHENFOLGE)
    expect(alle).toHaveLength(8)
    expect(alle[7]).toMatchObject({ gruppen: ['barrierefreiheit', 'anbieter'], farbe: 'var(--serie-uebrig)' })
    expect(alle[7].name).toBe('übrige Gruppen (Barrierefreiheit, Anbieter und Einführung)')
  })

  it('zeichnet Balken mit runder Datenseite und gerader Grundlinie', () => {
    expect(balkenWeg(0, 100, 0, 20)).toBe('M0,0 H96 Q100,0 100,4 V16 Q100,20 96,20 H0 Z')
    // sehr kurze Balken: Radius höchstens die halbe Länge
    expect(balkenWeg(0, 2, 0, 20)).toBe('M0,0 H1 Q2,0 2,1 V19 Q2,20 1,20 H0 Z')
  })

  it('rechnet den Nutzwert bei verändertem Gewicht wie die Sensitivität (S2)', () => {
    const w = werteAus(abcProjekt())
    const a = w.ergebnisse[0]
    // heute: Gewicht 0,5 → Nutzwert 7,3
    expect(nutzwertBei(a, 'funktion', 0.5, 0.5)).toBeCloseTo(7.3, 9)
    // Grenze aus T-S1: bei 51,6 % liegen A und B gleichauf
    const b = w.ergebnisse[1]
    const x = 0.516129
    expect(nutzwertBei(a, 'funktion', 0.5, x)).toBeCloseTo(nutzwertBei(b, 'funktion', 0.5, x), 5)
  })
})
