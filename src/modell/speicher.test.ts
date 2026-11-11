import { afterEach, describe, expect, it, vi } from 'vitest'
import { leseProzessdatei } from '../prozessdatei/einlesen'
import { TEXTE } from '../testhilfen/testdaten'
import { neuesAngebot, neuesProjekt } from './projekt'
import {
  alsJson,
  ladeAusBrowser,
  ladeBrowserStand,
  ladeDokumentInfo,
  istProjektdatei,
  ladeEinstellungen,
  Ladefehler,
  leereBrowserSpeicher,
  leseProjektText,
  projektDateiname,
  speichereDokumentInfo,
  speichereEinstellungen,
  speichereImBrowser,
  unlesbarerStand,
  vergissProjektImBrowser,
} from './speicher'
import type { Anforderung, AuswahlProjekt } from './typen'

function anforderung(werte: Partial<Anforderung>): Anforderung {
  return {
    id: 'aufgabe:auf_erfassen',
    nummer: 'F-01',
    gruppe: 'funktion',
    titel: 'Bestellung erfassen',
    text: 'Die Software muss …',
    abnahme: 'Test …',
    prioritaet: 'muss',
    prioritaetVorschlag: 'muss',
    status: 'aktiv',
    herkunft: { art: 'aufgabe', bezuege: ['auf_erfassen'], katalogId: null },
    begruendung: 'Aus dem Prozessmodell',
    quelle: null,
    punkte: 0,
    bearbeitet: { text: false, prioritaet: false, status: false },
    notiz: '',
    ...werte,
  }
}

/** Projekt mit allen Teilen, damit Speichern und Laden jedes Feld berührt. */
async function vollesProjekt(): Promise<AuswahlProjekt> {
  const p = neuesProjekt('2026-11-11T10:00:00.000Z')
  p.rahmen.vorhaben = 'Neue Warenwirtschaft'
  p.rahmen.betrieb = 'Lieferdienst Nord'
  p.rahmen.betriebsform = 'cloud'
  p.prozess = (await leseProzessdatei('lieferdienst.prozesslotse', TEXTE.lieferdienst, '2026-11-11T10:01:00.000Z')).quelle
  p.umfang = { grundlage: 'ist', medien: { med_erp: 'abloesen', med_papier: 'unberuehrt' }, aufgabenAus: ['auf_aendern'], aufgabenEin: [] }
  p.anforderungen = [
    anforderung({}),
    anforderung({ id: 'katalog:N-AN-3', nummer: null, gruppe: 'anbieter', prioritaet: 'kann', prioritaetVorschlag: 'kann', status: 'vorschlag', punkte: 1, quelle: 'eigene Festlegung', herkunft: { art: 'katalog', bezuege: [], katalogId: 'N-AN-3' } }),
  ]
  p.naechsteNummer = { funktion: 2 }
  p.gewichtung = { methode: 'paarvergleich', direktProzent: { funktion: 60, anbieter: 40 }, paare: [{ a: 'funktion', b: 'anbieter', wichtiger: 'a', staerke: 3 }], festgelegtAm: '2026-11-11T11:00:00.000Z', aenderungenNachBewertung: 1 }
  const angebot = neuesAngebot('Anbieter A', 'Produkt A')
  angebot.bewertungen = { 'aufgabe:auf_erfassen': { ko: 'erfuellt', punkte: null, fundstelle: 'Angebot S. 4', notiz: '' }, 'katalog:N-AN-3': { ko: null, punkte: 8, fundstelle: '', notiz: 'gut' } }
  angebot.kosten.einmalig = [{ id: 'k1', art: 'einrichtung', bezeichnung: 'Einrichtung', betragEuro: 6000 }]
  angebot.kosten.laufendJahr = [{ id: 'k2', art: 'support', bezeichnung: 'Support', betragEuro: 600 }]
  angebot.kosten.preisJeBenutzerMonatEuro = 39
  p.angebote = [angebot]
  p.bewertungBegonnenAm = '2026-11-11T12:00:00.000Z'
  p.wirtschaftlichkeit.zinsProzent = 5
  p.wirtschaftlichkeit.budgetEuro = 35000
  p.entscheidung.risiken = [{ id: 'r1', text: 'Datenübernahme dauert länger', massnahme: 'Probeimport' }]
  return p
}

describe('Projektdatei speichern und laden', () => {
  it('liefert nach Speichern und Laden dasselbe Projekt (T-D2)', async () => {
    const p = await vollesProjekt()
    const text = alsJson(p)
    expect(text).toContain('\n  "app": "auswahllotse"')
    expect(text.charCodeAt(0)).not.toBe(0xfeff)
    expect(leseProjektText(text)).toEqual(p)
  })

  it('erkennt eine Prozesslotse-Datei und verweist auf den Schritt „Prozess“ (T-D3)', () => {
    expect(() => leseProjektText(TEXTE.lieferdienst)).toThrow('Das ist eine Prozesslotse-Datei. Bitte im Schritt „Prozess“ einlesen.')
    expect(() => leseProjektText(TEXTE.lieferdienstBpmn)).toThrow('Bitte im Schritt „Prozess“ einlesen.')
  })

  it('meldet Dateien einer neueren Version (T-D4)', () => {
    const daten = JSON.parse(alsJson(neuesProjekt())) as Record<string, unknown>
    daten.formatVersion = 2
    expect(() => leseProjektText(JSON.stringify(daten))).toThrow('Diese Datei stammt aus einer neueren Version des Auswahl-Lotsen.')
  })

  it('meldet Text, der kein JSON ist (T-D5)', () => {
    expect(() => leseProjektText('kein json')).toThrow('Die Datei ist kein gültiges JSON.')
    expect(() => leseProjektText('42')).toThrow('Die Datei enthält kein Auswahl-Lotse-Projekt.')
  })

  it('nennt die Stelle, wenn ein Feld fehlt oder falsch ist', async () => {
    const daten = JSON.parse(alsJson(await vollesProjekt()))
    daten.anforderungen[1].prioritaet = 'unbedingt'
    expect(() => leseProjektText(JSON.stringify(daten))).toThrow(Ladefehler)
    expect(() => leseProjektText(JSON.stringify(daten))).toThrow('Anforderung 2: „prioritaet“ fehlt oder ist ungültig')
    const ohneProzess = JSON.parse(alsJson(await vollesProjekt()))
    delete ohneProzess.prozess.projekt.ist.ablauf
    expect(() => leseProjektText(JSON.stringify(ohneProzess))).toThrow('Prozessmodell: Ist-Prozess, Ablauf: Schrittliste fehlt.')
  })

  it('lehnt doppelte Kennungen ab, weil Bewertungen und Wahl über sie laufen', async () => {
    const doppelt = async (aendern: (d: ReturnType<typeof JSON.parse>) => void) => {
      const daten = JSON.parse(alsJson(await vollesProjekt()))
      aendern(daten)
      return () => leseProjektText(JSON.stringify(daten))
    }
    expect(
      await doppelt((d) => {
        d.anforderungen.push({ ...d.anforderungen[0] })
      }),
    ).toThrow('Die Projektdatei ist beschädigt (Anforderung 3: Kennung „aufgabe:auf_erfassen“ kommt doppelt vor).')
    expect(
      await doppelt((d) => {
        d.angebote.push({ ...d.angebote[0] })
      }),
    ).toThrow(/Angebot 2: Kennung „.+“ kommt doppelt vor/)
    expect(
      await doppelt((d) => {
        d.angebote[0].kosten.einmalig.push({ ...d.angebote[0].kosten.einmalig[0] })
      }),
    ).toThrow('Angebot 1, einmalige Kosten, Position 2: Kennung „k1“ kommt doppelt vor')
    expect(
      await doppelt((d) => {
        d.entscheidung.risiken.push({ ...d.entscheidung.risiken[0] })
      }),
    ).toThrow('Risiko 2: Kennung „r1“ kommt doppelt vor')
  })

  it('übernimmt keine fremden Felder und lässt __proto__ wirkungslos', async () => {
    const text = alsJson(await vollesProjekt())
      .replace('"app": "auswahllotse",', '"app": "auswahllotse", "fremd": 1, "__proto__": { "boese": true },')
      .replace('"med_erp": "abloesen"', '"med_erp": "abloesen", "__proto__": "abloesen"')
    const p = leseProjektText(text)
    expect('fremd' in p).toBe(false)
    expect(({} as Record<string, unknown>).boese).toBeUndefined()
    expect(Object.getPrototypeOf(p.umfang!.medien)).toBe(Object.prototype)
    expect(Object.keys(p.umfang!.medien)).toContain('__proto__')
  })

  it('bildet den Dateinamen aus dem Vorhaben', () => {
    const p = neuesProjekt()
    p.rahmen.vorhaben = 'Neue: Warenwirtschaft?'
    expect(projektDateiname(p)).toBe('Neue Warenwirtschaft.auswahllotse')
    p.rahmen.vorhaben = '  '
    expect(projektDateiname(p)).toBe('Auswahl-Lotse.auswahllotse')
    p.rahmen.vorhaben = 'x'.repeat(200)
    expect(projektDateiname(p)).toHaveLength(80)
  })
})

describe('Browser-Speicher', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function speicher() {
    const daten = new Map<string, string>()
    return {
      getItem: (k: string) => daten.get(k) ?? null,
      setItem: (k: string, v: string) => void daten.set(k, v),
      removeItem: (k: string) => void daten.delete(k),
    }
  }

  it('speichert und lädt das Projekt', async () => {
    vi.stubGlobal('localStorage', speicher())
    const p = await vollesProjekt()
    expect(speichereImBrowser(p)).toBe(true)
    expect(ladeAusBrowser()).toEqual(p)
    expect(leereBrowserSpeicher()).toBe(true)
    expect(ladeAusBrowser()).toBeNull()
  })

  it('stürzt nicht ab, wenn der Speicher wirft (T-D6)', () => {
    const wirft = () => {
      throw new Error('QuotaExceededError')
    }
    vi.stubGlobal('localStorage', { getItem: wirft, setItem: wirft, removeItem: wirft })
    expect(speichereImBrowser(neuesProjekt())).toBe(false)
    expect(ladeAusBrowser()).toBeNull()
    expect(speichereEinstellungen({ lernmodus: false, farbschema: 'dunkel' })).toBe(false)
    expect(leereBrowserSpeicher()).toBe(false)
  })

  it('liefert Standard-Einstellungen ohne Speicher (T-D7)', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(ladeEinstellungen()).toEqual({ lernmodus: true, farbschema: 'system' })
  })

  it('merkt sich Einstellungen und ersetzt ungültige Werte', () => {
    const s = speicher()
    vi.stubGlobal('localStorage', s)
    speichereEinstellungen({ lernmodus: false, farbschema: 'dunkel' })
    expect(ladeEinstellungen()).toEqual({ lernmodus: false, farbschema: 'dunkel' })
    s.setItem('auswahllotse:einstellungen', '{"lernmodus":"ja","farbschema":"lila"}')
    expect(ladeEinstellungen()).toEqual({ lernmodus: true, farbschema: 'system' })
    s.setItem('auswahllotse:einstellungen', '{kaputt')
    expect(ladeEinstellungen()).toEqual({ lernmodus: true, farbschema: 'system' })
  })

  it('lädt ein beschädigtes Projekt nicht, behält aber eine Kopie und nennt den Grund', () => {
    const s = speicher()
    vi.stubGlobal('localStorage', s)
    expect(unlesbarerStand()).toBeNull()
    s.setItem('auswahllotse:projekt', '{"app":"auswahllotse"}')
    expect(ladeAusBrowser()).toBeNull()
    // Das neue Projekt überschreibt gleich den Speicherplatz; die Kopie bleibt
    expect(ladeBrowserStand()).toEqual({ projekt: null, fehler: 'Die Datei enthält kein Auswahl-Lotse-Projekt.' })
    speichereImBrowser(neuesProjekt())
    expect(unlesbarerStand()).toBe('{"app":"auswahllotse"}')
    expect(ladeBrowserStand().fehler).toBeNull()
    // „Browser-Speicher leeren“ entfernt auch die Kopie
    leereBrowserSpeicher()
    expect(unlesbarerStand()).toBeNull()
    // ohne Speicher: kein Absturz, keine Meldung
    vi.stubGlobal('localStorage', undefined)
    expect(ladeBrowserStand()).toEqual({ projekt: null, fehler: null })
    expect(unlesbarerStand()).toBeNull()
  })
})

describe('Dokumentinfo im Browser', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function speicher() {
    const daten = new Map<string, string>()
    return {
      getItem: (k: string) => daten.get(k) ?? null,
      setItem: (k: string, v: string) => void daten.set(k, v),
      removeItem: (k: string) => void daten.delete(k),
    }
  }

  it('merkt sich Dateiname und ungespeicherte Änderungen', () => {
    vi.stubGlobal('localStorage', speicher())
    expect(ladeDokumentInfo()).toEqual({ name: null, ungespeichert: false })
    expect(speichereDokumentInfo({ name: 'Neue Warenwirtschaft.auswahllotse', ungespeichert: true })).toBe(true)
    expect(ladeDokumentInfo()).toEqual({ name: 'Neue Warenwirtschaft.auswahllotse', ungespeichert: true })
    leereBrowserSpeicher()
    expect(ladeDokumentInfo()).toEqual({ name: null, ungespeichert: false })
    vi.stubGlobal('localStorage', undefined)
    expect(speichereDokumentInfo({ name: null, ungespeichert: false })).toBe(false)
  })

  it('vergisst beim Verwerfen Projekt und Dateiname, aber nicht die Einstellungen', () => {
    vi.stubGlobal('localStorage', speicher())
    speichereImBrowser(neuesProjekt())
    speichereDokumentInfo({ name: 'a.auswahllotse', ungespeichert: true })
    speichereEinstellungen({ lernmodus: false, farbschema: 'dunkel' })
    expect(vergissProjektImBrowser()).toBe(true)
    expect(ladeAusBrowser()).toBeNull()
    expect(ladeDokumentInfo()).toEqual({ name: null, ungespeichert: false })
    expect(ladeEinstellungen()).toEqual({ lernmodus: false, farbschema: 'dunkel' })
    vi.stubGlobal('localStorage', undefined)
    expect(vergissProjektImBrowser()).toBe(false)
  })
})

describe('Projekt oder Prozessmodell (Dateien aus dem Explorer)', () => {
  const projekt = alsJson(neuesProjekt())

  it('entscheidet zuerst nach der Endung', () => {
    expect(istProjektdatei('a.auswahllotse', projekt)).toBe(true)
    expect(istProjektdatei('A.AUSWAHLLOTSE', '{kaputt')).toBe(true)
    expect(istProjektdatei('lieferdienst.prozesslotse', TEXTE.lieferdienst)).toBe(false)
    expect(istProjektdatei('lieferdienst.bpmn', TEXTE.lieferdienstBpmn)).toBe(false)
    // auch wenn jemand ein Projekt falsch benennt: eine .prozesslotse-Datei wird nie als Projekt geöffnet
    expect(istProjektdatei('falsch.prozesslotse', projekt)).toBe(false)
  })

  it('erkennt JSON und Unbekanntes am Merkmal app', () => {
    expect(istProjektdatei('projekt.json', projekt)).toBe(true)
    expect(istProjektdatei('projekt.json', '\uFEFF' + projekt)).toBe(true)
    expect(istProjektdatei('ohne-endung', projekt)).toBe(true)
    expect(istProjektdatei('lieferdienst.json', TEXTE.lieferdienstFormat1)).toBe(false)
    expect(istProjektdatei('liste.json', '[1,2]')).toBe(false)
    expect(istProjektdatei('kaputt.json', '{kaputt')).toBe(false)
  })
})
