import { defineConfig } from '@playwright/test'

const CI = !!process.env.CI
// Fester Port des Auswahl-Lotsen (der Prozesslotse nutzt 4173). Auf diesem Rechner laufen
// mehrere Apps gleichzeitig; ist der Port belegt, bricht der Lauf ab, statt einen fremden
// oder veralteten Server zu prüfen.
const PORT = 4183

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: CI ? 2 : 3,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Vorhandenen Browser nutzen statt einen herunterzuladen: lokal Edge, in der CI Chrome
    channel: CI ? 'chrome' : 'msedge',
    locale: 'de-DE',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
