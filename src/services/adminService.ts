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

    // Real Supabase Mode
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

    const supabase = createClient();
    const { error } = await supabase
      .from("restaurants")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", restaurantId);

    if (error) {
      console.error("Error toggling restaurant active state:", error);
      throw error;
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

    const supabase = createClient();
    const { error } = await supabase
      .from("restaurants")
      .update({ plan_tier: planTier, updated_at: new Date().toISOString() })
      .eq("id", restaurantId);

    if (error) {
      console.error("Error updating restaurant plan tier:", error);
      throw error;
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

  // Create restaurant directly from Super Admin
  async createRestaurant(data: {
    name: string;
    ownerName: string;
    ownerEmail: string;
    phone?: string;
    whatsapp: string;
    city: string;
    address: string;
    restaurantType: string;
    planTier: string;
  }) {
    const slug = slugify(data.name) || `restaurante-${Date.now()}`;

    if (isMockMode()) {
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const userId = crypto.randomUUID();
      const restaurantId = crypto.randomUUID();

      const newOwner = {
        id: userId,
        email: data.ownerEmail,
        full_name: data.ownerName,
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

    const supabase = createClient();

    // Get current super admin session to set as initial owner or link
    const { data: { session } } = await supabase.auth.getSession();
    const ownerId = session?.user?.id;

    if (!ownerId) {
      throw new Error("No hay sesión activa de administrador.");
    }

    // Insert restaurant
    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .insert({
        name: data.name,
        slug: slug,
        owner_id: ownerId,
        restaurant_type: data.restaurantType,
        phone: data.phone || data.whatsapp,
        whatsapp: data.whatsapp,
        city: data.city,
        address: data.address,
        plan_tier: data.planTier || "free",
        is_active: true,
      })
      .select()
      .single();

    if (restaurantError || !restaurantData) {
      throw new Error(restaurantError?.message || "Error al crear el restaurante.");
    }

    // Create default categories
    const categoriesToInsert = SITE_CONFIG.defaultCategories.map((name, idx) => ({
      restaurant_id: restaurantData.id,
      name,
      display_order: idx,
    }));
    await supabase.from("menu_categories").insert(categoriesToInsert);

    return restaurantData;
  }
};

