import type { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    title: 'Saituno – Instrument Tuner'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
