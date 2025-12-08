import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ConsumptionEntry {
  id?: string;
  user_id?: string;
  addiction_id: string;
  entry_date: string;
  image_url?: string;
  barcode_data?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsumptionEntryService {
  constructor(private supabase: SupabaseService) {}

  async getAllEntries(addictionId?: string): Promise<ConsumptionEntry[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    let query = this.supabase.getClient()
      .from('consumption_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });

    if (addictionId) {
      query = query.eq('addiction_id', addictionId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getEntryById(id: string): Promise<ConsumptionEntry | null> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('consumption_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async createEntry(entry: Partial<ConsumptionEntry>): Promise<ConsumptionEntry> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('consumption_entries')
      .insert({
        ...entry,
        user_id: user.id,
        entry_date: entry.entry_date || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEntry(id: string, updates: Partial<ConsumptionEntry>): Promise<ConsumptionEntry> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('consumption_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEntry(id: string): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await this.supabase.getClient()
      .from('consumption_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }
}

