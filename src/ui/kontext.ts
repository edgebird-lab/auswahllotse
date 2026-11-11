import { createContext, useContext, type Dispatch } from 'react'
import type { Gesamt } from '../entscheidung/gesamt'
import type { Befund } from '../modell/ergebnisse'
import type { AuswahlProjekt, Id } from '../modell/typen'
import type { Aktion, Zustand } from '../zustand'
import type { Ziel } from './befundziel'
import type { Befehle } from './datei'

/** Was die Oberfläche zusätzlich zum Projekt zeigt (nicht rückgängig machbar, nicht gespeichert). */
export interface Ansicht {
  angebotId: Id | null
  angebotReiter: 'bewertung' | 'kosten'
  vorlage: 'lastenheft' | 'entscheidung'
}

/** Befunde des letzten Einlesens (Ersatzwerte E7 werden nicht gespeichert, U11). */
export interface Lesebefunde {
  sha256: string
  befunde: Befund[]
}

export interface AppApi {
  z: Zustand
  /** alle berechneten Ergebnisse zum aktuellen Projekt */
  g: Gesamt
  dispatch: Dispatch<Aktion>
  /** Projekt ändern; `gruppe` fasst Tippen in einem Feld zu einem Rückgängig-Schritt zusammen */
  aendere: (f: (p: AuswahlProjekt) => AuswahlProjekt, gruppe?: string) => void
  melde: (text: string) => void
  ansicht: Ansicht
  setzeAnsicht: (teil: Partial<Ansicht>) => void
  springeZu: (ziel: Ziel) => void
  befehle: Befehle
  lesebefunde: Lesebefunde | null
}

export const AppKontext = createContext<AppApi | null>(null)

export function useApp(): AppApi {
  const api = useContext(AppKontext)
  if (!api) throw new Error('useApp außerhalb von AppKontext')
  return api
}

/** Zeitstempel für Änderungen, die ein Datum brauchen (Notizen beim Abgleich, Bewertungsbeginn). */
export const jetzt = () => new Date().toISOString()
