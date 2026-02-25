import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | string): string {
  if (num === null || num === undefined) return '';
  
  // Convert to string first to handle both numbers and strings consistently
  const str = num.toString();
  
  // Replace Eastern Arabic digits with Western digits
  const westernDigits = str.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  
  // Parse as number and format with English locale
  const parsedNum = Number(westernDigits);
  
  if (isNaN(parsedNum)) return westernDigits;
  
  return parsedNum.toLocaleString('en-US');
}
