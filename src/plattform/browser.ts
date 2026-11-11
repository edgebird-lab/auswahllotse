import type { DateiArt, Plattform } from './typen'

const MIME: Record<DateiArt, string> = {
  projekt: 'application/vnd.auswahllotse+json',
  csv: 'text/csv',
}

/** Bietet Text zum Herunterladen an. */
export function ladeHerunter(dateiname: string, inhalt: string, typ: string): void {
  const blob = new Blob([inhalt], { type: `${typ};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dateiname
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Browser: Öffnen und Einlesen laufen über Dateifelder der Oberfläche,
 * Speichern über einen Download. Das Projekt liegt zusätzlich im
 * Browser-Speicher, deshalb fragt der Browser beim Schließen nicht nach.
 */
export const browserPlattform: Plattform = {
  desktop: false,
  oeffnen: async () => null,
  importieren: async () => null,
  startDatei: async () => null,
  speichern: async () => {
    throw new Error('Im Browser gibt es kein Speichern an einen Pfad.')
  },
  speichernUnter: async (vorschlag, inhalt, art) => {
    ladeHerunter(vorschlag, inhalt, MIME[art])
    return { pfad: null, name: vorschlag }
  },
  drucken: async (titel) => {
    // Der Browser schlägt den Dokumenttitel als Dateinamen für „als PDF speichern“ vor
    const vorher = document.title
    document.title = titel
    try {
      window.print()
    } finally {
      document.title = vorher
    }
  },
  // PDF entsteht im Browser über den Druckdialog
  alsPdf: async () => null,
  setzeTitel: (titel) => {
    document.title = titel
  },
  beiDatei: () => () => {},
  beimSchliessen: () => () => {},
  beiMenue: () => () => {},
}
