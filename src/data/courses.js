export const COURSES = [
  // ── Langley ──────────────────────────────────────────────────────────
  { id: 'fort-langley',        name: 'Fort Langley Golf Course',       holes: 9,  type: 'regulation', par: 35, lat: 49.1684, lng: -122.5750, avgHoleMinutes: 14, baseGreenfee: 28,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: 3524  },
  { id: 'belmont',             name: 'Belmont Golf Course',             holes: 18, type: 'regulation', par: 71, lat: 49.1123, lng: -122.6234, avgHoleMinutes: 14, baseGreenfee: 45,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: 358   },
  { id: 'newlands-cc',         name: 'Newlands Golf & CC',              holes: 18, type: 'regulation', par: 71, lat: 49.0922, lng: -122.5889, avgHoleMinutes: 14, baseGreenfee: 75,  cartFee: 22,  cartNote: null,              cartRequired: true, golfnowId: 3525,  golfnowSlug: '3525-newlands-golf-country-club' },
  { id: 'newlands-executive',  name: 'Newlands Executive',              holes: 9,  type: 'executive',  par: 31, lat: 49.0922, lng: -122.5889, avgHoleMinutes: 12, baseGreenfee: 35,  cartFee: null, cartNote: 'walking only',    cartRequired: false, golfnowId: 11039, golfnowSlug: '11039-newlands-golf-country-club-executive-11-hole' },
  { id: 'langley-centre',      name: 'Langley Golf Centre',             holes: 9,  type: 'regulation', par: 35, lat: 49.1047, lng: -122.6563, avgHoleMinutes: 13, baseGreenfee: 28,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: 6967  },
  { id: 'meridian-hills',      name: 'Meridian Hills Par 3',            holes: 9,  type: 'par3',       par: 27, lat: 49.0934, lng: -122.6012, avgHoleMinutes: 10, baseGreenfee: 18,  cartFee: 0,   cartNote: 'walking only',    golfnowId: null  },
  { id: 'redwoods',            name: 'The Redwoods Golf Course',        holes: 18, type: 'regulation', par: 72, lat: 49.0234, lng: -122.5456, avgHoleMinutes: 14, baseGreenfee: 55,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'willowbrook',         name: 'Willowbrook Golf Course',         holes: 9,  type: 'regulation', par: 35, lat: 49.0956, lng: -122.6523, avgHoleMinutes: 13, baseGreenfee: 22,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'hole-15',             name: 'Hole 15 Golf',                    holes: 9,  type: 'par3',       par: 27, lat: 49.1523, lng: -122.6234, avgHoleMinutes: 9,  baseGreenfee: 25,  cartFee: 0,   cartNote: 'walking only',    golfnowId: null  },
  { id: 'ryan-holley',         name: 'Ryan Holley Golf',                holes: 9,  type: 'regulation', par: 34, lat: 49.1890, lng: -122.5123, avgHoleMinutes: 13, baseGreenfee: 25,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'eighteen-pastures',   name: 'Eighteen Pastures Golf Course',   holes: 18, type: 'regulation', par: 72, lat: 49.1891, lng: -122.3387, avgHoleMinutes: 14, baseGreenfee: 45,  cartFee: 24,  cartNote: null,              cartRequired: true, golfnowId: 3530,  golfnowSlug: '3530-eighteen-pastures-golf-course' },

  // ── Surrey ───────────────────────────────────────────────────────────
  { id: 'westfield',           name: 'Westfield Country Club',          holes: 9,  type: 'executive',  par: 31, lat: 49.1389, lng: -122.7544, avgHoleMinutes: 11, baseGreenfee: 30,  cartFee: null, cartNote: 'walk only', cartRequired: false, golfnowId: 6629,  golfnowSlug: '6629-westfield-country-club' },

  // ── Pitt Meadows ─────────────────────────────────────────────────────
  { id: 'golden-eagle-north',  name: 'Golden Eagle Golf Club - North',  holes: 18, type: 'regulation', par: 72, lat: 49.2935, lng: -122.6168, avgHoleMinutes: 14, baseGreenfee: 65,  cartFee: 27,  cartNote: null,              cartRequired: true, golfnowId: 3515,  golfnowSlug: '3515-golden-eagle-north' },
  { id: 'golden-eagle-south',  name: 'Golden Eagle Golf Club - South',  holes: 18, type: 'regulation', par: 70, lat: 49.2930, lng: -122.6165, avgHoleMinutes: 14, baseGreenfee: 55,  cartFee: 27,  cartNote: null,              cartRequired: true, golfnowId: 15899, golfnowSlug: '15899-golden-eagle-south' },
  { id: 'swaneset-resort',     name: 'Swaneset Bay Resort Course',      holes: 18, type: 'regulation', par: 72, lat: 49.2734, lng: -122.6423, avgHoleMinutes: 14, baseGreenfee: 85,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: 19887 },
  { id: 'swaneset-links',      name: 'Swaneset Bay Links Course',       holes: 18, type: 'regulation', par: 72, lat: 49.2730, lng: -122.6420, avgHoleMinutes: 14, baseGreenfee: 72,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: 301   },
  { id: 'meadow-gardens',      name: 'Meadow Gardens Golf Course',      holes: 18, type: 'regulation', par: 71, lat: 49.2234, lng: -122.7890, avgHoleMinutes: 14, baseGreenfee: 60,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: 308   },
  { id: 'pitt-meadows',        name: 'Pitt Meadows Golf Club',          holes: 18, type: 'regulation', par: 72, lat: 49.2123, lng: -122.7034, avgHoleMinutes: 14, baseGreenfee: 55,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: 15280 },
  { id: 'golden-par',          name: 'Golden Par Golf',                 holes: 9,  type: 'par3',       par: 27, lat: 49.2045, lng: -122.6890, avgHoleMinutes: 9,  baseGreenfee: 20,  cartFee: 0,   cartNote: 'walking only',    golfnowId: null  },
  { id: 'meadows-centre',      name: 'Meadows Golf Centre',             holes: 9,  type: 'executive',  par: 31, lat: 49.2134, lng: -122.7456, avgHoleMinutes: 11, baseGreenfee: 28,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: null  },

  // ── Maple Ridge ──────────────────────────────────────────────────────
  { id: 'maple-ridge',         name: 'Maple Ridge Golf Course',         holes: 18, type: 'regulation', par: 71, lat: 49.2234, lng: -122.5890, avgHoleMinutes: 14, baseGreenfee: 50,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'alouette',            name: 'Alouette Golf Course',            holes: 18, type: 'regulation', par: 72, lat: 49.2456, lng: -122.5234, avgHoleMinutes: 14, baseGreenfee: 50,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'hackers-haven',       name: "Hacker's Haven Par 3",            holes: 9,  type: 'par3',       par: 27, lat: 49.2123, lng: -122.5456, avgHoleMinutes: 9,  baseGreenfee: 18,  cartFee: 0,   cartNote: 'walking only',    golfnowId: null  },

  // ── Coquitlam ────────────────────────────────────────────────────────
  { id: 'westwood-plateau',    name: 'Westwood Plateau Executive',      holes: 9,  type: 'executive',  par: 31, lat: 49.2890, lng: -122.8234, avgHoleMinutes: 12, baseGreenfee: 40,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'eaglequest',          name: 'Eaglequest Coquitlam',            holes: 18, type: 'regulation', par: 71, lat: 49.2756, lng: -122.8456, avgHoleMinutes: 14, baseGreenfee: 60,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'hyde-creek',          name: 'Hyde Creek Golf',                 holes: 9,  type: 'executive',  par: 31, lat: 49.2756, lng: -122.8123, avgHoleMinutes: 12, baseGreenfee: 35,  cartFee: 15,  cartNote: null,              cartRequired: true, golfnowId: null  },

  // ── Abbotsford / Mission ─────────────────────────────────────────────
  { id: 'ledgeview',           name: 'Ledgeview Golf & CC',             holes: 18, type: 'regulation', par: 71, lat: 49.0456, lng: -122.3234, avgHoleMinutes: 14, baseGreenfee: 65,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: 6384  },
  { id: 'abbotsford',          name: 'Abbotsford Golf Club',            holes: 18, type: 'regulation', par: 72, lat: 49.0234, lng: -122.2890, avgHoleMinutes: 14, baseGreenfee: 55,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'mission',             name: 'Mission Golf & CC',               holes: 18, type: 'regulation', par: 72, lat: 49.1234, lng: -122.3123, avgHoleMinutes: 14, baseGreenfee: 60,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: null  },
  { id: 'poppy-ridge',         name: 'Poppy Ridge Golf Course',         holes: 18, type: 'regulation', par: 72, lat: 49.0890, lng: -122.2456, avgHoleMinutes: 14, baseGreenfee: 50,  cartFee: 20,  cartNote: null,              cartRequired: true, golfnowId: null  },
]

// Courses with known GolfNow facility IDs — scraped by the scraper
export const GOLFNOW_COURSES = COURSES.filter(c => c.golfnowId !== null)
