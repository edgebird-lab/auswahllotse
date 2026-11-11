/**
 * Beispiel ABC der Spezifikation (9.1): Gewichte Funktionen 50 %, Betrieb
 * 30 %, Anbieter 20 %; Anforderungen F-01 (Soll, 2 Punkte), F-02 (Kann, 1),
 * F-03 (Muss), B-01 (Soll, 2), A-01 (Soll, 2); drei Angebote. Gespeichert
 * als testdaten/bewertung-abc.auswahllotse (ein Test hält beide gleich).
 */
import type { KostenErgebnis } from '../modell/ergebnisse'
import { neueKosten, neuesProjekt } from '../modell/projekt'
import type { Anforderung, Angebot, AuswahlProjekt, Bewertung, Gruppe, Prioritaet } from '../modell/typen'
import { PUNKTE_STANDARD } from '../regeln/schwellen'

export const ABC_JETZT = '2026-11-11T10:00:00.000Z'

function anforderung(nummer: string, gruppe: Gruppe, prioritaet: Prioritaet, titel: string, text: string): Anforderung {
  return {
    id: `eigene:${nummer.toLowerCase()}`,
    nummer,
    gruppe,
    titel,
    text,
    abnahme: 'Vorführung mit Beispieldaten des Betriebs.',
    prioritaet,
    prioritaetVorschlag: prioritaet,
    status: 'aktiv',
    herkunft: { art: 'eigene', bezuege: [], katalogId: null },
    begruendung: 'Eigene Anforderung.',
    quelle: null,
    punkte: PUNKTE_STANDARD[prioritaet],
    bearbeitet: { text: true, prioritaet: false, status: false },
    notiz: '',
  }
}

const ko = (ko: Bewertung['ko']): Bewertung => ({ ko, punkte: null, fundstelle: '', notiz: '' })
const punkte = (p: number): Bewertung => ({ ko: null, punkte: p, fundstelle: '', notiz: '' })

function angebot(buchstabe: string, f03: Bewertung['ko'], f01: number, f02: number, b01: number, a01: number): Angebot {
  return {
    id: `angebot-${buchstabe.toLowerCase()}`,
    anbieter: `Anbieter ${buchstabe}`,
    produkt: `Produkt ${buchstabe}`,
    betriebsform: 'cloud',
    angebotsdatum: '2026-11-10',
    notiz: '',
    bewertungen: { 'eigene:f-03': ko(f03), 'eigene:f-01': punkte(f01), 'eigene:f-02': punkte(f02), 'eigene:b-01': punkte(b01), 'eigene:a-01': punkte(a01) },
    kosten: neueKosten(),
  }
}

export function abcProjekt(): AuswahlProjekt {
  const p = neuesProjekt(ABC_JETZT)
  p.id = 'beispiel-abc'
  p.rahmen.vorhaben = 'Beispiel ABC'
  p.rahmen.betrieb = 'Musterbetrieb'
  p.anforderungen = [
    anforderung('F-01', 'funktion', 'soll', 'Aufträge erfassen', 'Die Software sollte Aufträge mit allen Positionen erfassen.'),
    anforderung('F-02', 'funktion', 'kann', 'Auswertungen drucken', 'Die Software kann Auswertungen drucken.'),
    anforderung('F-03', 'funktion', 'muss', 'Rechnungen erzeugen', 'Die Software muss aus Aufträgen Rechnungen erzeugen.'),
    anforderung('B-01', 'betrieb', 'soll', 'Support', 'Der Anbieter sollte Support auf Deutsch bieten.'),
    anforderung('A-01', 'anbieter', 'soll', 'Referenzen', 'Der Anbieter sollte zwei Referenzbetriebe nennen.'),
  ]
  p.naechsteNummer = { funktion: 4, betrieb: 2, anbieter: 2 }
  p.gewichtung = { methode: 'direkt', direktProzent: { funktion: 50, betrieb: 30, anbieter: 20 }, paare: [], festgelegtAm: ABC_JETZT, aenderungenNachBewertung: 0 }

  const a = angebot('A', 'erfuellt', 8, 5, 6, 10)
  // Kosten wie T-K1
  a.kosten = {
    einmalig: [
      { id: 'a-einrichtung', art: 'einrichtung', bezeichnung: 'Einrichtung', betragEuro: 6000 },
      { id: 'a-daten', art: 'datenuebernahme', bezeichnung: 'Datenübernahme', betragEuro: 2000 },
      { id: 'a-schulung', art: 'schulung', bezeichnung: 'Schulung', betragEuro: 1500 },
    ],
    laufendJahr: [{ id: 'a-support', art: 'support', bezeichnung: 'Support', betragEuro: 600 }],
    preisJeBenutzerMonatEuro: 39,
    internEinfuehrungTage: 10,
    internSchulungStundenJeBenutzer: 4,
    internBetriebStundenMonat: 2,
  }
  const b = angebot('B', 'erfuellt', 10, 10, 4, 5)
  b.kosten = { ...neueKosten(), einmalig: [{ id: 'b-einmalig', art: 'einrichtung', bezeichnung: 'Einführung', betragEuro: 8000 }], laufendJahr: [{ id: 'b-abo', art: 'abo', bezeichnung: 'Abo', betragEuro: 4600 }] }
  const c = angebot('C', 'nicht_erfuellt', 10, 10, 10, 10)
  c.kosten = { ...neueKosten(), einmalig: [{ id: 'c-einmalig', art: 'einrichtung', bezeichnung: 'Einführung', betragEuro: 5000 }], laufendJahr: [{ id: 'c-abo', art: 'abo', bezeichnung: 'Abo', betragEuro: 3000 }] }
  p.angebote = [a, b, c]
  p.bewertungBegonnenAm = ABC_JETZT
  p.wirtschaftlichkeit = { ...p.wirtschaftlichkeit, jahre: 5, benutzer: 7, internerStundensatzEuro: 45, stundenProPersonentag: 8 }
  return p
}

/** Gesamtkosten über 5 Jahre, von Hand nach K1 bis K4 (bis kosten.ts in Phase 5 sie rechnet). */
function nominal(einmalig: number, laufendJahr: number): KostenErgebnis {
  return { einmalig, laufend: Array(5).fill(laufendJahr), tco: einmalig + 5 * laufendJahr, barwert: null, kapitalwert: null, amortisationJahr: null }
}

/**
 * A: E = 6.000 + 2.000 + 1.500 + 10 · 8 · 45 + 4 · 7 · 45 = 14.360 €;
 * L = 600 + 39 · 7 · 12 + 2 · 12 · 45 = 4.956 €; TCO = 14.360 + 5 · 4.956 = 39.140 €.
 * B: 8.000 + 5 · 4.600 = 31.000 €. C: 5.000 + 5 · 3.000 = 20.000 €.
 */
export function abcKosten(): Map<string, KostenErgebnis> {
  return new Map([
    ['angebot-a', nominal(14360, 4956)],
    ['angebot-b', nominal(8000, 4600)],
    ['angebot-c', nominal(5000, 3000)],
  ])
}
