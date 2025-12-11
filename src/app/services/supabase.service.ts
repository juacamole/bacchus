import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({ email, password });
  }

  async signOut() {
    const result = await this.supabase.auth.signOut();
    return result;
  }

  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  async signInWithOAuth(provider: 'spotify' | 'figma') {
    // Determine redirect URL based on platform
    let redirectTo: string;
    
    if (Capacitor.isNativePlatform()) {
      // For mobile apps, use the app's URL scheme
      // This should match your appId in capacitor.config.ts
      redirectTo = 'io.ionic.starter://tabs/home';
    } else {
      // For web, use the current origin
      // Only use origin if it's not localhost (production)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // For local development, you might want to use a specific URL
        // Or handle OAuth differently
        redirectTo = window.location.origin + '/tabs/home';
      } else {
        // Production web URL
        redirectTo = window.location.origin + '/tabs/home';
      }
    }

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: redirectTo
      }
    });
    return { data, error };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}

