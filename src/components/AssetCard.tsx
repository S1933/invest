import type { DataPoint } from '../types'
import { Chart } from './Chart'

type Props = {
  label: string
  currency: string
  data: DataPoint[]
  error: string | null
  loading: boolean
  fetchedAt: number | null
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function AssetCard({ label, currency, data, error, loading, fetchedAt }: Props) {
  const hasData = data.length > 0
  const lastPrice = hasData ? data[data.length - 1].price : null
  const firstPrice = hasData ? data[0].price : null
  const change = lastPrice !== null && firstPrice !== null
    ? ((lastPrice - firstPrice) / firstPrice * 100)
    : null

  // Highest point of the selected range: its date, and how far the current
  // price sits below it (the variation since that high).
  const high = hasData ? data.reduce((best, point) => (point.price > best.price ? point : best), data[0]) : null
  const sinceHigh = high !== null && lastPrice !== null
    ? ((lastPrice - high.price) / high.price * 100)
    : null
  const highDate = high !== null
    ? new Date(high.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-label">{label}</span>
        <span className="card-currency">{currency}</span>
      </div>

      {!hasData && loading && <div className="card-status">Chargement...</div>}

      {!hasData && !loading && !error && (
        <div className="card-status">
          Aucune donnée.<br />
          Cliquer sur ⟳ pour charger.
        </div>
      )}

      {!hasData && error && <div className="card-status error">{error}</div>}

      {hasData && (
        <>
          <div className="card-change" data-positive={change !== null && change >= 0}>
            {change !== null ? formatPercent(change) : '—'}
          </div>
          {sinceHigh !== null && (
            <div className="card-high">
              <span className="card-high-label">Plus haut {highDate}</span>
              <span className="card-high-gap" data-negative={sinceHigh < 0}>
                {formatPercent(sinceHigh)} depuis
              </span>
            </div>
          )}
          <Chart data={data} color={change !== null && change >= 0 ? '#57ff8a' : '#ff5f56'} />
          {error && <div className="card-warning">⚠ {error}</div>}
          {fetchedAt && (
            <div className="card-meta">
              Données du {new Date(fetchedAt).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
