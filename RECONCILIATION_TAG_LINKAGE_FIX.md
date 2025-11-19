# Reconciliation Tag → Validation Task Linkage

## Problem Identified

The initial reconciliation tag implementation was missing the connection between tags and **validation tasks**:

1. ✅ Tags were created on trial balance accounts
2. ✅ Auto-extraction worked from Excel/CSV files  
3. ❌ **Validations weren't auto-linked to validation tasks**
4. ❌ **Frontend didn't show which tasks were validation tasks**

## Solution Implemented

### 1. Auto-Link to Validation Tasks (Backend)

**File**: `backend/routers/trial_balance.py`

When auto-extracting values from files, the system now:
- Checks if a validation task is linked to the account
- Automatically links the validation to that task if no manual task selection was made
- Prioritizes validation-type tasks over prep tasks

```python
# Auto-link to validation task if no task_id provided and one exists
if task_id is None and account.tasks:
    # Find validation tasks linked to this account
    validation_tasks = [
        t for t in account.tasks 
        if t.task_type == TaskType.VALIDATION
    ]
    if validation_tasks:
        # Use the first validation task found
        task_id = validation_tasks[0].id
        linked_task = validation_tasks[0]
```

### 2. Expose Task Type in API (Backend)

**File**: `backend/schemas.py`

Added `task_type` to `TaskSummary` schema so frontend can distinguish:
- **Prep tasks**: Regular close tasks
- **Validation tasks**: Reconciliation/validation tasks

```python
class TaskSummary(BaseModel):
    id: int
    name: string
    status: TaskStatus
    task_type: TaskType  # NEW: 'prep' or 'validation'
    due_date: Optional[datetime] = None
```

### 3. Show Task Types in Frontend

**Files**: 
- `frontend/src/components/TrialBalanceAccountModal.tsx`
- `frontend/src/pages/TrialBalance.tsx`

#### Changes Made:

**A) Linked Tasks Section**
- Shows `[Validation]` badge next to validation tasks
- Example: `Cash Reconciliation (in_progress) [Validation]`

**B) Validation Creation Dropdown**
- Shows `- Validation Task` suffix for validation tasks
- Helper text: "Validation tasks will be auto-linked when using tag extraction"

**C) Existing Validations Display**
- Purple badge shows when validation is linked to validation task
- Clear visual distinction from prep tasks

## How It Works Now

### Workflow Example:

1. **Setup**: Create validation task for account (task_type = 'validation')
2. **Link**: Link task to trial balance account
3. **Tag**: Copy reconciliation tag from account modal
4. **Upload**: Upload Excel/CSV with tag and value
5. **Auto-Magic**: 
   - ✅ Value auto-extracted from file
   - ✅ Validation auto-linked to validation task
   - ✅ Badge shows it's a validation task

### Manual Override Still Works:

Users can still manually:
- Enter supporting amounts without files
- Select different tasks (prep or validation)
- Override auto-extracted values

## Visual Changes

### Before:
```
Task: Cash Reconciliation (in_progress)
```

### After:
```
Task: Cash Reconciliation (in_progress) [Validation]
                                         ^^^^^^^^^^^^
                                         Purple badge
```

### In Dropdowns:
```
Cash Reconciliation (in_progress) - Validation Task
AR Aging Review (not_started) - Validation Task  
Depreciation Calc (complete)
```

## Database Query Impact

**Before**: No additional query
**After**: One additional filter when auto-extracting:
```python
validation_tasks = [t for t in account.tasks if t.task_type == TaskType.VALIDATION]
```

This is efficient because:
- `account.tasks` is already loaded via `selectinload`
- Filter happens in Python (no extra DB query)
- Only runs when auto-extracting values

## Testing

Test these scenarios:

1. **Auto-link validation task**:
   - Create validation task, link to account
   - Upload file with tag (no manual task selection)
   - Verify validation is auto-linked to validation task

2. **Multiple task types**:
   - Link both prep and validation tasks to account
   - Verify only validation tasks are auto-selected

3. **Manual override**:
   - Upload file with tag
   - Manually select different task
   - Verify manual selection takes priority

4. **Visual badges**:
   - Check validation list shows purple "Validation" badge
   - Check task dropdowns show " - Validation Task"
   - Check linked tasks show "[Validation]" suffix

## Migration Notes

**No database migration required** - this is pure logic and UI enhancement.

The `task_type` field already exists from previous migration:
- `add_task_validation_and_review_fields.sql`
- Tasks can be created as `prep` or `validation` type

## Summary

The reconciliation tag feature now properly integrates with the validation task workflow:

- ✅ Tags generate on TB accounts
- ✅ Auto-extraction from Excel/CSV files
- ✅ **Auto-linking to validation tasks**
- ✅ **Visual indication of task types**
- ✅ Manual override capability preserved

This creates a complete workflow:
**TB Account → Reconciliation Tag → Auto-Extraction → Validation → Validation Task**

