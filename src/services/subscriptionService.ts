import { createClient } from "@/lib/supabase/client";

const isMockMode = () => false;

export const subscriptionService = {
  async checkTrialStatus(restaurantId: string) {
    const maxDays = 7;
    const maxOrders = 30;

    if (isMockMode()) {
      // Mock Implementation using local storage
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const rest = mockRestaurants.find((r: any) => r.id === restaurantId);
      
      if (!rest) {
        return { active: true, reason: null, planTier: "pro" };
      }

      if (rest.plan_tier !== "free") {
        return { active: true, reason: null, planTier: rest.plan_tier };
      }

      // Check dates
      const createdDate = new Date(rest.created_at || new Date());
      const now = new Date();
      const diffTime = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Check orders
      const mockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      const orderCount = mockOrders.filter((o: any) => o.restaurant_id === restaurantId).length;

      if (diffDays >= maxDays) {
        return { 
          active: false, 
          reason: "TRIAL_EXPIRED", 
          daysUsed: diffDays, 
          orderCount, 
          maxDays, 
          maxOrders, 
          planTier: "free" 
        };
      }

      if (orderCount >= maxOrders) {
        return { 
          active: false, 
          reason: "ORDER_LIMIT_REACHED", 
          daysUsed: diffDays, 
          orderCount, 
          maxDays, 
          maxOrders, 
          planTier: "free" 
        };
      }

      return {
        active: true,
        reason: null,
        daysUsed: diffDays,
        daysLeft: Math.max(0, maxDays - diffDays),
        orderCount,
        maxDays,
        maxOrders,
        ordersLeft: Math.max(0, maxOrders - orderCount),
        planTier: "free"
      };
    }

    // Real Supabase Implementation
    const supabase = createClient();
    
    // Get restaurant details
    const { data: restaurant, error: restError } = await supabase
      .from("restaurants")
      .select("plan_tier, created_at")
      .eq("id", restaurantId)
      .single();

    if (restError || !restaurant) {
      return { active: true, reason: null, planTier: "pro" };
    }

    if (restaurant.plan_tier !== "free") {
      return { active: true, reason: null, planTier: restaurant.plan_tier };
    }

    const createdDate = new Date(restaurant.created_at);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Get order count
    const { count, error: orderError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId);

    const orderCount = count || 0;

    if (diffDays >= maxDays) {
      return { 
        active: false, 
        reason: "TRIAL_EXPIRED", 
        daysUsed: diffDays, 
        orderCount, 
        maxDays, 
        maxOrders, 
        planTier: "free" 
      };
    }

    if (orderCount >= maxOrders) {
      return { 
        active: false, 
        reason: "ORDER_LIMIT_REACHED", 
        daysUsed: diffDays, 
        orderCount, 
        maxDays, 
        maxOrders, 
        planTier: "free" 
      };
    }

    return {
      active: true,
      reason: null,
      daysUsed: diffDays,
      daysLeft: Math.max(0, maxDays - diffDays),
      orderCount,
      maxDays,
      maxOrders,
      ordersLeft: Math.max(0, maxOrders - orderCount),
      planTier: "free"
    };
  }
};
