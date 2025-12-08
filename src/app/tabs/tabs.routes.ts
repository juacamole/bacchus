import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'focus',
        loadComponent: () =>
          import('../pages/focus/focus.page').then((m) => m.FocusPage),
      },
      {
        path: 'entry',
        loadComponent: () =>
          import('../pages/entry/entry.page').then((m) => m.EntryPage),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('../pages/progress/progress.page').then((m) => m.ProgressPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
