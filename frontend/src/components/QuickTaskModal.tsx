import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Loader2, Plus } from 'lucide-react'
import api from '../lib/api'
import { formatDate, getDateFromDaysOffset, type PeriodDateContext } from '../lib/utils'

interface QuickTaskModalProps {
  onClose: () => void
  onSuccess: () => void
  periodId: number
  accountId: number
  accountNumber: string
  accountName: string
}

type TemplateOption = {
  id: number
  name: string
  description?: string
  department?: string
  task_type?: 'prep' | 'validation'
  default_owner_id?: number
  days_offset?: number
  estimated_hours?: number
  default_account_numbers?: string[]
}

interface PeriodResponse extends PeriodDateContext {
  id: number
  name: string
}

export default function QuickTaskModal({
  onClose,
  onSuccess,
  periodId,
  accountId,
  accountNumber,
  accountName,
}: QuickTaskModalProps) {
  const queryClient = useQueryClient()
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerId, setOwnerId] = useState<number | ''>('')
  const [assigneeId, setAssigneeId] = useState<number | ''>('')
  const [department, setDepartment] = useState('Accounting')
  const [priority, setPriority] = useState(5)
  const [daysOffset, setDaysOffset] = useState('0')
  const [templateName, setTemplateName] = useState('')
  const [templateNameTouched, setTemplateNameTouched] = useState(false)
  const [taskType, setTaskType] = useState<'prep' | 'validation'>('prep')
  const [templateDepartment, setTemplateDepartment] = useState('Accounting')
  const [estimatedHours, setEstimatedHours] = useState('0.25')
  const [accountTags, setAccountTags] = useState('')
  const [templateId, setTemplateId] = useState<number | ''>('')
  const [error, setError] = useState('')

  useEffect(() => {
    setTaskName(`${accountName} Task`)
    setDescription('')
    setOwnerId('')
    setAssigneeId('')
    setDepartment('Accounting')
    setPriority(5)
    setDaysOffset('0')
    setTemplateName(`${accountName} Task Template`)
    setTemplateNameTouched(false)
    setTaskType('prep')
    setTemplateDepartment('Accounting')
    setEstimatedHours('0.25')
    setAccountTags(accountNumber || '')
    setTemplateId('')
    setError('')
  }, [accountId, accountName, accountNumber])

  useEffect(() => {
    if (!templateNameTouched) {
      setTemplateName(taskName)
    }
  }, [taskName, templateNameTouched])

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/api/users/')
      return response.data as Array<{ id: number; name: string }>
    },
  })

  const { data: templates } = useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      const response = await api.get('/api/task-templates/')
      return response.data as TemplateOption[]
    },
  })

  const { data: periodDetails } = useQuery<PeriodResponse>({
    queryKey: ['period', periodId],
    queryFn: async () => {
      const response = await api.get(`/api/periods/${periodId}`)
      return response.data as PeriodResponse
    },
    staleTime: 5 * 60 * 1000,
  })

  const dueDatePreview = useMemo(() => {
    const offsetNumber = Number(daysOffset)
    if (Number.isNaN(offsetNumber)) return null
    return getDateFromDaysOffset(periodDetails, offsetNumber)
  }, [periodDetails, daysOffset])

  const handleTemplateSelect = (selectedTemplateId: number) => {
    setTemplateId(selectedTemplateId)
    const template = templates?.find((t) => t.id === selectedTemplateId)
    if (!template) return

    setTaskName(template.name)
    setTemplateName(template.name)
    setDescription(template.description || '')
    if (template.default_owner_id) {
      setOwnerId(template.default_owner_id)
    }
    setTaskType(template.task_type || 'prep')
    const nextDepartment = template.department || 'Accounting'
    setDepartment(nextDepartment)
    setTemplateDepartment(nextDepartment)
    if (typeof template.days_offset === 'number') {
      setDaysOffset(template.days_offset.toString())
    }
    if (typeof template.estimated_hours === 'number') {
      setEstimatedHours(template.estimated_hours.toString())
    }
    if (template.default_account_numbers?.length) {
      setAccountTags(template.default_account_numbers.join(', '))
    }
  }

  const createTaskMutation = useMutation({
    mutationFn: async (payload: {
      name: string
      description?: string
      owner_id: number
      assignee_id?: number
      task_type?: 'prep' | 'validation'
      status: string
      priority?: number
      department?: string
      days_offset?: number
      save_as_template: boolean
      template_name: string
      template_department?: string
      template_estimated_hours?: number
      template_default_account_numbers?: string[]
    }) => {
      const response = await api.post(`/api/trial-balance/accounts/${accountId}/tasks`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['trial-balance', periodId] })
      onSuccess()
      onClose()
    },
    onError: (mutationError: any) => {
      setError(
        mutationError.response?.data?.detail || 'Failed to create task. Please try again.'
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!taskName.trim()) {
      setError('Task name is required')
      return
    }

    if (!ownerId) {
      setError('Please select an owner')
      return
    }

    if (!templateName.trim()) {
      setError('Template name is required')
      return
    }

    const offsetValue = daysOffset.trim() === '' ? 0 : Number(daysOffset)
    if (Number.isNaN(offsetValue)) {
      setError('Enter a valid days offset (e.g., -2 for two days before)')
      return
    }

    const estimatedHoursValue = estimatedHours.trim() === '' ? undefined : Number(estimatedHours)
    if (estimatedHours.trim() !== '' && Number.isNaN(estimatedHoursValue)) {
      setError('Estimated hours must be a number')
      return
    }

    const accountNumberTags = accountTags
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    const normalizedPriority = Number.isNaN(priority)
      ? 5
      : Math.min(10, Math.max(1, priority))

    const payload: {
      name: string
      description?: string
      owner_id: number
      assignee_id?: number
      task_type?: 'prep' | 'validation'
      status: string
      priority?: number
      department?: string
      days_offset?: number
      save_as_template: boolean
      template_name: string
      template_department?: string
      template_estimated_hours?: number
      template_default_account_numbers?: string[]
    } = {
      name: taskName.trim(),
      description: description.trim() || undefined,
      owner_id: ownerId as number,
      assignee_id: assigneeId || undefined,
      status: 'not_started',
      priority: normalizedPriority,
      department: department.trim() || undefined,
      days_offset: offsetValue,
      save_as_template: true,
      template_name: templateName.trim(),
      template_department: templateDepartment.trim() || undefined,
      task_type: taskType,
    }

    if (estimatedHoursValue !== undefined && !Number.isNaN(estimatedHoursValue)) {
      payload.template_estimated_hours = estimatedHoursValue
    }

    if (accountNumberTags.length > 0) {
      payload.template_default_account_numbers = accountNumberTags
    }

    createTaskMutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Create Task + Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              Link a task to {accountNumber} • {accountName}. We’ll save these details as a reusable
              template for future periods.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Start from Template (optional)</label>
            <select
              className="input"
              value={templateId}
              onChange={(e) =>
                e.target.value ? handleTemplateSelect(Number(e.target.value)) : setTemplateId('')
              }
            >
              <option value="">Create from scratch</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.department ? `(${template.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Task Name *</label>
              <input
                type="text"
                className="input"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g., Review bank reconciliation"
              />
            </div>
            <div>
              <label className="label">Owner *</label>
              <select
                className="input"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select owner</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Assignee</label>
              <select
                className="input"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Unassigned</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input
                type="text"
                className="input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Accounting"
              />
            </div>
            <div>
              <label className="label">Task Type</label>
              <select
                className="input"
                value={taskType}
                onChange={(e) =>
                  setTaskType(e.target.value === 'validation' ? 'validation' : 'prep')
                }
              >
                <option value="prep">Preparation</option>
                <option value="validation">Reconciliation / Validation</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Use reconciliation to capture validation tasks that link with reconciliation tags.
              </p>
            </div>
            <div>
              <label className="label">Priority (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                className="input"
                value={priority}
                onChange={(e) => {
                  const numeric = Number(e.target.value)
                  setPriority(Number.isNaN(numeric) ? 5 : numeric)
                }}
              />
            </div>
            <div>
              <label className="label">Days Offset from Close</label>
              <input
                type="number"
                className="input"
                value={daysOffset}
                onChange={(e) => setDaysOffset(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                {dueDatePreview
                  ? `Targets ${formatDate(dueDatePreview)} based on the period close date.`
                  : 'Offsets anchor to the period close date or month end.'}
              </p>
            </div>
          </div>

          <div>
            <label className="label">Instructions</label>
            <textarea
              className="input min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done for this task"
            />
            <p className="text-xs text-gray-500 mt-1">
              What should the assignee do to complete this task?
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Template Details (saved for future periods)
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label text-sm">Template Name *</label>
                <input
                  type="text"
                  className="input"
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value)
                    setTemplateNameTouched(true)
                  }}
                  placeholder="e.g., Cash reconciliation template"
                />
              </div>
              <div>
                <label className="label text-sm">Template Department</label>
                <input
                  type="text"
                  className="input"
                  value={templateDepartment}
                  onChange={(e) => setTemplateDepartment(e.target.value)}
                  placeholder="Defaults to Accounting"
                />
              </div>
              <div>
                <label className="label text-sm">Estimated Hours</label>
                <input
                  type="number"
                  step={0.25}
                  min={0}
                  className="input"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-sm">Account Tags</label>
                <input
                  type="text"
                  className="input"
                  value={accountTags}
                  onChange={(e) => setAccountTags(e.target.value)}
                  placeholder="Comma-separated numbers or keywords"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used to auto-recommend this template for matching accounts.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Task & Template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
