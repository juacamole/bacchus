import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ConsumptionEntryService } from './consumption-entry.service';

export interface Streak {
  id?: string;
  user_id?: string;
  addiction_id: string;
  current_streak: number;
  longest_streak: number;
  last_entry_date?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StreakService {
  constructor(
    private supabase: SupabaseService,
    private entryService: ConsumptionEntryService
  ) {}

  async getStreak(addictionId: string): Promise<Streak | null> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('addiction_id', addictionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getAllStreaks(): Promise<Streak[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('streaks')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  }

  async calculateStreak(addictionId: string): Promise<Streak> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get all entries for this addiction, ordered by date
    const entries = await this.entryService.getAllEntries(addictionId);
    
    if (entries.length === 0) {
      // No entries, return zero streak
      return await this.upsertStreak(addictionId, 0, 0, null);
    }

    // Calculate current streak (consecutive days with entries)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Sort entries by date descending
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.entry_date);
      entryDate.setHours(0, 0, 0, 0);

      if (lastDate === null) {
        // First entry
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          currentStreak = 1;
          tempStreak = 1;
        }
        lastDate = entryDate;
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          if (currentStreak === 0) {
            currentStreak = tempStreak + 1;
          } else {
            currentStreak++;
          }
          tempStreak++;
        } else if (daysDiff === 0) {
          // Same day, multiple entries - don't break streak
          continue;
        } else {
          // Streak broken
          if (currentStreak === 0) {
            // We're calculating from the past, update temp streak
            tempStreak = 1;
          } else {
            // Current streak is broken
            break;
          }
        }
        lastDate = entryDate;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Get existing streak to preserve longest_streak
    const existingStreak = await this.getStreak(addictionId);
    const finalLongestStreak = Math.max(
      longestStreak,
      existingStreak?.longest_streak || 0
    );

    return await this.upsertStreak(
      addictionId,
      currentStreak,
      finalLongestStreak,
      sortedEntries[0]?.entry_date || null
    );
  }

  private async upsertStreak(
    addictionId: string,
    currentStreak: number,
    longestStreak: number,
    lastEntryDate: string | null
  ): Promise<Streak> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.getClient()
      .from('streaks')
      .upsert({
        user_id: user.id,
        addiction_id: addictionId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_entry_date: lastEntryDate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,addiction_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

