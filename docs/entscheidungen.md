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
