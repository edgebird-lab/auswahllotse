import { describe, expect, it } from 'vitest'
import { setzeBudget, setzeMindestNutzwert } from './bewertung/operationen'
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

describe('Änderungszähler G5 beim Tippen', () => {
  // Bewertung hat begonnen, Budget 80.000 €; jede Budgetänderung zählt nach G5
  const bewertet = () => startZustand({ ...neuesProjekt(JETZT), bewertungBegonnenAm: JETZT, wirtschaftlichkeit: { ...neuesProjekt(JETZT).wirtschaftlichkeit, budgetEuro: 80_000 } }, standardEinstellungen())
  const budget = (z: Zustand, wert: number | null, zeit: number) => reduziere(z, { typ: 'aendern', aenderung: (p) => setzeBudget(p, wert), zeit, gruppe: 'budget' })
  const zaehler = (z: Zustand) => z.projekt.gewichtung.aenderungenNachBewertung

  it('zählt das Eintippen von „90000“ (fünf Tastendrücke) als eine Änderung', () => {
    let z = bewertet()
    // Feld leeren, dann Ziffer für Ziffer: jede Eingabe ändert das Budget
    for (const [i, wert] of [null, 9, 90, 900, 9000, 90_000].entries()) z = budget(z, wert, 1000 + i * 100)
    expect(z.projekt.wirtschaftlichkeit.budgetEuro).toBe(90_000)
    expect(zaehler(z)).toBe(1)
    expect(z.vergangenheit).toHaveLength(1)
    // Rückgängig nimmt Eingabe und Zählung zusammen zurück
    z = reduziere(z, { typ: 'rueckgaengig' })
    expect(z.projekt.wirtschaftlichkeit.budgetEuro).toBe(80_000)
    expect(zaehler(z)).toBe(0)
  })

  it('zählt nicht, wenn am Ende der Eingabe wieder der Ausgangswert steht', () => {
    let z = bewertet()
    for (const [i, wert] of [8, 80, 800, 8000, 80_000].entries()) z = budget(z, wert, 1000 + i * 100)
    expect(z.projekt.wirtschaftlichkeit.budgetEuro).toBe(80_000)
    expect(zaehler(z)).toBe(0)
  })

  it('zählt getrennte Eingaben einzeln', () => {
    let z = bewertet()
    z = budget(z, 70_000, 1000)
    z = budget(z, 60_000, 1000 + GRUPPE_MS + 1)
    expect(zaehler(z)).toBe(2)
    // eine andere Gruppe (anderes Feld) direkt danach zählt auch
    z = reduziere(z, { typ: 'aendern', aenderung: (p) => setzeMindestNutzwert(p, 6), zeit: 1000 + GRUPPE_MS + 50, gruppe: 'mindestnutzwert' })
    expect(zaehler(z)).toBe(3)
  })

  it('lässt den Zähler vor Beginn der Bewertung unberührt', () => {
    let z = startZustand(neuesProjekt(JETZT), standardEinstellungen())
    for (const [i, wert] of [5, 50, 500].entries()) z = budget(z, wert, 1000 + i * 100)
    expect(zaehler(z)).toBe(0)
  })
})
