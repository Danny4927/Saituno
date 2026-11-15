# Phase 5 – Platform integration

## Scope

Phase 5 hardens Saituno for repeat use as a web app or a Capacitor app.

### Local settings

- Persist instrument, tuning, selection mode and manually selected string through @capacitor/preferences.
- Use browser localStorage for the web app and native Preferences storage on Android/iOS.
- Load and validate stored settings before bootstrapping the Angular application.
- Fall back to safe defaults if storage is unavailable or contains outdated/invalid values.
- Never store microphone samples or pitch measurements.

### Audio lifecycle and privacy

- Stop microphone tracks and close the AudioContext when the document becomes hidden or receives pagehide.
- Clear the current pitch measurement when backgrounding.
- Require an explicit user gesture to start the microphone again after returning to the app.
- Show a distinct paused state and an explicit reactivation action.
- Do not keep the microphone active in the background.

### Offline behavior

The Angular service worker prefetches the application shell, JavaScript, CSS, manifest, icons and AudioWorklet module. This lets the web app load offline after its first successful installation. Native Capacitor builds bundle the same web assets locally.

## Verification

- Unit tests cover settings defaults, persistence, validation and storage failures.
- Audio service tests cover stopping the microphone on a background transition.
- Playwright verifies that settings survive a reload and that backgrounding pauses the microphone.
- Chromium and Firefox run the browser E2E suite.

## Remaining device validation

Automated browser tests do not replace physical-device tests. Before calling Phase 5 complete, validate:
- Android: grant/deny/revoke microphone permission, background/foreground, screen lock and audio interruption.
- iOS: microphone permission, app switcher, screen lock and audio interruption.
- Web: offline reload after first visit and microphone reactivation after switching tabs.
- Confirm that returning to the app never starts the microphone without a fresh user action.
