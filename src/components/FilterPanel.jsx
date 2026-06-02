import RangeSlider from './RangeSlider.jsx'

export default function FilterPanel({
  quickTimes, onQuickTime,
  timeRange, onTimeRange,
  maxGreenfee, onMaxGreenfee,
  maxDriveMin, onMaxDriveMin,
  playerCount, onPlayerCount,
  courseOptions, selectedCourses, onToggleCourse, onSelectAllCourses,
}) {
  const isActiveQuick = (qt) => {
    return timeRange[0] === qt.fromH && timeRange[1] === qt.toH
  }

  const formatHour = (h) => {
    if (h < 12) return `${h}am`
    if (h === 12) return '12pm'
    return `${h - 12}pm`
  }

  return (
    <div className="filter-panel">
      {/* Row 1: Quick time buttons + hour range slider */}
      <div className="filter-row">
        <div className="filter-section">
          <span className="filter-label">Time of Day</span>
          <div className="quick-time-btns">
            {quickTimes.map(qt => (
              <button
                key={qt.label}
                className={`refresh-btn quick-time-btn ${isActiveQuick(qt) ? 'quick-time-active' : ''}`}
                onClick={() => onQuickTime(qt)}
              >
                {qt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">Hour Range</span>
          <RangeSlider
            min={6}
            max={23}
            value={timeRange}
            onChange={onTimeRange}
            formatLabel={formatHour}
          />
        </div>
      </div>

      {/* Row 2: Green fee, Drive time, Player count */}
      <div className="filter-row">
        <div className="filter-section">
          <span className="filter-label">Max Green Fee: ${maxGreenfee}</span>
          <input type="range" min={0} max={120} step={5} value={maxGreenfee}
            onChange={e => onMaxGreenfee(+e.target.value)}
            className="single-slider" />
        </div>

        <div className="filter-section">
          <span className="filter-label">Max Drive: {maxDriveMin}m</span>
          <input type="range" min={5} max={60} step={5} value={maxDriveMin}
            onChange={e => onMaxDriveMin(+e.target.value)}
            className="single-slider" />
        </div>

        <div className="filter-section">
          <span className="filter-label">Players</span>
          <div className="player-btns">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                className={`player-btn ${playerCount === n ? 'player-btn-active' : ''}`}
                onClick={() => onPlayerCount(n)}
              >{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Course selector */}
      <div className="filter-section filter-section-courses">
        <div className="filter-label-row">
          <span className="filter-label">Courses</span>
          <button className="refresh-btn" onClick={onSelectAllCourses}>
            {selectedCourses === null ? 'All' : `${selectedCourses.size} selected`}
          </button>
        </div>
        <div className="course-pills">
          {courseOptions.map(c => {
            const active = selectedCourses === null || selectedCourses.has(c.id)
            return (
              <button
                key={c.id}
                className={`course-pill ${active ? 'course-pill-active' : ''}`}
                onClick={() => onToggleCourse(c.id)}
              >{c.name}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
