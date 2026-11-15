# Changelog

All notable user-facing changes to Saituno are documented here.

The format follows Keep a Changelog. Versions follow Semantic Versioning.

## [0.1.0] - Unreleased

### Added
- Browser-based instrument tuner for guitar, ukulele and bass.
- Local microphone processing with Web Audio API, AudioWorklet and YIN pitch detection.
- Local persistence for instrument, tuning and string-selection preferences.
- Offline-capable web app shell and Capacitor Android/iOS projects.
- Automated browser tests and native Android/iOS build validation.
- Tag-triggered Android APK release workflow with protected signing and SHA-256 checksum.

### Improved
- Keyboard navigation, visible focus, tuner labels and screen-reader announcements.
- App metadata, PWA icon declaration and native app version consistency.

### Known limitations
- Physical Android/iOS microphone and lifecycle acceptance is still pending.
- Pitch accuracy and end-to-end latency have not yet been measured against calibrated equipment.
- Full manual WCAG/screen-reader review is pending.
- Android public release requires configuring the documented keystore secrets.
- iOS App Store/TestFlight distribution requires Apple signing credentials and provisioning.
