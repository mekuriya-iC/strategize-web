# Reports Section - Custom Error Pages

This directory contains custom error handling pages for the Reports section of the dashboard.

## 📁 Files Overview

### 1. `error.tsx` - Error Boundary Page
**Purpose:** Catches and handles runtime errors within the reports section.

**Features:**
- ✅ Automatic error logging via the logger service
- ✅ Beautiful gradient header with error icon
- ✅ User-friendly error description
- ✅ Development-mode technical details (expandable)
- ✅ Helpful suggestions for users
- ✅ Multiple recovery options (Try Again, Reload, Go Back, Dashboard)
- ✅ Error digest display for support reference
- ✅ Responsive design for all screen sizes

**When it's triggered:**
- Runtime JavaScript errors in the reports route
- Unhandled promise rejections
- Component rendering errors
- Data fetching failures

**Testing:**
```typescript
// Navigate to /dashboard/reports and click "Trigger Error" button
// Or throw an error in any component within this route
```

---

### 2. `not-found.tsx` - 404 Not Found Page
**Purpose:** Handles cases where a report or resource is not found.

**Features:**
- ✅ Large 404 display with gradient styling
- ✅ Clear explanation of what happened
- ✅ Possible reasons for the 404 error
- ✅ Visual suggestion cards with icons
- ✅ Navigation options (View All Reports, Go Back, Dashboard)
- ✅ Support contact link
- ✅ Responsive design

**When it's triggered:**
- Accessing a non-existent report URL
- Deleted or archived reports
- Invalid report IDs
- Permission-restricted reports

**Testing:**
```typescript
// Navigate to /dashboard/reports/non-existent-report
// Or click "Test 404" button on the reports page
```

---

### 3. `loading.tsx` - Loading State
**Purpose:** Provides visual feedback while reports data is being fetched.

**Features:**
- ✅ Animated spinner with brand color (#3838EC)
- ✅ Loading text and progress dots
- ✅ Skeleton UI for content preview
- ✅ Smooth animations
- ✅ Responsive design

**When it's triggered:**
- Automatically shown during server-side data fetching
- Route transitions within the reports section
- Suspense boundaries

**Testing:**
```typescript
// Automatically shown when navigating to /dashboard/reports
// with slow network or during data fetching
```

---

### 4. `page.tsx` - Main Reports Page
**Purpose:** Main landing page for the reports section.

**Features:**
- ✅ Stats cards with metrics
- ✅ Coming soon placeholder
- ✅ Error page testing section
- ✅ Buttons to trigger error and 404 pages
- ✅ Responsive layout

---

## 🎨 Design System

All error pages follow the project's design system:

- **Primary Color:** `#3838EC` (brand blue)
- **Hover Color:** `#2e2ed6` (darker blue)
- **Error Color:** Red gradient (`from-red-500 to-orange-500`)
- **404 Color:** Blue gradient (`from-blue-500 to-indigo-600`)
- **Typography:** Tailwind default font stack
- **Icons:** Lucide React icons
- **Components:** shadcn/ui Button component

---

## 🔧 Technical Details

### Error Logging
All errors are automatically logged using the project's logger service:

```typescript
logger.error("Reports page error:", {
  message: error.message,
  digest: error.digest,
  stack: error.stack,
  timestamp: new Date().toISOString(),
});
```

### Next.js App Router Conventions
These files follow Next.js 13+ App Router conventions:

- **`error.tsx`**: Error boundary for the route segment
- **`not-found.tsx`**: 404 handler for the route segment
- **`loading.tsx`**: Loading UI for the route segment
- **`page.tsx`**: Main page component

### Props Interface

**error.tsx** receives:
```typescript
interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}
```

---

## 🚀 Usage Examples

### Programmatically Trigger Not Found
```typescript
import { notFound } from 'next/navigation';

// In a server component or action
if (!report) {
  notFound(); // Triggers not-found.tsx
}
```

### Error Boundary Behavior
```typescript
// Any error thrown in child components will be caught
throw new Error("Failed to load report data");
// This will trigger error.tsx
```

### Loading State
```typescript
// Wrap async components with Suspense
<Suspense fallback={<ReportsLoading />}>
  <AsyncReportComponent />
</Suspense>
```

---

## 📱 Responsive Design

All pages are fully responsive:

- **Mobile (< 640px):** Single column layout, stacked buttons
- **Tablet (640px - 1024px):** Optimized spacing and typography
- **Desktop (> 1024px):** Full layout with optimal spacing

---

## 🎯 User Experience Features

### Error Recovery Options
1. **Try Again** - Resets the error boundary (via `reset()` prop)
2. **Reload Page** - Full page reload (`window.location.reload()`)
3. **Go Back** - Browser back navigation (`window.history.back()`)
4. **Dashboard** - Navigate to main dashboard

### Development vs Production
- **Development:** Shows full error details, stack traces, and error digest
- **Production:** Shows user-friendly messages only, logs errors to service

---

## 🔗 Integration with Error Tracking

Ready for integration with error tracking services:

```typescript
// Uncomment in error.tsx to enable Sentry
if (process.env.NODE_ENV === 'production') {
  Sentry.captureException(error, {
    tags: { section: 'reports' },
    extra: { digest: error.digest }
  });
}
```

---

## 📊 Accessibility

All error pages include:
- ✅ Semantic HTML structure
- ✅ ARIA labels where appropriate
- ✅ Keyboard navigation support
- ✅ Sufficient color contrast
- ✅ Focus indicators on interactive elements

---

## 🧪 Testing Checklist

- [ ] Error page displays correctly on error
- [ ] Not found page displays for invalid URLs
- [ ] Loading state shows during data fetching
- [ ] All buttons work correctly
- [ ] Responsive design works on all screen sizes
- [ ] Error logging is working
- [ ] Development mode shows technical details
- [ ] Production mode hides sensitive information

---

## 🔄 Future Enhancements

Potential improvements:
- [ ] Add error tracking service integration (Sentry, LogRocket)
- [ ] Implement error analytics
- [ ] Add retry with exponential backoff
- [ ] Create specific error types (NetworkError, AuthError, etc.)
- [ ] Add error recovery suggestions based on error type
- [ ] Implement error rate limiting
- [ ] Add user feedback mechanism

---

## 📝 Notes

- Error pages are automatically used by Next.js when errors occur
- No manual routing or error handling needed in parent components
- Error boundaries only catch errors in child components
- Server errors are handled differently than client errors
- Always test error pages in both development and production builds

---

## 🤝 Contributing

When modifying error pages:
1. Maintain consistent design with the rest of the application
2. Ensure all error information is logged appropriately
3. Test in both development and production modes
4. Update this README with any new features or changes
5. Ensure accessibility standards are maintained

---

**Last Updated:** December 18, 2025
**Maintained By:** Development Team
