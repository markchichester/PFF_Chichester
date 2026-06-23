/**
 * Game log stat labels and categories.
 * Keys match lowercase CSV column headers from opponents.csv.
 * abbr    = displayed label in the modal stat grid.
 * label   = full description shown on hover tooltip.
 * format  = optional display formatting ("1dp" = 1 decimal place).
 */
(function (global) {
  global.QbAnnualStatGlossary = {
    groups: [
      {
        title: "Passing",
        stats: [
          { key: "db",       label: "Dropbacks",                  abbr: "Dropbacks"   },
          { key: "att",      label: "Attempts",                   abbr: "Attempts"    },
          { key: "comp",     label: "Completions",                abbr: "Completions" },
          { key: "comp%",    label: "Completion percentage",       abbr: "Comp %"      },
          { key: "pass yds", label: "Passing yards",              abbr: "Pass Yds"    },
          { key: "pass ypa", label: "Yards per attempt",          abbr: "Yds / Att"   },
          { key: "pass td",  label: "Passing touchdowns",         abbr: "Pass TD"     },
          { key: "int",      label: "Interceptions",              abbr: "INT"         },
          { key: "rtg",      label: "Passer rating",              abbr: "Passer Rtg"  },
        ],
      },
      {
        title: "Rushing",
        stats: [
          { key: "scr",      label: "Scrambles",                  abbr: "Scrambles",   },
          { key: "rush yds", label: "Rushing yards",              abbr: "Rush Yds"     },
          { key: "ypc",      label: "Yards per carry",            abbr: "Yds / Carry", format: "1dp" },
        ],
      },
      {
        title: "Pressure & Timing",
        stats: [
          { key: "sk",     label: "Sacks",                      abbr: "Sacks"         },
          { key: "avgttt", label: "Average time to throw (s)",  abbr: "Time to Throw" },
        ],
      },
      {
        title: "Accuracy & Depth",
        stats: [
          { key: "acc%",      label: "Accurate throw percentage",           abbr: "Acc %"              },
          { key: "acomp%",    label: "Adjusted completion percentage",      abbr: "Adj Comp %"         },
          { key: "adot",      label: "Average depth of target (yards)",     abbr: "Avg Target Depth"   },
          { key: "air%",      label: "Air yards percentage",                abbr: "Air %"              },
          { key: "ps%",       label: "Past the sticks percentage",          abbr: "Past Sticks %"      },
          { key: "ss%",       label: "Short of the sticks percentage",      abbr: "Short of Sticks %"  },
          { key: "plus%",     label: "Perfect accuracy percentage",         abbr: "Perfect Acc %"      },
          { key: "cat inac%", label: "Catchable but inaccurate percentage", abbr: "Catchable Inac %"   },
          { key: "unc inac%", label: "Uncatchable inaccurate percentage",   abbr: "Uncatchable Inac %" },
        ],
      },
      {
        title: "Big Plays & Risk",
        stats: [
          { key: "bp",    label: "Batted passes",                   abbr: "Batted Passes"   },
          { key: "btt",   label: "Big time throws",                 abbr: "Big Time Throws" },
          { key: "btt%",  label: "Big time throw percentage",       abbr: "BTT %"           },
          { key: "twp",   label: "Turnover-worthy plays",           abbr: "TW Plays"        },
          { key: "twp%",  label: "Turnover-worthy play percentage", abbr: "TWP %"           },
          { key: "1d",    label: "First downs",                     abbr: "First Downs"     },
          { key: "dp",    label: "Dropped passes",                  abbr: "Drops"           },
        ],
      },
    ],
  };
})(window);
