import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, Product } from '@/types/database';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch Orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch Products (for low stock)
      const { data: products, error: productsError } = await supabase
        .from('product_variants')
        .select('quantity');

      if (productsError) throw productsError;

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.status !== 'cancelled' ? order.total_price : 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const lowStockProducts = products?.filter(p => p.quantity < 5).length || 0;

      setStats({
        totalRevenue,
        totalOrders,
        pendingOrders,
        lowStockProducts
      });

      setRecentOrders(orders?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-neutral-900">لوحة التحكم</h2>
        <p className="text-neutral-500 mt-1">نظرة عامة على أداء متجرك.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي الإيرادات" 
          value={`${stats.totalRevenue.toLocaleString()} د.ج`} 
          icon={TrendingUp} 
          trend="+12.5%" 
        />
        <StatCard 
          title="إجمالي الطلبات" 
          value={stats.totalOrders.toString()} 
          icon={ShoppingBag} 
          trend="+5.2%" 
        />
        <StatCard 
          title="الطلبات المعلقة" 
          value={stats.pendingOrders.toString()} 
          icon={Clock} 
          alert={stats.pendingOrders > 0}
        />
        <StatCard 
          title="منتجات منخفضة المخزون" 
          value={stats.lowStockProducts.toString()} 
          icon={AlertCircle} 
          alert={stats.lowStockProducts > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
            <h3 className="font-serif font-semibold text-lg">أحدث الطلبات</h3>
            <button className="text-sm text-neutral-500 hover:text-black">عرض الكل</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-neutral-50 text-neutral-500 font-medium">
                <tr>
                  <th className="px-6 py-3">رقم الطلب</th>
                  <th className="px-6 py-3">العميل</th>
                  <th className="px-6 py-3">الحالة</th>
                  <th className="px-6 py-3">الإجمالي</th>
                  <th className="px-6 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-mono">#{order.order_number}</td>
                    <td className="px-6 py-4">{order.customer_first_name} {order.customer_last_name}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 font-medium">{order.total_price.toLocaleString()} د.ج</td>
                    <td className="px-6 py-4 text-neutral-500">
                      {new Date(order.created_at).toLocaleDateString('ar-DZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Mini Chart */}
        <div className="bg-black text-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-semibold text-xl mb-2">أداء المتجر</h3>
            <p className="text-white/60 text-sm">نظرة عامة على الإيرادات الأسبوعية</p>
          </div>
          
          <div className="h-48 mt-8">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Mon', value: 4000 },
                { name: 'Tue', value: 3000 },
                { name: 'Wed', value: 2000 },
                { name: 'Thu', value: 2780 },
                { name: 'Fri', value: 1890 },
                { name: 'Sat', value: 2390 },
                { name: 'Sun', value: 3490 },
              ]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#ffffff" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, alert }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <h4 className="text-2xl font-bold mt-2 font-serif">{value}</h4>
        </div>
        <div className={cn("p-2 rounded-lg", alert ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-600")}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm text-green-600">
          <TrendingUp size={14} className="ml-1" />
          <span>{trend} مقارنة بالشهر الماضي</span>
        </div>
      )}
    </div>
  );
}
