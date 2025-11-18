import { useQuery } from '@tanstack/react-query'
import { CheckCircle, AlertCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import api from '../lib/api'

interface ValidationIssue {
  category: 'tasks' | 'approvals' | 'validations' | 'trial_balance'
  severity: 'error' | 'warning'
  message: string
  count: number
  item_ids: number[]
}

interface ValidationSummaryItem {
  total: number
  completed?: number
  incomplete?: number
  matched?: number
  unmatched?: number
  pending?: number
  approved?: number
  rejected?: number
  validated?: number
  unvalidated?: number
}

interface PeriodValidationStatus {
  is_ready_to_close: boolean
  blocking_issues: ValidationIssue[]
  summary: {
    prep_tasks?: ValidationSummaryItem
    validation_tasks?: ValidationSummaryItem
    approvals?: ValidationSummaryItem
    trial_balance?: ValidationSummaryItem
  }
}

interface PeriodReadinessPanelProps {
  periodId: number
}

export default function PeriodReadinessPanel({ periodId }: PeriodReadinessPanelProps) {
  const { data: validation, isLoading, error } = useQuery<PeriodValidationStatus>({
    queryKey: ['period-validation', periodId],
    queryFn: async () => {
      const response = await api.get(`/api/periods/${periodId}/validation-status`)
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="w-5 h-5" />
          <p>Failed to load validation status</p>
        </div>
      </div>
    )
  }

  if (!validation) return null

  const errorIssues = validation.blocking_issues.filter((issue) => issue.severity === 'error')
  const warningIssues = validation.blocking_issues.filter((issue) => issue.severity === 'warning')

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`card ${validation.is_ready_to_close ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {validation.is_ready_to_close ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            )}
            <div>
              <h2 className={`text-lg font-semibold ${validation.is_ready_to_close ? 'text-green-900' : 'text-yellow-900'}`}>
                {validation.is_ready_to_close ? '✓ Ready to Close' : `⚠️ Not Ready to Close`}
              </h2>
              <p className={`text-sm mt-1 ${validation.is_ready_to_close ? 'text-green-700' : 'text-yellow-700'}`}>
                {validation.is_ready_to_close
                  ? 'All required tasks and validations are complete.'
                  : `${errorIssues.length} blocking issue(s) must be resolved before closing this period.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blocking Issues */}
      {errorIssues.length > 0 && (
        <div className="card border-red-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            Blocking Issues
          </h3>
          <div className="space-y-2">
            {errorIssues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">{issue.message}</p>
                  <p className="text-xs text-red-700 mt-1">Category: {issue.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warningIssues.length > 0 && (
        <div className="card border-yellow-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Warnings
          </h3>
          <div className="space-y-2">
            {warningIssues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">{issue.message}</p>
                  <p className="text-xs text-yellow-700 mt-1">Category: {issue.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prep Tasks */}
        {validation.summary.prep_tasks && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Prep Tasks</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total:</span>
                <span className="text-sm font-medium">{validation.summary.prep_tasks.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Completed:</span>
                <span className={`text-sm font-medium ${
                  validation.summary.prep_tasks.completed === validation.summary.prep_tasks.total
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>
                  {validation.summary.prep_tasks.completed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Incomplete:</span>
                <span className={`text-sm font-medium ${
                  validation.summary.prep_tasks.incomplete === 0 ? 'text-gray-400' : 'text-red-600'
                }`}>
                  {validation.summary.prep_tasks.incomplete}
                </span>
              </div>
            </div>
            {validation.summary.prep_tasks.total > 0 && (
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(validation.summary.prep_tasks.completed! / validation.summary.prep_tasks.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Validation Tasks */}
        {validation.summary.validation_tasks && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Validation Tasks</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total:</span>
                <span className="text-sm font-medium">{validation.summary.validation_tasks.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Completed:</span>
                <span className="text-sm font-medium text-green-600">
                  {validation.summary.validation_tasks.completed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Matched:</span>
                <span className="text-sm font-medium text-green-600">
                  {validation.summary.validation_tasks.matched || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Unmatched:</span>
                <span className={`text-sm font-medium ${
                  (validation.summary.validation_tasks.unmatched || 0) === 0 ? 'text-gray-400' : 'text-yellow-600'
                }`}>
                  {validation.summary.validation_tasks.unmatched || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Approvals */}
        {validation.summary.approvals && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Approvals</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total:</span>
                <span className="text-sm font-medium">{validation.summary.approvals.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Approved:</span>
                <span className="text-sm font-medium text-green-600">
                  {validation.summary.approvals.approved || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Pending:</span>
                <span className={`text-sm font-medium ${
                  (validation.summary.approvals.pending || 0) === 0 ? 'text-gray-400' : 'text-yellow-600'
                }`}>
                  {validation.summary.approvals.pending || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Rejected:</span>
                <span className={`text-sm font-medium ${
                  (validation.summary.approvals.rejected || 0) === 0 ? 'text-gray-400' : 'text-red-600'
                }`}>
                  {validation.summary.approvals.rejected || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Trial Balance */}
        {validation.summary.trial_balance && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Trial Balance</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total Accounts:</span>
                <span className="text-sm font-medium">{validation.summary.trial_balance.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Validated:</span>
                <span className="text-sm font-medium text-green-600">
                  {validation.summary.trial_balance.validated || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Unvalidated:</span>
                <span className={`text-sm font-medium ${
                  (validation.summary.trial_balance.unvalidated || 0) === 0 ? 'text-gray-400' : 'text-yellow-600'
                }`}>
                  {validation.summary.trial_balance.unvalidated || 0}
                </span>
              </div>
            </div>
            {validation.summary.trial_balance.total > 0 && (
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((validation.summary.trial_balance.validated || 0) / validation.summary.trial_balance.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


