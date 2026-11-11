import { describe, expect, it } from 'vitest'
import readme from '../../README.md?raw'
import { stabilitaetText } from '../bewertung/sensitivitaet'
import { berechneGesamt } from '../entscheidung/gesamt'
import { alsJson } from '../modell/speicher'
import { euro, normalisiereLeerraum, nutzwert } from '../modell/zahlformat'
import { baueFallbeispiel } from '../testhilfen/fallbeispiel'
import { beispielProjekt } from './beispiel'

describe('Fallbeispiel „Lieferdienst sucht Warenwirtschaft“ (5.4)', () => {
  it('stimmt mit testdaten/beispiel-lieferdienst.auswahllotse überein (neu schreiben: npx vitest run -u)', async () => {
    await expect(`${alsJson(await baueFallbeispiel())}\n`).toMatchFileSnapshot('../../testdaten/beispiel-lieferdienst.auswahllotse')
  })

  it('lädt die Datei als Beispielprojekt der App', async () => {
    expect(beispielProjekt()).toEqual(await baueFallbeispiel())
  })

  it('ergibt Nutzwerte, Gesamtkosten und Empfehlung wie in der README (T-B1)', () => {
    const p = beispielProjekt()
    const g = berechneGesamt(p)
    expect(g.pruefung).toMatchObject({ aktiv: 42, offeneVorschlaege: 0 })
    expect(g.pruefung.mussAnteil).toBeCloseTo(23 / 42, 9)
    const [nord, sued, west] = g.auswertung.ergebnisse
    // Nord: Funktionen 97/12, Schnittstellen 10, Mengen 8, Datenschutz 9, Ordnung 8, Betrieb 26/3, Barrierefreiheit 5, Anbieter 9,6
    expect(nord.nutzwert).toBeCloseTo(8.519167, 6)
    expect(west.nutzwert).toBeCloseTo(7.703333, 6)
    expect(sued).toMatchObject({ gueltig: false, ausschluss: ['Muss-Kriterium G-03 nicht erfüllt'], rang: null })
    // Nord: E = 9.100 + 15 · 8 · 44 + 6 · 7 · 44 = 16.228; L₁ = 1.200 + 59 · 7 · 12 + 2 · 12 · 44 = 7.212; 7.212 · 5,309136 = 38.289,49
    expect(nord.kosten.einmalig).toBe(16228)
    expect(nord.kosten.tco).toBeCloseTo(54517.49, 2)
    // West: E = 37.100 + 25 · 8 · 44 + 8 · 7 · 44 = 48.364; L₁ = 4.200 + 8 · 12 · 44 = 8.424
    expect(west.kosten.tco).toBeCloseTo(93088.16, 2)
    // Süd: E = 2.000 + 10 · 8 · 44 + 4 · 7 · 44 = 6.752; L₁ = 45 · 7 · 12 + 3 · 12 · 44 = 5.364
    expect(sued.kosten.tco).toBeCloseTo(35230.2, 2)
    expect([nord.kosten.amortisationJahr, west.kosten.amortisationJahr]).toEqual([1, 2])
    expect(g.auswertung.empfehlungId).toBe('angebot-nord')
    expect(g.auswertung.vorlaeufig).toBe(false)
    expect(g.befunde.filter((b) => b.schwere !== 'hinweis')).toEqual([])
    expect(g.final.moeglich).toBe(true)

    // Die README nennt dieselben Zahlen
    const text = normalisiereLeerraum(readme)
    const zahlen = [
      nutzwert(nord.nutzwert),
      nutzwert(west.nutzwert),
      nutzwert(sued.nutzwert),
      euro(nord.kosten.tco),
      euro(west.kosten.tco),
      euro(sued.kosten.tco),
      euro(nord.kosten.kapitalwert!),
      euro(west.kosten.kapitalwert!),
    ]
    for (const z of zahlen) expect(text).toContain(normalisiereLeerraum(z))
    const funktionen = g.auswertung.stabilitaet.find((s) => s.gruppe === 'funktion')!
    expect(stabilitaetText(funktionen)).toBe('Funktionen: 0,0 bis 57,1 %, heute 35,0 %')
    expect(text).toContain('57,1 %')
  })
})
