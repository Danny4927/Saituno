import { Component, computed, inject } from '@angular/core';
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
  templateUrl: './home.page.html',
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
    if (this.status() === 'suspended' || this.status() === 'paused')
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
