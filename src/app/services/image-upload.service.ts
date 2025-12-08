import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

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
}

