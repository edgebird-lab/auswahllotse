/**
 * Einstieg für „Prozesslotse-Datei wählen“: Größe prüfen (E1), Dateiart
 * erkennen (E2), lesen (JSON oder BPMN) und die Prüfsumme bilden (E13).
 */
import type { Befund } from '../modell/ergebnisse'
import type { ProzessQuelle } from '../modell/typen'
import { PL_FORMAT_AKTUELL } from './format'
import { leseProzessBpmn } from './bpmn'
import { istBpmn, leseProzessJson, projiziereProjekt, pruefeDateigroesse, sha256Hex, utf8Bytes } from './lesen'

export interface Eingelesen {
  quelle: ProzessQuelle
  /** Befunde des Lesers (Ersatzwerte, Modellfehler, unbekannte Bausteine) */
  befunde: Befund[]
}

/** Liest eine Prozesslotse-Datei; wirft `Lesefehler` mit einer Meldung für Benutzer. */
export async function leseProzessdatei(dateiname: string, text: string, jetzt: string = new Date().toISOString()): Promise<Eingelesen> {
  pruefeDateigroesse(utf8Bytes(text))
  const bpmn = istBpmn(dateiname, text)
  const ergebnis = bpmn ? leseProzessBpmn(text) : { ...leseProzessJson(text), exporterVersion: null }
  return {
    quelle: {
      dateiname,
      dateiart: bpmn ? 'bpmn' : 'json',
      formatVersionGelesen: ergebnis.formatVersionGelesen,
      exporterVersion: ergebnis.exporterVersion,
      sha256: await sha256Hex(text),
      eingelesenAm: jetzt,
      projekt: ergebnis.projekt,
    },
    befunde: ergebnis.befunde,
  }
}

/**
 * Befunde zu einer gespeicherten Quelle, z. B. nach dem Öffnen eines
 * Projekts. Ersatzwerte aus dem ersten Einlesen sind dann schon eingesetzt;
 * gemeldet werden Modellfehler, allgemeine Schritte und ein neueres Format.
 */
export function befundeDerQuelle(quelle: ProzessQuelle): Befund[] {
  const befunde = projiziereProjekt(quelle.projekt).befunde
  if (quelle.formatVersionGelesen > PL_FORMAT_AKTUELL) {
    befunde.unshift({
      schwere: 'warnung',
      code: 'E4',
      text: `Das Prozessmodell stammt aus Format ${quelle.formatVersionGelesen}; der Auswahl-Lotse kennt Format 1 bis ${PL_FORMAT_AKTUELL}. Bitte die Ergebnisse prüfen.`,
      bezug: null,
    })
  }
  return befunde
}
