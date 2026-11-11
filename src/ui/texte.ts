/**
 * Kleine Texte der Oberfläche, die mehrere Schritte und Vorlagen teilen.
 */
import { jahreFuerRechnung } from '../kosten/kosten'
import type { MedienbruchFall, Schwere } from '../modell/ergebnisse'
import type { AuswahlProjekt } from '../modell/typen'
import { zahl } from '../modell/zahlformat'

export const SCHWERE_TEXT: Record<Schwere, string> = { fehler: 'Fehler', warnung: 'Warnung', hinweis: 'Hinweis' }

/** Medienbruch-Fälle nach U4 (6.4). */
export const FALL_TEXT: Record<MedienbruchFall, string> = {
  A: 'Integration in der neuen Software',
  B: 'Schnittstelle',
  C: 'Erfassung an der Quelle',
  D: 'Schnittstelle als Vorschlag',
  E: 'außerhalb des Umfangs',
}

/** „Gesamtkosten über 5 Jahre“ oder „Barwert über 5 Jahre bei 5 % Zins“. */
export function kostenbasisText(p: AuswahlProjekt): string {
  const w = p.wirtschaftlichkeit
  const t = jahreFuerRechnung(w.jahre)
  const jahre = t === 1 ? '1 Jahr' : `${t} Jahre`
  return w.kostenbasis === 'barwert' && w.zinsProzent !== null ? `Barwert über ${jahre} bei ${zahl(w.zinsProzent, 2)} % Zins` : `Gesamtkosten über ${jahre}`
}

/** Deutsche Zahl lesen: „1.234,5“ und „1234,5“; „1.5“ ohne Komma gilt als 1,5. */
export function leseZahl(text: string): number | null {
  let sauber = text.replace(/\s/g, '').replace(/€|%/g, '')
  if (sauber.includes(',')) sauber = sauber.replace(/\./g, '').replace(',', '.')
  if (sauber === '' || sauber === '-' || sauber === '−') return null
  const n = Number(sauber.replace('−', '-'))
  return Number.isFinite(n) ? n : null
}
