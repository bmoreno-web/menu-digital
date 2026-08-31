import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SITE_CONFIG } from "@/config/site";
import { slugify } from "@/lib/utils";

const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

// POST: Create restaurant with custom user and password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      ownerName,
      email,
      password,
      whatsapp,
      phone,
      city,
      address,
      restaurantType,
      planTier,
    } = body;

    const normalizedEmail = (email || "usuario").trim().includes("@")
      ? (email || "usuario").trim()
      : `${(email || "usuario").trim()}@menu-digital.com`;

    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Missing Supabase credentials in server" }, { status: 500 });
    }

    // 1. Create or retrieve auth user
    let userId: string;
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password || "Moremore2026",
      email_confirm: true,
      user_metadata: { full_name: ownerName, role: "RESTAURANT_OWNER" },
    });

    if (userError) {
      if (userError.message.includes("already registered") || userError.message.includes("already exists")) {
        const { data: listData, error: listError } = await adminSupabase.auth.admin.listUsers();
        if (listError) throw listError;
        const existing = listData.users.find((u) => u.email === normalizedEmail);
        if (!existing) throw new Error("No se pudo encontrar el usuario existente.");
        userId = existing.id;
        if (password) {
          await adminSupabase.auth.admin.updateUserById(userId, { password });
        }
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
      full_name: ownerName,
      phone: phone || whatsapp,
      role: "RESTAURANT_OWNER",
    });

    // 3. Create restaurant
    const slug = slugify(name) || `restaurante-${Date.now()}`;
    const { data: restData, error: restError } = await adminSupabase
      .from("restaurants")
      .insert({
        name,
        slug,
        owner_id: userId,
        restaurant_type: restaurantType || "Corrientazo / Almuerzo Casero",
        phone: phone || whatsapp,
        whatsapp,
        city: city || "Barranquilla",
        address: address || "",
        plan_tier: planTier || "free",
        is_active: true,
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

    return NextResponse.json({ success: true, restaurant: restData });
  } catch (err: any) {
    console.error("API Create Restaurant Error:", err);
    return NextResponse.json({ error: err?.message || "Error al crear restaurante" }, { status: 400 });
  }
}

// PUT: Update restaurant and optionally update owner password / credentials
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      ownerName,
      email,
      password,
      whatsapp,
      phone,
      city,
      address,
      restaurantType,
      planTier,
      isActive,
      ownerId,
    } = body;

    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Missing Supabase credentials in server" }, { status: 500 });
    }

    // 1. Update restaurant details
    const { data: updatedRest, error: restError } = await adminSupabase
      .from("restaurants")
      .update({
        name,
        restaurant_type: restaurantType,
        phone: phone || whatsapp,
        whatsapp,
        city,
        address,
        plan_tier: planTier,
        is_active: isActive !== undefined ? isActive : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (restError) throw restError;

    // 2. Update owner profile and auth credentials
    if (ownerId) {
      const normalizedEmail = email ? (email.trim().includes("@") ? email.trim() : `${email.trim()}@menu-digital.com`) : undefined;

      const profileUpdates: any = {
        full_name: ownerName,
        phone: phone || whatsapp,
        updated_at: new Date().toISOString(),
      };
      if (normalizedEmail) profileUpdates.email = normalizedEmail;

      await adminSupabase.from("profiles").update(profileUpdates).eq("id", ownerId);

      // If new password or email provided, update Auth User
      const authUpdates: any = {};
      if (password && password.trim().length > 0) {
        authUpdates.password = password.trim();
      }
      if (normalizedEmail) {
        authUpdates.email = normalizedEmail;
      }

      if (Object.keys(authUpdates).length > 0) {
        await adminSupabase.auth.admin.updateUserById(ownerId, authUpdates);
      }
    }

    return NextResponse.json({ success: true, restaurant: updatedRest });
  } catch (err: any) {
    console.error("API Update Restaurant Error:", err);
    return NextResponse.json({ error: err?.message || "Error al actualizar restaurante" }, { status: 400 });
  }
}
