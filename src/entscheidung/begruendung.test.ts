import { describe, expect, it } from 'vitest'
import { werteAus } from '../bewertung/auswertung'
import { normalisiereLeerraum } from '../modell/zahlformat'
import type { AuswahlProjekt, Bewertung } from '../modell/typen'
import { abcProjekt } from '../testhilfen/abc'
import { begruendungsEntwurf, begruendungsSaetze, mussGrund } from './begruendung'
import { finalMoeglich, gewaehlteId, loescheRisiko, neuesRisiko, pruefeEntscheidung, setzeEntscheidungsStatus, setzeRisiko, waehleAngebot } from './entscheidung'
import { berechneGesamt } from './gesamt'

const saetze = (p: AuswahlProjekt) => begruendungsSaetze(p, werteAus(p)).map(normalisiereLeerraum)

function bewerte(p: AuswahlProjekt, angebot: string, anforderung: string, teil: Partial<Bewertung>): AuswahlProjekt {
  return { ...p, angebote: p.angebote.map((a) => (a.id === angebot ? { ...a, bewertungen: { ...a.bewertungen, [anforderung]: { ...a.bewertungen[anforderung], ...teil } } } : a)) }
}

describe('Begründungsentwurf (6.13)', () => {
  it('schreibt die Sätze 1, 2a, 3a, 4, 6 und 7b für das Beispiel ABC (T-R1)', () => {
    expect(saetze(abcProjekt())).toEqual([
      'Empfohlen wird Anbieter A (Produkt A).',
      'Das Angebot erfüllt das einzige Muss-Kriterium.',
      'Es erreicht mit 7,30 von 10 Punkten den höchsten Nutzwert, 0,10 Punkte vor Anbieter B.',
      'Die Kosten über 5 Jahre betragen 39.140 € (nominal), Platz 2 von 2.',
      'Ausgeschieden: Anbieter C (Muss-Kriterium F-03 nicht erfüllt).',
      // Funktionen [0; 0,516129] bei 50 %: Abstand 1,6 Prozentpunkte nach oben
      'Das Ergebnis ist knapp: Schon 1,6 Prozentpunkte mehr Gewicht für „Funktionen“ ändern die Empfehlung.',
    ])
  })

  it('begründet die Regel Preis-Leistung mit € je Punkt und stabilen Bereichen (3c, 7a)', () => {
    const p = abcProjekt()
    p.entscheidung.regel = 'preis_leistung'
    expect(saetze(p)).toEqual([
      'Empfohlen wird Anbieter B (Produkt B).',
      'Das Angebot erfüllt das einzige Muss-Kriterium.',
      // 31.000 € / 7,2 Punkte
      'Es hat mit 4.305,56 € je Nutzwertpunkt das beste Preis-Leistungs-Verhältnis unter den Angeboten mit mindestens 5 Punkten.',
      'Die Kosten über 5 Jahre betragen 31.000 € (nominal), Platz 1 von 2.',
      'Ausgeschieden: Anbieter C (Muss-Kriterium F-03 nicht erfüllt).',
      // T-S2: [0,266561; 1], [0; 0,757405], [0; 0,461509]
      'Die Empfehlung bleibt gleich, solange die Gewichte in diesen Bereichen liegen: Funktionen 26,7–100,0 %; Betrieb und Support 0,0–75,7 %; Anbieter und Einführung 0,0–46,2 %.',
    ])
  })

  it('nennt Kapitalwert und Amortisation, wenn ein Nutzen gesetzt ist (Satz 5)', () => {
    const p = abcProjekt()
    p.wirtschaftlichkeit = { ...p.wirtschaftlichkeit, zinsProzent: 5, nutzenProJahrEuro: 20000 }
    // T-K4: 50.772,65 € → 50.773 €; bezahlt im 2. Jahr
    expect(saetze(p)).toContain('Bei 20.000 € Nutzen pro Jahr beträgt der Kapitalwert 50.773 €; die Einführung hat sich im 2. Jahr bezahlt gemacht.')
    p.wirtschaftlichkeit.nutzenProJahrEuro = 4000
    expect(saetze(p)).toContain('Bei 4.000 € Nutzen pro Jahr beträgt der Kapitalwert -18.499 €; die Einführung macht sich in 5 Jahren nicht bezahlt.')
    // ohne Zins kein Kapitalwert; Amortisation mit i = 0
    p.wirtschaftlichkeit = { ...p.wirtschaftlichkeit, zinsProzent: null, nutzenProJahrEuro: 20000, jahre: 1 }
    expect(saetze(p)).toContain('Bei 20.000 € Nutzen pro Jahr hat sich die Einführung im 1. Jahr bezahlt gemacht.')
    p.wirtschaftlichkeit.nutzenProJahrEuro = 0
    expect(saetze(p)).toContain('Bei 0 € Nutzen pro Jahr macht sich die Einführung in 1 Jahr nicht bezahlt.')
  })

  it('nennt den Barwert als Kostenbasis mit Zins', () => {
    const p = abcProjekt()
    p.wirtschaftlichkeit = { ...p.wirtschaftlichkeit, zinsProzent: 5, kostenbasis: 'barwert' }
    // T-K3: 35.816,89 €; B: 8.000 + 4.600 · 4,329477 = 27.915,59 €
    expect(saetze(p)).toContain('Die Kosten über 5 Jahre betragen 35.817 € (Barwert bei 5 % Zins), Platz 2 von 2.')
  })

  it('weist auf Änderungen nach Bewertungsbeginn und ein vorläufiges Ergebnis hin (Sätze 2b, 8, 9)', () => {
    let p = bewerte(abcProjekt(), 'angebot-a', 'eigene:f-03', { ko: 'offen' })
    p = bewerte(p, 'angebot-b', 'eigene:f-02', { punkte: null })
    p.gewichtung = { ...p.gewichtung, aenderungenNachBewertung: 2 }
    const s = saetze(p)
    expect(s).toContain('Beim einzigen Muss-Kriterium steht die Prüfung noch aus.')
    expect(s).toContain('Hinweis: Gewichte oder Regel wurden nach Beginn der Bewertung 2-mal geändert.')
    expect(s[s.length - 1]).toBe('Das Ergebnis ist vorläufig: 1 Bewertung fehlt, 1 K.-o.-Prüfung ist offen.')
  })

  it('zählt mehrere Muss-Kriterien in Mehrzahl', () => {
    // B-01 wird Muss; Betrieb ist dann kein Hauptkriterium mehr, die Gewichte werden neu verteilt
    const p = abcProjekt()
    p.anforderungen = p.anforderungen.map((a) => (a.nummer === 'B-01' ? { ...a, prioritaet: 'muss' as const } : a))
    p.gewichtung.direktProzent = { funktion: 70, anbieter: 30 }
    p.angebote = p.angebote.map((a) => ({ ...a, bewertungen: { ...a.bewertungen, 'eigene:b-01': { ko: 'erfuellt', punkte: null, fundstelle: '', notiz: '' } } }))
    // A: 0,7 · 7 + 0,3 · 10 = 7,9; B: 0,7 · 10 + 0,3 · 5 = 8,5
    expect(saetze(p).slice(0, 2)).toEqual(['Empfohlen wird Anbieter B (Produkt B).', 'Das Angebot erfüllt alle 2 Muss-Kriterien.'])
    expect(saetze(bewerte(p, 'angebot-b', 'eigene:b-01', { ko: 'offen' }))[1]).toBe('Bei 1 von 2 Muss-Kriterien steht die Prüfung noch aus.')
  })

  it('kennt das einzige gültige Angebot und den Gleichstand an der Spitze (3b, D1)', () => {
    const allein = bewerte(abcProjekt(), 'angebot-b', 'eigene:f-03', { ko: 'nicht_erfuellt' })
    const s = saetze(allein)
    expect(s[2]).toBe('Es ist das einzige gültige Angebot; Nutzwert 7,30 von 10 Punkten.')
    expect(s).toContain('Ausgeschieden: Anbieter B (Muss-Kriterium F-03 nicht erfüllt); Anbieter C (Muss-Kriterium F-03 nicht erfüllt).')
    // A bekommt die Punkte von B: beide 7,20, B ist günstiger
    let gleich = bewerte(abcProjekt(), 'angebot-a', 'eigene:f-01', { punkte: 10 })
    gleich = bewerte(gleich, 'angebot-a', 'eigene:f-02', { punkte: 10 })
    gleich = bewerte(gleich, 'angebot-a', 'eigene:b-01', { punkte: 4 })
    gleich = bewerte(gleich, 'angebot-a', 'eigene:a-01', { punkte: 5 })
    const t = saetze(gleich)
    expect(t[0]).toBe('Empfohlen wird Anbieter B (Produkt B).')
    expect(t[2]).toBe('Es liegt mit 7,20 von 10 Punkten gleichauf mit Anbieter A und ist das günstigere Angebot.')
  })

  it('nennt Budget und Mindestnutzwert als Grund des Ausscheidens', () => {
    const p = abcProjekt()
    p.wirtschaftlichkeit = { ...p.wirtschaftlichkeit, budgetEuro: 35000, budgetAlsKo: true }
    expect(saetze(p)).toContain('Ausgeschieden: Anbieter A (über Budget); Anbieter C (Muss-Kriterium F-03 nicht erfüllt).')
    const q = abcProjekt()
    q.entscheidung = { ...q.entscheidung, regel: 'preis_leistung', mindestNutzwert: 7.25 }
    expect(saetze(q)).toContain('Ausgeschieden: Anbieter B (Nutzwert 7,20 unter dem Mindestnutzwert 7,25); Anbieter C (Muss-Kriterium F-03 nicht erfüllt).')
  })

  it('kürzt lange Listen nicht erfüllter Muss-Kriterien', () => {
    expect(mussGrund(['F-01', 'F-02'])).toBe('Muss-Kriterien F-01 und F-02 nicht erfüllt')
    expect(mussGrund(['F-01', 'F-02', 'F-03'])).toBe('Muss-Kriterien F-01, F-02 und F-03 nicht erfüllt')
    expect(mussGrund(['F-01', 'F-02', 'F-03', 'F-04', 'F-05'])).toBe('Muss-Kriterien F-01, F-02, F-03 und 2 weitere nicht erfüllt')
  })

  it('gibt ohne Empfehlung keinen Entwurf', () => {
    const p = abcProjekt()
    p.gewichtung.direktProzent = { funktion: 50, betrieb: 30, anbieter: 10 }
    expect(begruendungsEntwurf(p, werteAus(p))).toBe('')
  })
})

describe('Wahl und Status der Entscheidung (D4, D5)', () => {
  it('warnt, wenn die Wahl ohne Begründung von der Empfehlung abweicht (T-R5)', () => {
    const p = waehleAngebot(abcProjekt(), 'angebot-b')
    const w = werteAus(p)
    expect(gewaehlteId(p, w)).toBe('angebot-b')
    expect(pruefeEntscheidung(p, w)).toEqual([{ schwere: 'warnung', code: 'D4', text: 'Die Wahl weicht von der Empfehlung ab; bitte die Begründung selbst schreiben.', bezug: 'angebot-b' }])
    const begruendet = { ...p, entscheidung: { ...p.entscheidung, begruendung: 'B ist schneller verfügbar.' } }
    expect(pruefeEntscheidung(begruendet, w)).toEqual([])
    // die Empfehlung selbst braucht keine eigene Begründung
    expect(pruefeEntscheidung(abcProjekt(), werteAus(abcProjekt()))).toEqual([])
  })

  it('warnt bei einem ungültigen gewählten Angebot und folgt sonst der Empfehlung', () => {
    const p = { ...waehleAngebot(abcProjekt(), 'angebot-c'), entscheidung: { ...abcProjekt().entscheidung, gewaehltId: 'angebot-c', begruendung: 'Preis' } }
    expect(pruefeEntscheidung(p, werteAus(p)).map((b) => [b.code, b.text])).toEqual([['D6', 'Das gewählte Angebot Anbieter C ist ungültig (Muss-Kriterium F-03 nicht erfüllt).']])
    const geloescht = waehleAngebot(abcProjekt(), 'gibt-es-nicht')
    expect(gewaehlteId(geloescht, werteAus(geloescht))).toBe('angebot-a')
  })

  it('erlaubt „final“ nur ohne Fehler und mit gewähltem Angebot (D5)', () => {
    expect(finalMoeglich([], 'x')).toEqual({ moeglich: true, grund: null })
    expect(finalMoeglich([], null).moeglich).toBe(false)
    const p = abcProjekt()
    p.gewichtung.direktProzent = { funktion: 50, betrieb: 30, anbieter: 10 }
    const g = berechneGesamt(p)
    expect(g.final).toEqual({ moeglich: false, grund: 'Erst den Fehler beheben: Summe ist 90 %' })
    expect(setzeEntscheidungsStatus(p, 'final', g.final, '2026-11-12T08:00:00.000Z')).toBe(p)
    const ok = abcProjekt()
    const gesamt = berechneGesamt(ok)
    expect(gesamt.final.moeglich).toBe(true)
    const final = setzeEntscheidungsStatus(ok, 'final', gesamt.final, '2026-11-12T08:00:00.000Z')
    expect(final.entscheidung).toMatchObject({ status: 'final', datum: '2026-11-12T08:00:00.000Z' })
    expect(setzeEntscheidungsStatus(final, 'entwurf', gesamt.final, 'x').entscheidung).toMatchObject({ status: 'entwurf', datum: null })
  })

  it('warnt, wenn eine finale Entscheidung später Fehler bekommt (D5)', () => {
    const ok = abcProjekt()
    const final = setzeEntscheidungsStatus(ok, 'final', berechneGesamt(ok).final, '2026-11-12T08:00:00.000Z')
    expect(berechneGesamt(final).befunde.filter((b) => b.code === 'D5')).toEqual([])
    // danach ändert jemand die Gewichte: Summe 90 % ist ein Fehler, „final“ gilt nicht mehr
    const spaeter = { ...final, gewichtung: { ...final.gewichtung, direktProzent: { funktion: 50, betrieb: 30, anbieter: 10 } } }
    const g = berechneGesamt(spaeter)
    expect(g.befunde.filter((b) => b.code === 'D5')).toEqual([
      {
        schwere: 'warnung',
        code: 'D5',
        text: 'Die Entscheidung steht auf „final“, aber das Projekt hat inzwischen Fehler. Bitte die Fehler beheben oder den Status auf „Entwurf“ zurücksetzen.',
        bezug: null,
      },
    ])
  })

  it('verwaltet Risiken mit Maßnahmen', () => {
    const { projekt, id } = neuesRisiko(abcProjekt(), 'Datenübernahme dauert länger')
    const mit = setzeRisiko(projekt, id, { massnahme: 'Probeübernahme vor Vertragsschluss' })
    expect(mit.entscheidung.risiken).toEqual([{ id, text: 'Datenübernahme dauert länger', massnahme: 'Probeübernahme vor Vertragsschluss' }])
    expect(loescheRisiko(mit, id).entscheidung.risiken).toEqual([])
  })

  it('sammelt alle Befunde, Fehler zuerst', () => {
    const p = abcProjekt()
    p.wirtschaftlichkeit.budgetEuro = 35000
    p.anforderungen[0] = { ...p.anforderungen[0], abnahme: '' }
    const g = berechneGesamt(p)
    expect(g.befunde.map((b) => b.code)).toEqual(['P4', 'N2'])
    expect(g.gewaehltId).toBe('angebot-a')
    expect(g.kriterien.haupt).toEqual(['funktion', 'betrieb', 'anbieter'])
  })
})
