// Rundgang durch die App mit Bildschirmfotos (Entwicklungswerkzeug).
// Aufruf: npm run build && npx vite preview --port 4183 --strictPort & node scripts/ansehen.mjs <zielordner>
// Nutzt das installierte Edge (lokal) bzw. Chrome (CI); lädt keinen Browser herunter.
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const ziel = process.argv[2] ?? 'bilder'
const adresse = process.env.ADRESSE ?? 'http://localhost:4183/'
await mkdir(ziel, { recursive: true })
const browser = await chromium.launch({ channel: process.env.CI ? 'chrome' : 'msedge' })
const meldungen = []

async function seite(optionen = {}) {
  const kontext = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE', ...optionen })
  const page = await kontext.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') meldungen.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => meldungen.push(`pageerror: ${e.message}`))
  await page.goto(adresse)
  return page
}
const foto = (page, name, ganz = true) => page.screenshot({ path: `${ziel}/${name}.png`, fullPage: ganz })
const schritt = (page, name) => page.getByRole('navigation', { name: 'Schritte' }).getByRole('button', { name }).click()
const SCHRITTE = ['Rahmen', 'Prozess', 'Anforderungen', 'Gewichtung', 'Angebote', 'Ergebnis', 'Vorlagen']

for (const schema of ['light', 'dark']) {
  const page = await seite({ colorScheme: schema })
  await page.waitForTimeout(400)
  await foto(page, `${schema}-00-start`, false)
  await page.getByRole('button', { name: 'Beispiel laden' }).click()
  await page.waitForTimeout(600)
  for (const [i, name] of SCHRITTE.entries()) {
    await schritt(page, new RegExp(name))
    await page.waitForTimeout(500)
    await foto(page, `${schema}-${String(i + 1).padStart(2, '0')}-${name.toLowerCase()}`)
  }
  await page.getByRole('tab', { name: 'Entscheidungsvorlage' }).click()
  await page.waitForTimeout(400)
  await foto(page, `${schema}-08-entscheidungsvorlage`)
  await page.emulateMedia({ media: 'print' })
  await foto(page, `${schema}-09-druck-entscheidung`)
  await page.emulateMedia({ media: 'screen' })
  await page.close()
}

const handy = await seite({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await handy.getByRole('button', { name: 'Beispiel laden' }).click()
await handy.waitForTimeout(600)
await foto(handy, 'handy-ergebnis', false)

await browser.close()
console.log(meldungen.length ? meldungen.join('\n') : 'Keine Meldungen in der Konsole.')
console.log('Bilder in', ziel)
