import { describe, expect, it } from 'vitest'
import type { Befund } from '../modell/ergebnisse'
import { domId, zielVonBefund } from './befundziel'

const befund = (code: string, bezug: string | null = null): Befund => ({ schwere: 'hinweis', code, text: '', bezug })

describe('Sprung zur Ursache (5.7)', () => {
  it('bildet gültige DOM-Kennungen ohne Kollision einfacher Fälle', () => {
    expect(domId('anf', 'medienbruch:med_papier>med_erp')).toBe('anf-medienbruch_3amed_5fpapier_3emed_5ferp')
    expect(domId('anf', 'a:b')).not.toBe(domId('anf', 'a>b'))
    expect(domId('anf', 'F-01')).toBe('anf-F-01')
  })

  it('führt Befunde zum passenden Schritt', () => {
    const angebote = ['angebot-a']
    expect(zielVonBefund(befund('P1', 'aufgabe:auf_x'), angebote)).toEqual({ schritt: 'anforderungen', anker: domId('anf', 'aufgabe:auf_x') })
    expect(zielVonBefund(befund('P8', 'gruppe:benutzer'), angebote)).toEqual({ schritt: 'anforderungen', anker: 'gruppe-benutzer' })
    expect(zielVonBefund(befund('P7'), angebote).anker).toBe('anforderungen-kopf')
    expect(zielVonBefund(befund('G2'), angebote)).toEqual({ schritt: 'gewichtung', anker: 'gewichte' })
    expect(zielVonBefund(befund('AHP6'), angebote).schritt).toBe('gewichtung')
    expect(zielVonBefund(befund('G4', 'gruppe:funktion'), angebote)).toEqual({ schritt: 'gewichtung', anker: 'punkte-funktion' })
    expect(zielVonBefund(befund('K9', 'angebot-a'), angebote)).toEqual({ schritt: 'angebote', anker: 'angebot-kosten', angebotId: 'angebot-a', reiter: 'kosten' })
    expect(zielVonBefund(befund('K8'), angebote)).toEqual({ schritt: 'angebote', anker: 'annahmen', reiter: 'kosten' })
    expect(zielVonBefund(befund('D4', 'angebot-a'), angebote)).toMatchObject({ schritt: 'vorlagen', vorlage: 'entscheidung' })
    expect(zielVonBefund(befund('D5'), angebote)).toEqual({ schritt: 'vorlagen', anker: 'entscheidung-bedienung', vorlage: 'entscheidung' })
    expect(zielVonBefund(befund('U2', 'auf_x'), angebote)).toEqual({ schritt: 'prozess', anker: 'aufgabe-auf_5fx' })
    expect(zielVonBefund(befund('E8'), angebote)).toEqual({ schritt: 'prozess', anker: 'prozess-karte' })
    expect(zielVonBefund(befund('S6'), angebote)).toEqual({ schritt: 'ergebnis', anker: 'empfehlung' })
  })
})
