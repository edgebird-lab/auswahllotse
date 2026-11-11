/**
 * Druckansicht Lastenheft (Spezifikation 5.8): Abschnitte 1 bis 12 und
 * Anhang mit der Gliederung des Prozesses. Druck als PDF über den Browser.
 */
import { gruppenName, GRUPPEN, type Anforderung, type AuswahlProjekt, type Gruppe } from '../../modell/typen'
import { datum, proTag, prozent } from '../../modell/zahlformat'
import { ausgangslageText } from '../../export/vorlagen'
import { RECHTSSTAND } from '../../lastenheft/katalog'
import { PRIORITAET_NAMEN } from '../../lastenheft/texte'
import { alleMedien, statusVon } from '../../lastenheft/umfang'
import type { PlBlock, PlProzess, PlSequenz } from '../../prozessdatei/format'
import { aufgabenVon, grundlageVon, mediumVon, rolleVon } from '../../prozessdatei/struktur'
import { useApp } from '../kontext'

function nachNummer(a: Anforderung, b: Anforderung): number {
  const n = (x: Anforderung) => Number(x.nummer?.match(/(\d+)$/)?.[1] ?? 999)
  return n(a) - n(b)
}

export function Lastenheft() {
  const { z, g } = useApp()
  const p = z.projekt
  // Stand: letzte Änderung des Projekts (rein, ohne Uhr beim Zeichnen)
  const stand = datum(p.geaendertAm)
  return (
    <article className="druck-dokument" aria-labelledby="lh-titel">
      <header className="druck-kopf">
        <p className="druck-art">Lastenheft</p>
        <h2 id="lh-titel">{p.rahmen.vorhaben || 'Vorhaben ohne Namen'}</h2>
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
            <dt>Stand</dt>
            <dd>{stand}</dd>
          </div>
        </dl>
      </header>

      <section>
        <h3>1 Ausgangslage und Ziel</h3>
        <p>{ausgangslageText(p, g.mengengeruest)}</p>
      </section>

      <Umfang p={p} />

      {GRUPPEN.map(({ gruppe }, i) => (
        <GruppenAbschnitt key={gruppe} nummer={i + 3} gruppe={gruppe} anforderungen={p.anforderungen.filter((a) => a.gruppe === gruppe && a.status === 'aktiv').sort(nachNummer)} />
      ))}

      <section>
        <h3>12 Hinweise</h3>
        <ul>
          <li>
            Prioritäten nach MoSCoW: <strong>Muss</strong> ist unverzichtbar, <strong>Soll</strong> wichtig, <strong>Kann</strong> erwünscht; <strong>Nicht</strong> gilt für dieses Vorhaben nicht.
          </li>
          <li>Muss-Anforderungen sind K.-o.-Kriterien: Ein Angebot, das eine davon nicht erfüllt, scheidet aus.</li>
          <li>Soll- und Kann-Anforderungen werden je Angebot mit 0 bis 10 Punkten bewertet.</li>
          <li>Rechtliche Anforderungen ohne Gewähr, keine Rechtsberatung, Stand {RECHTSSTAND}.</li>
        </ul>
      </section>

      {p.prozess && p.umfang && (
        <section className="anhang">
          <h3>Anhang: Gliederung des Prozesses</h3>
          <Gliederung prozess={grundlageVon(p.prozess.projekt, p.umfang.grundlage)} />
        </section>
      )}
    </article>
  )
}

function Umfang({ p }: { p: AuswahlProjekt }) {
  const { g } = useApp()
  if (!p.prozess || !p.umfang || !g.mengengeruest) {
    return (
      <section>
        <h3>2 Umfang</h3>
        <p>Ohne Prozessmodell. Der Umfang ergibt sich aus den Anforderungen.</p>
      </section>
    )
  }
  const pl = p.prozess.projekt
  const umfang = p.umfang
  const basis = grundlageVon(pl, umfang.grundlage)
  const medien = alleMedien(pl, umfang.grundlage)
  const mit = (status: 'abloesen' | 'anbinden' | 'unberuehrt') =>
    medien
      .filter((m) => statusVon(umfang, m, p.rahmen.softwareart) === status)
      .map((m) => m.name)
      .join(', ') || '–'
  const m = g.mengengeruest
  const imUmfang = new Set(m.imUmfang)
  return (
    <section>
      <h3>2 Umfang</h3>
      <ul>
        <li>Abgelöste Systeme: {mit('abloesen')}</li>
        <li>Anzubindende Systeme: {mit('anbinden')}</li>
        <li>Unberührte Systeme: {mit('unberuehrt')}</li>
      </ul>
      <table className="tabelle druck-tabelle">
        <caption>Aufgaben im Umfang</caption>
        <thead>
          <tr>
            <th scope="col">Aufgabe</th>
            <th scope="col">Rolle</th>
            <th scope="col">System heute</th>
            <th scope="col" className="zahl-spalte">
              Ausführungen pro Tag
            </th>
          </tr>
        </thead>
        <tbody>
          {aufgabenVon(basis)
            .filter((a) => imUmfang.has(a.id))
            .map((a) => (
              <tr key={a.id}>
                <th scope="row">{a.name}</th>
                <td>{rolleVon(basis, a.rolleId)?.name ?? '–'}</td>
                <td>{mediumVon(basis, a.mediumId)?.name ?? '–'}</td>
                <td className="zahl-spalte">{proTag((m.haeufigkeit.get(a.id) ?? 0) * m.vorgaengeProTag)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  )
}

function GruppenAbschnitt({ nummer, gruppe, anforderungen }: { nummer: number; gruppe: Gruppe; anforderungen: Anforderung[] }) {
  return (
    <section>
      <h3>
        {nummer} {gruppenName(gruppe)}
      </h3>
      {anforderungen.length === 0 ? (
        <p>Keine Anforderungen in diesem Vorhaben.</p>
      ) : (
        <table className="tabelle druck-tabelle anforderungs-tabelle">
          <thead>
            <tr>
              <th scope="col">Nr.</th>
              <th scope="col">Anforderung</th>
              <th scope="col">Priorität</th>
              <th scope="col">Abnahmekriterium</th>
            </tr>
          </thead>
          <tbody>
            {anforderungen.map((a) => (
              <tr key={a.id}>
                <th scope="row">{a.nummer}</th>
                <td>
                  <strong>{a.titel}</strong>
                  <br />
                  {a.text}
                  <span className="druck-klein">
                    {a.begruendung}
                    {a.quelle ? ` Quelle: ${a.quelle}.` : ''}
                  </span>
                </td>
                <td>{a.prioritaet === 'nicht' ? 'Nicht (in diesem Vorhaben)' : PRIORITAET_NAMEN[a.prioritaet]}</td>
                <td>{a.abnahme || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function blockText(b: PlBlock, p: PlProzess): string {
  switch (b.typ) {
    case 'aufgabe': {
      const rolle = rolleVon(p, b.rolleId)?.name
      const system = mediumVon(p, b.mediumId)?.name
      const zusatz = [rolle, system].filter(Boolean).join(', ')
      return zusatz ? `${b.name} (${zusatz})` : b.name
    }
    case 'entscheidung':
      return `Entscheidung: ${b.frage}`
    case 'oder':
      return `ODER-Verzweigung: ${b.frage}`
    case 'parallel':
      return 'Gleichzeitig'
    case 'wiederholung':
      return `Wiederholung: ${b.frage}`
    case 'warten':
      return `Warten: ${b.name}`
    case 'allgemein':
      return `Baustein „${b.originalTyp}“${b.name ? `: ${b.name}` : ''}`
  }
}

function Folge({ folge, prozess }: { folge: PlSequenz; prozess: PlProzess }) {
  if (folge.schritte.length === 0) return null
  return (
    <ul className="gliederung">
      {folge.schritte.map((b) => (
        <li key={b.id}>
          {blockText(b, prozess)}
          {(b.typ === 'entscheidung' || b.typ === 'oder') && (
            <ul className="gliederung">
              {b.zweige.map((zw) => (
                <li key={zw.id}>
                  Weg „{zw.bezeichnung || 'ohne Namen'}“{'anteil' in zw ? ` (${prozent(zw.anteil)} %)` : ''}
                  {'ende' in zw && zw.ende ? ` → Ende „${zw.ende}“` : ''}
                  {'zurueckZu' in zw && zw.zurueckZu ? ' → zurück' : ''}
                  <Folge folge={zw} prozess={prozess} />
                </li>
              ))}
            </ul>
          )}
          {b.typ === 'parallel' && (
            <ul className="gliederung">
              {b.zweige.map((zw, i) => (
                <li key={zw.id}>
                  Zweig {i + 1}
                  <Folge folge={zw} prozess={prozess} />
                </li>
              ))}
            </ul>
          )}
          {b.typ === 'wiederholung' && <Folge folge={b.koerper} prozess={prozess} />}
        </li>
      ))}
    </ul>
  )
}

function Gliederung({ prozess }: { prozess: PlProzess }) {
  return (
    <>
      <p>
        {prozess.name}: Auslöser „{prozess.ausloeser.text || prozess.ausloeser.art}“, Ergebnis „{prozess.ergebnis || 'Ende'}“.
      </p>
      <Folge folge={prozess.ablauf} prozess={prozess} />
    </>
  )
}
