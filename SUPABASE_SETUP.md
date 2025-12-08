# Supabase Setup Guide for Bacchus+

This document outlines what you need to set up in your Supabase project to support the Bacchus+ application.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Note down your:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public API Key (found in Settings > API)
   - Service Role Key (keep this secret!)

## 2. Database Tables

You need to create the following tables in your Supabase database:

### Table: `addictions` (Süchte)
Stores information about user's addictions.

```sql
CREATE TABLE addictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 1, -- Sucht-Level (1-10)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE addictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own addictions
CREATE POLICY "Users can view own addictions"
  ON addictions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own addictions
CREATE POLICY "Users can insert own addictions"
  ON addictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own addictions
CREATE POLICY "Users can update own addictions"
  ON addictions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own addictions
CREATE POLICY "Users can delete own addictions"
  ON addictions FOR DELETE
  USING (auth.uid() = user_id);
```

### Table: `consumption_entries` (Konsum-Einträge)
Stores individual consumption entries.

```sql
CREATE TABLE consumption_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  addiction_id UUID REFERENCES addictions(id) ON DELETE CASCADE,
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT, -- URL to image stored in Supabase Storage
  barcode_data TEXT, -- Optional barcode data
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE consumption_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own entries
CREATE POLICY "Users can view own entries"
  ON consumption_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert own entries"
  ON consumption_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own entries"
  ON consumption_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete own entries"
  ON consumption_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_consumption_entries_user_addiction ON consumption_entries(user_id, addiction_id);
CREATE INDEX idx_consumption_entries_entry_date ON consumption_entries(entry_date DESC);
```

### Table: `streaks` (Streak-Daten)
Stores streak information for each addiction.

```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  addiction_id UUID REFERENCES addictions(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_entry_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, addiction_id)
);

-- Enable Row Level Security
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own streaks
CREATE POLICY "Users can view own streaks"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own streaks
CREATE POLICY "Users can insert own streaks"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own streaks
CREATE POLICY "Users can update own streaks"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_streaks_user_addiction ON streaks(user_id, addiction_id);
```

### Table: `user_settings` (Optional - for app preferences)
Stores user-specific app settings.

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  dark_mode BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  reminder_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

## 3. Storage Bucket for Images

Create a storage bucket for consumption images:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `consumption-images`
3. Set it to **Private** (users can only access their own images)
4. Add the following policies:

```sql
-- Policy: Users can upload their own images
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'consumption-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own images
CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'consumption-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'consumption-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 4. Database Functions (Optional but Recommended)

### Function: Update streak automatically
This function can be called via a trigger or manually to update streaks:

```sql
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID, p_addiction_id UUID)
RETURNS void AS $$
DECLARE
  v_last_entry_date TIMESTAMP WITH TIME ZONE;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER;
BEGIN
  -- Get the last entry date for this addiction
  SELECT MAX(entry_date) INTO v_last_entry_date
  FROM consumption_entries
  WHERE user_id = p_user_id AND addiction_id = p_addiction_id;

  -- Calculate current streak (simplified - you may want more complex logic)
  -- This is a placeholder - implement your streak calculation logic here
  SELECT COALESCE(current_streak, 0), COALESCE(longest_streak, 0)
  INTO v_current_streak, v_longest_streak
  FROM streaks
  WHERE user_id = p_user_id AND addiction_id = p_addiction_id;

  -- Insert or update streak
  INSERT INTO streaks (user_id, addiction_id, current_streak, longest_streak, last_entry_date)
  VALUES (p_user_id, p_addiction_id, v_current_streak, v_longest_streak, v_last_entry_date)
  ON CONFLICT (user_id, addiction_id)
  DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = GREATEST(streaks.longest_streak, EXCLUDED.current_streak),
    last_entry_date = EXCLUDED.last_entry_date,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 5. Authentication Setup

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Enable the authentication methods you want:
   - **Email** (recommended for start)
   - Optionally: Google, Apple, etc.

3. Configure email templates if needed (for password reset, etc.)

## 6. Environment Variables

After setting up Supabase, you'll need to add these to your Angular environment files:

**src/environments/environment.ts:**
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

**src/environments/environment.prod.ts:**
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

## 7. Next Steps (After Setup)

Once you've completed the Supabase setup:

1. Install Supabase client library in your Angular app:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create a Supabase service in your Angular app
3. Implement data services for:
   - Addictions CRUD
   - Consumption entries CRUD
   - Streak management
   - Image upload/download
   - Authentication

## 8. Testing Your Setup

After creating the tables, you can test by:

1. Creating a test user in Authentication
2. Using the Supabase SQL Editor to verify tables exist
3. Testing RLS policies by trying to access data as different users

## Notes

- **Row Level Security (RLS)**: All tables have RLS enabled to ensure users can only access their own data
- **Storage**: Images are stored in a private bucket with user-specific folders
- **Streaks**: The streak calculation logic in the function is simplified - you may want to implement more sophisticated logic based on your requirements
- **Timestamps**: All tables use `TIMESTAMP WITH TIME ZONE` for proper timezone handling

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] All policies are properly configured
- [ ] Storage bucket is private
- [ ] Storage policies restrict access to user's own files
- [ ] Never expose Service Role Key in client-side code
- [ ] Use environment variables for API keys

