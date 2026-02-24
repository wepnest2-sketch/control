import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Wilayas from './pages/Wilayas';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import { isSupabaseConfigured } from './lib/supabase';
import { AlertCircle } from 'lucide-react';

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-neutral-200 p-10 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="text-amber-600" size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-4">مرحباً بك في لوحة تحكم Papillon</h1>
          <p className="text-neutral-600 mb-8 leading-relaxed text-lg">
            للبدء في استخدام النظام، يرجى ربط مشروعك بـ <span className="font-bold text-black">Supabase</span> عن طريق إضافة مفاتيح الربط في إعدادات البيئة.
          </p>
          
          <div className="grid grid-cols-1 gap-4 mb-10">
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 text-right">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">خطوات الإعداد:</h3>
              <ol className="space-y-3 text-neutral-700 text-sm list-decimal list-inside">
                <li>قم بإنشاء مشروع جديد على <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-black underline font-bold">Supabase</a>.</li>
                <li>انتقل إلى <span className="font-medium">Project Settings</span> ثم <span className="font-medium">API</span>.</li>
                <li>انسخ <span className="font-mono bg-neutral-100 px-1 rounded">Project URL</span> وضعه في <span className="font-mono text-amber-700">VITE_SUPABASE_URL</span>.</li>
                <li>انسخ <span className="font-mono bg-neutral-100 px-1 rounded">anon public key</span> وضعه في <span className="font-mono text-amber-700">VITE_SUPABASE_ANON_KEY</span>.</li>
                <li>قم بتشغيل ملف <span className="font-mono bg-neutral-100 px-1 rounded">/supabase/schema.sql</span> في محرر SQL الخاص بـ Supabase.</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="px-6 py-3 bg-black text-white rounded-xl font-medium shadow-lg hover:bg-neutral-800 transition-all cursor-default">
              بانتظار الإعداد...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/wilayas" element={<Wilayas />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/content" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<div className="p-8">Page not found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
