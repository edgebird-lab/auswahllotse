import { describe, expect, it } from 'vitest'
import paketText from '../../package.json?raw'
import { beispielProjekt } from '../beispiel/beispiel'
import { dateinameBeratungsakte, leseBeratungsakte, pruefeBeratungsakte, serialisiereBeratungsakte, type Beratungsakte } from '../beratungsakte/beratungsakte'
import { SCHEMA } from '../beratungsakte/schema'
import schemaText from '../beratungsakte/beratungsakte-v1.schema.json?raw'
import { berechneGesamt } from '../entscheidung/gesamt'
import { neuesArbeitsprojekt } from '../lastenheft/aenderungen'
import type { AuswahlProjekt } from '../modell/typen'
import { VERSION } from '../version'
import { APP_KENNUNG, beratungsakteAusProjekt, mandantAusProjekt, SCHWERE_IN_AKTE } from './beratungsakte'

const JETZT = new Date(2026, 10, 13, 12, 0, 0)

function akteVon(projekt: AuswahlProjekt, mandant = 'Lieferdienst Beispiel GmbH'): Beratungsakte {
  return beratungsakteAusProjekt({ projekt, mandant: { name: mandant }, jetzt: JETZT })
}

function akteDesBeispiels(): Beratungsakte {
  const projekt = beispielProjekt()
  return beratungsakteAusProjekt({ projekt, mandant: { name: mandantAusProjekt(projekt) }, jetzt: JETZT })
}

function gueltigOhneHinweise(akte: Beratungsakte) {
  const ergebnis = pruefeBeratungsakte(JSON.parse(serialisiereBeratungsakte(akte)))
  expect(ergebnis.fehler).toEqual([])
  expect(ergebnis.hinweise).toEqual([])
  expect(ergebnis.gueltig).toBe(true)
}

const wert = (akte: Beratungsakte, kennung: string) => akte.kennzahlen.find((k) => k.kennung === kennung)?.wert
const kennzahl = (akte: Beratungsakte, kennung: string) => akte.kennzahlen.find((k) => k.kennung === kennung)!
const befund = (akte: Beratungsakte, kennung: string) => akte.befunde.find((b) => b.kennung === kennung)!
const ns = (x: { erweiterungen?: Record<string, Record<string, unknown>> }) => x.erweiterungen?.[APP_KENNUNG]

/** Beispiel mit geänderten Teilen, wie es die Oberfläche über `aendere` erzeugen würde. */
function abgewandelt(f: (p: AuswahlProjekt) => AuswahlProjekt): AuswahlProjekt {
  return f(beispielProjekt())
}

describe('Beratungsakte aus dem Fallbeispiel „Lieferdienst sucht Warenwirtschaft“', () => {
  it('ist gültig, ohne Hinweise, mit App, Version, Art und Titel', () => {
    const akte = akteDesBeispiels()
    gueltigOhneHinweise(akte)
    const paket = JSON.parse(paketText) as { version: string }
    expect(VERSION).toBe(paket.version)
    expect(akte.erzeugtVon).toEqual({ app: 'auswahllotse', name: 'Auswahl-Lotse', version: paket.version })
    expect(akte.erzeugtAm).toMatch(/^2026-11-13T12:00:00[+-]\d\d:\d\d$/)
    expect(akte.mandant).toEqual({ name: 'Lieferdienst Beispiel GmbH' })
    expect(akte.analyse).toEqual({ art: 'softwareauswahl', titel: 'Neue Warenwirtschaft', stand: '2026-11-13' })
    expect(ns(akte)).toEqual({
      softwareart: 'erp',
      regel: 'nutzwert',
      status: 'entwurf',
      empfehlungId: 'angebot-nord',
      gewaehltId: 'angebot-nord',
      vorlaeufig: false,
      gewichteProzent: { funktion: 35, schnittstelle: 10, menge: 5, datenschutz: 10, ordnung: 5, betrieb: 15, barrierefreiheit: 5, anbieter: 15 },
    })
  })

  it('enthält Anforderungen und Angebote wie T-B1 (42 aktiv, 23 Muss, Muss-Anteil 54,8 %)', () => {
    const akte = akteDesBeispiels()
    expect(akte.kennzahlen.slice(0, 7).map((k) => [k.kennung, k.wert, k.einheit])).toEqual([
      ['anforderungen-aktiv', 42, 'Anzahl'],
      ['anforderungen-muss', 23, 'Anzahl'],
      ['anforderungen-soll', 16, 'Anzahl'],
      ['anforderungen-kann', 3, 'Anzahl'],
      ['muss-anteil', 54.8, '%'],
      ['angebote', 3, 'Anzahl'],
      ['angebote-gueltig', 2, 'Anzahl'],
    ])
    expect(kennzahl(akte, 'muss-anteil').bewertung).toBe('gut')
  })

  it('enthält Nutzwert, Rang und Kosten je Angebot mit den nachgerechneten Werten (README, T-B1)', () => {
    const akte = akteDesBeispiels()
    // Nutzwerte 8,52 / 7,70 / 5,49; Gesamtkosten 54.517 / 93.088 / 35.230 €; Kapitalwerte 123.892 / 86.200 €
    expect(wert(akte, 'nutzwert:angebot-nord')).toBe(8.52)
    expect(wert(akte, 'nutzwert:angebot-west')).toBe(7.7)
    expect(wert(akte, 'nutzwert:angebot-sued')).toBe(5.49)
    expect(wert(akte, 'rang:angebot-nord')).toBe(1)
    expect(kennzahl(akte, 'rang:angebot-nord').bewertung).toBe('gut')
    expect(wert(akte, 'rang:angebot-west')).toBe(2)
    expect(wert(akte, 'rang:angebot-sued')).toBe('ausgeschieden')
    expect(wert(akte, 'einmalig:angebot-nord')).toBe(16228)
    expect(wert(akte, 'gesamtkosten:angebot-nord')).toBe(54517.49)
    expect(wert(akte, 'gesamtkosten:angebot-west')).toBe(93088.16)
    expect(wert(akte, 'gesamtkosten:angebot-sued')).toBe(35230.2)
    expect(Math.round(wert(akte, 'kapitalwert:angebot-nord') as number)).toBe(123892)
    expect(Math.round(wert(akte, 'kapitalwert:angebot-west') as number)).toBe(86200)
    expect(wert(akte, 'amortisation:angebot-nord')).toBe('im 1. Jahr')
    expect(wert(akte, 'amortisation:angebot-west')).toBe('im 2. Jahr')
    expect(kennzahl(akte, 'gesamtkosten:angebot-nord')).toMatchObject({ name: 'Gesamtkosten über 5 Jahre: Anbieter Nord', einheit: '€' })
    expect(kennzahl(akte, 'ko:angebot-nord')).toMatchObject({ wert: 'gültig', bewertung: 'gut' })
    expect(kennzahl(akte, 'ko:angebot-sued')).toMatchObject({ wert: 'ausgeschieden', bewertung: 'schlecht', erweiterungen: { auswahllotse: { ausschluss: ['Muss-Kriterium G-03 nicht erfüllt'] } } })
    // je Angebot acht Kennzahlen, je Hauptkriterium eine
    expect(akte.kennzahlen).toHaveLength(7 + 3 * 8 + 8)
  })

  it('enthält die Sensitivität: Funktionen stabil bis 57,1 %', () => {
    const akte = akteDesBeispiels()
    expect(kennzahl(akte, 'stabil:funktion')).toMatchObject({ name: 'Stabiler Bereich des Gewichts: Funktionen', wert: '0,0 bis 57,1 %, heute 35,0 %', bewertung: 'gut' })
    expect(ns(kennzahl(akte, 'stabil:funktion'))).toMatchObject({ gewicht: 0.35, von: 0, bis: 0.571 })
    expect(ns(kennzahl(akte, 'stabil:schnittstelle'))).toMatchObject({ abstand: null })
  })

  it('enthält die Befunde der Ergebnisliste, den Ausschluss von Süd und die Risiken', () => {
    const akte = akteDesBeispiels()
    expect(akte.befunde.map((b) => [b.kennung, b.schwere])).toEqual([
      ['P5:rollen', 'hinweis'],
      ['P8:gruppe:benutzer', 'hinweis'],
      ['N2:angebot-west', 'hinweis'],
      ['ausschluss:angebot-sued', 'hoch'],
      ['risiko:risiko-datenuebernahme', 'mittel'],
      ['risiko:risiko-doppelarbeit', 'mittel'],
    ])
    // Text wie in der Liste im Schritt „Ergebnis“ (mit Nummer der Anforderung), Fundstelle wie „Zur Stelle“
    expect(befund(akte, 'P5:rollen')).toMatchObject({ text: 'R-01: Der Text hat 44 Wörter; bitte aufteilen.', fundstelle: 'Schritt 3 · Anforderungen, Anforderung R-01' })
    expect(ns(befund(akte, 'P5:rollen'))).toEqual({ code: 'P5', schwere: 'hinweis' })
    expect(befund(akte, 'P8:gruppe:benutzer').fundstelle).toBe('Schritt 3 · Anforderungen, Gruppe „Benutzer, Rechte und Kontrollen“')
    expect(befund(akte, 'N2:angebot-west').text).toMatch(/^Anbieter West: über Budget \(93\.088\s€ statt höchstens 80\.000\s€\)\.$/)
    expect(befund(akte, 'N2:angebot-west').fundstelle).toBe('Schritt 5 · Angebote, Anbieter West')
    expect(befund(akte, 'ausschluss:angebot-sued')).toMatchObject({ text: 'Anbieter Süd scheidet aus: Muss-Kriterium G-03 nicht erfüllt.', fundstelle: 'Schritt 6 · Ergebnis, K.-o.-Prüfung' })
    expect(befund(akte, 'risiko:risiko-datenuebernahme')).toMatchObject({ text: 'Die Datenübernahme aus der alten Warenwirtschaft dauert länger als geplant.', fundstelle: 'Schritt 7 · Vorlagen, Risiko 1' })
  })

  it('enthält die Wahl von Nord und die Maßnahmen zu den Risiken mit Bezug', () => {
    const akte = akteDesBeispiels()
    expect(akte.massnahmen.map((m) => [m.kennung, m.prioritaet, m.befunde])).toEqual([
      ['wahl:angebot-nord', 'hoch', []],
      ['risiko:risiko-datenuebernahme', 'mittel', ['risiko:risiko-datenuebernahme']],
      ['risiko:risiko-doppelarbeit', 'mittel', ['risiko:risiko-doppelarbeit']],
    ])
    const wahl = akte.massnahmen[0]
    expect(wahl.text).toBe('Anbieter Nord (Warenwirtschaft Nord) wählen (Empfehlung nach der Regel „höchster Nutzwert“; Nutzwert 8,52 von 10).')
    expect(wahl.aufwand).toMatch(/^16\.228\s€ einmalig, Gesamtkosten über 5 Jahre 54\.517\s€$/)
    expect(ns(wahl)).toEqual({ art: 'wahl', angebotId: 'angebot-nord', abweichend: false, regel: 'nutzwert', status: 'entwurf', vorlaeufig: false })
    expect(akte.massnahmen[1]).toMatchObject({ text: 'Probeübernahme mit echten Daten vor Vertragsschluss.', aufwand: 'nicht geschätzt' })
  })

  it('jeder Bezug einer Maßnahme zeigt auf einen Befund der Akte', () => {
    const akte = akteDesBeispiels()
    const kennungen = new Set(akte.befunde.map((b) => b.kennung))
    for (const m of akte.massnahmen) for (const k of m.befunde) expect(kennungen.has(k), k).toBe(true)
  })
})

describe('Abbildung der Stufen', () => {
  it('bildet jede Schwere der App ab', () => {
    expect(SCHWERE_IN_AKTE).toEqual({ fehler: 'hoch', warnung: 'mittel', hinweis: 'hinweis' })
  })

  it('Fehler (G2) wird „hoch“; ohne Gewichte fehlen Nutzwert und Rang', () => {
    const p = abgewandelt((q) => ({ ...q, gewichtung: { ...q.gewichtung, direktProzent: { ...q.gewichtung.direktProzent, funktion: 30 } } }))
    const akte = akteVon(p)
    gueltigOhneHinweise(akte)
    expect(befund(akte, 'G2')).toMatchObject({ schwere: 'hoch', text: 'Summe ist 95 %.', fundstelle: 'Schritt 4 · Gewichtung' })
    expect(ns(befund(akte, 'G2'))).toEqual({ code: 'G2', schwere: 'fehler' })
    expect(akte.kennzahlen.some((k) => k.kennung?.startsWith('nutzwert:') || k.kennung?.startsWith('rang:') || k.kennung?.startsWith('euro-je-punkt:'))).toBe(false)
    expect(wert(akte, 'gesamtkosten:angebot-nord')).toBe(54517.49)
  })

  it('abweichende Wahl ohne Begründung (D4, Warnung) wird „mittel“, und die Wahl bezieht sich darauf', () => {
    const p = abgewandelt((q) => ({ ...q, entscheidung: { ...q.entscheidung, gewaehltId: 'angebot-west' } }))
    const akte = akteVon(p)
    gueltigOhneHinweise(akte)
    expect(befund(akte, 'D4:angebot-west')).toMatchObject({ schwere: 'mittel', fundstelle: 'Schritt 7 · Vorlagen, Anbieter West' })
    expect(akte.massnahmen[0]).toMatchObject({ kennung: 'wahl:angebot-west', prioritaet: 'hoch', befunde: ['D4:angebot-west'] })
    expect(akte.massnahmen[0].text).toContain('eigene Wahl, abweichend von der Empfehlung der Regel')
    expect(ns(akte.massnahmen[0])).toMatchObject({ abweichend: true })
  })

  it('ungültiges gewähltes Angebot (D6) und Budget als K.-o. (Ausschluss „hoch“)', () => {
    const p = abgewandelt((q) => ({
      ...q,
      wirtschaftlichkeit: { ...q.wirtschaftlichkeit, budgetAlsKo: true },
      entscheidung: { ...q.entscheidung, gewaehltId: 'angebot-west', begruendung: 'Bessere Schnittstellen.' },
    }))
    const akte = akteVon(p)
    gueltigOhneHinweise(akte)
    expect(befund(akte, 'ausschluss:angebot-west')).toMatchObject({ schwere: 'hoch', text: 'Anbieter West scheidet aus: über Budget.' })
    expect(befund(akte, 'D6:angebot-west').schwere).toBe('mittel')
    expect(akte.befunde.some((b) => b.kennung.startsWith('N2'))).toBe(false)
    expect(akte.massnahmen[0].befunde).toEqual(['D6:angebot-west'])
    expect(wert(akte, 'angebote-gueltig')).toBe(1)
  })

  it('vorläufige Empfehlung wird ein Befund „mittel“, auf den sich die Wahl bezieht', () => {
    const p = abgewandelt((q) => {
      const nord = q.angebote[0]
      const offen = Object.keys(nord.bewertungen).find((id) => nord.bewertungen[id].punkte !== null)!
      const bewertungen = { ...nord.bewertungen, [offen]: { ...nord.bewertungen[offen], punkte: null } }
      return { ...q, angebote: [{ ...nord, bewertungen }, ...q.angebote.slice(1)] }
    })
    expect(berechneGesamt(p).auswertung.vorlaeufig).toBe(true)
    const akte = akteVon(p)
    gueltigOhneHinweise(akte)
    expect(befund(akte, 'vorlaeufig')).toMatchObject({ schwere: 'mittel', fundstelle: 'Schritt 6 · Ergebnis, Empfehlung' })
    expect(ns(befund(akte, 'vorlaeufig'))).toEqual({ offen: [{ angebotId: 'angebot-nord', koOffen: 0, bewertungenFehlen: 1 }] })
    expect(akte.massnahmen[0].befunde).toEqual(['vorlaeufig'])
    expect(ns(akte.massnahmen[0])).toMatchObject({ vorlaeufig: true })
  })

  it('knapper stabiler Bereich wird ein Befund „mittel“ und eine Kennzahl „mittel“', () => {
    const p = abgewandelt((q) => ({
      ...q,
      gewichtung: { ...q.gewichtung, direktProzent: { funktion: 55, schnittstelle: 7, menge: 3, datenschutz: 7, ordnung: 3, betrieb: 10, barrierefreiheit: 4, anbieter: 11 } },
    }))
    const knapp = berechneGesamt(p).auswertung.stabilitaet.filter((s) => s.knapp)
    expect(knapp.length).toBeGreaterThan(0)
    const akte = akteVon(p)
    gueltigOhneHinweise(akte)
    for (const s of knapp) {
      expect(befund(akte, `knapp:${s.gruppe}`)).toMatchObject({ schwere: 'mittel', fundstelle: 'Schritt 6 · Ergebnis, Sensitivität der Gewichte' })
      expect(befund(akte, `knapp:${s.gruppe}`).text).toContain('(knapp)')
      expect(kennzahl(akte, `stabil:${s.gruppe}`).bewertung).toBe('mittel')
    }
  })

  it('Muss-Anteil über 60 % bekommt die Bewertung „mittel“', () => {
    const p = abgewandelt((q) => ({ ...q, anforderungen: q.anforderungen.map((a) => (a.status === 'aktiv' && a.prioritaet === 'kann' ? { ...a, prioritaet: 'muss' as const } : a)) }))
    const akte = akteVon(p)
    expect(wert(akte, 'muss-anteil')).toBe(61.9)
    expect(kennzahl(akte, 'muss-anteil').bewertung).toBe('mittel')
  })

  it('finale Entscheidung: Stand ist ihr Datum', () => {
    const p = abgewandelt((q) => ({ ...q, entscheidung: { ...q.entscheidung, status: 'final' as const, datum: new Date(2026, 10, 12, 9, 30).toISOString() } }))
    const akte = akteVon(p)
    expect(akte.analyse.stand).toBe('2026-11-12')
    expect(ns(akte.massnahmen[0])).toMatchObject({ status: 'final' })
  })
})

describe('Mandant, Dateiname und Grenzfälle', () => {
  it('belegt den Mandanten mit dem Betrieb aus dem Rahmen vor', () => {
    expect(mandantAusProjekt(beispielProjekt())).toBe('Lieferdienst Beispiel GmbH')
    expect(mandantAusProjekt(neuesArbeitsprojekt('2026-11-13T10:00:00.000Z'))).toBe('')
  })

  it('Dateiname mit Umlauten, Mandantennummer und Quelldatei', () => {
    const akte = beratungsakteAusProjekt({ projekt: beispielProjekt(), mandant: { name: ' Bäckerei Groß & Söhne GbR ', kennung: ' K-0815 ' }, jetzt: JETZT, quelldatei: 'warenwirtschaft.auswahllotse' })
    gueltigOhneHinweise(akte)
    expect(akte.mandant).toEqual({ name: 'Bäckerei Groß & Söhne GbR', kennung: 'K-0815' })
    expect(akte.analyse.quelldatei).toBe('warenwirtschaft.auswahllotse')
    expect(dateinameBeratungsakte(akte)).toBe('Bäckerei-Groß-&-Söhne-GbR-auswahllotse-2026-11-13.beratungsakte.json')
  })

  it('leere Mandantennummer und fehlende Quelldatei fehlen in der Akte', () => {
    const akte = beratungsakteAusProjekt({ projekt: beispielProjekt(), mandant: { name: 'M', kennung: '  ' }, jetzt: JETZT, quelldatei: null })
    expect(akte.mandant).toEqual({ name: 'M' })
    expect('quelldatei' in akte.analyse).toBe(false)
  })

  it('ein neues, leeres Projekt ergibt eine gültige Akte', () => {
    const akte = akteVon(neuesArbeitsprojekt('2026-11-13T10:00:00.000Z'), 'M')
    gueltigOhneHinweise(akte)
    expect(akte.analyse.titel).toBe('Vorhaben ohne Namen')
    expect(wert(akte, 'angebote')).toBe(0)
    expect(akte.massnahmen).toEqual([])
    // Befunde des leeren Projekts (z. B. G1: kein Hauptkriterium) sind dabei
    expect(akte.befunde.length).toBe(berechneGesamt(neuesArbeitsprojekt('2026-11-13T10:00:00.000Z')).befunde.length)
  })

  it('lehnt einen leeren Mandanten ab', () => {
    expect(() => akteVon(beispielProjekt(), '')).toThrow('Bitte den Mandanten angeben.')
    expect(() => akteVon(beispielProjekt(), '   ')).toThrow('Bitte den Mandanten angeben.')
  })

  it('macht aus beliebigen Kennungen gültige, eindeutige Kennungen; leere Risiken entfallen', () => {
    const p = abgewandelt((q) => ({
      ...q,
      angebote: q.angebote.map((a, i) => (i === 0 ? { ...a, id: 'Angebot Nord/ä' } : a)),
      entscheidung: {
        ...q.entscheidung,
        risiken: [
          { id: 'r 1', text: 'A', massnahme: '' },
          { id: 'r 1', text: 'B', massnahme: 'b' },
          { id: 'x'.repeat(100), text: '', massnahme: '' },
        ],
      },
    }))
    const akte = akteVon(p)
    gueltigOhneHinweise(akte)
    expect(wert(akte, 'nutzwert:Angebot_Nord__')).toBe(8.52)
    expect(akte.befunde.filter((b) => b.kennung.startsWith('risiko:')).map((b) => b.kennung)).toEqual(['risiko:r_1', 'risiko:r_1-2'])
    expect(akte.massnahmen.map((m) => [m.kennung, m.befunde])).toEqual([
      ['wahl:Angebot_Nord__', []],
      ['risiko:r_1', ['risiko:r_1-2']],
    ])
  })
})

describe('Kopie der Bibliothek (src/beratungsakte)', () => {
  const gueltig = import.meta.glob<string>('../../testdaten/beratungsakte/gueltig/*.json', { query: '?raw', import: 'default', eager: true })
  const ungueltig = import.meta.glob<string>('../../testdaten/beratungsakte/ungueltig/*.json', { query: '?raw', import: 'default', eager: true })

  it('liest alle gültigen Beispiele', () => {
    expect(Object.keys(gueltig).length).toBeGreaterThan(0)
    for (const [datei, text] of Object.entries(gueltig)) expect(leseBeratungsakte(text).ok, datei).toBe(true)
  })

  it('lehnt alle ungültigen Beispiele ab', () => {
    expect(Object.keys(ungueltig).length).toBeGreaterThan(0)
    for (const [datei, text] of Object.entries(ungueltig)) expect(leseBeratungsakte(text).ok, datei).toBe(false)
  })

  it('meldet eine neuere Hauptversion', () => {
    const text = Object.entries(ungueltig).find(([d]) => d.endsWith('/neuere-hauptversion.json'))![1]
    const r = leseBeratungsakte(text)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fehler.map((f) => f.code)).toContain('neuere-hauptversion')
  })

  it('schema.ts entspricht der Schema-Datei', () => {
    expect(SCHEMA).toEqual(JSON.parse(schemaText))
  })
})

// Mit BERATUNGSAKTE_AUSGABE=<Ordner> schreibt der Test die Akte des Fallbeispiels dorthin (Beispieldatei des Formats).
// Die Oberfläche hat keine Node-Typen; deshalb werden process und node:fs hier ohne Typen geholt.
const umgebung = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
it.runIf(!!umgebung.BERATUNGSAKTE_AUSGABE)('schreibt die Akte des Fallbeispiels', async () => {
  const ziel = umgebung.BERATUNGSAKTE_AUSGABE!.replace(/[\\/]+$/, '')
  const fs = (await import(/* @vite-ignore */ 'node:fs' as string)) as {
    mkdirSync(pfad: string, o: { recursive: boolean }): void
    writeFileSync(pfad: string, text: string, kodierung: string): void
  }
  const akte = akteDesBeispiels()
  fs.mkdirSync(ziel, { recursive: true })
  fs.writeFileSync(`${ziel}/${dateinameBeratungsakte(akte)}`, serialisiereBeratungsakte(akte), 'utf8')
})
