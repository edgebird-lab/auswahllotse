/**
 * Alle berechneten Ergebnisse eines Projekts an einer Stelle: Mengengerüst,
 * Prüfungen, Auswertung, Entscheidung und die Befunde aller Stufen. Die
 * Oberfläche berechnet das bei jeder Änderung neu (nichts davon wird
 * gespeichert, Spezifikation 4.1).
 */
import type { Auswertung, Befund, Mengengeruest, Schwere } from '../modell/ergebnisse'
import type { AuswahlProjekt, Id } from '../modell/typen'
import { befundeDerQuelle } from '../prozessdatei/einlesen'
import { mengengeruestVon } from '../prozessdatei/mengengeruest'
import { pruefeAnforderungen, type Pruefergebnis } from '../lastenheft/pruefung'
import { werteAus } from '../bewertung/auswertung'
import { hauptkriterien, type Kriterien } from '../bewertung/gewichte'
import { kostenVorschlaege, type KostenVorschlaege } from '../kosten/vorschlaege'
import { finalMoeglich, gewaehlteId, pruefeEntscheidung, type FinalPruefung } from './entscheidung'

export interface Gesamt {
  mengengeruest: Mengengeruest | null
  pruefung: Pruefergebnis
  kriterien: Kriterien
  auswertung: Auswertung
  vorschlaege: KostenVorschlaege
  /** wirksam gewähltes Angebot (eigene Wahl oder Empfehlung) */
  gewaehltId: Id | null
  /** alle Befunde, Fehler zuerst, dann Warnungen, dann Hinweise */
  befunde: Befund[]
  final: FinalPruefung
}

const RANG: Record<Schwere, number> = { fehler: 0, warnung: 1, hinweis: 2 }

export function nachSchwere(befunde: readonly Befund[]): Befund[] {
  return [...befunde].sort((a, b) => RANG[a.schwere] - RANG[b.schwere])
}

export function berechneGesamt(p: AuswahlProjekt): Gesamt {
  const mengengeruest = mengengeruestVon(p)
  const pruefung = pruefeAnforderungen(p.anforderungen)
  const auswertung = werteAus(p)
  const gewaehltId = gewaehlteId(p, auswertung)
  const alle: Befund[] = [
    ...(p.prozess ? befundeDerQuelle(p.prozess) : []),
    ...(mengengeruest?.befunde ?? []),
    ...pruefung.befunde,
    ...auswertung.befunde,
    ...pruefeEntscheidung(p, auswertung),
  ]
  const final = finalMoeglich(alle, gewaehltId)
  // D5 gilt auch nach dem Festlegen: Kommen später Fehler hinzu, ist „final“ nicht mehr gedeckt
  if (p.entscheidung.status === 'final' && !final.moeglich) {
    alle.push({
      schwere: 'warnung',
      code: 'D5',
      text: 'Die Entscheidung steht auf „final“, aber das Projekt hat inzwischen Fehler. Bitte die Fehler beheben oder den Status auf „Entwurf“ zurücksetzen.',
      bezug: null,
    })
  }
  const befunde = nachSchwere(alle)
  return {
    mengengeruest,
    pruefung,
    kriterien: hauptkriterien(p.anforderungen),
    auswertung,
    vorschlaege: kostenVorschlaege(p, mengengeruest),
    gewaehltId,
    befunde,
    final,
  }
}
