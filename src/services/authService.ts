import { createClient } from "@/lib/supabase/client";
import { SITE_CONFIG } from "@/config/site";
import { slugify } from "@/lib/utils";

// Detect if we are using placeholder credentials
const isMockMode = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl.includes("placeholder") || supabaseUrl.includes("your-project");
};

export const authService = {
  // 1. REGISTRO
  async register(data: {
    restaurantName: string;
    responsibleName: string;
    email: string;
    phone: string;
    whatsapp: string;
    password?: string;
    city: string;
    address: string;
    restaurantType: string;
  }) {
    if (isMockMode()) {
      // MOCK IMPLEMENTATION (Local Storage)
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
      if (mockUsers.some((u: any) => u.email === data.email)) {
        throw new Error("El correo electrónico ya está registrado.");
      }

      const userId = crypto.randomUUID();
      const restaurantId = crypto.randomUUID();
      const slug = slugify(data.restaurantName) || "mi-restaurante";

      const newProfile = {
        id: userId,
        email: data.email,
        full_name: data.responsibleName,
        phone: data.phone,
        role: "RESTAURANT_OWNER" as const,
        created_at: new Date().toISOString(),
      };

      const newRestaurant = {
        id: restaurantId,
        name: data.restaurantName,
        slug: slug,
        owner_id: userId,
        restaurant_type: data.restaurantType,
        phone: data.phone,
        whatsapp: data.whatsapp,
        city: data.city,
        address: data.address,
        logo_url: null,
        banner_url: null,
        description: "Menú casero y ejecutivo fresco todos los días.",
        opening_hours: "Lunes a Sábado: 11:00 AM - 3:30 PM",
        allows_delivery: true,
        allows_pickup: true,
        delivery_fee: 3000,
        is_active: true,
        plan_tier: "free",
        created_at: new Date().toISOString(),
      };

      const newMapping = {
        id: crypto.randomUUID(),
        restaurant_id: restaurantId,
        user_id: userId,
        role: "RESTAURANT_OWNER" as const,
      };

      // Create default categories
      const categories = SITE_CONFIG.defaultCategories.map((name, idx) => ({
        id: crypto.randomUUID(),
        restaurant_id: restaurantId,
        name,
        display_order: idx,
      }));

      // Persist Mock State
      mockUsers.push({ ...newProfile, password: data.password });
      localStorage.setItem("mock_users", JSON.stringify(mockUsers));

      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      mockRestaurants.push(newRestaurant);
      localStorage.setItem("mock_restaurants", JSON.stringify(mockRestaurants));

      const mockMappings = JSON.parse(localStorage.getItem("mock_restaurant_users") || "[]");
      mockMappings.push(newMapping);
      localStorage.setItem("mock_restaurant_users", JSON.stringify(mockMappings));

      localStorage.setItem("mock_categories", JSON.stringify([
        ...JSON.parse(localStorage.getItem("mock_categories") || "[]"),
        ...categories,
      ]));

      // Set active session
      localStorage.setItem("mock_session", JSON.stringify({ user: newProfile, restaurant: newRestaurant }));
      return { user: newProfile, restaurant: newRestaurant };
    }

    // REAL SUPABASE IMPLEMENTATION
    const supabase = createClient();
    
    // Sign Up auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password || "password123",
      options: {
        data: {
          full_name: data.responsibleName,
          role: "RESTAURANT_OWNER",
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Error al crear el usuario.");
    }

    const userId = authData.user.id;
    const slug = slugify(data.restaurantName) || `restaurante-${userId.slice(0, 5)}`;

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: data.email,
        full_name: data.responsibleName,
        phone: data.phone,
        role: "RESTAURANT_OWNER",
      });

    if (profileError) {
      throw new Error("No se pudo crear el perfil del usuario: " + profileError.message);
    }

    // Create restaurant
    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .insert({
        name: data.restaurantName,
        slug: slug,
        owner_id: userId,
        restaurant_type: data.restaurantType,
        phone: data.phone,
        whatsapp: data.whatsapp,
        city: data.city,
        address: data.address,
        plan_tier: "free",
      })
      .select()
      .single();

    if (restaurantError || !restaurantData) {
      throw new Error("No se pudo crear el restaurante: " + restaurantError?.message);
    }

    // Create restaurant-user mapping
    await supabase.from("restaurant_users").insert({
      restaurant_id: restaurantData.id,
      user_id: userId,
      role: "RESTAURANT_OWNER",
    });

    // Create initial categories
    const categoriesToInsert = SITE_CONFIG.defaultCategories.map((name, idx) => ({
      restaurant_id: restaurantData.id,
      name,
      display_order: idx,
    }));
    await supabase.from("menu_categories").insert(categoriesToInsert);

    return { user: authData.user, restaurant: restaurantData };
  },

  // 2. LOGIN
  async login(email: string, password?: string) {
    if (isMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const user = mockUsers.find((u: any) => u.email === email);

      if (!user) {
        throw new Error("Credenciales inválidas o correo no registrado.");
      }

      // Check password match if specified
      if (password && user.password && user.password !== password) {
        throw new Error("Contraseña incorrecta.");
      }

      // Retrieve restaurant mapping
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const restaurant = mockRestaurants.find((r: any) => r.owner_id === user.id);

      localStorage.setItem("mock_session", JSON.stringify({ user, restaurant }));
      return { user, restaurant };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || "",
    });

    if (error || !data.user) {
      throw new Error(error?.message || "Credenciales inválidas.");
    }

    // Fetch profile and restaurant
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    const { data: restaurantUser } = await supabase
      .from("restaurant_users")
      .select("restaurant_id")
      .eq("user_id", data.user.id)
      .single();

    let restaurant = null;
    if (restaurantUser) {
      const { data: restData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantUser.restaurant_id)
        .single();
      restaurant = restData;
    }

    return { user: profile || data.user, restaurant };
  },

  // 3. LOGOUT
  async logout() {
    if (isMockMode()) {
      localStorage.removeItem("mock_session");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
  },

  // 4. GET CURRENT SESSION
  async getSession() {
    if (isMockMode()) {
      const session = localStorage.getItem("mock_session");
      return session ? JSON.parse(session) : null;
    }
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    const { data: restaurantUser } = await supabase
      .from("restaurant_users")
      .select("restaurant_id")
      .eq("user_id", session.user.id)
      .single();

    let restaurant = null;
    if (restaurantUser) {
      const { data: restData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantUser.restaurant_id)
        .single();
      restaurant = restData;
    }

    return { user: profile || session.user, restaurant };
  }
};
