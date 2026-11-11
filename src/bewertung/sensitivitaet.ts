/**
 * Sensitivität der Gewichte (Spezifikation 6.10, Regeln S1 bis S6).
 *
 * Für jedes Hauptkriterium k wird sein Gewicht x von 0 bis 1 variiert; die
 * übrigen Gewichte ändern sich proportional: W_l(x) = W_l · (1 − x) / (1 − W_k).
 * Dann ist der Nutzwert jedes Angebots linear in x:
 * N_j(x) = R_kj + x · (S_kj − R_kj) mit R_kj = (N_j − W_k · S_kj) / (1 − W_k).
 * Der stabile Bereich ist die Menge der x, in der die heutige Empfehlung b
 * vorn bleibt: d_j(x) ≥ 0 für alle Mitbewerber j, mit
 * d_j = N_b − N_j (Regel Nutzwert) oder d_j = K_j · N_b − K_b · N_j
 * (Regel Preis-Leistung, K = Kostenbasis; gleichbedeutend mit € je Punkt).
 */
import type { AngebotsErgebnis, Befund, Stabilitaet } from '../modell/ergebnisse'
import { gruppenName, type Entscheidungsregel, type Gruppe, type Id } from '../modell/typen'
import { prozent } from '../modell/zahlformat'
import { KNAPP_SCHWELLE } from '../regeln/schwellen'

export interface SensitivitaetEingabe {
  regel: Entscheidungsregel
  gewichte: Partial<Record<Gruppe, number>>
  /** Ergebnisse der konkurrierenden Angebote (gültig, bei Preis-Leistung zulässig) */
  konkurrenten: readonly AngebotsErgebnis[]
  empfehlungId: Id | null
  gleichstandSpitze: boolean
}

export interface SensitivitaetErgebnis {
  stabilitaet: Stabilitaet[]
  befunde: Befund[]
}

const NULL = 1e-12

export function berechneSensitivitaet(e: SensitivitaetEingabe): SensitivitaetErgebnis {
  const gruppen = Object.keys(e.gewichte) as Gruppe[]
  const hinweis = (text: string): SensitivitaetErgebnis => ({ stabilitaet: [], befunde: [{ schwere: 'hinweis', code: 'S1', text, bezug: null }] })
  // S1
  if (gruppen.length < 2) return hinweis('Sensitivität: Es gibt nur ein Hauptkriterium; sein Gewicht ist immer 100 %.')
  if (e.konkurrenten.length < 2) return hinweis('Sensitivität: Es braucht mindestens zwei vergleichbare Angebote.')
  // S6
  if (e.gleichstandSpitze) {
    return { stabilitaet: [], befunde: [{ schwere: 'hinweis', code: 'S6', text: 'Gleichstand an der Spitze; empfohlen ist das günstigere Angebot.', bezug: null }] }
  }
  const b = e.konkurrenten.find((r) => r.angebotId === e.empfehlungId)
  if (!b) return { stabilitaet: [], befunde: [] }

  const stabilitaet: Stabilitaet[] = []
  for (const k of gruppen) {
    const wk = e.gewichte[k] ?? 0
    // S4 aus S2: Ein Kriterium mit Gewicht 1 lässt sich nicht variieren.
    if (wk >= 1 - NULL) continue
    const linear = (r: AngebotsErgebnis) => {
      const s = r.gruppenwerte[k] ?? 0
      const rk = (r.nutzwert - wk * s) / (1 - wk)
      return { a: rk, b: s - rk }
    }
    const nb = linear(b)
    let von = 0
    let bis = 1
    for (const j of e.konkurrenten) {
      if (j === b) continue
      const nj = linear(j)
      // S3: d_j(x) = α + β·x
      const [alpha, beta] =
        e.regel === 'nutzwert'
          ? [nb.a - nj.a, nb.b - nj.b]
          : [j.kostenbasis * nb.a - b.kostenbasis * nj.a, j.kostenbasis * nb.b - b.kostenbasis * nj.b]
      if (Math.abs(beta) < NULL) continue
      const x = -alpha / beta
      if (beta > 0) von = Math.max(von, x)
      else bis = Math.min(bis, x)
    }
    von = Math.min(Math.max(von, 0), 1)
    bis = Math.min(Math.max(bis, 0), 1)
    // S5
    const abstaende = [...(von > NULL ? [wk - von] : []), ...(bis < 1 - NULL ? [bis - wk] : [])]
    const abstand = abstaende.length > 0 ? Math.min(...abstaende) : null
    stabilitaet.push({ gruppe: k, gewicht: wk, von, bis, abstand, knapp: abstand !== null && abstand < KNAPP_SCHWELLE })
  }
  return { stabilitaet, befunde: [] }
}

/** „Funktionen: 0,0 bis 51,6 %, heute 50,0 %“ */
export function stabilitaetText(s: Stabilitaet): string {
  return `${gruppenName(s.gruppe)}: ${prozent(s.von)} bis ${prozent(s.bis)} %, heute ${prozent(s.gewicht)} %${s.knapp ? ' (knapp)' : ''}`
}
