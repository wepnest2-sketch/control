import React from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';

export function SupabaseConfigWarning() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 m-4 rounded shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">Supabase Configuration Missing</h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              To use this application, you must configure your Supabase project.
              Please add your <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to the <code>.env</code> file.
            </p>
            <p className="mt-2">
              You can find these in your Supabase project settings under API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
