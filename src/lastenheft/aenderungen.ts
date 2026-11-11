/**
 * Änderungen an Rahmen und Umfang (Spezifikation 5.2, 5.3). Danach werden
 * die abgeleiteten Anforderungen abgeglichen (6.14 Schritt 6): Katalog und
 * Bausteine folgen dem Rahmen, Funktionen und Schnittstellen dem Umfang.
 * Bearbeitetes bleibt, Entfallenes wird verworfen.
 */
import { neuesProjekt, standardSteuerrelevant, standardVerbraucherverkauf } from '../modell/projekt'
import type { AuswahlProjekt, MediumStatus, Rahmen, Richtwerte, Umfang } from '../modell/typen'
import type { PlId } from '../prozessdatei/format'
import { aufgabenVon, grundlageVon, mediumVon } from '../prozessdatei/struktur'
import { gleicheAb } from './abgleich'
import { alleMedien, standardStatus, statusVon } from './umfang'

/** Felder, die nur in Vorlagen erscheinen und nichts an den Anforderungen ändern. */
const NUR_TEXT: readonly (keyof Rahmen)[] = ['vorhaben', 'betrieb', 'ersteller']

/** Neues Projekt mit dem Katalog zum Standard-Rahmen, damit Schritt 3 nie leer beginnt. */
export function neuesArbeitsprojekt(jetzt: string = new Date().toISOString()): AuswahlProjekt {
  return gleicheAb(neuesProjekt(jetzt), jetzt).projekt
}

/** Umfang nach einem Wechsel der Softwareart: Systeme auf dem alten Standard (U1) bekommen den neuen. */
function umfangFuerSoftwareart(p: AuswahlProjekt, vorher: Rahmen['softwareart'], nachher: Rahmen['softwareart']): Umfang | null {
  if (!p.umfang || !p.prozess) return p.umfang
  const medien = { ...p.umfang.medien }
  for (const m of alleMedien(p.prozess.projekt, p.umfang.grundlage)) {
    if (statusVon(p.umfang, m, vorher) === standardStatus(m.art, vorher)) medien[m.id] = standardStatus(m.art, nachher)
  }
  return { ...p.umfang, medien }
}

/**
 * Rahmen ändern. Beim Wechsel der Softwareart folgen Steuerrelevanz,
 * Verbraucherverkauf und Systemstatus dem neuen Standard, solange sie noch
 * auf dem alten Standard stehen.
 */
export function setzeRahmen(p: AuswahlProjekt, teil: Partial<Rahmen>, jetzt: string): AuswahlProjekt {
  const alt = p.rahmen
  const rahmen: Rahmen = { ...alt, ...teil }
  const geaendert = (Object.keys(teil) as (keyof Rahmen)[]).filter((k) => rahmen[k] !== alt[k])
  if (geaendert.length === 0) return p
  let umfang = p.umfang
  if (rahmen.softwareart !== alt.softwareart) {
    if (teil.steuerrelevant === undefined && alt.steuerrelevant === standardSteuerrelevant(alt.softwareart)) rahmen.steuerrelevant = standardSteuerrelevant(rahmen.softwareart)
    if (teil.verbraucherverkauf === undefined && alt.verbraucherverkauf === standardVerbraucherverkauf(alt.softwareart)) {
      rahmen.verbraucherverkauf = standardVerbraucherverkauf(rahmen.softwareart)
    }
    umfang = umfangFuerSoftwareart(p, alt.softwareart, rahmen.softwareart)
  }
  const neu = { ...p, rahmen, umfang }
  return geaendert.every((k) => NUR_TEXT.includes(k)) ? neu : gleicheAb(neu, jetzt).projekt
}

export function setzeRichtwert(p: AuswahlProjekt, feld: keyof Richtwerte, wert: number, jetzt: string): AuswahlProjekt {
  if (p.rahmen.richtwerte[feld] === wert) return p
  return setzeRahmen(p, { richtwerte: { ...p.rahmen.richtwerte, [feld]: wert } }, jetzt)
}

function mitUmfang(p: AuswahlProjekt, umfang: Umfang, jetzt: string): AuswahlProjekt {
  return gleicheAb({ ...p, umfang }, jetzt).projekt
}

/** Grundlage des Lastenhefts: Soll-Prozess (nur wenn vorhanden) oder Ist-Prozess. */
export function setzeGrundlage(p: AuswahlProjekt, grundlage: Umfang['grundlage'], jetzt: string): AuswahlProjekt {
  if (!p.umfang || !p.prozess || p.umfang.grundlage === grundlage) return p
  if (grundlage === 'soll' && !p.prozess.projekt.soll) return p
  return mitUmfang(p, { ...p.umfang, grundlage }, jetzt)
}

/** Status eines Systems: ablösen, anbinden oder unberührt (U1, U4). */
export function setzeMediumStatus(p: AuswahlProjekt, mediumId: PlId, status: MediumStatus, jetzt: string): AuswahlProjekt {
  if (!p.umfang || p.umfang.medien[mediumId] === status) return p
  return mitUmfang(p, { ...p.umfang, medien: { ...p.umfang.medien, [mediumId]: status } }, jetzt)
}

/**
 * Aufgabe in den Umfang nehmen oder herausnehmen (U2). Ausnahmen werden nur
 * gemerkt, wenn sie vom Standard abweichen: Eine Aufgabe eines abgelösten
 * Systems ist ohnehin im Umfang, alle anderen ohnehin nicht.
 */
export function setzeAufgabeImUmfang(p: AuswahlProjekt, aufgabeId: PlId, imUmfang: boolean, jetzt: string): AuswahlProjekt {
  if (!p.umfang || !p.prozess) return p
  const basis = grundlageVon(p.prozess.projekt, p.umfang.grundlage)
  const aufgabe = aufgabenVon(basis).find((a) => a.id === aufgabeId)
  if (!aufgabe) return p
  const medium = mediumVon(basis, aufgabe.mediumId)
  const standard = medium !== undefined && statusVon(p.umfang, medium, p.rahmen.softwareart) === 'abloesen'
  const aufgabenAus = p.umfang.aufgabenAus.filter((id) => id !== aufgabeId)
  const aufgabenEin = p.umfang.aufgabenEin.filter((id) => id !== aufgabeId)
  if (imUmfang && !standard) aufgabenEin.push(aufgabeId)
  if (!imUmfang && standard) aufgabenAus.push(aufgabeId)
  return mitUmfang(p, { ...p.umfang, aufgabenAus, aufgabenEin }, jetzt)
}
