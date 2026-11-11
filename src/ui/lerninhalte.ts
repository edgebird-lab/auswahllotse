/**
 * Kurze Erklärungen für den Lernmodus (Spezifikation 5.1): je Methode zwei
 * bis drei Sätze, ohne Fachjargon. Quellen der Methoden stehen in
 * docs/spezifikation.md, Abschnitt 3.
 */
export type LernThema =
  | 'rahmen'
  | 'medienbruch'
  | 'umfang'
  | 'moscow'
  | 'abnahme'
  | 'ko'
  | 'paarvergleich'
  | 'nutzwert'
  | 'gesamtkosten'
  | 'barwert'
  | 'sensitivitaet'

export const LERNINHALTE: Record<LernThema, { titel: string; text: string }> = {
  rahmen: {
    titel: 'Rahmen',
    text: 'Die Antworten entscheiden, welche Anforderungen aus dem Katalog gelten: Datenschutz nur bei Daten über Personen, Aufbewahrung nach der Abgabenordnung nur bei steuerlich wichtigen Unterlagen. „Weiß nicht“ macht aus einer Pflicht einen Vorschlag zum Klären.',
  },
  medienbruch: {
    titel: 'Medienbruch',
    text: 'Ein Medienbruch liegt vor, wenn Daten von Hand von einem System ins nächste übertragen werden, etwa vom Bestellzettel in die Warenwirtschaft. Er kostet Zeit und erzeugt Tippfehler. Aus jedem Medienbruch im Umfang wird eine Anforderung an Schnittstellen oder Erfassung.',
  },
  umfang: {
    titel: 'Umfang',
    text: 'Abgelöste Systeme ersetzt die neue Software; ihre Aufgaben sind im Umfang. Angebundene Systeme bleiben und brauchen eine Schnittstelle. Unberührte Systeme spielen keine Rolle, solange keine Daten von ihnen in den Umfang fließen.',
  },
  moscow: {
    titel: 'MoSCoW',
    text: 'Muss heißt: Ohne das ist die Software unbrauchbar. Soll ist wichtig, aber nicht lebensnotwendig; Kann ist erwünscht; Nicht gilt für dieses Vorhaben nicht. Empfohlen sind höchstens etwa 60 % Muss, sonst lässt sich kaum noch zwischen Angeboten unterscheiden.',
  },
  abnahme: {
    titel: 'Abnahmekriterium',
    text: 'Das Abnahmekriterium sagt, woran man sieht, dass die Anforderung erfüllt ist: ein Test mit Beispieldaten, ein Vertragstext oder eine Vorführung. Ohne Kriterium lässt sich ein Angebot nicht fair prüfen.',
  },
  ko: {
    titel: 'K.-o.-Kriterium',
    text: 'Muss-Anforderungen bringen keine Punkte, sie sind Voraussetzung: Erfüllt ein Angebot eine davon nicht, scheidet es aus. Punkte verteilen nur die Soll- und Kann-Anforderungen.',
  },
  paarvergleich: {
    titel: 'Paarvergleich und Konsistenz',
    text: 'Statt Prozente zu schätzen, vergleichen Sie je zwei Kriterien: Was ist wie viel wichtiger? Daraus rechnet das Verfahren nach Saaty (AHP) die Gewichte. Die Konsistenzzahl CR prüft, ob die Urteile zusammenpassen; bis 0,10 gelten sie als stimmig.',
  },
  nutzwert: {
    titel: 'Nutzwert',
    text: 'Jede Soll- und Kann-Anforderung bekommt je Angebot 0 bis 10 Punkte. Innerhalb einer Gruppe zählen die Punkte nach dem Gewicht der Anforderung, dann zählt jede Gruppe nach ihrem Gewicht. So entsteht ein Nutzwert von 0 bis 10.',
  },
  gesamtkosten: {
    titel: 'Gesamtkosten',
    text: 'Die Gesamtkosten (TCO) zählen alles über den Betrachtungszeitraum: einmalige Kosten für Einführung, laufende Kosten wie Abo und Wartung und die Arbeitszeit der eigenen Leute. Ein günstiger Listenpreis kann so teuer werden.',
  },
  barwert: {
    titel: 'Barwert und Kapitalwert',
    text: 'Geld, das erst in einigen Jahren fällig wird, ist heute weniger wert. Der Barwert zinst die laufenden Kosten mit einem Kalkulationszins ab. Der Kapitalwert stellt dem einen Nutzen pro Jahr gegenüber; ist er positiv, lohnt sich die Einführung.',
  },
  sensitivitaet: {
    titel: 'Sensitivität',
    text: 'Gewichte sind Schätzungen. Die Sensitivität zeigt je Kriterium, in welchem Bereich sein Gewicht liegen darf, ohne dass sich die Empfehlung ändert; die übrigen Gewichte passen sich dabei anteilig an. Ein knapper Bereich heißt: genauer hinsehen.',
  },
}
