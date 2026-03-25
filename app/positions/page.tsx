'use client'

import { useState } from 'react'
import { mockPositions } from '@/lib/mockData'
import { Position } from '@/lib/types'

const fmt = (n: number, dec = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n)

function daysUntil(dateStr: string) {
  return Math.max(0, Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000))
}

function ExpiryCountdown({ expiry }: { expiry: string }) {
  const days = daysUntil(expiry)
  const color = days <= 7 ? '#ef4444' : days <= 14 ? '#f59e0b' : '#22c55e'
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
      {days}d
    </span>
  )
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>(mockPositions)
  const [closingId, setClosingId] = useState<string | null>(null)

  function handleClose(id: string) {
    setClosingId(id)
    setTimeout(() => {
      setPositions(prev => prev.filter(p => p.id !== id))
      setClosingId(null)
    }, 1200)
  }

  const spotPositions = positions.filter(p => p.type === 'spot')
  const derivativePositions = positions.filter(p => p.type === 'option' || p.type === 'perp')

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0)
  const unrealizedPnl = positions.reduce((sum, p) => sum + p.pnl, 0)
  const realizedToday = 1872.50 // mock

  const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Total Portfolio Value',
            value: fmt(totalValue, 0),
            sub: 'Across all positions',
            color: '#f1f5f9',
          },
          {
            label: 'Total P&L',
            value: fmt(totalPnl, 2),
            sub: totalPnl >= 0 ? 'Overall gain' : 'Overall loss',
            color: totalPnl >= 0 ? '#22c55e' : '#ef4444',
          },
          {
            label: 'Unrealized P&L',
            value: fmt(unrealizedPnl, 2),
            sub: 'Open positions',
            color: unrealizedPnl >= 0 ? '#22c55e' : '#ef4444',
          },
          {
            label: 'Realized Today',
            value: fmt(realizedToday, 2),
            sub: 'Closed today',
            color: realizedToday >= 0 ? '#22c55e' : '#ef4444',
          },
        ].map(card => (
          <div
            key={card.label}
            className="p-5 rounded-xl border"
            style={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a' }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>
              {card.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="text-xs mt-1" style={{ color: '#64748b' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Spot positions */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629' }}>
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: '#1e2d4a' }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#f1f5f9' }}>
            Spot Positions
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
          >
            {spotPositions.length} Open
          </span>
        </div>

        {spotPositions.length === 0 ? (
          <div className="py-12 text-center" style={{ color: '#64748b' }}>
            No open spot positions
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2d4a' }}>
                  {['Asset', 'Side', 'Quantity', 'Entry Price', 'Current Price', 'P&L ($)', 'P&L (%)', 'Market Value', ''].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#64748b' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spotPositions.map(pos => (
                  <tr
                    key={pos.id}
                    className="border-b transition-all"
                    style={{
                      borderColor: '#1e2d4a',
                      opacity: closingId === pos.id ? 0.3 : 1,
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
                        >
                          {pos.asset[0]}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>
                          {pos.asset}/USD
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                        style={{
                          backgroundColor: pos.side === 'long' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: pos.side === 'long' ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {pos.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {pos.quantity}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {fmt(pos.entryPrice, 2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {fmt(pos.currentPrice, 2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: pos.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                      {pos.pnl >= 0 ? '+' : ''}{fmt(pos.pnl, 2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: pos.pnlPercent >= 0 ? '#22c55e' : '#ef4444' }}>
                      {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {fmt(pos.quantity * pos.currentPrice, 0)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleClose(pos.id)}
                        disabled={closingId === pos.id}
                        className="px-3 py-1 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50"
                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                      >
                        {closingId === pos.id ? 'Closing…' : 'Close'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Derivatives positions */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629' }}>
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: '#1e2d4a' }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#f1f5f9' }}>
            Derivatives Positions
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
          >
            {derivativePositions.length} Active
          </span>
        </div>

        {derivativePositions.length === 0 ? (
          <div className="py-12 text-center" style={{ color: '#64748b' }}>
            No active derivatives positions
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2d4a' }}>
                  {['Asset', 'Strategy', 'Type', 'Strike', 'Expiry', 'Qty', 'P&L ($)', 'P&L (%)', 'Expiry Countdown', ''].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#64748b' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {derivativePositions.map(pos => (
                  <tr
                    key={pos.id}
                    className="border-b transition-all"
                    style={{
                      borderColor: '#1e2d4a',
                      opacity: closingId === pos.id ? 0.3 : 1,
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
                        >
                          {pos.asset[0]}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>
                          {pos.asset}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold" style={{ color: '#3b82f6' }}>
                        {pos.strategy ?? pos.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pos.optionType && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                          style={{
                            backgroundColor: pos.optionType === 'call' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: pos.optionType === 'call' ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {pos.optionType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {pos.strike ? fmt(pos.strike, 0) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#f1f5f9' }}>
                      {pos.expiry ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f1f5f9' }}>
                      {pos.quantity}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: pos.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                      {pos.pnl >= 0 ? '+' : ''}{fmt(pos.pnl, 2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: pos.pnlPercent >= 0 ? '#22c55e' : '#ef4444' }}>
                      {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      {pos.expiry && <ExpiryCountdown expiry={pos.expiry} />}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleClose(pos.id)}
                        disabled={closingId === pos.id}
                        className="px-3 py-1 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50"
                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                      >
                        {closingId === pos.id ? 'Closing…' : 'Close'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclosure footer */}
      <div
        className="p-4 rounded-xl border text-xs"
        style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629', color: '#64748b' }}
      >
        <strong style={{ color: '#f59e0b' }}>Risk Disclosure:</strong> Position values and P&L figures are indicative and based on mid-market prices. Unrealized gains/losses are not guaranteed until positions are closed. Cryptocurrency markets operate 24/7 and prices can be highly volatile. Past performance does not guarantee future results. Anchor Wealth Trading Desk acts as principal in all transactions.
      </div>
    </div>
  )
}
