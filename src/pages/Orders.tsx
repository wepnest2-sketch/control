import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, Product, Wilaya } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, Filter, Eye, Check, X, Truck, PackageCheck, ShoppingBag, Printer, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Order Form State
  const [newOrder, setNewOrder] = useState({
    customer_first_name: '',
    customer_last_name: '',
    customer_phone: '',
    wilaya_id: '',
    municipality_name: '',
    address: '',
    delivery_type: 'home' as 'home' | 'post',
    items: [] as { product_id: string, variant_id: string, quantity: number, price: number, name: string, size: string, color: string }[]
  });

  useEffect(() => {
    fetchOrders();
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const [productsRes, wilayasRes] = await Promise.all([
      supabase.from('products').select('*, variants:product_variants(*)').eq('is_active', true),
      supabase.from('wilayas').select('*').eq('is_active', true)
    ]);
    if (productsRes.data) setProducts(productsRes.data);
    if (wilayasRes.data) setWilayas(wilayasRes.data);
  }

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

  async function handleCreateOrder() {
    try {
      if (!newOrder.customer_first_name || !newOrder.customer_phone || newOrder.items.length === 0) {
        alert('يرجى ملء البيانات الأساسية وإضافة منتج واحد على الأقل');
        return;
      }

      setIsCreating(true);
      const totalPrice = newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_first_name: newOrder.customer_first_name,
          customer_last_name: newOrder.customer_last_name,
          customer_phone: newOrder.customer_phone,
          wilaya_id: newOrder.wilaya_id || null,
          municipality_name: newOrder.municipality_name,
          address: newOrder.address,
          delivery_type: newOrder.delivery_type,
          total_price: totalPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = newOrder.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        selected_size: item.size,
        selected_color: item.color
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }

      // Manual Stock Deduction (Fallback for triggers)
      for (const item of newOrder.items) {
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from('product_variants')
            .select('quantity')
            .eq('id', item.variant_id)
            .maybeSingle();

          if (variant) {
            await supabase
              .from('product_variants')
              .update({ quantity: Math.max(0, variant.quantity - item.quantity) })
              .eq('id', item.variant_id);
          }
        }
      }

      setIsCreateModalOpen(false);
      setNewOrder({
        customer_first_name: '',
        customer_last_name: '',
        customer_phone: '',
        wilaya_id: '',
        municipality_name: '',
        address: '',
        delivery_type: 'home',
        items: []
      });
      fetchOrders();
      alert('تم إنشاء الطلب وخصم المخزون بنجاح');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('فشل إنشاء الطلب');
    } finally {
      setIsCreating(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (order.status === newStatus) return;

      console.log(`Updating order ${orderId} from ${order.status} to ${newStatus}`);

      // Manual Stock Management (Fallback for triggers)
      // If moving TO cancelled: Restore stock
      if (newStatus === 'cancelled' && order.status !== 'cancelled') {
        const items = order.items || [];
        for (const item of items) {
          const vId = item.variant_id;
          if (!vId) continue;

          const { data: variant } = await supabase
            .from('product_variants')
            .select('id, quantity')
            .eq('id', vId)
            .maybeSingle();
          
          if (variant) {
            await supabase
              .from('product_variants')
              .update({ quantity: variant.quantity + item.quantity })
              .eq('id', variant.id);
          }
        }
      } 
      // If moving FROM cancelled TO something else: Deduct stock again
      else if (order.status === 'cancelled' && newStatus !== 'cancelled') {
        const items = order.items || [];
        for (const item of items) {
          const vId = item.variant_id;
          if (!vId) continue;

          const { data: variant } = await supabase
            .from('product_variants')
            .select('id, quantity')
            .eq('id', vId)
            .maybeSingle();
          
          if (variant) {
            await supabase
              .from('product_variants')
              .update({ quantity: Math.max(0, variant.quantity - item.quantity) })
              .eq('id', vId);
          }
        }
      }

      // Update status in DB
      const updateData: any = { status: newStatus };
      if (newStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) throw updateError;
      
      // Refresh local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, ...updateData } : null);
      }

      // Show success feedback
      const statusText = statusLabels[newStatus] || newStatus;
      alert(`تم تحديث حالة الطلب إلى: ${statusText}`);
      
    } catch (error) {
      console.error('Error updating order:', error);
      alert('فشل تحديث حالة الطلب. يرجى التأكد من الاتصال بالإنترنت.');
    }
  }

  const filteredOrders = orders.filter(order => {
    // Auto-hide confirmed orders older than 5 days
    if (order.status === 'confirmed' && order.confirmed_at) {
      const confirmedDate = new Date(order.confirmed_at);
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      if (confirmedDate < fiveDaysAgo) return false;
    }

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = 
      order.customer_first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_number.toString().includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  function canUndo(order: Order) {
    if (order.status !== 'confirmed' || !order.confirmed_at) return false;
    const confirmedDate = new Date(order.confirmed_at);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return confirmedDate > oneDayAgo;
  }

  function handleCancelClick(orderId: string) {
    setOrderToCancel(orderId);
    setIsCancelModalOpen(true);
  }

  async function confirmCancel() {
    if (orderToCancel) {
      await updateOrderStatus(orderToCancel, 'cancelled');
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
    }
  }

  const statusLabels: Record<string, string> = {
    all: "الكل",
    pending: "قيد الانتظار",
    confirmed: "تم التأكيد",
    cancelled: "ملغي",
  };

  function handleViewOrder(order: Order) {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-neutral-900">الطلبات</h2>
          <p className="text-neutral-500 mt-1">إدارة وتتبع طلبات العملاء.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-800 transition-colors"
        >
          <ShoppingBag size={20} /> إنشاء طلب يدوي
        </button>
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
            {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
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

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Mobile View: Card List */}
        <div className="block md:hidden divide-y divide-neutral-100">
          {filteredOrders.map((order) => (
            <div key={order.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-xs text-neutral-400">#{order.order_number}</div>
                  <div className="font-bold text-lg">{order.customer_first_name} {order.customer_last_name}</div>
                  <div className="text-sm text-neutral-500">{order.wilaya?.name}</div>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-neutral-50">
                <div className="font-bold text-black">{order.total_price.toLocaleString()} د.ج</div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleViewOrder(order)}
                    className="p-2 bg-neutral-100 rounded-xl text-neutral-600 active:bg-neutral-200"
                  >
                    <Eye size={20} />
                  </button>
                  
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className={cn(
                      "text-sm font-medium border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/5",
                      order.status === 'pending' && "border-amber-200 text-amber-700 bg-amber-50",
                      order.status === 'confirmed' && "border-green-200 text-green-700 bg-green-50",
                      order.status === 'cancelled' && "border-red-200 text-red-700 bg-red-50"
                    )}
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="confirmed">تم التأكيد</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
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
                  className="hover:bg-neutral-50/50 transition-colors"
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
                  <td className="px-6 py-4 flex items-center gap-3">
                    <button 
                      onClick={() => handleViewOrder(order)}
                      className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500"
                      title="عرض التفاصيل"
                    >
                      <Eye size={18} />
                    </button>
                    
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={cn(
                        "text-xs font-medium border rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer",
                        order.status === 'pending' && "border-amber-200 text-amber-700 bg-amber-50",
                        order.status === 'confirmed' && "border-green-200 text-green-700 bg-green-50",
                        order.status === 'cancelled' && "border-red-200 text-red-700 bg-red-50"
                      )}
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="confirmed">تم التأكيد</option>
                      <option value="cancelled">ملغي</option>
                    </select>
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

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-serif font-bold">إنشاء طلب جديد</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الاسم الأول</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={newOrder.customer_first_name}
                    onChange={e => setNewOrder({...newOrder, customer_first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">اللقب</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={newOrder.customer_last_name}
                    onChange={e => setNewOrder({...newOrder, customer_last_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">رقم الهاتف</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={newOrder.customer_phone}
                    onChange={e => setNewOrder({...newOrder, customer_phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الولاية</label>
                  <select 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={newOrder.wilaya_id}
                    onChange={e => setNewOrder({...newOrder, wilaya_id: e.target.value})}
                  >
                    <option value="">اختر الولاية</option>
                    {wilayas.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">المنتجات</label>
                <div className="border border-neutral-200 rounded-xl p-4 space-y-4">
                  {newOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg">
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-xs text-neutral-500">{item.size} / {item.color}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-mono">{item.quantity} × {item.price} د.ج</div>
                        <button 
                          onClick={() => setNewOrder({
                            ...newOrder, 
                            items: newOrder.items.filter((_, i) => i !== idx)
                          })}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t border-neutral-100">
                    <select 
                      className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const [prodId, varId] = val.split('|');
                        const product = products.find(p => p.id === prodId);
                        const variant = product?.variants?.find(v => v.id === varId);
                        if (product && variant) {
                          setNewOrder({
                            ...newOrder,
                            items: [...newOrder.items, {
                              product_id: product.id,
                              variant_id: variant.id,
                              quantity: 1,
                              price: product.price,
                              name: product.name,
                              size: variant.size,
                              color: variant.color_name
                            }]
                          });
                        }
                        e.target.value = "";
                      }}
                    >
                      <option value="">إضافة منتج...</option>
                      {products.map(p => (
                        <optgroup key={p.id} label={p.name}>
                          {p.variants?.map(v => (
                            <option key={v.id} value={`${p.id}|${v.id}`}>
                              {v.size} - {v.color_name} (المتوفر: {v.quantity})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="px-4 py-2 text-neutral-600"
                disabled={isCreating}
              >
                إلغاء
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={isCreating}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal 
        order={selectedOrder}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="إلغاء الطلب"
        message="هل أنت متأكد أنك تريد إلغاء هذا الطلب؟ سيتم إرجاع المنتجات إلى المخزون."
        confirmText="تأكيد الإلغاء"
        cancelText="رجوع"
      />
    </div>
  );
}
