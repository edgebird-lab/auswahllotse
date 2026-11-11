/**
 * Häufigkeit je Aufgabe nach dem Flussverfahren (Spezifikation 6.2): skalare
 * Fassung der Flussrechnung des Prozesslotsen (`src/analyse/kennzahlen.ts`,
 * Abschnitt „Fluss“), ohne Vorgängerverfolgung.
 *
 * Ein Fluss f ist die erwartete Zahl, mit der eine Stelle je Vorgang erreicht
 * wird. Jede Folge liefert `aus` (geht normal weiter) und `rueck` (springt je
 * Rücksprungbereich zurück). Regeln:
 *
 * - H1 Folge: Bausteine nacheinander; `aus` des einen ist der Fluss des nächsten.
 * - H2 Aufgabe: h += f, aus = f. H3 Warten und allgemeiner Schritt: aus = f.
 * - H4 Entscheidung: je Ausgang Folge mit f · anteil; Ende → enden, Rücksprung → rueck, sonst aus.
 * - H5 Gleichzeitig: jeder Zweig mit f; aus = Minimum der Zweig-Ausgänge; ohne Zweige aus = f.
 * - H6 Wiederholung: Probelauf mit Fluss 1, dann E = f / (1 − r) zählend.
 * - H7 Regulär: `aus` der Hauptfolge.
 * - H8 ODER (Format 3, wie im Prozesslotsen): Weg i läuft mit pᵢ (Standardweg mit Π(1 − pⱼ));
 *   aus = f · Π(1 − pᵢ + ausᵢ / f), also f, solange kein Weg den Vorgang beendet.
 */
import { WIEDERHOLUNG_MAX } from '../regeln/schwellen'
import type { PlBlock, PlId, PlOder, PlProzess } from './format'

export interface Haeufigkeiten {
  /** Erwartete Ausführungen je Vorgang, je Aufgabe, Warten und allgemeinem Schritt */
  haeufigkeit: Map<PlId, number>
  /** Anteil der Vorgänge je vorzeitigem Ende (Ergebnistext) */
  enden: Map<string, number>
  /** Anteil der Vorgänge, die regulär enden (H7) */
  regulaer: number
}

interface Zaehler {
  haeufigkeit: Map<PlId, number>
  enden: Map<string, number>
}

interface Ergebnis {
  aus: number
  rueck: Map<PlId, number>
}

const plus = <K>(m: Map<K, number>, k: K, w: number) => m.set(k, (m.get(k) ?? 0) + w)
const klemme01 = (x: number) => Math.min(1, Math.max(0, x))

function addiereRueck(ziel: Map<PlId, number>, quelle: Map<PlId, number>, ohne?: PlId): void {
  for (const [id, w] of quelle) if (id !== ohne) plus(ziel, id, w)
}

/** Wahrscheinlichkeit je Weg einer ODER-Verzweigung (wie `oderWahrscheinlichkeiten` im Prozesslotsen). */
export function oderWahrscheinlichkeiten(b: PlOder): number[] {
  const keiner = b.zweige.reduce((q, z) => (z.id === b.standard ? q : q * (1 - klemme01(z.anteil))), 1)
  return b.zweige.map((z) => (z.id === b.standard ? keiner : klemme01(z.anteil)))
}

function folge(schritte: PlBlock[], f: number, z: Zaehler): Ergebnis {
  let aus = f
  const rueck = new Map<PlId, number>()
  for (const b of schritte) {
    const e = block(b, aus, z)
    addiereRueck(rueck, e.rueck)
    aus = e.aus
  }
  return { aus, rueck }
}

function block(b: PlBlock, f: number, z: Zaehler): Ergebnis {
  switch (b.typ) {
    case 'aufgabe':
    case 'warten':
    case 'allgemein':
      plus(z.haeufigkeit, b.id, f)
      return { aus: f, rueck: new Map() }
    case 'entscheidung': {
      let aus = 0
      const rueck = new Map<PlId, number>()
      for (const zweig of b.zweige) {
        const o = folge(zweig.schritte, f * zweig.anteil, z)
        addiereRueck(rueck, o.rueck)
        if (zweig.ende !== null) plus(z.enden, zweig.ende, o.aus)
        else if (zweig.zurueckZu !== null) plus(rueck, zweig.zurueckZu, o.aus)
        else aus += o.aus
      }
      return { aus, rueck }
    }
    case 'parallel': {
      if (b.zweige.length === 0) return { aus: f, rueck: new Map() }
      let aus = Infinity
      const rueck = new Map<PlId, number>()
      for (const zweig of b.zweige) {
        const o = folge(zweig.schritte, f, z)
        addiereRueck(rueck, o.rueck)
        aus = Math.min(aus, o.aus)
      }
      return { aus, rueck }
    }
    case 'oder': {
      const p = oderWahrscheinlichkeiten(b)
      const rueck = new Map<PlId, number>()
      let weiter = 1
      b.zweige.forEach((zweig, i) => {
        const o = folge(zweig.schritte, f * p[i], z)
        addiereRueck(rueck, o.rueck)
        if (f > 0) weiter *= 1 - p[i] + o.aus / f
      })
      return { aus: f * weiter, rueck }
    }
    case 'wiederholung': {
      // Probelauf mit Fluss 1, ohne zu zählen
      const probe = folge(b.koerper.schritte, 1, { haeufigkeit: new Map(), enden: new Map() })
      const p = b.modus === 'anteil' ? Math.min(Math.max(b.anteilWiederholung, 0), WIEDERHOLUNG_MAX) : 0
      const wieder = b.modus === 'anteil' ? p * probe.aus : (probe.rueck.get(b.id) ?? 0)
      const r = Math.min(wieder, WIEDERHOLUNG_MAX)
      const o = folge(b.koerper.schritte, f / (1 - r), z)
      const rueck = new Map<PlId, number>()
      addiereRueck(rueck, o.rueck, b.id)
      return { aus: o.aus * (1 - p), rueck }
    }
  }
}

export function berechneHaeufigkeiten(p: PlProzess): Haeufigkeiten {
  const z: Zaehler = { haeufigkeit: new Map(), enden: new Map() }
  const { aus } = folge(p.ablauf.schritte, 1, z)
  return { haeufigkeit: z.haeufigkeit, enden: z.enden, regulaer: aus }
}
