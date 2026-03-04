import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Edit, Trash2, X, Save, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    images: [] as string[],
    category_id: '',
    variants: [{ size: '', color_name: '', quantity: '' }]
  });

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  }

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // handleImageUpload and removeImage removed to use ImageUpload component

  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants];
    // @ts-ignore
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: '', color_name: '', quantity: '' }]
    }));
  };

  const removeVariant = (index: number) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      discount_price: product.discount_price ? product.discount_price.toString() : '',
      images: product.images || [],
      category_id: product.category_id || '',
      variants: product.product_variants && product.product_variants.length > 0
        ? product.product_variants.map((v: any) => ({
          size: v.size,
          color_name: v.color_name,
          quantity: v.quantity.toString()
        }))
        : [{ size: '', color_name: '', quantity: '' }]
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      discount_price: '',
      images: [],
      category_id: '',
      variants: [{ size: '', color_name: '', quantity: '' }]
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteConfirmation.id);
      if (error) throw error;
      setDeleteConfirmation(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('حدث خطأ أثناء حذف المنتج');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let productId;

      if (editingProduct) {
        // Update Product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
            images: formData.images,
            category_id: formData.category_id || null
          })
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;
        productId = editingProduct.id;

        // Delete existing variants to replace with new ones
        const { error: deleteVariantsError } = await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId);

        if (deleteVariantsError) throw deleteVariantsError;

      } else {
        // Insert Product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
            images: formData.images,
            category_id: formData.category_id || null
          }])
          .select()
          .single();

        if (productError) throw productError;
        productId = productData.id;
      }

      // Insert Variants
      if (formData.variants.length > 0) {
        const variantsToInsert = formData.variants.map(v => ({
          product_id: productId,
          size: v.size,
          color_name: v.color_name,
          color_hex: '#000000', // Default value as we removed the picker
          quantity: parseInt(v.quantity) || 0
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      closeModal();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء حفظ المنتج: ' + (error as any).message);
    }
  };

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<any>(null);

  const openStockModal = (product: any) => {
    setStockProduct(product);
    setFormData({
      ...formData,
      variants: product.product_variants && product.product_variants.length > 0
        ? product.product_variants.map((v: any) => ({
          id: v.id, // Keep ID for update
          size: v.size,
          color_name: v.color_name,
          quantity: v.quantity.toString()
        }))
        : []
    });
    setStockModalOpen(true);
  };

  const closeStockModal = () => {
    setStockModalOpen(false);
    setStockProduct(null);
    setFormData({
      ...formData,
      variants: [{ size: '', color_name: '', quantity: '' }]
    });
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!stockProduct) return;

      // Update variants quantities
      for (const variant of formData.variants) {
        if ((variant as any).id) {
          const { error } = await supabase
            .from('product_variants')
            .update({ quantity: parseInt(variant.quantity) || 0 })
            .eq('id', (variant as any).id);

          if (error) throw error;
        }
      }

      closeStockModal();
      fetchProducts();
      alert('تم تحديث المخزون بنجاح');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('حدث خطأ أثناء تحديث المخزون');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-gray-900">المنتجات</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-3 text-center text-gray-500">جاري التحميل...</p>
        ) : products.length === 0 ? (
          <p className="col-span-3 text-center text-gray-500">لا توجد منتجات</p>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                    <span className="text-4xl opacity-20">بابيون</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-gray-100 flex flex-col items-center">
                  {product.discount_price ? (
                    <>
                      <span className="text-red-500">{product.discount_price} د.ج</span>
                      <span className="text-xs text-gray-400 line-through">{product.price} د.ج</span>
                    </>
                  ) : (
                    <span>{product.price} د.ج</span>
                  )}
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="font-serif font-bold text-xl mb-2 text-gray-900">{product.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{product.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {product.product_variants?.slice(0, 3).map((v: any, i: number) => (
                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200 flex items-center gap-1">
                      {v.size} - {v.color_name} ({v.quantity})
                    </span>
                  ))}
                  {product.product_variants?.length > 3 && (
                    <span className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-400">
                      +{product.product_variants.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2">
                  <button
                    onClick={() => openStockModal(product)}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors font-medium"
                  >
                    تعديل المخزون
                  </button>
                  <div className="flex-1"></div>
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation(product)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stock Modal */}
      {stockModalOpen && stockProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold">تعديل المخزون: {stockProduct.name}</h2>
              <button onClick={closeStockModal} className="text-gray-400 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <div className="text-sm">
                      <span className="font-bold">{variant.size}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{variant.color_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">الكمية:</label>
                      <input
                        type="number"
                        value={variant.quantity}
                        onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                        className="w-20 p-2 rounded-lg border border-gray-200 text-sm text-center"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
                {formData.variants.length === 0 && (
                  <p className="text-center text-gray-500 py-4">لا توجد أنواع لهذا المنتج</p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors shadow-lg"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">حذف المنتج؟</h3>
              <p className="text-gray-500 mb-6">
                هل أنت متأكد من حذف "{deleteConfirmation.name}"؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-serif font-bold">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">اسم المنتج</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="مثال: قميص كتان"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">السعر (د.ج)</label>
                  <input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">السعر بعد الخصم (اختياري)</label>
                  <input
                    name="discount_price"
                    type="number"
                    value={formData.discount_price}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">التصنيف</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
                  >
                    <option value="">اختر تصنيف...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">صور المنتج</label>
                <ImageUpload
                  value={formData.images}
                  onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                  multiple
                  maxFiles={10}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الوصف</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all h-24 resize-none"
                  placeholder="وصف تفصيلي للمنتج..."
                />
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">الأنواع (Variants)</h3>
                  <button type="button" onClick={addVariant} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> إضافة نوع
                  </button>
                </div>

                {formData.variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-7 gap-3 items-end bg-gray-50 p-3 rounded-xl">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs text-gray-500">المقاس</label>
                      <input
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="S, M..."
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <label className="text-xs text-gray-500">اسم اللون</label>
                      <input
                        value={variant.color_name}
                        onChange={(e) => handleVariantChange(index, 'color_name', e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="أحمر..."
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs text-gray-500">الكمية</label>
                      <input
                        type="number"
                        value={variant.quantity}
                        onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-7 flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-3 h-3" /> حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ المنتج</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
