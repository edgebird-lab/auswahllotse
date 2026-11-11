/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Inhaltsrichtlinie (CSP) für den Web-Build: nur eigene Dateien, keine
 * Verbindungen nach außen. Nur beim Bauen, weil der Entwicklungsserver
 * eingebettete Skripte für das Neuladen braucht.
 */
const CSP = "default-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"

function inhaltsrichtlinie(): Plugin {
  return {
    name: 'auswahllotse-csp',
    apply: 'build',
    // direkt hinter die Zeichensatzangabe, damit die Richtlinie vor allen Skripten steht
    transformIndexHtml: (html) => html.replace(/<meta charset="UTF-8" \/>/, `$&\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
  }
}

export default defineConfig({
  plugins: [react(), inhaltsrichtlinie()],
  preview: { port: 4183, strictPort: true },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
