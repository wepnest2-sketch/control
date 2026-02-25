import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../types/database';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import ImageUpload from '../components/ImageUpload';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    image_url: '',
    display_order: 0
  });

  // Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; categoryId: string | null }>({
    isOpen: false,
    categoryId: null
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
    if (data) setCategories(data);
  }

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({ name: '', image_url: '', display_order: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await supabase.from('categories').update(formData).eq('id', editingCategory.id);
      } else {
        await supabase.from('categories').insert([formData]);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteModal({ isOpen: true, categoryId: id });
  };

  const handleDelete = async () => {
    if (!deleteModal.categoryId) return;
    await supabase.from('categories').delete().eq('id', deleteModal.categoryId);
    fetchCategories();
    setDeleteModal({ isOpen: false, categoryId: null });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-gray-900">التصنيفات</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
        >
          <Plus size={20} /> إضافة تصنيف جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-100 relative overflow-hidden">
              {category.image_url ? (
                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">لا توجد صورة</div>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <button onClick={() => handleOpenModal(category)} className="p-2.5 bg-white rounded-full shadow-lg hover:bg-black hover:text-white transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => confirmDelete(category.id)} className="p-2.5 bg-white rounded-full shadow-lg hover:bg-red-600 hover:text-white transition-colors text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl text-gray-900">{category.name}</h3>
              <p className="text-xs text-gray-400 mt-2 font-mono">الترتيب: {category.display_order}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, categoryId: null })}
        onConfirm={handleDelete}
        title="حذف التصنيف"
        message="هل أنت متأكد من أنك تريد حذف هذا التصنيف؟ قد يؤثر هذا على المنتجات المرتبطة به."
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        isDangerous={true}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {editingCategory ? 'تعديل التصنيف' : 'تصنيف جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">اسم التصنيف</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
                  placeholder="أدخل اسم التصنيف"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">صورة التصنيف</label>
                <ImageUpload
                  value={formData.image_url || ''}
                  onChange={(url) => setFormData({...formData, image_url: url})}
                  onRemove={() => setFormData({...formData, image_url: ''})}
                  placeholder="رفع صورة التصنيف"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">ترتيب العرض</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={e => setFormData({...formData, display_order: Number(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors mt-6 font-bold shadow-lg shadow-gray-200"
              >
                حفظ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
