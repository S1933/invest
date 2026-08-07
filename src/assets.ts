import type { Asset } from './types'

export const assets: Asset[] = [
  { id: 'gold', label: 'Or', source: 'yahoo', symbol: 'GC=F', currency: 'USD' },
  { id: 'msci', label: 'MSCI World (via IWDA.L)', source: 'yahoo', symbol: 'IWDA.L', currency: 'USD' },
  { id: 'msci-em', label: 'MSCI EM (via EEM)', source: 'yahoo', symbol: 'EEM', currency: 'USD' },
  { id: 'stoxx', label: 'Stoxx 600', source: 'yahoo', symbol: '^STOXX', currency: 'EUR' },
  { id: 'bitcoin', label: 'Bitcoin', source: 'yahoo', symbol: 'BTC-USD', currency: 'USD' },
  { id: 'ovhcloud', label: 'OVHcloud', source: 'yahoo', symbol: 'OVH.PA', currency: 'EUR' },
]