import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ImageUpload } from '@/components/ImageUpload';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    image_url: '',
    display_order: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (data) setCategories(data);
    setLoading(false);
  }

  function handleOpenModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image_url: category.image_url,
        display_order: category.display_order
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        image_url: '',
        display_order: categories.length + 1
      });
    }
    setIsModalOpen(true);
  }

  async function handleSave() {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(formData);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('فشل حفظ التصنيف');
    }
  }

  function handleDelete(id: string) {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;
    
    const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete);
    if (error) alert('فشل الحذف');
    else fetchCategories();
    
    setCategoryToDelete(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-neutral-900">التصنيفات</h2>
          <p className="text-neutral-500 mt-1">تنظيم منتجاتك.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-800 transition-colors"
        >
          <Plus size={20} /> إضافة تصنيف
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex items-center p-4 gap-4 group">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden">
              {category.image_url ? (
                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <ImageIcon size={20} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-lg truncate">{category.name}</h3>
              <p className="text-xs text-neutral-500">الترتيب: {category.display_order}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(category)} className="p-2 hover:bg-neutral-100 rounded-full">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(category.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-full">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingCategory ? 'تعديل التصنيف' : 'تصنيف جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">الاسم</label>
                <input 
                  className="w-full p-2 border border-neutral-200 rounded-lg"
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">صورة التصنيف</label>
                <ImageUpload 
                  value={formData.image_url ? [formData.image_url] : []}
                  onChange={(urls) => setFormData({...formData, image_url: urls[0] || ''})}
                  multiple={false}
                  maxFiles={1}
                />
              </div>
              <div>
                <label className="text-sm font-medium">ترتيب العرض</label>
                <input 
                  type="number"
                  className="w-full p-2 border border-neutral-200 rounded-lg"
                  value={formData.display_order || ''}
                  onChange={e => setFormData({...formData, display_order: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-neutral-600">إلغاء</button>
              <button onClick={handleSave} className="px-4 py-2 bg-black text-white rounded-lg">حفظ</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف التصنيف"
        message="هل أنت متأكد أنك تريد حذف هذا التصنيف؟ قد تتأثر المنتجات المرتبطة به."
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}
