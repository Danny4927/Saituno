import { Component, computed, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';
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

          <div class="tuner-preview" aria-label="Vorschau des Stimmgeräts">
            <div class="preview-topline">
              <span>SAITUNO TUNER</span>
              <span class="preview-live"><span></span> READY</span>
            </div>
            <div class="note-display" aria-hidden="true">
              <span class="note-letter">A</span>
              <span class="note-octave">4</span>
            </div>
            <div class="meter" aria-hidden="true">
              <span class="meter-tick"></span>
              <span class="meter-tick"></span>
              <span class="meter-tick active"></span>
              <span class="meter-tick"></span>
              <span class="meter-tick"></span>
            </div>
            <p class="preview-caption">440 Hz <span>·</span> Referenzton</p>
          </div>

          <p class="coming-soon">Das Stimmgerät entsteht gerade.</p>
          <p class="supporting">Gitarre, Bass und Ukulele. Kostenlos, offline und ohne Tracking.</p>
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
  readonly appName = signal(APP_NAME);
  readonly tagline = signal(APP_TAGLINE);
  readonly currentYear = signal(new Date().getFullYear());
  readonly statusLabel = computed(() => 'MADE FOR MUSIC');
}
