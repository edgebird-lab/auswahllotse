// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { KAPUTT, TEXTE } from '../testhilfen/testdaten'
import { leseProzessBpmn } from './bpmn'
import { leseProzessdatei } from './einlesen'
import { PL_NAMENSRAUM } from './format'
import { leseProzessJson } from './lesen'

describe('BPMN mit eingebettetem Projekt (E9 bis E12)', () => {
  it('liest das eingebettete Projekt wie die JSON-Datei (T-E9)', () => {
    const bpmn = leseProzessBpmn(TEXTE.lieferdienstBpmn)
    expect(bpmn.projekt).toEqual(leseProzessJson(TEXTE.lieferdienst).projekt)
    expect(bpmn.formatVersionGelesen).toBe(3)
    expect(bpmn.exporterVersion).toBe('0.1.0')
    expect(bpmn.befunde.map((b) => [b.schwere, b.code])).toEqual([['hinweis', 'E11']])
    expect(bpmn.befunde[0].text).toContain('Änderungen, die nach dem Export in anderen Werkzeugen')
  })

  it('erkennt BPMN beim Einlesen an Endung oder Inhalt', async () => {
    const { quelle } = await leseProzessdatei('lieferdienst.bpmn', TEXTE.lieferdienstBpmn, '2026-11-11T09:00:00.000Z')
    expect(quelle).toMatchObject({ dateiart: 'bpmn', exporterVersion: '0.1.0', formatVersionGelesen: 3 })
    const alsXml = await leseProzessdatei('export.xml', TEXTE.lieferdienstBpmn)
    expect(alsXml.quelle.dateiart).toBe('bpmn')
  })

  it('meldet BPMN ohne eingebettetes Projekt (T-E10)', () => {
    expect(() => leseProzessBpmn(KAPUTT.ohneEinbettung)).toThrow('Diese BPMN-Datei enthält kein Prozesslotse-Projekt. Bitte im Prozesslotsen mit eingebettetem Projekt exportieren.')
  })

  it('lehnt DOCTYPE ab, ohne zu parsen (T-E11)', () => {
    const parser = vi.fn(() => new DOMParser())
    expect(() => leseProzessBpmn(KAPUTT.doctype, parser)).toThrow('BPMN-Dateien mit DOCTYPE liest der Auswahl-Lotse aus Sicherheitsgründen nicht.')
    expect(parser).not.toHaveBeenCalled()
    expect(() => leseProzessBpmn('<?xml version="1.0"?><!DocType x><x/>', parser)).toThrow('DOCTYPE')
    expect(parser).not.toHaveBeenCalled()
  })

  it('erkennt eine Formatangabe, die nicht zum Inhalt passt (T-E12)', () => {
    expect(() => leseProzessBpmn(KAPUTT.formatPasstNicht)).toThrow('Das eingebettete Projekt ist beschädigt.')
    const format1 = TEXTE.lieferdienstBpmn.replace('formatVersion="3">', 'formatVersion="2">').replace('{"formatVersion":3', '{"formatVersion":1')
    expect(() => leseProzessBpmn(format1)).toThrow('Das eingebettete Projekt ist beschädigt.')
    expect(() => leseProzessBpmn(TEXTE.lieferdienstBpmn.replace('formatVersion="3">', 'formatVersion="drei">'))).toThrow('beschädigt')
    expect(() => leseProzessBpmn(TEXTE.lieferdienstBpmn.replace(/(<pl:projekt[^>]*>)\{/, '$1{{'))).toThrow('Das eingebettete Projekt ist beschädigt.')
  })

  it('meldet kaputtes XML und fremde Wurzeln (T-E13)', () => {
    expect(() => leseProzessBpmn(KAPUTT.keinXml)).toThrow('Die Datei ist kein gültiges XML.')
    expect(() => leseProzessBpmn(KAPUTT.html)).toThrow('Die Datei ist keine BPMN-2.0-Datei.')
    expect(() => leseProzessBpmn('<definitions xmlns="http://example.org/anders"/>')).toThrow('keine BPMN-2.0-Datei')
  })

  it('findet das Projekt bei anderem Präfix, in CDATA und an anderer Stelle', () => {
    const json = JSON.stringify(JSON.parse(TEXTE.lieferdienst))
    const xml = `<?xml version="1.0"?>
<b:definitions xmlns:b="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:ns7="${PL_NAMENSRAUM}">
  <b:collaboration id="K"><b:extensionElements><ns7:projekt formatVersion="3"><![CDATA[${json}]]></ns7:projekt></b:extensionElements></b:collaboration>
</b:definitions>`
    const ergebnis = leseProzessBpmn(xml)
    expect(ergebnis.projekt).toEqual(leseProzessJson(TEXTE.lieferdienst).projekt)
    expect(ergebnis.exporterVersion).toBeNull()
  })

  it('liest bei mehreren Einbettungen die erste und meldet das', () => {
    const json = JSON.stringify(JSON.parse(TEXTE.onlinebestellung)).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    const zwei = TEXTE.lieferdienstBpmn.replace('</bpmn:extensionElements>', `  <pl:projekt xmlns:pl="${PL_NAMENSRAUM}">${json}</pl:projekt>\n</bpmn:extensionElements>`)
    const ergebnis = leseProzessBpmn(zwei)
    expect(ergebnis.projekt.ist.name).toBe('Bestellung bis Rechnung (Lieferdienst)')
    expect(ergebnis.befunde[0].text).toBe('Die BPMN-Datei enthält 2 eingebettete Projekte; gelesen wird das erste.')
  })

  it('reicht Strukturfehler im eingebetteten Projekt weiter', () => {
    const kaputt = TEXTE.lieferdienstBpmn.replace('"bearbeitungMin":6,', '')
    expect(() => leseProzessBpmn(kaputt)).toThrow('Ist-Prozess, Ablauf, Schritt 1: Aufgabe unvollständig.')
  })
})
