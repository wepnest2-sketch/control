import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Trash2, MapPin, Edit, X, Save } from 'lucide-react';

export function Wilayas() {
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWilaya, setEditingWilaya] = useState<any>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    delivery_price_home: '',
    delivery_price_desk: ''
  });

  useEffect(() => {
    fetchWilayas();
  }, []);

  async function fetchWilayas() {
    try {
      const { data, error } = await supabase
        .from('wilayas')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setWilayas(data || []);
    } catch (error) {
      console.error('Error fetching wilayas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.id.trim()) return;

    try {
      if (editingWilaya) {
        const { error } = await supabase
          .from('wilayas')
          .update({
            name: formData.name,
            delivery_price_home: parseInt(formData.delivery_price_home) || 0,
            delivery_price_desk: parseInt(formData.delivery_price_desk) || 0
          })
          .eq('id', editingWilaya.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wilayas')
          .insert([{
            id: formData.id,
            name: formData.name,
            delivery_price_home: parseInt(formData.delivery_price_home) || 0,
            delivery_price_desk: parseInt(formData.delivery_price_desk) || 0
          }]);
        if (error) throw error;
      }

      closeModal();
      fetchWilayas();
    } catch (error) {
      console.error('Error saving wilaya:', error);
      alert('حدث خطأ أثناء حفظ الولاية');
    }
  }

  async function deleteWilaya(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الولاية؟')) return;
    try {
      const { error } = await supabase
        .from('wilayas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchWilayas();
    } catch (error) {
      console.error('Error deleting wilaya:', error);
    }
  }

  const openModal = (wilaya: any = null) => {
    if (wilaya) {
      setEditingWilaya(wilaya);
      setFormData({
        id: wilaya.id,
        name: wilaya.name,
        delivery_price_home: wilaya.delivery_price_home.toString(),
        delivery_price_desk: wilaya.delivery_price_desk.toString()
      });
    } else {
      setEditingWilaya(null);
      setFormData({
        id: '',
        name: '',
        delivery_price_home: '',
        delivery_price_desk: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWilaya(null);
    setFormData({ id: '', name: '', delivery_price_home: '', delivery_price_desk: '' });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-gray-900">الولايات والتوصيل</h1>
        <button
          onClick={() => openModal()}
          className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ولاية</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-3 text-center text-gray-500">جاري التحميل...</p>
        ) : wilayas.length === 0 ? (
          <p className="col-span-3 text-center text-gray-500">لا توجد ولايات</p>
        ) : (
          wilayas.map((wilaya) => (
            <Card key={wilaya.id} className="group hover:shadow-xl transition-all duration-300 border-gray-100">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{wilaya.name}</h3>
                      <span className="text-xs text-gray-400 font-mono">ID: {wilaya.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(wilaya)}
                      className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteWilaya(wilaya.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                  <div className="bg-blue-50/50 p-2 rounded-lg">
                    <p className="text-[10px] text-blue-600 font-bold mb-1">توصيل للمنزل</p>
                    <p className="font-bold text-sm tracking-tight">{wilaya.delivery_price_home} د.ج</p>
                  </div>
                  <div className="bg-orange-50/50 p-2 rounded-lg">
                    <p className="text-[10px] text-orange-600 font-bold mb-1">استلام من المكتب</p>
                    <p className="font-bold text-sm tracking-tight">{wilaya.delivery_price_desk} د.ج</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Wilaya Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold">{editingWilaya ? 'تعديل الولاية' : 'إضافة ولاية جديدة'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">رقم الولاية (ID)</label>
                  <input
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    required
                    disabled={!!editingWilaya}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="مثال: 16"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">اسم الولاية</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="مثال: الجزائر"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">توصيل للمنزل (د.ج)</label>
                  <input
                    type="number"
                    value={formData.delivery_price_home}
                    onChange={(e) => setFormData({ ...formData, delivery_price_home: e.target.value })}
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">استلام من المكتب (د.ج)</label>
                  <input
                    type="number"
                    value={formData.delivery_price_desk}
                    onChange={(e) => setFormData({ ...formData, delivery_price_desk: e.target.value })}
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="0"
                  />
                </div>
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
                  <span>حفظ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
