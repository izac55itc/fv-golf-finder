import RangeSlider from './RangeSlider.jsx'

export default function FilterPanel({
  maxGreenfee, onMaxGreenfee,
  courseOptions, selectedCourses, onToggleCourse, onSelectAllCourses,
}) {
  return (
    <div className="filter-panel">
      {/* Price filter */}
      <div className="filter-row">
        <div className="filter-section">
          <span className="filter-label">Max Price</span>
          <div className="price-filter-wrapper">
            <RangeSlider
              min={0}
              max={200}
              value={[0, maxGreenfee]}
              onChange={(range) => onMaxGreenfee(range[1])}
              formatLabel={(v) => `$${v}`}
            />
            <div className="price-display">${maxGreenfee}</div>
          </div>
        </div>
      </div>

      {/* Course selector */}
      <div className="filter-row">
        <div className="filter-section">
          <div className="filter-label-row">
            <span className="filter-label">Courses</span>
            <button
              className="select-all-btn"
              onClick={onSelectAllCourses}
            >
              All
            </button>
          </div>
          <div className="course-selector">
            {courseOptions.map(course => (
              <label key={course.id} className="course-checkbox">
                <input
                  type="checkbox"
                  checked={selectedCourses === null || selectedCourses.has(course.id)}
                  onChange={() => onToggleCourse(course.id)}
                />
                <span>{course.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
