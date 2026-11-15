import { Component, computed, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { AudioService } from '../../core/audio/audio.service';
import { APP_NAME, APP_TAGLINE } from '../../shared/app-info';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content [fullscreen]="true">
      <main class="landing">
        <header class="topbar">
          <a class="brand" href="/" aria-label="Saituno Startseite">
            <span class="brand-mark" aria-hidden="true">S</span>
            <span>{{ appName() }}</span>
          </a>
          <span class="version-label">OPEN SOURCE · FREE</span>
        </header>

        <section class="hero" aria-labelledby="hero-title">
          <div class="eyebrow">
            <span class="status-dot" aria-hidden="true"></span>
            Dein Sound. Dein Tune.
          </div>
          <h1 id="hero-title">Klingt nach<br /><span>deinem Ton.</span></h1>
          <p class="intro">{{ tagline() }}</p>

          <section class="tuner-preview" aria-label="Audio-Prototyp" data-testid="tuner-panel">
            <div class="preview-topline">
              <span>SAITUNO TUNER · PROTOTYP</span>
              <span class="preview-live" [class.is-listening]="isListening()">
                <span></span>{{ statusLabel() }}
              </span>
            </div>

            @if (measurement(); as result) {
              <div class="note-display" data-testid="detected-note" aria-live="polite">
                <span class="note-letter">{{ result.note }}</span>
                <span class="note-octave">{{ result.octave }}</span>
              </div>
              <div class="pitch-details">
                <strong>{{ result.frequency.toFixed(1) }} Hz</strong>
                <span [class.pitch-flat]="result.cents < -2" [class.pitch-sharp]="result.cents > 2">
                  {{ result.cents > 0 ? '+' : '' }}{{ result.cents.toFixed(0) }} Cent
                </span>
              </div>
              <div class="meter" aria-hidden="true">
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
              </div>
              <p class="preview-caption">
                Ziel {{ result.targetFrequency.toFixed(2) }} Hz
                <span>·</span>
                {{ (result.confidence * 100).toFixed(0) }} % Confidence
              </p>
            } @else {
              <div class="note-display" data-testid="no-pitch">
                <span class="note-letter">—</span>
              </div>
              <div class="meter" aria-hidden="true">
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick active"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
                <span class="meter-tick"></span>
              </div>
              <p class="preview-caption">Einzelne Saite anschlagen</p>
            }

            <p class="audio-feedback" role="status" aria-live="polite">
              {{ statusMessage() }}
            </p>
            <button
              class="tuner-button"
              type="button"
              data-testid="tuner-toggle"
              [disabled]="status() === 'requesting'"
              (click)="toggleAudio()"
            >
              @if (status() === 'requesting') {
                Mikrofon wird gestartet …
              } @else if (isListening()) {
                Stimmgerät stoppen
              } @else {
                Mikrofon aktivieren
              }
            </button>
          </section>

          <p class="coming-soon">Audio-Prototyp · Phase 2</p>
          <p class="supporting">
            Die Tonerkennung läuft lokal auf deinem Gerät. Es werden keine Audiodaten übertragen.
          </p>
        </section>

        <footer class="footer">
          <span>© {{ currentYear() }} {{ appName() }}</span>
          <span>{{ statusLabel() }}</span>
        </footer>
      </main>
    </ion-content>
  `,
  styleUrl: './home.page.scss'
})
export class HomePage {
  private readonly audio = inject(AudioService);

  readonly appName = signal(APP_NAME);
  readonly tagline = signal(APP_TAGLINE);
  readonly currentYear = signal(new Date().getFullYear());
  readonly status = this.audio.status;
  readonly measurement = this.audio.measurement;
  readonly isListening = computed(() => this.status() === 'listening');
  readonly statusLabel = computed(() => (this.isListening() ? 'LIVE' : 'READY'));
  readonly statusMessage = computed(() => {
    switch (this.status()) {
      case 'requesting':
        return 'Bitte erlaube den Mikrofonzugriff.';
      case 'listening':
        return this.measurement()
          ? 'Ton erkannt – spiele die Saite einzeln.'
          : 'Ich höre zu. Spiele eine einzelne Saite an.';
      case 'unsupported':
        return 'Dein Browser unterstützt AudioWorklet oder Mikrofonzugriff nicht.';
      case 'permission-denied':
      case 'no-input':
      case 'error':
        return this.audio.errorMessage() ?? 'Audio konnte nicht gestartet werden.';
      default:
        return 'Mikrofon erst aktivieren, wenn du stimmen möchtest.';
    }
  });

  toggleAudio(): void {
    if (this.isListening()) {
      void this.audio.stop();
    } else {
      void this.audio.start();
    }
  }
}
