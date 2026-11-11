import { describe, expect, it } from 'vitest'
import { beispielProjekt } from '../beispiel/beispiel'
import { berechneGesamt } from '../entscheidung/gesamt'
import { normalisiereLeerraum } from '../modell/zahlformat'
import { liesProzessEin } from '../lastenheft/abgleich'
import { abcProjekt } from '../testhilfen/abc'
import { aufgabe, projekt, prozess } from '../testhilfen/bausteine'
import { JETZT, lieferdienstAuswahl, quelleAus, rahmenLProjekt } from '../testhilfen/projekte'
import { arbeitszeitkostenProJahr, ausgangslagePunkte, ausgangslageText, druckTitel, vorgehenPunkte } from './vorlagen'

const n = normalisiereLeerraum

describe('Texte der Vorlagen (5.8)', () => {
  it('beschreibt die Ausgangslage des Lastenhefts', () => {
    // T-M3: 354,24 Übertragungen und 594,24 Minuten pro Tag → 354 Datensätze, 9,9 Stunden
    expect(ausgangslageText(lieferdienstAuswahl())).toBe(
      'Lieferdienst Nord sucht ein ERP-System für den Prozess „Bestellung bis Rechnung (Lieferdienst)“. Heute laufen 120 Vorgänge pro Tag. Dabei werden täglich 354 Datensätze von Hand übertragen (9,9 Stunden).',
    )
    const ohne = rahmenLProjekt()
    ohne.rahmen.betrieb = ''
    ohne.rahmen.softwareart = 'dms'
    expect(ausgangslageText(ohne)).toBe('Der Betrieb sucht ein Dokumentenmanagementsystem.')
  })

  it('schreibt bei einem einzigen Vorgang und Datensatz in der Einzahl', () => {
    // Kleinbetrieb: 1 Auftrag am Tag, 60 Minuten Abtippen vom Zettel ins Altsystem
    const pl = projekt(
      prozess([aufgabe('auf_erfassen', { name: 'Auftrag erfassen', rolleId: 'rol_buero', mediumId: 'med_alt', bearbeitungMin: 60, uebertragung: { quelleMediumId: 'med_zettel', minuten: 60 } })], {
        vorgaengeProTag: 1,
        rollen: [{ id: 'rol_buero', name: 'Büro', stundensatz: 40, personen: 1, verfuegbarProzent: 100 }],
        medien: [
          { id: 'med_alt', name: 'Altsystem', art: 'erp' },
          { id: 'med_zettel', name: 'Zettel', art: 'papier' },
        ],
      }),
    )
    const p = liesProzessEin(rahmenLProjekt(), quelleAus(pl), JETZT).projekt
    expect(ausgangslageText(p)).toBe(
      'Lieferdienst Nord sucht ein ERP-System für den Prozess „Testprozess“. Heute läuft 1 Vorgang pro Tag. Dabei wird täglich 1 Datensatz von Hand übertragen (1 Stunde).',
    )
    expect(ausgangslagePunkte(p).map(n).slice(0, 2)).toEqual([
      'Prozess „Testprozess“ (Ist-Prozess als Grundlage), 1 Vorgang pro Tag.',
      'Medienbrüche: 1 Übertragung von Hand pro Tag, zusammen 1 Stunde.',
    ])
    const anf = (id: string) => p.anforderungen.find((a) => a.id === id)!
    expect(anf('menge:vorgaenge').text).toBe('Die Software muss 1 Vorgang pro Tag im Mittel und 2 an starken Tagen verarbeiten (250 pro Jahr).')
    expect(n(anf('medienbruch:med_zettel>med_alt').begruendung)).toBe('Heute 1 Übertragung und 60 Minuten pro Tag (40 € pro Tag).')
  })

  it('nennt die Arbeitszeitkosten des Prozesses pro Jahr (M5)', () => {
    // T-M2: 28,49152 € je Vorgang · 120 · 250 = 854.745,60 €
    expect(arbeitszeitkostenProJahr(lieferdienstAuswahl())!.ist).toBeCloseTo(854745.6, 6)
    expect(arbeitszeitkostenProJahr(lieferdienstAuswahl())!.soll).toBeNull()
    expect(arbeitszeitkostenProJahr(rahmenLProjekt())).toBeNull()
    expect(ausgangslagePunkte(lieferdienstAuswahl()).map(n)).toEqual([
      'Prozess „Bestellung bis Rechnung (Lieferdienst)“ (Ist-Prozess als Grundlage), 120 Vorgänge pro Tag.',
      'Medienbrüche: 354 Übertragungen von Hand pro Tag, zusammen 9,9 Stunden.',
      'Arbeitszeitkosten des Prozesses: 854.746 € pro Jahr im Ist.',
    ])
  })

  it('beschreibt das Vorgehen mit Gewichten, Regel und Änderungen', () => {
    const p = beispielProjekt()
    expect(vorgehenPunkte(p, berechneGesamt(p)).map(n)).toEqual([
      'Muss-Anforderungen sind K.-o.-Kriterien: Ein Angebot, das eine davon nicht erfüllt, scheidet aus (23 Muss-Kriterien).',
      'Gewichte direkt vergeben: Funktionen 35,0 %, Schnittstellen und Datenfluss 10,0 %, Mengen und Leistung 5,0 %, Datenschutz und Sicherheit 10,0 %, Ordnungsmäßigkeit (AO, GoBD) 5,0 %, Betrieb und Support 15,0 %, Barrierefreiheit 5,0 %, Anbieter und Einführung 15,0 %.',
      'Punkteskala je Soll- und Kann-Anforderung von 0 bis 10: 0 nicht, 3 ansatzweise, 5 teilweise oder mit Anpassung, 8 weitgehend im Standard, 10 vollständig im Standard.',
      'Entscheidungsregel: höchster Nutzwert. Budget 80.000 € als Richtwert.',
      'Gewichte und Regel festgelegt am 20.10.2026.',
      'Nach Beginn der Bewertung am 04.11.2026 wurden Gewichte und Regel nicht geändert.',
    ])
  })

  it('nennt beim Paarvergleich die Konsistenz', () => {
    const p = abcProjekt()
    p.gewichtung = {
      ...p.gewichtung,
      methode: 'paarvergleich',
      paare: [
        { a: 'funktion', b: 'betrieb', wichtiger: 'a', staerke: 2 },
        { a: 'funktion', b: 'anbieter', wichtiger: 'a', staerke: 4 },
        { a: 'betrieb', b: 'anbieter', wichtiger: 'a', staerke: 2 },
      ],
      aenderungenNachBewertung: 1,
    }
    p.entscheidung = { ...p.entscheidung, regel: 'preis_leistung', mindestNutzwert: 6.5 }
    const punkte = vorgehenPunkte(p, berechneGesamt(p)).map(n)
    // T-AHP1: w = (4/7, 2/7, 1/7), CR 0
    expect(punkte[1]).toBe('Gewichte per Paarvergleich (AHP, Eigenvektorverfahren): Funktionen 57,1 %, Betrieb und Support 28,6 %, Anbieter und Einführung 14,3 %. Konsistenz CR 0,00 (stimmig, Grenze 0,10).')
    expect(punkte[3]).toBe('Entscheidungsregel: bestes Preis-Leistungs-Verhältnis (Mindestnutzwert 6,5).')
    expect(punkte[5]).toBe('Nach Beginn der Bewertung am 11.11.2026 wurden Gewichte, Punkte oder Regel 1-mal geändert.')
  })

  it('bildet den Titel für Druck und PDF', () => {
    expect(druckTitel(beispielProjekt(), 'Lastenheft')).toBe('Neue Warenwirtschaft – Lastenheft')
    const p = rahmenLProjekt()
    p.rahmen.vorhaben = ''
    expect(druckTitel(p, 'Entscheidungsvorlage')).toBe('Auswahl-Lotse – Entscheidungsvorlage')
  })
})
