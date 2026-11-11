import { describe, expect, it } from 'vitest'
import { lieferdienstAuswahl, nachId, nachNummer } from '../testhilfen/projekte'
import { ersetzeModalverb } from './texte'
import {
  loescheEigene,
  neueEigeneAnforderung,
  setzeNotiz,
  setzePrioritaet,
  setzePunkte,
  setzeTexte,
  stelleWiederHer,
  uebernimm,
  uebernimmAlleVorschlaege,
  verwirf,
} from './operationen'

describe('Anforderungen bearbeiten', () => {
  it('tauscht beim Ändern der Priorität das Modalverb und die Standardpunkte (A1, A13)', () => {
    const p = lieferdienstAuswahl()
    const id = nachNummer(p, 'F-01').id
    const soll = setzePrioritaet(p, id, 'soll')
    expect(nachId(soll, id)).toMatchObject({ prioritaet: 'soll', prioritaetVorschlag: 'muss', punkte: 2, bearbeitet: { prioritaet: true, text: false } })
    expect(nachId(soll, id).text).toBe('Die Software sollte die Aufgabe „Bestellung in Warenwirtschaft erfassen“ für die Rolle Innendienst unterstützen.')
    const kann = setzePrioritaet(soll, id, 'kann')
    expect(nachId(kann, id).text).toContain('Die Software kann die Aufgabe')
    expect(nachId(kann, id).punkte).toBe(1)
    // „Nicht“ behält „muss“ im Text; zurück zum Vorschlag gilt nicht mehr als bearbeitet
    const nicht = setzePrioritaet(p, id, 'nicht')
    expect(nachId(nicht, id).text).toBe(nachId(p, id).text)
    expect(nachId(setzePrioritaet(soll, id, 'muss'), id).bearbeitet.prioritaet).toBe(false)
  })

  it('lässt bearbeitete Texte und eigene Punkte stehen', () => {
    let p = lieferdienstAuswahl()
    const id = nachNummer(p, 'F-02').id
    p = setzeTexte(p, id, { text: 'Die Software sollte Änderungen protokollieren.' })
    p = setzePunkte(p, id, 7)
    p = setzePrioritaet(p, id, 'kann')
    expect(nachId(p, id)).toMatchObject({ text: 'Die Software sollte Änderungen protokollieren.', punkte: 7, bearbeitet: { text: true } })
  })

  it('begrenzt Punkte auf ganze Zahlen von 0 bis 10', () => {
    const p = lieferdienstAuswahl()
    const id = nachNummer(p, 'F-02').id
    expect(nachId(setzePunkte(p, id, 12), id).punkte).toBe(10)
    expect(nachId(setzePunkte(p, id, -3), id).punkte).toBe(0)
    expect(nachId(setzePunkte(p, id, 2.6), id).punkte).toBe(3)
    expect(nachId(setzePunkte(p, id, Number.NaN), id).punkte).toBe(0)
  })

  it('übernimmt, verwirft und stellt wieder her', () => {
    let p = lieferdienstAuswahl()
    p = uebernimmAlleVorschlaege(p, 'funktion')
    expect(p.anforderungen.filter((a) => a.gruppe === 'funktion' && a.status === 'aktiv').map((a) => a.nummer)).toEqual([
      'F-01', 'F-02', 'F-03', 'F-04', 'F-05', 'F-06', 'F-07', 'F-08', 'F-09', 'F-10', 'F-11', 'F-12', 'F-13', 'F-14',
    ])
    p = verwirf(p, 'baustein:ERP-6')
    expect(nachId(stelleWiederHer(p, 'baustein:ERP-6'), 'baustein:ERP-6')).toMatchObject({ status: 'aktiv', nummer: 'F-14' })
    // ohne Nummer zurück zum Vorschlag
    p = verwirf(p, 'katalog:N-BF-2')
    expect(nachId(stelleWiederHer(p, 'katalog:N-BF-2'), 'katalog:N-BF-2').status).toBe('vorschlag')
    expect(stelleWiederHer(p, 'katalog:N-DS-1')).toBe(p)
    expect(uebernimm(p, 'gibt-es-nicht')).toBe(p)
  })

  it('legt eigene Anforderungen aktiv mit Nummer an und löscht sie', () => {
    const p = lieferdienstAuswahl()
    const { projekt, id } = neueEigeneAnforderung(p, 'anbieter', { titel: 'Schulung vor Ort', text: 'Der Anbieter sollte vor Ort schulen.', abnahme: 'Schulungsplan liegt vor.' })
    expect(nachId(projekt, id)).toMatchObject({ nummer: 'A-04', status: 'aktiv', prioritaet: 'soll', punkte: 2, herkunft: { art: 'eigene' } })
    expect(id).toMatch(/^eigene:/)
    expect(loescheEigene(projekt, id).anforderungen).toHaveLength(p.anforderungen.length)
    expect(loescheEigene(projekt, 'katalog:N-DS-1')).toBe(projekt)
    expect(nachId(setzeNotiz(projekt, id, 'mit Robin klären'), id).notiz).toBe('mit Robin klären')
  })

  it('zählt Änderungen erst nach Beginn der Bewertung (G5)', () => {
    let p = lieferdienstAuswahl()
    p = setzePrioritaet(p, nachNummer(p, 'F-01').id, 'soll')
    expect(p.gewichtung.aenderungenNachBewertung).toBe(0)
    p = { ...p, bewertungBegonnenAm: '2026-11-12T09:00:00.000Z' }
    p = setzePunkte(p, nachNummer(p, 'F-02').id, 5)
    p = setzePrioritaet(p, nachNummer(p, 'F-03').id, 'kann')
    p = uebernimm(p, 'baustein:ERP-1')
    expect(p.gewichtung.aenderungenNachBewertung).toBe(3)
    // Texte und Vorschläge, die nicht aktiv werden, zählen nicht
    p = setzeTexte(p, nachNummer(p, 'F-02').id, { abnahme: 'Test: neu.' })
    p = setzePrioritaet(p, 'baustein:ERP-2', 'kann')
    p = setzePunkte(p, nachNummer(p, 'F-02').id, 5)
    expect(p.gewichtung.aenderungenNachBewertung).toBe(3)
  })

  it('ersetzt nur das Modalverb als ganzes Wort', () => {
    expect(ersetzeModalverb('Die Software muss löschen, was gelöscht werden müssen.', 'muss', 'kann')).toBe('Die Software kann löschen, was gelöscht werden müssen.')
    expect(ersetzeModalverb('Der Anbieter sollte liefern.', 'soll', 'muss')).toBe('Der Anbieter muss liefern.')
    expect(ersetzeModalverb('Ohne Verb.', 'soll', 'muss')).toBe('Ohne Verb.')
  })
})
