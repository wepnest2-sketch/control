import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wilaya } from '../types/database';
import { Search, Save, Loader2, Plus } from 'lucide-react';
import { formatNumber } from '../lib/utils';

export default function Wilayas() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWilaya, setNewWilaya] = useState({
    id: '',
    name: '',
    delivery_price_home: 0,
    delivery_price_desk: 0,
    is_active: true
  });

  useEffect(() => {
    fetchWilayas();
  }, []);

  async function fetchWilayas() {
    const { data } = await supabase.from('wilayas').select('*').order('id', { ascending: true });
    if (data) setWilayas(data);
    setLoading(false);
  }

  const handlePriceChange = (id: string, field: 'delivery_price_home' | 'delivery_price_desk', value: string) => {
    setWilayas(prev => prev.map(w => w.id === id ? { ...w, [field]: Number(value) } : w));
  };

  const updatePrice = async (id: string, field: 'delivery_price_home' | 'delivery_price_desk', value: number) => {
    setUpdatingId(id);
    try {
      await supabase.from('wilayas').update({ [field]: value }).eq('id', id);
    } catch (error) {
      console.error('Error updating wilaya:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setWilayas(prev => prev.map(w => w.id === id ? { ...w, is_active: !currentStatus } : w));
    
    try {
      await supabase.from('wilayas').update({ is_active: !currentStatus }).eq('id', id);
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert on error
      setWilayas(prev => prev.map(w => w.id === id ? { ...w, is_active: currentStatus } : w));
    }
  };

  const handleAddWilaya = async () => {
    if (!newWilaya.id || !newWilaya.name) return;
    
    try {
      const { data, error } = await supabase.from('wilayas').insert([newWilaya]).select().single();
      if (error) throw error;
      if (data) {
        setWilayas([...wilayas, data].sort((a, b) => Number(a.id) - Number(b.id)));
        setIsAddModalOpen(false);
        setNewWilaya({ id: '', name: '', delivery_price_home: 0, delivery_price_desk: 0, is_active: true });
      }
    } catch (error) {
      console.error('Error adding wilaya:', error);
      alert('حدث خطأ أثناء إضافة الولاية');
    }
  };

  const filteredWilayas = wilayas.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.id.includes(search)
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-gray-900">الولايات والتوصيل</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            <span>إضافة ولاية</span>
          </button>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن ولاية..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black w-72 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-5 font-bold text-gray-500 w-24">الرمز</th>
                <th className="px-6 py-5 font-bold text-gray-500">الولاية</th>
                <th className="px-6 py-5 font-bold text-gray-500">توصيل للمنزل (د.ج)</th>
                <th className="px-6 py-5 font-bold text-gray-500">توصيل للمكتب (د.ج)</th>
                <th className="px-6 py-5 font-bold text-gray-500 text-left">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWilayas.map((wilaya) => (
                <tr key={wilaya.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-400 font-bold">{formatNumber(wilaya.id)}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 text-base">{wilaya.name}</td>
                  <td className="px-6 py-4">
                    <div className="relative w-32">
                      <input 
                        type="number"
                        dir="ltr"
                        value={wilaya.delivery_price_home || ''}
                        onChange={(e) => handlePriceChange(wilaya.id, 'delivery_price_home', e.target.value)}
                        onBlur={(e) => updatePrice(wilaya.id, 'delivery_price_home', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-black focus:outline-none bg-gray-50 focus:bg-white transition-colors text-right"
                      />
                      {updatingId === wilaya.id && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                          <Loader2 size={14} className="animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative w-32">
                      <input 
                        type="number"
                        dir="ltr"
                        value={wilaya.delivery_price_desk || ''}
                        onChange={(e) => handlePriceChange(wilaya.id, 'delivery_price_desk', e.target.value)}
                        onBlur={(e) => updatePrice(wilaya.id, 'delivery_price_desk', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-black focus:outline-none bg-gray-50 focus:bg-white transition-colors text-right"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button 
                      onClick={() => toggleActive(wilaya.id, wilaya.is_active)}
                      className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out ${wilaya.is_active ? 'bg-black' : 'bg-gray-200'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${wilaya.is_active ? '-translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Wilaya Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-6">إضافة ولاية جديدة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رمز الولاية</label>
                <input
                  type="text"
                  value={newWilaya.id}
                  onChange={(e) => setNewWilaya({ ...newWilaya, id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:outline-none"
                  placeholder="مثال: 01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الولاية</label>
                <input
                  type="text"
                  value={newWilaya.name}
                  onChange={(e) => setNewWilaya({ ...newWilaya, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:outline-none"
                  placeholder="مثال: أدرار"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر التوصيل للمنزل</label>
                <input
                  type="number"
                  dir="ltr"
                  value={newWilaya.delivery_price_home || ''}
                  onChange={(e) => setNewWilaya({ ...newWilaya, delivery_price_home: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:outline-none text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر التوصيل للمكتب</label>
                <input
                  type="number"
                  dir="ltr"
                  value={newWilaya.delivery_price_desk || ''}
                  onChange={(e) => setNewWilaya({ ...newWilaya, delivery_price_desk: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:outline-none text-right"
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleAddWilaya}
                  className="flex-1 bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
