# Check-In/Out Feature

## Overview
The Check-In/Out feature (also called "Logbook") allows all users to track their daily tasks, activities, and work progress. Users can create check-in entries with detailed information about their work, link them to objectives/KPIs, and track completion status.

## Features

### 1. Task Management
- **Create Tasks**: Users can add new check-in/out tasks with comprehensive details
- **Task Types**:
  - KPI Fulfilled
  - Initiative Unmet
  - Unlinked
- **Task Details**:
  - Task title and description
  - Related person/objective
  - Start and end time
  - File attachments (optional)
  - Remarks (optional)

### 2. Status Tracking
- **Checkout Status**:
  - Not Done
  - Postponed
  - Cancelled
- **Progress Indicators**:
  - KPI Met/Unmet
  - Initiative Met/Unmet
  - Self Development Complete/Incomplete

### 3. User Interface
- **Empty State**: Friendly illustration when no tasks exist
- **Task List**: Grouped by date with visual status indicators
- **Add Task Dialog**: Comprehensive form with all task details
- **Responsive Design**: Works on mobile, tablet, and desktop

## Design System

### Colors
- **Primary**: `#3838EC` (Brand Blue)
- **Primary Hover**: `#2d2dbd`
- **Background**: White / Dark mode compatible
- **Status Colors**:
  - Red: Not Done
  - Yellow: Postponed
  - Gray: Cancelled
  - Green: KPI Met
  - Blue: Initiative Met
  - Purple: Self Dev Complete

### Typography
- **Font Family**: Manrope (from globals.css)
- **Headings**: Font-semibold
- **Body**: Font-medium

### Components
- Uses shadcn/ui components for consistency
- Custom styling with Tailwind CSS
- Follows project's design patterns

## Permissions

### All Users (NORMAL role and above)
- `checkins:read_own` - View own check-ins
- `checkins:create` - Create check-ins
- `checkins:update_own` - Update own check-ins
- `checkins:delete_own` - Delete own check-ins
- `nav:checkin` - Access check-in/out page

### Coordinators and Above
- `checkins:read_department` - View department check-ins

### Admins
- `checkins:read_all` - View all check-ins
- `checkins:update_all` - Update any check-in
- `checkins:delete_all` - Delete any check-in

## File Structure

```
src/
├── app/dashboard/checkin/
│   ├── page.tsx              # Main check-in page
│   ├── error.tsx             # Error boundary
│   └── README.md             # This file
├── components/checkin/
│   ├── AddTaskDialog.tsx     # Dialog for adding tasks
│   ├── CheckInList.tsx       # List of check-in items
│   ├── CheckInItem.tsx       # Individual check-in card
│   └── index.ts              # Exports
└── lib/graphql/
    ├── queries/checkins.ts   # GraphQL queries
    └── mutations/checkins.ts # GraphQL mutations
```

## GraphQL Schema

### Queries
- `myCheckins` - Get current user's check-ins
- `checkin(id)` - Get specific check-in by ID
- `checkins(filters)` - Get all check-ins with filters (admin)

### Mutations
- `createCheckin(input)` - Create new check-in
- `updateCheckin(id, input)` - Update existing check-in
- `deleteCheckin(id)` - Delete check-in

### Input Type
```graphql
input CreateCheckinInput {
  taskType: String!
  task: String!
  description: String
  relatedTo: String
  startTime: DateTime!
  endTime: DateTime!
  checkoutStatus: String!
  attachment: String
  remark: String
  isKpiMet: Boolean!
  isInitiativeMet: Boolean!
  isSelfDevComplete: Boolean!
}
```

## Usage

### For Users
1. Navigate to "Check-In/Out" from the sidebar
2. Click "Add a Task" button
3. Fill in task details:
   - Select task type
   - Enter task title and description
   - Set start and end times
   - Optionally attach files
   - Set status indicators
4. Click "Add Task" to save

### For Developers
```typescript
// Import components
import { AddTaskDialog, CheckInList } from '@/components/checkin';

// Use in your component
<AddTaskDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={handleSuccess}
/>
```

## Responsive Behavior
- **Mobile**: Single column layout, full-width dialogs
- **Tablet**: Optimized spacing and touch targets
- **Desktop**: Multi-column form layout in dialog

## Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management in dialogs

## Future Enhancements
- [ ] Export check-ins to PDF/Excel
- [ ] Calendar view of check-ins
- [ ] Team check-in dashboard (for managers)
- [ ] Check-in reminders/notifications
- [ ] Analytics and insights
- [ ] Bulk operations
- [ ] Advanced filtering and search
