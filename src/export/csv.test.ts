import { describe, expect, it } from 'vitest'
import { lieferdienstAuswahl } from '../testhilfen/projekte'
import { anbieterFragebogen, BOM, csvFeld, csvZeile, fragebogenDateiname, KOPFZEILE } from './csv'

describe('CSV-Anbieterfragebogen (6.15)', () => {
  it('schreibt den Fragebogen des Lieferdienstes (T-C1)', () => {
    const csv = anbieterFragebogen(lieferdienstAuswahl())
    expect(csv.startsWith(BOM)).toBe(true)
    expect(new TextEncoder().encode(csv).slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]))
    const zeilen = csv.slice(1).split('\r\n')
    // CRLF auch nach der letzten Zeile
    expect(zeilen.pop()).toBe('')
    expect(zeilen).toHaveLength(36)
    expect(zeilen[0]).toBe('Nr.;Gruppe;Titel;Anforderung;Priorität;Abnahmekriterium;Erfüllt (ja/teilweise/nein);Erläuterung des Anbieters;Fundstelle im Angebot')
    expect(zeilen[0].split(';')).toEqual([...KOPFZEILE])
    expect(zeilen[1]).toBe(
      'F-01;Funktionen;Bestellung in Warenwirtschaft erfassen;Die Software muss die Aufgabe „Bestellung in Warenwirtschaft erfassen“ für die Rolle Innendienst unterstützen.;Muss;Test mit Beispieldaten: Eine Person der Rolle Innendienst erledigt „Bestellung in Warenwirtschaft erfassen“ vollständig in der Software, ohne Daten abzutippen, in höchstens 4 Minuten.;;;',
    )
    // nach Gruppe und Nummer: F, S, R, M, D, G, B, A
    expect(zeilen.slice(1).map((z) => z.split(';')[0])).toEqual([
      'F-01', 'F-02', 'F-03', 'F-04', 'F-05', 'F-06', 'F-07', 'F-08',
      'S-01', 'S-02', 'R-01', 'R-02', 'M-01', 'M-02', 'M-03', 'M-04',
      'D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06', 'D-07',
      'G-01', 'G-02', 'G-03', 'G-04', 'B-01', 'B-02', 'B-03', 'B-04', 'B-05', 'A-01', 'A-02', 'A-03',
    ])
  })

  it('setzt Felder mit Trennzeichen, Anführungszeichen oder Umbruch in Anführungszeichen (T-C2)', () => {
    expect(csvFeld('a;b')).toBe('"a;b"')
    expect(csvFeld('Er sagte "ja"')).toBe('"Er sagte ""ja"""')
    expect(csvFeld('Zeile 1\nZeile 2')).toBe('"Zeile 1\nZeile 2"')
    expect(csvFeld('Zeile 1\r\nZeile 2')).toBe('"Zeile 1\r\nZeile 2"')
    expect(csvZeile(['x', 'a;"b"', ''])).toBe('x;"a;""b""";')
  })

  it('schützt vor Formeln (T-C3)', () => {
    expect(csvFeld('=SUMME(A1)')).toBe("'=SUMME(A1)")
    expect(csvFeld('-5 Tage')).toBe("'-5 Tage")
    expect(csvFeld('@x')).toBe("'@x")
    expect(csvFeld('+49 30')).toBe("'+49 30")
    expect(csvFeld('\tTab')).toBe("'\tTab")
    expect(csvFeld('\rx')).toBe('"\'\rx"')
    expect(csvFeld('5 - 3')).toBe('5 - 3')
  })

  it('bildet den Dateinamen aus dem Vorhaben', () => {
    const p = lieferdienstAuswahl()
    expect(fragebogenDateiname(p)).toBe('Neue Warenwirtschaft – Anbieterfragebogen.csv')
    p.rahmen.vorhaben = 'ERP: Auswahl? "2027" <neu> | a/b\\c'
    expect(fragebogenDateiname(p)).toBe('ERP Auswahl 2027 neu abc – Anbieterfragebogen.csv')
    p.rahmen.vorhaben = 'x'.repeat(100)
    expect(Array.from(fragebogenDateiname(p))).toHaveLength(80)
  })
})
