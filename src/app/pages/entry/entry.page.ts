import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-entry',
  templateUrl: 'entry.page.html',
  styleUrls: ['entry.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent],
})
export class EntryPage {
  constructor() {}
}
