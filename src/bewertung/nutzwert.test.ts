import { describe, expect, it } from 'vitest'
import { rangfolge } from '../entscheidung/regel'
import type { AngebotsErgebnis } from '../modell/ergebnisse'
import type { AuswahlProjekt } from '../modell/typen'
import { abcKosten, abcProjekt } from '../testhilfen/abc'
import { werteAus } from './auswertung'
import { bewerteAngebote, KEINE_KOSTEN, kostenbasisVon } from './nutzwert'

const ergebnis = (p: AuswahlProjekt, id: string) => werteAus(p).ergebnisse.find((r) => r.angebotId === id)!

function mitBewertung(p: AuswahlProjekt, angebot: string, anforderung: string, werte: { ko?: 'erfuellt' | 'nicht_erfuellt' | 'offen' | null; punkte?: number | null }): AuswahlProjekt {
  return {
    ...p,
    angebote: p.angebote.map((a) => (a.id === angebot ? { ...a, bewertungen: { ...a.bewertungen, [anforderung]: { ...a.bewertungen[anforderung], ...werte } } } : a)),
  }
}

describe('Nutzwertanalyse mit K.-o.-Prüfung (N1 bis N7)', () => {
  it('rechnet Gruppenwerte und Nutzwerte des Beispiels ABC (T-N1)', () => {
    const a = ergebnis(abcProjekt(), 'angebot-a')
    expect(a.gruppenwerte.funktion).toBeCloseTo(7, 9)
    expect(a.gruppenwerte.betrieb).toBeCloseTo(6, 9)
    expect(a.gruppenwerte.anbieter).toBeCloseTo(10, 9)
    expect(a.nutzwert).toBeCloseTo(7.3, 9)
    expect(a).toMatchObject({ gueltig: true, ausschluss: [], koOffen: 0, fehlend: 0, kostenbasis: 39140 })
    const b = ergebnis(abcProjekt(), 'angebot-b')
    expect([b.gruppenwerte.funktion, b.gruppenwerte.betrieb, b.gruppenwerte.anbieter]).toEqual([10, 4, 5])
    expect(b.nutzwert).toBeCloseTo(7.2, 9)
    const c = ergebnis(abcProjekt(), 'angebot-c')
    expect(c).toMatchObject({ gueltig: false, ausschluss: ['Muss-Kriterium F-03 nicht erfüllt'], rang: null })
    expect(c.nutzwert).toBeCloseTo(10, 9)
  })

  it('empfiehlt nach der Regel Nutzwert A vor B (T-N2)', () => {
    const w = werteAus(abcProjekt())
    expect(w.ergebnisse.map((r) => [r.angebotId, r.rang])).toEqual([
      ['angebot-a', 1],
      ['angebot-b', 2],
      ['angebot-c', null],
    ])
    expect(w.empfehlungId).toBe('angebot-a')
    expect(w.vorlaeufig).toBe(false)
    expect(w.gewichte).toEqual({ funktion: 0.5, betrieb: 0.3, anbieter: 0.2 })
  })

  it('zählt fehlende Punkte als 0 und macht das Ergebnis vorläufig (T-N3)', () => {
    const p = mitBewertung(abcProjekt(), 'angebot-b', 'eigene:f-02', { punkte: null })
    const b = ergebnis(p, 'angebot-b')
    expect(b.gruppenwerte.funktion).toBeCloseTo(6.666667, 6)
    expect(b.nutzwert).toBeCloseTo(5.533333, 6)
    expect(b.fehlend).toBe(1)
    expect(werteAus(p).vorlaeufig).toBe(true)
  })

  it('lässt ein Angebot mit offenem K.-o.-Kriterium gültig, aber vorläufig (T-N4)', () => {
    for (const ko of ['offen', null] as const) {
      const p = mitBewertung(abcProjekt(), 'angebot-a', 'eigene:f-03', { ko })
      expect(ergebnis(p, 'angebot-a')).toMatchObject({ gueltig: true, koOffen: 1 })
      expect(werteAus(p).vorlaeufig).toBe(true)
    }
    // ein ungültiges Angebot macht nichts vorläufig
    const c = mitBewertung(abcProjekt(), 'angebot-c', 'eigene:f-01', { punkte: null })
    expect(werteAus(c).vorlaeufig).toBe(false)
  })

  it('gibt Angeboten mit weniger als 0,005 Punkten Abstand denselben Rang (T-N5)', () => {
    const basis = { gueltig: true, ausschluss: [], koOffen: 0, fehlend: 0, gruppenwerte: {}, kosten: KEINE_KOSTEN, euroJePunkt: 1, rang: null }
    const r = (id: string, nutzwert: number, kostenbasis: number): AngebotsErgebnis => ({ ...basis, angebotId: id, nutzwert, kostenbasis })
    const angebote = ['x', 'y', 'z'].map((id) => ({ ...abcProjekt().angebote[0], id, anbieter: `Anbieter ${id.toUpperCase()}` }))
    const f = rangfolge([r('y', 7.0, 30000), r('x', 7.004, 32000), r('z', 6.9, 10000)], angebote, 'nutzwert', 5)
    expect(f.ergebnisse.map((e) => [e.angebotId, e.rang])).toEqual([
      ['y', 1],
      ['x', 1],
      ['z', 3],
    ])
    expect(f.gleichstandSpitze).toBe(true)
    // gleichstehende alphabetisch, Empfehlung das günstigere (D1)
    expect(f.zulaessig).toEqual(['x', 'y', 'z'])
    expect(f.empfehlungId).toBe('y')
    expect(rangfolge([r('y', 7.0, 30000), r('x', 7.005, 32000)], angebote, 'nutzwert', 5).ergebnisse.map((e) => e.rang)).toEqual([2, 1])
  })

  it('schließt ein Angebot über dem Budget aus, wenn das Budget K.-o. ist (T-N6)', () => {
    const p = abcProjekt()
    p.wirtschaftlichkeit.budgetEuro = 35000
    p.wirtschaftlichkeit.budgetAlsKo = true
    const w = werteAus(p)
    expect(w.ergebnisse[0]).toMatchObject({ angebotId: 'angebot-a', gueltig: false, ausschluss: ['über Budget'], kostenbasis: 39140 })
    expect(w.empfehlungId).toBe('angebot-b')
    // ohne K.-o. nur ein Hinweis
    p.wirtschaftlichkeit.budgetAlsKo = false
    const hinweis = werteAus(p)
    expect(hinweis.empfehlungId).toBe('angebot-a')
    expect(hinweis.befunde.filter((b) => b.code === 'N2').map((b) => b.text.replace(/\s/g, ' '))).toEqual(['Anbieter A: über Budget (39.140 € statt höchstens 35.000 €).'])
  })

  it('rechnet € je Nutzwertpunkt und lässt ihn bei Nutzwert 0 offen (N7)', () => {
    const w = werteAus(abcProjekt())
    expect(w.ergebnisse[0].euroJePunkt).toBeCloseTo(5361.643836, 5)
    expect(w.ergebnisse[1].euroJePunkt).toBeCloseTo(4305.555556, 5)
    const null0 = abcProjekt().angebote.map((a) => ({ ...a, bewertungen: {} }))
    const r = bewerteAngebote({ anforderungen: abcProjekt().anforderungen, angebote: null0, gewichte: { funktion: 0.5, betrieb: 0.3, anbieter: 0.2 }, kosten: abcKosten(), wirtschaftlichkeit: abcProjekt().wirtschaftlichkeit })
    expect(r.ergebnisse[0]).toMatchObject({ nutzwert: 0, euroJePunkt: null, koOffen: 1, fehlend: 4 })
  })

  it('verlangt für den Barwert als Kostenbasis einen Zins (K8)', () => {
    const p = abcProjekt()
    p.wirtschaftlichkeit.kostenbasis = 'barwert'
    expect(kostenbasisVon(abcKosten().get('angebot-a')!, 'barwert')).toBeNull()
    expect(werteAus(p).befunde.filter((b) => b.code === 'K8').map((b) => b.schwere)).toEqual(['fehler'])
    const mitBarwert = new Map([...abcKosten()].map(([id, k]) => [id, { ...k, barwert: k.tco - 1000 }]))
    expect(werteAus(p, mitBarwert).ergebnisse[0].kostenbasis).toBe(38140)
  })

  it('ignoriert Anforderungen mit Priorität „Nicht“ und Vorschläge', () => {
    const p = abcProjekt()
    p.anforderungen = p.anforderungen.map((a) => (a.nummer === 'F-03' ? { ...a, prioritaet: 'nicht' as const } : a.nummer === 'F-02' ? { ...a, status: 'vorschlag' as const } : a))
    const c = ergebnis(p, 'angebot-c')
    expect(c.gueltig).toBe(true)
    // ohne F-02 zählt in Funktionen nur F-01
    expect(ergebnis(p, 'angebot-a').gruppenwerte.funktion).toBe(8)
  })
})

describe('Entscheidungsregeln (D1 bis D3)', () => {
  it('empfiehlt nach Preis-Leistung das Angebot mit den wenigsten € je Punkt (T-R2)', () => {
    const p = abcProjekt()
    p.entscheidung.regel = 'preis_leistung'
    const w = werteAus(p)
    expect(w.empfehlungId).toBe('angebot-b')
    expect(w.ergebnisse.map((r) => r.rang)).toEqual([2, 1, null])
  })

  it('lässt nur Angebote ab dem Mindestnutzwert zu (T-R3)', () => {
    const p = abcProjekt()
    p.entscheidung.regel = 'preis_leistung'
    p.entscheidung.mindestNutzwert = 7.25
    const w = werteAus(p)
    expect(w.empfehlungId).toBe('angebot-a')
    expect(w.ergebnisse.map((r) => r.rang)).toEqual([1, null, null])
    p.entscheidung.mindestNutzwert = 9
    const keins = werteAus(p)
    expect(keins.empfehlungId).toBeNull()
    expect(keins.befunde.find((b) => b.code === 'D2')).toMatchObject({ schwere: 'warnung', text: 'Kein Angebot erreicht den Mindestnutzwert.' })
  })

  it('gibt ohne gültiges Angebot keine Empfehlung (T-R4)', () => {
    let p = mitBewertung(abcProjekt(), 'angebot-a', 'eigene:f-03', { ko: 'nicht_erfuellt' })
    p = mitBewertung(p, 'angebot-b', 'eigene:f-03', { ko: 'nicht_erfuellt' })
    const w = werteAus(p)
    expect(w.empfehlungId).toBeNull()
    expect(w.befunde.find((b) => b.code === 'D3')).toMatchObject({ schwere: 'fehler', text: 'Kein Angebot erfüllt alle Muss-Kriterien.' })
    expect(w.stabilitaet).toEqual([])
  })

  it('nennt beim Ausschluss über das Budget den richtigen Grund (D3 mit Budget als K.-o.)', () => {
    // C erfüllt F-03, alle drei liegen über 10.000 €: nur das Budget schließt aus
    const p = mitBewertung(abcProjekt(), 'angebot-c', 'eigene:f-03', { ko: 'erfuellt' })
    p.wirtschaftlichkeit.budgetEuro = 10_000
    p.wirtschaftlichkeit.budgetAlsKo = true
    expect(werteAus(p).befunde.find((b) => b.code === 'D3')).toMatchObject({ schwere: 'fehler', text: 'Kein Angebot liegt im Budget.' })
    // C scheitert an F-03 (und liegt mit 20.000 € genau im Budget), A und B am Budget: beides zusammen
    const gemischt = abcProjekt()
    gemischt.wirtschaftlichkeit.budgetEuro = 20_000
    gemischt.wirtschaftlichkeit.budgetAlsKo = true
    const w = werteAus(gemischt)
    expect(w.ergebnisse.map((r) => r.ausschluss)).toEqual([['über Budget'], ['über Budget'], ['Muss-Kriterium F-03 nicht erfüllt']])
    expect(w.befunde.find((b) => b.code === 'D3')!.text).toBe('Kein Angebot erfüllt alle Muss-Kriterien und liegt zugleich im Budget.')
  })

  it('gibt bei fehlerhaften Gewichten keine Empfehlung', () => {
    const p = abcProjekt()
    p.gewichtung.direktProzent = { funktion: 50, betrieb: 30, anbieter: 10 }
    const w = werteAus(p)
    expect(w.empfehlungId).toBeNull()
    expect(w.ergebnisse.every((r) => r.rang === null)).toBe(true)
    expect(w.befunde[0]).toMatchObject({ code: 'G2', text: 'Summe ist 90 %' })
  })
})
