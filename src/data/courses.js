export const COURSES = [
  // ── Langley ──────────────────────────────────────────────────────────
  { id: 'fort-langley',        name: 'Fort Langley Golf Course',       holes: 9,  type: 'regulation', par: 35, lat: 49.1684, lng: -122.5750, avgHoleMinutes: 14, baseGreenfee: 28,  golfnowId: 3524  },
  { id: 'belmont',             name: 'Belmont Golf Course',             holes: 18, type: 'regulation', par: 71, lat: 49.1123, lng: -122.6234, avgHoleMinutes: 14, baseGreenfee: 45,  golfnowId: 358   },
  { id: 'newlands-cc',         name: 'Newlands Golf & CC',              holes: 18, type: 'regulation', par: 71, lat: 49.0856, lng: -122.5847, avgHoleMinutes: 14, baseGreenfee: 75,  golfnowId: 3525  },
  { id: 'newlands-executive',  name: 'Newlands Executive',              holes: 9,  type: 'executive',  par: 31, lat: 49.0856, lng: -122.5840, avgHoleMinutes: 12, baseGreenfee: 35,  golfnowId: 11039 },
  { id: 'langley-centre',      name: 'Langley Golf Centre',             holes: 9,  type: 'regulation', par: 35, lat: 49.1047, lng: -122.6563, avgHoleMinutes: 13, baseGreenfee: 28,  golfnowId: 6967  },
  { id: 'meridian-hills',      name: 'Meridian Hills Par 3',            holes: 9,  type: 'par3',       par: 27, lat: 49.0934, lng: -122.6012, avgHoleMinutes: 10, baseGreenfee: 18,  golfnowId: null  },
  { id: 'redwoods',            name: 'The Redwoods Golf Course',        holes: 18, type: 'regulation', par: 72, lat: 49.0234, lng: -122.5456, avgHoleMinutes: 14, baseGreenfee: 55,  golfnowId: null  },
  { id: 'willowbrook',         name: 'Willowbrook Golf Course',         holes: 9,  type: 'regulation', par: 35, lat: 49.0956, lng: -122.6523, avgHoleMinutes: 13, baseGreenfee: 22,  golfnowId: null  },
  { id: 'hole-15',             name: 'Hole 15 Golf',                    holes: 9,  type: 'par3',       par: 27, lat: 49.1523, lng: -122.6234, avgHoleMinutes: 9,  baseGreenfee: 25,  golfnowId: null  },
  { id: 'ryan-holley',         name: 'Ryan Holley Golf',                holes: 9,  type: 'regulation', par: 34, lat: 49.1890, lng: -122.5123, avgHoleMinutes: 13, baseGreenfee: 25,  golfnowId: null  },
  { id: 'eighteen-pastures',   name: 'Eighteen Pastures Golf Course',   holes: 18, type: 'regulation', par: 72, lat: 49.1234, lng: -122.4567, avgHoleMinutes: 14, baseGreenfee: 45,  golfnowId: 3530  },

  // ── Surrey ───────────────────────────────────────────────────────────
  { id: 'westfield',           name: 'Westfield Country Club',          holes: 9,  type: 'executive',  par: 31, lat: 49.1342, lng: -122.7523, avgHoleMinutes: 11, baseGreenfee: 30,  golfnowId: 6629  },

  // ── Pitt Meadows ─────────────────────────────────────────────────────
  { id: 'golden-eagle-north',  name: 'Golden Eagle Golf Club - North',  holes: 18, type: 'regulation', par: 72, lat: 49.2935, lng: -122.6168, avgHoleMinutes: 14, baseGreenfee: 65,  golfnowId: 3515  },
  { id: 'golden-eagle-south',  name: 'Golden Eagle Golf Club - South',  holes: 18, type: 'regulation', par: 70, lat: 49.2930, lng: -122.6165, avgHoleMinutes: 14, baseGreenfee: 55,  golfnowId: 15899 },
  { id: 'swaneset-resort',     name: 'Swaneset Bay Resort Course',      holes: 18, type: 'regulation', par: 72, lat: 49.2734, lng: -122.6423, avgHoleMinutes: 14, baseGreenfee: 85,  golfnowId: 19887 },
  { id: 'swaneset-links',      name: 'Swaneset Bay Links Course',       holes: 18, type: 'regulation', par: 72, lat: 49.2730, lng: -122.6420, avgHoleMinutes: 14, baseGreenfee: 72,  golfnowId: 301   },
  { id: 'meadow-gardens',      name: 'Meadow Gardens Golf Course',      holes: 18, type: 'regulation', par: 71, lat: 49.2234, lng: -122.7890, avgHoleMinutes: 14, baseGreenfee: 60,  golfnowId: 308   },
  { id: 'pitt-meadows',        name: 'Pitt Meadows Golf Club',          holes: 18, type: 'regulation', par: 72, lat: 49.2123, lng: -122.7034, avgHoleMinutes: 14, baseGreenfee: 55,  golfnowId: 15280 },
  { id: 'golden-par',          name: 'Golden Par Golf',                 holes: 9,  type: 'par3',       par: 27, lat: 49.2045, lng: -122.6890, avgHoleMinutes: 9,  baseGreenfee: 20,  golfnowId: null  },
  { id: 'meadows-centre',      name: 'Meadows Golf Centre',             holes: 9,  type: 'executive',  par: 31, lat: 49.2134, lng: -122.7456, avgHoleMinutes: 11, baseGreenfee: 28,  golfnowId: null  },

  // ── Maple Ridge ──────────────────────────────────────────────────────
  { id: 'maple-ridge',         name: 'Maple Ridge Golf Course',         holes: 18, type: 'regulation', par: 71, lat: 49.2234, lng: -122.5890, avgHoleMinutes: 14, baseGreenfee: 50,  golfnowId: null  },
  { id: 'alouette',            name: 'Alouette Golf Course',            holes: 18, type: 'regulation', par: 72, lat: 49.2456, lng: -122.5234, avgHoleMinutes: 14, baseGreenfee: 50,  golfnowId: null  },
  { id: 'hackers-haven',       name: "Hacker's Haven Par 3",            holes: 9,  type: 'par3',       par: 27, lat: 49.2123, lng: -122.5456, avgHoleMinutes: 9,  baseGreenfee: 18,  golfnowId: null  },

  // ── Coquitlam ────────────────────────────────────────────────────────
  { id: 'westwood-plateau',    name: 'Westwood Plateau Executive',      holes: 9,  type: 'executive',  par: 31, lat: 49.2890, lng: -122.8234, avgHoleMinutes: 12, baseGreenfee: 40,  golfnowId: null  },
  { id: 'eaglequest',          name: 'Eaglequest Coquitlam',            holes: 18, type: 'regulation', par: 71, lat: 49.2756, lng: -122.8456, avgHoleMinutes: 14, baseGreenfee: 60,  golfnowId: null  },
  { id: 'hyde-creek',          name: 'Hyde Creek Golf',                 holes: 9,  type: 'executive',  par: 31, lat: 49.2756, lng: -122.8123, avgHoleMinutes: 12, baseGreenfee: 35,  golfnowId: null  },

  // ── Abbotsford / Mission ─────────────────────────────────────────────
  { id: 'ledgeview',           name: 'Ledgeview Golf & CC',             holes: 18, type: 'regulation', par: 71, lat: 49.0456, lng: -122.3234, avgHoleMinutes: 14, baseGreenfee: 65,  golfnowId: 6384  },
  { id: 'abbotsford',          name: 'Abbotsford Golf Club',            holes: 18, type: 'regulation', par: 72, lat: 49.0234, lng: -122.2890, avgHoleMinutes: 14, baseGreenfee: 55,  golfnowId: null  },
  { id: 'mission',             name: 'Mission Golf & CC',               holes: 18, type: 'regulation', par: 72, lat: 49.1234, lng: -122.3123, avgHoleMinutes: 14, baseGreenfee: 60,  golfnowId: null  },
  { id: 'poppy-ridge',         name: 'Poppy Ridge Golf Course',         holes: 18, type: 'regulation', par: 72, lat: 49.0890, lng: -122.2456, avgHoleMinutes: 14, baseGreenfee: 50,  golfnowId: null  },
]

// Courses with known GolfNow facility IDs — scraped by the scraper
export const GOLFNOW_COURSES = COURSES.filter(c => c.golfnowId !== null)
