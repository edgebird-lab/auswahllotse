/**
 * G5: Hat die Bewertung der Angebote begonnen, zählt jede Änderung, die das
 * Ergebnis verschiebt (Gewichte, Punkte, Prioritäten und Status aktiver
 * Anforderungen, Regel, Mindestnutzwert, Budget). Die Entscheidungsvorlage
 * nennt die Zahl, damit nachträgliches Drehen an den Gewichten sichtbar wird.
 */
import type { Anforderung, AuswahlProjekt } from '../modell/typen'

export function zaehleAenderung(p: AuswahlProjekt): AuswahlProjekt {
  if (p.bewertungBegonnenAm === null) return p
  return { ...p, gewichtung: { ...p.gewichtung, aenderungenNachBewertung: p.gewichtung.aenderungenNachBewertung + 1 } }
}

/** Was eine Anforderung zum Ergebnis beiträgt: aktiv mit Priorität (K.-o. oder Nutzwert) und Punkten. */
const wirkung = (a: Anforderung) => (a.status === 'aktiv' ? `${a.prioritaet}:${a.punkte}` : '')

/**
 * G5 für Abgleiche (Neu einlesen, Rahmen, Umfang, ohne Prozessmodell): zählt
 * einmal, wenn dabei eine Anforderung aktiv wird oder wegfällt oder ihre
 * Priorität oder Punkte wechseln. Reine Textänderungen zählen nicht.
 */
export function zaehleAbgleich(vorher: readonly Anforderung[], p: AuswahlProjekt): AuswahlProjekt {
  if (p.bewertungBegonnenAm === null) return p
  const alt = new Map(vorher.map((a) => [a.id, wirkung(a)]))
  const neu = new Map(p.anforderungen.map((a) => [a.id, wirkung(a)]))
  const geaendert = [...new Set([...alt.keys(), ...neu.keys()])].some((id) => (alt.get(id) ?? '') !== (neu.get(id) ?? ''))
  return geaendert ? zaehleAenderung(p) : p
}

/** Projekt ohne Zähler und Änderungszeit, um den Inhalt zweier Stände zu vergleichen. */
const inhalt = (p: AuswahlProjekt) => JSON.stringify({ ...p, geaendertAm: '', gewichtung: { ...p.gewichtung, aenderungenNachBewertung: 0 } })

/**
 * G5 beim Tippen: Jeder Tastendruck in einem Zahlenfeld ist eine eigene
 * Änderung, „80000“ wären sonst fünf. Eine zusammengefasste Eingabe (ein
 * Rückgängig-Schritt, siehe zustand.ts) zählt deshalb höchstens einmal und
 * gar nicht, wenn am Ende wieder der Ausgangswert dasteht. `basis` ist der
 * Stand vor der Eingabe, `neu` der Stand nach dem letzten Tastendruck.
 */
export function zaehleEingabeEinmal(basis: AuswahlProjekt, neu: AuswahlProjekt): AuswahlProjekt {
  const vorher = basis.gewichtung.aenderungenNachBewertung
  if (neu.gewichtung.aenderungenNachBewertung <= vorher) return neu
  const zaehler = inhalt(neu) === inhalt(basis) ? vorher : vorher + 1
  if (zaehler === neu.gewichtung.aenderungenNachBewertung) return neu
  return { ...neu, gewichtung: { ...neu.gewichtung, aenderungenNachBewertung: zaehler } }
}
