'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { mockAccounts } from '@/lib/mockData'
import { Account } from '@/lib/types'

const tabs = [
  { label: 'Spot Trading', href: '/spot' },
  { label: 'Derivatives', href: '/derivatives' },
  { label: 'Positions', href: '/positions' },
  { label: 'Order History', href: '/history' },
]

export default function Navigation() {
  const pathname = usePathname()
  const [selectedAccount, setSelectedAccount] = useState<Account>(mockAccounts[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

  return (
    <nav
      className="flex items-center justify-between px-6 h-16 border-b"
      style={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: '#3b82f6', color: '#fff' }}
          >
            AW
          </div>
          <div>
            <div className="font-bold text-sm tracking-widest" style={{ color: '#f1f5f9' }}>
              ANCHOR WEALTH
            </div>
            <div className="text-xs tracking-wider" style={{ color: '#64748b' }}>
              Trading Desk
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: isActive ? '#3b82f6' : '#64748b',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Account selector */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-xs" style={{ color: '#64748b' }}>Available to Trade</div>
          <div className="font-bold text-sm" style={{ color: '#22c55e' }}>
            {formatCurrency(selectedAccount.availableToTrade)}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg border text-sm transition-colors"
            style={{ backgroundColor: '#0a0e1a', borderColor: '#1e2d4a', color: '#f1f5f9' }}
          >
            <div className="text-left">
              <div className="font-medium">{selectedAccount.name}</div>
              <div className="text-xs" style={{ color: '#64748b' }}>
                {selectedAccount.id} · {selectedAccount.type}
              </div>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: '#64748b' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-80 rounded-lg border shadow-2xl z-50"
              style={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a' }}
            >
              {mockAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => { setSelectedAccount(account); setDropdownOpen(false) }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-opacity-50 transition-colors border-b last:border-b-0"
                  style={{
                    borderColor: '#1e2d4a',
                    backgroundColor: account.id === selectedAccount.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                  }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{account.name}</div>
                    <div className="text-xs" style={{ color: '#64748b' }}>
                      {account.id} · {account.type}
                    </div>
                    {account.restrictions.length > 0 && (
                      <div className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                        {account.restrictions.join(' · ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                      {formatCurrency(account.balance)}
                    </div>
                    <div className="text-xs" style={{ color: '#22c55e' }}>
                      {formatCurrency(account.availableToTrade)} avail.
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-xs" style={{ color: '#64748b' }}>Markets Open</span>
        </div>
      </div>
    </nav>
  )
}
