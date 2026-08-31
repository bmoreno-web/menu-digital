import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SITE_CONFIG } from "@/config/site";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_SUPABASE_URL = "https://dhclsshwqktqmbyvpnuw.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_jj52_t67-ZowVzUjoqn6Fg_Vd6pXdZQ";

const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      restaurantName,
      responsibleName,
      email,
      password,
      whatsapp,
      phone,
      city,
      address,
      restaurantType,
    } = data;

    const normalizedEmail = (email || "").trim().includes("@")
      ? (email || "").trim()
      : `${(email || "").trim()}@menu-digital.com`;

    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Missing Supabase credentials in server" }, { status: 500 });
    }

    // 1. Create or retrieve auth user
    let userId: string;
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password || "password123",
      email_confirm: true,
      user_metadata: { full_name: responsibleName, role: "RESTAURANT_OWNER" },
    });

    if (userError) {
      if (userError.message.includes("already registered") || userError.message.includes("already exists")) {
        const { data: listData, error: listError } = await adminSupabase.auth.admin.listUsers();
        if (listError) throw listError;
        const existing = listData.users.find((u) => u.email === normalizedEmail);
        if (!existing) throw new Error("El correo ya está registrado.");
        userId = existing.id;
      } else {
        throw userError;
      }
    } else {
      userId = userData.user.id;
    }

    // 2. Upsert profile
    await adminSupabase.from("profiles").upsert({
      id: userId,
      email: normalizedEmail,
      full_name: responsibleName,
      phone: phone || whatsapp,
      role: "RESTAURANT_OWNER",
    });

    // 3. Create restaurant in PENDING / INACTIVE state (Requires Super Admin Approval)
    const slug = slugify(restaurantName) || `restaurante-${Date.now()}`;
    const { data: restData, error: restError } = await adminSupabase
      .from("restaurants")
      .insert({
        name: restaurantName,
        slug,
        owner_id: userId,
        restaurant_type: restaurantType || "Corrientazo / Almuerzo Casero",
        phone: phone || whatsapp,
        whatsapp,
        city: city || "Barranquilla",
        address: address || "",
        plan_tier: "free",
        is_active: false, // PENDING APPROVAL
      })
      .select()
      .single();

    if (restError) throw restError;

    // 4. Link restaurant_users
    await adminSupabase.from("restaurant_users").upsert({
      restaurant_id: restData.id,
      user_id: userId,
      role: "RESTAURANT_OWNER",
    });

    // 5. Create default categories
    const categoriesToInsert = SITE_CONFIG.defaultCategories.map((catName, idx) => ({
      restaurant_id: restData.id,
      name: catName,
      display_order: idx,
    }));
    await adminSupabase.from("menu_categories").insert(categoriesToInsert);

    return NextResponse.json({
      success: true,
      user: { id: userId, email: normalizedEmail },
      restaurant: restData,
    });
  } catch (err: any) {
    console.error("API Self-Registration Error:", err);
    return NextResponse.json({ error: err?.message || "Error al registrar restaurante" }, { status: 400 });
  }
}
