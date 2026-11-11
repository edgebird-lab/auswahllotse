/**
 * Vorschläge für die Annahmen der Kostenrechnung (Spezifikation 6.11, Regel
 * K10): Benutzer aus dem Mengengerüst (M3), interner Stundensatz aus den
 * Rollen im Umfang, Stunden je Personentag aus dem Prozess, Nutzen aus den
 * Medienbruchkosten (M7). Ohne Prozessmodell gelten feste Werte.
 */
import type { Mengengeruest } from '../modell/ergebnisse'
import type { AuswahlProjekt, Wirtschaftlichkeit } from '../modell/typen'
import { mengengeruestVon } from '../prozessdatei/mengengeruest'
import { grundlageVon } from '../prozessdatei/struktur'
import { rollenImUmfang } from '../lastenheft/umfang'
import { BENUTZER_STANDARD, STUNDEN_PRO_PERSONENTAG_STANDARD, STUNDENSATZ_OHNE_MODELL } from '../regeln/schwellen'

export interface KostenVorschlaege {
  /** M3; ohne Prozessmodell null */
  benutzer: number | null
  /** gewichteter Mittel der Stundensätze im Umfang, auf ganze Euro gerundet; ohne Modell 45 € */
  internerStundensatzEuro: number
  /** arbeitsstundenProTag der Grundlage; ohne Modell 8 */
  stundenProPersonentag: number
  /** M7 auf ganze Euro gerundet; ohne Prozessmodell null */
  nutzenProJahrEuro: number | null
}

export type VorschlagsFeld = keyof KostenVorschlaege

/** K10 aus dem Projekt; das Mengengerüst kann mitgegeben werden, wenn es schon berechnet ist. */
export function kostenVorschlaege(p: AuswahlProjekt, m: Mengengeruest | null = mengengeruestVon(p)): KostenVorschlaege {
  if (!p.prozess || !p.umfang || !m) {
    return { benutzer: null, internerStundensatzEuro: STUNDENSATZ_OHNE_MODELL, stundenProPersonentag: STUNDEN_PRO_PERSONENTAG_STANDARD, nutzenProJahrEuro: null }
  }
  const basis = grundlageVon(p.prozess.projekt, p.umfang.grundlage)
  const rollen = rollenImUmfang(basis, m.imUmfang)
  const personen = rollen.reduce((s, r) => s + Math.max(0, r.personen), 0)
  let satz = STUNDENSATZ_OHNE_MODELL
  if (personen > 0) satz = rollen.reduce((s, r) => s + r.stundensatz * Math.max(0, r.personen), 0) / personen
  // Rollen ohne Personen: einfacher Mittelwert ihrer Sätze
  else if (rollen.length > 0) satz = rollen.reduce((s, r) => s + r.stundensatz, 0) / rollen.length
  return {
    benutzer: m.benutzer,
    internerStundensatzEuro: Math.round(satz),
    stundenProPersonentag: basis.arbeitsstundenProTag > 0 ? basis.arbeitsstundenProTag : STUNDEN_PRO_PERSONENTAG_STANDARD,
    nutzenProJahrEuro: Math.round(m.medienbruchkostenProJahr),
  }
}

/** „übernehmen“ neben einem Vorschlag: setzt das Feld auf den Vorschlagswert. */
export function uebernimmVorschlag(p: AuswahlProjekt, feld: VorschlagsFeld, v: KostenVorschlaege = kostenVorschlaege(p)): AuswahlProjekt {
  const wert = v[feld]
  if (wert === null || p.wirtschaftlichkeit[feld] === wert) return p
  return { ...p, wirtschaftlichkeit: { ...p.wirtschaftlichkeit, [feld]: wert } }
}

/**
 * Nach dem Einlesen: Benutzer, Stundensatz und Stunden je Personentag folgen
 * dem Prozessmodell, solange sie noch auf den Werten eines neuen Projekts
 * stehen (4.2: „Standard: Vorschlag“). Selbst gesetzte Werte bleiben.
 */
export function standardsAusModell(p: AuswahlProjekt): AuswahlProjekt {
  const v = kostenVorschlaege(p)
  const w = p.wirtschaftlichkeit
  const neu: Wirtschaftlichkeit = {
    ...w,
    benutzer: w.benutzer === BENUTZER_STANDARD && v.benutzer !== null && v.benutzer > 0 ? v.benutzer : w.benutzer,
    internerStundensatzEuro: w.internerStundensatzEuro === STUNDENSATZ_OHNE_MODELL ? v.internerStundensatzEuro : w.internerStundensatzEuro,
    stundenProPersonentag: w.stundenProPersonentag === STUNDEN_PRO_PERSONENTAG_STANDARD ? v.stundenProPersonentag : w.stundenProPersonentag,
  }
  const gleich = neu.benutzer === w.benutzer && neu.internerStundensatzEuro === w.internerStundensatzEuro && neu.stundenProPersonentag === w.stundenProPersonentag
  return gleich ? p : { ...p, wirtschaftlichkeit: neu }
}
