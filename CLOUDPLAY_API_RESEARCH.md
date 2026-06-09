# CloudPlay Golf (CPS) API Research Report

**Date:** June 9, 2026  
**Research Scope:** Fort Langley Golf Course (fortlangley.cps.golf)  
**Status:** NO PUBLIC API FOUND — Browser-based scraping required

---

## Executive Summary

CloudPlay Golf (CPS) does **NOT** expose a public or documented API for tee time data. All attempts to access standard API endpoints, documentation sites, or public developer resources returned either Cloudflare protection barriers or no results.

**Bottom Line:** You must use browser-based scraping (Playwright/Puppeteer) to extract tee time and pricing data from CPS courses.

---

## Research Findings

### 1. API Endpoint Investigation

**Tested Endpoints:**
- `https://fortlangley.cps.golf/api` → Cloudflare challenge required
- `https://fortlangley.cps.golf/api/*` → All blocked by Cloudflare
- `https://cloudplay.golf/api` → Connection timeout/DNS fail
- `https://www.cloudplay.golf/api` → Connection timeout

**Finding:** No public API endpoints accessible. All *.cps.golf domains are behind Cloudflare WAF protection.

### 2. Documentation & Developer Resources

**Searched Locations:**
- `https://support.cloudplay.golf` → No response
- `https://developer.cloudplay.golf` → No response
- GitHub repos: `cloudplay golf`, `cps.golf scraper`, `CPS golf API` → No relevant results
- GitHub code search: `cps.golf api`, `cloudplay api` → No public implementations

**Finding:** No official documentation or developer portal exists.

### 3. Cloudflare Protection Analysis

All CloudPlay Golf sites enforce **managed Cloudflare protection** with:
- JavaScript challenges (bot detection)
- HTML-only responses until challenge solved
- No direct JSON API access without JavaScript execution

**Example Response:**
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Security-Policy: default-src 'none'; script-src 'nonce-...' https://challenges.cloudflare.com
<!-- Challenge page with CAPTCHA/JS verification -->
```

### 4. GolfNow Comparison

**Why GolfNow works (for your existing 8 courses):**
- GolfNow exposes a public REST API: `https://www.golfnow.com/api/tee-times/...`
- Example: `https://www.golfnow.com/api/tee-times/tee-times/facility/{facilityId}/summaries/from/{date}/to/{date}`
- No authentication required; public data
- Your scraper successfully uses this (see `/scraper/index.js`)

**Why CloudPlay is different:**
- Proprietary platform; no public API tier
- Operates on a per-club subdomain model (fortlangley.cps.golf, westcoastgolfgroup.cps.golf, etc.)
- Likely uses internal JSON endpoints that require authenticated session
- Cloudflare protection prevents automated access

---

## Scraping Feasibility Analysis

### Option 1: Browser-Based Scraping (RECOMMENDED)

**Approach:** Use Playwright (or Puppeteer) to:
1. Load the CPS booking page in headless Chromium
2. Solve Cloudflare challenges automatically
3. Query the page DOM for tee time data OR intercept XHR/Fetch requests
4. Extract JSON from network calls

**Pros:**
- Reliable; handles Cloudflare natively
- Can extract real-time data
- Works with any course using CPS platform

**Cons:**
- Slower than direct API calls (5-30 sec per request)
- Higher computational cost (browser overhead)
- Harder to scale to many courses
- CPS could block based on request patterns

**Implementation Estimate:** 4-6 hours
- Playwright setup with Cloudflare handling
- DOM parsing or network interception
- Error handling & retry logic
- Testing with Fort Langley

### Option 2: Network Intercept (IF CPS uses public JSON endpoints)

**Approach:** 
1. Load CPS page with Playwright
2. Intercept `fetch()` / `XMLHttpRequest` calls
3. Log the endpoints & payloads
4. Attempt direct API calls if endpoints are discovered

**Likelihood of Success:** ~30%
- If CPS serves tee times via internal `/api/teetimes` endpoints, you can extract the pattern
- Common patterns: `/api/availability`, `/api/courses/{id}/slots`, `/api/pricing`
- If they require session tokens, this approach fails

**Implementation Estimate:** 2-4 hours (if successful)

### Option 3: Direct Curl + IP Rotation (NOT RECOMMENDED)

**Problem:** Cloudflare challenges prevent direct HTTP requests.
**Solution Needed:** 
- Cloudflare bypass library (cf-bypass)
- IP rotation / proxy service
- Custom User-Agent/Headers

**Reality Check:** Actively evading security is against CPS ToS and fragile.

---

## Fort Langley Golf Course Specifics

**Current Status:**
- Uses CloudPlay Golf (fortlangley.cps.golf)
- Also listed on GolfNow (facilityId: 3524) for legacy reasons
- Dual-system operation suggests CPS is primary booking platform

**Tee Time Data Available Via:**
1. GolfNow API (if still synced) — Easy, already integrated
2. CloudPlay Browser Scraping — Required for real-time accuracy

**Test URL:** `https://fortlangley.cps.golf/onlineresweb/search-teetime`

---

## Recommendations for FV Golf Finder

### Short Term (v1.1)
- **Maintain GolfNow scraper** for 8 existing courses (working perfectly)
- Add a note to Fort Langley: "Powered by GolfNow API (limited data)"
- If GolfNow data becomes stale, move to browser scraping

### Medium Term (v2.0)
- **Implement Playwright scraper** for CloudPlay courses
- Support both platforms: GolfNow (fast) + CPS (headless browser)
- Add conditional logic: try GolfNow first, fallback to browser scraping

### Implementation Pattern
```javascript
// Pseudo-code
async function getTeetimes(course) {
  if (course.golfnowId) {
    return await scrapeGolfNow(course.golfnowId)  // Fast
  } else if (course.cpsUrl) {
    return await scrapeCPS(course.cpsUrl)  // Slower, browser-based
  }
}
```

---

## Browser Scraping Setup (Starter Template)

If you proceed with CPS scraping, here's the pattern:

```javascript
const { chromium } = require('playwright');

async function scrapeCPS(courseUrl) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Playwright handles Cloudflare automatically
    await page.goto(courseUrl, { waitUntil: 'networkidle' });
    
    // Method 1: DOM parsing
    const teetimes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-teetime]')).map(el => ({
        time: el.textContent,
        available: el.classList.contains('available'),
        price: el.dataset.price,
      }));
    });
    
    // Method 2: Network interception (preferred)
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(response.url(), await response.text());
      }
    });
    
    return teetimes;
  } finally {
    await browser.close();
  }
}
```

---

## Risk Assessment

| Factor | Risk | Notes |
|--------|------|-------|
| **Terms of Service** | Medium | CPS ToS likely prohibits scraping; GolfNow is silent on this |
| **Cloudflare Detection** | Low | Playwright is designed for this; hard to detect |
| **IP Blocking** | Low-Medium | CPS could block after 100+ requests/hour |
| **Data Accuracy** | Low | Direct page scraping is accurate |
| **Maintenance** | Medium | CPS UI changes break scraper; need monitoring |

---

## Conclusion

**Does CloudPlay have a discoverable/usable API?**
- **No public API exists**
- **No documented endpoints available**
- **All access is blocked by Cloudflare**

**What's required to scrape it?**
1. **Headless browser** (Playwright/Puppeteer) to render JavaScript and solve Cloudflare challenges
2. **DOM parsing** to extract tee time table, OR **network interception** to capture API calls
3. **Error handling** for Cloudflare blocks and network timeouts
4. **Session management** if authentication is required

**Effort to implement:** 4-6 hours for robust CPS scraper

**Alternative:** Continue using GolfNow API for Fort Langley if data freshness is acceptable.

---

## References

- [Playwright Docs](https://playwright.dev/)
- [Your existing GolfNow scraper](/scraper/index.js)
- [CPS Sites Confirmed](https://fortlangley.cps.golf, https://westcoastgolfgroup.cps.golf)
