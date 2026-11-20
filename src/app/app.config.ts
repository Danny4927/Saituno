import {
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIonicAngular } from '@ionic/angular';
import { provideRouter, withHashLocation } from '@angular/router';
import { SettingsService } from './core/settings/settings.service';
import { routes } from './app.routes';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideIonicAngular(),
    provideRouter(routes, withHashLocation()),
    provideAppInitializer(() => inject(SettingsService).load()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
