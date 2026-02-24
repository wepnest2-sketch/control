import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SiteSettings } from '../types/database';
import ImageUpload from '../components/ImageUpload';

export default function Settings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data } = await supabase.from('site_settings').select('*').single();
    if (data) setSettings(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    await supabase.from('site_settings').update(settings).eq('id', settings.id);
    setLoading(false);
    alert('تم حفظ الإعدادات بنجاح!');
  };

  if (!settings) return <div>جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">إعدادات الموقع</h1>
        <p className="text-gray-500 mt-2">تحكم في مظهر وإعدادات موقعك العامة.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Info */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
          <h2 className="text-xl font-bold border-b border-gray-100 pb-4 text-gray-900">معلومات عامة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">اسم الموقع</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={e => setSettings({...settings, site_name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">اسم شركة التوصيل</label>
              <input
                type="text"
                value={settings.delivery_company_name}
                onChange={e => setSettings({...settings, delivery_company_name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">نص الإعلان (الشريط العلوي)</label>
            <input
              type="text"
              value={settings.announcement_text || ''}
              onChange={e => setSettings({...settings, announcement_text: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
          <h2 className="text-xl font-bold border-b border-gray-100 pb-4 text-gray-900">الهوية البصرية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">رابط الشعار (Logo URL)</label>
              <ImageUpload
                value={settings.logo_url}
                onChange={(url) => setSettings({...settings, logo_url: url})}
                onRemove={() => setSettings({...settings, logo_url: ''})}
                placeholder="رفع الشعار"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">رابط أيقونة الموقع (Favicon URL)</label>
              <ImageUpload
                value={settings.favicon_url || ''}
                onChange={(url) => setSettings({...settings, favicon_url: url})}
                onRemove={() => setSettings({...settings, favicon_url: ''})}
                placeholder="رفع الأيقونة"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">اللون الأساسي</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={e => setSettings({...settings, primary_color: e.target.value})}
                  className="h-12 w-12 rounded-lg border border-gray-200 cursor-pointer p-1 bg-white"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={e => setSettings({...settings, primary_color: e.target.value})}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black uppercase font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">اللون الثانوي</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                  className="h-12 w-12 rounded-lg border border-gray-200 cursor-pointer p-1 bg-white"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black uppercase font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
          <h2 className="text-xl font-bold border-b border-gray-100 pb-4 text-gray-900">الواجهة الرئيسية (Hero Section)</h2>
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">رابط صورة الواجهة</label>
            <ImageUpload
              value={settings.hero_image_url || ''}
              onChange={(url) => setSettings({...settings, hero_image_url: url})}
              onRemove={() => setSettings({...settings, hero_image_url: ''})}
              placeholder="رفع صورة الواجهة"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">العنوان الرئيسي</label>
              <input
                type="text"
                value={settings.hero_title || ''}
                onChange={e => setSettings({...settings, hero_title: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">العنوان الفرعي</label>
              <input
                type="text"
                value={settings.hero_subtitle || ''}
                onChange={e => setSettings({...settings, hero_subtitle: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-bold shadow-lg shadow-gray-200 disabled:opacity-50 text-lg"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>
    </div>
  );
}
