import { describe, expect, it } from 'vitest'
import { KAPUTT, TEXTE } from '../testhilfen/testdaten'
import { leseProzessdatei } from './einlesen'
import type { PlBlock, PlProjekt, PlProzess, PlSequenz } from './format'
import { istBpmn, leseProzessJson, Lesefehler, pruefeDateigroesse, sha256Hex } from './lesen'

/** Alle Bausteine eines Prozesses in Tiefensuche. */
function bausteine(seq: PlSequenz): PlBlock[] {
  return seq.schritte.flatMap((b): PlBlock[] => {
    switch (b.typ) {
      case 'entscheidung':
      case 'oder':
      case 'parallel':
        return [b, ...b.zweige.flatMap(bausteine)]
      case 'wiederholung':
        return [b, ...bausteine(b.koerper)]
      default:
        return [b]
    }
  })
}

const aufgaben = (p: PlProzess) => bausteine(p.ablauf).filter((b) => b.typ === 'aufgabe')

function daten(text: string): Record<string, any> {
  return JSON.parse(text) as Record<string, any>
}

/** Format-3-Projekt ohne die Neuerungen von Format 3, zum Vergleich mit umgestellten Dateien. */
function ohneFormat3(p: PlProjekt): PlProjekt {
  const k = structuredClone(p)
  for (const pr of [k.ist, k.soll]) {
    if (!pr) continue
    pr.teilnehmer = []
    pr.ausloeser.von = null
    for (const b of bausteine(pr.ablauf)) {
      if (b.typ === 'aufgabe') Object.assign(b, { nachrichtAn: null, nachrichtVon: null })
      if (b.typ === 'warten') b.von = null
      if (b.typ === 'entscheidung') for (const z of b.zweige) if (z.ereignis) z.ereignis.von = null
    }
  }
  return k
}

describe('Prozesslotse-Dateien lesen (E1 bis E8)', () => {
  it('liest den Lieferdienst ohne Befunde (T-E1)', () => {
    const { projekt, formatVersionGelesen, befunde } = leseProzessJson(TEXTE.lieferdienst)
    expect(formatVersionGelesen).toBe(3)
    expect(projekt.formatVersion).toBe(3)
    expect(projekt.ist.rollen).toHaveLength(6)
    expect(projekt.ist.medien).toHaveLength(4)
    expect(aufgaben(projekt.ist)).toHaveLength(18)
    expect(projekt.soll).toBeNull()
    expect(projekt.ist.teilnehmer).toEqual([{ id: 'tln_kunde', name: 'Kunde' }])
    expect(befunde).toEqual([])
  })

  it('liest die Onlinebestellung (T-E2)', () => {
    const { projekt, befunde } = leseProzessJson(TEXTE.onlinebestellung)
    expect(projekt.ist.rollen).toHaveLength(3)
    expect(projekt.ist.medien).toHaveLength(4)
    expect(aufgaben(projekt.ist)).toHaveLength(8)
    expect(befunde).toEqual([])
    const rsp = projekt.ist.ablauf.schritte[0]
    expect(rsp).toMatchObject({ typ: 'wiederholung', modus: 'ruecksprung', zweck: 'nacharbeit' })
  })

  it('stellt Format 1 um (T-E3)', () => {
    const { projekt, formatVersionGelesen, befunde } = leseProzessJson(TEXTE.lieferdienstFormat1)
    expect(formatVersionGelesen).toBe(1)
    expect(befunde).toEqual([])
    const alle = bausteine(projekt.ist.ablauf)
    const entscheidungen = alle.filter((b) => b.typ === 'entscheidung')
    expect(entscheidungen).toHaveLength(3)
    for (const e of entscheidungen) {
      expect(e.art).toBe('daten')
      for (const z of e.zweige) expect([z.zurueckZu, z.ereignis]).toEqual([null, null])
    }
    expect(alle.find((b) => b.typ === 'wiederholung')).toMatchObject({ modus: 'anteil', zweck: 'nacharbeit' })
    // Bis auf die Neuerungen von Format 3 dasselbe Projekt wie die Format-3-Datei
    expect(projekt).toEqual(ohneFormat3(leseProzessJson(TEXTE.lieferdienst).projekt))
  })

  it('stellt Format 2 um', () => {
    const { projekt, formatVersionGelesen } = leseProzessJson(TEXTE.lieferdienstFormat2)
    expect(formatVersionGelesen).toBe(2)
    expect(projekt).toEqual(ohneFormat3(leseProzessJson(TEXTE.lieferdienst).projekt))
  })

  it('verlangt in Format 2 die Felder, die erst Format 1 fehlen durften', () => {
    const d = daten(TEXTE.lieferdienstFormat2)
    delete d.ist.ablauf.schritte[2].art
    expect(() => leseProzessJson(JSON.stringify(d))).toThrow('Ist-Prozess, Ablauf, Schritt 3: Entscheidung unvollständig.')
  })

  it('liest neuere Formate mit Warnung und übernimmt neue Bausteine als allgemeinen Schritt (T-E4)', () => {
    const { projekt, formatVersionGelesen, befunde } = leseProzessJson(KAPUTT.format4)
    expect(formatVersionGelesen).toBe(4)
    expect(projekt.formatVersion).toBe(3)
    expect(projekt.ist.ablauf.schritte[2]).toEqual({ typ: 'allgemein', id: 'tp_pruefen', originalTyp: 'teilprozess', name: 'Bonität prüfen' })
    expect(befunde.map((b) => [b.schwere, b.code])).toEqual([
      ['warnung', 'E4'],
      ['warnung', 'E5'],
    ])
    expect(befunde[0].text).toContain('Diese Datei hat Format 4; der Auswahl-Lotse kennt Format 1 bis 3.')
  })

  it('lehnt ungültige Formatangaben ab (T-E4)', () => {
    expect(() => leseProzessJson(KAPUTT.format0)).toThrow('Diese Datei hat Format 0. Der Auswahl-Lotse kennt Format 1 bis 3. Bitte den Auswahl-Lotsen aktualisieren.')
    const d = daten(TEXTE.lieferdienst)
    d.formatVersion = 2.5
    expect(() => leseProzessJson(JSON.stringify(d))).toThrow('Diese Datei hat Format 2.5.')
    d.formatVersion = 'drei'
    expect(() => leseProzessJson(JSON.stringify(d))).toThrow('Die Datei enthält kein Prozesslotse-Projekt.')
  })

  it('meldet Dateien, die kein Prozesslotse-Projekt sind (T-E5)', () => {
    expect(() => leseProzessJson(KAPUTT.keinJson)).toThrow('Die Datei ist kein gültiges JSON.')
    expect(() => leseProzessJson(KAPUTT.zahl)).toThrow('Die Datei enthält kein Prozesslotse-Projekt.')
    expect(() => leseProzessJson('[1, 2]')).toThrow('Die Datei enthält kein Prozesslotse-Projekt.')
    expect(() => leseProzessJson(KAPUTT.auswahlProjekt)).toThrow('Das ist ein Auswahl-Lotse-Projekt. Bitte über „Öffnen“ laden.')
    expect(() => leseProzessJson(KAPUTT.aufgabeUnvollstaendig)).toThrow('Ist-Prozess, Ablauf, Schritt 1: Aufgabe unvollständig.')
    expect(() => leseProzessJson(KAPUTT.aufgabeUnvollstaendig)).toThrow(Lesefehler)
  })

  it('übernimmt einen unbekannten Baustein als allgemeinen Schritt und meldet ihn (T-E6)', () => {
    const { projekt, befunde } = leseProzessJson(KAPUTT.unbekannterBaustein)
    expect(projekt.ist.ablauf.schritte[2]).toEqual({ typ: 'allgemein', id: 'x_schleife', originalTyp: 'schleife', name: 'Schleife' })
    expect(befunde).toHaveLength(1)
    expect(befunde[0]).toMatchObject({ schwere: 'warnung', code: 'E5', bezug: 'x_schleife' })
    expect(befunde[0].text).toContain('Ist-Prozess, Ablauf, Schritt 3: unbekannter Baustein „schleife“')
    expect(befunde[0].text).toContain('allgemeiner Schritt')
  })

  it('übernimmt einen allgemeinen Schritt beim erneuten Lesen unverändert', () => {
    const erst = leseProzessJson(KAPUTT.unbekannterBaustein).projekt
    const zweit = leseProzessJson(JSON.stringify(erst))
    expect(zweit.projekt).toEqual(erst)
    expect(zweit.befunde[0].text).toContain('„schleife“')
  })

  it('setzt Grenzen für Größe, Tiefe, Bausteine, Rollen und Systeme (T-E7)', async () => {
    expect(() => pruefeDateigroesse(5 * 1024 * 1024)).not.toThrow()
    expect(() => pruefeDateigroesse(5 * 1024 * 1024 + 1)).toThrow('Die Datei ist größer als 5 MB.')
    await expect(leseProzessdatei('gross.json', ' '.repeat(5 * 1024 * 1024 + 1))).rejects.toThrow('größer als 5 MB')

    const verschachtelt = (tiefe: number) => {
      const d = daten(TEXTE.lieferdienst)
      let innen: Record<string, unknown>[] = []
      const aussen = innen
      for (let i = 0; i < tiefe; i++) {
        const w = { typ: 'wiederholung', id: `w${i}`, modus: 'anteil', frage: '', anteilWiederholung: 0, koerper: { id: `k${i}`, schritte: [] as Record<string, unknown>[] } }
        innen.push(w)
        innen = w.koerper.schritte
      }
      d.ist.ablauf.schritte = aussen
      return JSON.stringify(d)
    }
    expect(() => leseProzessJson(verschachtelt(50))).not.toThrow()
    expect(() => leseProzessJson(verschachtelt(51))).toThrow('Ist-Prozess: Das Prozessmodell ist tiefer als 50 Ebenen verschachtelt.')

    const viele = (n: number) => {
      const d = daten(TEXTE.lieferdienst)
      d.ist.ablauf.schritte = Array.from({ length: n }, (_, i) => ({ typ: 'warten', id: `w${i}`, name: '', art: 'zeit', dauerMin: 1 }))
      return JSON.stringify(d)
    }
    expect(() => leseProzessJson(viele(5000))).not.toThrow()
    expect(() => leseProzessJson(viele(5001))).toThrow('Ist-Prozess: Das Prozessmodell hat mehr als 5.000 Bausteine.')

    const d = daten(TEXTE.lieferdienst)
    d.ist.rollen = Array.from({ length: 501 }, (_, i) => ({ id: `r${i}`, name: 'R', stundensatz: 1, personen: 1, verfuegbarProzent: 100 }))
    expect(() => leseProzessJson(JSON.stringify(d))).toThrow('Ist-Prozess: mehr als 500 Rollen.')
    const m = daten(TEXTE.lieferdienst)
    m.ist.medien = Array.from({ length: 501 }, (_, i) => ({ id: `m${i}`, name: 'M', art: 'papier' }))
    expect(() => leseProzessJson(JSON.stringify(m))).toThrow('Ist-Prozess: mehr als 500 Systeme.')
  })

  it('übernimmt nur bekannte Felder und setzt Ersatzwerte mit Befund (T-E8)', () => {
    const d = daten(TEXTE.lieferdienst)
    d.ist.ablauf.schritte[0].farbe = 'rot'
    d.ist.farbe = 'blau'
    d.farbe = 'grün'
    d.ist.medien[0].art = 'ki'
    d.ist.ablauf.schritte[1].rolleId = 'rol_x'
    d.ist.ablauf.schritte[0].art = 'genehmigung'
    const { projekt, befunde } = leseProzessJson(JSON.stringify(d))
    expect('farbe' in projekt.ist.ablauf.schritte[0]).toBe(false)
    expect('farbe' in projekt.ist).toBe(false)
    expect('farbe' in projekt).toBe(false)
    expect(projekt.ist.medien[0].art).toBe('sonstiges')
    expect(projekt.ist.ablauf.schritte[1]).toMatchObject({ rolleId: null })
    expect(projekt.ist.ablauf.schritte[0]).toMatchObject({ art: 'normal' })
    expect(befunde.map((b) => [b.schwere, b.code])).toEqual([
      ['hinweis', 'E7'],
      ['hinweis', 'E7'],
      ['warnung', 'E7'],
    ])
    expect(befunde[0].text).toBe('Ist-Prozess, System „Papier“: unbekannte Art „ki“; als „Sonstiges“ übernommen.')
    expect(befunde[2].text).toContain('Rolle „rol_x“ fehlt im Modell')
  })

  it('meldet Anteile ungleich 100 % und Rücksprünge ins Leere (E8)', () => {
    const d = daten(TEXTE.lieferdienst)
    d.ist.ablauf.schritte[2].zweige[0].anteil = 0.6
    d.ist.ablauf.schritte[2].zweige[1].anteil = 0.3
    d.ist.ablauf.schritte[7].zweige[1].zurueckZu = 'wdh_kommission'
    const { befunde } = leseProzessJson(JSON.stringify(d))
    expect(befunde.map((b) => b.text)).toEqual([
      'Ist-Prozess, Ablauf, Schritt 3 („Ware vorrätig?“): Anteile ergeben 90 %; Häufigkeiten sind unsicher.',
      'Ist-Prozess, Ablauf, Schritt 8, Ausgang 2 („Nein“): Rücksprung ins Leere; der Ausgang endet ohne Ergebnis.',
    ])
    // Rücksprung auf einen umschließenden Rücksprungbereich ist in Ordnung
    expect(leseProzessJson(TEXTE.onlinebestellung).befunde).toEqual([])
  })

  it('meldet doppelte Kennungen und lässt __proto__ wirkungslos', () => {
    const text = TEXTE.lieferdienst.replace('"id": "auf_erfassen"', '"id": "auf_annehmen"').replace('"formatVersion": 3,', '"formatVersion": 3, "__proto__": {"boese": 1},')
    const { befunde } = leseProzessJson(text)
    expect(befunde.some((b) => b.text.includes('„auf_annehmen“ kommt mehrfach vor'))).toBe(true)
    expect(({} as Record<string, unknown>).boese).toBeUndefined()
  })

  it('erkennt die Dateiart (E2) und bildet die Prüfsumme (E13)', async () => {
    expect(istBpmn('modell.bpmn', '{}')).toBe(true)
    expect(istBpmn('modell.json', '﻿  \n<?xml version="1.0"?>')).toBe(true)
    expect(istBpmn('modell.prozesslotse', '{"formatVersion": 3}')).toBe(false)
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    const { quelle, befunde } = await leseProzessdatei('lieferdienst.prozesslotse', TEXTE.lieferdienst, '2026-11-11T09:00:00.000Z')
    expect(quelle).toMatchObject({ dateiname: 'lieferdienst.prozesslotse', dateiart: 'json', formatVersionGelesen: 3, exporterVersion: null, eingelesenAm: '2026-11-11T09:00:00.000Z' })
    expect(quelle.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(quelle.sha256).toBe(await sha256Hex(TEXTE.lieferdienst))
    expect(befunde).toEqual([])
  })

  it('liest JSON mit Byte-Order-Mark', () => {
    expect(leseProzessJson(`﻿${TEXTE.lieferdienst}`).projekt.ist.name).toBe('Bestellung bis Rechnung (Lieferdienst)')
  })
})
