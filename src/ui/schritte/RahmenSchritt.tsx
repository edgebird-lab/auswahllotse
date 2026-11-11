import { setzeRahmen, setzeRichtwert } from '../../lastenheft/aenderungen'
import { standardSteuerrelevant } from '../../modell/projekt'
import type { JaNeinOffen, Rahmen, Richtwerte, Softwareart } from '../../modell/typen'
import { Auswahl, Feld, ZahlEingabe, type Option } from '../Eingaben'
import { GeheZu } from '../GeheZu'
import { jetzt, useApp } from '../kontext'
import { Lernhinweis } from '../Lernhinweis'

const SOFTWAREARTEN: Option<Softwareart>[] = [
  { wert: 'erp', text: 'ERP', beschreibung: 'Warenwirtschaft, Aufträge, Rechnungen' },
  { wert: 'shop', text: 'Shop', beschreibung: 'Verkauf im Internet' },
  { wert: 'crm', text: 'CRM', beschreibung: 'Kunden und Vertrieb' },
  { wert: 'dms', text: 'DMS', beschreibung: 'Dokumente und Ablage' },
  { wert: 'andere', text: 'andere', beschreibung: 'ohne Bausteine' },
]

const JNO: Option<JaNeinOffen>[] = [
  { wert: 'ja', text: 'ja' },
  { wert: 'nein', text: 'nein' },
  { wert: 'offen', text: 'weiß nicht' },
]

const RICHTWERTE: { feld: keyof Richtwerte; label: string; suffix: string; nachkomma: number; max?: number }[] = [
  { feld: 'antwortzeitSek', label: 'Antwortzeit bei Spitzenlast', suffix: 'Sekunden', nachkomma: 1 },
  { feld: 'aufbewahrungJahre', label: 'Aufbewahrung', suffix: 'Jahre', nachkomma: 0 },
  { feld: 'wiederherstellungStunden', label: 'Wiederherstellung nach Ausfall', suffix: 'Stunden', nachkomma: 0 },
  { feld: 'verfuegbarkeitProzent', label: 'Verfügbarkeit je Monat', suffix: '%', nachkomma: 2, max: 100 },
  { feld: 'reaktionStunden', label: 'Reaktionszeit des Supports', suffix: 'Stunden', nachkomma: 1 },
  { feld: 'referenzen', label: 'Referenzbetriebe', suffix: 'Betriebe', nachkomma: 0 },
  { feld: 'einfuehrungWochen', label: 'Einführung bis zum Echtbetrieb', suffix: 'Wochen', nachkomma: 0 },
]

export function RahmenSchritt() {
  const { z, aendere } = useApp()
  const r = z.projekt.rahmen
  const setze = (teil: Partial<Rahmen>, feld: string) => aendere((p) => setzeRahmen(p, teil, jetzt()), `rahmen:${feld}`)

  return (
    <div className="schritt schritt-schmal">
      <h1 id="schritt-titel" tabIndex={-1}>
        1 · Rahmen
      </h1>
      <p className="einleitung">Worum geht es, und welche Regeln gelten? Die Antworten bestimmen, welche Anforderungen aus dem Katalog in das Lastenheft kommen.</p>
      <Lernhinweis thema="rahmen" />

      <section className="karte" aria-labelledby="vorhaben-titel">
        <h2 id="vorhaben-titel">Vorhaben</h2>
        <Feld label="Wie heißt das Vorhaben?" hilfe="Titel der Vorlagen, z. B. „Neue Warenwirtschaft“.">
          {(id, hilfe) => <input id={id} type="text" aria-describedby={hilfe} value={r.vorhaben} onChange={(e) => setze({ vorhaben: e.target.value }, 'vorhaben')} />}
        </Feld>
        <div className="feldreihe">
          <Feld label="Für welchen Betrieb?">{(id) => <input id={id} type="text" value={r.betrieb} onChange={(e) => setze({ betrieb: e.target.value }, 'betrieb')} />}</Feld>
          <Feld label="Wer erstellt die Unterlagen?">{(id) => <input id={id} type="text" value={r.ersteller} onChange={(e) => setze({ ersteller: e.target.value }, 'ersteller')} />}</Feld>
        </div>
      </section>

      <section className="karte" aria-labelledby="software-titel">
        <h2 id="software-titel">Software und Regeln</h2>
        <Auswahl label="Welche Art Software wird gesucht?" wert={r.softwareart} optionen={SOFTWAREARTEN} onAendern={(softwareart) => setze({ softwareart }, 'softwareart')} />
        {r.softwareart !== 'erp' && r.softwareart !== 'andere' && (
          <p className="feld-hilfe">Bei Shop, CRM und DMS markieren Sie im Schritt „Prozess“ selbst, welches System abgelöst wird.</p>
        )}
        <Auswahl label="Verarbeitet die Software Daten über Personen (Kunden, Beschäftigte)?" wert={r.personenbezogen} optionen={JNO} spalten={3} onAendern={(personenbezogen) => setze({ personenbezogen }, 'personenbezogen')} vorschlag="ja" />
        <Auswahl
          label="Erzeugt oder speichert sie steuerlich wichtige Unterlagen (Rechnungen, Belege, Buchungen)?"
          wert={r.steuerrelevant}
          optionen={JNO}
          spalten={3}
          onAendern={(steuerrelevant) => setze({ steuerrelevant }, 'steuerrelevant')}
          vorschlag={standardSteuerrelevant(r.softwareart)}
        />
        <Auswahl
          label="Wo soll sie laufen?"
          wert={r.betriebsform}
          spalten={3}
          optionen={[
            { wert: 'cloud', text: 'beim Anbieter (Cloud)' },
            { wert: 'eigener_server', text: 'auf eigenem Server' },
            { wert: 'offen', text: 'offen' },
          ]}
          onAendern={(betriebsform) => setze({ betriebsform }, 'betriebsform')}
          vorschlag="offen"
        />
        {r.softwareart === 'shop' && (
          <Auswahl label="Verkauft der Betrieb darüber an Verbraucher?" wert={r.verbraucherverkauf} optionen={JNO} spalten={3} onAendern={(verbraucherverkauf) => setze({ verbraucherverkauf }, 'verbraucher')} vorschlag="offen" />
        )}
        <Auswahl
          label="Hat der Betrieb weniger als 10 Beschäftigte und höchstens 2 Mio. € Umsatz oder Bilanzsumme?"
          wert={r.kleinstunternehmen}
          optionen={JNO}
          spalten={3}
          onAendern={(kleinstunternehmen) => setze({ kleinstunternehmen }, 'kleinst')}
          vorschlag="offen"
        />
      </section>

      <section className="karte" aria-labelledby="mengen-titel">
        <h2 id="mengen-titel">Betrieb und Richtwerte</h2>
        <div className="feldreihe">
          <Feld label="An wie vielen Tagen im Jahr arbeitet der Betrieb?" hilfe="Für Mengen und Nutzen pro Jahr, Standard 250.">
            {(id, hilfe) => <ZahlEingabe id={id} beschreibung={hilfe} wert={r.betriebstageProJahr} min={1} max={366} nachkomma={0} suffix="Tage" onAendern={(n) => n !== null && setze({ betriebstageProJahr: n }, 'tage')} />}
          </Feld>
          <Feld label="Wievielmal so viele Vorgänge gibt es an starken Tagen?" hilfe="Spitzenlast, Standard 2.">
            {(id, hilfe) => <ZahlEingabe id={id} beschreibung={hilfe} wert={r.spitzenfaktor} min={1} max={100} nachkomma={1} suffix="-fach" onAendern={(n) => n !== null && setze({ spitzenfaktor: n }, 'spitze')} />}
          </Feld>
        </div>
        <details className="aufklappbar">
          <summary>Richtwerte für die Anforderungstexte</summary>
          <p className="feld-hilfe">Diese Zahlen stehen in den Texten des Mengengerüsts und des Katalogs, z. B. „Wiederherstellung binnen 24 Stunden“.</p>
          <div className="feldreihe">
            {RICHTWERTE.map((w) => (
              <Feld key={w.feld} label={w.label}>
                {(id) => (
                  <ZahlEingabe
                    id={id}
                    wert={r.richtwerte[w.feld]}
                    min={0}
                    max={w.max}
                    nachkomma={w.nachkomma}
                    suffix={w.suffix}
                    onAendern={(n) => n !== null && aendere((p) => setzeRichtwert(p, w.feld, n, jetzt()), `richtwert:${w.feld}`)}
                  />
                )}
              </Feld>
            ))}
          </div>
        </details>
      </section>

      <GeheZu schritt="prozess" />
    </div>
  )
}
