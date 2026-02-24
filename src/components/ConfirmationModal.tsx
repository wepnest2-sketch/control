import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'حذف',
  cancelText = 'إلغاء',
  isDangerous = true,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl transform transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("flex items-center gap-3", isDangerous ? "text-red-600" : "text-black")}>
            <div className={cn("p-2 rounded-full", isDangerous ? "bg-red-50" : "bg-neutral-100")}>
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-neutral-600 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-neutral-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
