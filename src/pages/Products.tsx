import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category, ProductVariant } from '@/types/database';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ImageUpload } from '@/components/ImageUpload';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    discount_price: 0,
    category_id: '',
    images: [],
    is_active: true
  });
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(*), variants:product_variants(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name')
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  }

  function handleOpenModal(product?: Product) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        discount_price: product.discount_price,
        category_id: product.category_id || '',
        images: product.images,
        is_active: product.is_active
      });
      setVariants(product.variants || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        discount_price: 0,
        category_id: categories[0]?.id || '',
        images: [],
        is_active: true
      });
      setVariants([]);
    }
    setIsModalOpen(true);
  }

  async function handleSave() {
    try {
      let productId = editingProduct?.id;
      
      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        category_id: formData.category_id || null,
        images: formData.images || [],
        is_active: formData.is_active
      };

      console.log('Saving product:', productPayload);

      // 1. Save Product
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productPayload)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // 2. Save Variants
      if (productId) {
        // Identify variants to keep (those with IDs)
        const keepVariantIds = variants.filter(v => v.id).map(v => v.id);
        
        // Delete removed variants
        if (keepVariantIds.length > 0) {
           await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', productId)
            .not('id', 'in', `(${keepVariantIds.join(',')})`);
        } else if (editingProduct && variants.length === 0) {
           // If editing and cleared all variants, delete all
           await supabase.from('product_variants').delete().eq('product_id', productId);
        }

        // Upsert variants
        // Filter out empty variants if necessary, or validate them
        const validVariants = variants.filter(v => v.size && v.color_name);
        
        const variantsPayload = validVariants.map(v => {
          const variant: any = {
            product_id: productId,
            size: v.size,
            color_name: v.color_name,
            color_hex: v.color_hex || '#000000',
            quantity: Number(v.quantity)
          };
          // Only add ID if it exists (for updates)
          if (v.id) {
            variant.id = v.id;
          }
          return variant;
        });

        if (variantsPayload.length > 0) {
          const { error: variantError } = await supabase
            .from('product_variants')
            .upsert(variantsPayload);
          
          if (variantError) throw variantError;
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('فشل حفظ المنتج: ' + (error as any).message);
    }
  }

  function handleDelete(id: string) {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    
    const { error } = await supabase.from('products').delete().eq('id', productToDelete);
    if (error) {
      alert('فشل حذف المنتج');
    } else {
      fetchData();
    }
    setProductToDelete(null);
  }

  // Variant Helpers
  function addVariant() {
    setVariants([...variants, { size: 'M', color_name: 'Black', color_hex: '#000000', quantity: 0 }]);
  }

  function updateVariant(index: number, field: keyof ProductVariant, value: any) {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-neutral-900">المنتجات</h2>
          <p className="text-neutral-500 mt-1">إدارة المخزون والكتالوج الخاص بك.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-800 transition-colors"
        >
          <Plus size={20} /> إضافة منتج
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden group">
            <div className="aspect-[4/3] bg-neutral-100 relative">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <ImageIcon size={32} />
                </div>
              )}
              <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(product)}
                  className="p-2 bg-white rounded-full shadow-sm hover:bg-neutral-50"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-lg truncate pl-2">{product.name}</h3>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", product.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                  {product.is_active ? 'نشط' : 'مسودة'}
                </span>
              </div>
              <p className="text-sm text-neutral-500 mb-3">{product.category?.name}</p>
              <div className="flex items-center gap-2">
                <span className="font-bold">{product.price.toLocaleString()} د.ج</span>
                {product.discount_price && (
                  <span className="text-sm text-neutral-400 line-through">{product.discount_price.toLocaleString()} د.ج</span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 flex justify-between">
                <span>{product.variants?.reduce((acc, v) => acc + (v.quantity || 0), 0)} في المخزون</span>
                <span>{product.variants?.length} متغيرات</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-serif font-bold">
                {editingProduct ? 'تعديل المنتج' : 'منتج جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم المنتج</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">التصنيف</label>
                  <select 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={formData.category_id || ''}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">اختر التصنيف</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">السعر (د.ج)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={formData.price || ''}
                    onChange={e => setFormData({...formData, price: e.target.value === '' ? 0 : Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">سعر الخصم (اختياري)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={formData.discount_price || ''}
                    onChange={e => setFormData({...formData, discount_price: e.target.value === '' ? 0 : Number(e.target.value)})}
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-sm font-medium">الوصف</label>
                  <textarea 
                    className="w-full p-2 border border-neutral-200 rounded-lg h-24"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-sm font-medium">صور المنتج</label>
                  <ImageUpload 
                    value={formData.images || []}
                    onChange={(urls) => setFormData({...formData, images: urls})}
                    multiple={true}
                    maxFiles={5}
                  />
                </div>
              </div>

              {/* Variants */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-lg">المتغيرات (الألوان والمقاسات)</h4>
                  <button onClick={addVariant} className="text-sm text-blue-600 hover:underline">+ إضافة متغير</button>
                </div>
                <div className="space-y-3">
                  {variants.map((variant, idx) => (
                    <div key={idx} className="flex gap-4 items-end bg-neutral-50 p-4 rounded-lg">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-neutral-500">المقاس</label>
                        <input 
                          type="text" 
                          className="w-full p-1.5 border border-neutral-200 rounded text-sm"
                          value={variant.size || ''}
                          onChange={e => updateVariant(idx, 'size', e.target.value)}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-neutral-500">اسم اللون</label>
                        <input 
                          type="text" 
                          className="w-full p-1.5 border border-neutral-200 rounded text-sm"
                          value={variant.color_name || ''}
                          onChange={e => updateVariant(idx, 'color_name', e.target.value)}
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <label className="text-xs text-neutral-500">الكمية</label>
                        <input 
                          type="number" 
                          className="w-full p-1.5 border border-neutral-200 rounded text-sm"
                          value={variant.quantity || ''}
                          onChange={e => updateVariant(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </div>
                      <button 
                        onClick={() => removeVariant(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 flex items-center gap-2"
              >
                <Save size={18} /> حفظ المنتج
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف المنتج"
        message="هل أنت متأكد أنك تريد حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}
