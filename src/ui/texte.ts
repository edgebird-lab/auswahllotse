/**
 * Kleine Texte der Oberfläche, die mehrere Schritte und Vorlagen teilen.
 * Texte, die auch der Export braucht, stehen in `modell/texte.ts`.
 */
import type { MedienbruchFall, Schwere } from '../modell/ergebnisse'

export const SCHWERE_TEXT: Record<Schwere, string> = { fehler: 'Fehler', warnung: 'Warnung', hinweis: 'Hinweis' }

/** Medienbruch-Fälle nach U4 (6.4). */
export const FALL_TEXT: Record<MedienbruchFall, string> = {
  A: 'Integration in der neuen Software',
  B: 'Schnittstelle',
  C: 'Erfassung an der Quelle',
  D: 'Schnittstelle als Vorschlag',
  E: 'außerhalb des Umfangs',
}

/** Punkte als Tausendertrennzeichen ohne Komma: „12.000“, „1.234.567“ (erste Gruppe ohne führende Null). */
const TAUSENDERGRUPPEN = /^[+-]?[1-9]\d{0,2}(?:\.\d{3})+$/

/**
 * Deutsche Zahl lesen: „1.234,5“, „1234,5“ und „12.000“ (Punkte als
 * Tausendertrennzeichen, wie man Beträge in Deutschland schreibt). Ohne
 * Komma und ohne Dreiergruppen gilt der Punkt als Dezimalzeichen: „1.5“
 * ist 1,5 und „0.125“ ist 0,125. Leer oder ungültig ergibt null.
 */
export function leseZahl(text: string): number | null {
  let sauber = text.replace(/\s/g, '').replace(/€|%/g, '').replace(/−/g, '-')
  if (sauber.includes(',')) sauber = sauber.replace(/\./g, '').replace(',', '.')
  else if (TAUSENDERGRUPPEN.test(sauber)) sauber = sauber.replace(/\./g, '')
  if (sauber === '' || sauber === '-' || sauber === '+') return null
  const n = Number(sauber)
  return Number.isFinite(n) ? n : null
}
