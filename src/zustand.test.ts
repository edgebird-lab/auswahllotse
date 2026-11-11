import { describe, expect, it } from 'vitest'
import { setzeRahmen } from './lastenheft/aenderungen'
import { neuesProjekt, standardEinstellungen } from './modell/projekt'
import type { AuswahlProjekt } from './modell/typen'
import { GRUPPE_MS, istGeaendert, MAX_VERLAUF, reduziere, schrittNummer, startZustand, type Zustand } from './zustand'

const JETZT = '2026-11-11T10:00:00.000Z'
const start = () => startZustand(neuesProjekt(JETZT), standardEinstellungen())
const vorhaben = (text: string) => (p: AuswahlProjekt) => setzeRahmen(p, { vorhaben: text }, JETZT)

function tippe(z: Zustand, text: string, zeit: number, gruppe = 'rahmen:vorhaben'): Zustand {
  return reduziere(z, { typ: 'aendern', aenderung: vorhaben(text), zeit, gruppe })
}

describe('Zustand mit Rückgängig und Wiederholen', () => {
  it('nimmt Änderungen zurück und wiederholt sie', () => {
    let z = start()
    z = reduziere(z, { typ: 'aendern', aenderung: vorhaben('A'), zeit: 1000 })
    z = reduziere(z, { typ: 'aendern', aenderung: vorhaben('B'), zeit: 2000 })
    expect(z.projekt.rahmen.vorhaben).toBe('B')
    expect(z.projekt.geaendertAm).toBe(new Date(2000).toISOString())
    z = reduziere(z, { typ: 'rueckgaengig' })
    expect(z.projekt.rahmen.vorhaben).toBe('A')
    z = reduziere(z, { typ: 'rueckgaengig' })
    expect(z.projekt.rahmen.vorhaben).toBe('')
    expect(reduziere(z, { typ: 'rueckgaengig' })).toBe(z)
    z = reduziere(z, { typ: 'wiederholen' })
    z = reduziere(z, { typ: 'wiederholen' })
    expect(z.projekt.rahmen.vorhaben).toBe('B')
    expect(reduziere(z, { typ: 'wiederholen' })).toBe(z)
  })

  it('fasst Tippen in einem Feld zu einem Schritt zusammen', () => {
    let z = start()
    z = tippe(z, 'N', 1000)
    z = tippe(z, 'Ne', 1000 + GRUPPE_MS - 1)
    z = tippe(z, 'Neu', 1000 + 2 * GRUPPE_MS)
    expect(z.vergangenheit).toHaveLength(2)
    z = reduziere(z, { typ: 'rueckgaengig' })
    expect(z.projekt.rahmen.vorhaben).toBe('Ne')
  })

  it('legt ohne Wirkung keinen Schritt an und begrenzt den Verlauf', () => {
    let z = start()
    const gleich = reduziere(z, { typ: 'aendern', aenderung: (p) => p, zeit: 1 })
    expect(gleich).toBe(z)
    for (let i = 0; i < MAX_VERLAUF + 20; i++) z = reduziere(z, { typ: 'aendern', aenderung: vorhaben(`V${i}`), zeit: i * 10_000 })
    expect(z.vergangenheit).toHaveLength(MAX_VERLAUF)
  })

  it('erkennt ungespeicherte Änderungen am Stand der Datei', () => {
    let z = start()
    expect(istGeaendert(z)).toBe(false)
    z = tippe(z, 'A', 1000)
    expect(istGeaendert(z)).toBe(true)
    z = reduziere(z, { typ: 'gespeichert', projekt: z.projekt, pfad: null, name: 'A.auswahllotse' })
    expect(istGeaendert(z)).toBe(false)
    expect(z.dokument.name).toBe('A.auswahllotse')
    z = tippe(z, 'AB', 5000)
    expect(istGeaendert(z)).toBe(true)
    z = reduziere(z, { typ: 'rueckgaengig' })
    expect(istGeaendert(z)).toBe(false)
  })

  it('beginnt beim Laden mit leerem Verlauf und behält die Einstellungen', () => {
    let z = tippe(start(), 'A', 1000)
    z = reduziere(z, { typ: 'einstellungen', einstellungen: { lernmodus: false } })
    z = reduziere(z, { typ: 'laden', projekt: neuesProjekt(JETZT), schritt: 'anforderungen', dokument: { name: 'x.auswahllotse' } })
    expect(z).toMatchObject({ vergangenheit: [], zukunft: [], schritt: 'anforderungen', einstellungen: { lernmodus: false, farbschema: 'system' } })
    expect(z.dokument.name).toBe('x.auswahllotse')
    expect(istGeaendert(z)).toBe(false)
  })

  it('wechselt Schritte ohne Verlauf', () => {
    const z = reduziere(start(), { typ: 'schritt', schritt: 'vorlagen' })
    expect(z.schritt).toBe('vorlagen')
    expect(z.vergangenheit).toEqual([])
    expect(schrittNummer('vorlagen')).toBe(7)
  })
})
