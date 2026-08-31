import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");

    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Missing Supabase credentials in server" }, { status: 500 });
    }

    if (restaurantId && restaurantId !== "ALL") {
      // Delete orders for a specific restaurant
      const { error } = await adminSupabase
        .from("orders")
        .delete()
        .eq("restaurant_id", restaurantId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Pedidos del restaurante eliminados con éxito." });
    } else {
      // Delete all orders in DB
      const { error } = await adminSupabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Todos los pedidos han sido eliminados de la base de datos." });
    }
  } catch (err: any) {
    console.error("API Clear Orders Error:", err);
    return NextResponse.json({ error: err?.message || "Error al eliminar pedidos" }, { status: 400 });
  }
}
