# Entscheidungen und Annahmen

Robin hat die offenen Fragen der Spezifikation (Abschnitt 10.1) noch nicht beantwortet. Bis dahin gilt jeweils der Vorschlag der Spezifikation oder die naheliegendste Empfehlung. Jeder Eintrag ist eine **Annahme, bis Robin entscheidet**. Ändert Robin etwas, hier vermerken und den Code anpassen.

## Offene Fragen aus Abschnitt 10.1

| Nr. | Frage | Annahme, bis Robin entscheidet |
| --- | --- | --- |
| 1 | Einbettung im BPMN | Der Prozesslotse bettet das Projekt inzwischen selbst ein (`src/bpmn/einbettung.ts`, Commit `0139e53`): Element `projekt` im Namensraum `https://olbricht-digital.de/prozesslotse/projekt`, im Element `bpmn:process` statt in der Kollaboration, mit den Attributen `formatVersion` und `ansicht`. Der Auswahl-Lotse sucht das Element im ganzen Dokument (E11) und liest damit beide Varianten. Das Attribut `ansicht` wird nicht ausgewertet. |
| 2 | Dateiendung und App-ID | `.auswahllotse` und `de.olbricht-digital.auswahllotse` wie vorgeschlagen. |
| 3 | Word-Datei | DOCX erst in 0.2; in 0.1 Druck als PDF über den Browser. |
| 4 | Kataloge | Die 21 Anforderungen und 24 Bausteine gelten als Startbestand wie in 6.7. Keine eigene Regel zu E-Rechnungspflichten; ERP-4 bleibt Soll mit Prüfhinweis. |
| 5 | Festlegungen | Normalfall ab 50 %, Medienbruch Muss ab 60 und Soll ab 10 Minuten pro Tag, „knapp“ unter 5 Prozentpunkten, Mindestnutzwert 5, 250 Betriebstage, Spitzenfaktor 2, Stundensatz ohne Modell 45 € – alle wie vorgeschlagen, in `src/regeln/schwellen.ts`. |
| 6 | Mehrere Prozessmodelle je Vorhaben | erst in 0.2. |
| 7 | Dritte Entscheidungsregel (Kosten als Kriterium) | nicht in 0.1; frühestens 0.2. |
| 8 | Repo | eigenes privates Repo `edgebird-lab/auswahllotse`. |
| 9 | Lizenz | noch keine Lizenzdatei (wie beim Prozesslotsen); das Repo bleibt privat. |
| 10 | Lokale KI | nicht in 0.1; frühestens 0.3, nur lokal und nur als Vorschlag. |

## Abweichungen und Festlegungen während der Umsetzung

| Nr. | Thema | Annahme, bis Robin entscheidet | Grund |
| --- | --- | --- | --- |
| U1 | CI-Umfang | Der Workflow „Prüfung“ führt nur `lint`, `test` und `build` aus. Browsertests und `npm audit` laufen lokal vor jedem Commit. Die Spezifikation (7.6, 8.1) sah Playwright und `npm audit` auch in der CI vor. | Vorgabe des Arbeitsauftrags; spart Minuten im privaten Repo. |
| U2 | E2E-Port | Fest 4183 mit `strictPort`, `reuseExistingServer: false`. Ist der Port belegt, bricht der Lauf ab. | Mehrere Apps laufen parallel auf Robins Rechner; so prüft der Test nie einen fremden oder veralteten Server. |
| U3 | Version | `0.0.0` bis zum Tag `v0.1.0` in Phase 8. | – |
| U4 | Prozesslotse-Format | Gelesen werden Format 1 bis 3 (die Spezifikation nannte 1 und 2). Die `Pl`-Typen bilden Format 3 ab: `teilnehmer`, Nachrichtenverweise (`nachrichtAn`, `nachrichtVon`, `von`) und der Baustein `oder`. Format 1 und 2 werden auf diese Form umgestellt (fehlende Teilnehmer → leer, Verweise → null). | Der Prozesslotse schreibt seit Commit `4f8ee69` Format 3. |
| U5 | Unbekannte Bausteine | Ein Baustein mit unbekanntem `typ` ist kein Formatfehler mehr (Spezifikation E5 und T-E6), sondern wird als allgemeiner Schritt (`typ: 'allgemein'` mit `originalTyp` und `name`) übernommen und als Warnung gemeldet. Der Fluss läuft unverändert hindurch; Aufgaben darin fehlen im Lastenheft. | Vorgabe des Arbeitsauftrags: kein Absturz bei Format 4 mit neuen Bausteinen. |
| U6 | Neuere Formate | Dateien mit `formatVersion` über 3 (ganze Zahl) werden mit Warnung E4 gelesen statt abgelehnt; neue Felder fallen weg, neue Bausteine werden allgemeine Schritte. Ungültige Angaben (0, negativ, keine ganze Zahl) werden weiter abgelehnt. | Format 4 kommt bald und ist nach `modellierung-v3.md` des Prozesslotsen additiv; so bleibt die Datei nutzbar, der Benutzer wird gewarnt. |
| U7 | Häufigkeit bei ODER | Neue Regel H8 nach dem Prozesslotsen (`oderWahrscheinlichkeiten`): Weg i läuft mit seinem Anteil, der Standardweg mit Π(1 − pⱼ); weiter geht es mit f · Π(1 − pᵢ + ausᵢ / f). | Format 3; gleiche Zahlen wie im Prozesslotsen. |
| U8 | Fehlender `zweck` | Ersatzwert „nacharbeit“ ohne Hinweis (die Spezifikation sah in E7 einen Hinweis vor). | Das Feld ist im Format optional mit genau diesem Standard; ein Hinweis bei fast jeder Datei wäre Rauschen. |
| U9 | BPMN-Einbettung | Fehlt das Attribut `formatVersion` am Element `projekt`, wird nur der JSON-Inhalt geprüft. Ungültiges JSON in der Einbettung meldet „Das eingebettete Projekt ist beschädigt.“ statt „kein gültiges JSON“. | Der Prozesslotse liest Einbettungen ohne das Attribut selbst auch; die Meldung ist genauer. |
| U10 | Testdateien | Erzeugt durch ein einmaliges Skript, das `beispiel.ts` und `bpmnFuerExport` des Prozesslotsen nur liest (statt „Beispiel laden“ und „Speichern“ in der Oberfläche). Format-1- und Format-2-Dateien per Skript daraus abgeleitet. Herkunft in `testdaten/prozesslotse/README.md`. | Im Prozesslotsen sollte nichts verändert werden; das Ergebnis ist dasselbe JSON. |
| U11 | Befunde des Lesers | Ersatzwerte (E7) werden beim Einlesen gemeldet, aber nicht gespeichert. Nach dem Öffnen eines Projekts meldet `befundeDerQuelle` nur noch Modellfehler, allgemeine Schritte und ein neueres Format. | Die Spezifikation speichert keine berechneten Werte; die Ersatzwerte stehen dann schon im Modell. |
| U12 | Doppelte Kennungen | Kommt eine Kennung von Bausteinen oder Ausgängen mehrfach vor, gibt es eine Warnung (keine Ablehnung). | Häufigkeiten wären sonst unbemerkt falsch. |
| U13 | Toleranz bei Nebensachen | Fehlt `soll`, gilt null. Ungültige Einträge in `massnahmen` und `verworfen` werden übergangen (der Auswahl-Lotse nutzt sie nicht); die Listen selbst bleiben Pflicht wie im Prozesslotsen. | Robuster Leser ohne Risiko für die Ergebnisse. |
| U14 | Übertragung ohne Zielsystem | Hat eine Aufgabe mit Medienbruch kein System, wird der Medienbruch nicht ausgewertet; Hinweis U4. | Ohne Zielsystem gibt es kein Paar nach U4. |
| U15 | Systeme bei Ist und Soll | Der Umfang enthält den Status aller Systeme aus Ist und Soll (Grundlage zuerst), damit Medienbrüche nach U5 auch für Systeme bewertet werden, die nur im Ist vorkommen. | U5 zählt Übertragungen aus beiden Prozessen. |
