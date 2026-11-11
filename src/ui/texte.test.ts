import { describe, expect, it } from 'vitest'
import { abcProjekt } from '../testhilfen/abc'
import { befundMitAnforderung, leseZahl } from './texte'

describe('befundMitAnforderung: Befunde in der Gesamtliste', () => {
  it('nennt Nummer oder Titel der Anforderung, um die es geht', () => {
    const anforderungen = abcProjekt().anforderungen
    const f01 = anforderungen.find((a) => a.nummer === 'F-01')!
    expect(befundMitAnforderung({ schwere: 'hinweis', code: 'P5', text: 'Der Text hat 44 Wörter; bitte aufteilen.', bezug: f01.id }, anforderungen)).toBe('F-01: Der Text hat 44 Wörter; bitte aufteilen.')
    const ohneNummer = [{ ...f01, nummer: null, titel: 'Stammdaten' }]
    expect(befundMitAnforderung({ schwere: 'hinweis', code: 'P1', text: '„schnell“ ist unbestimmt; bitte messbar machen.', bezug: f01.id }, ohneNummer)).toBe(
      '„Stammdaten“: „schnell“ ist unbestimmt; bitte messbar machen.',
    )
    // Befunde zu Angeboten, Gruppen oder ohne Bezug bleiben, wie sie sind
    expect(befundMitAnforderung({ schwere: 'hinweis', code: 'N2', text: 'Anbieter A: über Budget.', bezug: 'angebot-a' }, anforderungen)).toBe('Anbieter A: über Budget.')
    expect(befundMitAnforderung({ schwere: 'warnung', code: 'P7', text: '62,9 % Muss.', bezug: null }, anforderungen)).toBe('62,9 % Muss.')
  })
})

describe('leseZahl: deutsche Zahleneingabe', () => {
  it('liest Dezimalkomma mit und ohne Tausenderpunkt', () => {
    expect(leseZahl('1234,5')).toBe(1234.5)
    expect(leseZahl('1.234,5')).toBe(1234.5)
    expect(leseZahl('0,25')).toBe(0.25)
    expect(leseZahl(' 39 € ')).toBe(39)
    expect(leseZahl('99,5 %')).toBe(99.5)
  })

  it('liest Punkte in Dreiergruppen als Tausendertrennzeichen („80.000“ ist achtzigtausend)', () => {
    // Früher wurde „90.000“ zu 90: ein Budget von 90 € statt 90.000 €
    expect(leseZahl('80.000')).toBe(80_000)
    expect(leseZahl('12.000')).toBe(12_000)
    expect(leseZahl('1.234.567')).toBe(1_234_567)
    expect(leseZahl('-1.500')).toBe(-1500)
  })

  it('liest einen einzelnen Punkt ohne Dreiergruppe als Dezimalpunkt', () => {
    expect(leseZahl('1.5')).toBe(1.5)
    expect(leseZahl('2.75')).toBe(2.75)
    expect(leseZahl('0.125')).toBe(0.125)
    expect(leseZahl('12.')).toBe(12)
  })

  it('gibt während des Tippens sinnvolle Zwischenwerte und bei Unsinn null', () => {
    expect(leseZahl('90.0')).toBe(90)
    expect(leseZahl('90.00')).toBe(90)
    expect(leseZahl('90.000')).toBe(90_000)
    expect(leseZahl('')).toBeNull()
    expect(leseZahl('-')).toBeNull()
    expect(leseZahl('−')).toBeNull()
    expect(leseZahl('−5')).toBe(-5)
    expect(leseZahl('abc')).toBeNull()
    expect(leseZahl('1,2,3')).toBeNull()
    expect(leseZahl('1e999')).toBeNull()
  })
})
