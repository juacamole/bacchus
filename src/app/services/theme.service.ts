import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'darkMode';
  private isDarkMode = false;
  private initialized = false;

  constructor() {}

  async initTheme(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      const { value } = await Preferences.get({ key: this.THEME_KEY });
      if (value !== null) {
        this.isDarkMode = value === 'true';
      } else {
        // Check system preference if no stored preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkMode = prefersDark;
      }
      this.applyTheme(this.isDarkMode);
      this.initialized = true;
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode = prefersDark;
      this.applyTheme(this.isDarkMode);
      this.initialized = true;
    }
  }

  async toggleTheme(): Promise<void> {
    this.isDarkMode = !this.isDarkMode;
    await this.saveThemePreference();
    this.applyTheme(this.isDarkMode);
  }

  async setTheme(isDark: boolean): Promise<void> {
    this.isDarkMode = isDark;
    await this.saveThemePreference();
    this.applyTheme(this.isDarkMode);
  }

  isDark(): boolean {
    return this.isDarkMode;
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initTheme();
    }
  }

  private applyTheme(isDark: boolean): void {
    // Apply dark class to html element for Ionic dark mode
    document.documentElement.classList.toggle('dark', isDark);
    // Also apply to body for compatibility
    document.body.classList.toggle('dark', isDark);
  }

  private async saveThemePreference(): Promise<void> {
    try {
      await Preferences.set({
        key: this.THEME_KEY,
        value: this.isDarkMode.toString()
      });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }
}

