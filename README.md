# Saituno

**A simple, free tuner for guitar, bass and ukulele.**

Saituno is an open-source, privacy-first instrument tuner. The application is designed to run locally in the browser or as a native Android/iOS app. There is no backend, account system, analytics, advertising or audio upload.

> **Project status:** Phase 3 tuner interface implemented. The current interactive tuner supports automatic and manual string selection for six-string guitar in E standard tuning. Phase 2 real-device accuracy and latency measurements remain pending.

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

Android builds require the Android SDK and a supported JDK/Gradle environment. iOS builds require macOS and Xcode. Native signing credentials must never be committed to this repository.

## PWA

The web app includes a web manifest and Angular service-worker configuration. The production build registers the service worker; development mode does not. The manifest uses relative start and scope URLs so it can be hosted below a repository path.

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

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the product scope, architecture, phases and acceptance criteria.

## License

MIT. See [LICENSE](LICENSE).
