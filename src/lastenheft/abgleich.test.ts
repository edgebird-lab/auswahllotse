import { describe, expect, it } from 'vitest'
import { neuesAngebot } from '../modell/projekt'
import type { PlAufgabe, PlProjekt } from '../prozessdatei/format'
import { lieferdienstAuswahl, nachId, nachNummer, quelleAus } from '../testhilfen/projekte'
import { lieferdienstProjekt } from '../testhilfen/testdaten'
import { gleicheAb, liesProzessEin, passeUmfangAn, vorschauText } from './abgleich'
import { setzePrioritaet, setzeTexte, verwirf } from './operationen'

const MORGEN = '2026-11-12T08:00:00.000Z'

/** Lieferdienst ohne Freigabe und mit umbenannter Tourenplanung. */
function geaendertesModell(): PlProjekt {
  const pl = lieferdienstProjekt()
  pl.ist.ablauf.schritte = pl.ist.ablauf.schritte.filter((b) => b.id !== 'auf_freigeben')
  const tour = pl.ist.ablauf.schritte.find((b) => b.id === 'auf_tour') as PlAufgabe
  tour.name = 'Tour mit Software planen'
  return pl
}

describe('Neu einlesen mit Abgleich (6.14, T-A11)', () => {
  it('verwirft Entfallenes, behält Nummern und Bearbeitetes, übernimmt Umbenanntes', () => {
    let p = lieferdienstAuswahl()
    p = setzeTexte(p, nachNummer(p, 'F-06').id, { text: 'Die Software muss Rechnungen aus dem Auftrag erzeugen.' })
    const angebot = neuesAngebot('Anbieter A', 'Produkt A')
    angebot.bewertungen['aufgabe:auf_freigeben'] = { ko: 'erfuellt', punkte: null, fundstelle: 'S. 3', notiz: '' }
    p = { ...p, angebote: [angebot] }

    const { projekt, vorschau } = liesProzessEin(p, quelleAus(geaendertesModell()), MORGEN)
    // geändert: F-04 (Name), S-02 (nennt die Aufgabe), R-01 (Rollen), M-02 (Benutzer)
    expect(vorschau).toEqual({ neu: 0, geaendert: 4, entfallen: 2 })
    expect(vorschauText(vorschau)).toBe('0 neu, 4 geändert, 2 entfallen')

    const f07 = nachNummer(projekt, 'F-07')
    expect(f07).toMatchObject({ id: 'aufgabe:auf_freigeben', status: 'verworfen', notiz: 'Quelle im Prozessmodell entfällt (Neu einlesen am 12.11.2026).' })
    expect(nachNummer(projekt, 'R-02')).toMatchObject({ id: 'freigabe:auf_freigeben', status: 'verworfen' })
    expect(nachNummer(projekt, 'F-06').text).toBe('Die Software muss Rechnungen aus dem Auftrag erzeugen.')
    const f04 = nachNummer(projekt, 'F-04')
    expect(f04.id).toBe('aufgabe:auf_tour')
    expect(f04.titel).toBe('Tour mit Software planen')
    expect(f04.text).toBe('Die Software muss die Aufgabe „Tour mit Software planen“ für die Rolle Disposition unterstützen.')
    expect(nachNummer(projekt, 'R-01').begruendung).toBe('Aus dem Prozessmodell: 3 Rollen im Umfang, zusammen 6 Benutzer.')
    expect(nachNummer(projekt, 'M-02').text).toBe('Die Software muss 6 benannte Benutzer zulassen.')
    // Nummern und Bewertungen bleiben
    expect(projekt.naechsteNummer).toEqual(p.naechsteNummer)
    expect(projekt.angebote[0].bewertungen['aufgabe:auf_freigeben']).toEqual({ ko: 'erfuellt', punkte: null, fundstelle: 'S. 3', notiz: '' })
    // das übergebene Projekt bleibt unverändert
    expect(nachNummer(p, 'F-07').status).toBe('aktiv')
  })

  it('behält bearbeitete Priorität und bearbeiteten Status', () => {
    let p = lieferdienstAuswahl()
    p = setzePrioritaet(p, nachNummer(p, 'F-02').id, 'muss')
    p = verwirf(p, nachNummer(p, 'F-03').id)
    const { projekt, vorschau } = liesProzessEin(p, p.prozess!, MORGEN)
    expect(vorschau).toEqual({ neu: 0, geaendert: 0, entfallen: 0 })
    expect(nachNummer(projekt, 'F-02')).toMatchObject({ prioritaet: 'muss', prioritaetVorschlag: 'soll', bearbeitet: { prioritaet: true } })
    expect(nachNummer(projekt, 'F-02').text).toContain('Die Software muss die Aufgabe')
    expect(nachNummer(projekt, 'F-03').status).toBe('verworfen')
  })

  it('belebt eine entfallene Anforderung mit ihrer Nummer wieder, wenn die Quelle zurückkommt', () => {
    const p = lieferdienstAuswahl()
    const ohne = liesProzessEin(p, quelleAus(geaendertesModell()), MORGEN).projekt
    const wieder = liesProzessEin(ohne, quelleAus(lieferdienstProjekt()), MORGEN)
    expect(nachId(wieder.projekt, 'aufgabe:auf_freigeben')).toMatchObject({ nummer: 'F-07', status: 'aktiv' })
    expect(wieder.vorschau.entfallen).toBe(0)
  })

  it('nummeriert neue Anforderungen fortlaufend weiter', () => {
    const p = lieferdienstAuswahl()
    const pl = lieferdienstProjekt()
    pl.ist.ablauf.schritte.push({ ...(pl.ist.ablauf.schritte[1] as PlAufgabe), id: 'auf_mahnen', name: 'Zahlung mahnen', uebertragung: null })
    const { projekt, vorschau } = liesProzessEin(p, quelleAus(pl), MORGEN)
    expect(vorschau.neu).toBe(1)
    expect(nachId(projekt, 'aufgabe:auf_mahnen').nummer).toBe('F-09')
  })

  it('gleicht den Katalog nach einer geänderten Rahmenfrage ab', () => {
    const p = lieferdienstAuswahl()
    const eigenerServer = { ...p, rahmen: { ...p.rahmen, betriebsform: 'eigener_server' as const } }
    const { projekt, vorschau } = gleicheAb(eigenerServer, MORGEN)
    // N-DS-1, N-DS-2 und N-BT-3 entfallen
    expect(vorschau).toEqual({ neu: 0, geaendert: 0, entfallen: 3 })
    expect(nachId(projekt, 'katalog:N-DS-1')).toMatchObject({ status: 'verworfen', notiz: 'Bedingung im Rahmen trifft nicht mehr zu (Abgleich am 12.11.2026).' })
    // Richtwert geändert: Text des unbearbeiteten Eintrags folgt
    const schneller = { ...p, rahmen: { ...p.rahmen, richtwerte: { ...p.rahmen.richtwerte, wiederherstellungStunden: 8 } } }
    const nachher = gleicheAb(schneller, MORGEN)
    expect(nachher.vorschau.geaendert).toBe(1)
    expect(nachId(nachher.projekt, 'katalog:N-BT-1').text).toContain('binnen 8 Stunden')
  })

  it('verwirft Bausteine einer anderen Softwareart', () => {
    const p = lieferdienstAuswahl()
    const { projekt } = gleicheAb({ ...p, rahmen: { ...p.rahmen, softwareart: 'crm' } }, MORGEN)
    expect(nachId(projekt, 'baustein:ERP-1')).toMatchObject({ status: 'verworfen' })
    expect(nachId(projekt, 'baustein:ERP-1').notiz).toContain('Baustein passt nicht mehr')
    expect(projekt.anforderungen.filter((a) => a.herkunft.art === 'baustein' && a.status === 'vorschlag').map((a) => a.herkunft.katalogId)).toEqual([
      'CRM-1',
      'CRM-2',
      'CRM-3',
      'CRM-5',
      'CRM-6',
      'CRM-4',
    ])
  })

  it('lässt eigene Anforderungen unverändert und hängt Notizen an', () => {
    let p = lieferdienstAuswahl()
    p = { ...p, anforderungen: p.anforderungen.map((a) => (a.id === 'aufgabe:auf_freigeben' ? { ...a, notiz: 'wichtig' } : a)) }
    const { projekt } = liesProzessEin(p, quelleAus(geaendertesModell()), MORGEN)
    expect(nachId(projekt, 'aufgabe:auf_freigeben').notiz).toBe('wichtig\nQuelle im Prozessmodell entfällt (Neu einlesen am 12.11.2026).')
    // zweimal einlesen: keine doppelte Notiz
    const nochmal = liesProzessEin(projekt, quelleAus(geaendertesModell()), MORGEN)
    expect(nochmal.vorschau.entfallen).toBe(0)
    expect(nachId(nochmal.projekt, 'aufgabe:auf_freigeben').notiz).toBe(nachId(projekt, 'aufgabe:auf_freigeben').notiz)
  })
})

describe('Umfang beim Neu einlesen (6.14 Schritt 1)', () => {
  it('behält bekannte Systeme, ergänzt neue nach U1 und streicht entfallene', () => {
    const p = lieferdienstAuswahl()
    const alt = { ...p.umfang!, medien: { ...p.umfang!.medien, med_excel: 'anbinden' as const }, aufgabenAus: ['auf_aendern', 'auf_weg'], aufgabenEin: ['auf_annehmen'] }
    const pl = lieferdienstProjekt()
    pl.ist.medien = pl.ist.medien.filter((m) => m.id !== 'med_telefon').concat({ id: 'med_scanner', name: 'Scanner', art: 'fachanwendung' })
    const neu = passeUmfangAn(alt, pl, 'erp')
    expect(neu.medien).toEqual({ med_papier: 'unberuehrt', med_excel: 'anbinden', med_erp: 'abloesen', med_scanner: 'anbinden' })
    expect(neu.aufgabenAus).toEqual(['auf_aendern'])
    expect(neu.aufgabenEin).toEqual(['auf_annehmen'])
    expect(neu.grundlage).toBe('ist')
  })

  it('fällt auf Ist zurück, wenn das Soll fehlt', () => {
    const p = lieferdienstAuswahl()
    expect(passeUmfangAn({ ...p.umfang!, grundlage: 'soll' }, lieferdienstProjekt(), 'erp').grundlage).toBe('ist')
  })
})
