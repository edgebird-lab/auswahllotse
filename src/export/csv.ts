/**
 * Anbieterfragebogen als CSV (Spezifikation 6.15): UTF-8 mit BOM, Semikolon,
 * CRLF, Formelschutz gegen CSV-Injektion, weil Anbieter die Datei in Excel
 * öffnen. Zeilen: alle aktiven Anforderungen nach Gruppe und Nummer.
 */
import { GRUPPEN_REIHENFOLGE, gruppenName, type Anforderung, type AuswahlProjekt } from '../modell/typen'
import { PRIORITAET_NAMEN } from '../lastenheft/texte'
import { dateiname } from './dateiname'

export const BOM = '﻿'
export const ZEILENENDE = '\r\n'
export const TRENNER = ';'

export const KOPFZEILE = [
  'Nr.',
  'Gruppe',
  'Titel',
  'Anforderung',
  'Priorität',
  'Abnahmekriterium',
  'Erfüllt (ja/teilweise/nein)',
  'Erläuterung des Anbieters',
  'Fundstelle im Angebot',
] as const

/** Formelschutz: Felder, die Excel als Formel lesen würde, bekommen ein vorangestelltes Hochkomma. */
const FORMELANFANG = /^[=+\-@\t\r]/

export function csvFeld(wert: string): string {
  const geschuetzt = FORMELANFANG.test(wert) ? `'${wert}` : wert
  return /[;"\r\n]/.test(geschuetzt) ? `"${geschuetzt.replace(/"/g, '""')}"` : geschuetzt
}

export function csvZeile(felder: readonly string[]): string {
  return felder.map(csvFeld).join(TRENNER)
}

/** Laufende Nummer aus „F-03“ für die Sortierung; ohne Nummer ans Ende. */
function nummerWert(a: Anforderung): number {
  const m = a.nummer?.match(/(\d+)$/)
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER
}

/** Aktive Anforderungen nach Gruppe (feste Reihenfolge) und Nummer. */
export function fragebogenZeilen(anforderungen: readonly Anforderung[]): Anforderung[] {
  const rang = (a: Anforderung) => GRUPPEN_REIHENFOLGE.indexOf(a.gruppe)
  return anforderungen.filter((a) => a.status === 'aktiv').sort((x, y) => rang(x) - rang(y) || nummerWert(x) - nummerWert(y))
}

export function anbieterFragebogen(p: Pick<AuswahlProjekt, 'anforderungen'>): string {
  const zeilen = fragebogenZeilen(p.anforderungen).map((a) =>
    csvZeile([a.nummer ?? '', gruppenName(a.gruppe), a.titel, a.text, PRIORITAET_NAMEN[a.prioritaet], a.abnahme, '', '', '']),
  )
  return BOM + [csvZeile(KOPFZEILE), ...zeilen].join(ZEILENENDE) + ZEILENENDE
}

/** „{Vorhaben} – Anbieterfragebogen.csv“, höchstens 80 Zeichen. */
export function fragebogenDateiname(p: Pick<AuswahlProjekt, 'rahmen'>): string {
  return dateiname(p.rahmen.vorhaben, ' – Anbieterfragebogen', 'csv')
}
