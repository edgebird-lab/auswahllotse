/**
 * Änderungen an Gewichtung, Entscheidungsregel, Budget und Bewertungen
 * (Spezifikation 5.5, 5.6, Regel G5). Jede Funktion gibt ein neues Projekt
 * zurück. Nach Beginn der Bewertung zählt jede wirksame Änderung in
 * `aenderungenNachBewertung`.
 */
import { leereBewertung } from '../modell/projekt'
import type { AuswahlProjekt, Bewertung, Entscheidungsregel, Gewichtung, Gewichtungsmethode, Gruppe, Paarurteil } from '../modell/typen'
import { zaehleAenderung } from './zaehler'

function mitGewichtung(p: AuswahlProjekt, gewichtung: Gewichtung): AuswahlProjekt {
  return zaehleAenderung({ ...p, gewichtung })
}

export function setzeMethode(p: AuswahlProjekt, methode: Gewichtungsmethode): AuswahlProjekt {
  return p.gewichtung.methode === methode ? p : mitGewichtung(p, { ...p.gewichtung, methode })
}

/** Ein Prozentwert (G2); gespeichert wird die Eingabe, geprüft erst in `berechneGewichte`. */
export function setzeDirektProzent(p: AuswahlProjekt, gruppe: Gruppe, wert: number): AuswahlProjekt {
  if (p.gewichtung.direktProzent[gruppe] === wert) return p
  return mitGewichtung(p, { ...p.gewichtung, direktProzent: { ...p.gewichtung.direktProzent, [gruppe]: wert } })
}

/** Alle Prozentwerte auf einmal, z. B. nach „gleich verteilen“ oder „auf 100 % bringen“; zählt als eine Änderung. */
export function setzeDirektAlle(p: AuswahlProjekt, werte: Partial<Record<Gruppe, number>>): AuswahlProjekt {
  const neu = { ...p.gewichtung.direktProzent, ...werte }
  const gleich = (Object.keys(neu) as Gruppe[]).every((g) => neu[g] === p.gewichtung.direktProzent[g])
  return gleich ? p : mitGewichtung(p, { ...p.gewichtung, direktProzent: neu })
}

const gleichesPaar = (x: Paarurteil, a: Gruppe, b: Gruppe) => (x.a === a && x.b === b) || (x.a === b && x.b === a)

/** Ein Urteil im Paarvergleich setzen oder ersetzen (gleich, in welcher Reihenfolge das Paar vorher stand). */
export function setzePaarurteil(p: AuswahlProjekt, urteil: Paarurteil): AuswahlProjekt {
  const alt = p.gewichtung.paare.find((x) => gleichesPaar(x, urteil.a, urteil.b))
  if (alt && alt.a === urteil.a && alt.wichtiger === urteil.wichtiger && alt.staerke === urteil.staerke) return p
  // Stärke 1 heißt gleich wichtig, egal in welcher Richtung
  if (alt && alt.staerke === 1 && urteil.staerke === 1) return p
  const paare = [...p.gewichtung.paare.filter((x) => !gleichesPaar(x, urteil.a, urteil.b)), urteil]
  return mitGewichtung(p, { ...p.gewichtung, paare })
}

/** „Gewichte und Regel festlegen“ (G5). */
export function legeFest(p: AuswahlProjekt, jetzt: string): AuswahlProjekt {
  return { ...p, gewichtung: { ...p.gewichtung, festgelegtAm: jetzt } }
}

export function setzeRegel(p: AuswahlProjekt, regel: Entscheidungsregel): AuswahlProjekt {
  return p.entscheidung.regel === regel ? p : zaehleAenderung({ ...p, entscheidung: { ...p.entscheidung, regel } })
}

export function setzeMindestNutzwert(p: AuswahlProjekt, wert: number): AuswahlProjekt {
  const w = Math.min(10, Math.max(0, wert))
  return p.entscheidung.mindestNutzwert === w ? p : zaehleAenderung({ ...p, entscheidung: { ...p.entscheidung, mindestNutzwert: w } })
}

export function setzeBudget(p: AuswahlProjekt, budgetEuro: number | null): AuswahlProjekt {
  if (p.wirtschaftlichkeit.budgetEuro === budgetEuro) return p
  return zaehleAenderung({ ...p, wirtschaftlichkeit: { ...p.wirtschaftlichkeit, budgetEuro } })
}

export function setzeBudgetAlsKo(p: AuswahlProjekt, budgetAlsKo: boolean): AuswahlProjekt {
  if (p.wirtschaftlichkeit.budgetAlsKo === budgetAlsKo) return p
  return zaehleAenderung({ ...p, wirtschaftlichkeit: { ...p.wirtschaftlichkeit, budgetAlsKo } })
}

/**
 * Bewertung eines Angebots zu einer Anforderung setzen. Punkte sind ganze
 * Zahlen 0 bis 10. Die erste Punktzahl oder das erste K.-o.-Ergebnis setzt
 * `bewertungBegonnenAm`.
 */
export function setzeBewertung(p: AuswahlProjekt, angebotId: string, anforderungId: string, teil: Partial<Bewertung>, jetzt: string): AuswahlProjekt {
  const index = p.angebote.findIndex((a) => a.id === angebotId)
  if (index < 0) return p
  const angebot = p.angebote[index]
  const alt = angebot.bewertungen[anforderungId] ?? leereBewertung()
  // „punkte: null“ löscht die Punktzahl; fehlt das Feld, bleibt sie
  const punkte = teil.punkte === undefined ? alt.punkte : teil.punkte === null ? null : Math.min(10, Math.max(0, Math.round(teil.punkte)))
  const neu: Bewertung = { ...alt, ...teil, punkte }
  const angebote = [...p.angebote]
  angebote[index] = { ...angebot, bewertungen: { ...angebot.bewertungen, [anforderungId]: neu } }
  const beginnt = p.bewertungBegonnenAm === null && (neu.punkte !== null || (neu.ko !== null && neu.ko !== undefined))
  return { ...p, angebote, bewertungBegonnenAm: beginnt ? jetzt : p.bewertungBegonnenAm }
}
