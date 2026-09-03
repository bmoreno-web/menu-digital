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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de restaurante requerido." },
        { status: 400 }
      );
    }

    const adminSupabase = getAdminSupabase();

    // Allowed fields for restaurant profile and settings
    const allowedFields = [
      "name",
      "slug",
      "description",
      "opening_hours",
      "address",
      "phone",
      "whatsapp",
      "city",
      "restaurant_type",
      "allows_delivery",
      "allows_pickup",
      "delivery_fee",
      "currency",
      "plan_tier",
      "logo_url",
      "banner_url",
      "is_active",
    ];

    const cleanUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === "slug" && typeof updates[key] === "string") {
          cleanUpdates[key] = updates[key]
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-");
        } else {
          cleanUpdates[key] = updates[key];
        }
      }
    }

    const { data: updatedRestaurant, error } = await adminSupabase
      .from("restaurants")
      .update(cleanUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating restaurant in /api/restaurant/profile:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, restaurant: updatedRestaurant });
  } catch (err: any) {
    console.error("Error in /api/restaurant/profile PATCH:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno al actualizar el perfil del restaurante." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}
