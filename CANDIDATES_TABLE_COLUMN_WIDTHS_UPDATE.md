# Candidates Table Column Widths and Salary Formatting Update

## Changes Made

### 1. **Column Width Increases**
Added specific width classes to the following columns:

- **Current Salary**: `w-32` (128px width)
- **Expected Salary**: `w-32` (128px width)  
- **Interview Status**: `w-36` (144px width)
- **Applied Date**: `w-28` (112px width)

### 2. **Salary Formatting Enhancement**
Updated the `formatSalary` function to include rupee symbol (₹) for both current and expected salary:

```typescript
// Before
export const formatSalary = (amount: number): string => {
  if (!amount || amount === 0) return 'N/A';
  
  if (amount >= 100000) {
    const lacs = amount / 100000;
    return `${lacs.toFixed(1)} Lac`;
  } else if (amount >= 1000) {
    const k = amount / 1000;
    return `${k}K`;
  } else {
    return amount.toString();
  }
};

// After
export const formatSalary = (amount: number): string => {
  if (!amount || amount === 0) return 'N/A';
  
  if (amount >= 100000) {
    const lacs = amount / 100000;
    return `₹${lacs.toFixed(1)} Lac`;
  } else if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k}K`;
  } else {
    return `₹${amount}`;
  }
};
```

### 3. **Table Width Adjustment**
- **Before**: `min-w-[1600px]`
- **After**: `min-w-[1700px]`
- **Reason**: Increased to accommodate wider columns

## Column Width Specifications

### **Current Salary Column**
- **Width**: `w-32` (128px)
- **Purpose**: Accommodate rupee symbol + K/Lac format
- **Example**: `₹65K`, `₹2.3 Lac`

### **Expected Salary Column**
- **Width**: `w-32` (128px)
- **Purpose**: Match current salary column width
- **Format**: Same as current salary (₹ symbol + K/Lac)

### **Interview Status Column**
- **Width**: `w-36` (144px)
- **Purpose**: Accommodate longer status names
- **Examples**: "Applied", "Shortlisted", "Selected", "Rejected"

### **Applied Date Column**
- **Width**: `w-28` (112px)
- **Purpose**: Accommodate dd-mmm-yy format
- **Example**: `15-Jan-24`

## Salary Formatting Examples

### **Before (No Rupee Symbol)**
- `65000` → `65K`
- `230000` → `2.3 Lac`
- `500` → `500`

### **After (With Rupee Symbol)**
- `65000` → `₹65K`
- `230000` → `₹2.3 Lac`
- `500` → `₹500`

## Benefits

### ✅ **Better Readability**
- **Wider Columns**: More space for salary information
- **Consistent Formatting**: Both salaries use same format
- **Currency Symbol**: Clear indication of Indian Rupees

### ✅ **Professional Appearance**
- **Currency Symbol**: Professional financial display
- **Consistent Widths**: Uniform column sizing
- **Better Layout**: Improved table proportions

### ✅ **User Experience**
- **Clear Currency**: No confusion about currency type
- **Adequate Space**: No text truncation in salary columns
- **Status Visibility**: Better visibility of interview status

### ✅ **Data Consistency**
- **Unified Format**: Both current and expected salary use same format
- **Standard Currency**: Indian Rupee symbol (₹) clearly displayed
- **Scalable Format**: Works for all salary ranges

## Technical Implementation

### **Width Classes Used**
- `w-28`: 112px (Applied Date)
- `w-32`: 128px (Salary columns)
- `w-36`: 144px (Interview Status)

### **CSS Classes Applied**
```typescript
// Header cells with specific widths
<TableHead className="w-32">Current Salary</TableHead>
<TableHead className="w-32">Expected Salary</TableHead>
<TableHead className="w-36">Interview Status</TableHead>
<TableHead className="w-28">Applied Date</TableHead>
```

### **Salary Formatting Logic**
- **≥ 100,000**: Shows as `₹X.X Lac`
- **≥ 1,000**: Shows as `₹XK`
- **< 1,000**: Shows as `₹X`
- **0/null**: Shows as `N/A`

## Visual Impact

### **Before**
- Narrow salary columns causing text overflow
- No currency symbol causing confusion
- Inconsistent column widths

### **After**
- Adequate space for all salary formats
- Clear rupee symbol for Indian currency
- Professional, consistent table layout
- Better readability and user experience

## Compatibility

### ✅ **Backward Compatibility**
- **Data Structure**: No changes to underlying data
- **Import/Export**: All functionality remains intact
- **Filtering**: All existing filters continue to work
- **Pagination**: Pagination logic unchanged

### ✅ **Future-Proof**
- **Scalable Widths**: Easy to adjust if needed
- **Flexible Formatting**: Can accommodate different currency formats
- **Maintainable Code**: Clean, organized structure

The table now has better column widths and professional salary formatting with the Indian Rupee symbol! 🎯
