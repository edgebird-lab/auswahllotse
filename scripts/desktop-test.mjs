/**
 * Prüft das echte Windows-Programm (Debug-Build) ohne Installation: Start mit
 * der Startseite, Speichern unter, Speichern an den bekannten Pfad, Einlesen
 * einer Prozesslotse-Datei über den Dialog (die Datei bleibt unverändert),
 * CSV-Fragebogen, PDF beider Vorlagen in A4, zweiter Start mit Projekt- und
 * Prozessdatei (Single-Instance), Öffnen per Dialog, Rechte (kein Schreiben
 * auf fremde Pfade, kein Dialog-Plugin in der Oberfläche), Rückfrage beim
 * Schließen und dass verworfene Änderungen beim nächsten Start fehlen.
 *
 * Dateidialoge beantwortet der Debug-Build über Umgebungsvariablen; die
 * Oberfläche steuert Playwright über die Debug-Schnittstelle von WebView2
 * (Port 9335, der Prozesslotse nutzt 9333).
 *
 * Programmdaten (WebView2-Profil mit dem gesicherten Projekt) teilt der
 * Debug-Build mit einem installierten Auswahl-Lotsen. Der Test benennt sie
 * deshalb vorher um und stellt sie danach wieder her; ein laufender
 * Auswahl-Lotse bricht den Test ab.
 *
 * Vorher: npx tauri build --debug --no-bundle
 * Aufruf:  npm run desktop:test
 */
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const ZIEL = process.env.CARGO_TARGET_DIR ? resolve(process.env.CARGO_TARGET_DIR) : resolve('src-tauri/target')
const EXE = join(ZIEL, 'debug', 'auswahllotse.exe')
const KENNUNG = 'de.olbricht-digital.auswahllotse'
const PORT = 9335
const SICHERUNG = '.vor-desktop-test'
const appDaten = [join(process.env.APPDATA, KENNUNG), join(process.env.LOCALAPPDATA, KENNUNG)]

const ordner = mkdtempSync(join(tmpdir(), 'auswahllotse-desktop-'))
const datei = (name) => join(ordner, name)
const TITEL = 'Warenwirtschaft geändert'

function pruefe(bedingung, text) {
  if (!bedingung) throw new Error(`Fehlgeschlagen: ${text}`)
  console.log(`  ✓ ${text}`)
}

async function warte(bedingung, text, ms = 15000) {
  const ende = Date.now() + ms
  while (Date.now() < ende) {
    if (await bedingung()) return pruefe(true, text)
    await new Promise((r) => setTimeout(r, 200))
  }
  pruefe(false, text)
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const pruefsumme = (pfad) => createHash('sha256').update(readFileSync(pfad)).digest('hex')

/** Umbenennen mit Wiederholung: WebView2 gibt seine Dateien nach dem Beenden erst kurz danach frei. */
async function benenneUm(von, nach) {
  for (let i = 0; ; i++) {
    try {
      return renameSync(von, nach)
    } catch (e) {
      if (i >= 20) throw e
      await pause(500)
    }
  }
}

function laeuftSchon() {
  const liste = execFileSync('tasklist', ['/FI', 'IMAGENAME eq auswahllotse.exe', '/NH'], { encoding: 'utf8' })
  return liste.toLowerCase().includes('auswahllotse.exe')
}

async function sichereProgrammdaten() {
  for (const d of appDaten) {
    const s = d + SICHERUNG
    if (existsSync(s)) {
      // Rest eines abgebrochenen Laufs: erst die echte Sicherung zurückholen
      rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 })
      await benenneUm(s, d)
      console.log(`Sicherung eines abgebrochenen Laufs zurückgeholt: ${d}`)
    }
    if (existsSync(d)) {
      await benenneUm(d, s)
      console.log(`Programmdaten gesichert: ${d} → ${s}`)
    }
  }
}

async function stelleProgrammdatenWiederHer() {
  for (const d of appDaten) {
    rmSync(d, { recursive: true, force: true, maxRetries: 20, retryDelay: 500 })
    if (existsSync(d + SICHERUNG)) {
      await benenneUm(d + SICHERUNG, d)
      console.log(`Programmdaten wiederhergestellt: ${d}`)
    }
  }
}

function starte(args = []) {
  return spawn(EXE, args, {
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${PORT}`,
      AUSWAHLLOTSE_TEST_ORDNER: ordner,
      AUSWAHLLOTSE_TEST_OEFFNEN: datei('Neue Warenwirtschaft.auswahllotse'),
      AUSWAHLLOTSE_TEST_IMPORTIEREN: datei('onlinebestellung.prozesslotse'),
    },
    stdio: 'ignore',
  })
}

async function verbinde() {
  const ende = Date.now() + 40000
  while (Date.now() < ende) {
    try {
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`)
      const kontext = browser.contexts()[0]
      const seite = kontext.pages()[0] ?? (await kontext.waitForEvent('page', { timeout: 10000 }))
      // Beim allerersten Start legt WebView2 erst sein Profil an; die Seite kommt dann etwas später
      await seite.waitForURL(/tauri\.localhost/, { timeout: 20000 })
      await seite.waitForLoadState('domcontentloaded')
      return { browser, seite }
    } catch {
      await pause(500)
    }
  }
  throw new Error('Keine Verbindung zur WebView2')
}

/** Titel einer PDF-Datei aus dem Info-Eintrag (WebView2 schreibt ihn als UTF-16 in Hexform). */
function pdfTitel(pdf) {
  const hex = /\/Title\s*<([0-9A-Fa-f]+)>/.exec(pdf)
  if (hex) {
    const b = Buffer.from(hex[1], 'hex')
    if (b[0] === 0xfe && b[1] === 0xff) return b.subarray(2).swap16().toString('utf16le')
    return b.toString('latin1')
  }
  return /\/Title\s*\(([^)]*)\)/.exec(pdf)?.[1] ?? null
}

function pruefePdf(name, titel) {
  const pfad = datei(name)
  const pdf = readFileSync(pfad, 'latin1')
  pruefe(pdf.startsWith('%PDF-'), `„${name}“ ist ein PDF`)
  const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf)
  pruefe(box && Math.abs(Number(box[1]) - 595.3) < 2 && Math.abs(Number(box[2]) - 841.9) < 2, `Seite ist A4 (${box?.[1]} × ${box?.[2]} pt)`)
  pruefe(pdfTitel(pdf) === titel, `PDF-Titel „${pdfTitel(pdf)}“`)
  return (pdf.match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length
}

if (!existsSync(EXE)) {
  console.error(`Programm fehlt: ${EXE}\nVorher: npx tauri build --debug --no-bundle`)
  process.exit(1)
}
if (laeuftSchon()) {
  console.error('Der Auswahl-Lotse läuft bereits (installiert oder aus einem Test). Bitte schließen, dann den Test erneut starten.')
  process.exit(1)
}

copyFileSync('testdaten/prozesslotse/onlinebestellung.prozesslotse', datei('onlinebestellung.prozesslotse'))
copyFileSync('testdaten/prozesslotse/lieferdienst.prozesslotse', datei('lieferdienst.prozesslotse'))
const summeOnline = pruefsumme(datei('onlinebestellung.prozesslotse'))
const summeLiefer = pruefsumme(datei('lieferdienst.prozesslotse'))

await sichereProgrammdaten()
let prozess = starte()
let browser
const fehler = []
try {
  console.log(`Programm gestartet (PID ${prozess.pid}), Testordner ${ordner}`)
  let verbindung = await verbinde()
  browser = verbindung.browser
  let seite = verbindung.seite
  const beobachte = (s) => s.on('console', (m) => m.type() === 'error' && fehler.push(m.text()))
  beobachte(seite)
  const titel = () => seite.title()
  const schritt = (name) => seite.getByRole('navigation', { name: 'Schritte' }).getByRole('button', { name: new RegExp(name) }).click()
  const status = async () => (await seite.getByRole('status').textContent()) ?? ''

  // 1. Start: Fenster mit der Startseite, Richtlinien des Programms
  await seite.getByRole('heading', { level: 1, name: '1 · Rahmen' }).waitFor({ timeout: 20000 })
  await warte(async () => (await titel()) === 'Neues Vorhaben – Auswahl-Lotse', 'Startseite „1 · Rahmen“, Titel „Neues Vorhaben – Auswahl-Lotse“')
  pruefe((await seite.locator('meta[http-equiv="Content-Security-Policy"]').count()) === 0, 'kein CSP-Meta-Tag des Web-Builds (die Richtlinie setzt Tauri)')
  pruefe(await seite.evaluate(() => Object.isFrozen(Object.prototype)), 'freezePrototype ist aktiv')
  pruefe((await seite.getByRole('button', { name: 'Browser-Speicher leeren' }).count()) === 0, 'kein „Browser-Speicher leeren“ im Programm')

  // 2. Beispiel laden, „Speichern unter“ mit Strg+Umschalt+S
  await seite.getByRole('button', { name: 'Beispiel laden' }).click()
  await warte(async () => (await titel()) === 'Neue Warenwirtschaft – Auswahl-Lotse', 'Beispiel geladen')
  await seite.keyboard.press('Control+Shift+S')
  await warte(() => existsSync(datei('Neue Warenwirtschaft.auswahllotse')), 'Speichern unter schreibt „Neue Warenwirtschaft.auswahllotse“')
  await warte(async () => (await titel()) === 'Neue Warenwirtschaft.auswahllotse – Auswahl-Lotse', 'Fenstertitel zeigt den Dateinamen ohne Änderungspunkt')
  pruefe(JSON.parse(readFileSync(datei('Neue Warenwirtschaft.auswahllotse'), 'utf8')).app === 'auswahllotse', 'die Datei ist ein Auswahl-Lotse-Projekt')
  copyFileSync(datei('Neue Warenwirtschaft.auswahllotse'), datei('zweit.auswahllotse'))
  const summeZweit = pruefsumme(datei('zweit.auswahllotse'))

  // 3. Ändern: Punkt im Titel, Strg+S speichert ohne Dialog an denselben Ort
  await schritt('Rahmen')
  await seite.getByLabel('Wie heißt das Vorhaben?').fill(TITEL)
  await warte(async () => (await titel()).startsWith('• Neue Warenwirtschaft.auswahllotse'), 'Änderung zeigt den Punkt im Titel')
  await seite.keyboard.press('Control+s')
  await warte(() => readFileSync(datei('Neue Warenwirtschaft.auswahllotse'), 'utf8').includes(TITEL), 'Strg+S speichert an den bekannten Pfad')
  await warte(async () => !(await titel()).startsWith('•'), 'nach dem Speichern kein Änderungspunkt mehr')
  pruefe(!readdirSync(ordner).some((n) => n.endsWith('.tmp')), 'keine Hilfsdatei vom atomaren Speichern übrig')

  // 4. Prozessmodell über den Dialog einlesen; die Prozesslotse-Datei bleibt unverändert
  await schritt('Prozess')
  await seite.getByRole('button', { name: 'Neu einlesen …' }).click()
  const neuEinlesen = seite.getByRole('dialog', { name: 'Prozessmodell neu einlesen?' })
  await neuEinlesen.waitFor({ timeout: 10000 })
  await neuEinlesen.getByRole('button', { name: 'Übernehmen' }).click()
  await warte(async () => (await status()).includes('„onlinebestellung.prozesslotse“ eingelesen'), 'Einlesen-Dialog liest die Prozesslotse-Datei ein')
  await seite.keyboard.press('Control+s')
  await warte(() => readFileSync(datei('Neue Warenwirtschaft.auswahllotse'), 'utf8').includes('onlinebestellung.prozesslotse'), 'Strg+S schreibt das neue Modell ins Projekt')
  pruefe(pruefsumme(datei('onlinebestellung.prozesslotse')) === summeOnline, 'die eingelesene Datei ist unverändert')

  // 5. Rechte: Die Oberfläche schreibt nur auf gewählte Pfade und hat kein Dialog-Plugin
  const abgelehnt = (befehl, args) =>
    seite.evaluate(
      ([b, a]) =>
        Promise.race([
          window.__TAURI_INTERNALS__.invoke(b, a).then(
            () => 'erlaubt',
            (e) => String(e),
          ),
          new Promise((r) => setTimeout(() => r('keine Antwort'), 3000)),
        ]),
      [befehl, args],
    )
  const fremd = await abgelehnt('speichern', { pfad: datei('fremd.txt'), inhalt: 'x' })
  pruefe(fremd.includes('nicht vom Benutzer gewählt') && !existsSync(datei('fremd.txt')), 'Speichern auf einen nicht gewählten Pfad wird abgelehnt')
  const prozessdatei = await abgelehnt('speichern', { pfad: datei('onlinebestellung.prozesslotse'), inhalt: 'x' })
  pruefe(prozessdatei.includes('nicht vom Benutzer gewählt') && pruefsumme(datei('onlinebestellung.prozesslotse')) === summeOnline, 'eine eingelesene Prozesslotse-Datei ist nicht beschreibbar')
  const dialogPlugin = await abgelehnt('plugin:dialog|open', { options: {} })
  pruefe(dialogPlugin !== 'erlaubt' && dialogPlugin !== 'keine Antwort', `Dialog-Plugin ist für die Oberfläche gesperrt (${dialogPlugin.slice(0, 60)} …)`)
  const lesen = await abgelehnt('plugin:fs|read_text_file', { path: datei('lieferdienst.prozesslotse') })
  pruefe(lesen !== 'erlaubt' && lesen !== 'keine Antwort', `allgemeiner Dateizugriff ist gesperrt (${lesen.slice(0, 60)} …)`)

  // 6. Anbieterfragebogen als CSV
  await schritt('Vorlagen')
  await seite.getByRole('button', { name: 'Anbieterfragebogen (CSV)' }).click()
  const csv = `${TITEL} – Anbieterfragebogen.csv`
  await warte(() => existsSync(datei(csv)), `CSV „${csv}“ geschrieben`)
  const csvBytes = readFileSync(datei(csv))
  pruefe(csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf && csvBytes.toString('utf8').includes(';'), 'CSV mit BOM und Semikolon')

  // 7. PDF beider Vorlagen ohne Druckdialog
  await seite.getByRole('tab', { name: 'Lastenheft' }).click()
  await seite.getByRole('button', { name: 'Als PDF speichern …' }).click()
  const pdfL = `${TITEL} – Lastenheft.pdf`
  await warte(() => existsSync(datei(pdfL)) && readFileSync(datei(pdfL)).length > 1000, `PDF „${pdfL}“ geschrieben`, 30000)
  await warte(async () => (await status()).includes('PDF'), 'Meldung nennt das PDF')
  const seitenL = pruefePdf(pdfL, `${TITEL} – Lastenheft`)
  await seite.getByRole('tab', { name: 'Entscheidungsvorlage' }).click()
  await seite.getByRole('button', { name: 'Als PDF speichern …' }).click()
  const pdfE = `${TITEL} – Entscheidungsvorlage.pdf`
  await warte(() => existsSync(datei(pdfE)) && readFileSync(datei(pdfE)).length > 1000, `PDF „${pdfE}“ geschrieben`, 30000)
  const seitenE = pruefePdf(pdfE, `${TITEL} – Entscheidungsvorlage`)
  pruefe(seitenL > seitenE && seitenE >= 2, `Lastenheft ${seitenL} Seiten, Entscheidungsvorlage ${seitenE} Seiten`)
  pruefe((await titel()) === 'Neue Warenwirtschaft.auswahllotse – Auswahl-Lotse', 'Fenstertitel nach dem PDF wieder wie vorher')

  // 8. Zweiter Start mit einem Projekt: landet im laufenden Programm
  const zweiter = starte([datei('zweit.auswahllotse')])
  await new Promise((r) => zweiter.on('exit', r))
  pruefe(true, 'zweiter Start beendet sich sofort')
  await warte(async () => (await titel()) === 'zweit.auswahllotse – Auswahl-Lotse', 'das Projekt öffnet sich im laufenden Programm')

  // 9. Zweiter Start mit einer Prozesslotse-Datei („Öffnen mit“): wird eingelesen, nicht geöffnet
  const dritter = starte([datei('lieferdienst.prozesslotse')])
  await new Promise((r) => dritter.on('exit', r))
  await neuEinlesen.waitFor({ timeout: 10000 })
  await neuEinlesen.getByRole('button', { name: 'Übernehmen' }).click()
  await warte(async () => (await status()).includes('„lieferdienst.prozesslotse“ eingelesen'), 'Prozesslotse-Datei aus dem Explorer wird eingelesen')
  await seite.getByRole('heading', { level: 1, name: '2 · Prozess' }).waitFor({ timeout: 5000 })
  pruefe(true, 'danach zeigt das Programm den Schritt „Prozess“')
  pruefe(pruefsumme(datei('lieferdienst.prozesslotse')) === summeLiefer, 'die Prozesslotse-Datei ist unverändert')

  // 10. Öffnen-Dialog (Strg+O) mit ungespeicherten Änderungen: „Nicht speichern“
  await seite.keyboard.press('Control+o')
  const rueckfrage = seite.getByRole('dialog', { name: 'Änderungen speichern?' })
  await rueckfrage.waitFor({ timeout: 10000 })
  pruefe((await rueckfrage.textContent())?.includes('„zweit.auswahllotse“ sind noch nicht gespeichert'), 'Rückfrage nennt die Datei')
  await rueckfrage.getByRole('button', { name: 'Nicht speichern' }).click()
  await warte(async () => (await titel()) === 'Neue Warenwirtschaft.auswahllotse – Auswahl-Lotse', 'Strg+O öffnet die Projektdatei')
  pruefe(pruefsumme(datei('zweit.auswahllotse')) === summeZweit, '„zweit.auswahllotse“ blieb unverändert')

  // 11. Schließen mit ungespeicherten Änderungen: erst abbrechen, dann verwerfen
  await schritt('Rahmen')
  await seite.getByLabel('Wie heißt das Vorhaben?').fill('Nicht gespeichert')
  await warte(async () => (await titel()).startsWith('•'), 'Änderung vor dem Schließen')
  execFileSync('taskkill', ['/PID', String(prozess.pid)])
  await rueckfrage.waitFor({ timeout: 10000 })
  pruefe(true, 'Schließen fragt nach ungespeicherten Änderungen')
  await rueckfrage.getByRole('button', { name: 'Abbrechen' }).click()
  await pause(1000)
  pruefe(prozess.exitCode === null, 'Abbrechen lässt das Programm offen')
  execFileSync('taskkill', ['/PID', String(prozess.pid)])
  await rueckfrage.waitFor({ timeout: 10000 })
  await rueckfrage.getByRole('button', { name: 'Nicht speichern' }).click()
  await warte(() => prozess.exitCode !== null, '„Nicht speichern“ beendet das Programm')
  pruefe(!readFileSync(datei('Neue Warenwirtschaft.auswahllotse'), 'utf8').includes('Nicht gespeichert'), 'die verworfene Änderung steht nicht in der Datei')
  await browser.close().catch(() => {})

  // 12. Neustart: Die verworfenen Änderungen kommen nicht zurück; Schließen ohne Änderungen fragt nicht
  await pause(1500)
  prozess = starte()
  verbindung = await verbinde()
  browser = verbindung.browser
  seite = verbindung.seite
  beobachte(seite)
  await seite.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 20000 })
  await warte(async () => (await seite.title()) === 'Neues Vorhaben – Auswahl-Lotse', 'Neustart beginnt ohne die verworfenen Änderungen')
  execFileSync('taskkill', ['/PID', String(prozess.pid)])
  await warte(() => prozess.exitCode !== null, 'Schließen ohne Änderungen beendet sofort')

  const csp = fehler.filter((f) => /Content Security Policy|Refused to/i.test(f))
  pruefe(csp.length === 0, `keine Verstöße gegen die Inhaltsrichtlinie${csp.length ? `: ${csp.join(' | ')}` : ''}`)
  if (fehler.length) console.log(`  Hinweis: ${fehler.length} Konsolenfehler: ${fehler.slice(0, 3).join(' | ')}`)
  console.log('Desktop-Test bestanden.')
} finally {
  await browser?.close().catch(() => {})
  if (prozess.exitCode === null) prozess.kill()
  await pause(1500)
  if (process.env.DESKTOP_TEST_BEHALTEN) console.log(`Testdateien bleiben in ${ordner}`)
  else rmSync(ordner, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 })
  await stelleProgrammdatenWiederHer()
}
