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
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { documentText, shieldCheckmark, logOut, notifications } from 'ionicons/icons';
import { ThemeService } from '../../services/theme.service';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

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
    private notificationService: NotificationService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ documentText, shieldCheckmark, logOut, notifications });
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
            const { error } = await this.supabaseService.signOut();
            if (error) {
              console.error('Error signing out:', error);
            }
            // Router will handle redirect via auth state change
            window.location.href = '/login';
          }
        }
      ]
    });

    await alert.present();
  }

  async testNotification() {
    try {
      // Request permissions if not granted
      const hasPermission = await this.notificationService.requestPermissions();
      
      if (!hasPermission) {
        await this.showToast('Notification permissions are required. Please enable them in your device settings.', 'warning');
        return;
      }

      // Send a test notification
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const { Capacitor } = await import('@capacitor/core');

      if (Capacitor.getPlatform() === 'web') {
        // Web notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Test Notification', {
            body: 'This is a test notification from Bacchus+',
            icon: '/assets/icon/favicon.png'
          });
          await this.showToast('Test notification sent!', 'success');
        } else {
          await this.showToast('Please enable notifications in your browser settings', 'warning');
        }
      } else {
        // Native notification
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 9999,
              title: 'Test Notification',
              body: 'This is a test notification from Bacchus+',
              sound: 'default'
            }
          ]
        });
        await this.showToast('Test notification sent!', 'success');
      }
    } catch (error: any) {
      await this.showToast('Error sending test notification: ' + (error.message || 'Unknown error'), 'danger');
    }
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
