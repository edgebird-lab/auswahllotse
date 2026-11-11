/**
 * Vorläufige Startseite. Der geführte Assistent mit sieben Schritten entsteht
 * in Phase 6 (siehe docs/stand.md); bis dahin liegt die Fachlogik getestet in
 * src/prozessdatei, src/modell, src/lastenheft und src/bewertung.
 */
const SCHRITTE = ['Rahmen', 'Prozess', 'Anforderungen', 'Gewichtung', 'Angebote', 'Ergebnis', 'Vorlagen']

export default function App() {
  return (
    <>
      <header className="kopf">
        <span className="marke">Auswahl-Lotse</span>
        <span className="kopf-hinweis">Version in Arbeit</span>
      </header>
      <main className="seite">
        <h1>Auswahl-Lotse</h1>
        <p className="einleitung">
          Vom Prozessmodell zu Lastenheft und begründeter Softwareentscheidung. Läuft im Browser, ohne KI und ohne
          Server; alle Daten bleiben auf diesem Gerät.
        </p>
        <section className="karte" aria-labelledby="ablauf-titel">
          <h2 id="ablauf-titel">Geplanter Ablauf</h2>
          <ol className="schrittliste">
            {SCHRITTE.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="leise">Die Oberfläche folgt; zuerst entsteht die getestete Fachlogik.</p>
        </section>
      </main>
    </>
  )
}
