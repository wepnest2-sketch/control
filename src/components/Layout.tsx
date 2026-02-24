import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  MapPin, 
  Settings, 
  Menu, 
  X,
  Layers,
  FileText,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, message: string, time: Date, read: boolean }[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, visible: boolean } | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Subscribe to new orders
    const subscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as any;
        const message = `طلب جديد #${newOrder.order_number} من ${newOrder.customer_first_name}`;
        
        const newNotification = {
          id: Math.random().toString(36).substr(2, 9),
          message,
          time: new Date(),
          read: false
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 20));
        showToast(message);
        playNotificationSound();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 5000);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/' },
    { icon: ShoppingBag, label: 'الطلبات', path: '/orders' },
    { icon: Package, label: 'المنتجات', path: '/products' },
    { icon: Layers, label: 'التصنيفات', path: '/categories' },
    { icon: MapPin, label: 'الولايات والتوصيل', path: '/wilayas' },
    { icon: FileText, label: 'المحتوى', path: '/content' },
    { icon: Settings, label: 'الإعدادات', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-64 bg-black text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h1 className="text-2xl font-serif italic font-bold">Papillon</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-white text-black font-medium" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Notification Toast */}
      {toast && toast.visible && (
        <div className="fixed top-4 left-4 z-[100] bg-black text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 pointer-events-auto">
          <div className="bg-white/20 p-2 rounded-full">
            <Bell size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm">طلب جديد!</h4>
            <p className="text-sm text-white/80">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="mr-auto text-white/60 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-6 lg:px-8 shrink-0 relative">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-neutral-600 hover:text-black lg:hidden"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) markAllAsRead();
                }}
                className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition-colors relative"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                    <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                      <h3 className="font-bold text-sm">الإشعارات</h3>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">أحدث 20 تنبيه</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-neutral-50">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-neutral-400">
                          <Bell size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-sm">لا توجد إشعارات حالياً</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={cn("p-4 hover:bg-neutral-50 transition-colors", !n.read && "bg-blue-50/30")}>
                            <p className="text-sm text-neutral-800 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-neutral-400 mt-1 block">
                              {n.time.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
