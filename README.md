# Saituno

**A simple, free tuner for guitar, bass and ukulele.**

Saituno is an open-source, privacy-first instrument tuner. The application is designed to run locally in the browser or as a native Android/iOS app. There is no backend, account system, analytics, advertising or audio upload.

> **Project status:** Foundation / Phase 1. The current screen is a project shell; microphone access and pitch detection are planned for Phase 2.

## Technology

- Angular 22.2.6 with standalone components and Angular Signals
- Ionic 9.0.11
- Capacitor 8.6.2
- TypeScript 6.0.x
- Angular Service Worker for the PWA foundation
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

Capacitor is configured in `capacitor.config.ts`. Generate the platform projects after installing dependencies:

```bash
npm run build:native
npm run native:add:android
npm run native:sync
```

For iOS, run the following on macOS with Xcode installed:

```bash
npm run build:native
npm run native:add:ios
npm run native:sync
```

Android builds require the Android SDK and a supported JDK/Gradle environment. iOS builds require macOS and Xcode. Native signing credentials must never be committed to this repository.

## PWA

The web app includes a web manifest and Angular service-worker configuration. The production build registers the service worker; development mode does not. The manifest uses relative start and scope URLs so it can be hosted below a repository path.

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
