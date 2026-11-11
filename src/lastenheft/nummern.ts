/**
 * P11: Nummern wie „F-03“. Eine Anforderung bekommt ihre Nummer bei der
 * ersten Aktivierung aus `naechsteNummer`, zweistellig mit führender Null.
 * Nummern werden nie neu vergeben, auch nicht nach Verwerfen.
 */
import { GRUPPEN, type Anforderung, type Gruppe } from '../modell/typen'

export type NaechsteNummer = Partial<Record<Gruppe, number>>

export function kuerzel(g: Gruppe): string {
  return GRUPPEN.find((x) => x.gruppe === g)?.kuerzel ?? '?'
}

export function formatiereNummer(g: Gruppe, n: number): string {
  return `${kuerzel(g)}-${String(n).padStart(2, '0')}`
}

/** Vergibt die nächste Nummer, wenn die Anforderung aktiv ist und noch keine hat. Ändert `naechste`. */
export function nummeriere(a: Anforderung, naechste: NaechsteNummer): Anforderung {
  if (a.status !== 'aktiv' || a.nummer !== null) return a
  const n = naechste[a.gruppe] ?? 1
  naechste[a.gruppe] = n + 1
  return { ...a, nummer: formatiereNummer(a.gruppe, n) }
}
