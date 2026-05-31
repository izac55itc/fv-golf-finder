import { useState, useMemo } from 'react'

// ── Helpers ────────────────────────────────────────────────────
function fmtTime(date) {
  return date.toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function fmtDur(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

const VERDICT_ORDER = { go: 0, tight: 1, skip: 2 }

// ── Column definitions ─────────────────────────────────────────
const COLUMNS = [
  { key: 'course',     label: 'Course'     },
  { key: 'teetime',    label: 'Tee Time'   },
  { key: 'greenfee',   label: 'Green Fee'  },
  { key: 'drive',      label: 'Drive'      },
  { key: 'teeIn',      label: 'Tee In'     },
  { key: 'estRound',   label: 'Est. Round' },
  { key: 'holesDusk',  label: 'Holes/Dusk' },
  { key: 'doneBy',     label: 'Done By'    },
  { key: 'verdict',    label: 'Verdict'    },
]

// ── Component ──────────────────────────────────────────────────
export default function TeeTimeTable({ rows }) {
  const [sort, setSort] = useState({ key: 'verdict', dir: 'asc' })

  function handleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }

  const sortedRows = useMemo(() => {
    const copy = [...rows]

    copy.sort((a, b) => {
      let aVal, bVal

      switch (sort.key) {
        case 'course':
          aVal = a.course.name.toLowerCase()
          bVal = b.course.name.toLowerCase()
          break
        case 'teetime':
          aVal = a.teetime.time.getTime()
          bVal = b.teetime.time.getTime()
          break
        case 'greenfee':
          aVal = a.teetime.greenfee
          bVal = b.teetime.greenfee
          break
        case 'drive':
          aVal = a.driveMinutes
          bVal = b.driveMinutes
          break
        case 'teeIn':
          aVal = a.teeInMinutes
          bVal = b.teeInMinutes
          break
        case 'estRound':
          aVal = a.roundMinutes
          bVal = b.roundMinutes
          break
        case 'holesDusk':
          aVal = a.holesBeforeDusk
          bVal = b.holesBeforeDusk
          break
        case 'doneBy':
          aVal = a.doneBy.getTime()
          bVal = b.doneBy.getTime()
          break
        case 'verdict':
        default:
          aVal = VERDICT_ORDER[a.verdict] ?? 99
          bVal = VERDICT_ORDER[b.verdict] ?? 99
          break
      }

      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
      return 0
    })

    if (sort.dir === 'desc') copy.reverse()
    return copy
  }, [rows, sort])

  const goCount     = rows.filter((r) => r.verdict === 'go').length
  const tightCount  = rows.filter((r) => r.verdict === 'tight').length
  const skipCount   = rows.filter((r) => r.verdict === 'skip').length

  function sortArrow(key) {
    if (sort.key !== key) return ' ↕'
    return sort.dir === 'asc' ? ' ↑' : ' ↓'
  }

  function badgeLabel(course) {
    if (course.type === 'par3') return 'Par 3'
    return `${course.holes}-hole`
  }

  return (
    <div className="table-wrap">
      <div className="results-meta">
        <span className="meta-item">
          <span className="dot dot-go" />
          {goCount} Go
        </span>
        <span className="meta-item">
          <span className="dot dot-tight" />
          {tightCount} Tight
        </span>
        <span className="meta-item">
          <span className="dot dot-skip" />
          {skipCount} Skip
        </span>
        <span>{rows.length} tee times total</span>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          No tee times match your session criteria.
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
                >
                  {col.label}
                  {sortArrow(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const { teetime, course, driveMinutes, teeInMinutes,
                      roundMinutes, doneBy, holesBeforeDusk, verdict } = row

              const holesClass =
                holesBeforeDusk >= course.holes ? 'holes-ok' : 'holes-short'

              return (
                <tr key={teetime.id}>
                  {/* Course */}
                  <td>
                    <span className="course-name">{course.name}</span>
                    <span className="course-badge">{badgeLabel(course)}</span>
                  </td>

                  {/* Tee Time */}
                  <td>{fmtTime(teetime.time)}</td>

                  {/* Green Fee */}
                  <td className="greenfee">${teetime.greenfee}</td>

                  {/* Drive */}
                  <td className="drive">{driveMinutes}m</td>

                  {/* Tee In */}
                  <td className={teeInMinutes <= 30 ? 'tee-in-urgent' : ''}>
                    {fmtDur(teeInMinutes)}
                  </td>

                  {/* Est. Round */}
                  <td className="est-round">{fmtDur(roundMinutes)}</td>

                  {/* Holes / Dusk */}
                  <td>
                    <span className={holesClass}>
                      {holesBeforeDusk}/{course.holes}
                    </span>
                  </td>

                  {/* Done By */}
                  <td className={verdict !== 'go' ? 'done-by-warn' : ''}>
                    {fmtTime(doneBy)}
                  </td>

                  {/* Verdict */}
                  <td>
                    <span className={`verdict-badge verdict-${verdict}`}>
                      {verdict.toUpperCase()}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
