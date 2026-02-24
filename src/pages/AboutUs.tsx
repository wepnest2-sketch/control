import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AboutUsContent } from '../types/database';
import { Plus, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AboutUs() {
  const [content, setContent] = useState<AboutUsContent | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; featureIndex: number | null }>({
    isOpen: false,
    featureIndex: null
  });

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    const { data } = await supabase.from('about_us_content').select('*').single();
    if (data) {
      setContent(data);
    } else {
      // Create default if not exists
      const defaultContent = {
        title: 'من نحن',
        content: 'مرحباً بكم في بابيون.',
        features: []
      };
      const { data: newData } = await supabase.from('about_us_content').insert([defaultContent]).select().single();
      if (newData) setContent(newData);
    }
  }

  const handleSave = async () => {
    if (!content) return;
    setLoading(true);
    await supabase.from('about_us_content').update({
      title: content.title,
      content: content.content,
      features: content.features
    }).eq('id', content.id);
    setLoading(false);
    alert('تم الحفظ بنجاح!');
  };

  const addFeature = () => {
    if (!content) return;
    const newFeature = { title: '', description: '' };
    setContent({ ...content, features: [...(content.features || []), newFeature] });
  };

  const updateFeature = (index: number, field: 'title' | 'description', value: string) => {
    if (!content) return;
    const newFeatures = [...(content.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  };

  const confirmRemoveFeature = (index: number) => {
    setDeleteModal({ isOpen: true, featureIndex: index });
  };

  const handleRemoveFeature = () => {
    if (!content || deleteModal.featureIndex === null) return;
    const newFeatures = content.features.filter((_: any, i: number) => i !== deleteModal.featureIndex);
    setContent({ ...content, features: newFeatures });
    setDeleteModal({ isOpen: false, featureIndex: null });
  };

  if (!content) return <div>جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">صفحة من نحن</h1>
        <p className="text-gray-500 mt-2">تعديل محتوى صفحة "من نحن" التي تظهر للعملاء.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700">عنوان الصفحة</label>
          <input
            type="text"
            value={content.title}
            onChange={e => setContent({...content, title: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700">المحتوى الرئيسي</label>
          <textarea
            rows={6}
            value={content.content}
            onChange={e => setContent({...content, content: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <label className="text-lg font-bold text-gray-900">المميزات / القيم</label>
            <button 
              onClick={addFeature}
              className="text-sm flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-md"
            >
              <Plus size={16} /> إضافة ميزة
            </button>
          </div>
          
          <div className="space-y-4">
            {content.features?.map((feature: any, index: number) => (
              <div key={index} className="flex gap-4 items-start bg-gray-50 p-6 rounded-xl border border-gray-100 group hover:border-gray-300 transition-colors">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    placeholder="عنوان الميزة"
                    value={feature.title}
                    onChange={e => updateFeature(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black font-bold"
                  />
                  <textarea
                    rows={2}
                    placeholder="وصف الميزة"
                    value={feature.description}
                    onChange={e => updateFeature(index, 'description', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <button 
                  onClick={() => confirmRemoveFeature(index)}
                  className="p-3 bg-white rounded-lg shadow-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {(!content.features || content.features.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد مميزات مضافة حتى الآن.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-10 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-bold shadow-lg shadow-gray-200 disabled:opacity-50 text-lg"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, featureIndex: null })}
        onConfirm={handleRemoveFeature}
        title="حذف الميزة"
        message="هل أنت متأكد من أنك تريد حذف هذه الميزة؟"
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        isDangerous={true}
      />
    </div>
  );
}
