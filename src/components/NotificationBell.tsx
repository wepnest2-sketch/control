import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new orders
    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setUnreadCount(prev => prev + 1);
          setNotifications(prev => [payload.new, ...prev]);
          // Play sound
          new Audio('/notification.mp3').play().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    // Fetch unread orders. Assuming 'is_read' column exists as per user request.
    // If not, we might fallback to status='pending' but user specifically mentioned notification property.
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      // Count total unread
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    }
  };

  const markAsRead = async (orderId: string) => {
    await supabase.from('orders').update({ is_read: true }).eq('id', orderId);
    setUnreadCount(prev => Math.max(0, prev - 1));
    setNotifications(prev => prev.filter(n => n.id !== orderId));
    navigate('/orders'); // Navigate to orders page
  };

  const markAllAsRead = async () => {
    await supabase.from('orders').update({ is_read: true }).eq('is_read', false);
    setUnreadCount(0);
    setNotifications([]);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">الإشعارات</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  تحديد الكل كمقروء
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      onClick={() => markAsRead(notification.id)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 items-start"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">طلب جديد #{notification.order_number}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          من {notification.customer_first_name} {notification.customer_last_name}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-mono">
                          {format(new Date(notification.created_at), 'HH:mm - d MMM', { locale: ar })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  لا توجد إشعارات جديدة
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
