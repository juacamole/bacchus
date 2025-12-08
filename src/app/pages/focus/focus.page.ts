import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-focus',
  templateUrl: 'focus.page.html',
  styleUrls: ['focus.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent],
})
export class FocusPage {
  constructor() {}
}
