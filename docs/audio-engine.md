# Saituno Audio Engine – Phase 2 Prototype

## Goal and scope

The Phase 2 prototype validates monophonic pitch detection from a live microphone stream. It is not yet the finished tuner UI and does not select an instrument or string. It targets approximately 25–1,500 Hz so that the low B string of a five- or six-string bass (about 30.9 Hz) is included.

All microphone samples are processed locally in the browser/WebView. No audio is recorded, persisted, uploaded, or sent to a server.

## Processing pipeline

```text
User gesture
  -> getUserMedia(audio, no echo cancellation/noise suppression/AGC)
  -> AudioContext (interactive latency)
  -> AudioWorklet
  -> mono mix + 4:1 box-filtered decimation
  -> 2,048-sample analysis window, 512-sample hop
  -> YIN difference / cumulative mean normalized difference
  -> confidence and RMS gate
  -> median of up to 5 recent frequency estimates
  -> frequency -> nearest MIDI note + target frequency + cents
  -> Angular Signals -> prototype view
```

The worklet runs outside Angular. It sends at most one result per 512 decimated samples. At a 48 kHz device sample rate the worklet analyzes at 12 kHz and sends approximately 23.4 updates per second. Angular signals are updated only when these analysis messages arrive, never for individual audio samples.

The initial 2,048-sample window represents about 171 ms at 12 kHz. That is a deliberate trade-off for low bass frequencies; the first valid estimate therefore cannot be expected before the initial window has filled. The 512-sample hop gives subsequent updates roughly every 43 ms. These are design-derived timings, not measured end-to-end latency claims.

## YIN estimator

The implementation lives in `public/worklets/yin-processor.js`. The same exported `estimatePitch` function is imported by Vitest and called by the AudioWorklet, avoiding a second, divergent test implementation.

The estimator:

- rejects invalid sample rates, short buffers and low-RMS input;
- calculates the YIN difference function and cumulative mean normalized difference;
- selects a minimum under a configurable threshold, with a bounded fallback;
- selects the period with the CMND curve and refines the sub-sample period with parabolic interpolation on the raw difference curve;
- returns frequency, confidence and RMS, or `null` when the signal is unsuitable.

The current defaults are 25–1,500 Hz, a YIN threshold of 0.15 and a minimum RMS of 0.004. These are prototype parameters and need validation with real instrument recordings and devices.

## Browser and native lifecycle

The Android manifest declares `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS`. Capacitor's Android WebChromeClient handles the WebView media-capture permission request and asks Android for the corresponding runtime permission. The iOS app declares `NSMicrophoneUsageDescription` in `Info.plist`; iOS requires this purpose string before microphone access. The user-facing text explains local pitch analysis and explicitly says audio is neither recorded nor transmitted.

The AudioContext is created and resumed directly from the user's button gesture before awaiting the microphone permission prompt. This avoids delaying the browser's audio activation until after an asynchronous permission request.

`AudioService` owns the microphone stream, AudioContext, source node, worklet node and silent output connection. Start is only called from the user's button action. Stop disconnects nodes, stops every MediaStream track and closes the AudioContext.

The worklet node is connected through a zero-gain node to the AudioContext destination so the browser continues processing it without audible microphone monitoring.

The service exposes readonly Signals for status, the latest pitch measurement and a user-facing error. It maps permission denial and missing input devices to distinct states. AudioWorklet module URLs are resolved relative to `document.baseURI`, so the GitHub Pages repository subpath and Capacitor's root path can both be used.

## Musical conversion

`pitch-math.ts` converts frequency to the nearest MIDI note using A4 = 440 Hz:

- MIDI note: `69 + 12 * log2(frequency / 440)`
- cents: `100 * (exact MIDI note - nearest MIDI note)`
- target frequency: `440 * 2 ** ((nearest MIDI note - 69) / 12)`

The reference frequency is a function parameter and can later be connected to the settings feature.

## Test coverage

Vitest covers:

- bass low B and common guitar/bass/ukulele frequencies;
- multiple sample rates;
- a stronger second harmonic than fundamental;
- deterministic low-level background noise;
- silence, low RMS, invalid sample rates and short buffers;
- note naming, octave, target frequency, cents and custom reference frequency.

Playwright verifies the deterministic idle UI and its screenshot baseline. Browser E2E tests do not request a real microphone; real microphone validation is a manual/device test.

## Known limitations / next validation

- The YIN thresholds and RMS gate have not yet been tuned against a representative set of real guitars, basses, ukuleles and mobile microphones.
- Median smoothing may trade response time for stability; measure this on real devices.
- Background noise, pluck transients, string decay, clipping and harmonic-rich tones need broader testing.
- Browser permissions and AudioWorklet behavior must be tested in Chrome, Safari, Firefox, Android WebView and iOS WKWebView.
- Audio interruptions, app backgrounding, device changes and context suspension need lifecycle handling.
- The current prototype shows the nearest chromatic note only. Instrument-specific string targets and the finished cents gauge belong to Phase 3/4.

Do not claim the Phase 2 acceptance criteria are complete until the browser and real-device validation matrix has been run and the measured accuracy/latency results have been recorded.
