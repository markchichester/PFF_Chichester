/** NFL franchise_id → team display + colors (from passing summary franchise_id). */
window.QbAnnualTeams = {
  byId: {
    1: { nickname: "Falcons", primary: "#A71930" },
    2: { nickname: "Panthers", primary: "#0085CA" },
    3: { nickname: "Bears", primary: "#0B162A" },
    4: { nickname: "Bills", primary: "#00338D" },
    5: { nickname: "Bengals", primary: "#FB4F14" },
    6: { nickname: "Browns", primary: "#311D00" },
    7: { nickname: "Cowboys", primary: "#003594" },
    8: { nickname: "Broncos", primary: "#FB4F14" },
    9: { nickname: "Lions", primary: "#0076B6" },
    10: { nickname: "Packers", primary: "#203731" },
    11: { nickname: "Texans", primary: "#03202F" },
    12: { nickname: "Colts", primary: "#002C5F" },
    13: { nickname: "Jaguars", primary: "#006778" },
    14: { nickname: "Chiefs", primary: "#E31837" },
    15: { nickname: "Raiders", primary: "#000000" },
    16: { nickname: "Chargers", primary: "#0080C6" },
    17: { nickname: "Rams", primary: "#003594" },
    18: { nickname: "Dolphins", primary: "#008E97" },
    19: { nickname: "Vikings", primary: "#4F2683" },
    20: { nickname: "Patriots", primary: "#002244" },
    21: { nickname: "Saints", primary: "#D3BC8D" },
    22: { nickname: "Giants", primary: "#0B2265" },
    23: { nickname: "Jets", primary: "#125740" },
    24: { nickname: "Eagles", primary: "#004C54" },
    25: { nickname: "Steelers", primary: "#FFB612" },
    26: { nickname: "49ers", primary: "#AA0000" },
    27: { nickname: "Seahawks", primary: "#002244" },
    28: { nickname: "Buccaneers", primary: "#D50A0A" },
    29: { nickname: "Titans", primary: "#0C2340" },
    30: { nickname: "Commanders", primary: "#5A1414" },
    31: { nickname: "Cardinals", primary: "#97233F" },
    32: { nickname: "Ravens", primary: "#241773" },
  },

  resolve(franchiseId) {
    const team = this.byId[String(franchiseId || "").trim()];
    return {
      primary: team?.primary || "#0F0F10",
      nickname: team?.nickname || "",
    };
  },
};
