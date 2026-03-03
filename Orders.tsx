import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Layers, MapPin, Settings, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
  { name: 'الطلبات', href: '/orders', icon: ShoppingBag },
  { name: 'المنتجات', href: '/products', icon: Package },
  { name: 'التصنيفات', href: '/categories', icon: Layers },
  { name: 'الولايات والتوصيل', href: '/wilayas', icon: MapPin },
  { name: 'الإعدادات', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-black text-white shadow-xl">
      <div className="flex h-20 items-center justify-center border-b border-white/10">
        <h1 className="font-serif text-3xl font-bold tracking-wider text-white">بابيون</h1>
      </div>
      
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon
                className={clsx(
                  'ml-3 h-5 w-5 transition-colors',
                  isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button className="group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400">
          <LogOut className="ml-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-red-400" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
