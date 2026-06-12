/**
 * Interactive modals for live preview (season rankings, game log detail).
 */
(function (global) {
  const { escapeHtml, escapeAttr } = global.QbAnnualUtils;

  let backdrop = null;
  let bodyEl = null;
  let closeBtn = null;
  let lastFocus = null;

  function formatGrade(n) {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    return Number(n).toFixed(1);
  }

  function formatWar(n) {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    return Number(n).toFixed(2);
  }

  function ensureShell(host) {
    if (backdrop?.isConnected) return;
    backdrop = document.createElement("div");
    backdrop.className = "qb-modal-backdrop";
    backdrop.hidden = true;
    backdrop.innerHTML = `
<div class="qb-modal" role="dialog" aria-modal="true" aria-labelledby="qbModalTitle">
  <button type="button" class="qb-modal-close" aria-label="Close">&times;</button>
  <div class="qb-modal-body" id="qbModalBody"></div>
</div>`;
    (document.body || host).appendChild(backdrop);
    bodyEl = backdrop.querySelector(".qb-modal-body");
    closeBtn = backdrop.querySelector(".qb-modal-close");

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
    document.addEventListener("keydown", onKeydown);
  }

  function onKeydown(e) {
    if (e.key === "Escape" && backdrop && !backdrop.hidden) close();
  }

  function open(titleHtml, contentHtml) {
    if (!bodyEl) return;
    bodyEl.innerHTML = `<h3 class="qb-modal-title" id="qbModalTitle">${titleHtml}</h3>${contentHtml}`;
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add("is-open"));
    closeBtn?.focus();
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove("is-open");
    backdrop.hidden = true;
    bodyEl.innerHTML = "";
    if (lastFocus?.focus) lastFocus.focus();
  }

  function buildRankModal(season, profile) {
    const rows = profile.seasonRankings?.[season] || [];
    const highlightId = String(profile.playerId || "");

    const tableRows = rows
      .map((row) => {
        const isCurrent = highlightId && String(row.playerId) === highlightId;
        return `<tr class="${isCurrent ? "is-current" : ""}">
  <td class="qb-rank-num">${row.rank}</td>
  <td class="qb-rank-player">${escapeHtml(row.playerName)}</td>
  <td class="qb-rank-team">${escapeHtml(row.teamName || "—")}</td>
  <td class="qb-rank-grade">${formatGrade(row.grade)}</td>
</tr>`;
      })
      .join("");

    open(
      `${escapeHtml(String(season))} PFF passing grade rankings`,
      `<div class="qb-modal-scroll">
  <table class="qb-rank-table">
    <thead>
      <tr>
        <th scope="col">Rank</th>
        <th scope="col">Player</th>
        <th scope="col">Team</th>
        <th scope="col">Grade</th>
      </tr>
    </thead>
    <tbody>${tableRows || `<tr><td colspan="4">No rankings for ${escapeHtml(String(season))}.</td></tr>`}</tbody>
  </table>
</div>`
    );
    const currentRow = bodyEl.querySelector("tr.is-current");
    if (currentRow) currentRow.scrollIntoView({ block: "center" });
  }

  function buildMetricRankModal(season, profile, config) {
    const rows = profile[config.rankingsKey]?.[season] || [];
    const highlightId = String(profile.playerId || "");

    const tableRows = rows
      .map((row) => {
        const isCurrent = highlightId && String(row.playerId) === highlightId;
        return `<tr class="${isCurrent ? "is-current" : ""}">
  <td class="qb-rank-num">${row.rank}</td>
  <td class="qb-rank-player">${escapeHtml(row.playerName)}</td>
  <td class="qb-rank-team">${escapeHtml(row.teamName || "—")}</td>
  <td class="qb-rank-grade">${escapeHtml(row.displayValue ?? "—")}</td>
</tr>`;
      })
      .join("");

    open(
      `${escapeHtml(String(season))} ${escapeHtml(config.title)}`,
      `<div class="qb-modal-scroll">
  <table class="qb-rank-table">
    <thead>
      <tr>
        <th scope="col">Rank</th>
        <th scope="col">Player</th>
        <th scope="col">Team</th>
        <th scope="col">${escapeHtml(config.columnLabel)}</th>
      </tr>
    </thead>
    <tbody>${tableRows || `<tr><td colspan="4">No rankings for ${escapeHtml(String(season))}.</td></tr>`}</tbody>
  </table>
</div>`
    );
    const currentRow = bodyEl.querySelector("tr.is-current");
    if (currentRow) currentRow.scrollIntoView({ block: "center" });
  }

  function buildWarRankModal(season, profile) {
    const rows = profile.warSeasonRankings?.[season] || [];
    const highlightId = String(profile.playerId || "");

    const tableRows = rows
      .map((row) => {
        const isCurrent = highlightId && String(row.playerId) === highlightId;
        return `<tr class="${isCurrent ? "is-current" : ""}">
  <td class="qb-rank-num">${row.rank}</td>
  <td class="qb-rank-player">${escapeHtml(row.playerName)}</td>
  <td class="qb-rank-team">${escapeHtml(row.teamName || "—")}</td>
  <td class="qb-rank-grade">${formatWar(row.war)}</td>
</tr>`;
      })
      .join("");

    open(
      `${escapeHtml(String(season))} quarterback WAR rankings`,
      `<div class="qb-modal-scroll">
  <table class="qb-rank-table">
    <thead>
      <tr>
        <th scope="col">Rank</th>
        <th scope="col">Player</th>
        <th scope="col">Team</th>
        <th scope="col">WAR</th>
      </tr>
    </thead>
    <tbody>${tableRows || `<tr><td colspan="4">No WAR rankings for ${escapeHtml(String(season))}.</td></tr>`}</tbody>
  </table>
</div>`
    );
    const currentRow = bodyEl.querySelector("tr.is-current");
    if (currentRow) currentRow.scrollIntoView({ block: "center" });
  }

  function statValue(stats, key) {
    if (!stats) return "—";
    const val = stats[key];
    if (val == null || val === "") return "—";
    return String(val);
  }

  function buildRushingRankModal(metricId, profile) {
    const rows =
      profile.rushingRankings?.[metricId] || profile.rushing?.rankings?.[metricId] || [];
    const highlightId = String(profile.playerId || "");
    const columnLabel =
      profile.rushingMetricLabels?.[metricId] ||
      profile.rushing?.metricLabels?.[metricId] ||
      "Value";

    const tableRows = rows
      .map((row) => {
        const isCurrent = highlightId && String(row.playerId) === highlightId;
        return `<tr class="${isCurrent ? "is-current" : ""}">
  <td class="qb-rank-num">${row.rank}</td>
  <td class="qb-rank-player">${escapeHtml(row.playerName)}</td>
  <td class="qb-rank-team">${escapeHtml(row.teamName || "—")}</td>
  <td class="qb-rank-grade">${escapeHtml(row.displayValue ?? "—")}</td>
</tr>`;
      })
      .join("");

    open(
      `${escapeHtml(columnLabel)} rankings`,
      `<div class="qb-modal-scroll">
  <table class="qb-rank-table">
    <thead>
      <tr>
        <th scope="col">Rank</th>
        <th scope="col">Player</th>
        <th scope="col">Team</th>
        <th scope="col">${escapeHtml(columnLabel)}</th>
      </tr>
    </thead>
    <tbody>${tableRows || `<tr><td colspan="4">No rankings found.</td></tr>`}</tbody>
  </table>
</div>`
    );
    const currentRow = bodyEl.querySelector("tr.is-current");
    if (currentRow) currentRow.scrollIntoView({ block: "center" });
  }

  function buildGameModal(week, profile) {
    const game = (profile.gameGrades || []).find((g) => g.week === week);
    if (!game) return;

    const weekLabel = game.weekLabel || `Week ${game.week}`;
    const opponent = game.opponent || "—";
    const stats = game.gameStats || {};
    const glossary = global.QbAnnualStatGlossary?.groups || [];

    const statBlocks = glossary
      .map((group) => {
        const items = group.stats
          .map((stat) => {
            const value = statValue(stats, stat.key);
            if (value === "—") return "";
            return `<div class="qb-game-stat">
  <span class="qb-game-stat-abbr" title="${escapeAttr(stat.label)}">${escapeHtml(stat.abbr)}</span>
  <span class="qb-game-stat-value">${escapeHtml(value)}</span>
</div>`;
          })
          .filter(Boolean)
          .join("");
        if (!items) return "";
        return `<div class="qb-game-stat-group">
  <h4 class="qb-game-stat-group-title">${escapeHtml(group.title)}</h4>
  <div class="qb-game-stat-grid">${items}</div>
</div>`;
      })
      .filter(Boolean)
      .join("");

    open(
      `${escapeHtml(weekLabel)} · ${escapeHtml(opponent)}`,
      `<div class="qb-game-modal-head">
  <div class="qb-game-modal-grade">
    <span class="qb-game-modal-grade-label">PFF grade</span>
    <span class="qb-game-modal-grade-value">${formatGrade(game.grade)}</span>
  </div>
</div>
${statBlocks || `<p class="qb-modal-sub">No stat line found in opponents.csv for this week.</p>`}`
    );
  }

  function wireProfile(host, profile) {
    if (!host || !profile) return;

    host.querySelectorAll(".qb-donut-interactive[data-rank-season]").forEach((el) => {
      const openRank = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const season = parseInt(el.dataset.rankSeason, 10);
        if (!Number.isFinite(season)) return;
        buildRankModal(season, profile);
      };
      el.addEventListener("click", openRank);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openRank(e);
      });
    });

    host.querySelectorAll(".qb-donut-interactive[data-war-season]").forEach((el) => {
      const openWarRank = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const season = parseInt(el.dataset.warSeason, 10);
        if (!Number.isFinite(season)) return;
        buildWarRankModal(season, profile);
      };
      el.addEventListener("click", openWarRank);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openWarRank(e);
      });
    });

    host.querySelectorAll(".qb-donut-interactive[data-ttt-season]").forEach((el) => {
      const openRank = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const season = parseInt(el.dataset.tttSeason, 10);
        if (!Number.isFinite(season)) return;
        buildMetricRankModal(season, profile, {
          rankingsKey: "timeToThrowRankings",
          title: "average time to throw rankings",
          columnLabel: "Time to throw",
        });
      };
      el.addEventListener("click", openRank);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openRank(e);
      });
    });

    host.querySelectorAll(".qb-donut-interactive[data-adot-season]").forEach((el) => {
      const openRank = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const season = parseInt(el.dataset.adotSeason, 10);
        if (!Number.isFinite(season)) return;
        buildMetricRankModal(season, profile, {
          rankingsKey: "targetDepthRankings",
          title: "average target depth rankings",
          columnLabel: "Avg depth",
        });
      };
      el.addEventListener("click", openRank);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openRank(e);
      });
    });

    host.querySelectorAll(".qb-donut-interactive[data-pts-season]").forEach((el) => {
      const openRank = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const season = parseInt(el.dataset.ptsSeason, 10);
        if (!Number.isFinite(season)) return;
        buildMetricRankModal(season, profile, {
          rankingsKey: "pressureToSackRateRankings",
          title: "pressure to sack rate rankings",
          columnLabel: "Pressure to sack",
        });
      };
      el.addEventListener("click", openRank);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openRank(e);
      });
    });

    host.querySelectorAll(".qb-rush-card[data-rush-metric]").forEach((el) => {
      const openRank = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const metricId = el.dataset.rushMetric;
        if (!metricId) return;
        buildRushingRankModal(metricId, profile);
      };
      el.addEventListener("click", openRank);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openRank(e);
      });
    });

    host.querySelectorAll(".qb-rush-hero-ring[data-rush-metric]").forEach((el) => {
      const openRank = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const metricId = el.dataset.rushMetric;
        if (!metricId) return;
        buildRushingRankModal(metricId, profile);
      };
      el.addEventListener("click", openRank);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openRank(e);
      });
    });

    host.querySelectorAll(".qb-game-bar-hit[data-game-week]").forEach((el) => {
      const openGame = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const week = parseInt(el.dataset.gameWeek, 10);
        if (!Number.isFinite(week)) return;
        buildGameModal(week, profile);
      };
      el.addEventListener("click", openGame);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openGame(e);
      });
    });
  }

  function init(host, profile) {
    destroy();
    if (!host || !profile) return;
    ensureShell(host);
    wireProfile(host, profile);
  }

  function destroy() {
    close();
  }

  global.QbAnnualModals = { init, destroy, close };
})(window);
