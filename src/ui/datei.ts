/**
 * Dateibefehle der Oberfläche: Neu, Öffnen, Speichern, Speichern unter,
 * Beispiel laden, Prozessmodell einlesen, CSV-Fragebogen, Drucken, PDF,
 * Browser-Speicher leeren, Rückfrage beim Schließen des Programms.
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
import { alsJson, istProjektdatei, leereBrowserSpeicher, leseProjektText, projektDateiname, vergissProjektImBrowser } from '../modell/speicher'
import type { Befund } from '../modell/ergebnisse'
import type { AuswahlProjekt } from '../modell/typen'
import { leseProzessdatei } from '../prozessdatei/einlesen'
import { plattform, type Datei } from '../plattform'
import { istGeaendert, type Aktion, type Schritt, type Zustand } from '../zustand'
import type { FrageFn } from './frage'
import { jetzt, type Lesebefunde } from './kontext'

export type Vorlage = 'Lastenheft' | 'Entscheidungsvorlage'

export interface Befehle {
  neu(): Promise<void>
  /** Öffnen-Dialog des Programms (im Browser öffnet die Oberfläche ein Dateifeld) */
  oeffnen(): Promise<void>
  oeffneDatei(d: Datei): Promise<void>
  /** Datei aus dem Explorer oder ins Fenster gezogen: Projekt öffnen oder Prozessmodell einlesen */
  oeffneOderLiesEin(d: Datei): Promise<void>
  /** Im Programm an den bekannten Pfad, sonst wie „Speichern unter“; true, wenn gespeichert */
  speichern(): Promise<boolean>
  speichernUnter(): Promise<boolean>
  ladeBeispiel(): Promise<void>
  /** Einlese-Dialog des Programms für Prozesslotse-Dateien */
  importiere(): Promise<void>
  /** true, wenn das Modell übernommen wurde */
  leseProzessEin(d: Datei): Promise<boolean>
  ohneProzessmodell(): Promise<void>
  fragebogen(): Promise<void>
  drucken(was: Vorlage): Promise<void>
  /** Angezeigte Vorlage als PDF ohne Druckdialog (nur im Programm) */
  alsPdf(was: Vorlage): Promise<void>
  leereSpeicher(): Promise<void>
  /** Programm: vor dem Schließen nach ungespeicherten Änderungen fragen */
  darfSchliessen(): Promise<boolean>
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

function fehlertext(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
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
    const speichernUnter = async (): Promise<boolean> => {
      // Im Programm bleibt der Name der geöffneten Datei der Vorschlag
      const name = plattform.desktop && z.dokument.name ? z.dokument.name : projektDateiname(z.projekt)
      try {
        const ergebnis = await plattform.speichernUnter(name, alsJson(z.projekt), 'projekt')
        if (!ergebnis) return false
        dispatch({ typ: 'gespeichert', projekt: z.projekt, pfad: ergebnis.pfad, name: ergebnis.name })
        melde(`Gespeichert als „${ergebnis.name}“.`)
        return true
      } catch (e) {
        zeigeFehler(`Nicht gespeichert: ${fehlertext(e)}`)
        return false
      }
    }

    const speichern = async (): Promise<boolean> => {
      const { pfad, name } = z.dokument
      if (!plattform.desktop || !pfad || !name) return speichernUnter()
      try {
        await plattform.speichern(pfad, alsJson(z.projekt))
        dispatch({ typ: 'gespeichert', projekt: z.projekt, pfad, name })
        melde(`„${name}“ gespeichert.`)
        return true
      } catch (e) {
        zeigeFehler(`„${name}“ nicht gespeichert: ${fehlertext(e)}`)
        return false
      }
    }

    /** Ungespeicherte Änderungen: „weiter“ (nichts zu verlieren oder gespeichert), „verworfen“ oder „abbrechen“. */
    const entscheide = async (): Promise<'weiter' | 'verworfen' | 'abbrechen'> => {
      if (!istGeaendert(z)) return 'weiter'
      const name = z.dokument.name ?? (z.projekt.rahmen.vorhaben || 'Neues Vorhaben')
      const antwort = await frage(
        plattform.desktop
          ? {
              titel: 'Änderungen speichern?',
              text: `Die Änderungen an „${name}“ sind noch nicht gespeichert.`,
              knoepfe: [
                { wert: 'speichern', text: 'Speichern', art: 'haupt' },
                { wert: 'verwerfen', text: 'Nicht speichern', art: 'gefahr' },
                { wert: 'abbrechen', text: 'Abbrechen' },
              ],
              abbrechen: 'abbrechen',
            }
          : {
              titel: 'Änderungen speichern?',
              text: 'Das aktuelle Projekt hat Änderungen, die noch in keiner Datei stehen. Im Browser bleibt nur das zuletzt geöffnete Projekt erhalten.',
              knoepfe: [
                { wert: 'speichern', text: 'Als Datei speichern', art: 'haupt' },
                { wert: 'verwerfen', text: 'Verwerfen', art: 'gefahr' },
                { wert: 'abbrechen', text: 'Abbrechen' },
              ],
              abbrechen: 'abbrechen',
            },
      )
      if (antwort === 'abbrechen') return 'abbrechen'
      if (antwort === 'speichern') return (await speichern()) ? 'weiter' : 'abbrechen'
      return 'verworfen'
    }

    /** Vor dem Verwerfen ungespeicherter Änderungen nachfragen; true = weitermachen. */
    const darfVerwerfen = async () => (await entscheide()) !== 'abbrechen'

    const oeffneDatei = async (datei: Datei) => {
      let projekt: AuswahlProjekt
      try {
        projekt = leseProjektText(datei.inhalt)
      } catch (e) {
        zeigeFehler(`„${datei.name}“ lässt sich nicht öffnen: ${fehlertext(e)}`)
        return
      }
      if (!(await darfVerwerfen())) return
      dispatch({ typ: 'laden', projekt, schritt: startSchritt(projekt), dokument: { pfad: datei.pfad, name: datei.name } })
      setzeLesebefunde(null)
      zeigeFehler(null)
      melde(`„${datei.name}“ geöffnet.`)
    }

    const leseProzessEin = async (datei: Datei): Promise<boolean> => {
      let quelle
      let befunde: Befund[]
      try {
        ;({ quelle, befunde } = await leseProzessdatei(datei.name, datei.inhalt, jetzt()))
      } catch (e) {
        zeigeFehler(`„${datei.name}“ lässt sich nicht einlesen: ${fehlertext(e)}`)
        return false
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
        if (antwort !== 'ja') return false
        aendere((p) => liesProzessEin(p, quelle, jetzt()).projekt)
      } else {
        aendere((p) => standardsAusModell(liesProzessEin(p, quelle, jetzt()).projekt))
      }
      setzeLesebefunde({ sha256: quelle.sha256, befunde })
      melde(`„${datei.name}“ eingelesen.`)
      return true
    }

    /** Eingelesen außerhalb des Schritts „Prozess“ (Menü, Explorer): danach dorthin, damit man das Ergebnis sieht. */
    const leseEinUndZeige = async (datei: Datei) => {
      if (await leseProzessEin(datei)) dispatch({ typ: 'schritt', schritt: 'prozess' })
    }

    return {
      speichern,
      speichernUnter,
      oeffneDatei,
      leseProzessEin,
      async neu() {
        if (!(await darfVerwerfen())) return
        dispatch({ typ: 'laden', projekt: neuesArbeitsprojekt() })
        setzeLesebefunde(null)
        zeigeFehler(null)
        melde('Neues Projekt angelegt.')
      },
      async oeffnen() {
        try {
          const datei = await plattform.oeffnen()
          if (datei) await oeffneDatei(datei)
        } catch (e) {
          zeigeFehler(`Datei nicht geöffnet: ${fehlertext(e)}`)
        }
      },
      async oeffneOderLiesEin(datei) {
        if (istProjektdatei(datei.name, datei.inhalt)) await oeffneDatei(datei)
        else await leseEinUndZeige(datei)
      },
      async importiere() {
        try {
          const datei = await plattform.importieren()
          if (datei) await leseEinUndZeige(datei)
        } catch (e) {
          zeigeFehler(`Datei nicht eingelesen: ${fehlertext(e)}`)
        }
      },
      async ladeBeispiel() {
        if (!(await darfVerwerfen())) return
        dispatch({ typ: 'laden', projekt: beispielProjekt(), schritt: 'ergebnis' })
        setzeLesebefunde(null)
        zeigeFehler(null)
        melde('Beispiel „Lieferdienst sucht Warenwirtschaft“ geladen.')
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
        try {
          const ergebnis = await plattform.speichernUnter(name, anbieterFragebogen(z.projekt), 'csv')
          if (ergebnis) melde(`Fragebogen „${ergebnis.name}“ gespeichert.`)
        } catch (e) {
          zeigeFehler(`Fragebogen nicht gespeichert: ${fehlertext(e)}`)
        }
      },
      async drucken(was) {
        await plattform.drucken(druckTitel(z.projekt, was))
      },
      async alsPdf(was) {
        const titel = druckTitel(z.projekt, was)
        try {
          const pfad = await plattform.alsPdf(`${titel}.pdf`, titel)
          if (pfad) melde(`PDF „${pfad.split(/[\\/]/).pop()}“ gespeichert.`)
        } catch (e) {
          zeigeFehler(`PDF nicht gespeichert: ${fehlertext(e)}`)
        }
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
      async darfSchliessen() {
        const e = await entscheide()
        // „Nicht speichern“: verworfene Änderungen beim nächsten Start nicht wiederherstellen
        if (e === 'verworfen') vergissProjektImBrowser()
        return e !== 'abbrechen'
      },
    }
  }, [z, dispatch, aendere, melde, zeigeFehler, frage, setzeLesebefunde, nichtSichern])
}

