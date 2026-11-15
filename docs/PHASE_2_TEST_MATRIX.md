# Phase 2 – Audio validation matrix

The following checks are required before Phase 2 can be declared complete.

| Target | Input | Measurement | Status |
|---|---|---|---|
| Unit | Synthetic 30.87 Hz (low B) | Frequency error / confidence | Automated |
| Unit | Synthetic 41.20–1,500 Hz | Frequency error / confidence | Automated |
| Unit | Harmonic-rich 110 Hz | Fundamental selected | Automated |
| Unit | Deterministic noise | Valid pitch retained | Automated |
| Unit | Silence / low RMS | No pitch | Automated |
| Web Chrome | Guitar, ukulele, bass | Error in cents, first result latency, stable latency | Pending device test |
| Web Safari | Guitar, ukulele, bass | Error in cents, first result latency, stable latency | Pending device test |
| Web Firefox | Guitar, ukulele, bass | Error in cents, first result latency, stable latency | Pending device test |
| Android Chrome | Guitar, ukulele, bass | Error in cents, first result latency, interruptions | Pending device test |
| Android Capacitor | Guitar, ukulele, bass | Error in cents, first result latency, interruptions | Pending device test |
| iOS Safari | Guitar, ukulele, bass | Error in cents, first result latency, interruptions | Pending device test |
| iOS Capacitor | Guitar, ukulele, bass | Error in cents, first result latency, interruptions | Pending device test |

For each real-device test, record:

- device model and OS version;
- browser/WebView version;
- instrument and reference pitch;
- measured frequency and cents error against a calibrated reference;
- time from pluck to first valid result;
- time until the displayed pitch remains within ±2 cents;
- microphone permission and interruption behavior.

Do not use a phone speaker tone as the only calibration reference. Prefer a signal generator or calibrated reference tone and repeat measurements across strings and pluck strengths.
