import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class HapticService {
  /**
   * Trigger a light haptic feedback
   */
  async light() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
  }

  /**
   * Trigger a medium haptic feedback
   */
  async medium() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
  }

  /**
   * Trigger a heavy haptic feedback
   */
  async heavy() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
  }

  /**
   * Trigger a selection haptic feedback (for button clicks)
   */
  async selection() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
  }

  /**
   * Trigger haptic feedback for button clicks (uses medium impact)
   */
  async buttonClick() {
    await this.medium();
  }

  /**
   * Trigger haptic feedback for destructive actions (uses heavy impact)
   */
  async destructive() {
    await this.heavy();
  }
}

