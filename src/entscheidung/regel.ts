/**
 * Rang und Empfehlung nach der Entscheidungsregel (Spezifikation 6.9 N5 und
 * 6.12 D1 bis D3; D4 und D5 folgen mit der Vorlage in Phase 5).
 *
 * - Regel „nutzwert“: höchster Nutzwert; bei Gleichstand das Angebot mit der
 *   niedrigeren Kostenbasis.
 * - Regel „preis_leistung“: zulässig sind gültige Angebote mit Nutzwert ≥
 *   Mindestnutzwert; empfohlen wird der kleinste Wert € je Nutzwertpunkt.
 *
 * Gleichstand: Nutzwerte unter 0,005 Punkten oder € je Punkt unter 1 €
 * Abstand. Gleichstehende Angebote bekommen denselben Rang und werden
 * alphabetisch angezeigt.
 */
import type { AngebotsErgebnis, Befund } from '../modell/ergebnisse'
import type { Angebot, Entscheidungsregel, Id } from '../modell/typen'
import { GLEICHSTAND_EURO_JE_PUNKT, GLEICHSTAND_NUTZWERT } from '../regeln/schwellen'
import { angebotsname } from '../bewertung/nutzwert'

export interface Rangfolge {
  /** Ergebnisse mit gesetztem Rang (null = ungültig oder nicht zulässig) */
  ergebnisse: AngebotsErgebnis[]
  empfehlungId: Id | null
  /** Angebote, die unter der Regel konkurrieren (gültig, bei Preis-Leistung zusätzlich zulässig) */
  zulaessig: Id[]
  /** mehrere Angebote auf Rang 1 */
  gleichstandSpitze: boolean
  befunde: Befund[]
}

/** D2: zulässig nach Preis-Leistung (Mindestnutzwert bleibt fest, S6). */
export function istZulaessig(r: AngebotsErgebnis, regel: Entscheidungsregel, mindestNutzwert: number): boolean {
  if (!r.gueltig) return false
  if (regel === 'nutzwert') return true
  return r.euroJePunkt !== null && r.nutzwert >= mindestNutzwert - 1e-9
}

/** Vergleich für die Anzeige gleichstehender Angebote: alphabetisch nach Anbieter, dann Produkt. */
export function alphabetisch(namen: ReadonlyMap<Id, Angebot>) {
  return (a: Id, b: Id) => {
    const x = namen.get(a)
    const y = namen.get(b)
    return (x ? angebotsname(x) : '').localeCompare(y ? angebotsname(y) : '', 'de') || (x?.produkt ?? '').localeCompare(y?.produkt ?? '', 'de')
  }
}

export function rangfolge(ergebnisse: readonly AngebotsErgebnis[], angebote: readonly Angebot[], regel: Entscheidungsregel, mindestNutzwert: number): Rangfolge {
  const befunde: Befund[] = []
  const nachId = new Map(angebote.map((a) => [a.id, a]))
  const zulaessig = ergebnisse.filter((r) => istZulaessig(r, regel, mindestNutzwert))
  const wert = (r: AngebotsErgebnis) => (regel === 'nutzwert' ? -r.nutzwert : (r.euroJePunkt ?? Infinity))
  const schwelle = regel === 'nutzwert' ? GLEICHSTAND_NUTZWERT : GLEICHSTAND_EURO_JE_PUNKT
  // N5: sortieren (kleiner ist besser), gleichstehende alphabetisch, Rang wie im Sport (1, 1, 3)
  const sortiert = [...zulaessig].sort((a, b) => wert(a) - wert(b) || alphabetisch(nachId)(a.angebotId, b.angebotId))
  const raenge = new Map<Id, number>()
  sortiert.forEach((r, i) => {
    const vorher = sortiert[i - 1]
    // Toleranz gegen Rundungsfehler: 7,005 − 7,0 ergibt 0,004999… und ist kein Gleichstand
    const gleich = vorher !== undefined && Math.abs(wert(r) - wert(vorher)) < schwelle - 1e-9
    raenge.set(r.angebotId, gleich ? raenge.get(vorher.angebotId)! : i + 1)
  })
  // innerhalb gleichen Rangs alphabetisch (die Kette kann Werte außerhalb der Reihenfolge verbinden)
  sortiert.sort((a, b) => raenge.get(a.angebotId)! - raenge.get(b.angebotId)! || alphabetisch(nachId)(a.angebotId, b.angebotId))

  const spitze = sortiert.filter((r) => raenge.get(r.angebotId) === 1)
  // D1 und S6: bei Gleichstand das günstigere Angebot
  const empfohlen = [...spitze].sort((a, b) => a.kostenbasis - b.kostenbasis || alphabetisch(nachId)(a.angebotId, b.angebotId))[0]

  if (!ergebnisse.some((r) => r.gueltig)) {
    if (ergebnisse.length > 0) befunde.push({ schwere: 'fehler', code: 'D3', text: 'Kein Angebot erfüllt alle Muss-Kriterien.', bezug: null })
  } else if (zulaessig.length === 0) {
    befunde.push({ schwere: 'warnung', code: 'D2', text: 'Kein Angebot erreicht den Mindestnutzwert.', bezug: null })
  }

  return {
    ergebnisse: ergebnisse.map((r) => ({ ...r, rang: raenge.get(r.angebotId) ?? null })),
    empfehlungId: empfohlen?.angebotId ?? null,
    zulaessig: sortiert.map((r) => r.angebotId),
    gleichstandSpitze: spitze.length > 1,
    befunde,
  }
}
