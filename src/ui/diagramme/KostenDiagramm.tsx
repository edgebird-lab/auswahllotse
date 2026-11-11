/**
 * Kostenbasis je Angebot als waagrechte Balken (Spezifikation 5.7), eine
 * Reihe ohne Legende; ein Budget erscheint als Bezugslinie mit Beschriftung.
 */
import type { AngebotsErgebnis } from '../../modell/ergebnisse'
import type { Angebot } from '../../modell/typen'
import { euro } from '../../modell/zahlformat'
import { angebotsname } from '../../bewertung/nutzwert'
import { achsenSchritt, balkenWeg } from './geometrie'

const BREITE = 720
const LINKS = 190
const RECHTS = 96
const ZEILE = 40
const DICKE = 20
const OBEN = 22

export function KostenDiagramm({ ergebnisse, angebote, budget, titel }: { ergebnisse: readonly AngebotsErgebnis[]; angebote: readonly Angebot[]; budget: number | null; titel: string }) {
  const nachId = new Map(angebote.map((a) => [a.id, a]))
  const zeilen = [...ergebnisse].sort((a, b) => a.kostenbasis - b.kostenbasis)
  const max = Math.max(...zeilen.map((r) => r.kostenbasis), budget ?? 0, 1)
  const schritt = achsenSchritt(max)
  const obergrenze = Math.ceil(max / schritt) * schritt
  const skala = (BREITE - LINKS - RECHTS) / obergrenze
  const hoehe = OBEN + zeilen.length * ZEILE + 28
  const name = (r: AngebotsErgebnis) => {
    const a = nachId.get(r.angebotId)
    return a ? angebotsname(a) : 'Angebot'
  }
  const ticks = Array.from({ length: Math.round(obergrenze / schritt) + 1 }, (_, i) => i * schritt)
  const kompakt = (x: number) => (x === 0 ? '0' : obergrenze >= 10000 ? `${Math.round(x / 1000)} Tsd. €` : euro(x))
  const beschreibung = `${titel}: ${zeilen.map((r) => `${name(r)} ${euro(r.kostenbasis)}`).join('; ')}${budget !== null ? `; Budget ${euro(budget)}` : ''}.`

  return (
    <figure className="diagramm">
      <svg viewBox={`0 0 ${BREITE} ${hoehe}`} role="img" aria-label={beschreibung} className="diagramm-svg">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={LINKS + t * skala} x2={LINKS + t * skala} y1={OBEN - 4} y2={OBEN + zeilen.length * ZEILE} className="gitter" />
            <text x={LINKS + t * skala} y={hoehe - 8} className="achse" textAnchor="middle">
              {kompakt(t)}
            </text>
          </g>
        ))}
        {zeilen.map((r, i) => {
          const y = OBEN + i * ZEILE + (ZEILE - DICKE) / 2
          const ende = LINKS + r.kostenbasis * skala
          return (
            <g key={r.angebotId}>
              <text x={LINKS - 10} y={y + DICKE / 2} className="beschriftung" textAnchor="end" dominantBaseline="middle">
                {name(r)}
                {r.gueltig ? '' : ' (ausgeschieden)'}
              </text>
              <path d={balkenWeg(LINKS, Math.max(ende, LINKS + 0.1), y, DICKE)} className={`balken${r.gueltig ? '' : ' balken-blass'}`}>
                <title>{`${name(r)}: ${euro(r.kostenbasis)}`}</title>
              </path>
              <text x={ende + 8} y={y + DICKE / 2} className="wert" dominantBaseline="middle">
                {euro(r.kostenbasis)}
              </text>
            </g>
          )
        })}
        {budget !== null && (
          <g>
            <line x1={LINKS + budget * skala} x2={LINKS + budget * skala} y1={OBEN - 6} y2={OBEN + zeilen.length * ZEILE} className="bezugslinie" />
            <text x={LINKS + budget * skala} y={OBEN - 10} className="achse" textAnchor="middle">
              Budget {euro(budget)}
            </text>
          </g>
        )}
      </svg>
    </figure>
  )
}
