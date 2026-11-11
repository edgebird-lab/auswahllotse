/**
 * Auswahl-Lotse-Projekte für Tests: Rahmen L der Spezifikation (ERP,
 * personenbezogen ja, steuerrelevant ja, Cloud) mit eingelesenem Modell.
 */
import { liesProzessEin } from '../lastenheft/abgleich'
import { neuesProjekt } from '../modell/projekt'
import type { AuswahlProjekt, ProzessQuelle } from '../modell/typen'
import type { PlProjekt } from '../prozessdatei/format'
import { lieferdienstProjekt, onlineProjekt } from './testdaten'

export const JETZT = '2026-11-11T10:00:00.000Z'

export function quelleAus(projekt: PlProjekt, dateiname = 'test.prozesslotse'): ProzessQuelle {
  return { dateiname, dateiart: 'json', formatVersionGelesen: 3, exporterVersion: null, sha256: '0'.repeat(64), eingelesenAm: JETZT, projekt }
}

/** Leeres Projekt mit Rahmen L. */
export function rahmenLProjekt(): AuswahlProjekt {
  const p = neuesProjekt(JETZT)
  p.rahmen.vorhaben = 'Neue Warenwirtschaft'
  p.rahmen.betrieb = 'Lieferdienst Nord'
  p.rahmen.betriebsform = 'cloud'
  return p
}

/** Lieferdienst mit Rahmen L und Standard-Umfang, Anforderungen abgeleitet. */
export function lieferdienstAuswahl(): AuswahlProjekt {
  return liesProzessEin(rahmenLProjekt(), quelleAus(lieferdienstProjekt(), 'lieferdienst.prozesslotse'), JETZT).projekt
}

export function onlineAuswahl(): AuswahlProjekt {
  return liesProzessEin(rahmenLProjekt(), quelleAus(onlineProjekt(), 'onlinebestellung.prozesslotse'), JETZT).projekt
}

export const nachId = (p: AuswahlProjekt, id: string) => {
  const a = p.anforderungen.find((x) => x.id === id)
  if (!a) throw new Error(`Anforderung ${id} fehlt`)
  return a
}

export const nachNummer = (p: AuswahlProjekt, nummer: string) => {
  const a = p.anforderungen.find((x) => x.nummer === nummer)
  if (!a) throw new Error(`Anforderung ${nummer} fehlt`)
  return a
}
