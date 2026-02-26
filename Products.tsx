export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  category_id: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  image_url: string | null;
  display_order: number;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  size: string;
  color_name: string;
  color_hex: string;
  quantity: number;
  created_at: string;
};

export type Order = {
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
  instagram_account: string | null;
  created_at: string;
  is_read?: boolean;
  is_stock_deducted?: boolean;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
};

export type Wilaya = {
  id: string;
  name: string;
  delivery_price_home: number;
  delivery_price_desk: number;
  is_active: boolean;
};

export type SiteSettings = {
  id: string;
  site_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  announcement_text: string | null;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  delivery_company_name: string;
};

export type AboutUsContent = {
  id: string;
  title: string;
  content: string;
  features: any;
};
