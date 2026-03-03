export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price?: number | null;
  category_id: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color_name: string;
  color_hex: string;
  quantity: number;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  image_url?: string | null;
  display_order: number;
  created_at: string;
  slug?: string; // Keeping slug optional as it might not be in DB but useful for frontend
}

export interface Order {
  id: string;
  order_number: number;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  wilaya_id: string | null;
  municipality_name: string;
  address: string | null;
  delivery_type: 'home' | 'post' | null;
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  instagram_account?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
}

export interface Wilaya {
  id: string;
  name: string;
  delivery_price_home: number;
  delivery_price_desk: number;
  is_active: boolean;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  delivery_company_name: string;
}
