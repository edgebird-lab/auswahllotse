import { describe, expect, it } from 'vitest'
import { neuerRahmen } from '../modell/projekt'
import type { Rahmen, Umfang } from '../modell/typen'
import { normalisiereLeerraum } from '../modell/zahlformat'
import { ermittleMedienbrueche } from './schnittstellen'
import { standardUmfang } from './umfang'
import { aufgabe, projekt, prozess } from '../testhilfen/bausteine'
import { JETZT, lieferdienstAuswahl, nachId, nachNummer, onlineAuswahl, quelleAus, rahmenLProjekt } from '../testhilfen/projekte'
import { onlineProjekt } from '../testhilfen/testdaten'
import { liesProzessEin, ohneProzessmodell } from './abgleich'
import { leiteAnforderungenAb } from './ableitung'

const aktiv = (p: ReturnType<typeof lieferdienstAuswahl>, gruppe: string) => p.anforderungen.filter((a) => a.gruppe === gruppe && a.status === 'aktiv')

describe('Funktionen aus Aufgaben (A1, A2, T-A1)', () => {
  it('leitet 8 Funktionen F-01 bis F-08 in Prozessreihenfolge ab', () => {
    const p = lieferdienstAuswahl()
    const f = aktiv(p, 'funktion')
    expect(f.map((a) => [a.nummer, a.herkunft.bezuege[0], a.prioritaet])).toEqual([
      ['F-01', 'auf_erfassen', 'muss'],
      ['F-02', 'auf_aendern', 'soll'],
      ['F-03', 'auf_stornieren', 'soll'],
      ['F-04', 'auf_tour', 'muss'],
      ['F-05', 'auf_bestaetigen', 'muss'],
      ['F-06', 'auf_rechnung', 'muss'],
      ['F-07', 'auf_freigeben', 'muss'],
      ['F-08', 'auf_versenden', 'muss'],
    ])
  })

  it('formuliert Text, Abnahme und Begründung nach dem Satzmuster', () => {
    const f06 = nachNummer(lieferdienstAuswahl(), 'F-06')
    expect(f06.id).toBe('aufgabe:auf_rechnung')
    expect(f06.titel).toBe('Rechnung erstellen')
    expect(f06.text).toBe('Die Software muss die Aufgabe „Rechnung erstellen“ für die Rolle Buchhaltung unterstützen.')
    expect(f06.abnahme).toBe('Test mit Beispieldaten: Eine Person der Rolle Buchhaltung erledigt „Rechnung erstellen“ vollständig in der Software, ohne Daten abzutippen, in höchstens 1,5 Minuten.')
    expect(f06.begruendung).toBe('Aus dem Prozessmodell: 117 Ausführungen pro Tag, heute mit „Warenwirtschaft“.')
    expect(f06.punkte).toBe(0)
    const f02 = nachNummer(lieferdienstAuswahl(), 'F-02')
    expect(f02.text).toBe('Die Software sollte die Aufgabe „Bestellung ändern“ für die Rolle Innendienst unterstützen.')
    expect(f02.begruendung).toBe('Aus dem Prozessmodell: 6,7 Ausführungen pro Tag, heute mit „Warenwirtschaft“.')
    expect(f02.punkte).toBe(2)
  })

  it('lässt ohne Rolle und ohne Bearbeitungszeit die passenden Teile weg', () => {
    const p = prozess([aufgabe('a', { name: 'Lieferschein drucken', mediumId: 'm', bearbeitungMin: 0 }), aufgabe('b', { name: 'Kurz', mediumId: 'm', rolleId: 'r', bearbeitungMin: 1 })], {
      medien: [{ id: 'm', name: 'Alt-ERP', art: 'erp' }],
      rollen: [{ id: 'r', name: 'Lager', stundensatz: 30, personen: 2, verfuegbarProzent: 100 }],
    })
    const pr = liesProzessEin(rahmenLProjekt(), quelleAus(projekt(p)), JETZT).projekt
    expect(nachId(pr, 'aufgabe:a').text).toBe('Die Software muss die Aufgabe „Lieferschein drucken“ für alle Benutzer unterstützen.')
    expect(nachId(pr, 'aufgabe:a').abnahme).toBe('Test mit Beispieldaten: Eine Person erledigt „Lieferschein drucken“ vollständig in der Software, ohne Daten abzutippen.')
    expect(nachId(pr, 'aufgabe:b').abnahme).toContain('in höchstens 1 Minute.')
  })

  it('setzt die Normalfall-Schwelle bei 50 %', () => {
    const genau = prozess([aufgabe('x', { mediumId: 'm' })], { medien: [{ id: 'm', name: 'Excel', art: 'tabelle' }] })
    const mitAnteil = (anteil: number) =>
      prozess(
        [
          {
            typ: 'entscheidung',
            id: 'e',
            art: 'daten',
            frage: 'F?',
            zweige: [
              { id: 'z1', bezeichnung: 'a', anteil, schritte: [aufgabe('x', { mediumId: 'm' })], ende: null, zurueckZu: null, ereignis: null },
              { id: 'z2', bezeichnung: 'b', anteil: 1 - anteil, schritte: [], ende: null, zurueckZu: null, ereignis: null },
            ],
          },
        ],
        { medien: genau.medien },
      )
    const prio = (anteil: number) => nachId(liesProzessEin(rahmenLProjekt(), quelleAus(projekt(mitAnteil(anteil))), JETZT).projekt, 'aufgabe:x').prioritaet
    expect(prio(0.5)).toBe('muss')
    expect(prio(0.49)).toBe('soll')
  })
})

describe('Entscheidungs-Vorschläge (A3, T-A2)', () => {
  it('schlägt genau „Ware vorrätig?“ als Kann vor', () => {
    const e = lieferdienstAuswahl().anforderungen.filter((a) => a.herkunft.art === 'entscheidung')
    expect(e).toHaveLength(1)
    expect(e[0]).toMatchObject({ id: 'entscheidung:ent_vorrat', titel: 'Ware vorrätig?', prioritaet: 'kann', status: 'vorschlag', nummer: null, punkte: 1 })
    expect(e[0].text).toBe('Die Software kann die Angaben für die Entscheidung „Ware vorrätig?“ auf einen Blick zeigen.')
    expect(e[0].abnahme).toBe('Test: Alle Angaben für „Ware vorrätig?“ stehen auf einer Seite.')
  })

  it('übergeht Ereignis-Entscheidungen', () => {
    const e = onlineAuswahl().anforderungen.filter((a) => a.herkunft.art === 'entscheidung')
    expect(e.map((a) => a.titel)).toEqual(['Daten vollständig und korrekt?'])
  })
})

describe('Schnittstellen aus Medienbrüchen (U4, U5, A4)', () => {
  it('leitet Papier → Warenwirtschaft als Fall C ab (T-A3)', () => {
    const p = lieferdienstAuswahl()
    const s01 = nachNummer(p, 'S-01')
    expect(s01.id).toBe('medienbruch:med_papier>med_erp')
    expect(s01.prioritaet).toBe('muss')
    expect(s01.text).toBe(
      'Die Software muss die Erfassung direkt bei der Entstehung ermöglichen, damit niemand Daten von „Papier“ abtippt („Bestellung in Warenwirtschaft erfassen“ und „Zustellung im System bestätigen“).',
    )
    expect(s01.abnahme).toBe('Test: „Bestellung in Warenwirtschaft erfassen“ und „Zustellung im System bestätigen“ gelingen ohne Papier- oder Telefonnotiz.')
    expect(normalisiereLeerraum(s01.begruendung)).toBe('Heute 237 Übertragungen und 477 Minuten pro Tag (316 € pro Tag).')
    const mb = ermittleMedienbrueche(p.prozess!.projekt, p.umfang!, 'erp').medienbrueche[0]
    expect(mb.fall).toBe('C')
    expect(mb.aufgaben).toEqual(['auf_erfassen', 'auf_bestaetigen'])
    expect(mb.uebertragungenProTag).toBeCloseTo(237.12, 6)
    expect(mb.minutenProTag).toBeCloseTo(477.12, 6)
  })

  it('leitet Warenwirtschaft → Excel-Tourenliste als Fall A ab (T-A4)', () => {
    const p = lieferdienstAuswahl()
    const s02 = nachNummer(p, 'S-02')
    expect(s02.id).toBe('medienbruch:med_erp>med_excel')
    expect(s02.prioritaet).toBe('muss')
    expect(s02.text).toBe('Die Software muss Daten aus „Warenwirtschaft“ ohne erneute Eingabe für „Tour planen“ bereitstellen.')
    expect(s02.abnahme).toBe('Test: Daten aus „Warenwirtschaft“ erscheinen in „Tour planen“, ohne sie abzutippen.')
    const mb = ermittleMedienbrueche(p.prozess!.projekt, p.umfang!, 'erp').medienbrueche[1]
    expect([mb.fall, mb.uebertragungenProTag, mb.minutenProTag].map((x) => (typeof x === 'number' ? Number(x.toFixed(6)) : x))).toEqual(['A', 117.12, 117.12])
  })

  it('leitet in der Onlinebestellung eine Schnittstelle zum Shop ab (T-A5)', () => {
    const p = onlineAuswahl()
    const s01 = nachNummer(p, 'S-01')
    expect(s01.prioritaet).toBe('muss')
    expect(s01.text).toBe('Die Software muss Daten mit „Shopsystem“ austauschen (von „Shopsystem“ in die Software), damit niemand sie von Hand überträgt.')
    expect(s01.abnahme).toBe('Test: Ein Datensatz gelangt ohne Abtippen von „Shopsystem“ nach „ERP“; Fehler werden gemeldet.')
    const mb = ermittleMedienbrueche(p.prozess!.projekt, p.umfang!, 'erp').medienbrueche[0]
    expect(mb.fall).toBe('B')
    expect(mb.uebertragungenProTag).toBeCloseTo(218.34, 2)
    expect(mb.minutenProTag).toBeCloseTo(436.68, 2)
  })

  /** Ein System „ERP“ (ablösen) mit Übertragung aus `quelle`, V Vorgänge, 1 Minute je Übertragung. */
  function einBruch(v: number, quelle: { name: string; art: 'fachanwendung' | 'email' | 'papier' | 'erp' }, zielArt: 'erp' | 'papier' = 'erp') {
    const p = prozess([aufgabe('a', { name: 'Erfassen', mediumId: 'ziel', rolleId: 'r', uebertragung: { quelleMediumId: 'quelle', minuten: 1 } })], {
      vorgaengeProTag: v,
      medien: [
        { id: 'quelle', name: quelle.name, art: quelle.art },
        { id: 'ziel', name: 'Altsystem', art: zielArt },
      ],
      rollen: [{ id: 'r', name: 'Büro', stundensatz: 60, personen: 1, verfuegbarProzent: 100 }],
    })
    return liesProzessEin(rahmenLProjekt(), quelleAus(projekt(p)), JETZT).projekt.anforderungen.find((a) => a.gruppe === 'schnittstelle' && a.herkunft.art === 'medienbruch')
  }

  it('richtet die Priorität nach Minuten pro Tag (T-A5)', () => {
    expect(einBruch(60, { name: 'Shop', art: 'fachanwendung' })?.prioritaet).toBe('muss')
    expect(einBruch(59.9, { name: 'Shop', art: 'fachanwendung' })?.prioritaet).toBe('soll')
    expect(einBruch(10, { name: 'Shop', art: 'fachanwendung' })?.prioritaet).toBe('soll')
    expect(einBruch(9.9, { name: 'Shop', art: 'fachanwendung' })?.prioritaet).toBe('kann')
  })

  it('macht Fall D zum Vorschlag (T-A5)', () => {
    const d = einBruch(100, { name: 'Postfach', art: 'email' })!
    expect(d.status).toBe('vorschlag')
    expect(d.nummer).toBeNull()
    expect(d.text).toBe('Die Software muss Daten mit „Postfach“ austauschen (von „Postfach“ in die Software), damit niemand sie von Hand überträgt.')
    expect(d.begruendung).toContain('Vorschlag, weil „Postfach“ unberührt bleibt.')
  })

  it('formuliert Fall C mit nicht digitalem Ziel und übergeht Fall E', () => {
    const c = einBruch(100, { name: 'Alt-ERP', art: 'erp' }, 'papier')!
    expect(c.titel).toBe('Digitale Daten statt Altsystem')
    expect(c.text).toBe('Die Software muss die Daten für „Erfassen“ digital bereitstellen, damit niemand sie auf „Altsystem“ abschreibt.')
    expect(c.abnahme).toBe('Test: „Erfassen“ gelingt ohne Abschreiben.')
    // Papier → Papier: keins wird abgelöst
    expect(einBruch(100, { name: 'Zettel', art: 'papier' }, 'papier')).toBeUndefined()
  })
})

describe('Rollen, Freigaben, Prüfungen, Mengengerüst (A5 bis A8)', () => {
  it('nennt 4 Rollen mit 7 Benutzern und die Freigabe (T-A6)', () => {
    const p = lieferdienstAuswahl()
    const r01 = nachNummer(p, 'R-01')
    expect(r01.id).toBe('rollen')
    expect(r01.prioritaet).toBe('muss')
    expect(r01.text).toBe(
      'Die Software muss 4 Rollen mit eigenen Rechten abbilden: Innendienst (4 Benutzer): „Bestellung in Warenwirtschaft erfassen“, „Bestellung ändern“ und „Bestellung stornieren“; Disposition (1 Benutzer): „Tour planen“ und „Zustellung im System bestätigen“; Buchhaltung (1 Benutzer): „Rechnung erstellen“ und „Rechnung versenden“; Niederlassungsleitung (1 Benutzer): „Rechnung freigeben“.',
    )
    expect(r01.begruendung).toBe('Aus dem Prozessmodell: 4 Rollen im Umfang, zusammen 7 Benutzer.')
    const r02 = nachNummer(p, 'R-02')
    expect(r02).toMatchObject({ id: 'freigabe:auf_freigeben', prioritaet: 'muss', titel: 'Freigabe: Rechnung freigeben' })
    expect(r02.text).toBe('Die Software muss sicherstellen, dass nur die Rolle Niederlassungsleitung „Rechnung freigeben“ ausführt, und jede Freigabe mit Person und Zeitpunkt protokollieren.')
    expect(p.anforderungen.some((a) => a.herkunft.art === 'pruefung')).toBe(false)
  })

  it('leitet eine Prüfung im Umfang als Soll ab', () => {
    const p = lieferdienstAuswahl()
    const mitLager = liesProzessEin(p, p.prozess!, JETZT)
    expect(mitLager.vorschau).toEqual({ neu: 0, geaendert: 0, entfallen: 0 })
    const umfang: Umfang = { ...p.umfang!, aufgabenEin: ['auf_kontrollieren'] }
    const neu = leiteAnforderungenAb({ ...p, umfang })
    const pruefung = neu.find((a) => a.id === 'pruefung:auf_kontrollieren')!
    expect(pruefung).toMatchObject({ gruppe: 'benutzer', prioritaet: 'soll', status: 'aktiv', titel: 'Prüfung: Kommissionierung kontrollieren' })
    expect(pruefung.text).toBe('Die Software sollte das Ergebnis der Prüfung „Kommissionierung kontrollieren“ mit Person und Zeitpunkt dokumentieren.')
    // Reihenfolge in der Gruppe: Rollen, Freigaben, Prüfungen
    expect(neu.filter((a) => a.gruppe === 'benutzer').map((a) => a.herkunft.art)).toEqual(['rollen', 'freigabe', 'pruefung'])
  })

  it('leitet das Mengengerüst ab (T-A7)', () => {
    const p = lieferdienstAuswahl()
    expect(nachNummer(p, 'M-01').text).toBe('Die Software muss 120 Vorgänge pro Tag im Mittel und 240 an starken Tagen verarbeiten (30.000 pro Jahr).')
    expect(nachNummer(p, 'M-02')).toMatchObject({ id: 'menge:benutzer', text: 'Die Software muss 7 benannte Benutzer zulassen.', abnahme: 'Das Lizenzangebot deckt 7 benannte Benutzer.' })
    expect(nachNummer(p, 'M-03')).toMatchObject({ id: 'menge:antwortzeit', prioritaet: 'soll', punkte: 2 })
    expect(nachNummer(p, 'M-03').text).toBe('Die Software sollte Standardaktionen (Öffnen, Speichern, Suchen) bei Spitzenlast in höchstens 2 Sekunden ausführen.')
    expect(nachNummer(p, 'M-04')).toMatchObject({ id: 'menge:datenbestand', prioritaet: 'soll' })
    expect(nachNummer(p, 'M-04').text).toBe('Die Software sollte den Datenbestand von 10 Jahren vorhalten, rund 300.000 Vorgänge, und dabei die Antwortzeit einhalten.')
  })

  it('lässt die Benutzerzahl ohne Benutzer weg und beachtet die Einzahl', () => {
    const p = prozess([aufgabe('a', { mediumId: 'm', rolleId: 'r' })], {
      medien: [{ id: 'm', name: 'Excel', art: 'tabelle' }],
      rollen: [{ id: 'r', name: 'Chef', stundensatz: 80, personen: 1, verfuegbarProzent: 100 }],
    })
    const pr = rahmenLProjekt()
    pr.rahmen.richtwerte.antwortzeitSek = 1
    pr.rahmen.richtwerte.aufbewahrungJahre = 1
    const a = liesProzessEin(pr, quelleAus(projekt(p)), JETZT).projekt
    expect(nachId(a, 'menge:benutzer').text).toBe('Die Software muss 1 benannten Benutzer zulassen.')
    expect(nachId(a, 'rollen').text).toBe('Die Software muss 1 Rolle mit eigenen Rechten abbilden: Chef (1 Benutzer): „a“.')
    expect(nachId(a, 'menge:antwortzeit').text).toContain('in höchstens 1 Sekunde ausführen')
    expect(nachId(a, 'menge:datenbestand').text).toContain('von 1 Jahr vorhalten')
    const ohne = prozess([aufgabe('a', { mediumId: 'm', rolleId: 'r' })], { medien: p.medien, rollen: [{ ...p.rollen[0], personen: 0 }] })
    expect(liesProzessEin(rahmenLProjekt(), quelleAus(projekt(ohne)), JETZT).projekt.anforderungen.some((x) => x.id === 'menge:benutzer')).toBe(false)
  })
})

describe('Katalog und Bausteine (A9, A10)', () => {
  const rahmen = (werte: Partial<Rahmen>): Rahmen => ({ ...neuerRahmen(werte.softwareart ?? 'erp'), betriebsform: 'cloud', ...werte })
  const katalog = (r: Rahmen) => leiteAnforderungenAb({ rahmen: r, prozess: null, umfang: null }).filter((a) => a.herkunft.art === 'katalog')
  const bausteine = (r: Rahmen) => leiteAnforderungenAb({ rahmen: r, prozess: null, umfang: null }).filter((a) => a.herkunft.art === 'baustein')

  it('legt bei Rahmen L 19 aktive Einträge an (T-A8)', () => {
    const k = katalog(rahmen({}))
    expect(k.filter((a) => a.status === 'aktiv')).toHaveLength(19)
    expect(k.filter((a) => a.status === 'vorschlag').map((a) => a.herkunft.katalogId)).toEqual(['N-BF-2'])
    expect(k.some((a) => a.herkunft.katalogId === 'N-BF-1')).toBe(false)
    expect(k.find((a) => a.herkunft.katalogId === 'N-BT-1')!.text).toBe(
      'Die Software muss mindestens täglich gesichert werden. Die Wiederherstellung gelingt binnen 24 Stunden und wird jährlich getestet.',
    )
    expect(k.find((a) => a.herkunft.katalogId === 'N-BT-3')!.text).toBe('Die Software sollte zu den Geschäftszeiten zu mindestens 99,5 % je Monat verfügbar sein.')
    expect(k.find((a) => a.herkunft.katalogId === 'N-DS-1')!.quelle).toBe('Art. 28 DSGVO, Stand 11.11.2026')
  })

  it('wertet die BFSG-Bedingung dreiwertig aus (T-A9)', () => {
    const bf1 = (werte: Partial<Rahmen>) => katalog(rahmen(werte)).find((a) => a.herkunft.katalogId === 'N-BF-1')?.status ?? 'nicht angelegt'
    expect(bf1({ softwareart: 'shop', verbraucherverkauf: 'ja', kleinstunternehmen: 'nein' })).toBe('aktiv')
    expect(bf1({ softwareart: 'shop', verbraucherverkauf: 'ja', kleinstunternehmen: 'ja' })).toBe('nicht angelegt')
    expect(bf1({ softwareart: 'shop', verbraucherverkauf: 'ja', kleinstunternehmen: 'offen' })).toBe('vorschlag')
    expect(bf1({ softwareart: 'shop', verbraucherverkauf: 'nein', kleinstunternehmen: 'nein' })).toBe('nicht angelegt')
    expect(bf1({ softwareart: 'erp', verbraucherverkauf: 'ja', kleinstunternehmen: 'nein' })).toBe('nicht angelegt')
  })

  it('macht aus offenen Rahmenfragen Vorschläge mit Hinweis', () => {
    const k = katalog(rahmen({ betriebsform: 'offen', personenbezogen: 'offen' }))
    const ds1 = k.find((a) => a.herkunft.katalogId === 'N-DS-1')!
    expect(ds1.status).toBe('vorschlag')
    expect(ds1.begruendung).toBe('Katalog N-DS-1: gilt bei Daten über Personen und Betrieb beim Anbieter. Rahmenfrage klären: Daten über Personen und Betrieb beim Anbieter.')
    expect(katalog(rahmen({ betriebsform: 'eigener_server' })).some((a) => a.herkunft.katalogId === 'N-BT-3')).toBe(false)
  })

  it('schlägt Bausteine je Softwareart vor (T-A10)', () => {
    const erp = bausteine(rahmen({ softwareart: 'erp' }))
    expect(erp).toHaveLength(6)
    expect(erp.every((a) => a.status === 'vorschlag' && a.nummer === null)).toBe(true)
    expect(erp.find((a) => a.herkunft.katalogId === 'ERP-4')!.begruendung).toContain('Gesetzliche Pflichten und Fristen im Projekt prüfen.')
    expect(bausteine(rahmen({ softwareart: 'andere' }))).toHaveLength(0)
    expect(bausteine(rahmen({ softwareart: 'crm', personenbezogen: 'nein' })).map((a) => a.herkunft.katalogId)).toEqual(['CRM-1', 'CRM-2', 'CRM-3', 'CRM-5', 'CRM-6'])
    expect(bausteine(rahmen({ softwareart: 'dms', steuerrelevant: 'nein' }))).toHaveLength(4)
    expect(bausteine(rahmen({ softwareart: 'shop' })).find((a) => a.herkunft.katalogId === 'SHOP-1')!.text).toBe('Der Shop sollte Artikel mit Varianten, Bildern, Preisen und Bestand führen.')
  })

  it('ordnet die Gruppen fest und darin Modell, Katalog, Bausteine (A12)', () => {
    const p = lieferdienstAuswahl()
    const gruppen = p.anforderungen.map((a) => a.gruppe)
    const reihenfolge = ['funktion', 'schnittstelle', 'benutzer', 'menge', 'datenschutz', 'ordnung', 'betrieb', 'barrierefreiheit', 'anbieter']
    expect([...new Set(gruppen)]).toEqual(reihenfolge)
    expect(p.anforderungen.filter((a) => a.gruppe === 'funktion').map((a) => a.herkunft.art)).toEqual([...Array(8).fill('aufgabe'), 'entscheidung', ...Array(5).fill('baustein')])
    expect(p.anforderungen.filter((a) => a.gruppe === 'schnittstelle').map((a) => a.herkunft.art)).toEqual(['medienbruch', 'medienbruch', 'baustein'])
  })
})

describe('Ohne Prozessmodell (A11, T-A12)', () => {
  it('leitet nur Katalog und Bausteine ab', () => {
    const p = ohneProzessmodell(rahmenLProjekt(), JETZT).projekt
    expect(new Set(p.anforderungen.map((a) => a.herkunft.art))).toEqual(new Set(['katalog', 'baustein']))
    expect(p.anforderungen.filter((a) => a.status === 'aktiv').map((a) => a.nummer?.[0])).not.toContain('F')
    expect(p.anforderungen.some((a) => /^(F|S|R|M)-/.test(a.nummer ?? ''))).toBe(false)
    expect(p.anforderungen.filter((a) => a.status === 'aktiv')).toHaveLength(19)
  })

  it('verwirft Modell-Anforderungen, wenn das Modell entfernt wird', () => {
    const { projekt, vorschau } = ohneProzessmodell(lieferdienstAuswahl(), JETZT)
    expect(vorschau.entfallen).toBe(1 + 8 + 2 + 2 + 4)
    expect(nachNummer(projekt, 'F-01').status).toBe('verworfen')
    expect(standardUmfang(onlineProjekt(), 'erp').grundlage).toBe('ist')
  })
})
