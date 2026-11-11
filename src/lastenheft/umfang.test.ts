import { describe, expect, it } from 'vitest'
import { neuerRahmen } from '../modell/projekt'
import { aufgabe, prozess, projekt } from '../testhilfen/bausteine'
import { lieferdienstProjekt, onlineProjekt } from '../testhilfen/testdaten'
import { aufgabenImUmfang, alleMedien, istStandardStatus, rollenImUmfang, standardStatus, standardUmfang, statusVon } from './umfang'

describe('Umfang (U1 bis U3)', () => {
  it('setzt den Standardstatus je System für ERP (T-U1)', () => {
    const pl = lieferdienstProjekt()
    const umfang = standardUmfang(pl, 'erp')
    expect(umfang.grundlage).toBe('ist')
    expect(umfang.medien).toEqual({ med_papier: 'unberuehrt', med_telefon: 'unberuehrt', med_excel: 'abloesen', med_erp: 'abloesen' })
    expect(umfang.aufgabenAus).toEqual([])
    expect(umfang.aufgabenEin).toEqual([])
  })

  it('kennt die Tabelle U1 für alle Arten', () => {
    expect(standardStatus('erp', 'erp')).toBe('abloesen')
    expect(standardStatus('erp', 'shop')).toBe('anbinden')
    expect(standardStatus('tabelle', 'crm')).toBe('abloesen')
    expect(standardStatus('fachanwendung', 'erp')).toBe('anbinden')
    for (const art of ['email', 'papier', 'telefon', 'sonstiges'] as const) expect(standardStatus(art, 'dms')).toBe('unberuehrt')
  })

  it('nimmt 8 Aufgaben und 4 Rollen in den Umfang (T-U2)', () => {
    const pl = lieferdienstProjekt()
    const { imUmfang, befunde } = aufgabenImUmfang(pl.ist, standardUmfang(pl, 'erp'), 'erp')
    expect(imUmfang).toEqual(['auf_erfassen', 'auf_aendern', 'auf_stornieren', 'auf_tour', 'auf_bestaetigen', 'auf_rechnung', 'auf_freigeben', 'auf_versenden'])
    expect(befunde).toEqual([])
    expect(rollenImUmfang(pl.ist, imUmfang).map((r) => r.name)).toEqual(['Innendienst', 'Disposition', 'Buchhaltung', 'Niederlassungsleitung'])
  })

  it('beachtet ausgeschlossene und eingeschlossene Aufgaben (T-U3)', () => {
    const pl = lieferdienstProjekt()
    const umfang = standardUmfang(pl, 'erp')
    expect(aufgabenImUmfang(pl.ist, { ...umfang, aufgabenAus: ['auf_aendern'] }, 'erp').imUmfang).toHaveLength(7)
    const mitAnnahme = aufgabenImUmfang(pl.ist, { ...umfang, aufgabenEin: ['auf_annehmen'] }, 'erp').imUmfang
    expect(mitAnnahme).toHaveLength(9)
    expect(mitAnnahme[0]).toBe('auf_annehmen')
  })

  it('meldet Aufgaben ohne System und schließt sie nur auf Wunsch ein (T-U3)', () => {
    const p = prozess([aufgabe('a', { name: 'Ohne System' }), aufgabe('b', { mediumId: 'm' })], { medien: [{ id: 'm', name: 'Alt-ERP', art: 'erp' }] })
    const umfang = standardUmfang(projekt(p), 'erp')
    const ohne = aufgabenImUmfang(p, umfang, 'erp')
    expect(ohne.imUmfang).toEqual(['b'])
    expect(ohne.befunde).toEqual([{ schwere: 'hinweis', code: 'U2', text: 'Die Aufgabe „Ohne System“ hat kein System und ist deshalb nicht im Umfang. Bei Bedarf einschließen.', bezug: 'a' }])
    expect(aufgabenImUmfang(p, { ...umfang, aufgabenEin: ['a'] }, 'erp')).toEqual({ imUmfang: ['a', 'b'], befunde: [] })
  })

  it('wählt den Soll-Prozess als Grundlage, wenn vorhanden, und kennt Systeme aus beiden', () => {
    const pl = onlineProjekt()
    const soll = structuredClone(pl.ist)
    soll.medien = soll.medien.filter((m) => m.id !== 'med_papier').concat({ id: 'med_scanner', name: 'Scanner', art: 'fachanwendung' })
    const mitSoll = projekt(pl.ist, soll)
    const umfang = standardUmfang(mitSoll, 'shop')
    expect(umfang.grundlage).toBe('soll')
    expect(alleMedien(mitSoll, 'soll').map((m) => m.id)).toEqual(['med_shop', 'med_erp', 'med_email', 'med_scanner', 'med_papier'])
    expect(umfang.medien).toMatchObject({ med_erp: 'anbinden', med_scanner: 'anbinden', med_papier: 'unberuehrt' })
  })

  it('nimmt für Systeme ohne Eintrag den Standard und erkennt Abweichungen', () => {
    const m = { id: 'neu', name: 'Neu', art: 'tabelle' as const }
    const umfang = { grundlage: 'ist' as const, medien: {}, aufgabenAus: [], aufgabenEin: [] }
    expect(statusVon(umfang, m, 'erp')).toBe('abloesen')
    expect(istStandardStatus(umfang, m, 'erp')).toBe(true)
    expect(istStandardStatus({ ...umfang, medien: { neu: 'anbinden' } }, m, 'erp')).toBe(false)
    // ein Schlüssel wie „toString“ ist kein Eintrag
    expect(statusVon(umfang, { ...m, id: 'toString' }, 'erp')).toBe('abloesen')
    expect(neuerRahmen().softwareart).toBe('erp')
  })
})
