# TaskSummary Schema Fix

## Problem

When we added `task_type` to the `TaskSummary` schema to show validation vs prep tasks on the frontend, it became a required field. This broke all existing code that was creating `TaskSummary` objects without that field.

### Error:
```
pydantic_core._pydantic_core.ValidationError: 1 validation error for TaskSummary
task_type
  Field required [type=missing, input_value={'id': 17, 'name': '...}, input_type=dict]
```

## Solution

Updated all places where `TaskSummary` objects are created to include the `task_type` field.

### Files Fixed:

1. **backend/routers/dashboard.py**
   - Line 106: `to_summary()` helper function
   - Line 137: Query to include `task_type` 
   - Line 154: TaskSummary creation in dependency query

2. **backend/routers/periods.py**
   - Line 219: Task status breakdown
   - Line 233: Overdue tasks list
   - Line 238: Upcoming tasks list

3. **backend/routers/tasks.py**
   - Line 137: `_map_task_to_summary()` helper function

### Before (Broken):
```python
TaskSummary(
    id=task.id, 
    name=task.name, 
    status=task.status, 
    due_date=task.due_date
)
# Missing task_type → ValidationError!
```

### After (Fixed):
```python
TaskSummary(
    id=task.id, 
    name=task.name, 
    status=task.status, 
    task_type=task.task_type,  # ← Added!
    due_date=task.due_date
)
```

## Impact

All API endpoints now properly return `task_type` in TaskSummary objects:
- Dashboard stats (blocked tasks, review tasks, at-risk tasks)
- Period detail (task breakdown, overdue/upcoming)
- Task dependencies
- Critical path analysis

## Testing

Verify these endpoints work:
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/periods/{id}` - Period detail with task summary
- `GET /api/tasks/` - Task listing
- All places that return TaskSummary objects

All should now include `task_type: 'prep' | 'validation'` in the response.

## Related Changes

This fix is part of the larger feature to:
1. Show validation tasks distinctly from prep tasks
2. Auto-link reconciliation tag extractions to validation tasks
3. Sync validation data between TrialBalanceValidation and Task models

