/**
 * Windows-Programm (Tauri): Die Oberfläche ruft Befehle des Rust-Teils auf
 * (src-tauri/src/lib.rs). Dateizugriff gibt es nur über diese Befehle und nur
 * für Pfade, die der Benutzer selbst gewählt hat. Die Tauri-Bibliotheken werden
 * erst beim ersten Aufruf geladen, damit die Web-Version sie nie mitlädt.
 */
import { browserPlattform } from './browser'
import type { Datei, MenueBefehl, Plattform } from './typen'

const kern = () => import('@tauri-apps/api/core')
const ereignisse = () => import('@tauri-apps/api/event')
const fenster = () => import('@tauri-apps/api/window')

async function rufe<T>(befehl: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await kern()
  return invoke<T>(befehl, args)
}

/** Meldet einen Listener an, der sich auch abmelden lässt, bevor die Anmeldung fertig ist. */
function horche(anmelden: () => Promise<() => void>): () => void {
  let abmelden: (() => void) | null = null
  let beendet = false
  void anmelden().then((f) => {
    if (beendet) f()
    else abmelden = f
  })
  return () => {
    beendet = true
    abmelden?.()
  }
}

export const desktopPlattform: Plattform = {
  desktop: true,
  oeffnen: () => rufe<Datei | null>('oeffnen'),
  importieren: () => rufe<Datei | null>('importieren'),
  startDatei: () => rufe<Datei | null>('start_datei'),
  speichern: (pfad, inhalt) => rufe<void>('speichern', { pfad, inhalt }),
  speichernUnter: (vorschlag, inhalt, art) => rufe<{ pfad: string; name: string } | null>('speichern_unter', { vorschlag, inhalt, art }),
  // Drucken wie im Browser: Druckdialog der WebView2
  drucken: browserPlattform.drucken,
  alsPdf: async (vorschlag, titel) => {
    // Der Dokumenttitel landet in den Angaben des PDF
    const vorher = document.title
    document.title = titel
    try {
      return await rufe<string | null>('als_pdf', { vorschlag })
    } finally {
      document.title = vorher
    }
  },
  setzeTitel: (titel) => {
    document.title = titel
    void fenster().then(({ getCurrentWindow }) => getCurrentWindow().setTitle(titel))
  },
  beiDatei: (datei, fehler) => {
    const ab1 = horche(async () => (await ereignisse()).listen<Datei>('datei-oeffnen', (e) => datei(e.payload)))
    const ab2 = horche(async () => (await ereignisse()).listen<string>('datei-fehler', (e) => fehler(e.payload)))
    return () => {
      ab1()
      ab2()
    }
  },
  beimSchliessen: (darf) =>
    horche(async () =>
      (await fenster()).getCurrentWindow().onCloseRequested(async (e) => {
        if (!(await darf())) e.preventDefault()
      }),
    ),
  beiMenue: (f) => horche(async () => (await ereignisse()).listen<MenueBefehl>('menue', (e) => f(e.payload))),
}
