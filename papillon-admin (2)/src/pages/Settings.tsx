import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Save, Loader2, Upload } from 'lucide-react';

export function Settings() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState({
    site_name: 'Papillon',
    logo_url: 'https://res.cloudinary.com/dlwuxgvse/image/upload/v1771974115/ifjgnx1teusftkjbmsee.jpg',
    primary_color: '#000000',
    secondary_color: '#FFFFFF',
    delivery_company_name: 'Yalidine'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.details || 'Upload failed');
      
      if (data.url) {
        setSettings(prev => ({ ...prev, logo_url: data.url }));
      }
    } catch (error: any) {
      console.error('Upload failed', error);
      alert('فشل رفع الشعار: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase.from('site_settings').select('id').single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update(settings)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([settings]);
        if (error) throw error;
      }
      
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold text-gray-900">إعدادات الموقع</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>الهوية البصرية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">اسم المتجر</label>
                <input
                  name="site_name"
                  value={settings.site_name}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">شركة التوصيل</label>
                <input
                  name="delivery_company_name"
                  value={settings.delivery_company_name}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الشعار (Logo)</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group">
                    <img 
                      src={settings.logo_url} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>انقر على الصورة لتغيير الشعار</p>
                    <p>يفضل استخدام صورة مربعة بحجم 512x512 بكسل</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ التغييرات</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
