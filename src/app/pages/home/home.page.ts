import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { home, flame, addCircle, statsChart, settings } from 'ionicons/icons';
import { HapticService } from '../../services/haptic.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
  ],
})
export class HomePage {
  constructor(
    private router: Router,
    private hapticService: HapticService
  ) {
    addIcons({ home, flame, addCircle, statsChart, settings });
  }

  async navigateToFocus() {
    await this.hapticService.buttonClick();
    this.router.navigate(['/tabs/focus']);
  }

  async navigateToEntry() {
    await this.hapticService.buttonClick();
    this.router.navigate(['/tabs/entry']);
  }

  async navigateToProgress() {
    await this.hapticService.buttonClick();
    this.router.navigate(['/tabs/progress']);
  }

  async navigateToSettings() {
    await this.hapticService.buttonClick();
    this.router.navigate(['/tabs/settings']);
  }
}
