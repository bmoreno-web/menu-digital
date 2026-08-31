import { createClient } from "@/lib/supabase/client";
import { Restaurant, Menu, MenuItem, MenuCategory } from "@/types";
import { SITE_CONFIG } from "@/config/site";

const isMockMode = () => false;

export const restaurantService = {
  // 1. OBTENER PERFIL DEL RESTAURANTE
  async getProfile(idOrSlug: string): Promise<Restaurant> {
    if (isMockMode()) {
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const rest = mockRestaurants.find(
        (r: any) => r.id === idOrSlug || r.owner_id === idOrSlug || r.slug === idOrSlug
      );
      if (!rest) throw new Error("Restaurante no encontrado.");
      return rest;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .or(`id.eq.${idOrSlug},owner_id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();

    if (error) throw error;
    return data as Restaurant;
  },

  // 2. ACTUALIZAR CONFIGURACIÓN DEL RESTAURANTE
  async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<Restaurant> {
    if (isMockMode()) {
      const mockRestaurants = JSON.parse(localStorage.getItem("mock_restaurants") || "[]");
      const idx = mockRestaurants.findIndex((r: any) => r.id === id);
      if (idx === -1) throw new Error("Restaurante no encontrado.");

      mockRestaurants[idx] = { ...mockRestaurants[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem("mock_restaurants", JSON.stringify(mockRestaurants));

      // Update current session if matching
      const session = localStorage.getItem("mock_session");
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.restaurant.id === id) {
          parsed.restaurant = mockRestaurants[idx];
          localStorage.setItem("mock_session", JSON.stringify(parsed));
        }
      }
      return mockRestaurants[idx];
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("restaurants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Restaurant;
  },

  // 3. OBTENER CATEGORÍAS DEL MENÚ
  async getCategories(restaurantId: string): Promise<MenuCategory[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
    }

    if (data && data.length > 0) {
      return data as MenuCategory[];
    }

    // Auto-seed default categories if empty
    const defaultCats = (SITE_CONFIG.defaultCategories || [
      "Platos Ejecutivos / Menú del Día",
      "Sopas del Día",
      "Bebidas",
      "Adicionales",
    ]).map((name, idx) => ({
      restaurant_id: restaurantId,
      name,
      display_order: idx,
    }));

    try {
      const { data: inserted } = await supabase
        .from("menu_categories")
        .insert(defaultCats)
        .select();
      if (inserted && inserted.length > 0) {
        return inserted as MenuCategory[];
      }
    } catch {
      // Handled
    }

    return defaultCats.map((c, i) => ({
      id: `cat-${i}`,
      ...c,
      created_at: new Date().toISOString(),
    })) as MenuCategory[];
  },

  // 4. CREAR CATEGORÍA
  async createCategory(restaurantId: string, name: string): Promise<MenuCategory> {
    if (isMockMode()) {
      const mockCats = JSON.parse(localStorage.getItem("mock_categories") || "[]");
      const newCat = {
        id: crypto.randomUUID(),
        restaurant_id: restaurantId,
        name,
        display_order: mockCats.length,
        created_at: new Date().toISOString(),
      };
      mockCats.push(newCat);
      localStorage.setItem("mock_categories", JSON.stringify(mockCats));
      return newCat;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("menu_categories")
      .insert({ restaurant_id: restaurantId, name })
      .select()
      .single();

    if (error) throw error;
    return data as MenuCategory;
  },

  // 5. OBTENER MENÚ ACTIVO (PÚBLICO O PRIVADO)
  async getActiveMenu(restaurantId: string): Promise<Menu | null> {
    if (isMockMode()) {
      const mockMenus = JSON.parse(localStorage.getItem("mock_menus") || "[]");
      const active = mockMenus.find((m: any) => m.restaurant_id === restaurantId && m.status === "PUBLISHED");
      if (!active) return null;

      const mockItems = JSON.parse(localStorage.getItem("mock_menu_items") || "[]");
      const items = mockItems.filter((i: any) => i.menu_id === active.id);
      return { ...active, items };
    }
    const supabase = createClient();
    const { data: menu, error: menuError } = await supabase
      .from("menus")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("status", "PUBLISHED")
      .maybeSingle();

    if (menuError) throw menuError;
    if (!menu) return null;

    const { data: items, error: itemsError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("menu_id", menu.id)
      .order("display_order", { ascending: true });

    if (itemsError) throw itemsError;
    return { ...menu, items: items as MenuItem[] };
  },

  // 6. OBTENER MENÚS (HISTÓRICO)
  async getMenusList(restaurantId: string): Promise<Menu[]> {
    if (isMockMode()) {
      const mockMenus = JSON.parse(localStorage.getItem("mock_menus") || "[]");
      return mockMenus.filter((m: any) => m.restaurant_id === restaurantId);
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("menu_date", { ascending: false });

    if (error) throw error;
    return data as Menu[];
  },

  // 7. CREAR O EDITAR UN MENÚ COMPLETO (Y SUS PLATOS)
  async saveMenu(
    restaurantId: string,
    menuDate: string,
    title: string,
    status: "DRAFT" | "PUBLISHED",
    items: Partial<MenuItem>[]
  ): Promise<Menu> {
    const res = await fetch("/api/restaurant/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        menuDate,
        title,
        status,
        items,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "No se pudo guardar el menú.");
    }
    return result.menu as Menu;
  },

  // 8. OBTENER DETALLE DE UN MENÚ POR ID
  async getMenuById(menuId: string): Promise<Menu | null> {
    if (isMockMode()) {
      const mockMenus = JSON.parse(localStorage.getItem("mock_menus") || "[]");
      const menu = mockMenus.find((m: any) => m.id === menuId);
      if (!menu) return null;

      const mockItems = JSON.parse(localStorage.getItem("mock_menu_items") || "[]");
      const items = mockItems.filter((i: any) => i.menu_id === menuId);
      return { ...menu, items };
    }
    const supabase = createClient();
    const { data: menu, error: menuError } = await supabase
      .from("menus")
      .select("*")
      .eq("id", menuId)
      .single();

    if (menuError) throw menuError;

    const { data: items, error: itemsError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("menu_id", menuId)
      .order("display_order", { ascending: true });

    if (itemsError) throw itemsError;
    return { ...menu, items: items as MenuItem[] };
  },

  // 9. ACTUALIZAR DISPONIBILIDAD DE UN PLATO (AGOTAR/DISPONIBLE) (Section 17)
  async updateItemAvailability(itemId: string, isAvailable: boolean): Promise<void> {
    if (isMockMode()) {
      const mockItems = JSON.parse(localStorage.getItem("mock_menu_items") || "[]");
      const idx = mockItems.findIndex((i: any) => i.id === itemId);
      if (idx !== -1) {
        mockItems[idx].is_available = isAvailable;
        mockItems[idx].updated_at = new Date().toISOString();
        localStorage.setItem("mock_menu_items", JSON.stringify(mockItems));
      }
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: isAvailable })
      .eq("id", itemId);

    if (error) throw error;
  }
};
