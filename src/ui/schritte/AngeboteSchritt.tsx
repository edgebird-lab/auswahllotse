import { useState } from 'react'
import {
  bewertungsFortschritt,
  bewertungsZeilen,
  fuegeAngebotHinzu,
  loescheAngebot,
  loescheKostenposition,
  neueKostenposition,
  setzeAngebot,
  setzeKostenposition,
  setzeKostenwert,
  setzeWirtschaftlichkeit,
  type Kostenliste,
} from '../../bewertung/angebote'
import { istKo } from '../../bewertung/gewichte'
import { angebotsname } from '../../bewertung/nutzwert'
import { setzeBewertung } from '../../bewertung/operationen'
import { jahreFuerRechnung, kostenartName } from '../../kosten/kosten'
import { uebernimmVorschlag, type VorschlagsFeld } from '../../kosten/vorschlaege'
import { PRIORITAET_NAMEN } from '../../lastenheft/texte'
import { EINMALIG_ARTEN, GRUPPEN, LAUFEND_ARTEN, type Angebot, type AngebotsBetriebsform, type Anforderung, type KoErgebnis } from '../../modell/typen'
import { euro, zahl } from '../../modell/zahlformat'
import { JAHRE_MAX, JAHRE_MIN, PROZENT_MIN } from '../../regeln/schwellen'
import { useBestaetigen } from '../frage'
import { Auswahl, Feld, Reiter, ReiterFlaeche, ZahlEingabe, type Option } from '../Eingaben'
import { GeheZu } from '../GeheZu'
import { jetzt, useApp } from '../kontext'
import { Lernhinweis } from '../Lernhinweis'

const BETRIEBSFORM_TEXT: Record<AngebotsBetriebsform, string> = { cloud: 'Cloud', eigener_server: 'eigener Server' }

const KO_OPTIONEN: Option<KoErgebnis>[] = [
  { wert: 'erfuellt', text: 'erfüllt' },
  { wert: 'nicht_erfuellt', text: 'nicht erfüllt' },
  { wert: 'offen', text: 'offen' },
]

/** Schnellwahl 0, 3, 5, 8, 10 mit Bedeutung (5.6). */
const PUNKTE_TEXT: Record<number, string> = { 0: 'nicht', 3: 'ansatzweise', 5: 'teilweise oder mit Anpassung', 8: 'weitgehend im Standard', 10: 'vollständig im Standard' }

export function AngeboteSchritt() {
  const { z, aendere, ansicht, setzeAnsicht } = useApp()
  const bestaetigen = useBestaetigen()
  const angebote = z.projekt.angebote
  const aktiv = angebote.find((a) => a.id === ansicht.angebotId) ?? angebote[0] ?? null

  const loeschen = async (a: Angebot) => {
    if (await bestaetigen('Angebot löschen?', `„${angebotsname(a)}“ mit allen Bewertungen und Kosten löschen? Mit „Rückgängig“ lässt es sich zurückholen.`, 'Löschen')) {
      aendere((p) => loescheAngebot(p, a.id))
    }
  }

  return (
    <div className="schritt">
      <h1 id="schritt-titel" tabIndex={-1}>
        5 · Angebote
      </h1>
      <p className="einleitung">Erfassen Sie die Angebote, prüfen Sie die Muss-Kriterien, vergeben Sie Punkte und tragen Sie die Kosten ein. Alle Beträge netto.</p>
      {!z.projekt.gewichtung.festgelegtAm && (
        <p className="banner banner-hinweis" role="note">
          Tipp: Legen Sie die Gewichte in Schritt 4 fest, bevor Sie Angebote bewerten. Spätere Änderungen werden gezählt.
        </p>
      )}

      <section className="karte" aria-labelledby="angebote-titel">
        <h2 id="angebote-titel">Angebote</h2>
        {angebote.length === 0 ? (
          <p className="leer-hinweis">Noch kein Angebot erfasst.</p>
        ) : (
          <div className="tabelle-wrap">
            <table className="tabelle">
              <caption className="sr">Erfasste Angebote</caption>
              <thead>
                <tr>
                  <th scope="col">Anbieter</th>
                  <th scope="col">Produkt</th>
                  <th scope="col">Betrieb</th>
                  <th scope="col">Bewertet</th>
                  <th scope="col">
                    <span className="sr">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {angebote.map((a) => {
                  const f = bewertungsFortschritt(z.projekt.anforderungen, a)
                  return (
                    <tr key={a.id} className={aktiv?.id === a.id ? 'zeile-aktiv' : undefined}>
                      <th scope="row">{a.anbieter || 'ohne Namen'}</th>
                      <td>{a.produkt}</td>
                      <td>{BETRIEBSFORM_TEXT[a.betriebsform]}</td>
                      <td>
                        {f.bewertet} von {f.gesamt}
                      </td>
                      <td className="knopfzelle">
                        <button type="button" className="knopf knopf-klein" aria-pressed={aktiv?.id === a.id} onClick={() => setzeAnsicht({ angebotId: a.id })}>
                          Bearbeiten<span className="sr"> {angebotsname(a)}</span>
                        </button>
                        <button type="button" className="knopf knopf-klein knopf-gefahr" onClick={() => void loeschen(a)}>
                          Löschen<span className="sr"> {angebotsname(a)}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <NeuesAngebot />
      </section>

      {aktiv && <AngebotKarte angebot={aktiv} />}
      <GeheZu schritt="ergebnis" />
    </div>
  )
}

function NeuesAngebot() {
  const { z, aendere, setzeAnsicht } = useApp()
  const [anbieter, setAnbieter] = useState('')
  const [produkt, setProdukt] = useState('')
  const [betriebsform, setBetriebsform] = useState<AngebotsBetriebsform>('cloud')
  const [angebotsdatum, setAngebotsdatum] = useState('')
  const [notiz, setNotiz] = useState('')
  return (
    <details className="aufklappbar" open={z.projekt.angebote.length === 0}>
      <summary>Angebot hinzufügen</summary>
      <form
        className="neues-angebot"
        onSubmit={(e) => {
          e.preventDefault()
          const r = fuegeAngebotHinzu(z.projekt, { anbieter: anbieter.trim(), produkt: produkt.trim(), betriebsform, angebotsdatum: angebotsdatum || null, notiz: notiz.trim() })
          aendere(() => r.projekt)
          setzeAnsicht({ angebotId: r.id, angebotReiter: 'bewertung' })
          setAnbieter('')
          setProdukt('')
          setAngebotsdatum('')
          setNotiz('')
        }}
      >
        <div className="feldreihe">
          <Feld label="Anbieter">{(id) => <input id={id} type="text" required value={anbieter} onChange={(e) => setAnbieter(e.target.value)} />}</Feld>
          <Feld label="Produkt">{(id) => <input id={id} type="text" value={produkt} onChange={(e) => setProdukt(e.target.value)} />}</Feld>
        </div>
        <div className="feldreihe">
          <Auswahl
            label="Betriebsform"
            kompakt
            wert={betriebsform}
            optionen={[
              { wert: 'cloud', text: 'Cloud' },
              { wert: 'eigener_server', text: 'eigener Server' },
            ]}
            onAendern={setBetriebsform}
          />
          <Feld label="Angebotsdatum">{(id) => <input id={id} type="date" value={angebotsdatum} onChange={(e) => setAngebotsdatum(e.target.value)} />}</Feld>
        </div>
        <Feld label="Notiz">{(id) => <textarea id={id} rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} />}</Feld>
        <button type="submit" className="knopf knopf-haupt">
          Hinzufügen
        </button>
      </form>
    </details>
  )
}

function AngebotKarte({ angebot }: { angebot: Angebot }) {
  const { z, aendere, ansicht, setzeAnsicht } = useApp()
  const f = bewertungsFortschritt(z.projekt.anforderungen, angebot)
  const praefix = 'angebot'
  return (
    <section className="karte" aria-labelledby="angebot-titel">
      <h2 id="angebot-titel">
        {angebotsname(angebot)}
        {angebot.produkt && <span className="leise"> · {angebot.produkt}</span>}
      </h2>
      <details className="aufklappbar">
        <summary>Angaben zum Angebot bearbeiten</summary>
        <div className="feldreihe">
          <Feld label="Anbieter">
            {(id) => <input id={id} type="text" value={angebot.anbieter} onChange={(e) => aendere((p) => setzeAngebot(p, angebot.id, { anbieter: e.target.value }), `anbieter:${angebot.id}`)} />}
          </Feld>
          <Feld label="Produkt">
            {(id) => <input id={id} type="text" value={angebot.produkt} onChange={(e) => aendere((p) => setzeAngebot(p, angebot.id, { produkt: e.target.value }), `produkt:${angebot.id}`)} />}
          </Feld>
        </div>
        <div className="feldreihe">
          <Auswahl
            label="Betriebsform"
            kompakt
            wert={angebot.betriebsform}
            optionen={[
              { wert: 'cloud', text: 'Cloud' },
              { wert: 'eigener_server', text: 'eigener Server' },
            ]}
            onAendern={(betriebsform) => aendere((p) => setzeAngebot(p, angebot.id, { betriebsform }))}
          />
          <Feld label="Angebotsdatum">
            {(id) => <input id={id} type="date" value={angebot.angebotsdatum ?? ''} onChange={(e) => aendere((p) => setzeAngebot(p, angebot.id, { angebotsdatum: e.target.value || null }))} />}
          </Feld>
        </div>
        <Feld label="Notiz">
          {(id) => <textarea id={id} rows={2} value={angebot.notiz} onChange={(e) => aendere((p) => setzeAngebot(p, angebot.id, { notiz: e.target.value }), `angebotsnotiz:${angebot.id}`)} />}
        </Feld>
      </details>
      <Reiter
        label={`Ansicht von ${angebotsname(angebot)}`}
        idPraefix={praefix}
        aktiv={ansicht.angebotReiter}
        onWahl={(angebotReiter) => setzeAnsicht({ angebotReiter })}
        reiter={[
          { id: 'bewertung', text: `Bewertung (${f.bewertet} von ${f.gesamt})` },
          { id: 'kosten', text: 'Kosten' },
        ]}
      />
      {ansicht.angebotReiter === 'bewertung' ? (
        <ReiterFlaeche idPraefix={praefix} id="bewertung">
          <Bewertung angebot={angebot} />
        </ReiterFlaeche>
      ) : (
        <ReiterFlaeche idPraefix={praefix} id="kosten">
          <KostenAnsicht angebot={angebot} />
        </ReiterFlaeche>
      )}
    </section>
  )
}

function Bewertung({ angebot }: { angebot: Angebot }) {
  const { z } = useApp()
  const zeilen = bewertungsZeilen(z.projekt.anforderungen)
  const f = bewertungsFortschritt(z.projekt.anforderungen, angebot)
  return (
    <>
      <p className="fortschritt" aria-live="polite">
        {f.bewertet} von {f.gesamt} bewertet
      </p>
      <p className="feld-hilfe">
        Muss-Anforderungen: erfüllt, nicht erfüllt oder offen (K.-o.). Soll und Kann: 0 bis 10 Punkte – 0 nicht, 3 ansatzweise, 5 teilweise oder mit Anpassung, 8 weitgehend im Standard, 10 vollständig im Standard.
      </p>
      {GRUPPEN.map(({ gruppe, name }) => {
        const inGruppe = zeilen.filter((a) => a.gruppe === gruppe)
        if (inGruppe.length === 0) return null
        return (
          <div key={gruppe} className="bewertung-gruppe">
            <h3>{name}</h3>
            <div className="tabelle-wrap">
              <table className="tabelle bewertung-tabelle">
                <caption className="sr">Bewertung {name}</caption>
                <thead>
                  <tr>
                    <th scope="col">Nr.</th>
                    <th scope="col">Anforderung</th>
                    <th scope="col">Bewertung</th>
                    <th scope="col">Fundstelle</th>
                    <th scope="col">Notiz</th>
                  </tr>
                </thead>
                <tbody>
                  {inGruppe.map((a) => (
                    <BewertungsZeile key={a.id} angebot={angebot} a={a} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </>
  )
}

function BewertungsZeile({ angebot, a }: { angebot: Angebot; a: Anforderung }) {
  const { aendere } = useApp()
  const b = angebot.bewertungen[a.id]
  const nr = a.nummer ?? a.titel
  const setze = (teil: Parameters<typeof setzeBewertung>[3], gruppe?: string) => aendere((p) => setzeBewertung(p, angebot.id, a.id, teil, jetzt()), gruppe)
  return (
    <tr>
      <td>{a.nummer}</td>
      <th scope="row" className="bewertung-anforderung">
        <span className="bewertung-titel">{a.titel}</span>
        <span className="leise klein"> · {PRIORITAET_NAMEN[a.prioritaet]}</span>
        <span className="bewertung-text klein">{a.text}</span>
      </th>
      <td>
        {istKo(a) ? (
          <Auswahl label={`K.-o.-Prüfung ${nr}`} legendeVersteckt kompakt wert={b?.ko ?? null} optionen={KO_OPTIONEN} onAendern={(ko) => setze({ ko })} />
        ) : (
          <select aria-label={`Punkte für ${nr}`} value={b?.punkte ?? ''} onChange={(e) => setze({ punkte: e.target.value === '' ? null : Number(e.target.value) })}>
            <option value="">– offen</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>
                {PUNKTE_TEXT[i] ? `${i} – ${PUNKTE_TEXT[i]}` : i}
              </option>
            ))}
          </select>
        )}
      </td>
      <td>
        <input type="text" aria-label={`Fundstelle ${nr}`} value={b?.fundstelle ?? ''} placeholder="z. B. Angebot S. 4" onChange={(e) => setze({ fundstelle: e.target.value }, `fundstelle:${angebot.id}:${a.id}`)} />
      </td>
      <td>
        <input type="text" aria-label={`Notiz ${nr}`} value={b?.notiz ?? ''} onChange={(e) => setze({ notiz: e.target.value }, `bewertungsnotiz:${angebot.id}:${a.id}`)} />
      </td>
    </tr>
  )
}

function VorschlagKnopf({ feld, text }: { feld: VorschlagsFeld; text: string }) {
  const { z, g, aendere } = useApp()
  const v = g.vorschlaege[feld]
  if (v === null || z.projekt.wirtschaftlichkeit[feld] === v) return null
  return (
    <span className="vorschlag-zeile">
      Vorschlag: {text}{' '}
      <button type="button" className="knopf knopf-klein knopf-leise" onClick={() => aendere((p) => uebernimmVorschlag(p, feld, g.vorschlaege))}>
        übernehmen<span className="sr"> ({text})</span>
      </button>
    </span>
  )
}

function KostenAnsicht({ angebot }: { angebot: Angebot }) {
  const { z, g, aendere } = useApp()
  const w = z.projekt.wirtschaftlichkeit
  const v = g.vorschlaege
  const ergebnis = g.auswertung.ergebnisse.find((r) => r.angebotId === angebot.id)
  const k = ergebnis?.kosten
  const jahre = jahreFuerRechnung(w.jahre)
  const kostenBefunde = g.befunde.filter((b) => (b.code === 'K8' || b.code === 'K9') && (b.bezug === null || b.bezug === angebot.id))
  return (
    <>
      <Lernhinweis thema="gesamtkosten" />
      <div className="unterkarte" id="annahmen">
        <h3>Annahmen für alle Angebote</h3>
        <div className="feldreihe feldreihe-3">
          <Feld label="Betrachtungszeitraum">
            {(id) => <ZahlEingabe id={id} wert={w.jahre} min={JAHRE_MIN} max={JAHRE_MAX} nachkomma={0} suffix="Jahre" onAendern={(n) => n !== null && aendere((p) => setzeWirtschaftlichkeit(p, { jahre: n }), 'jahre')} />}
          </Feld>
          <Feld label="Benutzer (Lizenzen)" hilfe={<VorschlagKnopf feld="benutzer" text={v.benutzer === null ? '' : `${v.benutzer} aus dem Umfang`} />}>
            {(id) => <ZahlEingabe id={id} wert={w.benutzer} min={0} nachkomma={0} onAendern={(n) => n !== null && aendere((p) => setzeWirtschaftlichkeit(p, { benutzer: n }), 'benutzer')} />}
          </Feld>
          <Feld label="Interner Stundensatz" hilfe={<VorschlagKnopf feld="internerStundensatzEuro" text={`${euro(v.internerStundensatzEuro)} aus den Rollen`} />}>
            {(id) => (
              <ZahlEingabe id={id} wert={w.internerStundensatzEuro} min={0} nachkomma={2} suffix="€" onAendern={(n) => n !== null && aendere((p) => setzeWirtschaftlichkeit(p, { internerStundensatzEuro: n }), 'stundensatz')} />
            )}
          </Feld>
          <Feld label="Stunden je Personentag" hilfe={<VorschlagKnopf feld="stundenProPersonentag" text={`${zahl(v.stundenProPersonentag, 1)} aus dem Prozess`} />}>
            {(id) => (
              <ZahlEingabe id={id} wert={w.stundenProPersonentag} min={0} max={24} nachkomma={1} suffix="Stunden" onAendern={(n) => n !== null && aendere((p) => setzeWirtschaftlichkeit(p, { stundenProPersonentag: n }), 'stunden')} />
            )}
          </Feld>
          <Feld label="Preissteigerung der laufenden Kosten">
            {(id) => (
              <ZahlEingabe id={id} wert={w.preissteigerungProzent} min={PROZENT_MIN} max={100} nachkomma={2} suffix="% pro Jahr" onAendern={(n) => n !== null && aendere((p) => setzeWirtschaftlichkeit(p, { preissteigerungProzent: n }), 'preissteigerung')} />
            )}
          </Feld>
          <Feld label="Kalkulationszins (optional)" hilfe="Leer lassen für eine Rechnung ohne Abzinsung.">
            {(id, hilfe) => (
              <ZahlEingabe id={id} beschreibung={hilfe} wert={w.zinsProzent} min={PROZENT_MIN} max={100} nachkomma={2} suffix="%" optional onAendern={(n) => aendere((p) => setzeWirtschaftlichkeit(p, { zinsProzent: n }), 'zins')} />
            )}
          </Feld>
          <Feld label="Nutzen pro Jahr (optional)" hilfe={<VorschlagKnopf feld="nutzenProJahrEuro" text={v.nutzenProJahrEuro === null ? '' : `${euro(v.nutzenProJahrEuro)} aus den Medienbrüchen`} />}>
            {(id) => (
              <ZahlEingabe id={id} wert={w.nutzenProJahrEuro} min={0} nachkomma={0} suffix="€" breit optional onAendern={(n) => aendere((p) => setzeWirtschaftlichkeit(p, { nutzenProJahrEuro: n }), 'nutzen')} />
            )}
          </Feld>
        </div>
        <Auswahl
          label="Kostenbasis für Budget und Preis-Leistung"
          kompakt
          wert={w.kostenbasis}
          optionen={[
            { wert: 'nominal', text: 'Gesamtkosten (nominal)' },
            { wert: 'barwert', text: 'Barwert (braucht einen Zins)' },
          ]}
          onAendern={(kostenbasis) => aendere((p) => setzeWirtschaftlichkeit(p, { kostenbasis }))}
        />
        {(w.zinsProzent !== null || w.kostenbasis === 'barwert') && <Lernhinweis thema="barwert" />}
      </div>

      <div className="unterkarte" id="angebot-kosten">
        <h3>Kosten von {angebotsname(angebot)} (netto)</h3>
        <Positionen angebot={angebot} liste="einmalig" titel="Einmalige Kosten" />
        <Positionen angebot={angebot} liste="laufendJahr" titel="Laufende Kosten pro Jahr" />
        <div className="feldreihe feldreihe-3">
          <Feld label="Preis je Benutzer und Monat">
            {(id) => (
              <ZahlEingabe id={id} wert={angebot.kosten.preisJeBenutzerMonatEuro} min={0} nachkomma={2} suffix="€" onAendern={(n) => n !== null && aendere((p) => setzeKostenwert(p, angebot.id, 'preisJeBenutzerMonatEuro', n), `preis:${angebot.id}`)} />
            )}
          </Feld>
          <Feld label="Einführung intern">
            {(id) => (
              <ZahlEingabe id={id} wert={angebot.kosten.internEinfuehrungTage} min={0} nachkomma={1} suffix="Personentage" onAendern={(n) => n !== null && aendere((p) => setzeKostenwert(p, angebot.id, 'internEinfuehrungTage', n), `einfuehrung:${angebot.id}`)} />
            )}
          </Feld>
          <Feld label="Schulung intern">
            {(id) => (
              <ZahlEingabe
                id={id}
                wert={angebot.kosten.internSchulungStundenJeBenutzer}
                min={0}
                nachkomma={1}
                suffix="Stunden je Benutzer"
                onAendern={(n) => n !== null && aendere((p) => setzeKostenwert(p, angebot.id, 'internSchulungStundenJeBenutzer', n), `schulung:${angebot.id}`)}
              />
            )}
          </Feld>
          <Feld label="Betrieb intern">
            {(id) => (
              <ZahlEingabe id={id} wert={angebot.kosten.internBetriebStundenMonat} min={0} nachkomma={1} suffix="Stunden im Monat" onAendern={(n) => n !== null && aendere((p) => setzeKostenwert(p, angebot.id, 'internBetriebStundenMonat', n), `betrieb:${angebot.id}`)} />
            )}
          </Feld>
        </div>
        {k && (
          <dl className="summen" aria-live="polite">
            <div>
              <dt>Einmalig</dt>
              <dd>{euro(k.einmalig)}</dd>
            </div>
            <div>
              <dt>Laufend im 1. Jahr</dt>
              <dd>{euro(k.laufend[0] ?? 0)}</dd>
            </div>
            <div>
              <dt>Gesamtkosten über {jahre === 1 ? '1 Jahr' : `${jahre} Jahre`}</dt>
              <dd>{euro(k.tco)}</dd>
            </div>
            {k.barwert !== null && (
              <div>
                <dt>Barwert</dt>
                <dd>{euro(k.barwert)}</dd>
              </div>
            )}
          </dl>
        )}
        {kostenBefunde.length > 0 && (
          <ul className="befunde befunde-kompakt">
            {kostenBefunde.map((b, i) => (
              <li key={i} className={`befund befund-${b.schwere}`}>
                <span className="befund-text">{b.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function Positionen({ angebot, liste, titel }: { angebot: Angebot; liste: Kostenliste; titel: string }) {
  const { aendere } = useApp()
  const positionen = angebot.kosten[liste]
  const arten: readonly string[] = liste === 'einmalig' ? EINMALIG_ARTEN : LAUFEND_ARTEN
  return (
    <div className="positionen">
      <h4>{titel}</h4>
      {positionen.length > 0 && (
        <div className="tabelle-wrap">
          <table className="tabelle">
            <caption className="sr">{titel}</caption>
            <thead>
              <tr>
                <th scope="col">Art</th>
                <th scope="col">Bezeichnung</th>
                <th scope="col">Betrag</th>
                <th scope="col">
                  <span className="sr">Aktion</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {positionen.map((pos, i) => (
                <tr key={pos.id}>
                  <td>
                    <select
                      aria-label={`Art der Position ${i + 1} (${titel})`}
                      value={pos.art}
                      onChange={(e) => aendere((p) => setzeKostenposition(p, angebot.id, liste, pos.id, { art: e.target.value as never }))}
                    >
                      {arten.map((a) => (
                        <option key={a} value={a}>
                          {kostenartName(a)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      aria-label={`Bezeichnung der Position ${i + 1} (${titel})`}
                      value={pos.bezeichnung}
                      onChange={(e) => aendere((p) => setzeKostenposition(p, angebot.id, liste, pos.id, { bezeichnung: e.target.value }), `bezeichnung:${pos.id}`)}
                    />
                  </td>
                  <td>
                    <ZahlEingabe
                      ariaLabel={`Betrag der Position ${i + 1} (${titel}) in Euro`}
                      wert={pos.betragEuro}
                      min={0}
                      nachkomma={2}
                      suffix="€"
                      breit
                      onAendern={(n) => n !== null && aendere((p) => setzeKostenposition(p, angebot.id, liste, pos.id, { betragEuro: n }), `betrag:${pos.id}`)}
                    />
                  </td>
                  <td>
                    <button type="button" className="knopf knopf-klein knopf-gefahr" onClick={() => aendere((p) => loescheKostenposition(p, angebot.id, liste, pos.id))}>
                      Entfernen<span className="sr"> Position {i + 1} ({titel})</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        type="button"
        className="knopf knopf-klein"
        onClick={() => {
          aendere((p) => neueKostenposition(p, angebot.id, liste).projekt)
        }}
      >
        + Position: {titel}
      </button>
    </div>
  )
}
