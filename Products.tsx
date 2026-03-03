import { Bell, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-20 items-center justify-between bg-white px-4 shadow-sm sm:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="font-serif text-xl font-semibold text-gray-800">لوحة الإدارة</h2>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        <button className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-6 w-6" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        
        <div className="flex items-center gap-3 border-r border-gray-200 pr-4 sm:pr-6">
          <div className="hidden text-left md:block">
            <p className="text-sm font-semibold text-gray-900">المدير العام</p>
            <p className="text-xs text-gray-500">مشرف النظام</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-md">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
