import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/** Prüft die Seite mit axe; Befunde der Stufen „serious“ und „critical“ lassen den Test scheitern. */
async function pruefe(page: Page) {
  const ergebnis = await new AxeBuilder({ page }).analyze()
  const schwer = ergebnis.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(schwer.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([])
}

for (const schema of ['light', 'dark'] as const) {
  test(`Startseite ohne schwere Barrieren (${schema === 'light' ? 'hell' : 'dunkel'})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: schema })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Auswahl-Lotse' })).toBeVisible()
    await pruefe(page)
  })
}

test('der Build setzt eine Inhaltsrichtlinie ohne Verbindungen nach außen', async ({ page }) => {
  await page.goto('/')
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
  expect(csp).toContain("default-src 'self'")
  expect(csp).toContain("connect-src 'none'")
})
