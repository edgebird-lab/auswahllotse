/**
 * Beispielprojekt „Lieferdienst sucht Warenwirtschaft“ für „Beispiel laden“.
 * Die Datei wird als Modul eingebunden, nicht per fetch geladen: Die
 * Inhaltsrichtlinie des Builds verbietet Verbindungen (connect-src 'none').
 */
import text from '../../testdaten/beispiel-lieferdienst.auswahllotse?raw'
import { leseProjektText } from '../modell/speicher'
import type { AuswahlProjekt } from '../modell/typen'

export function beispielProjekt(): AuswahlProjekt {
  return leseProjektText(text)
}
