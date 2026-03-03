import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Eye, Trash2, CheckCircle, XCircle, Clock, X, ShoppingBag, Printer, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [wilayasMap, setWilayasMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWilayas();
    fetchOrders();

    // Subscribe to new orders to refresh list
    const subscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        console.log('New order received!', payload);
        fetchOrders(); // Refresh list
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchWilayas() {
    try {
      const { data, error } = await supabase.from('wilayas').select('id, name');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((w: any) => {
          map[w.id] = w.name;
        });
        setWilayasMap(map);
      }
    } catch (error) {
      console.error('Error fetching wilayas:', error);
    }
  }

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderItems(orderId: string) {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name, images)')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    } finally {
      setLoadingItems(false);
    }
  }

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  const handlePrint = () => {
    window.print();
  };

  async function updateStatus(id: string, status: string) {
    try {
      // 1. Fetch current order details including items and their product variants
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*, product_variants(*)))')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      const currentOrder = orderData;
      const oldStatus = currentOrder.status;

      // 2. Handle Inventory Logic
      if (status === 'confirmed' && oldStatus !== 'confirmed') {
        // Deduct stock
        for (const item of currentOrder.order_items) {
          if (item.products && item.products.product_variants) {
            const variant = item.products.product_variants.find((v: any) =>
              v.size === item.selected_size && v.color_name === item.selected_color
            );

            if (variant) {
              const newQuantity = variant.quantity - item.quantity;
              if (newQuantity < 0) {
                alert(`تنبيه: الكمية غير كافية للمنتج ${item.product_name} (${item.selected_size}, ${item.selected_color}). الكمية الحالية: ${variant.quantity}`);
                return;
              }

              await supabase
                .from('product_variants')
                .update({ quantity: newQuantity })
                .eq('id', variant.id);
            }
          }
        }
      } else if ((status === 'cancelled' || status === 'rejected') && oldStatus === 'confirmed') {
        // Restore stock
        for (const item of currentOrder.order_items) {
          if (item.products && item.products.product_variants) {
            const variant = item.products.product_variants.find((v: any) =>
              v.size === item.selected_size && v.color_name === item.selected_color
            );

            if (variant) {
              await supabase
                .from('product_variants')
                .update({ quantity: variant.quantity + item.quantity })
                .eq('id', variant.id);
            }
          }
        }
      }

      // 3. Update Status
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchOrders(); // Refresh to see changes
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-serif font-bold text-gray-900">إدارة الطلبات</h1>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>أحدث الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-tr-lg">رقم الطلب</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">الهاتف</th>
                  <th className="px-4 py-3">العنوان</th>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 rounded-tl-lg">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">لا توجد طلبات حتى الآن</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-900">#{order.order_number || order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {order.customer_first_name} {order.customer_last_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500">{order.customer_phone || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[150px]" title={order.address}>
                        {wilayasMap[order.wilaya_id] || order.wilaya_id || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString('ar-DZ')}</td>
                      <td className="px-4 py-3 font-bold">{order.total_price} د.ج</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(order.status))}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => updateStatus(order.id, 'confirmed')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="تأكيد"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="إلغاء"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <p className="text-center py-8 text-gray-500">جاري التحميل...</p>
            ) : orders.length === 0 ? (
              <p className="text-center py-8 text-gray-500">لا توجد طلبات حتى الآن</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-xs text-gray-500">#{order.order_number || order.id.slice(0, 8)}</p>
                      <h4 className="font-bold text-gray-900">{order.customer_first_name} {order.customer_last_name}</h4>
                      <p className="text-xs text-gray-500">{order.customer_phone}</p>
                    </div>
                    <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold", getStatusColor(order.status))}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">{wilayasMap[order.wilaya_id] || order.wilaya_id}</span>
                    <span className="font-bold">{order.total_price} د.ج</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="flex items-center justify-center gap-1 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                    >
                      <Eye className="w-3 h-3" /> معاينة
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'confirmed')}
                      className="flex items-center justify-center gap-1 py-2 bg-green-600 rounded-xl text-xs font-bold text-white hover:bg-green-700"
                    >
                      <CheckCircle className="w-3 h-3" /> تأكيد
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100"
                    >
                      <XCircle className="w-3 h-3" /> إلغاء
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 print:static print:border-b-2 print:border-black">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg print:hidden">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold">تفاصيل الطلب #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</h2>
                  <p className="text-xs text-gray-500">{new Date(selectedOrder.created_at).toLocaleString('ar-DZ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button onClick={handlePrint} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="طباعة">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-black">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 print:space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl print:bg-white print:border print:border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">العميل</p>
                  <p className="font-medium">
                    {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">رقم الهاتف</p>
                  <p className="font-medium font-mono" dir="ltr">{selectedOrder.customer_phone || '-'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">الولاية</p>
                  <p className="font-medium">{wilayasMap[selectedOrder.wilaya_id] || selectedOrder.wilaya_id || '-'}</p>
                </div>

                {selectedOrder.municipality_name && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">البلدية</p>
                    <p className="font-medium">{selectedOrder.municipality_name}</p>
                  </div>
                )}

                {selectedOrder.delivery_type && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">طريقة التوصيل</p>
                    <p className="font-medium flex items-center gap-2">
                      {selectedOrder.delivery_type === 'home' ? (
                        <>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">توصيل للمنزل</span>
                        </>
                      ) : selectedOrder.delivery_type === 'stop_desk' ? (
                        <>
                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">استلام من المكتب</span>
                        </>
                      ) : (
                        selectedOrder.delivery_type
                      )}
                    </p>
                  </div>
                )}

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">العنوان</p>
                  <p className="font-medium">{selectedOrder.address || '-'}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-bold mb-3 border-b border-gray-100 pb-2 print:border-black">المنتجات</h3>
                {loadingItems ? (
                  <p className="text-center text-gray-500 py-4">جاري تحميل المنتجات...</p>
                ) : orderItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">لا توجد منتجات في هذا الطلب</p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors print:border-none print:p-0 print:mb-2">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 print:hidden">
                          {item.products?.images && item.products.images[0] ? (
                            <img
                              src={item.products.images[0]}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">IMG</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{item.products?.name || 'منتج محذوف'}</p>
                          <p className="text-xs text-gray-500">
                            {item.size && `المقاس: ${item.size}`} {item.color && `| اللون: ${item.color}`}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">{item.price} د.ج</p>
                          <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="space-y-2 pt-4 border-t border-gray-100 print:border-black">
                {selectedOrder.shipping_price > 0 && (
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>سعر التوصيل</span>
                    <span>{selectedOrder.shipping_price} د.ج</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">الإجمالي</span>
                  <span className="font-serif font-bold text-2xl">{selectedOrder.total_price} د.ج</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2 print:hidden">
                <button
                  onClick={() => { updateStatus(selectedOrder.id, 'confirmed'); setSelectedOrder(null); }}
                  className="bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> تأكيد الطلب
                </button>
                <button
                  onClick={() => { updateStatus(selectedOrder.id, 'cancelled'); setSelectedOrder(null); }}
                  className="bg-white text-red-600 border border-red-100 py-3 rounded-xl hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> إلغاء الطلب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
