import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem, Customer } from "@/types";

const isMockMode = () => false;

export const orderService = {
  // 1. CREAR PEDIDO (GUEST CLIENTE)
  async createOrder(data: {
    restaurantId: string;
    customerName: string;
    customerPhone: string;
    deliveryType: "DOMICILIO" | "RECOGER" | "MESA";
    deliveryAddress?: string;
    deliveryNotes?: string;
    paymentMethod: "EFECTIVO" | "TRANSFERENCIA" | "ONLINE";
    deliveryFee: number;
    items: { menuItemId: string; name: string; categoryName: string; quantity: number; price: number; notes?: string }[];
  }): Promise<Order> {
    const totalAmount = data.items.reduce((acc, i) => acc + i.price * i.quantity, 0) + data.deliveryFee;

    if (isMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      const mockOrderItems = JSON.parse(localStorage.getItem("mock_order_items") || "[]");
      const mockCustomers = JSON.parse(localStorage.getItem("mock_customers") || "[]");

      const orderId = crypto.randomUUID();
      const orderNumber = mockOrders.length + 100;

      // Handle Customer persistence (Section 26)
      let customer = mockCustomers.find(
        (c: any) => c.restaurant_id === data.restaurantId && c.phone === data.customerPhone
      );
      if (!customer) {
        customer = {
          id: crypto.randomUUID(),
          restaurant_id: data.restaurantId,
          phone: data.customerPhone,
          name: data.customerName,
          address: data.deliveryAddress,
          total_orders: 1,
          total_spent: totalAmount,
          last_order_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        mockCustomers.push(customer);
      } else {
        customer.total_orders += 1;
        customer.total_spent = Number(customer.total_spent) + totalAmount;
        customer.last_order_at = new Date().toISOString();
        if (data.deliveryAddress) customer.address = data.deliveryAddress;
      }
      localStorage.setItem("mock_customers", JSON.stringify(mockCustomers));

      const newOrder: Order = {
        id: orderId,
        order_number: orderNumber,
        restaurant_id: data.restaurantId,
        customer_id: customer.id,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        delivery_type: data.deliveryType,
        delivery_address: data.deliveryAddress,
        delivery_notes: data.deliveryNotes,
        payment_method: data.paymentMethod,
        total_amount: totalAmount,
        delivery_fee: data.deliveryFee,
        status: "NUEVO",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newItems: OrderItem[] = data.items.map((i) => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        menu_item_id: i.menuItemId,
        item_name: i.name,
        category_name: i.categoryName,
        quantity: i.quantity,
        unit_price: i.price,
        subtotal: i.price * i.quantity,
        notes: i.notes,
        created_at: new Date().toISOString(),
      }));

      mockOrders.push(newOrder);
      localStorage.setItem("mock_orders", JSON.stringify(mockOrders));

      localStorage.setItem("mock_order_items", JSON.stringify([...mockOrderItems, ...newItems]));

      return { ...newOrder, items: newItems };
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Error al registrar el pedido.");
    }
    return result.order as Order;
  },

  // 2. OBTENER PEDIDOS DE UN RESTAURANTE
  async getOrders(restaurantId: string): Promise<Order[]> {
    if (isMockMode()) {
      const mockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      const mockOrderItems = JSON.parse(localStorage.getItem("mock_order_items") || "[]");
      
      const orders = mockOrders
        .filter((o: any) => o.restaurant_id === restaurantId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return orders.map((o: any) => ({
        ...o,
        items: mockOrderItems.filter((i: any) => i.order_id === o.id),
      }));
    }
    const supabase = createClient();
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;
    return orders.map((o: any) => ({
      ...o,
      items: (o.order_items || []) as OrderItem[],
    }));
  },

  // 3. OBTENER DETALLE DE UN PEDIDO INDIVIDUAL (PARA EL CLIENTE O RESTAURANTE)
  async getOrderById(orderId: string): Promise<Order | null> {
    if (isMockMode()) {
      const mockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      const mockOrderItems = JSON.parse(localStorage.getItem("mock_order_items") || "[]");
      const order = mockOrders.find((o: any) => o.id === orderId);
      if (!order) return null;

      const items = mockOrderItems.filter((i: any) => i.order_id === orderId);
      return { ...order, items };
    }
    const supabase = createClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return null;

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    return {
      ...order,
      items: (items || []) as OrderItem[],
    };
  },

  // 4. CAMBIAR ESTADO DE PEDIDO (Section 22 & 23)
  async updateOrderStatus(orderId: string, status: "NUEVO" | "ACEPTADO" | "EN_PREPARACION" | "LISTO" | "ENTREGADO" | "CANCELADO"): Promise<void> {
    if (isMockMode()) {
      const mockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      const idx = mockOrders.findIndex((o: any) => o.id === orderId);
      if (idx !== -1) {
        mockOrders[idx].status = status;
        mockOrders[idx].updated_at = new Date().toISOString();
        localStorage.setItem("mock_orders", JSON.stringify(mockOrders));

        // Trigger dummy custom event for frontend listeners simulating realtime updates
        const event = new CustomEvent(`order_update_${orderId}`, { detail: status });
        window.dispatchEvent(event);
      }
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) throw error;
  },

  // 5. OBTENER CLIENTES (Section 26)
  async getCustomers(restaurantId: string): Promise<Customer[]> {
    if (isMockMode()) {
      const mockCustomers = JSON.parse(localStorage.getItem("mock_customers") || "[]");
      return mockCustomers.filter((c: any) => c.restaurant_id === restaurantId);
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("total_orders", { ascending: false });

    if (error) throw error;
    return data as Customer[];
  },

  // 6. VACIAR PEDIDOS DE UN RESTAURANTE
  async clearRestaurantOrders(restaurantId: string): Promise<void> {
    if (isMockMode()) {
      const mockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      const remaining = mockOrders.filter((o: any) => o.restaurant_id !== restaurantId);
      localStorage.setItem("mock_orders", JSON.stringify(remaining));
      return;
    }
    const res = await fetch(`/api/admin/orders?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "No se pudieron eliminar los pedidos.");
    }
  }
};
