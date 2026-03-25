'use client'

import { useState, useMemo } from 'react'
import { mockRecentOrders } from '@/lib/mockData'
import { Order, OrderStatus } from '@/lib/types'
import StatusBadge from '@/components/common/StatusBadge'

const fmt = (n: number, dec = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n)

const ALL_STATUSES: OrderStatus[] = [
  'submitted', 'accepted', 'working', 'filled', 'partially_filled', 'rejected', 'canceled',
]

const SETTLEMENT_LABELS: Record<OrderStatus, string> = {
  submitted: '—',
  accepted: '—',
  working: 'Pending',
  filled: 'T+1',
  partially_filled: 'Partial',
  rejected: 'N/A',
  canceled: 'N/A',
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function downloadCSV(orders: Order[]) {
  const headers = ['ID', 'Timestamp', 'Asset', 'Side', 'Type', 'Quantity', 'Price', 'Status', 'Filled', 'Fee', 'Total']
  const rows = orders.map(o => [
    o.id, o.timestamp, o.asset, o.side, o.type,
    o.quantity, o.price, o.status, o.filled, o.fee, o.total,
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'anchor-wealth-order-history.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function HistoryPage() {
  const [assetFilter, setAssetFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [sideFilter, setSideFilter] = useState<'buy' | 'sell' | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    return mockRecentOrders.filter(o => {
      if (assetFilter && !o.asset.toLowerCase().includes(assetFilter.toLowerCase())) return false
      if (statusFilter && o.status !== statusFilter) return false
      if (sideFilter && o.side !== sideFilter) return false
      if (dateFrom && new Date(o.timestamp) < new Date(dateFrom)) return false
      if (dateTo && new Date(o.timestamp) > new Date(dateTo + 'T23:59:59Z')) return false
      return true
    })
  }, [assetFilter, statusFilter, sideFilter, dateFrom, dateTo])

  const totalFees = filtered.reduce((s, o) => s + o.fee, 0)
  const totalVolume = filtered.reduce((s, o) => s + (o.status === 'filled' ? o.total : 0), 0)

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Order History</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            {filtered.length} orders · {fmt(totalVolume, 0)} volume · {fmt(totalFees)} fees
          </p>
        </div>
        <button
          onClick={() => downloadCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
          style={{ borderColor: '#3b82f6', color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV
        </button>
      </div>

      {/* Filter bar */}
      <div
        className="flex flex-wrap gap-3 p-4 rounded-xl border"
        style={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a' }}
      >
        {/* Asset */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#64748b' }}>
            Asset
          </label>
          <input
            type="text"
            placeholder="BTC, ETH…"
            value={assetFilter}
            onChange={e => setAssetFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border outline-none w-24"
            style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#64748b' }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as OrderStatus | '')}
            className="px-3 py-1.5 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
          >
            <option value="">All</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Side */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#64748b' }}>
            Side
          </label>
          <div className="flex gap-1">
            {(['', 'buy', 'sell'] as const).map(s => (
              <button
                key={s || 'all'}
                onClick={() => setSideFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize"
                style={{
                  backgroundColor: sideFilter === s ? 'rgba(59,130,246,0.15)' : 'transparent',
                  borderColor: sideFilter === s ? '#3b82f6' : '#1e2d4a',
                  color:
                    sideFilter === s
                      ? '#3b82f6'
                      : s === 'buy'
                      ? '#22c55e'
                      : s === 'sell'
                      ? '#ef4444'
                      : '#64748b',
                }}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#64748b' }}>
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
          />
          <label className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#64748b' }}>
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
          />
          {(assetFilter || statusFilter || sideFilter || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setAssetFilter(''); setStatusFilter(''); setSideFilter(''); setDateFrom(''); setDateTo('')
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2d4a' }}>
                {['Order ID', 'Time', 'Asset', 'Side', 'Type', 'Qty', 'Price', 'Status', 'Filled', 'Fee', 'Total', 'Settlement', 'Confirm'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: '#64748b' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-sm" style={{ color: '#64748b' }}>
                    No orders match your filters
                  </td>
                </tr>
              ) : (
                filtered.map(order => (
                  <tr
                    key={order.id}
                    className="border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: '#1e2d4a' }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: '#3b82f6' }}>
                      {order.id}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#64748b' }}>
                      {formatTs(order.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
                        >
                          {order.asset[0]}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                          {order.asset}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                        style={{
                          backgroundColor: order.side === 'buy' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: order.side === 'buy' ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {order.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: '#f1f5f9' }}>
                      {order.type}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {order.quantity}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {fmt(order.price, 2)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: order.filled > 0 ? '#22c55e' : '#64748b' }}>
                      {order.filled > 0 ? order.filled : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {order.fee > 0 ? fmt(order.fee) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                      {fmt(order.total, 2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-semibold"
                        style={{
                          backgroundColor: order.status === 'filled' ? 'rgba(245,158,11,0.1)' : 'transparent',
                          color: order.status === 'filled' ? '#f59e0b' : '#64748b',
                        }}
                      >
                        {SETTLEMENT_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.status === 'filled' && (
                        <button
                          onClick={() => {
                            // mock download
                            const content = `TRADE CONFIRMATION\n\nOrder: ${order.id}\nAsset: ${order.asset}\nSide: ${order.side.toUpperCase()}\nType: ${order.type}\nQty: ${order.filled}\nPrice: ${fmt(order.price)}\nFee: ${fmt(order.fee)}\nTotal: ${fmt(order.total)}\nTimestamp: ${order.timestamp}\nSettlement: T+1\n`
                            const blob = new Blob([content], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${order.id}-confirmation.txt`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-colors"
                          style={{ borderColor: '#1e2d4a', color: '#64748b' }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary row */}
      {filtered.length > 0 && (
        <div
          className="flex items-center justify-between px-5 py-3 rounded-xl border text-sm"
          style={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a' }}
        >
          <span style={{ color: '#64748b' }}>
            Showing <strong style={{ color: '#f1f5f9' }}>{filtered.length}</strong> orders
          </span>
          <div className="flex gap-6">
            <span style={{ color: '#64748b' }}>
              Total Volume:{' '}
              <strong style={{ color: '#f1f5f9' }}>{fmt(totalVolume, 0)}</strong>
            </span>
            <span style={{ color: '#64748b' }}>
              Total Fees:{' '}
              <strong style={{ color: '#f1f5f9' }}>{fmt(totalFees)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Disclosure */}
      <div
        className="p-4 rounded-xl border text-xs"
        style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629', color: '#64748b' }}
      >
        <strong style={{ color: '#f59e0b' }}>Disclosure:</strong> Order history is for informational purposes only. All transactions are executed on a principal basis by Anchor Wealth Trading Desk. Settlement times are estimates. Fees shown are approximate and may vary. Trade confirmations are the authoritative record of each transaction. Contact your advisor for official account statements.
      </div>
    </div>
  )
}
