import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, Filter, Eye, Check, X, Truck, PackageCheck, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        wilaya:wilayas(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      // If cancelling/rejecting, we need to restore stock
      if (newStatus === 'cancelled') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.items) {
          for (const item of order.items) {
            if (item.product_id && item.selected_size && item.selected_color) {
              // Find the variant
              const { data: variants } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', item.product_id)
                .eq('size', item.selected_size)
                .eq('color_name', item.selected_color)
                .single();
              
              if (variants) {
                // Restore stock
                await supabase
                  .from('product_variants')
                  .update({ quantity: variants.quantity + item.quantity })
                  .eq('id', variants.id);
              }
            }
          }
        }
      }

      // Update status
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('فشل تحديث حالة الطلب');
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = 
      order.customer_first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_number.toString().includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const statusLabels: Record<string, string> = {
    all: "الكل",
    pending: "قيد الانتظار",
    confirmed: "تم التأكيد",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-neutral-900">الطلبات</h2>
          <p className="text-neutral-500 mt-1">إدارة وتتبع طلبات العملاء.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو رقم الطلب..." 
            className="w-full pr-10 pl-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors",
                filterStatus === status 
                  ? "bg-black text-white" 
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-neutral-50 text-neutral-500 font-medium">
                <tr>
                  <th className="px-6 py-3">رقم الطلب</th>
                  <th className="px-6 py-3">العميل</th>
                  <th className="px-6 py-3">الحالة</th>
                  <th className="px-6 py-3">الإجمالي</th>
                  <th className="px-6 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className={cn(
                      "hover:bg-neutral-50/50 cursor-pointer transition-colors",
                      selectedOrder?.id === order.id && "bg-neutral-50"
                    )}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 font-mono">#{order.order_number}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.customer_first_name} {order.customer_last_name}</div>
                      <div className="text-xs text-neutral-400">{order.wilaya?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 font-medium">{order.total_price.toLocaleString()} د.ج</td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-neutral-500">
              لا توجد طلبات تطابق معايير البحث.
            </div>
          )}
        </div>

        {/* Order Details Panel */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sticky top-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif font-bold text-xl">الطلب #{selectedOrder.order_number}</h3>
                  <p className="text-sm text-neutral-500">
                    {new Date(selectedOrder.created_at).toLocaleString('ar-DZ')}
                  </p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              {/* Customer Info */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-neutral-50 rounded-lg space-y-2">
                  <div className="text-sm font-medium text-neutral-900">تفاصيل العميل</div>
                  <div className="text-sm text-neutral-600">
                    <p>{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                    <p>{selectedOrder.customer_phone}</p>
                    <p className="mt-2 text-neutral-500 border-t border-neutral-200 pt-2">
                      {selectedOrder.address}<br/>
                      {selectedOrder.municipality_name}, {selectedOrder.wilaya?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-6">
                <div className="text-sm font-medium text-neutral-900">عناصر الطلب</div>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-neutral-500">
                        {item.selected_size} / {item.selected_color} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-sm">{item.price.toLocaleString()} د.ج</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 font-bold text-lg">
                  <span>الإجمالي</span>
                  <span>{selectedOrder.total_price.toLocaleString()} د.ج</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedOrder.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                      className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> تأكيد الطلب
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      className="w-full py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <X size={18} /> رفض الطلب
                    </button>
                  </>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Truck size={18} /> تم الشحن
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <PackageCheck size={18} /> تم التوصيل
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 border-dashed p-12 text-center text-neutral-400 flex flex-col items-center justify-center h-full min-h-[400px]">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <p>اختر طلباً لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
