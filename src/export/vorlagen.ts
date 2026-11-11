/**
 * Textbausteine der Vorlagen (Spezifikation 5.8): Ausgangslage des
 * Lastenhefts, Ausgangslage und Vorgehen der Entscheidungsvorlage. Die
 * Druckansichten in src/ui/druck setzen nur noch zusammen.
 */
import type { Gesamt } from '../entscheidung/gesamt'
import type { Mengengeruest } from '../modell/ergebnisse'
import { gruppenName, type AuswahlProjekt, type Gruppe, type Softwareart } from '../modell/typen'
import { datum, euro, fest, proTag, zahl } from '../modell/zahlformat'
import { grundlageVon } from '../prozessdatei/struktur'
import { mengengeruestVon, kostenProVorgang } from '../prozessdatei/mengengeruest'
import { CR_GRENZE } from '../regeln/schwellen'
import { istKo } from '../bewertung/gewichte'
import { mitEinheit } from '../lastenheft/texte'
import { dateiname } from './dateiname'

/** 5.8: Softwareart im Satz „{Betrieb} sucht {…} für den Prozess …“ */
export const SOFTWAREART_TEXT: Record<Softwareart, string> = {
  erp: 'ein ERP-System',
  shop: 'ein Shopsystem',
  crm: 'ein CRM-System',
  dms: 'ein Dokumentenmanagementsystem',
  andere: 'eine Software',
}

export const REGEL_NAME = { nutzwert: 'höchster Nutzwert', preis_leistung: 'bestes Preis-Leistungs-Verhältnis' } as const

/** Punkteskala der Bewertung (5.6). */
export const PUNKTESKALA = '0 nicht, 3 ansatzweise, 5 teilweise oder mit Anpassung, 8 weitgehend im Standard, 10 vollständig im Standard'

/**
 * Abschnitt 1 des Lastenhefts: „{Betrieb} sucht {Softwareart-Text} für den
 * Prozess „{Prozess}“. Heute laufen {V} Vorgänge pro Tag. Dabei werden
 * täglich {n} Datensätze von Hand übertragen ({h} Stunden).“
 */
export function ausgangslageText(p: AuswahlProjekt, m: Mengengeruest | null = mengengeruestVon(p)): string {
  const betrieb = p.rahmen.betrieb.trim() || 'Der Betrieb'
  const art = SOFTWAREART_TEXT[p.rahmen.softwareart]
  if (!p.prozess || !p.umfang || !m) return `${betrieb} sucht ${art}.`
  const basis = grundlageVon(p.prozess.projekt, p.umfang.grundlage)
  const v = zahl(m.vorgaengeProTag, 1)
  const saetze = [`${betrieb} sucht ${art}${basis.name ? ` für den Prozess „${basis.name}“` : ''}.`, v === '1' ? 'Heute läuft 1 Vorgang pro Tag.' : `Heute laufen ${v} Vorgänge pro Tag.`]
  const n = m.medienbrueche.reduce((s, b) => s + b.uebertragungenProTag, 0)
  const minuten = m.medienbrueche.reduce((s, b) => s + b.minutenProTag, 0)
  if (n > 0) {
    const stunden = mitEinheit(zahl(minuten / 60, 1), 'Stunde', 'Stunden')
    const anzahl = proTag(n)
    saetze.push(anzahl === '1' ? `Dabei wird täglich 1 Datensatz von Hand übertragen (${stunden}).` : `Dabei werden täglich ${anzahl} Datensätze von Hand übertragen (${stunden}).`)
  }
  return saetze.join(' ')
}

/** M5: Arbeitszeitkosten des Prozesses pro Jahr, Ist und (falls vorhanden) Soll, je mit eigenen Vorgängen pro Tag. */
export function arbeitszeitkostenProJahr(p: AuswahlProjekt): { ist: number; soll: number | null } | null {
  if (!p.prozess) return null
  const pl = p.prozess.projekt
  const tage = p.rahmen.betriebstageProJahr
  return {
    ist: kostenProVorgang(pl.ist) * pl.ist.vorgaengeProTag * tage,
    soll: pl.soll ? kostenProVorgang(pl.soll) * pl.soll.vorgaengeProTag * tage : null,
  }
}

/** Abschnitt 3 der Entscheidungsvorlage als Aufzählung. */
export function ausgangslagePunkte(p: AuswahlProjekt, m: Mengengeruest | null = mengengeruestVon(p)): string[] {
  if (!p.prozess || !p.umfang || !m) return ['Ohne Prozessmodell: Grundlage sind Katalog, Bausteine und eigene Anforderungen.']
  const basis = grundlageVon(p.prozess.projekt, p.umfang.grundlage)
  const n = m.medienbrueche.reduce((s, b) => s + b.uebertragungenProTag, 0)
  const minuten = m.medienbrueche.reduce((s, b) => s + b.minutenProTag, 0)
  const kosten = arbeitszeitkostenProJahr(p)!
  return [
    `Prozess „${basis.name || 'ohne Namen'}“ (${p.umfang.grundlage === 'soll' ? 'Soll-Prozess' : 'Ist-Prozess'} als Grundlage), ${mitEinheit(zahl(m.vorgaengeProTag, 1), 'Vorgang', 'Vorgänge')} pro Tag.`,
    n > 0
      ? `Medienbrüche: ${mitEinheit(proTag(n), 'Übertragung', 'Übertragungen')} von Hand pro Tag, zusammen ${mitEinheit(zahl(minuten / 60, 1), 'Stunde', 'Stunden')}.`
      : 'Keine Medienbrüche im Modell.',
    `Arbeitszeitkosten des Prozesses: ${euro(kosten.ist)} pro Jahr im Ist${kosten.soll !== null ? `, ${euro(kosten.soll)} im Soll` : ''}.`,
  ]
}

/** Abschnitt 4 der Entscheidungsvorlage: Vorgehen. */
export function vorgehenPunkte(p: AuswahlProjekt, g: Gesamt): string[] {
  const m = p.anforderungen.filter(istKo).length
  const gw = p.gewichtung
  const haupt = Object.entries(g.auswertung.gewichte) as [Gruppe, number][]
  const punkte = [`Muss-Anforderungen sind K.-o.-Kriterien: Ein Angebot, das eine davon nicht erfüllt, scheidet aus (${m} ${m === 1 ? 'Muss-Kriterium' : 'Muss-Kriterien'}).`]
  const liste = haupt.map(([x, w]) => `${gruppenName(x)} ${fest(w * 100, 1)} %`).join(', ')
  if (haupt.length === 1) punkte.push(`Ein Hauptkriterium: ${gruppenName(haupt[0][0])} mit 100 %.`)
  else if (gw.methode === 'paarvergleich' && g.auswertung.ahp) {
    const ahp = g.auswertung.ahp
    punkte.push(`Gewichte per Paarvergleich (AHP, Eigenvektorverfahren): ${liste}. Konsistenz CR ${fest(ahp.cr, 2)} (${ahp.stimmig ? `stimmig, Grenze ${fest(CR_GRENZE, 2)}` : 'widersprüchlich'}).`)
  } else if (haupt.length > 0) punkte.push(`Gewichte direkt vergeben: ${liste}.`)
  else punkte.push('Die Gewichte sind noch unvollständig.')
  punkte.push(`Punkteskala je Soll- und Kann-Anforderung von 0 bis 10: ${PUNKTESKALA}.`)
  const regel = p.entscheidung.regel === 'preis_leistung' ? `${REGEL_NAME.preis_leistung} (Mindestnutzwert ${zahl(p.entscheidung.mindestNutzwert, 2)})` : REGEL_NAME.nutzwert
  const w = p.wirtschaftlichkeit
  punkte.push(`Entscheidungsregel: ${regel}.${w.budgetEuro !== null ? ` Budget ${euro(w.budgetEuro)}${w.budgetAlsKo ? ' als K.-o.-Kriterium' : ' als Richtwert'}.` : ''}`)
  punkte.push(gw.festgelegtAm ? `Gewichte und Regel festgelegt am ${datum(gw.festgelegtAm)}.` : 'Gewichte und Regel wurden nicht ausdrücklich festgelegt.')
  if (p.bewertungBegonnenAm) {
    punkte.push(
      gw.aenderungenNachBewertung > 0
        ? `Nach Beginn der Bewertung am ${datum(p.bewertungBegonnenAm)} wurden Gewichte, Punkte oder Regel ${gw.aenderungenNachBewertung}-mal geändert.`
        : `Nach Beginn der Bewertung am ${datum(p.bewertungBegonnenAm)} wurden Gewichte und Regel nicht geändert.`,
    )
  }
  return punkte
}

/** Titel für Drucken und „als PDF“: „Neue Warenwirtschaft – Lastenheft“. */
export function druckTitel(p: AuswahlProjekt, was: 'Lastenheft' | 'Entscheidungsvorlage'): string {
  return dateiname(p.rahmen.vorhaben, ` – ${was}`, 'pdf').replace(/\.pdf$/, '')
}
