import { Asset, Account, Order, OptionsContract, Position } from './types'

export const mockAssets: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 94250.00, change24h: 2.34, volume24h: 28500000000, marketCap: 1850000000000, logoSymbol: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 3485.50, change24h: -1.12, volume24h: 14200000000, marketCap: 420000000000, logoSymbol: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', price: 182.30, change24h: 4.67, volume24h: 3800000000, marketCap: 85000000000, logoSymbol: '◎' },
  { symbol: 'AVAX', name: 'Avalanche', price: 38.92, change24h: -0.85, volume24h: 520000000, marketCap: 16000000000, logoSymbol: 'A' },
  { symbol: 'LINK', name: 'Chainlink', price: 18.45, change24h: 1.23, volume24h: 480000000, marketCap: 11000000000, logoSymbol: '⬡' },
  { symbol: 'MATIC', name: 'Polygon', price: 0.9234, change24h: -2.18, volume24h: 290000000, marketCap: 9200000000, logoSymbol: 'M' },
]

export const mockAccounts: Account[] = [
  { id: 'ACC-001', name: 'Discretionary Managed', type: 'Managed Account', balance: 2450000, availableToTrade: 185000, restrictions: [] },
  { id: 'ACC-002', name: 'Self-Directed Crypto', type: 'Self-Directed', balance: 380000, availableToTrade: 142500, restrictions: ['No derivatives'] },
  { id: 'ACC-003', name: 'Qualified Purchaser Fund', type: 'Fund', balance: 12500000, availableToTrade: 1250000, restrictions: [] },
]

export const mockRecentOrders: Order[] = [
  { id: 'ORD-8821', timestamp: '2026-03-25T14:32:11Z', asset: 'BTC', side: 'buy', type: 'market', quantity: 0.5, price: 94100, status: 'filled', filled: 0.5, fee: 235.25, total: 47285.25 },
  { id: 'ORD-8820', timestamp: '2026-03-25T13:15:44Z', asset: 'ETH', side: 'sell', type: 'limit', quantity: 10, price: 3500, status: 'working', filled: 0, fee: 0, total: 35000 },
  { id: 'ORD-8819', timestamp: '2026-03-25T11:02:33Z', asset: 'SOL', side: 'buy', type: 'market', quantity: 100, price: 180.50, status: 'filled', filled: 100, fee: 90.25, total: 18140.25 },
  { id: 'ORD-8818', timestamp: '2026-03-24T16:45:22Z', asset: 'BTC', side: 'sell', type: 'limit', quantity: 0.25, price: 95000, status: 'canceled', filled: 0, fee: 0, total: 23750 },
  { id: 'ORD-8817', timestamp: '2026-03-24T10:20:15Z', asset: 'ETH', side: 'buy', type: 'market', quantity: 5, price: 3450, status: 'filled', filled: 5, fee: 86.25, total: 17336.25 },
]

export const mockBTCOptions: OptionsContract[] = [
  // Calls
  { strike: 90000, expiry: '2026-04-25', type: 'call', bid: 5820, ask: 5940, iv: 0.68, delta: 0.72, gamma: 0.00002, theta: -48.5, vega: 185.2, openInterest: 1240, volume: 342 },
  { strike: 92500, expiry: '2026-04-25', type: 'call', bid: 4210, ask: 4350, iv: 0.65, delta: 0.62, gamma: 0.00003, theta: -52.1, vega: 198.4, openInterest: 2180, volume: 518 },
  { strike: 95000, expiry: '2026-04-25', type: 'call', bid: 2840, ask: 2960, iv: 0.63, delta: 0.49, gamma: 0.00004, theta: -55.8, vega: 210.6, openInterest: 3420, volume: 892 },
  { strike: 97500, expiry: '2026-04-25', type: 'call', bid: 1680, ask: 1780, iv: 0.61, delta: 0.36, gamma: 0.00003, theta: -51.2, vega: 195.3, openInterest: 2890, volume: 654 },
  { strike: 100000, expiry: '2026-04-25', type: 'call', bid: 890, ask: 960, iv: 0.59, delta: 0.24, gamma: 0.00002, theta: -44.8, vega: 172.1, openInterest: 1950, volume: 423 },
  { strike: 105000, expiry: '2026-04-25', type: 'call', bid: 290, ask: 330, iv: 0.58, delta: 0.12, gamma: 0.00001, theta: -32.4, vega: 138.5, openInterest: 890, volume: 198 },
  // Puts
  { strike: 90000, expiry: '2026-04-25', type: 'put', bid: 1450, ask: 1520, iv: 0.70, delta: -0.28, gamma: 0.00002, theta: -46.2, vega: 178.9, openInterest: 980, volume: 287 },
  { strike: 92500, expiry: '2026-04-25', type: 'put', bid: 2380, ask: 2460, iv: 0.67, delta: -0.38, gamma: 0.00003, theta: -50.4, vega: 192.6, openInterest: 1640, volume: 412 },
  { strike: 95000, expiry: '2026-04-25', type: 'put', bid: 3620, ask: 3740, iv: 0.64, delta: -0.51, gamma: 0.00004, theta: -54.1, vega: 208.3, openInterest: 2280, volume: 621 },
  { strike: 97500, expiry: '2026-04-25', type: 'put', bid: 5190, ask: 5320, iv: 0.62, delta: -0.64, gamma: 0.00003, theta: -49.8, vega: 189.7, openInterest: 1820, volume: 489 },
]

export const mockPositions: Position[] = [
  { id: 'POS-001', asset: 'BTC', side: 'long', quantity: 1.5, entryPrice: 88500, currentPrice: 94250, pnl: 8625, pnlPercent: 6.50, type: 'spot' },
  { id: 'POS-002', asset: 'ETH', side: 'long', quantity: 25, entryPrice: 3200, currentPrice: 3485.50, pnl: 7137.5, pnlPercent: 8.92, type: 'spot' },
  { id: 'POS-003', asset: 'BTC', side: 'long', quantity: 1, entryPrice: 94250, currentPrice: 94250, pnl: -2840, pnlPercent: -3.01, type: 'option', strategy: 'Covered Call', expiry: '2026-04-25', strike: 97500, optionType: 'call' },
]

export const expiryDates = ['2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25', '2026-05-30', '2026-06-27']
