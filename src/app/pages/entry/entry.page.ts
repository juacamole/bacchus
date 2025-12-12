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
  IonFab,
  IonFabButton,
  IonModal,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonImg,
  IonDatetime,
  IonDatetimeButton,
  IonButtons,
  AlertController,
  LoadingController,
  ToastController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, camera, image, trash, calendar } from 'ionicons/icons';
import { ConsumptionEntryService, ConsumptionEntry } from '../../services/consumption-entry.service';
import { AddictionService, Addiction } from '../../services/addiction.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { StreakService } from '../../services/streak.service';
import { HapticService } from '../../services/haptic.service';

@Component({
  selector: 'app-entry',
  templateUrl: 'entry.page.html',
  styleUrls: ['entry.page.scss'],
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
    IonFab,
    IonFabButton,
    IonModal,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonImg,
    IonDatetime,
    IonDatetimeButton,
    IonButtons
  ],
})
export class EntryPage implements OnInit {
  entries: ConsumptionEntry[] = [];
  addictions: Addiction[] = [];
  selectedAddictionId: string | null = null;
  isModalOpen = false;
  editingEntry: ConsumptionEntry | null = null;
  
  formData = {
    addiction_id: '',
    entry_date: new Date().toISOString(),
    notes: '',
    image_url: ''
  };
  
  capturedImage: string | null = null;

  constructor(
    private entryService: ConsumptionEntryService,
    private addictionService: AddictionService,
    private imageUploadService: ImageUploadService,
    private streakService: StreakService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private hapticService: HapticService
  ) {
    addIcons({ add, camera, image, trash, calendar });
  }

  async ngOnInit() {
    await this.loadAddictions();
    await this.loadEntries();
  }

  async loadAddictions() {
    try {
      this.addictions = await this.addictionService.getAllAddictions();
      if (this.addictions.length > 0 && !this.selectedAddictionId) {
        this.selectedAddictionId = this.addictions[0].id || null;
      }
    } catch (error: any) {
      await this.showToast('Error loading addictions: ' + (error.message || 'Unknown error'), 'danger');
    }
  }

  async loadEntries() {
    const loading = await this.loadingController.create({
      message: 'Loading entries...'
    });
    await loading.present();

    try {
      this.entries = await this.entryService.getAllEntries(
        this.selectedAddictionId || undefined
      );
    } catch (error: any) {
      await this.showToast('Error loading entries: ' + (error.message || 'Unknown error'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async onAddictionChange() {
    await this.loadEntries();
  }

  async closeModal() {
    await this.hapticService.light();
    this.isModalOpen = false;
  }

  async openAddModal() {
    await this.hapticService.buttonClick();
    this.editingEntry = null;
    this.formData = {
      addiction_id: this.selectedAddictionId || '',
      entry_date: new Date().toISOString(),
      notes: '',
      image_url: ''
    };
    this.capturedImage = null;
    this.isModalOpen = true;
  }

  async openEditModal(entry: ConsumptionEntry) {
    await this.hapticService.buttonClick();
    this.editingEntry = entry;
    this.formData = {
      addiction_id: entry.addiction_id,
      entry_date: entry.entry_date,
      notes: entry.notes || '',
      image_url: entry.image_url || ''
    };
    this.capturedImage = entry.image_url || null;
    this.isModalOpen = true;
  }

  async presentImageOptions() {
    await this.hapticService.buttonClick();
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera',
          handler: () => {
            this.takePicture();
          }
        },
        {
          text: 'Choose from Gallery',
          icon: 'image',
          handler: () => {
            this.pickFromGallery();
          }
        },
        {
          text: 'Remove Image',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.capturedImage = null;
            this.formData.image_url = '';
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async takePicture() {
    const photo = await this.imageUploadService.takePicture();
    if (photo && photo.webPath) {
      this.capturedImage = photo.webPath;
    }
  }

  async pickFromGallery() {
    const photo = await this.imageUploadService.pickFromGallery();
    if (photo && photo.webPath) {
      this.capturedImage = photo.webPath;
    }
  }

  async saveEntry() {
    await this.hapticService.buttonClick();
    if (!this.formData.addiction_id) {
      await this.showToast('Please select an addiction', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Saving entry...'
    });
    await loading.present();

    try {
      // Upload image if captured
      if (this.capturedImage && !this.capturedImage.startsWith('http')) {
        const imageUrl = await this.imageUploadService.uploadImage(
          { webPath: this.capturedImage } as any,
          this.formData.addiction_id
        );
        this.formData.image_url = imageUrl;
      }

      if (this.editingEntry?.id) {
        await this.entryService.updateEntry(this.editingEntry.id, this.formData);
        await this.showToast('Entry updated successfully', 'success');
      } else {
        await this.entryService.createEntry(this.formData);
        await this.showToast('Entry created successfully', 'success');
        
        // Recalculate streak
        if (this.formData.addiction_id) {
          await this.streakService.calculateStreak(this.formData.addiction_id);
        }
      }
      
      this.isModalOpen = false;
      await this.loadEntries();
    } catch (error: any) {
      await this.showToast('Error saving entry: ' + (error.message || 'Unknown error'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async deleteEntry(entry: ConsumptionEntry) {
    await this.hapticService.destructive();
    const alert = await this.alertController.create({
      header: 'Delete Entry',
      message: 'Are you sure you want to delete this entry?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: async () => {
            await this.hapticService.light();
          }
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.hapticService.destructive();
            const loading = await this.loadingController.create({
              message: 'Deleting...'
            });
            await loading.present();

            try {
              if (entry.id) {
                // Delete image if exists
                if (entry.image_url) {
                  try {
                    await this.imageUploadService.deleteImage(entry.image_url);
                  } catch (error) {
                    console.error('Error deleting image:', error);
                  }
                }
                
                await this.entryService.deleteEntry(entry.id);
                
                // Recalculate streak
                if (entry.addiction_id) {
                  await this.streakService.calculateStreak(entry.addiction_id);
                }
                
                await this.showToast('Entry deleted', 'success');
                await this.loadEntries();
              }
            } catch (error: any) {
              await this.showToast('Error deleting entry: ' + (error.message || 'Unknown error'), 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAddictionName(addictionId: string): string {
    const addiction = this.addictions.find(a => a.id === addictionId);
    return addiction?.name || 'Unknown';
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
