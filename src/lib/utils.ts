import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// New function to format salary in K/Lac format with rupee symbol
export const formatSalary = (amount: number): string => {
  if (!amount || amount === 0) return 'N/A';
  
  if (amount >= 100000) {
    // Convert to Lacs
    const lacs = amount / 100000;
    return `₹${lacs.toFixed(1)} Lac`;
  } else if (amount >= 1000) {
    // Convert to K
    const k = amount / 1000;
    return `₹${k}K`;
  } else {
    return `₹${amount}`;
  }
};

// Utility function to format dates in dd-mmm-yy format
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('default', { month: 'short' });
  const year = d.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
}

// Utility function to format timestamps in dd-mmm-yy h:mm AM/PM format
export function formatTimestamp(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('default', { month: 'short' });
  const year = d.getFullYear().toString().slice(-2);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${day}-${month}-${year} ${displayHours}:${minutes} ${ampm}`;
}
