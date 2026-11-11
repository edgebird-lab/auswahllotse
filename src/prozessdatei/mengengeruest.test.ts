import { describe, expect, it } from 'vitest'
import { medienbruchFall } from '../lastenheft/schnittstellen'
import { standardUmfang } from '../lastenheft/umfang'
import { neuerRahmen } from '../modell/projekt'
import type { Rahmen } from '../modell/typen'
import { aufgabe, projekt, prozess } from '../testhilfen/bausteine'
import { lieferdienstProjekt, onlineProjekt } from '../testhilfen/testdaten'
import { aufrunden, berechneMengengeruest, kostenProVorgang } from './mengengeruest'

/** Rahmen L der Spezifikation: ERP, personenbezogen ja, steuerrelevant ja, Cloud. */
function rahmenL(): Rahmen {
  return { ...neuerRahmen('erp'), betriebsform: 'cloud' }
}

function lieferdienst() {
  const pl = lieferdienstProjekt()
  return berechneMengengeruest(pl, standardUmfang(pl, 'erp'), rahmenL())
}

function online() {
  const pl = onlineProjekt()
  return berechneMengengeruest(pl, standardUmfang(pl, 'erp'), rahmenL())
}

describe('Mengengerüst (M1 bis M8)', () => {
  it('liefert Vorgänge und Benutzer des Lieferdienstes (T-M1)', () => {
    const m = lieferdienst()
    expect(m.vorgaengeProTag).toBe(120)
    expect(m.vorgaengeSpitze).toBe(240)
    expect(m.vorgaengeProJahr).toBe(30000)
    expect(m.benutzer).toBe(7)
    expect(m.rollen.map((r) => [r.name, r.benutzer])).toEqual([
      ['Innendienst', 4],
      ['Disposition', 1],
      ['Buchhaltung', 1],
      ['Niederlassungsleitung', 1],
    ])
    expect(m.imUmfang).toHaveLength(8)
    expect(m.befunde).toEqual([])
  })

  it('rechnet Arbeitsminuten pro Tag je Rolle im Umfang (M4)', () => {
    const m = lieferdienst()
    // Innendienst: (1 · 4 + 0,056 · 3 + 0,024 · 2) · 120 = 505,92
    expect(m.rollen[0].arbeitMinProTag).toBeCloseTo(505.92, 6)
    expect(m.rollen[0].aufgaben).toEqual(['auf_erfassen', 'auf_aendern', 'auf_stornieren'])
    // Disposition: (0,976 · 1,5 + 0,976 · 1,5) · 120 = 351,36
    expect(m.rollen[1].arbeitMinProTag).toBeCloseTo(351.36, 6)
  })

  it('rechnet die Kosten je Vorgang (T-M2)', () => {
    const m = lieferdienst()
    expect(m.kostenProVorgangIst).toBeCloseTo(28.49152, 6)
    expect(m.kostenProVorgangIst * 120 * 250).toBeCloseTo(854745.6, 4)
    expect(m.kostenProVorgangSoll).toBeNull()
    expect(kostenProVorgang(onlineProjekt().ist)).toBeCloseTo(11.199418, 6)
  })

  it('findet die Medienbrüche des Lieferdienstes (T-M3)', () => {
    const m = lieferdienst()
    const proTag = m.medienbrueche.reduce((s, x) => s + x.uebertragungenProTag, 0)
    expect(proTag).toBeCloseTo(354.24, 6)
    expect(proTag / 120).toBeCloseTo(2.952, 9)
    expect(m.medienbrueche.reduce((s, x) => s + x.minutenProTag, 0)).toBeCloseTo(594.24, 6)
    expect(m.medienbrueche.map((x) => [x.quelleId, x.zielId, x.fall, x.aufgaben])).toEqual([
      ['med_papier', 'med_erp', 'C', ['auf_erfassen', 'auf_bestaetigen']],
      ['med_erp', 'med_excel', 'A', ['auf_tour']],
    ])
  })

  it('schlägt den Nutzen aus den Medienbrüchen vor (T-M4)', () => {
    const m = lieferdienst()
    expect(m.medienbruchkostenProJahr / 250 / 120).toBeCloseTo(3.364, 9)
    expect(m.medienbruchkostenProJahr).toBeCloseTo(100920, 4)
    const o = online()
    expect(o.medienbrueche.map((x) => [x.quelleId, x.zielId, x.fall])).toEqual([['med_shop', 'med_erp', 'B']])
    expect(o.medienbruchkostenProJahr).toBeCloseTo(72780.2, 2)
  })

  it('rechnet Datenbestand und rundet Personen auf (T-M5)', () => {
    expect(lieferdienst().datenbestand).toBe(300000)
    const p = prozess([aufgabe('a', { mediumId: 'm', rolleId: 'r' })], {
      vorgaengeProTag: 3,
      medien: [{ id: 'm', name: 'Excel', art: 'tabelle' }],
      rollen: [{ id: 'r', name: 'Aushilfe', stundensatz: 20, personen: 0.5, verfuegbarProzent: 100 }],
    })
    const m = berechneMengengeruest(projekt(p), standardUmfang(projekt(p), 'erp'), rahmenL())
    expect(m.benutzer).toBe(1)
    expect(m.vorgaengeSpitze).toBe(6)
  })

  it('zählt Rollen ohne Personen mit 0 Benutzern und meldet das (M3)', () => {
    const p = prozess([aufgabe('a', { mediumId: 'm', rolleId: 'r' })], {
      medien: [{ id: 'm', name: 'Excel', art: 'tabelle' }],
      rollen: [{ id: 'r', name: 'Extern', stundensatz: 20, personen: 0, verfuegbarProzent: 100 }],
    })
    const m = berechneMengengeruest(projekt(p), standardUmfang(projekt(p), 'erp'), rahmenL())
    expect(m.benutzer).toBe(0)
    expect(m.befunde.map((b) => b.code)).toEqual(['M3'])
  })

  it('zählt bei Grundlage Soll auch Medienbrüche, die das Soll beseitigt (U5)', () => {
    const pl = lieferdienstProjekt()
    const soll = structuredClone(pl.ist)
    soll.vorgaengeProTag = 100
    for (const s of soll.ablauf.schritte) {
      if (s.typ === 'aufgabe' && s.id === 'auf_erfassen') s.uebertragung = null // automatisiert
      if (s.typ === 'aufgabe' && s.id === 'auf_bestaetigen') s.uebertragung = { quelleMediumId: 'med_papier', minuten: 2 }
    }
    const mit = { ...pl, soll }
    const m = berechneMengengeruest(mit, standardUmfang(mit, 'erp'), rahmenL())
    expect(m.vorgaengeProTag).toBe(100)
    const papier = m.medienbrueche.find((x) => x.quelleId === 'med_papier')!
    expect(papier.aufgaben).toEqual(['auf_bestaetigen', 'auf_erfassen'])
    // bestätigen aus dem Soll: 0,976 · 100 · 2 Minuten; erfassen aus dem Ist: 1 · 120 · 3 Minuten
    expect(papier.uebertragungenProTag).toBeCloseTo(97.6 + 120, 6)
    expect(papier.minutenProTag).toBeCloseTo(195.2 + 360, 6)
    expect(m.kostenProVorgangSoll).not.toBeNull()
  })

  it('ordnet jedem Paar seinen Fall zu (U4)', () => {
    const s = (status: 'abloesen' | 'anbinden' | 'unberuehrt', digital = true) => ({ status, digital })
    expect(medienbruchFall(s('abloesen'), s('abloesen'))).toBe('A')
    expect(medienbruchFall(s('anbinden'), s('abloesen'))).toBe('B')
    expect(medienbruchFall(s('abloesen'), s('anbinden'))).toBe('B')
    expect(medienbruchFall(s('unberuehrt', false), s('abloesen'))).toBe('C')
    expect(medienbruchFall(s('abloesen'), s('unberuehrt', false))).toBe('C')
    expect(medienbruchFall(null, s('abloesen'))).toBe('C')
    expect(medienbruchFall(s('unberuehrt'), s('abloesen'))).toBe('D')
    expect(medienbruchFall(s('anbinden'), s('anbinden'))).toBe('E')
    expect(medienbruchFall(null, s('unberuehrt'))).toBe('E')
  })

  it('meldet Übertragungen in Aufgaben ohne System', () => {
    const p = prozess([aufgabe('a', { name: 'Notiz', uebertragung: { quelleMediumId: null, minuten: 2 } })])
    const m = berechneMengengeruest(projekt(p), standardUmfang(projekt(p), 'erp'), rahmenL())
    expect(m.medienbrueche).toEqual([])
    expect(m.befunde.map((b) => b.code)).toEqual(['U2', 'U4'])
  })

  it('liefert die Enden der Grundlage', () => {
    expect(online().enden.map((e) => [e.ergebnis, e.regulaer, Number(e.anteil.toFixed(7))])).toEqual([
      ['Ware versendet', true, 0.9606987],
      ['Bestellung storniert', false, 0.0262009],
      ['Bestellung verfallen', false, 0.0131004],
    ])
  })

  it('rundet mit Toleranz auf', () => {
    expect(aufrunden(0.1 * 30)).toBe(3)
    expect(aufrunden(3.2)).toBe(4)
    expect(aufrunden(0)).toBe(0)
  })
})
