import { browserPlattform } from './browser'
import type { Plattform } from './typen'

export type { Datei, DateiArt, Plattform } from './typen'

/**
 * Die Plattform der laufenden App. Bis zum Windows-Programm (Phase 9) gibt
 * es nur den Browser; der Desktop-Teil kommt dann per dynamischem Import dazu.
 */
export const plattform: Plattform = browserPlattform
