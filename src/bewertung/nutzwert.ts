/**
 * K.-o.-Prüfung und Nutzwertanalyse (Spezifikation 6.9, Regeln N1 bis N4,
 * N6 und N7; Rang N5 in entscheidung/regel.ts).
 *
 * Muss-Anforderungen sind nur Voraussetzung (K.-o.): Ein „nicht erfüllt“
 * macht das Angebot ungültig. Den Nutzwert tragen die Soll- und
 * Kann-Anforderungen: Gruppenwert S_g = Σ vᵢ · eᵢ / Σ vᵢ (v = Punkte der
 * Anforderung, e = Erfüllung 0 bis 10), Nutzwert N = Σ W_g · S_g.
 */
import type { AngebotsErgebnis, Befund, KostenErgebnis } from '../modell/ergebnisse'
import { euro } from '../modell/zahlformat'
import type { Anforderung, Angebot, Gruppe, Id, Wirtschaftlichkeit } from '../modell/typen'
import { istBewertet, istKo } from './gewichte'

export interface NutzwertEingabe {
  anforderungen: readonly Anforderung[]
  angebote: readonly Angebot[]
  gewichte: Partial<Record<Gruppe, number>>
  /** Kosten je Angebot (Phase 5, kosten.ts); fehlt ein Eintrag, gelten 0 € */
  kosten: ReadonlyMap<Id, KostenErgebnis>
  wirtschaftlichkeit: Pick<Wirtschaftlichkeit, 'kostenbasis' | 'budgetEuro' | 'budgetAlsKo'>
}

export const KEINE_KOSTEN: KostenErgebnis = { einmalig: 0, laufend: [], tco: 0, barwert: null, kapitalwert: null, amortisationJahr: null }

/** K8: Kostenbasis nominal = Gesamtkosten, barwert = Barwert (null, wenn der Zins fehlt). */
export function kostenbasisVon(k: KostenErgebnis, basis: 'nominal' | 'barwert'): number | null {
  return basis === 'nominal' ? k.tco : k.barwert
}

/** Bezeichnung einer Anforderung in Meldungen: Nummer, sonst Titel. */
export const kurzname = (a: Anforderung) => a.nummer ?? `„${a.titel}“`

export const angebotsname = (a: Angebot) => a.anbieter || a.produkt || 'Angebot ohne Namen'

/** N1 bis N4, N6, N7 je Angebot; `rang` bleibt null (vergibt regel.ts). */
export function bewerteAngebote(e: NutzwertEingabe): { ergebnisse: AngebotsErgebnis[]; befunde: Befund[] } {
  const befunde: Befund[] = []
  const ko = e.anforderungen.filter(istKo)
  const bewertet = e.anforderungen.filter(istBewertet)
  const gruppen = Object.keys(e.gewichte) as Gruppe[]
  const { kostenbasis: basis, budgetEuro, budgetAlsKo } = e.wirtschaftlichkeit
  let zinsFehlt = false

  const ergebnisse = e.angebote.map((angebot): AngebotsErgebnis => {
    const ausschluss: string[] = []
    // N1: K.-o.-Prüfung
    let koOffen = 0
    for (const a of ko) {
      const ergebnis = angebot.bewertungen[a.id]?.ko ?? null
      if (ergebnis === 'nicht_erfuellt') ausschluss.push(`Muss-Kriterium ${kurzname(a)} nicht erfüllt`)
      else if (ergebnis !== 'erfuellt') koOffen += 1
    }
    // N3, N4: Gruppenwerte und Nutzwert
    let fehlend = 0
    const gruppenwerte: Partial<Record<Gruppe, number>> = {}
    let nutzwert = 0
    for (const g of gruppen) {
      const inGruppe = bewertet.filter((a) => a.gruppe === g)
      const summe = inGruppe.reduce((s, a) => s + a.punkte, 0)
      let wert = 0
      for (const a of inGruppe) {
        const punkte = angebot.bewertungen[a.id]?.punkte ?? null
        if (punkte === null) fehlend += 1
        wert += a.punkte * (punkte ?? 0)
      }
      gruppenwerte[g] = summe > 0 ? wert / summe : 0
      nutzwert += (e.gewichte[g] ?? 0) * gruppenwerte[g]!
    }
    // K8 und N2: Kostenbasis und Budget
    const kosten = e.kosten.get(angebot.id) ?? KEINE_KOSTEN
    let kb = kostenbasisVon(kosten, basis)
    if (kb === null) {
      zinsFehlt = true
      kb = kosten.tco
    }
    if (budgetEuro !== null && kb > budgetEuro) {
      if (budgetAlsKo) ausschluss.push('über Budget')
      else befunde.push({ schwere: 'hinweis', code: 'N2', text: `${angebotsname(angebot)}: über Budget (${euro(kb)} statt höchstens ${euro(budgetEuro)}).`, bezug: angebot.id })
    }
    return {
      angebotId: angebot.id,
      gueltig: ausschluss.length === 0,
      ausschluss,
      koOffen,
      fehlend,
      gruppenwerte,
      nutzwert,
      kosten,
      kostenbasis: kb,
      // N7: bei Nutzwert 0 nicht berechenbar
      euroJePunkt: nutzwert > 0 ? kb / nutzwert : null,
      rang: null,
    }
  })
  if (zinsFehlt) befunde.push({ schwere: 'fehler', code: 'K8', text: 'Zins fehlt: Für die Kostenbasis „Barwert“ bitte einen Kalkulationszins angeben.', bezug: null })
  return { ergebnisse, befunde }
}

/** N6: vorläufig, wenn bei einem gültigen Angebot K.-o.-Prüfungen offen sind oder Punkte fehlen. */
export function istVorlaeufig(ergebnisse: readonly AngebotsErgebnis[]): boolean {
  return ergebnisse.some((r) => r.gueltig && (r.koOffen > 0 || r.fehlend > 0))
}
