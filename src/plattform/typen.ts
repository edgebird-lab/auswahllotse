/**
 * Was die Oberfläche vom Betriebssystem braucht (Spezifikation 7.3): Dateien
 * öffnen, einlesen und speichern, drucken, Fenstertitel, Schließen abfangen.
 * Im Browser gibt es davon nur einen Teil (Dateiauswahl, Download,
 * window.print()); im Windows-Programm (Phase 9) erledigt das der Rust-Teil,
 * der nur per dynamischem Import geladen wird.
 */

/** Eine gewählte Datei. Im Browser gibt es keinen Pfad. */
export interface Datei {
  pfad: string | null
  name: string
  inhalt: string
}

export type DateiArt = 'projekt' | 'csv'

export interface Plattform {
  /** true im Windows-Programm */
  readonly desktop: boolean
  /** Öffnen-Dialog für Projekte; null bei Abbruch. Im Browser öffnet die Oberfläche selbst ein Dateifeld. */
  oeffnen(): Promise<Datei | null>
  /** Dialog für Prozesslotse-Dateien (.prozesslotse, .json, .bpmn); im Browser wie `oeffnen`. */
  importieren(): Promise<Datei | null>
  /** Speichert an einen schon bekannten Pfad (nur im Programm). */
  speichern(pfad: string, inhalt: string): Promise<void>
  /** Fragt nach Ort und Namen; im Browser ein Download. null bei Abbruch. */
  speichernUnter(vorschlag: string, inhalt: string, art: DateiArt): Promise<{ pfad: string | null; name: string } | null>
  /** Druckt die aktuelle Ansicht; der Titel ist der Dateiname-Vorschlag für „als PDF“. */
  drucken(titel: string): Promise<void>
  setzeTitel(titel: string): void
  /** Vor dem Schließen: `darf` entscheidet, ob das Fenster zugeht. Gibt eine Abmeldung zurück. */
  beimSchliessen(darf: () => Promise<boolean>): () => void
}
