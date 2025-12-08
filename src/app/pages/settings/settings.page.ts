import { Component, OnInit } from '@angular/core';
import { 
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
  IonToggle,
  IonButton,
  IonButtons,
  IonModal,
  IonIcon,
  AlertController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { documentText, shieldCheckmark, logOut } from 'ionicons/icons';
import { ThemeService } from '../../services/theme.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonToggle,
    IonButton,
    IonButtons,
    IonModal,
    IonIcon
  ],
})
export class SettingsPage implements OnInit {
  isDarkMode = false;
  isAgbModalOpen = false;
  isPrivacyModalOpen = false;
  currentUser: any = null;

  get currentDate(): string {
    return new Date().toLocaleDateString('de-DE');
  }

  constructor(
    private themeService: ThemeService,
    private supabaseService: SupabaseService,
    private alertController: AlertController
  ) {
    addIcons({ documentText, shieldCheckmark, logOut });
  }

  async ngOnInit() {
    await this.themeService.ensureInitialized();
    this.isDarkMode = this.themeService.isDark();
    this.currentUser = await this.supabaseService.getCurrentUser();
  }

  async toggleDarkMode() {
    await this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.isDark();
  }

  async signOut() {
    const alert = await this.alertController.create({
      header: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Sign Out',
          role: 'destructive',
          handler: async () => {
            await this.supabaseService.signOut();
            this.currentUser = null;
            // Reload page to reset app state
            window.location.reload();
          }
        }
      ]
    });

    await alert.present();
  }
}
