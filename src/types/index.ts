export type UserRole = 'SUPER_ADMIN' | 'RESTAURANT_OWNER' | 'RESTAURANT_MANAGER' | 'RESTAURANT_STAFF';

export type MenuStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type OrderStatus = 'NUEVO' | 'ACEPTADO' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export type DeliveryType = 'RECOGER' | 'DOMICILIO' | 'MESA';

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'ONLINE';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  restaurant_type: string;
  phone?: string;
  whatsapp: string;
  city: string;
  address: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  opening_hours?: string;
  allows_delivery: boolean;
  allows_pickup: boolean;
  delivery_fee: number;
  currency: string;
  is_active: boolean;
  plan_tier: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  restaurant_id: string;
  category_id?: string;
  category_name: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  restaurant_id: string;
  menu_date: string;
  title: string;
  status: MenuStatus;
  items?: MenuItem[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  restaurant_id: string;
  phone: string;
  name: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  category_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  restaurant_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  delivery_address?: string;
  delivery_notes?: string;
  payment_method: PaymentMethod;
  total_amount: number;
  delivery_fee: number;
  status: OrderStatus;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}
