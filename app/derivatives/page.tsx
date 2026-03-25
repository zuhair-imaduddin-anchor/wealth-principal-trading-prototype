'use client'

import { useState } from 'react'
import { mockBTCOptions, expiryDates, mockPositions, mockAccounts } from '@/lib/mockData'
import { OptionsContract } from '@/lib/types'

const fmt = (n: number, dec = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n)

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`

// ── Payoff diagram (SVG) ────────────────────────────────────────────────────
function PayoffDiagram({
  currentPrice,
  strike,
  premium,
  entryPrice,
  strategy,
}: {
  currentPrice: number
  strike: number
  premium: number
  entryPrice: number
  strategy: string
}) {
  const width = 400
  const height = 180
  const padding = { top: 20, right: 20, bottom: 30, left: 60 }

  const priceMin = currentPrice * 0.8
  const priceMax = currentPrice * 1.25
  const steps = 60

  function getPayoff(spotAtExpiry: number): number {
    const costBasis = entryPrice
    switch (strategy) {
      case 'Covered Call': {
        // hold 1 BTC, sell call
        const stockPnl = spotAtExpiry - costBasis
        const callPayoff = Math.max(0, spotAtExpiry - strike)
        return stockPnl - callPayoff + premium
      }
      case 'Protective Put': {
        const stockPnl = spotAtExpiry - costBasis
        const putPayoff = Math.max(0, strike - spotAtExpiry)
        return stockPnl + putPayoff - premium
      }
      case 'Cash-Secured Put': {
        const putPayoff = Math.max(0, strike - spotAtExpiry)
        return premium - putPayoff
      }
      case 'Collar': {
        const stockPnl = spotAtExpiry - costBasis
        const callPayoff = Math.max(0, spotAtExpiry - strike)
        const putStrike = strike * 0.95
        const putPayoff = Math.max(0, putStrike - spotAtExpiry)
        const netPrem = premium * 0.6 - premium * 0.4
        return stockPnl - callPayoff + putPayoff + netPrem
      }
      default:
        return 0
    }
  }

  const prices = Array.from({ length: steps }, (_, i) =>
    priceMin + (i / (steps - 1)) * (priceMax - priceMin)
  )
  const payoffs = prices.map(getPayoff)
  const maxPayoff = Math.max(...payoffs)
  const minPayoff = Math.min(...payoffs)
  const range = maxPayoff - minPayoff || 1

  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  function xScale(price: number) {
    return padding.left + ((price - priceMin) / (priceMax - priceMin)) * chartW
  }

  function yScale(payoff: number) {
    return padding.top + chartH - ((payoff - minPayoff) / range) * chartH
  }

  const pathD = prices
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p).toFixed(1)} ${yScale(payoffs[i]).toFixed(1)}`)
    .join(' ')

  const zeroY = yScale(0)
  const currentX = xScale(currentPrice)
  const strikeX = xScale(strike)

  // Fill area above/below zero
  const abovePath = prices
    .map((p, i) => {
      const y = yScale(payoffs[i])
      const z = Math.min(y, zeroY)
      return `${i === 0 ? 'M' : 'L'} ${xScale(p).toFixed(1)} ${z.toFixed(1)}`
    })
    .join(' ') + ` L ${xScale(prices[prices.length - 1]).toFixed(1)} ${zeroY.toFixed(1)} L ${xScale(prices[0]).toFixed(1)} ${zeroY.toFixed(1)} Z`

  const belowPath = prices
    .map((p, i) => {
      const y = yScale(payoffs[i])
      const z = Math.max(y, zeroY)
      return `${i === 0 ? 'M' : 'L'} ${xScale(p).toFixed(1)} ${z.toFixed(1)}`
    })
    .join(' ') + ` L ${xScale(prices[prices.length - 1]).toFixed(1)} ${zeroY.toFixed(1)} L ${xScale(prices[0]).toFixed(1)} ${zeroY.toFixed(1)} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Background */}
      <rect width={width} height={height} fill="transparent" />
      {/* Zero line */}
      <line
        x1={padding.left} y1={zeroY}
        x2={width - padding.right} y2={zeroY}
        stroke="#1e2d4a" strokeWidth={1} strokeDasharray="4 3"
      />
      {/* Profit fill */}
      <path d={abovePath} fill="rgba(34,197,94,0.12)" />
      {/* Loss fill */}
      <path d={belowPath} fill="rgba(239,68,68,0.12)" />
      {/* Payoff line */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} />
      {/* Current price line */}
      <line
        x1={currentX} y1={padding.top}
        x2={currentX} y2={height - padding.bottom}
        stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3" opacity={0.5}
      />
      {/* Strike line */}
      <line
        x1={strikeX} y1={padding.top}
        x2={strikeX} y2={height - padding.bottom}
        stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" opacity={0.7}
      />
      {/* Labels */}
      <text x={currentX} y={padding.top - 6} fill="#f1f5f9" fontSize={9} textAnchor="middle" opacity={0.7}>
        Current
      </text>
      <text x={strikeX} y={padding.top - 6} fill="#f59e0b" fontSize={9} textAnchor="middle" opacity={0.9}>
        Strike
      </text>
      {/* Y axis labels */}
      <text x={padding.left - 5} y={zeroY + 4} fill="#64748b" fontSize={9} textAnchor="end">0</text>
      <text x={padding.left - 5} y={padding.top + 4} fill="#22c55e" fontSize={9} textAnchor="end">
        +{(maxPayoff / 1000).toFixed(0)}k
      </text>
      <text x={padding.left - 5} y={height - padding.bottom} fill="#ef4444" fontSize={9} textAnchor="end">
        {(minPayoff / 1000).toFixed(0)}k
      </text>
      {/* X axis labels */}
      <text x={padding.left} y={height} fill="#64748b" fontSize={8} textAnchor="start">
        ${(priceMin / 1000).toFixed(0)}k
      </text>
      <text x={width - padding.right} y={height} fill="#64748b" fontSize={8} textAnchor="end">
        ${(priceMax / 1000).toFixed(0)}k
      </text>
    </svg>
  )
}

// ── main page ───────────────────────────────────────────────────────────────
type Strategy = 'Covered Call' | 'Protective Put' | 'Cash-Secured Put' | 'Collar'

export default function DerivativesPage() {
  const [underlying, setUnderlying] = useState<'BTC' | 'ETH'>('BTC')
  const [selectedExpiry, setSelectedExpiry] = useState(expiryDates[3])
  const [selectedContract, setSelectedContract] = useState<OptionsContract | null>(mockBTCOptions[2])
  const [strategy, setStrategy] = useState<Strategy>('Covered Call')
  const [contracts, setContracts] = useState('1')
  const [showModal, setShowModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const currentPrice = underlying === 'BTC' ? 94250 : 3485.5
  const spotPos = mockPositions.find(p => p.asset === underlying && p.type === 'spot')
  const qty = spotPos?.quantity ?? 0
  const avgCost = spotPos?.entryPrice ?? currentPrice
  const selectedAccount = mockAccounts[2] // QPF

  const calls = mockBTCOptions.filter(o => o.type === 'call')
  const puts = mockBTCOptions.filter(o => o.type === 'put')

  const premium = selectedContract?.bid ?? 0
  const strike = selectedContract?.strike ?? 97500

  const breakeven =
    strategy === 'Covered Call'
      ? avgCost - premium
      : strategy === 'Protective Put'
      ? avgCost + premium
      : strategy === 'Cash-Secured Put'
      ? strike - premium
      : avgCost - premium * 0.6 + premium * 0.4

  const maxGain =
    strategy === 'Covered Call'
      ? strike - avgCost + premium
      : strategy === 'Protective Put'
      ? Infinity
      : strategy === 'Cash-Secured Put'
      ? premium
      : strike - avgCost + premium * 0.6 - premium * 0.4

  const maxLoss =
    strategy === 'Covered Call'
      ? avgCost - premium
      : strategy === 'Protective Put'
      ? avgCost - strike + premium
      : strategy === 'Cash-Secured Put'
      ? strike - premium
      : 0

  const daysToExpiry = Math.max(
    1,
    Math.round((new Date(selectedExpiry).getTime() - Date.now()) / 86400000)
  )
  const annualizedYield = ((premium / currentPrice) * (365 / daysToExpiry) * 100).toFixed(1)

  function handleConfirm() {
    setShowModal(false)
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Eligibility banner */}
      <div
        className="flex items-center gap-6 px-6 py-3 border-b text-sm flex-shrink-0"
        style={{ backgroundColor: 'rgba(34,197,94,0.05)', borderColor: '#1e2d4a' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
          >
            ● Derivatives Trading Enabled
          </span>
        </div>
        <span style={{ color: '#64748b' }}>
          Account: <span style={{ color: '#f1f5f9' }}>Qualified Purchaser Fund (ACC-003)</span>
        </span>
        <span style={{ color: '#64748b' }}>
          Constraints:{' '}
          <span style={{ color: '#f59e0b' }}>Covered strategies only · No naked exposure</span>
        </span>
        <button className="ml-auto text-xs underline" style={{ color: '#3b82f6' }}>
          View Derivatives Agreement →
        </button>
      </div>

      {/* Main 3-col layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Options Chain ─────────────────────────── */}
        <aside
          className="w-[30%] flex-shrink-0 border-r flex flex-col overflow-hidden"
          style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629' }}
        >
          {/* Underlying selector */}
          <div className="p-4 border-b space-y-3" style={{ borderColor: '#1e2d4a' }}>
            <div className="flex gap-2">
              {(['BTC', 'ETH'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setUnderlying(u)}
                  className="flex-1 py-1.5 rounded-lg text-sm font-bold border transition-all"
                  style={{
                    backgroundColor: underlying === u ? 'rgba(59,130,246,0.15)' : 'transparent',
                    borderColor: underlying === u ? '#3b82f6' : '#1e2d4a',
                    color: underlying === u ? '#3b82f6' : '#64748b',
                  }}
                >
                  {u}
                </button>
              ))}
            </div>

            <div>
              <div className="text-3xl font-bold" style={{ color: '#f1f5f9' }}>
                {fmt(currentPrice)}
              </div>
              <div className="text-xs" style={{ color: '#64748b' }}>
                {underlying}/USD · Spot Price
              </div>
            </div>

            {/* Expiry selector */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>
                Expiry
              </div>
              <div className="flex flex-wrap gap-1">
                {expiryDates.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedExpiry(d)}
                    className="px-2 py-1 rounded text-xs font-medium border transition-all"
                    style={{
                      backgroundColor: selectedExpiry === d ? 'rgba(59,130,246,0.15)' : 'transparent',
                      borderColor: selectedExpiry === d ? '#3b82f6' : '#1e2d4a',
                      color: selectedExpiry === d ? '#3b82f6' : '#64748b',
                    }}
                  >
                    {d.slice(5)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chain table */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div
              className="grid grid-cols-7 px-3 py-2 text-xs font-semibold uppercase tracking-wide sticky top-0"
              style={{ backgroundColor: '#0f1629', color: '#64748b', borderBottom: '1px solid #1e2d4a' }}
            >
              <span>Strike</span>
              <span>Bid</span>
              <span>Ask</span>
              <span>IV</span>
              <span>Δ</span>
              <span>OI</span>
              <span>Vol</span>
            </div>

            {/* Calls section */}
            <div className="px-3 py-1 text-xs font-semibold" style={{ color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.05)' }}>
              CALLS
            </div>
            {calls.map(opt => {
              const atm = Math.abs(opt.strike - currentPrice) < 3000
              const selected = selectedContract?.strike === opt.strike && selectedContract?.type === opt.type
              return (
                <button
                  key={`call-${opt.strike}`}
                  onClick={() => setSelectedContract(opt)}
                  className="w-full grid grid-cols-7 px-3 py-1.5 text-xs font-mono text-left border-b hover:bg-opacity-50 transition-colors"
                  style={{
                    borderColor: '#0a0e1a',
                    backgroundColor: selected
                      ? 'rgba(59,130,246,0.15)'
                      : atm
                      ? 'rgba(34,197,94,0.05)'
                      : 'transparent',
                    borderLeft: selected ? '3px solid #3b82f6' : atm ? '3px solid rgba(34,197,94,0.3)' : '3px solid transparent',
                  }}
                >
                  <span style={{ color: atm ? '#22c55e' : '#f1f5f9', fontWeight: atm ? 700 : 400 }}>
                    {(opt.strike / 1000).toFixed(0)}k
                  </span>
                  <span style={{ color: '#22c55e' }}>{opt.bid.toLocaleString()}</span>
                  <span style={{ color: '#ef4444' }}>{opt.ask.toLocaleString()}</span>
                  <span style={{ color: '#f1f5f9' }}>{fmtPct(opt.iv)}</span>
                  <span style={{ color: '#3b82f6' }}>{opt.delta.toFixed(2)}</span>
                  <span style={{ color: '#64748b' }}>{(opt.openInterest / 1000).toFixed(1)}k</span>
                  <span style={{ color: '#64748b' }}>{opt.volume}</span>
                </button>
              )
            })}

            {/* Puts section */}
            <div className="px-3 py-1 text-xs font-semibold" style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)' }}>
              PUTS
            </div>
            {puts.map(opt => {
              const atm = Math.abs(opt.strike - currentPrice) < 3000
              const selected = selectedContract?.strike === opt.strike && selectedContract?.type === opt.type
              return (
                <button
                  key={`put-${opt.strike}`}
                  onClick={() => setSelectedContract(opt)}
                  className="w-full grid grid-cols-7 px-3 py-1.5 text-xs font-mono text-left border-b hover:bg-opacity-50 transition-colors"
                  style={{
                    borderColor: '#0a0e1a',
                    backgroundColor: selected
                      ? 'rgba(59,130,246,0.15)'
                      : atm
                      ? 'rgba(239,68,68,0.05)'
                      : 'transparent',
                    borderLeft: selected ? '3px solid #3b82f6' : atm ? '3px solid rgba(239,68,68,0.3)' : '3px solid transparent',
                  }}
                >
                  <span style={{ color: atm ? '#ef4444' : '#f1f5f9', fontWeight: atm ? 700 : 400 }}>
                    {(opt.strike / 1000).toFixed(0)}k
                  </span>
                  <span style={{ color: '#22c55e' }}>{opt.bid.toLocaleString()}</span>
                  <span style={{ color: '#ef4444' }}>{opt.ask.toLocaleString()}</span>
                  <span style={{ color: '#f1f5f9' }}>{fmtPct(opt.iv)}</span>
                  <span style={{ color: '#3b82f6' }}>{opt.delta.toFixed(2)}</span>
                  <span style={{ color: '#64748b' }}>{(opt.openInterest / 1000).toFixed(1)}k</span>
                  <span style={{ color: '#64748b' }}>{opt.volume}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── Center: Strategy Builder ─────────────────────── */}
        <main className="flex-1 flex flex-col overflow-y-auto border-r" style={{ borderColor: '#1e2d4a' }}>
          <div className="p-5 space-y-5">
            {/* Strategy selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: '#64748b' }}>Strategy:</span>
              <div className="flex gap-2 flex-wrap">
                {(['Covered Call', 'Protective Put', 'Cash-Secured Put', 'Collar'] as Strategy[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStrategy(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    style={{
                      backgroundColor: strategy === s ? 'rgba(59,130,246,0.15)' : 'transparent',
                      borderColor: strategy === s ? '#3b82f6' : '#1e2d4a',
                      color: strategy === s ? '#3b82f6' : '#64748b',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Holding info */}
            {spotPos && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{ borderColor: '#1e2d4a', backgroundColor: 'rgba(59,130,246,0.05)' }}
              >
                <span className="text-lg">📊</span>
                <div className="text-sm">
                  <span style={{ color: '#64748b' }}>You hold </span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                    {qty} {underlying}
                  </span>
                  <span style={{ color: '#64748b' }}> @ </span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{fmt(avgCost)} avg cost</span>
                  <span style={{ color: '#64748b' }}> · Unrealized P&L: </span>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>
                    {fmt((currentPrice - avgCost) * qty)}
                  </span>
                </div>
              </div>
            )}

            {/* Selected option */}
            {selectedContract && (
              <div
                className="p-4 rounded-xl border"
                style={{ borderColor: '#1e2d4a', backgroundColor: '#0a0e1a' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold" style={{ color: '#f1f5f9' }}>
                    {underlying} {selectedContract.type.toUpperCase()} {fmt(selectedContract.strike, 0)} · {selectedExpiry}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: selectedContract.type === 'call' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: selectedContract.type === 'call' ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {selectedContract.type.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    ['Bid', fmt(selectedContract.bid, 0)],
                    ['Ask', fmt(selectedContract.ask, 0)],
                    ['IV', fmtPct(selectedContract.iv)],
                    ['Delta', selectedContract.delta.toFixed(2)],
                    ['Gamma', selectedContract.gamma.toFixed(5)],
                    ['Theta', selectedContract.theta.toFixed(1)],
                    ['Vega', selectedContract.vega.toFixed(1)],
                    ['OI', selectedContract.openInterest.toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs" style={{ color: '#64748b' }}>{k}</div>
                      <div className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payoff diagram */}
            <div
              className="p-4 rounded-xl border"
              style={{ borderColor: '#1e2d4a', backgroundColor: '#0a0e1a' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: '#64748b' }}>
                  Payoff at Expiry — {strategy}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: '#22c55e' }}>━ Profit</span>
                  <span style={{ color: '#ef4444' }}>━ Loss</span>
                </div>
              </div>
              <PayoffDiagram
                currentPrice={currentPrice}
                strike={strike}
                premium={premium}
                entryPrice={avgCost}
                strategy={strategy}
              />
            </div>

            {/* Strategy metrics */}
            <div
              className="p-4 rounded-xl border grid grid-cols-2 gap-4"
              style={{ borderColor: '#1e2d4a', backgroundColor: '#0a0e1a' }}
            >
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                Strategy Metrics
              </div>
              {[
                ['Premium Received', fmt(premium) + ' per ' + underlying, '#22c55e'],
                ['Breakeven', fmt(breakeven, 0), '#f1f5f9'],
                ['Max Gain', maxGain === Infinity ? 'Unlimited' : fmt(maxGain, 0), '#22c55e'],
                ['Max Loss', maxGain === Infinity ? fmt(maxLoss, 0) : fmt(maxLoss < 0 ? maxLoss : -maxLoss, 0), '#ef4444'],
                ['Downside Protection', `${((premium / avgCost) * 100).toFixed(2)}%`, '#f1f5f9'],
                ['Annualized Yield', `${annualizedYield}%`, '#3b82f6'],
                ['Settlement', 'Cash', '#f1f5f9'],
                ['Exercise', 'European', '#f1f5f9'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between items-baseline">
                  <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ── Right: Collateral + Order Ticket ────────────── */}
        <aside
          className="w-[30%] flex-shrink-0 overflow-y-auto"
          style={{ backgroundColor: '#0f1629' }}
        >
          {submitted ? (
            <div className="p-5">
              <div
                className="rounded-xl border p-5"
                style={{ borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: '#22c55e', color: '#fff' }}
                  >
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: '#22c55e' }}>Strategy Submitted</div>
                    <div className="text-xs" style={{ color: '#64748b' }}>Position ID: POS-{Math.floor(Math.random() * 9000 + 1000)}</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ['Strategy', strategy],
                    ['Underlying', `${underlying}/USD`],
                    ['Contracts', contracts],
                    ['Premium', fmt(premium * parseInt(contracts || '1'), 0)],
                    ['Status', 'Active'],
                    ['Expiry', selectedExpiry],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span style={{ color: '#64748b' }}>{k}</span>
                      <span style={{ color: '#f1f5f9' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 w-full py-2 rounded-lg text-sm font-semibold border"
                  style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                >
                  New Strategy
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Collateral panel */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ borderColor: '#1e2d4a', backgroundColor: '#0a0e1a' }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Collateral Required
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Source</span>
                    <span style={{ color: '#f1f5f9' }}>{underlying} Holdings ({qty} {underlying})</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Required</span>
                    <span style={{ color: '#f1f5f9' }}>1.0 {underlying} ({fmt(currentPrice, 0)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Available Buffer</span>
                    <span style={{ color: '#22c55e' }}>{(qty - 1).toFixed(1)} {underlying}</span>
                  </div>
                </div>

                <div className="border-t pt-3" style={{ borderColor: '#1e2d4a' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: '#64748b' }}>Margin Health</span>
                    <span className="text-xs font-bold" style={{ color: '#22c55e' }}>78% · Healthy</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1e2d4a' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: '78%', backgroundColor: '#22c55e' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Required Margin', fmt(currentPrice, 0)],
                    ['Maintenance', fmt(currentPrice * 0.8, 0)],
                    ['Buffer', fmt(currentPrice * 0.2, 0)],
                    ['Buffer %', '19.98%'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs" style={{ color: '#64748b' }}>{k}</div>
                      <div className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                  >
                    Top Up
                  </button>
                  <button
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: '#1e2d4a', color: '#64748b' }}
                  >
                    Reduce
                  </button>
                </div>
              </div>

              {/* Order ticket */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ borderColor: '#1e2d4a', backgroundColor: '#0a0e1a' }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Strategy Order
                </div>

                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>{strategy}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>
                    {underlying} {selectedContract?.type?.toUpperCase()} {selectedContract ? fmt(selectedContract.strike, 0) : '—'} · {selectedExpiry}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Premium</span>
                    <span style={{ color: '#22c55e' }}>+{fmt(premium, 0)} received</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Settlement</span>
                    <span style={{ color: '#f1f5f9' }}>Cash</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                    Quantity (Contracts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={contracts}
                    onChange={e => setContracts(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a', color: '#f1f5f9' }}
                  />
                  <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                    Total premium: {fmt(premium * parseInt(contracts || '1'), 0)}
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-3 rounded-xl text-sm font-bold tracking-wide"
                  style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                >
                  Preview Order
                </button>
              </div>

              <p className="text-xs text-center" style={{ color: '#64748b' }}>
                Derivatives involve substantial risk. Only qualified purchasers eligible. Subject to ISDA agreement.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Confirmation Modal ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a' }}
          >
            <div className="text-lg font-bold mb-5" style={{ color: '#f1f5f9' }}>
              Confirm Derivatives Order
            </div>

            <div className="space-y-3 mb-5">
              {[
                ['Strategy', strategy],
                ['Account', selectedAccount.name],
                ['Underlying', `${underlying}/USD`],
                ['Contract', selectedContract ? `${underlying} ${selectedContract.type.toUpperCase()} ${fmt(selectedContract.strike, 0)} ${selectedExpiry}` : '—'],
                ['Contracts', contracts],
                ['Premium Credit', fmt(premium * parseInt(contracts || '1'), 0)],
                ['Collateral', `1.0 ${underlying} (${fmt(currentPrice, 0)})`],
                ['Settlement', 'Cash · European Exercise'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ color: '#f1f5f9' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Risk/reward table */}
            <div
              className="rounded-lg p-3 mb-4 space-y-2"
              style={{ backgroundColor: '#0a0e1a', border: '1px solid #1e2d4a' }}
            >
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Risk / Reward</div>
              {[
                ['Max Gain', maxGain === Infinity ? 'Unlimited' : fmt(maxGain, 0), '#22c55e'],
                ['Max Loss', fmt(Math.abs(maxLoss), 0), '#ef4444'],
                ['Breakeven', fmt(breakeven, 0), '#f1f5f9'],
                ['Margin Impact', fmt(currentPrice, 0), '#f59e0b'],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ color: c, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Legal disclosure */}
            <div
              className="rounded-lg p-3 mb-5 text-xs"
              style={{ backgroundColor: 'rgba(245,158,11,0.05)', color: '#f59e0b', borderLeft: '3px solid #f59e0b' }}
            >
              <div className="font-semibold mb-1">Legal Disclosure</div>
              By confirming, you acknowledge this transaction is governed by your ISDA Master Agreement and applicable Schedule. Derivatives involve significant risk including total loss. This instrument is available only to Qualified Purchasers as defined under the Investment Company Act.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold border"
                style={{ borderColor: '#1e2d4a', color: '#64748b' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold"
                style={{ backgroundColor: '#3b82f6', color: '#fff' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
