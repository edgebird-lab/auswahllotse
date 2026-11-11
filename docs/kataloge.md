# Kataloge

Kopie von [`src/lastenheft/katalog.ts`](../src/lastenheft/katalog.ts) mit Quelle und Stand (Spezifikation 6.7). Der Test `katalog.test.ts` prüft, dass beide übereinstimmen.

Die Inhalte sind ein **Startbestand**; Robin gibt sie fachlich frei (offene Frage 4 in [entscheidungen.md](entscheidungen.md)). Rechtliche Anforderungen sind Hinweise mit Quelle und Stand, **keine Rechtsberatung**. Stand der Rechtsquellen: 11.11.2026.

## Wie die Einträge entstehen

- **Bedingungen** werden dreiwertig ausgewertet: Ein „nein“ macht das Ganze „nein“; sonst macht ein „offen“ (weiß nicht) es „offen“; sonst „ja“. „Betrieb ≠ eigener Server“ ist bei Cloud ja, bei eigenem Server nein, bei offen offen; „Kleinstunternehmen ≠ ja“ entsprechend umgekehrt.
- **Katalog (A9):** Bedingung „ja“ → aktive Anforderung; „offen“ → Vorschlag mit dem Hinweis „Rahmenfrage klären“; „nein“ → keine Anforderung. Einträge „nur Vorschlag“ starten immer als Vorschlag.
- **Bausteine (A10):** nur für die gewählte Softwareart, immer als Vorschlag; Bedingung „nein“ → kein Eintrag. Abnahmekriterium aller Bausteine: „Vorführung mit Beispieldaten des Betriebs.“
- **[muss]** steht für das Modalverb der Priorität: muss, sollte, kann (bei „Nicht“ muss). Werte in geschweiften Klammern sind Richtwerte aus dem Rahmen (Schritt 1).

## Nichtfunktionale Anforderungen (21 Einträge)

| ID | Gruppe | Bedingung | Prio | Titel | Text | Abnahme | Quelle |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N-DS-1 | Datenschutz und Sicherheit | personenbezogen; Betrieb ≠ eigener Server | Muss | Auftragsverarbeitung | „Der Anbieter [muss] einen Vertrag zur Auftragsverarbeitung nach Art. 28 Abs. 3 DSGVO abschließen. Er legt seine technischen und organisatorischen Maßnahmen offen.“ | „Unterschriebener Vertrag mit Anlage der Maßnahmen liegt vor Vertragsschluss vor.“ | Art. 28 DSGVO, Stand 11.11.2026 |
| N-DS-2 | Datenschutz und Sicherheit | personenbezogen; Betrieb ≠ eigener Server | Muss | Orte der Verarbeitung und Unterauftragnehmer | „Der Anbieter [muss] alle Orte der Verarbeitung und alle Unterauftragnehmer nennen. Übermittlungen in Drittländer stützt er auf Kapitel V DSGVO.“ | „Liste der Standorte und Unterauftragnehmer liegt schriftlich vor, mit Rechtsgrundlage je Drittland.“ | Art. 28 Abs. 3, Art. 44–46 DSGVO, Stand 11.11.2026 |
| N-DS-3 | Datenschutz und Sicherheit | personenbezogen | Muss | Löschen personenbezogener Daten | „Die Software [muss] personenbezogene Daten gezielt löschen. Daten, die noch aufbewahrt werden müssen, löscht sie erst nach Fristende.“ | „Test: Testperson löschen; Suche und Auswertungen zeigen sie danach nicht mehr.“ | Art. 17 DSGVO; § 147 Abs. 3 AO, Stand 11.11.2026 |
| N-DS-4 | Datenschutz und Sicherheit | personenbezogen | Soll | Datenübertragbarkeit | „Die Software [muss] die Daten einer Person in einem strukturierten, gängigen und maschinenlesbaren Format ausgeben.“ | „Export einer Testperson als CSV, JSON oder XML.“ | Art. 20 DSGVO, Stand 11.11.2026 |
| N-DS-5 | Datenschutz und Sicherheit | personenbezogen | Muss | Rechte nach dem Bedarf der Rolle | „Die Software [muss] Rechte so vergeben, dass jede Rolle nur die Daten sieht, die sie für ihre Aufgaben braucht. Neue Benutzer haben zunächst keine Rechte.“ | „Test mit zwei Rollen: Rolle A sieht die gesperrten Daten von Rolle B nicht.“ | Art. 25 Abs. 2 DSGVO, Stand 11.11.2026 |
| N-DS-6 | Datenschutz und Sicherheit | immer | Muss | Verschlüsselung | „Die Software [muss] Daten verschlüsselt übertragen und verschlüsselt sichern.“ | „Der Anbieter belegt Transportverschlüsselung und verschlüsselte Sicherungen schriftlich.“ | Art. 32 Abs. 1 lit. a DSGVO, Stand 11.11.2026 |
| N-SI-1 | Datenschutz und Sicherheit | immer | Soll | Zweiter Faktor bei der Anmeldung | „Die Software [muss] eine Anmeldung mit zweitem Faktor anbieten.“ | „Test: Anmeldung mit App-Code oder Sicherheitsschlüssel.“ | Art. 32 Abs. 1 DSGVO, Stand 11.11.2026 |
| N-GB-1 | Ordnungsmäßigkeit (AO, GoBD) | steuerrelevant | Muss | Unveränderbarkeit gebuchter Daten | „Die Software [muss] verhindern, dass gebuchte Daten ihren ursprünglichen Inhalt verlieren. Änderungen protokolliert sie mit Person und Zeitpunkt.“ | „Test: abgeschlossene Rechnung ändern; die Software verhindert es oder zeigt alten und neuen Wert.“ | § 146 Abs. 4 AO, Stand 11.11.2026 |
| N-GB-2 | Ordnungsmäßigkeit (AO, GoBD) | steuerrelevant | Muss | Aufbewahrung | „Die Software [muss] Bücher 10 Jahre, Buchungsbelege 8 Jahre und Geschäftsbriefe 6 Jahre lesbar und maschinell auswertbar bereithalten, auch nach Vertragsende.“ | „Der Vertrag regelt Aufbewahrung und Herausgabe; ein Test-Export ist maschinell auswertbar.“ | § 147 Abs. 2 und 3 AO, Stand 11.11.2026 |
| N-GB-3 | Ordnungsmäßigkeit (AO, GoBD) | steuerrelevant | Muss | Datenzugriff der Finanzverwaltung | „Die Software [muss] den Datenzugriff der Finanzverwaltung unterstützen: Einsicht, Auswertung nach Vorgabe und Übergabe in maschinell auswertbarem Format.“ | „Vorführung von Prüferzugang und Datenexport.“ | § 147 Abs. 6 AO, Stand 11.11.2026 |
| N-GB-4 | Ordnungsmäßigkeit (AO, GoBD) | steuerrelevant | Soll | Unterlagen für die Verfahrensdokumentation | „Der Anbieter [muss] Unterlagen für die Verfahrensdokumentation liefern: Systembeschreibung, Einstellungen, Schnittstellen, Datensicherung.“ | „Die Unterlagen liegen vor dem Echtbetrieb vor.“ | § 147 Abs. 1 Nr. 1 AO, Stand 11.11.2026; GoBD ungeprüft |
| N-BT-1 | Betrieb und Support | immer | Muss | Datensicherung und Wiederherstellung | „Die Software [muss] mindestens täglich gesichert werden. Die Wiederherstellung gelingt binnen {wiederherstellungStunden} Stunden und wird jährlich getestet.“ | „Sicherungskonzept und Protokoll eines Wiederherstellungstests liegen vor.“ | Art. 32 Abs. 1 lit. c und d DSGVO, Stand 11.11.2026 |
| N-BT-2 | Betrieb und Support | immer | Muss | Datenherausgabe bei Vertragsende | „Der Anbieter [muss] bei Vertragsende alle Daten und Belege vollständig in offenen, dokumentierten Formaten herausgeben. Frist und Kosten stehen im Vertrag.“ | „Probeexport aller Testdaten; die Vertragsklausel liegt vor.“ | eigene Festlegung; stützt § 147 Abs. 2 AO, Stand 11.11.2026 |
| N-BT-3 | Betrieb und Support | Betrieb ≠ eigener Server | Soll | Verfügbarkeit | „Die Software [muss] zu den Geschäftszeiten zu mindestens {verfuegbarkeitProzent} % je Monat verfügbar sein.“ | „Zusage im Vertrag mit Messung und Gutschrift.“ | eigene Festlegung |
| N-BT-4 | Betrieb und Support | immer | Soll | Support | „Der Anbieter [muss] Support auf Deutsch zu den Geschäftszeiten bieten. Bei Störungen, die die Arbeit verhindern, reagiert er binnen {reaktionStunden} Stunden.“ | „Zusage im Vertrag.“ | eigene Festlegung |
| N-BT-5 | Betrieb und Support | immer | Soll | Sicherheitsupdates und Änderungen | „Der Anbieter [muss] Sicherheitsupdates ohne Aufpreis liefern und größere Änderungen vorher ankündigen.“ | „Zusage im Vertrag; Änderungsprotokoll der letzten 12 Monate liegt vor.“ | eigene Festlegung |
| N-BF-1 | Barrierefreiheit | Softwareart Shop; Verbraucherverkauf; Kleinstunternehmen ≠ ja | Muss | Barrierefreiheit des Shops (BFSG) | „Der Shop [muss] für Verbraucher die Barrierefreiheitsanforderungen des BFSG erfüllen.“ | „Der Anbieter legt einen Nachweis zur Barrierefreiheit vor; eine Stichprobe mit axe zeigt keine schweren Befunde.“ | BFSG § 1 Abs. 3 Nr. 5, § 3; Ausnahme § 3 Abs. 3 mit § 2 Nr. 17; zuletzt geändert 06.05.2024, Stand 11.11.2026 |
| N-BF-2 | Barrierefreiheit | immer; nur Vorschlag | Kann | Bedienung mit Tastatur und Bildschirmleser | „Die Software [muss] für Beschäftigte vollständig mit Tastatur und Bildschirmleser bedienbar sein.“ | „Test eines Arbeitsablaufs nur mit Tastatur.“ | eigene Festlegung; das BFSG zielt auf Leistungen an Verbraucher (§ 1 Abs. 3) |
| N-AN-1 | Anbieter und Einführung | immer | Soll | Referenzbetriebe | „Der Anbieter [muss] mindestens {referenzen} Referenzbetriebe ähnlicher Größe und Branche nennen.“ | „Ein Gespräch mit einem Referenzbetrieb ist geführt.“ | eigene Festlegung |
| N-AN-2 | Anbieter und Einführung | immer | Soll | Vorführung mit eigenen Daten | „Der Anbieter [muss] die Muss-Aufgaben in einer Vorführung mit Beispieldaten des Betriebs zeigen.“ | „Die Vorführung ist erfolgt und protokolliert.“ | eigene Festlegung |
| N-AN-3 | Anbieter und Einführung | immer | Kann | Einführungsdauer | „Der Anbieter [muss] die Einführung bis zum Echtbetrieb in höchstens {einfuehrungWochen} Wochen abschließen.“ | „Projektplan des Anbieters.“ | eigene Festlegung |

## Bausteine je Softwareart (24 Einträge, alle als Vorschlag)

| ID | Softwareart | Gruppe | Bedingung | Prio | Titel | Text | Quelle oder Hinweis |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ERP-1 | ERP | Funktionen | – | Soll | Stammdaten an einer Stelle | „Die Software [muss] Stammdaten für Kunden, Lieferanten und Artikel an einer Stelle führen und in allen Vorgängen verwenden.“ | – |
| ERP-2 | ERP | Funktionen | – | Soll | Bestandsführung je Lagerort | „Die Software [muss] Bestände je Lagerort laufend führen; jede Bestandsänderung hat einen Beleg.“ | – |
| ERP-3 | ERP | Funktionen | – | Soll | Belegkette ohne Neueingabe | „Die Software [muss] aus einem Auftrag Lieferschein und Rechnung ohne erneute Eingabe erzeugen.“ | – |
| ERP-4 | ERP | Funktionen | – | Soll | E-Rechnung | „Die Software [muss] Rechnungen als strukturierte E-Rechnung (XRechnung oder ZUGFeRD) erzeugen und empfangen.“ | Hinweis: Gesetzliche Pflichten und Fristen im Projekt prüfen. |
| ERP-5 | ERP | Schnittstellen und Datenfluss | – | Soll | Übergabe an die Steuerkanzlei | „Die Software [muss] Buchungsdaten an die Steuerkanzlei übergeben, zum Beispiel im DATEV-Format.“ | – |
| ERP-6 | ERP | Funktionen | – | Kann | Auswertungen | „Die Software [muss] Umsatz, Bestand und offene Posten ohne Zusatzprogramm auswerten.“ | – |
| SHOP-1 | Shop | Funktionen | – | Soll | Artikelpflege | „Der Shop [muss] Artikel mit Varianten, Bildern, Preisen und Bestand führen.“ | – |
| SHOP-2 | Shop | Schnittstellen und Datenfluss | – | Soll | Zahlungsarten | „Der Shop [muss] gängige Zahlungsarten anbinden: Karte, Lastschrift, Rechnungskauf und Online-Bezahldienste.“ | – |
| SHOP-3 | Shop | Schnittstellen und Datenfluss | – | Soll | Anbindung der Warenwirtschaft | „Der Shop [muss] Bestellungen automatisch an die Warenwirtschaft übergeben und Bestände von dort übernehmen.“ | – |
| SHOP-4 | Shop | Schnittstellen und Datenfluss | – | Soll | Versand | „Der Shop [muss] Versanddienstleister anbinden und Versandetiketten mit Sendungsnummer erzeugen.“ | – |
| SHOP-5 | Shop | Funktionen | – | Soll | Rechtstexte | „Der Shop [muss] Impressum, AGB, Widerrufsbelehrung und Datenschutzerklärung pflegbar an den passenden Stellen zeigen.“ | – |
| SHOP-6 | Shop | Funktionen | – | Kann | Bedienung auf dem Smartphone | „Der Shop [muss] auf Smartphones vollständig bedienbar sein.“ | – |
| CRM-1 | CRM | Funktionen | – | Soll | Kontakthistorie | „Die Software [muss] Kontakte und Firmen mit dem Verlauf aller Gespräche, E-Mails und Angebote führen.“ | – |
| CRM-2 | CRM | Funktionen | – | Soll | Verkaufschancen | „Die Software [muss] Verkaufschancen mit Phase, Wert und Abschlusswahrscheinlichkeit verfolgen.“ | – |
| CRM-3 | CRM | Funktionen | – | Soll | E-Mails und Termine zuordnen | „Die Software [muss] E-Mails und Termine dem passenden Kontakt zuordnen.“ | – |
| CRM-4 | CRM | Datenschutz und Sicherheit | personenbezogen | Muss | Einwilligungen und Widersprüche | „Die Software [muss] Einwilligungen und Werbewidersprüche mit Datum und Herkunft dokumentieren.“ | Art. 7 Abs. 1 DSGVO, Stand 11.11.2026 |
| CRM-5 | CRM | Funktionen | – | Soll | Aufgaben und Wiedervorlagen | „Die Software [muss] Aufgaben und Wiedervorlagen mit Erinnerung verwalten.“ | – |
| CRM-6 | CRM | Funktionen | – | Kann | Vertriebsauswertung | „Die Software [muss] den Vertriebstrichter auswerten.“ | – |
| DMS-1 | DMS | Funktionen | – | Soll | Dokumente übernehmen | „Die Software [muss] Dokumente per Scan, Upload und E-Mail übernehmen und verschlagworten.“ | – |
| DMS-2 | DMS | Funktionen | – | Soll | Volltextsuche | „Die Software [muss] alle Dokumente im Volltext durchsuchen, auch gescannte (Texterkennung).“ | – |
| DMS-3 | DMS | Ordnungsmäßigkeit (AO, GoBD) | steuerrelevant | Muss | Versionen mit Protokoll | „Die Software [muss] Versionen mit Änderungsprotokoll führen; das Original bleibt unverändert.“ | § 146 Abs. 4 AO, Stand 11.11.2026 |
| DMS-4 | DMS | Ordnungsmäßigkeit (AO, GoBD) | steuerrelevant | Muss | Aufbewahrungsfristen | „Die Software [muss] Aufbewahrungsfristen je Dokumentart verwalten und erst nach Fristende löschen.“ | § 147 Abs. 3 AO; Art. 17 DSGVO, Stand 11.11.2026 |
| DMS-5 | DMS | Funktionen | – | Soll | Freigabeabläufe | „Die Software [muss] Freigabeabläufe, etwa für Eingangsrechnungen, mit Protokoll abbilden.“ | – |
| DMS-6 | DMS | Funktionen | – | Soll | Rechte je Ordner und Dokumentart | „Die Software [muss] Rechte je Ordner und Dokumentart vergeben.“ | – |

## Quellen

Abgerufen am 11.11.2026 (Spezifikation, Abschnitt 3 und 12):

- Verordnung (EU) 2016/679 (DSGVO), ABl. L 119 vom 04.05.2016 – https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32016R0679
- Abgabenordnung § 146 – https://www.gesetze-im-internet.de/ao_1977/__146.html
- Abgabenordnung § 147 – https://www.gesetze-im-internet.de/ao_1977/__147.html
- Barrierefreiheitsstärkungsgesetz (BFSG), zuletzt geändert 06.05.2024, gilt seit 28.06.2025 – https://www.gesetze-im-internet.de/bfsg/BJNR297010021.html

Nicht geprüft: GoBD (BMF-Seite war nicht abrufbar); der Katalog stützt sich deshalb auf §§ 146 und 147 AO. E-Rechnungspflichten (§ 14 UStG nicht geöffnet); Baustein ERP-4 ist deshalb nur Soll mit Prüfhinweis.
