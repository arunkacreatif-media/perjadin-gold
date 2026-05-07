import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDRCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp');
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  
  let date: Date;
  
  // Handle dd/MM/yyyy format (from Spreadsheet/Apps Script)
  if (dateStr.includes('/') && dateStr.split('/').length === 3) {
    const [day, month, year] = dateStr.split('/');
    date = new Date(`${year}-${month}-${day}`);
  } else {
    date = new Date(dateStr);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
