/**
 * Mengengerüst, Prozesskosten und Medienbruchkosten (Spezifikation 6.3,
 * Regeln M1 bis M8). V = Vorgänge pro Tag der Grundlage, T_B = Betriebstage,
 * h = Häufigkeit je Vorgang aus haeufigkeit.ts.
 */
import { ermittleMedienbrueche } from '../lastenheft/schnittstellen'
import { aufgabenImUmfang } from '../lastenheft/umfang'
import type { Befund, Ende, Mengengeruest, RollenMenge } from '../modell/ergebnisse'
import type { ProzessQuelle, Rahmen, Umfang } from '../modell/typen'
import type { PlId, PlProjekt, PlProzess } from './format'
import { berechneHaeufigkeiten } from './haeufigkeit'
import { aufgabenVon, grundlageVon, rolleVon } from './struktur'

/** Aufrunden mit Toleranz gegen Gleitkommafehler: 0,1 · 30 ergibt 3,0000000000000004 und soll 3 bleiben. */
export function aufrunden(x: number): number {
  // „|| 0“ macht aus −0 eine 0
  return Math.ceil(x - 1e-9) || 0
}

/** M5: Kosten je Vorgang = Σ h · bearbeitungMin / 60 · Stundensatz über Aufgaben mit gültiger Rolle. */
export function kostenProVorgang(p: PlProzess, haeufigkeit: Map<PlId, number> = berechneHaeufigkeiten(p).haeufigkeit): number {
  let summe = 0
  for (const a of aufgabenVon(p)) {
    const rolle = rolleVon(p, a.rolleId)
    if (rolle) summe += (((haeufigkeit.get(a.id) ?? 0) * a.bearbeitungMin) / 60) * rolle.stundensatz
  }
  return summe
}

export function berechneMengengeruest(projekt: PlProjekt, umfang: Umfang, rahmen: Rahmen): Mengengeruest {
  const basis = grundlageVon(projekt, umfang.grundlage)
  const v = basis.vorgaengeProTag
  const { haeufigkeit, enden: vorzeitig, regulaer } = berechneHaeufigkeiten(basis)
  const befunde: Befund[] = []

  // M1
  const vorgaengeSpitze = aufrunden(v * rahmen.spitzenfaktor)
  const vorgaengeProJahr = v * rahmen.betriebstageProJahr

  // U2, M3, M4
  const umfangAufgaben = aufgabenImUmfang(basis, umfang, rahmen.softwareart)
  befunde.push(...umfangAufgaben.befunde)
  const imUmfang = new Set(umfangAufgaben.imUmfang)
  const rollen: RollenMenge[] = []
  for (const rolle of basis.rollen) {
    const aufgaben = aufgabenVon(basis).filter((a) => imUmfang.has(a.id) && a.rolleId === rolle.id)
    if (aufgaben.length === 0) continue
    if (rolle.personen <= 0) {
      befunde.push({ schwere: 'hinweis', code: 'M3', text: `Die Rolle „${rolle.name}“ hat keine Personen; sie zählt mit 0 Benutzern.`, bezug: rolle.id })
    }
    rollen.push({
      rolleId: rolle.id,
      name: rolle.name,
      benutzer: rolle.personen > 0 ? aufrunden(rolle.personen) : 0,
      aufgaben: aufgaben.map((a) => a.id),
      arbeitMinProTag: aufgaben.reduce((s, a) => s + (haeufigkeit.get(a.id) ?? 0) * a.bearbeitungMin * v, 0),
    })
  }

  // M6, M7
  const mb = ermittleMedienbrueche(projekt, umfang, rahmen.softwareart)
  befunde.push(...mb.befunde)
  const medienbruchkostenProJahr = mb.medienbrueche
    .filter((m) => m.fall === 'A' || m.fall === 'B' || m.fall === 'C')
    .reduce((s, m) => s + m.euroProTag * rahmen.betriebstageProJahr, 0)

  const enden: Ende[] = [{ ergebnis: basis.ergebnis || 'Ende', anteil: regulaer, regulaer: true }]
  for (const [ergebnis, anteil] of vorzeitig) enden.push({ ergebnis, anteil, regulaer: false })

  return {
    vorgaengeProTag: v,
    vorgaengeSpitze,
    vorgaengeProJahr,
    haeufigkeit,
    imUmfang: umfangAufgaben.imUmfang,
    rollen,
    benutzer: rollen.reduce((s, r) => s + r.benutzer, 0),
    medienbrueche: mb.medienbrueche,
    // M5: Ist immer mit eigenen Häufigkeiten, Soll nur, wenn vorhanden
    kostenProVorgangIst: kostenProVorgang(projekt.ist),
    kostenProVorgangSoll: projekt.soll ? kostenProVorgang(projekt.soll) : null,
    medienbruchkostenProJahr,
    enden,
    // M8
    datenbestand: vorgaengeProJahr * rahmen.richtwerte.aufbewahrungJahre,
    befunde,
  }
}

/** Mengengerüst des Auswahl-Projekts; ohne Prozessmodell oder Umfang null. */
export function mengengeruestVon(p: { prozess: ProzessQuelle | null; umfang: Umfang | null; rahmen: Rahmen }): Mengengeruest | null {
  return p.prozess && p.umfang ? berechneMengengeruest(p.prozess.projekt, p.umfang, p.rahmen) : null
}
