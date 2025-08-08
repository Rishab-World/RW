# Candidates Table Pagination - Performance Enhancement

## Overview
Added pagination to the candidates table to improve performance, especially when toggling between light and dark themes. This reduces the number of DOM elements rendered at once, making the application more responsive.

## Key Features Added

### 1. **Pagination State Management**
- **Current Page**: Tracks the current page being displayed
- **Items Per Page**: Configurable number of items (5, 10, 20, 50)
- **Auto-reset**: Automatically resets to page 1 when filters change

### 2. **Smart Pagination Logic**
- **Total Pages Calculation**: `Math.ceil(totalItems / itemsPerPage)`
- **Slice Logic**: `sortedCandidates.slice(startIndex, endIndex)`
- **Filter Integration**: Works seamlessly with existing search and filters

### 3. **Enhanced UI Components**

#### **Pagination Controls**
- **First/Previous/Next/Last** buttons for easy navigation
- **Page Numbers**: Shows up to 5 page numbers with smart positioning
- **Items Per Page Selector**: Choose between 5, 10, 20, or 50 items
- **Status Display**: Shows current page and total pages in the header

#### **Responsive Design**
- **Dark/Light Theme Support**: All pagination controls respect theme
- **Mobile Friendly**: Compact design that works on all screen sizes
- **Consistent Styling**: Matches existing UI components

### 4. **Performance Benefits**

#### **DOM Optimization**
- **Reduced Elements**: Only renders current page items instead of all candidates
- **Faster Rendering**: Significantly faster theme switching
- **Smooth Scrolling**: Better performance when scrolling through large datasets

#### **Memory Efficiency**
- **Less Memory Usage**: Fewer DOM nodes in memory
- **Better Browser Performance**: Reduced layout calculations
- **Improved Responsiveness**: Faster UI interactions

## Technical Implementation

### **State Management**
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
```

### **Pagination Logic**
```typescript
const totalItems = sortedCandidates.length;
const totalPages = Math.ceil(totalItems / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedCandidates = sortedCandidates.slice(startIndex, endIndex);
```

### **Auto-Reset on Filter Changes**
```typescript
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, filterStatus, filterPosition, filterNoticePeriod, filterDate]);
```

### **Smart Page Number Display**
- Shows up to 5 page numbers
- Automatically adjusts based on current page position
- Handles edge cases for first/last pages

## User Experience Improvements

### **1. Faster Theme Switching**
- **Before**: Slow when toggling themes with large datasets
- **After**: Instant theme switching regardless of data size

### **2. Better Navigation**
- **Page Information**: Clear indication of current page and total pages
- **Quick Navigation**: First/Last buttons for large datasets
- **Flexible Display**: Choose how many items to show per page

### **3. Consistent Performance**
- **Predictable Loading**: Same performance regardless of total data size
- **Smooth Interactions**: No lag when filtering or searching
- **Responsive UI**: Immediate feedback on all user actions

## Configuration Options

### **Items Per Page**
- **5 items**: For detailed viewing of small datasets
- **10 items**: Default, balanced performance and usability
- **20 items**: For larger datasets with good performance
- **50 items**: Maximum for very large datasets

### **Page Navigation**
- **First/Last**: Quick jump to beginning or end
- **Previous/Next**: Sequential navigation
- **Page Numbers**: Direct page selection
- **Auto-reset**: Smart reset when filters change

## Benefits Summary

### ✅ **Performance**
- Faster theme switching
- Reduced DOM elements
- Better memory usage
- Smoother scrolling

### ✅ **User Experience**
- Clear page information
- Flexible display options
- Intuitive navigation
- Consistent responsiveness

### ✅ **Scalability**
- Handles large datasets efficiently
- Maintains performance as data grows
- Predictable behavior
- Future-proof design

## Usage Instructions

### **For Users**
1. **Navigate Pages**: Use First/Previous/Next/Last buttons or click page numbers
2. **Change Items Per Page**: Use the dropdown to select 5, 10, 20, or 50 items
3. **Filter and Search**: Pagination automatically resets to page 1
4. **View Status**: Check the header for current page and total pages

### **For Developers**
- Pagination is automatically applied to filtered results
- All existing functionality remains unchanged
- Theme switching performance is significantly improved
- No breaking changes to existing code

The pagination feature significantly improves the performance of the candidates table, especially when dealing with large datasets and theme switching! 🚀
