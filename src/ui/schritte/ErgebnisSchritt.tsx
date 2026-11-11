import { gewichtText, istKo } from '../../bewertung/gewichte'
import { angebotsname, kurzname } from '../../bewertung/nutzwert'
import { stabilitaetText } from '../../bewertung/sensitivitaet'
import { istZulaessig } from '../../entscheidung/regel'
import { jahreFuerRechnung } from '../../kosten/kosten'
import type { AngebotsErgebnis } from '../../modell/ergebnisse'
import { gruppenName, type Angebot, type AuswahlProjekt, type Gruppe } from '../../modell/typen'
import { euro, euroGenau, fest, nutzwert, prozent, zahl } from '../../modell/zahlformat'
import { BefundListe } from '../Befunde'
import { KostenDiagramm } from '../diagramme/KostenDiagramm'
import { serienVon } from '../diagramme/geometrie'
import { NutzwertDiagramm } from '../diagramme/NutzwertDiagramm'
import { REGEL_NAME } from '../../export/vorlagen'
import { kostenbasisText } from '../texte'
import { SensitivitaetDiagramm } from '../diagramme/SensitivitaetDiagramm'
import { GeheZu } from '../GeheZu'
import { useApp } from '../kontext'
import { Lernhinweis } from '../Lernhinweis'

export function ErgebnisSchritt() {
  const { z, g } = useApp()
  const p = z.projekt
  const w = g.auswertung
  return (
    <div className="schritt">
      <h1 id="schritt-titel" tabIndex={-1}>
        6 · Ergebnis
      </h1>
      <Empfehlung />
      <KoUebersicht />

      <section className="karte" aria-labelledby="nutzwert-titel">
        <h2 id="nutzwert-titel">Nutzwert</h2>
        <Lernhinweis thema="nutzwert" />
        {Object.keys(w.gewichte).length > 0 ? (
          <>
            <NutzwertDiagramm ergebnisse={w.ergebnisse} angebote={p.angebote} gewichte={w.gewichte} haupt={Object.keys(w.gewichte) as Gruppe[]} />
            <NutzwertTabelle />
          </>
        ) : (
          <p className="leer-hinweis">Ohne gültige Gewichte gibt es keinen Nutzwert. Bitte die Gewichtung in Schritt 4 vervollständigen.</p>
        )}
      </section>

      <section className="karte" aria-labelledby="kosten-titel">
        <h2 id="kosten-titel">Kosten</h2>
        <Lernhinweis thema="gesamtkosten" />
        <KostenDiagramm ergebnisse={w.ergebnisse} angebote={p.angebote} budget={p.wirtschaftlichkeit.budgetEuro} titel={kostenbasisText(p)} />
        <KostenTabelle />
      </section>

      <Sensitivitaet />

      <section className="karte" aria-labelledby="befunde-titel">
        <h2 id="befunde-titel">Befunde</h2>
        <BefundListe befunde={g.befunde} springen leer="Keine Befunde." />
      </section>
      <GeheZu schritt="vorlagen" />
    </div>
  )
}

function Empfehlung() {
  const { z, g } = useApp()
  const p = z.projekt
  const w = g.auswertung
  const empfohlen = p.angebote.find((a) => a.id === w.empfehlungId)
  const r = w.ergebnisse.find((x) => x.angebotId === w.empfehlungId)
  const gewaehlt = g.gewaehltId !== w.empfehlungId ? p.angebote.find((a) => a.id === g.gewaehltId) : undefined
  const grund = g.befunde.find((b) => b.code === 'D3' || b.code === 'D2') ?? g.befunde.find((b) => b.schwere === 'fehler' && (b.code.startsWith('G') || b.code.startsWith('AHP')))
  return (
    <section className="karte empfehlung" id="empfehlung" aria-labelledby="empfehlung-titel">
      <h2 id="empfehlung-titel">Empfehlung nach der Regel „{REGEL_NAME[p.entscheidung.regel]}“</h2>
      {empfohlen && r ? (
        <>
          <p className="empfehlung-name">
            {angebotsname(empfohlen)}
            {empfohlen.produkt && <span className="leise"> · {empfohlen.produkt}</span>}
            {w.vorlaeufig && <span className="marke marke-vorlaeufig">vorläufig</span>}
          </p>
          <dl className="angaben angaben-quer">
            <div>
              <dt>Nutzwert</dt>
              <dd>{nutzwert(r.nutzwert)} von 10</dd>
            </div>
            <div>
              <dt>{kostenbasisText(p)}</dt>
              <dd>{euro(r.kostenbasis)}</dd>
            </div>
            <div>
              <dt>€ je Nutzwertpunkt</dt>
              <dd>{r.euroJePunkt === null ? 'nicht berechenbar' : euroGenau(r.euroJePunkt)}</dd>
            </div>
          </dl>
          {w.vorlaeufig && <p className="feld-hilfe">Vorläufig: Bei gültigen Angeboten fehlen noch Bewertungen oder K.-o.-Prüfungen.</p>}
        </>
      ) : (
        <p className="empfehlung-name">Keine Empfehlung{grund ? `: ${grund.text}` : '.'}</p>
      )}
      {gewaehlt && <p className="banner banner-hinweis">Gewählt ist abweichend {angebotsname(gewaehlt)} (Schritt 7, Entscheidungsvorlage).</p>}
    </section>
  )
}

function koListen(p: AuswahlProjekt, a: Angebot) {
  const muss = p.anforderungen.filter(istKo)
  const nicht = muss.filter((x) => a.bewertungen[x.id]?.ko === 'nicht_erfuellt')
  const offen = muss.filter((x) => {
    const ko = a.bewertungen[x.id]?.ko ?? null
    return ko !== 'erfuellt' && ko !== 'nicht_erfuellt'
  })
  return { muss, nicht, offen }
}

function KoUebersicht() {
  return (
    <section className="karte" aria-labelledby="ko-titel">
      <h2 id="ko-titel">K.-o.-Prüfung</h2>
      <Lernhinweis thema="ko" />
      <KoTabelle />
    </section>
  )
}

export function KoTabelle() {
  const { z, g } = useApp()
  const p = z.projekt
  return (
      <div className="tabelle-wrap">
        <table className="tabelle">
          <caption className="sr">Muss-Kriterien je Angebot</caption>
          <thead>
            <tr>
              <th scope="col">Angebot</th>
              <th scope="col">Ergebnis</th>
              <th scope="col">Nicht erfüllt</th>
              <th scope="col">Offen</th>
            </tr>
          </thead>
          <tbody>
            {p.angebote.map((a) => {
              const r = g.auswertung.ergebnisse.find((x) => x.angebotId === a.id)
              const { muss, nicht, offen } = koListen(p, a)
              return (
                <tr key={a.id}>
                  <th scope="row">{angebotsname(a)}</th>
                  <td>
                    {r?.gueltig ? (
                      <span className="status status-gut">
                        <span aria-hidden="true">✓</span> gültig
                      </span>
                    ) : (
                      <span className="status status-schlecht">
                        <span aria-hidden="true">✕</span> ausgeschieden{r && r.ausschluss.includes('über Budget') ? ' (über Budget)' : ''}
                      </span>
                    )}
                  </td>
                  <td>{nicht.length === 0 ? '–' : nicht.map((x) => `${kurzname(x)} ${x.titel}`).join('; ')}</td>
                  <td>{offen.length === 0 ? (muss.length === 0 ? 'keine Muss-Kriterien' : '–') : `${offen.length} von ${muss.length}: ${offen.map(kurzname).join(', ')}`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
  )
}

export function NutzwertTabelle() {
  const { z, g } = useApp()
  const w = g.auswertung
  const haupt = Object.keys(w.gewichte) as (keyof typeof w.gewichte)[]
  const name = (r: AngebotsErgebnis) => {
    const a = z.projekt.angebote.find((x) => x.id === r.angebotId)
    return a ? angebotsname(a) : 'Angebot'
  }
  const serien = serienVon(haupt)
  return (
    <div className="tabelle-wrap">
      <table className="tabelle zahlen-tabelle">
        <caption>Gruppenwerte (0 bis 10) und Nutzwert</caption>
        <thead>
          <tr>
            <th scope="col">Hauptkriterium</th>
            <th scope="col">Gewicht</th>
            {w.ergebnisse.map((r) => (
              <th key={r.angebotId} scope="col">
                {name(r)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {haupt.map((x) => (
            <tr key={x}>
              <th scope="row">
                <span className="farbfeld" style={{ background: serien.find((s) => s.gruppen.includes(x))?.farbe }} aria-hidden="true" /> {gruppenName(x)}
              </th>
              <td>{gewichtText(w.gewichte[x] ?? 0)}</td>
              {w.ergebnisse.map((r) => (
                <td key={r.angebotId}>{fest(r.gruppenwerte[x] ?? 0, 2)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Nutzwert</th>
            <td>100,0 %</td>
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>
                <strong>{nutzwert(r.nutzwert)}</strong>
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Rang</th>
            <td />
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>{r.rang ?? (r.gueltig ? 'nicht zulässig' : 'ausgeschieden')}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Bewertungen fehlen</th>
            <td />
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>{r.fehlend}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function KostenTabelle() {
  const { z, g } = useApp()
  const p = z.projekt
  const w = g.auswertung
  const zins = p.wirtschaftlichkeit.zinsProzent
  const nutzen = p.wirtschaftlichkeit.nutzenProJahrEuro
  const jahre = jahreFuerRechnung(p.wirtschaftlichkeit.jahre)
  const name = (r: AngebotsErgebnis) => {
    const a = p.angebote.find((x) => x.id === r.angebotId)
    return a ? angebotsname(a) : 'Angebot'
  }
  const summe = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)
  return (
    <div className="tabelle-wrap">
      <table className="tabelle zahlen-tabelle">
        <caption>Kosten je Angebot über {jahre === 1 ? '1 Jahr' : `${jahre} Jahre`} (netto)</caption>
        <thead>
          <tr>
            <th scope="col">Größe</th>
            {w.ergebnisse.map((r) => (
              <th key={r.angebotId} scope="col">
                {name(r)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Einmalig</th>
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>{euro(r.kosten.einmalig)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Laufend gesamt</th>
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>{euro(summe(r.kosten.laufend))}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Gesamtkosten</th>
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>
                <strong>{euro(r.kosten.tco)}</strong>
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Barwert{zins !== null ? ` (${zahl(zins, 2)} % Zins)` : ''}</th>
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>{r.kosten.barwert === null ? 'ohne Zins' : euro(r.kosten.barwert)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Kapitalwert{nutzen !== null ? ` (Nutzen ${euro(nutzen)} pro Jahr)` : ''}</th>
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>{r.kosten.kapitalwert === null ? (nutzen === null ? 'ohne Nutzen' : 'ohne Zins') : euro(r.kosten.kapitalwert)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Amortisation</th>
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>{nutzen === null ? 'ohne Nutzen' : r.kosten.amortisationJahr === null ? `nicht innerhalb von ${jahre === 1 ? '1 Jahr' : `${jahre} Jahren`}` : `im ${r.kosten.amortisationJahr}. Jahr`}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">€ je Nutzwertpunkt</th>
            {w.ergebnisse.map((r) => (
              <td key={r.angebotId}>{r.euroJePunkt === null ? 'nicht berechenbar' : euroGenau(r.euroJePunkt)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Sensitivitaet() {
  const { z, g } = useApp()
  const p = z.projekt
  const w = g.auswertung
  const namen = new Map(p.angebote.map((a) => [a.id, angebotsname(a)]))
  const konkurrenten = w.ergebnisse.filter((r) => istZulaessig(r, p.entscheidung.regel, p.entscheidung.mindestNutzwert))
  const hinweise = w.befunde.filter((b) => b.code === 'S1' || b.code === 'S6')
  const empfohlen = p.angebote.find((a) => a.id === w.empfehlungId)
  return (
    <section className="karte" aria-labelledby="sens-titel">
      <h2 id="sens-titel">Sensitivität der Gewichte</h2>
      <Lernhinweis thema="sensitivitaet" />
      {w.stabilitaet.length === 0 ? (
        <BefundListe befunde={hinweise} kompakt leer="Keine Sensitivitätsanalyse: Es fehlen gültige Gewichte oder eine Empfehlung." />
      ) : (
        <>
          <ul className="stabil-liste">
            {w.stabilitaet.map((s) => (
              <li key={s.gruppe} className={s.knapp ? 'knapp' : undefined}>
                {stabilitaetText(s).replace(' (knapp)', '')}
                {s.knapp && (
                  <span className="marke marke-knapp">
                    <span aria-hidden="true">! </span>knapp
                  </span>
                )}
              </li>
            ))}
          </ul>
          <ul className="legende" aria-label="Legende der Sensitivitätsdiagramme">
            <li>
              <span className="linienfeld linienfeld-empfohlen" aria-hidden="true" />
              Empfehlung{empfohlen ? `: ${angebotsname(empfohlen)}` : ''}
            </li>
            <li>
              <span className="linienfeld linienfeld-andere" aria-hidden="true" />
              Mitbewerber
            </li>
            <li>
              <span className="farbfeld stabil-feld" aria-hidden="true" />
              stabiler Bereich
            </li>
          </ul>
          <p className="feld-hilfe">
            Waagrecht: Gewicht des Kriteriums; senkrecht: {p.entscheidung.regel === 'nutzwert' ? 'Nutzwert (0 bis 10)' : '€ je Nutzwertpunkt (weniger ist besser)'}. Die übrigen Gewichte ändern sich
            anteilig.
          </p>
          <div className="kleine-diagramme">
            {w.stabilitaet.map((s) => (
              <figure key={s.gruppe} className="klein-diagramm">
                <figcaption>
                  {gruppenName(s.gruppe)}: {prozent(s.von)} bis {prozent(s.bis)} %{s.knapp ? ' · knapp' : ''}
                </figcaption>
                <SensitivitaetDiagramm s={s} konkurrenten={konkurrenten} empfehlungId={w.empfehlungId} regel={p.entscheidung.regel} namen={namen} />
              </figure>
            ))}
          </div>
          <div className="tabelle-wrap">
            <table className="tabelle zahlen-tabelle">
              <caption>Stabile Bereiche je Hauptkriterium</caption>
              <thead>
                <tr>
                  <th scope="col">Hauptkriterium</th>
                  <th scope="col">Gewicht heute</th>
                  <th scope="col">stabil von</th>
                  <th scope="col">stabil bis</th>
                  <th scope="col">Abstand zum Rand</th>
                </tr>
              </thead>
              <tbody>
                {w.stabilitaet.map((s) => (
                  <tr key={s.gruppe}>
                    <th scope="row">{gruppenName(s.gruppe)}</th>
                    <td>{gewichtText(s.gewicht)}</td>
                    <td>{gewichtText(s.von)}</td>
                    <td>{gewichtText(s.bis)}</td>
                    <td>{s.abstand === null ? 'ganzer Bereich' : `${fest(s.abstand * 100, 1)} Prozentpunkte${s.knapp ? ' (knapp)' : ''}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
