# Onboarding Wizard - Feasibility Analysis

## Current Status: ✅ 85% Ready

Your current backend and frontend structure can support **most** of the onboarding wizard with some additions needed.

---

## ✅ What We Already Have (Ready to Use)

### Backend Entities & APIs
- ✅ **Organization** - Basic info (name, industry, country, etc.)
- ✅ **Employee** - Full CRUD with roles, status, departments
- ✅ **Division** - Full CRUD
- ✅ **Department** - Full CRUD with division relationships
- ✅ **Team** - Full CRUD
- ✅ **Position** - Full CRUD
- ✅ **Strategic Plan** - Full CRUD
- ✅ **Strategic Period** - Full CRUD with date ranges
- ✅ **Strategic Pillar** - Full CRUD
- ✅ **Objective** - Full CRUD with cascade support (assigneeType, assigneeId)
- ✅ **KPI** - Full CRUD with assignments (employee, department, division)
- ✅ **Performance Weight Config** - Full CRUD
- ✅ **Notification** - Full CRUD (for cascade notifications)
- ✅ **Manager Relationship** - Employee.managerId field exists

### Frontend Components
- ✅ **Auth System** - Login, JWT tokens
- ✅ **Dashboard** - Main layout with sidebar
- ✅ **Strategic Plan Forms** - Create/Edit plans, periods, pillars
- ✅ **Objective Forms** - Create/Edit with cascade support
- ✅ **KPI Forms** - Create/Edit with assignments
- ✅ **Division/Department/Team Forms** - Full CRUD dialogs
- ✅ **Employee Forms** - Create/Edit with role assignment
- ✅ **Position Forms** - Create/Edit

---

## ⚠️ What Needs to Be Added

### 1. **Backend Additions Needed**

#### A. Employee Entity Extensions
```typescript
// Add to Employee entity:
@Field()
@Column({ default: false })
isFirstLogin: boolean;

@Field({ nullable: true })
@Column({ type: 'timestamp', nullable: true })
lastPasswordChange?: Date;

@Field()
@Column({ default: false })
mustChangePassword: boolean;
```

#### B. Organization Entity Extensions
```typescript
// Add to Organization entity:
@Field({ nullable: true })
@Column({ nullable: true })
structureTemplate?: string; // 'functional', 'divisional', 'matrix', 'flat'

@Field()
@Column({ default: false })
onboardingCompleted: boolean;

@Field({ nullable: true })
@Column({ type: 'json', nullable: true })
onboardingProgress?: {
  step1_passwordChange: boolean;
  step2_welcome: boolean;
  step3_template: boolean;
  step4_strategicPlan: boolean;
  step5_pillars: boolean;
  step6_periods: boolean;
  step7_divisions: boolean;
  step8_departments: boolean;
  step9_teams: boolean;
  step10_positions: boolean;
  step11_employees: boolean;
  step12_heads: boolean;
  step13_objectives: boolean;
  step14_kpis: boolean;
  step15_weights: boolean;
  step16_cascade: boolean;
};
```

#### C. New Mutations Needed
```typescript
// In auth.resolver.ts
@Mutation(() => Employee)
changePassword(
  @Args('oldPassword') oldPassword: string,
  @Args('newPassword') newPassword: string,
  @CurrentUser() user: Employee
): Promise<Employee>

// In organization.resolver.ts
@Mutation(() => Organization)
updateOnboardingProgress(
  @Args('organizationId') organizationId: string,
  @Args('step') step: string,
  @Args('completed') completed: boolean
): Promise<Organization>

@Mutation(() => Organization)
selectStructureTemplate(
  @Args('organizationId') organizationId: string,
  @Args('template') template: string
): Promise<Organization>
```

### 2. **Frontend Additions Needed**

#### A. New Components to Create
```
src/components/onboarding/
├── OnboardingWizard.tsx          (Main wizard container)
├── steps/
│   ├── Step1PasswordChange.tsx   (Force password change)
│   ├── Step2Welcome.tsx           (Welcome screen)
│   ├── Step3TemplateSelector.tsx (Choose org structure)
│   ├── Step4StrategicPlan.tsx    (Create plan - reuse existing)
│   ├── Step5Pillars.tsx           (Create pillars - reuse existing)
│   └── Step6Periods.tsx           (Auto-generate periods)
└── OnboardingChecklist.tsx       (Dashboard checklist widget)
```

#### B. New Pages to Create
```
src/app/onboarding/
├── page.tsx                       (Main onboarding page)
└── layout.tsx                     (Onboarding layout - no sidebar)
```

#### C. Route Protection Logic
```typescript
// In middleware or layout
if (user.isFirstLogin || user.mustChangePassword) {
  redirect('/onboarding?step=1');
}

if (!organization.onboardingCompleted && user.role === 'SUPER_ADMIN') {
  redirect('/onboarding?step=' + getCurrentStep());
}
```

---

## 📋 Implementation Roadmap

### Phase 1: Backend Setup (2-3 hours)
1. ✅ Add fields to Employee entity (isFirstLogin, mustChangePassword, lastPasswordChange)
2. ✅ Add fields to Organization entity (structureTemplate, onboardingCompleted, onboardingProgress)
3. ✅ Create changePassword mutation in auth service
4. ✅ Create updateOnboardingProgress mutation
5. ✅ Create selectStructureTemplate mutation
6. ✅ Run migration to add new columns

### Phase 2: Frontend Wizard (4-6 hours)
1. ✅ Create OnboardingWizard container component
2. ✅ Create Step1PasswordChange component
3. ✅ Create Step2Welcome component
4. ✅ Create Step3TemplateSelector component (with visual templates)
5. ✅ Integrate existing forms for Steps 4-6 (Strategic Plan, Pillars, Periods)
6. ✅ Add route protection logic
7. ✅ Create onboarding page and layout

### Phase 3: Dashboard Checklist (2-3 hours)
1. ✅ Create OnboardingChecklist widget component
2. ✅ Add to dashboard layout
3. ✅ Track completion of steps 7-16
4. ✅ Show progress percentage
5. ✅ Link each checklist item to relevant page

### Phase 4: Cascade Notifications (1-2 hours)
1. ✅ Create notification when objectives are cascaded
2. ✅ Show notification badge in sidebar
3. ✅ Create notifications page/panel
4. ✅ Mark notifications as read

---

## 🎯 Step-by-Step Mapping to Current System

### ✅ ONBOARDING WIZARD (Steps 1-6)

| Step | What's Needed | Current Status | Work Required |
|------|---------------|----------------|---------------|
| **Step 1: Password Change** | Force password change on first login | ❌ Not implemented | Add isFirstLogin field + change password form |
| **Step 2: Welcome Screen** | Show welcome message, explain system | ❌ Not implemented | Create welcome component with intro |
| **Step 3: Template Selector** | Choose org structure template | ❌ Not implemented | Create template selector with 4 options |
| **Step 4: Strategic Plan** | Create strategic plan | ✅ Form exists | Integrate existing CreateStrategicPlanDialog |
| **Step 5: Strategic Pillars** | Create 3-5 pillars | ✅ Form exists | Integrate existing CreatePillarDialog |
| **Step 6: Strategic Periods** | Auto-generate periods | ✅ API exists | Create auto-generation logic (Q1-Q4, H1-H2, Annual) |

### ✅ DASHBOARD CHECKLIST (Steps 7-16)

| Step | What's Needed | Current Status | Work Required |
|------|---------------|----------------|---------------|
| **Step 7: Divisions** | Create divisions | ✅ Form exists | Add to checklist, link to divisions page |
| **Step 8: Departments** | Create departments | ✅ Form exists | Add to checklist, link to departments page |
| **Step 9: Teams** | Create teams (optional) | ✅ Form exists | Add to checklist, link to teams page |
| **Step 10: Positions** | Create positions | ✅ Form exists | Add to checklist, link to positions page |
| **Step 11: Employees** | Register employees | ✅ Form exists | Add to checklist, link to employees page |
| **Step 12: Assign Heads** | Assign division/dept heads | ✅ Can use employee form | Add specific "Assign Head" action |
| **Step 13: Corporate Objectives** | Create corporate objectives | ✅ Form exists | Add to checklist, filter by CORPORATE level |
| **Step 14: Corporate KPIs** | Create corporate KPIs | ✅ Form exists | Add to checklist, link to KPIs page |
| **Step 15: Performance Weights** | Configure weights | ✅ Form exists | Add to checklist, link to weights config |
| **Step 16: Cascade Objectives** | Cascade to divisions | ✅ API exists | Add "Cascade" button + notification creation |

---

## 🚀 Quick Start Implementation

### Minimal Viable Onboarding (4-6 hours total)

If you want to implement this quickly, here's the minimal version:

#### Backend (1-2 hours)
```typescript
// 1. Add to Employee entity
isFirstLogin: boolean (default: true)
mustChangePassword: boolean (default: true)

// 2. Add to Organization entity  
onboardingCompleted: boolean (default: false)

// 3. Add changePassword mutation
// 4. Add completeOnboarding mutation
```

#### Frontend (3-4 hours)
```typescript
// 1. Create /onboarding page with 3 steps:
//    - Password change
//    - Welcome + template selection
//    - Strategic plan creation

// 2. Add route protection in layout
if (!user.passwordChanged) redirect('/onboarding')
if (!org.onboardingCompleted && user.role === 'SUPER_ADMIN') redirect('/onboarding')

// 3. Add simple checklist widget to dashboard
// 4. Mark onboarding complete when checklist is 100%
```

---

## 📊 Completion Tracking

### How to Track Progress

```typescript
// Backend: Calculate completion percentage
const calculateOnboardingProgress = (org: Organization) => {
  const steps = [
    org.divisions.length > 0,
    org.departments.length > 0,
    org.positions.length > 0,
    org.employees.length > 1, // More than just super admin
    org.strategicPlans.length > 0,
    org.objectives.filter(o => o.level === 'CORPORATE').length > 0,
    org.kpis.length > 0,
    org.performanceWeights.length > 0,
  ];
  
  const completed = steps.filter(Boolean).length;
  return (completed / steps.length) * 100;
};
```

---

## 🎨 Template Options for Step 3

### 1. Functional Structure
```
Organization
├── HR Department
├── Finance Department
├── Operations Department
└── Sales Department
```

### 2. Divisional Structure
```
Organization
├── North Division
│   ├── Sales Dept
│   └── Operations Dept
└── South Division
    ├── Sales Dept
    └── Operations Dept
```

### 3. Matrix Structure
```
Organization
├── Product Division
│   └── Cross-functional teams
└── Regional Division
    └── Cross-functional teams
```

### 4. Flat Structure
```
Organization
└── All employees report to leadership
    (No divisions/departments)
```

---

## ✅ Conclusion

**YES, you can achieve this onboarding wizard with your current structure!**

### What you have:
- ✅ All necessary backend entities
- ✅ All necessary CRUD operations
- ✅ All necessary frontend forms
- ✅ Cascade support for objectives
- ✅ Notification system

### What you need to add:
- ⚠️ Employee first login tracking (2 fields)
- ⚠️ Organization onboarding tracking (3 fields)
- ⚠️ Password change mutation (1 mutation)
- ⚠️ Onboarding wizard UI (6 components)
- ⚠️ Dashboard checklist widget (1 component)
- ⚠️ Route protection logic (middleware)

### Estimated Total Time:
- **Minimal Version**: 4-6 hours
- **Full Version**: 10-15 hours

The system is **85% ready** - you just need to add the onboarding flow and tracking!
