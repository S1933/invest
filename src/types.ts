export type Range = '1mo' | '6mo' | '1y' | '3y' | '5y'

export type DataPoint = {
  date: string
  price: number
}

export type Asset = {
  id: string
  label: string
  source: 'yahoo' | 'coingecko'
  symbol: string
  currency: string
}