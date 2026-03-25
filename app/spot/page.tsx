'use client'

import { useState, useEffect } from 'react'
import { mockAssets, mockAccounts } from '@/lib/mockData'
import { Asset, Account, OrderSide, OrderType, TimeInForce } from '@/lib/types'

// ── helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number, decimals = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)

const fmtNum = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)

const fmtBig = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return fmt(n)
}

// ── order-book generator ────────────────────────────────────────────────────
function generateOrderBook(price: number) {
  const asks = Array.from({ length: 10 }, (_, i) => {
    const p = price * (1 + (i + 1) * 0.0007)
    const size = parseFloat((Math.random() * 3 + 0.1).toFixed(4))
    return { price: p, size }
  }).reverse()

  const bids = Array.from({ length: 10 }, (_, i) => {
    const p = price * (1 - (i + 1) * 0.0007)
    const size = parseFloat((Math.random() * 3 + 0.1).toFixed(4))
    return { price: p, size }
  })

  const maxSize = Math.max(...asks.map(a => a.size), ...bids.map(b => b.size))
  return { asks, bids, maxSize }
}

// ── recent trades generator ─────────────────────────────────────────────────
function generateRecentTrades(price: number) {
  const now = new Date()
  return Array.from({ length: 8 }, (_, i) => {
    const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell'
    const p = price * (1 + (Math.random() - 0.5) * 0.002)
    const qty = parseFloat((Math.random() * 2 + 0.01).toFixed(4))
    const t = new Date(now.getTime() - i * 15000)
    const hh = t.getHours().toString().padStart(2, '0')
    const mm = t.getMinutes().toString().padStart(2, '0')
    const ss = t.getSeconds().toString().padStart(2, '0')
    return { side, price: p, qty, time: `${hh}:${mm}:${ss}` }
  })
}

// ── order status stepper ────────────────────────────────────────────────────
type OrderFlowState = 'idle' | 'review' | 'submitted' | 'accepted' | 'working' | 'filled'
const ORDER_STEPS: OrderFlowState[] = ['submitted', 'accepted', 'working', 'filled']

function OrderStatusStepper({ state }: { state: OrderFlowState }) {
  const stepIdx = ORDER_STEPS.indexOf(state)
  return (
    <div className="mt-4">
      <div className="flex items-center gap-0">
        {ORDER_STEPS.map((step, i) => {
          const done = i < stepIdx
          const active = i === stepIdx
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                  style={{
                    borderColor: done || active ? '#3b82f6' : '#1e2d4a',
                    backgroundColor: done ? '#3b82f6' : active ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: done ? '#fff' : active ? '#3b82f6' : '#64748b',
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span
                  className="text-xs mt-1 capitalize"
                  style={{ color: active ? '#f1f5f9' : done ? '#3b82f6' : '#64748b' }}
                >
                  {step}
                </span>
              </div>
              {i < ORDER_STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1 transition-all"
                  style={{ backgroundColor: done ? '#3b82f6' : '#1e2d4a' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── main page ───────────────────────────────────────────────────────────────
export default function SpotPage() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(mockAssets[0])
  const [search, setSearch] = useState('')
  const [side, setSide] = useState<OrderSide>('buy')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [triggerPrice, setTriggerPrice] = useState('')
  const [tif, setTif] = useState<TimeInForce>('GTC')
  const [gtdDate, setGtdDate] = useState('')
  const [solicitation, setSolicitation] = useState<'solicited' | 'unsolicited'>('unsolicited')
  const [selectedAccount, setSelectedAccount] = useState<Account>(mockAccounts[0])
  const [quantityMode, setQuantityMode] = useState<'base' | 'quote'>('base')
  const [orderFlow, setOrderFlow] = useState<OrderFlowState>('idle')
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(mockAssets[0].price))
  const [recentTrades, setRecentTrades] = useState(() => generateRecentTrades(mockAssets[0].price))
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    setOrderBook(generateOrderBook(selectedAsset.price))
    setRecentTrades(generateRecentTrades(selectedAsset.price))
  }, [selectedAsset])

  const filteredAssets = mockAssets.filter(
    a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.symbol.toLowerCase().includes(search.toLowerCase())
  )

  const qty = parseFloat(quantity) || 0
  const effectivePrice =
    orderType === 'market'
      ? selectedAsset.price
      : parseFloat(limitPrice) || selectedAsset.price
  const tradeValue = quantityMode === 'base' ? qty * effectivePrice : qty
  const baseQty = quantityMode === 'base' ? qty : qty / effectivePrice
  const fee = tradeValue * 0.0025
  const total = tradeValue + fee

  // run order state machine
  function advanceOrderFlow(state: OrderFlowState) {
    setOrderFlow(state)
    const next: Record<string, OrderFlowState | null> = {
      submitted: 'accepted',
      accepted: 'working',
      working: 'filled',
      filled: null,
    }
    if (next[state]) {
      setTimeout(() => advanceOrderFlow(next[state] as OrderFlowState), 1800)
    }
  }

  function handleSubmit() {
    const id = `ORD-${Math.floor(8900 + Math.random() * 99)}`
    setOrderId(id)
    setOrderFlow('review')
  }

  function handleConfirm() {
    advanceOrderFlow('submitted')
  }

  function handleReset() {
    setOrderFlow('idle')
    setQuantity('')
    setLimitPrice('')
    setTriggerPrice('')
  }

  const settlementTime = new Date(Date.now() + 86400000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Left: Asset List ───────────────────────────────── */}
      <aside
        className="w-1/4 flex flex-col border-r overflow-hidden"
        style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629' }}
      >
        <div className="p-4 border-b" style={{ borderColor: '#1e2d4a' }}>
          <input
            type="text"
            placeholder="Search assets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{
              backgroundColor: '#0a0e1a',
              borderColor: '#1e2d4a',
              color: '#f1f5f9',
            }}
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filteredAssets.map(asset => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              className="w-full px-4 py-3 flex items-center gap-3 border-b text-left transition-colors hover:bg-opacity-50"
              style={{
                borderColor: '#1e2d4a',
                backgroundColor:
                  selectedAsset.symbol === asset.symbol
                    ? 'rgba(59,130,246,0.1)'
                    : 'transparent',
                borderLeft:
                  selectedAsset.symbol === asset.symbol
                    ? '3px solid #3b82f6'
                    : '3px solid transparent',
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
              >
                {asset.logoSymbol}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>
                    {asset.symbol}
                  </span>
                  <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>
                    {asset.price >= 1000
                      ? fmt(asset.price, 0)
                      : asset.price >= 1
                      ? fmt(asset.price, 2)
                      : fmt(asset.price, 4)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-0.5">
                  <span className="text-xs" style={{ color: '#64748b' }}>
                    {asset.name}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: asset.change24h >= 0 ? '#22c55e' : '#ef4444' }}
                  >
                    {asset.change24h >= 0 ? '▲' : '▼'}{' '}
                    {Math.abs(asset.change24h).toFixed(2)}%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Center: Market Data ────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto" style={{ width: '45%' }}>
        {/* Price header */}
        <div
          className="p-5 border-b"
          style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629' }}
        >
          <div className="flex items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
                >
                  {selectedAsset.logoSymbol}
                </span>
                <span className="text-lg font-bold" style={{ color: '#f1f5f9' }}>
                  {selectedAsset.name}
                </span>
                <span className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: '#1e2d4a', color: '#64748b' }}>
                  {selectedAsset.symbol}/USD
                </span>
              </div>
              <div className="text-4xl font-bold tracking-tight" style={{ color: '#f1f5f9' }}>
                {selectedAsset.price >= 1 ? fmt(selectedAsset.price, 2) : fmt(selectedAsset.price, 4)}
              </div>
            </div>
            <span
              className="mb-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor:
                  selectedAsset.change24h >= 0
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(239,68,68,0.15)',
                color: selectedAsset.change24h >= 0 ? '#22c55e' : '#ef4444',
              }}
            >
              {selectedAsset.change24h >= 0 ? '▲' : '▼'} {Math.abs(selectedAsset.change24h).toFixed(2)}% 24h
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            {[
              { label: '24h High', value: fmt(selectedAsset.price * 1.023, 2) },
              { label: '24h Low', value: fmt(selectedAsset.price * 0.971, 2) },
              { label: '24h Volume', value: fmtBig(selectedAsset.volume24h) },
              { label: 'Market Cap', value: fmtBig(selectedAsset.marketCap) },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-xs" style={{ color: '#64748b' }}>{stat.label}</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color: '#f1f5f9' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order book + Recent trades */}
        <div className="flex flex-1 gap-0 overflow-hidden">
          {/* Order book */}
          <div className="flex-1 p-4 overflow-y-auto border-r" style={{ borderColor: '#1e2d4a' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>
              Order Book
            </div>
            {/* Asks */}
            <div className="space-y-0.5 mb-1">
              {orderBook.asks.map((ask, i) => (
                <div key={i} className="flex items-center gap-2 relative">
                  <div
                    className="absolute right-0 top-0 bottom-0 rounded-sm"
                    style={{
                      width: `${(ask.size / orderBook.maxSize) * 100}%`,
                      backgroundColor: 'rgba(239,68,68,0.1)',
                    }}
                  />
                  <span className="text-xs w-24 font-mono relative z-10" style={{ color: '#ef4444' }}>
                    {fmt(ask.price, selectedAsset.price >= 100 ? 0 : 4)}
                  </span>
                  <span className="text-xs flex-1 text-right font-mono relative z-10" style={{ color: '#64748b' }}>
                    {ask.size.toFixed(4)} {selectedAsset.symbol}
                  </span>
                </div>
              ))}
            </div>
            {/* Spread */}
            <div className="py-1.5 text-center text-xs font-semibold" style={{ color: '#3b82f6' }}>
              {fmt(selectedAsset.price, selectedAsset.price >= 100 ? 0 : 4)} — Spread: {fmt(selectedAsset.price * 0.0007 * 2, 2)}
            </div>
            {/* Bids */}
            <div className="space-y-0.5">
              {orderBook.bids.map((bid, i) => (
                <div key={i} className="flex items-center gap-2 relative">
                  <div
                    className="absolute right-0 top-0 bottom-0 rounded-sm"
                    style={{
                      width: `${(bid.size / orderBook.maxSize) * 100}%`,
                      backgroundColor: 'rgba(34,197,94,0.1)',
                    }}
                  />
                  <span className="text-xs w-24 font-mono relative z-10" style={{ color: '#22c55e' }}>
                    {fmt(bid.price, selectedAsset.price >= 100 ? 0 : 4)}
                  </span>
                  <span className="text-xs flex-1 text-right font-mono relative z-10" style={{ color: '#64748b' }}>
                    {bid.size.toFixed(4)} {selectedAsset.symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent trades */}
          <div className="w-52 p-4 overflow-y-auto flex-shrink-0">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>
              Recent Trades
            </div>
            <div className="space-y-1.5">
              {recentTrades.map((trade, i) => (
                <div key={i} className="grid grid-cols-3 gap-1 text-xs font-mono">
                  <span style={{ color: '#64748b' }}>{trade.time}</span>
                  <span
                    style={{ color: trade.side === 'buy' ? '#22c55e' : '#ef4444' }}
                  >
                    {fmt(trade.price, selectedAsset.price >= 100 ? 0 : 4)}
                  </span>
                  <span className="text-right" style={{ color: '#64748b' }}>
                    {trade.qty.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclosure */}
        <div className="px-4 py-3 border-t text-xs" style={{ borderColor: '#1e2d4a', color: '#64748b' }}>
          Prices are indicative and for informational purposes only. Quotes are not guaranteed and may differ at execution. Past performance is not indicative of future results. Crypto assets involve substantial risk of loss.
        </div>
      </main>

      {/* ── Right: Order Ticket ────────────────────────────── */}
      <aside
        className="w-[30%] flex-shrink-0 border-l overflow-y-auto"
        style={{ borderColor: '#1e2d4a', backgroundColor: '#0f1629' }}
      >
        {/* Order flow states */}
        {orderFlow !== 'idle' && orderFlow !== 'review' ? (
          <div className="p-5">
            <div className="text-sm font-bold mb-4" style={{ color: '#f1f5f9' }}>
              Order {orderId}
            </div>
            <OrderStatusStepper state={orderFlow} />

            {orderFlow === 'filled' && (
              <div
                className="mt-6 p-4 rounded-xl border"
                style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: '#22c55e' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✓</span>
                  <span className="font-bold text-sm" style={{ color: '#22c55e' }}>
                    Order Filled
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Fill Price</span>
                    <span style={{ color: '#f1f5f9' }}>{fmt(effectivePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Quantity</span>
                    <span style={{ color: '#f1f5f9' }}>
                      {baseQty.toFixed(4)} {selectedAsset.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Total</span>
                    <span style={{ color: '#f1f5f9' }}>{fmt(total)}</span>
                  </div>
                  <div
                    className="mt-3 pt-3 border-t"
                    style={{ borderColor: '#1e2d4a' }}
                  >
                    <div className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
                      SETTLEMENT
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: '#f59e0b' }}
                      />
                      <span className="text-xs" style={{ color: '#f1f5f9' }}>
                        T+1 Settlement — Est. {settlementTime}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 w-full py-2 rounded-lg text-sm font-semibold border transition-colors"
                  style={{
                    borderColor: '#3b82f6',
                    color: '#3b82f6',
                    backgroundColor: 'transparent',
                  }}
                >
                  Place Another Order
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Review modal overlay */}
            {orderFlow === 'review' && (
              <div className="p-5">
                <div className="text-sm font-bold mb-4" style={{ color: '#f1f5f9' }}>
                  Review Order
                </div>
                <div
                  className="rounded-xl border p-4 mb-4 space-y-3"
                  style={{ borderColor: '#1e2d4a', backgroundColor: '#0a0e1a' }}
                >
                  {[
                    ['Account', selectedAccount.name],
                    ['Asset', `${selectedAsset.symbol}/USD`],
                    ['Side', side.toUpperCase()],
                    ['Type', orderType.toUpperCase()],
                    ['Quantity', `${baseQty.toFixed(4)} ${selectedAsset.symbol}`],
                    ['Price', orderType === 'market' ? 'Market' : fmt(parseFloat(limitPrice) || 0)],
                    ['Time in Force', tif],
                    ['Solicitation', solicitation],
                    ['Est. Value', fmt(tradeValue)],
                    ['Fee (0.25%)', fmt(fee)],
                    ['Total', fmt(total)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span style={{ color: '#64748b' }}>{k}</span>
                      <span
                        style={{
                          color:
                            k === 'Side'
                              ? side === 'buy'
                                ? '#22c55e'
                                : '#ef4444'
                              : '#f1f5f9',
                          fontWeight: k === 'Total' ? 700 : 400,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-lg p-3 mb-4 text-xs"
                  style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#f59e0b', borderLeft: '3px solid #f59e0b' }}
                >
                  <div className="font-semibold mb-1">Risk Disclosure</div>
                  Cryptocurrency trading involves substantial risk of loss. Prices are highly volatile and you may lose some or all of your investment. This order will be executed on a principal basis by Anchor Wealth Trading Desk.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOrderFlow('idle')}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                    style={{ borderColor: '#1e2d4a', color: '#64748b', backgroundColor: 'transparent' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors"
                    style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                  >
                    Confirm & Submit
                  </button>
                </div>
              </div>
            )}

            {/* Normal ticket */}
            {orderFlow === 'idle' && (
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tracking-wide uppercase" style={{ color: '#64748b' }}>
                    Order Ticket
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1e2d4a', color: '#64748b' }}>
                    Principal
                  </span>
                </div>

                {/* Account */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                    Account
                  </label>
                  <select
                    value={selectedAccount.id}
                    onChange={e => setSelectedAccount(mockAccounts.find(a => a.id === e.target.value)!)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
                  >
                    {mockAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buy / Sell */}
                <div className="grid grid-cols-2 gap-2">
                  {(['buy', 'sell'] as OrderSide[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSide(s)}
                      className="py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all"
                      style={{
                        backgroundColor:
                          side === s
                            ? s === 'buy'
                              ? '#22c55e'
                              : '#ef4444'
                            : 'rgba(30,45,74,0.5)',
                        color: side === s ? '#fff' : '#64748b',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Asset pair */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                    Currency / Asset Pair
                  </label>
                  <select
                    value={selectedAsset.symbol}
                    onChange={e => setSelectedAsset(mockAssets.find(a => a.symbol === e.target.value)!)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
                  >
                    {mockAssets.map(a => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.symbol} / USD
                      </option>
                    ))}
                  </select>
                </div>

                {/* Solicitation */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                    Solicitation Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['solicited', 'unsolicited'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setSolicitation(s)}
                        className="py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border"
                        style={{
                          backgroundColor: solicitation === s ? 'rgba(59,130,246,0.15)' : 'transparent',
                          borderColor: solicitation === s ? '#3b82f6' : '#1e2d4a',
                          color: solicitation === s ? '#3b82f6' : '#64748b',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                    Order Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['market', 'limit', 'stop', 'stop-limit'] as OrderType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className="py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border"
                        style={{
                          backgroundColor: orderType === t ? 'rgba(59,130,246,0.15)' : 'transparent',
                          borderColor: orderType === t ? '#3b82f6' : '#1e2d4a',
                          color: orderType === t ? '#3b82f6' : '#64748b',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                      Quantity
                    </label>
                    <div className="flex items-center gap-1">
                      {(['base', 'quote'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setQuantityMode(m)}
                          className="text-xs px-2 py-0.5 rounded transition-all"
                          style={{
                            backgroundColor: quantityMode === m ? '#1e2d4a' : 'transparent',
                            color: quantityMode === m ? '#f1f5f9' : '#64748b',
                          }}
                        >
                          {m === 'base' ? selectedAsset.symbol : 'USD'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none pr-16"
                      style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                      style={{ color: '#64748b' }}
                    >
                      {quantityMode === 'base' ? selectedAsset.symbol : 'USD'}
                    </span>
                  </div>
                  {qty > 0 && (
                    <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                      ≈{' '}
                      {quantityMode === 'base'
                        ? fmt(qty * selectedAsset.price)
                        : `${(qty / selectedAsset.price).toFixed(6)} ${selectedAsset.symbol}`}
                    </div>
                  )}
                </div>

                {/* Limit price */}
                {(orderType === 'limit' || orderType === 'stop-limit') && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      Limit Price
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder={selectedAsset.price.toFixed(2)}
                        value={limitPrice}
                        onChange={e => setLimitPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm border outline-none pr-12"
                        style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: '#64748b' }}>
                        USD
                      </span>
                    </div>
                  </div>
                )}

                {/* Trigger price */}
                {(orderType === 'stop' || orderType === 'stop-limit') && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      Trigger Price
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={triggerPrice}
                        onChange={e => setTriggerPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm border outline-none pr-12"
                        style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: '#64748b' }}>
                        USD
                      </span>
                    </div>
                  </div>
                )}

                {/* Time in force */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                    Time in Force
                  </label>
                  <select
                    value={tif}
                    onChange={e => setTif(e.target.value as TimeInForce)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
                  >
                    {(['GTC', 'IOC', 'FOK', 'Day', 'GTD'] as TimeInForce[]).map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GTD date */}
                {tif === 'GTD' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      Expire On (Date)
                    </label>
                    <input
                      type="date"
                      value={gtdDate}
                      onChange={e => setGtdDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
                    />
                  </div>
                )}

                {/* Separator */}
                <div className="border-t" style={{ borderColor: '#1e2d4a' }} />

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#64748b' }}>Available to Trade</span>
                    <span style={{ color: '#22c55e' }}>{fmt(selectedAccount.availableToTrade)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#64748b' }}>Fee Approx. (0.25%)</span>
                    <span style={{ color: '#f1f5f9' }}>{fmt(fee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span style={{ color: '#64748b' }}>Total Approx. Cost</span>
                    <span style={{ color: '#f1f5f9' }}>{fmt(total)}</span>
                  </div>
                </div>

                {/* Restrictions warning */}
                {selectedAccount.restrictions.length > 0 && (
                  <div
                    className="p-2.5 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      color: '#f59e0b',
                      borderLeft: '3px solid #f59e0b',
                    }}
                  >
                    Account restriction: {selectedAccount.restrictions.join(', ')}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={qty === 0}
                  className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: qty > 0 ? '#3b82f6' : '#1e2d4a',
                    color: '#fff',
                  }}
                >
                  Review Order
                </button>

                <p className="text-xs text-center" style={{ color: '#64748b' }}>
                  Orders executed on a principal basis. Market hours: 24/7.
                </p>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
