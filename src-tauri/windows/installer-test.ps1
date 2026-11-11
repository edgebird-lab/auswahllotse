# Prüft den Installer auf einem frischen Windows (in der CI, nicht auf Robins Rechner):
# still installieren, Programm, Dateizuordnung und Verknüpfungen prüfen, still deinstallieren.
$ErrorActionPreference = 'Stop'

$ziel = if ($env:CARGO_TARGET_DIR) { $env:CARGO_TARGET_DIR } else { 'src-tauri/target' }
$setup = Get-ChildItem (Join-Path $ziel 'release/bundle/nsis/Auswahl-Lotse_*-setup.exe') | Select-Object -First 1
if (-not $setup) { throw 'Kein Installer gefunden.' }
Write-Host "Installiere $($setup.Name) still ..."
Start-Process $setup.FullName -ArgumentList '/S' -Wait

$ordner = Join-Path $env:LOCALAPPDATA 'Auswahl-Lotse'
$exe = Join-Path $ordner 'auswahllotse.exe'
if (-not (Test-Path $exe)) { throw "Programm nicht installiert: $exe" }

# .auswahllotse gehört dem Auswahl-Lotsen (pro Benutzer, ohne Admin)
$endung = (Get-ItemProperty 'HKCU:\Software\Classes\.auswahllotse').'(default)'
if ($endung -ne 'AuswahlLotse.Projekt') { throw ".auswahllotse zeigt auf '$endung' statt auf AuswahlLotse.Projekt" }
$befehl = (Get-ItemProperty 'HKCU:\Software\Classes\AuswahlLotse.Projekt\shell\open\command').'(default)'
if ($befehl -notlike '*auswahllotse.exe*%1*') { throw "Öffnen-Befehl für .auswahllotse unerwartet: $befehl" }

# .prozesslotse und .bpmn werden nicht zugeordnet (Einlesen nur über den Dialog)
foreach ($fremd in '.prozesslotse', '.bpmn') {
  $standard = (Get-ItemProperty "HKCU:\Software\Classes\$fremd" -ErrorAction SilentlyContinue).'(default)'
  if ($standard -like 'AuswahlLotse*') { throw "$fremd darf nicht dem Auswahl-Lotsen gehören" }
  $mit = Get-ItemProperty "HKCU:\Software\Classes\$fremd\OpenWithProgids" -ErrorAction SilentlyContinue
  if ($mit -and ($mit.PSObject.Properties.Name -like 'AuswahlLotse*')) { throw "$fremd darf nicht unter 'Öffnen mit' stehen" }
}

# Verknüpfungen im Startmenü und auf dem Desktop (die stille Installation legt beide an)
$start = Join-Path ([Environment]::GetFolderPath('Programs')) 'Auswahl-Lotse.lnk'
$desktop = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Auswahl-Lotse.lnk'
foreach ($lnk in $start, $desktop) {
  if (-not (Test-Path $lnk)) { throw "Verknüpfung fehlt: $lnk" }
  $verweis = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk).TargetPath
  if ($verweis -ne $exe) { throw "Verknüpfung $lnk zeigt auf '$verweis'" }
}

Write-Host 'Installation in Ordnung, deinstalliere still ...'
Start-Process (Join-Path $ordner 'uninstall.exe') -ArgumentList '/S' -Wait
# Der Deinstaller startet sich aus einer Kopie neu; kurz warten, bis er fertig ist
for ($i = 0; $i -lt 30 -and (Test-Path $exe); $i++) { Start-Sleep -Seconds 1 }

if (Test-Path $exe) { throw 'Programm nach der Deinstallation noch vorhanden' }
if (Test-Path 'HKCU:\Software\Classes\AuswahlLotse.Projekt') { throw 'Zuordnung nach der Deinstallation noch vorhanden' }
foreach ($lnk in $start, $desktop) { if (Test-Path $lnk) { throw "Verknüpfung nach der Deinstallation noch vorhanden: $lnk" } }
Write-Host 'Installer-Test bestanden.'
