import { useRef, type ChangeEvent } from 'react'
import { setzeAufgabeImUmfang, setzeGrundlage, setzeMediumStatus } from '../../lastenheft/aenderungen'
import { findeMedium } from '../../lastenheft/schnittstellen'
import { mitEinheit } from '../../lastenheft/texte'
import { alleMedien, standardStatus, statusVon } from '../../lastenheft/umfang'
import type { MediumStatus } from '../../modell/typen'
import { datum, proTag, zahl } from '../../modell/zahlformat'
import { plattform } from '../../plattform'
import { befundeDerQuelle } from '../../prozessdatei/einlesen'
import { PL_FORMAT_AKTUELL, PL_MEDIUM_NAMEN, type PlBlock } from '../../prozessdatei/format'
import { aufgabenVon, durchlaufe, grundlageVon, mediumVon, rolleVon } from '../../prozessdatei/struktur'
import { BefundListe } from '../Befunde'
import { domId } from '../befundziel'
import { Auswahl } from '../Eingaben'
import { GeheZu } from '../GeheZu'
import { jetzt, useApp } from '../kontext'
import { Lernhinweis } from '../Lernhinweis'
import { FALL_TEXT } from '../texte'

const STATUS_OPTIONEN: { wert: MediumStatus; text: string }[] = [
  { wert: 'abloesen', text: 'ablösen' },
  { wert: 'anbinden', text: 'anbinden' },
  { wert: 'unberuehrt', text: 'unberührt' },
]

function strukturText(b: PlBlock): string | null {
  switch (b.typ) {
    case 'entscheidung':
      return `Entscheidung: ${b.frage || 'ohne Frage'}`
    case 'oder':
      return `ODER-Verzweigung: ${b.frage || 'ohne Frage'}`
    case 'parallel':
      return 'Gleichzeitig'
    case 'wiederholung':
      return `Wiederholung: ${b.frage || 'ohne Frage'}`
    case 'warten':
      return `Warten: ${b.name || 'ohne Namen'}`
    case 'allgemein':
      return `Unbekannter Baustein „${b.originalTyp}“${b.name ? `: ${b.name}` : ''} (ohne Aufgaben im Lastenheft)`
    default:
      return null
  }
}

export function ProzessSchritt() {
  const { z, befehle } = useApp()
  const feld = useRef<HTMLInputElement>(null)
  const quelle = z.projekt.prozess

  const gewaehlt = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) await befehle.leseProzessEin({ pfad: null, name: f.name, inhalt: await f.text() })
  }

  return (
    <div className="schritt">
      <h1 id="schritt-titel" tabIndex={-1}>
        2 · Prozess
      </h1>
      <p className="einleitung">
        Das Prozessmodell aus dem Prozesslotsen liefert Aufgaben, Rollen, Systeme und Mengen. Daraus leitet der Auswahl-Lotse Funktionen, Schnittstellen und das Mengengerüst ab.
      </p>

      <section className="karte" id="prozess-karte" aria-labelledby="modell-titel">
        <h2 id="modell-titel">Prozessmodell</h2>
        {!quelle && (
          <p>
            Lesen Sie ein Projekt des Prozesslotsen ein: eine Datei <code>.prozesslotse</code> oder <code>.json</code> (Format 1 bis {PL_FORMAT_AKTUELL}) oder eine BPMN-Datei mit eingebettetem
            Projekt. Ohne Modell arbeiten Sie nur mit Katalog, Bausteinen und eigenen Anforderungen.
          </p>
        )}
        <input
          ref={feld}
          id="prozess-datei"
          type="file"
          accept=".prozesslotse,.json,.bpmn,application/json,application/xml,text/xml"
          hidden
          aria-label="Prozesslotse-Datei einlesen"
          onChange={(e) => void gewaehlt(e)}
        />
        <div className="knopfreihe">
          {/* Im Programm der Dialog des Systems (nur lesen, die Datei bleibt unverändert), im Browser das Dateifeld */}
          <button type="button" className="knopf knopf-haupt" onClick={() => (plattform.desktop ? void befehle.importiere() : feld.current?.click())}>
            {quelle ? 'Neu einlesen …' : 'Prozesslotse-Datei wählen …'}
          </button>
          <button type="button" className="knopf" onClick={() => void befehle.ohneProzessmodell()}>
            Ohne Prozessmodell weiter
          </button>
        </div>
        {quelle && <ModellKarte />}
      </section>

      {quelle && <UmfangKarte />}
      <GeheZu schritt="anforderungen" />
    </div>
  )
}

function ModellKarte() {
  const { z, g, aendere, lesebefunde } = useApp()
  const quelle = z.projekt.prozess!
  const pl = quelle.projekt
  const umfang = z.projekt.umfang
  const basis = grundlageVon(pl, umfang?.grundlage ?? 'ist')
  const format =
    quelle.formatVersionGelesen < PL_FORMAT_AKTUELL
      ? `Format ${quelle.formatVersionGelesen}, auf Format ${PL_FORMAT_AKTUELL} umgestellt`
      : quelle.formatVersionGelesen > PL_FORMAT_AKTUELL
        ? `Format ${quelle.formatVersionGelesen}, neuer als bekannt (gelesen wie Format ${PL_FORMAT_AKTUELL})`
        : `Format ${quelle.formatVersionGelesen}`
  const befunde = lesebefunde && lesebefunde.sha256 === quelle.sha256 ? lesebefunde.befunde : befundeDerQuelle(quelle)
  return (
    <>
      <dl className="angaben">
        <div>
          <dt>Prozess</dt>
          <dd>{basis.name || 'ohne Namen'}</dd>
        </div>
        <div>
          <dt>Datei</dt>
          <dd>
            {quelle.dateiname} ({quelle.dateiart === 'bpmn' ? 'BPMN mit eingebettetem Projekt' : 'Projektdatei'}, {format}), eingelesen am {datum(quelle.eingelesenAm)}
          </dd>
        </div>
        <div>
          <dt>Inhalt</dt>
          <dd>
            {pl.soll ? 'Ist- und Soll-Prozess' : 'nur Ist-Prozess'} · {mitEinheit(String(aufgabenVon(basis).length), 'Aufgabe', 'Aufgaben')},{' '}
            {mitEinheit(String(basis.rollen.length), 'Rolle', 'Rollen')}, {mitEinheit(String(basis.medien.length), 'System', 'Systeme')} ·{' '}
            {mitEinheit(zahl(basis.vorgaengeProTag, 1), 'Vorgang', 'Vorgänge')} pro Tag
          </dd>
        </div>
      </dl>
      {quelle.dateiart === 'bpmn' && <p className="feld-hilfe">Änderungen am Diagramm in anderen Werkzeugen sieht der Auswahl-Lotse nicht; er liest nur das eingebettete Projekt.</p>}
      {befunde.length > 0 && (
        <>
          <h3>Befunde beim Einlesen</h3>
          <BefundListe befunde={befunde} kompakt />
        </>
      )}
      {pl.soll && umfang && (
        <Auswahl
          label="Auf welchem Prozess baut das Lastenheft auf?"
          wert={umfang.grundlage}
          spalten={2}
          optionen={[
            { wert: 'soll', text: 'Soll-Prozess', beschreibung: 'empfohlen: so soll es künftig laufen' },
            { wert: 'ist', text: 'Ist-Prozess', beschreibung: 'so läuft es heute' },
          ]}
          onAendern={(grundlage) => aendere((p) => setzeGrundlage(p, grundlage, jetzt()))}
        />
      )}
      {g.mengengeruest && g.mengengeruest.befunde.length > 0 && (
        <>
          <h3>Hinweise zum Umfang</h3>
          <BefundListe befunde={g.mengengeruest.befunde} kompakt />
        </>
      )}
    </>
  )
}

function UmfangKarte() {
  const { z, g, aendere } = useApp()
  const p = z.projekt
  const pl = p.prozess!.projekt
  const umfang = p.umfang!
  const art = p.rahmen.softwareart
  const basis = grundlageVon(pl, umfang.grundlage)
  const m = g.mengengeruest
  const imUmfang = new Set(m?.imUmfang ?? [])
  const v = basis.vorgaengeProTag
  const betroffen = m ? m.medienbrueche.filter((b) => b.fall !== 'E').length : 0
  const aufgaben = aufgabenVon(basis)

  return (
    <section className="karte" aria-labelledby="umfang-titel">
      <h2 id="umfang-titel">Umfang</h2>
      <Lernhinweis thema="umfang" />
      {m && (
        <p className="zaehlerzeile">
          {m.imUmfang.length} {m.imUmfang.length === 1 ? 'Aufgabe' : 'Aufgaben'} im Umfang · {m.rollen.length} {m.rollen.length === 1 ? 'Rolle' : 'Rollen'} · {m.benutzer}{' '}
          {m.benutzer === 1 ? 'Benutzer' : 'Benutzer'} · {betroffen} {betroffen === 1 ? 'Medienbruch' : 'Medienbrüche'} betroffen
        </p>
      )}

      <h3>Systeme</h3>
      <div className="tabelle-wrap">
        <table className="tabelle">
          <caption className="sr">Systeme und ihr Status im Vorhaben</caption>
          <thead>
            <tr>
              <th scope="col">System</th>
              <th scope="col">Art</th>
              <th scope="col" className="zahl-spalte">
                Aufgaben
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {alleMedien(pl, umfang.grundlage).map((medium) => (
              <tr key={medium.id}>
                <th scope="row">{medium.name || 'ohne Namen'}</th>
                <td>{PL_MEDIUM_NAMEN[medium.art]}</td>
                <td className="zahl-spalte">{aufgaben.filter((a) => a.mediumId === medium.id).length}</td>
                <td>
                  <Auswahl
                    label={`Status von „${medium.name}“`}
                    legendeVersteckt
                    kompakt
                    wert={statusVon(umfang, medium, art)}
                    optionen={STATUS_OPTIONEN}
                    vorschlag={standardStatus(medium.art, art)}
                    onAendern={(status) => aendere((q) => setzeMediumStatus(q, medium.id, status, jetzt()))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Aufgaben in Prozessreihenfolge</h3>
      <div className="tabelle-wrap">
        <table className="tabelle aufgaben-tabelle">
          <caption className="sr">Aufgaben der Grundlage; das Kontrollkästchen nimmt eine Aufgabe in den Umfang auf</caption>
          <thead>
            <tr>
              <th scope="col">Im Umfang · Aufgabe</th>
              <th scope="col">Rolle</th>
              <th scope="col">System</th>
              <th scope="col" className="zahl-spalte">
                pro Tag
              </th>
            </tr>
          </thead>
          <tbody>
            {[...durchlaufe(basis.ablauf)].map(({ block, ebene }) => {
              const einzug = { paddingLeft: `${0.4 + ebene * 1.3}rem` }
              if (block.typ !== 'aufgabe') {
                const text = strukturText(block)
                return text ? (
                  <tr key={block.id} className="struktur-zeile">
                    <td colSpan={4} style={einzug}>
                      {text}
                    </td>
                  </tr>
                ) : null
              }
              const id = `${domId('aufgabe', block.id)}`
              return (
                <tr key={block.id}>
                  <td style={einzug}>
                    <label className="kontrolle">
                      <input id={id} type="checkbox" checked={imUmfang.has(block.id)} onChange={(e) => aendere((q) => setzeAufgabeImUmfang(q, block.id, e.target.checked, jetzt()))} />
                      <span>{block.name || 'ohne Namen'}</span>
                    </label>
                  </td>
                  <td>{rolleVon(basis, block.rolleId)?.name ?? '–'}</td>
                  <td>{mediumVon(basis, block.mediumId)?.name ?? '–'}</td>
                  <td className="zahl-spalte">{m ? proTag((m.haeufigkeit.get(block.id) ?? 0) * v) : '–'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {m && m.medienbrueche.length > 0 && (
        <>
          <h3>Medienbrüche</h3>
          <Lernhinweis thema="medienbruch" />
          <div className="tabelle-wrap">
            <table className="tabelle">
              <caption className="sr">Medienbrüche mit Fall und täglichem Aufwand</caption>
              <thead>
                <tr>
                  <th scope="col">Von → nach</th>
                  <th scope="col">Fall</th>
                  <th scope="col" className="zahl-spalte">
                    Übertragungen pro Tag
                  </th>
                  <th scope="col" className="zahl-spalte">
                    Minuten pro Tag
                  </th>
                </tr>
              </thead>
              <tbody>
                {m.medienbrueche.map((b) => (
                  <tr key={`${b.quelleId ?? 'ohne'}>${b.zielId}`}>
                    <th scope="row">
                      {b.quelleId ? (findeMedium(pl, b.quelleId, umfang.grundlage)?.name ?? '?') : 'ohne Quelle'} → {findeMedium(pl, b.zielId, umfang.grundlage)?.name ?? '?'}
                    </th>
                    <td>
                      {b.fall}: {FALL_TEXT[b.fall]}
                    </td>
                    <td className="zahl-spalte">{proTag(b.uebertragungenProTag)}</td>
                    <td className="zahl-spalte">{proTag(b.minutenProTag)}</td>
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
