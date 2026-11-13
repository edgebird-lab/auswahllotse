import { describe, expect, it } from 'vitest'
import { abcProjekt } from '../testhilfen/abc'
import { befundMitAnforderung } from './texte'

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
