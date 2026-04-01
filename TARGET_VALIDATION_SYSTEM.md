# 🎯 Target Validation System

## Overview

The Target Validation System ensures that quarterly breakdowns at all organizational levels (Division → Department → Personnel) cannot exceed their assigned target limits. This creates a cascading validation system that maintains budget discipline throughout the organization.

## ✅ Key Features

### 1. **Real-time Validation**

- Shows validation status as users type quarterly values
- Color-coded feedback (Green ✅, Yellow ⚠️, Red ❌)
- Prevents form submission when limits are exceeded

### 2. **Cascading Target Limits**

- **Corporate → Division**: Divisions cannot exceed assigned corporate targets
- **Division → Department**: Departments cannot exceed assigned division targets
- **Department → Personnel**: Personnel cannot exceed assigned department targets

### 3. **Unit-Aware Validation**

- **Million ETB**: For financial KPIs (revenue, profit, cost)
- **Items**: For count-based KPIs (clients, projects, staff)
- **Percentage**: For rate-based KPIs (satisfaction, success rates)

### 4. **Smart Error Messages**

- Clear feedback about current vs. assigned targets
- Specific unit labels (e.g., "50 million ETB exceeds 40 million ETB")
- Guidance on how to fix validation errors

## 🔄 How It Works

### Step 1: Target Assignment

```typescript
// Corporate assigns to divisions
Corporate KPI: Total Revenue = 227 million ETB
├── Operation Division = 150 million ETB (assigned)
└── Capital Market Solutions = 77 million ETB (assigned)
```

### Step 2: Quarterly Breakdown Validation

```typescript
// Division creates quarterly breakdown
Division Target: 150 million ETB (assigned limit)
Q1: 40 + Q2: 35 + Q3: 40 + Q4: 35 = 150 ✅ Valid
Q1: 50 + Q2: 45 + Q3: 40 + Q4: 35 = 170 ❌ Exceeds limit
```

### Step 3: Cascading Validation

```typescript
// Each level validates against their assigned target
Division (150) → Department (80) → Personnel (30)
Each must validate: quarterly_sum ≤ assigned_target
```

## 🎨 UI Implementation

### Validation Status Display

```tsx
{/* Green: Perfect match */}
✅ Perfect! Quarterly sum matches assigned target

{/* Yellow: Below target */}
⚠️ Quarterly sum (120 million ETB) is below assigned target (150 million ETB)

{/* Red: Exceeds target */}
❌ Quarterly sum (170 million ETB) exceeds assigned target (150 million ETB)
```

### Input Field Styling

```tsx
// Red border when validation fails
className={validation.isValid ? "" : "border-red-300 focus:border-red-500"}
```

## 📊 Real-World Example

### Corporate Level

- **KPI**: Total Revenue
- **Target**: 227 million ETB
- **Assignment**:
  - Operation Division: 150 million ETB
  - Capital Market Solutions: 77 million ETB

### Division Level (Operation Division)

- **Assigned Target**: 150 million ETB (from corporate)
- **Quarterly Breakdown**:
  - Q1: 35 million ETB
  - Q2: 40 million ETB
  - Q3: 38 million ETB
  - Q4: 37 million ETB
  - **Sum**: 150 million ETB ✅ **Valid**

### Department Level (Learning Solutions)

- **Parent**: Operation Division (150 million ETB)
- **Assigned Target**: 80 million ETB (from division)
- **Quarterly Breakdown**:
  - Q1: 20 million ETB
  - Q2: 25 million ETB
  - Q3: 20 million ETB
  - Q4: 15 million ETB
  - **Sum**: 80 million ETB ✅ **Valid**

### Personnel Level (Senior Consultant)

- **Parent**: Learning Solutions Department (80 million ETB)
- **Assigned Target**: 30 million ETB (from department)
- **Quarterly Breakdown**:
  - Q1: 8 million ETB
  - Q2: 10 million ETB
  - Q3: 7 million ETB
  - Q4: 5 million ETB
  - **Sum**: 30 million ETB ✅ **Valid**

## 🚫 Validation Scenarios

### ❌ Invalid: Exceeds Assigned Target

```
Assigned Target: 80 million ETB
Q1: 25 + Q2: 30 + Q3: 25 + Q4: 20 = 100 million ETB
❌ Quarterly sum (100 million ETB) exceeds assigned target (80 million ETB)
```

### ⚠️ Warning: Below Target (Valid but Incomplete)

```
Assigned Target: 80 million ETB
Q1: 20 + Q2: 15 + Q3: 20 + Q4: 15 = 70 million ETB
⚠️ Quarterly sum (70 million ETB) is below assigned target (80 million ETB)
```

### ✅ Perfect: Matches Target

```
Assigned Target: 80 million ETB
Q1: 20 + Q2: 25 + Q3: 20 + Q4: 15 = 80 million ETB
✅ Perfect! Quarterly sum matches assigned target
```

## 🔧 Technical Implementation

### Key Functions

#### `getAssignedTarget(year: string): number | null`

Gets the assigned target for this KPI from its parent:

- Checks strategic targets (corporate level)
- Checks parent KPI targets (division/department level)
- Returns null if no assigned target found

#### `validateQuarterlyBreakdown(year: string)`

Validates quarterly sum against assigned target:

- Calculates current quarterly sum
- Compares with assigned target
- Returns validation status and message

#### `calculateQuarterlySum(year: string): number`

Calculates the sum of all quarterly values:

- Handles empty values as 0
- Converts strings to numbers
- Returns total sum

### Form Validation Integration

```typescript
// Enhanced validateForm() function
if (isQuarterlyMode && canEditTargets) {
  for (const [year, quarters] of Object.entries(yearlyQuarters)) {
    const validation = validateQuarterlyBreakdown(year);
    if (!validation.isValid) {
      toast.error(
        `Quarterly breakdown validation failed for ${year}: ${validation.message}`
      );
      return false;
    }
  }
}
```

## 🎯 Benefits

1. **Budget Discipline**: Ensures no level exceeds their allocated budget
2. **Real-time Feedback**: Immediate validation as users type
3. **Clear Communication**: Specific error messages with unit labels
4. **Cascading Control**: Works at all organizational levels
5. **Prevents Over-allocation**: Cannot submit invalid quarterly breakdowns
6. **Unit-Aware**: Handles different KPI types (financial, count, percentage)

## 🚀 Future Enhancements

1. **Bulk Validation**: Validate multiple KPIs at once
2. **Historical Comparison**: Compare with previous year's performance
3. **Auto-suggestion**: Suggest optimal quarterly distributions
4. **Export Validation**: Export validation reports
5. **Mobile Optimization**: Responsive validation UI

## 📝 Testing

Run the test suite to verify validation logic:

```bash
npm test -- src/utils/targetValidation.test.ts
```

The system has been tested with:

- ✅ Corporate → Division assignments
- ✅ Division → Department assignments
- ✅ Department → Personnel assignments
- ✅ Financial KPIs (million ETB)
- ✅ Count KPIs (items)
- ✅ Percentage KPIs (%)
- ✅ Edge cases (empty values, invalid numbers)
