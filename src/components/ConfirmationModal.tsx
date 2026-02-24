import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

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

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  isDangerous = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-black'}`}>
            <AlertTriangle size={24} />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif">{title}</h3>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all transform hover:scale-105 ${
              isDangerous 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-black hover:bg-gray-800 shadow-gray-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
