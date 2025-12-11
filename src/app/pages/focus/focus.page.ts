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
  IonButton,
  IonItem,
  IonLabel,
  IonIcon,
  IonList,
  IonBadge,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonRange,
  IonButtons,
  AlertController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, create, trash, flame } from 'ionicons/icons';
import { AddictionService, Addiction } from '../../services/addiction.service';
import { StreakService } from '../../services/streak.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-focus',
  templateUrl: 'focus.page.html',
  styleUrls: ['focus.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonIcon,
    IonList,
    IonBadge,
    IonFab,
    IonFabButton,
    IonModal,
    IonInput,
    IonTextarea,
    IonRange,
    IonButtons
  ],
})
export class FocusPage implements OnInit {
  addictions: Addiction[] = [];
  streaks: Map<string, number> = new Map();
  isModalOpen = false;
  editingAddiction: Addiction | null = null;
  
  formData = {
    name: '',
    description: '',
    level: 5
  };

  constructor(
    private addictionService: AddictionService,
    private streakService: StreakService,
    private notificationService: NotificationService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ add, create, trash, flame });
  }

  async ngOnInit() {
    await this.loadAddictions();
  }

  async loadAddictions() {
    const loading = await this.loadingController.create({
      message: 'Loading addictions...'
    });
    await loading.present();

    try {
      this.addictions = await this.addictionService.getAllAddictions();
      
      // Load streaks for each addiction
      for (const addiction of this.addictions) {
        if (addiction.id) {
          const streak = await this.streakService.getStreak(addiction.id);
          this.streaks.set(addiction.id, streak?.current_streak || 0);
        }
      }
    } catch (error: any) {
      await this.showToast('Error loading addictions: ' + (error.message || 'Unknown error'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  openAddModal() {
    this.editingAddiction = null;
    this.formData = {
      name: '',
      description: '',
      level: 5
    };
    this.isModalOpen = true;
  }

  openEditModal(addiction: Addiction) {
    this.editingAddiction = addiction;
    this.formData = {
      name: addiction.name,
      description: addiction.description || '',
      level: addiction.level
    };
    this.isModalOpen = true;
  }

  async saveAddiction() {
    if (!this.formData.name.trim()) {
      await this.showToast('Please enter a name', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Saving...'
    });
    await loading.present();

    try {
      if (this.editingAddiction?.id) {
        await this.addictionService.updateAddiction(this.editingAddiction.id, this.formData);
        await this.showToast('Addiction updated successfully', 'success');
      } else {
        await this.addictionService.createAddiction(this.formData);
        await this.showToast('Addiction created successfully', 'success');
      }
      
      this.isModalOpen = false;
      await this.loadAddictions();
    } catch (error: any) {
      await this.showToast('Error saving addiction: ' + (error.message || 'Unknown error'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async deleteAddiction(addiction: Addiction) {
    const alert = await this.alertController.create({
      header: 'Delete Addiction',
      message: `Are you sure you want to delete "${addiction.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting...'
            });
            await loading.present();

            try {
              if (addiction.id) {
                await this.addictionService.deleteAddiction(addiction.id);
                await this.showToast('Addiction deleted', 'success');
                await this.loadAddictions();
              }
            } catch (error: any) {
              await this.showToast('Error deleting addiction: ' + (error.message || 'Unknown error'), 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getLevelColor(level: number): string {
    if (level <= 3) return 'success';
    if (level <= 6) return 'warning';
    return 'danger';
  }

  getNotificationInterval(level: number): string {
    return this.notificationService.getIntervalForLevel(level);
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
