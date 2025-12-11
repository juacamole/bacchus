import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';
import { SupabaseService } from './services/supabase.service';
import { NotificationService } from './services/notification.service';
import { AddictionService } from './services/addiction.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private addictionService: AddictionService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.themeService.initTheme();
    
    // Request notification permissions
    await this.notificationService.requestPermissions();
    
    // Handle OAuth callback
    this.supabaseService.getClient().auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in, redirect to home
        this.router.navigate(['/tabs/home']);
        // Schedule notifications for all addictions
        await this.scheduleAllNotifications();
      } else if (event === 'SIGNED_OUT') {
        // User signed out, cancel all notifications and redirect to login
        await this.notificationService.cancelAllNotifications();
        this.router.navigate(['/login']);
      }
    });

    // Check initial auth state
    const session = await this.supabaseService.getSession();
    if (!session) {
      this.router.navigate(['/login']);
    } else {
      // Schedule notifications for existing addictions
      await this.scheduleAllNotifications();
    }
  }

  private async scheduleAllNotifications() {
    try {
      const addictions = await this.addictionService.getAllAddictions();
      for (const addiction of addictions) {
        await this.notificationService.scheduleAddictionNotification(addiction);
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }
}
