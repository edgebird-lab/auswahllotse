import { useId, useMemo, useState } from 'react'
import {
  loescheEigene,
  neueEigeneAnforderung,
  setzeNotiz,
  setzePrioritaet,
  setzeTexte,
  stelleWiederHer,
  uebernimm,
  uebernimmAlleVorschlaege,
  verwirf,
} from '../../lastenheft/operationen'
import { PRIORITAET_NAMEN } from '../../lastenheft/texte'
import type { Befund } from '../../modell/ergebnisse'
import { GRUPPEN, gruppenName, PRIORITAETEN, type Anforderung, type AnforderungsStatus, type Gruppe, type HerkunftArt, type Prioritaet } from '../../modell/typen'
import { prozent } from '../../modell/zahlformat'
import { MUSS_ANTEIL_GRENZE } from '../../regeln/schwellen'
import { BefundListe } from '../Befunde'
import { domId } from '../befundziel'
import { Auswahl, Feld, type Option } from '../Eingaben'
import { GeheZu } from '../GeheZu'
import { useApp } from '../kontext'
import { Lernhinweis } from '../Lernhinweis'

const PRIO_OPTIONEN: Option<Prioritaet>[] = PRIORITAETEN.map((p) => ({ wert: p, text: PRIORITAET_NAMEN[p] }))

const HERKUNFT: Record<HerkunftArt, string> = {
  aufgabe: 'Aufgabe im Prozessmodell',
  entscheidung: 'Entscheidung im Prozessmodell',
  medienbruch: 'Medienbruch im Prozessmodell',
  rollen: 'Rollen im Umfang',
  freigabe: 'Freigabe im Prozessmodell',
  pruefung: 'Prüfung im Prozessmodell',
  mengengeruest: 'Mengengerüst',
  katalog: 'Katalog',
  baustein: 'Baustein',
  eigene: 'Eigene Anforderung',
}

const STATUS_TEXT: Record<AnforderungsStatus, string> = { aktiv: 'aktiv', vorschlag: 'Vorschlag', verworfen: 'verworfen' }

type StatusFilter = 'offen' | AnforderungsStatus | 'alle'

interface Filter {
  gruppe: Gruppe | 'alle'
  prioritaet: Prioritaet | 'alle'
  status: StatusFilter
  nurBefund: boolean
}

const bezeichnung = (a: Anforderung) => a.nummer ?? `„${a.titel || 'ohne Titel'}“`

export function AnforderungenSchritt() {
  const { z, g, aendere } = useApp()
  const [filter, setFilter] = useState<Filter>({ gruppe: 'alle', prioritaet: 'alle', status: 'offen', nurBefund: false })
  const anforderungen = z.projekt.anforderungen
  const befundeJe = useMemo(() => {
    const m = new Map<string, Befund[]>()
    for (const b of g.pruefung.befunde) if (b.bezug) m.set(b.bezug, [...(m.get(b.bezug) ?? []), b])
    return m
  }, [g.pruefung.befunde])
  const allgemein = g.pruefung.befunde.filter((b) => b.bezug === null)
  const passt = (a: Anforderung) =>
    (filter.gruppe === 'alle' || a.gruppe === filter.gruppe) &&
    (filter.prioritaet === 'alle' || a.prioritaet === filter.prioritaet) &&
    (filter.status === 'alle' || (filter.status === 'offen' ? a.status !== 'verworfen' : a.status === filter.status)) &&
    (!filter.nurBefund || (befundeJe.get(a.id)?.length ?? 0) > 0)
  const sichtbar = anforderungen.filter(passt)
  const muss = anforderungen.filter((a) => a.status === 'aktiv' && a.prioritaet === 'muss').length
  const gezaehlt = anforderungen.filter((a) => a.status === 'aktiv' && a.prioritaet !== 'nicht').length

  return (
    <div className="schritt">
      <h1 id="schritt-titel" tabIndex={-1}>
        3 · Anforderungen
      </h1>
      <p className="einleitung">Prüfen Sie die Vorschläge, passen Sie Texte und Prioritäten an und ergänzen Sie eigene Anforderungen. Aktive Anforderungen kommen ins Lastenheft.</p>
      <Lernhinweis thema="moscow" />

      <section className="karte kopfzahlen" id="anforderungen-kopf" aria-labelledby="kopf-titel">
        <h2 id="kopf-titel" className="sr">
          Überblick
        </h2>
        <p className="zaehlerzeile">
          {g.pruefung.aktiv} aktive Anforderungen · {g.pruefung.offeneVorschlaege} {g.pruefung.offeneVorschlaege === 1 ? 'Vorschlag' : 'Vorschläge'} offen · {g.pruefung.befunde.length}{' '}
          {g.pruefung.befunde.length === 1 ? 'Befund' : 'Befunde'}
        </p>
        <MussAnteil anteil={g.pruefung.mussAnteil} muss={muss} gesamt={gezaehlt} />
        <BefundListe befunde={allgemein} kompakt />
      </section>

      <form className="filter" aria-label="Anforderungen filtern" onSubmit={(e) => e.preventDefault()}>
        <Feld label="Gruppe">
          {(id) => (
            <select id={id} value={filter.gruppe} onChange={(e) => setFilter({ ...filter, gruppe: e.target.value as Filter['gruppe'] })}>
              <option value="alle">alle Gruppen</option>
              {GRUPPEN.map((x) => (
                <option key={x.gruppe} value={x.gruppe}>
                  {x.name}
                </option>
              ))}
            </select>
          )}
        </Feld>
        <Feld label="Priorität">
          {(id) => (
            <select id={id} value={filter.prioritaet} onChange={(e) => setFilter({ ...filter, prioritaet: e.target.value as Filter['prioritaet'] })}>
              <option value="alle">alle</option>
              {PRIO_OPTIONEN.map((o) => (
                <option key={o.wert} value={o.wert}>
                  {o.text}
                </option>
              ))}
            </select>
          )}
        </Feld>
        <Feld label="Status">
          {(id) => (
            <select id={id} value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value as StatusFilter })}>
              <option value="offen">aktiv und Vorschläge</option>
              <option value="aktiv">nur aktive</option>
              <option value="vorschlag">nur Vorschläge</option>
              <option value="verworfen">nur verworfene</option>
              <option value="alle">alle</option>
            </select>
          )}
        </Feld>
        <label className="kontrolle filter-befund">
          <input type="checkbox" checked={filter.nurBefund} onChange={(e) => setFilter({ ...filter, nurBefund: e.target.checked })} />
          <span>nur mit Befund</span>
        </label>
      </form>

      <EigeneAnforderung />

      {GRUPPEN.map(({ gruppe, name }) => {
        const inGruppe = sichtbar.filter((a) => a.gruppe === gruppe)
        const vorschlaege = anforderungen.filter((a) => a.gruppe === gruppe && a.status === 'vorschlag').length
        const aktiv = anforderungen.filter((a) => a.gruppe === gruppe && a.status === 'aktiv').length
        const gruppenBefunde = befundeJe.get(`gruppe:${gruppe}`) ?? []
        if (inGruppe.length === 0 && gruppenBefunde.length === 0) return null
        const titelId = `gruppe-titel-${gruppe}`
        return (
          <section key={gruppe} className="gruppe" id={domId('gruppe', gruppe)} aria-labelledby={titelId}>
            <div className="gruppe-kopf">
              <h2 id={titelId}>
                {name} <span className="leise klein">
                  {aktiv} aktiv{vorschlaege > 0 ? `, ${vorschlaege} ${vorschlaege === 1 ? 'Vorschlag' : 'Vorschläge'}` : ''}
                </span>
              </h2>
              {vorschlaege > 0 && (
                <button type="button" className="knopf knopf-klein" onClick={() => aendere((p) => uebernimmAlleVorschlaege(p, gruppe))}>
                  Alle Vorschläge dieser Gruppe übernehmen<span className="sr"> ({name})</span>
                </button>
              )}
            </div>
            <BefundListe befunde={gruppenBefunde} kompakt />
            <ul className="anforderungen">
              {inGruppe.map((a) => (
                <li key={a.id}>
                  <AnforderungKarte a={a} befunde={befundeJe.get(a.id) ?? []} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {sichtbar.length === 0 && <p className="leer-hinweis">Keine Anforderung passt zum Filter.</p>}
      <GeheZu schritt="gewichtung" />
    </div>
  )
}

/** Muss-Anteil als Balken mit Marke bei 60 % (P7). */
function MussAnteil({ anteil, muss, gesamt }: { anteil: number | null; muss: number; gesamt: number }) {
  if (anteil === null) return <p className="leise">Noch keine aktive Muss-, Soll- oder Kann-Anforderung.</p>
  const zuViel = anteil > MUSS_ANTEIL_GRENZE + 1e-9
  return (
    <div className={`meter${zuViel ? ' meter-warnung' : ''}`}>
      <div className="meter-kopf">
        <span className="meter-name">Muss-Anteil</span>
        <span className="meter-wert">
          {prozent(anteil)} % ({muss} von {gesamt}){zuViel ? ' – mehr als empfohlen' : ''}
        </span>
      </div>
      <div className="meter-spur" aria-hidden="true">
        <div className="meter-fuellung" style={{ width: `${Math.min(100, anteil * 100)}%` }} />
        <div className="meter-schwelle" style={{ left: `${MUSS_ANTEIL_GRENZE * 100}%` }} />
      </div>
      <div className="meter-fuss">
        <span>0 %</span>
        <span>Empfehlung höchstens etwa {MUSS_ANTEIL_GRENZE * 100} %</span>
      </div>
    </div>
  )
}

function AnforderungKarte({ a, befunde }: { a: Anforderung; befunde: Befund[] }) {
  const { aendere } = useApp()
  const [bearbeiten, setBearbeiten] = useState(false)
  const titelId = useId()
  const flaecheId = useId()
  const name = bezeichnung(a)
  const geaendert = a.prioritaet !== a.prioritaetVorschlag
  const herkunft = a.herkunft.katalogId ? `${HERKUNFT[a.herkunft.art]} ${a.herkunft.katalogId}` : HERKUNFT[a.herkunft.art]
  return (
    <article className={`anforderung anforderung-${a.status}`} id={domId('anf', a.id)} aria-labelledby={titelId}>
      <div className="anforderung-kopf">
        <span className="nummer-marke">{a.nummer ?? 'ohne Nr.'}</span>
        <h3 id={titelId}>{a.titel || 'ohne Titel'}</h3>
        <span className="marken">
          {a.status !== 'aktiv' && <span className={`marke marke-${a.status}`}>{STATUS_TEXT[a.status]}</span>}
          {geaendert && (
            <span className="marke marke-geaendert" title={`Vorschlag war ${PRIORITAET_NAMEN[a.prioritaetVorschlag]}`}>
              geändert
            </span>
          )}
          {a.prioritaet === 'nicht' && <span className="marke">nicht in diesem Vorhaben</span>}
        </span>
      </div>
      {bearbeiten && a.status !== 'verworfen' ? (
        <div className="anforderung-bearbeiten" id={flaecheId}>
          <Feld label="Titel">{(id) => <input id={id} type="text" value={a.titel} onChange={(e) => aendere((p) => setzeTexte(p, a.id, { titel: e.target.value }), `titel:${a.id}`)} />}</Feld>
          <Feld label="Anforderung">
            {(id) => <textarea id={id} rows={3} value={a.text} onChange={(e) => aendere((p) => setzeTexte(p, a.id, { text: e.target.value }), `text:${a.id}`)} />}
          </Feld>
          <Feld label="Abnahmekriterium">
            {(id) => <textarea id={id} rows={2} value={a.abnahme} onChange={(e) => aendere((p) => setzeTexte(p, a.id, { abnahme: e.target.value }), `abnahme:${a.id}`)} />}
          </Feld>
          <Feld label="Notiz">{(id) => <textarea id={id} rows={2} value={a.notiz} onChange={(e) => aendere((p) => setzeNotiz(p, a.id, e.target.value), `notiz:${a.id}`)} />}</Feld>
        </div>
      ) : (
        <>
          <p className="anforderung-text">{a.text || <em>ohne Text</em>}</p>
          <p className="anforderung-abnahme">
            <strong>Abnahme:</strong> {a.abnahme || <em>fehlt</em>}
          </p>
        </>
      )}
      {a.status !== 'verworfen' && (
        <Auswahl
          label={
            <>
              Priorität<span className="sr"> von {name}</span>
            </>
          }
          kompakt
          wert={a.prioritaet}
          optionen={PRIO_OPTIONEN}
          vorschlag={a.prioritaetVorschlag}
          onAendern={(prio) => aendere((p) => setzePrioritaet(p, a.id, prio))}
        />
      )}
      <p className="herkunft">
        <strong>Herkunft:</strong> {herkunft}. {a.begruendung}
        {a.quelle && (
          <>
            {' '}
            <strong>Quelle:</strong> {a.quelle}
          </>
        )}
      </p>
      {a.notiz && !bearbeiten && (
        <p className="herkunft notiz">
          <strong>Notiz:</strong> {a.notiz}
        </p>
      )}
      <BefundListe befunde={befunde} kompakt />
      <div className="knopfreihe">
        {a.status === 'vorschlag' && (
          <button type="button" className="knopf knopf-klein knopf-haupt" onClick={() => aendere((p) => uebernimm(p, a.id))}>
            Übernehmen<span className="sr"> {name}</span>
          </button>
        )}
        {a.status !== 'verworfen' && (
          <button type="button" className="knopf knopf-klein" aria-expanded={bearbeiten} aria-controls={bearbeiten ? flaecheId : undefined} onClick={() => setBearbeiten(!bearbeiten)}>
            {bearbeiten ? 'Fertig' : 'Bearbeiten'}
            <span className="sr"> {name}</span>
          </button>
        )}
        {a.status !== 'verworfen' && (
          <button type="button" className="knopf knopf-klein" onClick={() => aendere((p) => verwirf(p, a.id))}>
            Verwerfen<span className="sr"> {name}</span>
          </button>
        )}
        {a.status === 'verworfen' && (
          <button type="button" className="knopf knopf-klein" onClick={() => aendere((p) => stelleWiederHer(p, a.id))}>
            Wiederherstellen<span className="sr"> {name}</span>
          </button>
        )}
        {a.herkunft.art === 'eigene' && (
          <button type="button" className="knopf knopf-klein knopf-gefahr" onClick={() => aendere((p) => loescheEigene(p, a.id))}>
            Löschen<span className="sr"> {name}</span>
          </button>
        )}
      </div>
    </article>
  )
}

function EigeneAnforderung() {
  const { z, aendere, springeZu } = useApp()
  const [gruppe, setGruppe] = useState<Gruppe>('funktion')
  const [titel, setTitel] = useState('')
  const [text, setText] = useState('')
  const [abnahme, setAbnahme] = useState('')
  const [prioritaet, setPrioritaet] = useState<Prioritaet>('soll')
  const anlegen = () => {
    // Kennung vorher bilden, damit der Fokus danach auf die neue Anforderung springen kann
    const r = neueEigeneAnforderung(z.projekt, gruppe, { titel: titel.trim(), text: text.trim(), abnahme: abnahme.trim(), prioritaet })
    aendere(() => r.projekt)
    setTitel('')
    setText('')
    setAbnahme('')
    springeZu({ schritt: 'anforderungen', anker: domId('anf', r.id) })
  }
  return (
    <details className="karte aufklappbar eigene-anforderung">
      <summary>Eigene Anforderung anlegen</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          anlegen()
        }}
      >
        <div className="feldreihe">
          <Feld label="Gruppe">
            {(id) => (
              <select id={id} value={gruppe} onChange={(e) => setGruppe(e.target.value as Gruppe)}>
                {GRUPPEN.map((x) => (
                  <option key={x.gruppe} value={x.gruppe}>
                    {gruppenName(x.gruppe)}
                  </option>
                ))}
              </select>
            )}
          </Feld>
          <Feld label="Titel">{(id) => <input id={id} type="text" value={titel} required onChange={(e) => setTitel(e.target.value)} />}</Feld>
        </div>
        <Feld label="Anforderung" hilfe="Mit Modalverb: „Die Software muss …“, „sollte …“ oder „kann …“.">
          {(id, hilfe) => <textarea id={id} rows={2} aria-describedby={hilfe} value={text} required onChange={(e) => setText(e.target.value)} />}
        </Feld>
        <Feld label="Abnahmekriterium">{(id) => <textarea id={id} rows={2} value={abnahme} onChange={(e) => setAbnahme(e.target.value)} />}</Feld>
        <Auswahl label="Priorität" kompakt wert={prioritaet} optionen={PRIO_OPTIONEN} onAendern={setPrioritaet} />
        <button type="submit" className="knopf knopf-haupt">
          Anlegen
        </button>
      </form>
    </details>
  )
}
