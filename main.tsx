import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wilaya } from '../types';
import { Edit, Save, X } from 'lucide-react';

export default function Wilayas() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriceHome, setEditPriceHome] = useState<number>(0);
  const [editPriceDesk, setEditPriceDesk] = useState<number>(0);

  useEffect(() => {
    fetchWilayas();
  }, []);

  async function fetchWilayas() {
    try {
      const { data, error } = await supabase
        .from('wilayas')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setWilayas(data || []);
    } catch (error) {
      console.error('Error fetching wilayas:', error);
    } finally {
      setLoading(false);
    }
  }

  const startEdit = (wilaya: Wilaya) => {
    setEditingId(wilaya.id);
    setEditPriceHome(wilaya.delivery_price_home);
    setEditPriceDesk(wilaya.delivery_price_desk);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPriceHome(0);
    setEditPriceDesk(0);
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wilayas')
        .update({ 
          delivery_price_home: editPriceHome,
          delivery_price_desk: editPriceDesk
        })
        .eq('id', id);

      if (error) throw error;

      setWilayas(wilayas.map(w => w.id === id ? { 
        ...w, 
        delivery_price_home: editPriceHome,
        delivery_price_desk: editPriceDesk 
      } : w));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating shipping cost:', error);
      alert('فشل تحديث سعر التوصيل');
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('wilayas')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      setWilayas(wilayas.map(w => w.id === id ? { ...w, is_active: !currentState } : w));
    } catch (error) {
      console.error('Error updating wilaya status:', error);
      alert('فشل تحديث حالة الولاية');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-gray-900">الولايات والتوصيل</h1>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الولاية</th>
                <th className="px-6 py-4 font-medium">اسم الولاية</th>
                <th className="px-6 py-4 font-medium">سعر باب منزل (د.ج)</th>
                <th className="px-6 py-4 font-medium">سعر بريد (د.ج)</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">جاري التحميل...</td>
                </tr>
              ) : wilayas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">لا توجد بيانات</td>
                </tr>
              ) : (
                wilayas.map((wilaya) => (
                  <tr key={wilaya.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      {wilaya.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      {wilaya.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {editingId === wilaya.id ? (
                        <input
                          type="number"
                          value={editPriceHome}
                          onChange={(e) => setEditPriceHome(Number(e.target.value))}
                          className="w-24 rounded-md border-gray-300 py-1 text-sm focus:border-black focus:ring-black"
                        />
                      ) : (
                        `${(wilaya.delivery_price_home || 0).toLocaleString()} د.ج`
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {editingId === wilaya.id ? (
                        <input
                          type="number"
                          value={editPriceDesk}
                          onChange={(e) => setEditPriceDesk(Number(e.target.value))}
                          className="w-24 rounded-md border-gray-300 py-1 text-sm focus:border-black focus:ring-black"
                        />
                      ) : (
                        `${(wilaya.delivery_price_desk || 0).toLocaleString()} د.ج`
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button 
                        onClick={() => toggleActive(wilaya.id, wilaya.is_active)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${wilaya.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                      >
                        {wilaya.is_active ? 'نشط' : 'غير نشط'}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {editingId === wilaya.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(wilaya.id)} className="text-green-600 hover:text-green-800">
                            <Save className="h-5 w-5" />
                          </button>
                          <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(wilaya)} className="text-gray-400 hover:text-gray-600">
                          <Edit className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
