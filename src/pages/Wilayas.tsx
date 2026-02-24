import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Wilaya } from '@/types/database';
import { Search, Save } from 'lucide-react';

export default function Wilayas() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{home: number, desk: number}>({ home: 0, desk: 0 });

  useEffect(() => {
    fetchWilayas();
  }, []);

  async function fetchWilayas() {
    setLoading(true);
    const { data, error } = await supabase
      .from('wilayas')
      .select('*')
      .order('id'); // Assuming ID is numeric string like "1", "2"... might need better sort
    
    if (data) {
      // Sort numerically if IDs are strings like "1", "2"
      const sorted = data.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setWilayas(sorted);
    }
    setLoading(false);
  }

  function startEdit(wilaya: Wilaya) {
    setEditingId(wilaya.id);
    setEditValues({ home: wilaya.delivery_price_home, desk: wilaya.delivery_price_desk });
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from('wilayas')
      .update({
        delivery_price_home: editValues.home,
        delivery_price_desk: editValues.desk
      })
      .eq('id', id);

    if (!error) {
      setWilayas(wilayas.map(w => w.id === id ? { ...w, delivery_price_home: editValues.home, delivery_price_desk: editValues.desk } : w));
      setEditingId(null);
    } else {
      alert('فشل تحديث السعر');
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    const { error } = await supabase
      .from('wilayas')
      .update({ is_active: !currentState })
      .eq('id', id);
    
    if (!error) {
      setWilayas(wilayas.map(w => w.id === id ? { ...w, is_active: !currentState } : w));
    }
  }

  const filteredWilayas = wilayas.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.id.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-neutral-900">الولايات والتوصيل</h2>
        <p className="text-neutral-500 mt-1">إدارة مناطق التوصيل والأسعار.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input 
            type="text" 
            placeholder="البحث عن ولاية..." 
            className="w-full pr-10 pl-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Mobile View: Card List */}
        <div className="block md:hidden divide-y divide-neutral-100">
          {filteredWilayas.map((wilaya) => (
            <div key={wilaya.id} className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-neutral-400">{wilaya.id}</span>
                  <span className="font-bold text-lg">{wilaya.name}</span>
                </div>
                <button 
                  onClick={() => toggleActive(wilaya.id, wilaya.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${wilaya.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {wilaya.is_active ? 'نشط' : 'غير نشط'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-xl">
                <div className="space-y-1">
                  <span className="text-xs text-neutral-500 block">توصيل للمنزل</span>
                  {editingId === wilaya.id ? (
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded-lg text-sm"
                      value={editValues.home}
                      onChange={e => setEditValues({...editValues, home: Number(e.target.value)})}
                    />
                  ) : (
                    <span className="font-bold">{wilaya.delivery_price_home} د.ج</span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-neutral-500 block">توصيل للمكتب</span>
                  {editingId === wilaya.id ? (
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded-lg text-sm"
                      value={editValues.desk}
                      onChange={e => setEditValues({...editValues, desk: Number(e.target.value)})}
                    />
                  ) : (
                    <span className="font-bold">{wilaya.delivery_price_desk} د.ج</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                {editingId === wilaya.id ? (
                  <button 
                    onClick={() => saveEdit(wilaya.id)} 
                    className="w-full py-2 bg-black text-white rounded-lg font-medium"
                  >
                    حفظ التغييرات
                  </button>
                ) : (
                  <button 
                    onClick={() => startEdit(wilaya)} 
                    className="text-sm text-neutral-500 underline font-medium"
                  >
                    تعديل الأسعار
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-neutral-50 text-neutral-500 font-medium">
              <tr>
                <th className="px-6 py-3 w-20">الرمز</th>
                <th className="px-6 py-3">اسم الولاية</th>
                <th className="px-6 py-3">توصيل للمنزل (د.ج)</th>
                <th className="px-6 py-3">توصيل للمكتب (د.ج)</th>
                <th className="px-6 py-3">الحالة</th>
                <th className="px-6 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredWilayas.map((wilaya) => (
                <tr key={wilaya.id} className="hover:bg-neutral-50/50">
                  <td className="px-6 py-4 font-mono text-neutral-500">{wilaya.id}</td>
                  <td className="px-6 py-4 font-medium">{wilaya.name}</td>
                  <td className="px-6 py-4">
                    {editingId === wilaya.id ? (
                      <input 
                        type="number" 
                        className="w-24 p-1 border rounded"
                        value={editValues.home}
                        onChange={e => setEditValues({...editValues, home: Number(e.target.value)})}
                      />
                    ) : (
                      <span>{wilaya.delivery_price_home}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === wilaya.id ? (
                      <input 
                        type="number" 
                        className="w-24 p-1 border rounded"
                        value={editValues.desk}
                        onChange={e => setEditValues({...editValues, desk: Number(e.target.value)})}
                      />
                    ) : (
                      <span>{wilaya.delivery_price_desk}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleActive(wilaya.id, wilaya.is_active)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${wilaya.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {wilaya.is_active ? 'نشط' : 'غير نشط'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-left">
                    {editingId === wilaya.id ? (
                      <button onClick={() => saveEdit(wilaya.id)} className="text-blue-600 font-medium hover:underline">حفظ</button>
                    ) : (
                      <button onClick={() => startEdit(wilaya)} className="text-neutral-500 hover:text-black">تعديل السعر</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
