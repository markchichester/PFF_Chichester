/** Fallback demo data when bundled CSV feeds are unavailable. */
window.QbAnnualSeed = {
  gameGrades: {
    46601: [
      { week: 1, grade: 82.2 },
      { week: 2, grade: 81.1 },
      { week: 3, grade: 82.4 },
      { week: 4, grade: 78.8 },
      { week: 5, grade: 80.3 },
      { week: 6, grade: 79.5 },
      { week: 7, grade: 79.5 },
      { week: 8, grade: 79.0 },
      { week: 9, grade: 80.9 },
      { week: 10, grade: 78.5 },
      { week: 11, grade: 78.6 },
      { week: 12, grade: 76.1 },
      { week: 13, grade: 75.8 },
      { week: 14, grade: 77.5 },
      { week: 15, grade: 78.0 },
      { week: 16, grade: 79.6 },
      { week: 17, grade: 78.8 },
      { week: 18, grade: 78.8 },
    ],
  },
  gradeDistribution: {
    46601: {
      noPlayDropbacks: 612,
      buckets: [
        { label: "-2", bin: -2, volume: 4, pct: 0.7 },
        { label: "-1.5", bin: -1.5, volume: 12, pct: 2.0 },
        { label: "-1", bin: -1, volume: 28, pct: 4.6 },
        { label: "-0.5", bin: -0.5, volume: 52, pct: 8.5 },
        { label: "0", bin: 0, volume: 98, pct: 16.0 },
        { label: "+0.5", bin: 0.5, volume: 118, pct: 19.3 },
        { label: "+1", bin: 1, volume: 142, pct: 23.2 },
        { label: "+1.5", bin: 1.5, volume: 96, pct: 15.7 },
        { label: "+2", bin: 2, volume: 62, pct: 10.1 },
      ],
    },
  },
};
