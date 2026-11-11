/**
 * Sperren der Schrittleiste (Spezifikation 5.1): Die Gewichtung braucht
 * mindestens eine aktive Soll- oder Kann-Anforderung, das Ergebnis
 * mindestens ein Angebot.
 */
import type { Kriterien } from '../bewertung/gewichte'
import type { AuswahlProjekt } from '../modell/typen'
import type { Schritt } from '../zustand'

export interface Sperre {
  grund: string
  /** Schritt, in dem man die Sperre aufhebt */
  ausweg: Schritt
}

export function sperreVon(s: Schritt, p: Pick<AuswahlProjekt, 'angebote'>, kriterien: Kriterien): Sperre | null {
  if (s === 'gewichtung' && kriterien.haupt.length === 0) {
    return { grund: 'Die Gewichtung braucht mindestens eine aktive Soll- oder Kann-Anforderung.', ausweg: 'anforderungen' }
  }
  if (s === 'ergebnis' && p.angebote.length === 0) return { grund: 'Das Ergebnis braucht mindestens ein Angebot.', ausweg: 'angebote' }
  return null
}
