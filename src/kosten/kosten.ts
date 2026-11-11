/**
 * Kosten über den Betrachtungszeitraum (Spezifikation 6.11, Regeln K1 bis
 * K7 und K9; die Kostenbasis K8 wählt bewertung/nutzwert.ts).
 *
 * T = Jahre, s = Preissteigerung, i = Zins, U = Nutzen pro Jahr, B = Benutzer
 * (Lizenzbedarf), z = interner Stundensatz, P = Stunden je Personentag.
 * Prozentwerte gehen geteilt durch 100 in die Formeln ein. Die Einführung
 * fällt in Jahr 0 an, laufende Kosten am Ende jedes Jahres. Alle Beträge
 * sind netto.
 */
import type { Befund, KostenErgebnis } from '../modell/ergebnisse'
import type { Angebot, AuswahlProjekt, Id, Kosten, Wirtschaftlichkeit } from '../modell/typen'
import { JAHRE_MAX, JAHRE_MIN, PROZENT_MIN } from '../regeln/schwellen'
import { angebotsname } from '../bewertung/nutzwert'

const summe = (werte: readonly number[]) => werte.reduce((s, x) => s + x, 0)

/** Jahre für die Rechnung: ganze Zahl 1 bis 10 (ungültige Eingaben meldet K9). */
export function jahreFuerRechnung(jahre: number): number {
  if (!Number.isFinite(jahre)) return JAHRE_MIN
  return Math.min(JAHRE_MAX, Math.max(JAHRE_MIN, Math.round(jahre)))
}

/** K1: einmalige Kosten E = Σ einmalig + Einführungstage · P · z + Schulungsstunden je Benutzer · B · z. */
export function einmaligeKosten(k: Kosten, w: Wirtschaftlichkeit): number {
  const z = w.internerStundensatzEuro
  return summe(k.einmalig.map((p) => p.betragEuro)) + k.internEinfuehrungTage * w.stundenProPersonentag * z + k.internSchulungStundenJeBenutzer * w.benutzer * z
}

/** K2: laufende Kosten im 1. Jahr L₁ = Σ laufend + Preis je Benutzer und Monat · B · 12 + Betriebsstunden im Monat · 12 · z. */
export function laufendeKostenErstesJahr(k: Kosten, w: Wirtschaftlichkeit): number {
  return summe(k.laufendJahr.map((p) => p.betragEuro)) + k.preisJeBenutzerMonatEuro * w.benutzer * 12 + k.internBetriebStundenMonat * 12 * w.internerStundensatzEuro
}

/** K7: kleinstes Jahr t, in dem Σ_{τ≤t} (U − L_τ) / (1 + i)^τ ≥ E; ohne Zins i = 0. */
export function amortisationsjahr(einmalig: number, laufend: readonly number[], nutzen: number, zins: number): number | null {
  let kumuliert = 0
  for (let t = 1; t <= laufend.length; t++) {
    kumuliert += (nutzen - laufend[t - 1]) / (1 + zins) ** t
    // Toleranz gegen Rundungsfehler: Wer genau E erreicht, hat sich bezahlt gemacht
    if (kumuliert >= einmalig - 1e-9) return t
  }
  return null
}

/** K1 bis K7 für ein Angebot. */
export function berechneKosten(k: Kosten, w: Wirtschaftlichkeit): KostenErgebnis {
  const jahre = jahreFuerRechnung(w.jahre)
  const einmalig = einmaligeKosten(k, w)
  const l1 = laufendeKostenErstesJahr(k, w)
  const s = w.preissteigerungProzent / 100
  // K3: L_t = L₁ · (1 + s)^(t − 1)
  const laufend = Array.from({ length: jahre }, (_, i) => l1 * (1 + s) ** i)
  // K4
  const tco = einmalig + summe(laufend)
  const i = w.zinsProzent === null ? null : w.zinsProzent / 100
  // K5: Barwert nur mit Zins
  const barwert = i === null ? null : einmalig + summe(laufend.map((l, t) => l / (1 + i) ** (t + 1)))
  const u = w.nutzenProJahrEuro
  // K6: Kapitalwert mit Zins und Nutzen
  const kapitalwert = i === null || u === null ? null : -einmalig + summe(laufend.map((l, t) => (u - l) / (1 + i) ** (t + 1)))
  // K7: Amortisation mit Nutzen; ohne Zins gilt i = 0
  const amortisationJahr = u === null ? null : amortisationsjahr(einmalig, laufend, u, i ?? 0)
  return { einmalig, laufend, tco, barwert, kapitalwert, amortisationJahr }
}

/** Kosten aller Angebote, Schlüssel: Angebot.id. */
export function kostenJeAngebot(p: Pick<AuswahlProjekt, 'angebote' | 'wirtschaftlichkeit'>): Map<Id, KostenErgebnis> {
  return new Map(p.angebote.map((a) => [a.id, berechneKosten(a.kosten, p.wirtschaftlichkeit)]))
}

const EINMALIG_NAMEN: Record<string, string> = {
  lizenzkauf: 'Lizenzkauf',
  einrichtung: 'Einrichtung',
  datenuebernahme: 'Datenübernahme',
  anpassung: 'Anpassung',
  schulung: 'Schulung',
  hardware: 'Hardware',
  sonstiges: 'Sonstiges',
  abo: 'Abonnement',
  wartung: 'Wartung',
  hosting: 'Hosting',
  support: 'Support',
}

/** Bezeichnung einer Kostenart für Oberfläche und Meldungen. */
export function kostenartName(art: string): string {
  return EINMALIG_NAMEN[art] ?? art
}

function pruefeAngebot(a: Angebot): Befund[] {
  const befunde: Befund[] = []
  const negativ = (was: string) =>
    befunde.push({ schwere: 'fehler', code: 'K9', text: `${angebotsname(a)}: negativer Betrag bei „${was}“. Alle Beträge sind netto und nicht negativ.`, bezug: a.id })
  for (const p of [...a.kosten.einmalig, ...a.kosten.laufendJahr]) {
    if (!(p.betragEuro >= 0)) negativ(p.bezeichnung || kostenartName(p.art))
  }
  const k = a.kosten
  if (!(k.preisJeBenutzerMonatEuro >= 0)) negativ('Preis je Benutzer und Monat')
  if (!(k.internEinfuehrungTage >= 0)) negativ('Einführung intern (Personentage)')
  if (!(k.internSchulungStundenJeBenutzer >= 0)) negativ('Schulung intern (Stunden je Benutzer)')
  if (!(k.internBetriebStundenMonat >= 0)) negativ('Betrieb intern (Stunden im Monat)')
  return befunde
}

/** K9: ungültige Annahmen und negative Beträge sind Fehler. */
export function pruefeKosten(p: Pick<AuswahlProjekt, 'angebote' | 'wirtschaftlichkeit'>): Befund[] {
  const w = p.wirtschaftlichkeit
  const befunde: Befund[] = []
  const fehler = (text: string) => befunde.push({ schwere: 'fehler', code: 'K9', text, bezug: null })
  if (!Number.isInteger(w.jahre) || w.jahre < JAHRE_MIN || w.jahre > JAHRE_MAX) fehler(`Der Betrachtungszeitraum muss ${JAHRE_MIN} bis ${JAHRE_MAX} ganze Jahre betragen.`)
  if (w.zinsProzent !== null && !(w.zinsProzent >= PROZENT_MIN)) fehler('Der Kalkulationszins darf nicht unter −50 % liegen.')
  if (!(w.preissteigerungProzent >= PROZENT_MIN)) fehler('Die Preissteigerung darf nicht unter −50 % liegen.')
  const annahmen: [string, number | null][] = [
    ['Benutzer', w.benutzer],
    ['interner Stundensatz', w.internerStundensatzEuro],
    ['Stunden je Personentag', w.stundenProPersonentag],
    ['Nutzen pro Jahr', w.nutzenProJahrEuro],
    ['Budget', w.budgetEuro],
  ]
  for (const [name, wert] of annahmen) if (wert !== null && !(wert >= 0)) fehler(`Annahmen: negativer Betrag bei „${name}“.`)
  for (const a of p.angebote) befunde.push(...pruefeAngebot(a))
  return befunde
}
