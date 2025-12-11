import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { Observable, from } from 'rxjs';

export interface Addiction {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  level: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddictionService {
  constructor(
    private supabase: SupabaseService,
    private notificationService: NotificationService
  ) {}

  async getAllAddictions(): Promise<Addiction[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('addictions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAddictionById(id: string): Promise<Addiction | null> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('addictions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async createAddiction(addiction: Partial<Addiction>): Promise<Addiction> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('addictions')
      .insert({
        ...addiction,
        user_id: user.id,
        level: addiction.level || 1
      })
      .select()
      .single();

    if (error) throw error;
    
    // Schedule notification for the new addiction
    if (data) {
      await this.notificationService.scheduleAddictionNotification(data);
    }
    
    return data;
  }

  async updateAddiction(id: string, updates: Partial<Addiction>): Promise<Addiction> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('addictions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    // Reschedule notification if level or name changed
    if (data && (updates.level !== undefined || updates.name !== undefined)) {
      await this.notificationService.scheduleAddictionNotification(data);
    }
    
    return data;
  }

  async deleteAddiction(id: string): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Cancel notification before deleting
    await this.notificationService.cancelAddictionNotification(id);

    const { error } = await this.supabase.getClient()
      .from('addictions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }
}

