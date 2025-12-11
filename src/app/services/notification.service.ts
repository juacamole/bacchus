import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Addiction } from './addiction.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationIds: Map<string, number> = new Map();
  private nextNotificationId = 1000;

  constructor() {}

  async requestPermissions(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      // Web notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } else {
      // Native notifications
      const { display } = await LocalNotifications.checkPermissions();
      if (display === 'granted') {
        return true;
      }
      const { display: newPermission } = await LocalNotifications.requestPermissions();
      return newPermission === 'granted';
    }
  }

  async scheduleAddictionNotification(addiction: Addiction): Promise<void> {
    if (!addiction.id || !addiction.name) {
      return;
    }

    // Cancel existing notification for this addiction
    await this.cancelAddictionNotification(addiction.id);

    // Calculate interval based on level (1-10)
    // Level 1: 60 minutes, Level 10: 5 minutes
    const intervalMinutes = this.calculateIntervalMinutes(addiction.level);
    const intervalSeconds = intervalMinutes * 60;

    // Get unique notification ID
    const notificationId = this.nextNotificationId++;
    this.notificationIds.set(addiction.id, notificationId);

    if (Capacitor.getPlatform() === 'web') {
      // Web notifications - schedule using setInterval
      this.scheduleWebNotification(addiction.name, intervalSeconds, addiction.id);
    } else {
      // Native notifications
      // Schedule first notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: 'Continue Your Addiction',
            body: `Don't forget to continue your addiction: ${addiction.name}`,
            schedule: {
              at: new Date(Date.now() + intervalSeconds * 1000),
              repeats: true,
              every: intervalSeconds as any
            },
            sound: 'default'
          }
        ]
      });
    }
  }

  async cancelAddictionNotification(addictionId: string): Promise<void> {
    const notificationId = this.notificationIds.get(addictionId);
    if (notificationId) {
      if (Capacitor.getPlatform() === 'web') {
        // Clear web notification interval
        this.clearWebNotification(addictionId);
      } else {
        await LocalNotifications.cancel({
          notifications: [{ id: notificationId }]
        });
      }
      this.notificationIds.delete(addictionId);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      // Clear all web notification intervals
      this.clearAllWebNotifications();
    } else {
      const ids = Array.from(this.notificationIds.values());
      if (ids.length > 0) {
        await LocalNotifications.cancel({
          notifications: ids.map(id => ({ id }))
        });
      }
    }
    this.notificationIds.clear();
  }

  private calculateIntervalMinutes(level: number): number {
    // Clamp level between 1 and 10
    const clampedLevel = Math.max(1, Math.min(10, level));
    
    // Level 1: 60 minutes, Level 10: 5 minutes
    // Linear interpolation: interval = 60 - (level - 1) * (60 - 5) / 9
    const interval = 60 - (clampedLevel - 1) * (55 / 9);
    
    // Round to nearest minute
    return Math.round(interval);
  }

  // Web notification handling
  private webNotificationIntervals: Map<string, any> = new Map();

  private scheduleWebNotification(addictionName: string, intervalSeconds: number, addictionId: string): void {
    // Clear existing interval if any
    this.clearWebNotification(addictionId);

    // Create notification immediately
    this.showWebNotification(addictionName);

    // Schedule recurring notifications
    const interval = setInterval(() => {
      this.showWebNotification(addictionName);
    }, intervalSeconds * 1000);

    this.webNotificationIntervals.set(addictionId, interval);
  }

  private showWebNotification(addictionName: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Continue Your Addiction', {
        body: `Don't forget to continue your addiction: ${addictionName}`,
        icon: '/assets/icon/favicon.png',
        tag: 'addiction-reminder',
        requireInteraction: false
      });
    }
  }

  private clearWebNotification(addictionId: string): void {
    const interval = this.webNotificationIntervals.get(addictionId);
    if (interval) {
      clearInterval(interval);
      this.webNotificationIntervals.delete(addictionId);
    }
  }

  private clearAllWebNotifications(): void {
    this.webNotificationIntervals.forEach(interval => clearInterval(interval));
    this.webNotificationIntervals.clear();
  }

  getIntervalForLevel(level: number): string {
    const minutes = this.calculateIntervalMinutes(level);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

