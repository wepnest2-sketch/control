import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types/database';
import { Eye, Search, Filter, X, CheckCircle, Loader2, XCircle, Printer, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // Order with items
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    let query = supabase.from('orders').select('*, wilayas(name)').order('created_at', { ascending: false });
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    if (data) setOrders(data);
  }

  const fetchOrderDetails = async (orderId: string) => {
    const { data: order } = await supabase
      .from('orders')
      .select('*, wilayas(name), order_items(*, products(images))')
      .eq('id', orderId)
      .single();
    
    if (order) {
      setSelectedOrder(order);
      setIsDetailOpen(true);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    
    // Optimistic update for UI
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));

    try {
      // Update status only - DB triggers handle stock logic
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Force refresh orders to ensure UI and data are in sync
      await fetchOrders();
      
      // If we are in detail view, update the selected order as well
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(`حدث خطأ أثناء تحديث الحالة: ${error.message || 'خطأ غير معروف'}`);
      // Revert optimistic update
      fetchOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const deleteOrder = (orderId: string) => {
    setDeleteModal({ isOpen: true, orderId });
  };

  const confirmDeleteOrder = async () => {
    const orderId = deleteModal.orderId;
    if (!orderId) return;

    setUpdatingOrderId(orderId);
    try {
      // 1. Delete order items first (manual cascade)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;

      // 2. Delete the order
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setIsDetailOpen(false);
        setSelectedOrder(null);
      }
    } catch (error: any) {
      console.error('Error deleting order:', error);
      alert(`حدث خطأ أثناء حذف الطلب: ${error.message}`);
    } finally {
      setUpdatingOrderId(null);
      setDeleteModal({ isOpen: false, orderId: null });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'تم التأكيد';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-gray-900">الطلبات</h1>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-black text-sm font-medium"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="confirmed">تم التأكيد</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التوصيل</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 active:scale-[0.98] transition-transform" onClick={() => fetchOrderDetails(order.id)}>
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-lg">#{order.order_number}</span>
                <p className="text-xs text-gray-500 font-mono mt-1">{format(new Date(order.created_at), 'd MMM yyyy', { locale: ar }).replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])}</p>
              </div>
              <span className={cn("px-3 py-1.5 rounded-full text-xs font-bold", getStatusColor(order.status))}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            
            <div>
              <p className="font-bold text-gray-900">{order.customer_first_name} {order.customer_last_name}</p>
              <p className="text-sm text-gray-500 font-mono" dir="ltr">{order.customer_phone}</p>
              <p className="text-sm text-gray-600 mt-1">{(order as any).wilayas?.name || order.wilaya_id}</p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="font-mono font-bold text-lg">{order.total_price.toLocaleString('en-US')} د.ج</span>
              
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(order.id, 'confirmed');
                    }}
                    disabled={updatingOrderId === order.id}
                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                  >
                    {updatingOrderId === order.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                  </button>
                )}
                 <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOrder(order.id);
                    }}
                    disabled={updatingOrderId === order.id}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-bold text-gray-500">رقم الطلب</th>
                <th className="px-6 py-5 font-bold text-gray-500">العميل</th>
                <th className="px-6 py-5 font-bold text-gray-500">الولاية</th>
                <th className="px-6 py-5 font-bold text-gray-500">الإجمالي</th>
                <th className="px-6 py-5 font-bold text-gray-500">التاريخ</th>
                <th className="px-6 py-5 font-bold text-gray-500">الحالة</th>
                <th className="px-6 py-5 font-bold text-gray-500 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fetchOrderDetails(order.id)}>
                  <td className="px-6 py-4 font-mono font-bold">#{order.order_number.toString()}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 text-base">{order.customer_first_name} {order.customer_last_name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-1" dir="ltr">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {(order as any).wilayas?.name || order.wilaya_id}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-base">{order.total_price.toLocaleString('en-US')} د.ج</td>
                  <td className="px-6 py-4 text-gray-500 font-mono">{format(new Date(order.created_at), 'd MMM yyyy', { locale: ar }).replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1.5 rounded-full text-xs font-bold", getStatusColor(order.status))}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left flex items-center gap-2 justify-end">
                    {order.status === 'pending' && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(order.id, 'confirmed');
                          }}
                          disabled={updatingOrderId === order.id}
                          className="p-2.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
                          title="تأكيد الطلب"
                        >
                          {updatingOrderId === order.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
                              updateStatus(order.id, 'cancelled');
                            }
                          }}
                          disabled={updatingOrderId === order.id}
                          className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                          title="رفض الطلب"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchOrderDetails(order.id);
                      }}
                      className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-black hover:text-white transition-all"
                      title="معاينة"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOrder(order.id);
                      }}
                      disabled={updatingOrderId === order.id}
                      className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                      title="حذف الطلب"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-sm print:bg-white print:static print:block print:h-auto print:z-auto">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-8 shadow-2xl animate-in slide-in-from-left duration-300 print:shadow-none print:w-full print:max-w-none print:h-auto print:overflow-visible print:animate-none">
            <div className="flex items-center justify-between mb-8 print:hidden">
              <h2 className="text-3xl font-serif font-bold text-gray-900">طلب #{selectedOrder.order_number}</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="طباعة">
                  <Printer size={24} />
                </button>
                <button 
                  onClick={() => deleteOrder(selectedOrder.id)} 
                  className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors" 
                  title="حذف الطلب"
                >
                  <Trash2 size={24} />
                </button>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 text-center border-b pb-4">
              <h1 className="text-4xl font-bold mb-2">فاتورة طلب</h1>
              <p className="text-xl">#{selectedOrder.order_number}</p>
            </div>

            <div className="space-y-8 print:space-y-4">
              {/* Status Control */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3 print:hidden">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">تحديث الحالة</label>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-white font-medium"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="confirmed">تم التأكيد</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">معلومات العميل</h3>
                <div className="space-y-3 text-base text-gray-700">
                  <p className="flex justify-between"><span className="text-gray-400">الاسم:</span> <span className="font-medium">{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400">الهاتف:</span> <span className="font-mono font-medium">{selectedOrder.customer_phone}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400">العنوان:</span> <span className="font-medium text-left">{selectedOrder.address}, {selectedOrder.municipality_name}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400">الولاية:</span> <span className="font-medium">{selectedOrder.wilayas?.name}</span></p>
                  {selectedOrder.instagram_account && (
                    <p className="flex justify-between"><span className="text-gray-400">انستغرام:</span> <span className="font-medium text-blue-600">{selectedOrder.instagram_account}</span></p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">المنتجات</h3>
                <div className="space-y-4">
                  {selectedOrder.order_items.map((item: any) => (
                    <div key={item.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                      {item.products?.images?.[0] && (
                        <img 
                          src={item.products.images[0]} 
                          alt={item.product_name} 
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{item.product_name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.selected_size && <span className="bg-white px-2 py-0.5 rounded border border-gray-200 ml-2">{item.selected_size}</span>}
                              {item.selected_color && <span className="bg-white px-2 py-0.5 rounded border border-gray-200 ml-2">{item.selected_color}</span>}
                              <span className="font-mono font-medium">x {item.quantity}</span>
                            </p>
                          </div>
                          <p className="font-mono font-bold text-gray-900">{(item.price * item.quantity).toLocaleString('en-US')} د.ج</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">المجموع الكلي</span>
                  <span className="text-2xl font-serif font-bold text-black">{selectedOrder.total_price.toLocaleString('en-US')} د.ج</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, orderId: null })}
        onConfirm={confirmDeleteOrder}
        title="حذف الطلب"
        message="هل أنت متأكد من حذف هذا الطلب نهائياً؟ سيتم حذف جميع البيانات المتعلقة به ولا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        isDangerous={true}
      />
    </div>
  );
}
