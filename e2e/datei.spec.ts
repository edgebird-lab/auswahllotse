import { expect, test } from '@playwright/test'
import { DATEI, inhalt, ladeBeispiel, leseLieferdienstEin, oeffneProjekt, schritt } from './hilfen.ts'

test('Paarvergleich mit Widerspruch zeigt das widersprüchlichste Urteil (E4)', async ({ page }) => {
  await page.goto('/')
  await oeffneProjekt(page, DATEI.abc)
  await expect(page.getByRole('status')).toContainText('bewertung-abc.auswahllotse')
  await schritt(page, 'Gewichtung')
  await page.getByText('Paarvergleich (AHP)').click()
  // T-AHP3: a12 = 9, a23 = 9, a13 = 1/9
  const funktionenGegenBetrieb = page.getByRole('group', { name: '„Funktionen“ gegen „Betrieb und Support“' })
  await funktionenGegenBetrieb.getByRole('radio', { name: '„Funktionen“ sehr viel wichtiger (9)' }).check()
  const betriebGegenAnbieter = page.getByRole('group', { name: '„Betrieb und Support“ gegen „Anbieter und Einführung“' })
  await betriebGegenAnbieter.getByRole('radio', { name: '„Betrieb und Support“ sehr viel wichtiger (9)' }).check()
  const funktionenGegenAnbieter = page.getByRole('group', { name: '„Funktionen“ gegen „Anbieter und Einführung“' })
  await funktionenGegenAnbieter.getByRole('radio', { name: '„Anbieter und Einführung“ sehr viel wichtiger (9)' }).check()
  await expect(page.locator('#gewichte')).toContainText('Prüfen Sie')
  await expect(page.locator('#gewichte')).toContainText('widersprüchlich (CR 6,13')
})

test('speichern, neu laden und öffnen ergibt denselben Inhalt (E6)', async ({ page }) => {
  await page.goto('/')
  await ladeBeispiel(page)
  await schritt(page, 'Rahmen')
  await page.getByLabel('Wie heißt das Vorhaben?').fill('ERP für den Lieferdienst')
  const [erste] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Speichern', exact: true }).click()])
  expect(erste.suggestedFilename()).toBe('ERP für den Lieferdienst.auswahllotse')
  const gespeichert = JSON.parse((await inhalt(erste)).toString('utf8'))
  expect(gespeichert.rahmen.vorhaben).toBe('ERP für den Lieferdienst')

  // Neu laden: Das Projekt kommt aus dem Browser-Speicher zurück
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('6 · Ergebnis')
  // Neues Projekt ohne Rückfrage (nichts ungespeichert), dann die Datei öffnen
  await page.getByRole('button', { name: 'Neu', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('1 · Rahmen')
  await expect(page.getByLabel('Wie heißt das Vorhaben?')).toHaveValue('')
  await oeffneProjekt(page, (await erste.path())!)
  const [zweite] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Speichern', exact: true }).click()])
  const wieder = JSON.parse((await inhalt(zweite)).toString('utf8'))
  expect({ ...wieder, geaendertAm: null }).toEqual({ ...gespeichert, geaendertAm: null })
})

test('überschreibt einen unlesbaren Stand im Browser nicht still, sondern meldet ihn und bietet eine Kopie an', async ({ page }) => {
  await page.goto('/')
  await ladeBeispiel(page)
  // Der gesicherte Stand ist beschädigt (z. B. abgeschnitten)
  const kaputt = '{"app":"auswahllotse","formatVersion":1,"id":"abc"'
  await page.evaluate((text) => localStorage.setItem('auswahllotse:projekt', text), kaputt)
  await page.reload()
  const meldung = page.getByRole('alert')
  await expect(meldung).toContainText('Das zuletzt im Browser gesicherte Projekt lässt sich nicht laden: Die Datei ist kein gültiges JSON.')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('1 · Rahmen')
  const [kopie] = await Promise.all([page.waitForEvent('download'), meldung.getByRole('button', { name: 'Kopie herunterladen' }).click()])
  expect(kopie.suggestedFilename()).toBe('Unlesbarer Stand.auswahllotse')
  expect((await inhalt(kopie)).toString('utf8')).toBe(kaputt)
  // Das neue Projekt belegt den Speicherplatz, die Kopie bleibt bis „Browser-Speicher leeren“
  expect(await page.evaluate(() => localStorage.getItem('auswahllotse:projekt-unlesbar'))).toBe(kaputt)
  await meldung.getByRole('button', { name: 'Meldung schließen' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('fragt vor dem Verwerfen ungespeicherter Änderungen nach', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Wie heißt das Vorhaben?').fill('Ungespeichert')
  await page.getByRole('button', { name: 'Neu', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Änderungen speichern?' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Wie heißt das Vorhaben?')).toHaveValue('Ungespeichert')
  await page.getByRole('button', { name: 'Neu', exact: true }).click()
  await dialog.getByRole('button', { name: 'Verwerfen' }).click()
  await expect(page.getByLabel('Wie heißt das Vorhaben?')).toHaveValue('')
})

test('CSV-Fragebogen mit BOM, Kopfzeile und einer Zeile je aktiver Anforderung (E7)', async ({ page }) => {
  await page.goto('/')
  await leseLieferdienstEin(page)
  await schritt(page, 'Rahmen')
  await page.getByLabel('Wie heißt das Vorhaben?').fill('Neue Warenwirtschaft')
  await schritt(page, 'Vorlagen')
  const [datei] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Anbieterfragebogen (CSV)' }).click()])
  expect(datei.suggestedFilename()).toBe('Neue Warenwirtschaft – Anbieterfragebogen.csv')
  const bytes = await inhalt(datei)
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  const zeilen = bytes.subarray(3).toString('utf8').split('\r\n')
  expect(zeilen.pop()).toBe('')
  expect(zeilen).toHaveLength(36)
  expect(zeilen[0]).toBe('Nr.;Gruppe;Titel;Anforderung;Priorität;Abnahmekriterium;Erfüllt (ja/teilweise/nein);Erläuterung des Anbieters;Fundstelle im Angebot')
})

test('Druckansicht des Lastenhefts zeigt alle Abschnitte ohne Bedienelemente (E8)', async ({ page }) => {
  await page.goto('/')
  await ladeBeispiel(page)
  await schritt(page, 'Vorlagen')
  await page.emulateMedia({ media: 'print' })
  const abschnitte = [
    '1 Ausgangslage und Ziel',
    '2 Umfang',
    '3 Funktionen',
    '4 Schnittstellen und Datenfluss',
    '5 Benutzer, Rechte und Kontrollen',
    '6 Mengen und Leistung',
    '7 Datenschutz und Sicherheit',
    '8 Ordnungsmäßigkeit (AO, GoBD)',
    '9 Betrieb und Support',
    '10 Barrierefreiheit',
    '11 Anbieter und Einführung',
    '12 Hinweise',
  ]
  for (const a of abschnitte) await expect(page.getByRole('heading', { name: a, exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Anhang: Gliederung des Prozesses' })).toBeVisible()
  await expect(page.locator('button:visible, input:visible, select:visible, textarea:visible')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Schritte' })).toBeHidden()
  await expect(page.locator('.druck-dokument')).toContainText('Rechtliche Anforderungen ohne Gewähr, keine Rechtsberatung, Stand 11.11.2026.')
})
