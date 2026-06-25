/** NFL franchise_id → team display + colors. IDs match PFF passing summary franchise_id. */
const _PFF = "https://pro-football-focus.github.io/gravity/src/assets/svg/nfl/";
window.QbAnnualTeams = {
  byId: {
    1:  { nickname: "Cardinals",   abbr: "ARZ", primary: "#97233f", secondary: "#ffffff",  logo: _PFF + "arizona-cardinals.svg" },
    2:  { nickname: "Falcons",     abbr: "ATL", primary: "#a71930", secondary: "#000000",  logo: _PFF + "atlanta-falcons.svg" },
    3:  { nickname: "Ravens",      abbr: "BLT", primary: "#1a195f", secondary: "#000000",  logo: _PFF + "baltimore-ravens.svg" },
    4:  { nickname: "Bills",       abbr: "BUF", primary: "#00338d", secondary: "#c60c30",  logo: _PFF + "buffalo-bills.svg" },
    5:  { nickname: "Panthers",    abbr: "CAR", primary: "#0085ca", secondary: "#bfc0bf",  logo: _PFF + "carolina-panthers.svg" },
    6:  { nickname: "Bears",       abbr: "CHI", primary: "#0b162a", secondary: "#c83803",  logo: _PFF + "chicago-bears.svg" },
    7:  { nickname: "Bengals",     abbr: "CIN", primary: "#fb4f14", secondary: "#000000",  logo: _PFF + "cincinnati-bengals.svg" },
    8:  { nickname: "Browns",      abbr: "CLV", primary: "#311d00", secondary: "#ff3c00",  logo: _PFF + "cleveland-browns.svg" },
    9:  { nickname: "Cowboys",     abbr: "DAL", primary: "#002244", secondary: "#ffffff",  logo: _PFF + "dallas-cowboys.svg" },
    10: { nickname: "Broncos",     abbr: "DEN", primary: "#fb4f14", secondary: "#002244",  logo: _PFF + "denver-broncos.svg" },
    11: { nickname: "Lions",       abbr: "DET", primary: "#0076b6", secondary: "#b0b7bc",  logo: _PFF + "detroit-lions.svg" },
    12: { nickname: "Packers",     abbr: "GB",  primary: "#183028", secondary: "#ffb81c",  logo: _PFF + "green-bay-packers.svg" },
    13: { nickname: "Texans",      abbr: "HST", primary: "#03202f", secondary: "#a71930",  logo: _PFF + "houston-texans.svg" },
    14: { nickname: "Colts",       abbr: "IND", primary: "#002c5f", secondary: "#ffffff",  logo: _PFF + "indianapolis-colts.svg" },
    15: { nickname: "Jaguars",     abbr: "JAX", primary: "#006778", secondary: "#d7a22a",  logo: _PFF + "jacksonville-jaguars.svg" },
    16: { nickname: "Chiefs",      abbr: "KC",  primary: "#e31837", secondary: "#ffb81c",  logo: _PFF + "kansas-city-chiefs.svg" },
    17: { nickname: "Dolphins",    abbr: "MIA", primary: "#008e97", secondary: "#fc4c02",  logo: _PFF + "miami-dolphins.svg" },
    18: { nickname: "Vikings",     abbr: "MIN", primary: "#4f2683", secondary: "#ffc62f",  logo: _PFF + "minnesota-vikings.svg" },
    19: { nickname: "Patriots",    abbr: "NE",  primary: "#002244", secondary: "#c60c30",  logo: "https://media.pff.com/2026/06/Patriots.png" },
    20: { nickname: "Saints",      abbr: "NO",  primary: "#d3bc8d", secondary: "#000000",  logo: _PFF + "new-orleans-saints.svg" },
    21: { nickname: "Giants",      abbr: "NYG", primary: "#012352", secondary: "#a30d2d",  logo: "https://media.pff.com/2026/06/Giants.png" },
    22: { nickname: "Jets",        abbr: "NYJ", primary: "#125740", secondary: "#ffffff",  logo: "https://media.pff.com/2026/06/Jets-scaled.png" },
    23: { nickname: "Raiders",     abbr: "LV",  primary: "#000000", secondary: "#a5acaf",  logo: _PFF + "las-vegas-raiders.svg" },
    24: { nickname: "Eagles",      abbr: "PHI", primary: "#004c54", secondary: "#a5acaf",  logo: _PFF + "philadelphia-eagles.svg" },
    25: { nickname: "Steelers",    abbr: "PIT", primary: "#000000", secondary: "#ffb612",  logo: _PFF + "pittsburgh-steelers.svg" },
    26: { nickname: "Rams",        abbr: "LA",  primary: "#003594", secondary: "#ffd100",  logo: "https://media.pff.com/2026/06/Rams.png" },
    27: { nickname: "Chargers",    abbr: "LAC", primary: "#002a5e", secondary: "#ffc20e",  logo: _PFF + "los-angeles-chargers.svg" },
    28: { nickname: "49ers",       abbr: "SF",  primary: "#aa0000", secondary: "#ad995d",  logo: _PFF + "san-francisco-49ers.svg" },
    29: { nickname: "Seahawks",    abbr: "SEA", primary: "#002244", secondary: "#69be28",  logo: _PFF + "seattle-seahawks.svg" },
    30: { nickname: "Buccaneers",  abbr: "TB",  primary: "#d50a0a", secondary: "#34302b",  logo: _PFF + "tampa-bay-buccaneers.svg" },
    31: { nickname: "Titans",      abbr: "TEN", primary: "#0c2340", secondary: "#418fde",  logo: _PFF + "tennessee-titans.svg" },
    32: { nickname: "Commanders",  abbr: "WAS", primary: "#773141", secondary: "#ffb612",  logo: _PFF + "washington-commanders.svg" },
  },

  resolve(franchiseId) {
    const team = this.byId[String(franchiseId || "").trim()];
    return {
      primary:   team?.primary   || "#0F0F10",
      secondary: team?.secondary || "#ffffff",
      nickname:  team?.nickname  || "",
      abbr:      team?.abbr      || "",
      logo:      team?.logo      || "",
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
      logo:      entry?.logo      || "",
    };
  },
};
