/**
 * Angebote anlegen, ändern und löschen, Kostenpositionen und Annahmen der
 * Kostenrechnung (Spezifikation 5.6). Jede Funktion gibt ein neues Projekt
 * zurück; ohne Wirkung bleibt das alte Objekt erhalten.
 */
import { neueId, neuesAngebot } from '../modell/projekt'
import type { Anforderung, Angebot, AuswahlProjekt, EinmaligArt, Id, Kosten, Kostenposition, LaufendArt, Wirtschaftlichkeit } from '../modell/typen'
import { istBewertet, istKo } from './gewichte'

export type Kostenliste = 'einmalig' | 'laufendJahr'

export function fuegeAngebotHinzu(p: AuswahlProjekt, werte: Partial<Omit<Angebot, 'id' | 'bewertungen' | 'kosten'>> = {}): { projekt: AuswahlProjekt; id: Id } {
  const a = { ...neuesAngebot(), ...werte }
  return { projekt: { ...p, angebote: [...p.angebote, a] }, id: a.id }
}

function aendereAngebot(p: AuswahlProjekt, id: Id, aendern: (a: Angebot) => Angebot): AuswahlProjekt {
  const index = p.angebote.findIndex((a) => a.id === id)
  if (index < 0) return p
  const neu = aendern(p.angebote[index])
  if (neu === p.angebote[index]) return p
  const angebote = [...p.angebote]
  angebote[index] = neu
  return { ...p, angebote }
}

/** Anbieter, Produkt, Betriebsform, Angebotsdatum oder Notiz ändern. */
export function setzeAngebot(p: AuswahlProjekt, id: Id, teil: Partial<Pick<Angebot, 'anbieter' | 'produkt' | 'betriebsform' | 'angebotsdatum' | 'notiz'>>): AuswahlProjekt {
  return aendereAngebot(p, id, (a) => ((Object.keys(teil) as (keyof typeof teil)[]).every((k) => a[k] === teil[k]) ? a : { ...a, ...teil }))
}

/** Löscht ein Angebot; eine Wahl, die darauf zeigte, fällt zurück auf die Empfehlung. */
export function loescheAngebot(p: AuswahlProjekt, id: Id): AuswahlProjekt {
  if (!p.angebote.some((a) => a.id === id)) return p
  const entscheidung = p.entscheidung.gewaehltId === id ? { ...p.entscheidung, gewaehltId: null } : p.entscheidung
  return { ...p, angebote: p.angebote.filter((a) => a.id !== id), entscheidung }
}

/** Preis je Benutzer und interne Aufwände. */
export function setzeKostenwert(
  p: AuswahlProjekt,
  id: Id,
  feld: 'preisJeBenutzerMonatEuro' | 'internEinfuehrungTage' | 'internSchulungStundenJeBenutzer' | 'internBetriebStundenMonat',
  wert: number,
): AuswahlProjekt {
  return aendereAngebot(p, id, (a) => (a.kosten[feld] === wert ? a : { ...a, kosten: { ...a.kosten, [feld]: wert } }))
}

export function neueKostenposition(p: AuswahlProjekt, id: Id, liste: Kostenliste): { projekt: AuswahlProjekt; positionId: Id } {
  const positionId = neueId()
  const projekt = aendereAngebot(p, id, (a) => {
    const kosten: Kosten =
      liste === 'einmalig'
        ? { ...a.kosten, einmalig: [...a.kosten.einmalig, { id: positionId, art: 'einrichtung', bezeichnung: '', betragEuro: 0 }] }
        : { ...a.kosten, laufendJahr: [...a.kosten.laufendJahr, { id: positionId, art: 'abo', bezeichnung: '', betragEuro: 0 }] }
    return { ...a, kosten }
  })
  return { projekt, positionId }
}

export function setzeKostenposition(
  p: AuswahlProjekt,
  id: Id,
  liste: Kostenliste,
  positionId: Id,
  teil: Partial<Pick<Kostenposition<EinmaligArt | LaufendArt>, 'art' | 'bezeichnung' | 'betragEuro'>>,
): AuswahlProjekt {
  return aendereAngebot(p, id, (a) => {
    const positionen: Kostenposition<string>[] = a.kosten[liste]
    const alt = positionen.find((x) => x.id === positionId)
    if (!alt || (Object.keys(teil) as (keyof typeof teil)[]).every((k) => alt[k] === teil[k])) return a
    const neu = positionen.map((x) => (x.id === positionId ? { ...x, ...teil } : x))
    return { ...a, kosten: { ...a.kosten, [liste]: neu } }
  })
}

export function loescheKostenposition(p: AuswahlProjekt, id: Id, liste: Kostenliste, positionId: Id): AuswahlProjekt {
  return aendereAngebot(p, id, (a) => {
    const positionen: Kostenposition<string>[] = a.kosten[liste]
    if (!positionen.some((x) => x.id === positionId)) return a
    return { ...a, kosten: { ...a.kosten, [liste]: positionen.filter((x) => x.id !== positionId) } }
  })
}

/** Annahmen der Kostenrechnung für alle Angebote (Budget über `setzeBudget`, weil es G5 zählt). */
export function setzeWirtschaftlichkeit(p: AuswahlProjekt, teil: Partial<Omit<Wirtschaftlichkeit, 'budgetEuro' | 'budgetAlsKo'>>): AuswahlProjekt {
  const w = p.wirtschaftlichkeit
  if ((Object.keys(teil) as (keyof typeof teil)[]).every((k) => w[k] === teil[k])) return p
  return { ...p, wirtschaftlichkeit: { ...w, ...teil } }
}

/** Zeilen der Bewertung: aktive Muss-, Soll- und Kann-Anforderungen in Projektreihenfolge. */
export function bewertungsZeilen(anforderungen: readonly Anforderung[]): Anforderung[] {
  return anforderungen.filter((a) => istKo(a) || istBewertet(a))
}

/** „27 von 35 bewertet“: Muss mit „erfüllt“ oder „nicht erfüllt“, Soll und Kann mit Punkten. */
export function bewertungsFortschritt(anforderungen: readonly Anforderung[], angebot: Angebot): { bewertet: number; gesamt: number } {
  const zeilen = bewertungsZeilen(anforderungen)
  const bewertet = zeilen.filter((a) => {
    const b = angebot.bewertungen[a.id]
    if (!b) return false
    return istKo(a) ? b.ko === 'erfuellt' || b.ko === 'nicht_erfuellt' : b.punkte !== null
  }).length
  return { bewertet, gesamt: zeilen.length }
}
