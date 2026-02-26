import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category, ProductVariant } from '../types/database';
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, Image as ImageIcon, Layers } from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import ConfirmationModal from '../components/ConfirmationModal';
import ImageUpload from '../components/ImageUpload';
import { useLanguage } from '../lib/i18n';

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  // Quantity Update Modal State
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedProductForQty, setSelectedProductForQty] = useState<Product | null>(null);

  // Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null }>({
    isOpen: false,
    productId: null
  });
  const [deleteVariantModal, setDeleteVariantModal] = useState<{ isOpen: boolean; variantId: string | null }>({
    isOpen: false,
    variantId: null
  });

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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  }

  async function fetchVariants(productId: string) {
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', productId);
    if (data) setVariants(data);
  }

  const handleOpenModal = async (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
      await fetchVariants(product.id);
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
  };

  const handleOpenQuantityModal = async (product: Product) => {
    setSelectedProductForQty(product);
    await fetchVariants(product.id);
    setIsQuantityModalOpen(true);
  };

  const handleUpdateQuantity = async (variantId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ quantity: newQuantity })
        .eq('id', variantId);

      if (error) throw error;

      setVariants(prev => prev.map(v => v.id === variantId ? { ...v, quantity: newQuantity } : v));
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('حدث خطأ أثناء تحديث الكمية');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([formData])
          .select()
          .single();
        if (error) throw error;
        productId = data.id;

        // Save variants for new product
        if (variants.length > 0) {
          const variantsToInsert = variants.map(v => ({
            product_id: productId,
            size: v.size,
            color_name: v.color_name,
            color_hex: v.color_hex,
            quantity: v.quantity
          }));
          
          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantsToInsert);
            
          if (variantsError) console.error('Error saving variants:', variantsError);
        }
      }
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء حفظ المنتج');
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteModal({ isOpen: true, productId: id });
  };

  const handleDelete = async () => {
    if (!deleteModal.productId) return;
    
    try {
      // 1. Unlink from orders first (preserve history, remove constraint)
      // We set product_id to null so the order item remains but isn't tied to the deleted product
      const { error: unlinkError } = await supabase
        .from('order_items')
        .update({ product_id: null })
        .eq('product_id', deleteModal.productId);

      if (unlinkError) throw unlinkError;

      // 2. Delete variants (manual cascade)
      const { error: variantsError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', deleteModal.productId);
        
      if (variantsError) throw variantsError;

      // 3. Delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteModal.productId);
      
      if (productError) throw productError;

      fetchProducts();
      setDeleteModal({ isOpen: false, productId: null });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(`فشل حذف المنتج: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  const handleDeleteVariant = async () => {
    if (!deleteVariantModal.variantId) return;
    await supabase.from('product_variants').delete().eq('id', deleteVariantModal.variantId);
    setVariants(variants.filter(item => item.id !== deleteVariantModal.variantId));
    setDeleteVariantModal({ isOpen: false, variantId: null });
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-gray-900">{t('products')}</h1>
        <button 
          id="btn-add-product"
          onClick={() => handleOpenModal()}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
        >
          <Plus size={20} /> {t('add_product')}
        </button>
      </div>

      <div id="products-table" className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-bold text-gray-500">{t('images')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('product_name')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('category')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('price')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('status')}</th>
                <th className="px-6 py-5 font-bold text-gray-500 text-left">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden border border-gray-200">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 text-base">{product.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {categories.find(c => c.id === product.category_id)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-700 font-medium text-base">
                    {formatNumber(product.price)} {t('currency')}
                    {product.discount_price && (
                      <span className="mr-2 text-xs text-red-500 line-through">
                        {formatNumber(product.discount_price)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold",
                      product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    )}>
                      {product.is_active ? t('active') : t('draft')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
                    <button 
                      onClick={() => handleOpenQuantityModal(product)}
                      className="btn-update-qty p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-black hover:text-white transition-all"
                      title={t('update_quantities')}
                    >
                      <Layers size={18} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(product)}
                      className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-black hover:text-white transition-all"
                      title={t('edit')}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(product.id)}
                      className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                      title={t('delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null })}
        onConfirm={handleDelete}
        title={t('delete')}
        message={t('confirm_delete_product')}
        confirmText={t('yes_delete')}
        cancelText={t('cancel')}
        isDangerous={true}
      />

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {editingProduct ? t('edit_product') : t('add_product')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('product_name')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
                    placeholder={t('product_name')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('category')}</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
                  >
                    <option value="">{t('category')}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{t('description')}</label>
                <textarea
                  rows={4}
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
                  placeholder={t('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('price')} ({t('currency')})</label>
                  <input
                    type="number"
                    required
                    dir="ltr"
                    value={formData.price || ''}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('discount_price')} ({t('currency')})</label>
                  <input
                    type="number"
                    dir="ltr"
                    value={formData.discount_price || ''}
                    onChange={e => setFormData({...formData, discount_price: e.target.value ? Number(e.target.value) : null})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white text-right"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">{t('images')}</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <ImageUpload 
                      onChange={handleImageUpload}
                      placeholder={t('add')}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {formData.images?.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-bold text-gray-900 cursor-pointer">{t('is_active')}</label>
              </div>

              {/* Variants Section */}
              <div className="border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{t('variants')}</h3>
                </div>
                
                {/* Add Variant Form */}
                <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <input
                    placeholder={t('size')}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-black focus:outline-none"
                    id="new-variant-size"
                  />
                  <input
                    placeholder={t('color')}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-black focus:outline-none col-span-2"
                    id="new-variant-color"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      dir="ltr"
                      placeholder={t('quantity')}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-black focus:outline-none text-right"
                      id="new-variant-qty"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const sizeInput = document.getElementById('new-variant-size') as HTMLInputElement;
                      const colorInput = document.getElementById('new-variant-color') as HTMLInputElement;
                      const qtyInput = document.getElementById('new-variant-qty') as HTMLInputElement;

                      if (!sizeInput.value || !colorInput.value) return;

                      const newVariantBase = {
                        size: sizeInput.value,
                        color_name: colorInput.value,
                        color_hex: '#000000',
                        quantity: Number(qtyInput.value) || 0
                      };

                      if (editingProduct) {
                        // If editing, save directly to DB
                        const newVariant = { ...newVariantBase, product_id: editingProduct.id };
                        const { data, error } = await supabase.from('product_variants').insert([newVariant]).select().single();
                        if (data) {
                          setVariants([...variants, data]);
                        }
                      } else {
                        // If creating new, save to local state with temp ID
                        const tempVariant = { 
                          ...newVariantBase, 
                          id: `temp-${Date.now()}`, 
                          product_id: '', 
                          created_at: new Date().toISOString() 
                        };
                        setVariants([...variants, tempVariant]);
                      }

                      sizeInput.value = '';
                      colorInput.value = '';
                      qtyInput.value = '';
                    }}
                    className="bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-bold shadow-md"
                  >
                    {t('add')}
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {variants.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900">{v.color_name}</span>
                        <span className="text-gray-300">|</span>
                        <span className="font-mono font-medium bg-gray-100 px-2 py-1 rounded">{v.size}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-mono text-gray-600 font-medium">{t('quantity')}: {formatNumber(v.quantity)}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            if (v.id.startsWith('temp-')) {
                              setVariants(variants.filter(item => item.id !== v.id));
                            } else {
                              setDeleteVariantModal({ isOpen: true, variantId: v.id });
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {variants.length === 0 && <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">{t('no_variants')}</p>}
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors font-bold shadow-lg shadow-gray-200"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quantity Update Modal */}
      {isQuantityModalOpen && selectedProductForQty && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {t('update_quantities')} - {selectedProductForQty.name}
              </h2>
              <button onClick={() => setIsQuantityModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {variants.map(v => (
                <div key={v.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">{v.color_name}</span>
                    <span className="text-gray-300">|</span>
                    <span className="font-mono font-medium bg-white px-2 py-1 rounded border border-gray-200">{v.size}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-500">{t('quantity')}:</label>
                    <input
                      type="number"
                      dir="ltr"
                      value={v.quantity}
                      onChange={(e) => handleUpdateQuantity(v.id, Number(e.target.value))}
                      className="w-24 px-3 py-2 rounded-lg border border-gray-200 focus:border-black focus:outline-none text-right font-mono"
                    />
                  </div>
                </div>
              ))}
              {variants.length === 0 && (
                <p className="text-center text-gray-500 py-8">{t('no_variants')}</p>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsQuantityModalOpen(false)}
                className="px-8 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors font-bold shadow-lg"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Variant */}
      <ConfirmationModal
        isOpen={deleteVariantModal.isOpen}
        onClose={() => setDeleteVariantModal({ isOpen: false, variantId: null })}
        onConfirm={handleDeleteVariant}
        title={t('delete')}
        message={t('confirm_delete_product')} // Reusing the message for now
        confirmText={t('yes_delete')}
        cancelText={t('cancel')}
        isDangerous={true}
      />
    </div>
  );
}
