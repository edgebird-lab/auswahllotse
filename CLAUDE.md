# Auswahl-Lotse – Hinweise für die Arbeit am Projekt

- Portfolio-Projekt von Robin (Wirtschaftsinformatik, olbricht-digital). Repo `edgebird-lab/auswahllotse` ist **privat**; öffentlich erst nach Robins ausdrücklicher Freigabe. Keine GitHub Pages, keine Releases, nichts bereitstellen.
- Spezifikation: `docs/spezifikation.md` (lang, in Teilen lesen). Fortschritt mit Häkchen: `docs/stand.md`, nach jedem Schritt aktualisieren. Annahmen bis zu Robins Entscheidung: `docs/entscheidungen.md`.
- Sprache: Oberfläche, Bezeichner (deutsch in ASCII: `ae`, `oe`, `ue`, `ss`), Doku und Commit-Nachrichten auf Deutsch. Keine KI-Funktionen, kein Server, Daten bleiben lokal.
- Fachlogik in `src/prozessdatei`, `src/modell`, `src/lastenheft`, `src/bewertung`, `src/kosten`, `src/entscheidung`, `src/export` ohne React und vollständig getestet; Konstanten mit Quelle in `src/regeln/schwellen.ts`; Oberfläche in `src/ui`.
- Prozesslotse-Dateien: Der Vertrag ist das Dateiformat, nicht der Code. Nichts aus dem Prozesslotsen importieren. Gelesen werden die Formate 1 bis 3; unbekannte Bausteine werden als allgemeiner Schritt übernommen und gemeldet. Testdateien liegen in `testdaten/prozesslotse`, ihre Herkunft steht im README dort.
- Vor jedem Commit: `npm run lint`, `npm test`, `npm run build` und `npm run e2e` (lokal mit Edge). Vorschau und Browsertests nutzen fest Port 4183 (der Prozesslotse 4173); ist er belegt, bricht der Lauf ab.
- Die Testwerte der Spezifikation (Abschnitt 9) sind von Hand nachgerechnet. Weicht ein Ergebnis ab, zuerst die Rechnung prüfen, dann den Code.
