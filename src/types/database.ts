export interface SiteSettings {
  id: string;
  site_name: string;
  logo_url: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  announcement_text?: string;
  hero_image_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  delivery_company_name: string;
  updated_at: string;
}

export interface Wilaya {
  id: string;
  name: string;
  delivery_price_home: number;
  delivery_price_desk: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  image_url?: string;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  category_id?: string;
  images: string[];
  is_active: boolean;
  created_at: string;
  // Joins
  category?: Category;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color_name: string;
  color_hex: string;
  quantity: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  wilaya_id?: string;
  municipality_name: string;
  address?: string;
  delivery_type: 'home' | 'post';
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  // Joins
  items?: OrderItem[];
  wilaya?: Wilaya;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  price: number;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
}

export interface AboutUsContent {
  id: string;
  title: string;
  content: string;
  features: any[]; // JSONB
  updated_at: string;
}
