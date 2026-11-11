/**
 * Dateinamen aus Benutzertexten (Spezifikation 6.15, 6.16): verbotene
 * Zeichen entfernen, höchstens 80 Zeichen einschließlich Zusatz und Endung.
 */
export const DATEINAME_MAX = 80

/** Entfernt \ / : * ? " < > | und Steuerzeichen, fasst Leerraum zusammen. */
export function bereinigeDateiname(name: string): string {
  // oxlint-disable-next-line no-control-regex -- Steuerzeichen sind in Dateinamen verboten
  return name.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Baut „{Basis}{Zusatz}.{Endung}“ mit höchstens 80 Zeichen; gekürzt wird die
 * Basis, nach ganzen Unicode-Zeichen. Leere Basis → „Auswahl-Lotse“. Zusatz
 * und Endung sind feste Texte der App, z. B. „ – Anbieterfragebogen“.
 */
export function dateiname(basis: string, zusatz: string, endung: string): string {
  const rest = `${zusatz}.${endung}`
  const zeichen = Array.from(bereinigeDateiname(basis) || 'Auswahl-Lotse')
  const platz = Math.max(1, DATEINAME_MAX - Array.from(rest).length)
  return `${zeichen.slice(0, platz).join('').trim()}${rest}`
}
