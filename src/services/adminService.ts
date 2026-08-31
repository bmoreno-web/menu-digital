import { createClient } from "@/lib/supabase/client";
import { SITE_CONFIG } from "@/config/site";
import { slugify } from "@/lib/utils";

const isMockMode = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl.includes("placeholder") || supabaseUrl.includes("your-project");
};

export const adminService = {
  // Get all restaurants with their owner's profile details
  async getAllRestaurants() {
    if (isMockMode()) {
      // Mock mode using LocalStorage
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");

      return mockRestaurants.map((restaurant: any) => {
        const owner = mockUsers.find((u: any) => u.id === restaurant.owner_id);
        return {
          ...restaurant,
          owner: owner
            ? { full_name: owner.full_name, email: owner.email }
            : { full_name: "Usuario Demo", email: "demo@correo.com" },
        };
      });
    }

    // Real Supabase API Route (Bypasses RLS so pending and inactive restaurants are always visible)
    try {
      const res = await fetch(`/api/admin/restaurants?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.restaurants)) {
        return result.restaurants;
      }
    } catch (e) {
      console.warn("Falling back to direct Supabase client for admin restaurants:", e);
    }

    // Fallback: Direct Supabase client
    const supabase = createClient();
    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin restaurants:", error);
      throw error;
    }

    if (!restaurants || restaurants.length === 0) return [];

    // Fetch all profiles to map owners
    const ownerIds: string[] = Array.from(new Set(restaurants.map((r: any) => r.owner_id).filter(Boolean)));
    const profilesMap: Record<string, any> = {};

    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          profilesMap[p.id] = p;
        });
      }
    }

    return restaurants.map((r: any) => ({
      ...r,
      owner: profilesMap[r.owner_id] || {
        full_name: r.name || "Usuario Restaurante",
        email: r.phone ? `WA: ${r.phone}` : "contacto@menu-digital.com",
      },
    }));
  },

  // Toggle restaurant is_active flag
  async toggleRestaurantActive(restaurantId: string, isActive: boolean) {
    if (isMockMode()) {
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const idx = mockRestaurants.findIndex((r: any) => r.id === restaurantId);
      if (idx !== -1) {
        mockRestaurants[idx].is_active = isActive;
        mockRestaurants[idx].updated_at = new Date().toISOString();
        localStorage.setItem("mock_restaurants", JSON.stringify(mockRestaurants));
      }
      return;
    }

    const res = await fetch("/api/admin/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: restaurantId, is_active: isActive }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "No se pudo cambiar el estado del restaurante.");
    }
  },

  // Update restaurant plan tier
  async updateRestaurantPlan(restaurantId: string, planTier: string) {
    if (isMockMode()) {
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const idx = mockRestaurants.findIndex((r: any) => r.id === restaurantId);
      if (idx !== -1) {
        mockRestaurants[idx].plan_tier = planTier;
        mockRestaurants[idx].updated_at = new Date().toISOString();
        localStorage.setItem("mock_restaurants", JSON.stringify(mockRestaurants));
      }
      return;
    }

    const res = await fetch("/api/admin/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: restaurantId, plan_tier: planTier }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "No se pudo actualizar el plan del restaurante.");
    }
  },

  // Delete restaurant
  async deleteRestaurant(restaurantId: string) {
    if (isMockMode()) {
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const filtered = mockRestaurants.filter((r: any) => r.id !== restaurantId);
      localStorage.setItem("mock_restaurants", JSON.stringify(filtered));
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("restaurants")
      .delete()
      .eq("id", restaurantId);

    if (error) {
      console.error("Error deleting restaurant:", error);
      throw error;
    }
  },

  // Create restaurant directly from Super Admin (creates auth user + password + restaurant)
  async createRestaurant(data: {
    name: string;
    ownerName: string;
    email: string;
    password?: string;
    phone?: string;
    whatsapp: string;
    city: string;
    address: string;
    restaurantType: string;
    planTier: string;
  }) {
    if (isMockMode()) {
      const slug = slugify(data.name) || `restaurante-${Date.now()}`;
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const userId = crypto.randomUUID();
      const restaurantId = crypto.randomUUID();

      const newOwner = {
        id: userId,
        email: data.email,
        full_name: data.ownerName,
        password: data.password || "Moremore2026",
        role: "RESTAURANT_OWNER",
        created_at: new Date().toISOString(),
      };
      mockUsers.push(newOwner);
      localStorage.setItem("mock_users", JSON.stringify(mockUsers));

      const newRestaurant = {
        id: restaurantId,
        name: data.name,
        slug,
        owner_id: userId,
        restaurant_type: data.restaurantType,
        phone: data.phone || data.whatsapp,
        whatsapp: data.whatsapp,
        city: data.city,
        address: data.address,
        is_active: true,
        plan_tier: data.planTier || "free",
        created_at: new Date().toISOString(),
      };
      mockRestaurants.push(newRestaurant);
      localStorage.setItem("mock_restaurants", JSON.stringify(mockRestaurants));
      return newRestaurant;
    }

    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Error al crear el restaurante.");
    }
    return result.restaurant;
  },

  // Update restaurant and optionally update owner password / credentials
  async updateRestaurant(data: {
    id: string;
    ownerId?: string;
    name: string;
    ownerName: string;
    email: string;
    password?: string;
    phone?: string;
    whatsapp: string;
    city: string;
    address: string;
    restaurantType: string;
    planTier: string;
    isActive: boolean;
  }) {
    if (isMockMode()) {
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");

      const restIdx = mockRestaurants.findIndex((r: any) => r.id === data.id);
      if (restIdx !== -1) {
        mockRestaurants[restIdx] = {
          ...mockRestaurants[restIdx],
          name: data.name,
          restaurant_type: data.restaurantType,
          phone: data.phone || data.whatsapp,
          whatsapp: data.whatsapp,
          city: data.city,
          address: data.address,
          plan_tier: data.planTier,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem("mock_restaurants", JSON.stringify(mockRestaurants));
      }

      if (data.ownerId) {
        const userIdx = mockUsers.findIndex((u: any) => u.id === data.ownerId);
        if (userIdx !== -1) {
          mockUsers[userIdx].full_name = data.ownerName;
          mockUsers[userIdx].email = data.email;
          if (data.password) mockUsers[userIdx].password = data.password;
          localStorage.setItem("mock_users", JSON.stringify(mockUsers));
        }
      }

      return mockRestaurants[restIdx];
    }

    const res = await fetch("/api/admin/restaurants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Error al actualizar el restaurante.");
    }
    return result.restaurant;
  },

  // Clear all orders in database or for a specific restaurant
  async clearOrders(restaurantId?: string) {
    if (isMockMode()) {
      if (restaurantId && restaurantId !== "ALL") {
        const mockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
        const remaining = mockOrders.filter((o: any) => o.restaurant_id !== restaurantId);
        localStorage.setItem("mock_orders", JSON.stringify(remaining));
      } else {
        localStorage.removeItem("mock_orders");
        localStorage.removeItem("mock_order_items");
      }
      return;
    }

    const url = restaurantId && restaurantId !== "ALL"
      ? `/api/admin/orders?restaurantId=${restaurantId}`
      : `/api/admin/orders`;

    const res = await fetch(url, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Error al eliminar pedidos.");
    }
    return result;
  }
};

