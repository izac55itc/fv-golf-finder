import { useState, useMemo } from 'react'
import { fuelCostDollars } from '../utils/ranker.js'

function fmtTime(date) {
  return date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDur(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function getBookingUrl(course, teeTime) {
  const dateStr = teeTime.toISOString().split('T')[0]
  if (course.golfnowId) {
    return `https://www.golfnow.com/tee-times/facility/${course.golfnowId}/search?date=${dateStr}&holes=${course.holes}&players=1&time=all`
  }
  return `https://www.google.com/search?q=${encodeURIComponent(course.name + ' tee times ' + dateStr)}`
}

const VERDICT_ORDER = { go: 0, tight: 1, skip: 2 }

const COLUMNS = [
  { key: 'course',    label: 'Course'           },
  { key: 'teetime',   label: 'Tee Time'         },
  { key: 'greenfee',  label: 'Green Fee'        },
  { key: 'totalCost', label: 'Total Cost'       },
  { key: 'drive',     label: 'Drive'            },
  { key: 'leaveIn',   label: 'Leave In'         },
  { key: 'estRound',  label: 'Est. Round'       },
  { key: 'holesDusk', label: 'Holes Before Dusk'},
  { key: 'spots',     label: 'Spots'            },
  { key: 'doneBy',    label: 'Done By'          },
  { key: 'verdict',   label: 'Verdict'          },
  { key: 'book',      label: 'Book'             },
]

function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      {COLUMNS.map((col) => (
        <td key={col.key}><span className="skeleton-cell" /></td>
      ))}
    </tr>
  )
}

export default function TeeTimeTable({ rows, loading, driveTimesReady }) {
  const [sort, setSort] = useState({ key: 'totalCost', dir: 'asc' })

  function handleSort(key) {
    if (key === 'book') return
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )
  }

  const sortedRows = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let av, bv
      switch (sort.key) {
        case 'course':    av = a.course.name.toLowerCase(); bv = b.course.name.toLowerCase(); break
        case 'teetime':   av = a.teetime.time.getTime();    bv = b.teetime.time.getTime();    break
        case 'greenfee':  av = a.teetime.greenfee;          bv = b.teetime.greenfee;          break
        case 'totalCost': av = a.teetime.greenfee + fuelCostDollars(a.driveMinutes); bv = b.teetime.greenfee + fuelCostDollars(b.driveMinutes); break
        case 'drive':     av = a.driveMinutes;              bv = b.driveMinutes;              break
        case 'leaveIn':   av = a.leaveInMinutes;            bv = b.leaveInMinutes;            break
        case 'estRound':  av = a.roundMinutes;              bv = b.roundMinutes;              break
        case 'holesDusk': av = a.holesBeforeDusk;           bv = b.holesBeforeDusk;           break
        case 'spots':     av = a.teetime.spaces ?? 4;       bv = b.teetime.spaces ?? 4;       break
        case 'doneBy':    av = a.doneBy.getTime();          bv = b.doneBy.getTime();          break
        case 'verdict':
        default:          av = VERDICT_ORDER[a.verdict] ?? 99; bv = VERDICT_ORDER[b.verdict] ?? 99
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sort])

  const goCount    = rows.filter((r) => r.verdict === 'go').length
  const tightCount = rows.filter((r) => r.verdict === 'tight').length
  const skipCount  = rows.filter((r) => r.verdict === 'skip').length

  function arrow(key) {
    if (key === 'book') return ''
    if (sort.key !== key) return ' ↕'
    return sort.dir === 'asc' ? ' ↑' : ' ↓'
  }

  function badge(course) {
    if (course.type === 'par3') return 'Par 3'
    return `${course.holes}-hole`
  }

  const showSkeleton = loading
  const showEmpty    = !loading && rows.length === 0

  return (
    <div className="table-wrap">
      <div className="results-meta">
        {loading ? (
          <span className="meta-loading">
            {!driveTimesReady ? '🗺 Calculating drive times…' : '⏳ Loading tee times…'}
          </span>
        ) : (
          <>
            <span className="meta-item"><span className="dot dot-go" />{goCount} Go</span>
            <span className="meta-item"><span className="dot dot-tight" />{tightCount} Tight</span>
            <span className="meta-item"><span className="dot dot-skip" />{skipCount} Skip</span>
            <span>{rows.length} tee times</span>
          </>
        )}
      </div>

      {showEmpty ? (
        <div className="empty-state">
          No tee times available. The server may still be scraping — try refreshing in a moment.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={sort.key === col.key ? 'sort-active' : ''}
                  title={col.key === 'leaveIn' ? 'Time until you need to leave (tee time − drive time)' : undefined}
                >
                  {col.label}{arrow(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSkeleton
              ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
              : sortedRows.map((row) => {
                  const { teetime, course, driveMinutes, leaveInMinutes,
                          roundMinutes, doneBy, holesBeforeDusk, verdict } = row

                  const holesClass  = holesBeforeDusk >= course.holes ? 'holes-ok' : 'holes-short'
                  const leaveUrgent = leaveInMinutes <= 30
                  const bookingUrl  = getBookingUrl(course, teetime.time)

                  return (
                    <tr key={teetime.id}>
                      <td>
                        <span className="course-name">{course.name}</span>
                        <span className="course-badge">{badge(course)}</span>
                      </td>
                      <td>{fmtTime(teetime.time)}</td>
                      <td className="greenfee">${teetime.greenfee}</td>
                      <td className="total-cost">
                        ${(teetime.greenfee + fuelCostDollars(driveMinutes)).toFixed(0)}
                        <span className="fuel-note">+fuel</span>
                      </td>
                      <td className="drive">{driveMinutes}m</td>
                      <td className={leaveUrgent ? 'tee-in-urgent' : ''}>{fmtDur(leaveInMinutes)}</td>
                      <td className="est-round">{fmtDur(roundMinutes)}</td>
                      <td><span className={holesClass}>{holesBeforeDusk}/{course.holes}</span></td>
                      <td>
                        <span className="spots-badge">
                          {teetime.spaces ?? '?'} spot{(teetime.spaces ?? 1) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className={verdict !== 'go' ? 'done-by-warn' : ''}>{fmtTime(doneBy)}</td>
                      <td>
                        <span className={`verdict-badge verdict-${verdict}`}>
                          {verdict.toUpperCase()}
                        </span>
                      </td>
<td><a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="book-btn">Book</a></td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      )}
    </div>
  )
}
