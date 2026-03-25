export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit' | 'stop' | 'stop-limit' | 'twap'
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'Day' | 'GTD'
export type OrderStatus = 'submitted' | 'accepted' | 'working' | 'filled' | 'partially_filled' | 'rejected' | 'canceled'
export type SolicitationStatus = 'solicited' | 'unsolicited'

export interface Asset {
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  logoSymbol: string
}

export interface Account {
  id: string
  name: string
  type: string
  balance: number
  availableToTrade: number
  restrictions: string[]
}

export interface Order {
  id: string
  timestamp: string
  asset: string
  side: OrderSide
  type: OrderType
  quantity: number
  price: number
  status: OrderStatus
  filled: number
  fee: number
  total: number
}

export interface OptionsContract {
  strike: number
  expiry: string
  type: 'call' | 'put'
  bid: number
  ask: number
  iv: number
  delta: number
  gamma: number
  theta: number
  vega: number
  openInterest: number
  volume: number
}

export interface Position {
  id: string
  asset: string
  side: 'long' | 'short'
  quantity: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  type: 'spot' | 'option' | 'perp'
  strategy?: string
  expiry?: string
  strike?: number
  optionType?: 'call' | 'put'
}
