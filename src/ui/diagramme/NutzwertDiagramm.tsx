/**
 * Nutzwert je Angebot als waagrechte, nach Hauptkriterien gestapelte Balken
 * (Spezifikation 5.7). Jedes Segment ist der Beitrag W_g · S_g einer Gruppe.
 * Farben: Kategorie-Plätze 1 bis 8 in der festen Reihenfolge der
 * Hauptkriterien (geprüft mit dem Palettenprüfer, siehe styles.css); ab dem
 * neunten Kriterium fasst „übrige“ den Rest zusammen. Legende und Tabelle
 * tragen die Zuordnung, die Farbe nie allein.
 */
import { useId } from 'react'
import type { AngebotsErgebnis } from '../../modell/ergebnisse'
import type { Angebot, Gruppe } from '../../modell/typen'
import { fest, nutzwert, prozent } from '../../modell/zahlformat'
import { angebotsname } from '../../bewertung/nutzwert'
import { balkenWeg, serienVon } from './geometrie'

const BREITE = 720
const LINKS = 190
const RECHTS = 64
const ZEILE = 40
const DICKE = 20
const OBEN = 8

export function NutzwertDiagramm({
  ergebnisse,
  angebote,
  gewichte,
  haupt,
}: {
  ergebnisse: readonly AngebotsErgebnis[]
  angebote: readonly Angebot[]
  gewichte: Partial<Record<Gruppe, number>>
  haupt: readonly Gruppe[]
}) {
  // Nur Buchstaben und Ziffern: useId liefert je nach React-Version „:r0:“ oder „«r0»“, url(#…) braucht eine schlichte Kennung
  const clipPraefix = `nw${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const serien = serienVon(haupt)
  const nachId = new Map(angebote.map((a) => [a.id, a]))
  // gültige nach Rang, dann ausgeschiedene
  const zeilen = [...ergebnisse].sort((a, b) => (a.rang ?? 99) - (b.rang ?? 99) || b.nutzwert - a.nutzwert)
  const hoehe = OBEN + zeilen.length * ZEILE + 28
  const skala = (BREITE - LINKS - RECHTS) / 10
  const name = (r: AngebotsErgebnis) => {
    const a = nachId.get(r.angebotId)
    return a ? angebotsname(a) : 'Angebot'
  }
  const beschreibung = `Nutzwert je Angebot von 0 bis 10: ${zeilen.map((r) => `${name(r)} ${nutzwert(r.nutzwert)}${r.gueltig ? '' : ' (ausgeschieden)'}`).join('; ')}.`

  return (
    <figure className="diagramm">
      <ul className="legende" aria-label="Legende: Hauptkriterien">
        {serien.map((s) => (
          <li key={s.name}>
            <span className="farbfeld" style={{ background: s.farbe }} aria-hidden="true" />
            {s.name}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${BREITE} ${hoehe}`} role="img" aria-label={beschreibung} className="diagramm-svg">
        {[0, 2, 4, 6, 8, 10].map((t) => (
          <g key={t}>
            <line x1={LINKS + t * skala} x2={LINKS + t * skala} y1={OBEN - 4} y2={OBEN + zeilen.length * ZEILE} className="gitter" />
            <text x={LINKS + t * skala} y={hoehe - 8} className="achse" textAnchor="middle">
              {t}
            </text>
          </g>
        ))}
        {zeilen.map((r, i) => {
          const y = OBEN + i * ZEILE + (ZEILE - DICKE) / 2
          const ende = LINKS + r.nutzwert * skala
          let x = LINKS
          const clipId = `${clipPraefix}-n${i}`
          return (
            <g key={r.angebotId} className={r.gueltig ? undefined : 'ausgeschieden'}>
              <text x={LINKS - 10} y={y + DICKE / 2} className="beschriftung" textAnchor="end" dominantBaseline="middle">
                {name(r)}
                {r.gueltig ? '' : ' (ausgeschieden)'}
              </text>
              <clipPath id={clipId}>
                <path d={balkenWeg(LINKS, Math.max(ende, LINKS + 0.1), y, DICKE)} />
              </clipPath>
              <g clipPath={`url(#${clipId})`}>
                {serien.map((s) => {
                  const beitrag = s.gruppen.reduce((summe, g) => summe + (gewichte[g] ?? 0) * (r.gruppenwerte[g] ?? 0), 0)
                  const breite = beitrag * skala
                  const segment = (
                    <rect key={s.name} x={x} y={y} width={Math.max(0, breite - 2)} height={DICKE} style={{ fill: s.farbe }}>
                      <title>{`${name(r)} · ${s.name}: ${fest(beitrag, 2)} Punkte (Gruppenwert ${s.gruppen.length === 1 ? fest(r.gruppenwerte[s.gruppen[0]] ?? 0, 2) : '–'} × Gewicht ${prozent(s.gruppen.reduce((w, g) => w + (gewichte[g] ?? 0), 0))} %)`}</title>
                    </rect>
                  )
                  x += breite
                  return segment
                })}
              </g>
              <text x={ende + 8} y={y + DICKE / 2} className="wert" dominantBaseline="middle">
                {nutzwert(r.nutzwert)}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
