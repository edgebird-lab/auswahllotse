import { describe, expect, it } from 'vitest'
import doku from '../../docs/kataloge.md?raw'
import { neuerRahmen } from '../modell/projekt'
import type { Rahmen } from '../modell/typen'
import { BAUSTEINE, bedingungWert, fuelleText, KATALOG, werteAus } from './katalog'

const rahmen = (werte: Partial<Rahmen> = {}): Rahmen => ({ ...neuerRahmen(), ...werte })

describe('Katalog und Bausteine (6.7)', () => {
  it('hat 21 Anforderungen und 24 Bausteine mit eindeutigen Kennungen', () => {
    expect(KATALOG).toHaveLength(21)
    expect(BAUSTEINE).toHaveLength(24)
    const ids = [...KATALOG, ...BAUSTEINE].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const art of ['erp', 'shop', 'crm', 'dms'] as const) expect(BAUSTEINE.filter((b) => b.softwareart === art)).toHaveLength(6)
  })

  it('beginnt jeden Text mit Subjekt und Modalverb-Platzhalter', () => {
    for (const e of [...KATALOG, ...BAUSTEINE]) expect(e.text, e.id).toMatch(/^(Die Software|Der Anbieter|Der Shop) \{verb\} /)
  })

  it('stimmt mit der Kopie in docs/kataloge.md überein', () => {
    for (const e of [...KATALOG, ...BAUSTEINE]) {
      expect(doku, e.id).toContain(`| ${e.id} |`)
      expect(doku, e.id).toContain(e.text.replace('{verb}', '[muss]').split('{')[0])
    }
  })

  it('wertet Bedingungen dreiwertig aus', () => {
    expect(werteAus([], rahmen())).toBe('ja')
    expect(werteAus(['personenbezogen', 'nichtEigenerServer'], rahmen({ personenbezogen: 'ja', betriebsform: 'cloud' }))).toBe('ja')
    expect(werteAus(['personenbezogen', 'nichtEigenerServer'], rahmen({ personenbezogen: 'offen', betriebsform: 'cloud' }))).toBe('offen')
    expect(werteAus(['personenbezogen', 'nichtEigenerServer'], rahmen({ personenbezogen: 'offen', betriebsform: 'eigener_server' }))).toBe('nein')
    expect(['cloud', 'eigener_server', 'offen'].map((b) => bedingungWert('nichtEigenerServer', rahmen({ betriebsform: b as Rahmen['betriebsform'] })))).toEqual(['ja', 'nein', 'offen'])
    expect(['ja', 'nein', 'offen'].map((k) => bedingungWert('nichtKleinst', rahmen({ kleinstunternehmen: k as Rahmen['kleinstunternehmen'] })))).toEqual(['nein', 'ja', 'offen'])
    expect(bedingungWert('shop', rahmen({ softwareart: 'shop' }))).toBe('ja')
  })

  it('setzt Richtwerte mit passender Einheit ein', () => {
    const r = rahmen()
    r.richtwerte = { ...r.richtwerte, wiederherstellungStunden: 1, reaktionStunden: 1.5, referenzen: 1, einfuehrungWochen: 1, verfuegbarkeitProzent: 99.95 }
    expect(fuelleText('A {verb} {wiederherstellung}, {reaktion}, {referenzbetriebe}, {einfuehrung}, {verfuegbarkeit} %', 'soll', r)).toBe(
      'A sollte 1 Stunde, 1,5 Stunden, 1 Referenzbetrieb, 1 Woche, 99,95 %',
    )
  })
})
