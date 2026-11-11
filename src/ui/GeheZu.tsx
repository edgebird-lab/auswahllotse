import { SCHRITTE, type Schritt } from '../zustand'
import { useApp } from './kontext'
import { sperreVon } from './sperren'

/** Knopf „Weiter zu …“ am Ende eines Schritts; bei einer Sperre mit Grund. */
export function GeheZu({ schritt, text }: { schritt: Schritt; text?: string }) {
  const { dispatch, g, z } = useApp()
  const i = SCHRITTE.findIndex((s) => s.id === schritt)
  const gesperrt = sperreVon(schritt, z.projekt, g.kriterien)
  return (
    <div className="schritt-fuss">
      <button type="button" className="knopf knopf-haupt" disabled={gesperrt !== null} onClick={() => dispatch({ typ: 'schritt', schritt })}>
        {text ?? `Weiter zu ${i + 1} · ${SCHRITTE[i].name}`}
      </button>
      {gesperrt && <p className="feld-hilfe">{gesperrt.grund}</p>}
    </div>
  )
}
