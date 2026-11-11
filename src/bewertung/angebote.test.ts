import { describe, expect, it } from 'vitest'
import { beispielProjekt } from '../beispiel/beispiel'
import { abcProjekt } from '../testhilfen/abc'
import {
  bewertungsFortschritt,
  fuegeAngebotHinzu,
  loescheAngebot,
  loescheKostenposition,
  neueKostenposition,
  setzeAngebot,
  setzeKostenposition,
  setzeKostenwert,
  setzeWirtschaftlichkeit,
} from './angebote'

describe('Angebote und Kosten bearbeiten (5.6)', () => {
  it('legt ein Angebot an und ändert es', () => {
    const { projekt, id } = fuegeAngebotHinzu(abcProjekt(), { anbieter: 'Anbieter D' })
    expect(projekt.angebote.map((a) => a.anbieter)).toEqual(['Anbieter A', 'Anbieter B', 'Anbieter C', 'Anbieter D'])
    const q = setzeAngebot(projekt, id, { produkt: 'Produkt D', betriebsform: 'eigener_server' })
    expect(q.angebote[3]).toMatchObject({ id, produkt: 'Produkt D', betriebsform: 'eigener_server', bewertungen: {} })
    expect(setzeAngebot(q, id, { produkt: 'Produkt D' })).toBe(q)
  })

  it('löscht ein Angebot und gibt eine Wahl darauf frei', () => {
    const p = abcProjekt()
    p.entscheidung.gewaehltId = 'angebot-b'
    const q = loescheAngebot(p, 'angebot-b')
    expect(q.angebote.map((a) => a.id)).toEqual(['angebot-a', 'angebot-c'])
    expect(q.entscheidung.gewaehltId).toBeNull()
    expect(loescheAngebot(q, 'gibt-es-nicht')).toBe(q)
  })

  it('pflegt Kostenpositionen und Werte', () => {
    const { projekt, positionId } = neueKostenposition(abcProjekt(), 'angebot-b', 'laufendJahr')
    let p = setzeKostenposition(projekt, 'angebot-b', 'laufendJahr', positionId, { art: 'hosting', bezeichnung: 'Hosting', betragEuro: 300 })
    expect(p.angebote[1].kosten.laufendJahr.map((x) => [x.art, x.betragEuro])).toEqual([
      ['abo', 4600],
      ['hosting', 300],
    ])
    expect(setzeKostenposition(p, 'angebot-b', 'laufendJahr', positionId, { betragEuro: 300 })).toBe(p)
    p = loescheKostenposition(p, 'angebot-b', 'laufendJahr', positionId)
    expect(p.angebote[1].kosten.laufendJahr).toHaveLength(1)
    p = setzeKostenwert(p, 'angebot-b', 'preisJeBenutzerMonatEuro', 12)
    expect(p.angebote[1].kosten.preisJeBenutzerMonatEuro).toBe(12)
    const neu = neueKostenposition(p, 'angebot-a', 'einmalig')
    expect(neu.projekt.angebote[0].kosten.einmalig.at(-1)).toEqual({ id: neu.positionId, art: 'einrichtung', bezeichnung: '', betragEuro: 0 })
  })

  it('ändert Annahmen nur bei neuem Wert', () => {
    const p = abcProjekt()
    expect(setzeWirtschaftlichkeit(p, { jahre: 5 })).toBe(p)
    expect(setzeWirtschaftlichkeit(p, { jahre: 7, zinsProzent: 4 }).wirtschaftlichkeit).toMatchObject({ jahre: 7, zinsProzent: 4 })
  })

  it('zählt den Fortschritt der Bewertung', () => {
    const p = beispielProjekt()
    expect(bewertungsFortschritt(p.anforderungen, p.angebote[0])).toEqual({ bewertet: 42, gesamt: 42 })
    const { projekt, id } = fuegeAngebotHinzu(p)
    expect(bewertungsFortschritt(projekt.anforderungen, projekt.angebote.find((a) => a.id === id)!)).toEqual({ bewertet: 0, gesamt: 42 })
    // „offen“ ist noch keine Bewertung
    const offen = { ...p.angebote[0], bewertungen: { ...p.angebote[0].bewertungen, 'katalog:N-GB-3': { ko: 'offen' as const, punkte: null, fundstelle: '', notiz: '' } } }
    expect(bewertungsFortschritt(p.anforderungen, offen)).toEqual({ bewertet: 41, gesamt: 42 })
  })
})
