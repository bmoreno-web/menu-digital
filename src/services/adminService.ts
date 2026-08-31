import { createClient } from "@/lib/supabase/client";

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
    const { data, error } = await supabase
      .from("restaurants")
      .select(`
        *,
        owner:profiles!restaurants_owner_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin restaurants:", error);
      throw error;
    }
    return data;
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
  }
};
