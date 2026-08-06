import { useState } from 'react'
import type { Range } from './types'
import { useAssetData } from './hooks/useAssetData'
import { FilterBar } from './components/FilterBar'
import { AssetCard } from './components/AssetCard'

export default function App() {
  const [range, setRange] = useState<Range>('6mo')
  const { assets, loading, athLoading, refresh } = useAssetData(range)

  const refreshLabel = loading
    ? 'Chargement...'
    : athLoading
      ? 'ATH en cours...'
      : 'Actualiser'

  return (
    <div className="app">
      <header className="app-header">
        <h1>Invest</h1>
        <div className="app-controls">
          <FilterBar range={range} onChange={setRange} />
          <button
            className="refresh-btn"
            onClick={refresh}
            disabled={loading || athLoading}
            title={refreshLabel}
          >
            {loading || athLoading ? '…' : '⟳'}
          </button>
        </div>
      </header>
      <div className="grid">
        {assets.map(a => (
          <AssetCard key={a.id} {...a} loading={loading} />
        ))}
      </div>
    </div>
  )
}
