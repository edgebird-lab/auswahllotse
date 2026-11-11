/**
 * „Sprung zur Ursache“ (Spezifikation 5.7): Zu jedem Befund der Schritt und
 * die Stelle, an der man ihn beheben kann.
 */
import type { Befund } from '../modell/ergebnisse'
import type { Id } from '../modell/typen'
import type { Schritt } from '../zustand'

export interface Ziel {
  schritt: Schritt
  /** DOM-Kennung des Elements, das Fokus bekommen soll */
  anker: string | null
  angebotId?: Id
  reiter?: 'bewertung' | 'kosten'
  vorlage?: 'lastenheft' | 'entscheidung'
}

/** Kennung für das DOM aus einer beliebigen Projekt-Kennung („medienbruch:a>b“ → „anf-medienbruch_3aa_3eb“). */
export function domId(praefix: string, id: string): string {
  return `${praefix}-${id.replace(/[^a-zA-Z0-9-]/g, (c) => `_${c.charCodeAt(0).toString(16)}`)}`
}

export function zielVonBefund(b: Befund, angebotIds: readonly Id[]): Ziel {
  const bezug = b.bezug
  const gruppe = bezug?.startsWith('gruppe:') ? bezug.slice('gruppe:'.length) : null
  const angebot = bezug !== null && angebotIds.includes(bezug) ? bezug : undefined
  const c = b.code
  if (c.startsWith('P')) {
    if (gruppe) return { schritt: 'anforderungen', anker: domId('gruppe', gruppe) }
    return { schritt: 'anforderungen', anker: bezug ? domId('anf', bezug) : 'anforderungen-kopf' }
  }
  if (c === 'G4') return { schritt: 'gewichtung', anker: gruppe ? domId('punkte', gruppe) : 'unterpunkte' }
  if (c.startsWith('G') || c.startsWith('AHP')) return { schritt: 'gewichtung', anker: 'gewichte' }
  if (c === 'K8' || c === 'K9' || c === 'N2') {
    return angebot ? { schritt: 'angebote', anker: 'angebot-kosten', angebotId: angebot, reiter: 'kosten' } : { schritt: 'angebote', anker: 'annahmen', reiter: 'kosten' }
  }
  if (c === 'D4' || c === 'D5' || c === 'D6') return { schritt: 'vorlagen', anker: 'entscheidung-bedienung', vorlage: 'entscheidung' }
  if (c.startsWith('E') || c.startsWith('U') || c.startsWith('M') || c.startsWith('H')) {
    return { schritt: 'prozess', anker: bezug ? domId('aufgabe', bezug) : 'prozess-karte' }
  }
  return { schritt: 'ergebnis', anker: 'empfehlung' }
}
