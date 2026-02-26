import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Layers, Map, Settings, FileText, Menu, X, LogOut, Languages } from 'lucide-react';
import { cn } from '../lib/utils';
import NotificationBell from './NotificationBell';
import { useLanguage } from '../lib/i18n';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { t, language, setLanguage, dir } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: t('dashboard') },
    { to: "/orders", icon: ShoppingBag, label: t('orders') },
    { to: "/products", icon: Package, label: t('products') },
    { to: "/categories", icon: Layers, label: t('categories') },
    { to: "/wilayas", icon: Map, label: t('wilayas') },
    { to: "/about", icon: FileText, label: t('about') },
    { to: "/settings", icon: Settings, label: t('settings') },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex font-sans text-gray-900" dir={dir}>
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-black text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto shadow-2xl print:hidden",
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-20 flex items-center justify-between px-8 border-b border-white/10">
          <span className="text-2xl font-serif font-bold tracking-wider">بابيون</span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="p-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3.5 text-base font-medium transition-all rounded-xl",
                  isActive
                    ? "bg-white text-black shadow-lg translate-x-[-4px]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-8 right-0 left-0 px-6 space-y-2">
          <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full rounded-xl transition-colors">
            <LogOut size={20} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto print:block">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-10 shadow-sm print:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-black">
            <Menu size={24} />
          </button>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Languages size={20} />
              <span className="font-medium text-sm">{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            <NotificationBell />
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-900">المدير العام</p>
              <p className="text-xs text-gray-500">مشرف النظام</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-gray-100">
              م
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 print:overflow-visible print:h-auto print:p-0">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
