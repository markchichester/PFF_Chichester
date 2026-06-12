/**
 * Game log stat labels — update when glossary is finalized.
 */
(function (global) {
  global.QbAnnualStatGlossary = {
    groups: [
      {
        title: "Passing",
        stats: [
          { key: "att", label: "Attempts", abbr: "ATT" },
          { key: "comp", label: "Completions", abbr: "COMP" },
          { key: "comp%", label: "Completion %", abbr: "COMP%" },
          { key: "pass yds", label: "Passing yards", abbr: "PASS YDS" },
          { key: "pass ypa", label: "Yards per attempt", abbr: "PASS YPA" },
          { key: "pass td", label: "Passing touchdowns", abbr: "PASS TD" },
          { key: "int", label: "Interceptions", abbr: "INT" },
          { key: "rtg", label: "Passer rating", abbr: "RTG" },
        ],
      },
      {
        title: "Rushing",
        stats: [
          { key: "scr", label: "Scrambles", abbr: "SCR" },
          { key: "rush yds", label: "Rushing yards", abbr: "RUSH YDS" },
          { key: "ypc", label: "Yards per carry", abbr: "YPC" },
        ],
      },
      {
        title: "Pressure & timing",
        stats: [
          { key: "db", label: "Dropbacks", abbr: "DB" },
          { key: "sk", label: "Sacks taken", abbr: "SK" },
          { key: "avgttt", label: "Average time to throw", abbr: "avgTTT" },
          { key: "ps%", label: "Pressure rate", abbr: "PS%" },
        ],
      },
      {
        title: "Accuracy & depth",
        stats: [
          { key: "acc%", label: "Accuracy %", abbr: "ACC%" },
          { key: "acomp%", label: "Adjusted completion %", abbr: "aComp%" },
          { key: "adot", label: "Average depth of target", abbr: "ADOT" },
          { key: "air%", label: "Air yards %", abbr: "AIR%" },
          { key: "cat inac%", label: "Catchable inaccurate %", abbr: "CAT INAC%" },
          { key: "unc inac%", label: "Uncatchable inaccurate %", abbr: "UNC INAC%" },
        ],
      },
      {
        title: "Big plays & risk",
        stats: [
          { key: "bp", label: "Big-time throws", abbr: "BP" },
          { key: "btt", label: "Big-time throws", abbr: "BTT" },
          { key: "btt%", label: "Big-time throw %", abbr: "BTT%" },
          { key: "twp", label: "Turnover-worthy plays", abbr: "TWP" },
          { key: "twp%", label: "Turnover-worthy play %", abbr: "TWP%" },
          { key: "1d", label: "First downs", abbr: "1D" },
          { key: "dp", label: "Defensive penalties drawn", abbr: "DP" },
          { key: "ss%", label: "Spike/stop %", abbr: "SS%" },
          { key: "plus%", label: "Plus grade %", abbr: "PLUS%" },
        ],
      },
    ],
  };
})(window);
