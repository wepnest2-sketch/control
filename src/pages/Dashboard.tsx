import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Package, Users, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { useLanguage } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

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

    async function fetchLowStock() {
      // Fetch variants with quantity < 5
      const { data } = await supabase
        .from('product_variants')
        .select('*, products(name, images)')
        .lt('quantity', 5)
        .limit(5);
      
      if (data) setLowStockProducts(data);
    }

    async function fetchRevenueChart() {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), i);
        return format(d, 'yyyy-MM-dd');
      }).reverse();

      const { data } = await supabase
        .from('orders')
        .select('created_at, total_price')
        .neq('status', 'cancelled')
        .gte('created_at', last7Days[0]);

      if (data) {
        const chartData = last7Days.map(date => {
          const dayRevenue = data
            .filter(o => o.created_at.startsWith(date))
            .reduce((sum, o) => sum + (o.total_price || 0), 0);
          
          return {
            date: format(new Date(date), 'EEE', { locale: language === 'ar' ? ar : undefined }),
            revenue: dayRevenue
          };
        });
        setRevenueData(chartData);
      }
    }

    fetchStats();
    fetchLowStock();
    fetchRevenueChart();
  }, [language]);

  const StatCard = ({ title, value, icon: Icon, subtext, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:border-black/10' : ''}`}
    >
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
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-3">{t('welcome_title')}</h1>
        <p className="text-gray-500 text-lg">{t('welcome_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title={t('total_sales')} 
          value={`${formatNumber(stats.totalRevenue)} ${t('currency')}`} 
          icon={DollarSign} 
        />
        <StatCard 
          title={t('orders')} 
          value={formatNumber(stats.totalOrders)} 
          icon={ShoppingBag} 
          onClick={() => navigate('/orders')}
        />
        <StatCard 
          title={t('active_orders')} 
          value={formatNumber(stats.pendingOrders)} 
          icon={Users}
          subtext={t('pending')}
          onClick={() => navigate('/orders')}
        />
        <StatCard 
          title={t('products_count')} 
          value={formatNumber(stats.totalProducts)} 
          icon={Package} 
          onClick={() => navigate('/products')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-500" />
              {t('revenue_chart')}
            </h3>
          </div>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#000000" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-amber-600">
            <AlertTriangle size={24} />
            <h3 className="font-bold text-lg">{t('low_stock')}</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">{t('low_stock_desc')}</p>
          
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-amber-100 flex-shrink-0">
                    {item.products?.images?.[0] && (
                      <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-sm">{item.products?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.color_name} - {item.size}
                    </p>
                  </div>
                  <div className="text-center px-2">
                    <span className="block text-lg font-bold text-amber-600 leading-none">{item.quantity}</span>
                    <span className="text-[10px] text-amber-600/70">{t('quantity')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Package size={32} className="mx-auto mb-2 opacity-20" />
                <p>المخزون بحالة جيدة</p>
              </div>
            )}
            
            {lowStockProducts.length > 0 && (
              <button 
                onClick={() => navigate('/products')}
                className="w-full py-3 mt-2 text-sm font-bold text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
              >
                {t('view_all')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
