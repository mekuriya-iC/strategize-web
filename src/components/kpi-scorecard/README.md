# KPI Scorecard Frontend Components

## Overview

This directory contains the frontend React components for the KPI Scorecard system. These components provide visualization and management interfaces for tracking KPI performance across organizational levels.

## Components

### 🎯 KpiScorecardDashboard.tsx

**Main entry point** for the KPI Scorecard feature.

- **Purpose**: Unified dashboard with tab-based navigation
- **Features**:
  - Tab navigation (Individual/Department/Division)
  - Calculate Scores button (admin only)
  - Active period indicator
  - Permission-based tab access
  - Help section with system explanation
  - Toast notifications

- **Permissions**:
  - All users: Can view Individual tab
  - HR/Admin: Can view all tabs and trigger calculations

- **Usage**:
```tsx
import { KpiScorecardDashboard } from '@/components/kpi-scorecard';

export default function KpiPage() {
  return <KpiScorecardDashboard />;
}
```

---

### 👤 IndividualScorecard.tsx

**Individual employee** KPI scorecard view.

- **Purpose**: Display employee's personal KPI performance
- **Features**:
  - Employee selector (HR/Admin only)
  - Period selector
  - Summary cards (Total Score, Achievement Rate, Active KPIs)
  - Detailed KPI table with progress bars
  - Formula explanation
  - Achievement badges and color coding

- **Data Source**: 
  - Query: `GET_TOTAL_SCORECARD_SCORE`
  - Level: `INDIVIDUAL`
  - Entity: Employee ID

- **Permissions**:
  - Regular employees: See only their own scorecard
  - HR/Admin: Can view any employee's scorecard

---

### 🏢 DepartmentScorecard.tsx

**Department-level** KPI scorecard view.

- **Purpose**: Display aggregated department performance
- **Features**:
  - Department selector
  - Period selector
  - Summary cards
  - Aggregated actuals from individuals
  - Department-specific targets and scores
  - Formula explanation with cascade logic

- **Data Source**:
  - Query: `GET_TOTAL_SCORECARD_SCORE`
  - Level: `DEPARTMENT`
  - Entity: Department ID

- **Permissions**:
  - HR/Admin only

- **Key Logic**:
  - Displays aggregated actuals from mapped individual KPIs
  - Uses department-specific targets (NOT individual targets)
  - Shows "(from individuals)" indicator

---

### 🏛️ DivisionScorecard.tsx

**Division-level** KPI scorecard view.

- **Purpose**: Display aggregated division performance (executive view)
- **Features**:
  - Division selector
  - Period selector
  - Summary cards
  - Aggregated actuals from departments
  - Division-specific targets and scores
  - Executive summary formatting

- **Data Source**:
  - Query: `GET_TOTAL_SCORECARD_SCORE`
  - Level: `DIVISION`
  - Entity: Division ID

- **Permissions**:
  - HR/Admin only

- **Key Logic**:
  - Displays aggregated actuals from mapped department KPIs
  - Uses division-specific targets (NOT department targets)
  - Shows "(from departments)" indicator

---

### 🔗 CascadeMappingManager.tsx

**Cascade mapping management** interface (Admin only).

- **Purpose**: CRUD interface for managing cascade mappings
- **Features**:
  - View all mappings for selected period
  - Create new cascade mapping with validation
  - Delete existing mappings
  - Visual source → target representation
  - Cascade direction validation
  - Entity-aware dropdowns
  - Active/Inactive status indicators
  - Help section explaining cascade flow

- **Data Source**:
  - Query: `GET_CASCADE_MAPPINGS_BY_PERIOD`
  - Mutations: `CREATE_CASCADE_MAPPING`, `DELETE_CASCADE_MAPPING`

- **Permissions**:
  - `kpis:write` required

- **Key Features**:
  - Two-column form (Source | Target)
  - Automatic entity filtering based on level
  - Validation: Source level must be lower than target
  - Confirmation dialog for deletion
  - Toast notifications for success/error

- **Valid Cascade Patterns**:
  - Individual → Department
  - Individual → Division
  - Department → Division
  - Division → Corporate

---

## GraphQL Queries & Mutations

### Queries

```typescript
GET_TOTAL_SCORECARD_SCORE(level, entityId, periodId)
// Returns: totalScore, maxPossibleScore, percentageAchieved, kpiScores[]

GET_KPI_SCORES_BY_ENTITY(level, entityId, periodId)
// Returns: Individual KPI scores with details

GET_CASCADE_MAPPINGS_BY_PERIOD(periodId)
// Returns: All cascade mappings for a period (for management UI)
```

### Mutations

```typescript
CALCULATE_KPI_SCORES(periodId)
// Triggers backend calculation for all levels

CREATE_CASCADE_MAPPING(input)
// Creates new cascade mapping

DELETE_CASCADE_MAPPING(mappingId)
// Removes cascade mapping
```

---

## Data Flow

```
┌─────────────────────────────────────────────────┐
│  User Action: View Scorecard                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Component: Select level, entity, period       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  GraphQL Query: GET_TOTAL_SCORECARD_SCORE      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend: Fetch from AggregatedKpiScore table  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Component: Render scorecard with data         │
└─────────────────────────────────────────────────┘
```

---

## Calculation Trigger Flow

```
┌─────────────────────────────────────────────────┐
│  Admin Action: Click "Calculate Scores"        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  GraphQL Mutation: CALCULATE_KPI_SCORES        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend Service: KpiScorecardAggregationService│
│  1. Calculate individual scores from logbook   │
│  2. Aggregate to departments                   │
│  3. Aggregate to divisions                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Database: Save to AggregatedKpiScore table    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Frontend: Show success toast, refresh view    │
└─────────────────────────────────────────────────┘
```

---

## Styling & UI Components

### Used Components

- **Card**: `@/components/ui/card`
- **Select**: `@/components/ui/select`
- **Progress**: `@/components/ui/progress`
- **Badge**: `@/components/ui/badge`
- **Button**: `@/components/ui/button`
- **Tabs**: `@/components/ui/tabs`

### Color Scheme

- **Green**: ≥100% achievement (meets/exceeds expectations)
- **Blue**: 75-99% achievement (on track)
- **Yellow**: 60-74% achievement (needs improvement)
- **Red**: <60% achievement (below expectations)

### Icons (Lucide React)

- `TrendingUp`: KPIs, progress
- `Award`: Total score
- `Target`: Achievement rate
- `Calculator`: Calculate action
- `RefreshCw`: Loading state
- `AlertCircle`: No data / errors
- `Building2`: Department
- `Network`: Division

---

## Key Formulas

### Score Calculation

```typescript
Score = Weight × min(Actual / Target, Cap)
```

- **Actual**: Sum of approved logbook achievements (or aggregated from lower level)
- **Target**: Level-specific target value
- **Weight**: Percentage contribution to total score
- **Cap**: Maximum achievement rate (e.g., 1.5 = 150%)

### Achievement Rate

```typescript
Achievement Rate = Actual / Target
```

### Percentage Achieved

```typescript
Percentage Achieved = (Total Score / Max Possible Score) × 100
```

---

## Permission System

### Permission Keys

- `kpis:write`: Can trigger score calculations and manage KPIs
- `evaluations:read_all`: Can view all employee/department/division scorecards

### Access Matrix

| Role | Individual (Own) | Individual (Others) | Department | Division | Calculate |
|------|------------------|---------------------|------------|----------|-----------|
| Employee | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manager | ✅ | ❌ | ❌ | ❌ | ❌ |
| HR/Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Error Handling

### No Data States

Components gracefully handle:
- No scorecard data (shows helpful message)
- No active period (disables calculate button)
- Loading states (shows spinner)
- Permission denied (shows access message)

### Error Messages

- "No KPI scorecard data found for this period"
- "Make sure KPIs are assigned and scores have been calculated"
- "You don't have permission to view department scorecards"
- "No Active Period - Please activate a strategic period first"

---

## Testing Checklist

### Individual Scorecard

- [ ] Employee sees only their own scorecard
- [ ] HR/Admin can select any employee
- [ ] Shows correct total score and achievement rate
- [ ] KPI table displays all assigned KPIs
- [ ] Progress bars reflect achievement accurately
- [ ] No data state shows when no scores exist
- [ ] Formula explanation is clear

### Department Scorecard

- [ ] HR/Admin can select any department
- [ ] Aggregated actuals sum correctly from individuals
- [ ] Department targets are used (not individual targets)
- [ ] Scores calculated with department weights
- [ ] Permission check works (blocks regular employees)
- [ ] "(from individuals)" indicator shows

### Division Scorecard

- [ ] HR/Admin can select any division
- [ ] Aggregated actuals sum correctly from departments
- [ ] Division targets are used (not department targets)
- [ ] Scores calculated with division weights
- [ ] Executive summary formatting
- [ ] "(from departments)" indicator shows

### Dashboard

- [ ] Tabs switch correctly
- [ ] Calculate button works (admin only)
- [ ] Toast notifications display
- [ ] Active period banner shows
- [ ] Help section is informative
- [ ] Permission-based tab disabling works

---

## Future Enhancements

### Planned Features

- [ ] Drill-down capability (click department → see individuals)
- [ ] Historical trend charts
- [ ] Comparison view (compare departments/divisions)
- [ ] Export to PDF/Excel
- [ ] Cascade mapping management UI
- [ ] What-if scenario calculator
- [ ] Real-time score updates (WebSocket)
- [ ] Mobile-responsive improvements

### Potential Improvements

- [ ] Caching strategy for faster loads
- [ ] Skeleton loaders instead of spinners
- [ ] Infinite scroll for large KPI lists
- [ ] Search/filter KPIs
- [ ] Customizable dashboard layouts
- [ ] Dark mode support

---

## Related Documentation

### Backend

- `KPI-SCORECARD-IMPLEMENTATION.md` - Full technical implementation
- `TEST-SCENARIO.md` - Step-by-step test scenarios
- `KPI-QUICK-REFERENCE.md` - Quick formula reference

### Frontend

- `src/lib/graphql/queries/kpi-scorecard.ts` - GraphQL queries
- `src/lib/graphql/mutations/kpi-scorecard.ts` - GraphQL mutations

### User Guides

- `KPI-SCORECARD-USER-GUIDE.md` - End-user documentation

---

## Development Notes

### Adding New Scorecard Levels

To add a new level (e.g., Corporate):

1. Update `ScorecardLevel` enum in backend
2. Add calculation logic to `KpiScorecardAggregationService`
3. Create `CorporateScorecard.tsx` component (copy DivisionScorecard as template)
4. Add tab to `KpiScorecardDashboard.tsx`
5. Update permissions if needed

### Modifying Score Display

To change how scores are displayed:

1. Update `formatNumber()` or `formatPercentage()` functions
2. Adjust color thresholds in `getAchievementColor()`
3. Modify badge logic in `getAchievementBadge()`
4. Update CSS classes for styling

### Performance Optimization

- Use `fetchPolicy: "network-only"` for fresh data
- Consider adding Apollo cache policies
- Implement pagination for large KPI lists
- Add debouncing to period/entity selectors

---

## Support

For questions or issues:
- **Technical**: Refer to backend implementation docs
- **UI/UX**: Contact frontend team
- **Business Logic**: See user guide and quick reference

---

**Last Updated**: June 8, 2026  
**Version**: 1.0  
**Status**: Production Ready (Core Features)
