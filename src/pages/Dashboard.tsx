import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Package, Users, DollarSign } from 'lucide-react';
import { formatNumber } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      const { data: revenueData } = await supabase.from('orders').select('total_price').neq('status', 'cancelled');
      const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;

      setStats({
        totalOrders: ordersCount || 0,
        totalProducts: productsCount || 0,
        totalRevenue,
        pendingOrders: pendingCount || 0
      });
    }
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, subtext }: any) => (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className="p-3 bg-black/5 rounded-xl">
          <Icon size={24} className="text-black" />
        </div>
      </div>
      <div className="text-4xl font-bold text-gray-900 font-serif mb-2">{value}</div>
      {subtext && <p className="text-sm text-gray-400">{subtext}</p>}
    </div>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-3">لوحة التحكم</h1>
        <p className="text-gray-500 text-lg">مرحباً بك في لوحة تحكم متجر بابيون.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="إجمالي المبيعات" 
          value={`${formatNumber(stats.totalRevenue.toLocaleString('en-US'))} د.ج`} 
          icon={DollarSign} 
        />
        <StatCard 
          title="إجمالي الطلبات" 
          value={formatNumber(stats.totalOrders)} 
          icon={ShoppingBag} 
        />
        <StatCard 
          title="طلبات قيد الانتظار" 
          value={formatNumber(stats.pendingOrders)} 
          icon={Users}
          subtext="طلبات بانتظار التأكيد"
        />
        <StatCard 
          title="المنتجات النشطة" 
          value={formatNumber(stats.totalProducts)} 
          icon={Package} 
        />
      </div>
    </div>
  );
}
