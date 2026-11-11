/**
 * Testdateien als Text (Vite-Import mit `?raw`). Nur für Tests; die App
 * bindet diese Datei nicht ein. Herkunft: testdaten/prozesslotse/README.md.
 */
import lieferdienst from '../../testdaten/prozesslotse/lieferdienst.prozesslotse?raw'
import onlinebestellung from '../../testdaten/prozesslotse/onlinebestellung.prozesslotse?raw'
import lieferdienstFormat1 from '../../testdaten/prozesslotse/lieferdienst-format1.json?raw'
import lieferdienstFormat2 from '../../testdaten/prozesslotse/lieferdienst-format2.json?raw'
import lieferdienstBpmn from '../../testdaten/prozesslotse/lieferdienst-eingebettet.bpmn?raw'
import keinJson from '../../testdaten/prozesslotse/kaputt/kein-json.prozesslotse?raw'
import zahl from '../../testdaten/prozesslotse/kaputt/zahl.json?raw'
import auswahlProjekt from '../../testdaten/prozesslotse/kaputt/auswahllotse-projekt.json?raw'
import format0 from '../../testdaten/prozesslotse/kaputt/format-0.prozesslotse?raw'
import format4 from '../../testdaten/prozesslotse/kaputt/format-4-teilprozess.prozesslotse?raw'
import unbekannterBaustein from '../../testdaten/prozesslotse/kaputt/unbekannter-baustein.prozesslotse?raw'
import aufgabeUnvollstaendig from '../../testdaten/prozesslotse/kaputt/aufgabe-unvollstaendig.prozesslotse?raw'
import ohneEinbettung from '../../testdaten/prozesslotse/kaputt/ohne-einbettung.bpmn?raw'
import doctype from '../../testdaten/prozesslotse/kaputt/doctype.bpmn?raw'
import formatPasstNicht from '../../testdaten/prozesslotse/kaputt/format-passt-nicht.bpmn?raw'
import keinXml from '../../testdaten/prozesslotse/kaputt/kein-xml.bpmn?raw'
import html from '../../testdaten/prozesslotse/kaputt/html.bpmn?raw'
import { leseProzessJson } from '../prozessdatei/lesen'
import type { PlProjekt } from '../prozessdatei/format'

export const TEXTE = {
  lieferdienst,
  onlinebestellung,
  lieferdienstFormat1,
  lieferdienstFormat2,
  lieferdienstBpmn,
}

export const KAPUTT = {
  keinJson,
  zahl,
  auswahlProjekt,
  format0,
  format4,
  unbekannterBaustein,
  aufgabeUnvollstaendig,
  ohneEinbettung,
  doctype,
  formatPasstNicht,
  keinXml,
  html,
}

export function lieferdienstProjekt(): PlProjekt {
  return leseProzessJson(lieferdienst).projekt
}

export function onlineProjekt(): PlProjekt {
  return leseProzessJson(onlinebestellung).projekt
}
