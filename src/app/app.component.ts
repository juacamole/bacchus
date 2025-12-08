import { Component, OnInit } from '@angular/core';
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
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    await this.themeService.initTheme();
    
    // Listen for auth state changes
    this.supabaseService.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
    });
  }
}
