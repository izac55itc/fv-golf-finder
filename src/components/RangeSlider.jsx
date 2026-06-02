export default function RangeSlider({ min, max, value, onChange, formatLabel }) {
  const [lo, hi] = value

  const handleLoChange = (e) => {
    const newLo = Math.min(+e.target.value, hi - 1)
    onChange([newLo, hi])
  }

  const handleHiChange = (e) => {
    const newHi = Math.max(+e.target.value, lo + 1)
    onChange([lo, newHi])
  }

  return (
    <div className="range-slider">
      <div className="range-track">
        <div
          className="range-fill"
          style={{
            left:  `${((lo - min) / (max - min)) * 100}%`,
            right: `${((max - hi) / (max - min)) * 100}%`,
          }}
        />
      </div>
      <input type="range" min={min} max={max} value={lo}
        onChange={handleLoChange} />
      <input type="range" min={min} max={max} value={hi}
        onChange={handleHiChange} />
      <div className="range-labels">
        <span>{formatLabel(lo)}</span>
        <span>{formatLabel(hi)}</span>
      </div>
    </div>
  )
}
