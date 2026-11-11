/**
 * Standardwerte und Grundbausteine des Projekts (Spezifikation 4.2, 5.2).
 */
import {
  BENUTZER_STANDARD,
  BETRIEBSTAGE_STANDARD,
  JAHRE_STANDARD,
  MINDESTNUTZWERT_STANDARD,
  RICHTWERTE_STANDARD,
  SPITZENFAKTOR_STANDARD,
  STUNDEN_PRO_PERSONENTAG_STANDARD,
  STUNDENSATZ_OHNE_MODELL,
} from '../regeln/schwellen'
import {
  FORMAT_VERSION,
  type Angebot,
  type AngebotsBetriebsform,
  type AuswahlProjekt,
  type Bewertung,
  type Einstellungen,
  type Id,
  type JaNeinOffen,
  type Kosten,
  type Rahmen,
  type Softwareart,
} from './typen'

/** Neue Kennung; braucht einen sicheren Kontext (https, localhost, Tauri). */
export function neueId(): Id {
  return crypto.randomUUID()
}

/** Steuerlich wichtige Unterlagen: bei ERP, Shop und DMS standardmäßig ja, sonst „weiß nicht“. */
export function standardSteuerrelevant(art: Softwareart): JaNeinOffen {
  return art === 'erp' || art === 'shop' || art === 'dms' ? 'ja' : 'offen'
}

/** Verkauf an Verbraucher wird nur beim Shop gefragt; sonst gilt „nein“. */
export function standardVerbraucherverkauf(art: Softwareart): JaNeinOffen {
  return art === 'shop' ? 'offen' : 'nein'
}

export function neuerRahmen(softwareart: Softwareart = 'erp'): Rahmen {
  return {
    vorhaben: '',
    betrieb: '',
    ersteller: '',
    softwareart,
    personenbezogen: 'ja',
    steuerrelevant: standardSteuerrelevant(softwareart),
    betriebsform: 'offen',
    verbraucherverkauf: standardVerbraucherverkauf(softwareart),
    kleinstunternehmen: 'offen',
    betriebstageProJahr: BETRIEBSTAGE_STANDARD,
    spitzenfaktor: SPITZENFAKTOR_STANDARD,
    richtwerte: { ...RICHTWERTE_STANDARD },
  }
}

export function neuesProjekt(jetzt: string = new Date().toISOString()): AuswahlProjekt {
  return {
    app: 'auswahllotse',
    formatVersion: FORMAT_VERSION,
    id: neueId(),
    angelegtAm: jetzt,
    geaendertAm: jetzt,
    rahmen: neuerRahmen(),
    prozess: null,
    umfang: null,
    anforderungen: [],
    naechsteNummer: {},
    gewichtung: { methode: 'direkt', direktProzent: {}, paare: [], festgelegtAm: null, aenderungenNachBewertung: 0 },
    angebote: [],
    bewertungBegonnenAm: null,
    wirtschaftlichkeit: {
      jahre: JAHRE_STANDARD,
      benutzer: BENUTZER_STANDARD,
      internerStundensatzEuro: STUNDENSATZ_OHNE_MODELL,
      stundenProPersonentag: STUNDEN_PRO_PERSONENTAG_STANDARD,
      preissteigerungProzent: 0,
      zinsProzent: null,
      kostenbasis: 'nominal',
      nutzenProJahrEuro: null,
      budgetEuro: null,
      budgetAlsKo: false,
    },
    entscheidung: {
      regel: 'nutzwert',
      mindestNutzwert: MINDESTNUTZWERT_STANDARD,
      gewaehltId: null,
      begruendung: '',
      risiken: [],
      status: 'entwurf',
      datum: null,
    },
  }
}

export function neueKosten(): Kosten {
  return {
    einmalig: [],
    laufendJahr: [],
    preisJeBenutzerMonatEuro: 0,
    internEinfuehrungTage: 0,
    internSchulungStundenJeBenutzer: 0,
    internBetriebStundenMonat: 0,
  }
}

export function neuesAngebot(anbieter = '', produkt = '', betriebsform: AngebotsBetriebsform = 'cloud'): Angebot {
  return { id: neueId(), anbieter, produkt, betriebsform, angebotsdatum: null, notiz: '', bewertungen: {}, kosten: neueKosten() }
}

export function leereBewertung(): Bewertung {
  return { ko: null, punkte: null, fundstelle: '', notiz: '' }
}

export function standardEinstellungen(): Einstellungen {
  return { lernmodus: true, farbschema: 'system' }
}
