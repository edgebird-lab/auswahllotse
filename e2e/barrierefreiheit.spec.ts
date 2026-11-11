import { expect, test, type Page } from '@playwright/test'
import { ladeBeispiel, leseLieferdienstEin, pruefeBarrieren, schritt, SCHRITTE } from './hilfen.ts'

async function alleSchritte(page: Page) {
  for (const name of SCHRITTE) {
    await schritt(page, name)
    await pruefeBarrieren(page)
    if (name === 'Angebote') {
      await page.getByRole('tab', { name: 'Kosten' }).click()
      await pruefeBarrieren(page)
      await page.getByRole('tab', { name: /^Bewertung/ }).click()
    }
    if (name === 'Vorlagen') {
      await page.getByRole('tab', { name: 'Entscheidungsvorlage' }).click()
      await pruefeBarrieren(page)
      await page.getByRole('tab', { name: 'Lastenheft' }).click()
    }
  }
}

for (const schema of ['light', 'dark'] as const) {
  test(`alle Schritte ohne schwere Barrieren (${schema === 'light' ? 'hell' : 'dunkel'}, E9)`, async ({ page }) => {
    // axe in allen Schritten und Reitern dauert unter Last länger als die üblichen 30 s
    test.slow()
    await page.emulateMedia({ colorScheme: schema })
    await page.goto('/')
    await pruefeBarrieren(page)
    await ladeBeispiel(page)
    await alleSchritte(page)
    // Paarvergleich mit Ampel und offenem Vergleich
    await schritt(page, 'Gewichtung')
    await page.getByText('Paarvergleich (AHP)').click()
    await pruefeBarrieren(page)
  })
}

test('auch ein neues Projekt und das eingelesene Modell ohne schwere Barrieren', async ({ page }) => {
  test.slow()
  await page.goto('/')
  await leseLieferdienstEin(page)
  await pruefeBarrieren(page)
  await schritt(page, 'Anforderungen')
  await page.getByRole('button', { name: /^Bearbeiten/ }).first().click()
  await pruefeBarrieren(page)
  await schritt(page, 'Angebote')
  await pruefeBarrieren(page)
})

test('jedes Eingabefeld hat eine Beschriftung', async ({ page }) => {
  await page.goto('/')
  await ladeBeispiel(page)
  for (const name of SCHRITTE) {
    await schritt(page, name)
    const ohne = await page.locator('input:not([type="hidden"]):not([hidden]), select, textarea').evaluateAll((els) =>
      els.filter((e) => !(e as HTMLInputElement).labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).map((e) => e.outerHTML.slice(0, 100)),
    )
    expect(ohne, name).toEqual([])
  }
})

test('farbschema hell und dunkel lässt sich unabhängig vom System wählen', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await page.getByLabel('Farbschema').selectOption('dunkel')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await pruefeBarrieren(page)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByLabel('Farbschema').selectOption('system')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/)
})
