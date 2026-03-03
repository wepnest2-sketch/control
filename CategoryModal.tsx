import { Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-bold text-gray-900">الإعدادات</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* General Settings */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-serif text-xl font-bold text-gray-900">إعدادات المتجر</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">اسم المتجر</label>
              <input
                type="text"
                defaultValue="بابيون"
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">الوصف</label>
              <textarea
                rows={3}
                defaultValue="متجر إلكتروني للملابس الفاخرة"
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">العملة</label>
              <select className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm">
                <option>الدينار الجزائري (DZD)</option>
                <option>الدولار الأمريكي (USD)</option>
              </select>
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              <Save className="h-4 w-4" />
              حفظ التغييرات
            </button>
          </form>
        </div>

        {/* Account Settings */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-serif text-xl font-bold text-gray-900">إعدادات الحساب</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
              <input
                type="email"
                defaultValue="admin@papillon.dz"
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">كلمة المرور الحالية</label>
              <input
                type="password"
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
              <input
                type="password"
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              />
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              <Save className="h-4 w-4" />
              تحديث الحساب
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
