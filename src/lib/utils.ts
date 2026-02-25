import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | string): string {
  if (num === null || num === undefined) return '';
  
  // If it's a number, format it with English locale to ensure Western digits
  if (typeof num === 'number') {
    return num.toLocaleString('en-US');
  }

  // If it's a string, replace Eastern Arabic digits with Western
  const str = num.toString();
  return str.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
}
