/**
 * Erzeugt das Fallbeispiel „Lieferdienst sucht Warenwirtschaft“ (Spezifikation
 * 5.4, 9.3) aus der Testdatei des Prozesslotsen. Die drei Angebote sind
 * erfunden. Das Ergebnis liegt als testdaten/beispiel-lieferdienst.auswahllotse
 * im Repo; fallbeispiel.test.ts hält Datei und Erzeuger gleich und schreibt
 * die Datei neu, wenn SCHREIBE_TESTDATEN=1 gesetzt ist.
 */
import lieferdienstText from '../../testdaten/prozesslotse/lieferdienst.prozesslotse?raw'
import { legeFest, setzeDirektAlle } from '../bewertung/operationen'
import { liesProzessEin } from '../lastenheft/abgleich'
import { setzeNotiz, setzePrioritaet, setzePunkte, uebernimmAlleVorschlaege, verwirf } from '../lastenheft/operationen'
import { neuesProjekt } from '../modell/projekt'
import type { Angebot, AuswahlProjekt, Bewertung, Id, Kosten } from '../modell/typen'
import { leseProzessdatei } from '../prozessdatei/einlesen'
import { standardsAusModell } from '../kosten/vorschlaege'

const ANGELEGT = '2026-10-15T09:00:00.000Z'
const EINGELESEN = '2026-10-15T09:05:00.000Z'
const FESTGELEGT = '2026-10-20T14:00:00.000Z'
const BEWERTUNG_BEGONNEN = '2026-11-04T10:00:00.000Z'
const GEAENDERT = '2026-11-10T16:00:00.000Z'

/** Muss-Anforderungen des Beispiels (K.-o.), nach dem Übernehmen der Bausteine. */
const MUSS: readonly Id[] = [
  'aufgabe:auf_erfassen',
  'aufgabe:auf_tour',
  'aufgabe:auf_bestaetigen',
  'aufgabe:auf_rechnung',
  'aufgabe:auf_freigeben',
  'aufgabe:auf_versenden',
  'baustein:ERP-3',
  'medienbruch:med_papier>med_erp',
  'medienbruch:med_erp>med_excel',
  'rollen',
  'freigabe:auf_freigeben',
  'menge:vorgaenge',
  'menge:benutzer',
  'katalog:N-DS-1',
  'katalog:N-DS-2',
  'katalog:N-DS-3',
  'katalog:N-DS-5',
  'katalog:N-DS-6',
  'katalog:N-GB-1',
  'katalog:N-GB-2',
  'katalog:N-GB-3',
  'katalog:N-BT-1',
  'katalog:N-BT-2',
]

/** Soll- und Kann-Anforderungen in fester Reihenfolge; die Punkte der Angebote stehen in derselben Reihenfolge. */
const BEWERTET: readonly Id[] = [
  'aufgabe:auf_aendern',
  'aufgabe:auf_stornieren',
  'baustein:ERP-1',
  'baustein:ERP-2',
  'baustein:ERP-4',
  'baustein:ERP-6',
  'baustein:ERP-5',
  'menge:antwortzeit',
  'menge:datenbestand',
  'katalog:N-DS-4',
  'katalog:N-SI-1',
  'katalog:N-GB-4',
  'katalog:N-BT-3',
  'katalog:N-BT-4',
  'katalog:N-BT-5',
  'katalog:N-BF-2',
  'katalog:N-AN-1',
  'katalog:N-AN-2',
  'katalog:N-AN-3',
]

interface Vorgabe {
  id: Id
  anbieter: string
  produkt: string
  betriebsform: Angebot['betriebsform']
  angebotsdatum: string
  notiz: string
  /** Punkte in der Reihenfolge von BEWERTET */
  punkte: number[]
  nichtErfuellt: Id[]
  /** Fundstellen und Notizen zu einzelnen Zeilen */
  extra: Record<Id, Partial<Bewertung>>
  kosten: Kosten
}

const VORGABEN: Vorgabe[] = [
  {
    id: 'angebot-nord',
    anbieter: 'Anbieter Nord',
    produkt: 'Warenwirtschaft Nord',
    betriebsform: 'cloud',
    angebotsdatum: '2026-10-28',
    notiz: 'Cloud-Lösung mit Abo je Benutzer; Vorführung am 04.11. mit eigenen Daten.',
    punkte: [8, 8, 8, 8, 10, 5, 10, 8, 8, 8, 10, 8, 8, 10, 8, 5, 10, 10, 8],
    nichtErfuellt: [],
    extra: {
      'aufgabe:auf_tour': { fundstelle: 'Vorführung 04.11.', notiz: 'Tourenliste direkt aus den Aufträgen.' },
      'katalog:N-GB-3': { fundstelle: 'Angebot S. 6' },
      'baustein:ERP-5': { fundstelle: 'Angebot S. 5', notiz: 'DATEV-Export im Standard.' },
    },
    kosten: {
      einmalig: [
        { id: 'nord-einrichtung', art: 'einrichtung', bezeichnung: 'Einrichtung', betragEuro: 4800 },
        { id: 'nord-daten', art: 'datenuebernahme', bezeichnung: 'Datenübernahme', betragEuro: 2500 },
        { id: 'nord-schulung', art: 'schulung', bezeichnung: 'Schulung vor Ort', betragEuro: 1800 },
      ],
      laufendJahr: [{ id: 'nord-support', art: 'support', bezeichnung: 'Support-Paket', betragEuro: 1200 }],
      preisJeBenutzerMonatEuro: 59,
      internEinfuehrungTage: 15,
      internSchulungStundenJeBenutzer: 6,
      internBetriebStundenMonat: 2,
    },
  },
  {
    id: 'angebot-sued',
    anbieter: 'Anbieter Süd',
    produkt: 'ERP Süd Start',
    betriebsform: 'cloud',
    angebotsdatum: '2026-10-30',
    notiz: 'Günstiges Einstiegspaket.',
    punkte: [5, 5, 8, 5, 3, 3, 5, 5, 5, 5, 5, 3, 8, 8, 8, 3, 5, 5, 10],
    nichtErfuellt: ['katalog:N-GB-3'],
    extra: {
      'katalog:N-GB-3': { fundstelle: 'Antwort per E-Mail 05.11.', notiz: 'Kein Prüferzugang; Export nur als PDF.' },
    },
    kosten: {
      einmalig: [{ id: 'sued-einrichtung', art: 'einrichtung', bezeichnung: 'Einrichtung', betragEuro: 2000 }],
      laufendJahr: [],
      preisJeBenutzerMonatEuro: 45,
      internEinfuehrungTage: 10,
      internSchulungStundenJeBenutzer: 4,
      internBetriebStundenMonat: 3,
    },
  },
  {
    id: 'angebot-west',
    anbieter: 'Anbieter West',
    produkt: 'West Komplett',
    betriebsform: 'eigener_server',
    angebotsdatum: '2026-11-03',
    notiz: 'Kauflizenz auf eigenem Server, Wartung 20 % der Lizenz im Jahr.',
    punkte: [10, 10, 10, 10, 8, 10, 8, 10, 10, 10, 5, 10, 5, 5, 5, 3, 5, 8, 3],
    nichtErfuellt: [],
    extra: {
      'katalog:N-BT-3': { notiz: 'Verfügbarkeit hängt am eigenen Server.' },
    },
    kosten: {
      einmalig: [
        { id: 'west-lizenz', art: 'lizenzkauf', bezeichnung: 'Lizenzen für 7 Benutzer', betragEuro: 21000 },
        { id: 'west-einrichtung', art: 'einrichtung', bezeichnung: 'Einrichtung', betragEuro: 6500 },
        { id: 'west-daten', art: 'datenuebernahme', bezeichnung: 'Datenübernahme', betragEuro: 3000 },
        { id: 'west-schulung', art: 'schulung', bezeichnung: 'Schulung', betragEuro: 2400 },
        { id: 'west-server', art: 'hardware', bezeichnung: 'Server mit Sicherung', betragEuro: 4200 },
      ],
      laufendJahr: [{ id: 'west-wartung', art: 'wartung', bezeichnung: 'Wartung', betragEuro: 4200 }],
      preisJeBenutzerMonatEuro: 0,
      internEinfuehrungTage: 25,
      internSchulungStundenJeBenutzer: 8,
      internBetriebStundenMonat: 8,
    },
  },
]

function angebot(v: Vorgabe): Angebot {
  const leer = (): Bewertung => ({ ko: null, punkte: null, fundstelle: '', notiz: '' })
  const bewertungen: Record<Id, Bewertung> = {}
  for (const id of MUSS) bewertungen[id] = { ...leer(), ko: v.nichtErfuellt.includes(id) ? 'nicht_erfuellt' : 'erfuellt', ...v.extra[id] }
  BEWERTET.forEach((id, i) => {
    bewertungen[id] = { ...leer(), punkte: v.punkte[i], ...v.extra[id] }
  })
  return { id: v.id, anbieter: v.anbieter, produkt: v.produkt, betriebsform: v.betriebsform, angebotsdatum: v.angebotsdatum, notiz: v.notiz, bewertungen, kosten: v.kosten }
}

export async function baueFallbeispiel(): Promise<AuswahlProjekt> {
  let p = neuesProjekt(ANGELEGT)
  p.id = 'beispiel-lieferdienst'
  p.rahmen = {
    ...p.rahmen,
    vorhaben: 'Neue Warenwirtschaft',
    betrieb: 'Lieferdienst Beispiel GmbH',
    ersteller: 'Muster-Beratung',
    betriebsform: 'cloud',
    kleinstunternehmen: 'nein',
  }
  const { quelle } = await leseProzessdatei('lieferdienst.prozesslotse', lieferdienstText, EINGELESEN)
  p = standardsAusModell(liesProzessEin(p, quelle, EINGELESEN).projekt)

  // Vorschläge entscheiden: Die Entscheidung „Ware vorrätig?“ deckt schon die Bestandsführung ab
  p = setzeNotiz(verwirf(p, 'entscheidung:ent_vorrat'), 'entscheidung:ent_vorrat', 'Den Bestand zeigt schon die Bestandsführung (Baustein ERP-2).')
  p = uebernimmAlleVorschlaege(p, 'funktion')
  p = uebernimmAlleVorschlaege(p, 'schnittstelle')
  p = uebernimmAlleVorschlaege(p, 'barrierefreiheit')
  // Belegkette ist für den Betrieb unverzichtbar; Stammdaten zählen mehr als die übrigen Funktionen
  p = setzePrioritaet(p, 'baustein:ERP-3', 'muss')
  p = setzeNotiz(p, 'baustein:ERP-3', 'Heute wird jede Rechnung aus dem Auftrag abgetippt.')
  p = setzePunkte(p, 'baustein:ERP-1', 3)

  p = setzeDirektAlle(p, { funktion: 35, schnittstelle: 10, menge: 5, datenschutz: 10, ordnung: 5, betrieb: 15, barrierefreiheit: 5, anbieter: 15 })
  p = legeFest(p, FESTGELEGT)

  p.angebote = VORGABEN.map(angebot)
  p.bewertungBegonnenAm = BEWERTUNG_BEGONNEN
  p.wirtschaftlichkeit = { ...p.wirtschaftlichkeit, preissteigerungProzent: 3, zinsProzent: 5, nutzenProJahrEuro: 40000, budgetEuro: 80000, budgetAlsKo: false }
  p.entscheidung = {
    ...p.entscheidung,
    risiken: [
      { id: 'risiko-datenuebernahme', text: 'Die Datenübernahme aus der alten Warenwirtschaft dauert länger als geplant.', massnahme: 'Probeübernahme mit echten Daten vor Vertragsschluss.' },
      { id: 'risiko-doppelarbeit', text: 'Der Innendienst arbeitet in der Einführung doppelt (alt und neu).', massnahme: 'Stichtag festlegen und zwei Wochen vorher schulen.' },
    ],
  }
  p.geaendertAm = GEAENDERT
  return p
}

export { BEWERTET as FALLBEISPIEL_BEWERTET, MUSS as FALLBEISPIEL_MUSS }
