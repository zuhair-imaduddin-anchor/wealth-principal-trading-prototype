import { OrderStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: OrderStatus
}

const statusConfig: Record<OrderStatus, { label: string; bg: string; color: string; pulse?: boolean }> = {
  submitted: { label: 'Submitted', bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  accepted: { label: 'Accepted', bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  working: { label: 'Working', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', pulse: true },
  filled: { label: 'Filled', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  partially_filled: { label: 'Partial Fill', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  rejected: { label: 'Rejected', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  canceled: { label: 'Canceled', bg: 'rgba(100,116,139,0.15)', color: '#64748b' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pulse ? 'animate-pulse-amber' : ''}`}
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  )
}
