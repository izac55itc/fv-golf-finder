import RangeSlider from './RangeSlider.jsx'

export default function FilterPanel({
  maxGreenfee, onMaxGreenfee,
  maxDriveMin, onMaxDriveMin,
}) {
  return (
    <div className="filter-panel">
      <div className="filter-row">
        <div className="filter-section">
          <span className="filter-label">Max Total Cost</span>
          <div className="price-filter-wrapper">
            <RangeSlider
              min={0}
              max={300}
              value={[0, maxGreenfee]}
              onChange={(range) => onMaxGreenfee(range[1])}
              formatLabel={(v) => `$${v}`}
            />
            <div className="price-display">${maxGreenfee}</div>
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">Max Drive</span>
          <div className="price-filter-wrapper">
            <RangeSlider
              min={0}
              max={120}
              value={[0, maxDriveMin]}
              onChange={(range) => onMaxDriveMin(range[1])}
              formatLabel={(v) => `${v}m`}
            />
            <div className="price-display">{maxDriveMin}m</div>
          </div>
        </div>
      </div>
    </div>
  )
}
