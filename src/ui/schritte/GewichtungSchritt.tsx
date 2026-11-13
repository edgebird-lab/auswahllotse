import { useId } from 'react'
import { aufHundertBringen, gewichtText, gleichVerteilen, globaleGewichte, istBewertet } from '../../bewertung/gewichte'
import {
  legeFest,
  setzeBudget,
  setzeBudgetAlsKo,
  setzeDirektAlle,
  setzeDirektProzent,
  setzeMethode,
  setzeMindestNutzwert,
  setzePaarurteil,
  setzeRegel,
} from '../../bewertung/operationen'
import { setzePunkte } from '../../lastenheft/operationen'
import { PRIORITAET_NAMEN } from '../../lastenheft/texte'
import { gruppenName, type Gruppe, type Paarurteil, type Staerke } from '../../modell/typen'
import { datum, fest } from '../../modell/zahlformat'
import { CR_GRENZE } from '../../regeln/schwellen'
import { BefundListe } from '../Befunde'
import { domId } from '../../modell/befundziel'
import { Auswahl, Feld, ZahlEingabe } from '../Eingaben'
import { GeheZu } from '../GeheZu'
import { jetzt, useApp } from '../kontext'
import { Lernhinweis } from '../Lernhinweis'

/** Beschriftung der Saaty-Stufen (5.5); gerade Stufen liegen dazwischen. */
const STUFE: Record<number, string> = { 9: 'sehr viel wichtiger', 7: 'viel wichtiger', 5: 'deutlich wichtiger', 3: 'etwas wichtiger' }

interface Stufe {
  wichtiger: 'a' | 'b'
  staerke: Staerke
}

/** 17 Stufen von „links sehr viel wichtiger“ über „gleich wichtig“ bis „rechts sehr viel wichtiger“. */
const STUFEN: Stufe[] = [
  ...[9, 8, 7, 6, 5, 4, 3, 2].map((s) => ({ wichtiger: 'a' as const, staerke: s as Staerke })),
  { wichtiger: 'a', staerke: 1 },
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((s) => ({ wichtiger: 'b' as const, staerke: s as Staerke })),
]

function stufenText(st: Stufe, links: string, rechts: string): string {
  if (st.staerke === 1) return `„${links}“ und „${rechts}“ gleich wichtig`
  const name = st.wichtiger === 'a' ? links : rechts
  return STUFE[st.staerke] ? `„${name}“ ${STUFE[st.staerke]} (${st.staerke})` : `„${name}“ wichtiger, Stufe ${st.staerke}`
}

/** Index der Stufe eines Urteils aus Sicht des Paars (links, rechts). */
function stufenIndex(u: Paarurteil | undefined, links: Gruppe): number | null {
  if (!u) return null
  if (u.staerke === 1) return 8
  const linksWichtiger = (u.wichtiger === 'a' ? u.a : u.b) === links
  return linksWichtiger ? 9 - u.staerke : 7 + u.staerke
}

export function GewichtungSchritt() {
  const { z, g, aendere } = useApp()
  const p = z.projekt
  const { haupt, nurKo } = g.kriterien
  const gw = p.gewichtung
  const summe = haupt.reduce((s, x) => s + (gw.direktProzent[x] ?? 0), 0)
  const gewichtBefunde = g.auswertung.befunde.filter((b) => b.code.startsWith('G') || b.code.startsWith('AHP'))
  const nachBeginn = p.bewertungBegonnenAm !== null

  return (
    <div className="schritt">
      <h1 id="schritt-titel" tabIndex={-1}>
        4 · Gewichtung
      </h1>
      <p className="einleitung">Legen Sie fest, wie wichtig die Gruppen sind, bevor Sie Angebote bewerten. Muss-Anforderungen bringen keine Punkte; sie wirken als K.-o.-Kriterium.</p>
      <Lernhinweis thema="ko" />

      <section className="karte" id="gewichte" aria-labelledby="haupt-titel">
        <h2 id="haupt-titel">Hauptkriterien</h2>
        <p>
          {haupt.length} {haupt.length === 1 ? 'Gruppe hat' : 'Gruppen haben'} aktive Soll- oder Kann-Anforderungen: {haupt.map(gruppenName).join(', ')}.
          {nurKo.length > 0 && <> Nur als K.-o. wirken: {nurKo.map(gruppenName).join(', ')}.</>}
        </p>
        {haupt.length > 1 && (
          <Auswahl
            label="Wie wollen Sie gewichten?"
            wert={gw.methode}
            spalten={2}
            optionen={[
              { wert: 'direkt', text: 'Prozente direkt', beschreibung: 'schnell, bei wenigen Kriterien' },
              { wert: 'paarvergleich', text: 'Paarvergleich (AHP)', beschreibung: 'je zwei Kriterien vergleichen' },
            ]}
            onAendern={(m) => aendere((q) => setzeMethode(q, m))}
          />
        )}
        {haupt.length === 1 && <p className="leise">Ein einziges Hauptkriterium trägt immer 100 % des Gewichts.</p>}

        {haupt.length > 1 && gw.methode === 'direkt' && (
          <>
            <div className="tabelle-wrap">
              <table className="tabelle gewicht-tabelle">
                <caption className="sr">Gewichte der Hauptkriterien in Prozent</caption>
                <thead>
                  <tr>
                    <th scope="col">Gruppe</th>
                    <th scope="col">Gewicht</th>
                  </tr>
                </thead>
                <tbody>
                  {haupt.map((x) => (
                    <tr key={x}>
                      <th scope="row">{gruppenName(x)}</th>
                      <td>
                        <ZahlEingabe
                          ariaLabel={`Gewicht ${gruppenName(x)} in Prozent`}
                          wert={gw.direktProzent[x] ?? 0}
                          min={0}
                          max={100}
                          nachkomma={0}
                          suffix="%"
                          onAendern={(n) => aendere((q) => setzeDirektProzent(q, x, n ?? 0), `gewicht:${x}`)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Summe</th>
                    <td className={summe === 100 ? '' : 'summe-falsch'}>{summe} %</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="knopfreihe">
              <button type="button" className="knopf knopf-klein" onClick={() => aendere((q) => setzeDirektAlle(q, gleichVerteilen(haupt)))}>
                Gleich verteilen
              </button>
              <button type="button" className="knopf knopf-klein" onClick={() => aendere((q) => setzeDirektAlle(q, aufHundertBringen(gw.direktProzent, haupt)))}>
                Auf 100 % bringen
              </button>
            </div>
          </>
        )}

        {haupt.length > 1 && gw.methode === 'paarvergleich' && (
          <>
            <Lernhinweis thema="paarvergleich" />
            <div className="paar-legende" aria-hidden="true">
              {['sehr viel', '', 'viel', '', 'deutlich', '', 'etwas', '', 'gleich', '', 'etwas', '', 'deutlich', '', 'viel', '', 'sehr viel'].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
            {haupt.flatMap((a, i) => haupt.slice(i + 1).map((b) => <PaarZeile key={`${a}-${b}`} links={a} rechts={b} />))}
            <AhpErgebnis />
          </>
        )}
        <BefundListe befunde={gewichtBefunde} kompakt />
        {Object.keys(g.auswertung.gewichte).length > 0 && <GewichtBalken />}
      </section>

      <section className="karte" id="unterpunkte" aria-labelledby="unterpunkte-titel">
        <h2 id="unterpunkte-titel">Unterpunkte</h2>
        <p className="feld-hilfe">Innerhalb einer Gruppe verteilen die Punkte (0 bis 10) das Gewicht auf die Soll- und Kann-Anforderungen. Vorschlag: Soll 2, Kann 1.</p>
        {haupt.map((x) => (
          <Unterpunkte key={x} gruppe={x} />
        ))}
      </section>

      <Regel />

      <section className="karte" aria-labelledby="festlegen-titel">
        <h2 id="festlegen-titel">Festlegen</h2>
        <p>
          {gw.festgelegtAm ? `Gewichte und Regel festgelegt am ${datum(gw.festgelegtAm)}.` : 'Noch nicht festgelegt.'} Legen Sie die Gewichte fest, bevor Sie Angebote ansehen; so bleibt die Bewertung
          unabhängig von den Angeboten.
        </p>
        {nachBeginn && gw.aenderungenNachBewertung > 0 && (
          <p className="banner banner-warnung" role="note">
            Nach Beginn der Bewertung wurden Gewichte, Anforderungen oder Regel {gw.aenderungenNachBewertung}-mal geändert. Die Entscheidungsvorlage nennt diese Zahl.
          </p>
        )}
        {nachBeginn && gw.aenderungenNachBewertung === 0 && <p className="feld-hilfe">Die Bewertung hat begonnen. Jede weitere Änderung hier wird gezählt und in der Vorlage genannt.</p>}
        <button type="button" className="knopf knopf-haupt" disabled={gewichtBefunde.some((b) => b.schwere === 'fehler')} onClick={() => aendere((q) => legeFest(q, jetzt()))}>
          {gw.festgelegtAm ? 'Erneut festlegen' : 'Gewichte und Regel festlegen'}
        </button>
      </section>
      <GeheZu schritt="angebote" />
    </div>
  )
}

function PaarZeile({ links, rechts }: { links: Gruppe; rechts: Gruppe }) {
  const { z, aendere } = useApp()
  const name = useId()
  const u = z.projekt.gewichtung.paare.find((x) => (x.a === links && x.b === rechts) || (x.a === rechts && x.b === links))
  const aktiv = stufenIndex(u, links)
  const l = gruppenName(links)
  const r = gruppenName(rechts)
  return (
    <fieldset className="paar">
      <legend className="sr">
        „{l}“ gegen „{r}“
      </legend>
      <div className="paar-zeile">
        <span className="paar-name">{l}</span>
        <span className="paar-stufen">
          {STUFEN.map((st, i) => (
            <input
              key={i}
              type="radio"
              name={name}
              className={i === 8 ? 'paar-mitte' : undefined}
              aria-label={stufenText(st, l, r)}
              title={stufenText(st, l, r)}
              checked={aktiv === i}
              onChange={() => aendere((q) => setzePaarurteil(q, { a: links, b: rechts, wichtiger: st.wichtiger, staerke: st.staerke }))}
            />
          ))}
        </span>
        <span className="paar-name paar-name-rechts">{r}</span>
      </div>
      <p className="paar-urteil klein leise" aria-hidden="true">
        {aktiv === null ? 'noch kein Urteil' : stufenText(STUFEN[aktiv], l, r)}
      </p>
    </fieldset>
  )
}

function AhpErgebnis() {
  const { g } = useApp()
  const ahp = g.auswertung.ahp
  if (!ahp) return null
  return (
    <p className={`ampel ${ahp.stimmig ? 'ampel-gut' : 'ampel-schlecht'}`}>
      <span aria-hidden="true">{ahp.stimmig ? '✓' : '✕'}</span> Konsistenz: {ahp.stimmig ? 'stimmig' : 'widersprüchlich'} (CR {fest(ahp.cr, 2)}, Grenze {fest(CR_GRENZE, 2)})
    </p>
  )
}

/** Gewichte als Balken; die Zahlen stehen als Text daneben. */
function GewichtBalken() {
  const { g } = useApp()
  const eintraege = Object.entries(g.auswertung.gewichte) as [Gruppe, number][]
  return (
    <ul className="gewicht-balken" aria-label="Gewichte der Hauptkriterien">
      {eintraege.map(([x, w]) => (
        <li key={x}>
          <span className="gewicht-name">{gruppenName(x)}</span>
          <span className="gewicht-spur" aria-hidden="true">
            <span style={{ width: `${w * 100}%` }} />
          </span>
          <span className="gewicht-wert">{gewichtText(w)}</span>
        </li>
      ))}
    </ul>
  )
}

function Unterpunkte({ gruppe }: { gruppe: Gruppe }) {
  const { z, g, aendere } = useApp()
  const anforderungen = z.projekt.anforderungen.filter((a) => a.gruppe === gruppe && istBewertet(a))
  const global = globaleGewichte(z.projekt.anforderungen, g.auswertung.gewichte).gewichte
  const titelId = useId()
  return (
    <div className="unterpunkte" id={domId('punkte', gruppe)}>
      <h3 id={titelId}>
        {gruppenName(gruppe)} {g.auswertung.gewichte[gruppe] !== undefined && <span className="leise klein">({gewichtText(g.auswertung.gewichte[gruppe]!)})</span>}
      </h3>
      <div className="tabelle-wrap">
        <table className="tabelle punkte-tabelle" aria-labelledby={titelId}>
          <colgroup>
            <col className="spalte-nr" />
            <col />
            <col className="spalte-prio" />
            <col className="spalte-punkte" />
            <col className="spalte-gewicht" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Nr.</th>
              <th scope="col">Anforderung</th>
              <th scope="col">Priorität</th>
              <th scope="col">Punkte</th>
              <th scope="col" className="zahl-spalte">
                Gewicht gesamt
              </th>
            </tr>
          </thead>
          <tbody>
            {anforderungen.map((a) => (
              <tr key={a.id}>
                <td>{a.nummer}</td>
                <th scope="row">{a.titel}</th>
                <td>{PRIORITAET_NAMEN[a.prioritaet]}</td>
                <td>
                  <select aria-label={`Punkte für ${a.nummer ?? a.titel}`} value={a.punkte} onChange={(e) => aendere((q) => setzePunkte(q, a.id, Number(e.target.value)))}>
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="zahl-spalte">{global.has(a.id) ? gewichtText(global.get(a.id)!) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Regel() {
  const { z, aendere } = useApp()
  const e = z.projekt.entscheidung
  const w = z.projekt.wirtschaftlichkeit
  return (
    <section className="karte" aria-labelledby="regel-titel">
      <h2 id="regel-titel">Entscheidungsregel und Budget</h2>
      <Lernhinweis thema="nutzwert" />
      <Auswahl
        label="Welches Angebot soll empfohlen werden?"
        wert={e.regel}
        spalten={2}
        optionen={[
          { wert: 'nutzwert', text: 'höchster Nutzwert', beschreibung: 'bei Gleichstand das günstigere' },
          { wert: 'preis_leistung', text: 'bestes Preis-Leistungs-Verhältnis', beschreibung: 'wenigste € je Nutzwertpunkt' },
        ]}
        onAendern={(regel) => aendere((q) => setzeRegel(q, regel))}
      />
      {e.regel === 'preis_leistung' && (
        <Feld label="Mindestnutzwert" hilfe="Nur Angebote mit mindestens so vielen Punkten (0 bis 10) kommen in Frage.">
          {(id, hilfe) => (
            <ZahlEingabe id={id} beschreibung={hilfe} wert={e.mindestNutzwert} min={0} max={10} nachkomma={2} suffix="Punkte" onAendern={(n) => aendere((q) => setzeMindestNutzwert(q, n ?? 0), 'mindestnutzwert')} />
          )}
        </Feld>
      )}
      <div className="feldreihe">
        <Feld label="Budget über den Betrachtungszeitraum (optional)" hilfe="Netto, gemessen an der Kostenbasis (Gesamtkosten oder Barwert).">
          {(id, hilfe) => (
            <ZahlEingabe id={id} beschreibung={hilfe} wert={w.budgetEuro} min={0} nachkomma={0} suffix="€" breit optional onAendern={(n) => aendere((q) => setzeBudget(q, n), 'budget')} />
          )}
        </Feld>
        <label className="kontrolle budget-ko">
          <input type="checkbox" checked={w.budgetAlsKo} onChange={(ev) => aendere((q) => setzeBudgetAlsKo(q, ev.target.checked))} />
          <span>Budget als K.-o.-Kriterium: Angebote darüber scheiden aus</span>
        </label>
      </div>
    </section>
  )
}
