import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Layers, 
  MapPin, 
  Settings, 
  Info, 
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/orders', icon: ShoppingBag, label: 'الطلبات' },
  { to: '/products', icon: Package, label: 'المنتجات' },
  { to: '/categories', icon: Layers, label: 'التصنيفات' },
  { to: '/wilayas', icon: MapPin, label: 'الولايات والتوصيل' },
  { to: '/settings', icon: Settings, label: 'الإعدادات' },
  { to: '/about', icon: Info, label: 'من نحن' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed right-0 top-0 h-screen w-64 bg-black text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
              <img 
                src="https://res.cloudinary.com/dlwuxgvse/image/upload/v1771974115/ifjgnx1teusftkjbmsee.jpg" 
                alt="Papillon Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-wider">بابيون</h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-white text-black shadow-lg" 
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )
              }
            >
              <item.icon className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
