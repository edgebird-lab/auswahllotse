//! Windows-Programm des Auswahl-Lotsen.
//!
//! Die Oberfläche bekommt keine allgemeinen Dateirechte. Sie ruft nur diese
//! Befehle auf, und geschrieben wird nur auf Pfade, die der Benutzer selbst
//! gewählt hat: im Dialog „Speichern unter“ oder als geöffnete Projektdatei
//! (Dialog, Doppelklick, „Öffnen mit“, ins Fenster gezogen). Eingelesene
//! Prozesslotse-Dateien werden nur gelesen und nie freigegeben.

use std::{
    collections::HashSet,
    ffi::OsStr,
    path::{Path, PathBuf},
    sync::Mutex,
};

use serde::Serialize;
use tauri::{
    menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    AppHandle, DragDropEvent, Emitter, Manager, State, WindowEvent, Wry,
};
use tauri_plugin_dialog::DialogExt;

/// Größte Datei, die gelesen wird (Projekte und Prozessmodelle haben wenige Kilobyte).
const MAX_GROESSE: u64 = 20 * 1024 * 1024;

/// Pfade von Projektdateien, die der Benutzer in dieser Sitzung gewählt hat.
#[derive(Default)]
struct Freigaben(Mutex<HashSet<PathBuf>>);

/// Eine gelesene Datei. `pfad` gibt es nur für Projekte des Auswahl-Lotsen,
/// denn nur sie dürfen später ohne Dialog überschrieben werden.
#[derive(Serialize, Clone, Debug)]
struct Datei {
    pfad: Option<String>,
    name: String,
    inhalt: String,
}

#[derive(Serialize)]
struct Gespeichert {
    pfad: String,
    name: String,
}

fn dateiname(p: &Path) -> String {
    p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default()
}

fn lies_text(pfad: &Path) -> Result<String, String> {
    let groesse = std::fs::metadata(pfad).map_err(|e| format!("Datei nicht lesbar: {e}"))?.len();
    if groesse > MAX_GROESSE {
        return Err("Die Datei ist zu groß (mehr als 20 MB).".into());
    }
    let bytes = std::fs::read(pfad).map_err(|e| format!("Datei nicht lesbar: {e}"))?;
    String::from_utf8(bytes).map_err(|_| "Die Datei ist keine Textdatei (UTF-8).".to_string())
}

/// Ist der Text ein Projekt des Auswahl-Lotsen? Erkennungsmerkmal ist `"app": "auswahllotse"`.
fn ist_projekt(inhalt: &str) -> bool {
    serde_json::from_str::<serde_json::Value>(inhalt.trim_start_matches('\u{feff}'))
        .ok()
        .and_then(|v| v.get("app").and_then(|a| a.as_str()).map(|a| a == "auswahllotse"))
        .unwrap_or(false)
}

/// Speichert über eine Hilfsdatei und Umbenennen, damit ein Absturz keine halbe Datei hinterlässt.
fn schreibe(p: &Path, inhalt: &str) -> Result<(), String> {
    let mut tmp = p.as_os_str().to_owned();
    tmp.push(".speichern.tmp");
    let tmp = PathBuf::from(tmp);
    std::fs::write(&tmp, inhalt).map_err(|e| format!("Speichern fehlgeschlagen: {e}"))?;
    std::fs::rename(&tmp, p).map_err(|e| {
        let _ = std::fs::remove_file(&tmp);
        format!("Speichern fehlgeschlagen: {e}")
    })
}

/// Hängt die Endung an, wenn der gewählte Name keine der erlaubten hat. Angehängt, nicht
/// ersetzt: „Version 2.0“ wird zu „Version 2.0.auswahllotse“, und eine Datei mit fremder
/// Endung (etwa ein Prozesslotse-Projekt) wird so nie überschrieben.
fn mit_endung(p: PathBuf, erlaubt: &[&str], standard: &str) -> PathBuf {
    let passt = p.extension().and_then(OsStr::to_str).is_some_and(|e| erlaubt.iter().any(|x| x.eq_ignore_ascii_case(e)));
    if passt {
        return p;
    }
    let mut s = p.into_os_string();
    s.push(".");
    s.push(standard);
    PathBuf::from(s)
}

fn freigeben(app: &AppHandle, p: &Path) {
    app.state::<Freigaben>().0.lock().unwrap().insert(p.to_path_buf());
}

/// Liest eine vom Benutzer gewählte Datei. Projekte werden zum Speichern freigegeben;
/// alles andere (Prozesslotse-Dateien, BPMN) kommt ohne Pfad zurück und bleibt unberührt.
fn oeffne_gewaehlt(app: &AppHandle, p: &Path) -> Result<Datei, String> {
    let inhalt = lies_text(p)?;
    let projekt = ist_projekt(&inhalt);
    if projekt {
        freigeben(app, p);
    }
    Ok(Datei { pfad: projekt.then(|| p.to_string_lossy().into_owned()), name: dateiname(p), inhalt })
}

/// Nur im Debug-Build: beantwortet Dateidialoge aus Umgebungsvariablen, damit automatische
/// Tests die echten Abläufe ohne Klicks prüfen können. Im Release fehlt das.
#[cfg(debug_assertions)]
fn testantwort(variable: &str) -> Option<Option<PathBuf>> {
    std::env::var_os(variable).map(|v| if v.is_empty() { None } else { Some(PathBuf::from(v)) })
}
#[cfg(not(debug_assertions))]
fn testantwort(_variable: &str) -> Option<Option<PathBuf>> {
    None
}

/// Speicherdialoge im Test: Die Datei landet unter dem vorgeschlagenen Namen im Testordner.
fn test_speicherort(vorschlag: &str) -> Option<Option<PathBuf>> {
    testantwort("AUSWAHLLOTSE_TEST_ORDNER").map(|o| o.map(|o| o.join(vorschlag)))
}

/// Erste Datei aus der Befehlszeile (Doppelklick im Explorer, „Öffnen mit“).
fn datei_aus_argumenten(args: &[String], cwd: &Path) -> Option<PathBuf> {
    args.iter().skip(1).find(|a| !a.starts_with('-')).map(|a| cwd.join(a)).filter(|p| p.is_file())
}

#[tauri::command]
fn start_datei(app: AppHandle) -> Result<Option<Datei>, String> {
    let args: Vec<String> = std::env::args().collect();
    let cwd = std::env::current_dir().unwrap_or_default();
    match datei_aus_argumenten(&args, &cwd) {
        Some(p) => oeffne_gewaehlt(&app, &p).map(Some),
        None => Ok(None),
    }
}

#[tauri::command]
async fn oeffnen(app: AppHandle) -> Result<Option<Datei>, String> {
    let wahl = testantwort("AUSWAHLLOTSE_TEST_OEFFNEN").unwrap_or_else(|| {
        app.dialog()
            .file()
            .set_title("Projekt öffnen")
            .add_filter("Auswahl-Lotse-Projekt", &["auswahllotse", "json"])
            .blocking_pick_file()
            .and_then(|w| w.into_path().ok())
    });
    match wahl {
        Some(p) => oeffne_gewaehlt(&app, &p).map(Some),
        None => Ok(None),
    }
}

/// Prozessmodell des Prozesslotsen einlesen: nur lesen, nie freigeben.
#[tauri::command]
async fn importieren(app: AppHandle) -> Result<Option<Datei>, String> {
    let wahl = testantwort("AUSWAHLLOTSE_TEST_IMPORTIEREN").unwrap_or_else(|| {
        app.dialog()
            .file()
            .set_title("Prozessmodell einlesen")
            .add_filter("Prozesslotse-Projekt oder BPMN-Diagramm", &["prozesslotse", "json", "bpmn"])
            .add_filter("Prozesslotse-Projekt", &["prozesslotse", "json"])
            .add_filter("BPMN-Diagramm mit eingebettetem Projekt", &["bpmn"])
            .blocking_pick_file()
            .and_then(|w| w.into_path().ok())
    });
    let Some(p) = wahl else { return Ok(None) };
    Ok(Some(Datei { pfad: None, name: dateiname(&p), inhalt: lies_text(&p)? }))
}

#[tauri::command]
fn speichern(pfad: String, inhalt: String, freigaben: State<Freigaben>) -> Result<(), String> {
    let p = PathBuf::from(&pfad);
    if !freigaben.0.lock().unwrap().contains(&p) {
        return Err("Dieser Pfad wurde nicht vom Benutzer gewählt.".into());
    }
    schreibe(&p, &inhalt)
}

#[tauri::command]
async fn speichern_unter(app: AppHandle, vorschlag: String, inhalt: String, art: String) -> Result<Option<Gespeichert>, String> {
    let (filter, endungen, titel): (&str, &[&str], &str) = match art.as_str() {
        "projekt" => ("Auswahl-Lotse-Projekt", &["auswahllotse", "json"], "Speichern unter"),
        "csv" => ("CSV-Datei (Excel)", &["csv"], "Anbieterfragebogen speichern"),
        _ => return Err(format!("Unbekannte Dateiart: {art}")),
    };
    let wahl = test_speicherort(&vorschlag).unwrap_or_else(|| {
        app.dialog()
            .file()
            .set_title(titel)
            .set_file_name(&vorschlag)
            .add_filter(filter, &endungen[..1])
            .blocking_save_file()
            .and_then(|w| w.into_path().ok())
    });
    let Some(p) = wahl else { return Ok(None) };
    let p = mit_endung(p, endungen, endungen[0]);
    schreibe(&p, &inhalt)?;
    if art == "projekt" {
        freigeben(&app, &p);
    }
    Ok(Some(Gespeichert { pfad: p.to_string_lossy().into_owned(), name: dateiname(&p) }))
}

/// PDF direkt aus der WebView2 (ohne Druckdialog), A4 mit 20 mm Rand wie die Druck-CSS (@page).
#[cfg(windows)]
fn drucke_pdf(fenster: &tauri::WebviewWindow, ziel: String) -> Result<(), String> {
    let (tx, rx) = std::sync::mpsc::channel::<Result<(), String>>();
    fenster
        .with_webview(move |wv| unsafe {
            use webview2_com::{
                Microsoft::Web::WebView2::Win32::{ICoreWebView2_7, ICoreWebView2Environment6},
                PrintToPdfCompletedHandler,
            };
            use windows::core::{Interface, HSTRING};
            let tx2 = tx.clone();
            let start = (|| -> windows::core::Result<()> {
                let core7: ICoreWebView2_7 = wv.controller().CoreWebView2()?.cast()?;
                let umgebung: ICoreWebView2Environment6 = wv.environment().cast()?;
                let einstellungen = umgebung.CreatePrintSettings()?;
                // Maße in Zoll: A4 = 210 × 297 mm, Rand 20 mm
                einstellungen.SetPageWidth(210.0 / 25.4)?;
                einstellungen.SetPageHeight(297.0 / 25.4)?;
                let rand = 20.0 / 25.4;
                for r in [
                    einstellungen.SetMarginTop(rand),
                    einstellungen.SetMarginBottom(rand),
                    einstellungen.SetMarginLeft(rand),
                    einstellungen.SetMarginRight(rand),
                ] {
                    r?;
                }
                einstellungen.SetShouldPrintBackgrounds(true)?;
                einstellungen.SetShouldPrintHeaderAndFooter(false)?;
                let fertig = PrintToPdfCompletedHandler::create(Box::new(move |hr, ok| {
                    let _ = tx2.send(if hr.is_ok() && ok { Ok(()) } else { Err(format!("PDF fehlgeschlagen: {hr:?}")) });
                    Ok(())
                }));
                core7.PrintToPdf(&HSTRING::from(ziel.as_str()), &einstellungen, &fertig)
            })();
            if let Err(e) = start {
                let _ = tx.send(Err(e.to_string()));
            }
        })
        .map_err(|e| e.to_string())?;
    rx.recv_timeout(std::time::Duration::from_secs(60)).map_err(|e| e.to_string())?
}

/// Speichert die angezeigte Vorlage als PDF. Die Oberfläche zeigt vorher die gewünschte Vorlage an.
#[tauri::command]
async fn als_pdf(app: AppHandle, fenster: tauri::WebviewWindow, vorschlag: String) -> Result<Option<String>, String> {
    #[cfg(windows)]
    {
        let wahl = test_speicherort(&vorschlag).unwrap_or_else(|| {
            app.dialog().file().set_title("Als PDF speichern").set_file_name(&vorschlag).add_filter("PDF", &["pdf"]).blocking_save_file().and_then(|w| w.into_path().ok())
        });
        let Some(p) = wahl else { return Ok(None) };
        let ziel = mit_endung(p, &["pdf"], "pdf").to_string_lossy().into_owned();
        let z = ziel.clone();
        tauri::async_runtime::spawn_blocking(move || drucke_pdf(&fenster, z)).await.map_err(|e| e.to_string())??;
        Ok(Some(ziel))
    }
    #[cfg(not(windows))]
    {
        let _ = (app, fenster, vorschlag);
        Err("PDF ohne Druckdialog gibt es nur unter Windows.".into())
    }
}

fn baue_menue(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let punkt = |id: &str, text: &str, taste: Option<&str>| {
        let b = MenuItemBuilder::with_id(id, text);
        match taste {
            Some(t) => b.accelerator(t).build(app),
            None => b.build(app),
        }
    };
    let datei = SubmenuBuilder::new(app, "&Datei")
        .item(&punkt("neu", "&Neu", Some("CmdOrCtrl+N"))?)
        .item(&punkt("oeffnen", "Ö&ffnen …", Some("CmdOrCtrl+O"))?)
        .item(&punkt("importieren", "Prozessmodell &einlesen …", None)?)
        .separator()
        .item(&punkt("speichern", "&Speichern", Some("CmdOrCtrl+S"))?)
        .item(&punkt("speichernUnter", "Speichern &unter …", Some("CmdOrCtrl+Shift+S"))?)
        .item(&punkt("fragebogen", "Anbieter&fragebogen als CSV …", None)?)
        .separator()
        .item(&punkt("beispiel", "&Beispiel laden", None)?)
        .separator()
        .item(&punkt("beenden", "B&eenden", None)?)
        .build()?;
    let hilfe = SubmenuBuilder::new(app, "&Hilfe").item(&punkt("ueber", "Ü&ber Auswahl-Lotse", None)?).build()?;
    MenuBuilder::new(app).items(&[&datei, &hilfe]).build()
}

/// Bringt das Hauptfenster nach vorn, z. B. wenn ein zweiter Start eine Datei übergibt.
fn zeige_hauptfenster(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

/// Meldet der Oberfläche eine Datei, die geöffnet oder eingelesen werden soll.
fn melde_datei(app: &AppHandle, p: &Path) {
    match oeffne_gewaehlt(app, p) {
        Ok(d) => {
            let _ = app.emit("datei-oeffnen", d);
        }
        Err(e) => {
            let _ = app.emit("datei-fehler", format!("„{}“: {e}", dateiname(p)));
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Zuerst: Ein zweiter Start (Doppelklick auf eine weitere Datei) landet im laufenden Programm.
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            if let Some(p) = datei_aus_argumenten(&args, Path::new(&cwd)) {
                melde_datei(app, &p);
            }
            zeige_hauptfenster(app);
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(Freigaben::default())
        .setup(|app| {
            let menue = baue_menue(app.handle())?;
            app.set_menu(menue)?;
            app.on_menu_event(|app, ereignis| {
                let id = ereignis.id().as_ref();
                if id == "beenden" {
                    // Über das normale Schließen, damit die Oberfläche nach ungespeicherten Änderungen fragt
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.close();
                    }
                } else {
                    let _ = app.emit("menue", id);
                }
            });
            Ok(())
        })
        .on_window_event(|fenster, ereignis| {
            // Datei ins Fenster gezogen: Das ist eine Auswahl des Benutzers.
            if let WindowEvent::DragDrop(DragDropEvent::Drop { paths, .. }) = ereignis {
                if let Some(p) = paths.iter().find(|p| p.is_file()) {
                    melde_datei(fenster.app_handle(), p);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![start_datei, oeffnen, importieren, speichern, speichern_unter, als_pdf])
        .run(tauri::generate_context!())
        .expect("Auswahl-Lotse konnte nicht starten");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn testordner(name: &str) -> PathBuf {
        let ordner = std::env::temp_dir().join(format!("auswahllotse-test-{name}"));
        let _ = std::fs::remove_dir_all(&ordner);
        std::fs::create_dir_all(&ordner).unwrap();
        ordner
    }

    #[test]
    fn findet_die_datei_in_den_argumenten() {
        let ordner = testordner("argumente");
        let datei = ordner.join("beispiel.auswahllotse");
        std::fs::write(&datei, "{}").unwrap();
        let args = vec!["auswahllotse.exe".to_string(), "--flag".to_string(), "beispiel.auswahllotse".to_string()];
        assert_eq!(datei_aus_argumenten(&args, &ordner), Some(datei.clone()));
        let ohne = vec!["auswahllotse.exe".to_string()];
        assert_eq!(datei_aus_argumenten(&ohne, &ordner), None);
        let fehlt = vec!["auswahllotse.exe".to_string(), "gibt-es-nicht.auswahllotse".to_string()];
        assert_eq!(datei_aus_argumenten(&fehlt, &ordner), None);
        // Ordner sind keine Dateien
        let ordnerarg = vec!["auswahllotse.exe".to_string(), ".".to_string()];
        assert_eq!(datei_aus_argumenten(&ordnerarg, &ordner), None);
    }

    #[test]
    fn speichert_atomar_und_liest_wieder() {
        let ordner = testordner("schreiben");
        let datei = ordner.join("projekt.auswahllotse");
        schreibe(&datei, "{\"a\":1}").unwrap();
        schreibe(&datei, "{\"a\":2}").unwrap();
        assert_eq!(lies_text(&datei).unwrap(), "{\"a\":2}");
        assert!(!ordner.join("projekt.auswahllotse.speichern.tmp").exists());
        assert_eq!(std::fs::read_dir(&ordner).unwrap().count(), 1);
    }

    #[test]
    fn schreibfehler_hinterlaesst_keine_hilfsdatei() {
        let ordner = testordner("schreibfehler");
        // Ziel ist ein Ordner: Umbenennen scheitert, die Hilfsdatei wird wieder entfernt
        let ziel = ordner.join("belegt");
        std::fs::create_dir_all(ziel.join("inhalt")).unwrap();
        assert!(schreibe(&ziel, "x").is_err());
        assert!(!ordner.join("belegt.speichern.tmp").exists());
    }

    #[test]
    fn lehnt_binaerdateien_und_zu_grosse_dateien_ab() {
        let ordner = testordner("binaer");
        let datei = ordner.join("bild.bpmn");
        std::fs::write(&datei, [0xff, 0xfe, 0x00, 0xd8]).unwrap();
        assert!(lies_text(&datei).is_err());
        let gross = ordner.join("gross.auswahllotse");
        let f = std::fs::File::create(&gross).unwrap();
        f.set_len(MAX_GROESSE + 1).unwrap();
        assert!(lies_text(&gross).unwrap_err().contains("zu groß"));
    }

    #[test]
    fn erkennt_projekte_am_app_feld() {
        assert!(ist_projekt(r#"{"app":"auswahllotse","format":1}"#));
        assert!(ist_projekt("\u{feff}{\"app\": \"auswahllotse\"}"));
        assert!(!ist_projekt(r#"{"app":"prozesslotse"}"#));
        assert!(!ist_projekt(r#"{"format":3,"ist":{}}"#));
        assert!(!ist_projekt(r#"["app","auswahllotse"]"#));
        assert!(!ist_projekt("<?xml version=\"1.0\"?><definitions/>"));
        assert!(!ist_projekt(""));
    }

    #[test]
    fn haengt_die_endung_an_statt_zu_ersetzen() {
        let p = |s: &str| PathBuf::from(s);
        let projekt: &[&str] = &["auswahllotse", "json"];
        assert_eq!(mit_endung(p("a.auswahllotse"), projekt, "auswahllotse"), p("a.auswahllotse"));
        assert_eq!(mit_endung(p("a.AUSWAHLLOTSE"), projekt, "auswahllotse"), p("a.AUSWAHLLOTSE"));
        assert_eq!(mit_endung(p("a.json"), projekt, "auswahllotse"), p("a.json"));
        assert_eq!(mit_endung(p("a"), projekt, "auswahllotse"), p("a.auswahllotse"));
        assert_eq!(mit_endung(p("Version 2.0"), projekt, "auswahllotse"), p("Version 2.0.auswahllotse"));
        assert_eq!(mit_endung(p("modell.prozesslotse"), projekt, "auswahllotse"), p("modell.prozesslotse.auswahllotse"));
        assert_eq!(mit_endung(p("bogen"), &["csv"], "csv"), p("bogen.csv"));
        assert_eq!(mit_endung(p("vorlage.pdf"), &["pdf"], "pdf"), p("vorlage.pdf"));
    }
}
