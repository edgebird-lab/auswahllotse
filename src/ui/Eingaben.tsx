import { useId, useState, type KeyboardEvent as TastenEreignis, type ReactNode } from 'react'
import { leseZahl } from './texte'

/** Beschriftetes Feld; `children` bekommt die Kennung für das Eingabeelement. */
export function Feld({ label, hilfe, fehler, children, klasse }: { label: ReactNode; hilfe?: ReactNode; fehler?: string | null; children: (id: string, beschreibung?: string) => ReactNode; klasse?: string }) {
  const id = useId()
  const hilfeId = `${id}-hilfe`
  return (
    <div className={`feld${fehler ? ' feld-fehler' : ''}${klasse ? ` ${klasse}` : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children(id, hilfe ? hilfeId : undefined)}
      {hilfe && (
        <p className="feld-hilfe" id={hilfeId}>
          {hilfe}
        </p>
      )}
      {fehler && (
        <p className="feld-meldung" role="alert">
          {fehler}
        </p>
      )}
    </div>
  )
}

function alsText(n: number | null, nachkomma: number): string {
  if (n === null || !Number.isFinite(n)) return ''
  const f = 10 ** nachkomma
  return String(Math.round(n * f) / f).replace('.', ',')
}

interface ZahlProps {
  wert: number | null
  onAendern: (n: number | null) => void
  id?: string
  min?: number
  max?: number
  nachkomma?: number
  suffix?: string
  ariaLabel?: string
  beschreibung?: string
  breit?: boolean
  /** leeres Feld erlaubt (Wert null) */
  optional?: boolean
}

/** Zahlenfeld, das deutsche Kommazahlen versteht und beim Tippen nicht springt. */
export function ZahlEingabe({ wert, onAendern, id, min, max, nachkomma = 2, suffix, ariaLabel, beschreibung, breit, optional }: ZahlProps) {
  // Beim Tippen zählt der eigene Text, sonst der formatierte Wert
  const [text, setText] = useState('')
  const [fokus, setFokus] = useState(false)
  const begrenze = (n: number) => {
    const f = 10 ** nachkomma
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Math.round(n * f) / f))
  }
  return (
    <span className={`zahl${breit ? ' zahl-breit' : ''}`}>
      <input
        id={id}
        type="text"
        inputMode={nachkomma > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={fokus ? text : alsText(wert, nachkomma)}
        aria-label={ariaLabel}
        aria-describedby={beschreibung}
        onFocus={() => {
          setText(alsText(wert, nachkomma))
          setFokus(true)
        }}
        onBlur={() => setFokus(false)}
        onChange={(e) => {
          setText(e.target.value)
          const n = leseZahl(e.target.value)
          if (n !== null) onAendern(begrenze(n))
          else if (optional && e.target.value.trim() === '') onAendern(null)
        }}
      />
      {suffix && <span className="zahl-suffix">{suffix}</span>}
    </span>
  )
}

export interface Option<T extends string> {
  wert: T
  text: string
  beschreibung?: string
}

/** Auswahl als Gruppe von Optionsfeldern in fieldset und legend. */
export function Auswahl<T extends string>({
  label,
  wert,
  optionen,
  onAendern,
  spalten,
  kompakt,
  legendeVersteckt,
  vorschlag,
}: {
  label: ReactNode
  wert: T | null
  optionen: readonly Option<T>[]
  onAendern: (w: T) => void
  spalten?: number
  kompakt?: boolean
  legendeVersteckt?: boolean
  /** Option mit der Marke „Vorschlag“ */
  vorschlag?: T
}) {
  const name = useId()
  return (
    <fieldset className={`auswahl${kompakt ? ' auswahl-kompakt' : ''}`} style={spalten ? { gridTemplateColumns: `repeat(${spalten}, minmax(0, 1fr))` } : undefined}>
      <legend className={legendeVersteckt ? 'sr' : undefined}>{label}</legend>
      {optionen.map((o) => (
        <label key={o.wert} className={`auswahl-option${wert === o.wert ? ' an' : ''}`}>
          <input type="radio" name={name} value={o.wert} checked={wert === o.wert} onChange={() => onAendern(o.wert)} />
          <span>
            {o.text}
            {vorschlag === o.wert && <small className="marke-vorschlag"> Vorschlag</small>}
            {o.beschreibung && <small>{o.beschreibung}</small>}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export function Schalter({ an, onAendern, children }: { an: boolean; onAendern: (an: boolean) => void; children: ReactNode }) {
  return (
    <label className="schalter">
      <input type="checkbox" role="switch" checked={an} onChange={(e) => onAendern(e.target.checked)} />
      <span className="schalter-spur" aria-hidden="true" />
      <span>{children}</span>
    </label>
  )
}

/** Reiterleiste nach dem ARIA-Muster „Tabs“ mit Pfeiltasten. */
export function Reiter<T extends string>({ label, reiter, aktiv, onWahl, idPraefix }: { label: string; reiter: readonly { id: T; text: string }[]; aktiv: T; onWahl: (r: T) => void; idPraefix: string }) {
  const taste = (e: TastenEreignis<HTMLButtonElement>, i: number) => {
    const n = reiter.length
    const ziel = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null
    if (ziel === null) return
    e.preventDefault()
    onWahl(reiter[ziel].id)
    document.getElementById(`${idPraefix}-reiter-${reiter[ziel].id}`)?.focus()
  }
  return (
    <div className="reiterleiste" role="tablist" aria-label={label}>
      {reiter.map((r, i) => (
        <button
          key={r.id}
          type="button"
          role="tab"
          id={`${idPraefix}-reiter-${r.id}`}
          aria-selected={aktiv === r.id}
          aria-controls={`${idPraefix}-flaeche-${r.id}`}
          tabIndex={aktiv === r.id ? 0 : -1}
          onClick={() => onWahl(r.id)}
          onKeyDown={(e) => taste(e, i)}
        >
          {r.text}
        </button>
      ))}
    </div>
  )
}

/** Fläche zu einem Reiter. */
export function ReiterFlaeche({ idPraefix, id, children }: { idPraefix: string; id: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`${idPraefix}-flaeche-${id}`} aria-labelledby={`${idPraefix}-reiter-${id}`} className="reiterflaeche">
      {children}
    </div>
  )
}
