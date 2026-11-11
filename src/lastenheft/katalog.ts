/**
 * Katalog nichtfunktionaler Anforderungen und Bausteine je Softwareart
 * (Spezifikation 6.7, Regeln A9 und A10). Kopie mit Quellen in
 * docs/kataloge.md. Startbestand; Robin gibt die Inhalte fachlich frei
 * (offene Frage 4). Rechtliche Angaben sind Hinweise, keine Rechtsberatung.
 *
 * Platzhalter in Texten: {verb} = Modalverb nach Priorität (A1); Richtwerte
 * mit Einheit: {wiederherstellung}, {verfuegbarkeit}, {reaktion},
 * {referenzbetriebe}, {einfuehrung}.
 */
import { zahl } from '../modell/zahlformat'
import type { Gruppe, JaNeinOffen, Prioritaet, Rahmen, Softwareart } from '../modell/typen'
import { liste, mitEinheit, modalverb } from './texte'

/** Stand der Rechtsquellen (abgerufen laut Spezifikation 3). */
export const RECHTSSTAND = '11.11.2026'

export type Bedingung = 'personenbezogen' | 'steuerrelevant' | 'nichtEigenerServer' | 'shop' | 'verbraucherverkauf' | 'nichtKleinst'

const BEDINGUNG_TEXT: Record<Bedingung, string> = {
  personenbezogen: 'Daten über Personen',
  steuerrelevant: 'steuerlich wichtige Unterlagen',
  nichtEigenerServer: 'Betrieb beim Anbieter',
  shop: 'Shop',
  verbraucherverkauf: 'Verkauf an Verbraucher',
  nichtKleinst: 'kein Kleinstunternehmen',
}

export interface KatalogEintrag {
  id: string
  gruppe: Gruppe
  titel: string
  /** leer = gilt immer */
  bedingungen: Bedingung[]
  /** startet immer als Vorschlag */
  nurVorschlag: boolean
  prioritaet: Prioritaet
  text: string
  abnahme: string
  quelle: string
}

export interface BausteinEintrag {
  id: string
  softwareart: Softwareart
  gruppe: Gruppe
  titel: string
  bedingungen: Bedingung[]
  prioritaet: Prioritaet
  text: string
  quelle: string | null
  hinweis: string | null
}

/** Abnahmekriterium aller Bausteine. */
export const BAUSTEIN_ABNAHME = 'Vorführung mit Beispieldaten des Betriebs.'

const DS = (art: string) => `${art} DSGVO, Stand ${RECHTSSTAND}`
const AO = (art: string) => `${art} AO, Stand ${RECHTSSTAND}`

export const KATALOG: readonly KatalogEintrag[] = [
  {
    id: 'N-DS-1',
    gruppe: 'datenschutz',
    titel: 'Auftragsverarbeitung',
    bedingungen: ['personenbezogen', 'nichtEigenerServer'],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Der Anbieter {verb} einen Vertrag zur Auftragsverarbeitung nach Art. 28 Abs. 3 DSGVO abschließen. Er legt seine technischen und organisatorischen Maßnahmen offen.',
    abnahme: 'Unterschriebener Vertrag mit Anlage der Maßnahmen liegt vor Vertragsschluss vor.',
    quelle: DS('Art. 28'),
  },
  {
    id: 'N-DS-2',
    gruppe: 'datenschutz',
    titel: 'Orte der Verarbeitung und Unterauftragnehmer',
    bedingungen: ['personenbezogen', 'nichtEigenerServer'],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Der Anbieter {verb} alle Orte der Verarbeitung und alle Unterauftragnehmer nennen. Übermittlungen in Drittländer stützt er auf Kapitel V DSGVO.',
    abnahme: 'Liste der Standorte und Unterauftragnehmer liegt schriftlich vor, mit Rechtsgrundlage je Drittland.',
    quelle: DS('Art. 28 Abs. 3, Art. 44–46'),
  },
  {
    id: 'N-DS-3',
    gruppe: 'datenschutz',
    titel: 'Löschen personenbezogener Daten',
    bedingungen: ['personenbezogen'],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Die Software {verb} personenbezogene Daten gezielt löschen. Daten, die noch aufbewahrt werden müssen, löscht sie erst nach Fristende.',
    abnahme: 'Test: Testperson löschen; Suche und Auswertungen zeigen sie danach nicht mehr.',
    quelle: `Art. 17 DSGVO; § 147 Abs. 3 AO, Stand ${RECHTSSTAND}`,
  },
  {
    id: 'N-DS-4',
    gruppe: 'datenschutz',
    titel: 'Datenübertragbarkeit',
    bedingungen: ['personenbezogen'],
    nurVorschlag: false,
    prioritaet: 'soll',
    text: 'Die Software {verb} die Daten einer Person in einem strukturierten, gängigen und maschinenlesbaren Format ausgeben.',
    abnahme: 'Export einer Testperson als CSV, JSON oder XML.',
    quelle: DS('Art. 20'),
  },
  {
    id: 'N-DS-5',
    gruppe: 'datenschutz',
    titel: 'Rechte nach dem Bedarf der Rolle',
    bedingungen: ['personenbezogen'],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Die Software {verb} Rechte so vergeben, dass jede Rolle nur die Daten sieht, die sie für ihre Aufgaben braucht. Neue Benutzer haben zunächst keine Rechte.',
    abnahme: 'Test mit zwei Rollen: Rolle A sieht die gesperrten Daten von Rolle B nicht.',
    quelle: DS('Art. 25 Abs. 2'),
  },
  {
    id: 'N-DS-6',
    gruppe: 'datenschutz',
    titel: 'Verschlüsselung',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Die Software {verb} Daten verschlüsselt übertragen und verschlüsselt sichern.',
    abnahme: 'Der Anbieter belegt Transportverschlüsselung und verschlüsselte Sicherungen schriftlich.',
    quelle: DS('Art. 32 Abs. 1 lit. a'),
  },
  {
    id: 'N-SI-1',
    gruppe: 'datenschutz',
    titel: 'Zweiter Faktor bei der Anmeldung',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'soll',
    text: 'Die Software {verb} eine Anmeldung mit zweitem Faktor anbieten.',
    abnahme: 'Test: Anmeldung mit App-Code oder Sicherheitsschlüssel.',
    quelle: DS('Art. 32 Abs. 1'),
  },
  {
    id: 'N-GB-1',
    gruppe: 'ordnung',
    titel: 'Unveränderbarkeit gebuchter Daten',
    bedingungen: ['steuerrelevant'],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Die Software {verb} verhindern, dass gebuchte Daten ihren ursprünglichen Inhalt verlieren. Änderungen protokolliert sie mit Person und Zeitpunkt.',
    abnahme: 'Test: abgeschlossene Rechnung ändern; die Software verhindert es oder zeigt alten und neuen Wert.',
    quelle: AO('§ 146 Abs. 4'),
  },
  {
    id: 'N-GB-2',
    gruppe: 'ordnung',
    titel: 'Aufbewahrung',
    bedingungen: ['steuerrelevant'],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Die Software {verb} Bücher 10 Jahre, Buchungsbelege 8 Jahre und Geschäftsbriefe 6 Jahre lesbar und maschinell auswertbar bereithalten, auch nach Vertragsende.',
    abnahme: 'Der Vertrag regelt Aufbewahrung und Herausgabe; ein Test-Export ist maschinell auswertbar.',
    quelle: AO('§ 147 Abs. 2 und 3'),
  },
  {
    id: 'N-GB-3',
    gruppe: 'ordnung',
    titel: 'Datenzugriff der Finanzverwaltung',
    bedingungen: ['steuerrelevant'],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Die Software {verb} den Datenzugriff der Finanzverwaltung unterstützen: Einsicht, Auswertung nach Vorgabe und Übergabe in maschinell auswertbarem Format.',
    abnahme: 'Vorführung von Prüferzugang und Datenexport.',
    quelle: AO('§ 147 Abs. 6'),
  },
  {
    id: 'N-GB-4',
    gruppe: 'ordnung',
    titel: 'Unterlagen für die Verfahrensdokumentation',
    bedingungen: ['steuerrelevant'],
    nurVorschlag: false,
    prioritaet: 'soll',
    text: 'Der Anbieter {verb} Unterlagen für die Verfahrensdokumentation liefern: Systembeschreibung, Einstellungen, Schnittstellen, Datensicherung.',
    abnahme: 'Die Unterlagen liegen vor dem Echtbetrieb vor.',
    quelle: `§ 147 Abs. 1 Nr. 1 AO, Stand ${RECHTSSTAND}; GoBD ungeprüft`,
  },
  {
    id: 'N-BT-1',
    gruppe: 'betrieb',
    titel: 'Datensicherung und Wiederherstellung',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Die Software {verb} mindestens täglich gesichert werden. Die Wiederherstellung gelingt binnen {wiederherstellung} und wird jährlich getestet.',
    abnahme: 'Sicherungskonzept und Protokoll eines Wiederherstellungstests liegen vor.',
    quelle: DS('Art. 32 Abs. 1 lit. c und d'),
  },
  {
    id: 'N-BT-2',
    gruppe: 'betrieb',
    titel: 'Datenherausgabe bei Vertragsende',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Der Anbieter {verb} bei Vertragsende alle Daten und Belege vollständig in offenen, dokumentierten Formaten herausgeben. Frist und Kosten stehen im Vertrag.',
    abnahme: 'Probeexport aller Testdaten; die Vertragsklausel liegt vor.',
    quelle: `eigene Festlegung; stützt § 147 Abs. 2 AO, Stand ${RECHTSSTAND}`,
  },
  {
    id: 'N-BT-3',
    gruppe: 'betrieb',
    titel: 'Verfügbarkeit',
    bedingungen: ['nichtEigenerServer'],
    nurVorschlag: false,
    prioritaet: 'soll',
    text: 'Die Software {verb} zu den Geschäftszeiten zu mindestens {verfuegbarkeit} % je Monat verfügbar sein.',
    abnahme: 'Zusage im Vertrag mit Messung und Gutschrift.',
    quelle: 'eigene Festlegung',
  },
  {
    id: 'N-BT-4',
    gruppe: 'betrieb',
    titel: 'Support',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'soll',
    text: 'Der Anbieter {verb} Support auf Deutsch zu den Geschäftszeiten bieten. Bei Störungen, die die Arbeit verhindern, reagiert er binnen {reaktion}.',
    abnahme: 'Zusage im Vertrag.',
    quelle: 'eigene Festlegung',
  },
  {
    id: 'N-BT-5',
    gruppe: 'betrieb',
    titel: 'Sicherheitsupdates und Änderungen',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'soll',
    text: 'Der Anbieter {verb} Sicherheitsupdates ohne Aufpreis liefern und größere Änderungen vorher ankündigen.',
    abnahme: 'Zusage im Vertrag; Änderungsprotokoll der letzten 12 Monate liegt vor.',
    quelle: 'eigene Festlegung',
  },
  {
    id: 'N-BF-1',
    gruppe: 'barrierefreiheit',
    titel: 'Barrierefreiheit des Shops (BFSG)',
    bedingungen: ['shop', 'verbraucherverkauf', 'nichtKleinst'],
    nurVorschlag: false,
    prioritaet: 'muss',
    text: 'Der Shop {verb} für Verbraucher die Barrierefreiheitsanforderungen des BFSG erfüllen.',
    abnahme: 'Der Anbieter legt einen Nachweis zur Barrierefreiheit vor; eine Stichprobe mit axe zeigt keine schweren Befunde.',
    quelle: `BFSG § 1 Abs. 3 Nr. 5, § 3; Ausnahme § 3 Abs. 3 mit § 2 Nr. 17; zuletzt geändert 06.05.2024, Stand ${RECHTSSTAND}`,
  },
  {
    id: 'N-BF-2',
    gruppe: 'barrierefreiheit',
    titel: 'Bedienung mit Tastatur und Bildschirmleser',
    bedingungen: [],
    nurVorschlag: true,
    prioritaet: 'kann',
    text: 'Die Software {verb} für Beschäftigte vollständig mit Tastatur und Bildschirmleser bedienbar sein.',
    abnahme: 'Test eines Arbeitsablaufs nur mit Tastatur.',
    quelle: 'eigene Festlegung; das BFSG zielt auf Leistungen an Verbraucher (§ 1 Abs. 3)',
  },
  {
    id: 'N-AN-1',
    gruppe: 'anbieter',
    titel: 'Referenzbetriebe',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'soll',
    text: 'Der Anbieter {verb} mindestens {referenzbetriebe} ähnlicher Größe und Branche nennen.',
    abnahme: 'Ein Gespräch mit einem Referenzbetrieb ist geführt.',
    quelle: 'eigene Festlegung',
  },
  {
    id: 'N-AN-2',
    gruppe: 'anbieter',
    titel: 'Vorführung mit eigenen Daten',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'soll',
    text: 'Der Anbieter {verb} die Muss-Aufgaben in einer Vorführung mit Beispieldaten des Betriebs zeigen.',
    abnahme: 'Die Vorführung ist erfolgt und protokolliert.',
    quelle: 'eigene Festlegung',
  },
  {
    id: 'N-AN-3',
    gruppe: 'anbieter',
    titel: 'Einführungsdauer',
    bedingungen: [],
    nurVorschlag: false,
    prioritaet: 'kann',
    text: 'Der Anbieter {verb} die Einführung bis zum Echtbetrieb in höchstens {einfuehrung} abschließen.',
    abnahme: 'Projektplan des Anbieters.',
    quelle: 'eigene Festlegung',
  },
]

function baustein(id: string, softwareart: Softwareart, gruppe: Gruppe, titel: string, prioritaet: Prioritaet, text: string, extra: Partial<BausteinEintrag> = {}): BausteinEintrag {
  return { id, softwareart, gruppe, titel, bedingungen: [], prioritaet, text, quelle: null, hinweis: null, ...extra }
}

export const BAUSTEINE: readonly BausteinEintrag[] = [
  baustein('ERP-1', 'erp', 'funktion', 'Stammdaten an einer Stelle', 'soll', 'Die Software {verb} Stammdaten für Kunden, Lieferanten und Artikel an einer Stelle führen und in allen Vorgängen verwenden.'),
  baustein('ERP-2', 'erp', 'funktion', 'Bestandsführung je Lagerort', 'soll', 'Die Software {verb} Bestände je Lagerort laufend führen; jede Bestandsänderung hat einen Beleg.'),
  baustein('ERP-3', 'erp', 'funktion', 'Belegkette ohne Neueingabe', 'soll', 'Die Software {verb} aus einem Auftrag Lieferschein und Rechnung ohne erneute Eingabe erzeugen.'),
  baustein('ERP-4', 'erp', 'funktion', 'E-Rechnung', 'soll', 'Die Software {verb} Rechnungen als strukturierte E-Rechnung (XRechnung oder ZUGFeRD) erzeugen und empfangen.', {
    hinweis: 'Gesetzliche Pflichten und Fristen im Projekt prüfen.',
  }),
  baustein('ERP-5', 'erp', 'schnittstelle', 'Übergabe an die Steuerkanzlei', 'soll', 'Die Software {verb} Buchungsdaten an die Steuerkanzlei übergeben, zum Beispiel im DATEV-Format.'),
  baustein('ERP-6', 'erp', 'funktion', 'Auswertungen', 'kann', 'Die Software {verb} Umsatz, Bestand und offene Posten ohne Zusatzprogramm auswerten.'),
  baustein('SHOP-1', 'shop', 'funktion', 'Artikelpflege', 'soll', 'Der Shop {verb} Artikel mit Varianten, Bildern, Preisen und Bestand führen.'),
  baustein('SHOP-2', 'shop', 'schnittstelle', 'Zahlungsarten', 'soll', 'Der Shop {verb} gängige Zahlungsarten anbinden: Karte, Lastschrift, Rechnungskauf und Online-Bezahldienste.'),
  baustein('SHOP-3', 'shop', 'schnittstelle', 'Anbindung der Warenwirtschaft', 'soll', 'Der Shop {verb} Bestellungen automatisch an die Warenwirtschaft übergeben und Bestände von dort übernehmen.'),
  baustein('SHOP-4', 'shop', 'schnittstelle', 'Versand', 'soll', 'Der Shop {verb} Versanddienstleister anbinden und Versandetiketten mit Sendungsnummer erzeugen.'),
  baustein('SHOP-5', 'shop', 'funktion', 'Rechtstexte', 'soll', 'Der Shop {verb} Impressum, AGB, Widerrufsbelehrung und Datenschutzerklärung pflegbar an den passenden Stellen zeigen.'),
  baustein('SHOP-6', 'shop', 'funktion', 'Bedienung auf dem Smartphone', 'kann', 'Der Shop {verb} auf Smartphones vollständig bedienbar sein.'),
  baustein('CRM-1', 'crm', 'funktion', 'Kontakthistorie', 'soll', 'Die Software {verb} Kontakte und Firmen mit dem Verlauf aller Gespräche, E-Mails und Angebote führen.'),
  baustein('CRM-2', 'crm', 'funktion', 'Verkaufschancen', 'soll', 'Die Software {verb} Verkaufschancen mit Phase, Wert und Abschlusswahrscheinlichkeit verfolgen.'),
  baustein('CRM-3', 'crm', 'funktion', 'E-Mails und Termine zuordnen', 'soll', 'Die Software {verb} E-Mails und Termine dem passenden Kontakt zuordnen.'),
  baustein('CRM-4', 'crm', 'datenschutz', 'Einwilligungen und Widersprüche', 'muss', 'Die Software {verb} Einwilligungen und Werbewidersprüche mit Datum und Herkunft dokumentieren.', {
    bedingungen: ['personenbezogen'],
    quelle: DS('Art. 7 Abs. 1'),
  }),
  baustein('CRM-5', 'crm', 'funktion', 'Aufgaben und Wiedervorlagen', 'soll', 'Die Software {verb} Aufgaben und Wiedervorlagen mit Erinnerung verwalten.'),
  baustein('CRM-6', 'crm', 'funktion', 'Vertriebsauswertung', 'kann', 'Die Software {verb} den Vertriebstrichter auswerten.'),
  baustein('DMS-1', 'dms', 'funktion', 'Dokumente übernehmen', 'soll', 'Die Software {verb} Dokumente per Scan, Upload und E-Mail übernehmen und verschlagworten.'),
  baustein('DMS-2', 'dms', 'funktion', 'Volltextsuche', 'soll', 'Die Software {verb} alle Dokumente im Volltext durchsuchen, auch gescannte (Texterkennung).'),
  baustein('DMS-3', 'dms', 'ordnung', 'Versionen mit Protokoll', 'muss', 'Die Software {verb} Versionen mit Änderungsprotokoll führen; das Original bleibt unverändert.', {
    bedingungen: ['steuerrelevant'],
    quelle: AO('§ 146 Abs. 4'),
  }),
  baustein('DMS-4', 'dms', 'ordnung', 'Aufbewahrungsfristen', 'muss', 'Die Software {verb} Aufbewahrungsfristen je Dokumentart verwalten und erst nach Fristende löschen.', {
    bedingungen: ['steuerrelevant'],
    quelle: `§ 147 Abs. 3 AO; Art. 17 DSGVO, Stand ${RECHTSSTAND}`,
  }),
  baustein('DMS-5', 'dms', 'funktion', 'Freigabeabläufe', 'soll', 'Die Software {verb} Freigabeabläufe, etwa für Eingangsrechnungen, mit Protokoll abbilden.'),
  baustein('DMS-6', 'dms', 'funktion', 'Rechte je Ordner und Dokumentart', 'soll', 'Die Software {verb} Rechte je Ordner und Dokumentart vergeben.'),
]

/** Wert einer einzelnen Bedingung im Rahmen. */
export function bedingungWert(b: Bedingung, r: Rahmen): JaNeinOffen {
  switch (b) {
    case 'personenbezogen':
      return r.personenbezogen
    case 'steuerrelevant':
      return r.steuerrelevant
    case 'nichtEigenerServer':
      return r.betriebsform === 'cloud' ? 'ja' : r.betriebsform === 'eigener_server' ? 'nein' : 'offen'
    case 'shop':
      return r.softwareart === 'shop' ? 'ja' : 'nein'
    case 'verbraucherverkauf':
      return r.verbraucherverkauf
    case 'nichtKleinst':
      return r.kleinstunternehmen === 'ja' ? 'nein' : r.kleinstunternehmen === 'nein' ? 'ja' : 'offen'
  }
}

/** Dreiwertig: ein „nein“ macht alles „nein“, sonst macht ein „offen“ alles „offen“, sonst „ja“. */
export function werteAus(bedingungen: readonly Bedingung[], r: Rahmen): JaNeinOffen {
  const werte = bedingungen.map((b) => bedingungWert(b, r))
  if (werte.includes('nein')) return 'nein'
  if (werte.includes('offen')) return 'offen'
  return 'ja'
}

/** Setzt Modalverb und Richtwerte mit Einheit ein. */
export function fuelleText(text: string, prioritaet: Prioritaet, r: Rahmen): string {
  const w = r.richtwerte
  return text
    .replace('{verb}', modalverb(prioritaet))
    .replace('{wiederherstellung}', mitEinheit(w.wiederherstellungStunden, zahl(w.wiederherstellungStunden, 1), 'Stunde', 'Stunden'))
    .replace('{verfuegbarkeit}', zahl(w.verfuegbarkeitProzent, 2))
    .replace('{reaktion}', mitEinheit(w.reaktionStunden, zahl(w.reaktionStunden, 1), 'Stunde', 'Stunden'))
    .replace('{referenzbetriebe}', mitEinheit(w.referenzen, zahl(w.referenzen, 0), 'Referenzbetrieb', 'Referenzbetriebe'))
    .replace('{einfuehrung}', mitEinheit(w.einfuehrungWochen, zahl(w.einfuehrungWochen, 1), 'Woche', 'Wochen'))
}

/** Herleitung eines Katalogeintrags in Klartext. */
export function katalogBegruendung(e: KatalogEintrag, wert: JaNeinOffen, r: Rahmen): string {
  if (e.bedingungen.length === 0) {
    return e.nurVorschlag ? `Katalog ${e.id}: Vorschlag für jedes Vorhaben; bitte prüfen.` : `Katalog ${e.id}: gilt für jedes Vorhaben.`
  }
  const satz = `Katalog ${e.id}: gilt bei ${liste(e.bedingungen.map((b) => BEDINGUNG_TEXT[b]))}.`
  if (wert !== 'offen') return satz
  const offen = e.bedingungen.filter((b) => bedingungWert(b, r) === 'offen').map((b) => BEDINGUNG_TEXT[b])
  return `${satz} Rahmenfrage klären: ${liste(offen)}.`
}

const SOFTWAREART_NAMEN: Record<Softwareart, string> = { erp: 'ERP-Systeme', shop: 'Shopsysteme', crm: 'CRM-Systeme', dms: 'Dokumentenmanagement', andere: 'andere Software' }

export function bausteinBegruendung(b: BausteinEintrag): string {
  const satz = `Baustein ${b.id} für ${SOFTWAREART_NAMEN[b.softwareart]}; Startbestand, bitte prüfen.`
  return b.hinweis ? `${satz} Hinweis: ${b.hinweis}` : satz
}
