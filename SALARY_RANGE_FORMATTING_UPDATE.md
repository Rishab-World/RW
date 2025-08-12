# Salary Range Formatting Update

## Issue Identified

**Problem**: Expected salary fields containing ranges like "20000 to 30000" were not being formatted properly with the rupee symbol and K/Lac format.

**Example**: 
- **Input**: "20000 to 30000"
- **Before**: "20000 to 30000" (no formatting)
- **After**: "₹20K to ₹30K" (properly formatted)

## Solution Implemented

### 1. **New `formatSalaryRange` Function**
Created a specialized function to handle salary ranges and various text formats:

```typescript
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
```

### 2. **Updated Expected Salary Display**
Modified the table to use the new range formatting function:

```typescript
// Before
{formatSalary(candidate.expected_salary || candidate.expectedSalary) || 'N/A'}

// After
{formatSalaryRange(candidate.expected_salary || candidate.expectedSalary) || 'N/A'}
```

## Supported Range Formats

### **Range Separators**
- **"to"**: "20000 to 30000" → "₹20K to ₹30K"
- **"-"**: "20000-30000" → "₹20K to ₹30K"
- **"~"**: "20000~30000" → "₹20K to ₹30K"
- **"and"**: "20000 and 30000" → "₹20K to ₹30K"
- **"&"**: "20000 & 30000" → "₹20K to ₹30K"

### **Number Formats**
- **Thousands**: "20000 to 30000" → "₹20K to ₹30K"
- **Lakhs**: "200000 to 300000" → "₹2.0 Lac to ₹3.0 Lac"
- **Mixed**: "50000 to 200000" → "₹50K to ₹2.0 Lac"

## Examples

### **Range Examples**
| Input | Output |
|-------|--------|
| "20000 to 30000" | "₹20K to ₹30K" |
| "50000-75000" | "₹50K to ₹75K" |
| "200000 to 300000" | "₹2.0 Lac to ₹3.0 Lac" |
| "15000 and 25000" | "₹15K to ₹25K" |
| "100000 & 150000" | "₹1.0 Lac to ₹1.5 Lac" |

### **Single Number Examples**
| Input | Output |
|-------|--------|
| "65000" | "₹65K" |
| "230000" | "₹2.3 Lac" |
| "500" | "₹500" |

### **Fallback Examples**
| Input | Output |
|-------|--------|
| "Negotiable" | "Negotiable" |
| "As per market" | "As per market" |
| "Open to discussion" | "Open to discussion" |

## Benefits

### ✅ **Smart Range Detection**
- **Multiple Formats**: Handles various range separators
- **Flexible Parsing**: Works with different text formats
- **Fallback Support**: Preserves non-numeric text

### ✅ **Consistent Formatting**
- **Unified Display**: All salary ranges show consistently
- **Currency Symbol**: Clear Indian Rupee indication
- **K/Lac Format**: Professional salary display

### ✅ **User Experience**
- **Readable Ranges**: Clear salary range display
- **Professional Appearance**: Consistent with current salary format
- **No Data Loss**: Preserves original information

### ✅ **Robust Handling**
- **Error Prevention**: Graceful handling of invalid formats
- **Text Preservation**: Non-numeric text remains unchanged
- **Single Numbers**: Handles both ranges and single values

## Technical Features

### **Pattern Matching**
- **Regex Patterns**: Multiple patterns for different range formats
- **Case Insensitive**: Works with any text case
- **Whitespace Tolerant**: Handles various spacing formats

### **Number Processing**
- **Integer Parsing**: Extracts numbers from text
- **Format Conversion**: Converts to K/Lac format
- **Symbol Addition**: Adds rupee symbol appropriately

### **Fallback Logic**
- **Single Number**: Tries to parse as single number if not a range
- **Original Text**: Returns original text if no pattern matches
- **Error Handling**: Returns 'N/A' for invalid inputs

## Implementation Details

### **Function Flow**
1. **Input Validation**: Check if input is valid string
2. **Pattern Matching**: Try various range patterns
3. **Number Extraction**: Parse numbers from matched patterns
4. **Format Conversion**: Convert to K/Lac format
5. **Symbol Addition**: Add rupee symbols
6. **Fallback**: Try single number parsing
7. **Return**: Return formatted result or original text

### **Error Handling**
- **Null/Undefined**: Returns 'N/A'
- **Invalid Numbers**: Preserves original text
- **No Match**: Returns original input
- **Parse Errors**: Graceful fallback

The expected salary column now properly handles salary ranges with professional formatting! 🎯



