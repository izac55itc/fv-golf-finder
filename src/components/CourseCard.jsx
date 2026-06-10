import { useState } from 'react'

export default function CourseCard({ item, bookingUrl, userLocation }) {
  const [cartIncluded, setCartIncluded] = useState(item.course.cartRequired ?? false)

  const handleDirections = () => {
    if (userLocation) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)

      let url
      if (isIOS) {
        // iOS: Use comgooglemaps scheme with origin & destination
        url = `comgooglemaps://?saddr=${userLocation.lat},${userLocation.lng}&daddr=${item.course.lat},${item.course.lng}&directionsmode=driving`
      } else if (isAndroid) {
        // Android: Use google.navigation scheme for full turn-by-turn directions
        url = `google.navigation:q=${item.course.lat},${item.course.lng}&origin=${userLocation.lat},${userLocation.lng}`
      } else {
        // Desktop: Use Google Maps web URL with directions API
        url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${item.course.lat},${item.course.lng}&travelmode=driving`
      }

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
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(item.course.name + ' golf course')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cal-course-name-link"
          >
            <h3 className="cal-course-name">{item.course.name}</h3>
          </a>
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
          Book Now →
        </a>
      </div>
    </div>
  )
}
