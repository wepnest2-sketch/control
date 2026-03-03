import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="relative h-full">
          <Sidebar />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute left-4 top-4 rounded-full bg-white/10 p-1 text-white hover:bg-white/20 md:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
