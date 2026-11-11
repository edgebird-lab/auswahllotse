import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, type Download, type Page } from '@playwright/test'

/** Testdateien liegen im Repo; Playwright läuft im Projektordner. */
export const DATEI = {
  lieferdienst: resolve('testdaten/prozesslotse/lieferdienst.prozesslotse'),
  lieferdienstBpmn: resolve('testdaten/prozesslotse/lieferdienst-eingebettet.bpmn'),
  keinJson: resolve('testdaten/prozesslotse/kaputt/kein-json.prozesslotse'),
  doctype: resolve('testdaten/prozesslotse/kaputt/doctype.bpmn'),
  abc: resolve('testdaten/bewertung-abc.auswahllotse'),
  beispiel: resolve('testdaten/beispiel-lieferdienst.auswahllotse'),
}

export const SCHRITTE = ['Rahmen', 'Prozess', 'Anforderungen', 'Gewichtung', 'Angebote', 'Ergebnis', 'Vorlagen'] as const

/** Prüft die Seite mit axe; Befunde der Stufen „serious“ und „critical“ lassen den Test scheitern. */
export async function pruefeBarrieren(page: Page) {
  const ergebnis = await new AxeBuilder({ page }).analyze()
  const schwer = ergebnis.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(schwer.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([])
}

export async function schritt(page: Page, name: (typeof SCHRITTE)[number]) {
  await page.getByRole('navigation', { name: 'Schritte' }).getByRole('button', { name: new RegExp(name) }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name)
}

export async function ladeBeispiel(page: Page) {
  await page.getByRole('button', { name: 'Beispiel laden' }).click()
  await expect(page.getByRole('status')).toContainText('Lieferdienst sucht Warenwirtschaft')
}

/** Liest im Schritt „Prozess“ eine Prozesslotse-Datei ein. */
export async function leseProzessEin(page: Page, pfad: string) {
  await schritt(page, 'Prozess')
  await page.locator('#prozess-datei').setInputFiles(pfad)
}

/** Rahmen L der Spezifikation (9.1): ERP, personenbezogen, steuerrelevant, Cloud; der Rest sind Standardwerte. */
export async function rahmenL(page: Page) {
  await schritt(page, 'Rahmen')
  await page.getByText('beim Anbieter (Cloud)').click()
  await expect(page.getByRole('radio', { name: 'beim Anbieter (Cloud)' })).toBeChecked()
}

/** Rahmen L und das Beispiel des Prozesslotsen; wartet, bis die Karte es zeigt. */
export async function leseLieferdienstEin(page: Page) {
  await rahmenL(page)
  await leseProzessEin(page, DATEI.lieferdienst)
  await expect(page.locator('#prozess-karte')).toContainText('18 Aufgaben, 6 Rollen')
}

export async function oeffneProjekt(page: Page, pfad: string) {
  await page.getByLabel('Projektdatei öffnen').setInputFiles(pfad)
}

export async function inhalt(download: Download): Promise<Buffer> {
  return readFile((await download.path())!)
}
