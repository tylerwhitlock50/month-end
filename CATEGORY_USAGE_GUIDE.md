# How to Set Task Categories

## Where Categories Come From

Task categories organize your File Cabinet into logical folders like "Cash & Bank", "Accounts Receivable", etc.

### 1. **Auto-Categorization (Already Done)**
When you ran the migration, all existing tasks were automatically categorized based on their names:
- Tasks with "cash" or "bank" → "Cash & Bank"
- Tasks with "receivable" or "AR" → "Accounts Receivable"
- Tasks with "inventory" → "Inventory"
- And so on...

### 2. **Setting Categories on Templates (Recommended)**
This is the best way to ensure consistency!

**How to do it:**
1. Go to **Templates** page
2. Click **Edit** on a template (or create a new one)
3. Look for the **Category** field (between Department and Default Owner)
4. Type or select a category (e.g., "Cash & Bank")
5. Click **Save**

**Result:** All future tasks created from this template will automatically have this category.

### 3. **Setting Categories on Individual Tasks**
You can also change the category for specific tasks:

**How to do it:**
1. Click on any task to open the Task Detail modal
2. Scroll down to find the **Category** field (below Priority)
3. Type or select a category
4. Click **Save Changes**

**Result:** That specific task will be re-categorized in the File Cabinet.

## Suggested Categories

The input field has auto-suggestions for these standard categories:
- **Cash & Bank** - Bank reconciliations, cash management
- **Accounts Receivable** - AR aging, collections
- **Inventory** - Inventory counts, valuation
- **Accounts Payable** - AP aging, vendor reconciliations
- **Fixed Assets** - Depreciation, asset additions/disposals
- **Accruals** - Accrued expenses, accrued revenue
- **Revenue** - Revenue recognition, sales reconciliations
- **Expenses** - Expense allocations, prepaid expenses
- **Prepaids & Deferrals** - Prepaid insurance, deferred revenue
- **Tax** - Tax calculations, tax filings
- **Payroll** - Payroll processing, payroll taxes
- **General** - Miscellaneous tasks

**You can also create your own custom categories** - just type any name you want!

## Viewing Tasks by Category

1. Go to **File Cabinet**
2. Select a period
3. Expand **Task Files**
4. You'll see folders for each category (e.g., "Cash & Bank (3 tasks)")
5. Expand a category to see all tasks in that group
6. Expand individual tasks to see their files

## Best Practices

### ✅ DO:
- **Set categories on templates** - ensures all new tasks are properly categorized
- **Use consistent naming** - stick to the suggested categories when possible
- **Keep it simple** - 8-12 categories is ideal, more gets cluttered
- **Group related work** - all Cash tasks together, all AR tasks together

### ❌ DON'T:
- Don't create too many categories (makes File Cabinet hard to navigate)
- Don't use vague names like "Misc" or "Other" (use "General" instead)
- Don't mix categories (e.g., "Cash & AR" should be separate)

## Examples

### Example 1: Setting Up a Bank Reconciliation Template
1. Go to Templates
2. Edit "Bank Reconciliation" template
3. Set **Category** = "Cash & Bank"
4. Set **Department** = "Accounting"
5. Save

Now all bank reconciliation tasks will appear under "Cash & Bank" in File Cabinet!

### Example 2: Re-categorizing an Existing Task
You have a task called "Review inventory adjustments" that's in "General":
1. Click the task to open details
2. Change **Category** from "General" to "Inventory"
3. Save
4. Go to File Cabinet - it now appears under "Inventory"!

### Example 3: Creating a Custom Category
You want a category for "Intercompany":
1. Edit a template or task
2. In the **Category** field, type "Intercompany"
3. Save
4. File Cabinet will now show "Intercompany" as a folder!

## FAQ

**Q: What if I leave Category blank?**
A: Tasks without a category go into the "General" folder.

**Q: Can I change categories for multiple tasks at once?**
A: Not yet in the UI, but you can update them via the database if needed.

**Q: Do categories affect permissions or workflow?**
A: No, categories are just for organization in the File Cabinet. They don't restrict access.

**Q: Can I see which template a task came from?**
A: Yes, in the Task Detail modal you'll see "Created from Template: XYZ" if it was template-based.

**Q: Will changing a template's category update existing tasks?**
A: No, only NEW tasks created from that template will get the new category. Existing tasks keep their category.

## Summary

**To change categories:**
- **For future tasks:** Edit the template
- **For existing tasks:** Edit the individual task
- **For File Cabinet view:** Categories automatically organize your folders

That's it! Your File Cabinet will now be beautifully organized by category! 📁✨

