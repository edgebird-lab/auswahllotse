/**
 * Druckansicht Entscheidungsvorlage (Spezifikation 5.8): Kopf, Empfehlung im
 * Kasten, Ausgangslage, Vorgehen, Ergebnis, Kosten, Sensitivität, Risiken
 * und Freigabe. Ohne eigene Begründung erscheint der Entwurf (6.13).
 */
import { angebotsname } from '../../bewertung/nutzwert'
import { stabilitaetText } from '../../bewertung/sensitivitaet'
import { begruendungsEntwurf } from '../../entscheidung/begruendung'
import { ausgangslagePunkte, REGEL_NAME, vorgehenPunkte } from '../../export/vorlagen'
import type { Gruppe } from '../../modell/typen'
import { datum, euro, nutzwert } from '../../modell/zahlformat'
import { NutzwertDiagramm } from '../diagramme/NutzwertDiagramm'
import { useApp } from '../kontext'
import { KostenTabelle, KoTabelle, NutzwertTabelle } from '../schritte/ErgebnisSchritt'
import { kostenbasisText } from '../texte'

export function Entscheidungsvorlage() {
  const { z, g } = useApp()
  const p = z.projekt
  const w = g.auswertung
  const gewaehlt = p.angebote.find((a) => a.id === g.gewaehltId)
  const ergebnis = w.ergebnisse.find((r) => r.angebotId === g.gewaehltId)
  const empfohlen = p.angebote.find((a) => a.id === w.empfehlungId)
  const abweichend = gewaehlt && w.empfehlungId !== gewaehlt.id
  const begruendung = p.entscheidung.begruendung.trim() || (abweichend ? '' : begruendungsEntwurf(p, w))
  const rangfolge = [...w.ergebnisse].filter((r) => r.rang !== null).sort((a, b) => a.rang! - b.rang!)
  const name = (id: string) => {
    const a = p.angebote.find((x) => x.id === id)
    return a ? angebotsname(a) : 'Angebot'
  }
  return (
    <article className="druck-dokument" aria-labelledby="ev-titel">
      <header className="druck-kopf">
        <p className="druck-art">Entscheidungsvorlage</p>
        <h2 id="ev-titel">{p.rahmen.vorhaben || 'Vorhaben ohne Namen'}</h2>
        <dl className="angaben angaben-quer">
          <div>
            <dt>Betrieb</dt>
            <dd>{p.rahmen.betrieb || '–'}</dd>
          </div>
          <div>
            <dt>Erstellt von</dt>
            <dd>{p.rahmen.ersteller || '–'}</dd>
          </div>
          <div>
            <dt>Datum</dt>
            <dd>{datum(p.entscheidung.datum ?? p.geaendertAm)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{p.entscheidung.status === 'final' ? 'final' : 'Entwurf'}</dd>
          </div>
        </dl>
      </header>

      <section className="empfehlung-kasten" aria-labelledby="ev-empfehlung">
        <h3 id="ev-empfehlung">1 Empfehlung</h3>
        {gewaehlt && ergebnis ? (
          <>
            <p className="empfehlung-name">
              {angebotsname(gewaehlt)}
              {gewaehlt.produkt && <span className="leise"> · {gewaehlt.produkt}</span>}
              {w.vorlaeufig && <span className="marke marke-vorlaeufig">vorläufig</span>}
            </p>
            {abweichend && <p>Abweichend von der Empfehlung der Regel „{REGEL_NAME[p.entscheidung.regel]}“{empfohlen ? ` (${angebotsname(empfohlen)})` : ''}.</p>}
            <p className="begruendung">{begruendung || 'Die Begründung der abweichenden Wahl fehlt noch.'}</p>
            <dl className="angaben angaben-quer">
              <div>
                <dt>Nutzwert</dt>
                <dd>{nutzwert(ergebnis.nutzwert)} von 10</dd>
              </div>
              <div>
                <dt>{kostenbasisText(p)}</dt>
                <dd>{euro(ergebnis.kostenbasis)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p>Es gibt noch keine Empfehlung und keine Wahl.</p>
        )}
      </section>

      <section>
        <h3>2 Ausgangslage</h3>
        <ul>
          {ausgangslagePunkte(p, g.mengengeruest).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>3 Vorgehen</h3>
        <ul>
          {vorgehenPunkte(p, g).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>4 Ergebnis</h3>
        <h4>K.-o.-Prüfung</h4>
        <KoTabelle />
        {Object.keys(w.gewichte).length > 0 && (
          <>
            <h4>Nutzwert</h4>
            <NutzwertDiagramm ergebnisse={w.ergebnisse} angebote={p.angebote} gewichte={w.gewichte} haupt={Object.keys(w.gewichte) as Gruppe[]} />
            <NutzwertTabelle />
          </>
        )}
        <h4>Rangfolge</h4>
        {rangfolge.length === 0 ? (
          <p>Kein Angebot hat einen Rang.</p>
        ) : (
          <ol className="rangfolge">
            {rangfolge.map((r) => (
              <li key={r.angebotId}>
                {name(r.angebotId)}: Rang {r.rang}, Nutzwert {nutzwert(r.nutzwert)}, {euro(r.kostenbasis)}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3>5 Kosten</h3>
        <KostenTabelle />
      </section>

      <section>
        <h3>6 Sensitivität</h3>
        {w.stabilitaet.length === 0 ? (
          <p>Keine Sensitivitätsanalyse ({w.befunde.find((b) => b.code === 'S1' || b.code === 'S6')?.text ?? 'es fehlt eine eindeutige Empfehlung'}).</p>
        ) : (
          <>
            <p>Die Empfehlung bleibt gleich, solange das Gewicht eines Kriteriums im genannten Bereich liegt (die übrigen ändern sich anteilig):</p>
            <ul>
              {w.stabilitaet.map((s) => (
                <li key={s.gruppe}>{stabilitaetText(s)}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h3>7 Risiken und nächste Schritte</h3>
        {p.entscheidung.risiken.length === 0 ? (
          <p>Keine Risiken erfasst.</p>
        ) : (
          <ul>
            {p.entscheidung.risiken.map((r) => (
              <li key={r.id}>
                {r.text || 'ohne Beschreibung'}
                {r.massnahme && <> – Maßnahme: {r.massnahme}</>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="freigabe">
        <h3>8 Freigabe</h3>
        <table className="tabelle druck-tabelle freigabe-tabelle">
          <thead>
            <tr>
              <th scope="col">Ort</th>
              <th scope="col">Datum</th>
              <th scope="col">Name</th>
              <th scope="col">Unterschrift</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2].map((i) => (
              <tr key={i}>
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
        <p className="druck-klein">Rechtliche Hinweise ohne Gewähr, keine Rechtsberatung. Alle Beträge netto.</p>
      </section>
    </article>
  )
}
