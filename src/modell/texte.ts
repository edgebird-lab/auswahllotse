/**
 * Texte zu Befunden und Kosten, die Oberfläche und Export (Beratungsakte)
 * gleich formulieren. Ohne React.
 */
import { jahreFuerRechnung } from '../kosten/kosten'
import type { Befund } from './ergebnisse'
import type { Anforderung, AuswahlProjekt } from './typen'
import { zahl } from './zahlformat'

/**
 * Befund mit der Anforderung davor, für Listen ohne Zusammenhang (Schritt
 * Ergebnis): „R-01: Der Text hat 44 Wörter; bitte aufteilen.“ Ohne Nummer
 * steht der Titel da; Befunde ohne Anforderung bleiben unverändert.
 */
export function befundMitAnforderung(b: Befund, anforderungen: readonly Anforderung[]): string {
  const a = b.bezug === null ? undefined : anforderungen.find((x) => x.id === b.bezug)
  if (!a) return b.text
  return `${a.nummer ?? `„${a.titel || 'ohne Titel'}“`}: ${b.text}`
}

/** „Gesamtkosten über 5 Jahre“ oder „Barwert über 5 Jahre bei 5 % Zins“. */
export function kostenbasisText(p: AuswahlProjekt): string {
  const w = p.wirtschaftlichkeit
  const t = jahreFuerRechnung(w.jahre)
  const jahre = t === 1 ? '1 Jahr' : `${t} Jahre`
  return w.kostenbasis === 'barwert' && w.zinsProzent !== null ? `Barwert über ${jahre} bei ${zahl(w.zinsProzent, 2)} % Zins` : `Gesamtkosten über ${jahre}`
}
