import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../lib/cloudinary';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  placeholder?: string;
}

export default function ImageUpload({ value, onChange, onRemove, className, placeholder = "رفع صورة" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImage(file);
      onChange(url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="relative group overflow-hidden rounded-xl border border-gray-200 bg-gray-50 w-24 h-24 flex-shrink-0 flex items-center justify-center">
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="absolute top-1 right-1 p-1 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm"
                >
                  <X size={14} />
                </button>
              )}
            </>
          ) : (
            <ImageIcon className="text-gray-300" size={32} />
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="text-white animate-spin" size={24} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {placeholder}
                </>
              )}
            </button>
            
            {/* Optional: Allow manual URL entry if needed, but user asked for direct upload button. 
                We can keep it simple for now. */}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            JPG, PNG, GIF حتى 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
