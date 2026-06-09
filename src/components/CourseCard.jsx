import { useState } from 'react'

export default function CourseCard({ item, bookingUrl, userLocation }) {
  const [cartIncluded, setCartIncluded] = useState(item.course.cartRequired ?? false)

  const handleDirections = () => {
    if (userLocation) {
      const url = `https://maps.google.com/maps?dir=${userLocation.lat},${userLocation.lng}/${item.course.lat},${item.course.lng}`
      window.open(url, '_blank')
    }
  }

  const handleCartToggle = () => {
    if (item.cartCost !== null && item.cartCost > 0) {
      setCartIncluded(!cartIncluded)
    }
  }

  const displayTotal = cartIncluded ? item.totalCost : (item.totalCost - (item.cartCost || 0))

  return (
    <div className="cal-course-card">
      <div className="cal-card-header">
        <div className="cal-course-info">
          <h3 className="cal-course-name">{item.course.name}</h3>
          <div className="cal-course-details">
            {item.course.location} • {item.course.holes} holes •
            <span
              onClick={handleDirections}
              className={`cal-drive-time ${userLocation ? 'cal-drive-clickable' : ''}`}
            >
              🚗 {item.driveMinutes}m
            </span>
          </div>
        </div>
        <div className="cal-badges">
          {item.hasHotDeals && <span className="cal-badge-deals">🔥 Deal</span>}
          {item.availableCount < 10 && <span className="cal-badge-busy">⏰ Busy</span>}
          {item.availableCount >= 20 && <span className="cal-badge-open">✓ Open</span>}
        </div>
      </div>

      <div className="cal-card-pricing">
        <div className="cal-price-section fee">
          <div className="cal-price-label">⛳ Green Fee</div>
          <div className="cal-price-value">
            ${item.minPrice.toFixed(2)}–${item.maxPrice.toFixed(2)}
          </div>
        </div>

        <div className="cal-price-section gas">
          <div className="cal-price-label">⛽ Gas</div>
          <div className="cal-price-value">${item.gasCost.toFixed(2)}</div>
        </div>

        <div className="cal-price-section cart">
          <div className="cal-price-label">🚙 Cart</div>
          {item.cartCost === null ? (
            <div className="cal-price-value">NA</div>
          ) : (
            <div
              className={`cal-price-value cal-cart-toggle ${cartIncluded ? 'cal-cart-active' : 'cal-cart-inactive'}`}
              onClick={handleCartToggle}
            >
              ${item.cartCost.toFixed(2)}
            </div>
          )}
        </div>

        <div className="cal-price-section total">
          <div className="cal-price-label">💰 Total</div>
          <div className="cal-price-value">${displayTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="cal-card-meta">
        <div className="cal-holes-info">
          🌅 {item.sunset.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })} • Start by {item.latestStart.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })} PDT
        </div>
        <div className="cal-weather-group">
          {item.weatherMorning && (
            <div className="cal-weather-period">
              <span className="cal-weather-time">8am</span>
              <span>{item.weatherMorning.icon} {item.weatherMorning.temp}°C</span>
            </div>
          )}
          {item.weatherAfternoon && (
            <div className="cal-weather-period">
              <span className="cal-weather-time">2pm</span>
              <span>{item.weatherAfternoon.icon} {item.weatherAfternoon.temp}°C</span>
            </div>
          )}
          {item.weatherTwilight && (
            <div className="cal-weather-period">
              <span className="cal-weather-time">5pm</span>
              <span>{item.weatherTwilight.icon} {item.weatherTwilight.temp}°C</span>
            </div>
          )}
          {(item.weatherMorning?.windspeed > 20 ||
            item.weatherAfternoon?.windspeed > 20 ||
            item.weatherTwilight?.windspeed > 20) && (
            <span className="cal-wind-warning">⚠️ Windy</span>
          )}
        </div>
      </div>

      <div className="cal-card-footer">
        <div className="cal-availability">{item.availableCount} slots</div>
        <a
          href={bookingUrl(item.course)}
          target="_blank"
          rel="noopener noreferrer"
          className="cal-book-btn"
        >
          Book on GolfNow →
        </a>
      </div>
    </div>
  )
}
