import { Component, OnInit } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonIcon,
  IonList,
  IonBadge,
  IonProgressBar,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { flame, trophy, location, checkmarkCircle } from 'ionicons/icons';
import { AddictionService, Addiction } from '../../services/addiction.service';
import { StreakService, Streak } from '../../services/streak.service';
import { ConsumptionEntryService } from '../../services/consumption-entry.service';

interface JourneyData {
  addiction: Addiction;
  streak: Streak | null;
  totalEntries: number;
  journeyProgress: number;
}

@Component({
  selector: 'app-progress',
  templateUrl: 'progress.page.html',
  styleUrls: ['progress.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonIcon,
    IonList,
    IonBadge,
    IonProgressBar
  ],
})
export class ProgressPage implements OnInit {
  journeyData: JourneyData[] = [];
  totalStreakDays = 0;
  totalEntries = 0;

  constructor(
    private addictionService: AddictionService,
    private streakService: StreakService,
    private entryService: ConsumptionEntryService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ flame, trophy, location, checkmarkCircle });
  }

  async ngOnInit() {
    await this.loadProgress();
  }

  async loadProgress() {
    const loading = await this.loadingController.create({
      message: 'Loading progress...'
    });
    await loading.present();

    try {
      const addictions = await this.addictionService.getAllAddictions();
      this.journeyData = [];

      for (const addiction of addictions) {
        if (!addiction.id) continue;

        const streak = await this.streakService.getStreak(addiction.id);
        const entries = await this.entryService.getAllEntries(addiction.id);
        
        // Calculate journey progress based on streak and entries
        // Journey milestones: 7, 30, 60, 90, 180, 365 days
        const milestones = [7, 30, 60, 90, 180, 365];
        const currentStreak = streak?.current_streak || 0;
        let journeyProgress = 0;
        
        for (let i = milestones.length - 1; i >= 0; i--) {
          if (currentStreak >= milestones[i]) {
            journeyProgress = ((i + 1) / milestones.length) * 100;
            break;
          }
        }

        this.journeyData.push({
          addiction,
          streak,
          totalEntries: entries.length,
          journeyProgress
        });

        this.totalStreakDays += currentStreak;
        this.totalEntries += entries.length;
      }

      // Sort by streak (highest first)
      this.journeyData.sort((a, b) => 
        (b.streak?.current_streak || 0) - (a.streak?.current_streak || 0)
      );
    } catch (error: any) {
      await this.showToast('Error loading progress: ' + (error.message || 'Unknown error'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  getJourneyStage(progress: number): string {
    if (progress >= 100) return 'Master';
    if (progress >= 80) return 'Expert';
    if (progress >= 60) return 'Advanced';
    if (progress >= 40) return 'Intermediate';
    if (progress >= 20) return 'Beginner';
    return 'Starting';
  }

  getJourneyColor(progress: number): string {
    if (progress >= 80) return 'success';
    if (progress >= 40) return 'warning';
    return 'primary';
  }

  getMilestoneIcon(progress: number): string {
    if (progress >= 100) return 'trophy';
    if (progress >= 60) return 'checkmark-circle';
    return 'location';
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
