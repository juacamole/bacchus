import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  constructor(private supabase: SupabaseService) {}

  async takePicture(): Promise<Photo | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      // Save to local storage asynchronously in the background
      if (image) {
        this.saveImageToLocalStorage(image).catch(err => {
          console.error('Error saving image to local storage:', err);
        });
      }
      
      return image;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  async pickFromGallery(): Promise<Photo | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });
      
      // Save to local storage asynchronously in the background
      if (image) {
        this.saveImageToLocalStorage(image).catch(err => {
          console.error('Error saving image to local storage:', err);
        });
      }
      
      return image;
    } catch (error) {
      console.error('Error picking from gallery:', error);
      return null;
    }
  }

  async uploadImage(photo: Photo, addictionId: string): Promise<string> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Convert photo to blob
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();

    // Generate unique filename
    const fileExt = photo.format || 'jpg';
    const fileName = `${user.id}/${addictionId}/${Date.now()}.${fileExt}`;
    const filePath = `consumption-images/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await this.supabase.getClient()
      .storage
      .from('consumption-images')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = this.supabase.getClient()
      .storage
      .from('consumption-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = imageUrl.split('/consumption-images/');
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL');
    }

    const filePath = urlParts[1];

    const { error } = await this.supabase.getClient()
      .storage
      .from('consumption-images')
      .remove([filePath]);

    if (error) throw error;
  }

  /**
   * Saves an image to local storage on the mobile device.
   * This runs asynchronously in the background and does not block the UI.
   * Only works on native platforms (Android/iOS), skips on web.
   * 
   * IMPORTANT: This method has NO Supabase dependency - it only uses Capacitor Filesystem API.
   * Images are saved locally to the device's app data directory.
   */
  private async saveImageToLocalStorage(photo: Photo): Promise<string | null> {
    try {
      // Skip on web platform - Filesystem API only works on native platforms
      if (Capacitor.getPlatform() === 'web') {
        console.log('[ImageUploadService] Skipping local storage save on web platform');
        return null;
      }

      if (!photo.webPath) {
        console.warn('[ImageUploadService] Photo has no webPath, cannot save to local storage');
        return null;
      }

      console.log('[ImageUploadService] Starting to save image to local storage (NO Supabase connection)', {
        platform: Capacitor.getPlatform(),
        format: photo.format
      });

      // Read the image file as base64 from webPath
      // This uses only native browser/device APIs - no Supabase involved
      const response = await fetch(photo.webPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result) {
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64String = reader.result.toString();
            const base64Data = base64String.split(',')[1] || base64String;
            resolve(base64Data);
          } else {
            reject(new Error('FileReader returned no result'));
          }
        };
        reader.onerror = (error) => {
          reject(new Error(`FileReader error: ${error}`));
        };
        reader.readAsDataURL(blob);
      });

      // Generate unique filename - no user ID needed, completely local
      const fileExt = photo.format || 'jpg';
      const timestamp = Date.now();
      const fileName = `consumption_${timestamp}.${fileExt}`;
      
      // Use a simple directory structure - no Supabase user ID lookup
      const directory = 'consumption-images';
      const filePath = `${directory}/${fileName}`;

      console.log('[ImageUploadService] Saving to local storage (local only, no Supabase):', filePath);

      // Save the file to local storage using Capacitor Filesystem API
      // This is completely independent of Supabase - pure local device storage
      const result = await Filesystem.writeFile({
        path: filePath,
        data: base64Data,
        directory: Directory.Data
      });

      console.log(`[ImageUploadService] ✓ Image saved successfully to local storage (NO Supabase): ${filePath}`, result);
      return filePath;
    } catch (error: any) {
      console.error('[ImageUploadService] ✗ Error saving image to local storage:', {
        error: error?.message || error,
        code: error?.code,
        stack: error?.stack
      });
      return null;
    }
  }
}

