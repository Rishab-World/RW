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
    // Round to whole number and remove decimal if it's a whole number
    const roundedLacs = Math.round(lacs);
    return `₹${roundedLacs} Lac`;
  } else if (amount >= 1000) {
    // Convert to K
    const k = amount / 1000;
    // Round to whole number and remove decimal if it's a whole number
    const roundedK = Math.round(k);
    return `₹${roundedK}K`;
  } else {
    return `₹${amount}`;
  }
};

// Function to format salary ranges (e.g., "20000 to 30000" -> "₹20K to ₹30K")
export const formatSalaryRange = (salaryText: string): string => {
  if (!salaryText || typeof salaryText !== 'string') return 'N/A';
  
  // Convert to lowercase for easier matching
  const text = salaryText.toLowerCase().trim();
  
  // Handle various range formats
  const rangePatterns = [
    /(\d+)\s*(?:to|-|~)\s*(\d+)/, // "20000 to 30000", "20000-30000", "20000~30000"
    /(\d+)\s*(?:and|&)\s*(\d+)/,  // "20000 and 30000", "20000 & 30000"
    /(\d+)\s*-\s*(\d+)/,          // "20000 - 30000"
  ];
  
  for (const pattern of rangePatterns) {
    const match = text.match(pattern);
    if (match) {
      const num1 = parseInt(match[1]);
      const num2 = parseInt(match[2]);
      
      if (!isNaN(num1) && !isNaN(num2)) {
        const formatted1 = formatSalary(num1);
        const formatted2 = formatSalary(num2);
        
        // Extract just the number part (remove ₹ symbol from first one)
        const num1Formatted = formatted1.replace('₹', '');
        const num2Formatted = formatted2.replace('₹', '');
        
        return `₹${num1Formatted} to ₹${num2Formatted}`;
      }
    }
  }
  
  // If it's not a range, try to parse as a single number
  const singleNumber = parseInt(text.replace(/[^\d]/g, ''));
  if (!isNaN(singleNumber)) {
    return formatSalary(singleNumber);
  }
  
  // If no pattern matches, return the original text
  return salaryText;
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
