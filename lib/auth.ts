import { supabase, type Session } from "./supabase";

export type AuthResult = {
  status: "success" | "error" | "skipped";
  message: string;
};

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithMagicLink(email: string): Promise<AuthResult> {
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
  const { error } = await supabase.auth.signOut();
  if (error) return { status: "error", message: error.message };
  return { status: "success", message: "ログアウトしました。" };
}

export async function onAuthStateChange(
  callback: (session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(
    (_event: string, session: Session | null) => callback(session),
  ).data.subscription;
}
