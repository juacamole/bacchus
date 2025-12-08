import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonToggle } from '@ionic/angular/standalone';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
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
    IonItem,
    IonLabel,
    IonToggle
  ],
})
export class SettingsPage implements OnInit {
  isDarkMode = false;

  constructor(private themeService: ThemeService) {}

  async ngOnInit() {
    await this.themeService.ensureInitialized();
    this.isDarkMode = this.themeService.isDark();
  }

  async toggleDarkMode() {
    await this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.isDark();
  }
}
