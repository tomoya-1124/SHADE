import { supabase } from "./supabase";

export type AuthSession = {
  user: {
    id: string;
    email?: string;
  };
};

export type AuthResult = {
  status: "success" | "error" | "skipped";
  message: string;
};

const toAuthSession = (
  session: { user: { id: string; email?: string } } | null,
): AuthSession | null => {
  if (!session) return null;
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  };
};

export async function getCurrentSession(): Promise<AuthSession | null> {
  const { data } = await supabase.auth.getSession();
  return toAuthSession(data.session);
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

export function onAuthStateChange(
  callback: (session: AuthSession | null) => void,
) {
  return supabase.auth.onAuthStateChange(
    (
      _event: string,
      session: { user: { id: string; email?: string } } | null,
    ) => callback(toAuthSession(session)),
  ).data.subscription;
}
