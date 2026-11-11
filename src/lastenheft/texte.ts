/**
 * Satzbausteine für Anforderungen (Spezifikation 6.5, Regel A1):
 * Modalverb nach Priorität, Aufzählungen, Einzahl und Mehrzahl.
 */
import type { Prioritaet } from '../modell/typen'

const MODALVERB: Record<Prioritaet, string> = { muss: 'muss', soll: 'sollte', kann: 'kann', nicht: 'muss' }

export const PRIORITAET_NAMEN: Record<Prioritaet, string> = { muss: 'Muss', soll: 'Soll', kann: 'Kann', nicht: 'Nicht' }

/** A1: muss → „muss“, soll → „sollte“, kann → „kann“, nicht → „muss“ (mit Marke „nicht in diesem Vorhaben“). */
export function modalverb(p: Prioritaet): string {
  return MODALVERB[p]
}

/**
 * A1: Ändert sich die Priorität eines unbearbeiteten Texts, wird das
 * Modalverb getauscht. Die Satzmuster beginnen mit „Die Software …“, „Der
 * Anbieter …“ oder „Der Shop …“; ersetzt wird das erste Modalverb der alten
 * Priorität als ganzes Wort.
 */
export function ersetzeModalverb(text: string, alt: Prioritaet, neu: Prioritaet): string {
  const von = modalverb(alt)
  const nach = modalverb(neu)
  if (von === nach) return text
  return text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${von}(?![\\p{L}\\p{N}])`, 'u'), nach)
}

/** Name in deutschen Anführungszeichen. */
export function zitiert(name: string): string {
  return `„${name}“`
}

/** „A“, „B“ und „C“ */
export function aufzaehlung(namen: readonly string[]): string {
  const z = namen.map(zitiert)
  if (z.length <= 1) return z.join('')
  return `${z.slice(0, -1).join(', ')} und ${z[z.length - 1]}`
}

/** Liste ohne Anführungszeichen: „A, B und C“. */
export function liste(teile: readonly string[]): string {
  if (teile.length <= 1) return teile.join('')
  return `${teile.slice(0, -1).join(', ')} und ${teile[teile.length - 1]}`
}

/**
 * Angezeigte Zahl mit Einheit in Einzahl oder Mehrzahl: „1 Minute“, „1,5
 * Minuten“, „0 Minuten“. Maßgeblich ist der Text, wie er dasteht: 1,04
 * Referenzbetriebe gerundet auf „1“ ergeben „1 Referenzbetrieb“.
 */
export function mitEinheit(text: string, einzahl: string, mehrzahl: string): string {
  return `${text} ${text === '1' ? einzahl : mehrzahl}`
}
