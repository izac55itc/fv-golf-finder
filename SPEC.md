# FV Golf Finder — Product Specification

## Overview

FV Golf Finder is a Fraser Valley golf tee time session planner. Given a golfer's location,
earliest available time, and a hard deadline, it ranks all nearby tee times by feasibility —
showing the full picture beyond just the green fee.

Default location: **Walnut Grove, Langley BC** (49.1666N, 122.5884W)
Sunset reference: **~9:05 PM PDT** in late May/June

## Core Concept: True Cost to Tee Off

Green fee alone does not tell the full story. FV Golf Finder shows:

| Factor | What it means |
|--------|---------------|
| Green fee | Listed walking rate (CAD) |
| Drive time | Travel time from your location |
| Tee In | Minutes until you must leave NOW |
| Est. Round | Holes × pace-of-play model |
| Holes Before Dusk | Playable holes before sunset |
| Done By | Estimated finish time |
| Verdict | GO / TIGHT / SKIP vs your deadline |

## Session Planner Inputs

1. **Current Location** — GPS or address (default Walnut Grove, Langley BC)
2. **Available From** — earliest you can tee off
3. **Must Be Done By** — hard deadline (dinner, family, work)

## Verdict Logic

- **GO** — Round completes before Must Be Done By AND all holes playable before dusk
- **TIGHT** — Round fits deadline but some holes risk losing light
- **SKIP** — Round cannot finish before Must Be Done By

Rows sorted: GO → TIGHT → SKIP, then tee time ascending within each group.

## Pace of Play Model (v1)

| Format | Min/Hole | Typical Total |
|--------|----------|---------------|
| 18-hole regulation | 14 min | ~4 hr 12 min |
| 9-hole regulation | 13-14 min | ~2 hr |
| 9-hole executive | 11-12 min | ~1 hr 45 min |
| Par 3 (9-hole) | 9-10 min | ~1 hr 30 min |

Future: crowdsourced pace reports and real-time congestion data.

## Drive Time (v1 Mock)

Haversine distance with road factor 1.3x, 40 km/h urban average, +3 min base.
Future: Google Maps Distance Matrix API or OSRM for traffic-aware estimates.

## Sunset (v1 Mock)

| Period | Approx Sunset PDT |
|--------|-------------------|
| May/June | 9:05 PM |
| July/August | 9:00 PM |
| April/September | 8:15 PM |
| Other | 8:00 PM |

Future: SunCalc.js or USNO API for precise per-day sunset.

## 29 Pre-loaded Courses

Langley/Walnut Grove: Fort Langley GC, Belmont GC, Newlands G&CC, Newlands Executive,
Langley Golf Centre, Meridian Hills Par 3, Willowbrook GC
Cloverdale: The Redwoods GC
Pitt Meadows/Maple Ridge: Golden Eagle GC, Swaneset Bay Resort & CC, Swaneset Executive,
Meadow Gardens GC, Meadow Gardens Club, Pitt Meadows GC, Golden Par Golf, Maple Ridge GC, Alouette GC
Coquitlam/Port Coquitlam: Westwood Plateau Executive, Eaglequest Coquitlam, Hyde Creek Golf, Meadows Golf Centre
East Fraser Valley: Ledgeview G&CC, Abbotsford GC, Mission G&CC, Poppy Ridge GC, Eighteen Pastures GC
Par 3s: Hole 15 Golf, Hackers Haven, Golden Par Golf, Ryan Holley Golf, Meridian Hills

## Future Roadmap

### Phase 2: Real Data Integration
- Live tee time availability via GolfNow API, TeeOn, or course-direct
- Google Maps Distance Matrix for real drive times
- Live green fee data with cart/walking split

### Phase 3: Pace of Play Tracking
- Crowdsourced pace reports ("just played Redwoods — 4:45 pace")
- Historical averages by day-of-week and tee time slot
- Congestion indicators: Quiet / Moderate / Busy

### Phase 4: True Cost Calculator
- Fuel cost estimate (distance × vehicle type × gas price)
- Cart rental flag ("walking saves $25")
- Total cost = green fee + cart + fuel

### Phase 5: Monetization
- Affiliate booking commissions (GolfNow, TeeSnap affiliate programs)
- Premium push alerts for tee time openings at preferred courses
- Sponsored placement (clearly labeled "Featured")
- Pro tier: group booking coordination, handicap integration, round history
- Data licensing: anonymized pace and booking data to courses

## Technical Architecture

| Layer | v1 | Future |
|-------|----|--------|
| Frontend | Vite + React SPA | Same |
| Data | Mock JS arrays | REST/GraphQL |
| Maps | Haversine mock | Google Maps JS SDK |
| Sunset | Lookup table | SunCalc.js |
| Deployment | GitHub Pages | Vercel/Cloudflare |
| Auth | None | Clerk/Supabase |
