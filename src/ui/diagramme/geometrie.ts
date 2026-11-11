/**
 * Rechnungen für die Diagramme ohne React: Serien und Farben, Balkenform,
 * Achsenschritte, Nutzwert bei verändertem Gewicht.
 */
import type { AngebotsErgebnis } from '../../modell/ergebnisse'
import { gruppenName, type Gruppe } from '../../modell/typen'

/** Kategorie-Plätze der Palette (styles.css, --serie-1 bis --serie-8). */
export const MAX_SERIEN = 8

export interface Serie {
  name: string
  gruppen: Gruppe[]
  farbe: string
}

/** Serien in fester Reihenfolge; mehr als acht Kriterien teilen sich „übrige Gruppen“. */
export function serienVon(haupt: readonly Gruppe[]): Serie[] {
  if (haupt.length <= MAX_SERIEN) return haupt.map((g, i) => ({ name: gruppenName(g), gruppen: [g], farbe: `var(--serie-${i + 1})` }))
  const vorn = haupt.slice(0, MAX_SERIEN - 1).map((g, i) => ({ name: gruppenName(g), gruppen: [g], farbe: `var(--serie-${i + 1})` }))
  const rest = haupt.slice(MAX_SERIEN - 1)
  return [...vorn, { name: `übrige Gruppen (${rest.map(gruppenName).join(', ')})`, gruppen: rest, farbe: 'var(--serie-uebrig)' }]
}

/** Weg eines Balkens mit 4 px runder Datenseite und gerader Grundlinie. */
export function balkenWeg(x0: number, x1: number, y: number, h: number, r = 4): string {
  const rr = Math.max(0, Math.min(r, (x1 - x0) / 2, h / 2))
  return `M${x0},${y} H${x1 - rr} Q${x1},${y} ${x1},${y + rr} V${y + h - rr} Q${x1},${y + h} ${x1 - rr},${y + h} H${x0} Z`
}

/** Runde Achsenschritte: 1, 2 oder 5 mal einer Zehnerpotenz. */
export function achsenSchritt(max: number, ziel = 4): number {
  if (!(max > 0)) return 1
  const roh = max / ziel
  const potenz = 10 ** Math.floor(Math.log10(roh))
  const faktor = [1, 2, 5, 10].find((f) => f * potenz >= roh) ?? 10
  return faktor * potenz
}

/** S2: N_j(x) = R_kj + x · (S_kj − R_kj) mit R_kj = (N_j − W_k · S_kj) / (1 − W_k). */
export function nutzwertBei(r: AngebotsErgebnis, k: Gruppe, wk: number, x: number): number {
  const s = r.gruppenwerte[k] ?? 0
  const rk = (r.nutzwert - wk * s) / (1 - wk)
  return rk + x * (s - rk)
}
