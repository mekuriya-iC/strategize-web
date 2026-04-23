# Logbook Feature

## Overview
The Logbook feature automatically collects KPI fulfilled tasks from check-ins and allows users to submit them for approval.

## Features

### Automatic Collection
- When a user marks a KPI as "fulfilled" in check-in, it automatically appears in the logbook
- Tracks KPI name, target, completion percentage, and weight
- Maintains approval status for each entry

### Approval Workflow
1. User completes KPI tasks in check-in
2. Fulfilled KPIs automatically added to logbook
3. User reviews logbook entries
4. User submits entries for approval
5. Manager/Director approves or rejects
6. Approved entries marked as complete

### Table View
- **Desktop**: Full table with all columns
- **Mobile/Tablet**: Card layout with expandable details
- Columns:
  - KPI Name
  - Target
  - Percentage Completion
  - Weight
  - Approval Status
  - Actions

### Approval Status
- **PENDING**: Waiting to be submitted
- **IN_REVIEW**: Submitted, awaiting approval
- **APPROVED**: Approved by manager
- **REJECTED**: Rejected, needs revision

### Actions
- **Submit for Approval**: Send entry to manager
- **View Details**: See full entry information
- **Delete**: Remove entry (only if pending)

## Permissions

### User Permissions
- `logbook:read_own` - View own logbook
- `logbook:submit` - Submit for approval
- `logbook:delete_own` - Delete own entries

### Manager Permissions
- `logbook:read_department` - View department logbook
- `logbook:approve` - Approve submissions

### Admin Permissions
- `logbook:read_all` - View all logbooks
- `logbook:delete_all` - Delete any entry

## Components

### LogbookTable
Main table component with responsive design

### LogbookTableRow
Desktop table row with expand/collapse

### LogbookTableCard
Mobile card view with expandable details

### SubmitApprovalDialog
Dialog for submitting entries for approval

## GraphQL

### Queries
- `GET_MY_LOGBOOK` - Get user's logbook entries
- `GET_LOGBOOK_ITEM` - Get single entry details

### Mutations
- `SUBMIT_FOR_APPROVAL` - Submit entry for approval
- `DELETE_LOGBOOK_ITEM` - Delete entry

## Usage

```typescript
// Access logbook page
/dashboard/logbook

// Submit for approval
const handleSubmit = () => {
  submitForApproval({ variables: { id: itemId } });
};
```

## Design
- Primary color: #3838EC
- Font: Manrope
- Responsive breakpoints: lg (1024px)
- Status colors:
  - Pending: Yellow
  - In Review: Blue
  - Approved: Green
  - Rejected: Red
