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

export function AssetCard({ label, currency, data, error, loading, fetchedAt }: Props) {
  const hasData = data.length > 0
  const lastPrice = hasData ? data[data.length - 1].price : null
  const firstPrice = hasData ? data[0].price : null
  const change = lastPrice !== null && firstPrice !== null
    ? ((lastPrice - firstPrice) / firstPrice * 100)
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
            {change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
          </div>
          <Chart data={data} />
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
