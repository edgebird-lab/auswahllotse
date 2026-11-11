import { expect, test, type Page } from '@playwright/test'
import { SCHRITTE } from './hilfen.ts'

/** Beschriftung des Elements mit Fokus: Label, aria-label oder Text. */
function fokus(page: Page): Promise<string> {
  return page.evaluate(() => {
    const e = document.activeElement as HTMLElement | null
    if (!e) return ''
    const label = (e as HTMLInputElement).labels?.[0]?.textContent ?? e.getAttribute('aria-label') ?? e.textContent ?? ''
    return label.replace(/\s+/g, ' ').trim()
  })
}

async function tabZu(page: Page, ziel: RegExp, rueckwaerts = false, max = 400) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(rueckwaerts ? 'Shift+Tab' : 'Tab')
    if (ziel.test(await fokus(page))) return
  }
  throw new Error(`Mit der Tastatur nicht erreichbar: ${ziel}`)
}

test('ganzer Durchlauf nur mit Tastatur (E5)', async ({ page }) => {
  await page.goto('/')
  // Die Sprungmarke ist das erste Ziel und führt zum Inhalt
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Zum Inhalt springen' })).toBeFocused()

  await tabZu(page, /^Beispiel laden$/)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('geladen')

  for (const [i, name] of SCHRITTE.entries()) {
    // Vom Fokus im Inhalt rückwärts zurück in die Schrittleiste
    await tabZu(page, new RegExp(`^${i + 1}${name}`), i > 0)
    await page.keyboard.press('Enter')
    const titel = page.locator('#schritt-titel')
    await expect(titel).toBeFocused()
    await expect(titel).toContainText(name)

    if (name === 'Rahmen') {
      await tabZu(page, /^Wie heißt das Vorhaben\?$/)
      await page.keyboard.press('Control+a')
      await page.keyboard.type('Per Tastatur')
      await expect(page.getByLabel('Wie heißt das Vorhaben?')).toHaveValue('Per Tastatur')
    }
    if (name === 'Anforderungen') {
      await tabZu(page, /^Bearbeiten/)
      await page.keyboard.press('Enter')
      await expect(page.getByRole('button', { name: /^Fertig/ })).toBeFocused()
      await expect(page.locator('.anforderung-bearbeiten').getByLabel('Anforderung', { exact: true })).toBeVisible()
    }
    if (name === 'Gewichtung') {
      // In einer Optionsgruppe ist nur die gewählte Option im Tab-Weg; Pfeiltasten wechseln
      await tabZu(page, /^Prozente direkt/)
      await page.keyboard.press('ArrowRight')
      await expect(page.getByRole('radio', { name: /^Paarvergleich/ })).toBeChecked()
      await page.keyboard.press('ArrowLeft')
      await expect(page.getByRole('radio', { name: /^Prozente direkt/ })).toBeChecked()
    }
    if (name === 'Angebote') {
      await tabZu(page, /^Bewertung/)
      await page.keyboard.press('ArrowRight')
      await expect(page.getByRole('tab', { name: 'Kosten' })).toBeFocused()
      await expect(page.getByRole('heading', { name: 'Annahmen für alle Angebote' })).toBeVisible()
    }
    if (name === 'Vorlagen') {
      await tabZu(page, /^Lastenheft$/)
      await page.keyboard.press('ArrowRight')
      await expect(page.getByRole('heading', { name: 'Entscheidung festhalten' })).toBeVisible()
      await expect(page.locator('.druck-dokument')).toContainText('Empfohlen wird Anbieter Nord')
    }
  }
})

test('Rückgängig und Wiederholen mit Strg+Z und Strg+Y außerhalb von Eingabefeldern', async ({ page }) => {
  await page.goto('/')
  const feld = page.getByLabel('Wie heißt das Vorhaben?')
  await feld.fill('Erster Stand')
  await page.locator('#schritt-titel').focus()
  await page.keyboard.press('Control+z')
  await expect(feld).toHaveValue('')
  await page.keyboard.press('Control+y')
  await expect(feld).toHaveValue('Erster Stand')
})
