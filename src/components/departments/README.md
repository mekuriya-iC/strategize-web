# Department Components

This folder contains all department-related components following a clear pattern for user interactions.

## Component Patterns

### 1. **DepartmentSelector** (Form/In-Page Selection)
**Use when:** User needs to select a department within a form or page context
- Dropdown/select component for inline selection
- Part of a larger form or page layout
- Immediate selection without modal overlay
- Example: Selecting department when creating an objective

```tsx
<DepartmentSelector
  value={selectedDepartmentId}
  onChange={handleDepartmentChange}
/>
```

### 2. **DepartmentSelectionModal** (Creating/Major Actions)
**Use when:** User needs to create, configure, or make significant department-related decisions
- Full modal dialog with rich UI
- Creating new departments
- Configuring department settings
- Multi-step workflows
- Example: Initial department setup, bulk department operations

```tsx
<DepartmentSelectionModal
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### 3. **DepartmentSelectionPrompt** (Action Triggers/Confirmations)
**Use when:** User needs to confirm an action or be prompted for a decision
- Quick confirmation dialogs
- Delete confirmations
- Update prompts
- Warning messages
- Example: "Are you sure you want to delete this department?"

```tsx
<DepartmentSelectionPrompt
  action="delete"
  departmentName="Engineering"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

## Key Differences

| Component | Context | UI Complexity | User Intent |
|-----------|---------|---------------|-------------|
| **Selector** | Inline/Form | Simple dropdown | Quick selection |
| **Modal** | Overlay | Rich interface | Create/Configure |
| **Prompt** | Overlay | Minimal | Confirm/Cancel |

## When to Use What?

### Use **Selector** for:
- ✅ Form fields
- ✅ Filter dropdowns
- ✅ Quick inline selections
- ✅ Non-disruptive choices

### Use **Modal** for:
- ✅ Creating new entities
- ✅ Complex configurations
- ✅ Multi-step processes
- ✅ Rich data entry

### Use **Prompt** for:
- ✅ Delete confirmations
- ✅ Action warnings
- ✅ Yes/No decisions
- ✅ Quick alerts

## Examples

### Selector Example
```tsx
// In a form for creating an objective
<form>
  <DepartmentSelector
    value={formData.departmentId}
    onChange={(id) => setFormData({ ...formData, departmentId: id })}
  />
</form>
```

### Modal Example
```tsx
// Creating a new department
<Button onClick={() => setShowModal(true)}>
  Add Department
</Button>

<DepartmentSelectionModal
  open={showModal}
  onOpenChange={setShowModal}
/>
```

### Prompt Example
```tsx
// Confirming department deletion
<DepartmentSelectionPrompt
  action="delete"
  message="Are you sure you want to delete the Engineering department?"
  onConfirm={async () => {
    await deleteDepartment(id);
    toast.success("Department deleted");
  }}
  onCancel={() => setShowPrompt(false)}
/>
```

## Component Files

- `DepartmentSelector.tsx` - Inline selection component
- `DepartmentSelectionModal.tsx` - Full modal for creation/configuration
- `DepartmentSelectionPrompt.tsx` - Auto-prompt for multi-department users
- `DepartmentCard.tsx` - Card component used in modal
- `AddDepartmentButton.tsx` - Reusable add button
- `EmptyState.tsx` - Empty state when no departments exist

## Related Hooks

- `useDepartments()` - Fetch departments data
- `useDepartmentMutations()` - Create/update/delete operations
- `useDepartmentSelection()` - Context for department selection state
