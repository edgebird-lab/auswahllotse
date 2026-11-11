/**
 * Begründungsentwurf aus festen Textbausteinen (Spezifikation 6.13, Sätze 1
 * bis 9). Der Entwurf beschreibt die Empfehlung der Regel; wählt der Nutzer
 * ein anderes Angebot, schreibt er die Begründung selbst (Warnung D4).
 */
import type { AngebotsErgebnis, Auswertung } from '../modell/ergebnisse'
import { euro, euroGenau, fest, nutzwert, prozent, zahl } from '../modell/zahlformat'
import { gruppenName, type Angebot, type AuswahlProjekt, type Id } from '../modell/typen'
import { istKo } from '../bewertung/gewichte'
import { angebotsname, kurzname } from '../bewertung/nutzwert'
import { jahreFuerRechnung } from '../kosten/kosten'
import { istZulaessig } from './regel'

/** „1 Jahr“, „5 Jahre“ */
export const jahreText = (t: number) => (t === 1 ? '1 Jahr' : `${t} Jahre`)
const jahrenText = (t: number) => (t === 1 ? '1 Jahr' : `${t} Jahren`)

/** Höchstens so viele Nummern je ausgeschiedenem Angebot, dann „und {k} weitere“. */
export const NUMMERN_MAX = 3

/** „Muss-Kriterium F-03 nicht erfüllt“, „Muss-Kriterien F-03, F-05, F-07 und 2 weitere nicht erfüllt“ */
export function mussGrund(nummern: readonly string[]): string {
  if (nummern.length === 1) return `Muss-Kriterium ${nummern[0]} nicht erfüllt`
  const gezeigt = nummern.slice(0, NUMMERN_MAX)
  const rest = nummern.length - gezeigt.length
  const liste = rest > 0 ? `${gezeigt.join(', ')} und ${rest} weitere` : `${gezeigt.slice(0, -1).join(', ')} und ${gezeigt[gezeigt.length - 1]}`
  return `Muss-Kriterien ${liste} nicht erfüllt`
}

function name(a: Angebot | undefined): string {
  return a ? angebotsname(a) : 'Angebot'
}

/** Gründe, aus denen ein Angebot nicht in Frage kommt (Satz 6). */
export function ausscheidungsGruende(p: AuswahlProjekt, r: AngebotsErgebnis): string[] {
  const angebot = p.angebote.find((a) => a.id === r.angebotId)
  const gruende: string[] = []
  const nichtErfuellt = p.anforderungen.filter((a) => istKo(a) && angebot?.bewertungen[a.id]?.ko === 'nicht_erfuellt').map(kurzname)
  if (nichtErfuellt.length > 0) gruende.push(mussGrund(nichtErfuellt))
  if (r.ausschluss.includes('über Budget')) gruende.push('über Budget')
  if (r.gueltig && !istZulaessig(r, p.entscheidung.regel, p.entscheidung.mindestNutzwert)) {
    gruende.push(`Nutzwert ${nutzwert(r.nutzwert)} unter dem Mindestnutzwert ${zahl(p.entscheidung.mindestNutzwert, 2)}`)
  }
  return gruende
}

/** Die Sätze des Entwurfs; leer, wenn es keine Empfehlung gibt. */
export function begruendungsSaetze(p: AuswahlProjekt, w: Auswertung): string[] {
  const b = w.ergebnisse.find((r) => r.angebotId === w.empfehlungId)
  const angebot = p.angebote.find((a) => a.id === w.empfehlungId)
  if (!b || !angebot) return []
  const nachId = new Map<Id, Angebot>(p.angebote.map((a) => [a.id, a]))
  const saetze: string[] = []

  // 1
  saetze.push(angebot.produkt ? `Empfohlen wird ${angebotsname(angebot)} (${angebot.produkt}).` : `Empfohlen wird ${angebotsname(angebot)}.`)

  // 2a, 2b
  const m = p.anforderungen.filter(istKo).length
  if (m > 0) {
    if (b.koOffen === 0) saetze.push(m === 1 ? 'Das Angebot erfüllt das einzige Muss-Kriterium.' : `Das Angebot erfüllt alle ${m} Muss-Kriterien.`)
    else saetze.push(m === 1 ? 'Beim einzigen Muss-Kriterium steht die Prüfung noch aus.' : `Bei ${b.koOffen} von ${m} Muss-Kriterien steht die Prüfung noch aus.`)
  }

  // 3a, 3b, 3c
  const gueltig = w.ergebnisse.filter((r) => r.gueltig)
  if (p.entscheidung.regel === 'nutzwert') {
    const zweiter = gueltig.filter((r) => r !== b).sort((x, y) => y.nutzwert - x.nutzwert || (x.rang ?? Infinity) - (y.rang ?? Infinity))[0]
    if (!zweiter) saetze.push(`Es ist das einzige gültige Angebot; Nutzwert ${nutzwert(b.nutzwert)} von 10 Punkten.`)
    else if (zweiter.rang === b.rang) {
      // Gleichstand an der Spitze (N5): D1 wählt das günstigere Angebot
      saetze.push(`Es liegt mit ${nutzwert(b.nutzwert)} von 10 Punkten gleichauf mit ${name(nachId.get(zweiter.angebotId))} und ist das günstigere Angebot.`)
    } else {
      saetze.push(`Es erreicht mit ${nutzwert(b.nutzwert)} von 10 Punkten den höchsten Nutzwert, ${fest(b.nutzwert - zweiter.nutzwert, 2)} Punkte vor ${name(nachId.get(zweiter.angebotId))}.`)
    }
  } else if (b.euroJePunkt !== null) {
    saetze.push(
      `Es hat mit ${euroGenau(b.euroJePunkt)} je Nutzwertpunkt das beste Preis-Leistungs-Verhältnis unter den Angeboten mit mindestens ${zahl(p.entscheidung.mindestNutzwert, 2)} Punkten.`,
    )
  }

  // 4: Platz nach Kostenbasis unter den gültigen Angeboten, gleiche Kosten teilen sich den Platz
  const w8 = p.wirtschaftlichkeit
  const jahre = jahreFuerRechnung(w8.jahre)
  const platz = 1 + gueltig.filter((r) => r.kostenbasis < b.kostenbasis - 1e-6).length
  const basis = w8.kostenbasis === 'barwert' && w8.zinsProzent !== null ? `Barwert bei ${zahl(w8.zinsProzent, 2)} % Zins` : 'nominal'
  saetze.push(`Die Kosten über ${jahreText(jahre)} betragen ${euro(b.kostenbasis)} (${basis}), Platz ${platz} von ${gueltig.length}.`)

  // 5
  const u = w8.nutzenProJahrEuro
  if (u !== null) {
    const t = b.kosten.amortisationJahr
    const bezahlt = t !== null ? `hat sich die Einführung im ${t}. Jahr bezahlt gemacht` : `macht sich die Einführung in ${jahrenText(jahre)} nicht bezahlt`
    if (b.kosten.kapitalwert !== null) {
      const nachsatz = t !== null ? `die Einführung hat sich im ${t}. Jahr bezahlt gemacht` : `die Einführung macht sich in ${jahrenText(jahre)} nicht bezahlt`
      saetze.push(`Bei ${euro(u)} Nutzen pro Jahr beträgt der Kapitalwert ${euro(b.kosten.kapitalwert)}; ${nachsatz}.`)
    } else {
      saetze.push(`Bei ${euro(u)} Nutzen pro Jahr ${bezahlt}.`)
    }
  }

  // 6
  const ausgeschieden = w.ergebnisse
    .filter((r) => r !== b)
    .map((r) => ({ r, gruende: ausscheidungsGruende(p, r) }))
    .filter((x) => x.gruende.length > 0)
    .map((x) => `${name(nachId.get(x.r.angebotId))} (${x.gruende.join(', ')})`)
  if (ausgeschieden.length > 0) saetze.push(`Ausgeschieden: ${ausgeschieden.join('; ')}.`)

  // 7a, 7b
  if (w.stabilitaet.length > 0) {
    const knapp = w.stabilitaet.filter((s) => s.knapp && s.abstand !== null).sort((x, y) => x.abstand! - y.abstand!)[0]
    if (knapp) {
      // Richtung: Liegt die nähere Grenze unter dem heutigen Gewicht, kippt die Empfehlung bei weniger Gewicht
      const weniger = knapp.von > 0 && Math.abs(knapp.gewicht - knapp.von - knapp.abstand!) < 1e-12
      saetze.push(
        `Das Ergebnis ist knapp: Schon ${fest(knapp.abstand! * 100, 1)} Prozentpunkte ${weniger ? 'weniger' : 'mehr'} Gewicht für „${gruppenName(knapp.gruppe)}“ ändern die Empfehlung.`,
      )
    } else {
      const bereiche = w.stabilitaet.map((s) => `${gruppenName(s.gruppe)} ${prozent(s.von)}–${prozent(s.bis)} %`)
      saetze.push(`Die Empfehlung bleibt gleich, solange die Gewichte in diesen Bereichen liegen: ${bereiche.join('; ')}.`)
    }
  }

  // 8
  const z = p.gewichtung.aenderungenNachBewertung
  if (z > 0) saetze.push(`Hinweis: Gewichte oder Regel wurden nach Beginn der Bewertung ${z}-mal geändert.`)

  // 9
  if (w.vorlaeufig) {
    const f = gueltig.reduce((s, r) => s + r.fehlend, 0)
    const o = gueltig.reduce((s, r) => s + r.koOffen, 0)
    const teile = [
      ...(f > 0 ? [f === 1 ? '1 Bewertung fehlt' : `${f} Bewertungen fehlen`] : []),
      ...(o > 0 ? [o === 1 ? '1 K.-o.-Prüfung ist offen' : `${o} K.-o.-Prüfungen sind offen`] : []),
    ]
    saetze.push(`Das Ergebnis ist vorläufig: ${teile.join(', ')}.`)
  }
  return saetze
}

/** Entwurf als ein Absatz; leer ohne Empfehlung. */
export function begruendungsEntwurf(p: AuswahlProjekt, w: Auswertung): string {
  return begruendungsSaetze(p, w).join(' ')
}
