import type { Range } from '../types'

type Props = {
  range: Range
  onChange: (r: Range) => void
}

const RANGES: Range[] = ['6mo', '1y', '3y', '5y']

export function FilterBar({ range, onChange }: Props) {
  return (
    <div className="filter-bar">
      {RANGES.map(r => (
        <button key={r} className={r === range ? 'active' : ''} onClick={() => onChange(r)}>
          {r}
        </button>
      ))}
    </div>
  )
}
