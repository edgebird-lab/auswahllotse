/**
 * Änderungen an Anforderungen (Spezifikation 5.4): Übernehmen, Verwerfen,
 * Wiederherstellen, Priorität, Texte, Punkte, eigene Anforderungen. Jede
 * Funktion gibt ein neues Projekt zurück und merkt, was der Benutzer selbst
 * geändert hat (`bearbeitet`), damit „Neu einlesen“ es nicht überschreibt.
 */
import { zaehleAenderung } from '../bewertung/zaehler'
import { neueId } from '../modell/projekt'
import type { Anforderung, AnforderungsStatus, AuswahlProjekt, Gruppe, Prioritaet } from '../modell/typen'
import { PUNKTE_STANDARD } from '../regeln/schwellen'
import { nummeriere } from './nummern'
import { ersetzeModalverb } from './texte'

/** Ändert eine Anforderung; vergibt bei Aktivierung die Nummer (P11) und zählt Änderungen nach Bewertungsbeginn (G5). */
export function aendereAnforderung(p: AuswahlProjekt, id: string, aendern: (a: Anforderung) => Anforderung): AuswahlProjekt {
  const index = p.anforderungen.findIndex((a) => a.id === id)
  if (index < 0) return p
  const alt = p.anforderungen[index]
  const naechste = { ...p.naechsteNummer }
  const neu = nummeriere(aendern(alt), naechste)
  const anforderungen = [...p.anforderungen]
  anforderungen[index] = neu
  const ergebnis = { ...p, anforderungen, naechsteNummer: naechste }
  // G5: Priorität, Punkte oder Aktivierung einer Anforderung verschieben das Ergebnis
  const wirkt =
    (alt.status === 'aktiv' || neu.status === 'aktiv') && (alt.prioritaet !== neu.prioritaet || alt.punkte !== neu.punkte || alt.status !== neu.status)
  return wirkt ? zaehleAenderung(ergebnis) : ergebnis
}

function setzeStatus(p: AuswahlProjekt, id: string, status: AnforderungsStatus): AuswahlProjekt {
  return aendereAnforderung(p, id, (a) => (a.status === status ? a : { ...a, status, bearbeitet: { ...a.bearbeitet, status: true } }))
}

/** „Übernehmen“: Vorschlag wird aktiv und bekommt eine Nummer. */
export function uebernimm(p: AuswahlProjekt, id: string): AuswahlProjekt {
  return setzeStatus(p, id, 'aktiv')
}

export function verwirf(p: AuswahlProjekt, id: string): AuswahlProjekt {
  return setzeStatus(p, id, 'verworfen')
}

/** „Wiederherstellen“: mit Nummer wieder aktiv, sonst wieder Vorschlag. */
export function stelleWiederHer(p: AuswahlProjekt, id: string): AuswahlProjekt {
  const a = p.anforderungen.find((x) => x.id === id)
  if (!a || a.status !== 'verworfen') return p
  return setzeStatus(p, id, a.nummer !== null ? 'aktiv' : 'vorschlag')
}

/** „Alle Vorschläge dieser Gruppe übernehmen“ */
export function uebernimmAlleVorschlaege(p: AuswahlProjekt, gruppe: Gruppe): AuswahlProjekt {
  return p.anforderungen.filter((a) => a.gruppe === gruppe && a.status === 'vorschlag').reduce((q, a) => uebernimm(q, a.id), p)
}

/**
 * Priorität ändern (A1): Ein unbearbeiteter Text bekommt das passende
 * Modalverb; Standardpunkte folgen der neuen Priorität (A13).
 */
export function setzePrioritaet(p: AuswahlProjekt, id: string, prioritaet: Prioritaet): AuswahlProjekt {
  return aendereAnforderung(p, id, (a) => {
    if (a.prioritaet === prioritaet) return a
    return {
      ...a,
      prioritaet,
      text: a.bearbeitet.text ? a.text : ersetzeModalverb(a.text, a.prioritaet, prioritaet),
      punkte: a.punkte === PUNKTE_STANDARD[a.prioritaet] ? PUNKTE_STANDARD[prioritaet] : a.punkte,
      bearbeitet: { ...a.bearbeitet, prioritaet: prioritaet !== a.prioritaetVorschlag },
    }
  })
}

/** Titel, Text oder Abnahmekriterium bearbeiten. */
export function setzeTexte(p: AuswahlProjekt, id: string, werte: Partial<Pick<Anforderung, 'titel' | 'text' | 'abnahme'>>): AuswahlProjekt {
  return aendereAnforderung(p, id, (a) => {
    const neu = { ...a, ...werte }
    const geaendert = neu.titel !== a.titel || neu.text !== a.text || neu.abnahme !== a.abnahme
    return geaendert ? { ...neu, bearbeitet: { ...a.bearbeitet, text: true } } : a
  })
}

export function setzeNotiz(p: AuswahlProjekt, id: string, notiz: string): AuswahlProjekt {
  return aendereAnforderung(p, id, (a) => (a.notiz === notiz ? a : { ...a, notiz }))
}

/** Punkte in der Gruppe (G4): ganze Zahl 0 bis 10. */
export function setzePunkte(p: AuswahlProjekt, id: string, punkte: number): AuswahlProjekt {
  const wert = Math.min(10, Math.max(0, Math.round(Number.isFinite(punkte) ? punkte : 0)))
  return aendereAnforderung(p, id, (a) => (a.punkte === wert ? a : { ...a, punkte: wert }))
}

/** „Eigene Anforderung“: sofort aktiv mit Nummer; wird beim Neu-Einlesen nie verändert. */
export function neueEigeneAnforderung(
  p: AuswahlProjekt,
  gruppe: Gruppe,
  werte: Partial<Pick<Anforderung, 'titel' | 'text' | 'abnahme' | 'prioritaet'>> = {},
): { projekt: AuswahlProjekt; id: string } {
  const prioritaet = werte.prioritaet ?? 'soll'
  const id = `eigene:${neueId()}`
  const a: Anforderung = {
    id,
    nummer: null,
    gruppe,
    titel: werte.titel ?? '',
    text: werte.text ?? '',
    abnahme: werte.abnahme ?? '',
    prioritaet,
    prioritaetVorschlag: prioritaet,
    status: 'aktiv',
    herkunft: { art: 'eigene', bezuege: [], katalogId: null },
    begruendung: 'Eigene Anforderung.',
    quelle: null,
    punkte: PUNKTE_STANDARD[prioritaet],
    bearbeitet: { text: true, prioritaet: false, status: false },
    notiz: '',
  }
  const naechste = { ...p.naechsteNummer }
  const neu = nummeriere(a, naechste)
  return { projekt: zaehleAenderung({ ...p, anforderungen: [...p.anforderungen, neu], naechsteNummer: naechste }), id }
}

/** Löscht eine eigene Anforderung ganz; abgeleitete werden nur verworfen. */
export function loescheEigene(p: AuswahlProjekt, id: string): AuswahlProjekt {
  const a = p.anforderungen.find((x) => x.id === id)
  if (!a || a.herkunft.art !== 'eigene') return p
  const ergebnis = { ...p, anforderungen: p.anforderungen.filter((x) => x.id !== id) }
  return a.status === 'aktiv' ? zaehleAenderung(ergebnis) : ergebnis
}
