import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    not_started: 'gray',
    in_progress: 'blue',
    review: 'yellow',
    complete: 'green',
    blocked: 'red',
  }
  return colors[status] || 'gray'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    review: 'Review',
    complete: 'Complete',
    blocked: 'Blocked',
  }
  return labels[status] || status
}

export function getPriorityColor(priority: number): string {
  if (priority >= 8) return 'red'
  if (priority >= 5) return 'yellow'
  return 'gray'
}

export function getNextStatusInFlow(status?: string | null): string {
  switch (status) {
    case 'review':
      return 'complete'
    case 'in_progress':
      return 'review'
    case 'complete':
      return 'complete'
    case 'blocked':
    case 'not_started':
    default:
      return 'in_progress'
  }
}

export function getAdvanceStatusLabel(status?: string | null): string {
  switch (status) {
    case 'complete':
      return 'Task Completed'
    case 'review':
      return 'Mark Complete'
    case 'in_progress':
      return 'Send to Review'
    case 'blocked':
      return 'Resume Task'
    case 'not_started':
    default:
      return 'Start Task'
  }
}

export type PeriodDateContext = {
  year: number
  month: number
  target_close_date?: string | null
}

export function getPeriodAnchorDate(period?: PeriodDateContext | null): Date | null {
  if (!period) return null

  if (period.target_close_date) {
    const anchor = new Date(period.target_close_date)
    if (!Number.isNaN(anchor.getTime())) {
      return anchor
    }
  }

  if (typeof period.year === 'number' && typeof period.month === 'number') {
    // Day 0 of the following month returns the last day of the current month
    const lastDay = new Date(Date.UTC(period.year, period.month, 0))
    if (!Number.isNaN(lastDay.getTime())) {
      return lastDay
    }
  }

  return null
}

export function getDateFromDaysOffset(
  period?: PeriodDateContext | null,
  daysOffset?: number | null
): Date | null {
  if (daysOffset === undefined || daysOffset === null || Number.isNaN(daysOffset)) {
    return null
  }

  const anchor = getPeriodAnchorDate(period)
  if (!anchor) return null

  const result = new Date(anchor.getTime())
  result.setUTCDate(result.getUTCDate() + daysOffset)
  return result
}

