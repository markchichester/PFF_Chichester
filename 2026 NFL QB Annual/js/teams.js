/** NFL franchise_id → team display + colors. IDs match PFF passing summary franchise_id. */
window.QbAnnualTeams = {
  byId: {
    1:  { nickname: "Cardinals",   abbr: "ARZ", espn: "ari", primary: "#97233f", secondary: "#ffffff" },
    2:  { nickname: "Falcons",     abbr: "ATL", espn: "atl", primary: "#a71930", secondary: "#000000" },
    3:  { nickname: "Ravens",      abbr: "BLT", espn: "bal", primary: "#1a195f", secondary: "#9e824c" },
    4:  { nickname: "Bills",       abbr: "BUF", espn: "buf", primary: "#00338d", secondary: "#c60c30" },
    5:  { nickname: "Panthers",    abbr: "CAR", espn: "car", primary: "#0085ca", secondary: "#bfc0bf" },
    6:  { nickname: "Bears",       abbr: "CHI", espn: "chi", primary: "#0b162a", secondary: "#c83803" },
    7:  { nickname: "Bengals",     abbr: "CIN", espn: "cin", primary: "#fb4f14", secondary: "#000000" },
    8:  { nickname: "Browns",      abbr: "CLV", espn: "cle", primary: "#311d00", secondary: "#ff3c00" },
    9:  { nickname: "Cowboys",     abbr: "DAL", espn: "dal", primary: "#002244", secondary: "#b0b7bc" },
    10: { nickname: "Broncos",     abbr: "DEN", espn: "den", primary: "#fb4f14", secondary: "#002244" },
    11: { nickname: "Lions",       abbr: "DET", espn: "det", primary: "#0076b6", secondary: "#b0b7bc" },
    12: { nickname: "Packers",     abbr: "GB",  espn: "gb",  primary: "#183028", secondary: "#ffb81c" },
    13: { nickname: "Texans",      abbr: "HST", espn: "hou", primary: "#03202f", secondary: "#a71930" },
    14: { nickname: "Colts",       abbr: "IND", espn: "ind", primary: "#002c5f", secondary: "#a2aaad" },
    15: { nickname: "Jaguars",     abbr: "JAX", espn: "jax", primary: "#006778", secondary: "#d7a22a" },
    16: { nickname: "Chiefs",      abbr: "KC",  espn: "kc",  primary: "#e31837", secondary: "#ffb81c" },
    17: { nickname: "Dolphins",    abbr: "MIA", espn: "mia", primary: "#008e97", secondary: "#fc4c02" },
    18: { nickname: "Vikings",     abbr: "MIN", espn: "min", primary: "#4f2683", secondary: "#ffc62f" },
    19: { nickname: "Patriots",    abbr: "NE",  espn: "ne",  primary: "#002244", secondary: "#c60c30" },
    20: { nickname: "Saints",      abbr: "NO",  espn: "no",  primary: "#101820", secondary: "#d3bc8d" },
    21: { nickname: "Giants",      abbr: "NYG", espn: "nyg", primary: "#012352", secondary: "#a30d2d" },
    22: { nickname: "Jets",        abbr: "NYJ", espn: "nyj", primary: "#125740", secondary: "#ffffff" },
    23: { nickname: "Raiders",     abbr: "LV",  espn: "lv",  primary: "#000000", secondary: "#a5acaf" },
    24: { nickname: "Eagles",      abbr: "PHI", espn: "phi", primary: "#004c54", secondary: "#a5acaf" },
    25: { nickname: "Steelers",    abbr: "PIT", espn: "pit", primary: "#101820", secondary: "#ffb612" },
    26: { nickname: "Rams",        abbr: "LA",  espn: "lar", primary: "#003594", secondary: "#ffd100" },
    27: { nickname: "Chargers",    abbr: "LAC", espn: "lac", primary: "#002a5e", secondary: "#ffc20e" },
    28: { nickname: "49ers",       abbr: "SF",  espn: "sf",  primary: "#aa0000", secondary: "#b3995d" },
    29: { nickname: "Seahawks",    abbr: "SEA", espn: "sea", primary: "#002244", secondary: "#69be28" },
    30: { nickname: "Buccaneers",  abbr: "TB",  espn: "tb",  primary: "#d50a0a", secondary: "#34302b" },
    31: { nickname: "Titans",      abbr: "TEN", espn: "ten", primary: "#0c2340", secondary: "#418fde" },
    32: { nickname: "Commanders",  abbr: "WAS", espn: "wsh", primary: "#773141", secondary: "#ffb612" },
  },

  resolve(franchiseId) {
    const team = this.byId[String(franchiseId || "").trim()];
    return {
      primary:   team?.primary   || "#0F0F10",
      secondary: team?.secondary || "#ffffff",
      nickname:  team?.nickname  || "",
      abbr:      team?.abbr      || "",
      logo:      team ? `https://a.espncdn.com/i/teamlogos/nfl/500-dark/${team.espn}.png` : "",
    };
  },

  /** Resolve by nickname string (e.g. "Seahawks", "49ers"). Case-insensitive. */
  resolveByNickname(nickname) {
    if (!nickname) return { primary: "#0F0F10", secondary: "#ffffff", nickname: "", abbr: "", logo: "" };
    const norm = String(nickname).trim().toLowerCase();
    const entry = Object.values(this.byId).find(
      (t) => t.nickname.toLowerCase() === norm
    );
    return {
      primary:   entry?.primary   || "#0F0F10",
      secondary: entry?.secondary || "#ffffff",
      nickname:  entry?.nickname  || nickname,
      abbr:      entry?.abbr      || "",
      logo:      entry ? `https://a.espncdn.com/i/teamlogos/nfl/500-dark/${entry.espn}.png` : "",
    };
  },
};
