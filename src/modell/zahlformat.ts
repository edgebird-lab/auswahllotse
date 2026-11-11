/**
 * Zahlen für Texte und Anzeige (Spezifikation 6, Vorspann): gerundet wird
 * erst hier. Nutzwert 2 Nachkommastellen, Euro ohne Nachkommastellen,
 * Gewichte und Prozent 1 Nachkommastelle, Häufigkeiten pro Tag ab 10
 * ganzzahlig, darunter 1 Nachkommastelle. Vor „€“ steht ein geschütztes
 * Leerzeichen.
 */

const formate = new Map<string, Intl.NumberFormat>()

function format(min: number, max: number): Intl.NumberFormat {
  const schluessel = `${min}-${max}`
  let f = formate.get(schluessel)
  if (!f) {
    // „negative“: Ein Minus nur, wenn nach dem Runden etwas übrig bleibt (−0,04 → „0,0“, nicht „-0,0“)
    f = new Intl.NumberFormat('de-DE', { minimumFractionDigits: min, maximumFractionDigits: max, signDisplay: 'negative' })
    formate.set(schluessel, f)
  }
  return f
}

/**
 * Gleitkommafehler vor dem Runden entfernen: 0,35 · 3 / 12 ergibt im Rechner
 * 0,08749999… statt 0,0875 und erschiene sonst als 8,7 % statt 8,8 %.
 * 15 gültige Stellen sind genauer als jede Anzeige der App; −0 wird zu 0.
 */
export function genau(x: number): number {
  if (!Number.isFinite(x) || x === 0) return x === 0 ? 0 : x
  return Number(x.toPrecision(15))
}

/** Zahl mit höchstens `max` Nachkommastellen, z. B. 1,5 oder 30.000. */
export function zahl(x: number, max = 2): string {
  return format(0, max).format(genau(x))
}

/** Zahl mit genau `stellen` Nachkommastellen, z. B. 7,30. */
export function fest(x: number, stellen: number): string {
  return format(stellen, stellen).format(genau(x))
}

/** Häufigkeit pro Tag: ab 10 ganzzahlig, darunter höchstens 1 Nachkommastelle („6,7“, „2“). */
export function proTag(x: number): string {
  const y = genau(x)
  return Math.abs(y) >= 10 ? fest(Math.round(y), 0) : zahl(y, 1)
}

/** Euro ohne Nachkommastellen mit geschütztem Leerzeichen: „39.140 €“. */
export function euro(x: number): string {
  return `${fest(x, 0)} €`
}

/** Euro mit zwei Nachkommastellen, z. B. für € je Nutzwertpunkt. */
export function euroGenau(x: number): string {
  return `${fest(x, 2)} €`
}

/** Anteil 0 bis 1 als Prozent mit 1 Nachkommastelle, ohne Zeichen: „62,9“. */
export function prozent(anteil: number): string {
  return fest(anteil * 100, 1)
}

/** Nutzwert mit 2 Nachkommastellen: „7,30“. */
export function nutzwert(x: number): string {
  return fest(x, 2)
}

/** Datum als „11.11.2026“ aus ISO-Text; ungültig → Text unverändert. */
export function datum(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

/** Leerraum vereinheitlichen, z. B. für Vergleiche in Tests. */
export function normalisiereLeerraum(text: string): string {
  return text.replace(/\s+/g, ' ')
}
