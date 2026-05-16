import {
  getSupabaseClient,
  isSupabaseConfigured,
  type Session,
} from "./supabase";

export type AuthResult = {
  status: "success" | "error" | "skipped";
  message: string;
};

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured || !supabase) {
    return { status: "skipped", message: "Supabase env is not configured." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        typeof window === "undefined" ? undefined : window.location.origin,
    },
  });

  if (error) return { status: "error", message: error.message };
  return {
    status: "success",
    message: "Magic Linkを送信しました。メールを確認してください。",
  };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured || !supabase) {
    return { status: "skipped", message: "Supabase env is not configured." };
  }

  const { error } = await supabase.auth.signOut();
  if (error) return { status: "error", message: error.message };
  return { status: "success", message: "ログアウトしました。" };
}

export async function onAuthStateChange(
  callback: (session: Session | null) => void,
) {
  const supabase = await getSupabaseClient();
  if (!supabase) return undefined;

  return supabase.auth.onAuthStateChange((_event, session) => callback(session))
    .data.subscription;
}
