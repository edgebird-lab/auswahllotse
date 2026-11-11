/**
 * Erstes Einlesen, „Neu einlesen“ und Abgleich nach Änderungen am Rahmen
 * (Spezifikation 6.14, dazu A11 ohne Prozessmodell).
 *
 * Abgeleitete Anforderungen werden neu berechnet und über ihre Kennung (A0)
 * mit den vorhandenen verbunden. Was der Benutzer bearbeitet hat (Text,
 * Priorität, Status), bleibt; Nummer, Punkte und Notiz bleiben immer.
 * Entfallene Anforderungen werden verworfen, ihre Bewertungen bleiben.
 * Eigene Anforderungen bleiben unverändert. Die Funktionen ändern nichts am
 * übergebenen Projekt; die Oberfläche zeigt erst die Vorschau und übernimmt
 * das Ergebnis nur auf Wunsch.
 */
import { datum } from '../modell/zahlformat'
import type { Anforderung, AuswahlProjekt, HerkunftArt, ProzessQuelle, Softwareart, Umfang } from '../modell/typen'
import type { PlProjekt } from '../prozessdatei/format'
import { aufgabenVon } from '../prozessdatei/struktur'
import { PUNKTE_STANDARD } from '../regeln/schwellen'
import { leiteAnforderungenAb } from './ableitung'
import { nummeriere } from './nummern'
import { ersetzeModalverb } from './texte'
import { alleMedien, standardStatus, standardUmfang } from './umfang'

export interface AbgleichVorschau {
  neu: number
  geaendert: number
  entfallen: number
}

export interface Abgleich {
  projekt: AuswahlProjekt
  vorschau: AbgleichVorschau
}

/** „{n} neu, {g} geändert, {e} entfallen“ */
export function vorschauText(v: AbgleichVorschau): string {
  return `${v.neu} neu, ${v.geaendert} geändert, ${v.entfallen} entfallen`
}

function notizEntfallen(art: HerkunftArt, jetzt: string): string {
  const tag = datum(jetzt)
  if (art === 'katalog') return `Bedingung im Rahmen trifft nicht mehr zu (Abgleich am ${tag}).`
  if (art === 'baustein') return `Baustein passt nicht mehr zu Softwareart oder Rahmen (Abgleich am ${tag}).`
  return `Quelle im Prozessmodell entfällt (Neu einlesen am ${tag}).`
}

/** Schritt 3 von 6.14: vorhandene Anforderung mit neu abgeleiteter verbinden. */
function verbinde(alt: Anforderung, neu: Anforderung): Anforderung {
  const prioritaet = alt.bearbeitet.prioritaet ? alt.prioritaet : neu.prioritaet
  return {
    ...alt,
    gruppe: neu.gruppe,
    titel: alt.bearbeitet.text ? alt.titel : neu.titel,
    text: alt.bearbeitet.text ? alt.text : ersetzeModalverb(neu.text, neu.prioritaet, prioritaet),
    abnahme: alt.bearbeitet.text ? alt.abnahme : neu.abnahme,
    prioritaet,
    prioritaetVorschlag: neu.prioritaetVorschlag,
    status: alt.bearbeitet.status ? alt.status : neu.status,
    herkunft: neu.herkunft,
    begruendung: neu.begruendung,
    quelle: neu.quelle,
    // Punkte bleiben; nur Standardpunkte folgen einer geänderten Priorität (A13)
    punkte: prioritaet !== alt.prioritaet && alt.punkte === PUNKTE_STANDARD[alt.prioritaet] ? PUNKTE_STANDARD[prioritaet] : alt.punkte,
  }
}

const SICHTBAR: (keyof Anforderung)[] = ['titel', 'text', 'abnahme', 'prioritaet', 'status']

/** Leitet neu ab und gleicht mit den vorhandenen Anforderungen ab. */
export function gleicheAb(projekt: AuswahlProjekt, jetzt: string): Abgleich {
  const abgeleitet = leiteAnforderungenAb(projekt)
  const vorhanden = new Map(projekt.anforderungen.map((a) => [a.id, a]))
  const naechste = { ...projekt.naechsteNummer }
  const vorschau: AbgleichVorschau = { neu: 0, geaendert: 0, entfallen: 0 }
  const ergebnis: Anforderung[] = []
  const neuIds = new Set<string>()

  for (const neu of abgeleitet) {
    neuIds.add(neu.id)
    const alt = vorhanden.get(neu.id)
    if (!alt) {
      vorschau.neu += 1
      ergebnis.push(nummeriere(neu, naechste))
      continue
    }
    const verbunden = verbinde(alt, neu)
    if (SICHTBAR.some((k) => verbunden[k] !== alt[k])) vorschau.geaendert += 1
    ergebnis.push(nummeriere(verbunden, naechste))
  }
  for (const alt of projekt.anforderungen) {
    if (neuIds.has(alt.id)) continue
    if (alt.herkunft.art === 'eigene' || alt.status === 'verworfen') {
      ergebnis.push(alt)
      continue
    }
    vorschau.entfallen += 1
    const hinweis = notizEntfallen(alt.herkunft.art, jetzt)
    ergebnis.push({ ...alt, status: 'verworfen', notiz: alt.notiz ? `${alt.notiz}\n${hinweis}` : hinweis })
  }
  return { projekt: { ...projekt, anforderungen: ergebnis, naechsteNummer: naechste }, vorschau }
}

/**
 * 6.14 Schritt 1: Status bekannter Systeme bleibt, neue Systeme bekommen den
 * Standard nach U1, entfallene fallen weg; Ein- und Ausschlüsse behalten nur
 * vorhandene Aufgaben.
 */
export function passeUmfangAn(alt: Umfang | null, pl: PlProjekt, softwareart: Softwareart): Umfang {
  if (!alt) return standardUmfang(pl, softwareart)
  const grundlage = alt.grundlage === 'soll' && pl.soll ? 'soll' : 'ist'
  const medien = Object.fromEntries(
    alleMedien(pl, grundlage).map((m) => [m.id, Object.hasOwn(alt.medien, m.id) ? alt.medien[m.id] : standardStatus(m.art, softwareart)]),
  )
  const aufgaben = new Set([...aufgabenVon(pl.ist), ...(pl.soll ? aufgabenVon(pl.soll) : [])].map((a) => a.id))
  return {
    grundlage,
    medien,
    aufgabenAus: alt.aufgabenAus.filter((id) => aufgaben.has(id)),
    aufgabenEin: alt.aufgabenEin.filter((id) => aufgaben.has(id)),
  }
}

/** Prozessmodell (erstmals oder neu) übernehmen: Umfang anpassen, dann abgleichen. */
export function liesProzessEin(projekt: AuswahlProjekt, quelle: ProzessQuelle, jetzt: string): Abgleich {
  const umfang = passeUmfangAn(projekt.prozess ? projekt.umfang : null, quelle.projekt, projekt.rahmen.softwareart)
  return gleicheAb({ ...projekt, prozess: quelle, umfang }, jetzt)
}

/** A11: ohne Prozessmodell nur Katalog, Bausteine und eigene Anforderungen. */
export function ohneProzessmodell(projekt: AuswahlProjekt, jetzt: string): Abgleich {
  return gleicheAb({ ...projekt, prozess: null, umfang: null }, jetzt)
}
