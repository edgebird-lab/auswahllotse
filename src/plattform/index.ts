import { browserPlattform } from './browser'
import { desktopPlattform } from './desktop'
import type { Plattform } from './typen'

export type { Datei, DateiArt, MenueBefehl, Plattform } from './typen'

/** Läuft die Oberfläche im Windows-Programm? Tauri legt dieses Objekt vor dem Laden der Seite an. */
export const istDesktop = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/**
 * Die Plattform der laufenden App. Der Desktop-Teil lädt die Tauri-Bibliotheken
 * erst beim ersten Aufruf; im Browser werden sie nie geladen.
 */
export const plattform: Plattform = istDesktop ? desktopPlattform : browserPlattform
