import type { DataPoint } from '../types'
import type { CachedAth } from '../storage'
import { Chart } from './Chart'

type Props = {
  label: string
  currency: string
  data: DataPoint[]
  error: string | null
  loading: boolean
  fetchedAt: number | null
  ath: CachedAth | null
  athError: string | null
}

export function AssetCard({ label, currency, data, error, loading, fetchedAt, ath, athError }: Props) {
  const hasData = data.length > 0
  const lastPrice = hasData ? data[data.length - 1].price : null
  const firstPrice = hasData ? data[0].price : null
  const change = lastPrice !== null && firstPrice !== null
    ? ((lastPrice - firstPrice) / firstPrice * 100)
    : null
  const fromAth = lastPrice !== null && ath !== null
    ? ((lastPrice - ath.price) / ath.price * 100)
    : null
  // When the rounded value is +0.00%, the current price is at or just above the ATH —
  // show "ATH en cours" instead of a misleading "+0.00%".
  const fromAthText = fromAth !== null
    ? (fromAth.toFixed(2) === '0.00' ? null : `${fromAth >= 0 ? '+' : ''}${fromAth.toFixed(2)}%`)
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
          {ath !== null && fromAthText !== null ? (
            <div className="card-ath" data-positive={fromAth! >= 0}>
              ATH ({ath.date}) : {fromAthText}
            </div>
          ) : ath !== null && fromAthText === null ? (
            <div className="card-ath card-ath-live" data-positive="true">
              ATH en cours ({ath.date})
            </div>
          ) : athError ? (
            <div className="card-ath-warn" title={athError}>ATH indisponible</div>
          ) : (
            <div className="card-ath-pending">ATH : en attente…</div>
          )}
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
