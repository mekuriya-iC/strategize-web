# Role-Based Routing Implementation

## Overview
Implemented role-based routing after login to provide different user experiences based on user roles.

## User Roles
Based on `src/types/graphql.ts`:
- **NORMAL** - Regular Employee
- **COORDINATOR** - Coordinator
- **MANAGER** - Manager
- **DIRECTOR** - Director
- **ADMIN** - Administrator
- **SUPER_ADMIN** - Super Administrator

## Routing Logic

### After Login (src/components/auth/LoginForm.tsx)

#### Admins (ADMIN & SUPER_ADMIN)
- **Route**: `/organization-template`
- **Flow**: Organization Template Selection → Structure Builder → Strategy Period Selection → Dashboard
- **Purpose**: Admins need to set up the organizational structure before proceeding

#### Non-Admins (NORMAL, COORDINATOR, MANAGER, DIRECTOR)
- **Route**: `/strategy-period`
- **Flow**: Strategy Period Selection → Dashboard
- **Purpose**: Regular users only need to select a strategy period to start working

## Implementation Details

### 1. Login Form Update
**File**: `src/components/auth/LoginForm.tsx`

```typescript
// Role-based routing after login
const userRole = result.user?.role;

// Only ADMIN and SUPER_ADMIN see organization structure flow
if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
  router.push("/organization-template");
} else {
  // All other roles go to strategy period selection
  router.push("/strategy-period");
}
```

### 2. Strategy Period Page
**File**: `src/app/strategy-period/page.tsx`

- Already has role-based logic
- "New Strategy" button only visible to ADMIN and SUPER_ADMIN
- All users can select existing strategy periods

```typescript
const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

{isAdmin && (
  <div className="flex justify-center mt-12 md:mt-16">
    <NewStrategyButton />
  </div>
)}
```

## User Experience

### Admin Flow
1. Login
2. Choose Organization Template (Corporate, Division-based, etc.)
3. Build Organization Structure (if starting from scratch)
4. Choose Strategy Period
5. Access Dashboard

### Employee Flow
1. Login
2. Choose Strategy Period
3. Access Dashboard

## Benefits

1. **Simplified Onboarding**: Regular employees skip complex organizational setup
2. **Role Separation**: Clear distinction between admin and employee responsibilities
3. **Better UX**: Users only see what's relevant to their role
4. **Security**: Organizational structure management restricted to admins
5. **Efficiency**: Faster access to dashboard for non-admin users

## Future Enhancements

1. Add middleware to protect organization template routes from non-admin access
2. Implement organization structure viewing (read-only) for non-admins
3. Add role-based dashboard customization
4. Create admin-specific analytics and management tools
