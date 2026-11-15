# Saituno

**A simple, free tuner for guitar, bass and ukulele.**

Saituno is an open-source, privacy-first instrument tuner. The application is designed to run locally in the browser or as a native Android/iOS app. There is no backend, account system, analytics, advertising or audio upload.

> **Project status (15 November 2026):** Phases 1–5 are implemented and merged. Phase 6 release preparation is in progress. Physical-device validation (Android/iOS), calibrated accuracy/latency measurements and release hardening remain open. See the [Phase 5 platform validation](docs/phase-5-platform-integration.md) and [Phase 6 release checklist](docs/PHASE_6_RELEASE_CHECKLIST.md).

## Technology

- Angular 22.2.6 with standalone components and Angular Signals
- Ionic 9.0.11
- Capacitor 8.6.2
- TypeScript 6.0.x
- Angular Service Worker for offline app assets, including the AudioWorklet processor
- Vitest for unit tests
- Playwright for browser end-to-end and screenshot-based visual regression tests
- GitHub Actions for continuous integration

Node.js 26 LTS is required. The exact framework versions are pinned in `package.json`; `.nvmrc` selects Node 26.

## Development

```bash
nvm use
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

Useful commands:

| Command | Description |
| --- | --- |
| `npm run build` | Development/default Angular build |
| `npm run build:production` | Production web build |
| `npm run build:pages` | Production build for the GitHub Pages repository path |
| `npm run build:native` | Production build with a root base path for Capacitor |
| `npm run build:native:android` | Build web assets and synchronize Capacitor Android |
| `npm run build:native:ios` | Build web assets and synchronize Capacitor iOS |
| `npm run lint` | Check source formatting |
| `npm test` | Run unit tests with Vitest |
| `npm run test:e2e` | Run Playwright browser tests |

## Native projects

The Capacitor Android and iOS projects are included in `android/` and `ios/`. Capacitor is configured in `capacitor.config.ts`.

After changing web assets or dependencies, synchronize the native projects:

```bash
npm run build:native
npm run native:sync
```

Open the Android project in Android Studio with `npx cap open android`. On macOS with Xcode installed, open the iOS project with `npx cap open ios`.

Android builds require the Android SDK and JDK 21. iOS builds require macOS and Xcode. Native signing credentials must never be committed to this repository. The `Native platform builds` workflow compiles an Android debug APK and an iOS Simulator build for pull requests and pushes to `main`.

## Releases

Version tags use the `vMAJOR.MINOR.PATCH` format and must match `package.json` (currently `v0.1.0`). Pushing a matching tag starts the Android release workflow. Before creating a public release, configure these repository or environment secrets:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded release keystore (`base64 -w 0 release.jks`)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The workflow signs and verifies the APK, generates a SHA-256 checksum and attaches both files to the GitHub Release. Never use a debug keystore for public releases. Without these secrets the release job intentionally fails instead of publishing an unsigned APK. iOS is compiled for the Simulator in CI; App Store/TestFlight distribution still requires Apple signing certificates, provisioning and account credentials, which are not stored in this repository.

## PWA

The web app includes a web manifest and Angular service-worker configuration. The production build registers the service worker; development mode does not. The manifest uses relative start and scope URLs so it can be hosted below a repository path.

## Instruments and tunings

The tuner includes data-driven presets for:
- Guitar: E Standard, Drop D, Eb Standard and D Standard
- Ukulele: Standard High G and Low G
- Bass: 4-, 5- and 6-string Standard, BEAD and Drop D

Instrument and tuning selection share the same pitch-detection engine. New presets can be added to `src/app/domain/tuner/tuning-catalog.ts` without changing the audio processor.

## Audio prototype

The microphone is accessed only after the user presses the start button. Audio is processed locally with Web Audio API, AudioWorklet and YIN pitch estimation. The prototype reports the nearest note, octave, frequency and cents relative to A4 = 440 Hz. It currently targets approximately 25–1,500 Hz, including the low B string of a six-string bass.

No microphone audio is recorded, stored or transmitted. See [docs/audio-engine.md](docs/audio-engine.md) for the processing pipeline and known limitations, and [docs/PHASE_2_TEST_MATRIX.md](docs/PHASE_2_TEST_MATRIX.md) for the outstanding real-device validation.

## Architecture principles

- Keep domain logic independent from Angular, Ionic and Capacitor.
- Use Angular Signals for application and UI state.
- Keep audio processing outside Angular's UI update loop.
- Do not transmit or persist microphone audio.
- Keep core tuning functionality available offline.
- Do not add tracking, advertising, monetization or account requirements.

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the product scope, architecture, phases and acceptance criteria. User-visible changes are tracked in [CHANGELOG.md](CHANGELOG.md).

## License

MIT. See [LICENSE](LICENSE).
