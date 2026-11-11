import { describe, expect, it } from 'vitest'
import type { Stabilitaet } from '../modell/ergebnisse'
import type { AuswahlProjekt } from '../modell/typen'
import { normalisiereLeerraum } from '../modell/zahlformat'
import { abcKosten, abcProjekt } from '../testhilfen/abc'
import { werteAus } from './auswertung'
import { stabilitaetText } from './sensitivitaet'

function erwarte(s: Stabilitaet | undefined, von: number, bis: number, abstand: number | null, knapp: boolean) {
  expect(s).toBeDefined()
  expect(s!.von).toBeCloseTo(von, 6)
  expect(s!.bis).toBeCloseTo(bis, 6)
  if (abstand === null) expect(s!.abstand).toBeNull()
  else expect(s!.abstand).toBeCloseTo(abstand, 6)
  expect(s!.knapp).toBe(knapp)
}

const stabil = (p: AuswahlProjekt) => {
  const w = werteAus(p, abcKosten())
  return { w, nach: (g: string) => w.stabilitaet.find((s) => s.gruppe === g) }
}

describe('Sensitivität der Gewichte (S1 bis S6)', () => {
  it('findet die stabilen Bereiche bei der Regel Nutzwert (T-S1)', () => {
    const { w, nach } = stabil(abcProjekt())
    expect(w.empfehlungId).toBe('angebot-a')
    erwarte(nach('funktion'), 0, 0.516129, 0.016129, true)
    erwarte(nach('betrieb'), 0.263158, 1, 0.036842, true)
    erwarte(nach('anbieter'), 0.183673, 1, 0.016327, true)
    expect(normalisiereLeerraum(stabilitaetText(nach('funktion')!))).toBe('Funktionen: 0,0 bis 51,6 %, heute 50,0 % (knapp)')
  })

  it('findet die stabilen Bereiche bei der Regel Preis-Leistung (T-S2)', () => {
    const p = abcProjekt()
    p.entscheidung.regel = 'preis_leistung'
    const { w, nach } = stabil(p)
    expect(w.empfehlungId).toBe('angebot-b')
    erwarte(nach('funktion'), 0.266561, 1, 0.233439, false)
    erwarte(nach('betrieb'), 0, 0.757405, 0.457405, false)
    erwarte(nach('anbieter'), 0, 0.461509, 0.261509, false)
  })

  it('rechnet nicht mit nur einem gültigen Angebot (T-S3)', () => {
    const p = abcProjekt()
    p.angebote = p.angebote.map((a) => (a.id === 'angebot-b' ? { ...a, bewertungen: { ...a.bewertungen, 'eigene:f-03': { ...a.bewertungen['eigene:f-03'], ko: 'nicht_erfuellt' } } } : a))
    const { w } = stabil(p)
    expect(w.empfehlungId).toBe('angebot-a')
    expect(w.stabilitaet).toEqual([])
    expect(w.befunde.find((b) => b.code === 'S1')?.text).toBe('Sensitivität: Es braucht mindestens zwei vergleichbare Angebote.')
  })

  it('rechnet nicht mit nur einem Hauptkriterium (T-S4)', () => {
    const p = abcProjekt()
    p.anforderungen = p.anforderungen.map((a) => (a.gruppe === 'funktion' ? a : { ...a, status: 'verworfen' as const }))
    const { w } = stabil(p)
    expect(w.gewichte).toEqual({ funktion: 1 })
    expect(w.stabilitaet).toEqual([])
    expect(w.befunde.find((b) => b.code === 'S1')?.text).toBe('Sensitivität: Es gibt nur ein Hauptkriterium; sein Gewicht ist immer 100 %.')
  })

  it('rechnet nicht bei Gleichstand an der Spitze und empfiehlt das günstigere Angebot (T-S5)', () => {
    const p = abcProjekt()
    const a = p.angebote[0]
    p.angebote = p.angebote.map((x) => (x.id === 'angebot-b' ? { ...x, bewertungen: structuredClone(a.bewertungen) } : x))
    const { w } = stabil(p)
    expect(w.ergebnisse.map((r) => r.rang)).toEqual([1, 1, null])
    expect(w.empfehlungId).toBe('angebot-b')
    expect(w.stabilitaet).toEqual([])
    expect(w.befunde.find((b) => b.code === 'S6')?.text).toBe('Gleichstand an der Spitze; empfohlen ist das günstigere Angebot.')
  })

  it('meldet keinen Abstand, wenn die Empfehlung über den ganzen Bereich hält', () => {
    const p = abcProjekt()
    // B überall schlechter als A
    p.angebote = p.angebote.map((x) =>
      x.id === 'angebot-b'
        ? { ...x, bewertungen: { ...x.bewertungen, 'eigene:f-01': { ...x.bewertungen['eigene:f-01'], punkte: 1 }, 'eigene:f-02': { ...x.bewertungen['eigene:f-02'], punkte: 1 } } }
        : x,
    )
    const { nach } = stabil(p)
    erwarte(nach('funktion'), 0, 1, null, false)
  })
})
