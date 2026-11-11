/**
 * Wahl, Begründung, Risiken und Status der Entscheidung (Spezifikation 5.8,
 * 6.12 D4 und D5). Jede Änderung gibt ein neues Projekt zurück.
 */
import type { Auswertung, Befund } from '../modell/ergebnisse'
import { neueId } from '../modell/projekt'
import type { AuswahlProjekt, Entscheidung, Id, Risiko } from '../modell/typen'
import { angebotsname } from '../bewertung/nutzwert'

/** Gewähltes Angebot: die eigene Wahl, wenn es das Angebot noch gibt, sonst die Empfehlung der Regel. */
export function gewaehlteId(p: AuswahlProjekt, w: Pick<Auswertung, 'empfehlungId'>): Id | null {
  const eigene = p.entscheidung.gewaehltId
  return eigene !== null && p.angebote.some((a) => a.id === eigene) ? eigene : w.empfehlungId
}

/** D4 und D6: abweichende Wahl ohne Begründung, gewähltes Angebot ungültig. */
export function pruefeEntscheidung(p: AuswahlProjekt, w: Auswertung): Befund[] {
  const befunde: Befund[] = []
  const id = gewaehlteId(p, w)
  if (id === null) return befunde
  const angebot = p.angebote.find((a) => a.id === id)
  if (id !== w.empfehlungId && p.entscheidung.begruendung.trim() === '') {
    befunde.push({
      schwere: 'warnung',
      code: 'D4',
      text: w.empfehlungId === null ? 'Es gibt keine Empfehlung der Regel; bitte die Wahl begründen.' : 'Die Wahl weicht von der Empfehlung ab; bitte die Begründung selbst schreiben.',
      bezug: id,
    })
  }
  const ergebnis = w.ergebnisse.find((r) => r.angebotId === id)
  if (angebot && ergebnis && !ergebnis.gueltig) {
    befunde.push({ schwere: 'warnung', code: 'D6', text: `Das gewählte Angebot ${angebotsname(angebot)} ist ungültig (${ergebnis.ausschluss.join(', ')}).`, bezug: id })
  }
  return befunde
}

export interface FinalPruefung {
  moeglich: boolean
  /** Grund, warum „final“ gesperrt ist */
  grund: string | null
}

/** D5: „final“ nur ohne Fehler und mit einem gewählten Angebot. */
export function finalMoeglich(befunde: readonly Befund[], gewaehlt: Id | null): FinalPruefung {
  const fehler = befunde.filter((b) => b.schwere === 'fehler')
  if (fehler.length > 0) {
    const erster = fehler[0].text
    return { moeglich: false, grund: fehler.length === 1 ? `Erst den Fehler beheben: ${erster}` : `Erst die ${fehler.length} Fehler beheben, zuerst: ${erster}` }
  }
  if (gewaehlt === null) return { moeglich: false, grund: 'Es ist kein Angebot gewählt und es gibt keine Empfehlung.' }
  return { moeglich: true, grund: null }
}

function mitEntscheidung(p: AuswahlProjekt, teil: Partial<Entscheidung>): AuswahlProjekt {
  return { ...p, entscheidung: { ...p.entscheidung, ...teil } }
}

/** Angebot wählen; null heißt „Empfehlung der Regel“. */
export function waehleAngebot(p: AuswahlProjekt, id: Id | null): AuswahlProjekt {
  return p.entscheidung.gewaehltId === id ? p : mitEntscheidung(p, { gewaehltId: id })
}

export function setzeBegruendung(p: AuswahlProjekt, begruendung: string): AuswahlProjekt {
  return p.entscheidung.begruendung === begruendung ? p : mitEntscheidung(p, { begruendung })
}

/**
 * Status setzen. „final“ nur, wenn D5 es erlaubt; dabei wird das Datum
 * gesetzt. Zurück auf „Entwurf“ löscht das Datum.
 */
export function setzeEntscheidungsStatus(p: AuswahlProjekt, status: Entscheidung['status'], pruefung: FinalPruefung, jetzt: string): AuswahlProjekt {
  if (status === p.entscheidung.status) return p
  if (status === 'final') return pruefung.moeglich ? mitEntscheidung(p, { status, datum: jetzt }) : p
  return mitEntscheidung(p, { status, datum: null })
}

export function neuesRisiko(p: AuswahlProjekt, text = '', massnahme = ''): { projekt: AuswahlProjekt; id: Id } {
  const risiko: Risiko = { id: neueId(), text, massnahme }
  return { projekt: mitEntscheidung(p, { risiken: [...p.entscheidung.risiken, risiko] }), id: risiko.id }
}

export function setzeRisiko(p: AuswahlProjekt, id: Id, teil: Partial<Omit<Risiko, 'id'>>): AuswahlProjekt {
  const risiken = p.entscheidung.risiken.map((r) => (r.id === id ? { ...r, ...teil } : r))
  return mitEntscheidung(p, { risiken })
}

export function loescheRisiko(p: AuswahlProjekt, id: Id): AuswahlProjekt {
  return mitEntscheidung(p, { risiken: p.entscheidung.risiken.filter((r) => r.id !== id) })
}
