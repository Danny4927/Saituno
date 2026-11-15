# Saituno – Projekt- und Architekturplan

**Produkt:** Saituno  
**Untertitel:** Open Source Instrument Tuner  
**Zielplattformen:** Web, Android und iOS  
**Projektstatus:** Planung / MVP-Vorbereitung

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

Die genannten Versionen sind die Ziel-Major-Versionen aus der Planungsphase. Vor Projektinitialisierung müssen die dann aktuellen stabilen Patch-Versionen und offiziellen Kompatibilitätsmatrizen geprüft werden. Keine Release Candidates oder Betaversionen für produktive Abhängigkeiten verwenden. Node.js 24 LTS verwenden, sofern es von der gewählten Angular-Version unterstützt wird. Abhängigkeiten über Lockfile fixieren.

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
| Messbereich | ca. 35–1.500 Hz |
| Anzeigeauflösung | 1 Cent |
| Zielgenauigkeit | ±2 Cent |
| Aktualisierung | 20–30 Messungen/s |
| Reaktionszeit | Ziel unter 150 ms |
| Stabilisierung | Ziel unter 500 ms |

Diese Werte sind Entwicklungsziele und müssen durch Messungen validiert werden. Tiefe Bassfrequenzen erfordern längere Analysefenster; Genauigkeit und Reaktionsgeschwindigkeit sind abzuwägen. Unterstützung tiefer Frequenzen unterhalb 35 Hz wird anhand des Bass-Anwendungsfalls geprüft.

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

- Mikrofonzugriff implementieren.
- AudioContext und AudioWorklet einrichten.
- YIN implementieren.
- Frequenz- und Cent-Berechnung implementieren.
- Confidence-Bewertung ergänzen.
- Synthetische Testsignale erzeugen.
- Auf echten Geräten testen.

**Abnahme:** Einzelne Töne werden auf den unterstützten Plattformen zuverlässig erkannt. Qualitätsziele werden dokumentiert und gemessen.

### Phase 3 – Tuner-Oberfläche

- Tuner-Ansicht erstellen.
- Tonname und Frequenz anzeigen.
- Cent-Skala implementieren.
- Zu-tief-/Gestimmt-/Zu-hoch-Zustände.
- Automatische und manuelle Saitenauswahl.
- Fehler- und Berechtigungszustände.

**Abnahme:** Ein Instrument kann über eine verständliche Oberfläche gestimmt werden.

### Phase 4 – Instrumente und Stimmungen

- Gitarren-Konfigurationen.
- Ukulele-Konfigurationen.
- Bass-Konfigurationen.
- Datengetriebene Stimmungsverwaltung.
- Instrument- und Stimmungsauswahl.

**Abnahme:** Alle definierten MVP-Instrumente und Stimmungen funktionieren.

### Phase 5 – Plattformintegration

- Capacitor-Konfiguration vervollständigen.
- Mikrofonberechtigungen.
- Offline-Funktionalität.
- Lokale Speicherung.
- Audio-Unterbrechungen behandeln.
- Plattformtests durchführen.

**Abnahme:** Die App funktioniert auf Web, Android und iOS auch ohne Internetverbindung.

### Phase 6 – Release

- Performance-Optimierung.
- Accessibility-Prüfung.
- Dark- und Light-Mode finalisieren.
- App-Icons und Splashscreens.
- Dokumentation.
- Lizenz und Open-Source-Repository.
- Web-Deployment.
- Android- und iOS-Release-Builds.

**Abnahme:** Ein reproduzierbarer Release-Kandidat liegt vor.

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

Phase 1 vorbereiten und anschließend einen kleinen Audio-Prototyp entwickeln. Die vollständige Tuner-Oberfläche wird erst ausgebaut, wenn die Audioverarbeitung auf Web, Android und iOS nachweislich funktioniert.
