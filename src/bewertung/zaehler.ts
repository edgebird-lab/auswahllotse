/**
 * G5: Hat die Bewertung der Angebote begonnen, zählt jede Änderung, die das
 * Ergebnis verschiebt (Gewichte, Punkte, Prioritäten und Status aktiver
 * Anforderungen, Regel, Mindestnutzwert, Budget). Die Entscheidungsvorlage
 * nennt die Zahl, damit nachträgliches Drehen an den Gewichten sichtbar wird.
 */
import type { AuswahlProjekt } from '../modell/typen'

export function zaehleAenderung(p: AuswahlProjekt): AuswahlProjekt {
  if (p.bewertungBegonnenAm === null) return p
  return { ...p, gewichtung: { ...p.gewichtung, aenderungenNachBewertung: p.gewichtung.aenderungenNachBewertung + 1 } }
}
