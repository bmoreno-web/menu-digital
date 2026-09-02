import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encodeMenuItemMeta, decodeMenuItemMeta } from "@/lib/menuUtils";

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
    const { restaurantId, menuDate, title, status, items } = body;

    if (!restaurantId || !menuDate || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Datos incompletos para guardar el menú" },
        { status: 400 }
      );
    }

    const adminSupabase = getAdminSupabase();

    // 1. If status is PUBLISHED, archive other published menus for this restaurant
    if (status === "PUBLISHED") {
      await adminSupabase
        .from("menus")
        .update({ status: "ARCHIVED" })
        .eq("restaurant_id", restaurantId)
        .eq("status", "PUBLISHED");
    }

    // 2. Check if a menu for this restaurant and date already exists
    const { data: existingMenu } = await adminSupabase
      .from("menus")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("menu_date", menuDate)
      .maybeSingle();

    let menuId: string;
    let menuData: any;

    if (existingMenu) {
      const { data: updated, error: updateErr } = await adminSupabase
        .from("menus")
        .update({
          title: title || "Menú del Día",
          status: status || "PUBLISHED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMenu.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      menuId = existingMenu.id;
      menuData = updated;
    } else {
      const { data: created, error: createErr } = await adminSupabase
        .from("menus")
        .insert({
          restaurant_id: restaurantId,
          menu_date: menuDate,
          title: title || "Menú del Día",
          status: status || "PUBLISHED",
        })
        .select()
        .single();

      if (createErr) throw createErr;
      menuId = created.id;
      menuData = created;
    }

    // 3. Delete old items for this menu
    await adminSupabase.from("menu_items").delete().eq("menu_id", menuId);

    // 4. Insert new items with dual prices, active status, and is_special flag
    const validItems = items.filter((i: any) => i.name && i.name.trim().length > 0);
    const itemsToInsert = validItems.map((item: any, idx: number) => {
      const { finalDesc, price } = encodeMenuItemMeta(item);

      return {
        menu_id: menuId,
        restaurant_id: restaurantId,
        category_name: item.category_name || "Platos del Día",
        name: item.name.trim(),
        description: finalDesc,
        price,
        image_url: item.image_url || null,
        is_available: item.is_available !== undefined ? item.is_available : true,
        display_order: idx,
      };
    });

    let insertedItems: any[] = [];
    if (itemsToInsert.length > 0) {
      const { data: ins, error: insErr } = await adminSupabase
        .from("menu_items")
        .insert(itemsToInsert)
        .select();

      if (insErr) throw insErr;
      insertedItems = ins || [];
    }

    const formattedItems = insertedItems.map((item: any) => decodeMenuItemMeta(item));

    return NextResponse.json({
      success: true,
      menu: { ...menuData, items: formattedItems },
    });
  } catch (err: any) {
    console.error("API Save Menu Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error al guardar el menú" },
      { status: 400 }
    );
  }
}
