import { useApp } from './kontext'
import { LERNINHALTE, type LernThema } from './lerninhalte'

/** Erklärung einer Methode; erscheint nur im Lernmodus. */
export function Lernhinweis({ thema }: { thema: LernThema }) {
  const { z } = useApp()
  if (!z.einstellungen.lernmodus) return null
  const inhalt = LERNINHALTE[thema]
  return (
    <aside className="lernhinweis" aria-label={`Lernhinweis: ${inhalt.titel}`}>
      <span className="lernhinweis-symbol" aria-hidden="true">
        i
      </span>
      <p>
        <strong>{inhalt.titel}:</strong> {inhalt.text}
      </p>
    </aside>
  )
}
