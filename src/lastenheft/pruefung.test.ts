import { describe, expect, it } from 'vitest'
import type { Anforderung } from '../modell/typen'
import { lieferdienstAuswahl, nachId, nachNummer } from '../testhilfen/projekte'
import { abgeleitet } from './ableitung'
import { formatiereNummer } from './nummern'
import { setzePrioritaet, uebernimm, verwirf } from './operationen'
import { mussAnteil, pruefeAnforderungen, unbestimmteBegriffe, woerter } from './pruefung'

function anf(text: string, werte: Partial<Anforderung> = {}): Anforderung {
  return {
    ...abgeleitet({
      id: werte.id ?? 'eigene:1',
      gruppe: 'funktion',
      titel: 'Test',
      text,
      abnahme: 'Test: geht.',
      prioritaet: werte.prioritaet ?? 'muss',
      status: werte.status ?? 'aktiv',
      herkunft: { art: 'eigene', bezuege: [], katalogId: null },
      begruendung: '',
    }),
    ...werte,
  }
}

/** Befunde zu einzelnen Anforderungen (P1 bis P6), ohne die Gesamtprüfungen P7 bis P10 */
const einzeln = (a: Anforderung[]) => pruefeAnforderungen(a).befunde.filter((b) => ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].includes(b.code))
const codes = (a: Anforderung[]) => einzeln(a).map((b) => b.code)

describe('Prüfungen der Anforderungen (P1 bis P10)', () => {
  it('findet unbestimmte Begriffe als ganze Wörter (T-P1)', () => {
    const befunde = einzeln([anf('Die Software muss schnell und benutzerfreundlich sein.')])
    expect(befunde.map((b) => b.text)).toEqual(['„schnell“ ist unbestimmt; bitte messbar machen.', '„benutzerfreundlich“ ist unbestimmt; bitte messbar machen.'])
    expect(befunde.every((b) => b.schwere === 'hinweis' && b.code === 'P1' && b.bezug === 'eigene:1')).toBe(true)
  })

  it('erkennt gebeugte Formen, Abkürzungen und Wortgruppen, aber keine Wortteile', () => {
    expect(unbestimmteBegriffe('Eine SCHNELLE, flexible Suche ggf. mit Export usw. und/oder Druck bei Bedarf')).toEqual([
      'schnell',
      'flexibel',
      'ggf.',
      'usw.',
      'bei Bedarf',
      'und/oder',
    ])
    expect(unbestimmteBegriffe('Die Software vereinfacht die Schnellerfassung und modernisiert.')).toEqual([])
    expect(unbestimmteBegriffe('möglichst zeitnahe, angemessene Reaktion ca. 3 Tage')).toEqual(['möglichst', 'ca.', 'angemessen', 'zeitnah'])
  })

  it('meldet fehlende und unpassende Modalverben (T-P2)', () => {
    expect(einzeln([anf('Die Software zeigt den Bestand.')]).map((b) => b.text)).toEqual([
      'Verbindlichkeit fehlt: Der Text enthält kein Modalverb wie „muss“, „sollte“ oder „kann“.',
    ])
    const kann = einzeln([anf('Die Software muss den Bestand zeigen.', { prioritaet: 'kann' })])
    expect(kann.map((b) => [b.code, b.text])).toEqual([['P3', 'Das Modalverb passt nicht zur Priorität Kann.']])
    // eigenes Modalverb vorhanden: kein Befund, auch wenn ein fremdes vorkommt
    expect(codes([anf('Die Software sollte zeigen, was geliefert werden muss.', { prioritaet: 'soll' })])).toEqual([])
    // „Nicht“ wird nicht geprüft; „wird“ zählt als Verbindlichkeit
    expect(codes([anf('Die Software kann drucken.', { prioritaet: 'nicht' })])).toEqual([])
    expect(codes([anf('Die Software wird drucken.', { prioritaet: 'soll' })])).toEqual([])
  })

  it('verlangt bei aktiven Muss- und Soll-Anforderungen ein Abnahmekriterium (T-P3)', () => {
    const ohne = einzeln([anf('Die Software muss drucken.', { abnahme: '  ' })])
    expect(ohne).toEqual([{ schwere: 'warnung', code: 'P4', text: 'Abnahmekriterium fehlt.', bezug: 'eigene:1' }])
    expect(codes([anf('Die Software kann drucken.', { abnahme: '', prioritaet: 'kann' })])).toEqual([])
    expect(codes([anf('Die Software muss drucken.', { abnahme: '', status: 'vorschlag' })])).toEqual([])
  })

  it('meldet lange Texte und gleiche Texte (T-P4)', () => {
    const lang = `Die Software muss ${Array(37).fill('wort').join(' ')} können.`
    expect(woerter(lang)).toBe(41)
    expect(einzeln([anf(lang)]).map((b) => b.text)).toEqual(['Der Text hat 41 Wörter; bitte aufteilen.'])
    expect(codes([anf(`Die Software muss ${Array(36).fill('wort').join(' ')} können.`)])).toEqual([])
    const a = anf('Die Software muss drucken.', { id: 'a', nummer: 'F-01' })
    const b = anf('die  Software muss\ndrucken.', { id: 'b', nummer: 'F-02' })
    const gleich = einzeln([a, b]).filter((x) => x.code === 'P6')
    expect(gleich.map((x) => [x.bezug, x.text])).toEqual([
      ['a', 'Gleicher Text wie F-02.'],
      ['b', 'Gleicher Text wie F-01.'],
    ])
    // verworfene zählen nicht
    expect(codes([a, { ...b, status: 'verworfen' }])).toEqual([])
  })

  it('warnt ab mehr als 60 % Muss (T-P5)', () => {
    const p = lieferdienstAuswahl()
    const erg = pruefeAnforderungen(p.anforderungen)
    expect(erg.aktiv).toBe(35)
    expect(p.anforderungen.filter((a) => a.status === 'aktiv' && a.prioritaet === 'muss')).toHaveLength(22)
    expect(erg.mussAnteil).toBeCloseTo(22 / 35, 12)
    expect(erg.befunde.find((b) => b.code === 'P7')).toEqual({
      schwere: 'warnung',
      code: 'P7',
      text: '62,9 % Muss. Empfohlen sind höchstens etwa 60 % (MoSCoW nach Aufwand; hier nach Anzahl).',
      bezug: null,
    })
    const herab = setzePrioritaet(p, nachNummer(p, 'F-01').id, 'soll')
    expect(mussAnteil(herab.anforderungen)).toBeCloseTo(0.6, 12)
    expect(pruefeAnforderungen(herab.anforderungen).befunde.some((b) => b.code === 'P7')).toBe(false)
  })

  it('meldet Gruppen nur mit Muss, fehlende aktive Anforderungen und offene Vorschläge (P8 bis P10)', () => {
    const p = lieferdienstAuswahl()
    const erg = pruefeAnforderungen(p.anforderungen)
    expect(erg.befunde.filter((b) => b.code === 'P8').map((b) => b.bezug)).toEqual(['gruppe:schnittstelle', 'gruppe:benutzer'])
    expect(erg.befunde.find((b) => b.code === 'P8')!.text).toBe('„Schnittstellen und Datenfluss“ hat keine Soll- oder Kann-Anforderung und wirkt nur als K.-o.')
    expect(erg.offeneVorschlaege).toBe(1 + 6 + 1)
    expect(erg.befunde.find((b) => b.code === 'P10')!.text).toBe('8 Vorschläge noch offen.')
    const leer = pruefeAnforderungen([anf('Die Software muss drucken.', { status: 'vorschlag' })])
    expect(leer.befunde.map((b) => [b.schwere, b.code])).toEqual([
      ['fehler', 'P9'],
      ['hinweis', 'P10'],
    ])
    expect(leer.befunde[1].text).toBe('1 Vorschlag noch offen.')
    expect(leer.mussAnteil).toBeNull()
  })

  it('meldet P8 nur, wenn die Gruppe wirklich ein Muss-Kriterium hat (nicht bei „Nicht“ allein)', () => {
    // „Nicht“ ist weder K.-o. noch Teil des Nutzwerts; „wirkt nur als K.-o.“ wäre falsch
    const nurNicht = [anf('Die Software muss faxen.', { id: 'eigene:n', gruppe: 'betrieb', prioritaet: 'nicht' }), anf('Die Software sollte drucken.', { id: 'eigene:s', prioritaet: 'soll' })]
    expect(pruefeAnforderungen(nurNicht).befunde.filter((b) => b.code === 'P8')).toEqual([])
    const mitMuss = [...nurNicht, anf('Die Software muss sichern.', { id: 'eigene:m', gruppe: 'betrieb', prioritaet: 'muss' })]
    expect(pruefeAnforderungen(mitMuss).befunde.filter((b) => b.code === 'P8').map((b) => b.bezug)).toEqual(['gruppe:betrieb'])
  })

  it('prüft die abgeleiteten Texte des Lieferdienstes: nur R-01 ist lang', () => {
    const p = lieferdienstAuswahl()
    // Die Rollen-Anforderung nach A5 zählt alle Rollen mit Aufgaben auf (44 Wörter).
    expect(einzeln(p.anforderungen).map((b) => [b.code, b.bezug, b.text])).toEqual([['P5', 'rollen', 'Der Text hat 44 Wörter; bitte aufteilen.']])
  })
})

describe('Nummern (P11, T-P6)', () => {
  it('vergibt F-01 bis F-08 in Prozessreihenfolge und Nummern erst bei Übernahme', () => {
    const p = lieferdienstAuswahl()
    expect(p.anforderungen.filter((a) => a.gruppe === 'funktion' && a.status === 'aktiv').map((a) => a.nummer)).toEqual(['F-01', 'F-02', 'F-03', 'F-04', 'F-05', 'F-06', 'F-07', 'F-08'])
    const vorschlag = nachId(p, 'entscheidung:ent_vorrat')
    expect(vorschlag.nummer).toBeNull()
    const danach = uebernimm(p, vorschlag.id)
    expect(nachId(danach, vorschlag.id)).toMatchObject({ status: 'aktiv', nummer: 'F-09', bearbeitet: { status: true } })
    expect(danach.naechsteNummer.funktion).toBe(10)
  })

  it('vergibt eine verworfene Nummer nicht neu', () => {
    let p = lieferdienstAuswahl()
    p = verwirf(p, nachNummer(p, 'F-08').id)
    p = uebernimm(p, 'baustein:ERP-1')
    expect(nachId(p, 'baustein:ERP-1').nummer).toBe('F-09')
    expect(p.anforderungen.filter((a) => a.nummer === 'F-08')).toHaveLength(1)
    expect(nachNummer(p, 'F-08').status).toBe('verworfen')
  })

  it('formatiert zweistellig und darüber hinaus', () => {
    expect(formatiereNummer('barrierefreiheit', 3)).toBe('BF-03')
    expect(formatiereNummer('funktion', 100)).toBe('F-100')
  })
})
