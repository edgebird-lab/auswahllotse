/**
 * Export im offenen Format Beratungsakte v1 (Kopie der Bibliothek in
 * src/beratungsakte). Die Akte fasst das Ergebnis der Softwareauswahl
 * zusammen, wie es die Schritte „Ergebnis“ und „Vorlagen“ zeigen; gerechnet
 * wird hier nichts Neues, nur mit `berechneGesamt` wie in der Oberfläche.
 *
 * - Kennzahlen: Anforderungen (aktiv, Muss, Soll, Kann, Muss-Anteil), Zahl der
 *   Angebote; je Angebot K.-o.-Prüfung, Nutzwert, Rang, einmalige Kosten,
 *   Gesamtkosten, Kapitalwert, Amortisation und € je Nutzwertpunkt (soweit die
 *   App sie ausweist); je Hauptkriterium der stabile Bereich der Sensitivität.
 * - Befunde: alle Befunde der Liste im Schritt „Ergebnis“, dazu die Gründe,
 *   aus denen ein Angebot ausscheidet (K.-o.-Prüfung), knappe stabile Bereiche,
 *   eine vorläufige Empfehlung und die erfassten Risiken der Entscheidung.
 * - Maßnahmen: die Wahl des Angebots (eigene Wahl oder Empfehlung der Regel)
 *   und die Maßnahmen zu den Risiken.
 *
 * Abbildung der Stufen:
 *
 * | Auswahl-Lotse                           | Beratungsakte        |
 * | --------------------------------------- | -------------------- |
 * | Befund `fehler`                         | `hoch`               |
 * | Befund `warnung`                        | `mittel`             |
 * | Befund `hinweis`                        | `niedrig`            |
 * | Angebot scheidet aus (K.-o., Budget)    | `hoch`               |
 * | stabiler Bereich „knapp“                | `mittel`             |
 * | Empfehlung „vorläufig“                  | `mittel`             |
 * | Risiko der Entscheidung (ohne Stufe)    | `mittel`             |
 * | Wahl des Angebots                       | Priorität `hoch`     |
 * | Maßnahme zu einem Risiko                | Priorität `mittel`   |
 *
 * Den Aufwand der Wahl nennt die Akte mit den Kosten des Angebots; für die
 * Maßnahmen zu Risiken kennt die App keinen Aufwand („nicht geschätzt“). Die
 * Wahl bezieht sich auf die Befunde zur Entscheidung (D4 bis D6) und auf
 * „vorläufig“, eine Maßnahme zu einem Risiko auf dieses Risiko.
 */
import { erzeugeBeratungsakte, zeitpunktMitVersatz, type Befund as AkteBefund, type Beratungsakte, type Kennzahl, type Massnahme as AkteMassnahme, type Schwere as AkteSchwere } from '../beratungsakte/beratungsakte'
import { angebotsname } from '../bewertung/nutzwert'
import { stabilitaetText } from '../bewertung/sensitivitaet'
import { berechneGesamt, type Gesamt } from '../entscheidung/gesamt'
import { jahreFuerRechnung } from '../kosten/kosten'
import type { Befund, Schwere } from '../modell/ergebnisse'
import { gruppenName, type AuswahlProjekt, type Gruppe, type Prioritaet } from '../modell/typen'
import { euro, nutzwert } from '../modell/zahlformat'
import { MUSS_ANTEIL_GRENZE } from '../regeln/schwellen'
import { zielVonBefund } from '../ui/befundziel'
import { befundMitAnforderung, kostenbasisText } from '../ui/texte'
import { VERSION } from '../version'
import { SCHRITTE, schrittNummer, type Schritt } from '../zustand'
import { REGEL_NAME } from './vorlagen'

export const APP_KENNUNG = 'auswahllotse'

export const SCHWERE_IN_AKTE: Record<Schwere, AkteSchwere> = {
  fehler: 'hoch',
  warnung: 'mittel',
  hinweis: 'niedrig',
}

export interface AkteAngaben {
  projekt: AuswahlProjekt
  mandant: { name: string; kennung?: string }
  jetzt: Date
  /** Name der gespeicherten Projektdatei, falls es eine gibt. */
  quelldatei?: string | null
  /** schon berechnete Ergebnisse (Oberfläche); sonst rechnet die Funktion selbst */
  gesamt?: Gesamt
}

/** Vorbelegung für den Mandanten: der Betrieb aus dem Schritt „Rahmen“. */
export function mandantAusProjekt(projekt: AuswahlProjekt): string {
  return projekt.rahmen.betrieb.trim()
}

const runde = (n: number, stellen = 2) => Math.round(n * 10 ** stellen) / 10 ** stellen

/** Kennungen in der Akte: nur ASCII-Buchstaben, Ziffern und `. _ : -`, höchstens 64 Zeichen, je Liste eindeutig. */
function kennungen() {
  const vergeben = new Set<string>()
  return (schluessel: string): string => {
    const basis = schluessel.replace(/[^A-Za-z0-9._:-]/g, '_').replace(/^[^A-Za-z0-9]+/, '').slice(0, 60) || 'eintrag'
    let k = basis
    for (let i = 2; vergeben.has(k); i++) k = `${basis}-${i}`
    vergeben.add(k)
    return k
  }
}

/** Schritt als Text wie in der Schrittleiste: „Schritt 6 · Ergebnis“. */
function schrittText(s: Schritt): string {
  return `Schritt ${schrittNummer(s)} · ${SCHRITTE.find((x) => x.id === s)?.name ?? s}`
}

/** Fundstelle eines Befunds: der Schritt, zu dem „Zur Stelle“ springt, und das betroffene Objekt. */
function fundstelle(p: AuswahlProjekt, b: Befund): string {
  const ziel = zielVonBefund(b, p.angebote.map((a) => a.id))
  const teile = [schrittText(ziel.schritt)]
  const bezug = b.bezug
  const anforderung = bezug === null ? undefined : p.anforderungen.find((a) => a.id === bezug)
  const angebot = bezug === null ? undefined : p.angebote.find((a) => a.id === bezug)
  if (anforderung) teile.push(`Anforderung ${anforderung.nummer ?? `„${anforderung.titel || 'ohne Titel'}“`}`)
  else if (angebot) teile.push(angebotsname(angebot))
  else if (bezug?.startsWith('gruppe:')) teile.push(`Gruppe „${gruppenName(bezug.slice('gruppe:'.length) as Gruppe)}“`)
  return teile.join(', ')
}

const satz = (text: string) => (/[.?!]$/.test(text) ? text : `${text}.`)

function kennzahlen(p: AuswahlProjekt, g: Gesamt): Kennzahl[] {
  const w = g.auswertung
  const aktiv = p.anforderungen.filter((a) => a.status === 'aktiv')
  const anzahl = (prio: Prioritaet) => aktiv.filter((a) => a.prioritaet === prio).length
  const liste: Kennzahl[] = [
    { kennung: 'anforderungen-aktiv', name: 'Aktive Anforderungen', wert: g.pruefung.aktiv, einheit: 'Anzahl' },
    { kennung: 'anforderungen-muss', name: 'Muss-Anforderungen', wert: anzahl('muss'), einheit: 'Anzahl' },
    { kennung: 'anforderungen-soll', name: 'Soll-Anforderungen', wert: anzahl('soll'), einheit: 'Anzahl' },
    { kennung: 'anforderungen-kann', name: 'Kann-Anforderungen', wert: anzahl('kann'), einheit: 'Anzahl' },
    { kennung: 'angebote', name: 'Angebote', wert: p.angebote.length, einheit: 'Anzahl' },
    { kennung: 'angebote-gueltig', name: 'Gültige Angebote (K.-o.-Prüfung bestanden)', wert: w.ergebnisse.filter((r) => r.gueltig).length, einheit: 'Anzahl' },
  ]
  const mussAnteil = g.pruefung.mussAnteil
  if (mussAnteil !== null) {
    // Die App markiert einen Muss-Anteil über 60 % (P7)
    liste.splice(4, 0, { kennung: 'muss-anteil', name: 'Muss-Anteil', wert: runde(mussAnteil * 100, 1), einheit: '%', bewertung: mussAnteil > MUSS_ANTEIL_GRENZE ? 'mittel' : 'gut' })
  }

  const kennung = kennungen()
  const jahre = jahreFuerRechnung(p.wirtschaftlichkeit.jahre)
  const nutzen = p.wirtschaftlichkeit.nutzenProJahrEuro
  const mitNutzwert = Object.keys(w.gewichte).length > 0
  for (const r of w.ergebnisse) {
    const a = p.angebote.find((x) => x.id === r.angebotId)
    const name = a ? angebotsname(a) : 'Angebot'
    const id = r.angebotId
    const k = (art: string, titel: string, wert: number | string, einheit: string, extra: Partial<Kennzahl> = {}): Kennzahl => ({
      kennung: kennung(`${art}:${id}`),
      name: `${titel}: ${name}`,
      wert,
      einheit,
      ...extra,
      erweiterungen: { [APP_KENNUNG]: { angebotId: id, ...(extra.erweiterungen?.[APP_KENNUNG] ?? {}) } },
    })
    liste.push(
      k('ko', 'K.-o.-Prüfung', r.gueltig ? 'gültig' : 'ausgeschieden', '', { bewertung: r.gueltig ? 'gut' : 'schlecht', erweiterungen: { [APP_KENNUNG]: { koOffen: r.koOffen, ausschluss: r.ausschluss } } }),
    )
    if (mitNutzwert) {
      liste.push(
        k('nutzwert', 'Nutzwert (0 bis 10)', runde(r.nutzwert), 'Punkte', { erweiterungen: { [APP_KENNUNG]: { bewertungenFehlen: r.fehlend } } }),
        k('rang', 'Rang', r.rang ?? (r.gueltig ? 'nicht zulässig' : 'ausgeschieden'), '', r.rang === 1 ? { bewertung: 'gut' } : {}),
      )
    }
    liste.push(k('einmalig', 'Einmalige Kosten', runde(r.kosten.einmalig), '€'), k('gesamtkosten', `Gesamtkosten über ${jahre === 1 ? '1 Jahr' : `${jahre} Jahre`}`, runde(r.kosten.tco), '€'))
    if (r.kosten.kapitalwert !== null) liste.push(k('kapitalwert', 'Kapitalwert', runde(r.kosten.kapitalwert), '€'))
    if (nutzen !== null) {
      const bis = `nicht innerhalb von ${jahre === 1 ? '1 Jahr' : `${jahre} Jahren`}`
      liste.push(k('amortisation', 'Amortisation', r.kosten.amortisationJahr === null ? bis : `im ${r.kosten.amortisationJahr}. Jahr`, '', { erweiterungen: { [APP_KENNUNG]: { jahr: r.kosten.amortisationJahr } } }))
    }
    if (mitNutzwert && r.euroJePunkt !== null) liste.push(k('euro-je-punkt', '€ je Nutzwertpunkt', runde(r.euroJePunkt), '€'))
  }

  for (const s of w.stabilitaet) {
    liste.push({
      kennung: `stabil:${s.gruppe}`,
      name: `Stabiler Bereich des Gewichts: ${gruppenName(s.gruppe)}`,
      wert: stabilitaetText(s).slice(gruppenName(s.gruppe).length + 2),
      einheit: '',
      bewertung: s.knapp ? 'mittel' : 'gut',
      erweiterungen: { [APP_KENNUNG]: { gewicht: runde(s.gewicht, 4), von: runde(s.von, 4), bis: runde(s.bis, 4), abstand: s.abstand === null ? null : runde(s.abstand, 4) } },
    })
  }
  return liste
}

/** Baut die Akte aus dem Projekt. Wirft, wenn der Mandant fehlt. */
export function beratungsakteAusProjekt({ projekt: p, mandant, jetzt, quelldatei, gesamt }: AkteAngaben): Beratungsakte {
  if (!mandant.name.trim()) throw new Error('Bitte den Mandanten angeben.')
  const g = gesamt ?? berechneGesamt(p)
  const w = g.auswertung
  const name = (id: string | null): string => {
    const a = p.angebote.find((x) => x.id === id)
    return a ? angebotsname(a) : 'Angebot'
  }

  const befundKennung = kennungen()
  const befunde: AkteBefund[] = []
  const neuerBefund = (schluessel: string, schwere: AkteSchwere, text: string, ort: string, ns: Record<string, unknown>): string => {
    const kennung = befundKennung(schluessel)
    befunde.push({ kennung, schwere, text: satz(text), fundstelle: ort, erweiterungen: { [APP_KENNUNG]: ns } })
    return kennung
  }

  // Befunde der Liste im Schritt „Ergebnis“ (Fehler, Warnungen, Hinweise)
  const ausListe = new Map<Befund, string>()
  for (const b of g.befunde) {
    const kennung = neuerBefund(`${b.code}${b.bezug ? `:${b.bezug}` : ''}`, SCHWERE_IN_AKTE[b.schwere], befundMitAnforderung(b, p.anforderungen), fundstelle(p, b), {
      code: b.code,
      schwere: b.schwere,
    })
    ausListe.set(b, kennung)
  }
  // K.-o.-Prüfung: Gründe, aus denen ein Angebot ausscheidet
  for (const r of w.ergebnisse) {
    for (const grund of r.ausschluss) {
      neuerBefund(`ausschluss:${r.angebotId}`, 'hoch', `${name(r.angebotId)} scheidet aus: ${grund}`, `${schrittText('ergebnis')}, K.-o.-Prüfung`, { angebotId: r.angebotId, grund })
    }
  }
  // Sensitivität: knappe stabile Bereiche
  for (const s of w.stabilitaet.filter((x) => x.knapp)) {
    neuerBefund(`knapp:${s.gruppe}`, 'mittel', `Knapper stabiler Bereich: ${stabilitaetText(s)}. Schon eine kleine Änderung dieses Gewichts ändert die Empfehlung`, `${schrittText('ergebnis')}, Sensitivität der Gewichte`, {
      gruppe: s.gruppe,
    })
  }
  const entscheidungsBefunde = g.befunde.filter((b) => b.code === 'D4' || b.code === 'D5' || b.code === 'D6').map((b) => ausListe.get(b)!)
  if (w.vorlaeufig && w.empfehlungId !== null) {
    entscheidungsBefunde.push(
      neuerBefund('vorlaeufig', 'mittel', 'Die Empfehlung ist vorläufig: Bei gültigen Angeboten fehlen noch Bewertungen oder K.-o.-Prüfungen', `${schrittText('ergebnis')}, Empfehlung`, {
        offen: w.ergebnisse.filter((r) => r.gueltig && (r.koOffen > 0 || r.fehlend > 0)).map((r) => ({ angebotId: r.angebotId, koOffen: r.koOffen, bewertungenFehlen: r.fehlend })),
      }),
    )
  }
  // Risiken der Entscheidung (Schritt „Vorlagen“) mit ihren Maßnahmen
  const risiken = p.entscheidung.risiken.filter((r) => r.text.trim() || r.massnahme.trim())
  const risikoKennung = new Map<string, string>()
  risiken.forEach((r, i) => {
    risikoKennung.set(r.id, neuerBefund(`risiko:${r.id}`, 'mittel', r.text.trim() || 'Risiko ohne Beschreibung', `${schrittText('vorlagen')}, Risiko ${i + 1}`, { risikoId: r.id }))
  })

  const massnahmeKennung = kennungen()
  const massnahmen: AkteMassnahme[] = []
  const gewaehlt = p.angebote.find((a) => a.id === g.gewaehltId)
  const ergebnis = w.ergebnisse.find((r) => r.angebotId === g.gewaehltId)
  if (gewaehlt && ergebnis) {
    const abweichend = gewaehlt.id !== w.empfehlungId
    const herkunft = abweichend ? 'eigene Wahl, abweichend von der Empfehlung der Regel' : `Empfehlung nach der Regel „${REGEL_NAME[p.entscheidung.regel]}“`
    massnahmen.push({
      kennung: massnahmeKennung(`wahl:${gewaehlt.id}`),
      text: `${angebotsname(gewaehlt)}${gewaehlt.produkt && gewaehlt.produkt !== angebotsname(gewaehlt) ? ` (${gewaehlt.produkt})` : ''} wählen (${herkunft}; Nutzwert ${nutzwert(ergebnis.nutzwert)} von 10).`,
      prioritaet: 'hoch',
      aufwand: `${euro(ergebnis.kosten.einmalig)} einmalig, ${kostenbasisText(p)} ${euro(ergebnis.kostenbasis)}`,
      befunde: entscheidungsBefunde,
      erweiterungen: {
        [APP_KENNUNG]: { art: 'wahl', angebotId: gewaehlt.id, abweichend, regel: p.entscheidung.regel, status: p.entscheidung.status, vorlaeufig: w.vorlaeufig },
      },
    })
  }
  for (const r of risiken.filter((x) => x.massnahme.trim())) {
    massnahmen.push({
      kennung: massnahmeKennung(`risiko:${r.id}`),
      text: satz(r.massnahme.trim()),
      prioritaet: 'mittel',
      aufwand: 'nicht geschätzt',
      befunde: [risikoKennung.get(r.id)!],
      erweiterungen: { [APP_KENNUNG]: { art: 'risiko', risikoId: r.id } },
    })
  }

  // Stand: Datum der finalen Entscheidung, sonst heute
  const stand = p.entscheidung.status === 'final' && p.entscheidung.datum && !Number.isNaN(Date.parse(p.entscheidung.datum)) ? new Date(p.entscheidung.datum) : jetzt
  return erzeugeBeratungsakte({
    app: { kennung: APP_KENNUNG, name: 'Auswahl-Lotse', version: VERSION },
    mandant: { name: mandant.name.trim(), kennung: mandant.kennung?.trim() || undefined },
    analyse: { art: 'softwareauswahl', titel: p.rahmen.vorhaben.trim() || 'Vorhaben ohne Namen', stand: zeitpunktMitVersatz(stand).slice(0, 10), quelldatei: quelldatei ?? undefined },
    kennzahlen: kennzahlen(p, g),
    befunde,
    massnahmen,
    erweiterungen: {
      [APP_KENNUNG]: {
        softwareart: p.rahmen.softwareart,
        regel: p.entscheidung.regel,
        status: p.entscheidung.status,
        empfehlungId: w.empfehlungId,
        gewaehltId: g.gewaehltId,
        vorlaeufig: w.vorlaeufig,
        gewichteProzent: Object.fromEntries(Object.entries(w.gewichte).map(([gruppe, x]) => [gruppe, runde((x ?? 0) * 100, 1)])),
      },
    },
    erzeugtAm: jetzt,
  })
}

