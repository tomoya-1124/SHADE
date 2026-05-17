import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectUrl = new URL("/", request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
    }

    if (!supabaseAnonKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      redirectUrl.searchParams.set("auth_error", "callback_failed");
    }
  }

  return NextResponse.redirect(redirectUrl);
}
