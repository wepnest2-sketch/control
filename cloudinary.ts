import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import CategoryModal from '../components/CategoryModal';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟ قد يؤثر ذلك على المنتجات المرتبطة به.')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('فشل حذف التصنيف');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-gray-900">التصنيفات</h1>
        <button 
          onClick={handleAddCategory}
          className="flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-gray-900"
        >
          <Plus className="h-5 w-5" />
          إضافة تصنيف
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200"></div>
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            لا توجد تصنيفات
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                {category.image_url && (
                  <img 
                    src={category.image_url} 
                    alt={category.name} 
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-lg object-cover" 
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditCategory(category)}
                  className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category.id)}
                  className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryToEdit={editingCategory}
        onSave={fetchCategories}
      />
    </div>
  );
}
