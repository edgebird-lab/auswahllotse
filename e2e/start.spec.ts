import { expect, test } from '@playwright/test'

test('ein neues Projekt beginnt mit dem Rahmen und dem Katalog', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: '1 · Rahmen' })).toBeVisible()
  await expect(page).toHaveTitle('Neues Vorhaben – Auswahl-Lotse')
  // Die Gewichtung braucht Soll- oder Kann-Anforderungen (hier aus dem Katalog), das Ergebnis ein Angebot
  const schritte = page.getByRole('navigation', { name: 'Schritte' })
  await expect(schritte.getByRole('button', { name: /Gewichtung/ })).toBeEnabled()
  await expect(schritte.getByRole('button', { name: /Ergebnis/ })).toBeDisabled()
  await schritte.getByRole('button', { name: /Anforderungen/ }).click()
  await expect(page.locator('#anforderungen-kopf')).toContainText('16 aktive Anforderungen · 10 Vorschläge offen')
  // Eine Änderung setzt den Punkt für Ungespeichertes in den Titel
  await page.getByRole('navigation', { name: 'Schritte' }).getByRole('button', { name: /Rahmen/ }).click()
  await page.getByLabel('Wie heißt das Vorhaben?').fill('Neues CRM')
  await expect(page).toHaveTitle('• Neues CRM – Auswahl-Lotse')
})

test('der Build setzt eine Inhaltsrichtlinie ohne Verbindungen nach außen', async ({ page }) => {
  await page.goto('/')
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
  expect(csp).toContain("default-src 'self'")
  expect(csp).toContain("connect-src 'none'")
})
