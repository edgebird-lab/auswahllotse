/**
 * Projektdatei speichern und laden (Spezifikation 6.16), dazu der
 * Browser-Speicher. Beim Laden wird die Struktur geprüft und Feld für Feld
 * in neue Objekte kopiert: Eine beschädigte oder fremde Datei führt zu einer
 * verständlichen Meldung statt zu einem Absturz, unbekannte Felder fallen
 * weg, und Schlüssel wie `__proto__` verändern nichts.
 */
import { dateiname } from '../export/dateiname'
import { Lesefehler, projiziereProjekt } from '../prozessdatei/lesen'
import { standardEinstellungen } from './projekt'
import {
  ANFORDERUNGS_STATUS,
  BETRIEBSFORMEN,
  DATEIENDUNG,
  EINMALIG_ARTEN,
  FORMAT_VERSION,
  GRUPPEN_REIHENFOLGE,
  HERKUNFT_ARTEN,
  JA_NEIN_OFFEN,
  KO_ERGEBNISSE,
  LAUFEND_ARTEN,
  MEDIUM_STATUS,
  PRIORITAETEN,
  SOFTWAREARTEN,
  type Anforderung,
  type Angebot,
  type AuswahlProjekt,
  type Bewertung,
  type Einstellungen,
  type Gewichtung,
  type Kosten,
  type Kostenposition,
  type Paarurteil,
  type ProzessQuelle,
  type Rahmen,
  type Staerke,
  type Umfang,
  type Wirtschaftlichkeit,
} from './typen'

const PROJEKT_SCHLUESSEL = 'auswahllotse:projekt'
const EINSTELLUNGEN_SCHLUESSEL = 'auswahllotse:einstellungen'
const DOKUMENT_SCHLUESSEL = 'auswahllotse:dokument'
/** Kopie eines gesicherten Projekts, das sich nicht mehr lesen ließ (sonst überschriebe es das neue Projekt sofort). */
const UNLESBAR_SCHLUESSEL = 'auswahllotse:projekt-unlesbar'

/** Die Projektdatei kann nicht geladen werden; `message` ist für Benutzer formuliert. */
export class Ladefehler extends Error {}

type Obj = Record<string, unknown>

const istObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x)

function fordere(bedingung: unknown, meldung: string): asserts bedingung {
  if (!bedingung) throw new Ladefehler(meldung)
}

const BESCHAEDIGT = 'Die Projektdatei ist beschädigt'

/** Liest Felder eines Objekts mit Typprüfung; `wo` beschreibt die Stelle für die Meldung. */
class Feld {
  private readonly x: Obj
  private readonly wo: string

  constructor(x: Obj, wo: string) {
    this.x = x
    this.wo = wo
  }

  private fehler(name: string): never {
    throw new Ladefehler(`${BESCHAEDIGT} (${this.wo}: „${name}“ fehlt oder ist ungültig).`)
  }

  text(name: string): string {
    const v = this.x[name]
    return typeof v === 'string' ? v : this.fehler(name)
  }

  textOderNull(name: string): string | null {
    const v = this.x[name]
    return v === null ? null : typeof v === 'string' ? v : this.fehler(name)
  }

  zahl(name: string): number {
    const v = this.x[name]
    return typeof v === 'number' && Number.isFinite(v) ? v : this.fehler(name)
  }

  zahlOderNull(name: string): number | null {
    return this.x[name] === null ? null : this.zahl(name)
  }

  /** ganze Zahl im Bereich [min, max] */
  ganz(name: string, min: number, max: number): number {
    const v = this.zahl(name)
    return Number.isInteger(v) && v >= min && v <= max ? v : this.fehler(name)
  }

  ja(name: string): boolean {
    const v = this.x[name]
    return typeof v === 'boolean' ? v : this.fehler(name)
  }

  wahl<T extends string>(name: string, werte: readonly T[]): T {
    const v = this.x[name]
    return werte.includes(v as T) ? (v as T) : this.fehler(name)
  }

  objekt(name: string): Feld {
    const v = this.x[name]
    return istObj(v) ? new Feld(v, `${this.wo}, ${name}`) : this.fehler(name)
  }

  roh(name: string): unknown {
    return this.x[name]
  }

  liste<T>(name: string, lies: (f: Feld, i: number) => T, wo: (i: number) => string): T[] {
    const v = this.x[name]
    if (!Array.isArray(v)) this.fehler(name)
    return v.map((e, i) => {
      if (!istObj(e)) throw new Ladefehler(`${BESCHAEDIGT} (${wo(i)} ist ungültig).`)
      return lies(new Feld(e, wo(i)), i)
    })
  }

  texte(name: string): string[] {
    const v = this.x[name]
    return Array.isArray(v) && v.every((e) => typeof e === 'string') ? [...v] : this.fehler(name)
  }

  /** Objekt mit festen Schlüsseln (z. B. Gruppen) und Zahlen als Werten */
  zahlen<K extends string>(name: string, schluessel: readonly K[], pruefe: (n: number) => boolean): Partial<Record<K, number>> {
    const v = this.x[name]
    if (!istObj(v)) this.fehler(name)
    const eintraege = Object.entries(v)
    if (!eintraege.every(([k, n]) => schluessel.includes(k as K) && typeof n === 'number' && pruefe(n))) this.fehler(name)
    return Object.fromEntries(eintraege) as Partial<Record<K, number>>
  }
}

function leseRahmen(f: Feld): Rahmen {
  const r = f.objekt('richtwerte')
  return {
    vorhaben: f.text('vorhaben'),
    betrieb: f.text('betrieb'),
    ersteller: f.text('ersteller'),
    softwareart: f.wahl('softwareart', SOFTWAREARTEN),
    personenbezogen: f.wahl('personenbezogen', JA_NEIN_OFFEN),
    steuerrelevant: f.wahl('steuerrelevant', JA_NEIN_OFFEN),
    betriebsform: f.wahl('betriebsform', BETRIEBSFORMEN),
    verbraucherverkauf: f.wahl('verbraucherverkauf', JA_NEIN_OFFEN),
    kleinstunternehmen: f.wahl('kleinstunternehmen', JA_NEIN_OFFEN),
    betriebstageProJahr: f.zahl('betriebstageProJahr'),
    spitzenfaktor: f.zahl('spitzenfaktor'),
    richtwerte: {
      antwortzeitSek: r.zahl('antwortzeitSek'),
      aufbewahrungJahre: r.zahl('aufbewahrungJahre'),
      wiederherstellungStunden: r.zahl('wiederherstellungStunden'),
      verfuegbarkeitProzent: r.zahl('verfuegbarkeitProzent'),
      reaktionStunden: r.zahl('reaktionStunden'),
      referenzen: r.zahl('referenzen'),
      einfuehrungWochen: r.zahl('einfuehrungWochen'),
    },
  }
}

function leseProzess(f: Feld): ProzessQuelle {
  let projekt
  try {
    const ergebnis = projiziereProjekt(f.roh('projekt'))
    fordere(ergebnis.formatVersionGelesen === 3, `${BESCHAEDIGT} (Prozessmodell: unerwartetes Format).`)
    projekt = ergebnis.projekt
  } catch (e) {
    if (e instanceof Lesefehler) throw new Ladefehler(`${BESCHAEDIGT} (Prozessmodell: ${e.message})`)
    throw e
  }
  return {
    dateiname: f.text('dateiname'),
    dateiart: f.wahl('dateiart', ['json', 'bpmn'] as const),
    formatVersionGelesen: f.ganz('formatVersionGelesen', 1, Number.MAX_SAFE_INTEGER),
    exporterVersion: f.textOderNull('exporterVersion'),
    sha256: f.text('sha256'),
    eingelesenAm: f.text('eingelesenAm'),
    projekt,
  }
}

function leseUmfang(f: Feld): Umfang {
  const medien = f.roh('medien')
  fordere(istObj(medien) && Object.values(medien).every((s) => MEDIUM_STATUS.includes(s as never)), `${BESCHAEDIGT} (Umfang: Systeme ungültig).`)
  return {
    grundlage: f.wahl('grundlage', ['ist', 'soll'] as const),
    // Object.fromEntries legt eigene Eigenschaften an; ein Schlüssel „__proto__“ ändert keinen Prototyp.
    medien: Object.fromEntries(Object.entries(medien)) as Umfang['medien'],
    aufgabenAus: f.texte('aufgabenAus'),
    aufgabenEin: f.texte('aufgabenEin'),
  }
}

function leseAnforderung(f: Feld): Anforderung {
  const h = f.objekt('herkunft')
  const b = f.objekt('bearbeitet')
  return {
    id: f.text('id'),
    nummer: f.textOderNull('nummer'),
    gruppe: f.wahl('gruppe', GRUPPEN_REIHENFOLGE),
    titel: f.text('titel'),
    text: f.text('text'),
    abnahme: f.text('abnahme'),
    prioritaet: f.wahl('prioritaet', PRIORITAETEN),
    prioritaetVorschlag: f.wahl('prioritaetVorschlag', PRIORITAETEN),
    status: f.wahl('status', ANFORDERUNGS_STATUS),
    herkunft: { art: h.wahl('art', HERKUNFT_ARTEN), bezuege: h.texte('bezuege'), katalogId: h.textOderNull('katalogId') },
    begruendung: f.text('begruendung'),
    quelle: f.textOderNull('quelle'),
    punkte: f.ganz('punkte', 0, 10),
    bearbeitet: { text: b.ja('text'), prioritaet: b.ja('prioritaet'), status: b.ja('status') },
    notiz: f.text('notiz'),
  }
}

function leseGewichtung(f: Feld): Gewichtung {
  return {
    methode: f.wahl('methode', ['direkt', 'paarvergleich'] as const),
    direktProzent: f.zahlen('direktProzent', GRUPPEN_REIHENFOLGE, Number.isFinite),
    paare: f.liste(
      'paare',
      (p): Paarurteil => ({
        a: p.wahl('a', GRUPPEN_REIHENFOLGE),
        b: p.wahl('b', GRUPPEN_REIHENFOLGE),
        wichtiger: p.wahl('wichtiger', ['a', 'b'] as const),
        staerke: p.ganz('staerke', 1, 9) as Staerke,
      }),
      (i) => `Paarvergleich ${i + 1}`,
    ),
    festgelegtAm: f.textOderNull('festgelegtAm'),
    aenderungenNachBewertung: f.ganz('aenderungenNachBewertung', 0, Number.MAX_SAFE_INTEGER),
  }
}

/**
 * Kennungen einer Liste müssen eindeutig sein: Bewertungen, Wahl und
 * Bearbeiten finden Einträge über ihre Kennung; doppelte würden sich
 * gegenseitig überschreiben.
 */
function eindeutig<T extends { id: string }>(liste: T[], wo: (i: number) => string): T[] {
  const gesehen = new Set<string>()
  liste.forEach((x, i) => {
    fordere(!gesehen.has(x.id), `${BESCHAEDIGT} (${wo(i)}: Kennung „${x.id}“ kommt doppelt vor).`)
    gesehen.add(x.id)
  })
  return liste
}

function lesePositionen<A extends string>(f: Feld, name: string, arten: readonly A[], wo: string): Kostenposition<A>[] {
  const positionen = f.liste(name, (p) => ({ id: p.text('id'), art: p.wahl('art', arten), bezeichnung: p.text('bezeichnung'), betragEuro: p.zahl('betragEuro') }), (i) => `${wo}, Position ${i + 1}`)
  return eindeutig(positionen, (i) => `${wo}, Position ${i + 1}`)
}

function leseKosten(f: Feld, wo: string): Kosten {
  return {
    einmalig: lesePositionen(f, 'einmalig', EINMALIG_ARTEN, `${wo}, einmalige Kosten`),
    laufendJahr: lesePositionen(f, 'laufendJahr', LAUFEND_ARTEN, `${wo}, laufende Kosten`),
    preisJeBenutzerMonatEuro: f.zahl('preisJeBenutzerMonatEuro'),
    internEinfuehrungTage: f.zahl('internEinfuehrungTage'),
    internSchulungStundenJeBenutzer: f.zahl('internSchulungStundenJeBenutzer'),
    internBetriebStundenMonat: f.zahl('internBetriebStundenMonat'),
  }
}

function leseAngebot(f: Feld, i: number): Angebot {
  const wo = `Angebot ${i + 1}`
  const roh = f.roh('bewertungen')
  fordere(istObj(roh), `${BESCHAEDIGT} (${wo}: Bewertungen fehlen).`)
  const bewertungen = Object.entries(roh).map(([id, b]): [string, Bewertung] => {
    fordere(istObj(b), `${BESCHAEDIGT} (${wo}: Bewertung ungültig).`)
    const g = new Feld(b, `${wo}, Bewertung`)
    const ko = g.roh('ko')
    fordere(ko === null || KO_ERGEBNISSE.includes(ko as never), `${BESCHAEDIGT} (${wo}: K.-o.-Ergebnis ungültig).`)
    return [id, { ko: ko as Bewertung['ko'], punkte: g.roh('punkte') === null ? null : g.ganz('punkte', 0, 10), fundstelle: g.text('fundstelle'), notiz: g.text('notiz') }]
  })
  return {
    id: f.text('id'),
    anbieter: f.text('anbieter'),
    produkt: f.text('produkt'),
    betriebsform: f.wahl('betriebsform', ['cloud', 'eigener_server'] as const),
    angebotsdatum: f.textOderNull('angebotsdatum'),
    notiz: f.text('notiz'),
    bewertungen: Object.fromEntries(bewertungen),
    kosten: leseKosten(f.objekt('kosten'), wo),
  }
}

function leseWirtschaftlichkeit(f: Feld): Wirtschaftlichkeit {
  return {
    jahre: f.zahl('jahre'),
    benutzer: f.zahl('benutzer'),
    internerStundensatzEuro: f.zahl('internerStundensatzEuro'),
    stundenProPersonentag: f.zahl('stundenProPersonentag'),
    preissteigerungProzent: f.zahl('preissteigerungProzent'),
    zinsProzent: f.zahlOderNull('zinsProzent'),
    kostenbasis: f.wahl('kostenbasis', ['nominal', 'barwert'] as const),
    nutzenProJahrEuro: f.zahlOderNull('nutzenProJahrEuro'),
    budgetEuro: f.zahlOderNull('budgetEuro'),
    budgetAlsKo: f.ja('budgetAlsKo'),
  }
}

/** Prüft geparste Daten und gibt eine Kopie als Projekt zurück; wirft `Ladefehler`. */
export function leseProjekt(daten: unknown): AuswahlProjekt {
  fordere(istObj(daten), 'Die Datei enthält kein Auswahl-Lotse-Projekt.')
  if (daten.app !== 'auswahllotse') {
    fordere(!('ist' in daten), 'Das ist eine Prozesslotse-Datei. Bitte im Schritt „Prozess“ einlesen.')
    throw new Ladefehler('Die Datei enthält kein Auswahl-Lotse-Projekt.')
  }
  fordere(typeof daten.formatVersion === 'number', 'Die Datei enthält kein Auswahl-Lotse-Projekt.')
  fordere(!(daten.formatVersion > FORMAT_VERSION), 'Diese Datei stammt aus einer neueren Version des Auswahl-Lotsen.')
  fordere(daten.formatVersion === FORMAT_VERSION, `${BESCHAEDIGT} (unbekanntes Format ${daten.formatVersion}).`)
  const f = new Feld(daten, 'Projekt')
  const prozess = f.roh('prozess')
  const umfang = f.roh('umfang')
  const e = f.objekt('entscheidung')
  return {
    app: 'auswahllotse',
    formatVersion: FORMAT_VERSION,
    id: f.text('id'),
    angelegtAm: f.text('angelegtAm'),
    geaendertAm: f.text('geaendertAm'),
    rahmen: leseRahmen(f.objekt('rahmen')),
    prozess: prozess === null ? null : leseProzess(f.objekt('prozess')),
    umfang: umfang === null ? null : leseUmfang(f.objekt('umfang')),
    anforderungen: eindeutig(
      f.liste('anforderungen', leseAnforderung, (i) => `Anforderung ${i + 1}`),
      (i) => `Anforderung ${i + 1}`,
    ),
    naechsteNummer: f.zahlen('naechsteNummer', GRUPPEN_REIHENFOLGE, (n) => Number.isInteger(n) && n >= 1),
    gewichtung: leseGewichtung(f.objekt('gewichtung')),
    angebote: eindeutig(
      f.liste('angebote', leseAngebot, (i) => `Angebot ${i + 1}`),
      (i) => `Angebot ${i + 1}`,
    ),
    bewertungBegonnenAm: f.textOderNull('bewertungBegonnenAm'),
    wirtschaftlichkeit: leseWirtschaftlichkeit(f.objekt('wirtschaftlichkeit')),
    entscheidung: {
      regel: e.wahl('regel', ['nutzwert', 'preis_leistung'] as const),
      mindestNutzwert: e.zahl('mindestNutzwert'),
      gewaehltId: e.textOderNull('gewaehltId'),
      begruendung: e.text('begruendung'),
      risiken: eindeutig(
        e.liste('risiken', (r) => ({ id: r.text('id'), text: r.text('text'), massnahme: r.text('massnahme') }), (i) => `Risiko ${i + 1}`),
        (i) => `Risiko ${i + 1}`,
      ),
      status: e.wahl('status', ['entwurf', 'final'] as const),
      datum: e.textOderNull('datum'),
    },
  }
}

/** Liest den Text einer `.auswahllotse`-Datei. */
export function leseProjektText(text: string): AuswahlProjekt {
  const inhalt = text.replace(/^﻿/, '')
  fordere(!inhalt.trimStart().startsWith('<'), 'Das ist eine BPMN-Datei. Bitte im Schritt „Prozess“ einlesen.')
  let daten: unknown
  try {
    daten = JSON.parse(inhalt)
  } catch {
    throw new Ladefehler('Die Datei ist kein gültiges JSON.')
  }
  return leseProjekt(daten)
}

/** JSON mit 2 Leerzeichen Einzug; als Datei UTF-8 ohne BOM. */
export function alsJson(p: AuswahlProjekt): string {
  return JSON.stringify(p, null, 2)
}

/** Dateiname aus dem Vorhaben, z. B. „Neue Warenwirtschaft.auswahllotse“. */
export function projektDateiname(p: AuswahlProjekt): string {
  return dateiname(p.rahmen.vorhaben, '', DATEIENDUNG)
}

// ── Browser-Speicher: kann in privaten Fenstern fehlen oder blockiert sein ──

export function speichereImBrowser(p: AuswahlProjekt): boolean {
  try {
    globalThis.localStorage.setItem(PROJEKT_SCHLUESSEL, JSON.stringify(p))
    return true
  } catch {
    return false
  }
}

export interface BrowserStand {
  projekt: AuswahlProjekt | null
  /** Warum ein gesichertes Projekt nicht gelesen werden konnte; sein Text liegt dann als Kopie bereit (`unlesbarerStand`). */
  fehler: string | null
}

/**
 * Liest das zuletzt gesicherte Projekt. Ist es unlesbar (beschädigt oder
 * aus einer anderen Version), bleibt sein Text als Kopie erhalten, bevor das
 * neue Projekt den Speicherplatz belegt; der Grund geht an die Oberfläche.
 */
export function ladeBrowserStand(): BrowserStand {
  let text: string | null
  try {
    text = globalThis.localStorage.getItem(PROJEKT_SCHLUESSEL)
  } catch {
    return { projekt: null, fehler: null }
  }
  if (!text) return { projekt: null, fehler: null }
  try {
    return { projekt: leseProjektText(text), fehler: null }
  } catch (e) {
    try {
      globalThis.localStorage.setItem(UNLESBAR_SCHLUESSEL, text)
    } catch {
      // ohne Kopie: die Meldung erscheint trotzdem
    }
    return { projekt: null, fehler: e instanceof Error ? e.message : String(e) }
  }
}

export function ladeAusBrowser(): AuswahlProjekt | null {
  return ladeBrowserStand().projekt
}

/** Text des zuletzt unlesbaren Projekts, z. B. zum Herunterladen; null, wenn es keinen gibt. */
export function unlesbarerStand(): string | null {
  try {
    return globalThis.localStorage.getItem(UNLESBAR_SCHLUESSEL)
  } catch {
    return null
  }
}

/** „Browser-Speicher leeren“ für gemeinsam genutzte Rechner (Spezifikation 8). */
export function leereBrowserSpeicher(): boolean {
  try {
    globalThis.localStorage.removeItem(PROJEKT_SCHLUESSEL)
    globalThis.localStorage.removeItem(EINSTELLUNGEN_SCHLUESSEL)
    globalThis.localStorage.removeItem(DOKUMENT_SCHLUESSEL)
    globalThis.localStorage.removeItem(UNLESBAR_SCHLUESSEL)
    return true
  } catch {
    return false
  }
}

export function ladeEinstellungen(): Einstellungen {
  const standard = standardEinstellungen()
  try {
    const text = globalThis.localStorage.getItem(EINSTELLUNGEN_SCHLUESSEL)
    const daten: unknown = text ? JSON.parse(text) : null
    if (istObj(daten)) {
      return {
        lernmodus: typeof daten.lernmodus === 'boolean' ? daten.lernmodus : standard.lernmodus,
        farbschema: daten.farbschema === 'hell' || daten.farbschema === 'dunkel' || daten.farbschema === 'system' ? daten.farbschema : standard.farbschema,
      }
    }
  } catch {
    // Standardwerte verwenden
  }
  return standard
}

export function speichereEinstellungen(e: Einstellungen): boolean {
  try {
    globalThis.localStorage.setItem(EINSTELLUNGEN_SCHLUESSEL, JSON.stringify(e))
    return true
  } catch {
    return false
  }
}

/** Name der zugehörigen Datei und ob es seitdem Änderungen gibt (für den Punkt im Titel nach dem Neuladen). */
export interface DokumentInfo {
  name: string | null
  ungespeichert: boolean
}

export function speichereDokumentInfo(info: DokumentInfo): boolean {
  try {
    globalThis.localStorage.setItem(DOKUMENT_SCHLUESSEL, JSON.stringify(info))
    return true
  } catch {
    return false
  }
}

export function ladeDokumentInfo(): DokumentInfo {
  try {
    const daten: unknown = JSON.parse(globalThis.localStorage.getItem(DOKUMENT_SCHLUESSEL) ?? 'null')
    if (istObj(daten)) return { name: typeof daten.name === 'string' ? daten.name : null, ungespeichert: daten.ungespeichert === true }
  } catch {
    // ohne Angaben: kein Dateiname
  }
  return { name: null, ungespeichert: false }
}
