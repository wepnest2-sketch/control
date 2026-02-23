import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SiteSettings, AboutUsContent } from '@/types/database';
import { Save, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'content'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [aboutUs, setAboutUs] = useState<Partial<AboutUsContent>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [settingsRes, aboutRes] = await Promise.all([
      supabase.from('site_settings').select('*').single(),
      supabase.from('about_us_content').select('*').single()
    ]);

    if (settingsRes.data) setSettings(settingsRes.data);
    else {
      // Initialize if empty
      setSettings({
        site_name: 'Papillon',
        primary_color: '#000000',
        secondary_color: '#FFFFFF',
        delivery_company_name: 'Yalidine'
      });
    }

    if (aboutRes.data) setAboutUs(aboutRes.data);
    else {
      setAboutUs({
        title: 'About Us',
        content: 'Welcome to our store.',
        features: []
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Save Settings
      if (settings.id) {
        await supabase.from('site_settings').update(settings).eq('id', settings.id);
      } else {
        const { data } = await supabase.from('site_settings').insert(settings).select().single();
        if (data) setSettings(data);
      }

      // Save About Us
      if (aboutUs.id) {
        await supabase.from('about_us_content').update(aboutUs).eq('id', aboutUs.id);
      } else {
        const { data } = await supabase.from('about_us_content').insert(aboutUs).select().single();
        if (data) setAboutUs(data);
      }

      alert('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">جاري تحميل الإعدادات...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-neutral-900">الإعدادات</h2>
          <p className="text-neutral-500 mt-1">إدارة تكوين الموقع والمحتوى.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          <span>حفظ التغييرات</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'general' 
              ? 'border-black text-black' 
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          الإعدادات العامة
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'content' 
              ? 'border-black text-black' 
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          محتوى "من نحن"
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
        {activeTab === 'general' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم الموقع</label>
                <input 
                  className="w-full p-2 border border-neutral-200 rounded-lg"
                  value={settings.site_name || ''}
                  onChange={e => setSettings({...settings, site_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">شركة التوصيل</label>
                <input 
                  className="w-full p-2 border border-neutral-200 rounded-lg"
                  value={settings.delivery_company_name || ''}
                  onChange={e => setSettings({...settings, delivery_company_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">رابط الشعار (Logo URL)</label>
                <ImageUpload 
                  value={settings.logo_url ? [settings.logo_url] : []}
                  onChange={(urls) => setSettings({...settings, logo_url: urls[0] || ''})}
                  multiple={false}
                  maxFiles={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">رابط الأيقونة (Favicon URL)</label>
                <ImageUpload 
                  value={settings.favicon_url ? [settings.favicon_url] : []}
                  onChange={(urls) => setSettings({...settings, favicon_url: urls[0] || ''})}
                  multiple={false}
                  maxFiles={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">اللون الأساسي</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="w-10 h-10 rounded border-0 p-0 cursor-pointer"
                    value={settings.primary_color || '#000000'}
                    onChange={e => setSettings({...settings, primary_color: e.target.value})}
                  />
                  <input 
                    className="flex-1 p-2 border border-neutral-200 rounded-lg uppercase"
                    value={settings.primary_color || ''}
                    onChange={e => setSettings({...settings, primary_color: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">اللون الثانوي</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="w-10 h-10 rounded border-0 p-0 cursor-pointer"
                    value={settings.secondary_color || '#FFFFFF'}
                    onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                  />
                  <input 
                    className="flex-1 p-2 border border-neutral-200 rounded-lg uppercase"
                    value={settings.secondary_color || ''}
                    onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-neutral-100">
              <h3 className="font-medium text-lg">قسم الهيرو (الواجهة الرئيسية)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان الهيرو</label>
                  <input 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={settings.hero_title || ''}
                    onChange={e => setSettings({...settings, hero_title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">وصف الهيرو</label>
                  <input 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={settings.hero_subtitle || ''}
                    onChange={e => setSettings({...settings, hero_subtitle: e.target.value})}
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-sm font-medium">رابط صورة الهيرو</label>
                  <ImageUpload 
                    value={settings.hero_image_url ? [settings.hero_image_url] : []}
                    onChange={(urls) => setSettings({...settings, hero_image_url: urls[0] || ''})}
                    multiple={false}
                    maxFiles={1}
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-sm font-medium">نص شريط الإعلانات</label>
                  <input 
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                    value={settings.announcement_text || ''}
                    onChange={e => setSettings({...settings, announcement_text: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان الصفحة</label>
              <input 
                className="w-full p-2 border border-neutral-200 rounded-lg"
                value={aboutUs.title || ''}
                onChange={e => setAboutUs({...aboutUs, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">المحتوى</label>
              <textarea 
                className="w-full p-4 border border-neutral-200 rounded-lg h-64 font-mono text-sm"
                value={aboutUs.content || ''}
                onChange={e => setAboutUs({...aboutUs, content: e.target.value})}
              />
              <p className="text-xs text-neutral-400">يدعم HTML أو Markdown حسب تنفيذ الواجهة الأمامية.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
