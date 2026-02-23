import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
}

export function ImageUpload({ value = [], onChange, multiple = false, maxFiles = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        if (value.length + newUrls.length >= maxFiles) break;
        const file = files[i];
        const url = await uploadToCloudinary(file);
        newUrls.push(url);
      }
      onChange([...value, ...newUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('فشل رفع الصورة');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function removeImage(index: number) {
    const newUrls = [...value];
    newUrls.splice(index, 1);
    onChange(newUrls);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {value.map((url, index) => (
          <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-neutral-200 group">
            <img src={url} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        {(multiple || value.length === 0) && value.length < maxFiles && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="animate-spin text-neutral-400" size={24} />
            ) : (
              <>
                <Upload className="text-neutral-400 mb-2" size={24} />
                <span className="text-xs text-neutral-500">رفع صورة</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-neutral-400">
        الحد الأقصى: {maxFiles} صور. سيتم ضغط الصور تلقائياً لتوفير المساحة.
      </p>
    </div>
  );
}
