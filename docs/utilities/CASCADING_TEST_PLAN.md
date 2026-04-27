# Cascading Strategy Test Plan

This document outlines the steps to verify the hierarchical alignment, per-unit weight tracking, and cascading logic within the Strategize platform.

## Phase 1: Corporate Foundation
1. **Login as Admin**: Ensure you have full visibility.
2. **Create Corporate Objective**:
   - Level: `CORPORATE`
   - Name: "Strategic Growth 2025"
3. **Add Corporate KPIs**:
   - KPI 1: "Revenue Target" (Weight: 60%)
   - KPI 2: "User Acquisition" (Weight: 40%)
   - **Verification**: Check the top progress bar. It should show exactly **100%**.
4. **Approve KPIs**: Ensure they are in the `APPROVED` state so they can be cascaded.

## Phase 2: Cascading to Division (Director Level)
1. **Assign to Division**:
   - Select "Strategic Growth 2025".
   - Assign to **Division A**.
2. **Login as Director of Division A**:
   - Go to "Division Objectives" tab.
   - **Verification**: "Corporate Objectives" tab should be **invisible**.
3. **Draft Division KPIs**:
   - Link to "Revenue Target".
   - Create 2 KPIs for this division.
   - **Verification**: Ensure the "Group Weight Tracker" for Division A updates correctly and warns you if you exceed 100% for that division.

## Phase 3: Strategic Alignment (The "Why")
1. **Verify Hierarchical View**:
   - As Director, check the **Department Objectives** tab.
   - You should only see departments belonging to your Division.
2. **Cascading Skip-Level (Optional)**:
   - Try assigning a Corporate Objective directly to a Department.
   - **Verification**: Check if the Department Manager sees the objective in their "Department Tab" and can trace it back to Corporate.

## Phase 4: Personnel Contribution
1. **Manager Assignment**:
   - As a Manager, assign a Department Objective to an **Employee**.
2. **Employee Login**:
   - **Verification**: The employee should only see the "Personnel Objectives" tab.
   - **Verification**: The table should show the employee's name clearly highlighted, with the sub-objective correctly nested under their Department context.

## Phase 5: Weight Budgeting Validation
1. **Over-limit Test**:
   - Try to set a KPI weight that pushes a Department over 100%.
   - **Verification**: The system should block the save and show the toast error with the exact surplus percentage.
2. **Fractional Balance**:
   - Set 3 KPIs at 33.3%, 33.3%, and 33.4%.
   - **Verification**: Tracker should show exactly 100.0%.
