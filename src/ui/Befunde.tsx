import type { Befund, Schwere } from '../modell/ergebnisse'
import { zielVonBefund } from '../modell/befundziel'
import { useApp } from './kontext'
import { befundMitAnforderung } from '../modell/texte'
import { SCHWERE_TEXT } from './texte'

const SYMBOL: Record<Schwere, string> = { fehler: '✕', warnung: '!', hinweis: 'i' }

/** Symbol mit Text für Bildschirmleser; Farbe trägt nie allein die Bedeutung. */
export function SchwereSymbol({ schwere }: { schwere: Schwere }) {
  return (
    <span className={`schwere schwere-${schwere}`} title={SCHWERE_TEXT[schwere]}>
      <span aria-hidden="true">{SYMBOL[schwere]}</span>
      <span className="sr">{SCHWERE_TEXT[schwere]}:</span>
    </span>
  )
}

/**
 * Liste von Befunden; mit `springen` je Befund ein Knopf „Zur Stelle“. Eine
 * solche Gesamtliste nennt bei Befunden zu einer Anforderung deren Nummer.
 */
export function BefundListe({ befunde, springen = false, kompakt = false, leer }: { befunde: readonly Befund[]; springen?: boolean; kompakt?: boolean; leer?: string }) {
  const { springeZu, z } = useApp()
  if (befunde.length === 0) return leer ? <p className="leer-hinweis">{leer}</p> : null
  const angebote = z.projekt.angebote.map((a) => a.id)
  return (
    <ul className={`befunde${kompakt ? ' befunde-kompakt' : ''}`}>
      {befunde.map((b, i) => {
        const text = springen ? befundMitAnforderung(b, z.projekt.anforderungen) : b.text
        return (
          <li key={`${b.code}-${b.bezug ?? ''}-${i}`} className={`befund befund-${b.schwere}`}>
            <SchwereSymbol schwere={b.schwere} />
            <span className="befund-text">{text}</span>
            {springen && (
              <button type="button" className="knopf knopf-klein knopf-leise" onClick={() => springeZu(zielVonBefund(b, angebote))}>
                Zur Stelle<span className="sr"> ({text})</span>
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
