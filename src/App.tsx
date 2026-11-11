/**
 * Geführter Assistent in sieben Schritten (Spezifikation 5): Kopfleiste,
 * Schrittleiste, Schritt. Alle Zahlen kommen aus `berechneGesamt`; jede
 * Änderung läuft über den Reducer mit Rückgängig und Wiederholen.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ChangeEvent } from 'react'
import { berechneGesamt } from './entscheidung/gesamt'
import { neuesArbeitsprojekt } from './lastenheft/aenderungen'
import { ladeBrowserStand, ladeDokumentInfo, ladeEinstellungen, speichereDokumentInfo, speichereEinstellungen, speichereImBrowser, unlesbarerStand } from './modell/speicher'
import type { AuswahlProjekt, Einstellungen } from './modell/typen'
import { plattform, type MenueBefehl } from './plattform'
import type { Ziel } from './ui/befundziel'
import { startSchritt, useDateiBefehle } from './ui/datei'
import { Schalter } from './ui/Eingaben'
import { useFrage } from './ui/frage'
import { FrageDialog } from './ui/FrageDialog'
import { GeheZu } from './ui/GeheZu'
import { AppKontext, type Ansicht, type AppApi, type Lesebefunde } from './ui/kontext'
import { AngeboteSchritt } from './ui/schritte/AngeboteSchritt'
import { AnforderungenSchritt } from './ui/schritte/AnforderungenSchritt'
import { ErgebnisSchritt } from './ui/schritte/ErgebnisSchritt'
import { GewichtungSchritt } from './ui/schritte/GewichtungSchritt'
import { ProzessSchritt } from './ui/schritte/ProzessSchritt'
import { RahmenSchritt } from './ui/schritte/RahmenSchritt'
import { VorlagenSchritt } from './ui/schritte/VorlagenSchritt'
import { sperreVon } from './ui/sperren'
import { istGeaendert, reduziere, SCHRITTE, startZustand, type Schritt, type Zustand } from './zustand'

export const VERSION = '0.0.0'

/** Zustand beim Start aus dem Browser-Speicher; dazu die Meldung, falls das gesicherte Projekt unlesbar war. */
function erstStart(): { zustand: Zustand; fehler: string | null } {
  const stand = ladeBrowserStand()
  const gespeichert = stand.projekt
  const info = ladeDokumentInfo()
  const projekt = gespeichert ?? neuesArbeitsprojekt()
  // Wiederhergestellt: Dateiname merken; ungespeicherte Änderungen bleiben als „geändert“ markiert
  const z = startZustand(projekt, ladeEinstellungen(), gespeichert ? { name: info.name, gespeichert: info.ungespeichert ? null : projekt } : {})
  const fehler = stand.fehler
    ? `Das zuletzt im Browser gesicherte Projekt lässt sich nicht laden: ${stand.fehler} Es beginnt ein neues Projekt. Der alte Stand bleibt als Kopie erhalten und lässt sich herunterladen.`
    : null
  return { zustand: gespeichert ? { ...z, schritt: startSchritt(projekt) } : z, fehler }
}

const FARBSCHEMA_TEXT: Record<Einstellungen['farbschema'], string> = { system: 'wie System', hell: 'hell', dunkel: 'dunkel' }

export default function App() {
  return (
    <FrageDialog>
      <Hauptfenster />
    </FrageDialog>
  )
}

function Hauptfenster() {
  const [start] = useState(erstStart)
  const [z, dispatch] = useReducer(reduziere, start.zustand)
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState<string | null>(start.fehler)
  // Ein unlesbarer Stand aus dem Browser lässt sich herunterladen, solange seine Meldung steht
  const [kopieAnbieten, setKopieAnbieten] = useState(start.fehler !== null)
  const [ansicht, setAnsicht] = useState<Ansicht>({ angebotId: null, angebotReiter: 'bewertung', vorlage: 'lastenheft' })
  const [lesebefunde, setzeLesebefunde] = useState<Lesebefunde | null>(null)
  const [sprung, setSprung] = useState(0)
  const anker = useRef<string | null>(null)
  const ersterSchritt = useRef(true)
  const nichtSichernRef = useRef<AuswahlProjekt | null>(null)
  const meldungsZeit = useRef<number | undefined>(undefined)
  const projektFeld = useRef<HTMLInputElement>(null)
  const frage = useFrage()
  const g = useMemo(() => berechneGesamt(z.projekt), [z.projekt])
  const geaendert = istGeaendert(z)

  const melde = useCallback((text: string) => {
    setMeldung(text)
    window.clearTimeout(meldungsZeit.current)
    meldungsZeit.current = window.setTimeout(() => setMeldung(''), 6000)
  }, [])
  const aendere = useCallback<AppApi['aendere']>((f, gruppe) => dispatch({ typ: 'aendern', aenderung: f, zeit: Date.now(), gruppe }), [])
  const nichtSichern = useCallback((p: AuswahlProjekt) => {
    nichtSichernRef.current = p
  }, [])
  // Jede neue Meldung (oder ihr Ende) ersetzt die Meldung beim Start samt Angebot der Kopie
  const zeigeFehler = useCallback((text: string | null) => {
    setFehler(text)
    setKopieAnbieten(false)
  }, [])
  const befehle = useDateiBefehle({ z, dispatch, aendere, melde, zeigeFehler, frage, setzeLesebefunde, nichtSichern })
  const setzeAnsicht = useCallback((teil: Partial<Ansicht>) => setAnsicht((a) => ({ ...a, ...teil })), [])
  const springeZu = useCallback((ziel: Ziel) => {
    anker.current = ziel.anker
    setAnsicht((a) => ({
      angebotId: ziel.angebotId ?? a.angebotId,
      angebotReiter: ziel.reiter ?? a.angebotReiter,
      vorlage: ziel.vorlage ?? a.vorlage,
    }))
    dispatch({ typ: 'schritt', schritt: ziel.schritt })
    setSprung((n) => n + 1)
  }, [])

  // Sofort sichern: Ein Projekt ist klein, und ein verzögertes Sichern ginge beim Schließen des Tabs verloren
  useEffect(() => {
    if (nichtSichernRef.current === z.projekt) return
    nichtSichernRef.current = null
    speichereImBrowser(z.projekt)
    speichereDokumentInfo({ name: z.dokument.name, ungespeichert: geaendert })
  }, [z.projekt, z.dokument.name, geaendert])

  useEffect(() => {
    speichereEinstellungen(z.einstellungen)
    const root = document.documentElement
    if (z.einstellungen.farbschema === 'hell') root.dataset.theme = 'light'
    else if (z.einstellungen.farbschema === 'dunkel') root.dataset.theme = 'dark'
    else delete root.dataset.theme
  }, [z.einstellungen])

  // Fenstertitel; ein Punkt zeigt ungespeicherte Änderungen (5.1)
  useEffect(() => {
    const name = z.dokument.name ?? (z.projekt.rahmen.vorhaben || 'Neues Vorhaben')
    plattform.setzeTitel(`${geaendert ? '• ' : ''}${name} – Auswahl-Lotse`)
  }, [z.dokument.name, z.projekt.rahmen.vorhaben, geaendert])

  // Beim Schrittwechsel springt der Fokus auf die Überschrift, bei einem Sprung auf die Ursache (5.9)
  useEffect(() => {
    if (ersterSchritt.current) {
      ersterSchritt.current = false
      return
    }
    const ziel = (anker.current && document.getElementById(anker.current)) || document.getElementById('schritt-titel')
    anker.current = null
    if (!ziel) return
    if (!ziel.matches('a, button, input, select, textarea, [tabindex]')) ziel.setAttribute('tabindex', '-1')
    ziel.focus({ preventScroll: true })
    if (ziel.id === 'schritt-titel') window.scrollTo({ top: 0 })
    else ziel.scrollIntoView({ block: 'center' })
  }, [z.schritt, sprung])

  // Öffnen: im Programm der Dialog des Systems, im Browser das Dateifeld
  const oeffnen = useCallback(() => {
    if (plattform.desktop) void befehle.oeffnen()
    else projektFeld.current?.click()
  }, [befehle])

  // Programm: Ereignisse des Rust-Teils kommen jederzeit; sie nutzen immer die aktuellen Befehle,
  // ohne sich bei jeder Änderung neu anzumelden
  const befehleRef = useRef(befehle)
  useEffect(() => {
    befehleRef.current = befehle
  }, [befehle])
  const menueRef = useRef<(b: MenueBefehl) => void>(() => {})
  useEffect(() => {
    menueRef.current = (b) => {
      switch (b) {
        case 'neu':
          return void befehle.neu()
        case 'oeffnen':
          return oeffnen()
        case 'importieren':
          return void befehle.importiere()
        case 'speichern':
          return void befehle.speichern()
        case 'speichernUnter':
          return void befehle.speichernUnter()
        case 'fragebogen':
          return void befehle.fragebogen()
        case 'beispiel':
          return void befehle.ladeBeispiel()
        case 'ueber':
          return void frage({
            titel: 'Auswahl-Lotse',
            text: `Version ${VERSION}. Vom Prozessmodell zu Lastenheft und begründeter Softwareentscheidung. Läuft ohne Server und ohne KI; Projekte bleiben auf diesem Rechner. Rechtliche Hinweise ohne Gewähr, keine Rechtsberatung.`,
            knoepfe: [{ wert: 'ok', text: 'Schließen', art: 'haupt' }],
            abbrechen: 'ok',
          })
      }
    }
  }, [befehle, oeffnen, frage])

  // Programm: Startdatei (Doppelklick im Explorer), weitere Dateien, Menü, Rückfrage beim Schließen
  const gestartet = useRef(false)
  useEffect(() => {
    if (!plattform.desktop || gestartet.current) return
    gestartet.current = true
    void plattform.startDatei().then(
      (d) => d && befehleRef.current.oeffneOderLiesEin(d),
      (e: unknown) => zeigeFehler(`Die Datei beim Start ließ sich nicht lesen: ${e instanceof Error ? e.message : String(e)}`),
    )
  }, [zeigeFehler])
  useEffect(() => plattform.beiDatei((d) => void befehleRef.current.oeffneOderLiesEin(d), zeigeFehler), [zeigeFehler])
  useEffect(() => plattform.beiMenue((b) => menueRef.current(b)), [])
  useEffect(() => plattform.beimSchliessen(() => befehleRef.current.darfSchliessen()), [])

  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 's') {
        e.preventDefault()
        void (e.shiftKey ? befehle.speichernUnter() : befehle.speichern())
        return
      }
      // Strg+N öffnet im Browser ein neues Fenster; nur im Programm gehört es der App
      if (k === 'n' && !e.shiftKey && plattform.desktop) {
        e.preventDefault()
        void befehle.neu()
        return
      }
      if (k === 'o' && !e.shiftKey) {
        e.preventDefault()
        oeffnen()
        return
      }
      if ((e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch({ typ: 'rueckgaengig' })
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        e.preventDefault()
        dispatch({ typ: 'wiederholen' })
      }
    }
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [befehle, oeffnen])

  const projektGewaehlt = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) await befehle.oeffneDatei({ pfad: null, name: f.name, inhalt: await f.text() })
  }

  const api = useMemo<AppApi>(
    () => ({ z, g, dispatch, aendere, melde, ansicht, setzeAnsicht, springeZu, befehle, lesebefunde }),
    [z, g, aendere, melde, ansicht, setzeAnsicht, springeZu, befehle, lesebefunde],
  )
  const sperre = sperreVon(z.schritt, z.projekt, g.kriterien)

  return (
    <AppKontext.Provider value={api}>
      <div className="app">
        <a className="sprungmarke" href="#inhalt">
          Zum Inhalt springen
        </a>
        <header className="kopf">
          <div className="logo">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={26} height={26} />
            <span>Auswahl-Lotse</span>
            <span className="dokument-name" title={z.dokument.name ?? undefined}>
              {z.dokument.name ?? (z.projekt.rahmen.vorhaben || 'Neues Vorhaben')}
              {geaendert && (
                <span className="ungespeichert" title="Ungespeicherte Änderungen">
                  {' '}
                  •<span className="sr"> (ungespeichert)</span>
                </span>
              )}
            </span>
          </div>
          <p className="meldung" role="status" aria-live="polite">
            {meldung}
          </p>
          <div className="kopf-aktionen">
            <button type="button" className="knopf knopf-klein" onClick={() => void befehle.neu()}>
              Neu
            </button>
            <button type="button" className="knopf knopf-klein" onClick={oeffnen} title="Strg+O">
              Öffnen …
            </button>
            <button type="button" className="knopf knopf-klein" onClick={() => void befehle.speichern()} title="Strg+S">
              Speichern
            </button>
            <button type="button" className="knopf knopf-klein" onClick={() => void befehle.ladeBeispiel()}>
              Beispiel laden
            </button>
            <span className="kopf-trenner" aria-hidden="true" />
            <button type="button" className="knopf knopf-klein" disabled={z.vergangenheit.length === 0} onClick={() => dispatch({ typ: 'rueckgaengig' })} title="Strg+Z">
              ↶ Rückgängig
            </button>
            <button type="button" className="knopf knopf-klein" disabled={z.zukunft.length === 0} onClick={() => dispatch({ typ: 'wiederholen' })} title="Strg+Y" aria-label="Wiederholen">
              ↷
            </button>
            <Schalter an={z.einstellungen.lernmodus} onAendern={(lernmodus) => dispatch({ typ: 'einstellungen', einstellungen: { lernmodus } })}>
              Lernmodus
            </Schalter>
            <label className="farbschema">
              <span className="sr">Farbschema</span>
              <select value={z.einstellungen.farbschema} onChange={(e) => dispatch({ typ: 'einstellungen', einstellungen: { farbschema: e.target.value as Einstellungen['farbschema'] } })}>
                {(Object.keys(FARBSCHEMA_TEXT) as Einstellungen['farbschema'][]).map((f) => (
                  <option key={f} value={f}>
                    Farben {FARBSCHEMA_TEXT[f]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <input ref={projektFeld} type="file" accept=".auswahllotse,.json,application/json" hidden aria-label="Projektdatei öffnen" onChange={(e) => void projektGewaehlt(e)} />
        <nav className="schrittleiste" aria-label="Schritte">
          <ol>
            {SCHRITTE.map((s, i) => {
              const gesperrt = sperreVon(s.id, z.projekt, g.kriterien)
              return (
                <li key={s.id}>
                  <button type="button" aria-current={z.schritt === s.id ? 'step' : undefined} disabled={gesperrt !== null} title={gesperrt?.grund} onClick={() => dispatch({ typ: 'schritt', schritt: s.id })}>
                    <span className="nummer" aria-hidden="true">
                      {i + 1}
                    </span>
                    {s.name}
                    {gesperrt && <span className="sr"> (gesperrt: {gesperrt.grund})</span>}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
        {fehler && (
          <div className="banner banner-fehler fehler-banner" role="alert">
            <p>{fehler}</p>
            {kopieAnbieten && (
              <button type="button" className="knopf knopf-klein" onClick={() => void plattform.speichernUnter('Unlesbarer Stand.auswahllotse', unlesbarerStand() ?? '', 'projekt')}>
                Kopie herunterladen
              </button>
            )}
            <button type="button" className="knopf knopf-klein" onClick={() => zeigeFehler(null)}>
              Meldung schließen
            </button>
          </div>
        )}
        <main id="inhalt" className={`flaeche flaeche-${z.schritt}`}>
          {sperre ? <Gesperrt grund={sperre.grund} ausweg={sperre.ausweg} /> : <AktiverSchritt schritt={z.schritt} />}
        </main>
        <footer className="fuss">
          <p>Auswahl-Lotse {VERSION} · Alle Daten bleiben auf diesem Gerät, ohne Server und ohne KI. Rechtliche Hinweise ohne Gewähr, keine Rechtsberatung.</p>
          {/* Im Programm liegen die Daten im Benutzerprofil von Windows; das Leeren für gemeinsam genutzte Browser entfällt */}
          {!plattform.desktop && (
            <button type="button" className="knopf knopf-klein knopf-leise" onClick={() => void befehle.leereSpeicher()}>
              Browser-Speicher leeren
            </button>
          )}
        </footer>
      </div>
    </AppKontext.Provider>
  )
}

function AktiverSchritt({ schritt }: { schritt: Schritt }) {
  switch (schritt) {
    case 'rahmen':
      return <RahmenSchritt />
    case 'prozess':
      return <ProzessSchritt />
    case 'anforderungen':
      return <AnforderungenSchritt />
    case 'gewichtung':
      return <GewichtungSchritt />
    case 'angebote':
      return <AngeboteSchritt />
    case 'ergebnis':
      return <ErgebnisSchritt />
    case 'vorlagen':
      return <VorlagenSchritt />
  }
}

function Gesperrt({ grund, ausweg }: { grund: string; ausweg: Schritt }) {
  return (
    <div className="schritt">
      <h1 id="schritt-titel" tabIndex={-1}>
        Dieser Schritt ist noch gesperrt
      </h1>
      <p>{grund}</p>
      <GeheZu schritt={ausweg} text="Zum Schritt, der die Sperre aufhebt" />
    </div>
  )
}
