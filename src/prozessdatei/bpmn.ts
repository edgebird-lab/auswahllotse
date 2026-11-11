/**
 * BPMN-Dateien mit eingebettetem Prozesslotse-Projekt (Spezifikation 4.3,
 * Regeln E9 bis E12). Gelesen wird nur der Text des Elements `projekt` im
 * Namensraum des Prozesslotsen; das Diagramm selbst wertet der
 * Auswahl-Lotse nicht aus. Läuft im Browser mit dem eingebauten
 * `DOMParser`, in Tests mit jsdom.
 */
import type { Befund } from '../modell/ergebnisse'
import { PL_NAMENSRAUM } from './format'
import { Lesefehler, projiziereProjekt, type LeseErgebnis } from './lesen'

export const BPMN_NAMENSRAUM = 'http://www.omg.org/spec/BPMN/20100524/MODEL'

export interface BpmnLeseErgebnis extends LeseErgebnis {
  /** Attribut `exporterVersion` der Wurzel, falls vorhanden */
  exporterVersion: string | null
}

const BESCHAEDIGT = 'Das eingebettete Projekt ist beschädigt.'

/**
 * E9 bis E12, danach E3 bis E8 für das eingebettete JSON. `neuerParser` ist
 * austauschbar, damit Tests prüfen können, dass bei DOCTYPE gar nicht erst
 * geparst wird.
 */
export function leseProzessBpmn(text: string, neuerParser: () => DOMParser = () => new DOMParser()): BpmnLeseErgebnis {
  const inhalt = text.replace(/^﻿/, '')
  // E9: DOCTYPE vor dem Parsen ablehnen (Schutz vor Entitäten-Angriffen)
  if (/<!DOCTYPE/i.test(inhalt)) throw new Lesefehler('BPMN-Dateien mit DOCTYPE liest der Auswahl-Lotse aus Sicherheitsgründen nicht.')
  const doc = neuerParser().parseFromString(inhalt, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) throw new Lesefehler('Die Datei ist kein gültiges XML.')

  // E10: Wurzel muss bpmn:definitions sein
  const wurzel = doc.documentElement
  if (!wurzel || wurzel.namespaceURI !== BPMN_NAMENSRAUM || wurzel.localName !== 'definitions') {
    throw new Lesefehler('Die Datei ist keine BPMN-2.0-Datei.')
  }
  const exporterVersion = wurzel.getAttribute('exporterVersion')

  // E11: eingebettetes Projekt irgendwo im Dokument
  const treffer = doc.getElementsByTagNameNS(PL_NAMENSRAUM, 'projekt')
  if (treffer.length === 0) {
    throw new Lesefehler('Diese BPMN-Datei enthält kein Prozesslotse-Projekt. Bitte im Prozesslotsen mit eingebettetem Projekt exportieren.')
  }
  const befunde: Befund[] = []
  if (treffer.length > 1) {
    befunde.push({ schwere: 'hinweis', code: 'E11', text: `Die BPMN-Datei enthält ${treffer.length} eingebettete Projekte; gelesen wird das erste.`, bezug: null })
  }
  befunde.push({
    schwere: 'hinweis',
    code: 'E11',
    text: 'Gelesen wird das eingebettete Projekt. Änderungen, die nach dem Export in anderen Werkzeugen am Diagramm gemacht wurden, sieht der Auswahl-Lotse nicht.',
    bezug: null,
  })

  // E12: Inhalt als JSON, Formatangabe im Attribut muss zum Inhalt passen
  const element = treffer[0]
  let daten: unknown
  try {
    daten = JSON.parse(element.textContent ?? '')
  } catch {
    throw new Lesefehler(BESCHAEDIGT)
  }
  const attribut = element.getAttribute('formatVersion')
  if (attribut !== null) {
    const passt = /^\s*\d+\s*$/.test(attribut) && typeof daten === 'object' && daten !== null && (daten as { formatVersion?: unknown }).formatVersion === Number(attribut)
    if (!passt) throw new Lesefehler(BESCHAEDIGT)
  }
  const ergebnis = projiziereProjekt(daten)
  return { ...ergebnis, befunde: [...befunde, ...ergebnis.befunde], exporterVersion }
}
