-- ==============================================================================
-- PROJECT_NAME — BASE DE DATOS Y SEGURIDAD MULTI-TENANT (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'RESTAURANT_STAFF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE menu_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('NUEVO', 'ACEPTADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_type AS ENUM ('RECOGER', 'DOMICILIO', 'MESA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'ONLINE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'RESTAURANT_OWNER',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: RESTAURANTS (Tenants)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  restaurant_type TEXT NOT NULL DEFAULT 'Corrientazo',
  phone TEXT,
  whatsapp TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Barranquilla',
  address TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT DEFAULT 'Menú casero y ejecutivo fresco todos los días.',
  opening_hours TEXT DEFAULT 'Lunes a Sábado: 11:00 AM - 3:30 PM',
  allows_delivery BOOLEAN NOT NULL DEFAULT true,
  allows_pickup BOOLEAN NOT NULL DEFAULT true,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 3000.00,
  currency TEXT NOT NULL DEFAULT 'COP',
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);

-- 5. TABLA: RESTAURANT_USERS (Asignación de miembros al restaurante)
CREATE TABLE IF NOT EXISTS public.restaurant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'RESTAURANT_STAFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_users_user ON public.restaurant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_rest ON public.restaurant_users(restaurant_id);

-- 6. TABLA: MENUS (Histórico y menú diario)
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  menu_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL DEFAULT 'Menú del Día',
  status menu_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menus_restaurant_date ON public.menus(restaurant_id, menu_date);
CREATE INDEX IF NOT EXISTS idx_menus_status ON public.menus(restaurant_id, status);

-- 7. TABLA: MENU_CATEGORIES
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_rest ON public.menu_categories(restaurant_id, display_order);

-- 8. TABLA: MENU_ITEMS (Opciones del menú)
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL DEFAULT 'General',
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON public.menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_available ON public.menu_items(restaurant_id, is_available);

-- 9. TABLA: CUSTOMERS (Directorio auto-poblado por pedidos)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  total_orders INT NOT NULL DEFAULT 1,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  last_order_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_rest_phone ON public.customers(restaurant_id, phone);

-- 10. TABLA: ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type delivery_type NOT NULL DEFAULT 'DOMICILIO',
  delivery_address TEXT,
  delivery_notes TEXT,
  payment_method payment_method NOT NULL DEFAULT 'EFECTIVO',
  total_amount NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status order_status NOT NULL DEFAULT 'NUEVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.orders(restaurant_id, status, created_at DESC);

-- 11. TABLA: ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  category_name TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 12. TABLA: AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user belongs to restaurant
CREATE OR REPLACE FUNCTION public.is_member_of_restaurant(target_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_users
    WHERE restaurant_id = target_restaurant_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RESTAURANTS Policies
-- Public can view active restaurants by slug
CREATE POLICY "Public can view active restaurants" ON public.restaurants
  FOR SELECT USING (is_active = true);

-- Restaurant owners and staff can manage their restaurant
CREATE POLICY "Members can manage their restaurant" ON public.restaurants
  FOR ALL USING (public.is_member_of_restaurant(id) OR owner_id = auth.uid());

CREATE POLICY "Authenticated users can create a restaurant" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- MENUS Policies
-- Public can view published menus
CREATE POLICY "Public can view published menus" ON public.menus
  FOR SELECT USING (status = 'PUBLISHED');

-- Members can manage all menus of their restaurant
CREATE POLICY "Members can manage restaurant menus" ON public.menus
  FOR ALL USING (public.is_member_of_restaurant(restaurant_id));

-- MENU_CATEGORIES Policies
CREATE POLICY "Public can view categories of active restaurants" ON public.menu_categories
  FOR SELECT USING (true);

CREATE POLICY "Members can manage restaurant categories" ON public.menu_categories
  FOR ALL USING (public.is_member_of_restaurant(restaurant_id));

-- MENU_ITEMS Policies
-- Public can view items belonging to published menus
CREATE POLICY "Public can view menu items of published menus" ON public.menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = menu_items.menu_id AND menus.status = 'PUBLISHED'
    )
  );

CREATE POLICY "Members can manage menu items" ON public.menu_items
  FOR ALL USING (public.is_member_of_restaurant(restaurant_id));

-- CUSTOMERS Policies
CREATE POLICY "Members can view and manage restaurant customers" ON public.customers
  FOR ALL USING (public.is_member_of_restaurant(restaurant_id));

-- ORDERS Policies
-- Anyone (guest customer) can create an order
CREATE POLICY "Public can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Anyone can view their own order if they have the UUID (for confirmation page)
CREATE POLICY "Public can view order by id" ON public.orders
  FOR SELECT USING (true);

-- Restaurant staff can manage orders
CREATE POLICY "Members can manage orders" ON public.orders
  FOR ALL USING (public.is_member_of_restaurant(restaurant_id));

-- ORDER_ITEMS Policies
CREATE POLICY "Public can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view order items" ON public.order_items
  FOR SELECT USING (true);

-- TRIGGER: Auto-create Profile and Restaurant Relation on Auth Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      CASE 
        WHEN new.raw_user_meta_data IS NOT NULL THEN new.raw_user_meta_data->>'full_name'
        ELSE NULL
      END, 
      'Usuario Restaurante'
    ),
    COALESCE(
      CASE 
        WHEN new.raw_user_meta_data IS NOT NULL AND (new.raw_user_meta_data->>'role') IS NOT NULL 
        THEN (new.raw_user_meta_data->>'role')::user_role
        ELSE NULL
      END, 
      'RESTAURANT_OWNER'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
