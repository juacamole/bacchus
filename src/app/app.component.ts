import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.themeService.initTheme();
    
    // Handle OAuth callback
    this.supabaseService.getClient().auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in, redirect to home
        this.router.navigate(['/tabs/home']);
      } else if (event === 'SIGNED_OUT') {
        // User signed out, redirect to login
        this.router.navigate(['/login']);
      }
    });

    // Check initial auth state
    const session = await this.supabaseService.getSession();
    if (!session) {
      this.router.navigate(['/login']);
    }
  }
}
