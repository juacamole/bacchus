-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addictions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  description text,
  level integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT addictions_pkey PRIMARY KEY (id),
  CONSTRAINT addictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.consumption_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  addiction_id uuid,
  entry_date timestamp with time zone DEFAULT now(),
  image_url text,
  barcode_data text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT consumption_entries_pkey PRIMARY KEY (id),
  CONSTRAINT consumption_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT consumption_entries_addiction_id_fkey FOREIGN KEY (addiction_id) REFERENCES public.addictions(id)
);
CREATE TABLE public.streaks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  addiction_id uuid,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_entry_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT streaks_pkey PRIMARY KEY (id),
  CONSTRAINT streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT streaks_addiction_id_fkey FOREIGN KEY (addiction_id) REFERENCES public.addictions(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  dark_mode boolean DEFAULT false,
  notifications_enabled boolean DEFAULT true,
  reminder_frequency text DEFAULT 'daily'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
