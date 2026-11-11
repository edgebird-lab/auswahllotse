import { describe, expect, it } from 'vitest'
import type { AuswahlProjekt } from '../modell/typen'
import { JETZT, lieferdienstAuswahl, nachId } from '../testhilfen/projekte'
import { neuesArbeitsprojekt, setzeAufgabeImUmfang, setzeGrundlage, setzeMediumStatus, setzeRahmen, setzeRichtwert } from './aenderungen'

const status = (p: AuswahlProjekt, id: string) => nachId(p, id).status

describe('Neues Projekt mit Katalog', () => {
  it('legt den Katalog zum Standard-Rahmen an (ERP, Betrieb offen)', () => {
    const p = neuesArbeitsprojekt(JETZT)
    const aktiv = p.anforderungen.filter((a) => a.status === 'aktiv').map((a) => a.herkunft.katalogId)
    const vorschlaege = p.anforderungen.filter((a) => a.status === 'vorschlag').map((a) => a.herkunft.katalogId)
    // Auftragsverarbeitung und Verfügbarkeit hängen an „Betrieb ≠ eigener Server“ → offen → Vorschlag
    expect(aktiv).toEqual(['N-DS-3', 'N-DS-4', 'N-DS-5', 'N-DS-6', 'N-SI-1', 'N-GB-1', 'N-GB-2', 'N-GB-3', 'N-GB-4', 'N-BT-1', 'N-BT-2', 'N-BT-4', 'N-BT-5', 'N-AN-1', 'N-AN-2', 'N-AN-3'])
    expect(vorschlaege).toEqual(['ERP-1', 'ERP-2', 'ERP-3', 'ERP-4', 'ERP-6', 'ERP-5', 'N-DS-1', 'N-DS-2', 'N-BT-3', 'N-BF-2'])
    expect(p.prozess).toBeNull()
  })
})

describe('Rahmen ändern (5.2)', () => {
  it('gleicht bei reinen Textfeldern nichts ab', () => {
    const p = lieferdienstAuswahl()
    const q = setzeRahmen(p, { vorhaben: 'Neues ERP', betrieb: 'X' }, JETZT)
    expect(q.rahmen.vorhaben).toBe('Neues ERP')
    expect(q.anforderungen).toBe(p.anforderungen)
    expect(setzeRahmen(p, { vorhaben: p.rahmen.vorhaben }, JETZT)).toBe(p)
  })

  it('stellt beim Wechsel der Softwareart Standards, Umfang und Bausteine um', () => {
    const p = setzeRahmen(lieferdienstAuswahl(), { softwareart: 'crm' }, JETZT)
    // Steuerrelevanz stand auf dem ERP-Standard „ja“ und folgt dem CRM-Standard „weiß nicht“
    expect(p.rahmen.steuerrelevant).toBe('offen')
    // Die Warenwirtschaft (Art erp) wird bei CRM angebunden statt abgelöst; die Excel-Tabelle bleibt abgelöst
    expect(p.umfang!.medien).toMatchObject({ med_erp: 'anbinden', med_excel: 'abloesen' })
    expect(status(p, 'aufgabe:auf_erfassen')).toBe('verworfen')
    expect(nachId(p, 'aufgabe:auf_erfassen').notiz).toBe('Quelle im Prozessmodell entfällt (Neu einlesen am 11.11.2026).')
    expect(status(p, 'aufgabe:auf_tour')).toBe('aktiv')
    expect(status(p, 'baustein:ERP-1')).toBe('verworfen')
    expect(status(p, 'baustein:CRM-4')).toBe('vorschlag')
    // ohne Steuerrelevanz werden die AO-Anforderungen zu Vorschlägen; die Nummer bleibt
    expect(nachId(p, 'katalog:N-GB-1')).toMatchObject({ status: 'vorschlag', nummer: 'G-01' })
  })

  it('lässt selbst gesetzte Antworten beim Wechsel der Softwareart stehen', () => {
    let p = setzeRahmen(lieferdienstAuswahl(), { steuerrelevant: 'nein' }, JETZT)
    p = setzeRahmen(p, { softwareart: 'shop' }, JETZT)
    expect(p.rahmen).toMatchObject({ steuerrelevant: 'nein', verbraucherverkauf: 'offen' })
  })

  it('setzt Richtwerte in die Texte ein', () => {
    const p = setzeRichtwert(lieferdienstAuswahl(), 'wiederherstellungStunden', 8, JETZT)
    expect(nachId(p, 'katalog:N-BT-1').text).toContain('binnen 8 Stunden')
  })
})

describe('Umfang ändern (5.3, U2)', () => {
  it('verwirft die Funktionen eines Systems, das nicht mehr abgelöst wird', () => {
    const p = setzeMediumStatus(lieferdienstAuswahl(), 'med_erp', 'anbinden', JETZT)
    expect(p.umfang!.medien.med_erp).toBe('anbinden')
    expect(nachId(p, 'aufgabe:auf_erfassen')).toMatchObject({ status: 'verworfen', nummer: 'F-01' })
  })

  it('nimmt Aufgaben auf und heraus und merkt nur Abweichungen vom Standard', () => {
    let p = setzeAufgabeImUmfang(lieferdienstAuswahl(), 'auf_annehmen', true, JETZT)
    expect(p.umfang!.aufgabenEin).toEqual(['auf_annehmen'])
    expect(nachId(p, 'aufgabe:auf_annehmen')).toMatchObject({ status: 'aktiv', nummer: 'F-09' })
    p = setzeAufgabeImUmfang(p, 'auf_aendern', false, JETZT)
    expect(p.umfang!.aufgabenAus).toEqual(['auf_aendern'])
    expect(status(p, 'aufgabe:auf_aendern')).toBe('verworfen')
    // zurück in den Umfang: dieselbe Nummer, wieder aktiv
    p = setzeAufgabeImUmfang(p, 'auf_aendern', true, JETZT)
    expect(p.umfang!.aufgabenAus).toEqual([])
    expect(nachId(p, 'aufgabe:auf_aendern')).toMatchObject({ status: 'aktiv', nummer: 'F-02' })
    p = setzeAufgabeImUmfang(p, 'auf_annehmen', false, JETZT)
    expect(p.umfang!.aufgabenEin).toEqual([])
  })

  it('wählt den Soll-Prozess nur, wenn es ihn gibt', () => {
    const p = lieferdienstAuswahl()
    expect(setzeGrundlage(p, 'soll', JETZT)).toBe(p)
    expect(setzeGrundlage(p, 'ist', JETZT)).toBe(p)
  })
})

describe('Änderungszähler G5 bei Abgleichen nach Bewertungsbeginn', () => {
  const bewertet = () => ({ ...lieferdienstAuswahl(), bewertungBegonnenAm: JETZT })
  const zaehler = (p: AuswahlProjekt) => p.gewichtung.aenderungenNachBewertung

  it('zählt einen Abgleich, der K.-o.-Kriterien oder Nutzwert verschiebt, einmal', () => {
    // Warenwirtschaft nicht mehr ablösen: sieben Funktionen und eine Schnittstelle entfallen auf einmal
    const p = setzeMediumStatus(bewertet(), 'med_erp', 'anbinden', JETZT)
    expect(status(p, 'aufgabe:auf_erfassen')).toBe('verworfen')
    expect(zaehler(p)).toBe(1)
    // Daten über Personen „nein“: der Datenschutz-Katalog entfällt
    expect(zaehler(setzeRahmen(p, { personenbezogen: 'nein' }, JETZT))).toBe(2)
    // eine Aufgabe in den Umfang nehmen: neue Funktion
    expect(zaehler(setzeAufgabeImUmfang(p, 'auf_annehmen', true, JETZT))).toBe(2)
  })

  it('zählt reine Textänderungen und Abgleiche vor Bewertungsbeginn nicht', () => {
    // Antwortzeit und Betriebstage ändern nur Zahlen in Texten
    expect(zaehler(setzeRichtwert(bewertet(), 'antwortzeitSek', 3, JETZT))).toBe(0)
    expect(zaehler(setzeRahmen(bewertet(), { betriebstageProJahr: 220 }, JETZT))).toBe(0)
    expect(zaehler(setzeMediumStatus(lieferdienstAuswahl(), 'med_erp', 'anbinden', JETZT))).toBe(0)
  })
})
