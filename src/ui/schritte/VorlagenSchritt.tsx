import { angebotsname } from '../../bewertung/nutzwert'
import { begruendungsEntwurf } from '../../entscheidung/begruendung'
import { loescheRisiko, neuesRisiko, setzeBegruendung, setzeEntscheidungsStatus, setzeRisiko, waehleAngebot } from '../../entscheidung/entscheidung'
import { BefundListe } from '../Befunde'
import { Lastenheft } from '../druck/Lastenheft'
import { Entscheidungsvorlage } from '../druck/Entscheidungsvorlage'
import { Feld, Reiter, ReiterFlaeche } from '../Eingaben'
import { jetzt, useApp } from '../kontext'

export function VorlagenSchritt() {
  const { z, ansicht, setzeAnsicht, befehle } = useApp()
  const praefix = 'vorlage'
  const p = z.projekt
  return (
    <div className="schritt">
      <div className="bedienung">
        <h1 id="schritt-titel" tabIndex={-1}>
          7 · Vorlagen
        </h1>
        <p className="einleitung">Lastenheft und Entscheidungsvorlage zum Drucken oder Speichern als PDF. Dazu der Anbieterfragebogen als CSV und das Projekt als Datei.</p>
        <section className="karte" aria-labelledby="export-titel">
          <h2 id="export-titel">Exporte</h2>
          <div className="knopfreihe">
            <button type="button" className="knopf" onClick={() => void befehle.fragebogen()} disabled={!p.anforderungen.some((a) => a.status === 'aktiv')}>
              Anbieterfragebogen (CSV)
            </button>
            <button type="button" className="knopf" onClick={() => void befehle.speichern()}>
              Projekt speichern
            </button>
          </div>
          <p className="feld-hilfe">Der Fragebogen enthält alle aktiven Anforderungen mit leeren Spalten für die Antworten der Anbieter (Semikolon, UTF-8, für Excel geeignet).</p>
        </section>
        <Reiter
          label="Vorlage"
          idPraefix={praefix}
          aktiv={ansicht.vorlage}
          onWahl={(vorlage) => setzeAnsicht({ vorlage })}
          reiter={[
            { id: 'lastenheft', text: 'Lastenheft' },
            { id: 'entscheidung', text: 'Entscheidungsvorlage' },
          ]}
        />
      </div>
      {ansicht.vorlage === 'lastenheft' ? (
        <ReiterFlaeche idPraefix={praefix} id="lastenheft">
          <div className="bedienung knopfreihe vorlage-knoepfe">
            <button type="button" className="knopf knopf-haupt" onClick={() => void befehle.drucken('Lastenheft')}>
              Drucken / als PDF
            </button>
          </div>
          <Lastenheft />
        </ReiterFlaeche>
      ) : (
        <ReiterFlaeche idPraefix={praefix} id="entscheidung">
          <EntscheidungBedienung />
          <Entscheidungsvorlage />
        </ReiterFlaeche>
      )}
    </div>
  )
}

function EntscheidungBedienung() {
  const { z, g, aendere, befehle } = useApp()
  const p = z.projekt
  const e = p.entscheidung
  const w = g.auswertung
  const empfohlen = p.angebote.find((a) => a.id === w.empfehlungId)
  const warnungen = g.befunde.filter((b) => b.code === 'D4' || b.code === 'D6')
  return (
    <section className="karte bedienung" id="entscheidung-bedienung" aria-labelledby="entscheidung-titel">
      <h2 id="entscheidung-titel">Entscheidung festhalten</h2>
      <Feld label="Gewähltes Angebot">
        {(id) => (
          <select id={id} value={e.gewaehltId ?? ''} onChange={(ev) => aendere((q) => waehleAngebot(q, ev.target.value || null))}>
            <option value="">Empfehlung der Regel{empfohlen ? ` (${angebotsname(empfohlen)})` : ' (keine)'}</option>
            {p.angebote.map((a) => (
              <option key={a.id} value={a.id}>
                {angebotsname(a)}
                {a.produkt ? ` · ${a.produkt}` : ''}
              </option>
            ))}
          </select>
        )}
      </Feld>
      <Feld label="Begründung" hilfe="Leer lassen: Die Vorlage zeigt den Entwurf aus Textbausteinen. „Entwurf erzeugen“ übernimmt ihn zum Bearbeiten.">
        {(id, hilfe) => <textarea id={id} rows={5} aria-describedby={hilfe} value={e.begruendung} onChange={(ev) => aendere((q) => setzeBegruendung(q, ev.target.value), 'begruendung')} />}
      </Feld>
      <div className="knopfreihe">
        <button type="button" className="knopf knopf-klein" disabled={w.empfehlungId === null} onClick={() => aendere((q) => setzeBegruendung(q, begruendungsEntwurf(q, w)))}>
          Entwurf erzeugen
        </button>
        {e.begruendung && (
          <button type="button" className="knopf knopf-klein" onClick={() => aendere((q) => setzeBegruendung(q, ''))}>
            Begründung leeren
          </button>
        )}
      </div>
      <BefundListe befunde={warnungen} kompakt />

      <h3>Risiken und nächste Schritte</h3>
      {e.risiken.length > 0 && (
        <ul className="risiken">
          {e.risiken.map((r, i) => (
            <li key={r.id} className="feldreihe risiko">
              <Feld label={`Risiko ${i + 1}`}>{(id) => <input id={id} type="text" value={r.text} onChange={(ev) => aendere((q) => setzeRisiko(q, r.id, { text: ev.target.value }), `risiko:${r.id}`)} />}</Feld>
              <Feld label={`Maßnahme zu Risiko ${i + 1}`}>
                {(id) => <input id={id} type="text" value={r.massnahme} onChange={(ev) => aendere((q) => setzeRisiko(q, r.id, { massnahme: ev.target.value }), `massnahme:${r.id}`)} />}
              </Feld>
              <button type="button" className="knopf knopf-klein knopf-gefahr" onClick={() => aendere((q) => loescheRisiko(q, r.id))}>
                Entfernen<span className="sr"> Risiko {i + 1}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="knopf knopf-klein" onClick={() => aendere((q) => neuesRisiko(q).projekt)}>
        + Risiko
      </button>

      <h3>Status</h3>
      <fieldset className="auswahl auswahl-kompakt">
        <legend className="sr">Status der Entscheidung</legend>
        <label className={`auswahl-option${e.status === 'entwurf' ? ' an' : ''}`}>
          <input type="radio" name="entscheidung-status" checked={e.status === 'entwurf'} onChange={() => aendere((q) => setzeEntscheidungsStatus(q, 'entwurf', g.final, jetzt()))} />
          <span>Entwurf</span>
        </label>
        <label className={`auswahl-option${e.status === 'final' ? ' an' : ''}${!g.final.moeglich && e.status !== 'final' ? ' gesperrt' : ''}`}>
          <input
            type="radio"
            name="entscheidung-status"
            checked={e.status === 'final'}
            disabled={!g.final.moeglich && e.status !== 'final'}
            aria-describedby={g.final.grund ? 'final-grund' : undefined}
            onChange={() => aendere((q) => setzeEntscheidungsStatus(q, 'final', g.final, jetzt()))}
          />
          <span>final</span>
        </label>
      </fieldset>
      {g.final.grund && (
        <p className="feld-hilfe" id="final-grund">
          „final“ ist gesperrt: {g.final.grund}
        </p>
      )}
      <div className="knopfreihe vorlage-knoepfe">
        <button type="button" className="knopf knopf-haupt" onClick={() => void befehle.drucken('Entscheidungsvorlage')}>
          Drucken / als PDF
        </button>
      </div>
    </section>
  )
}
