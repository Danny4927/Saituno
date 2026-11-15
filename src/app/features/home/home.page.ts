import { Component, computed, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { AudioService } from '../../core/audio/audio.service';
import { SettingsService } from '../../core/settings/settings.service';
import {
  centsFromTarget,
  closestString,
  getInstrument,
  getTuning,
  INSTRUMENTS,
  type InstrumentDefinition,
  type TuningPreset,
  type TuningString
} from '../../domain/tuner/tuning-catalog';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content [fullscreen]="true">
      <main class="app-shell">
        <header class="topbar">
          <a class="brand" href="/" aria-label="Saituno Startseite">
            <span class="brand-mark" aria-hidden="true">S</span><span>Saituno</span>
          </a>
          <span class="privacy-label"><span class="privacy-dot"></span> LOKAL & PRIVAT</span>
        </header>
        <section class="tuner-layout" aria-labelledby="page-title">
          <div class="intro">
            <p class="eyebrow">DEIN INSTRUMENT. DEIN SOUND.</p>
            <h1 id="page-title">Stimm dein<br /><span>Instrument.</span></h1>
            <p class="intro-copy">
              Präzise Rückmeldung in Echtzeit. Schlage eine Saite einzeln an und stimme sie ganz
              entspannt.
            </p>
          </div>
          <section class="tuner-card" aria-label="Stimmgerät" data-testid="tuner-panel">
            <div class="card-header">
              <div>
                <p class="card-kicker">INSTRUMENT</p>
                <h2>
                  {{ activeInstrument().name }}
                  <span class="tuning-name">· {{ activeTuning().name }}</span>
                </h2>
              </div>
              <span class="live-indicator" [class.is-live]="isListening()">
                <span></span>{{ isListening() ? 'LIVE' : 'BEREIT' }}
              </span>
            </div>

            <div class="configuration-row">
              <label class="configuration-field">
                <span>Instrument</span>
                <select
                  aria-label="Instrument auswählen"
                  data-testid="instrument-select"
                  [value]="selectedInstrumentId()"
                  (change)="selectInstrument($event)"
                >
                  @for (instrument of instruments; track instrument.id) {
                    <option [value]="instrument.id">{{ instrument.name }}</option>
                  }
                </select>
              </label>
              <label class="configuration-field">
                <span>Stimmung</span>
                <select
                  aria-label="Stimmung auswählen"
                  data-testid="tuning-select"
                  [value]="selectedTuningId()"
                  (change)="selectTuning($event)"
                >
                  @for (tuning of availableTunings(); track tuning.id) {
                    <option [value]="tuning.id">{{ tuning.name }}</option>
                  }
                </select>
              </label>
            </div>

            <div class="mode-row" aria-label="Saitenauswahl">
              <button
                type="button"
                class="mode-button"
                [class.active]="selectionMode() === 'auto'"
                [attr.aria-pressed]="selectionMode() === 'auto'"
                (click)="setMode('auto')"
                data-testid="auto-mode"
              >
                AUTO
              </button>
              <button
                type="button"
                class="mode-button"
                [class.active]="selectionMode() === 'manual'"
                [attr.aria-pressed]="selectionMode() === 'manual'"
                (click)="setMode('manual')"
                data-testid="manual-mode"
              >
                MANUELL
              </button>
              <span class="mode-hint">{{
                selectionMode() === 'auto'
                  ? 'Saite wird automatisch erkannt'
                  : 'Saite manuell auswählen'
              }}</span>
            </div>

            <div class="string-picker" aria-label="Saite auswählen">
              @for (string of strings(); track string.id + string.label) {
                <button
                  type="button"
                  class="string-button"
                  [class.selected]="activeString()?.id === string.id"
                  [class.manual-selected]="
                    selectionMode() === 'manual' && manualStringId() === string.id
                  "
                  [attr.aria-pressed]="
                    selectionMode() === 'manual' && manualStringId() === string.id
                  "
                  [attr.aria-label]="'Saite ' + string.label + ', ' + string.note + string.octave"
                  (click)="selectString(string.id)"
                  [attr.data-testid]="'string-' + string.id"
                >
                  <span class="string-number">{{ string.label }}</span>
                  <strong>{{ string.note }}</strong>
                  <small>{{ string.octave }}</small>
                </button>
              }
            </div>

            <div
              class="pitch-readout"
              [attr.data-testid]="measurement() ? 'pitch-readout' : 'no-pitch'"
              [class.is-tuned]="isInTune()"
              [class.is-flat]="tuningStatus() === 'flat'"
              [class.is-sharp]="tuningStatus() === 'sharp'"
            >
              <p class="readout-label">{{ readoutLabel() }}</p>
              <div class="note-value">
                <span>{{ activeString() ? activeString()!.note : '—' }}</span>
                @if (activeString()) {
                  <sup>{{ activeString()!.octave }}</sup>
                }
              </div>
              <p class="frequency-value">
                {{
                  measurement() ? measurement()!.frequency.toFixed(1) + ' Hz' : 'Warte auf Signal'
                }}
              </p>
              <div class="tuning-meter" role="img" [attr.aria-label]="meterDescription()">
                <div class="meter-track">
                  <span class="meter-zone left"></span><span class="meter-zone center"></span>
                  <span class="meter-zone right"></span>
                  @for (tick of meterTicks; track tick) {
                    <span
                      class="meter-tick"
                      [class.major]="tick % 10 === 0"
                      [class.center-tick]="tick === 0"
                      [style.left.%]="50 + tick"
                    ></span>
                  }
                  <span class="meter-needle" [style.left.%]="needlePosition()"></span>
                </div>
                <div class="meter-labels">
                  <span>−50</span><span>−25</span><strong>0</strong><span>+25</span
                  ><span>+50 Cent</span>
                </div>
              </div>
              <div class="cent-result" aria-live="polite">
                @if (deviationCents() !== null) {
                  <strong
                    >{{ deviationCents()! > 0 ? '+' : ''
                    }}{{ deviationCents()!.toFixed(0) }}</strong
                  >
                  <span>Cent</span>
                } @else {
                  <strong>—</strong><span>Cent</span>
                }
              </div>
              <p class="status-text" role="status" aria-live="polite" data-testid="tuner-status">
                {{ statusMessage() }}
              </p>
              @if (activeString()) {
                <p class="target-frequency">Soll {{ activeString()!.frequency.toFixed(2) }} Hz</p>
              }
            </div>

            <div class="card-footer">
              <button
                class="start-button"
                type="button"
                data-testid="tuner-toggle"
                [disabled]="status() === 'requesting'"
                (click)="toggleAudio()"
              >
                @if (status() === 'requesting') {
                  Mikrofon wird gestartet …
                } @else if (isListening()) {
                  <span class="stop-icon">■</span> Stimmgerät stoppen
                } @else {
                  <span class="mic-icon">◉</span> Mikrofon aktivieren
                }
              </button>
              <p>Dein Audio bleibt auf diesem Gerät. Keine Aufnahme, kein Upload.</p>
            </div>
          </section>
        </section>
        <footer class="footer">
          <span>SAITUNO · OPEN SOURCE</span><span>© {{ currentYear }}</span>
        </footer>
      </main>
    </ion-content>
  `,
  styleUrl: './home.page.scss'
})
export class HomePage {
  private readonly audio = inject(AudioService);
  private readonly settings = inject(SettingsService);
  readonly instruments = INSTRUMENTS;
  readonly meterTicks = Array.from({ length: 21 }, (_, index) => (index - 10) * 5);
  readonly currentYear = new Date().getFullYear();
  readonly status = this.audio.status;
  readonly measurement = this.audio.measurement;
  readonly inputLevel = this.audio.inputLevel;
  readonly selectionMode = computed(() => this.settings.settings().selectionMode);
  readonly selectedInstrumentId = computed(() => this.settings.settings().instrumentId);
  readonly selectedTuningId = computed(() => this.settings.settings().tuningId);
  readonly manualStringId = computed(() => this.settings.settings().manualStringId);

  readonly activeInstrument = computed<InstrumentDefinition>(
    () => getInstrument(this.selectedInstrumentId()) ?? INSTRUMENTS[0]!
  );
  readonly availableTunings = computed(() => this.activeInstrument().tunings);
  readonly activeTuning = computed<TuningPreset>(
    () =>
      getTuning(this.selectedInstrumentId(), this.selectedTuningId()) ?? this.availableTunings()[0]!
  );
  readonly strings = computed(() => this.activeTuning().strings);
  readonly automaticString = computed(() => {
    const measurement = this.measurement();
    return measurement ? closestString(measurement.frequency, this.strings()) : null;
  });
  readonly activeString = computed<TuningString | null>(() => {
    if (this.selectionMode() === 'manual') {
      return this.strings().find((string) => string.id === this.manualStringId()) ?? null;
    }
    return this.automaticString();
  });
  readonly deviationCents = computed(() => {
    const measurement = this.measurement();
    const target = this.activeString();
    return measurement && target ? centsFromTarget(measurement.frequency, target.frequency) : null;
  });
  readonly tuningStatus = computed<'flat' | 'tuned' | 'sharp' | 'waiting'>(() => {
    const cents = this.deviationCents();
    if (cents === null) return 'waiting';
    if (Math.abs(cents) <= 3) return 'tuned';
    return cents < 0 ? 'flat' : 'sharp';
  });
  readonly isInTune = computed(() => this.tuningStatus() === 'tuned');
  readonly isListening = computed(() => this.status() === 'listening');
  readonly needlePosition = computed(
    () => 50 + Math.max(-50, Math.min(50, this.deviationCents() ?? 0))
  );
  readonly readoutLabel = computed(() => {
    if (!this.isListening()) return 'STIMMGERÄT';
    if (!this.measurement()) return 'HÖRE ZU';
    return this.selectionMode() === 'auto' ? 'ERKANNTE SAITE' : 'AUSGEWÄHLTE SAITE';
  });
  readonly statusMessage = computed(() => {
    if (this.status() === 'requesting') return 'Bitte erlaube den Mikrofonzugriff.';
    if (this.status() === 'unsupported')
      return 'Dein Browser unterstützt die benötigte Audiofunktion nicht.';
    if (this.status() === 'suspended')
      return this.audio.errorMessage() ?? 'Die Audioverarbeitung wurde pausiert.';
    if (
      this.status() === 'permission-denied' ||
      this.status() === 'no-input' ||
      this.status() === 'error'
    ) {
      return this.audio.errorMessage() ?? 'Audio konnte nicht gestartet werden.';
    }
    if (!this.isListening()) return 'Aktiviere das Mikrofon, um mit dem Stimmen zu beginnen.';
    if (!this.measurement()) {
      return this.inputLevel() < 0.004
        ? 'Mikrofon aktiv, aber es kommt kaum Audiosignal an. Prüfe den Mikrofonpegel und die Eingangsquelle.'
        : 'Audiosignal erkannt, aber keine eindeutige Tonhöhe. Spiele eine einzelne Saite sauber an.';
    }
    if (!this.activeString()) return 'Keine passende Saite erkannt.';
    if (this.tuningStatus() === 'tuned') return 'Perfekt – die Saite ist gestimmt.';
    return this.tuningStatus() === 'flat'
      ? 'Zu tief – stimme die Saite etwas höher.'
      : 'Zu hoch – stimme die Saite etwas tiefer.';
  });
  readonly meterDescription = computed(() => {
    const cents = this.deviationCents();
    if (cents === null) return 'Stimmungsanzeige wartet auf ein Tonsignal.';
    return cents < -3
      ? `${Math.round(Math.abs(cents))} Cent zu tief`
      : cents > 3
        ? `${Math.round(cents)} Cent zu hoch`
        : 'Saite ist gestimmt.';
  });

  selectInstrument(event: Event): void {
    const instrumentId = (event.target as HTMLSelectElement).value;
    const instrument = getInstrument(instrumentId);
    if (!instrument) return;
    void this.settings.update({
      instrumentId: instrument.id,
      tuningId: instrument.defaultTuningId,
      manualStringId: instrument.tunings[0]?.strings[0]?.id ?? null
    });
  }

  selectTuning(event: Event): void {
    const tuningId = (event.target as HTMLSelectElement).value;
    const tuning = getTuning(this.selectedInstrumentId(), tuningId);
    if (!tuning) return;
    void this.settings.update({
      tuningId: tuning.id,
      manualStringId: tuning.strings[0]?.id ?? null
    });
  }

  setMode(mode: 'auto' | 'manual'): void {
    void this.settings.update({
      selectionMode: mode,
      manualStringId:
        mode === 'manual' && !this.manualStringId()
          ? (this.strings()[0]?.id ?? null)
          : this.manualStringId()
    });
  }

  selectString(id: string): void {
    void this.settings.update({ manualStringId: id, selectionMode: 'manual' });
  }

  toggleAudio(): void {
    if (this.isListening()) void this.audio.stop();
    else void this.audio.start();
  }
}
