/**
 * Sensitivität eines Hauptkriteriums als kleines Liniendiagramm
 * (Spezifikation 5.7, 6.10): waagrecht das Gewicht des Kriteriums von 0 bis
 * 100 %, senkrecht der Nutzwert (Regel Nutzwert) oder € je Nutzwertpunkt
 * (Regel Preis-Leistung) jedes Angebots. Die übrigen Gewichte passen sich
 * anteilig an. Fläche: stabiler Bereich; senkrechte Linie: heutiges Gewicht.
 * Farbe trägt nur die Rolle (Empfehlung oder Mitbewerber); die Namen stehen
 * in der Legende, im Tooltip und in der Tabelle.
 */
import type { AngebotsErgebnis, Stabilitaet } from '../../modell/ergebnisse'
import type { Entscheidungsregel } from '../../modell/typen'
import { euroGenau, nutzwert, prozent } from '../../modell/zahlformat'
import { stabilitaetText } from '../../bewertung/sensitivitaet'
import { achsenSchritt, nutzwertBei } from './geometrie'

const B = 320
const H = 170
const L = 44
const R = 12
const O = 14
const U = 30

export function SensitivitaetDiagramm({
  s,
  konkurrenten,
  empfehlungId,
  regel,
  namen,
}: {
  s: Stabilitaet
  konkurrenten: readonly AngebotsErgebnis[]
  empfehlungId: string | null
  regel: Entscheidungsregel
  namen: ReadonlyMap<string, string>
}) {
  const xs = Array.from({ length: 51 }, (_, i) => i / 50)
  const wert = (r: AngebotsErgebnis, x: number) => {
    const n = nutzwertBei(r, s.gruppe, s.gewicht, x)
    if (regel === 'nutzwert') return n
    return n > 1e-9 ? r.kostenbasis / n : null
  }
  // Wertebereich: Nutzwert fest 0 bis 10; € je Punkt bis zum 2,5-Fachen des heutigen Höchstwerts
  const heute = konkurrenten.map((r) => (regel === 'nutzwert' ? r.nutzwert : (r.euroJePunkt ?? 0)))
  const yMax = regel === 'nutzwert' ? 10 : Math.max(1, 2.5 * Math.max(...heute))
  const schritt = regel === 'nutzwert' ? 5 : achsenSchritt(yMax, 2)
  const yOben = regel === 'nutzwert' ? 10 : Math.ceil(yMax / schritt) * schritt
  const px = (x: number) => L + x * (B - L - R)
  const py = (y: number) => O + (1 - Math.min(Math.max(y, 0), yOben) / yOben) * (H - O - U)
  const clipId = `sens-${s.gruppe}`
  const linien = konkurrenten.map((r) => {
    const punkte = xs
      .map((x) => ({ x, y: wert(r, x) }))
      .filter((p): p is { x: number; y: number } => p.y !== null && p.y <= yOben * 1.5)
      .map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
    return { r, punkte: punkte.join(' ') }
  })
  const yTicks = Array.from({ length: Math.round(yOben / schritt) + 1 }, (_, i) => i * schritt)
  const ytext = (y: number) => (regel === 'nutzwert' ? String(y) : y >= 10000 ? `${Math.round(y / 1000)} Tsd.` : String(Math.round(y)))

  return (
    <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={stabilitaetText(s)} className="diagramm-svg sensitivitaet-svg">
      <clipPath id={clipId}>
        <rect x={L} y={O} width={B - L - R} height={H - O - U} />
      </clipPath>
      <rect x={px(s.von)} y={O} width={Math.max(0, px(s.bis) - px(s.von))} height={H - O - U} className="stabil-flaeche" />
      {yTicks.map((y) => (
        <g key={y}>
          <line x1={L} x2={B - R} y1={py(y)} y2={py(y)} className="gitter" />
          <text x={L - 6} y={py(y)} className="achse" textAnchor="end" dominantBaseline="middle">
            {ytext(y)}
          </text>
        </g>
      ))}
      {[0, 0.5, 1].map((x) => (
        <text key={x} x={px(x)} y={H - 10} className="achse" textAnchor={x === 0 ? 'start' : x === 1 ? 'end' : 'middle'}>
          {x * 100} %
        </text>
      ))}
      <g clipPath={`url(#${clipId})`}>
        {linien
          .filter((l) => l.r.angebotId !== empfehlungId)
          .map((l) => (
            <polyline key={l.r.angebotId} points={l.punkte} className="linie linie-andere">
              <title>{`${namen.get(l.r.angebotId) ?? 'Angebot'} (Mitbewerber)`}</title>
            </polyline>
          ))}
        {linien
          .filter((l) => l.r.angebotId === empfehlungId)
          .map((l) => (
            <polyline key={l.r.angebotId} points={l.punkte} className="linie linie-empfohlen">
              <title>{`${namen.get(l.r.angebotId) ?? 'Angebot'} (Empfehlung)`}</title>
            </polyline>
          ))}
      </g>
      <line x1={px(s.gewicht)} x2={px(s.gewicht)} y1={O} y2={H - U} className="heute-linie" />
      <text x={Math.min(px(s.gewicht) + 4, B - R - 60)} y={O + 10} className="achse heute-text">
        heute {prozent(s.gewicht)} %
      </text>
      {konkurrenten
        .filter((r) => r.angebotId === empfehlungId)
        .map((r) => {
          const y = wert(r, s.gewicht)
          return y === null ? null : (
            <circle key={r.angebotId} cx={px(s.gewicht)} cy={py(y)} r={4} className="punkt-empfohlen">
              <title>{`${namen.get(r.angebotId) ?? 'Angebot'} heute: ${regel === 'nutzwert' ? nutzwert(y) : euroGenau(y)}`}</title>
            </circle>
          )
        })}
    </svg>
  )
}
