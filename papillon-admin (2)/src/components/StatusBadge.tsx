import React from 'react';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    shipped: "bg-purple-100 text-purple-800 border-purple-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const labels: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "تم التأكيد",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize", styles[status] || "bg-gray-100 text-gray-800")}>
      {labels[status] || status}
    </span>
  );
}
