import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      restaurantId,
      customerName,
      customerPhone,
      deliveryType,
      deliveryAddress,
      deliveryNotes,
      paymentMethod,
      deliveryFee = 0,
      items = [],
    } = data;

    const totalAmount =
      items.reduce((acc: number, i: any) => acc + Number(i.price) * Number(i.quantity), 0) +
      Number(deliveryFee);

    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Missing Supabase credentials in server" }, { status: 500 });
    }

    // 1. Resolve or create customer profile
    let customerId: string | null = null;
    if (customerPhone) {
      const { data: existingCustomer } = await adminSupabase
        .from("customers")
        .select("id, total_orders, total_spent")
        .eq("restaurant_id", restaurantId)
        .eq("phone", customerPhone)
        .maybeSingle();

      if (!existingCustomer) {
        const { data: newCustomer } = await adminSupabase
          .from("customers")
          .insert({
            restaurant_id: restaurantId,
            phone: customerPhone,
            name: customerName,
            address: deliveryAddress || null,
            total_orders: 1,
            total_spent: totalAmount,
          })
          .select("id")
          .single();
        if (newCustomer) customerId = newCustomer.id;
      } else {
        customerId = existingCustomer.id;
        await adminSupabase
          .from("customers")
          .update({
            name: customerName,
            total_orders: (existingCustomer.total_orders || 0) + 1,
            total_spent: Number(existingCustomer.total_spent || 0) + totalAmount,
            last_order_at: new Date().toISOString(),
            address: deliveryAddress || undefined,
          })
          .eq("id", existingCustomer.id);
      }
    }

    // 2. Insert order
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_type: deliveryType,
        delivery_address: deliveryAddress || null,
        delivery_notes: deliveryNotes || null,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        delivery_fee: deliveryFee,
        status: "NUEVO",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return NextResponse.json({ error: orderError?.message || "Error al crear orden" }, { status: 400 });
    }

    // 3. Insert order items
    const itemsToInsert = items.map((i: any) => ({
      order_id: order.id,
      menu_item_id: i.menuItemId,
      item_name: i.name,
      category_name: i.categoryName,
      quantity: i.quantity,
      unit_price: Number(i.price),
      subtotal: Number(i.price) * Number(i.quantity),
      notes: i.notes || null,
    }));

    const { data: insertedItems, error: itemsError } = await adminSupabase
      .from("order_items")
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: insertedItems || [],
      },
    });
  } catch (err: any) {
    console.error("API Order Placement Error:", err);
    return NextResponse.json({ error: err?.message || "Error al procesar el pedido" }, { status: 500 });
  }
}
