/**
 * Ableitung des Lastenhefts (Spezifikation 6.5, Regeln A0 bis A13).
 *
 * Aus dem Prozessmodell: Funktionen je Aufgabe im Umfang (A2),
 * Entscheidungs-Vorschläge (A3), Schnittstellen aus Medienbrüchen (A4),
 * Rollen, Freigaben und Prüfungen (A5 bis A7) und das Mengengerüst (A8).
 * Dazu der Katalog (A9) und die Bausteine der Softwareart (A10); ohne
 * Prozessmodell nur diese beiden (A11). Die Kennungen (A0) sind stabil,
 * damit „Neu einlesen“ abgleichen kann (abgleich.ts). Nummern vergibt erst
 * die Aktivierung (P11).
 */
import type { Medienbruch } from '../modell/ergebnisse'
import { euro, proTag, zahl } from '../modell/zahlformat'
import {
  GRUPPEN_REIHENFOLGE,
  type Anforderung,
  type AnforderungsStatus,
  type AuswahlProjekt,
  type Gruppe,
  type Herkunft,
  type Prioritaet,
  type Rahmen,
  type Umfang,
} from '../modell/typen'
import type { PlAufgabe, PlProjekt } from '../prozessdatei/format'
import { berechneMengengeruest } from '../prozessdatei/mengengeruest'
import { aufgabenVon, durchlaufe, findeAufgabe, grundlageVon, mediumVon, rolleVon } from '../prozessdatei/struktur'
import { MEDIENBRUCH_MUSS_MIN, MEDIENBRUCH_SOLL_MIN, NORMALFALL_SCHWELLE, PUNKTE_STANDARD } from '../regeln/schwellen'
import { BAUSTEIN_ABNAHME, BAUSTEINE, bausteinBegruendung, fuelleText, KATALOG, katalogBegruendung, werteAus } from './katalog'
import { findeMedium, medienbruchSchluessel } from './schnittstellen'
import { aufzaehlung, mitEinheit, modalverb, zitiert } from './texte'
import { statusVon } from './umfang'

/** Toleranz für Schwellen, damit 0,5 aus einer Rechnung nicht als 0,4999999 gilt. */
const EPS = 1e-9

interface Neu {
  id: string
  gruppe: Gruppe
  titel: string
  text: string
  abnahme: string
  prioritaet: Prioritaet
  status: AnforderungsStatus
  herkunft: Herkunft
  begruendung: string
  quelle?: string | null
}

/** Abgeleitete Anforderung mit Standardwerten (Punkte nach A13, nichts bearbeitet, ohne Nummer). */
export function abgeleitet(n: Neu): Anforderung {
  return {
    id: n.id,
    nummer: null,
    gruppe: n.gruppe,
    titel: n.titel,
    text: n.text,
    abnahme: n.abnahme,
    prioritaet: n.prioritaet,
    prioritaetVorschlag: n.prioritaet,
    status: n.status,
    herkunft: n.herkunft,
    begruendung: n.begruendung,
    quelle: n.quelle ?? null,
    punkte: PUNKTE_STANDARD[n.prioritaet],
    bearbeitet: { text: false, prioritaet: false, status: false },
    notiz: '',
  }
}

const herkunft = (art: Herkunft['art'], bezuege: (string | null)[], katalogId: string | null = null): Herkunft => ({
  art,
  bezuege: bezuege.filter((b): b is string => b !== null),
  katalogId,
})

const minuten = (m: number) => mitEinheit(zahl(m, 2), 'Minute', 'Minuten')

// ── A2 Funktion je Aufgabe im Umfang ───────────────────────────────────────

function funktion(a: PlAufgabe, h: number, pl: PlProjekt, umfang: Umfang): Anforderung {
  const basis = grundlageVon(pl, umfang.grundlage)
  const prioritaet: Prioritaet = h >= NORMALFALL_SCHWELLE - EPS ? 'muss' : 'soll'
  const rolle = rolleVon(basis, a.rolleId)
  const medium = mediumVon(basis, a.mediumId)
  const fuer = rolle ? `für die Rolle ${rolle.name}` : 'für alle Benutzer'
  const person = rolle ? `Eine Person der Rolle ${rolle.name}` : 'Eine Person'
  const zeit = a.bearbeitungMin > 0 ? `, in höchstens ${minuten(a.bearbeitungMin)}` : ''
  const heute = medium ? `, heute mit ${zitiert(medium.name)}` : ''
  return abgeleitet({
    id: `aufgabe:${a.id}`,
    gruppe: 'funktion',
    titel: a.name,
    text: `Die Software ${modalverb(prioritaet)} die Aufgabe ${zitiert(a.name)} ${fuer} unterstützen.`,
    abnahme: `Test mit Beispieldaten: ${person} erledigt ${zitiert(a.name)} vollständig in der Software, ohne Daten abzutippen${zeit}.`,
    prioritaet,
    status: 'aktiv',
    herkunft: herkunft('aufgabe', [a.id, a.rolleId, a.mediumId]),
    begruendung: `Aus dem Prozessmodell: ${proTag(h * basis.vorgaengeProTag)} Ausführungen pro Tag${heute}.`,
  })
}

// ── A4 Schnittstellen aus Medienbrüchen ────────────────────────────────────

function schnittstelle(mb: Medienbruch, pl: PlProjekt, umfang: Umfang, rahmen: Rahmen): Anforderung | null {
  if (mb.fall === 'E') return null
  const prioritaet: Prioritaet = mb.minutenProTag >= MEDIENBRUCH_MUSS_MIN - EPS ? 'muss' : mb.minutenProTag >= MEDIENBRUCH_SOLL_MIN - EPS ? 'soll' : 'kann'
  const verb = modalverb(prioritaet)
  const quelle = findeMedium(pl, mb.quelleId, umfang.grundlage)
  const ziel = findeMedium(pl, mb.zielId, umfang.grundlage)!
  const qName = quelle?.name ?? 'ohne System'
  const namen = mb.aufgaben.map((id) => findeAufgabe(pl, id, umfang.grundlage)?.name ?? id)
  const aufg = aufzaehlung(namen)
  const gelingt = namen.length > 1 ? 'gelingen' : 'gelingt'
  const zielAbloesen = statusVon(umfang, ziel, rahmen.softwareart) === 'abloesen'
  let titel: string
  let text: string
  let abnahme: string
  let zusatz = ''
  switch (mb.fall) {
    case 'A':
      titel = `Datenübernahme aus ${qName}`
      text = `Die Software ${verb} Daten aus ${zitiert(qName)} ohne erneute Eingabe für ${aufg} bereitstellen.`
      abnahme = `Test: Daten aus ${zitiert(qName)} erscheinen in ${aufg}, ohne sie abzutippen.`
      break
    case 'B':
    case 'D': {
      // das andere System ist das nicht abgelöste
      const system = zielAbloesen ? qName : ziel.name
      const richtung = zielAbloesen ? `von ${zitiert(qName)} in die Software` : `von der Software nach ${zitiert(ziel.name)}`
      titel = `Schnittstelle zu ${system}`
      text = `Die Software ${verb} Daten mit ${zitiert(system)} austauschen (${richtung}), damit niemand sie von Hand überträgt.`
      abnahme = `Test: Ein Datensatz gelangt ohne Abtippen von ${zitiert(qName)} nach ${zitiert(ziel.name)}; Fehler werden gemeldet.`
      if (mb.fall === 'D') zusatz = ` Vorschlag, weil ${zitiert(system)} unberührt bleibt.`
      break
    }
    case 'C':
      if (zielAbloesen) {
        // Quelle nicht digital (Papier, Telefon) oder unbekannt
        titel = quelle ? `Erfassung ohne ${quelle.name}` : 'Erfassung an der Quelle'
        const von = quelle ? ` von ${zitiert(quelle.name)}` : ''
        text = `Die Software ${verb} die Erfassung direkt bei der Entstehung ermöglichen, damit niemand Daten${von} abtippt (${aufg}).`
        abnahme = `Test: ${aufg} ${gelingt} ohne Papier- oder Telefonnotiz.`
      } else {
        titel = `Digitale Daten statt ${ziel.name}`
        text = `Die Software ${verb} die Daten für ${aufg} digital bereitstellen, damit niemand sie auf ${zitiert(ziel.name)} abschreibt.`
        abnahme = `Test: ${aufg} ${gelingt} ohne Abschreiben.`
      }
      break
  }
  return abgeleitet({
    id: `medienbruch:${medienbruchSchluessel(mb)}`,
    gruppe: 'schnittstelle',
    titel,
    text,
    abnahme,
    prioritaet,
    status: mb.fall === 'D' ? 'vorschlag' : 'aktiv',
    herkunft: herkunft('medienbruch', [mb.quelleId, mb.zielId, ...mb.aufgaben]),
    begruendung: `Heute ${mitEinheit(proTag(mb.uebertragungenProTag), 'Übertragung', 'Übertragungen')} und ${mitEinheit(proTag(mb.minutenProTag), 'Minute', 'Minuten')} pro Tag (${euro(mb.euroProTag)} pro Tag).${zusatz}`,
  })
}

// ── Anforderungen aus dem Prozessmodell ────────────────────────────────────

function ausDemModell(pl: PlProjekt, umfang: Umfang, rahmen: Rahmen): Anforderung[] {
  const mg = berechneMengengeruest(pl, umfang, rahmen)
  const basis = grundlageVon(pl, umfang.grundlage)
  const v = basis.vorgaengeProTag
  const imUmfang = new Set(mg.imUmfang)
  const aufgaben = aufgabenVon(basis).filter((a) => imUmfang.has(a.id))
  const h = (id: string) => mg.haeufigkeit.get(id) ?? 0
  const liste: Anforderung[] = []

  // A2
  for (const a of aufgaben) liste.push(funktion(a, h(a.id), pl, umfang))

  // A3: Daten-Entscheidung direkt nach einer Aufgabe im Umfang
  for (const { block, folge, index } of durchlaufe(basis.ablauf)) {
    if (block.typ !== 'entscheidung' || block.art !== 'daten' || index === 0) continue
    const vor = folge.schritte[index - 1]
    if (vor.typ !== 'aufgabe' || !imUmfang.has(vor.id)) continue
    const frage = block.frage || 'Entscheidung'
    liste.push(
      abgeleitet({
        id: `entscheidung:${block.id}`,
        gruppe: 'funktion',
        titel: frage,
        text: `Die Software ${modalverb('kann')} die Angaben für die Entscheidung ${zitiert(frage)} auf einen Blick zeigen.`,
        abnahme: `Test: Alle Angaben für ${zitiert(frage)} stehen auf einer Seite.`,
        prioritaet: 'kann',
        status: 'vorschlag',
        herkunft: herkunft('entscheidung', [block.id, vor.id]),
        begruendung: `Aus dem Prozessmodell: Entscheidung direkt nach ${zitiert(vor.name)}.`,
      }),
    )
  }

  // A4
  for (const mb of mg.medienbrueche) {
    const s = schnittstelle(mb, pl, umfang, rahmen)
    if (s) liste.push(s)
  }

  // A5
  if (mg.rollen.length > 0) {
    const r = mg.rollen.length
    const teile = mg.rollen.map((rm) => {
      const namen = rm.aufgaben.map((id) => aufgaben.find((a) => a.id === id)?.name ?? id)
      return `${rm.name} (${rm.benutzer} Benutzer): ${aufzaehlung(namen)}`
    })
    liste.push(
      abgeleitet({
        id: 'rollen',
        gruppe: 'benutzer',
        titel: 'Rollen und Rechte',
        text: `Die Software ${modalverb('muss')} ${r} ${r === 1 ? 'Rolle' : 'Rollen'} mit eigenen Rechten abbilden: ${teile.join('; ')}.`,
        abnahme: 'Test: Jede Rolle erledigt ihre Aufgaben; Aufgaben anderer Rollen sind gesperrt.',
        prioritaet: 'muss',
        status: 'aktiv',
        herkunft: herkunft('rollen', mg.rollen.map((rm) => rm.rolleId)),
        begruendung: `Aus dem Prozessmodell: ${r} ${r === 1 ? 'Rolle' : 'Rollen'} im Umfang, zusammen ${mg.benutzer} Benutzer.`,
      }),
    )
  }

  // A6 Freigaben, A7 Prüfungen
  for (const a of aufgaben.filter((x) => x.art === 'freigabe')) {
    const rolle = rolleVon(basis, a.rolleId)
    liste.push(
      abgeleitet({
        id: `freigabe:${a.id}`,
        gruppe: 'benutzer',
        titel: `Freigabe: ${a.name}`,
        text: rolle
          ? `Die Software ${modalverb('muss')} sicherstellen, dass nur die Rolle ${rolle.name} ${zitiert(a.name)} ausführt, und jede Freigabe mit Person und Zeitpunkt protokollieren.`
          : `Die Software ${modalverb('muss')} sicherstellen, dass nur berechtigte Personen ${zitiert(a.name)} ausführen, und jede Freigabe mit Person und Zeitpunkt protokollieren.`,
        abnahme: rolle
          ? `Test: Eine Person ohne die Rolle ${rolle.name} kann nicht freigeben; das Protokoll zeigt Person und Zeitpunkt.`
          : 'Test: Eine Person ohne Berechtigung kann nicht freigeben; das Protokoll zeigt Person und Zeitpunkt.',
        prioritaet: 'muss',
        status: 'aktiv',
        herkunft: herkunft('freigabe', [a.id, a.rolleId]),
        begruendung: `Aus dem Prozessmodell: Freigabe${rolle ? ` durch ${rolle.name}` : ''}, ${proTag(h(a.id) * v)} pro Tag.`,
      }),
    )
  }
  for (const a of aufgaben.filter((x) => x.art === 'pruefung')) {
    const rolle = rolleVon(basis, a.rolleId)
    liste.push(
      abgeleitet({
        id: `pruefung:${a.id}`,
        gruppe: 'benutzer',
        titel: `Prüfung: ${a.name}`,
        text: `Die Software ${modalverb('soll')} das Ergebnis der Prüfung ${zitiert(a.name)} mit Person und Zeitpunkt dokumentieren.`,
        abnahme: 'Test: Das Prüfergebnis ist am Vorgang sichtbar.',
        prioritaet: 'soll',
        status: 'aktiv',
        herkunft: herkunft('pruefung', [a.id, a.rolleId]),
        begruendung: `Aus dem Prozessmodell: Prüfung${rolle ? ` durch ${rolle.name}` : ''}, ${proTag(h(a.id) * v)} pro Tag.`,
      }),
    )
  }

  // A8 Mengengerüst
  const w = rahmen.richtwerte
  const vorgaenge = mitEinheit(zahl(v, 1), 'Vorgang', 'Vorgänge')
  liste.push(
    abgeleitet({
      id: 'menge:vorgaenge',
      gruppe: 'menge',
      titel: 'Vorgänge pro Tag',
      text: `Die Software ${modalverb('muss')} ${vorgaenge} pro Tag im Mittel und ${zahl(mg.vorgaengeSpitze, 0)} an starken Tagen verarbeiten (${zahl(mg.vorgaengeProJahr, 0)} pro Jahr).`,
      abnahme: 'Referenzbetrieb mit ähnlicher Menge oder Lasttest in der Teststellung.',
      prioritaet: 'muss',
      status: 'aktiv',
      herkunft: herkunft('mengengeruest', []),
      begruendung: `Aus dem Prozessmodell: ${vorgaenge} pro Tag, an starken Tagen ${zahl(rahmen.spitzenfaktor, 1)}-mal so viele, ${zahl(rahmen.betriebstageProJahr, 0)} Betriebstage im Jahr.`,
    }),
  )
  if (mg.benutzer > 0) {
    const b = mg.benutzer
    const benannt = b === 1 ? 'benannten Benutzer' : 'benannte Benutzer'
    liste.push(
      abgeleitet({
        id: 'menge:benutzer',
        gruppe: 'menge',
        titel: 'Benannte Benutzer',
        text: `Die Software ${modalverb('muss')} ${b} ${benannt} zulassen.`,
        abnahme: `Das Lizenzangebot deckt ${b} ${benannt}.`,
        prioritaet: 'muss',
        status: 'aktiv',
        herkunft: herkunft('mengengeruest', mg.rollen.map((r) => r.rolleId)),
        begruendung: `Aus den Rollen im Umfang: ${mg.rollen.map((r) => `${r.name} ${r.benutzer}`).join(', ')}.`,
      }),
    )
  }
  const sek = mitEinheit(zahl(w.antwortzeitSek, 1), 'Sekunde', 'Sekunden')
  liste.push(
    abgeleitet({
      id: 'menge:antwortzeit',
      gruppe: 'menge',
      titel: 'Antwortzeit',
      text: `Die Software ${modalverb('soll')} Standardaktionen (Öffnen, Speichern, Suchen) bei Spitzenlast in höchstens ${sek} ausführen.`,
      abnahme: `Messung in der Teststellung: keine von 10 Standardaktionen dauert länger als ${sek}.`,
      prioritaet: 'soll',
      status: 'aktiv',
      herkunft: herkunft('mengengeruest', []),
      begruendung: 'Richtwert aus dem Rahmen.',
    }),
  )
  const bestand = zahl(Math.round(mg.datenbestand), 0)
  const jahre = mitEinheit(zahl(w.aufbewahrungJahre, 1), 'Jahr', 'Jahren')
  liste.push(
    abgeleitet({
      id: 'menge:datenbestand',
      gruppe: 'menge',
      titel: 'Datenbestand',
      text: `Die Software ${modalverb('soll')} den Datenbestand von ${jahre} vorhalten, rund ${mitEinheit(bestand, 'Vorgang', 'Vorgänge')}, und dabei die Antwortzeit einhalten.`,
      abnahme: `Der Anbieter bestätigt die Antwortzeit bei ${mitEinheit(bestand, 'Vorgang', 'Vorgängen')} schriftlich.`,
      prioritaet: 'soll',
      status: 'aktiv',
      herkunft: herkunft('mengengeruest', []),
      begruendung: `${mitEinheit(zahl(mg.vorgaengeProJahr, 0), 'Vorgang', 'Vorgänge')} pro Jahr über die Aufbewahrungsdauer (längste Frist nach § 147 Abs. 3 AO).`,
    }),
  )
  return liste
}

// ── A9 Katalog, A10 Bausteine ──────────────────────────────────────────────

function ausDemKatalog(rahmen: Rahmen): Anforderung[] {
  const liste: Anforderung[] = []
  for (const e of KATALOG) {
    const wert = werteAus(e.bedingungen, rahmen)
    if (wert === 'nein') continue
    liste.push(
      abgeleitet({
        id: `katalog:${e.id}`,
        gruppe: e.gruppe,
        titel: e.titel,
        text: fuelleText(e.text, e.prioritaet, rahmen),
        abnahme: e.abnahme,
        prioritaet: e.prioritaet,
        status: wert === 'ja' && !e.nurVorschlag ? 'aktiv' : 'vorschlag',
        herkunft: herkunft('katalog', [], e.id),
        begruendung: katalogBegruendung(e, wert, rahmen),
        quelle: e.quelle,
      }),
    )
  }
  return liste
}

function ausDenBausteinen(rahmen: Rahmen): Anforderung[] {
  return BAUSTEINE.filter((b) => b.softwareart === rahmen.softwareart && werteAus(b.bedingungen, rahmen) !== 'nein').map((b) =>
    abgeleitet({
      id: `baustein:${b.id}`,
      gruppe: b.gruppe,
      titel: b.titel,
      text: fuelleText(b.text, b.prioritaet, rahmen),
      abnahme: BAUSTEIN_ABNAHME,
      prioritaet: b.prioritaet,
      status: 'vorschlag',
      herkunft: herkunft('baustein', [], b.id),
      begruendung: bausteinBegruendung(b),
      quelle: b.quelle,
    }),
  )
}

/**
 * Alle abgeleiteten Anforderungen in der Reihenfolge von A12: Gruppen in
 * fester Reihenfolge; darin Modell, Katalog, Bausteine in Erzeugungsfolge.
 */
export function leiteAnforderungenAb(projekt: Pick<AuswahlProjekt, 'rahmen' | 'prozess' | 'umfang'>): Anforderung[] {
  const { rahmen, prozess, umfang } = projekt
  const liste = [...(prozess && umfang ? ausDemModell(prozess.projekt, umfang, rahmen) : []), ...ausDemKatalog(rahmen), ...ausDenBausteinen(rahmen)]
  const rang = (g: Gruppe) => GRUPPEN_REIHENFOLGE.indexOf(g)
  // Array.prototype.sort ist stabil: innerhalb einer Gruppe bleibt die Erzeugungsfolge.
  return liste.sort((a, b) => rang(a.gruppe) - rang(b.gruppe))
}
