import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Plus, Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import ProductModal from '../components/ProductModal';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('فشل حذف المنتج');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl font-bold text-gray-900">المنتجات</h1>
        <button 
          onClick={handleAddProduct}
          className="flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-gray-900"
        >
          <Plus className="h-5 w-5" />
          إضافة منتج جديد
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث عن منتج..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border-0 bg-white py-3 pr-12 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200"></div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            لا توجد منتجات مطابقة للبحث
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="aspect-square w-full overflow-hidden bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-48">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      <span className="absolute inset-0" />
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{product.category_id || 'غير مصنف'}</p>
                  </div>
                  <div className="text-left">
                    {product.discount_price ? (
                      <>
                        <p className="text-sm font-medium text-red-600">{(product.discount_price || 0).toLocaleString()} د.ج</p>
                        <p className="text-xs text-gray-500 line-through">{(product.price || 0).toLocaleString()} د.ج</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{(product.price || 0).toLocaleString()} د.ج</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${product.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {product.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                  <div className="flex gap-2 z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
        onSave={fetchProducts}
      />
    </div>
  );
}
