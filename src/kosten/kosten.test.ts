import { describe, expect, it } from 'vitest'
import { werteAus } from '../bewertung/auswertung'
import { neueKosten } from '../modell/projekt'
import type { AuswahlProjekt, Wirtschaftlichkeit } from '../modell/typen'
import { abcProjekt } from '../testhilfen/abc'
import { lieferdienstAuswahl, rahmenLProjekt } from '../testhilfen/projekte'
import { amortisationsjahr, berechneKosten, kostenJeAngebot, pruefeKosten } from './kosten'
import { kostenVorschlaege, standardsAusModell, uebernimmVorschlag } from './vorschlaege'

/** Angebot A des Beispiels ABC mit den Annahmen aus T-K1 (7 Benutzer, 45 €, 8 Stunden je Personentag, 5 Jahre). */
function angebotA(w: Partial<Wirtschaftlichkeit> = {}) {
  const p = abcProjekt()
  return berechneKosten(p.angebote[0].kosten, { ...p.wirtschaftlichkeit, ...w })
}

describe('Gesamtkosten (K1 bis K4)', () => {
  it('rechnet einmalige, laufende und Gesamtkosten von Angebot A (T-K1)', () => {
    // E = 6.000 + 2.000 + 1.500 + 10 · 8 · 45 + 4 · 7 · 45 = 9.500 + 3.600 + 1.260 = 14.360
    // L = 600 + 39 · 7 · 12 + 2 · 12 · 45 = 600 + 3.276 + 1.080 = 4.956
    const k = angebotA()
    expect(k.einmalig).toBeCloseTo(14360, 9)
    expect(k.laufend).toEqual([4956, 4956, 4956, 4956, 4956])
    expect(k.tco).toBeCloseTo(39140, 9)
    expect(k).toMatchObject({ barwert: null, kapitalwert: null, amortisationJahr: null })
  })

  it('rechnet die Angebote B und C des Beispiels wie von Hand', () => {
    const kosten = kostenJeAngebot(abcProjekt())
    // B: 8.000 + 5 · 4.600; C: 5.000 + 5 · 3.000
    expect(kosten.get('angebot-b')!.tco).toBe(31000)
    expect(kosten.get('angebot-c')!.tco).toBe(20000)
  })

  it('steigert die laufenden Kosten jährlich (T-K2)', () => {
    // L_t = 4.956 · 1,03^(t−1); TCO = 14.360 + 26.312,08 = 40.672,08
    const k = angebotA({ preissteigerungProzent: 3 })
    const erwartet = [4956, 5104.68, 5257.8204, 5415.555012, 5578.02166236]
    k.laufend.forEach((l, i) => expect(l).toBeCloseTo(erwartet[i], 6))
    expect(k.tco).toBeCloseTo(40672.08, 2)
  })

  it('rechnet über 1 bis 10 Jahre', () => {
    expect(angebotA({ jahre: 1 }).tco).toBeCloseTo(14360 + 4956, 9)
    expect(angebotA({ jahre: 10 }).laufend).toHaveLength(10)
    // ungültige Jahre: gerechnet wird mit dem nächsten gültigen Wert, K9 meldet den Fehler
    expect(angebotA({ jahre: 0 }).laufend).toHaveLength(1)
    expect(angebotA({ jahre: 12 }).laufend).toHaveLength(10)
  })
})

describe('Barwert, Kapitalwert, Amortisation (K5 bis K7)', () => {
  it('zinst die laufenden Kosten ab (T-K3)', () => {
    // Rentenbarwertfaktor 5 Jahre, 5 %: (1 − 1,05^−5) / 0,05 = 4,329477; 14.360 + 4.956 · 4,329477 = 35.816,89
    expect(angebotA({ zinsProzent: 5 }).barwert).toBeCloseTo(35816.89, 2)
    expect(angebotA({ zinsProzent: 0 }).barwert).toBeCloseTo(39140, 9)
  })

  it('rechnet Kapitalwert und Amortisation mit Nutzen (T-K4)', () => {
    // KW = −14.360 + (20.000 − 4.956) · 4,329477 = 50.772,65
    // Jahr 1: 15.044 / 1,05 = 14.327,62 < 14.360; Jahr 2: + 13.645,35 → 27.972,97
    const k = angebotA({ zinsProzent: 5, nutzenProJahrEuro: 20000 })
    expect(k.kapitalwert).toBeCloseTo(50772.65, 2)
    expect(k.amortisationJahr).toBe(2)
  })

  it('meldet keine Amortisation, wenn der Nutzen nicht reicht (T-K5)', () => {
    // KW = −14.360 + (4.000 − 4.956) · 4,329477 = −14.360 − 4.138,98 = −18.498,98
    const k = angebotA({ zinsProzent: 5, nutzenProJahrEuro: 4000 })
    expect(k.kapitalwert).toBeCloseTo(-18498.98, 2)
    expect(k.amortisationJahr).toBeNull()
  })

  it('rechnet die Amortisation ohne Zins mit i = 0, aber keinen Kapitalwert', () => {
    // 20.000 − 4.956 = 15.044 ≥ 14.360 schon im ersten Jahr
    const k = angebotA({ nutzenProJahrEuro: 20000 })
    expect(k).toMatchObject({ amortisationJahr: 1, kapitalwert: null, barwert: null })
  })

  it('zählt genau erreichte Einführungskosten als bezahlt', () => {
    expect(amortisationsjahr(1000, [500, 500, 500], 1000, 0)).toBe(2)
    expect(amortisationsjahr(0, [100], 100, 0)).toBe(1)
    expect(amortisationsjahr(1000, [500, 500], 999, 0)).toBeNull()
  })
})

describe('Prüfungen (K8, K9)', () => {
  it('meldet „Zins fehlt“ und negative Beträge als Fehler (T-K6)', () => {
    const p = abcProjekt()
    p.wirtschaftlichkeit.kostenbasis = 'barwert'
    p.angebote[1].kosten.einmalig[0].betragEuro = -1
    const befunde = werteAus(p).befunde.filter((b) => b.code === 'K8' || b.code === 'K9')
    expect(befunde.map((b) => [b.schwere, b.code])).toEqual([
      ['fehler', 'K8'],
      ['fehler', 'K9'],
    ])
    expect(befunde[0].text).toContain('Zins fehlt')
    expect(befunde[1].text).toBe('Anbieter B: negativer Betrag bei „Einführung“. Alle Beträge sind netto und nicht negativ.')
    expect(befunde[1].bezug).toBe('angebot-b')
  })

  it('prüft Jahre, Zins, Preissteigerung und die Annahmen', () => {
    const texte = (w: Partial<Wirtschaftlichkeit>) => pruefeKosten({ angebote: [], wirtschaftlichkeit: { ...abcProjekt().wirtschaftlichkeit, ...w } }).map((b) => b.text)
    expect(texte({})).toEqual([])
    for (const jahre of [0, 11, 2.5]) expect(texte({ jahre })).toEqual(['Der Betrachtungszeitraum muss 1 bis 10 ganze Jahre betragen.'])
    expect(texte({ jahre: 1, zinsProzent: -50, preissteigerungProzent: -50 })).toEqual([])
    expect(texte({ zinsProzent: -50.1 })).toEqual(['Der Kalkulationszins darf nicht unter −50 % liegen.'])
    expect(texte({ preissteigerungProzent: -60 })).toEqual(['Die Preissteigerung darf nicht unter −50 % liegen.'])
    expect(texte({ benutzer: -1, budgetEuro: -5 })).toEqual(['Annahmen: negativer Betrag bei „Benutzer“.', 'Annahmen: negativer Betrag bei „Budget“.'])
  })

  it('prüft Preis je Benutzer und interne Aufwände', () => {
    const p = abcProjekt()
    p.angebote = [{ ...p.angebote[0], kosten: { ...neueKosten(), preisJeBenutzerMonatEuro: -1, internBetriebStundenMonat: Number.NaN } }]
    expect(pruefeKosten(p).map((b) => b.text)).toEqual([
      'Anbieter A: negativer Betrag bei „Preis je Benutzer und Monat“. Alle Beträge sind netto und nicht negativ.',
      'Anbieter A: negativer Betrag bei „Betrieb intern (Stunden im Monat)“. Alle Beträge sind netto und nicht negativ.',
    ])
  })
})

describe('Vorschläge (K10)', () => {
  it('schlägt Benutzer, Stundensatz, Stunden und Nutzen aus dem Lieferdienst vor (T-K7)', () => {
    // Rollen im Umfang: Innendienst 38 € · 4, Disposition 45 · 1, Buchhaltung 48 · 1, Niederlassungsleitung 65 · 1 → 310 / 7 = 44,29
    expect(kostenVorschlaege(lieferdienstAuswahl())).toEqual({ benutzer: 7, internerStundensatzEuro: 44, stundenProPersonentag: 8, nutzenProJahrEuro: 100920 })
  })

  it('nimmt ohne Prozessmodell feste Werte', () => {
    expect(kostenVorschlaege(rahmenLProjekt())).toEqual({ benutzer: null, internerStundensatzEuro: 45, stundenProPersonentag: 8, nutzenProJahrEuro: null })
  })

  it('übernimmt einen Vorschlag auf Knopfdruck', () => {
    const p = lieferdienstAuswahl()
    expect(uebernimmVorschlag(p, 'nutzenProJahrEuro').wirtschaftlichkeit.nutzenProJahrEuro).toBe(100920)
    // ohne Vorschlag bleibt alles, wie es ist
    const ohne = rahmenLProjekt()
    expect(uebernimmVorschlag(ohne, 'benutzer')).toBe(ohne)
  })

  it('setzt nach dem Einlesen die Standardwerte aus dem Modell, aber keine eigenen Werte', () => {
    const p = lieferdienstAuswahl()
    expect(p.wirtschaftlichkeit).toMatchObject({ benutzer: 1, internerStundensatzEuro: 45, stundenProPersonentag: 8 })
    expect(standardsAusModell(p).wirtschaftlichkeit).toMatchObject({ benutzer: 7, internerStundensatzEuro: 44, stundenProPersonentag: 8, nutzenProJahrEuro: null })
    const eigen: AuswahlProjekt = { ...p, wirtschaftlichkeit: { ...p.wirtschaftlichkeit, benutzer: 5, internerStundensatzEuro: 50 } }
    expect(standardsAusModell(eigen).wirtschaftlichkeit).toMatchObject({ benutzer: 5, internerStundensatzEuro: 50 })
    expect(standardsAusModell(rahmenLProjekt()).wirtschaftlichkeit.benutzer).toBe(1)
  })
})
