/**
 * Liest Projektdateien des Prozesslotsen (Spezifikation 4.3 und 6.1, Regeln
 * E1 bis E8 und E13; BPMN in bpmn.ts).
 *
 * Toleranter Leser mit Projektion: Er prüft Typen und kopiert nur bekannte
 * Felder einzeln in neue Objekte. Unbekannte Felder fallen weg, `__proto__`
 * und ähnliche Schlüssel werden nie gelesen. Format 1 und 2 werden auf die
 * Form von Format 3 umgestellt. Neuere Formate werden mit Warnung gelesen;
 * unbekannte Bausteine werden zum allgemeinen Schritt (`PlAllgemein`).
 *
 * Strukturfehler (falsche Typen, fehlende Pflichtfelder) führen zur
 * Ablehnung mit `Lesefehler`. Modellfehler (Anteile ≠ 100 %, Rücksprung ins
 * Leere) und Ersatzwerte werden als Befunde gemeldet.
 */
import type { Befund, Schwere } from '../modell/ergebnisse'
import type { ProzessQuelle } from '../modell/typen'
import {
  ANTEIL_TOLERANZ,
  MAX_BAUSTEINE,
  MAX_DATEIGROESSE_BYTE,
  MAX_MEDIEN,
  MAX_ROLLEN,
  MAX_TIEFE,
} from '../regeln/schwellen'
import {
  PL_AUFGABEN_ARTEN,
  PL_FORMAT_AKTUELL,
  PL_MEDIUM_ARTEN,
  PL_MEDIUM_NAMEN,
  type PlAufgabe,
  type PlAusloeserArt,
  type PlBlock,
  type PlId,
  type PlMassnahme,
  type PlMedium,
  type PlMediumArt,
  type PlOderZweig,
  type PlProjekt,
  type PlProzess,
  type PlRolle,
  type PlSequenz,
  type PlTeilnehmer,
  type PlZweig,
  type PlZweigEreignis,
} from './format'

/** Die Datei kann nicht gelesen werden; `message` ist für Benutzer formuliert. */
export class Lesefehler extends Error {}

export interface LeseErgebnis {
  projekt: PlProjekt
  /** Format in der Datei vor der Umstellung */
  formatVersionGelesen: number
  befunde: Befund[]
}

type Obj = Record<string, unknown>

const istObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x)
const istText = (x: unknown): x is string => typeof x === 'string'
const istZahl = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const istVerweis = (x: unknown): x is string | null | undefined => x === undefined || x === null || istText(x)

function fordere(bedingung: unknown, meldung: string): asserts bedingung {
  if (!bedingung) throw new Lesefehler(meldung)
}

const prozent = (x: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(x * 100)
const ganzzahl = (x: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(x)

// ── Dateigröße und Prüfsumme (E1, E13) ─────────────────────────────────────

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length
}

/** E1: höchstens 5 MB. */
export function pruefeDateigroesse(bytes: number): void {
  fordere(bytes <= MAX_DATEIGROESSE_BYTE, 'Die Datei ist größer als 5 MB.')
}

/** E13: SHA-256 über den Dateitext (UTF-8), als Hex. */
export async function sha256Hex(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Projektion ─────────────────────────────────────────────────────────────

interface Kontext {
  /** „Ist-Prozess“ oder „Soll-Prozess“, für kurze Meldungen */
  prozess: string
  version: number
  befunde: Befund[]
  /** Bausteine im aktuellen Prozess (E6) */
  bausteine: number
  rollen: Set<PlId>
  medien: Set<PlId>
  teilnehmer: Set<PlId>
  /** bereits gesehene Kennungen von Bausteinen und Zweigen im aktuellen Prozess */
  kennungen: Set<PlId>
}

function melde(ctx: Kontext, schwere: Schwere, code: string, text: string, bezug: PlId | null = null): void {
  ctx.befunde.push({ schwere, code, text, bezug })
}

function kennung(ctx: Kontext, id: PlId, wo: string): void {
  if (ctx.kennungen.has(id)) melde(ctx, 'warnung', 'E5', `${wo}: Die Kennung „${id}“ kommt mehrfach vor; Häufigkeiten können falsch sein.`, id)
  ctx.kennungen.add(id)
}

/** Verweis auf Rolle oder System; ohne Treffer null mit Warnung (E7). */
function verweis(ctx: Kontext, wert: unknown, bekannt: Set<PlId>, wo: string, was: string, schwere: Schwere, bezug: PlId): PlId | null {
  if (wert === undefined || wert === null) return null
  fordere(istText(wert), `${wo}: ${was} ungültig.`)
  if (bekannt.has(wert)) return wert
  melde(ctx, schwere, 'E7', `${wo}: ${was} „${wert}“ fehlt im Modell; ohne ${was} übernommen.`, bezug)
  return null
}

function projiziereSequenz(x: unknown, wo: string, ctx: Kontext, tiefe: number, bereiche: PlId[]): PlSequenz {
  fordere(istObj(x) && istText(x.id) && Array.isArray(x.schritte), `${wo}: Schrittliste fehlt.`)
  return { id: x.id, schritte: x.schritte.map((b, i) => projiziereBlock(b, `${wo}, Schritt ${i + 1}`, ctx, tiefe, bereiche)) }
}

function projiziereBlock(x: unknown, wo: string, ctx: Kontext, tiefe: number, bereiche: PlId[]): PlBlock {
  fordere(istObj(x) && istText(x.id) && istText(x.typ), `${wo}: kein gültiger Baustein.`)
  // E6: zählen und abbrechen, bevor die Rekursion zu tief wird
  fordere(tiefe <= MAX_TIEFE, `${ctx.prozess}: Das Prozessmodell ist tiefer als ${MAX_TIEFE} Ebenen verschachtelt.`)
  ctx.bausteine += 1
  fordere(ctx.bausteine <= MAX_BAUSTEINE, `${ctx.prozess}: Das Prozessmodell hat mehr als ${ganzzahl(MAX_BAUSTEINE)} Bausteine.`)
  kennung(ctx, x.id, wo)
  const id = x.id
  switch (x.typ) {
    case 'aufgabe':
      return projiziereAufgabe(x, id, wo, ctx)
    case 'warten': {
      fordere(istText(x.name) && istZahl(x.dauerMin) && (x.art === 'zeit' || x.art === 'nachricht') && istVerweis(x.von), `${wo}: Warten unvollständig.`)
      return { typ: 'warten', id, name: x.name, art: x.art, dauerMin: x.dauerMin, von: verweis(ctx, x.von, ctx.teilnehmer, wo, 'Teilnehmer', 'hinweis', id) }
    }
    case 'entscheidung': {
      // Format 1 kennt keine Art; dort ist jede Entscheidung eine Daten-Entscheidung.
      const art = x.art === undefined && ctx.version === 1 ? 'daten' : x.art
      fordere(istText(x.frage) && Array.isArray(x.zweige) && (art === 'daten' || art === 'ereignis'), `${wo}: Entscheidung unvollständig.`)
      const zweige = x.zweige.map((z, i) => projiziereZweig(z, `${wo}, Ausgang ${i + 1}`, ctx, tiefe, bereiche))
      const summe = zweige.reduce((s, z) => s + z.anteil, 0)
      if (zweige.length > 0 && Math.abs(summe - 1) > ANTEIL_TOLERANZ) {
        melde(ctx, 'warnung', 'E8', `${wo} („${x.frage}“): Anteile ergeben ${prozent(summe)} %; Häufigkeiten sind unsicher.`, id)
      }
      return { typ: 'entscheidung', id, art, frage: x.frage, zweige }
    }
    case 'oder': {
      fordere(istText(x.frage) && Array.isArray(x.zweige) && (x.standard === undefined || x.standard === null || istText(x.standard)), `${wo}: ODER-Verzweigung unvollständig.`)
      const zweige: PlOderZweig[] = x.zweige.map((z, i) => {
        const weg = `${wo}, Weg ${i + 1}`
        const seq = projiziereSequenz(z, weg, ctx, tiefe + 1, bereiche)
        const roh = z as Obj
        fordere(istText(roh.bezeichnung) && istZahl(roh.anteil), `${weg}: Angaben fehlen.`)
        kennung(ctx, seq.id, weg)
        return { id: seq.id, bezeichnung: roh.bezeichnung, anteil: roh.anteil, schritte: seq.schritte }
      })
      let standard = istText(x.standard) ? x.standard : null
      if (standard !== null && !zweige.some((z) => z.id === standard)) {
        melde(ctx, 'warnung', 'E7', `${wo}: Der Standardweg „${standard}“ fehlt; ohne Standardweg übernommen.`, id)
        standard = null
      }
      return { typ: 'oder', id, frage: x.frage, zweige, standard }
    }
    case 'parallel': {
      fordere(Array.isArray(x.zweige), `${wo}: Zweige fehlen.`)
      return { typ: 'parallel', id, zweige: x.zweige.map((z, i) => projiziereSequenz(z, `${wo}, Zweig ${i + 1}`, ctx, tiefe + 1, bereiche)) }
    }
    case 'wiederholung': {
      const modus = x.modus === undefined && ctx.version === 1 ? 'anteil' : x.modus
      fordere(istText(x.frage) && istZahl(x.anteilWiederholung) && (modus === 'anteil' || modus === 'ruecksprung'), `${wo}: Wiederholung unvollständig.`)
      // „zweck“ ist im Format optional; fehlt er, gilt „nacharbeit“.
      fordere(x.zweck === undefined || x.zweck === 'nacharbeit' || x.zweck === 'menge', `${wo}: Zweck der Wiederholung ungültig.`)
      const innen = modus === 'ruecksprung' ? [...bereiche, id] : bereiche
      const koerper = projiziereSequenz(x.koerper, `${wo}, Körper`, ctx, tiefe + 1, innen)
      return { typ: 'wiederholung', id, modus, zweck: x.zweck ?? 'nacharbeit', frage: x.frage, anteilWiederholung: x.anteilWiederholung, koerper }
    }
    case 'allgemein':
    default: {
      // Unbekannter Baustein (z. B. aus einem neueren Format): allgemeiner Schritt, Inhalt wird übergangen.
      // „allgemein“ ist die eigene Ablage dieses Falls in der Projektdatei des Auswahl-Lotsen.
      const originalTyp = x.typ === 'allgemein' && istText(x.originalTyp) ? x.originalTyp : x.typ
      const name = istText(x.name) ? x.name : istText(x.frage) ? x.frage : ''
      melde(
        ctx,
        'warnung',
        'E5',
        `${wo}: unbekannter Baustein „${originalTyp}“; als allgemeiner Schritt übernommen. Aufgaben darin fehlen im Lastenheft.`,
        id,
      )
      return { typ: 'allgemein', id, originalTyp, name }
    }
  }
}

function projiziereAufgabe(x: Obj, id: PlId, wo: string, ctx: Kontext): PlAufgabe {
  fordere(istText(x.name) && istZahl(x.bearbeitungMin) && istZahl(x.liegezeitMin), `${wo}: Aufgabe unvollständig.`)
  fordere(istText(x.art), `${wo}: Aufgabenart fehlt.`)
  fordere(istZahl(x.freigabeQuote), `${wo}: Freigabequote fehlt.`)
  fordere(x.brauchtVorgaenger === null || typeof x.brauchtVorgaenger === 'boolean', `${wo}: Angabe zum Vorgänger ungültig.`)
  fordere(x.uebertragung === null || (istObj(x.uebertragung) && istZahl(x.uebertragung.minuten) && istVerweis(x.uebertragung.quelleMediumId)), `${wo}: Übertragung ungültig.`)
  fordere(istVerweis(x.rolleId) && istVerweis(x.mediumId) && istVerweis(x.nachrichtAn) && istVerweis(x.nachrichtVon), `${wo}: Verweis ungültig.`)
  const aufgabe = `${wo} („${x.name}“)`
  let art = x.art as PlAufgabe['art']
  if (!PL_AUFGABEN_ARTEN.includes(art)) {
    melde(ctx, 'hinweis', 'E7', `${aufgabe}: unbekannte Aufgabenart „${x.art}“; als normale Aufgabe übernommen.`, id)
    art = 'normal'
  }
  const ue = x.uebertragung as Obj | null
  return {
    typ: 'aufgabe',
    id,
    name: x.name,
    rolleId: verweis(ctx, x.rolleId, ctx.rollen, aufgabe, 'Rolle', 'warnung', id),
    mediumId: verweis(ctx, x.mediumId, ctx.medien, aufgabe, 'System', 'warnung', id),
    bearbeitungMin: x.bearbeitungMin,
    liegezeitMin: x.liegezeitMin,
    art,
    freigabeQuote: x.freigabeQuote,
    brauchtVorgaenger: x.brauchtVorgaenger,
    uebertragung: ue === null ? null : { quelleMediumId: verweis(ctx, ue.quelleMediumId, ctx.medien, aufgabe, 'Quellsystem', 'warnung', id), minuten: ue.minuten as number },
    nachrichtAn: verweis(ctx, x.nachrichtAn, ctx.teilnehmer, aufgabe, 'Teilnehmer', 'hinweis', id),
    nachrichtVon: verweis(ctx, x.nachrichtVon, ctx.teilnehmer, aufgabe, 'Teilnehmer', 'hinweis', id),
  }
}

function projiziereZweig(z: unknown, wo: string, ctx: Kontext, tiefe: number, bereiche: PlId[]): PlZweig {
  const seq = projiziereSequenz(z, wo, ctx, tiefe + 1, bereiche)
  const x = z as Obj
  kennung(ctx, seq.id, wo)
  fordere(istText(x.bezeichnung) && istZahl(x.anteil) && (x.ende === null || istText(x.ende)), `${wo}: Angaben fehlen.`)
  // Format 1 kennt weder Rücksprung noch Ereignis.
  const zurueckZu = x.zurueckZu === undefined && ctx.version === 1 ? null : x.zurueckZu
  const ereignis = x.ereignis === undefined && ctx.version === 1 ? null : x.ereignis
  fordere(zurueckZu === null || istText(zurueckZu), `${wo}: Rücksprung ungültig.`)
  fordere(
    ereignis === null || (istObj(ereignis) && istZahl(ereignis.dauerMin) && (ereignis.art === 'zeit' || ereignis.art === 'nachricht') && istVerweis(ereignis.von)),
    `${wo}: Ereignis ungültig.`,
  )
  if (zurueckZu !== null && !bereiche.includes(zurueckZu)) {
    melde(ctx, 'warnung', 'E8', `${wo} („${x.bezeichnung}“): Rücksprung ins Leere; der Ausgang endet ohne Ergebnis.`, seq.id)
  }
  const ev: PlZweigEreignis | null =
    ereignis === null ? null : { art: ereignis.art as PlZweigEreignis['art'], dauerMin: ereignis.dauerMin as number, von: verweis(ctx, ereignis.von, ctx.teilnehmer, wo, 'Teilnehmer', 'hinweis', seq.id) }
  return { id: seq.id, bezeichnung: x.bezeichnung, anteil: x.anteil, schritte: seq.schritte, ende: x.ende, zurueckZu, ereignis: ev }
}

const AUSLOESER: readonly PlAusloeserArt[] = ['nachricht', 'zeit', 'bedingung', 'manuell']

function projiziereProzess(x: unknown, wo: string, version: number, befunde: Befund[]): PlProzess {
  fordere(istObj(x), `${wo} fehlt.`)
  fordere(x.formatVersion === undefined || (Number.isInteger(x.formatVersion) && (x.formatVersion as number) >= 1), `${wo}: Formatangabe ungültig.`)
  fordere(istText(x.id) && istText(x.name) && istText(x.ergebnis) && istZahl(x.vorgaengeProTag) && istZahl(x.arbeitsstundenProTag), `${wo}: Grunddaten fehlen.`)
  fordere(x.beschreibung === undefined || istText(x.beschreibung), `${wo}: Beschreibung ungültig.`)
  fordere(istObj(x.ausloeser) && istText(x.ausloeser.text) && AUSLOESER.includes(x.ausloeser.art as PlAusloeserArt) && istVerweis(x.ausloeser.von), `${wo}: Auslöser fehlt.`)
  fordere(Array.isArray(x.rollen) && Array.isArray(x.medien), `${wo}: Rollen oder Systeme fehlen.`)
  fordere(x.rollen.length <= MAX_ROLLEN, `${wo}: mehr als ${MAX_ROLLEN} Rollen.`)
  fordere(x.medien.length <= MAX_MEDIEN, `${wo}: mehr als ${MAX_MEDIEN} Systeme.`)
  // externe Teilnehmer gibt es seit Format 3
  const teilnehmerRoh = x.teilnehmer ?? []
  fordere(Array.isArray(teilnehmerRoh) && teilnehmerRoh.every((t) => istObj(t) && istText(t.id) && istText(t.name)), `${wo}: externe Teilnehmer ungültig.`)

  const ctx: Kontext = { prozess: wo, version, befunde, bausteine: 0, rollen: new Set(), medien: new Set(), teilnehmer: new Set(), kennungen: new Set() }
  const rollen: PlRolle[] = x.rollen.map((r, i) => {
    fordere(
      istObj(r) && istText(r.id) && istText(r.name) && istZahl(r.stundensatz) && istZahl(r.personen) && istZahl(r.verfuegbarProzent),
      `${wo}, Rolle ${i + 1}: Angaben fehlen.`,
    )
    ctx.rollen.add(r.id)
    return { id: r.id, name: r.name, stundensatz: r.stundensatz, personen: r.personen, verfuegbarProzent: r.verfuegbarProzent }
  })
  const medien: PlMedium[] = x.medien.map((m, i) => {
    fordere(istObj(m) && istText(m.id) && istText(m.name) && istText(m.art), `${wo}, System ${i + 1}: Angaben fehlen.`)
    ctx.medien.add(m.id)
    let art = m.art as PlMediumArt
    if (!PL_MEDIUM_ARTEN.includes(art)) {
      melde(ctx, 'hinweis', 'E7', `${wo}, System „${m.name}“: unbekannte Art „${m.art}“; als „${PL_MEDIUM_NAMEN.sonstiges}“ übernommen.`, m.id)
      art = 'sonstiges'
    }
    return { id: m.id, name: m.name, art }
  })
  const teilnehmer: PlTeilnehmer[] = (teilnehmerRoh as Obj[]).map((t) => {
    ctx.teilnehmer.add(t.id as string)
    return { id: t.id as string, name: t.name as string }
  })
  const ablauf = projiziereSequenz(x.ablauf, `${wo}, Ablauf`, ctx, 1, [])
  return {
    id: x.id,
    name: x.name,
    beschreibung: istText(x.beschreibung) ? x.beschreibung : '',
    ausloeser: {
      art: x.ausloeser.art as PlAusloeserArt,
      text: x.ausloeser.text,
      von: verweis(ctx, x.ausloeser.von, ctx.teilnehmer, `${wo}, Auslöser`, 'Teilnehmer', 'hinweis', x.id),
    },
    ergebnis: x.ergebnis,
    vorgaengeProTag: x.vorgaengeProTag,
    arbeitsstundenProTag: x.arbeitsstundenProTag,
    rollen,
    medien,
    teilnehmer,
    ablauf,
  }
}

/**
 * E3 bis E8 für bereits geparste Daten. Prüft Version und Struktur, stellt
 * ältere Formate um und gibt eine Projektion mit Befunden zurück.
 */
export function projiziereProjekt(daten: unknown): LeseErgebnis {
  fordere(istObj(daten), 'Die Datei enthält kein Prozesslotse-Projekt.')
  fordere(daten.app !== 'auswahllotse', 'Das ist ein Auswahl-Lotse-Projekt. Bitte über „Öffnen“ laden.')
  fordere(typeof daten.formatVersion === 'number', 'Die Datei enthält kein Prozesslotse-Projekt.')
  const version = daten.formatVersion
  fordere(
    Number.isInteger(version) && version >= 1,
    `Diese Datei hat Format ${String(version)}. Der Auswahl-Lotse kennt Format 1 bis ${PL_FORMAT_AKTUELL}. Bitte den Auswahl-Lotsen aktualisieren.`,
  )
  const befunde: Befund[] = []
  if (version > PL_FORMAT_AKTUELL) {
    befunde.push({
      schwere: 'warnung',
      code: 'E4',
      text: `Diese Datei hat Format ${version}; der Auswahl-Lotse kennt Format 1 bis ${PL_FORMAT_AKTUELL}. Unbekannte Bausteine werden als allgemeine Schritte übernommen, neue Angaben übergangen. Bitte die Ergebnisse prüfen und den Auswahl-Lotsen aktualisieren.`,
      bezug: null,
    })
  }
  const ist = projiziereProzess(daten.ist, 'Ist-Prozess', version, befunde)
  const soll = daten.soll === undefined || daten.soll === null ? null : projiziereProzess(daten.soll, 'Soll-Prozess', version, befunde)
  fordere(Array.isArray(daten.massnahmen) && Array.isArray(daten.verworfen), 'Maßnahmenliste fehlt.')
  // Maßnahmen braucht der Auswahl-Lotse nicht; gültige Einträge werden der Vollständigkeit halber übernommen.
  const massnahmen: PlMassnahme[] = daten.massnahmen
    .filter((m): m is Obj => istObj(m) && istText(m.schluessel) && istText(m.titel) && istText(m.begruendung))
    .map((m) => ({ schluessel: m.schluessel as string, titel: m.titel as string, begruendung: m.begruendung as string }))
  const verworfen = daten.verworfen.filter(istText)
  return { projekt: { formatVersion: PL_FORMAT_AKTUELL, ist, soll, massnahmen, verworfen }, formatVersionGelesen: version, befunde }
}

/** E3: JSON-Text einer Prozesslotse-Datei lesen. */
export function leseProzessJson(text: string): LeseErgebnis {
  let daten: unknown
  try {
    daten = JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    throw new Lesefehler('Die Datei ist kein gültiges JSON.')
  }
  return projiziereProjekt(daten)
}

/** E2: BPMN, wenn die Endung .bpmn ist oder das erste Nicht-Leerzeichen „<“. */
export function istBpmn(dateiname: string, text: string): boolean {
  return /\.bpmn$/i.test(dateiname) || text.replace(/^﻿/, '').trimStart().startsWith('<')
}

export type QuelleOhneProjekt = Omit<ProzessQuelle, 'projekt'>
