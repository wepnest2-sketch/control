import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Package, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { arDZ } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Order } from '../types';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  activeProducts: number;
}

interface SalesData {
  date: string;
  amount: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغى',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeProducts: 0,
  });
  const [salesChartData, setSalesChartData] = useState<SalesData[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Stats
        const { data: salesData, error: salesError } = await supabase
          .from('orders')
          .select('total_price')
          .neq('status', 'cancelled');

        if (salesError) throw salesError;
        const totalSales = salesData?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;

        const { count: totalOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        if (ordersError) throw ordersError;

        const { count: pendingOrders, error: pendingError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (pendingError) throw pendingError;

        const { count: activeProducts, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (productsError) throw productsError;

        setStats({
          totalSales,
          totalOrders: totalOrders || 0,
          pendingOrders: pendingOrders || 0,
          activeProducts: activeProducts || 0,
        });

        // 2. Fetch Chart Data (Last 7 Days)
        const endDate = new Date();
        const startDate = subDays(endDate, 7);
        
        const { data: ordersData, error: chartError } = await supabase
          .from('orders')
          .select('created_at, total_price')
          .neq('status', 'cancelled')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (chartError) throw chartError;

        // Group by date
        const groupedData: Record<string, number> = {};
        
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const key = format(d, 'yyyy-MM-dd');
          groupedData[key] = 0;
        }

        ordersData?.forEach(order => {
          const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
          if (groupedData[dateKey] !== undefined) {
            groupedData[dateKey] += order.total_price || 0;
          }
        });

        const chartData = Object.entries(groupedData).map(([date, amount]) => ({
          date: format(new Date(date), 'EEE', { locale: arDZ }), // Mon, Tue, etc. in Arabic
          amount,
        }));

        setSalesChartData(chartData);

        // 3. Fetch Recent Orders
        const { data: recentOrdersData, error: recentOrdersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentOrdersError) throw recentOrdersError;
        setRecentOrders(recentOrdersData || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'إجمالي المبيعات',
      value: `${(stats.totalSales || 0).toLocaleString()} د.ج`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      title: 'عدد الطلبات',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'طلبات قيد الانتظار',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      title: 'المنتجات النشطة',
      value: stats.activeProducts,
      icon: Package,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-sm text-gray-500">آخر تحديث: {new Date().toLocaleTimeString('ar-DZ')}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="mt-2 font-serif text-3xl font-bold text-gray-900">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`rounded-full p-3 ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-serif text-xl font-bold text-gray-900">المبيعات (آخر 7 أيام)</h2>
        <div className="h-80 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-gray-400">جاري تحميل البيانات...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toLocaleString()} د.ج`, 'المبيعات']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-gray-900">أحدث الطلبات</h2>
          <Link to="/orders" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black">
            عرض الكل
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الطلب</th>
                <th className="px-6 py-4 font-medium">العميل</th>
                <th className="px-6 py-4 font-medium">المبلغ</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">جاري التحميل...</td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">لا توجد طلبات حديثة</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      #{order.order_number || order.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {order.customer_first_name} {order.customer_last_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      {(order.total_price || 0).toLocaleString()} د.ج
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
