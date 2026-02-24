import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, Product } from '@/types/database';
import { X, Printer, MapPin, Phone, User, Calendar, Package, ImageIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && order?.items) {
      fetchProductImages();
    }
  }, [isOpen, order]);

  async function fetchProductImages() {
    if (!order?.items) return;
    
    const productIds = order.items
      .map(item => item.product_id)
      .filter((id): id is string => !!id);
    
    if (productIds.length === 0) return;

    const { data, error } = await supabase
      .from('products')
      .select('id, images')
      .in('id', productIds);

    if (data) {
      const imageMap: Record<string, string> = {};
      data.forEach(p => {
        if (p.images && p.images.length > 0) {
          imageMap[p.id] = p.images[0];
        }
      });
      setProductImages(imageMap);
    }
  }

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white print:static">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #order-modal-content, #order-modal-content * {
            visibility: visible;
          }
          #order-modal-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div 
        id="order-modal-content"
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex justify-between items-start sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-serif font-bold text-neutral-900">الطلب #{order.order_number}</h2>
              <div className="no-print">
                <StatusBadge status={order.status} />
              </div>
            </div>
            <p className="text-neutral-500 text-sm flex items-center gap-2">
              <Calendar size={14} />
              {new Date(order.created_at).toLocaleString('ar-DZ')}
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button 
              onClick={handlePrint}
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
              title="طباعة"
            >
              <Printer size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Customer Info Card */}
          <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <User size={20} className="text-neutral-500" />
              معلومات العميل
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User size={16} className="mt-1 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">الاسم الكامل</p>
                    <p className="font-medium">{order.customer_first_name} {order.customer_last_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-1 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">رقم الهاتف</p>
                    <p className="font-medium font-mono" dir="ltr">{order.customer_phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-1 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">العنوان</p>
                    <p className="font-medium">{order.address}</p>
                    <p className="text-sm text-neutral-600">{order.municipality_name}, {order.wilaya?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package size={16} className="mt-1 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">نوع التوصيل</p>
                    <p className="font-medium">
                      {order.delivery_type === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package size={20} className="text-neutral-500" />
              المنتجات
            </h3>
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium">المنتج</th>
                    <th className="px-4 py-3 text-center font-medium">الكمية</th>
                    <th className="px-4 py-3 text-left font-medium">السعر</th>
                    <th className="px-4 py-3 text-left font-medium">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product_id && productImages[item.product_id] ? (
                              <img 
                                src={productImages[item.product_id]} 
                                alt={item.product_name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {item.selected_size && <span className="ml-2">المقاس: {item.selected_size}</span>}
                              {item.selected_color && <span>اللون: {item.selected_color}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                      <td className="px-4 py-3 text-left font-mono">{item.price.toLocaleString()} د.ج</td>
                      <td className="px-4 py-3 text-left font-mono font-medium">{(item.price * item.quantity).toLocaleString()} د.ج</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50 border-t border-neutral-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-left font-bold">الإجمالي الكلي</td>
                    <td className="px-4 py-3 text-left font-bold font-mono text-lg">{order.total_price.toLocaleString()} د.ج</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer Notes (Print Only) */}
          <div className="hidden print:block mt-12 pt-8 border-t border-neutral-200 text-center text-sm text-neutral-500">
            <p>شكراً لثقتكم بنا!</p>
            <p className="mt-2">{window.location.hostname}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
