// Erzeugt die Bildschirmfotos für die README in docs/bilder und die PDF-Proben
// der Vorlagen in docs/proben (Spezifikation 7.1, 7.4).
// Aufruf: npm run build && npx vite preview --port 4183 --strictPort & node scripts/readme-bilder.mjs
// Nutzt das installierte Edge (lokal) bzw. Chrome (CI); lädt keinen Browser herunter.
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const bilder = 'docs/bilder'
const proben = 'docs/proben'
await mkdir(bilder, { recursive: true })
await mkdir(proben, { recursive: true })
const browser = await chromium.launch({ channel: process.env.CI ? 'chrome' : 'msedge' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', locale: 'de-DE' })
const schritt = async (name) => {
  await page.getByRole('navigation', { name: 'Schritte' }).getByRole('button', { name }).click()
  await page.waitForTimeout(400)
}
const oben = () => page.evaluate(() => window.scrollTo(0, 0))
/** Abschnitt an den oberen Rand holen, mit etwas Luft darüber. */
const nachOben = async (selektor, luft = 90) => {
  await page.locator(selektor).evaluate((e) => e.scrollIntoView({ block: 'start' }))
  await page.evaluate((y) => window.scrollBy(0, -y), luft)
}

await page.goto(process.env.ADRESSE ?? 'http://localhost:4183/')
await page.getByRole('button', { name: 'Beispiel laden' }).click()
// Lernmodus aus: Die Bilder zeigen die Arbeitsfläche
await page.getByRole('switch', { name: 'Lernmodus' }).uncheck({ force: true })

await schritt(/Prozess/)
await nachOben('#umfang-titel')
await page.screenshot({ path: `${bilder}/umfang.png` })

await schritt(/Anforderungen/)
await oben()
await page.screenshot({ path: `${bilder}/anforderungen.png` })

await schritt(/Gewichtung/)
await nachOben('#haupt-titel', 40)
await page.screenshot({ path: `${bilder}/gewichtung.png` })

await schritt(/Ergebnis/)
await nachOben('#empfehlung', 30)
await page.screenshot({ path: `${bilder}/ergebnis.png` })
await nachOben('#sens-titel', 30)
await page.screenshot({ path: `${bilder}/sensitivitaet.png` })

await schritt(/Vorlagen/)
await page.emulateMedia({ media: 'print' })
await page.pdf({ path: `${proben}/lastenheft-lieferdienst.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true })
await page.emulateMedia({ media: 'screen' })
await page.getByRole('tab', { name: 'Entscheidungsvorlage' }).click()
await page.waitForTimeout(300)
await nachOben('.druck-dokument', 20)
await page.screenshot({ path: `${bilder}/entscheidungsvorlage.png` })
await page.emulateMedia({ media: 'print' })
await page.pdf({ path: `${proben}/entscheidungsvorlage-lieferdienst.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true })

await browser.close()
console.log('Bilder in', bilder, '· PDF-Proben in', proben)
