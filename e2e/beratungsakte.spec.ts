import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { inhalt, ladeBeispiel, pruefeBarrieren, schritt } from './hilfen.ts'

// Export „Für die Beratungsakte speichern“ im Schritt „Vorlagen“ (Format Beratungsakte v1)

function heute(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const knopfVon = (page: Page) => page.getByRole('button', { name: 'Für die Beratungsakte speichern' })
const dialogVon = (page: Page) => page.getByRole('dialog', { name: 'Für die Beratungsakte speichern' })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await ladeBeispiel(page)
})

test('Dialog: Vorbelegung, Pflichtfeld, Abbrechen, Escape und Fokus; Speichern lädt die Akte herunter', async ({ page }) => {
  // Was die Oberfläche zeigt: Befunde im Ergebnis, ausgeschiedene Angebote, Risiken mit Maßnahme
  await schritt(page, 'Ergebnis')
  const befundListe = page.locator('section[aria-labelledby="befunde-titel"] li')
  await expect(befundListe).toHaveCount(3)
  const befunde = await befundListe.count()
  const ausgeschieden = await page.locator('section[aria-labelledby="ko-titel"] tbody tr', { hasText: 'ausgeschieden' }).count()
  expect(ausgeschieden).toBe(1)
  await schritt(page, 'Vorlagen')
  await page.getByRole('tab', { name: 'Entscheidungsvorlage' }).click()
  const risiken = page.locator('#entscheidung-bedienung li.risiko')
  await expect(risiken).toHaveCount(2)
  const massnahmen = await page.getByRole('textbox', { name: /^Maßnahme zu Risiko/ }).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))
  const mitMassnahme = massnahmen.filter((v) => v.trim()).length
  expect(mitMassnahme).toBe(2)

  const knopf = knopfVon(page)
  const dialog = dialogVon(page)
  const mandant = dialog.getByRole('textbox', { name: 'Mandant', exact: true })

  // Escape schließt, Fokus zurück auf den Knopf
  await knopf.click()
  await expect(dialog).toBeVisible()
  await expect(mandant).toBeFocused()
  await expect(mandant).toHaveValue('Lieferdienst Beispiel GmbH')
  await expect(dialog).toContainText('Enthält: 39 Kennzahlen, 6 Befunde, 3 Maßnahmen')
  await expect(dialog).toContainText(`Lieferdienst-Beispiel-GmbH-auswahllotse-${heute()}.beratungsakte.json`)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(knopf).toBeFocused()

  // Abbrechen ebenso
  await knopf.click()
  await dialog.getByRole('button', { name: 'Abbrechen' }).click()
  await expect(dialog).toBeHidden()
  await expect(knopf).toBeFocused()

  // Pflichtfeld: ohne Mandant kein Download, Meldung am Feld
  await knopf.click()
  await mandant.fill('  ')
  let heruntergeladen = false
  page.on('download', () => (heruntergeladen = true))
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Bitte den Mandanten angeben.')
  await expect(mandant).toHaveAttribute('aria-invalid', 'true')
  await expect(mandant).toBeFocused()
  expect(heruntergeladen).toBe(false)

  // Mandant mit Umlauten und Nummer: Dateiname folgt sofort
  await mandant.fill('Bäckerei Groß & Söhne GbR')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await dialog.getByRole('textbox', { name: 'Mandantennummer (optional)' }).fill('K-0815')
  const dateiname = `Bäckerei-Groß-&-Söhne-GbR-auswahllotse-${heute()}.beratungsakte.json`
  await expect(dialog).toContainText(dateiname)
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Speichern' }).click()])
  await expect(dialog).toBeHidden()
  await expect(knopf).toBeFocused()
  expect(download.suggestedFilename()).toBe(dateiname)
  await expect(page.getByRole('status')).toContainText(`Beratungsakte „${dateiname}“ gespeichert.`)

  const bytes = await inhalt(download)
  expect(bytes[0]).toBe(0x7b) // UTF-8 ohne BOM
  const akte = JSON.parse(bytes.toString('utf8'))
  expect(akte.format).toBe('beratungsakte')
  expect(akte.formatVersion).toBe('1.0')
  expect(akte.erzeugtVon).toMatchObject({ app: 'auswahllotse', name: 'Auswahl-Lotse' })
  expect(akte.mandant).toEqual({ name: 'Bäckerei Groß & Söhne GbR', kennung: 'K-0815' })
  expect(akte.analyse).toMatchObject({ art: 'softwareauswahl', titel: 'Neue Warenwirtschaft', stand: heute() })
  expect(akte.befunde).toHaveLength(befunde + ausgeschieden + 2)
  expect(akte.massnahmen).toHaveLength(1 + mitMassnahme)
  expect(akte.massnahmen[0]).toMatchObject({ kennung: 'wahl:angebot-nord', prioritaet: 'hoch' })
  expect(akte.kennzahlen.find((k: { kennung?: string }) => k.kennung === 'nutzwert:angebot-nord').wert).toBe(8.52)
})

test('eine abweichende Wahl steht mit ihrer Warnung in der Akte', async ({ page }) => {
  await schritt(page, 'Vorlagen')
  await page.getByRole('tab', { name: 'Entscheidungsvorlage' }).click()
  await page.getByLabel('Gewähltes Angebot').selectOption({ label: 'Anbieter West · West Komplett' })
  await knopfVon(page).click()
  const dialog = dialogVon(page)
  await expect(dialog).toContainText('7 Befunde, 3 Maßnahmen')
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Speichern' }).click()])
  const akte = JSON.parse((await inhalt(download)).toString('utf8'))
  expect(akte.massnahmen[0]).toMatchObject({ kennung: 'wahl:angebot-west', befunde: ['D4:angebot-west'], erweiterungen: { auswahllotse: { abweichend: true } } })
  expect(akte.befunde.find((b: { kennung: string }) => b.kennung === 'D4:angebot-west')).toMatchObject({ schwere: 'mittel' })
})

for (const schema of ['light', 'dark'] as const) {
  test(`Knopf und Dialog ohne schwere Barrieren (${schema === 'light' ? 'hell' : 'dunkel'})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: schema })
    await schritt(page, 'Vorlagen')
    const knopf = knopfVon(page)
    await expect(knopf).toBeVisible()
    await pruefeBarrieren(page)
    // Bildschirmfotos nur auf Wunsch: BERATUNGSAKTE_BILDER=<Ordner>
    const bilder = process.env.BERATUNGSAKTE_BILDER
    const art = schema === 'light' ? 'hell' : 'dunkel'
    if (bilder) await page.locator('section[aria-labelledby="export-titel"]').screenshot({ path: join(bilder, `auswahllotse-knopf-${art}.png`) })
    await knopf.click()
    const dialog = dialogVon(page)
    await expect(dialog).toBeVisible()
    await pruefeBarrieren(page)
    if (bilder) await page.screenshot({ path: join(bilder, `auswahllotse-dialog-${art}.png`) })
    // auch mit Meldung am Feld
    await dialog.getByRole('textbox', { name: 'Mandant', exact: true }).fill('')
    await dialog.getByRole('button', { name: 'Speichern' }).click()
    await expect(dialog.getByRole('alert')).toBeVisible()
    await pruefeBarrieren(page)
    if (bilder) await dialog.screenshot({ path: join(bilder, `auswahllotse-dialog-meldung-${art}.png`) })
  })
}
