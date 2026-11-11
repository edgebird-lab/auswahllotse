import { describe, expect, it } from 'vitest'
import { neuerRahmen, neuesProjekt, standardSteuerrelevant, standardVerbraucherverkauf } from './projekt'

describe('neuesProjekt (T-D1)', () => {
  it('setzt alle Standardwerte der Spezifikation', () => {
    const p = neuesProjekt('2026-11-11T10:00:00.000Z')
    expect(p.app).toBe('auswahllotse')
    expect(p.formatVersion).toBe(1)
    expect(p.angelegtAm).toBe('2026-11-11T10:00:00.000Z')
    expect(p.geaendertAm).toBe(p.angelegtAm)
    expect(p.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(p.wirtschaftlichkeit.jahre).toBe(5)
    expect(p.rahmen.betriebstageProJahr).toBe(250)
    expect(p.rahmen.spitzenfaktor).toBe(2)
    expect(p.entscheidung.regel).toBe('nutzwert')
    expect(p.entscheidung.mindestNutzwert).toBe(5)
    expect(p.wirtschaftlichkeit.zinsProzent).toBeNull()
    expect(p.wirtschaftlichkeit.kostenbasis).toBe('nominal')
    expect(p.gewichtung.methode).toBe('direkt')
    expect(p.rahmen.softwareart).toBe('erp')
  })

  it('setzt die übrigen Rahmen- und Kostenwerte', () => {
    const p = neuesProjekt()
    expect(p.rahmen).toMatchObject({ personenbezogen: 'ja', steuerrelevant: 'ja', betriebsform: 'offen', verbraucherverkauf: 'nein', kleinstunternehmen: 'offen' })
    expect(p.rahmen.richtwerte).toEqual({
      antwortzeitSek: 2,
      aufbewahrungJahre: 10,
      wiederherstellungStunden: 24,
      verfuegbarkeitProzent: 99.5,
      reaktionStunden: 4,
      referenzen: 2,
      einfuehrungWochen: 12,
    })
    expect(p.wirtschaftlichkeit).toMatchObject({ internerStundensatzEuro: 45, stundenProPersonentag: 8, preissteigerungProzent: 0, budgetAlsKo: false })
    expect(p.entscheidung).toMatchObject({ gewaehltId: null, begruendung: '', status: 'entwurf' })
    expect(p.prozess).toBeNull()
    expect(p.anforderungen).toEqual([])
    expect(p.bewertungBegonnenAm).toBeNull()
  })

  it('vergibt bei jedem Projekt eine neue Kennung und eigene Richtwerte', () => {
    const a = neuesProjekt()
    const b = neuesProjekt()
    expect(a.id).not.toBe(b.id)
    a.rahmen.richtwerte.antwortzeitSek = 9
    expect(b.rahmen.richtwerte.antwortzeitSek).toBe(2)
  })

  it('richtet steuerliche Relevanz und Verbraucherverkauf nach der Softwareart', () => {
    expect(['erp', 'shop', 'dms', 'crm', 'andere'].map((a) => standardSteuerrelevant(a as never))).toEqual(['ja', 'ja', 'ja', 'offen', 'offen'])
    expect(standardVerbraucherverkauf('shop')).toBe('offen')
    expect(standardVerbraucherverkauf('crm')).toBe('nein')
    expect(neuerRahmen('crm')).toMatchObject({ steuerrelevant: 'offen', verbraucherverkauf: 'nein' })
  })
})
