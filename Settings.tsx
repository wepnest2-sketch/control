import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderItem, ProductVariant } from '../types';
import { Eye, CheckCircle, XCircle, Truck, Package, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { arDZ } from 'date-fns/locale';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغى',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');
  const [uniqueWilayas, setUniqueWilayas] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
      // Extract unique wilayas for filter
      if (data) {
        const wilayas = Array.from(new Set(data.map(o => o.wilaya_id).filter(Boolean)));
        setUniqueWilayas(wilayas as string[]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customer_first_name + ' ' + order.customer_last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      (order.order_number && order.order_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesWilaya = wilayaFilter === 'all' || order.wilaya_id === wilayaFilter;

    return matchesSearch && matchesStatus && matchesWilaya;
  });

  async function updateStatus(id: string, newStatus: Order['status']) {
    try {
      const order = orders.find(o => o.id === id);
      if (!order) return;

      // If cancelling, restore stock
      if (newStatus === 'cancelled' && order.status !== 'cancelled') {
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', id);

        if (itemsError) throw itemsError;

        if (orderItems) {
          for (const item of orderItems) {
            if (item.product_id) {
              // Find the variant
              const { data: variants, error: variantError } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', item.product_id)
                .eq('size', item.selected_size)
                .eq('color_name', item.selected_color); // Assuming selected_color stores color_name

              if (variantError) console.error('Error fetching variant:', variantError);

              if (variants && variants.length > 0) {
                const variant = variants[0];
                const { error: updateError } = await supabase
                  .from('product_variants')
                  .update({ quantity: variant.quantity + item.quantity })
                  .eq('id', variant.id);
                
                if (updateError) console.error('Error restoring stock:', updateError);
              }
            }
          }
        }
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('فشل تحديث الحالة');
    }
  }

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html dir="rtl">
        <head>
          <title>طباعة الطلب #${order.order_number}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; direction: rtl; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .details { margin-bottom: 20px; }
            .details p { margin: 5px 0; }
            .label { font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تفاصيل الطلب</h1>
            <h2>#${order.order_number}</h2>
          </div>
          <div class="details">
            <p><span class="label">العميل:</span> ${order.customer_first_name} ${order.customer_last_name}</p>
            <p><span class="label">الهاتف:</span> ${order.customer_phone}</p>
            <p><span class="label">الولاية:</span> ${order.wilaya_id}</p>
            <p><span class="label">البلدية:</span> ${order.municipality_name}</p>
            <p><span class="label">العنوان:</span> ${order.address || '-'}</p>
            <p><span class="label">نوع التوصيل:</span> ${order.delivery_type === 'home' ? 'باب المنزل' : 'مكتب البريد'}</p>
            <p><span class="label">المبلغ الإجمالي:</span> ${order.total_price.toLocaleString()} د.ج</p>
            <p><span class="label">التاريخ:</span> ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <div class="footer">
            <p>شكراً لثقتكم بنا</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="font-serif text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
           <div className="relative">
             <input
               type="text"
               placeholder="بحث (اسم، هاتف، رقم طلب)..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full rounded-xl border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-black focus:ring-black sm:w-64"
             />
           </div>
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="rounded-xl border-gray-300 py-2 text-sm focus:border-black focus:ring-black"
           >
             <option value="all">كل الحالات</option>
             {Object.entries(statusLabels).map(([key, label]) => (
               <option key={key} value={key}>{label}</option>
             ))}
           </select>
           <select
             value={wilayaFilter}
             onChange={(e) => setWilayaFilter(e.target.value)}
             className="rounded-xl border-gray-300 py-2 text-sm focus:border-black focus:ring-black"
           >
             <option value="all">كل الولايات</option>
             {uniqueWilayas.map((w) => (
               <option key={w} value={w}>{w}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 sm:hidden">
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">لا توجد طلبات مطابقة للبحث</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-gray-400">#{order.order_number || order.id.slice(0, 8)}</span>
                  <h3 className="font-bold text-lg text-gray-900 mt-1">{order.customer_first_name} {order.customer_last_name}</h3>
                  <p className="text-sm text-gray-500">{order.customer_phone}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <span className="block text-xs text-gray-400">الولاية</span>
                  <span className="font-medium">{order.wilaya_id}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400">المبلغ</span>
                  <span className="font-medium text-gray-900">{order.total_price.toLocaleString()} د.ج</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400">التاريخ</span>
                  <span>{format(new Date(order.created_at), 'dd/MM/yyyy', { locale: arDZ })}</span>
                </div>
                <div>
                   <span className="block text-xs text-gray-400">التوصيل</span>
                   <span>{order.delivery_type === 'home' ? 'منزل' : 'مكتب'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <button 
                   onClick={() => handlePrint(order)}
                   className="flex items-center gap-1 text-gray-600 hover:text-black text-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>طباعة</span>
                </button>
                
                <div className="flex gap-2">
                   {order.status !== 'confirmed' && order.status !== 'cancelled' && (
                      <button onClick={() => updateStatus(order.id, 'confirmed')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                        <CheckCircle className="h-5 w-5" />
                      </button>
                   )}
                   {order.status === 'confirmed' && (
                      <button onClick={() => updateStatus(order.id, 'shipped')} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                        <Truck className="h-5 w-5" />
                      </button>
                   )}
                   {order.status !== 'cancelled' && (
                      <button onClick={() => updateStatus(order.id, 'cancelled')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                        <XCircle className="h-5 w-5" />
                      </button>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الطلب</th>
                <th className="px-6 py-4 font-medium">العميل</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">المبلغ</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">جاري التحميل...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">لا توجد طلبات مطابقة للبحث</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      #{order.order_number || order.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-gray-900">{order.customer_first_name} {order.customer_last_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_phone}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {format(new Date(order.created_at), 'dd MMMM yyyy', { locale: arDZ })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      {(order.total_price || 0).toLocaleString()} د.ج
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handlePrint(order)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100" 
                          title="طباعة"
                        >
                          <Printer className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => updateStatus(order.id, 'confirmed')}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50" 
                          title="تأكيد"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => updateStatus(order.id, 'shipped')}
                          className="rounded p-1 text-purple-600 hover:bg-purple-50" 
                          title="شحن"
                        >
                          <Truck className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="rounded p-1 text-red-600 hover:bg-red-50" 
                          title="إلغاء"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
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
