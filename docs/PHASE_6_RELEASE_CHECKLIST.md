# Phase 6 – Release preparation checklist

This checklist separates automated repository checks from manual platform acceptance. A green CI run is not proof of physical microphone accuracy or native-device behavior.

## 1. Current baseline (15 November 2026)

- [x] Phases 1–5 merged into `main`.
- [x] Angular production build and automated unit tests are part of CI.
- [x] Playwright E2E coverage runs in Chromium and Firefox.
- [x] GitHub Pages deployment workflow exists.
- [x] Capacitor Android and iOS projects are present.
- [x] Local tuner settings persist; backgrounding stops audio capture.
- [ ] Physical Android/iOS acceptance is not yet documented.
- [ ] Calibrated pitch-accuracy and end-to-end latency results are not yet documented.

## 2. Automated release gates

- [ ] Formatting check passes on the exact release commit (CI gate configured).
- [ ] Unit tests pass on the exact release commit (CI gate configured).
- [ ] Playwright E2E and visual-regression tests pass in Chromium and Firefox (CI gate configured).
- [ ] Production web build passes with the GitHub Pages base path (Pages workflow).
- [ ] Native web build and Capacitor sync complete (native workflow).
- [ ] Dependency audit is reviewed; any accepted finding has a documented reason and owner.
- [ ] PWA manifest, SVG app icon, service-worker cache and offline shell are checked in the production deployment.
- [ ] Keyboard navigation and automated accessibility checks have no unresolved critical violations.

## 3. Manual device acceptance

Record device model, OS version, browser/WebView version, test date and outcome for every row. Do not mark a row complete without recording observations.

| Platform | Permission flow | Foreground/background | Screen lock/interruption | Offline | Pitch/latency |
|---|---|---|---|---|---|
| Chrome desktop | [ ] | [ ] | n/a | [ ] | [ ] |
| Firefox desktop | [ ] | [ ] | n/a | [ ] | [ ] |
| Safari macOS/iOS | [ ] | [ ] | [ ] | [ ] | [ ] |
| Android Chrome | [ ] | [ ] | [ ] | [ ] | [ ] |
| Android Capacitor | [ ] | [ ] | [ ] | [ ] | [ ] |
| iOS Safari | [ ] | [ ] | [ ] | [ ] | [ ] |
| iOS Capacitor | [ ] | [ ] | [ ] | [ ] | [ ] |

For each guitar, ukulele and bass preset used during validation, record:
- string and reference frequency from a calibrated source;
- measured frequency and cent error after stabilization;
- time from pluck to first valid reading;
- time until the displayed pitch remains within ±2 cents;
- behavior with weak plucks, normal plucks, decay and background noise.

Use a signal generator or calibrated reference. A phone speaker alone is not a sufficient calibration source. Do not claim the ±2-cent target or sub-150-ms latency goal unless measured results support it.

## 4. Accessibility and UX

- [x] Primary tuner controls have keyboard focus and visible focus styling (automated browser coverage).
- [x] Instrument, tuning and string controls have programmatic labels (automated browser coverage).
- [ ] Tuner state is not communicated by color alone.
- [x] High-frequency cent readout removed from live announcements; categorical tuner status remains announced. Manual screen-reader review remains open.
- [ ] Contrast meets the selected WCAG target in light and dark themes.
- [ ] Reduced-motion preference is respected.
- [ ] Layout is checked at narrow mobile, tablet and desktop viewports.
- [ ] Permission denied, no microphone, no signal, paused and error states explain the next action.

## 5. Native release readiness

- [x] App name and package/bundle identifiers are set; app version aligned to 0.1.0. Revisit before public launch.
- [x] Web SVG icon, Android launcher/adaptive icon and Android/iOS splash assets are present; visual device review remains open.
- [x] Reproducible Android build workflow and protected release-signing configuration are implemented; signing still requires repository secrets.
- [ ] Configure Android signing secrets and create a secure offline keystore backup; never commit credentials.
- [ ] APK signature is verified and SHA-256 checksum is generated.
- [ ] APK is installed and smoke-tested on a physical Android device.
- [x] iOS Simulator build is automated; App Store/TestFlight signing and distribution remain dependent on Apple credentials.
- [ ] Native permission descriptions accurately explain microphone use and local-only processing.

## 6. Open-source and release hygiene

- [ ] README accurately reflects the current implementation and known limitations.
- [ ] MIT license and third-party notices are present and reviewed.
- [ ] Changelog and release notes list user-visible changes and known limitations.
- [ ] Version tag, app version and release asset names match.
- [x] Release workflow is tag-only and uses `contents: write`; signing secrets are required before publishing.
- [ ] Brand, domain and store-name availability are reviewed separately; the project name is not a trademark clearance.

## 7. Release decision

Release readiness is **blocked** while mandatory physical device checks, calibrated audio measurements, signing setup or critical accessibility/security issues remain open. Automated CI success is necessary but not sufficient.

A release candidate may be produced for internal testing before all public-release gates are complete, but it must be labelled as an internal/beta build and must not claim unverified platform support or accuracy.
