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

// GET: Fetch all restaurants (including inactive and pending approval)
export async function GET() {
  try {
    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Missing Supabase credentials in server" }, { status: 500 });
    }

    const { data: restaurants, error } = await adminSupabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ success: true, restaurants: [] });
    }

    // Fetch all profiles to map owners
    const ownerIds: string[] = Array.from(
      new Set(restaurants.map((r: any) => r.owner_id).filter(Boolean))
    );
    const profilesMap: Record<string, any> = {};

    if (ownerIds.length > 0) {
      const { data: profiles } = await adminSupabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", ownerIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          profilesMap[p.id] = p;
        });
      }
    }

    const enrichedRestaurants = restaurants.map((r: any) => ({
      ...r,
      owner: profilesMap[r.owner_id] || {
        full_name: r.name || "Usuario Restaurante",
        email: r.phone ? `WA: ${r.phone}` : "contacto@menu-digital.com",
      },
    }));

    return NextResponse.json({ success: true, restaurants: enrichedRestaurants });
  } catch (err: any) {
    console.error("API GET Admin Restaurants Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error al obtener restaurantes" },
      { status: 400 }
    );
  }
}

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

    // 3. Create restaurant (Admin-created restaurants are active immediately)
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

    return NextResponse.json({
      success: true,
      restaurant: { ...restData, owner: { full_name: ownerName, email: normalizedEmail } },
    });
  } catch (err: any) {
    console.error("API Create Restaurant Error:", err);
    return NextResponse.json({ error: err?.message || "Error al crear restaurante" }, { status: 400 });
  }
}

// PUT: Edit restaurant and reset credentials
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      ownerId,
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
    } = body;

    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Missing Supabase credentials in server" }, { status: 500 });
    }

    // 1. Update restaurant record
    const restUpdates: any = {
      name,
      restaurant_type: restaurantType,
      phone: phone || whatsapp,
      whatsapp,
      city,
      address,
      plan_tier: planTier,
      is_active: isActive !== undefined ? isActive : true,
      updated_at: new Date().toISOString(),
    };

    if (body.slug && typeof body.slug === "string") {
      restUpdates.slug = slugify(body.slug);
    } else if (name) {
      restUpdates.slug = slugify(name);
    }

    const { data: updatedRest, error: restError } = await adminSupabase
      .from("restaurants")
      .update(restUpdates)
      .eq("id", id)
      .select()
      .single();

    if (restError) throw restError;

    // 2. Update owner profile and auth credentials
    if (ownerId) {
      const normalizedEmail = email
        ? email.trim().includes("@")
          ? email.trim()
          : `${email.trim()}@menu-digital.com`
        : undefined;

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
    return NextResponse.json(
      { error: err?.message || "Error al actualizar restaurante" },
      { status: 400 }
    );
  }
}

// PATCH: Quick update of active status or plan tier
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, is_active, plan_tier } = body;

    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Missing Supabase credentials in server" }, { status: 500 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (is_active !== undefined) updates.is_active = is_active;
    if (plan_tier !== undefined) updates.plan_tier = plan_tier;

    const { data: updated, error } = await adminSupabase
      .from("restaurants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, restaurant: updated });
  } catch (err: any) {
    console.error("API PATCH Restaurant Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error al actualizar estado" },
      { status: 400 }
    );
  }
}
