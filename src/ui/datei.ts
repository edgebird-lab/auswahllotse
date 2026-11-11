/**
 * Dateibefehle der Oberfläche: Neu, Öffnen, Speichern, Beispiel laden,
 * Prozessmodell einlesen, CSV-Fragebogen, Drucken, Browser-Speicher leeren.
 * Fehlermeldungen kommen als Text an die Oberfläche zurück; nichts davon
 * bringt die App zum Absturz.
 */
import { useMemo, type Dispatch } from 'react'
import { beispielProjekt } from '../beispiel/beispiel'
import { anbieterFragebogen, fragebogenDateiname } from '../export/csv'
import { druckTitel } from '../export/vorlagen'
import { standardsAusModell } from '../kosten/vorschlaege'
import { neuesArbeitsprojekt } from '../lastenheft/aenderungen'
import { liesProzessEin, ohneProzessmodell, vorschauText } from '../lastenheft/abgleich'
import { alsJson, leereBrowserSpeicher, leseProjektText, projektDateiname } from '../modell/speicher'
import type { Befund } from '../modell/ergebnisse'
import type { AuswahlProjekt } from '../modell/typen'
import { leseProzessdatei } from '../prozessdatei/einlesen'
import { plattform, type Datei } from '../plattform'
import { istGeaendert, type Aktion, type Schritt, type Zustand } from '../zustand'
import type { FrageFn } from './frage'
import { jetzt, type Lesebefunde } from './kontext'

export interface Befehle {
  neu(): Promise<void>
  oeffneDatei(d: Datei): Promise<void>
  speichern(): Promise<void>
  ladeBeispiel(): Promise<void>
  leseProzessEin(d: Datei): Promise<void>
  ohneProzessmodell(): Promise<void>
  fragebogen(): Promise<void>
  drucken(was: 'Lastenheft' | 'Entscheidungsvorlage'): Promise<void>
  leereSpeicher(): Promise<void>
}

interface Abhaengigkeiten {
  z: Zustand
  dispatch: Dispatch<Aktion>
  aendere: (f: (p: AuswahlProjekt) => AuswahlProjekt, gruppe?: string) => void
  melde: (text: string) => void
  zeigeFehler: (text: string | null) => void
  frage: FrageFn
  setzeLesebefunde: (l: Lesebefunde | null) => void
  /** Dieses Projekt nicht im Browser sichern (nach „Browser-Speicher leeren“) */
  nichtSichern: (p: AuswahlProjekt) => void
}

/** Erster Schritt nach dem Öffnen: so weit, wie das Projekt gediehen ist. */
export function startSchritt(p: AuswahlProjekt): Schritt {
  if (p.angebote.length > 0) return 'ergebnis'
  if (p.prozess) return 'anforderungen'
  return 'rahmen'
}

export function useDateiBefehle(d: Abhaengigkeiten): Befehle {
  const { z, dispatch, aendere, melde, zeigeFehler, frage, setzeLesebefunde, nichtSichern } = d
  return useMemo<Befehle>(() => {
    const speichern = async () => {
      const name = projektDateiname(z.projekt)
      const ergebnis = await plattform.speichernUnter(name, alsJson(z.projekt), 'projekt')
      if (!ergebnis) return
      dispatch({ typ: 'gespeichert', projekt: z.projekt, pfad: ergebnis.pfad, name: ergebnis.name })
      melde(`Gespeichert als „${ergebnis.name}“.`)
    }

    /** Vor dem Verwerfen ungespeicherter Änderungen nachfragen; true = weitermachen. */
    const darfVerwerfen = async () => {
      if (!istGeaendert(z)) return true
      const antwort = await frage({
        titel: 'Änderungen speichern?',
        text: 'Das aktuelle Projekt hat Änderungen, die noch in keiner Datei stehen. Im Browser bleibt nur das zuletzt geöffnete Projekt erhalten.',
        knoepfe: [
          { wert: 'speichern', text: 'Als Datei speichern', art: 'haupt' },
          { wert: 'verwerfen', text: 'Verwerfen', art: 'gefahr' },
          { wert: 'abbrechen', text: 'Abbrechen' },
        ],
        abbrechen: 'abbrechen',
      })
      if (antwort === 'abbrechen') return false
      if (antwort === 'speichern') await speichern()
      return true
    }

    return {
      speichern,
      async neu() {
        if (!(await darfVerwerfen())) return
        dispatch({ typ: 'laden', projekt: neuesArbeitsprojekt() })
        setzeLesebefunde(null)
        zeigeFehler(null)
        melde('Neues Projekt angelegt.')
      },
      async oeffneDatei(datei) {
        let projekt: AuswahlProjekt
        try {
          projekt = leseProjektText(datei.inhalt)
        } catch (e) {
          zeigeFehler(`„${datei.name}“ lässt sich nicht öffnen: ${e instanceof Error ? e.message : String(e)}`)
          return
        }
        if (!(await darfVerwerfen())) return
        dispatch({ typ: 'laden', projekt, schritt: startSchritt(projekt), dokument: { pfad: datei.pfad, name: datei.name } })
        setzeLesebefunde(null)
        zeigeFehler(null)
        melde(`„${datei.name}“ geöffnet.`)
      },
      async ladeBeispiel() {
        if (!(await darfVerwerfen())) return
        dispatch({ typ: 'laden', projekt: beispielProjekt(), schritt: 'ergebnis' })
        setzeLesebefunde(null)
        zeigeFehler(null)
        melde('Beispiel „Lieferdienst sucht Warenwirtschaft“ geladen.')
      },
      async leseProzessEin(datei) {
        let quelle
        let befunde: Befund[]
        try {
          ;({ quelle, befunde } = await leseProzessdatei(datei.name, datei.inhalt, jetzt()))
        } catch (e) {
          zeigeFehler(`„${datei.name}“ lässt sich nicht einlesen: ${e instanceof Error ? e.message : String(e)}`)
          return
        }
        zeigeFehler(null)
        if (z.projekt.prozess) {
          // Neu einlesen: erst die Vorschau, dann übernehmen (6.14 Schritt 7)
          const vorschau = liesProzessEin(z.projekt, quelle, jetzt()).vorschau
          const antwort = await frage({
            titel: 'Prozessmodell neu einlesen?',
            text: `Änderungen an den Anforderungen: ${vorschauText(vorschau)}. Bearbeitete Texte, Prioritäten und Status bleiben; Entfallenes wird verworfen.`,
            knoepfe: [
              { wert: 'ja', text: 'Übernehmen', art: 'haupt' },
              { wert: 'nein', text: 'Abbrechen' },
            ],
            abbrechen: 'nein',
          })
          if (antwort !== 'ja') return
          aendere((p) => liesProzessEin(p, quelle, jetzt()).projekt)
        } else {
          aendere((p) => standardsAusModell(liesProzessEin(p, quelle, jetzt()).projekt))
        }
        setzeLesebefunde({ sha256: quelle.sha256, befunde })
        melde(`„${datei.name}“ eingelesen.`)
      },
      async ohneProzessmodell() {
        if (z.projekt.prozess) {
          const antwort = await frage({
            titel: 'Ohne Prozessmodell weiter?',
            text: 'Das eingelesene Prozessmodell wird entfernt. Anforderungen aus dem Modell werden verworfen; Katalog, Bausteine und eigene Anforderungen bleiben.',
            knoepfe: [
              { wert: 'ja', text: 'Modell entfernen', art: 'gefahr' },
              { wert: 'nein', text: 'Abbrechen' },
            ],
            abbrechen: 'nein',
          })
          if (antwort !== 'ja') return
          aendere((p) => ohneProzessmodell(p, jetzt()).projekt)
          setzeLesebefunde(null)
        }
        dispatch({ typ: 'schritt', schritt: 'anforderungen' })
      },
      async fragebogen() {
        const name = fragebogenDateiname(z.projekt)
        const ergebnis = await plattform.speichernUnter(name, anbieterFragebogen(z.projekt), 'csv')
        if (ergebnis) melde(`Fragebogen „${ergebnis.name}“ gespeichert.`)
      },
      async drucken(was) {
        await plattform.drucken(druckTitel(z.projekt, was))
      },
      async leereSpeicher() {
        const antwort = await frage({
          titel: 'Browser-Speicher leeren?',
          text: 'Das Projekt und die Einstellungen werden aus diesem Browser gelöscht. Gespeicherte Dateien bleiben. Gedacht für gemeinsam genutzte Rechner.',
          knoepfe: [
            { wert: 'ja', text: 'Leeren', art: 'gefahr' },
            { wert: 'nein', text: 'Abbrechen' },
          ],
          abbrechen: 'nein',
        })
        if (antwort !== 'ja') return
        // Das leere Projekt wird erst gesichert, wenn jemand weiterarbeitet
        const leer = neuesArbeitsprojekt()
        nichtSichern(leer)
        dispatch({ typ: 'laden', projekt: leer })
        setzeLesebefunde(null)
        leereBrowserSpeicher()
        melde('Browser-Speicher geleert.')
      },
    }
  }, [z, dispatch, aendere, melde, zeigeFehler, frage, setzeLesebefunde, nichtSichern])
}

