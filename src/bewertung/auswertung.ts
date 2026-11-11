/**
 * Gesamtauswertung (Spezifikation 4.4 `Auswertung`): Gewichte, K.-o.,
 * Nutzwert, Rang, Empfehlung, „vorläufig“ und Sensitivität aus einem
 * Projekt. Die Kosten je Angebot kommen von außen (Phase 5, kosten.ts);
 * so bleibt diese Rechnung unabhängig vom Kostenmodell.
 */
import type { Auswertung, Befund, KostenErgebnis } from '../modell/ergebnisse'
import type { AuswahlProjekt, Id } from '../modell/typen'
import { rangfolge } from '../entscheidung/regel'
import { berechneGewichte, globaleGewichte, hauptkriterien } from './gewichte'
import { bewerteAngebote, istVorlaeufig } from './nutzwert'
import { berechneSensitivitaet } from './sensitivitaet'

export function werteAus(projekt: AuswahlProjekt, kosten: ReadonlyMap<Id, KostenErgebnis>): Auswertung {
  const { haupt } = hauptkriterien(projekt.anforderungen)
  const gewichtung = berechneGewichte(projekt.gewichtung, haupt)
  const unterpunkte = globaleGewichte(projekt.anforderungen, gewichtung.gewichte)
  const befunde: Befund[] = [...gewichtung.befunde, ...unterpunkte.befunde]
  const nutzwert = bewerteAngebote({
    anforderungen: projekt.anforderungen,
    angebote: projekt.angebote,
    gewichte: gewichtung.gewichte,
    kosten,
    wirtschaftlichkeit: projekt.wirtschaftlichkeit,
  })
  befunde.push(...nutzwert.befunde)

  // Ohne gültige Gewichte gibt es keinen Nutzwert, also weder Rang noch Empfehlung.
  const gewichteFehlen = befunde.some((b) => b.schwere === 'fehler' && b.code.startsWith('G'))
  if (gewichteFehlen) {
    return { gewichte: gewichtung.gewichte, ahp: gewichtung.ahp, ergebnisse: nutzwert.ergebnisse, empfehlungId: null, vorlaeufig: istVorlaeufig(nutzwert.ergebnisse), stabilitaet: [], befunde }
  }

  const { regel, mindestNutzwert } = projekt.entscheidung
  const rang = rangfolge(nutzwert.ergebnisse, projekt.angebote, regel, mindestNutzwert)
  befunde.push(...rang.befunde)
  const konkurrenten = rang.ergebnisse.filter((r) => rang.zulaessig.includes(r.angebotId))
  const sensitivitaet = berechneSensitivitaet({ regel, gewichte: gewichtung.gewichte, konkurrenten, empfehlungId: rang.empfehlungId, gleichstandSpitze: rang.gleichstandSpitze })
  befunde.push(...sensitivitaet.befunde)

  return {
    gewichte: gewichtung.gewichte,
    ahp: gewichtung.ahp,
    ergebnisse: rang.ergebnisse,
    empfehlungId: rang.empfehlungId,
    vorlaeufig: istVorlaeufig(rang.ergebnisse),
    stabilitaet: sensitivitaet.stabilitaet,
    befunde,
  }
}
