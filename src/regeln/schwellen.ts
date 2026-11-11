/**
 * Alle Konstanten der Regeln an einer Stelle, mit Herkunft. „Eigene
 * Festlegung“ heißt: von der Spezifikation gesetzt, ohne äußere Quelle;
 * Robin kann sie ändern (offene Frage 5, siehe docs/entscheidungen.md).
 */

// ── Einlesen (Spezifikation 6.1) ───────────────────────────────────────────

/** E1: größte Prozessdatei in Byte (5 MB). Eigene Festlegung, Schutz vor Überlast. */
export const MAX_DATEIGROESSE_BYTE = 5 * 1024 * 1024
/** E6: Grenzen gegen Stapelüberlauf und Überlast. Eigene Festlegung. */
export const MAX_TIEFE = 50
export const MAX_BAUSTEINE = 5000
export const MAX_ROLLEN = 500
export const MAX_MEDIEN = 500
/** E8: Toleranz, mit der die Anteile einer Entscheidung 100 % ergeben müssen. */
export const ANTEIL_TOLERANZ = 0.001

// ── Häufigkeit (6.2) ───────────────────────────────────────────────────────

/** H6: Obergrenze des Wiederholungsanteils, damit 1 / (1 − r) endlich bleibt (wie im Prozesslotsen). */
export const WIEDERHOLUNG_MAX = 0.999

// ── Rahmen und Wirtschaftlichkeit (4.2, 6.11) ──────────────────────────────

/** Arbeitstage im Jahr. Eigene Festlegung (5 Tage × 50 Wochen). */
export const BETRIEBSTAGE_STANDARD = 250
/** Vielfaches der mittleren Vorgänge an starken Tagen. Eigene Festlegung. */
export const SPITZENFAKTOR_STANDARD = 2
/** Betrachtungszeitraum der Gesamtkosten in Jahren. */
export const JAHRE_STANDARD = 5
export const JAHRE_MIN = 1
export const JAHRE_MAX = 10
/** K10: interner Stundensatz ohne Prozessmodell. Eigene Festlegung. */
export const STUNDENSATZ_OHNE_MODELL = 45
/** Stunden je Personentag ohne Prozessmodell. */
export const STUNDEN_PRO_PERSONENTAG_STANDARD = 8

/** Richtwerte für Anforderungstexte (4.2). */
export const RICHTWERTE_STANDARD = {
  antwortzeitSek: 2,
  /** längste Frist, § 147 Abs. 3 AO */
  aufbewahrungJahre: 10,
  wiederherstellungStunden: 24,
  verfuegbarkeitProzent: 99.5,
  reaktionStunden: 4,
  referenzen: 2,
  einfuehrungWochen: 12,
} as const

// ── Ableitung des Lastenhefts (6.5) ────────────────────────────────────────

/** A2: Aufgaben mit mindestens dieser Häufigkeit je Vorgang sind der Normalfall (Muss). Eigene Festlegung. */
export const NORMALFALL_SCHWELLE = 0.5
/** A4: Minuten Abtippen pro Tag, ab denen eine Schnittstelle Muss bzw. Soll ist. Eigene Festlegung. */
export const MEDIENBRUCH_MUSS_MIN = 60
export const MEDIENBRUCH_SOLL_MIN = 10
/** A13: Standardpunkte je Priorität (Gewicht in der Gruppe). */
export const PUNKTE_STANDARD = { muss: 0, soll: 2, kann: 1, nicht: 0 } as const

// ── Prüfungen (6.6) ────────────────────────────────────────────────────────

/**
 * P7: höchster Muss-Anteil. Agile Business Consortium, „What is MoSCoW
 * Prioritization?“ (veröffentlicht 28.05.2026): höchstens etwa 60 % des
 * Aufwands für Must Have. Der Auswahl-Lotse zählt Anforderungen statt Aufwand.
 */
export const MUSS_ANTEIL_GRENZE = 0.6
/** P5: Anforderungen mit mehr Wörtern sollten aufgeteilt werden. Eigene Festlegung. */
export const WOERTER_MAX = 40

// ── Gewichtung und AHP (6.8) ───────────────────────────────────────────────

/** AHP2: Abbruch der Potenzmethode. */
export const AHP_TOLERANZ = 1e-12
export const AHP_MAX_SCHRITTE = 1000
/** AHP6: Konsistenzgrenze nach Saaty. */
export const CR_GRENZE = 0.1
/**
 * AHP5: Zufallsindex RI(n) nach Saaty (1987), „The analytic hierarchy
 * process—what it is and how it is used“, Mathematical Modelling 9(3–5),
 * S. 161–176. Die Tabelle selbst war am 11.11.2026 nicht abrufbar; die Werte
 * sind die verbreitete Saaty-Tabelle. Gegenprobe: Simulationswerte nach
 * Bozóki und Rapcsák (2008), zitiert bei Csató und Petróczy (2021),
 * arXiv:2102.10558, Tabelle für n = 4 bis 10: 0,884; 1,109; 1,249; 1,341;
 * 1,404; 1,451; 1,486 (Abweichung höchstens 0,03). Dazu die eigene
 * Simulation in Test T-AHP6 (ahp.test.ts): Abweichung höchstens 0,08 bei
 * n = 3, sonst höchstens 0,05.
 */
export const RI: Readonly<Record<number, number>> = { 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 }
/** Höchstzahl der Hauptkriterien im Paarvergleich (neun Gruppen, Spezifikation 2.3). */
export const AHP_MAX_KRITERIEN = 9

// ── Nutzwert, Sensitivität, Entscheidung (6.9, 6.10, 6.12) ─────────────────

/** N5: Nutzwerte, die sich um weniger unterscheiden, gelten als gleich. Eigene Festlegung. */
export const GLEICHSTAND_NUTZWERT = 0.005
/** N5: Euro je Nutzwertpunkt, die sich um weniger unterscheiden, gelten als gleich. Eigene Festlegung. */
export const GLEICHSTAND_EURO_JE_PUNKT = 1
/** S5: Ein stabiler Bereich ist knapp, wenn das Gewicht weniger als 5 Prozentpunkte vom Rand entfernt ist. Eigene Festlegung. */
export const KNAPP_SCHWELLE = 0.05
/** D2: Mindestnutzwert bei der Regel Preis-Leistung. Eigene Festlegung. */
export const MINDESTNUTZWERT_STANDARD = 5
