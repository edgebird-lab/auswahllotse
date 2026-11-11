/**
 * Kleine Bausteine für Testprozesse im Format des Prozesslotsen
 * (bereits projiziert, also `Pl`-Typen). Nur für Tests.
 */
import type { PlAufgabe, PlBlock, PlEntscheidung, PlOder, PlOderZweig, PlProjekt, PlProzess, PlWiederholung, PlZweig } from '../prozessdatei/format'

export function aufgabe(id: string, werte: Partial<PlAufgabe> = {}): PlAufgabe {
  return {
    typ: 'aufgabe',
    id,
    name: id,
    rolleId: null,
    mediumId: null,
    bearbeitungMin: 1,
    liegezeitMin: 0,
    art: 'normal',
    freigabeQuote: 0.9,
    brauchtVorgaenger: true,
    uebertragung: null,
    nachrichtAn: null,
    nachrichtVon: null,
    ...werte,
  }
}

export function zweig(id: string, anteil: number, schritte: PlBlock[], werte: Partial<PlZweig> = {}): PlZweig {
  return { id, bezeichnung: id, anteil, schritte, ende: null, zurueckZu: null, ereignis: null, ...werte }
}

export function entscheidung(id: string, zweige: PlZweig[], werte: Partial<PlEntscheidung> = {}): PlEntscheidung {
  return { typ: 'entscheidung', id, art: 'daten', frage: `${id}?`, zweige, ...werte }
}

export function oder(id: string, zweige: PlOderZweig[], standard: string | null = null): PlOder {
  return { typ: 'oder', id, frage: `${id}?`, zweige, standard }
}

export function oderWeg(id: string, anteil: number, schritte: PlBlock[]): PlOderZweig {
  return { id, bezeichnung: id, anteil, schritte }
}

export function wiederholung(id: string, anteil: number, schritte: PlBlock[], werte: Partial<PlWiederholung> = {}): PlWiederholung {
  return { typ: 'wiederholung', id, modus: 'anteil', zweck: 'nacharbeit', frage: '', anteilWiederholung: anteil, koerper: { id: `${id}_k`, schritte }, ...werte }
}

export function prozess(schritte: PlBlock[], werte: Partial<PlProzess> = {}): PlProzess {
  return {
    id: 'pro_test',
    name: 'Testprozess',
    beschreibung: '',
    ausloeser: { art: 'manuell', text: '', von: null },
    ergebnis: 'Fertig',
    vorgaengeProTag: 10,
    arbeitsstundenProTag: 8,
    rollen: [],
    medien: [],
    teilnehmer: [],
    ablauf: { id: 'haupt', schritte },
    ...werte,
  }
}

export function projekt(ist: PlProzess, soll: PlProzess | null = null): PlProjekt {
  return { formatVersion: 3, ist, soll, massnahmen: [], verworfen: [] }
}
