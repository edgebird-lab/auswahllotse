import { describe, expect, it } from 'vitest'
import { aufgabe, entscheidung, oder, oderWeg, prozess, wiederholung, zweig } from '../testhilfen/bausteine'
import { lieferdienstProjekt, onlineProjekt, TEXTE } from '../testhilfen/testdaten'
import { berechneHaeufigkeiten, oderWahrscheinlichkeiten } from './haeufigkeit'
import { leseProzessJson } from './lesen'

function erwarte(h: Map<string, number>, werte: Record<string, number>) {
  for (const [id, wert] of Object.entries(werte)) expect(h.get(id), id).toBeCloseTo(wert, 6)
}

describe('Häufigkeit je Aufgabe (6.2)', () => {
  it('stimmt beim Lieferdienst mit dem Prozesslotsen überein (T-H1)', () => {
    const { haeufigkeit } = berechneHaeufigkeiten(lieferdienstProjekt().ist)
    erwarte(haeufigkeit, {
      auf_annehmen: 1,
      auf_erfassen: 1,
      auf_ersatz: 0.08,
      auf_aendern: 0.056,
      auf_stornieren: 0.024,
      auf_kommissionieren: 1.22,
      auf_kontrollieren: 1.22,
      auf_tour: 0.976,
      auf_verladen: 0.976,
      auf_ausliefern: 0.976,
      auf_quittieren: 0.8784,
      auf_benachrichtigen: 0.0976,
      auf_erneut: 0.0976,
      auf_abgeben: 0.976,
      auf_bestaetigen: 0.976,
      auf_rechnung: 0.976,
      auf_freigeben: 0.976,
      auf_versenden: 0.976,
    })
  })

  it('liefert die Enden des Lieferdienstes (T-H2)', () => {
    const { enden, regulaer } = berechneHaeufigkeiten(lieferdienstProjekt().ist)
    expect([...enden.keys()]).toEqual(['Bestellung storniert'])
    expect(enden.get('Bestellung storniert')).toBeCloseTo(0.024, 9)
    expect(regulaer).toBeCloseTo(0.976, 9)
  })

  it('rechnet Rücksprung und Ereignis-Entscheidung der Onlinebestellung (T-H3)', () => {
    const { haeufigkeit, enden, regulaer } = berechneHaeufigkeiten(onlineProjekt().ist)
    erwarte(haeufigkeit, {
      auf_erfassen: 1 / 0.916,
      auf_nachfragen: 0.12 / 0.916,
      auf_storno: 0.0262009,
      auf_verfall: 0.0131004,
      auf_rechnung: 0.88 / 0.916,
      auf_kommissionieren: 0.9606987,
      auf_verpacken: 0.9606987,
      auf_versenden: 0.9606987,
    })
    expect(haeufigkeit.get('auf_erfassen')).toBeCloseTo(1.0917031, 6)
    expect(enden.get('Bestellung storniert')).toBeCloseTo(0.0262009, 6)
    expect(enden.get('Bestellung verfallen')).toBeCloseTo(0.0131004, 6)
    expect(regulaer).toBeCloseTo(0.9606987, 6)
    expect(regulaer + [...enden.values()].reduce((s, x) => s + x, 0)).toBeCloseTo(1, 9)
  })

  it('rechnet eine Wiederholung mit Anteil (T-H4)', () => {
    const { haeufigkeit, regulaer } = berechneHaeufigkeiten(prozess([wiederholung('w', 0.25, [aufgabe('X')]), aufgabe('Y')]))
    expect(haeufigkeit.get('X')).toBeCloseTo(4 / 3, 6)
    expect(haeufigkeit.get('Y')).toBeCloseTo(1, 9)
    expect(regulaer).toBeCloseTo(1, 9)
  })

  it('rechnet ein Ende innerhalb einer Wiederholung (T-H5)', () => {
    const ende = entscheidung('e', [zweig('ab', 0.2, [], { ende: 'Abbruch' }), zweig('weiter', 0.8, [])])
    const { haeufigkeit, enden, regulaer } = berechneHaeufigkeiten(prozess([wiederholung('w', 0.5, [aufgabe('X'), ende])]))
    expect(haeufigkeit.get('X')).toBeCloseTo(5 / 3, 6)
    expect(enden.get('Abbruch')).toBeCloseTo(1 / 3, 6)
    expect(regulaer).toBeCloseTo(2 / 3, 6)
  })

  it('rechnet weiter, wenn die Anteile nicht 100 % ergeben (T-H6)', () => {
    const d = JSON.parse(TEXTE.lieferdienst)
    d.ist.ablauf.schritte[2].zweige[0].anteil = 0.6
    d.ist.ablauf.schritte[2].zweige[1].anteil = 0.3
    const { projekt, befunde } = leseProzessJson(JSON.stringify(d))
    expect(befunde[0].text).toContain('Anteile ergeben 90 %')
    const { haeufigkeit, regulaer } = berechneHaeufigkeiten(projekt.ist)
    expect(haeufigkeit.get('auf_ersatz')).toBeCloseTo(0.3, 9)
    expect(regulaer).toBeCloseTo(0.6 + 0.3 * 0.7, 9)
  })

  it('lässt den Fluss durch Gleichzeitig mit dem kleinsten Ausgang weiter', () => {
    const par = { typ: 'parallel' as const, id: 'p', zweige: [{ id: 'z1', schritte: [aufgabe('A')] }, { id: 'z2', schritte: [aufgabe('B')] }] }
    const leer = { typ: 'parallel' as const, id: 'p0', zweige: [] }
    const { haeufigkeit, regulaer } = berechneHaeufigkeiten(prozess([par, leer, aufgabe('C')]))
    erwarte(haeufigkeit, { A: 1, B: 1, C: 1 })
    expect(regulaer).toBe(1)
  })

  it('rechnet ODER-Wege mit eigenem Anteil und Standardweg (H8)', () => {
    const b = oder('o', [oderWeg('w1', 0.3, [aufgabe('A')]), oderWeg('w2', 0.6, [aufgabe('B')]), oderWeg('std', 0.99, [aufgabe('S')])], 'std')
    expect(oderWahrscheinlichkeiten(b)).toEqual([0.3, 0.6, expect.closeTo(0.28, 12)])
    const { haeufigkeit, regulaer } = berechneHaeufigkeiten(prozess([b, aufgabe('Z')]))
    erwarte(haeufigkeit, { A: 0.3, B: 0.6, S: 0.28, Z: 1 })
    expect(regulaer).toBeCloseTo(1, 9)
  })

  it('nimmt bei ODER den Anteil eines Wegs mit Ende aus dem weiteren Fluss', () => {
    const ende = entscheidung('e', [zweig('ab', 0.5, [], { ende: 'Abbruch' }), zweig('weiter', 0.5, [])])
    const b = oder('o', [oderWeg('w1', 0.4, [aufgabe('A'), ende]), oderWeg('w2', 1, [aufgabe('B')])])
    const { haeufigkeit, enden, regulaer } = berechneHaeufigkeiten(prozess([b, aufgabe('Z')]))
    // weiter = (1 − 0,4 + 0,2) · (1 − 1 + 1) = 0,8
    expect(regulaer).toBeCloseTo(0.8, 9)
    expect(enden.get('Abbruch')).toBeCloseTo(0.2, 9)
    erwarte(haeufigkeit, { A: 0.4, B: 1, Z: 0.8 })
  })

  it('behandelt einen allgemeinen Schritt als durchlässig', () => {
    const projekt = lieferdienstProjekt()
    projekt.ist.ablauf.schritte.splice(1, 0, { typ: 'allgemein', id: 'tp', originalTyp: 'teilprozess', name: 'Teilprozess' })
    const { haeufigkeit, regulaer } = berechneHaeufigkeiten(projekt.ist)
    expect(haeufigkeit.get('tp')).toBe(1)
    expect(haeufigkeit.get('auf_versenden')).toBeCloseTo(0.976, 9)
    expect(regulaer).toBeCloseTo(0.976, 9)
  })

  it('begrenzt Wiederholungen auf 99,9 %', () => {
    const { haeufigkeit } = berechneHaeufigkeiten(prozess([wiederholung('w', 1.5, [aufgabe('X')])]))
    expect(haeufigkeit.get('X')).toBeCloseTo(1000, 6)
    expect(Number.isFinite(haeufigkeit.get('X'))).toBe(true)
  })

  it('verliert bei einem Rücksprung ins Leere nur den betroffenen Anteil', () => {
    const e = entscheidung('e', [zweig('zurueck', 0.25, [], { zurueckZu: 'gibtsnicht' }), zweig('weiter', 0.75, [])])
    const { regulaer, enden } = berechneHaeufigkeiten(prozess([aufgabe('A'), e]))
    expect(regulaer).toBeCloseTo(0.75, 9)
    expect(enden.size).toBe(0)
  })
})
