import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

type Translations = {
  [key: string]: {
    [key: string]: string;
  };
};

export const translations: Translations = {
  ar: {
    // Sidebar
    dashboard: 'لوحة التحكم',
    products: 'المنتجات',
    orders: 'الطلبات',
    categories: 'التصنيفات',
    wilayas: 'الولايات والتوصيل',
    settings: 'الإعدادات',
    about: 'من نحن',
    logout: 'تسجيل الخروج',
    
    // Dashboard
    total_sales: 'إجمالي المبيعات',
    total_orders: 'إجمالي الطلبات',
    pending_orders: 'طلبات قيد الانتظار',
    active_products: 'المنتجات النشطة',
    pending_orders_subtext: 'طلبات بانتظار التأكيد',
    active_orders: 'الطلبات النشطة',
    products_count: 'عدد المنتجات',
    customers_count: 'عدد الزبائن',
    recent_orders: 'أحدث الطلبات',
    order_number: 'رقم الطلب',
    customer: 'العميل',
    total: 'الإجمالي',
    status: 'الحالة',
    view_all: 'عرض الكل',
    no_orders: 'لا توجد طلبات',
    welcome_title: 'لوحة التحكم',
    welcome_subtitle: 'مرحباً بك في لوحة تحكم متجر بابيون.',
    
    // Products
    add_product: 'إضافة منتج جديد',
    edit_product: 'تعديل المنتج',
    product_name: 'اسم المنتج',
    category: 'التصنيف',
    price: 'السعر',
    discount_price: 'سعر التخفيض',
    description: 'الوصف',
    images: 'صور المنتج',
    is_active: 'نشر المنتج في المتجر',
    variants: 'المتغيرات (الألوان والمقاسات)',
    size: 'المقاس',
    color: 'اللون',
    quantity: 'الكمية',
    add: 'إضافة',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    confirm_delete_product: 'هل أنت متأكد من أنك تريد حذف هذا المنتج؟',
    active: 'نشط',
    draft: 'مسودة',
    no_variants: 'لا توجد متغيرات مضافة بعد',
    update_quantities: 'تحديث الكميات',
    
    // Orders
    all_statuses: 'جميع الحالات',
    pending: 'قيد الانتظار',
    confirmed: 'تم التأكيد',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغى',
    date: 'التاريخ',
    actions: 'إجراءات',
    confirm_order: 'تأكيد الطلب',
    reject_order: 'رفض الطلب',
    delete_order: 'حذف الطلب',
    print: 'طباعة',
    order_details: 'تفاصيل الطلب',
    customer_info: 'معلومات العميل',
    name: 'الاسم',
    phone: 'الهاتف',
    address: 'العنوان',
    wilaya: 'الولاية',
    instagram: 'انستغرام',
    items: 'المنتجات',
    total_amount: 'المجموع الكلي',
    update_status: 'تحديث الحالة',
    confirm_delete_order: 'هل أنت متأكد من حذف هذا الطلب نهائياً؟',
    
    // Categories
    add_category: 'إضافة تصنيف جديد',
    edit_category: 'تعديل التصنيف',
    category_name: 'اسم التصنيف',
    category_image: 'صورة التصنيف',
    display_order: 'ترتيب العرض',
    confirm_delete_category: 'هل أنت متأكد من أنك تريد حذف هذا التصنيف؟',
    no_image: 'لا توجد صورة',
    
    // Wilayas
    add_wilaya: 'إضافة ولاية',
    search_wilaya: 'بحث عن ولاية...',
    code: 'الرمز',
    delivery_home: 'توصيل للمنزل',
    delivery_desk: 'توصيل للمكتب',
    save_changes: 'حفظ التغييرات',
    
    // Settings
    site_settings: 'إعدادات الموقع',
    general_info: 'معلومات عامة',
    site_name: 'اسم الموقع',
    delivery_company: 'اسم شركة التوصيل',
    announcement: 'نص الإعلان',
    branding: 'الهوية البصرية',
    logo_url: 'رابط الشعار',
    favicon_url: 'رابط أيقونة الموقع',
    primary_color: 'اللون الأساسي',
    secondary_color: 'اللون الثانوي',
    hero_section: 'الواجهة الرئيسية',
    hero_image: 'رابط صورة الواجهة',
    hero_title: 'العنوان الرئيسي',
    hero_subtitle: 'العنوان الفرعي',
    
    // Common
    loading: 'جاري التحميل...',
    success_save: 'تم الحفظ بنجاح',
    error_save: 'حدث خطأ أثناء الحفظ',
    yes_delete: 'نعم، احذف',
    currency: 'د.ج',
    low_stock: 'تنبيه: مخزون منخفض',
    low_stock_desc: 'المنتجات التالية قاربت على النفاد',
    product: 'المنتج',
    current_stock: 'المخزون الحالي',
    copy_success: 'تم النسخ بنجاح',
    revenue_chart: 'إحصائيات الإيرادات (آخر 7 أيام)',
  },
  en: {
    // Sidebar
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    categories: 'Categories',
    wilayas: 'Wilayas & Delivery',
    settings: 'Settings',
    about: 'About Us',
    logout: 'Logout',
    
    // Dashboard
    total_sales: 'Total Sales',
    total_orders: 'Total Orders',
    pending_orders: 'Pending Orders',
    active_products: 'Active Products',
    pending_orders_subtext: 'Orders waiting for confirmation',
    active_orders: 'Active Orders',
    products_count: 'Products Count',
    customers_count: 'Customers Count',
    recent_orders: 'Recent Orders',
    order_number: 'Order #',
    customer: 'Customer',
    total: 'Total',
    status: 'Status',
    view_all: 'View All',
    no_orders: 'No orders found',
    welcome_title: 'Dashboard',
    welcome_subtitle: 'Welcome to Papillon Store Dashboard.',
    
    // Products
    add_product: 'Add New Product',
    edit_product: 'Edit Product',
    product_name: 'Product Name',
    category: 'Category',
    price: 'Price',
    discount_price: 'Discount Price',
    description: 'Description',
    images: 'Product Images',
    is_active: 'Publish to Store',
    variants: 'Variants (Colors & Sizes)',
    size: 'Size',
    color: 'Color',
    quantity: 'Quantity',
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm_delete_product: 'Are you sure you want to delete this product?',
    active: 'Active',
    draft: 'Draft',
    no_variants: 'No variants added yet',
    update_quantities: 'Update Quantities',
    
    // Orders
    all_statuses: 'All Statuses',
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    date: 'Date',
    actions: 'Actions',
    confirm_order: 'Confirm Order',
    reject_order: 'Reject Order',
    delete_order: 'Delete Order',
    print: 'Print',
    order_details: 'Order Details',
    customer_info: 'Customer Info',
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    wilaya: 'Wilaya',
    instagram: 'Instagram',
    items: 'Items',
    total_amount: 'Total Amount',
    update_status: 'Update Status',
    confirm_delete_order: 'Are you sure you want to delete this order permanently?',
    
    // Categories
    add_category: 'Add New Category',
    edit_category: 'Edit Category',
    category_name: 'Category Name',
    category_image: 'Category Image',
    display_order: 'Display Order',
    confirm_delete_category: 'Are you sure you want to delete this category?',
    no_image: 'No Image',
    
    // Wilayas
    add_wilaya: 'Add Wilaya',
    search_wilaya: 'Search wilaya...',
    code: 'Code',
    delivery_home: 'Home Delivery',
    delivery_desk: 'Desk Delivery',
    save_changes: 'Save Changes',
    
    // Settings
    site_settings: 'Site Settings',
    general_info: 'General Info',
    site_name: 'Site Name',
    delivery_company: 'Delivery Company',
    announcement: 'Announcement Text',
    branding: 'Branding',
    logo_url: 'Logo URL',
    favicon_url: 'Favicon URL',
    primary_color: 'Primary Color',
    secondary_color: 'Secondary Color',
    hero_section: 'Hero Section',
    hero_image: 'Hero Image URL',
    hero_title: 'Hero Title',
    hero_subtitle: 'Hero Subtitle',
    
    // Common
    loading: 'Loading...',
    success_save: 'Saved successfully',
    error_save: 'Error while saving',
    yes_delete: 'Yes, Delete',
    currency: 'DZD',
    low_stock: 'Low Stock Alert',
    low_stock_desc: 'The following products are running low',
    product: 'Product',
    current_stock: 'Current Stock',
    copy_success: 'Copied successfully',
    revenue_chart: 'Revenue Chart (Last 7 Days)',
  }
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: language === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
