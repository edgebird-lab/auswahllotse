// Schreibt docs/fremdlizenzen.md: alle Fremdbestandteile, die in die Web-App und das
// Windows-Programm einfließen, mit Version und Lizenz.
// - npm: Laufzeit-Abhängigkeiten aus package-lock.json (ohne Entwicklungswerkzeuge)
// - Rust: normale Abhängigkeiten für Windows x64 laut `cargo metadata` (ohne Build- und Test-Abhängigkeiten)
// Aufruf: node scripts/fremdlizenzen.mjs (cargo muss im PATH sein)
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const zelle = (s) => String(s ?? '–').replaceAll('|', '\\|')

// npm: Abschluss der Laufzeit-Abhängigkeiten ab der Wurzel
const sperre = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const pakete = sperre.packages
const npm = new Map()
const offen = Object.keys(pakete[''].dependencies ?? {})
while (offen.length > 0) {
  const name = offen.pop()
  if (npm.has(name)) continue
  const eintrag = pakete[`node_modules/${name}`]
  if (!eintrag) throw new Error(`${name} fehlt in package-lock.json`)
  npm.set(name, eintrag)
  for (const weiter of Object.keys(eintrag.dependencies ?? {})) offen.push(weiter)
}

// Rust: Abschluss der normalen Kanten ab dem eigenen Paket
const meta = JSON.parse(
  execFileSync(
    'cargo',
    ['metadata', '--format-version', '1', '--locked', '--manifest-path', 'src-tauri/Cargo.toml', '--filter-platform', 'x86_64-pc-windows-msvc'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  ),
)
const knoten = new Map(meta.resolve.nodes.map((k) => [k.id, k]))
const paketNach = new Map(meta.packages.map((p) => [p.id, p]))
const rust = new Map()
const stapel = [meta.resolve.root]
while (stapel.length > 0) {
  const id = stapel.pop()
  if (rust.has(id)) continue
  rust.set(id, paketNach.get(id))
  for (const d of knoten.get(id).deps) {
    if (d.dep_kinds.some((k) => k.kind === null)) stapel.push(d.pkg)
  }
}
rust.delete(meta.resolve.root)

const npmZeilen = [...npm.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, e]) => `| ${zelle(name)} | ${zelle(e.version)} | ${zelle(e.license)} |`)
const rustListe = [...rust.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
const rustZeilen = rustListe.map((p) => `| ${zelle(p.name)} | ${zelle(p.version)} | ${zelle(p.license ?? (p.license_file ? 'eigene Lizenzdatei' : null))} | ${zelle(p.repository)} |`)

const lizenzen = new Map()
for (const p of rustListe) lizenzen.set(p.license ?? 'ohne Angabe', (lizenzen.get(p.license ?? 'ohne Angabe') ?? 0) + 1)
const lizenzZeilen = [...lizenzen.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([l, n]) => `| ${zelle(l)} | ${n} |`)

const text = `# Fremdbestandteile und ihre Lizenzen

Der Auswahl-Lotse selbst steht unter keiner offenen Lizenz (siehe [README](../README.md#rechte)). Die folgenden Fremdbestandteile fließen in die Web-App und das Windows-Programm ein und stehen unter ihren eigenen Lizenzen. Die vollständigen Lizenztexte liegen jeweils im Paket und im verlinkten Repository.

Erzeugt mit \`node scripts/fremdlizenzen.mjs\` aus \`package-lock.json\` und \`cargo metadata\` (Windows x64). Entwicklungswerkzeuge (Vite, TypeScript, Vitest, Playwright, axe, oxlint, Tauri-CLI) und Build-Abhängigkeiten werden nicht ausgeliefert und fehlen deshalb hier; ihre Lizenzen stehen in [spezifikation.md](spezifikation.md), Abschnitt 7.1.

## Weitere Bestandteile des Installers

| Bestandteil | Lizenz | Hinweis |
| --- | --- | --- |
| NSIS (Installer-Gerüst, von Tauri eingebunden) | zlib/libpng | https://nsis.sourceforge.io/License |
| Microsoft Edge WebView2 Runtime | Microsoft-Lizenz | nicht im Installer enthalten; fehlt sie, lädt der Installer den Bootstrapper von Microsoft |

## Web-Oberfläche (npm, ${npmZeilen.length} Pakete)

| Paket | Version | Lizenz |
| --- | --- | --- |
${npmZeilen.join('\n')}

## Windows-Programm (Rust, ${rustZeilen.length} Crates)

Übersicht der Lizenzen:

| Lizenz (SPDX) | Crates |
| --- | --- |
${lizenzZeilen.join('\n')}

| Crate | Version | Lizenz (SPDX) | Repository |
| --- | --- | --- | --- |
${rustZeilen.join('\n')}
`

writeFileSync('docs/fremdlizenzen.md', text)
console.log(`docs/fremdlizenzen.md: ${npmZeilen.length} npm-Pakete, ${rustZeilen.length} Crates`)
