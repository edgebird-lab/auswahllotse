/**
 * Was die Oberfläche vom Betriebssystem braucht (Spezifikation 7.3): Dateien
 * öffnen, einlesen und speichern, drucken, Fenstertitel, Schließen abfangen.
 * Im Browser gibt es davon nur einen Teil (Dateiauswahl, Download,
 * window.print()); im Windows-Programm (Tauri) erledigt das der Rust-Teil
 * (src-tauri/src/lib.rs), dessen Bibliotheken nur per dynamischem Import
 * geladen werden.
 */

/** Eine gewählte Datei. Einen Pfad gibt es nur im Programm und nur für Projekte des Auswahl-Lotsen. */
export interface Datei {
  pfad: string | null
  name: string
  inhalt: string
}

export type DateiArt = 'projekt' | 'csv' | 'beratungsakte'

/** Befehle aus dem Programmmenü. */
export type MenueBefehl = 'neu' | 'oeffnen' | 'importieren' | 'speichern' | 'speichernUnter' | 'fragebogen' | 'beispiel' | 'ueber'

export interface Plattform {
  /** true im Windows-Programm */
  readonly desktop: boolean
  /** Öffnen-Dialog für Projekte; null bei Abbruch. Im Browser öffnet die Oberfläche selbst ein Dateifeld. */
  oeffnen(): Promise<Datei | null>
  /** Dialog für Prozesslotse-Dateien (.prozesslotse, .json, .bpmn); im Browser wie `oeffnen`. */
  importieren(): Promise<Datei | null>
  /** Datei, mit der das Programm gestartet wurde (Doppelklick im Explorer). */
  startDatei(): Promise<Datei | null>
  /** Speichert an einen schon bekannten Pfad (nur im Programm). */
  speichern(pfad: string, inhalt: string): Promise<void>
  /** Fragt nach Ort und Namen; im Browser ein Download. null bei Abbruch. */
  speichernUnter(vorschlag: string, inhalt: string, art: DateiArt): Promise<{ pfad: string | null; name: string } | null>
  /** Druckt die aktuelle Ansicht; der Titel ist der Dateiname-Vorschlag für „als PDF“. */
  drucken(titel: string): Promise<void>
  /** Angezeigte Vorlage als PDF ohne Druckdialog (nur im Programm); Pfad der Datei oder null bei Abbruch. */
  alsPdf(vorschlag: string, titel: string): Promise<string | null>
  setzeTitel(titel: string): void
  /** Weitere Datei (Doppelklick bei laufendem Programm, ins Fenster gezogen) oder ein Fehler beim Lesen. */
  beiDatei(datei: (d: Datei) => void, fehler: (text: string) => void): () => void
  /** Vor dem Schließen: `darf` entscheidet, ob das Fenster zugeht. Gibt eine Abmeldung zurück. */
  beimSchliessen(darf: () => Promise<boolean>): () => void
  beiMenue(f: (befehl: MenueBefehl) => void): () => void
}
