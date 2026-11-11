import { describe, expect, it } from 'vitest'
import abcDatei from '../../testdaten/bewertung-abc.auswahllotse?raw'
import { abgeleitet } from '../lastenheft/ableitung'
import { leseProjektText } from '../modell/speicher'
import type { Anforderung, AuswahlProjekt, Gewichtung } from '../modell/typen'
import { abcProjekt } from '../testhilfen/abc'
import { lieferdienstAuswahl } from '../testhilfen/projekte'
import { aufHundertBringen, berechneGewichte, gleichVerteilen, globaleGewichte, groessterRest, hauptkriterien } from './gewichte'
import { legeFest, setzeBewertung, setzeBudget, setzeBudgetAlsKo, setzeDirektAlle, setzeDirektProzent, setzeMethode, setzeMindestNutzwert, setzePaarurteil, setzeRegel } from './operationen'

const direkt = (direktProzent: Gewichtung['direktProzent']): Gewichtung => ({ methode: 'direkt', direktProzent, paare: [], festgelegtAm: null, aenderungenNachBewertung: 0 })

describe('Hauptkriterien (G1, T-G1)', () => {
  it('nimmt beim Lieferdienst 6 Hauptkriterien; Schnittstellen und Benutzer wirken nur als K.-o.', () => {
    const { haupt, nurKo } = hauptkriterien(lieferdienstAuswahl().anforderungen)
    expect(haupt).toEqual(['funktion', 'menge', 'datenschutz', 'ordnung', 'betrieb', 'anbieter'])
    expect(nurKo).toEqual(['schnittstelle', 'benutzer'])
  })

  it('stimmt mit der Testdatei des Beispiels ABC überein', () => {
    expect(leseProjektText(abcDatei)).toEqual(abcProjekt())
    expect(hauptkriterien(abcProjekt().anforderungen)).toEqual({ haupt: ['funktion', 'betrieb', 'anbieter'], nurKo: [] })
  })
})

describe('Direkte Gewichte (G2, T-G2)', () => {
  const sechs = ['funktion', 'menge', 'datenschutz', 'ordnung', 'betrieb', 'anbieter'] as const

  it('meldet eine Summe ungleich 100 %', () => {
    const e = berechneGewichte(direkt({ funktion: 40, menge: 10, datenschutz: 10, ordnung: 10, betrieb: 19, anbieter: 10 }), sechs)
    expect(e.gewichte).toEqual({})
    expect(e.befunde).toEqual([{ schwere: 'fehler', code: 'G2', text: 'Summe ist 99 %', bezug: null }])
    expect(berechneGewichte(direkt({ funktion: 50.5, menge: 49.5 }), ['funktion', 'menge']).befunde[0].text).toBe('Gewichte müssen ganze Prozent ab 0 sein.')
    expect(berechneGewichte(direkt({ funktion: 110, menge: -10 }), ['funktion', 'menge']).befunde[0].code).toBe('G2')
  })

  it('verteilt gleich nach dem größten Rest: 17, 17, 17, 17, 16, 16', () => {
    expect(gleichVerteilen(sechs)).toEqual({ funktion: 17, menge: 17, datenschutz: 17, ordnung: 17, betrieb: 16, anbieter: 16 })
    expect(Object.values(gleichVerteilen(['funktion', 'menge', 'betrieb']))).toEqual([34, 33, 33])
  })

  it('bringt Eingaben proportional auf 100 %', () => {
    expect(aufHundertBringen({ funktion: 30, betrieb: 20, anbieter: 10 }, ['funktion', 'betrieb', 'anbieter'])).toEqual({ funktion: 50, betrieb: 33, anbieter: 17 })
    expect(aufHundertBringen({}, ['funktion', 'betrieb'])).toEqual({ funktion: 50, betrieb: 50 })
    expect(groessterRest([1, 1, 1])).toEqual([34, 33, 33])
    expect(groessterRest([2, 1], 10)).toEqual([7, 3])
    expect(groessterRest([])).toEqual([])
  })

  it('rechnet gültige Prozent in Gewichte um und gibt einem einzigen Kriterium 100 %', () => {
    expect(berechneGewichte(direkt({ funktion: 50, betrieb: 30, anbieter: 20 }), ['funktion', 'betrieb', 'anbieter']).gewichte).toEqual({ funktion: 0.5, betrieb: 0.3, anbieter: 0.2 })
    expect(berechneGewichte(direkt({}), ['funktion']).gewichte).toEqual({ funktion: 1 })
    expect(berechneGewichte(direkt({}), []).befunde[0]).toMatchObject({ schwere: 'fehler', code: 'G1' })
  })
})

describe('Paarvergleich (G3)', () => {
  const drei = ['funktion', 'betrieb', 'anbieter'] as const

  it('verlangt alle Paare', () => {
    const g: Gewichtung = { ...direkt({}), methode: 'paarvergleich', paare: [{ a: 'funktion', b: 'betrieb', wichtiger: 'a', staerke: 3 }] }
    expect(berechneGewichte(g, drei).befunde).toEqual([{ schwere: 'fehler', code: 'G3', text: '2 Vergleiche fehlen', bezug: null }])
    g.paare.push({ a: 'betrieb', b: 'anbieter', wichtiger: 'a', staerke: 1 })
    expect(berechneGewichte(g, drei).befunde[0].text).toBe('1 Vergleich fehlt')
  })

  it('liefert Gewichte und die Warnung mit dem widersprüchlichsten Paar', () => {
    const g: Gewichtung = {
      ...direkt({}),
      methode: 'paarvergleich',
      paare: [
        { a: 'funktion', b: 'betrieb', wichtiger: 'a', staerke: 9 },
        { a: 'betrieb', b: 'anbieter', wichtiger: 'a', staerke: 9 },
        { a: 'funktion', b: 'anbieter', wichtiger: 'b', staerke: 9 },
      ],
    }
    const e = berechneGewichte(g, drei)
    expect(e.ahp?.stimmig).toBe(false)
    expect(e.befunde).toEqual([{ schwere: 'warnung', code: 'AHP6', text: 'Die Vergleiche widersprechen sich (CR 6,13). Prüfen Sie „Funktionen“ gegen „Betrieb und Support“.', bezug: null }])
    expect(Object.values(e.gewichte).reduce((s, w) => s + (w ?? 0), 0)).toBeCloseTo(1, 12)
  })
})

describe('Unterpunkte (G4, T-G3)', () => {
  function anf(id: string, prioritaet: 'soll' | 'kann' | 'muss', punkte: number): Anforderung {
    return {
      ...abgeleitet({ id, gruppe: 'betrieb', titel: id, text: '', abnahme: '', prioritaet, status: 'aktiv', herkunft: { art: 'eigene', bezuege: [], katalogId: null }, begruendung: '' }),
      punkte,
    }
  }

  it('verteilt das Gruppengewicht nach Punkten', () => {
    const { gewichte, befunde } = globaleGewichte([anf('s', 'soll', 2), anf('k', 'kann', 1), anf('m', 'muss', 0)], { betrieb: 0.3 })
    expect(gewichte.get('s')).toBeCloseTo(0.2, 12)
    expect(gewichte.get('k')).toBeCloseTo(0.1, 12)
    expect(gewichte.has('m')).toBe(false)
    expect(befunde).toEqual([])
  })

  it('meldet eine Gruppe mit Punktesumme 0', () => {
    const { befunde } = globaleGewichte([anf('s', 'soll', 0), anf('k', 'kann', 0)], { betrieb: 0.3 })
    expect(befunde).toEqual([{ schwere: 'fehler', code: 'G4', text: '„Betrieb und Support“: Die Punkte der Anforderungen ergeben 0; bitte mindestens einer Anforderung Punkte geben.', bezug: 'gruppe:betrieb' }])
  })
})

describe('Festlegen und Änderungen nach Bewertungsbeginn (G5, T-G4)', () => {
  it('zählt eine Gewichtsänderung nach Beginn der Bewertung', () => {
    let p: AuswahlProjekt = { ...abcProjekt(), bewertungBegonnenAm: null }
    p = setzeDirektProzent(p, 'funktion', 60)
    expect(p.gewichtung.aenderungenNachBewertung).toBe(0)
    p = legeFest(p, '2026-11-12T08:00:00.000Z')
    expect(p.gewichtung.festgelegtAm).toBe('2026-11-12T08:00:00.000Z')
    p = setzeBewertung(p, 'angebot-a', 'eigene:f-01', { punkte: 7 }, '2026-11-12T09:00:00.000Z')
    expect(p.bewertungBegonnenAm).toBe('2026-11-12T09:00:00.000Z')
    p = setzeDirektProzent(p, 'funktion', 50)
    expect(p.gewichtung.aenderungenNachBewertung).toBe(1)
  })

  it('zählt Methode, Paarurteile, Regel, Mindestnutzwert und Budget, aber keine Wiederholungen desselben Werts', () => {
    let p = abcProjekt()
    p = setzeDirektProzent(p, 'funktion', 50)
    p = setzeDirektAlle(p, { funktion: 50, betrieb: 30, anbieter: 20 })
    expect(p.gewichtung.aenderungenNachBewertung).toBe(0)
    p = setzeMethode(p, 'paarvergleich')
    p = setzePaarurteil(p, { a: 'funktion', b: 'betrieb', wichtiger: 'a', staerke: 3 })
    p = setzePaarurteil(p, { a: 'funktion', b: 'betrieb', wichtiger: 'a', staerke: 3 })
    p = setzePaarurteil(p, { a: 'betrieb', b: 'funktion', wichtiger: 'b', staerke: 5 })
    expect(p.gewichtung.paare).toEqual([{ a: 'betrieb', b: 'funktion', wichtiger: 'b', staerke: 5 }])
    p = setzeRegel(p, 'preis_leistung')
    p = setzeMindestNutzwert(p, 6)
    p = setzeBudget(p, 35000)
    p = setzeBudgetAlsKo(p, true)
    p = setzeBudgetAlsKo(p, true)
    expect(p.gewichtung.aenderungenNachBewertung).toBe(7)
  })

  it('setzt Bewertungen mit Punkten 0 bis 10 und erkennt den ersten Eintrag', () => {
    const abc = abcProjekt()
    let p: AuswahlProjekt = { ...abc, bewertungBegonnenAm: null, angebote: abc.angebote.map((x) => ({ ...x, bewertungen: {} })) }
    p = setzeBewertung(p, 'angebot-a', 'eigene:f-03', { fundstelle: 'S. 4' }, '2026-11-12T09:00:00.000Z')
    expect(p.bewertungBegonnenAm).toBeNull()
    p = setzeBewertung(p, 'angebot-a', 'eigene:f-03', { ko: 'erfuellt' }, '2026-11-12T09:30:00.000Z')
    expect(p.bewertungBegonnenAm).toBe('2026-11-12T09:30:00.000Z')
    p = setzeBewertung(p, 'angebot-b', 'eigene:f-01', { punkte: 14 }, '2026-11-12T10:00:00.000Z')
    expect(p.angebote[1].bewertungen['eigene:f-01'].punkte).toBe(10)
    p = setzeBewertung(p, 'angebot-b', 'eigene:f-01', { punkte: null }, '2026-11-12T10:00:00.000Z')
    expect(p.angebote[1].bewertungen['eigene:f-01'].punkte).toBeNull()
    expect(p.angebote[0].bewertungen['eigene:f-03']).toMatchObject({ ko: 'erfuellt', fundstelle: 'S. 4' })
    expect(p.bewertungBegonnenAm).toBe('2026-11-12T09:30:00.000Z')
  })
})
