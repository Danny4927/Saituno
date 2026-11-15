# Saituno – Projekt- und Architekturplan

**Produkt:** Saituno  
**Untertitel:** Open Source Instrument Tuner  
**Zielplattformen:** Web, Android und iOS  
**Projektstatus (15.11.2026):** Phasen 1–5 gemerged; Phase 6 Release-Vorbereitung als nächster Schritt

---

## 1. Produktvision

Saituno ist eine moderne, minimalistische und vollständig clientseitige Anwendung zum Stimmen von Gitarre, Ukulele und Bass. Eine gemeinsame Codebasis soll als Web-App, Android-App und iOS-App bereitgestellt werden.

### Grundprinzipien

- Open Source; MIT-Lizenz ist vorgesehen.
- Keine Monetarisierung: keine Werbung, Abonnements oder In-App-Käufe.
- Kein Backend, keine Datenbank, keine Benutzerkonten und keine Cloud-Abhängigkeit.
- Offline-first: Stimmen und Kernfunktionen funktionieren ohne Internet.
- Datenschutz: Audio wird lokal verarbeitet und weder übertragen noch gespeichert.
- Einheitliche Bedienung auf Web, Android und iOS.
- Modernes, minimalistisches und responsives Design.

## 2. Technologie-Stack

| Bereich | Technologie | Aufgabe |
|---|---|---|
| Frontend | Angular 22.x | Anwendung und Komponenten |
| UI | Ionic 9.x | Mobile UI-Komponenten |
| Mobile Runtime | Capacitor 8.x | Android- und iOS-App |
| Sprache | TypeScript 6.x | Anwendungs- und Domainlogik |
| Reaktivität | Angular Signals | UI- und Anwendungszustand |
| Audioaufnahme | Web Audio API | Mikrofonzugriff und Audio-Kontext |
| Echtzeitverarbeitung | AudioWorklet | Verarbeitung außerhalb des UI-Hauptthreads |
| Pitch Detection | YIN | Erkennung der Grundfrequenz |
| Persistenz | Capacitor Preferences / Web Storage | Lokale Einstellungen |
| Unit-Tests | Vitest | Tests der Domain- und Audio-Logik |
| E2E und Visual Regression | Playwright | Browser- und visuelle Regressionstests |
| CI/CD | GitHub Actions | Automatisierte Prüfungen und Builds |

Die implementierten und über Lockfile fixierten Versionen stehen in `package.json`. Vor größeren Versionsupdates sind die offiziellen Kompatibilitätsmatrizen zu prüfen. Keine Release Candidates oder Betaversionen für produktive Abhängigkeiten verwenden. Node.js 26 ist für die aktuell verwendete Angular-Version eingerichtet.

**Rust wird im MVP nicht eingesetzt.** Die zusätzliche Build- und Integrationskomplexität bietet für den geplanten Umfang zunächst keinen ausreichenden Vorteil.

## 3. Architektur

Die Anwendung wird in drei logisch getrennte Schichten aufgeteilt.

### Presentation Layer

Angular und Ionic. Verantwortlich für Seiten, Komponenten, Navigation, Tuner-Anzeige, Instrument- und Stimmungsauswahl, Einstellungen und Berechtigungszustände. Die UI implementiert keine Audioalgorithmen oder musikalischen Berechnungen.

### Application und Domain Layer

Framework-unabhängiges TypeScript. Verantwortlich für Instrumentdefinitionen, Saiten und Sollfrequenzen, Stimmungen, Noten- und Frequenzberechnung, Cent-Umrechnung und Interpretation der Messergebnisse. Die Domain-Logik darf keine Abhängigkeit zu Angular, Ionic oder Capacitor haben.

### Audio Infrastructure Layer

Web Audio API und AudioWorklet. Verantwortlich für Mikrofonzugriff, Audio-Konfiguration, Audio-Puffer, Signalaufbereitung, Pitch Detection, Confidence-Bewertung und Audio-Lifecycle.

```text
Angular + Ionic UI
        |
        v
Application / Domain
Instrumente · Stimmungen · Noten
        |
        v
Audio Service
        |
        v
AudioContext -> AudioWorklet
        |
        v
Signalaufbereitung -> YIN Pitch Detection
        |
        v
Frequenz + Confidence
        |
        v
Tuner-Ergebnis / UI
```

Die Audioaufnahme wird zunächst über `getUserMedia()` und Web Audio API umgesetzt. AudioWorklet übernimmt zeitkritische Verarbeitung außerhalb des UI-Hauptthreads. Die tatsächliche Audio- und Berechtigungsfunktionalität muss auf jeder Zielplattform separat validiert werden.

## 4. Angular Signals – verbindliche Konventionen

Angular Signals sind der Standard für synchronen UI- und Anwendungszustand.

- `signal()` für veränderlichen lokalen Zustand.
- `computed()` für abgeleitete Werte wie aktuelle Note, Cent-Abweichung, Stimmstatus und ausgewählte Konfiguration.
- `linkedSignal()` für abgeleiteten Zustand, der im passenden Anwendungsfall zugleich benutzerseitig änderbar sein muss.
- Signal-basierte Component APIs (`input()`, `output()`, gegebenenfalls `model()`) bevorzugen.
- Services kapseln gemeinsam genutzten Zustand und geben nach außen möglichst Readonly-Signals frei.
- Zustandsänderungen erfolgen nachvollziehbar über `set()` und `update()`.
- Kein NgRx im MVP.

`effect()` ist nicht zur Weitergabe oder Synchronisierung von Anwendungszustand einzusetzen. Abgeleitete Werte werden mit `computed()` und manuell überschreibbarer abhängiger Zustand mit `linkedSignal()` modelliert. Effects sind nur für notwendige Seiteneffekte vorgesehen, etwa die Synchronisierung mit Storage oder die Anbindung imperativer Browser-/Capacitor-APIs. Ressourcen und Listener müssen sauber bereinigt werden.

Audio-Samples lösen keine Angular-Signalupdates aus. Die Audio-Engine arbeitet unabhängig von Angular und übergibt stabilisierte Messwerte mit ungefähr 20–30 UI-Aktualisierungen pro Sekunde an den Tuner-State.

## 5. Funktionaler MVP-Umfang

### Instrumente

| Instrument | MVP-Konfiguration |
|---|---|
| Gitarre | 6 Saiten |
| Ukulele | 4 Saiten |
| Bass | 4, 5 und 6 Saiten |

### Stimmungen

**Gitarre**

- E Standard: E2 – A2 – D3 – G3 – B3 – E4
- Drop D: D2 – A2 – D3 – G3 – B3 – E4
- Eb Standard: Eb2 – Ab2 – Db3 – Gb3 – Bb3 – Eb4
- D Standard: D2 – G2 – C3 – F3 – A3 – D4

**Ukulele**

- Standard High G: G4 – C4 – E4 – A4
- Low G: G3 – C4 – E4 – A4

**Bass**

- 4-Saiter Standard: E1 – A1 – D2 – G2
- 5-Saiter Standard: B0 – E1 – A1 – D2 – G2
- 6-Saiter Standard: B0 – E1 – A1 – D2 – G2 – C3
- BEAD und Drop-D als zusätzliche Konfigurationen

Stimmungen werden datengetrieben konfiguriert. Neue Stimmungen sollen ohne Änderung der Audio-Engine ergänzt werden können.

### Tuner-Funktionen

- Automatische Erkennung der gespielten Note.
- Anzeige des Notennamens und der gemessenen Frequenz in Hz.
- Anzeige der Abweichung in Cent.
- Visuelle Zustände: zu tief, gestimmt, zu hoch.
- Automatische Saitenerkennung und manuelle Saitenauswahl.
- Anzeige der Sollfrequenz.
- Messung starten und stoppen.
- Verständliche Zustände bei fehlendem oder zu schwachem Signal.

Der MVP ist auf einzelne Saiten ausgelegt. Zuverlässige Erkennung mehrerer gleichzeitig angeschlagener Saiten ist nicht Bestandteil des MVP.

### Einstellungen

- Instrument und Stimmung auswählen.
- Referenzfrequenz einstellen (Standard A4 = 440 Hz).
- Automatische oder manuelle Saitenauswahl.
- Dark Mode und Light Mode.
- Deutsch und Englisch.
- Einstellungen lokal speichern.

Ein separater Eingangspegel-/Empfindlichkeitsregler wird anhand der Ergebnisse des Audio-Prototyps bewertet.

## 6. Audio-Engine

Die Audio-Engine ist das größte technische Risiko und wird vor dem vollständigen UI-Ausbau prototypisiert.

### Verarbeitungskette

```text
Mikrofon -> getUserMedia() -> AudioContext -> AudioWorklet
         -> Signalaufbereitung -> YIN Pitch Detection
         -> Confidence-Bewertung -> Frequenz in Hz
         -> musikalische Tonberechnung -> Angular Tuner UI
```

### Pitch Detection

YIN wird als erster Algorithmus implementiert. Der Algorithmus ist für monophone Instrumentensignale geeignet und soll die Grundfrequenz statt lediglich des stärksten Spektralpeaks ermitteln. Eine FFT kann bei Bedarf ergänzende Analysen liefern, ist aber nicht die alleinige Grundlage der Tonerkennung.

### Signalqualität und Stabilisierung

- Confidence beziehungsweise Signalqualität bewerten.
- Bei unzureichender Qualität keine irreführende Note anzeigen.
- Messwerte zeitlich glätten.
- Notenwechsel mit Hysterese stabilisieren.
- Störgeräusche möglichst unterdrücken.
- Unterschiedliche Samplerates unterstützen.
- Audio-Unterbrechungen und Gerätewechsel behandeln.
- Unnötige Speicherallokationen im AudioWorklet vermeiden.

### Vorläufige Qualitätsziele

| Eigenschaft | Ziel |
|---|---:|
| Messbereich | ca. 25–1.500 Hz |
| Anzeigeauflösung | 1 Cent |
| Zielgenauigkeit | ±2 Cent |
| Aktualisierung | 20–30 Messungen/s |
| Reaktionszeit | Ziel unter 150 ms |
| Stabilisierung | Ziel unter 500 ms |

Diese Werte sind Entwicklungsziele und müssen durch Messungen validiert werden. Die tiefe H-Saite eines 5-/6-saitigen Basses liegt bei etwa 30,9 Hz und muss daher unterstützt werden. Tiefe Bassfrequenzen erfordern längere Analysefenster; Genauigkeit und Reaktionsgeschwindigkeit sind abzuwägen.

## 7. UI- und UX-Konzept

Modern, minimalistisch und funktional:

- Der Tuner ist die zentrale Ansicht.
- Große, gut lesbare Tonanzeige.
- Klare visuelle Rückmeldung für zu tief, gestimmt und zu hoch.
- Während des Stimmvorgangs möglichst wenige Bedienelemente.
- Einhandbedienung auf Smartphones.
- Dark Mode und Light Mode.
- Responsive Darstellung für Smartphone, Tablet und Desktop.
- Barrierearme Farben, Kontraste und Beschriftungen.

Hauptansichten:

1. Tuner
2. Instrumentauswahl
3. Stimmungsauswahl
4. Einstellungen

Mikrofonzugriff erst nach bewusster Nutzeraktion anfragen. Bei verweigerter Berechtigung eine verständliche Erklärung anzeigen. Während der Messung müssen Instrument und aktive Stimmung klar erkennbar sein. Bei fehlendem Signal einen neutralen Zustand statt einer vermeintlichen Messung darstellen.

## 8. Offline, Datenschutz und Persistenz

Die Kernfunktionen benötigen keine Internetverbindung.

| Funktion | Internet erforderlich |
|---|---|
| Stimmen | Nein |
| Instrument auswählen | Nein |
| Stimmung wechseln | Nein |
| Einstellungen ändern/speichern | Nein |
| App aktualisieren | Ja |
| Erstinstallation der Web-App | Ja |

Für die Web-Version wird eine PWA mit Service Worker vorgesehen. Nach erfolgreichem Laden sollen die App-Dateien lokal verfügbar sein. Native Apps enthalten die Ressourcen im App-Paket.

Datenschutzanforderungen:

- Keine Benutzerkonten.
- Keine Telemetrie im MVP.
- Keine Analyse- oder Tracking-SDKs.
- Keine Übertragung oder Speicherung von Audiodaten.
- Keine externen API-Aufrufe für die Kernfunktion.
- Mikrofonberechtigung nur bei Bedarf.

Nur Einstellungen werden lokal gespeichert: native Apps über Capacitor Preferences, Web über Browser Storage. Keine geräteübergreifende Synchronisation.

## 9. Plattform- und Berechtigungskonzept

### Web

- Mikrofonzugriff über `getUserMedia()`.
- Sicherer Kontext erforderlich: HTTPS oder localhost.
- Browser-Unterstützung für Web Audio API und AudioWorklet prüfen.
- PWA-Installation ermöglichen.

### Android

- Capacitor Android.
- Mikrofonberechtigung deklarieren und zur Laufzeit anfragen.
- App-Wechsel und Audio-Unterbrechungen testen.
- Native Builds und Release-Signierung einrichten.

### iOS

- Capacitor iOS.
- Mikrofon-Nutzungsbeschreibung konfigurieren.
- Berechtigungsablauf testen.
- Audio-Lifecycle und Unterbrechungen testen.
- Safari und native WKWebView separat prüfen.

AudioWorklet und Web Audio API müssen in den unterstützten Browser- und WebView-Versionen auf echten Geräten validiert werden. Bei Einschränkungen wird eine gezielte native Audio-Adapter-Schicht geprüft, ohne Domain- und Pitch-Detection-Logik zu duplizieren.

## 10. Projektstruktur

Für den MVP genügt ein einzelnes Angular-Projekt; ein Monorepo ist zunächst nicht erforderlich.

```text
saituno/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── audio/
│   │   │   │   ├── audio.service.ts
│   │   │   │   ├── audio-permission.service.ts
│   │   │   │   └── audio-worklet-loader.ts
│   │   │   └── storage/
│   │   │       └── settings-storage.service.ts
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   ├── instruments/
│   │   │   ├── tunings/
│   │   │   ├── notes/
│   │   │   └── calculations/
│   │   ├── features/
│   │   │   ├── tuner/
│   │   │   ├── instruments/
│   │   │   └── settings/
│   │   ├── shared/
│   │   │   └── components/
│   │   └── app.routes.ts
│   ├── assets/
│   │   ├── instruments/
│   │   └── i18n/
│   ├── worklets/
│   │   └── tuner-processor.ts
│   └── styles/
├── android/
├── ios/
├── e2e/
├── public/
├── capacitor.config.ts
├── angular.json
├── package.json
└── README.md
```

Architekturregeln:

- Angular Standalone Components verwenden.
- Angular Signals für UI-Zustand verwenden.
- Kein NgRx im MVP.
- Domain-Logik framework-unabhängig halten.
- Audioverarbeitung vom UI-Hauptthread trennen.
- Instrument- und Stimmungsdaten deklarativ konfigurieren.
- Audio-Engine mit synthetischen Signalen isoliert testen.
- Plattformabhängigkeiten hinter Adaptern kapseln.

## 11. Teststrategie

### Unit-Tests

Synthetische Signale mit bekannten Frequenzen:

| Frequenz | Erwartete Note |
|---:|---|
| 41,20 Hz | E1 |
| 55,00 Hz | A1 |
| 82,41 Hz | E2 |
| 110,00 Hz | A2 |
| 220,00 Hz | A3 |
| 329,63 Hz | E4 |
| 440,00 Hz | A4 |
| 659,25 Hz | E5 |

Weitere Fälle:

- Frequenzen zwischen zwei Noten.
- Abweichungen von ±5, ±10, ±25 und ±50 Cent.
- Starke zweite und dritte Harmonische.
- Unterschiedliche Signalpegel.
- Hintergrundrauschen.
- Stille und unbrauchbare Signale.
- Kurze Anschläge und ausklingende Töne.
- Tiefe Bassfrequenzen.
- Unterschiedliche Samplerates.
- Mehrere gleichzeitig gespielte Saiten als Negativ-/Nicht-MVP-Test.

### Funktionale E2E-Tests

Playwright prüft Navigation, Instrumentauswahl, Stimmungsauswahl, Einstellungen, Fehlerzustände, Responsive Layout und PWA-Grundfunktionen. Für reproduzierbare Tests werden kontrollierte Testsignale statt unkontrolliertem Mikrofoneingang eingesetzt.

### Verpflichtende Visual Regression Tests

Playwright wird ausdrücklich auch für visuelle Regressionstests verwendet. Die Tests nutzen `expect(page).toHaveScreenshot()` beziehungsweise `expect(locator).toHaveScreenshot()`.

Mindestens folgende Ansichten werden abgedeckt:

1. Tuner-Hauptansicht ohne Messsignal.
2. Tuner mit gestimmter Saite.
3. Tuner mit zu tiefer und zu hoher Saite.
4. Instrumentauswahl.
5. Stimmungsauswahl.
6. Einstellungen.
7. Dark Mode.
8. Light Mode.
9. Berechtigungs- und Fehlerzustände.
10. Responsive Ansichten für Smartphone, Tablet und Desktop.

Testbedingungen:

- Feste Viewports und definierte Device-Emulation.
- Definierte Sprache und Zeitzone.
- Deterministische Testdaten; Audioeingang und Pitch-Ergebnisse in UI-Tests mocken.
- Animationen und Transitions für Screenshots deaktivieren.
- Dynamische Inhalte und nicht deterministische Bereiche vermeiden oder gezielt maskieren.
- Screenshots erst aufnehmen, wenn Fonts und UI vollständig geladen sind.
- Rendering-Umgebung, Browser-Version und Device-Scale-Factor stabil halten.

Baseline-Verwaltung:

- Referenz-Screenshots werden versioniert im Repository gespeichert.
- Baselines werden in einer festgelegten CI-Umgebung verglichen.
- Bei Bedarf getrennte Baselines pro Browser-/Betriebssystem-Projekt.
- Aktualisierung nur bewusst mit `--update-snapshots` und nach visueller Prüfung.
- Snapshot-Änderungen müssen im Pull Request sichtbar sein.
- Keine großzügigen Pixel-Toleranzen, um tatsächliche UI-Regressionen zu kaschieren.

Jeder Pull Request muss funktionale Playwright-E2E-Tests und Visual Regression Tests ausführen. Unerwartete visuelle Unterschiede lassen die Pipeline fehlschlagen und müssen vor dem Merge bewertet werden.

Beispiel:

```ts
import { expect, test } from '@playwright/test';

test('tuner default view matches visual baseline', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('tuner-ready').waitFor();
  await expect(page).toHaveScreenshot('tuner-default.png', {
    animations: 'disabled',
  });
});
```

### Gerätetests

| Plattform | Testumgebung |
|---|---|
| Web | Chrome, Firefox, Safari |
| Android | Chrome und native Capacitor-App |
| iOS | Safari und native Capacitor-App |

Zusätzlich sind reale Instrumente und Mikrofone erforderlich. Mindestens eine Gitarre, eine Ukulele und ein Bass werden für manuelle Validierung verwendet.

## 12. Entwicklungsphasen

### Phase 1 – Projektgrundlage

- Angular-, Ionic- und Capacitor-Projekt erstellen.
- Kompatible stabile Abhängigkeiten installieren.
- Build-Konfiguration einrichten.
- Grundlayout und Navigation erstellen.
- PWA vorbereiten.
- Android- und iOS-Projekte initialisieren.
- CI mit Linting, Tests und Build einrichten.

**Abnahme:** Web-, Android- und iOS-Projekt lassen sich bauen und starten.

### Phase 2 – Audio-Prototyp

- [x] Mikrofonzugriff über `getUserMedia()` implementieren.
- [x] AudioContext und AudioWorklet einrichten.
- [x] YIN implementieren und im Worklet sowie in Vitest gemeinsam verwenden.
- [x] Frequenz-, Noten- und Cent-Berechnung implementieren.
- [x] Confidence- und RMS-Bewertung ergänzen.
- [x] Synthetische Testsignale für Bass, Gitarre und höhere Frequenzen erzeugen.
- [x] Fehlerzustände für verweigerte Berechtigung und fehlendes Mikrofon ergänzen.
- [x] Audio-Lifecycle mit Stop, Track-Freigabe und AudioContext-Cleanup implementieren.
- [x] Erste Tuner-Prototypansicht mit Angular Signals verbinden.
- [ ] Auf echten Geräten testen und Genauigkeit/Latenz dokumentieren.

**Abnahme:** Noch offen. Die algorithmische und Browser-Grundlage ist implementiert und automatisiert getestet. Die vollständige Abnahme erfordert reale Mikrofon-/Instrumenttests auf Web, Android und iOS.

### Phase 3 – Tuner-Oberfläche

- [x] Tuner-Ansicht mit responsivem Desktop-/Mobile-Layout erstellen.
- [x] Tonname, Oktave und gemessene Frequenz anzeigen.
- [x] Cent-Skala mit beweglichem Zeiger implementieren.
- [x] Zu-tief-/Gestimmt-/Zu-hoch-Zustände mit ±3-Cent-Toleranz.
- [x] Automatische und manuelle Saitenauswahl für Gitarre E Standard.
- [x] Fehler- und Berechtigungszustände aus AudioService integrieren.
- [x] Domain-Helfer für Zieltonabweichung und automatische Gitarrensaitenerkennung ergänzen.
- [x] Vitest- und Playwright-Tests für Auswahl und Oberfläche ergänzen.

**Abnahme:** Phase 3 UI-Funktionen sind implementiert. Vollständige visuelle und funktionale Abnahme erfolgt mit erfolgreicher CI und Review des PR. Die unterstützten Instrumente und alternativen Stimmungen folgen in Phase 4.

### Phase 4 – Instrumente und Stimmungen

- [x] Gitarren-Konfigurationen: E Standard, Drop D, Eb Standard und D Standard.
- [x] Ukulele-Konfigurationen: Standard High G und Low G.
- [x] Bass-Konfigurationen: 4-, 5- und 6-Saiter Standard, BEAD und Drop D.
- [x] Datengetriebene Stimmungsverwaltung mit MIDI-basierten Sollfrequenzen.
- [x] Instrument- und Stimmungsauswahl in der Tuner-Oberfläche.
- [x] Automatische und manuelle Saitenauswahl für alle Presets.
- [x] Unit-Tests für Preset-Inhalte, Frequenzberechnung und Saitenzuordnung.
- [x] Playwright-E2E-Test für Instrument- und Stimmungswechsel.

**Abnahme:** Alle im MVP definierten Instrumente und Stimmungen sind auswählbar und verwenden dieselbe Pitch-Detection-Engine. Reale Instrumenttests bleiben Teil der plattformübergreifenden Validierung.

### Phase 5 – Plattformintegration

**Status: Implementiert und gemerged; physische Geräteabnahme teilweise offen.**

- [x] Capacitor-Konfiguration und Android-/iOS-Projekte vorhanden.
- [x] Mikrofonberechtigungen für Browser und native Projekte vorbereitet.
- [x] Offline-App-Shell über Angular Service Worker.
- [x] Lokale Speicherung der Tuner-Einstellungen (Web Storage / Capacitor Preferences).
- [x] Audioaufnahme bei Backgrounding/Pagehide stoppen; erneute Aktivierung nur nach Nutzeraktion.
- [x] Chromium- und Firefox-E2E-Abdeckung für Persistenz und Audio-Lifecycle.
- [ ] Android- und iOS-Geräteabnahme mit Berechtigungs-, Sperrbildschirm- und Unterbrechungstests.
- [ ] Offline-Reload und Mikrofon-Reaktivierung auf physischen Geräten bestätigen.

**Abnahme:** Implementierung abgeschlossen. Plattformübergreifende Abnahme bleibt bis zu dokumentierten physischen Gerätetests offen.

### Phase 6 – Release-Vorbereitung

**Status: Als nächster Schritt geplant.**

- [ ] Barrierefreiheit und Bedienbarkeit mit Tastatur/Screenreader prüfen.
- [ ] Kontrast, Dark-/Light-Mode und responsive Ansichten systematisch abnehmen.
- [ ] App-Icons, Splashscreens und Metadaten finalisieren.
- [ ] Web-Deployment und PWA-Offline-Verhalten prüfen.
- [ ] Reproduzierbare Release-Builds für Android und iOS vorbereiten.
- [ ] Android-Signierung und Release-Secrets sicher konfigurieren (Keystore nicht einchecken).
- [ ] Release-Workflow und Versions-/Changelog-Prozess einrichten.
- [ ] Lizenz- und Third-Party-Hinweise prüfen.
- [ ] Bekannte Plattform- und Audioeinschränkungen dokumentieren.

**Abnahme:** Ein reproduzierbarer Release-Kandidat liegt vor; physische Gerätematrix und Audio-Messwerte sind dokumentiert.

## 13. Nicht Bestandteil des MVP

- Metronom.
- Akkorderkennung.
- Tabulaturen oder Notenblätter.
- Audioaufnahme.
- Benutzerkonten.
- Cloud-Synchronisation.
- Social Features.
- Werbung.
- In-App-Käufe.
- Kostenpflichtige Pro-Funktionen.

Spätere Erweiterungen dürfen die einfache und schnelle Kernfunktion nicht beeinträchtigen.

## 14. Open-Source-Strategie

### Lizenz

MIT License ist vorgesehen. Die Lizenz ist vor Veröffentlichung als `LICENSE`-Datei hinzuzufügen. Lizenzen sämtlicher Abhängigkeiten sind zu prüfen und in einer Third-Party-Notiz zu dokumentieren.

### Repository-Dokumentation

Empfohlene Dateien:

```text
README.md
LICENSE
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
CHANGELOG.md
docs/
  PROJECT_PLAN.md
  architecture.md
  audio-engine.md
  development.md
```

### CI/CD

GitHub Actions soll mindestens folgende Prüfungen ausführen:

- Abhängigkeiten installieren.
- Format- und Lint-Prüfungen.
- Unit-Tests.
- Produktions-Build der Web-App.
- Funktionale Playwright-E2E-Tests.
- Playwright Visual Regression Tests.
- Abhängigkeits- und Lizenzprüfung.

Native Android- und iOS-Builds können ergänzt werden. iOS-Builds benötigen eine passende macOS-Runner-Umgebung.

### Keine Monetarisierung

Das Projekt wird ohne Werbung, Tracking, In-App-Käufe oder kostenpflichtige Funktionen entwickelt. Es gibt keine geplante kommerzielle Einschränkung der Kernfunktionen.

## 15. Risiken und technische Prüfaufträge

| Risiko | Maßnahme |
|---|---|
| AudioWorklet verhält sich auf iOS anders | Früher Prototyp auf realen iPhones |
| Tiefe Bassfrequenzen benötigen lange Analysefenster | Adaptive Fenstergröße und Messungen |
| Obertöne werden als Grundton erkannt | YIN, Confidence und Testsignale |
| Mikrofonberechtigungen unterscheiden sich | Plattformbezogene Tests |
| Audio wird durch App-Wechsel unterbrochen | Audio-Lifecycle sauber verwalten |
| Web-PWA ist offline nicht verfügbar | Service Worker und Offline-Tests |
| UI zeigt instabile Messwerte | Glättung und Hysterese |

Die Audio-Engine und ihre Plattformkompatibilität sind das größte technische Risiko. Phase 2 muss vor einer umfangreichen UI-Implementierung erfolgreich abgeschlossen werden.

## 16. Definition of Done für den MVP

- [ ] Web-App kann produktiv gebaut und bereitgestellt werden.
- [ ] Android- und iOS-Apps können gebaut und installiert werden.
- [ ] Gitarre, Ukulele und Bass sind auswählbar.
- [ ] Alle definierten MVP-Stimmungen sind verfügbar.
- [ ] Einzelne Saiten können automatisch erkannt werden.
- [ ] Eine Saite kann manuell ausgewählt werden.
- [ ] Frequenz, Note und Cent-Abweichung werden angezeigt.
- [ ] Audio-Engine wurde auf allen drei Plattformen getestet.
- [ ] Messziele wurden anhand dokumentierter Tests bewertet.
- [ ] Kernfunktion funktioniert offline.
- [ ] Einstellungen werden lokal gespeichert.
- [ ] Audiodaten werden weder übertragen noch gespeichert.
- [ ] Unit- und E2E-Tests sind erfolgreich.
- [ ] Angular Signals werden gemäß den Konventionen verwendet.
- [ ] Playwright enthält funktionale E2E-Tests und verpflichtende Visual Regression Tests.
- [ ] Referenz-Screenshots sind versioniert und werden in CI verglichen.
- [ ] Änderungen an visuellen Baselines werden im Pull Request geprüft.
- [ ] Open-Source-Repository ist dokumentiert und lizenziert.
- [ ] Marken-, Domain- und Store-Verfügbarkeit des Namens wurden vor öffentlichem Release separat geprüft.

## 17. Produktname

**Saituno** ist der ausgewählte Produktname.

- Repository-/Projektname: `saituno`
- App-Anzeigename: `Saituno`
- Untertitel: `Open Source Instrument Tuner`
- Kurzbeschreibung: `A simple, free tuner for guitar, bass and ukulele.`

Der Name ist eine Produktentscheidung für die Entwicklung, keine bestätigte markenrechtliche Freigabe. Vor einer öffentlichen Veröffentlichung müssen DPMAregister, EUIPO/TMview, WIPO, Domain-Registries, Google Play und Apple App Store geprüft werden. Keine Domain, Marke oder Store-Kennung als verfügbar voraussetzen, solange dies nicht separat verifiziert wurde.

## 18. Nächster Umsetzungsschritt

Phasen 1–5 sind gemerged. Als Nächstes folgt Phase 6 mit Release-Vorbereitung, Accessibility-Abnahme, Release-Automatisierung und plattformbezogenen Checklisten. Die Implementierung in Phase 5 ist vorhanden; physische Android-/iOS-Tests, Browsermessungen mit kalibrierter Referenz sowie Audio-Genauigkeit und Latenz bleiben offen und dürfen nicht als automatisiert abgenommen gelten.


---

## 19. Web-Veröffentlichung über GitHub Pages

Die produktive Web-App wird kostenlos über **GitHub Pages** aus diesem Repository veröffentlicht.

### Deployment

- GitHub Actions baut die Angular-Produktionsversion.
- Das Build-Ergebnis wird als Pages-Artefakt hochgeladen und mit den offiziellen GitHub-Pages-Actions veröffentlicht.
- Deployment erfolgt zunächst bei Änderungen am Branch `main`; Pull Requests führen Build und Tests aus, veröffentlichen aber nicht.
- Das Repository muss GitHub Pages für die Veröffentlichung über GitHub Actions konfigurieren.
- Die veröffentlichte URL und der Base-Href werden in der README dokumentiert.

### Angular-Konfiguration

GitHub Pages veröffentlicht ein Projekt standardmäßig unter einer Repository-Unteradresse, beispielsweise:

`https://<owner>.github.io/<repository>/`

Daher muss der Angular-Build den passenden Base-Href erhalten, beispielsweise:

`ng build --configuration production --base-href /Saituno/`

Der tatsächliche Pfad muss aus Owner und Repository-Namen der GitHub-Pages-Adresse abgeleitet und in der Workflow-Konfiguration zentral gepflegt werden.

### Routing und statische Dateien

- Angular-Routing muss mit dem statischen Hosting von GitHub Pages kompatibel sein.
- Für den MVP wird Hash-Routing (`useHash: true`) bevorzugt, damit direkte Aufrufe und Reloads tiefer Routen nicht auf einen fehlenden Server-Fallback angewiesen sind.
- Asset-, Manifest-, Service-Worker- und AudioWorklet-URLs müssen auch unter dem Repository-Unterpfad korrekt aufgelöst werden.
- PWA-Manifest und Service-Worker-Scope müssen den tatsächlichen Deployment-Pfad berücksichtigen.
- Die Anwendung muss nach Veröffentlichung unter dem GitHub-Pages-Unterpfad vollständig funktionieren; ein Test nur unter `/` reicht nicht aus.

### GitHub Actions – Pages

Der Workflow soll die offiziellen Actions für Pages verwenden:

1. Checkout
2. Node.js-Version und npm-Cache einrichten
3. `npm ci`
4. Linting, Unit-Tests und Produktions-Build
5. Playwright E2E- und Visual-Regression-Tests
6. Pages-Artefakt hochladen
7. Pages-Deployment nach erfolgreichem Build und erfolgreichen Tests

Pull Requests führen die Prüfungen aus, ohne die Live-Seite zu verändern.

---

## 20. GitHub Releases und Android-APK

Zusätzlich zur Web-Veröffentlichung werden künftig versionierte GitHub Releases bereitgestellt. Jedes geeignete Release soll mindestens eine installierbare Android-APK als Download enthalten.

### Release-Auslöser und Versionierung

- Releases werden über versionierte Git-Tags ausgelöst, beispielsweise `v1.0.0`.
- Semantische Versionierung verwenden: MAJOR.MINOR.PATCH.
- GitHub Actions baut die Release-Artefakte automatisiert.
- Der Workflow erstellt einen GitHub Release zum Tag und hängt die erzeugten Dateien an.
- Release Notes enthalten Version, Änderungen, bekannte Einschränkungen und Installationshinweise.
- Keine Release-Artefakte aus beliebigen Pull-Request-Builds als offizielle Releases veröffentlichen.

### Android APK

- Android-Release-Build mit Capacitor und Gradle erzeugen.
- Eine signierte Release-APK als GitHub-Release-Asset bereitstellen.
- APK-Dateiname enthält Produktname und Version, beispielsweise `saituno-1.0.0-android.apk`.
- Signatur und Build-Ergebnis vor Veröffentlichung prüfen.
- SHA-256-Prüfsumme der APK erzeugen und in den Release-Assets oder Release Notes bereitstellen.
- Installation und Start der APK auf einem Android-Testgerät prüfen.

### Signierung und Secrets

- Für Release-APK eine eigene Android-Release-Keystore-Datei verwenden.
- Keystore und Passwörter niemals ins Repository einchecken.
- Keystore und Zugangsdaten ausschließlich als geschützte GitHub Actions Secrets beziehungsweise geeignete geschützte Umgebungs-Secrets speichern.
- Release-Workflow darf nur bei einem passenden Tag und mit Zugriff auf die benötigten Secrets signieren.
- Debug-Builds dürfen keine Release-Schlüssel verwenden.
- Verlust des Keystores vermeiden: sichere, zugriffsbeschränkte Offline-Sicherung der Release-Schlüssel vorsehen.

### Weitere Plattformen

- iOS-Builds können später ergänzt werden. Eine Verteilung außerhalb des App Stores erfordert ein separates Signierungs- und Distributionskonzept.
- Die Web-App wird weiterhin über GitHub Pages veröffentlicht; sie muss nicht als Release-ZIP verteilt werden.
- Ein Android App Bundle (`.aab`) kann ergänzend erzeugt werden, falls später eine Veröffentlichung im Google Play Store geplant wird. Für direkte Downloads aus GitHub Releases ist die APK das primäre Artefakt.

### Release-Checkliste

- [ ] Versionsnummer und Git-Tag stimmen überein.
- [ ] CI-Tests und Visual Regression Tests sind erfolgreich.
- [ ] Web-Produktionsbuild ist erfolgreich.
- [ ] Android-Release-APK wurde erstellt.
- [ ] APK ist mit dem vorgesehenen Release-Keystore signiert.
- [ ] Signaturprüfung ist erfolgreich.
- [ ] SHA-256-Prüfsumme wurde erzeugt.
- [ ] APK wurde auf einem Android-Gerät installiert und gestartet.
- [ ] Release Notes und Installationshinweise sind vorhanden.
- [ ] GitHub Release enthält die APK als Download.

---

## 21. Aktualisierte CI/CD-Zielarchitektur

GitHub Actions übernimmt drei getrennte Aufgabenbereiche:

| Workflow | Auslöser | Aufgaben |
|---|---|---|
| CI | Pull Request und Push auf `main` | Installieren, Linting, Unit-Tests, Playwright E2E, Visual Regression, Web-Build |
| GitHub Pages | Erfolgreicher Push auf `main` | Produktionsbuild mit korrektem Base-Href und Deployment |
| Release | Push eines Versions-Tags wie `v1.0.0` | Release-Build, APK-Signierung, Prüfsumme und GitHub Release |

Die Workflows sollen gemeinsame Schritte nach Möglichkeit in wiederverwendbaren Actions oder Composite Actions kapseln. Berechtigungen werden nach dem Least-Privilege-Prinzip vergeben. Der Pages-Workflow benötigt die für Pages vorgesehenen Deployment-Berechtigungen; der Release-Workflow erhält Zugriff auf Signierungs-Secrets nur für vertrauenswürdige Tag-Builds.

---

## 22. Ergänzte Definition of Done

Zusätzlich zu den bisherigen MVP-Abnahmekriterien gilt:

- [ ] Angular-Produktionsbuild wird automatisiert über GitHub Actions erstellt.
- [ ] Web-App ist über GitHub Pages öffentlich erreichbar.
- [ ] Angular Base-Href, Routing, Assets, PWA-Manifest und Service Worker funktionieren unter dem GitHub-Pages-Unterpfad.
- [ ] Pull Requests veröffentlichen keine ungeprüften Änderungen auf GitHub Pages.
- [ ] Ein versionierter Git-Tag kann einen GitHub Release auslösen.
- [ ] Der Release enthält eine signierte, installierbare Android-APK.
- [ ] APK-Signierung erfolgt mit geschützten GitHub Actions Secrets.
- [ ] Keystore und Passwörter sind nicht im Repository enthalten.
- [ ] SHA-256-Prüfsumme der APK wird veröffentlicht.
- [ ] APK wurde vor Veröffentlichung auf einem Android-Gerät installiert und gestartet.


---

## 23. Umsetzungsstand Phase 1 (15.11.2026)

**Status: abgeschlossen und durch GitHub Actions verifiziert.**

Implementierung auf Branch `phase-1/project-foundation`, Pull Request [#1](https://github.com/Danny4927/Saituno/pull/1).

### Gelieferte Grundlage

- Angular 22.2.6 mit Standalone Components und Angular Signals
- Ionic 9.0.11 und Capacitor 8.6.2
- TypeScript 6.0.3 und Node.js 26
- Striktes TypeScript-/Angular-Template-Checking
- Hash-Routing für GitHub Pages
- PWA-Manifest und Angular Service Worker
- Capacitor-Projekte für Android und iOS unter `android/` und `ios/`
- README, MIT-Lizenz, .gitignore und npm-Lockfile

### Tests und Qualitätssicherung

- Vitest für Unit-Tests
- Playwright für Browser-E2E-Tests und Screenshot-basierte Visual Regression
- GitHub Actions für Formatprüfung, npm Audit, Unit-Tests, Produktionsbuild und Playwright
- npm Audit nach Aktualisierung von Vitest: keine bekannten Sicherheitslücken
- Initialer Screenshot-Baseline ist im Repository vorhanden

### Verifizierte Abnahme

- [x] `npm ci` erfolgreich
- [x] Prettier-Prüfung erfolgreich
- [x] Vitest: 2 Tests bestanden
- [x] Angular-Produktionsbuild erfolgreich
- [x] Playwright E2E- und Screenshot-Test erfolgreich
- [x] npm Audit: 0 bekannte Sicherheitslücken
- [x] Capacitor Android-Projekt erfolgreich generiert
- [x] Capacitor iOS-Projekt erfolgreich generiert
- [x] Native Scaffold Workflow erfolgreich
- [x] CI Workflow erfolgreich

### Bewusste Abgrenzung

Die Startansicht ist aktuell ein UI-Grundgerüst und noch kein nutzbares Stimmgerät. Mikrofonzugriff, AudioWorklet, Pitch Detection und die eigentliche Tuner-Oberfläche gehören zu Phase 2 und den folgenden Phasen. GitHub Pages Deployment und Release-Automatisierung sind ebenfalls noch nicht eingerichtet.


---

## 24. Umsetzungsstand Phase 2 – Audio-Prototyp (15.11.2026)

**Status: Implementiert; reale Gerätetests und Messwerte stehen noch aus.**

### Implementiert

- Mikrofonzugriff nach bewusster Nutzeraktion über `getUserMedia()`
- AudioContext mit interaktiver Latenz
- AudioWorklet mit Mono-Mix, 4:1-Decimation und überlappendem Analysefenster
- YIN-Differenzfunktion, CMND, Parabel-Interpolation und Confidence-Ausgabe
- RMS-Gate für Stille und zu schwache Signale
- Frequenz-zu-Noten-/Oktav-/Cent-Berechnung auf Basis A4 = 440 Hz
- Median-Glättung über bis zu fünf Messwerte
- Angular Signals für Audiozustand und aktuelle Messung; keine Signalupdates pro Sample
- Stop-/Cleanup-Pfad für AudioNodes, MediaStream-Tracks und AudioContext
- Berechtigungs-, fehlendes Mikrofon-, unsupported- und Fehlerzustände
- Erster Live-Audio-Prototyp auf der Startansicht

### Technische Parameter des Prototyps

- Frequenzbereich: 25–1.500 Hz (damit auch tiefe H-Saite um 30,9 Hz erfasst werden kann)
- 4:1-Decimation; bei 48 kHz Gerätesamplerate wird mit 12 kHz analysiert
- Analysefenster: 2.048 Samples (ca. 171 ms bei 12 kHz)
- Hop: 512 Samples (ca. 43 ms; theoretisch ca. 23,4 Updates/s)
- YIN-Threshold: 0,15
- Mindest-RMS: 0,004

Die Zeiten sind aus Fenster- und Hop-Größe abgeleitet, keine gemessenen Ende-zu-Ende-Latenzen. Die Werte müssen mit echten Instrumenten und Mikrofonen validiert werden.

### Automatisierte Tests

- Synthetische Frequenzen von tiefer Bass-H-Saite bis 1.500 Hz
- Mehrere Samplerates
- Dominante zweite Harmonische
- Deterministisches Hintergrundrauschen
- Stille, zu schwaches Signal, ungültige Samplerate und zu kurze Fenster
- Notenname, Oktave, Cent-Abweichung und Referenzfrequenz
- Berechtigungsfehler und fehlendes Mikrofon
- Playwright-Idle-Ansicht mit Visual Regression

### Noch offen

- [ ] Messungen mit echten Instrumenten und kalibrierter Referenz
- [ ] Chrome, Safari und Firefox
- [ ] Android Chrome und native Capacitor-App
- [ ] iOS Safari und native Capacitor-App
- [ ] Genauigkeit in Cent, erste Reaktionszeit und Stabilisierung dokumentieren
- [ ] Audio-Unterbrechungen, App-Backgrounding und Gerätewechsel validieren

Die verbindliche Testmatrix steht in `docs/PHASE_2_TEST_MATRIX.md`; technische Details und bekannte Einschränkungen in `docs/audio-engine.md`.


---

## 25. Umsetzungsstand Phase 4 – Instrumente und Stimmungen (15.11.2026)

**Status: Implementiert; CI und Native Scaffold erfolgreich.**

### Enthaltene Presets

| Instrument | Stimmungen |
|---|---|
| Gitarre | E Standard, Drop D, Eb Standard, D Standard |
| Ukulele | Standard High G, Low G |
| Bass | 4-Saiter Standard, 5-Saiter Standard, 6-Saiter Standard, BEAD, Drop D |

### Architektur

- Instrumente und Stimmungen liegen zentral in `src/app/domain/tuner/tuning-catalog.ts`.
- Sollfrequenzen werden aus MIDI-Notennummern und A4 = 440 Hz berechnet.
- Die Saitenerkennung arbeitet auf dem jeweils aktiven Preset.
- Die Audio-Engine und der YIN-Worklet bleiben instrumentunabhängig.
- Neue Presets benötigen keine Änderung an der Audio-Infrastruktur.

### Qualitätssicherung

- Unit-Tests für alle Instrumente, Presets und Frequenzwerte.
- Playwright-Test für Wechsel zwischen Instrumenten und Stimmungen.
- Visual Regression Baseline für die neue Auswahloberfläche.
- npm install-script approvals sind auf die konkret geprüften Paketversionen begrenzt.
- GitHub Actions werden auf Node.js-24-kompatible Versionen aktualisiert.

### Weiterhin offen

- [ ] Reale Stimmtests für alle Instrumente und Stimmungen.
- [ ] Genauigkeit und Reaktionszeit auf echten Geräten dokumentieren.
- [ ] Android- und iOS-Audio-Lifecycle testen.

---

## 26. Umsetzungsstand Phase 5 – Plattformintegration (15.11.2026)

**Status: Implementierung gemerged; reale Plattformabnahme offen.**

- Einstellungen für Instrument, Stimmung, Auswahlmodus und manuelle Saite werden lokal gespeichert.
- Web verwendet localStorage; native Plattformen nutzen Capacitor Preferences mit WebView-Fallback.
- Gespeicherte Werte werden validiert; ungültige oder nicht verfügbare Storage-Werte führen zu sicheren Standardwerten.
- Bei Backgrounding/Pagehide werden Mikrofon-Tracks gestoppt, AudioContext geschlossen und Messwerte zurückgesetzt.
- Beim Zurückkehren ist eine bewusste Nutzeraktion zur Reaktivierung erforderlich.
- Service Worker cached App-Shell und AudioWorklet-Ressource.
- Unit- und Playwright-Tests prüfen Persistenz und Background-Pause in Chromium und Firefox.

**Offene Abnahme:** Physische Android-/iOS-Tests (Berechtigungen, App-Wechsel, Sperrbildschirm, Audio-Unterbrechungen), Web-Offline-Reload auf Endgeräten und kalibrierte Messung von Genauigkeit/Latenz.

## 27. Phase 6 – Release-Vorbereitung: Abnahmekriterien

Die konkrete Checkliste wird in `docs/PHASE_6_RELEASE_CHECKLIST.md` gepflegt. Kein Release darf Audioqualität, Store-/Markenfreigabe oder physische Plattformtests als erfolgreich bezeichnen, solange die jeweiligen Nachweise fehlen.
