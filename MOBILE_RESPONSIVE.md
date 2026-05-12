# Mobile Responsiveness Guide

This document outlines the mobile responsiveness improvements made to the Strategize application.

## Breakpoints

We use Tailwind CSS default breakpoints:
- `sm`: 640px (Small tablets)
- `md`: 768px (Tablets)
- `lg`: 1024px (Small laptops)
- `xl`: 1280px (Desktops)
- `2xl`: 1536px (Large desktops)

## Key Changes

### 1. Layout & Spacing
- **Main container padding**: Responsive padding `p-4 sm:p-6 lg:p-8` (applied in layout.tsx)
- **Page container**: Changed from `px-2 md:px-6 py-8` to `gap-4 sm:gap-6` (removed padding, using layout padding)
- **Card padding**: `p-4 sm:p-6` using `.mobile-card` utility
- **Grid layouts**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### 2. Typography
- **Headings**: Use `.mobile-heading` utility class (`text-xl sm:text-2xl lg:text-3xl`)
- **Body text**: Use `.mobile-text` utility class (`text-sm sm:text-base`)
- **Buttons**: Minimum touch target of 44x44px on mobile

### 3. Navigation
- **Topbar**: Hides selectors on mobile, shows hamburger menu
  - Strategic Period Selector: `hidden md:block`
  - Org Unit Selector: `hidden lg:block`
  - Department Selector: `hidden lg:block`
  - Language selector: `hidden sm:block`
- **Sidebar**: Collapses to overlay on mobile
- **Breadcrumbs**: Truncates on small screens

### 4. Tables
- **Desktop**: Traditional table layout
- **Mobile**: Card-based layout with stacked rows (use ResponsiveTable component)
- **Horizontal scroll**: Enabled with `.table-container` utility class
- **Table columns**: Hide non-essential columns on mobile using `hidden md:table-cell`, `hidden lg:table-cell`, etc.

### 5. Forms & Dialogs
- **Dialog width**: `max-w-[95vw] sm:max-w-lg`
- **Input fields**: Full width on mobile
- **Button groups**: Stack vertically on mobile with `flex-col sm:flex-row`
- **Buttons**: Show icon only on mobile, text on larger screens

### 6. Components

#### Responsive Table Component
Use `ResponsiveTable` for mobile-friendly tables:

```tsx
import { ResponsiveTable, ResponsiveTableHeader, ResponsiveTableBody, ResponsiveTableRow, ResponsiveTableHead, ResponsiveTableCell } from "@/components/ui/responsive-table";

<ResponsiveTable>
  <ResponsiveTableHeader>
    <ResponsiveTableRow>
      <ResponsiveTableHead>Name</ResponsiveTableHead>
      <ResponsiveTableHead>Email</ResponsiveTableHead>
    </ResponsiveTableRow>
  </ResponsiveTableHeader>
  <ResponsiveTableBody>
    <ResponsiveTableRow>
      <ResponsiveTableCell label="Name">John Doe</ResponsiveTableCell>
      <ResponsiveTableCell label="Email">john@example.com</ResponsiveTableCell>
    </ResponsiveTableRow>
  </ResponsiveTableBody>
</ResponsiveTable>
```

### 7. Utility Classes

Custom utility classes added to `globals.css`:

- `.mobile-container`: Responsive padding (`px-4 sm:px-6 lg:px-8`)
- `.mobile-heading`: Responsive heading sizes (`text-xl sm:text-2xl lg:text-3xl`)
- `.mobile-text`: Responsive text sizes (`text-sm sm:text-base`)
- `.mobile-card`: Responsive card padding (`p-4 sm:p-6`)
- `.mobile-grid`: Responsive grid layout (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`)
- `.table-container`: Table overflow handling (`overflow-x-auto -mx-4 sm:mx-0`)

### 8. Touch Targets

All interactive elements have minimum 44x44px touch targets on mobile for better accessibility.

### 9. Overflow Prevention

- `overflow-x: hidden` on body
- Proper container constraints
- Responsive images with `max-w-full`

## Pages Updated

### ✅ Completed Pages

1. **Dashboard Home** (`/dashboard/page.tsx`)
   - Removed duplicate padding
   - Applied responsive utilities

2. **Employees** (`/dashboard/employees/page.tsx`)
   - Responsive header with `.mobile-heading`
   - Responsive filter bar and action buttons
   - Mobile-friendly empty state with responsive images
   - Results summary with truncation on mobile
   - Table with `.table-container`
   - Buttons show icon only on mobile

3. **Departments** (`/dashboard/departments/page.tsx`)
   - Responsive header and description
   - Filter bar and buttons stack on mobile
   - Mobile-friendly error states
   - Table with horizontal scroll
   - Responsive pagination

4. **Divisions** (`/dashboard/divisions/page.tsx`)
   - Responsive header
   - Filter and action buttons stack vertically on mobile
   - Results summary with truncation
   - Table with `.table-container`

5. **Teams** (`/dashboard/teams/page.tsx`)
   - Responsive search input (full width on mobile)
   - Filter dropdowns stack vertically on mobile
   - Full-width selects on mobile

6. **Positions** (`/dashboard/positions/page.tsx`)
   - Responsive search input
   - Simplified layout for mobile

7. **Admin Panel** (`/dashboard/admin/page.tsx`)
   - Responsive header with mobile-friendly filter button
   - Admin feature cards: 1 column on mobile, 2 on tablet, 4 on desktop
   - Icons and text scale appropriately
   - Permission notice with responsive padding
   - Table with `.table-container`

8. **System Logs** (`/dashboard/admin/logs/page.tsx`)
   - Responsive header with icon and title
   - Tabs show abbreviated text on mobile
   - Filter dropdowns full-width on mobile
   - Table columns hide progressively on smaller screens:
     - Always visible: Status/Action, Event Summary
     - `hidden md:table-cell`: User, Entity Type
     - `hidden lg:table-cell`: Module, Entity ID
     - `hidden xl:table-cell`: IP Address
     - `hidden sm:table-cell`: Date
   - Pagination buttons stack on mobile with full width
   - "Previous"/"Next" text hidden on mobile, icons only

9. **Layout** (`/dashboard/layout.tsx`)
   - Responsive padding: `p-4 sm:p-6 lg:p-8`

10. **Topbar** (`/components/dashboard/Topbar.tsx`)
    - Strategic Period Selector: `hidden md:block`
    - Org Unit Selector: `hidden lg:block`
    - Department Selector: `hidden lg:block`
    - Language selector: `hidden sm:block`
    - Responsive icon sizes and gaps

## Testing Checklist

- [ ] Test on iPhone (375px width)
- [ ] Test on Android phone (360px width)
- [ ] Test on iPad (768px width)
- [ ] Test on iPad Pro (1024px width)
- [ ] Test landscape orientation
- [ ] Test touch interactions
- [ ] Test form inputs with mobile keyboard
- [ ] Test table scrolling
- [ ] Test navigation menu
- [ ] Test dialogs and modals

## Best Practices

1. **Mobile-first approach**: Start with mobile styles, then add larger breakpoints
2. **Touch-friendly**: Ensure buttons and links are easy to tap (44x44px minimum)
3. **Readable text**: Minimum 16px font size for body text (use `.mobile-text`)
4. **Avoid horizontal scroll**: Use `.table-container` and proper containers
5. **Test on real devices**: Emulators don't always match real device behavior
6. **Performance**: Optimize images and lazy load content
7. **Accessibility**: Ensure proper contrast and focus states
8. **Progressive disclosure**: Hide non-essential information on mobile
9. **Truncate text**: Use `truncate` class for long text that might overflow

## Common Patterns

### Hiding elements on mobile
```tsx
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Responsive flex direction
```tsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Stacks vertically on mobile, horizontal on desktop */}
</div>
```

### Responsive grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

### Responsive text
```tsx
<h1 className="mobile-heading">Responsive Heading</h1>
<p className="mobile-text">Responsive body text</p>
```

### Responsive buttons
```tsx
<Button className="w-full sm:w-auto">
  <Icon className="w-4 h-4 sm:mr-2" />
  <span className="hidden sm:inline">Button Text</span>
  <span className="sm:hidden">Short</span>
</Button>
```

### Responsive table columns
```tsx
<TableHead className="hidden md:table-cell">Desktop Column</TableHead>
<TableCell className="hidden md:table-cell">Desktop Data</TableCell>
```

### Responsive pagination
```tsx
<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
  <p className="mobile-text text-gray-500">Showing X of Y entries</p>
  <div className="flex items-center gap-2 w-full sm:w-auto">
    <Button className="flex-1 sm:flex-none">
      <ChevronLeft className="h-4 w-4 sm:mr-1" />
      <span className="hidden sm:inline">Previous</span>
    </Button>
    <Button className="flex-1 sm:flex-none">
      <span className="hidden sm:inline">Next</span>
      <ChevronRight className="h-4 w-4 sm:ml-1" />
    </Button>
  </div>
</div>
```

## Files Modified

1. `src/app/dashboard/layout.tsx` - Main layout padding
2. `src/components/dashboard/Topbar.tsx` - Mobile navigation
3. `src/components/dashboard/Sidebar.tsx` - Mobile sidebar
4. `src/app/globals.css` - Mobile utility classes
5. `src/components/ui/responsive-table.tsx` - New responsive table component
6. `src/app/dashboard/page.tsx` - Dashboard home
7. `src/app/dashboard/employees/page.tsx` - Employees page
8. `src/app/dashboard/departments/page.tsx` - Departments page
9. `src/app/dashboard/divisions/page.tsx` - Divisions page
10. `src/app/dashboard/teams/page.tsx` - Teams page
11. `src/app/dashboard/positions/page.tsx` - Positions page
12. `src/app/dashboard/admin/page.tsx` - Admin panel
13. `src/app/dashboard/admin/logs/page.tsx` - System logs

## Future Improvements

- [ ] Add swipe gestures for navigation
- [ ] Implement pull-to-refresh
- [ ] Add bottom navigation for mobile
- [ ] Optimize bundle size for mobile
- [ ] Add progressive web app (PWA) support
- [ ] Implement offline mode
- [ ] Convert remaining pages to use ResponsiveTable component
- [ ] Add mobile-specific optimizations for images
- [ ] Implement virtual scrolling for long lists on mobile

## Notes

- All pages now use consistent responsive patterns
- Tables progressively hide columns on smaller screens
- Buttons show icons only on mobile to save space
- Filter bars and action buttons stack vertically on mobile
- Pagination controls are touch-friendly with full-width buttons on mobile
- Empty states and error messages are mobile-optimized
- All utility classes are defined in `globals.css` for consistency
