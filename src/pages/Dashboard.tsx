import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Clock, Package } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { arDZ } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeProducts: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Fetch Counts
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        const { count: pendingCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // 2. Fetch Orders for Sales & Chart
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_price, created_at')
          .order('created_at', { ascending: true });

        if (ordersError) throw ordersError;

        // Calculate Total Sales
        const totalSales = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;

        // Process Chart Data (Last 6 Months)
        const monthlyData = new Map();
        const today = new Date();
        
        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(today, i);
          const key = format(date, 'yyyy-MM');
          const label = format(date, 'MMMM', { locale: arDZ });
          monthlyData.set(key, { name: label, sales: 0, originalDate: date });
        }

        orders?.forEach(order => {
          const date = new Date(order.created_at);
          const key = format(date, 'yyyy-MM');
          if (monthlyData.has(key)) {
            const current = monthlyData.get(key);
            monthlyData.set(key, { ...current, sales: current.sales + (order.total_price || 0) });
          }
        });

        const processedChartData = Array.from(monthlyData.values());

        setStats({
          totalSales,
          totalOrders: ordersCount || 0,
          pendingOrders: pendingCount || 0,
          activeProducts: productsCount || 0,
        });
        setChartData(processedChartData);

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold text-gray-900">لوحة التحكم</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="إجمالي المبيعات" 
          value={`${stats.totalSales.toLocaleString()} د.ج`} 
          icon={DollarSign} 
          loading={loading}
        />
        <StatsCard 
          title="عدد الطلبات" 
          value={stats.totalOrders.toString()} 
          icon={ShoppingBag} 
          loading={loading}
          to="/orders"
        />
        <StatsCard 
          title="طلبات قيد الانتظار" 
          value={stats.pendingOrders.toString()} 
          icon={Clock} 
          loading={loading}
          highlight
          to="/orders"
        />
        <StatsCard 
          title="المنتجات النشطة" 
          value={stats.activeProducts.toString()} 
          icon={Package} 
          loading={loading}
          to="/products"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">جاري التحميل...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} د.ج`, 'المبيعات']}
                  />
                  <Bar dataKey="sales" fill="#000000" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, loading, highlight, to }: any) {
  const content = (
    <Card className={`${highlight ? "border-black/10 shadow-md" : ""} ${to ? "hover:shadow-lg transition-shadow cursor-pointer" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 font-sans">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold font-serif">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}
