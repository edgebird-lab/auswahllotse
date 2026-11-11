/**
 * Zustand der Oberfläche (Spezifikation 5.1, 7.3). Das Projekt ist
 * rückgängig machbar; Schritt und Einstellungen nicht. Änderungen kommen als
 * reine Funktionen aus der Fachlogik (lastenheft/, bewertung/, kosten/,
 * entscheidung/); der Reducer führt nur Verlauf und Dokument.
 */
import type { AuswahlProjekt, Einstellungen } from './modell/typen'

export type Schritt = 'rahmen' | 'prozess' | 'anforderungen' | 'gewichtung' | 'angebote' | 'ergebnis' | 'vorlagen'

export const SCHRITTE: { id: Schritt; name: string }[] = [
  { id: 'rahmen', name: 'Rahmen' },
  { id: 'prozess', name: 'Prozess' },
  { id: 'anforderungen', name: 'Anforderungen' },
  { id: 'gewichtung', name: 'Gewichtung' },
  { id: 'angebote', name: 'Angebote' },
  { id: 'ergebnis', name: 'Ergebnis' },
  { id: 'vorlagen', name: 'Vorlagen' },
]

export function schrittNummer(s: Schritt): number {
  return SCHRITTE.findIndex((x) => x.id === s) + 1
}

/** Die Datei hinter dem Projekt. */
export interface Dokument {
  /** Pfad im Windows-Programm (Phase 9); im Browser null */
  pfad: string | null
  /** Dateiname zur Anzeige; null bei einem nie gespeicherten Projekt */
  name: string | null
  /** Stand beim letzten Öffnen oder Speichern; null, wenn unbekannt */
  gespeichert: AuswahlProjekt | null
}

export interface Zustand {
  projekt: AuswahlProjekt
  dokument: Dokument
  vergangenheit: AuswahlProjekt[]
  zukunft: AuswahlProjekt[]
  /** Zusammengehörige Eingaben (Tippen in einem Feld) werden zu einem Rückgängig-Schritt. */
  gruppe: string | null
  gruppeZeit: number
  schritt: Schritt
  einstellungen: Einstellungen
}

export type Aktion =
  | { typ: 'aendern'; aenderung: (p: AuswahlProjekt) => AuswahlProjekt; zeit: number; gruppe?: string }
  | { typ: 'laden'; projekt: AuswahlProjekt; schritt?: Schritt; dokument?: Partial<Dokument> }
  | { typ: 'gespeichert'; projekt: AuswahlProjekt; pfad: string | null; name: string }
  | { typ: 'rueckgaengig' }
  | { typ: 'wiederholen' }
  | { typ: 'schritt'; schritt: Schritt }
  | { typ: 'einstellungen'; einstellungen: Partial<Einstellungen> }

export const MAX_VERLAUF = 100
export const GRUPPE_MS = 1500

export function startZustand(projekt: AuswahlProjekt, einstellungen: Einstellungen, dokument: Partial<Dokument> = {}): Zustand {
  return {
    projekt,
    dokument: { pfad: null, name: null, gespeichert: projekt, ...dokument },
    vergangenheit: [],
    zukunft: [],
    gruppe: null,
    gruppeZeit: 0,
    schritt: 'rahmen',
    einstellungen,
  }
}

/**
 * Weicht das Projekt vom gespeicherten Stand ab? Projekte sind unveränderlich,
 * deshalb genügt der Vergleich der Referenz; wer bis zum gespeicherten Stand
 * zurücknimmt, hat wieder nichts geändert.
 */
export function istGeaendert(z: Pick<Zustand, 'projekt' | 'dokument'>): boolean {
  return z.dokument.gespeichert !== z.projekt
}

function mitVerlauf(z: Zustand, projekt: AuswahlProjekt, zeit: number, gruppe?: string): Zustand {
  const zusammenfassen = gruppe !== undefined && z.gruppe === gruppe && zeit - z.gruppeZeit < GRUPPE_MS
  return {
    ...z,
    projekt,
    vergangenheit: zusammenfassen ? z.vergangenheit : [...z.vergangenheit.slice(-(MAX_VERLAUF - 1)), z.projekt],
    zukunft: [],
    gruppe: gruppe ?? null,
    gruppeZeit: zeit,
  }
}

export function reduziere(z: Zustand, a: Aktion): Zustand {
  switch (a.typ) {
    case 'aendern': {
      const neu = a.aenderung(z.projekt)
      if (neu === z.projekt) return z
      return mitVerlauf(z, { ...neu, geaendertAm: new Date(a.zeit).toISOString() }, a.zeit, a.gruppe)
    }
    case 'laden':
      return { ...startZustand(a.projekt, z.einstellungen, a.dokument), schritt: a.schritt ?? 'rahmen' }
    case 'gespeichert':
      // Gespeichert wurde der Stand beim Speichern; spätere Änderungen bleiben „geändert“.
      return { ...z, dokument: { pfad: a.pfad, name: a.name, gespeichert: a.projekt } }
    case 'rueckgaengig': {
      const vorher = z.vergangenheit[z.vergangenheit.length - 1]
      if (!vorher) return z
      return { ...z, projekt: vorher, vergangenheit: z.vergangenheit.slice(0, -1), zukunft: [z.projekt, ...z.zukunft], gruppe: null }
    }
    case 'wiederholen': {
      const nachher = z.zukunft[0]
      if (!nachher) return z
      return { ...z, projekt: nachher, vergangenheit: [...z.vergangenheit, z.projekt], zukunft: z.zukunft.slice(1), gruppe: null }
    }
    case 'schritt':
      return z.schritt === a.schritt ? z : { ...z, schritt: a.schritt, gruppe: null }
    case 'einstellungen':
      return { ...z, einstellungen: { ...z.einstellungen, ...a.einstellungen } }
  }
}
