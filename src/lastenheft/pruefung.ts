/**
 * Prüfungen der Anforderungen mit festen Regeln (Spezifikation 6.6, P1 bis
 * P10; P11 in nummern.ts). Ohne KI: Wortlisten und Zählregeln, damit jede
 * Meldung nachvollziehbar und testbar ist.
 */
import type { Befund } from '../modell/ergebnisse'
import { prozent } from '../modell/zahlformat'
import { GRUPPEN_REIHENFOLGE, gruppenName, type Anforderung, type Prioritaet } from '../modell/typen'
import { MUSS_ANTEIL_GRENZE, WOERTER_MAX } from '../regeln/schwellen'
import { PRIORITAET_NAMEN } from './texte'

const FLEXION = '(?:e|en|er|es|em)?'

/**
 * P1: unbestimmte Begriffe (eigene Liste, keine Quelle). Gebeugte Formen
 * zählen mit („schnelle“, „flexiblen“), Wortteile nicht („vereinfacht“).
 */
export const UNBESTIMMTE_BEGRIFFE: readonly { wort: string; muster: string }[] = [
  { wort: 'schnell', muster: `schnell${FLEXION}` },
  { wort: 'einfach', muster: `einfach${FLEXION}` },
  { wort: 'benutzerfreundlich', muster: `benutzerfreundlich${FLEXION}` },
  { wort: 'intuitiv', muster: `intuitiv${FLEXION}` },
  { wort: 'flexibel', muster: 'flexib(?:el|le|len|ler|les|lem)' },
  { wort: 'modern', muster: `modern${FLEXION}` },
  { wort: 'performant', muster: `performant${FLEXION}` },
  { wort: 'möglichst', muster: 'möglichst' },
  { wort: 'gegebenenfalls', muster: 'gegebenenfalls' },
  { wort: 'ggf.', muster: 'ggf\\.' },
  { wort: 'usw.', muster: 'usw\\.' },
  { wort: 'etc.', muster: 'etc\\.' },
  { wort: 'ca.', muster: 'ca\\.' },
  { wort: 'circa', muster: 'circa' },
  { wort: 'optimal', muster: `optimal${FLEXION}` },
  { wort: 'angemessen', muster: `angemessen${FLEXION}` },
  { wort: 'ausreichend', muster: `ausreichend${FLEXION}` },
  { wort: 'zeitnah', muster: `zeitnah${FLEXION}` },
  { wort: 'komfortabel', muster: 'komfortab(?:el|le|len|ler|les|lem)' },
  { wort: 'beliebig', muster: `beliebig${FLEXION}` },
  { wort: 'bei Bedarf', muster: 'bei\\s+Bedarf' },
  { wort: 'und/oder', muster: 'und\\s*/\\s*oder' },
]

/** Ganzes Wort: davor und danach kein Buchstabe und keine Ziffer. */
function wortMuster(muster: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${muster})(?![\\p{L}\\p{N}])`, 'iu')
}

const BEGRIFF_REGEX = UNBESTIMMTE_BEGRIFFE.map((b) => ({ wort: b.wort, regex: wortMuster(b.muster) }))

const MODAL_KLASSEN: Record<Exclude<Prioritaet, 'nicht'>, readonly string[]> = {
  muss: ['muss', 'müssen'],
  soll: ['sollte', 'sollten', 'soll', 'sollen'],
  kann: ['kann', 'können'],
}
const ALLE_MODALVERBEN = ['muss', 'müssen', 'sollte', 'sollten', 'soll', 'sollen', 'kann', 'können', 'darf', 'dürfen', 'wird', 'werden']

const enthaeltEines = (text: string, woerter: readonly string[]) => woerter.some((w) => wortMuster(w).test(text))

export function unbestimmteBegriffe(text: string): string[] {
  return BEGRIFF_REGEX.filter((b) => b.regex.test(text)).map((b) => b.wort)
}

export function woerter(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const vergleichstext = (t: string) => t.toLowerCase().replace(/\s+/g, ' ').trim()

/** P7: Muss / (Muss + Soll + Kann) über aktive Anforderungen; null ohne solche. */
export function mussAnteil(anforderungen: readonly Anforderung[]): number | null {
  const aktiv = anforderungen.filter((a) => a.status === 'aktiv' && a.prioritaet !== 'nicht')
  return aktiv.length === 0 ? null : aktiv.filter((a) => a.prioritaet === 'muss').length / aktiv.length
}

export interface Pruefergebnis {
  befunde: Befund[]
  mussAnteil: number | null
  aktiv: number
  offeneVorschlaege: number
}

const bezeichnung = (a: Anforderung) => a.nummer ?? (a.titel ? `„${a.titel}“` : 'ohne Titel')

export function pruefeAnforderungen(anforderungen: readonly Anforderung[]): Pruefergebnis {
  const befunde: Befund[] = []
  const hinweis = (code: string, text: string, bezug: string | null, schwere: Befund['schwere'] = 'hinweis') => befunde.push({ schwere, code, text, bezug })

  for (const a of anforderungen) {
    if (a.status === 'verworfen') continue
    // P1
    for (const wort of unbestimmteBegriffe(a.text)) hinweis('P1', `„${wort}“ ist unbestimmt; bitte messbar machen.`, a.id)
    // P2
    if (!enthaeltEines(a.text, ALLE_MODALVERBEN)) hinweis('P2', 'Verbindlichkeit fehlt: Der Text enthält kein Modalverb wie „muss“, „sollte“ oder „kann“.', a.id)
    // P3
    else if (a.prioritaet !== 'nicht') {
      const eigene = MODAL_KLASSEN[a.prioritaet]
      const fremde = Object.entries(MODAL_KLASSEN)
        .filter(([p]) => p !== a.prioritaet)
        .flatMap(([, w]) => w)
      if (!enthaeltEines(a.text, eigene) && enthaeltEines(a.text, fremde)) {
        hinweis('P3', `Das Modalverb passt nicht zur Priorität ${PRIORITAET_NAMEN[a.prioritaet]}.`, a.id)
      }
    }
    // P4
    if (a.status === 'aktiv' && (a.prioritaet === 'muss' || a.prioritaet === 'soll') && a.abnahme.trim() === '') {
      hinweis('P4', 'Abnahmekriterium fehlt.', a.id, 'warnung')
    }
    // P5
    const n = woerter(a.text)
    if (n > WOERTER_MAX) hinweis('P5', `Der Text hat ${n} Wörter; bitte aufteilen.`, a.id)
  }

  // P6: gleicher Text bei aktiven Anforderungen
  const aktive = anforderungen.filter((a) => a.status === 'aktiv')
  const nachText = new Map<string, Anforderung[]>()
  for (const a of aktive) {
    const t = vergleichstext(a.text)
    if (t === '') continue
    nachText.set(t, [...(nachText.get(t) ?? []), a])
  }
  for (const gleiche of nachText.values()) {
    if (gleiche.length < 2) continue
    for (const a of gleiche) {
      const andere = gleiche.filter((x) => x !== a).map(bezeichnung)
      hinweis('P6', `Gleicher Text wie ${andere.join(', ')}.`, a.id)
    }
  }

  // P7
  const anteil = mussAnteil(anforderungen)
  if (anteil !== null && anteil > MUSS_ANTEIL_GRENZE + 1e-9) {
    hinweis('P7', `${prozent(anteil)} % Muss. Empfohlen sind höchstens etwa 60 % (MoSCoW nach Aufwand; hier nach Anzahl).`, null, 'warnung')
  }

  // P8: Gruppe nur mit Muss (und Nicht) wirkt nur als K.-o.
  for (const g of GRUPPEN_REIHENFOLGE) {
    const inGruppe = aktive.filter((a) => a.gruppe === g)
    if (inGruppe.length > 0 && !inGruppe.some((a) => a.prioritaet === 'soll' || a.prioritaet === 'kann')) {
      hinweis('P8', `„${gruppenName(g)}“ hat keine Soll- oder Kann-Anforderung und wirkt nur als K.-o.`, `gruppe:${g}`)
    }
  }

  // P9
  if (aktive.length === 0) {
    hinweis('P9', 'Es gibt keine aktive Anforderung. Bitte Vorschläge übernehmen oder eigene Anforderungen anlegen.', null, 'fehler')
  }

  // P10
  const offen = anforderungen.filter((a) => a.status === 'vorschlag').length
  if (offen > 0) hinweis('P10', offen === 1 ? '1 Vorschlag noch offen.' : `${offen} Vorschläge noch offen.`, null)

  return { befunde, mussAnteil: anteil, aktiv: aktive.length, offeneVorschlaege: offen }
}
