import { useState, useEffect, useRef } from 'react';
import { Bell, User, Menu, X, Trash2, Check, BellRing } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Premium sound provided by user
const NOTIFICATION_SOUND_URL = "https://res.cloudinary.com/dlwuxgvse/video/upload/v1772274343/6GYhcxV_rSI_eohbgv.mp3";

interface HeaderProps {
  onMenuClick: () => void;
}

interface Notification {
  id: string;
  message: string;
  time: Date;
  read: boolean;
  type?: 'order' | 'system';
}

export function Header({ onMenuClick }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.load();

    // Subscribe to new orders
    const subscription = supabase
      .channel('header-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new;
        const message = `طلب جديد #${newOrder.order_number || newOrder.id.slice(0, 8)} من ${newOrder.customer_first_name || ''} ${newOrder.customer_last_name || ''}`;

        const newNotification: Notification = {
          id: Date.now().toString(),
          message,
          time: new Date(),
          read: false,
          type: 'order'
        };

        setNotifications(prev => [newNotification, ...prev]);
        playNotificationSound();
        showSystemNotification(message);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const showSystemNotification = (message: string) => {
    if (Notification.permission === 'granted') {
      new Notification('Papillon Admin', {
        body: message,
        icon: 'https://res.cloudinary.com/dlwuxgvse/image/upload/v1771974115/ifjgnx1teusftkjbmsee.jpg'
      });
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-gray-500 text-sm font-medium hidden md:block">لوحة التحكم / نظرة عامة</h2>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-50"
          >
            <Bell className={cn("w-6 h-6", unreadCount > 0 && "animate-tada text-black")} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white">
                <div>
                  <h3 className="font-bold text-gray-900">مركز الإشعارات</h3>
                  <p className="text-[10px] text-gray-400">تابع تحركات متجرك لحظة بلحظة</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex-1 md:flex-none p-1.5 px-3 text-[10px] bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check className="w-3 h-3" /> تم قراءتها
                    </button>
                  )}
                  <button
                    onClick={clearNotifications}
                    className="flex-1 md:flex-none p-1.5 px-3 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> مسح
                  </button>
                </div>
              </div>

              {/* Permission Banner */}
              {permission !== 'granted' && (
                <div className="p-3 bg-black text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-gray-300" />
                    <span className="text-[10px] font-medium">فعل إشعارات المتصفح لتسمع الصوت</span>
                  </div>
                  <button
                    onClick={requestPermission}
                    className="bg-white text-black px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-gray-200"
                  >
                    تفعيل الآن
                  </button>
                </div>
              )}

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">لا توجد تنبيهات</p>
                    <p className="text-xs text-gray-400 mt-1">عند وصول طلبات جديدة ستظهر هنا</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-gray-50 transition-colors border-r-4",
                          notification.read ? "border-transparent opacity-60" : "border-black bg-gray-50/50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-black">طلب جديد</span>
                          <span className="text-[9px] text-gray-400 font-mono">
                            {notification.time.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-800 leading-relaxed">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-2 border-r border-gray-100 pr-4">
          <div className="text-left hidden md:block">
            <p className="text-sm font-bold text-gray-900">المدير العام</p>
            <p className="text-xs text-gray-500">مشرف النظام</p>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
            <User className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>

      {isNotificationOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsNotificationOpen(false)}
        />
      )}
    </header>
  );
}
