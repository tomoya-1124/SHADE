import { createClient } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type User = {
  id: string;
  email?: string;
};

export type Session = {
  user: User;
};

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

type QueryResult<T> = Promise<{ data: T; error: { message: string } | null }>;

type QueryBuilder<T> = {
  select: (columns: string) => QueryBuilder<T>;
  eq: (column: string, value: string) => QueryBuilder<T>;
  order: (column: string, options: { ascending: boolean }) => QueryBuilder<T>;
  insert: (
    value: Database["public"]["Tables"]["daily_logs"]["Insert"],
  ) => QueryResult<unknown>;
  then: Promise<{ data: T; error: { message: string } | null }>["then"];
};

export type SupabaseClientLike = {
  auth: {
    getSession: () => Promise<{ data: { session: Session | null } }>;
    signInWithOtp: (options: {
      email: string;
      options?: { emailRedirectTo?: string };
    }) => Promise<{ error: { message: string } | null }>;
    signOut: () => Promise<{ error: { message: string } | null }>;
    onAuthStateChange: (
      callback: (event: string, session: Session | null) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
  };
  from: (
    table: "daily_logs",
  ) => QueryBuilder<Database["public"]["Tables"]["daily_logs"]["Row"][]>;
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File,
        options: { cacheControl: string; upsert: boolean; contentType: string },
      ) => Promise<{ error: { message: string } | null }>;
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{
        data: { signedUrl: string } | null;
        error: { message: string } | null;
      }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let cachedClient: SupabaseClientLike | null = null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export async function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(
    supabaseUrl as string,
    supabaseAnonKey as string,
  ) as SupabaseClientLike;
  return cachedClient;
}
