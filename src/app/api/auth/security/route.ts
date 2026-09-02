import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_SUPABASE_URL = "https://dhclsshwqktqmbyvpnuw.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_jj52_t67-ZowVzUjoqn6Fg_Vd6pXdZQ";

const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_ANON_KEY;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, password } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario requerido." },
        { status: 400 }
      );
    }

    const adminSupabase = getAdminSupabase();

    const authUpdates: Record<string, any> = {};
    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (email && typeof email === "string" && email.trim().length > 0) {
      const trimmed = email.trim().toLowerCase();
      const normalizedEmail = trimmed.includes("@")
        ? trimmed
        : `${trimmed}@menu-digital.com`;
      authUpdates.email = normalizedEmail;
      authUpdates.email_confirm = true;
      profileUpdates.email = normalizedEmail;
    }

    if (password && typeof password === "string" && password.trim().length >= 6) {
      authUpdates.password = password.trim();
    }

    if (Object.keys(authUpdates).length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron cambios válidos." },
        { status: 400 }
      );
    }

    // 1. Update Supabase Auth user credentials
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      userId,
      authUpdates
    );

    if (authError) {
      console.error("Error updating auth user:", authError);
      return NextResponse.json(
        { error: authError.message || "Error al actualizar las credenciales en el sistema." },
        { status: 400 }
      );
    }

    // 2. Update profiles table
    if (profileUpdates.email) {
      const { error: profError } = await adminSupabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (profError) {
        console.warn("Warning updating profiles table:", profError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Credenciales de acceso actualizadas con éxito.",
    });
  } catch (err: any) {
    console.error("API Security Update Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno del servidor al actualizar credenciales." },
      { status: 500 }
    );
  }
}
