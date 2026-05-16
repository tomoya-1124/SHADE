import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      daily_logs: {
        Row: {
          id: string;
          user_id: string | null;
          date: string;
          face_score: number;
          body_score: number;
          mind_score: number;
          food_score: number;
          presence_score: number;
          total_score: number;
          memo: string | null;
          good_point: string | null;
          improvement: string | null;
          raw_data: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          date: string;
          face_score: number;
          body_score: number;
          mind_score: number;
          food_score: number;
          presence_score: number;
          total_score: number;
          memo?: string | null;
          good_point?: string | null;
          improvement?: string | null;
          raw_data: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          date?: string;
          face_score?: number;
          body_score?: number;
          mind_score?: number;
          food_score?: number;
          presence_score?: number;
          total_score?: number;
          memo?: string | null;
          good_point?: string | null;
          improvement?: string | null;
          raw_data?: Json;
          created_at?: string | null;
        };
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string)
  : null;
