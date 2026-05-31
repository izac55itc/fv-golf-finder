function t(h, m) {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

export const MOCK_TEE_TIMES = [
  // fort-langley (base 28)
  { id: 'fl-1', courseId: 'fort-langley', time: t(11, 0),  greenfee: 25, spaces: 4 },
  { id: 'fl-2', courseId: 'fort-langley', time: t(12, 30), greenfee: 28, spaces: 3 },
  { id: 'fl-3', courseId: 'fort-langley', time: t(14, 0),  greenfee: 30, spaces: 2 },
  { id: 'fl-4', courseId: 'fort-langley', time: t(16, 0),  greenfee: 27, spaces: 4 },

  // belmont (base 45)
  { id: 'bl-1', courseId: 'belmont', time: t(11, 30), greenfee: 42, spaces: 3 },
  { id: 'bl-2', courseId: 'belmont', time: t(13, 0),  greenfee: 45, spaces: 4 },
  { id: 'bl-3', courseId: 'belmont', time: t(14, 30), greenfee: 48, spaces: 2 },
  { id: 'bl-4', courseId: 'belmont', time: t(16, 30), greenfee: 43, spaces: 3 },

  // newlands-cc (base 75)
  { id: 'nw-1', courseId: 'newlands-cc', time: t(11, 0),  greenfee: 72, spaces: 4 },
  { id: 'nw-2', courseId: 'newlands-cc', time: t(12, 0),  greenfee: 75, spaces: 2 },
  { id: 'nw-3', courseId: 'newlands-cc', time: t(13, 30), greenfee: 78, spaces: 3 },
  { id: 'nw-4', courseId: 'newlands-cc', time: t(15, 0),  greenfee: 74, spaces: 4 },

  // newlands-exec (base 35)
  { id: 'nwx-1', courseId: 'newlands-exec', time: t(11, 30), greenfee: 33, spaces: 3 },
  { id: 'nwx-2', courseId: 'newlands-exec', time: t(13, 0),  greenfee: 35, spaces: 4 },
  { id: 'nwx-3', courseId: 'newlands-exec', time: t(15, 30), greenfee: 38, spaces: 2 },

  // langley-centre (base 28)
  { id: 'lc-1', courseId: 'langley-centre', time: t(11, 0),  greenfee: 26, spaces: 4 },
  { id: 'lc-2', courseId: 'langley-centre', time: t(12, 30), greenfee: 28, spaces: 3 },
  { id: 'lc-3', courseId: 'langley-centre', time: t(14, 0),  greenfee: 30, spaces: 2 },
  { id: 'lc-4', courseId: 'langley-centre', time: t(17, 0),  greenfee: 27, spaces: 4 },

  // meridian-hills (base 18)
  { id: 'mh-1', courseId: 'meridian-hills', time: t(11, 0),  greenfee: 16, spaces: 4 },
  { id: 'mh-2', courseId: 'meridian-hills', time: t(13, 0),  greenfee: 18, spaces: 3 },
  { id: 'mh-3', courseId: 'meridian-hills', time: t(15, 0),  greenfee: 20, spaces: 2 },
  { id: 'mh-4', courseId: 'meridian-hills', time: t(17, 30), greenfee: 17, spaces: 4 },

  // redwoods (base 55)
  { id: 'rw-1', courseId: 'redwoods', time: t(11, 30), greenfee: 52, spaces: 3 },
  { id: 'rw-2', courseId: 'redwoods', time: t(13, 0),  greenfee: 55, spaces: 4 },
  { id: 'rw-3', courseId: 'redwoods', time: t(14, 30), greenfee: 58, spaces: 2 },
  { id: 'rw-4', courseId: 'redwoods', time: t(16, 0),  greenfee: 54, spaces: 3 },
  { id: 'rw-5', courseId: 'redwoods', time: t(18, 0),  greenfee: 52, spaces: 4 },

  // willowbrook (base 22)
  { id: 'wb-1', courseId: 'willowbrook', time: t(11, 0),  greenfee: 20, spaces: 4 },
  { id: 'wb-2', courseId: 'willowbrook', time: t(12, 30), greenfee: 22, spaces: 3 },
  { id: 'wb-3', courseId: 'willowbrook', time: t(14, 0),  greenfee: 24, spaces: 2 },
  { id: 'wb-4', courseId: 'willowbrook', time: t(16, 30), greenfee: 21, spaces: 4 },

  // golden-eagle (base 65)
  { id: 'ge-1', courseId: 'golden-eagle', time: t(11, 0),  greenfee: 62, spaces: 3 },
  { id: 'ge-2', courseId: 'golden-eagle', time: t(12, 30), greenfee: 65, spaces: 4 },
  { id: 'ge-3', courseId: 'golden-eagle', time: t(14, 0),  greenfee: 68, spaces: 2 },
  { id: 'ge-4', courseId: 'golden-eagle', time: t(15, 30), greenfee: 64, spaces: 3 },
  { id: 'ge-5', courseId: 'golden-eagle', time: t(17, 30), greenfee: 62, spaces: 4 },

  // swaneset-cc (base 85)
  { id: 'sw-1', courseId: 'swaneset-cc', time: t(11, 30), greenfee: 82, spaces: 4 },
  { id: 'sw-2', courseId: 'swaneset-cc', time: t(13, 0),  greenfee: 85, spaces: 3 },
  { id: 'sw-3', courseId: 'swaneset-cc', time: t(14, 30), greenfee: 88, spaces: 2 },
  { id: 'sw-4', courseId: 'swaneset-cc', time: t(16, 0),  greenfee: 84, spaces: 4 },

  // swaneset-exec (base 35)
  { id: 'se-1', courseId: 'swaneset-exec', time: t(11, 0),  greenfee: 33, spaces: 4 },
  { id: 'se-2', courseId: 'swaneset-exec', time: t(13, 30), greenfee: 35, spaces: 3 },
  { id: 'se-3', courseId: 'swaneset-exec', time: t(16, 0),  greenfee: 38, spaces: 2 },

  // meadow-gardens (base 60)
  { id: 'mg-1', courseId: 'meadow-gardens', time: t(11, 0),  greenfee: 57, spaces: 4 },
  { id: 'mg-2', courseId: 'meadow-gardens', time: t(12, 30), greenfee: 60, spaces: 3 },
  { id: 'mg-3', courseId: 'meadow-gardens', time: t(14, 0),  greenfee: 63, spaces: 2 },
  { id: 'mg-4', courseId: 'meadow-gardens', time: t(16, 30), greenfee: 59, spaces: 4 },

  // meadow-gardens-club (base 75)
  { id: 'mgc-1', courseId: 'meadow-gardens-club', time: t(11, 30), greenfee: 72, spaces: 3 },
  { id: 'mgc-2', courseId: 'meadow-gardens-club', time: t(13, 0),  greenfee: 75, spaces: 4 },
  { id: 'mgc-3', courseId: 'meadow-gardens-club', time: t(14, 30), greenfee: 78, spaces: 2 },
  { id: 'mgc-4', courseId: 'meadow-gardens-club', time: t(17, 0),  greenfee: 73, spaces: 3 },

  // pitt-meadows (base 55)
  { id: 'pm-1', courseId: 'pitt-meadows', time: t(11, 0),  greenfee: 52, spaces: 4 },
  { id: 'pm-2', courseId: 'pitt-meadows', time: t(12, 30), greenfee: 55, spaces: 3 },
  { id: 'pm-3', courseId: 'pitt-meadows', time: t(14, 0),  greenfee: 57, spaces: 2 },
  { id: 'pm-4', courseId: 'pitt-meadows', time: t(16, 0),  greenfee: 53, spaces: 4 },
  { id: 'pm-5', courseId: 'pitt-meadows', time: t(18, 0),  greenfee: 52, spaces: 3 },

  // golden-par (base 20)
  { id: 'gp-1', courseId: 'golden-par', time: t(11, 0),  greenfee: 18, spaces: 4 },
  { id: 'gp-2', courseId: 'golden-par', time: t(13, 0),  greenfee: 20, spaces: 3 },
  { id: 'gp-3', courseId: 'golden-par', time: t(15, 30), greenfee: 22, spaces: 2 },
  { id: 'gp-4', courseId: 'golden-par', time: t(17, 30), greenfee: 19, spaces: 4 },

  // hole-15 (base 25)
  { id: 'h15-1', courseId: 'hole-15', time: t(11, 30), greenfee: 23, spaces: 3 },
  { id: 'h15-2', courseId: 'hole-15', time: t(13, 0),  greenfee: 25, spaces: 4 },
  { id: 'h15-3', courseId: 'hole-15', time: t(15, 0),  greenfee: 28, spaces: 2 },
  { id: 'h15-4', courseId: 'hole-15', time: t(17, 0),  greenfee: 24, spaces: 4 },

  // maple-ridge (base 50)
  { id: 'mr-1', courseId: 'maple-ridge', time: t(11, 0),  greenfee: 47, spaces: 4 },
  { id: 'mr-2', courseId: 'maple-ridge', time: t(12, 30), greenfee: 50, spaces: 3 },
  { id: 'mr-3', courseId: 'maple-ridge', time: t(14, 0),  greenfee: 53, spaces: 2 },
  { id: 'mr-4', courseId: 'maple-ridge', time: t(16, 0),  greenfee: 49, spaces: 4 },

  // alouette (base 50)
  { id: 'al-1', courseId: 'alouette', time: t(11, 30), greenfee: 48, spaces: 3 },
  { id: 'al-2', courseId: 'alouette', time: t(13, 0),  greenfee: 50, spaces: 4 },
  { id: 'al-3', courseId: 'alouette', time: t(14, 30), greenfee: 53, spaces: 2 },
  { id: 'al-4', courseId: 'alouette', time: t(16, 30), greenfee: 47, spaces: 4 },
  { id: 'al-5', courseId: 'alouette', time: t(18, 30), greenfee: 48, spaces: 3 },

  // hackers-haven (base 18)
  { id: 'hh-1', courseId: 'hackers-haven', time: t(11, 0),  greenfee: 16, spaces: 4 },
  { id: 'hh-2', courseId: 'hackers-haven', time: t(13, 0),  greenfee: 18, spaces: 3 },
  { id: 'hh-3', courseId: 'hackers-haven', time: t(15, 0),  greenfee: 20, spaces: 2 },
  { id: 'hh-4', courseId: 'hackers-haven', time: t(17, 30), greenfee: 17, spaces: 4 },

  // ryan-holley (base 25)
  { id: 'rh-1', courseId: 'ryan-holley', time: t(11, 30), greenfee: 23, spaces: 4 },
  { id: 'rh-2', courseId: 'ryan-holley', time: t(13, 0),  greenfee: 25, spaces: 3 },
  { id: 'rh-3', courseId: 'ryan-holley', time: t(15, 0),  greenfee: 28, spaces: 2 },
  { id: 'rh-4', courseId: 'ryan-holley', time: t(17, 0),  greenfee: 24, spaces: 4 },

  // eighteen-pastures (base 45)
  { id: 'ep-1', courseId: 'eighteen-pastures', time: t(11, 0),  greenfee: 43, spaces: 4 },
  { id: 'ep-2', courseId: 'eighteen-pastures', time: t(12, 30), greenfee: 45, spaces: 3 },
  { id: 'ep-3', courseId: 'eighteen-pastures', time: t(14, 0),  greenfee: 48, spaces: 2 },
  { id: 'ep-4', courseId: 'eighteen-pastures', time: t(16, 30), greenfee: 44, spaces: 4 },

  // westwood-plateau (base 40)
  { id: 'wp-1', courseId: 'westwood-plateau', time: t(11, 30), greenfee: 38, spaces: 3 },
  { id: 'wp-2', courseId: 'westwood-plateau', time: t(13, 0),  greenfee: 40, spaces: 4 },
  { id: 'wp-3', courseId: 'westwood-plateau', time: t(14, 30), greenfee: 43, spaces: 2 },
  { id: 'wp-4', courseId: 'westwood-plateau', time: t(17, 0),  greenfee: 39, spaces: 4 },

  // eaglequest (base 60)
  { id: 'eq-1', courseId: 'eaglequest', time: t(11, 0),  greenfee: 57, spaces: 4 },
  { id: 'eq-2', courseId: 'eaglequest', time: t(12, 30), greenfee: 60, spaces: 3 },
  { id: 'eq-3', courseId: 'eaglequest', time: t(14, 0),  greenfee: 63, spaces: 2 },
  { id: 'eq-4', courseId: 'eaglequest', time: t(15, 30), greenfee: 59, spaces: 4 },
  { id: 'eq-5', courseId: 'eaglequest', time: t(18, 0),  greenfee: 57, spaces: 3 },

  // meadows-centre (base 28)
  { id: 'mc-1', courseId: 'meadows-centre', time: t(11, 0),  greenfee: 26, spaces: 4 },
  { id: 'mc-2', courseId: 'meadows-centre', time: t(12, 30), greenfee: 28, spaces: 3 },
  { id: 'mc-3', courseId: 'meadows-centre', time: t(14, 30), greenfee: 30, spaces: 2 },
  { id: 'mc-4', courseId: 'meadows-centre', time: t(17, 0),  greenfee: 27, spaces: 4 },

  // hyde-creek (base 35)
  { id: 'hc-1', courseId: 'hyde-creek', time: t(11, 30), greenfee: 33, spaces: 3 },
  { id: 'hc-2', courseId: 'hyde-creek', time: t(13, 0),  greenfee: 35, spaces: 4 },
  { id: 'hc-3', courseId: 'hyde-creek', time: t(15, 0),  greenfee: 38, spaces: 2 },
  { id: 'hc-4', courseId: 'hyde-creek', time: t(17, 30), greenfee: 34, spaces: 4 },

  // ledgeview (base 65)
  { id: 'lv-1', courseId: 'ledgeview', time: t(11, 0),  greenfee: 62, spaces: 4 },
  { id: 'lv-2', courseId: 'ledgeview', time: t(12, 30), greenfee: 65, spaces: 3 },
  { id: 'lv-3', courseId: 'ledgeview', time: t(14, 0),  greenfee: 68, spaces: 2 },
  { id: 'lv-4', courseId: 'ledgeview', time: t(15, 30), greenfee: 64, spaces: 4 },
  { id: 'lv-5', courseId: 'ledgeview', time: t(17, 30), greenfee: 62, spaces: 3 },

  // abbotsford (base 55)
  { id: 'ab-1', courseId: 'abbotsford', time: t(11, 30), greenfee: 52, spaces: 3 },
  { id: 'ab-2', courseId: 'abbotsford', time: t(13, 0),  greenfee: 55, spaces: 4 },
  { id: 'ab-3', courseId: 'abbotsford', time: t(14, 30), greenfee: 58, spaces: 2 },
  { id: 'ab-4', courseId: 'abbotsford', time: t(16, 30), greenfee: 53, spaces: 4 },

  // mission (base 60)
  { id: 'ms-1', courseId: 'mission', time: t(11, 0),  greenfee: 57, spaces: 4 },
  { id: 'ms-2', courseId: 'mission', time: t(12, 30), greenfee: 60, spaces: 3 },
  { id: 'ms-3', courseId: 'mission', time: t(14, 0),  greenfee: 63, spaces: 2 },
  { id: 'ms-4', courseId: 'mission', time: t(16, 0),  greenfee: 59, spaces: 4 },
  { id: 'ms-5', courseId: 'mission', time: t(18, 30), greenfee: 57, spaces: 3 },

  // poppy-ridge (base 50)
  { id: 'pr-1', courseId: 'poppy-ridge', time: t(11, 30), greenfee: 48, spaces: 4 },
  { id: 'pr-2', courseId: 'poppy-ridge', time: t(13, 0),  greenfee: 50, spaces: 3 },
  { id: 'pr-3', courseId: 'poppy-ridge', time: t(14, 30), greenfee: 53, spaces: 2 },
  { id: 'pr-4', courseId: 'poppy-ridge', time: t(16, 30), greenfee: 49, spaces: 4 },
]
