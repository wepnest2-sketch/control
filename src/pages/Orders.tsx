import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types/database';
import { Eye, Search, Filter, X, CheckCircle, Loader2, XCircle, Printer, Trash2, Copy, MapPin, Truck } from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ConfirmationModal from '../components/ConfirmationModal';
import { useLanguage } from '../lib/i18n';

export default function Orders() {
  const { t, language } = useLanguage();
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
    let query = supabase
      .from('orders')
      .select('*, wilayas(name), order_items(product_name, quantity, selected_size, selected_color)')
      .order('created_at', { ascending: false });
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    if (data) setOrders(data);
  }

  const getOrderSummary = (order: any) => {
    if (!order.order_items || order.order_items.length === 0) return '';
    return order.order_items.map((item: any) => 
      `${item.product_name} ${item.selected_size ? `(${item.selected_size})` : ''} ${item.selected_color ? `[${item.selected_color}]` : ''} x${item.quantity}`
    ).join(' + ');
  };

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
      case 'pending': return t('pending');
      case 'confirmed': return t('confirmed');
      case 'shipped': return t('shipped');
      case 'delivered': return t('delivered');
      case 'cancelled': return t('cancelled');
      default: return status;
    }
  };

  const getDeliveryLabel = (type: string | null) => {
    if (type === 'home') return t('delivery_home_label');
    if (type === 'post' || type === 'desk') return t('delivery_post_label');
    return type || '-';
  };

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-3xl font-serif font-bold text-gray-900">{t('orders')}</h1>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-black text-sm font-medium"
          >
            <option value="all">{t('all_statuses')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="confirmed">{t('confirmed')}</option>
            <option value="shipped">{t('shipped')}</option>
            <option value="delivered">{t('delivered')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4 print:hidden">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 active:scale-[0.98] transition-transform" onClick={() => fetchOrderDetails(order.id)}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg">#{order.order_number}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(order.order_number.toString()); }}
                  className="text-gray-400 hover:text-black p-1"
                >
                  <Copy size={14} />
                </button>
                <p className="text-xs text-gray-500 font-mono mt-1">{format(new Date(order.created_at), 'd MMM yyyy', { locale: language === 'ar' ? ar : undefined })}</p>
              </div>
              <span className={cn("px-3 py-1.5 rounded-full text-xs font-bold", getStatusColor(order.status))}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            
            <div>
              <p className="font-bold text-gray-900">{order.customer_first_name} {order.customer_last_name}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 font-mono" dir="ltr">{order.customer_phone}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(order.customer_phone); }}
                  className="text-gray-400 hover:text-black p-1"
                >
                  <Copy size={12} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{(order as any).wilayas?.name || order.wilaya_id}</p>
              
              <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded-lg w-fit">
                  <Truck size={16} />
                  <span className="font-bold">{getDeliveryLabel(order.delivery_type)}</span>
                </div>

                <p className="text-sm text-gray-800">
                  <span className="font-bold text-gray-400 text-xs ml-1">{t('items')}:</span>
                  {getOrderSummary(order)}
                </p>
                
                <div className="flex items-start gap-1.5 text-gray-600 text-xs bg-gray-50 p-2 rounded-lg">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-gray-900">{order.municipality_name}</span>
                    {order.delivery_type === 'home' && order.address && (
                      <span className="block mt-0.5">{order.address}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="font-mono font-bold text-lg">{formatNumber(order.total_price)} {t('currency')}</span>
              
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
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-bold text-gray-500">{t('order_number')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('customer')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('wilaya')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('delivery_method')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('items')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('total')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('date')}</th>
                <th className="px-6 py-5 font-bold text-gray-500">{t('status')}</th>
                <th className="px-6 py-5 font-bold text-gray-500 text-left">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fetchOrderDetails(order.id)}>
                  <td className="px-6 py-4 font-mono font-bold group relative">
                    #{order.order_number.toString()}
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(order.order_number.toString()); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black p-1 transition-opacity"
                      title={t('copy')}
                    >
                      <Copy size={14} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 text-base">{order.customer_first_name} {order.customer_last_name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-2" dir="ltr">
                      {order.customer_phone}
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(order.customer_phone); }}
                        className="text-gray-300 hover:text-black p-0.5"
                        title={t('copy')}
                      >
                        <Copy size={10} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    <div>{(order as any).wilayas?.name || order.wilaya_id}</div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin size={12} />
                      {order.municipality_name}
                      {order.delivery_type === 'home' && order.address && ` - ${order.address}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold border",
                      order.delivery_type === 'home' 
                        ? "bg-blue-50 text-blue-700 border-blue-100" 
                        : "bg-orange-50 text-orange-700 border-orange-100"
                    )}>
                      {getDeliveryLabel(order.delivery_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium max-w-[200px] truncate" title={getOrderSummary(order)}>
                    {getOrderSummary(order)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-base">{formatNumber(order.total_price)} {t('currency')}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono">{format(new Date(order.created_at), 'd MMM yyyy', { locale: language === 'ar' ? ar : undefined })}</td>
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
                          title={t('confirm_order')}
                        >
                          {updatingOrderId === order.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(t('reject_order') + '?')) {
                              updateStatus(order.id, 'cancelled');
                            }
                          }}
                          disabled={updatingOrderId === order.id}
                          className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                          title={t('reject_order')}
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
                      title={t('order_details')}
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
                      title={t('delete_order')}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-sm print:bg-white print:fixed print:inset-0 print:z-[9999] print:flex print:items-start print:justify-center">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-8 shadow-2xl animate-in slide-in-from-left duration-300 print:shadow-none print:w-full print:max-w-none print:h-auto print:overflow-visible print:animate-none print:p-0">
            {/* Print Layout - Visible only when printing */}
            <div className="hidden print:block p-8 max-w-2xl mx-auto">
              {/* Header */}
              <div className="text-center border-b-2 border-black pb-6 mb-8">
                <h1 className="text-3xl font-serif font-bold mb-2">Papillon Store</h1>
                <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
                  <p>{t('date')}: {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  <p className="font-bold text-lg">#{selectedOrder.order_number}</p>
                </div>
              </div>

              {/* Customer Details Box */}
              <div className="border-2 border-black rounded-lg p-6 mb-8">
                <h3 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">{t('customer_info')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">{t('name')}</p>
                    <p className="font-bold text-lg">{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">{t('phone')}</p>
                    <p className="font-mono font-bold text-lg" dir="ltr">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">{t('wilaya')}</p>
                    <p className="font-bold">{selectedOrder.wilayas?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">{t('municipality')}</p>
                    <p className="font-bold">{selectedOrder.municipality_name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">{t('delivery_method')}</p>
                    <p className="font-bold flex items-center gap-2">
                      {getDeliveryLabel(selectedOrder.delivery_type)}
                      {selectedOrder.delivery_type === 'home' && selectedOrder.address && (
                        <span className="text-gray-600 font-normal">- {selectedOrder.address}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-4">{t('items')}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-right py-2">{t('product')}</th>
                      <th className="text-center py-2">{t('quantity')}</th>
                      <th className="text-left py-2">{t('price')}</th>
                      <th className="text-left py-2">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.order_items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-3">
                          <p className="font-bold">{item.product_name}</p>
                          <p className="text-xs text-gray-500">
                            {item.selected_size && `${item.selected_size} `}
                            {item.selected_color && item.selected_color}
                          </p>
                        </td>
                        <td className="text-center py-3 font-mono">x{item.quantity}</td>
                        <td className="text-left py-3 font-mono">{formatNumber(item.price)}</td>
                        <td className="text-left py-3 font-mono font-bold">{formatNumber(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black">
                      <td colSpan={3} className="pt-4 text-lg font-bold text-right">{t('total_amount')}</td>
                      <td className="pt-4 text-lg font-bold font-mono text-left">{formatNumber(selectedOrder.total_price)} {t('currency')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-400 mt-12 pt-4 border-t border-gray-200">
                <p>Thank you for shopping with Papillon Store</p>
              </div>
            </div>

            {/* Screen Layout - Hidden when printing */}
            <div className="print:hidden">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-serif font-bold text-gray-900">{t('order')} #{selectedOrder.order_number}</h2>
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title={t('print')}>
                    <Printer size={24} />
                  </button>
                  <button 
                    onClick={() => deleteOrder(selectedOrder.id)} 
                    className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors" 
                    title={t('delete_order')}
                  >
                    <Trash2 size={24} />
                  </button>
                  <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {/* Status Control */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('update_status')}</label>
                  <select 
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-white font-medium"
                  >
                    <option value="pending">{t('pending')}</option>
                    <option value="confirmed">{t('confirmed')}</option>
                    <option value="shipped">{t('shipped')}</option>
                    <option value="delivered">{t('delivered')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                  </select>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">{t('customer_info')}</h3>
                  <div className="space-y-3 text-base text-gray-700">
                    <p className="flex justify-between"><span className="text-gray-400">{t('name')}:</span> <span className="font-medium">{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">{t('phone')}:</span> <span className="font-mono font-medium">{selectedOrder.customer_phone}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">{t('wilaya')}:</span> <span className="font-medium">{selectedOrder.wilayas?.name}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">{t('municipality')}:</span> <span className="font-medium">{selectedOrder.municipality_name}</span></p>
                    {selectedOrder.delivery_type === 'home' && selectedOrder.address && (
                      <p className="flex justify-between"><span className="text-gray-400">{t('address')}:</span> <span className="font-medium text-left">{selectedOrder.address}</span></p>
                    )}
                    <p className="flex justify-between"><span className="text-gray-400">{t('delivery_method')}:</span> <span className="font-medium">{getDeliveryLabel(selectedOrder.delivery_type)}</span></p>
                    {selectedOrder.instagram_account && (
                      <p className="flex justify-between"><span className="text-gray-400">{t('instagram')}:</span> <span className="font-medium text-blue-600">{selectedOrder.instagram_account}</span></p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">{t('items')}</h3>
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
                            <p className="font-mono font-bold text-gray-900">{formatNumber(item.price * item.quantity)} {t('currency')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">{t('total_amount')}</span>
                    <span className="text-2xl font-serif font-bold text-black">{formatNumber(selectedOrder.total_price)} {t('currency')}</span>
                  </div>
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
        title={t('delete_order')}
        message={t('confirm_delete_order')}
        confirmText={t('yes_delete')}
        cancelText={t('cancel')}
        isDangerous={true}
      />
    </div>
  );
}
