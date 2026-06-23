/**
 * QB Annual profile — hero, season donuts, game grades, grade distribution.
 */
(function (global) {
  const { escapeHtml, escapeAttr, normalizeHex, splitDisplayName } = global.QbAnnualUtils;
  const PROFILE_MAX = 1100;
  const SCATTER_CHART_HEIGHT = 560;

  /** Single source of truth for target-depth field geometry (zones + SVG + turf). */
  function buildDepthFieldLayout() {
    const sl = 1.2;
    const sr = 98.8;
    const ezH = 8;
    const goal = 8;
    const gap = 2;
    const rowH = 19.5;
    const backH = 18;
    const fieldW = sr - sl;
    const colW = 30;
    const colGap = (fieldW - 3 * colW) / 2;
    const colL = [sl, sl + colW + colGap, sl + 2 * (colW + colGap)];
    const divX = [colL[0] + colW + colGap / 2, colL[1] + colW + colGap / 2];
    const rows = {
      deep:       { t: goal, h: rowH },
      medium:     { t: goal + rowH + gap, h: rowH },
      short:      { t: goal + 2 * (rowH + gap), h: rowH },
      behind_los: { t: goal + 3 * (rowH + gap), h: backH },
    };
    const yardLines = [
      goal + rowH + gap / 2,
      goal + 2 * rowH + 3 * gap / 2,
    ];
    const los = goal + 3 * rowH + 2.5 * gap;
    const backTop = rows.behind_los.t + rows.behind_los.h;
    const rowCenter = (key) => rows[key].t + rows[key].h / 2;
    return {
      sl, sr, ezH, goal, gap, colW, colL, divX, rows, yardLines, los, backTop,
      rowCenter,
      rowLabelY: {
        deep: rowCenter("deep"),
        medium: rowCenter("medium"),
        short: rowCenter("short"),
        behind_los: rowCenter("behind_los"),
      },
    };
  }

  function buildDepthFieldSvg(F) {
    // Horizontal hash marks ON each yard line (NFL-style, at hash columns)
    const hashOnLine = (y) =>
      [[14, 18], [43, 47], [53, 57], [82, 86]]
        .map(([x1, x2]) => `<line class="qb-grid-hash" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`)
        .join("");

    // Vertical hash ticks BETWEEN yard lines — every ~1 yard at hash columns + sideline ticks
    const hashColumns = [16, 45, 55, 84];
    const tickHalf = 0.5;
    const sidelineTick = 1.6;
    const y0 = F.goal;
    const y1 = F.backTop;
    const yardCount = 32;
    const step = (y1 - y0) / yardCount;
    const isMajorY = (y) =>
      Math.abs(y - F.goal) < step * 0.35
      || F.yardLines.some((yl) => Math.abs(y - yl) < step * 0.35)
      || Math.abs(y - F.los) < step * 0.35
      || Math.abs(y - F.backTop) < step * 0.35;

    let hashTicks = "";
    for (let i = 1; i < yardCount; i++) {
      const y = y0 + i * step;
      if (isMajorY(y)) continue;
      const ys = y.toFixed(2);
      hashColumns.forEach((x) => {
        hashTicks += `<line class="qb-grid-hash-v" x1="${x}" y1="${(y - tickHalf).toFixed(2)}" x2="${x}" y2="${(y + tickHalf).toFixed(2)}"/>`;
      });
      hashTicks += `<line class="qb-grid-hash-v" x1="${F.sl}" y1="${ys}" x2="${(F.sl + sidelineTick).toFixed(2)}" y2="${ys}"/>`;
      hashTicks += `<line class="qb-grid-hash-v" x1="${(F.sr - sidelineTick).toFixed(2)}" y1="${ys}" x2="${F.sr}" y2="${ys}"/>`;
    }

    // 5-yard lines (lighter) between each 10-yard band
    const fiveYardLines = [
      (F.goal + F.yardLines[0]) / 2,
      (F.yardLines[0] + F.yardLines[1]) / 2,
      (F.yardLines[1] + F.los) / 2,
      (F.los + F.backTop) / 2,
    ]
      .map((y) => `<line class="qb-grid-yl-5" x1="${F.sl}" y1="${y}" x2="${F.sr}" y2="${y}"/>`)
      .join("");

    const yardNum = (y, n, x) =>
      `<text class="qb-grid-ynum" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${x} ${y})">${n}</text>`;
    const yardNums = [
      ["short", 10],
      ["medium", 20],
      ["deep", 30],
    ]
      .map(([key, n]) => {
        const y = F.rowCenter(key);
        return yardNum(y, n, F.sl + 4.5) + yardNum(y, n, F.sr - 4.5);
      })
      .join("");

    return `<svg class="qb-depth-grid-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <pattern id="qb-depth-ez" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="5" height="5" fill="rgba(8,12,18,.85)"/>
                  <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
                </pattern>
              </defs>
              <rect class="qb-grid-field-bg" x="${F.sl}" y="0" width="${F.sr - F.sl}" height="100"/>
              <rect class="qb-grid-endzone-bg" x="${F.sl}" y="0" width="${F.sr - F.sl}" height="${F.ezH}" fill="url(#qb-depth-ez)"/>
              ${fiveYardLines}
              <line class="qb-grid-sideline" x1="${F.sl}" y1="0" x2="${F.sl}" y2="100"/>
              <line class="qb-grid-sideline" x1="${F.sr}" y1="0" x2="${F.sr}" y2="100"/>
              <line class="qb-grid-sideline-cap" x1="${F.sl}" y1="0" x2="${F.sr}" y2="0"/>
              <line class="qb-grid-goal" x1="${F.sl}" y1="${F.goal}" x2="${F.sr}" y2="${F.goal}"/>
              ${hashTicks}
              <line class="qb-grid-yl" x1="${F.sl}" y1="${F.yardLines[0]}" x2="${F.sr}" y2="${F.yardLines[0]}"/>
              <line class="qb-grid-yl" x1="${F.sl}" y1="${F.yardLines[1]}" x2="${F.sr}" y2="${F.yardLines[1]}"/>
              ${hashOnLine(F.yardLines[0])}
              ${hashOnLine(F.yardLines[1])}
              ${hashOnLine(F.los)}
              <line class="qb-grid-los" x1="${F.sl}" y1="${F.los}" x2="${F.sr}" y2="${F.los}"/>
              <line class="qb-grid-div" x1="${F.divX[0]}" y1="${F.goal}" x2="${F.divX[0]}" y2="${F.backTop}"/>
              <line class="qb-grid-div" x1="${F.divX[1]}" y1="${F.goal}" x2="${F.divX[1]}" y2="${F.backTop}"/>
              ${yardNums}
              <text class="qb-grid-ez-label" x="50" y="${F.ezH * 0.55}" text-anchor="middle">END ZONE</text>
            </svg>`;
  }

  const Profile = {
    formatGrade(n) {
      if (n == null || !Number.isFinite(Number(n))) return "—";
      return Number(n).toFixed(1);
    },

    formatWar(n) {
      if (n == null || !Number.isFinite(Number(n))) return "—";
      return Number(n).toFixed(2);
    },

    buildDonutSvg(season, accent) {
      const grade = season.grade ?? 0;
      const pct = Math.max(0, Math.min(100, grade)) / 100;
      const size = 240;
      const cx = size / 2;
      const cy = size / 2;
      const r = 82;
      const stroke = 18;
      const innerR = 58;
      const circ = 2 * Math.PI * r;
      const dash = pct * circ;
      const gap = circ - dash;
      const gradeText = this.formatGrade(season.grade);
      const rankText = season.rankLabel || "—";
      const ringColor = normalizeHex(accent, "#2D6A4F");

      return `
<figure class="qb-donut qb-donut-interactive qb-animate-item" style="--delay: ${(season.season - 2023) * 120}ms" data-rank-season="${season.season}" role="button" tabindex="0" aria-label="${escapeAttr(`View ${season.season} quarterback rankings`)}">
  <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="${stroke}" />
    <circle class="qb-donut-progress" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ringColor}" stroke-width="${stroke}"
      stroke-linecap="butt"
      stroke-dasharray="0 ${circ.toFixed(2)}"
      data-dash="${dash.toFixed(2)}" data-gap="${gap.toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" />
    <g class="qb-donut-inner qb-animate-item qb-donut-hit" style="--delay: 420ms">
      <circle class="qb-donut-center" cx="${cx}" cy="${cy}" r="${innerR}" fill="#0F0F10" />
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="qb-donut-grade">${escapeHtml(gradeText)}</text>
      <text x="${cx}" y="${cy + 22}" text-anchor="middle" class="qb-donut-rank">${escapeHtml(rankText)}</text>
    </g>
  </svg>
  <figcaption class="qb-donut-year">${escapeHtml(String(season.season))}</figcaption>
  <p class="qb-donut-cta">View rankings</p>
</figure>`;
    },

    buildRankedMetricDonutSvg(season, accent, options = {}) {
      const pct = Math.max(0, Math.min(100, season.ringPct ?? 0)) / 100;
      const compact = options.compact !== false;
      const size = compact ? 200 : 240;
      const r = compact ? 68 : 82;
      const stroke = compact ? 16 : 18;
      const innerR = compact ? 48 : 58;
      const cx = size / 2;
      const cy = size / 2;
      const circ = 2 * Math.PI * r;
      const dash = pct * circ;
      const gap = circ - dash;
      const displayValue = options.displayValue ?? "—";
      const rankText = season.rankLabel || "—";
      const ringColor = normalizeHex(accent, "#2D6A4F");
      const className = options.className ? ` ${options.className}` : "";
      const dataAttr = options.dataAttr || "data-metric-season";
      const valueClass = options.valueClass ? ` ${options.valueClass}` : " qb-donut-metric";
      const ariaLabel =
        options.ariaLabel ||
        `View ${season.season} ${options.metricLabel || "metric"} rankings`;

      return `
<figure class="qb-donut qb-donut-interactive qb-animate-item${className}" style="--delay: ${(season.season - 2023) * 120}ms" ${dataAttr}="${season.season}" role="button" tabindex="0" aria-label="${escapeAttr(ariaLabel)}">
  <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="${stroke}" />
    <circle class="qb-donut-progress" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ringColor}" stroke-width="${stroke}"
      stroke-linecap="butt"
      stroke-dasharray="0 ${circ.toFixed(2)}"
      data-dash="${dash.toFixed(2)}" data-gap="${gap.toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" />
    <g class="qb-donut-inner qb-animate-item qb-donut-hit" style="--delay: 420ms">
      <circle class="qb-donut-center" cx="${cx}" cy="${cy}" r="${innerR}" fill="#0F0F10" />
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="qb-donut-grade${valueClass}">${escapeHtml(displayValue)}</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" class="qb-donut-rank">${escapeHtml(rankText)}</text>
    </g>
  </svg>
  <figcaption class="qb-donut-year">${escapeHtml(String(season.season))}</figcaption>
  <p class="qb-donut-cta">View rankings</p>
</figure>`;
    },

    buildWarDonutSvg(season, accent) {
      return this.buildRankedMetricDonutSvg(season, accent, {
        displayValue: this.formatWar(season.war),
        dataAttr: "data-war-season",
        metricLabel: "quarterback WAR",
        className: "qb-donut--war",
        valueClass: " qb-donut-war",
        compact: false,
      });
    },

    buildSeasonMetricDonutSvg(season, accent, options) {
      return this.buildRankedMetricDonutSvg(season, accent, options);
    },

    buildSeasonMetricDonutSection(profile, accent, config) {
      const seasons = profile[config.dataKey] || [];
      if (!seasons.length) return "";

      const donuts = seasons
        .map((s) =>
          this.buildSeasonMetricDonutSvg(s, accent, {
            displayValue: s.displayValue,
            dataAttr: config.dataAttr,
            metricLabel: config.metricLabel,
            className: "qb-donut--metric",
            valueClass: config.valueClass,
            compact: false,
          })
        )
        .join("");

      return this.buildCollapsibleSection({
        title: config.title,
        sectionClass: "qb-section-donuts",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">${escapeHtml(config.hint)}</p>`,
        bodyHtml: `<div class="qb-donut-row">${donuts}</div>`,
      });
    },

    buildSeasonGradesSection(profile, accent) {
      const donuts = (profile.seasonGrades || [])
        .map((s) => this.buildDonutSvg(s, accent))
        .join("");

      const carouselSlides = [
        { id: "grade", label: "PFF grade", html: donuts },
        profile.warSeasons?.length
          ? {
              id: "war",
              label: "WAR",
              html: profile.warSeasons.map((s) => this.buildWarDonutSvg(s, accent)).join(""),
            }
          : null,
      ].filter(Boolean);

      if (carouselSlides.length <= 1) {
        return this.buildCollapsibleSection({
          title: "PFF grade by season",
          sectionClass: "qb-section-donuts",
          leadHtml: `<p class="qb-interactive-hint qb-animate-item">Click a donut center for full season rankings</p>`,
          bodyHtml: `<div class="qb-donut-row">${donuts}</div>`,
        });
      }

      const tabs = carouselSlides
        .map(
          (slide, index) =>
            `<button type="button" class="qb-compare-tab" data-split-target="${escapeAttr(slide.id)}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHtml(slide.label)}</button>`
        )
        .join("");
      const slides = carouselSlides
        .map(
          (slide) =>
            `<article class="qb-compare-slide qb-season-metric-slide" data-split-id="${escapeAttr(slide.id)}">
  <div class="qb-donut-row">${slide.html}</div>
</article>`
        )
        .join("");

      return this.buildCollapsibleSection({
        title: "PFF grade by season",
        sectionClass: "qb-section-donuts",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Swipe or tap for WAR · click a donut center for season rankings</p>`,
        bodyHtml: `<div class="qb-compare-carousel qb-compare-carousel--donuts qb-animate-item" data-default-split="${escapeAttr(carouselSlides[0].id)}">
    <div class="qb-compare-tabs" role="tablist">${tabs}</div>
    <div class="qb-compare-track">${slides}</div>
  </div>`,
      });
    },

    buildGameGradesSvg(gameGrades, accent) {
      const bars = (gameGrades || []).filter((b) => Number.isFinite(b.grade));
      if (!bars.length) {
        return `<p class="qb-empty">Upload a 2025 game grades spreadsheet to show weekly passing grades.</p>`;
      }

      const W = PROFILE_MAX;
      const H = 320;
      const padL = 36;
      const padR = 16;
      const padT = 28;
      const padB = 48;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      const xStep = plotW / bars.length;
      const barW = Math.min(36, xStep * 0.62);
      const color = normalizeHex(accent, "#2D6A4F");
      const yScale = (v) => padT + plotH - (v / 100) * plotH;

      const gridLines = [0, 25, 50, 75, 100]
        .map((tick) => {
          const y = yScale(tick).toFixed(1);
          return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" class="qb-grid-line" />
<text x="${padL - 8}" y="${y}" text-anchor="end" dominant-baseline="middle" class="qb-axis-label">${tick}</text>`;
        })
        .join("");

      const baseY = padT + plotH;

      const barEls = bars
        .map((bar, i) => {
          const x = padL + i * xStep + (xStep - barW) / 2;
          const y = yScale(bar.grade);
          const h = baseY - y;
          const delay = i * 45;
          const opponentHint = bar.opponent ? ` · ${bar.opponent}` : "";
          return `<g class="qb-chart-bar qb-chart-bar--game" data-y="${y.toFixed(1)}" data-h="${h.toFixed(1)}" data-base="${baseY.toFixed(1)}" data-delay="${delay}">
  <rect class="qb-game-bar-fill" x="${x.toFixed(1)}" y="${baseY.toFixed(1)}" width="${barW.toFixed(1)}" height="0" fill="${color}" rx="2" />
  <rect class="qb-game-bar-hit" x="${(x - 4).toFixed(1)}" y="${padT.toFixed(1)}" width="${(barW + 8).toFixed(1)}" height="${plotH.toFixed(1)}"
    fill="transparent" data-game-week="${bar.week}" role="button" tabindex="0"
    aria-label="${escapeAttr(`Week ${bar.week}${opponentHint}: grade ${this.formatGrade(bar.grade)}`)}"/>
  <text class="qb-bar-value" x="${(x + barW / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" opacity="0" pointer-events="none">${this.formatGrade(bar.grade)}</text>
  <text class="qb-axis-label qb-game-week-label" x="${(x + barW / 2).toFixed(1)}" y="${(baseY + 22).toFixed(1)}" text-anchor="middle" pointer-events="none">${escapeHtml(String(bar.week))}</text>
</g>`;
        })
        .join("");

      return `<div class="qb-chart-wrap qb-chart-wrap--interactive qb-animate-item"><svg class="qb-game-chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="2025 game passing grades by week">
${gridLines}${barEls}</svg></div>`;
    },

    buildDistributionSvg(dist, color) {
      if (!dist?.buckets?.length) {
        return `<p class="qb-empty">Upload a grade distribution spreadsheet to show play-level grade buckets.</p>`;
      }

      const buckets = dist.buckets;
      const maxVol = Math.max(...buckets.map((b) => b.volume || 0), 1);
      const W = PROFILE_MAX;
      const H = 340;
      const padL = 48;
      const padR = 24;
      const padT = 24;
      const padB = 56;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      const xStep = plotW / buckets.length;
      const barW = Math.min(72, xStep * 0.72);
      const fill = normalizeHex(color, "#2D6A4F");

      const baseY = padT + plotH;

      const bars = buckets
        .map((b, i) => {
          const vol = b.volume || 0;
          const h = (vol / maxVol) * plotH;
          const x = padL + i * xStep + (xStep - barW) / 2;
          const y = baseY - h;
          const pct = Number.isFinite(b.pct) ? b.pct.toFixed(1) : "0.0";
          const delay = i * 55;
          return `<g class="qb-chart-bar" data-y="${y.toFixed(1)}" data-h="${h.toFixed(1)}" data-base="${baseY.toFixed(1)}" data-delay="${delay}">
  <rect x="${x.toFixed(1)}" y="${baseY.toFixed(1)}" width="${barW.toFixed(1)}" height="0" fill="${fill}" rx="2" />
  <text class="qb-bar-value" x="${(x + barW / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" opacity="0">${vol} (${pct}%)</text>
  <text class="qb-axis-label" x="${(x + barW / 2).toFixed(1)}" y="${(baseY + 24).toFixed(1)}" text-anchor="middle">${escapeHtml(b.label)}</text>
</g>`;
        })
        .join("");

      return `<div class="qb-chart-wrap qb-animate-item"><svg class="qb-dist-chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Play-level grade distribution">${bars}</svg></div>`;
    },

    statCountAttrs(label, value) {
      const raw = String(value ?? "").replace(/,/g, "");
      if (label === "Overall grade") {
        const n = parseFloat(raw);
        return Number.isFinite(n)
          ? ` data-count-target="${n}" data-count-decimals="1"`
          : "";
      }
      if (label === "Yards" || label === "Attempts" || label === "Completions" || label === "Touchdowns" || label === "Interceptions") {
        const n = parseFloat(raw);
        if (!Number.isFinite(n)) return "";
        const comma = label === "Yards" ? ` data-count-format="comma"` : "";
        return ` data-count-target="${n}" data-count-decimals="0"${comma}`;
      }
      return "";
    },

    buildHeroSection(profile) {
      const teamPrimary = normalizeHex(profile.teamColors?.primary, "#00338D");
      return `
<section class="qb-hero" style="--qb-team:${teamPrimary}">
  <div class="qb-hero-main">
    <div class="qb-hero-photo-wrap qb-animate-item" style="--delay: 0ms">
      <img class="qb-hero-photo" src="${escapeAttr(profile.headshotUrl)}" alt="${escapeAttr(`${profile.playerName} headshot`)}" width="220" height="220" loading="lazy" />
    </div>
    <div class="qb-hero-copy qb-animate-item" style="--delay: 100ms">
      <p class="qb-hero-kicker">${escapeHtml(profile.teamName)} · ${escapeHtml(profile.displaySeason)}</p>
      <h1 class="qb-hero-name">${escapeHtml(profile.playerName)}</h1>
      <p class="qb-hero-position">${escapeHtml(profile.position || "QB")}</p>
    </div>
  </div>
  <div class="qb-hero-stats" role="list">
    ${(profile.heroStats || [])
      .map(
        (s, i) => `<div class="qb-stat qb-animate-item" role="listitem" style="--delay: ${180 + i * 70}ms">
      <span class="qb-stat-value"${this.statCountAttrs(s.label, s.value)}>${escapeHtml(s.value)}</span>
      <span class="qb-stat-label">${escapeHtml(s.label)}</span>
    </div>`
      )
      .join("")}
  </div>
  ${this.buildGeneralAccuracyWidget(profile.generalAccuracy, teamPrimary)}
</section>`;
    },

    formatGeneralAccuracyPct(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      return `${value.toFixed(1)}%`;
    },

    formatGeneralAccuracyDelta(deltaPp) {
      if (deltaPp == null || !Number.isFinite(deltaPp)) return "—";
      const sign = deltaPp > 0 ? "+" : "";
      return `${sign}${deltaPp.toFixed(1)}%`;
    },

    buildGeneralAccuracyWidget(generalAccuracy, accent) {
      if (!generalAccuracy?.buckets?.length) return "";

      const ringColor = normalizeHex(accent, "#2D6A4F");
      const columnCells = generalAccuracy.buckets
        .map((bucket) => {
          const toneClass =
            bucket.deltaPp == null || Math.abs(bucket.deltaPp) < 0.05
              ? " is-neutral"
              : bucket.deltaPp > 0
                ? " is-above"
                : " is-below";
          return `<div class="qb-gen-acc-col">
      <span class="qb-gen-acc-col-label">${escapeHtml(bucket.label)}</span>
      <span class="qb-gen-acc-rate">${escapeHtml(this.formatGeneralAccuracyPct(bucket.accuracy))}</span>
      <span class="qb-gen-acc-delta${toneClass}">${escapeHtml(this.formatGeneralAccuracyDelta(bucket.deltaPp))}</span>
    </div>`;
        })
        .join("");

      return `<div class="qb-gen-acc qb-animate-item" style="--qb-gen-acc-accent:${ringColor}">
  <div class="qb-gen-acc-head">
    <div class="qb-gen-acc-brand">
      <span class="qb-gen-acc-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="6" height="6" fill="currentColor"/>
          <rect x="11" y="1" width="6" height="6" fill="currentColor"/>
          <rect x="1" y="11" width="6" height="6" fill="currentColor"/>
          <rect x="11" y="11" width="6" height="6" fill="currentColor"/>
        </svg>
      </span>
      <div class="qb-gen-acc-copy">
        <p class="qb-gen-acc-title">Accuracy by depth</p>
        <p class="qb-gen-acc-sub">Above/below rest of NFL</p>
      </div>
    </div>
    <div class="qb-gen-acc-legend" aria-hidden="true">
      <span class="qb-gen-acc-legend-item"><span class="qb-gen-acc-legend-swatch is-rate"></span>Accurate pass rate</span>
      <span class="qb-gen-acc-legend-item"><span class="qb-gen-acc-legend-swatch is-delta"></span>Diff vs avg</span>
    </div>
  </div>
  <div class="qb-gen-acc-cols">${columnCells}</div>
</div>`;
    },

    buildCollapsibleSection({ title, sectionClass = "", open = false, leadHtml = "", bodyHtml = "" }) {
      const openAttr = open ? " open" : "";
      const sectionExtra = sectionClass ? ` ${sectionClass}` : "";
      return `<section class="qb-section qb-collapsible qb-animate-section${sectionExtra}">
  <details class="qb-collapsible-details"${openAttr}>
    <summary class="qb-collapsible-trigger">
      <span class="qb-collapsible-heading">
        <span class="qb-collapsible-title">${escapeHtml(title)}</span>
      </span>
      <span class="qb-collapsible-chevron" aria-hidden="true"></span>
    </summary>
    <div class="qb-collapsible-panel">
      <div class="qb-collapsible-panel-inner">
        ${leadHtml}
        ${bodyHtml}
      </div>
    </div>
  </details>
</section>`;
    },

    formatPct(n) {
      if (n == null || !Number.isFinite(Number(n))) return "—";
      return `${Number(n).toFixed(1)}%`;
    },

    scaleScatter(value, domain, rangeMin, rangeMax) {
      const min = domain.min;
      const max = domain.max;
      if (!Number.isFinite(value)) return rangeMin;
      if (max === min) return (rangeMin + rangeMax) / 2;
      return rangeMin + ((value - min) / (max - min)) * (rangeMax - rangeMin);
    },

    buildScatterChartSlide(chart, accent, featuredPlayerId) {
      const W = PROFILE_MAX;
      const H = SCATTER_CHART_HEIGHT;
      const padL = 80;
      const padR = 32;
      const padT = 32;
      const padB = 72;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      const fill = normalizeHex(accent, "#2D6A4F");
      const featuredId = String(featuredPlayerId || "");

      const avgX = this.scaleScatter(chart.avgX, chart.xDomain, padL, padL + plotW);
      const avgY = this.scaleScatter(chart.avgY, chart.yDomain, padT + plotH, padT);

      const xTicks = 5;
      const yTicks = 5;
      const xTickEls = Array.from({ length: xTicks }, (_, i) => {
        const t = i / (xTicks - 1);
        const val = chart.xDomain.min + (chart.xDomain.max - chart.xDomain.min) * t;
        const x = padL + plotW * t;
        return `<text class="qb-scatter-tick" x="${x.toFixed(1)}" y="${(H - padB + 28).toFixed(1)}" text-anchor="middle">${escapeHtml(this.formatPct(val))}</text>`;
      }).join("");
      const yTickEls = Array.from({ length: yTicks }, (_, i) => {
        const t = i / (yTicks - 1);
        const val = chart.yDomain.max - (chart.yDomain.max - chart.yDomain.min) * t;
        const y = padT + plotH * t;
        return `<text class="qb-scatter-tick" x="${(padL - 10).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end">${escapeHtml(this.formatPct(val))}</text>`;
      }).join("");

      const pointEls = chart.points
        .map((point) => {
          const cx = this.scaleScatter(point[chart.xKey], chart.xDomain, padL, padL + plotW);
          const cy = this.scaleScatter(point[chart.yKey], chart.yDomain, padT + plotH, padT);
          const isFeatured = String(point.playerId) === featuredId;
          const r = isFeatured ? 11 : 6.5;
          return `<circle class="qb-scatter-point${isFeatured ? " qb-scatter-point--featured" : ""}"
  cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}"
  fill="${isFeatured ? fill : "#9CA3AF"}"
  stroke="${isFeatured ? fill : "#FFFFFF"}" stroke-width="${isFeatured ? 3 : 1.5}"
  data-player-id="${escapeAttr(point.playerId)}"
  data-player-name="${escapeAttr(point.playerName)}"
  data-team-name="${escapeAttr(point.teamName || "")}"
  data-pass-grade="${escapeAttr(this.formatGrade(point.passGrade))}"
  data-x-label="${escapeAttr(chart.xLabel)}"
  data-y-label="${escapeAttr(chart.yLabel)}"
  data-x-value="${escapeAttr(this.formatPct(point[chart.xKey]))}"
  data-y-value="${escapeAttr(this.formatPct(point[chart.yKey]))}"
  data-headshot="${escapeAttr(point.headshotUrl)}"
  tabindex="0" role="img" aria-label="${escapeAttr(`${point.playerName}: ${chart.xLabel} ${this.formatPct(point[chart.xKey])}, ${chart.yLabel} ${this.formatPct(point[chart.yKey])}`)}" />`;
        })
        .join("");

      return `<div class="qb-scatter-slide" data-chart-id="${escapeAttr(chart.id)}" aria-label="${escapeAttr(chart.title)}">
  <h3 class="qb-scatter-chart-title">${escapeHtml(chart.title)}</h3>
  <div class="qb-scatter-stage" style="height:${H}px">
    <svg class="qb-scatter-chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-hidden="true">
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="#FAFBFC" rx="8" />
      <line class="qb-scatter-avg-line" x1="${avgX.toFixed(1)}" y1="${padT}" x2="${avgX.toFixed(1)}" y2="${(padT + plotH).toFixed(1)}" />
      <line class="qb-scatter-avg-line" x1="${padL}" y1="${avgY.toFixed(1)}" x2="${(padL + plotW).toFixed(1)}" y2="${avgY.toFixed(1)}" />
      ${pointEls}
      <text class="qb-scatter-axis-title" x="${(padL + plotW / 2).toFixed(1)}" y="${(H - 12).toFixed(1)}" text-anchor="middle">${escapeHtml(chart.xLabel)}</text>
      <text class="qb-scatter-axis-title" transform="translate(20 ${(padT + plotH / 2).toFixed(1)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yLabel)}</text>
      ${xTickEls}${yTickEls}
    </svg>
    <div class="qb-scatter-panel-wrap qb-scatter-panel-wrap--hover" hidden></div>
  </div>
</div>`;
    },

    buildGradingProfileSection(gradingProfile, accent) {
      if (!gradingProfile?.charts?.length) {
        return this.buildCollapsibleSection({
          title: "Grading profile",
          bodyHtml: `<p class="qb-empty">Upload grading profile.csv to show quarterback scatter plots.</p>`,
        });
      }

      const tabs = gradingProfile.charts
        .map(
          (chart, i) =>
            `<button type="button" class="qb-scatter-tab" data-chart-target="${escapeAttr(chart.id)}" aria-pressed="${i === 0 ? "true" : "false"}">${escapeHtml(chart.shortTitle)}</button>`
        )
        .join("");
      const slides = gradingProfile.charts
        .map((chart) =>
          this.buildScatterChartSlide(chart, accent, gradingProfile.featuredPlayerId)
        )
        .join("");

      return this.buildCollapsibleSection({
        title: "Grading profile",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Swipe or tap to compare charts · hover points for details</p>`,
        bodyHtml: `<div class="qb-chart-card qb-animate-item">
  <div class="qb-scatter-carousel" data-default-chart="btt-twp">
    <div class="qb-scatter-tabs" role="tablist">${tabs}</div>
    <div class="qb-scatter-track">${slides}</div>
  </div>
</div>`,
      });
    },

    gradeColorFor(value) {
      const g = parseFloat(value);
      if (Number.isNaN(g)) return "#9CA3AF";
      if (g >= 90) return "#1b7a2b";
      if (g >= 80) return "#2e9e3e";
      if (g >= 70) return "#6abf4b";
      if (g >= 60) return "#c8c828";
      if (g >= 50) return "#e8a020";
      return "#d04040";
    },

    buildPassingGradeCell(grade, accent) {
      const display = this.formatGrade(grade);
      const accentColor = normalizeHex(accent, "#2D6A4F");
      const pct =
        grade != null && Number.isFinite(grade)
          ? Math.round(25 + Math.min(100, Math.max(0, grade)) * 0.75)
          : 50;
      const color = `color-mix(in srgb, ${accentColor} ${pct}%, #374151)`;
      return `<span class="qb-pass-grade-pill" style="--grade-color:${color}">${escapeHtml(display)}</span>`;
    },

    formatPassingTableAttempts(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      return Math.round(value).toLocaleString("en-US");
    },

    buildPassingGradeRankPct(row) {
      if (row.rank == null || !row.rankTotal) return 0;
      return Math.round(((row.rankTotal - row.rank + 1) / row.rankTotal) * 100);
    },

    buildPassingGradeRankCell(row, accent) {
      const rank = row.rankLabel || "—";
      const total = row.rankTotal != null && row.rankTotal > 0 ? row.rankTotal : null;
      const pct = this.buildPassingGradeRankPct(row);
      const accentColor = normalizeHex(accent, "#2D6A4F");
      return `<div class="qb-pass-table-rank-wrap">
  <span class="qb-pass-table-rank-bar" style="width:${pct}%; --pass-accent:${accentColor}" aria-hidden="true"></span>
  <span class="qb-pass-table-rank-text">
    <span class="qb-pass-table-rank-label">${escapeHtml(rank)}</span>${total ? `<span class="qb-pass-table-rank-of">/${escapeHtml(String(total))}</span>` : ""}
  </span>
</div>`;
    },

    buildPassingTableAttemptsCell(row, maxAttempts) {
      const display = this.formatPassingTableAttempts(row.attempts);
      const pct =
        maxAttempts && row.attempts != null && Number.isFinite(row.attempts)
          ? Math.round((row.attempts / maxAttempts) * 100)
          : 0;
      return `<div class="qb-pass-table-att-wrap">
  <span class="qb-pass-table-att-bar" style="width:${pct}%" aria-hidden="true"></span>
  <span class="qb-pass-table-att-val">${escapeHtml(display)}</span>
</div>`;
    },

    getPassingTableMaxAttempts(table) {
      const rows =
        table.type === "grouped"
          ? (table.groups || []).flatMap((group) => group.rows || [])
          : table.rows || [];
      return rows.reduce((max, row) => Math.max(max, row?.attempts || 0), 0);
    },

    buildPassingGradesTableRow(row, table, accent, maxAttempts) {
      const accentColor = normalizeHex(accent, "#2D6A4F");
      const pct =
        row.grade != null && Number.isFinite(row.grade)
          ? Math.round(25 + Math.min(100, Math.max(0, row.grade)) * 0.75)
          : 50;
      const gradeColor = `color-mix(in srgb, ${accentColor} ${pct}%, #374151)`;
      let rankClass = "";
      if (row.rank === 1) rankClass = " qb-pass-table-row--rank-1";
      else if (row.rank != null && row.rank <= 3) rankClass = " qb-pass-table-row--rank-top";

      const cells = [
        `<td class="qb-pass-table-grade">${this.buildPassingGradeCell(row.grade, accent)}</td>`,
      ];
      if (table.showAttempts || table.type === "rows") {
        cells.push(
          `<td class="qb-pass-table-att">${this.buildPassingTableAttemptsCell(row, maxAttempts)}</td>`
        );
      }
      if (table.showRank) {
        cells.push(
          `<td class="qb-pass-table-rank">${this.buildPassingGradeRankCell(row, accent)}</td>`
        );
      }

      return `<tr class="qb-pass-table-row${rankClass}" style="--grade-color:${gradeColor}">
  <th scope="row" class="qb-pass-table-label">${escapeHtml(row.label)}</th>
  ${cells.join("")}
</tr>`;
    },

    buildPassingGradesTableColspan(table) {
      let count = 2;
      if (table.showAttempts || table.type === "rows") count += 1;
      if (table.showRank) count += 1;
      return count;
    },

    buildPassingGradesTableHead(table) {
      const labelCol = table.type === "grouped" ? "Situation" : "Category";
      const cols = [`<th scope="col">${labelCol}</th>`, `<th scope="col">Grade</th>`];
      if (table.showAttempts || table.type === "rows") cols.push(`<th scope="col">Att</th>`);
      if (table.showRank) cols.push(`<th scope="col">Rank</th>`);
      return `<thead><tr>${cols.join("")}</tr></thead>`;
    },

    buildPassingGradesTableBody(table, accent) {
      const colspan = this.buildPassingGradesTableColspan(table);
      const maxAttempts = this.getPassingTableMaxAttempts(table);
      const accentColor = normalizeHex(accent, "#2D6A4F");

      if (table.type === "grouped") {
        return (table.groups || [])
          .map(
            (group) => `<tr class="qb-pass-table-group">
  <th scope="colgroup" colspan="${colspan}" style="--pass-accent:${accentColor}">${escapeHtml(group.label)}</th>
</tr>${(group.rows || [])
              .map((row) => this.buildPassingGradesTableRow(row, table, accent, maxAttempts))
              .join("")}`
          )
          .join("");
      }

      return (table.rows || [])
        .map((row) => this.buildPassingGradesTableRow(row, table, accent, maxAttempts))
        .join("");
    },

    getAllPassingGradeRows(table) {
      if (table.type === "grouped") {
        return (table.groups || []).flatMap((g) => g.rows || []);
      }
      return table.rows || [];
    },

    buildPassingGradesCallouts(table, accent) {
      const rows = this.getAllPassingGradeRows(table).filter(
        (r) => r.rank != null && r.rankTotal != null && r.rankTotal > 0
      );
      if (rows.length < 2) return "";

      const best = rows.reduce((b, r) => (!b || r.rank < b.rank ? r : b), null);
      const worst = rows.reduce((w, r) => (!w || r.rank > w.rank ? r : w), null);
      if (!best || !worst || best === worst) return "";

      const accentColor = normalizeHex(accent, "#2D6A4F");

      const renderCallout = (row, eyebrow) => {
        const grade = this.formatGrade(row.grade);
        const rankLabel = row.rankLabel || `#${row.rank}`;
        const total = row.rankTotal;
        return `<div class="qb-pass-callout">
  <div class="qb-pass-callout-eyebrow">${escapeHtml(eyebrow)}</div>
  <div class="qb-pass-callout-situation">${escapeHtml(row.label)}</div>
  <div class="qb-pass-callout-grade">${escapeHtml(grade)}</div>
  <div class="qb-pass-callout-rank">${escapeHtml(rankLabel)} of ${escapeHtml(String(total))} quarterbacks</div>
</div>`;
      };

      return `<div class="qb-pass-callouts" style="--pass-accent:${accentColor}">
  ${renderCallout(best, "Where he wins")}
  ${renderCallout(worst, "Pressure points")}
</div>`;
    },

    buildPassingGradesTableSlide(table, accent) {
      const accentColor = normalizeHex(accent, "#2D6A4F");
      const callouts = this.buildPassingGradesCallouts(table, accent);
      return `<article class="qb-compare-slide qb-pass-table-slide" data-split-id="${escapeAttr(table.id)}" style="--pass-accent:${accentColor}">
  <h3 class="qb-compare-slide-title">${escapeHtml(table.title)}</h3>
  ${callouts}
  <div class="qb-pass-table-wrap">
    <table class="qb-pass-table qb-pass-table--visual${table.showRank ? " qb-pass-table--ranked" : ""}">
      ${this.buildPassingGradesTableHead(table)}
      <tbody>${this.buildPassingGradesTableBody(table, accent)}</tbody>
    </table>
  </div>
</article>`;
    },

    buildPassingGradesTablesSection(passingGradesTables, accent) {
      const tables = passingGradesTables?.tables || [];
      if (!tables.length) {
        return this.buildCollapsibleSection({
          title: "Grades by throw type and situation",
          bodyHtml: `<p class="qb-empty">No passing grade table data found for this quarterback.</p>`,
        });
      }

      const tabs = tables
        .map(
          (table, i) =>
            `<button type="button" class="qb-compare-tab" data-split-target="${escapeAttr(table.id)}" aria-pressed="${i === 0 ? "true" : "false"}">${escapeHtml(table.shortTitle || table.title)}</button>`
        )
        .join("");
      const slides = tables.map((table) => this.buildPassingGradesTableSlide(table, accent)).join("");

      return this.buildCollapsibleSection({
        title: "Grades by throw type and situation",
        sectionClass: "qb-section-pass-tables",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Swipe or tap between situation, throw type, reads, coverage, and alignment · ranks vs qualifying QBs</p>`,
        bodyHtml: `<div class="qb-compare-carousel qb-compare-carousel--pass-tables qb-animate-item" data-default-split="${escapeAttr(tables[0]?.id || "situation")}">
    <div class="qb-compare-tabs" role="tablist">${tabs}</div>
    <div class="qb-compare-track">${slides}</div>
  </div>`,
      });
    },

    accuracyValueColor(row) {
      if (row.value == null || !Number.isFinite(row.value)) return "#9CA3AF";
      if (row.format === "plus") {
        if (row.value >= 8) return "#1b7a2b";
        if (row.value >= 3) return "#2e9e3e";
        if (row.value > 0) return "#6abf4b";
        if (row.value > -3) return "#e8a020";
        return "#d04040";
      }
      if (row.higherBetter === false) {
        return this.gradeColorFor(Math.max(0, Math.min(100, 100 - row.value)));
      }
      return this.gradeColorFor(row.value);
    },

    buildAccuracyRateCell(row) {
      const color = this.accuracyValueColor(row);
      return `<span class="qb-pass-grade-pill" style="--grade-color:${color}">${escapeHtml(row.displayValue || "—")}</span>`;
    },

    buildAccuracyShareCell(row, maxShare) {
      const color = this.accuracyValueColor({ ...row, format: "pct" });
      const pct =
        maxShare && row.share != null && Number.isFinite(row.share)
          ? Math.round((row.share / maxShare) * 100)
          : 0;
      return `<div class="qb-pass-table-att-wrap">
  <span class="qb-pass-table-att-bar" style="width:${pct}%" aria-hidden="true"></span>
  <span class="qb-pass-table-att-val qb-acc-share-val" style="color:${color}">${escapeHtml(row.displayShare || "—")}</span>
</div>`;
    },

    getAccuracyTableMaxCount(table) {
      return (table.rows || []).reduce((max, row) => Math.max(max, row?.count || 0), 0);
    },

    getAccuracyTableMaxShare(table) {
      return (table.rows || []).reduce((max, row) => Math.max(max, row?.share || 0), 0);
    },

    buildAccuracyTableRow(row, table, accent, maxCount) {
      const rankClass =
        row.rank === 1
          ? " qb-pass-table-row--rank-1"
          : row.rank != null && row.rank <= 3
            ? " qb-pass-table-row--rank-top"
            : "";
      const cells =
        table.layout === "incompletion"
          ? [
              `<td class="qb-pass-table-att">${this.buildPassingTableAttemptsCell({ attempts: row.count }, maxCount)}</td>`,
              `<td class="qb-pass-table-grade">${this.buildAccuracyShareCell(row, 100)}</td>`,
            ]
          : [`<td class="qb-pass-table-grade">${this.buildAccuracyRateCell(row)}</td>`];

      if (table.showRank) {
        cells.push(
          `<td class="qb-pass-table-rank">${this.buildPassingGradeRankCell(row, accent)}</td>`
        );
      }

      return `<tr class="qb-pass-table-row${rankClass}" style="--grade-color:${this.accuracyValueColor(row)}">
  <th scope="row" class="qb-pass-table-label">${escapeHtml(row.label)}</th>
  ${cells.join("")}
</tr>`;
    },

    buildAccuracyTableHead(table) {
      const cols = [`<th scope="col">Category</th>`];
      if (table.layout === "incompletion") {
        cols.push(`<th scope="col">Count</th>`, `<th scope="col">Share</th>`);
      } else {
        cols.push(`<th scope="col">Rate</th>`);
      }
      if (table.showRank) cols.push(`<th scope="col">Rank</th>`);
      return `<thead><tr>${cols.join("")}</tr></thead>`;
    },

    buildAccuracyTableBody(table, accent) {
      const maxCount = this.getAccuracyTableMaxCount(table);
      return (table.rows || [])
        .map((row) => this.buildAccuracyTableRow(row, table, accent, maxCount))
        .join("");
    },

    buildAccuracyTableSlide(table, accent) {
      const accentColor = normalizeHex(accent, "#2D6A4F");
      const kicker =
        table.layout === "incompletion" && table.totalIncompletions != null
          ? `<p class="qb-acc-table-kicker">${escapeHtml(this.formatPassingTableAttempts(table.totalIncompletions))} incompletions</p>`
          : "";
      return `<article class="qb-compare-slide qb-pass-table-slide" data-split-id="${escapeAttr(table.id)}" style="--pass-accent:${accentColor}">
  <h3 class="qb-compare-slide-title">${escapeHtml(table.title)}</h3>
  ${kicker}
  <div class="qb-pass-table-wrap">
    <table class="qb-pass-table qb-pass-table--visual qb-acc-table${table.showRank ? " qb-pass-table--ranked" : ""}">
      ${this.buildAccuracyTableHead(table)}
      <tbody>${this.buildAccuracyTableBody(table, accent)}</tbody>
    </table>
  </div>
</article>`;
    },

    buildAccuracySection(accuracySection, accent) {
      const tables = accuracySection?.tables || [];
      if (!tables.length) {
        return this.buildCollapsibleSection({
          title: "Accuracy",
          bodyHtml: `<p class="qb-empty">No accuracy data found for this quarterback.</p>`,
        });
      }

      const tabs = tables
        .map(
          (table, i) =>
            `<button type="button" class="qb-compare-tab" data-split-target="${escapeAttr(table.id)}" aria-pressed="${i === 0 ? "true" : "false"}">${escapeHtml(table.shortTitle || table.title)}</button>`
        )
        .join("");
      const slides = tables.map((table) => this.buildAccuracyTableSlide(table, accent)).join("");

      return this.buildCollapsibleSection({
        title: "Accuracy",
        sectionClass: "qb-section-accuracy",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Swipe or tap between accuracy rates and incompletion breakdown · ranks vs qualifying QBs</p>`,
        bodyHtml: `<div class="qb-compare-carousel qb-compare-carousel--accuracy qb-animate-item" data-default-split="${escapeAttr(tables[0]?.id || "accuracy-rates")}">
    <div class="qb-compare-tabs" role="tablist">${tabs}</div>
    <div class="qb-compare-track">${slides}</div>
  </div>`,
      });
    },

    qbAlignmentSegmentColor(id, accent) {
      const accentColor = normalizeHex(accent, "#2D6A4F");
      const colors = {
        shotgun: accentColor,
        pistol: "#D97706",
        "under-center": "#6366F1",
      };
      return colors[id] || "#6B7280";
    },

    buildQbAlignmentMixBar(rows, accent) {
      const segments = (rows || []).filter((row) => row.share != null && row.share > 0.05);
      if (!segments.length) return "";
      const legend = segments
        .map(
          (row) =>
            `<span class="qb-qb-align-legend-item"><span class="qb-qb-align-legend-swatch" style="background:${this.qbAlignmentSegmentColor(row.id, accent)}"></span>${escapeHtml(row.label)} ${escapeHtml(row.displayShare)}</span>`
        )
        .join("");
      const bar = segments
        .map(
          (row) =>
            `<span class="qb-qb-align-seg" style="width:${Math.max(row.share, 0.4)}%; background:${this.qbAlignmentSegmentColor(row.id, accent)}" title="${escapeAttr(`${row.label}: ${row.displayShare}`)}"></span>`
        )
        .join("");
      return `<div class="qb-qb-align-mix qb-animate-item">
  <div class="qb-qb-align-bar" aria-hidden="true">${bar}</div>
  <div class="qb-qb-align-legend">${legend}</div>
</div>`;
    },

    buildQbAlignmentShareCell(row, accent) {
      const color = this.qbAlignmentSegmentColor(row.id, accent);
      const pct = Math.round(Math.max(0, Math.min(100, row.share || 0)));
      return `<div class="qb-pass-table-att-wrap">
  <span class="qb-pass-table-att-bar" style="width:${pct}%; background:color-mix(in srgb, ${color} 24%, #EEF0F3)" aria-hidden="true"></span>
  <span class="qb-pass-table-att-val qb-acc-share-val" style="color:${color}">${escapeHtml(row.displayShare || "—")}</span>
</div>`;
    },

    buildQbAlignmentTableRow(row, accent, maxCount) {
      const color = this.qbAlignmentSegmentColor(row.id, accent);
      let rankClass = "";
      if (row.rank === 1) rankClass = " qb-pass-table-row--rank-1";
      else if (row.rank != null && row.rank <= 3) rankClass = " qb-pass-table-row--rank-top";

      return `<tr class="qb-pass-table-row${rankClass}" style="--grade-color:${color}">
  <th scope="row" class="qb-pass-table-label">${escapeHtml(row.label)}</th>
  <td class="qb-pass-table-att">${this.buildPassingTableAttemptsCell({ attempts: row.count }, maxCount)}</td>
  <td class="qb-pass-table-grade">${this.buildQbAlignmentShareCell(row, accent)}</td>
  <td class="qb-pass-table-rank">${this.buildPassingGradeRankCell(row, accent)}</td>
</tr>`;
    },

    buildQbAlignmentSection(qbAlignment, accent) {
      const rows = qbAlignment?.rows || [];
      if (!rows.length) {
        return this.buildCollapsibleSection({
          title: "QB alignment",
          bodyHtml: `<p class="qb-empty">No QB alignment data found for this quarterback.</p>`,
        });
      }

      const accentColor = normalizeHex(accent, "#2D6A4F");
      const maxCount = rows.reduce((max, row) => Math.max(max, row?.count || 0), 0);
      const kicker =
        qbAlignment.totalDropbacks != null
          ? `<p class="qb-acc-table-kicker">${escapeHtml(this.formatPassingTableAttempts(qbAlignment.totalDropbacks))} dropbacks</p>`
          : "";
      const tableRows = rows
        .map((row) => this.buildQbAlignmentTableRow(row, accent, maxCount))
        .join("");

      return this.buildCollapsibleSection({
        title: "QB alignment",
        sectionClass: "qb-section-qb-align",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Dropback alignment mix · share ranks vs qualifying QBs</p>`,
        bodyHtml: `<div class="qb-qb-align-panel qb-animate-item" style="--pass-accent:${accentColor}">
  ${this.buildQbAlignmentMixBar(rows, accent)}
  ${kicker}
  <div class="qb-pass-table-wrap">
    <table class="qb-pass-table qb-pass-table--visual qb-acc-table qb-pass-table--ranked">
      <thead><tr><th scope="col">Alignment</th><th scope="col">Dropbacks</th><th scope="col">Share</th><th scope="col">Rank</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
</div>`,
      });
    },

    allowedPressureSegmentColor(id, accent) {
      const accentColor = normalizeHex(accent, "#2D6A4F");
      const colors = {
        ce: accentColor,
        lg: "#475569",
        lt: "#64748B",
        rg: "#334155",
        rt: "#1E293B",
        te: "#D97706",
        self: "#DC2626",
        other: "#9CA3AF",
      };
      return colors[id] || "#6B7280";
    },

    buildAllowedPressureMixBar(rows, accent) {
      const segments = (rows || []).filter((row) => row.share != null && row.share > 0.05);
      if (!segments.length) return "";
      const legend = segments
        .map(
          (row) =>
            `<span class="qb-qb-align-legend-item"><span class="qb-qb-align-legend-swatch" style="background:${this.allowedPressureSegmentColor(row.id, accent)}"></span>${escapeHtml(row.label)} ${escapeHtml(row.displayShare)}</span>`
        )
        .join("");
      const bar = segments
        .map(
          (row) =>
            `<span class="qb-qb-align-seg" style="width:${Math.max(row.share, 0.4)}%; background:${this.allowedPressureSegmentColor(row.id, accent)}" title="${escapeAttr(`${row.label}: ${row.displayShare}`)}"></span>`
        )
        .join("");
      return `<div class="qb-qb-align-mix qb-animate-item">
  <div class="qb-qb-align-bar" aria-hidden="true">${bar}</div>
  <div class="qb-qb-align-legend">${legend}</div>
</div>`;
    },

    buildAllowedPressureShareCell(row, accent) {
      const color = this.allowedPressureSegmentColor(row.id, accent);
      const pct = Math.round(Math.max(0, Math.min(100, row.share || 0)));
      return `<div class="qb-pass-table-att-wrap">
  <span class="qb-pass-table-att-bar" style="width:${pct}%; background:color-mix(in srgb, ${color} 24%, #EEF0F3)" aria-hidden="true"></span>
  <span class="qb-pass-table-att-val qb-acc-share-val" style="color:${color}">${escapeHtml(row.displayShare || "—")}</span>
</div>`;
    },

    buildAllowedPressureTableRow(row, accent, maxCount) {
      const color = this.allowedPressureSegmentColor(row.id, accent);
      let rankClass = "";
      if (row.rank === 1) rankClass = " qb-pass-table-row--rank-1";
      else if (row.rank != null && row.rank <= 3) rankClass = " qb-pass-table-row--rank-top";

      return `<tr class="qb-pass-table-row${rankClass}" style="--grade-color:${color}">
  <th scope="row" class="qb-pass-table-label">${escapeHtml(row.label)}</th>
  <td class="qb-pass-table-att">${this.buildPassingTableAttemptsCell({ attempts: row.count }, maxCount)}</td>
  <td class="qb-pass-table-grade">${this.buildAllowedPressureShareCell(row, accent)}</td>
  <td class="qb-pass-table-rank">${this.buildPassingGradeRankCell(row, accent)}</td>
</tr>`;
    },

    formatAllowedPressureSummaryStat(label, value) {
      if (value == null || !Number.isFinite(value)) return null;
      return `${this.formatPassingTableAttempts(value)} ${label}`;
    },

    buildAllowedPressureSummaryKicker(allowedPressures) {
      const parts = [
        this.formatAllowedPressureSummaryStat("pressures allowed", allowedPressures.pressuresAllowed),
        this.formatAllowedPressureSummaryStat(
          "pressure dropbacks",
          allowedPressures.allowedPressureDropbacks
        ),
        this.formatAllowedPressureSummaryStat("hits", allowedPressures.hitsAllowed),
        this.formatAllowedPressureSummaryStat("hurries", allowedPressures.hurriesAllowed),
        this.formatAllowedPressureSummaryStat("sacks", allowedPressures.sacksAllowed),
      ].filter(Boolean);
      if (!parts.length) return "";
      return `<p class="qb-acc-table-kicker">${escapeHtml(parts.join(" · "))}</p>`;
    },

    buildAllowedPressureSection(allowedPressures, accent) {
      const rows = allowedPressures?.rows || [];
      if (!rows.length) {
        return this.buildCollapsibleSection({
          title: "Allowed pressures",
          bodyHtml: `<p class="qb-empty">No allowed pressure data found for this quarterback.</p>`,
        });
      }

      const accentColor = normalizeHex(accent, "#2D6A4F");
      const maxCount = rows.reduce((max, row) => Math.max(max, row?.count || 0), 0);
      const tableRows = rows
        .map((row) => this.buildAllowedPressureTableRow(row, accent, maxCount))
        .join("");

      return this.buildCollapsibleSection({
        title: "Allowed pressures",
        sectionClass: "qb-section-allowed-pressure",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Pressure blame mix on allowed pressures · share ranks vs qualifying QBs (lower QB fault share ranks higher)</p>`,
        bodyHtml: `<div class="qb-allowed-pressure-panel qb-animate-item" style="--pass-accent:${accentColor}">
  ${this.buildAllowedPressureSummaryKicker(allowedPressures)}
  ${this.buildAllowedPressureMixBar(rows, accent)}
  <div class="qb-pass-table-wrap">
    <table class="qb-pass-table qb-pass-table--visual qb-acc-table qb-pass-table--ranked">
      <thead><tr><th scope="col">Source</th><th scope="col">Pressures</th><th scope="col">Share</th><th scope="col">Rank</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
</div>`,
      });
    },

    buildClutchValueCell(row) {
      if (row.format === "grade") return this.buildPassingGradeCell(row.value);
      if (row.format === "ypa") {
        return `<span class="qb-clutch-metric-val">${escapeHtml(row.displayValue || "—")}</span>`;
      }
      return this.buildAccuracyRateCell({ ...row, format: "pct" });
    },

    buildClutchTableRow(row, accent) {
      let rankClass = "";
      if (row.rank === 1) rankClass = " qb-pass-table-row--rank-1";
      else if (row.rank != null && row.rank <= 3) rankClass = " qb-pass-table-row--rank-top";

      const color =
        row.format === "grade"
          ? this.gradeColorFor(row.value)
          : row.format === "ypa"
            ? normalizeHex(accent, "#2D6A4F")
            : this.accuracyValueColor({ ...row, format: "pct" });

      return `<tr class="qb-pass-table-row${rankClass}" style="--grade-color:${color}">
  <th scope="row" class="qb-pass-table-label">${escapeHtml(row.label)}</th>
  <td class="qb-pass-table-grade">${this.buildClutchValueCell(row)}</td>
  <td class="qb-pass-table-rank">${this.buildPassingGradeRankCell(row, accent)}</td>
</tr>`;
    },

    buildClutchMomentsSection(clutchMoments, accent) {
      const rows = clutchMoments?.rows || [];
      if (!rows.length) {
        return this.buildCollapsibleSection({
          title: "Clutch moments",
          bodyHtml: `<p class="qb-empty">No clutch moments data found for this quarterback.</p>`,
        });
      }

      const accentColor = normalizeHex(accent, "#2D6A4F");
      const kickerParts = [];
      if (clutchMoments.dropbacks != null) {
        kickerParts.push(`${this.formatPassingTableAttempts(clutchMoments.dropbacks)} dropbacks`);
      }
      if (!clutchMoments.includedInRank) {
        kickerParts.push("not included in rank pool");
      }
      const kicker = kickerParts.length
        ? `<p class="qb-acc-table-kicker">${escapeHtml(kickerParts.join(" · "))}</p>`
        : "";
      const tableRows = rows.map((row) => this.buildClutchTableRow(row, accent)).join("");

      return this.buildCollapsibleSection({
        title: "Clutch moments",
        sectionClass: "qb-section-clutch",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Clutch-situation passing metrics · ranks vs qualifying QBs when included</p>`,
        bodyHtml: `<div class="qb-clutch-panel qb-animate-item" style="--pass-accent:${accentColor}">
  ${kicker}
  <div class="qb-pass-table-wrap">
    <table class="qb-pass-table qb-pass-table--visual qb-acc-table qb-pass-table--ranked">
      <thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Rank</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
</div>`,
      });
    },

    buildMetricWriteup(text) {
      return `<div class="qb-metric-writeup qb-animate-item"><p class="qb-metric-writeup-text">${text}</p></div>`;
    },

    buildHorizontalMetricBars(metrics, accent) {
      const rows = (metrics || []).filter((m) => m?.label);
      if (!rows.length) {
        return `<p class="qb-empty">Percentile data will appear here as entries are added to the spreadsheet.</p>`;
      }

      const fill = normalizeHex(accent, "#2D6A4F");
      const bars = rows
        .map((metric, i) => {
          const value = metric.percentile;
          const width = value != null ? Math.max(0, Math.min(100, value)) : 0;
          const display = value != null ? Math.round(value) : "—";
          const emptyClass = value == null ? " is-empty" : "";
          return `<div class="qb-metric-row qb-animate-item${emptyClass}" style="--delay:${i * 45}ms">
  <span class="qb-metric-label">${escapeHtml(metric.label)}</span>
  <div class="qb-metric-track" aria-hidden="true">
    <div class="qb-metric-fill" data-target-width="${width}" style="--metric-color:${fill}; --metric-width:0%"></div>
  </div>
  <span class="qb-metric-value">${escapeHtml(String(display))}</span>
</div>`;
        })
        .join("");

      return `<div class="qb-metric-bars" role="list">${bars}</div>`;
    },

    buildStableUnstableSection(stableUnstable, accent) {
      const stableWriteup =
        "The most stable facets of quarterback play are those with the biggest sample sizes — even though they intuitively seem &ldquo;easier.&rdquo; When projecting a quarterback&rsquo;s future output, their performance from a clean pocket, on early downs and with no play action should be weighted heavily, and these are strong components when projecting PFF&rsquo;s Wins Above Replacement metric. Good quarterbacks dominate these situations, while lesser quarterbacks rank near the bottom of the league. Negatively graded plays are also highly correlated from year to year, meaning the quarterback is largely in control of their negatives, while their positive plays may fluctuate due to supporting cast and play calling.";
      const unstableWriteup =
        "Unstable metrics are more volatile when it comes to projecting quarterback play, and results tend to vary from year to year. These numbers are more descriptive than predictive, even if they&rsquo;re perceived as more important. Quarterbacks see unstable situations less often, and that results in the volatility in performance. Positively graded throws are less stable than negatives; they tend to fluctuate more from year to year because they are more dependent on surrounding talent, play calling and overall supporting cast. If a quarterback has an exceptional season in unstable metrics, buyer beware — it is difficult to duplicate.";

      const stableMetrics = stableUnstable?.stable || [];
      const unstableMetrics = stableUnstable?.unstable || [];

      return this.buildCollapsibleSection({
        title: "Stable & unstable metrics",
        leadHtml: `<p class="qb-metric-kicker qb-animate-item">Percentile rank vs qualified quarterbacks</p>`,
        bodyHtml: `<div class="qb-metric-block qb-animate-item">
    <h3 class="qb-metric-block-title">Stable metrics</h3>
    ${this.buildMetricWriteup(stableWriteup)}
    ${this.buildHorizontalMetricBars(stableMetrics, accent)}
  </div>
  <div class="qb-metric-block qb-animate-item">
    <h3 class="qb-metric-block-title">Unstable metrics</h3>
    ${this.buildMetricWriteup(unstableWriteup)}
    ${this.buildHorizontalMetricBars(unstableMetrics, accent)}
  </div>`,
      });
    },

    formatRushingMetricValue(metric) {
      if (!metric) return "—";
      return metric.displayValue ?? "—";
    },

    buildRushingMetricRow(metric, accent, delay = 0) {
      const fill = normalizeHex(accent, "#2D6A4F");
      const ringPct = Math.max(0, Math.min(100, metric.ringPct ?? 0));
      const rankChip = metric.rankLabel
        ? `<span class="qb-rush-row-rank">${escapeHtml(metric.rankLabel)}</span>`
        : `<span class="qb-rush-row-rank">—</span>`;
      return `<div class="qb-rush-row qb-animate-item" style="--rush-accent:${fill}; --rush-ring:${ringPct}%; --delay:${delay}ms" data-rush-metric="${escapeAttr(metric.id)}">
  <span class="qb-rush-row-label">${escapeHtml(metric.label)}</span>
  <div class="qb-rush-row-bar-wrap"><div class="qb-rush-row-bar"></div></div>
  <span class="qb-rush-row-value">${escapeHtml(this.formatRushingMetricValue(metric))}</span>
  ${rankChip}
</div>`;
    },

    buildRushingMetricsLedger(metrics, accent, startDelay = 0) {
      if (!metrics?.length) return "";
      return `<div class="qb-rush-ledger">${metrics
        .map((metric, i) => this.buildRushingMetricRow(metric, accent, startDelay + i * 50))
        .join("")}</div>`;
    },

    buildRushingHeroRing(hero, accent) {
      const fill = normalizeHex(accent, "#2D6A4F");
      const ringPct = Math.max(0, Math.min(100, hero?.ringPct ?? 0)) / 100;
      const size = 220;
      const cx = size / 2;
      const cy = size / 2;
      const r = 88;
      const stroke = 16;
      const innerR = 62;
      const circ = 2 * Math.PI * r;
      const dash = ringPct * circ;
      const gap = circ - dash;

      return `<figure class="qb-donut qb-donut-interactive qb-animate-item qb-rush-hero-ring" style="--rush-accent:${fill}" data-rush-metric="${escapeAttr(hero?.id || "gradesRun")}" role="button" tabindex="0" aria-label="${escapeAttr(`View ${hero?.label || "Run grade"} rankings`)}">
  <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="${stroke}" />
    <circle class="qb-donut-progress" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fill}" stroke-width="${stroke}"
      stroke-linecap="butt"
      stroke-dasharray="0 ${circ.toFixed(2)}"
      data-dash="${dash.toFixed(2)}" data-gap="${gap.toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" />
    <g class="qb-donut-inner qb-animate-item qb-donut-hit" style="--delay:420ms">
      <circle class="qb-donut-center" cx="${cx}" cy="${cy}" r="${innerR}" fill="#0F0F10" />
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="qb-donut-grade">${escapeHtml(this.formatRushingMetricValue(hero))}</text>
      <text x="${cx}" y="${cy + 22}" text-anchor="middle" class="qb-donut-rank">${escapeHtml(hero?.rankLabel || "—")}</text>
    </g>
  </svg>
  <figcaption class="qb-rush-hero-caption">${escapeHtml(hero?.label || "Run grade")}</figcaption>
</figure>`;
    },

    formatRushSplitPrimary(value, splitType) {
      if (value == null || !Number.isFinite(value)) return "—";
      if (splitType === "gapZone") return Math.round(value).toLocaleString("en-US");
      return Math.round(value).toLocaleString("en-US");
    },

    formatRushSplitSecondary(value, splitType) {
      if (value == null || !Number.isFinite(value)) return "—";
      if (splitType === "gapZone") return "";
      return Number(value).toFixed(2);
    },

    buildRushingSplitHero(split, accent, splitType) {
      if (!split) return "";
      const fill = normalizeHex(accent, "#2D6A4F");
      const deltaClass =
        split.delta == null
          ? ""
          : split.delta > 0
            ? " is-positive"
            : split.delta < 0
              ? " is-negative"
              : "";
      const shareText =
        split.rightShare != null
          ? `${Math.round(split.rightShare)}% ${split.rightLabel.toLowerCase()}`
          : "";
      const leftSecondary = this.formatRushSplitSecondary(split.leftSecondary, splitType);
      const rightSecondary = this.formatRushSplitSecondary(split.rightSecondary, splitType);
      const leftMeta =
        split.leftMeta != null
          ? `${Math.round(split.leftMeta).toLocaleString("en-US")} attempts`
          : splitType === "gapZone"
            ? "attempts"
            : "—";
      const rightMeta =
        split.rightMeta != null
          ? `${Math.round(split.rightMeta).toLocaleString("en-US")} attempts`
          : splitType === "gapZone"
            ? "attempts"
            : "—";

      return `<div class="qb-rush-split-hero qb-animate-item" style="--rush-accent:${fill}">
  ${shareText ? `<p class="qb-rush-split-kicker">${escapeHtml(shareText)}</p>` : ""}
  <div class="qb-compare-hero">
    <div class="qb-compare-pane qb-compare-pane-left">
      <span class="qb-compare-pane-label">${escapeHtml(split.leftLabel)}</span>
      <span class="qb-compare-pane-grade">${escapeHtml(this.formatRushSplitPrimary(split.leftPrimary, splitType))}</span>
      ${leftSecondary ? `<span class="qb-rush-split-sub">${escapeHtml(leftSecondary)} YPA</span>` : ""}
      <span class="qb-compare-pane-meta">${escapeHtml(leftMeta)}</span>
    </div>
    <div class="qb-compare-hero-divider">
      <span class="qb-compare-hero-vs">vs</span>
      <span class="qb-compare-hero-delta${deltaClass}">${escapeHtml(this.formatSplitDelta(split.delta))}</span>
      <span class="qb-rush-split-delta-label">${escapeHtml(split.deltaLabel || "")}</span>
    </div>
    <div class="qb-compare-pane qb-compare-pane-right">
      <span class="qb-compare-pane-label">${escapeHtml(split.rightLabel)}</span>
      <span class="qb-compare-pane-grade">${escapeHtml(this.formatRushSplitPrimary(split.rightPrimary, splitType))}</span>
      ${rightSecondary ? `<span class="qb-rush-split-sub">${escapeHtml(rightSecondary)} YPA</span>` : ""}
      <span class="qb-compare-pane-meta">${escapeHtml(rightMeta)}</span>
    </div>
  </div>
</div>`;
    },

    buildRushingWindowSlide(window, accent) {
      const fill = normalizeHex(accent, "#2D6A4F");
      let body = "";

      if (window.type === "hero") {
        body = `<div class="qb-rush-hero-layout">
  ${this.buildRushingHeroRing(window.hero, fill)}
  ${this.buildRushingMetricsLedger(window.metrics, fill, 80)}
</div>`;
      } else if (window.type === "designedScramble") {
        body = `${this.buildRushingSplitHero(window.split, fill, "designedScramble")}${this.buildRushingMetricsLedger(window.metrics, fill, 80)}`;
      } else if (window.type === "gapZone") {
        body = `${this.buildRushingSplitHero(window.split, fill, "gapZone")}${this.buildRushingMetricsLedger(window.metrics, fill, 80)}`;
      } else {
        body = this.buildRushingMetricsLedger(window.metrics, fill, 0);
      }

      return `<article class="qb-compare-slide qb-rush-slide" data-split-id="${escapeAttr(window.id)}" style="--rush-accent:${fill}">
  <h3 class="qb-compare-slide-title">${escapeHtml(window.title)}</h3>
  ${body}
</article>`;
    },

    buildRushingSection(rushing, accent) {
      const windows = rushing?.windows || [];
      if (!windows.length) {
        return this.buildCollapsibleSection({
          title: "Rushing",
          bodyHtml: `<p class="qb-empty">No rushing data found in rushing_summary.csv for this quarterback.</p>`,
        });
      }

      const poolSize = rushing.rankPoolSize || 0;
      const tabs = windows
        .map(
          (window, i) =>
            `<button type="button" class="qb-compare-tab" data-split-target="${escapeAttr(window.id)}" aria-pressed="${i === 0 ? "true" : "false"}">${escapeHtml(window.shortTitle || window.title)}</button>`
        )
        .join("");
      const slides = windows.map((window) => this.buildRushingWindowSlide(window, accent)).join("");

      return this.buildCollapsibleSection({
        title: "Rushing",
        sectionClass: "qb-section-rushing",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Swipe or tap through production, designed vs scramble, elusiveness, explosiveness, and scheme · click a card for full rankings${poolSize ? ` · ${poolSize} qualified QBs` : ""}</p>`,
        bodyHtml: `<div class="qb-compare-carousel qb-compare-carousel--rushing qb-animate-item" data-default-split="${escapeAttr(windows[0]?.id || "overview")}">
    <div class="qb-compare-tabs" role="tablist">${tabs}</div>
    <div class="qb-compare-track">${slides}</div>
  </div>`,
      });
    },

    formatPct(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      return `${value.toFixed(1)}%`;
    },

    formatSplitValue(value, format) {
      if (value == null || !Number.isFinite(value)) return "—";
      if (format === "pct") return `${value.toFixed(1)}%`;
      if (format === "int") return Math.round(value).toLocaleString("en-US");
      if (format === "signed") {
        const sign = value > 0 ? "+" : "";
        return `${sign}${value.toFixed(2)}`;
      }
      if (format === "time") return `${value.toFixed(2)}s`;
      return value.toFixed(1);
    },

    formatGrade(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      return value.toFixed(1);
    },

    formatSplitDelta(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      const rounded = value.toFixed(1);
      return value > 0 ? `+${rounded}` : rounded;
    },

    splitValueClass(side, left, right, higherBetter) {
      if (higherBetter == null || left == null || right == null || left === right) return "";
      const wins =
        higherBetter === true
          ? side === "left"
            ? left > right
            : right > left
          : side === "left"
            ? left < right
            : right < left;
      return wins ? " is-better" : "";
    },

    buildCompareTableRow(metric) {
      const leftClass = this.splitValueClass(
        "left",
        metric.left,
        metric.right,
        metric.higherBetter
      );
      const rightClass = this.splitValueClass(
        "right",
        metric.left,
        metric.right,
        metric.higherBetter
      );

      return `<tr>
  <th scope="row" class="qb-compare-table-metric">${escapeHtml(metric.label)}</th>
  <td class="qb-compare-table-val${leftClass}">${escapeHtml(this.formatSplitValue(metric.left, metric.format))}</td>
  <td class="qb-compare-table-val${rightClass}">${escapeHtml(this.formatSplitValue(metric.right, metric.format))}</td>
</tr>`;
    },

    buildCompareStatsTable(split) {
      const rows = (split.highlights || [])
        .map((metric) => this.buildCompareTableRow(metric))
        .join("");

      return `<div class="qb-compare-table-wrap">
  <table class="qb-compare-table">
    <thead>
      <tr>
        <th scope="col" class="qb-compare-table-metric"></th>
        <th scope="col">${escapeHtml(split.leftLabel)}</th>
        <th scope="col">${escapeHtml(split.rightLabel)}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
    },

    buildCompareSlide(split, accent) {
      const fill = normalizeHex(accent, "#2D6A4F");
      const deltaClass =
        split.gradeDelta == null
          ? ""
          : split.gradeDelta > 0
            ? " is-positive"
            : split.gradeDelta < 0
              ? " is-negative"
              : "";
      const shareText =
        split.rightShare != null
          ? `${Math.round(split.rightShare)}% of dropbacks`
          : "";

      return `<article class="qb-compare-slide" data-split-id="${escapeAttr(split.id)}" style="--compare-accent:${fill}">
  <h3 class="qb-compare-slide-title">${escapeHtml(split.title)}</h3>
  ${shareText ? `<p class="qb-compare-slide-kicker">${escapeHtml(shareText)} · ${escapeHtml(split.rightLabel.toLowerCase())}</p>` : ""}
  <div class="qb-compare-hero">
    <div class="qb-compare-pane qb-compare-pane-left">
      <span class="qb-compare-pane-label">${escapeHtml(split.leftLabel)}</span>
      <span class="qb-compare-pane-grade">${escapeHtml(this.formatGrade(split.leftGrade))}</span>
      <span class="qb-compare-pane-meta">${split.leftDropbacks != null ? `${Math.round(split.leftDropbacks).toLocaleString("en-US")} dropbacks` : "—"}</span>
    </div>
    <div class="qb-compare-hero-divider">
      <span class="qb-compare-hero-vs">vs</span>
      <span class="qb-compare-hero-delta${deltaClass}">${escapeHtml(this.formatSplitDelta(split.gradeDelta))}</span>
    </div>
    <div class="qb-compare-pane qb-compare-pane-right">
      <span class="qb-compare-pane-label">${escapeHtml(split.rightLabel)}</span>
      <span class="qb-compare-pane-grade">${escapeHtml(this.formatGrade(split.rightGrade))}</span>
      <span class="qb-compare-pane-meta">${split.rightDropbacks != null ? `${Math.round(split.rightDropbacks).toLocaleString("en-US")} dropbacks` : "—"}</span>
    </div>
  </div>
  ${this.buildCompareStatsTable(split)}
</article>`;
    },

    buildPassingPressureSection(passingPressure, accent) {
      const splits = passingPressure?.splits || [];
      if (!splits.length) {
        return this.buildCollapsibleSection({
          title: "Passing splits",
          bodyHtml: `<p class="qb-empty">No passing split data found in passing_pressure.csv, passing_concept.csv, or time_in_pocket.csv for this quarterback.</p>`,
        });
      }

      const tabs = splits
        .map(
          (split, i) =>
            `<button type="button" class="qb-compare-tab" data-split-target="${escapeAttr(split.id)}" aria-pressed="${i === 0 ? "true" : "false"}">${escapeHtml(split.shortTitle || split.title)}</button>`
        )
        .join("");
      const slides = splits
        .map((split) => this.buildCompareSlide(split, accent))
        .join("");

      return this.buildCollapsibleSection({
        title: "Passing splits",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Swipe or tap to compare pressure, blitz, play-action, screen, and time-in-pocket situations</p>`,
        bodyHtml: `<div class="qb-compare-carousel qb-animate-item" data-default-split="${escapeAttr(splits[0]?.id || "pressure")}">
    <div class="qb-compare-tabs" role="tablist">${tabs}</div>
    <div class="qb-compare-track">${slides}</div>
  </div>`,
      });
    },

    formatDepthCount(value) {
      if (value == null || !Number.isFinite(value)) return "0";
      return Math.round(value).toLocaleString("en-US");
    },

    formatDepthRating(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      return value.toFixed(1);
    },

    buildDepthCellSummary(cell) {
      const att = cell.attempts ?? 0;
      const yds = cell.yards ?? 0;
      const td = cell.touchdowns ?? 0;
      const int = cell.interceptions ?? 0;
      const gradeStr = this.formatGrade(cell.grade);
      const qbrStr = this.formatDepthRating(cell.qbRating);
      const gc = cell.gradeColor || "#9CA3AF";

      return `<div class="qb-dc-grade" style="color:${escapeAttr(gc)};text-shadow:0 0 24px currentColor">${escapeHtml(gradeStr)}</div>
<div class="qb-dc-att">${this.formatDepthCount(att)} ATT</div>
<div class="qb-dc-stats">${this.formatDepthCount(yds)} YDS &nbsp;·&nbsp; ${this.formatDepthCount(td)} TD &nbsp;·&nbsp; ${this.formatDepthCount(int)} INT &nbsp;·&nbsp; ${escapeHtml(qbrStr)} RTG</div>`;
    },

    buildTargetDepthInnerHtml(passingDepth, profile, accent) {
      if (!passingDepth) return "";

      const season = profile.displaySeason || "2025";
      const accentColor = normalizeHex(accent, "#1a3d6b");
      const cols = passingDepth.cols || [];
      const rows = passingDepth.rows || [];
      const byKey = {};
      (passingDepth.cells || []).forEach((cell) => {
        byKey[`${cell.colKey}|${cell.rowKey}`] = cell;
      });

      // Volume encoding — normalize attempts across all cells
      const allAttempts = rows.flatMap((r) => cols.map((c) => byKey[`${c.key}|${r.key}`]?.attempts ?? 0));
      const maxAttempts = Math.max(1, ...allAttempts);

      function h2r(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? `${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}` : "100,100,100";
      }

      // Field geometry — one layout drives zones, SVG lines, turf, and labels
      const F = buildDepthFieldLayout();
      const ROW_SHORT = { deep: "20+", medium: "10–19", short: "0–9", behind_los: "BH LOS" };

      const COL_NAMES = ["left", "mid", "right"];
      let zoneIdx = 0;

      const zonesHtml = rows.map((rowDef) => {
        const layout = F.rows[rowDef.key];
        if (!layout) return "";
        return cols.map((col, ci) => {
          const cell = byKey[`${col.key}|${rowDef.key}`] || {};
          const att  = cell.attempts || 0;
          const vol  = Math.max(0.06, Math.min(1, att / maxAttempts));
          const gc   = cell.gradeColor || "#6B7280";
          const gradeStr = this.formatGrade(cell.grade);
          const qbrStr   = this.formatDepthRating(cell.qbRating);
          const yds = cell.yards ?? 0;
          const td  = cell.touchdowns ?? 0;
          const int = cell.interceptions ?? 0;
          const colName = COL_NAMES[ci] || "mid";
          const i = zoneIdx++;
          const st = `left:${F.colL[ci]}%;top:${layout.t}%;width:${F.colW}%;height:${layout.h}%;--grade:${gc};--vol:${vol.toFixed(3)};--i:${i};`;
          return `<button type="button" class="qb-depth-cell" data-col="${colName}" data-depth-col="${escapeAttr(col.key)}" data-depth-row="${escapeAttr(rowDef.key)}" data-depth-label="${escapeAttr(cell.label || `${col.label} — ${rowDef.desc}`)}" style="${st}" aria-label="${escapeAttr(`${cell.label || col.label}: ${this.formatDepthCount(att)} attempts`)}"><div class="qb-dc-grade">${escapeHtml(gradeStr)}</div><div class="qb-dc-att">${this.formatDepthCount(att)} ATT</div><div class="qb-dc-stats">${this.formatDepthCount(yds)} YDS · ${this.formatDepthCount(td)} TD · ${this.formatDepthCount(int)} INT</div><div class="qb-dc-rtg">${escapeHtml(qbrStr)} RTG</div></button>`;
        }).join("");
      }).join("");

      const fieldSvg = buildDepthFieldSvg(F);
      const stackVars = `--fd-sl:${F.sl}%;--fd-sr:${F.sr}%;--fd-ez:${F.ezH}%;--fd-goal:${F.goal}%;--fd-bf:${F.backTop}%;--fd-los:${F.los}%;`;

      // Column headers — split "LEFT BOUNDARY" → <strong>LEFT</strong><span>BOUNDARY</span>
      const colHdrsHtml = cols.map((col) => {
        const parts = col.label.split(/\s+/);
        return `<div class="qb-dc-col-hdr"><strong>${escapeHtml(parts[0])}</strong>${parts.length > 1 ? `<span>${escapeHtml(parts.slice(1).join(" "))}</span>` : ""}</div>`;
      }).join("");

      // Depth labels — external rail (includes LOS aligned to teal line)
      const rowLblsHtml = rows.map((r) => {
        const top = F.rowLabelY[r.key] ?? 50;
        const short = ROW_SHORT[r.key] || r.label;
        return `<div class="qb-dc-row-lbl" style="top:${top}%"><span>${escapeHtml(short)}</span></div>`;
      }).join("") + `<div class="qb-dc-row-lbl is-los" style="top:${F.los}%"><span>LOS</span></div>`;

      const totalAttempts = passingDepth.baseAttempts != null
        ? Math.round(passingDepth.baseAttempts).toLocaleString("en-US")
        : null;
      const storeData = { ...passingDepth, byKey };
      const dataJson  = JSON.stringify(storeData).replace(/<\//g, "<\\/");

      return `<div class="qb-depth" style="--qb-depth-accent:${accentColor}">
<div class="qb-depth-stage">
  <div class="qb-depth-noise" aria-hidden="true"></div>
  <div class="qb-depth-chrome">

    <div class="qb-depth-field-area">
      <div class="qb-depth-field-body">
        <div class="qb-depth-field-main">
          <div class="qb-dc-col-hdrs" aria-hidden="true">${colHdrsHtml}</div>
          <div class="qb-depth-scene-row">
            <div class="qb-depth-depth-rail" aria-hidden="true">${rowLblsHtml}</div>
            <div class="qb-depth-scene">
              <div class="qb-depth-field-frame">
                <div class="qb-depth-stack" style="${stackVars}">
                  ${fieldSvg}
                  <section class="qb-depth-zones" aria-label="Target depth zones">${zonesHtml}</section>
                  <div class="qb-depth-qb-wrap" aria-hidden="true">
                    <div class="qb-depth-qb-ring"></div>
                    <div class="qb-depth-qb-ring"></div>
                    <div class="qb-depth-qb-ring"></div>
                    <div class="qb-depth-qb">QB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div class="qb-depth-detail" hidden>
    <button type="button" class="qb-depth-detail-close" aria-label="Close detail panel">&times;</button>
    <div class="qb-depth-detail-body">
      <div class="qb-depth-detail-placeholder">Click a zone on the field to see detailed stats</div>
    </div>
  </div>
</div>
<div class="qb-depth-data" hidden>${escapeHtml(dataJson)}</div>
</div>`;
    },

    formatAccuracyPct(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      return `${(value * 100).toFixed(1)}%`;
    },

    formatAccuracyDeltaPp(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      const sign = value > 0 ? "+" : "";
      return `${sign}${value.toFixed(1)} vs avg`;
    },

    accuracyCellToneClass(deltaPp) {
      if (deltaPp == null || !Number.isFinite(deltaPp)) return "";
      if (Math.abs(deltaPp) < 2) return " is-neutral";
      return deltaPp > 0 ? " is-above" : " is-below";
    },

    accuracyCellBackground(deltaPp) {
      if (deltaPp == null || !Number.isFinite(deltaPp)) {
        return "rgba(255, 255, 255, 0.04)";
      }
      if (Math.abs(deltaPp) < 2) return "rgba(255, 255, 255, 0.08)";
      const strength = Math.min(1, Math.abs(deltaPp) / 14);
      if (deltaPp > 0) {
        return `rgba(220, 38, 38, ${0.1 + strength * 0.28})`;
      }
      return `rgba(37, 99, 235, ${0.1 + strength * 0.28})`;
    },

    accuracyCellGradeColor(deltaPp) {
      if (deltaPp == null || !Number.isFinite(deltaPp)) return "#6B7280";
      if (Math.abs(deltaPp) < 2) return "#9CA3AF";
      return deltaPp > 0 ? "#DC2626" : "#2563EB";
    },

    buildAccuracyCellSummary(cell) {
      if (!cell?.hasData) {
        return `<div class="qb-accuracy-cell-val is-empty">N/A</div>
<div class="qb-dc-att">No attempts</div>
<div class="qb-dc-stats">&nbsp;</div>
<div class="qb-dc-rtg">&nbsp;</div>`;
      }

      const deltaClass = this.accuracyCellToneClass(cell.deltaPp);
      return `<div class="qb-accuracy-cell-val">${escapeHtml(this.formatAccuracyPct(cell.accuracy))}</div>
<div class="qb-accuracy-cell-delta${deltaClass}">${escapeHtml(this.formatAccuracyDeltaPp(cell.deltaPp))}</div>
<div class="qb-dc-att">${this.formatDepthCount(cell.attempts)} ATT</div>
<div class="qb-dc-stats">League ${escapeHtml(this.formatAccuracyPct(cell.leagueAccuracy))}</div>
<div class="qb-dc-rtg">&nbsp;</div>`;
    },

    buildAccuracyDepthInnerHtml(accuracyByDepth, profile, accent) {
      if (!accuracyByDepth) return "";

      const ringColor = normalizeHex(accent, "#2D6A4F");
      const cols = accuracyByDepth.cols || [];
      const rows = accuracyByDepth.rows || [];
      const byKey = accuracyByDepth.byKey || {};

      const allAttempts = rows.flatMap((r) => cols.map((c) => byKey[`${c.key}|${r.key}`]?.attempts ?? 0));
      const maxAttempts = Math.max(1, ...allAttempts);

      const F = buildDepthFieldLayout();
      const ROW_SHORT = { deep: "20+", medium: "10–19", short: "0–9", behind_los: "BH LOS" };

      let zoneIdx = 0;
      const zonesHtml = rows.map((rowDef) => {
        const layout = F.rows[rowDef.key];
        if (!layout) return "";
        return cols.map((col, ci) => {
          const cell = byKey[`${col.key}|${rowDef.key}`] || {};
          const att = cell.attempts || 0;
          const vol = Math.max(0.06, Math.min(1, att / maxAttempts));
          const gc = this.accuracyCellGradeColor(cell.deltaPp);
          const i = zoneIdx++;
          const st = `left:${F.colL[ci]}%;top:${layout.t}%;width:${F.colW}%;height:${layout.h}%;--grade:${gc};--vol:${vol.toFixed(3)};--i:${i};`;
          return `<button type="button" class="qb-accuracy-depth-cell qb-depth-cell" data-accuracy-col="${escapeAttr(col.key)}" data-accuracy-row="${escapeAttr(rowDef.key)}" style="${st}" aria-label="${escapeAttr(`${cell.label || col.label}: ${this.formatAccuracyPct(cell.accuracy)}`)}">
${this.buildAccuracyCellSummary(cell)}
</button>`;
        }).join("");
      }).join("");

      const fieldSvg = buildDepthFieldSvg(F);
      const stackVars = `--fd-sl:${F.sl}%;--fd-sr:${F.sr}%;--fd-ez:${F.ezH}%;--fd-goal:${F.goal}%;--fd-bf:${F.backTop}%;--fd-los:${F.los}%;`;

      const colHdrsHtml = cols.map((col) => {
        const parts = col.label.split(/\s+/);
        return `<div class="qb-dc-col-hdr"><strong>${escapeHtml(parts[0])}</strong>${parts.length > 1 ? `<span>${escapeHtml(parts.slice(1).join(" "))}</span>` : ""}</div>`;
      }).join("");

      const rowLblsHtml = rows.map((r) => {
        const top = F.rowLabelY[r.key] ?? 50;
        const short = ROW_SHORT[r.key] || r.label;
        return `<div class="qb-dc-row-lbl" style="top:${top}%"><span>${escapeHtml(short)}</span></div>`;
      }).join("") + `<div class="qb-dc-row-lbl is-los" style="top:${F.los}%"><span>LOS</span></div>`;

      const dataJson = JSON.stringify(accuracyByDepth).replace(/<\//g, "<\\/");

      return `<div class="qb-accuracy-depth qb-depth" style="--qb-depth-accent:${ringColor}">
<div class="qb-depth-stage">
  <div class="qb-depth-noise" aria-hidden="true"></div>
  <div class="qb-depth-chrome">

    <div class="qb-depth-field-area">
      <div class="qb-depth-field-body">
        <div class="qb-depth-field-main">
          <div class="qb-dc-col-hdrs" aria-hidden="true">${colHdrsHtml}</div>
          <div class="qb-depth-scene-row">
            <div class="qb-depth-depth-rail" aria-hidden="true">${rowLblsHtml}</div>
            <div class="qb-depth-scene">
              <div class="qb-depth-field-frame">
                <div class="qb-depth-stack" style="${stackVars}">
                  ${fieldSvg}
                  <section class="qb-depth-zones" aria-label="Accuracy by depth zones">${zonesHtml}</section>
                  <div class="qb-depth-qb-wrap" aria-hidden="true">
                    <div class="qb-depth-qb-ring"></div>
                    <div class="qb-depth-qb-ring"></div>
                    <div class="qb-depth-qb-ring"></div>
                    <div class="qb-depth-qb">QB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div class="qb-accuracy-depth-detail qb-depth-detail" hidden>
    <button type="button" class="qb-accuracy-depth-detail-close qb-depth-detail-close" aria-label="Close detail panel">&times;</button>
    <div class="qb-accuracy-depth-detail-body qb-depth-detail-body">
      <div class="qb-depth-detail-placeholder">Click a zone to compare accuracy with league average</div>
    </div>
  </div>
</div>
<div class="qb-accuracy-depth-legend" aria-label="Accuracy vs league average">
  <span class="qb-accuracy-legend-item"><span class="qb-accuracy-legend-swatch is-below"></span>Below average</span>
  <span class="qb-accuracy-legend-item"><span class="qb-accuracy-legend-swatch is-neutral"></span>Near average</span>
  <span class="qb-accuracy-legend-item"><span class="qb-accuracy-legend-swatch is-above"></span>Above average</span>
</div>
<div class="qb-accuracy-depth-data" hidden>${escapeHtml(dataJson)}</div>
</div>`;
    },

    buildRouteTreeInnerHtml(routeTree, profile, accent) {
      if (!routeTree) return "";

      const ringColor = normalizeHex(accent, "#2D6A4F");
      const F = buildDepthFieldLayout();
      const fieldSvg = buildDepthFieldSvg(F);
      const stackVars = `--fd-sl:${F.sl}%;--fd-sr:${F.sr}%;--fd-ez:${F.ezH}%;--fd-goal:${F.goal}%;--fd-bf:${F.backTop}%;--fd-los:${F.los}%;`;
      const dataJson = JSON.stringify(routeTree).replace(/<\//g, "<\\/");

      return `<div class="qb-route-tree qb-animate-item" style="--qb-route-accent:${ringColor}">
<div class="qb-route-tree-select-wrap">
  <button type="button" class="qb-route-tree-select-trigger" aria-haspopup="listbox" aria-expanded="false">
    <span class="qb-route-tree-select-label">Select a route…</span>
    <span class="qb-route-tree-select-chevron" aria-hidden="true"></span>
  </button>
  <div class="qb-route-tree-options" role="listbox"></div>
</div>
<div class="qb-route-tree-stage">
  <div class="qb-depth-noise" aria-hidden="true"></div>
  <div class="qb-route-tree-chrome">
    <div class="qb-route-tree-scene">
      <div class="qb-route-tree-stack" style="${stackVars}">
        ${fieldSvg}
        <div class="qb-route-tree-field"></div>
      </div>
    </div>
    <div class="qb-route-tree-panel-wrap qb-depth-detail" hidden>
      <button type="button" class="qb-route-tree-panel-close qb-depth-detail-close" aria-label="Close">&times;</button>
      <div class="qb-route-tree-panel-scroll qb-depth-detail-body">
        <div class="qb-route-tree-panel-body"></div>
      </div>
    </div>
  </div>
</div>
<div class="qb-route-tree-data" hidden>${escapeHtml(dataJson)}</div>
</div>`;
    },

    buildTargetMapsSection(passingDepth, targetMap, accuracyByDepth, routeTree, profile, accent) {
      const hasDepth = !!passingDepth;
      const hasAccuracy = !!accuracyByDepth;
      const hasMap = !!(targetMap?.plays?.length);
      const hasRoutes = !!routeTree?.routeList?.length;

      if (!hasDepth && !hasAccuracy && !hasMap && !hasRoutes) {
        return this.buildCollapsibleSection({
          title: "Target maps",
          bodyHtml: `<p class="qb-empty">No target depth, accuracy, route tree, or target map data found for this quarterback.</p>`,
        });
      }

      const ringColor = normalizeHex(accent, "#2D6A4F");
      const season = targetMap?.season || profile.displaySeason || "2025";
      const defaultSlide = hasDepth ? "depth" : hasAccuracy ? "accuracy" : hasRoutes ? "routes" : "scatter";
      const tabs = [
        hasDepth ? { id: "depth", label: "Target depth" } : null,
        hasAccuracy ? { id: "accuracy", label: "Accuracy by depth" } : null,
        hasRoutes ? { id: "routes", label: "Route tree" } : null,
        hasMap ? { id: "scatter", label: "Target map" } : null,
      ].filter(Boolean);

      const tabsHtml = tabs
        .map(
          (tab) =>
            `<button type="button" class="qb-target-map-tab" data-map-slide-target="${escapeAttr(tab.id)}" aria-pressed="${tab.id === defaultSlide ? "true" : "false"}">${escapeHtml(tab.label)}</button>`
        )
        .join("");

      let mapToolsHtml = "";
      let mapDataHtml = "";
      let scatterSlideHtml = "";

      if (hasMap) {
        const stats = targetMap.statline || {};
        const totalThrows = targetMap.plays.length;
        const filterFields = targetMap.filterFields || [];
        const filterOptions = targetMap.filterOptions || {};
        const dataJson = JSON.stringify(targetMap).replace(/<\//g, "<\\/");

        const filterSelects = filterFields
          .map(({ key, label }) => {
            const options = filterOptions[key] || [];
            if (!options.length) return "";
            const optionHtml = options
              .map(
                ({ value, label: optionLabel }) =>
                  `<option value="${escapeAttr(value)}">${escapeHtml(optionLabel || value)}</option>`
              )
              .join("");
            return `<label class="qb-target-map-filter-field">
  <span class="qb-target-map-filter-label">${escapeHtml(label)}</span>
  <select data-map-filter="${escapeAttr(key)}" aria-label="${escapeAttr(`Filter by ${label}`)}">
    <option value="">All</option>
    ${optionHtml}
  </select>
</label>`;
          })
          .filter(Boolean)
          .join("");

        mapToolsHtml = `<div class="qb-target-map-map-tools" data-map-tools>
  <div class="qb-target-map-stats">
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Attempts</span><strong data-stat="attempts">${escapeHtml(String(stats.attempts ?? 0))}</strong></div>
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Completions</span><strong data-stat="completions">${escapeHtml(String(stats.completions ?? 0))}</strong></div>
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Yards</span><strong data-stat="yards">${escapeHtml(Number(stats.yards || 0).toLocaleString("en-US"))}</strong></div>
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Touchdowns</span><strong data-stat="touchdowns">${escapeHtml(String(stats.touchdowns ?? 0))}</strong></div>
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Interceptions</span><strong data-stat="interceptions">${escapeHtml(String(stats.interceptions ?? 0))}</strong></div>
  </div>
  <details class="qb-target-map-filter-details">
    <summary class="qb-target-map-filter-trigger">
      <span>Filters</span>
      <span class="qb-target-map-filter-badge" data-map-active-filters>No Filters Applied</span>
    </summary>
    <div class="qb-target-map-filter-panel">
      <div class="qb-target-map-filter-toolbar">
        <p class="qb-target-map-filter-count" data-map-filter-count>Showing ${escapeHtml(String(totalThrows))} of ${escapeHtml(String(totalThrows))} throws</p>
        <button type="button" class="qb-target-map-filter-clear" data-map-filter-clear>Clear Filters</button>
      </div>
      <div class="qb-target-map-filters qb-target-map-result-filters" role="group" aria-label="Filter by result">
        <span class="qb-target-map-filter-group-label">Result</span>
        <label class="qb-target-map-filter"><input type="checkbox" data-result-filter="COMPLETE" checked /> Complete</label>
        <label class="qb-target-map-filter"><input type="checkbox" data-result-filter="INCOMPLETE" checked /> Incomplete</label>
        <label class="qb-target-map-filter"><input type="checkbox" data-result-filter="TOUCHDOWN" checked /> Touchdown</label>
        <label class="qb-target-map-filter"><input type="checkbox" data-result-filter="INTERCEPTION" checked /> Interception</label>
      </div>
      <div class="qb-target-map-filter-grid">${filterSelects}</div>
    </div>
  </details>
</div>`;

        scatterSlideHtml = `<article class="qb-target-map-slide" data-map-slide="scatter">
  <div class="qb-target-map-scatter-stage">
    <div class="qb-depth-noise" aria-hidden="true"></div>
    <div class="qb-target-map-chart-wrap" data-map-chart-wrap>
      <div class="qb-target-map-chart" data-map-chart-role="scatter"></div>
      <div class="qb-target-map-hover qb-depth-detail" hidden></div>
    </div>
  </div>
</article>`;

        mapDataHtml = `<div class="qb-target-map-data" hidden>${escapeHtml(dataJson)}</div>`;
      }

      const depthSlideHtml = hasDepth
        ? `<article class="qb-target-map-slide" data-map-slide="depth">${this.buildTargetDepthInnerHtml(passingDepth, profile, accent)}</article>`
        : "";
      const accuracySlideHtml = hasAccuracy
        ? `<article class="qb-target-map-slide" data-map-slide="accuracy">${this.buildAccuracyDepthInnerHtml(accuracyByDepth, profile, accent)}</article>`
        : "";
      const routesSlideHtml = hasRoutes
        ? `<article class="qb-target-map-slide" data-map-slide="routes">
  <p class="qb-target-map-slide-kicker">Click a route for passing grade and full stats · ${escapeHtml(profile.teamName || "Team")} · ${escapeHtml(this.formatDepthCount(routeTree.totalAttempts))} attempts across ${escapeHtml(String(routeTree.routeList.length))} concepts</p>
  ${this.buildRouteTreeInnerHtml(routeTree, profile, accent)}
</article>`
        : "";

      const headHtml = `<div class="qb-target-map-head">
  <div>
    <p class="qb-target-map-eyebrow">Target maps · ${escapeHtml(String(season))}</p>
    <p class="qb-target-map-title">${escapeHtml(targetMap?.title || `${profile.playerName}: Target Maps (${season})`)}</p>
    <p class="qb-target-map-meta" data-map-meta>${escapeHtml(profile.teamName || "Team")} · swipe between target depth, accuracy, route tree, and throw map</p>
  </div>
</div>`;

      const bodyHtml = `<div class="qb-target-map qb-target-maps-hub qb-animate-item${hasDepth && !hasMap && !hasRoutes ? " is-depth-only" : ""}" style="--qb-map-accent:${ringColor}" data-default-map-slide="${escapeAttr(defaultSlide)}">
  ${headHtml}
  <div class="qb-target-map-tabs" role="tablist">${tabsHtml}</div>
  ${mapToolsHtml}
  <div class="qb-target-map-track">${depthSlideHtml}${accuracySlideHtml}${routesSlideHtml}${scatterSlideHtml}</div>
  ${mapDataHtml}
</div>`;

      return this.buildCollapsibleSection({
        title: "Target maps",
        sectionClass: "qb-section-target-maps",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Swipe or tap to switch between target depth, accuracy by depth, route tree, and throw map</p>`,
        bodyHtml,
      });
    },

    buildTargetDepthSection(passingDepth, profile, accent) {
      if (!passingDepth) {
        return this.buildCollapsibleSection({
          title: "Target depth",
          bodyHtml: `<p class="qb-empty">No target depth data found in passing_depth.csv for this quarterback.</p>`,
        });
      }

      return this.buildCollapsibleSection({
        title: "Target depth",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Click any zone for completion rate, YPA, BTT rate, and more</p>`,
        bodyHtml: this.buildTargetDepthInnerHtml(passingDepth, profile, accent),
      });
    },

    buildTargetMapSection(targetMap, profile, accent) {
      if (!targetMap?.plays?.length) {
        return this.buildCollapsibleSection({
          title: "Target map",
          bodyHtml: `<p class="qb-empty">No target map data found in target-map.csv for this quarterback.</p>`,
        });
      }

      const ringColor = normalizeHex(accent, "#2D6A4F");
      const season = targetMap.season || profile.displaySeason || "2025";
      const stats = targetMap.statline || {};
      const totalThrows = targetMap.plays.length;
      const filterFields = targetMap.filterFields || [];
      const filterOptions = targetMap.filterOptions || {};
      const dataJson = JSON.stringify(targetMap).replace(/<\//g, "<\\/");

      const filterSelects = filterFields
        .map(({ key, label }) => {
          const options = filterOptions[key] || [];
          if (!options.length) return "";
          const optionHtml = options
            .map(
              ({ value, label: optionLabel }) =>
                `<option value="${escapeAttr(value)}">${escapeHtml(optionLabel || value)}</option>`
            )
            .join("");
          return `<label class="qb-target-map-filter-field">
  <span class="qb-target-map-filter-label">${escapeHtml(label)}</span>
  <select data-map-filter="${escapeAttr(key)}" aria-label="${escapeAttr(`Filter by ${label}`)}">
    <option value="">All</option>
    ${optionHtml}
  </select>
</label>`;
        })
        .filter(Boolean)
        .join("");

      const bodyHtml = `<div class="qb-target-map qb-animate-item" style="--qb-map-accent:${ringColor}">
  <div class="qb-target-map-head">
    <div>
      <p class="qb-target-map-eyebrow">Target Map · ${escapeHtml(String(season))}</p>
      <p class="qb-target-map-title">${escapeHtml(targetMap.title || `${profile.playerName}: Target Map (${season})`)}</p>
      <p class="qb-target-map-meta" data-map-meta>${escapeHtml(profile.teamName || "Team")} · click a dot for play details</p>
    </div>
  </div>
  <div class="qb-target-map-stats">
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Attempts</span><strong data-stat="attempts">${escapeHtml(String(stats.attempts ?? 0))}</strong></div>
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Completions</span><strong data-stat="completions">${escapeHtml(String(stats.completions ?? 0))}</strong></div>
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Yards</span><strong data-stat="yards">${escapeHtml(Number(stats.yards || 0).toLocaleString("en-US"))}</strong></div>
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Touchdowns</span><strong data-stat="touchdowns">${escapeHtml(String(stats.touchdowns ?? 0))}</strong></div>
    <div class="qb-target-map-stat"><span class="qb-target-map-stat-label">Interceptions</span><strong data-stat="interceptions">${escapeHtml(String(stats.interceptions ?? 0))}</strong></div>
  </div>
  <details class="qb-target-map-filter-details">
    <summary class="qb-target-map-filter-trigger">
      <span>Filters</span>
      <span class="qb-target-map-filter-badge" data-map-active-filters>No Filters Applied</span>
    </summary>
    <div class="qb-target-map-filter-panel">
      <div class="qb-target-map-filter-toolbar">
        <p class="qb-target-map-filter-count" data-map-filter-count>Showing ${escapeHtml(String(totalThrows))} of ${escapeHtml(String(totalThrows))} throws</p>
        <button type="button" class="qb-target-map-filter-clear" data-map-filter-clear>Clear Filters</button>
      </div>
      <div class="qb-target-map-filters qb-target-map-result-filters" role="group" aria-label="Filter by result">
        <span class="qb-target-map-filter-group-label">Result</span>
        <label class="qb-target-map-filter"><input type="checkbox" data-result-filter="COMPLETE" checked /> Complete</label>
        <label class="qb-target-map-filter"><input type="checkbox" data-result-filter="INCOMPLETE" checked /> Incomplete</label>
        <label class="qb-target-map-filter"><input type="checkbox" data-result-filter="TOUCHDOWN" checked /> Touchdown</label>
        <label class="qb-target-map-filter"><input type="checkbox" data-result-filter="INTERCEPTION" checked /> Interception</label>
      </div>
      <div class="qb-target-map-filter-grid">${filterSelects}</div>
    </div>
  </details>
  <div class="qb-target-map-scatter-stage">
    <div class="qb-depth-noise" aria-hidden="true"></div>
    <div class="qb-target-map-chart-wrap" data-map-chart-wrap>
      <div class="qb-target-map-chart"></div>
      <div class="qb-target-map-hover qb-depth-detail" hidden></div>
    </div>
  </div>
  <div class="qb-target-map-data" hidden>${escapeHtml(dataJson)}</div>
</div>`;

      return this.buildCollapsibleSection({
        title: "Target map",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Open filters for receiver, coverage, dropback, and more</p>`,
        bodyHtml,
      });
    },

    formatLuck(value, digits = 1) {
      if (value == null || !Number.isFinite(value)) return "—";
      const rounded = value.toFixed(digits);
      return value > 0 ? `+${rounded}` : rounded;
    },

    formatLuckRate(value, digits = 1) {
      if (value == null || !Number.isFinite(value)) return "—";
      if (value < 1) return `${(value * 100).toFixed(2)}%`;
      return `${value.toFixed(digits)}%`;
    },

    formatLuckDecimal(value, digits = 1) {
      if (value == null || !Number.isFinite(value)) return "—";
      return value.toFixed(digits);
    },

    formatLuckCount(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      return Math.round(value).toLocaleString("en-US");
    },

    luckToneClass(value) {
      if (value == null || !Number.isFinite(value) || value === 0) return "";
      return value > 0 ? " is-lucky" : " is-unlucky";
    },

    buildIntLuckCompareTable(expected, actual, luck) {
      return `<table class="qb-int-luck-table">
  <thead>
    <tr>
      <th scope="col"></th>
      <th scope="col">Expected</th>
      <th scope="col">Actual</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Interceptions</th>
      <td>${escapeHtml(this.formatLuckDecimal(expected))}</td>
      <td>${escapeHtml(this.formatLuckCount(actual))}</td>
    </tr>
    <tr class="qb-int-luck-table-luck${this.luckToneClass(luck)}">
      <th scope="row">Luck</th>
      <td colspan="2">${escapeHtml(this.formatLuck(luck))}</td>
    </tr>
  </tbody>
</table>`;
    },

    buildInterceptionLuckSection(interceptionLuck, profile, accent) {
      if (!interceptionLuck) {
        return this.buildCollapsibleSection({
          title: "Interception luck",
          bodyHtml: `<p class="qb-empty">No interception luck data found in int-luck-season.csv for this quarterback and season.</p>`,
        });
      }

      const luck = interceptionLuck;
      const season = luck.season || profile.displaySeason || "2025";
      const netClass = this.luckToneClass(luck.netLuck);
      const badClass = this.luckToneClass(luck.luckOnBad);
      const goodClass = this.luckToneClass(luck.luckOnGood);
      const droppedTotal = luck.droppedInts ?? 0;

      // Bar widths: expected anchors at 100%, actual scaled relative
      const badExp = Math.max(luck.expectedTwps ?? 0, 0.001);
      const badAct = luck.intsOnTwps ?? 0;
      const badActPct = Math.min(160, (badAct / badExp) * 100).toFixed(1);

      const goodExp = Math.max(luck.expectedClean ?? 0, 0.001);
      const goodAct = luck.nonTwpInts ?? 0;
      const goodActPct = Math.min(160, (goodAct / goodExp) * 100).toFixed(1);

      // Stacked bar panel builder
      const barPanel = (title, expected, actual, luckVal, accentColor) => {
        const safeExp = Math.max(expected ?? 0, 0.001);
        const actPct  = Math.min(100, ((actual ?? 0) / safeExp) * 100).toFixed(1);
        const tone    = this.luckToneClass(luckVal);
        const barColor = tone === " is-unlucky" ? "#DC2626" : accentColor;
        const expLabel = expected != null ? this.formatLuckDecimal(expected) : "—";
        const actLabel = actual   != null ? String(Math.round(actual))       : "—";
        return `<div class="qb-il-bar-panel">
  <p class="qb-il-split-title">${escapeHtml(title)}</p>
  <div class="qb-il-bar-rows">
    <div class="qb-il-bar-row">
      <span class="qb-il-bar-lbl">Expected</span>
      <div class="qb-il-bar-track"><div class="qb-il-bar-fill" style="width:100%;background:#D1D5DB"></div></div>
      <span class="qb-il-bar-num">${escapeHtml(expLabel)}</span>
    </div>
    <div class="qb-il-bar-row">
      <span class="qb-il-bar-lbl">Actual</span>
      <div class="qb-il-bar-track qb-il-bar-track--actual"><div class="qb-il-bar-fill qb-animate-fill" style="width:${actPct}%;background:${escapeAttr(barColor)}"></div></div>
      <span class="qb-il-bar-num" style="color:${escapeAttr(barColor)}">${escapeHtml(actLabel)}</span>
    </div>
  </div>
  <p class="qb-il-split-result${tone}">${escapeHtml(this.formatLuck(luckVal))} on ${title.toLowerCase().replace("on ", "")}</p>
</div>`;
      };

      // Compute percentile rank among qualifying 2025 QBs for the scale
      const _intLuckState = window.QbAnnualApi?.getIntLuckState?.();
      const _allLuck = Object.entries(_intLuckState?.byPlayerSeason || {})
        .filter(([key, row]) => { const s = String(row["included in rank?"] ?? "").trim().toLowerCase(); return key.endsWith(`:${season}`) && (s === "1" || s === "1.0" || s === "yes" || s === "true"); })
        .map(([, row]) => { const n = Number(row.net_luck); return Number.isFinite(n) ? n : null; })
        .filter(v => v != null)
        .sort((a, b) => a - b);
      const _thisLuck = luck.netLuck ?? 0;
      const _below = _allLuck.filter(v => v < _thisLuck).length;
      const _scalePct = _allLuck.length > 1
        ? Math.max(3, Math.min(97, Math.round((_below / (_allLuck.length - 1)) * 100)))
        : 50;
      const _scaleMin = _allLuck.length ? _allLuck[0] : -5;
      const _scaleMax = _allLuck.length ? _allLuck[_allLuck.length - 1] : 5;
      const _scaleN   = _allLuck.length;
      const _luckRank = _scaleN - _below; // 1 = most lucky

      const fill = accent || "#006bff";
      const bodyHtml = `<div class="qb-int-luck qb-animate-item">

  <div class="qb-il-header">
    <p class="qb-il-eyebrow">Interception luck · ${escapeHtml(String(season))}</p>
    <p class="qb-il-meta">${luck.attempts != null ? Math.round(luck.attempts).toLocaleString("en-US") + " attempts" : "—"} · ${luck.twps != null ? Math.round(luck.twps) + " turnover-worthy throws" : "—"} · ${luck.totalInts != null ? Math.round(luck.totalInts) + " interceptions" : "—"}</p>
  </div>

  <div class="qb-il-net-hero${netClass}">
    <span class="qb-il-net-hero-num">${escapeHtml(this.formatLuck(luck.netLuck))}</span>
    <span class="qb-il-net-hero-lbl">${luck.netLuck != null && luck.netLuck >= 0 ? "fewer interceptions than model expected" : "more interceptions than model expected"}</span>
  </div>

  <div class="qb-il-bar-panels">
    ${barPanel("On turnover-worthy throws", luck.expectedTwps, luck.intsOnTwps, luck.luckOnBad, fill)}
    <div class="qb-il-split-divider"></div>
    ${barPanel("On non-turnover-worthy throws", luck.expectedClean, luck.nonTwpInts, luck.luckOnGood, fill)}
  </div>

  <div class="qb-il-equation">
    <div class="qb-il-eq-tile qb-animate-item" style="--delay:80ms">
      <span class="qb-il-eq-lbl">Model expected</span>
      <span class="qb-il-eq-val">${escapeHtml(this.formatLuckDecimal(luck.totalExpected))}</span>
    </div>
    <span class="qb-il-eq-op">→</span>
    <div class="qb-il-eq-tile qb-animate-item" style="--delay:160ms">
      <span class="qb-il-eq-lbl">Actual picks</span>
      <span class="qb-il-eq-val">${luck.actualTotal != null ? Math.round(luck.actualTotal) : "—"}</span>
    </div>
    <span class="qb-il-eq-op">=</span>
    <div class="qb-il-eq-tile qb-il-eq-tile--net${netClass} qb-animate-item" style="--delay:240ms">
      <span class="qb-il-eq-lbl">Net luck</span>
      <span class="qb-il-eq-val">${escapeHtml(this.formatLuck(luck.netLuck))}</span>
    </div>
  </div>

  <div class="qb-il-scale qb-animate-item" style="--delay:360ms">
    <p class="qb-il-scale-title">Luck vs. qualifying ${escapeHtml(String(season))} QBs</p>
    <div class="qb-il-scale-track">
      <div class="qb-il-scale-marker" style="--scale-pct:${_scalePct}%;--accent:${escapeAttr(fill)}">
        <span class="qb-il-scale-marker-val">${escapeHtml(this.formatLuck(luck.netLuck))}</span>
        <div class="qb-il-scale-marker-dot" style="background:${escapeAttr(fill)}"></div>
      </div>
    </div>
    <div class="qb-il-scale-ends">
      <span class="qb-il-scale-end">Most unlucky (${escapeHtml(this.formatLuck(_scaleMin))})</span>
      <span class="qb-il-scale-end">Most lucky (${escapeHtml(this.formatLuck(_scaleMax))})</span>
    </div>
    ${_scaleN > 1 ? `<p class="qb-il-scale-rank">#${_luckRank} of ${_scaleN} qualifying passers</p>` : ""}
  </div>

  ${droppedTotal > 0 ? `<p class="qb-il-drops">Defenders dropped <strong>${Math.round(droppedTotal)}</strong> would-be interception${droppedTotal === 1 ? "" : "s"} (${Math.round(luck.droppedBad ?? 0)} on bad throws, ${Math.round(luck.droppedGood ?? 0)} on good) — additional luck not captured in the model above.</p>` : ""}

  <div class="qb-il-methodology">
    <p class="qb-il-methodology-title">Interception luck methodology</p>
    <p class="qb-il-methodology-body">Since 2006, only 49.09% of turnover-worthy throws have actually become interceptions, while 0.79% of non-turnover-worthy throws have still resulted in interceptions due to factors outside the quarterback's control. Using those historical rates, we can estimate an expected interception total by applying a 49.09% conversion rate to a quarterback's turnover-worthy throws and adding the expected interceptions generated from their non-turnover-worthy attempts. <a class="qb-il-methodology-link" href="https://www.pff.com/news/nfl-hidden-story-behind-quarterback-interceptions" target="_blank" rel="noopener">Read more about the methodology here</a>.</p>
  </div>

</div>`;

      return this.buildCollapsibleSection({
        title: "Interception luck",
        bodyHtml,
      });
    },

    buildDistributionIntro() {
      const url = "https://www.pff.com/news/nfl-quarterback-play-level-data";
      return `<div class="qb-grade-explainer qb-animate-item">
  <p class="qb-grade-explainer-text">PFF 0-100 grades are derived from a detailed -2 to +2 grading scale applied to every player on every play. For more information on PFF&rsquo;s grading process, <a class="qb-grade-explainer-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">click here</a>.</p>
</div>`;
    },

    formatEpaPerDropback(value) {
      if (value == null || !Number.isFinite(value)) return "—";
      const sign = value > 0 ? "+" : "";
      return `${sign}${value.toFixed(3)}`;
    },

    buildEpaSeasonChartSvg(epaPerPlay, accent) {
      const seasons = epaPerPlay?.seasons || [];
      if (!seasons.length) {
        return `<p class="qb-empty">No season EPA per dropback data found for this quarterback.</p>`;
      }

      const color = normalizeHex(accent, "#2D6A4F");
      const leagueColor = "#94A3B8";
      const W = 960;
      const H = 420;
      const padL = 68;
      const padR = 24;
      const padT = 28;
      const padB = 52;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;

      // 2dp axis formatter — cleaner than 3dp for tick labels and hover values
      const fmtAxis = (v) => {
        if (v == null || !Number.isFinite(v)) return "—";
        return `${v > 0 ? "+" : ""}${v.toFixed(2)}`;
      };

      const values = seasons.flatMap((row) =>
        [row.epaPerDropback, row.leagueAvg].filter((val) => val != null && Number.isFinite(val))
      );
      const rawMin = values.length ? Math.min(...values, 0) : 0;
      const rawMax = values.length ? Math.max(...values, 0) : 0.2;
      const span = Math.max(rawMax - rawMin, 0.08);
      const yMin = rawMin - span * 0.12;
      const yMax = rawMax + span * 0.12;
      const yScale = (value) => padT + plotH - ((value - yMin) / (yMax - yMin)) * plotH;
      const baseY = yScale(0);
      const groupW = plotW / seasons.length;
      const barW = Math.min(40, groupW * 0.30);
      const innerGap = 6;

      const yTicks = 5;
      const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
        const value = yMin + ((yMax - yMin) * i) / yTicks;
        const y = yScale(value);
        const isZero = Math.abs(value) < 0.0005;
        const stroke = isZero ? "#CBD5E1" : "#EEF2F7";
        const strokeWidth = isZero ? 1.5 : 1;
        return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${(padL + plotW).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      }).join("");

      const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
        const value = yMin + ((yMax - yMin) * i) / yTicks;
        const y = yScale(value);
        return `<text class="qb-axis-label" x="${(padL - 8).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end">${escapeHtml(fmtAxis(value))}</text>`;
      }).join("");

      const bars = seasons
        .map((row, i) => {
          const centerX = padL + i * groupW + groupW / 2;
          const qbX = centerX - barW - innerGap / 2;
          const leagueX = centerX + innerGap / 2;
          const delay = i * 55;
          const qbVal = row.epaPerDropback;
          const leagueVal = row.leagueAvg;
          let barEls = "";

          if (qbVal != null && Number.isFinite(qbVal)) {
            const y = yScale(qbVal);
            const top = Math.min(y, baseY);
            const h = Math.abs(baseY - y);
            barEls += `<g class="qb-chart-bar qb-epa-bar" data-y="${top.toFixed(1)}" data-h="${h.toFixed(1)}" data-base="${baseY.toFixed(1)}" data-delay="${delay}">
  <rect x="${qbX.toFixed(1)}" y="${baseY.toFixed(1)}" width="${barW.toFixed(1)}" height="0" fill="${color}" rx="3" />
  <text class="qb-bar-value" x="${(qbX + barW / 2).toFixed(1)}" y="${(top - 8).toFixed(1)}" text-anchor="middle" opacity="0">${escapeHtml(fmtAxis(qbVal))}</text>
</g>`;
          }

          if (leagueVal != null && Number.isFinite(leagueVal)) {
            const y = yScale(leagueVal);
            const top = Math.min(y, baseY);
            const h = Math.abs(baseY - y);
            barEls += `<g class="qb-chart-bar qb-epa-bar qb-epa-bar--league" data-y="${top.toFixed(1)}" data-h="${h.toFixed(1)}" data-base="${baseY.toFixed(1)}" data-delay="${delay + 20}">
  <rect x="${leagueX.toFixed(1)}" y="${baseY.toFixed(1)}" width="${barW.toFixed(1)}" height="0" fill="${leagueColor}" rx="3" />
  <text class="qb-bar-value" x="${(leagueX + barW / 2).toFixed(1)}" y="${(top - 8).toFixed(1)}" text-anchor="middle" opacity="0">${escapeHtml(fmtAxis(leagueVal))}</text>
</g>`;
          }

          return `${barEls}<text class="qb-axis-label qb-epa-season-label" x="${centerX.toFixed(1)}" y="${(H - padB + 24).toFixed(1)}" text-anchor="middle">${escapeHtml(String(row.season))}</text>`;
        })
        .join("");

      return `<div class="qb-chart-wrap qb-epa-season-card qb-animate-item">
  <div class="qb-epa-legend" aria-hidden="true">
    <span class="qb-epa-legend-item"><span class="qb-epa-legend-swatch" style="background:${escapeAttr(color)}"></span>Quarterback</span>
    <span class="qb-epa-legend-item"><span class="qb-epa-legend-swatch" style="background:${leagueColor}"></span>NFL avg · 200+ dropbacks</span>
    <span class="qb-epa-legend-unit">EPA per dropback</span>
  </div>
  <svg class="qb-epa-chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="EPA per dropback by season compared with NFL average">
    ${gridLines}${yLabels}${bars}
    <text class="qb-epa-axis-title" x="${(padL + plotW / 2).toFixed(1)}" y="${(H - 8).toFixed(1)}" text-anchor="middle">Season</text>
  </svg>
</div>`;
    },

    buildEpaCareerSlide(epaPerPlay, accent, profile) {
      const career = epaPerPlay?.career;
      if (!career) {
        return `<article class="qb-compare-slide qb-epa-career-slide" data-split-id="career">
  <h3 class="qb-compare-slide-title">Career EPA per dropback</h3>
  <p class="qb-empty">No career EPA data found for this quarterback.</p>
</article>`;
      }

      const color = normalizeHex(accent, "#2D6A4F");
      const fmtEpa = (v) => {
        if (v == null || !Number.isFinite(v)) return "—";
        return `${v > 0 ? "+" : ""}${v.toFixed(2)}`;
      };

      const delta = career.delta;
      const deltaClass = delta == null ? "" : delta > 0 ? " is-pos" : delta < 0 ? " is-neg" : "";
      const deltaTxt = delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} vs NFL avg`;

      // Spectrum bar: position QB and league avg on a meaningful range
      const qbVal = career.epaPerDropback ?? 0;
      const avgVal = career.leagueAvg ?? 0;
      const specMin = Math.min(qbVal, avgVal, -0.05) - 0.05;
      const specMax = Math.max(qbVal, avgVal, 0.40) + 0.05;
      const specRange = specMax - specMin;
      const toSpecPct = (v) => Math.max(2, Math.min(97, ((v - specMin) / specRange) * 100)).toFixed(1);
      const qbPct = toSpecPct(qbVal);
      const avgPct = toSpecPct(avgVal);

      // Ordinal helper — spelled out for 1–9, numeric for 10+
      const ORDINAL_WORDS = ["first","second","third","fourth","fifth","sixth","seventh","eighth","ninth"];
      const ordinal = (n) => {
        if (n == null) return "—";
        if (n >= 1 && n <= 9) return ORDINAL_WORDS[n - 1];
        const s = ["th","st","nd","rd"], v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };

      // Narrative sentence
      let narrative = "";
      if (career.epaPerDropback != null) {
        const name = profile.playerName || "This quarterback";
        const pool = career.leagueQualifiedCount || "—";
        const rankStr = career.rank != null ? ordinal(career.rank) : "unranked";
        const aboveLine = career.rankAbove
          ? `${escapeHtml(career.rankAbove.name)} ranks ${escapeHtml(ordinal(career.rank - 1))} at ${escapeHtml(fmtEpa(career.rankAbove.epaPerDropback))}`
          : "";
        const belowLine = career.rankBelow
          ? `${escapeHtml(career.rankBelow.name)} ranks ${escapeHtml(ordinal(career.rank + 1))} at ${escapeHtml(fmtEpa(career.rankBelow.epaPerDropback))}`
          : "";
        const neighborTxt = [aboveLine, belowLine].filter(Boolean).join("; ");
        const absDelta = delta != null ? Math.abs(delta).toFixed(2) : null;
        const dirWord = delta != null ? (delta >= 0 ? "above" : "below") : null;

        narrative = `<div class="epa-career-narrative">` +
          `${escapeHtml(name)} has averaged ${escapeHtml(fmtEpa(career.epaPerDropback))} EPA per dropback over his career, ` +
          `ranking ${escapeHtml(rankStr)} among ${escapeHtml(String(pool))} quarterbacks who have dropped back at least 1,000 times in the PFF era.` +
          (neighborTxt ? ` ${neighborTxt}.` : "") +
          (absDelta && dirWord ? ` That is ${escapeHtml(absDelta)} points ${dirWord} the NFL average for qualified passers in that span.` : "") +
          `</div>`;
      }

      // Leaderboard carousel cards
      const leaderboard = career.leaderboard || [];
      const fmtEpa3 = (v) => {
        if (v == null || !Number.isFinite(v)) return "—";
        return `${v > 0 ? "+" : ""}${v.toFixed(4)}`;
      };
      const carouselCards = leaderboard.map((entry) => {
        const isActive = entry.rank === career.rank;
        const cardStyle = isActive ? ` style="background:${escapeAttr(color)};border-color:${escapeAttr(color)}"` : "";
        const { first: firstName, last: lastName } = splitDisplayName(entry.name);
        return `<div class="epa-rank-card${isActive ? " is-active" : ""}"${cardStyle} data-epa-rank-active="${isActive}">
  <span class="epa-rank-num">${escapeHtml(String(entry.rank))}</span>
  <span class="epa-rank-firstname">${escapeHtml(firstName)}</span>
  <span class="epa-rank-lastname">${escapeHtml(lastName)}</span>
  <span class="epa-rank-val">${escapeHtml(fmtEpa3(entry.epaPerDropback))}</span>
</div>`;
      }).join("");

      return `<article class="qb-compare-slide qb-epa-career-slide" data-split-id="career">
  <h3 class="qb-compare-slide-title">Career EPA per dropback</h3>
  <p class="qb-compare-slide-kicker">Since 2006 · qualifying pool: 1,000+ career dropbacks (${career.leagueQualifiedCount || "—"} QBs)</p>
  <div class="epa-career-board">
    <div class="epa-career-hero">
      <div class="epa-career-main">
        <span class="epa-career-val" style="color:${escapeAttr(color)}">${escapeHtml(fmtEpa(career.epaPerDropback))}</span>
        <span class="epa-career-label">Career EPA / dropback</span>
      </div>
      <span class="epa-career-delta${deltaClass}">${escapeHtml(deltaTxt)}</span>
    </div>
    <div class="epa-spectrum qb-animate-item">
      <div class="epa-spectrum-track">
        <div class="epa-spectrum-avg-line" style="left:${avgPct}%" data-label="${escapeAttr("NFL avg " + fmtEpa(career.leagueAvg))}"></div>
        <div class="epa-spectrum-qb-pip" style="left:${qbPct}%; background:${escapeAttr(color)}"></div>
      </div>
      <div class="epa-spectrum-labels">
        <span>Below avg</span>
        <span>NFL avg ${escapeHtml(fmtEpa(career.leagueAvg))}</span>
        <span>Elite</span>
      </div>
    </div>
    ${narrative}
    ${carouselCards.length ? `<div class="epa-rank-carousel" aria-label="Career EPA leaderboard"><div class="epa-rank-track">${carouselCards}</div></div>` : ""}
  </div>
</article>`;
    },

    buildEpaPerPlaySection(epaPerPlay, profile, accent) {
      if (!epaPerPlay?.seasons?.length && !epaPerPlay?.career) {
        return this.buildCollapsibleSection({
          title: "EPA per play",
          bodyHtml: `<p class="qb-empty">Upload epa-per-play-season.csv and epa-per-play-career.csv to show EPA per dropback.</p>`,
        });
      }

      const seasonSlide = `<article class="qb-compare-slide qb-epa-season-slide" data-split-id="season">
  <h3 class="qb-compare-slide-title">EPA per dropback by season</h3>
  <p class="qb-compare-slide-kicker">Bars compare this quarterback to the NFL average among passers with 200+ dropbacks that season</p>
  ${this.buildEpaSeasonChartSvg(epaPerPlay, accent)}
</article>`;
      const careerSlide = this.buildEpaCareerSlide(epaPerPlay, accent, profile);

      return this.buildCollapsibleSection({
        title: "EPA per play",
        sectionClass: "qb-section-epa",
        leadHtml: `<p class="qb-interactive-hint qb-animate-item">Swipe or tap to compare season and career EPA per dropback</p>`,
        bodyHtml: `<div class="qb-compare-carousel qb-animate-item" data-default-split="season">
    <div class="qb-compare-tabs" role="tablist">
      <button type="button" class="qb-compare-tab" data-split-target="season" aria-pressed="true">By season</button>
      <button type="button" class="qb-compare-tab" data-split-target="career" aria-pressed="false">Career</button>
    </div>
    <div class="qb-compare-track">${seasonSlide}${careerSlide}</div>
  </div>`,
      });
    },

    buildMarkup(profile, options = {}) {
      if (!profile) return `<p class="qb-empty">Loading profile…</p>`;
      const barColor = options.barColor || "#2D6A4F";

      return `
<article class="qb-profile">
  ${this.buildHeroSection(profile)}
  ${this.buildSeasonGradesSection(profile, barColor)}
  ${this.buildEpaPerPlaySection(profile.epaPerPlay, profile, barColor)}
  ${this.buildCollapsibleSection({
    title: `${profile.gameGradeSeason || "2025"} game grades`,
    leadHtml: `<p class="qb-interactive-hint qb-animate-item">Click a bar for opponent and stat line</p>`,
    bodyHtml: this.buildGameGradesSvg(profile.gameGrades, barColor),
  })}
  ${this.buildCollapsibleSection({
    title: "Play-level grade distribution (passing plays only)",
    bodyHtml: `${this.buildDistributionIntro()}${this.buildDistributionSvg(profile.gradeDistribution, barColor)}`,
  })}
  ${this.buildGradingProfileSection(profile.gradingProfile, barColor)}
  ${this.buildPassingGradesTablesSection(profile.passingGradesTables, barColor)}
  ${this.buildAccuracySection(profile.accuracySection, barColor)}
  ${this.buildQbAlignmentSection(profile.qbAlignment, barColor)}
  ${this.buildStableUnstableSection(profile.stableUnstable, barColor)}
  ${this.buildPassingPressureSection(profile.passingPressure, barColor)}
  ${this.buildAllowedPressureSection(profile.allowedPressures, barColor)}
  ${this.buildRushingSection(profile.rushing, barColor)}
  ${this.buildInterceptionLuckSection(profile.interceptionLuck, profile, barColor)}
  ${this.buildTargetMapsSection(profile.passingDepth, profile.targetMap, profile.accuracyByDepth, profile.routeTree, profile, barColor)}
  ${this.buildSeasonMetricDonutSection(profile, barColor, {
    title: "Average time to throw",
    dataKey: "seasonTimeToThrow",
    dataAttr: "data-ttt-season",
    metricLabel: "average time to throw",
    valueClass: " qb-donut-metric qb-donut-metric--ttt",
    hint: "2023–2025 · click a donut center for full season rankings",
  })}
  ${this.buildSeasonMetricDonutSection(profile, barColor, {
    title: "Average target depth",
    dataKey: "seasonTargetDepth",
    dataAttr: "data-adot-season",
    metricLabel: "average target depth",
    valueClass: " qb-donut-metric qb-donut-metric--adot",
    hint: "2023–2025 · click a donut center for full season rankings",
  })}
  ${this.buildSeasonMetricDonutSection(profile, barColor, {
    title: "Pressure to sack rate",
    dataKey: "seasonPressureToSackRate",
    dataAttr: "data-pts-season",
    metricLabel: "pressure to sack rate",
    valueClass: " qb-donut-metric qb-donut-metric--pts",
    hint: "2023–2025 · click a donut center for full season rankings",
  })}
  ${this.buildClutchMomentsSection(profile.clutchMoments, barColor)}
</article>`;
    },

    buildCss() {
      return `
.qb-profile {
  max-width: ${PROFILE_MAX}px;
  margin: 0 auto;
  font-family: "Archivo", system-ui, -apple-system, sans-serif;
  color: #0F0F10;
  background: #FFFFFF;
  line-height: 1.35;
}
.qb-section { padding: 8px 0; }
.qb-section-donuts { text-align: center; }
.qb-section-donuts .qb-compare-slide {
  text-align: center;
  padding: 4px 0 0;
}
.qb-compare-carousel--donuts {
  margin-top: 0;
}
.qb-compare-carousel--donuts .qb-compare-tabs {
  justify-content: center;
  margin-bottom: 10px;
}
.qb-compare-carousel--donuts .qb-compare-track {
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.qb-section-epa .qb-compare-slide {
  padding-top: 18px;
}
.qb-epa-chart-wrap {
  margin-top: 6px;
}
.qb-chart-card,
.qb-epa-season-card {
  margin-top: 6px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--accent, #2d6a4f) 22%, transparent);
  border-top: 4px solid var(--accent, #2d6a4f);
  background: color-mix(in srgb, var(--accent, #2d6a4f) 3%, #fff);
  padding: 18px 20px 14px;
  box-sizing: border-box;
}
.qb-epa-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
  justify-content: center;
  margin-bottom: 12px;
}
.qb-epa-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748B;
}
.qb-epa-legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex: 0 0 12px;
}
.qb-epa-axis-title {
  fill: #94A3B8;
  font-family: "Archivo", sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.qb-epa-season-label {
  fill: #64748B;
  font-size: 12px;
  font-weight: 700;
}
.qb-epa-bar:hover .qb-bar-value,
.qb-epa-bar:focus-within .qb-bar-value {
  opacity: 1;
}
.qb-epa-career-hero .qb-compare-pane-grade {
  font-size: 2rem;
  letter-spacing: -0.03em;
}
.qb-compare-hero-delta.is-positive {
  color: #166534;
}
.qb-compare-hero-delta.is-negative {
  color: #991B1B;
}
/* legend unit label */
.qb-epa-legend-unit {
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
  padding-left: 4px;
  border-left: 1px solid #e2e8f0;
  margin-left: 4px;
}
/* ----- EPA career scorecard ----- */
.epa-career-board {
  min-width: 0;
  width: 100%;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--accent, #2d6a4f) 22%, transparent);
  border-top: 4px solid var(--accent, #2d6a4f);
  background: color-mix(in srgb, var(--accent, #2d6a4f) 3%, #fff);
  padding: 20px 20px 16px;
  box-sizing: border-box;
}
.epa-career-hero {
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 14px; margin-bottom: 28px;
}
.epa-career-main { display: flex; flex-direction: column; gap: 6px; }
.epa-career-val {
  font-size: clamp(2.4rem, 5vw, 3.4rem); font-weight: 900;
  letter-spacing: -0.04em; line-height: 1;
  font-variant-numeric: tabular-nums; font-family: "Archivo", sans-serif;
}
.epa-career-label {
  font-size: 0.64rem; font-weight: 800; letter-spacing: 0.12em;
  text-transform: uppercase; color: #94a3b8; font-family: "Archivo", sans-serif;
}
.epa-career-delta {
  display: inline-flex; align-items: center; align-self: center;
  padding: 9px 18px; border-radius: 999px;
  font-size: 0.86rem; font-weight: 800; font-variant-numeric: tabular-nums;
  font-family: "Archivo", sans-serif;
  background: #f1f5f9; color: #64748b;
}
.epa-career-delta.is-pos { background: rgba(21,106,60,0.1); color: #156a3c; }
.epa-career-delta.is-neg { background: rgba(155,28,28,0.08); color: #9b1c1c; }
.epa-spectrum { margin-bottom: 28px; }
.epa-spectrum-track {
  position: relative; height: 10px; border-radius: 99px;
  background: linear-gradient(90deg, #dde4ee, #c8d4e8 50%, #94a3b8);
  margin: 0 10px 28px;
}
.epa-spectrum-avg-line {
  position: absolute; top: -6px; bottom: -6px; width: 2px;
  background: #64748b; border-radius: 99px; transform: translateX(-50%);
}
.epa-spectrum-avg-line::after {
  content: attr(data-label);
  position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  font-size: 0.58rem; font-weight: 800; color: #64748b;
  white-space: nowrap; letter-spacing: 0.04em; font-family: "Archivo", sans-serif;
}
.epa-spectrum-qb-pip {
  position: absolute; top: 50%; width: 20px; height: 20px;
  border-radius: 50%; border: 3px solid #fff;
  box-shadow: 0 3px 10px rgba(0,0,0,0.18);
  transform: translate(-50%, -50%);
}
.epa-spectrum-labels {
  display: flex; justify-content: space-between;
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #94a3b8; padding: 0 10px;
  font-family: "Archivo", sans-serif;
}
.epa-career-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
}
.epa-career-stat {
  border-radius: 14px; background: #f7f8fa; padding: 14px 16px; text-align: center;
}
.epa-career-stat .v {
  display: block; font-size: 1.3rem; font-weight: 900;
  letter-spacing: -0.02em; font-variant-numeric: tabular-nums;
  font-family: "Archivo", sans-serif;
}
.epa-career-stat .l {
  display: block; margin-top: 4px; font-size: 0.6rem; font-weight: 800;
  letter-spacing: 0.1em; text-transform: uppercase; color: #8a8f98;
  font-family: "Archivo", sans-serif;
}
@media (max-width: 560px) {
  .epa-career-stats { grid-template-columns: repeat(2, 1fr); }
  .epa-career-hero { flex-direction: column; }
}
.epa-career-narrative {
  margin: 20px 0 0;
  padding: 16px 20px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent, #2d6a4f) 6%, #fff);
  border-left: 4px solid var(--accent, #2d6a4f);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.7;
  color: #374151;
  font-family: "Archivo", sans-serif;
}
/* ----- career EPA leaderboard carousel ----- */
.epa-rank-carousel {
  margin-top: 20px;
  overflow: hidden;
  width: 100%;
  min-width: 0;
}
.epa-rank-track {
  display: flex;
  width: 100%;
  gap: 8px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}
.epa-rank-track::-webkit-scrollbar { display: none; }
.epa-rank-card {
  flex: 0 0 106px;
  scroll-snap-align: center;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f7f8fa;
  padding: 10px 10px 11px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: default;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.epa-rank-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(14,15,18,0.08); }
.epa-rank-card.is-active { color: #fff; }
.epa-rank-num {
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  opacity: 0.6;
  font-family: "Archivo", sans-serif;
  align-self: flex-start;
}
.epa-rank-card.is-active .epa-rank-num { opacity: 0.8; color: #fff; }
.epa-rank-firstname {
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1.1;
  color: #6b7280;
  font-family: "Archivo", sans-serif;
  text-align: center;
  margin-top: 2px;
}
.epa-rank-card.is-active .epa-rank-firstname { color: rgba(255,255,255,0.75); }
.epa-rank-lastname {
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.1;
  color: #111418;
  font-family: "Archivo", sans-serif;
  text-align: center;
  letter-spacing: -0.01em;
}
.epa-rank-card.is-active .epa-rank-lastname { color: #fff; }
.epa-rank-val {
  font-size: 0.92rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: #374151;
  font-family: "Archivo", sans-serif;
  margin-top: 4px;
  text-align: center;
  align-self: stretch;
  border-top: 1px solid rgba(0,0,0,0.06);
  padding-top: 5px;
}
.epa-rank-card.is-active .epa-rank-val { color: #fff; border-top-color: rgba(255,255,255,0.2); }
.qb-collapsible-details {
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  overflow: hidden;
  background: #FFFFFF;
  transition: box-shadow 0.28s ease, border-color 0.28s ease, transform 0.28s ease;
}
.qb-collapsible-details[open] {
  border-color: #D1D5DB;
  box-shadow: 0 14px 36px rgba(15, 15, 16, 0.07);
}
.qb-collapsible-details.is-opening {
  border-color: #BFDBFE;
  box-shadow: 0 16px 40px rgba(0, 107, 255, 0.08);
}
.qb-collapsible-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: background 0.2s ease;
}
.qb-collapsible-trigger::-webkit-details-marker {
  display: none;
}
.qb-collapsible-trigger::marker {
  content: "";
}
.qb-collapsible-trigger:hover {
  background: #FAFBFC;
}
.qb-collapsible-details[open] > .qb-collapsible-trigger {
  border-bottom: 1px solid #EEF0F3;
  background: #FAFBFC;
}
.qb-collapsible-title {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #111827;
}
.qb-collapsible-chevron {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  flex-shrink: 0;
  position: relative;
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease, border-color 0.2s ease;
}
.qb-collapsible-chevron::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 8px;
  height: 8px;
  border-right: 2px solid #6B7280;
  border-bottom: 2px solid #6B7280;
  transform: rotate(45deg) translate(-1px, -1px);
  transition: border-color 0.2s ease;
}
.qb-collapsible-details[open] .qb-collapsible-chevron {
  transform: rotate(180deg);
  background: #EEF4FF;
  border-color: #BFDBFE;
}
.qb-collapsible-details[open] .qb-collapsible-chevron::before {
  border-color: #006BFF;
}
.qb-collapsible-panel {
  overflow: hidden;
}
.qb-collapsible-panel-inner {
  padding: 20px 20px 24px;
}
.qb-collapsible-details[open] .qb-collapsible-panel-inner {
  animation: qb-collapsible-reveal 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes qb-collapsible-reveal {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.qb-section-donuts .qb-collapsible-panel-inner {
  text-align: center;
}
.qb-section-donuts .qb-interactive-hint {
  margin-left: auto;
  margin-right: auto;
}
.qb-section-title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.qb-section-hint {
  margin: 0 0 20px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6B7280;
}
.qb-interactive-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 20px;
  padding: 8px 12px;
  border: 1px solid #D1E3FF;
  border-radius: 999px;
  background: #EEF4FF;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #006BFF;
}
.qb-interactive-hint::before {
  content: "↗";
  font-size: 0.9rem;
  line-height: 1;
}
.qb-grade-explainer {
  margin: 0 0 20px;
  padding: 14px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: #F8F9FB;
}
.qb-grade-explainer-text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #374151;
}
.qb-grade-explainer-link {
  color: #006BFF;
  font-weight: 700;
  text-decoration: none;
}
.qb-grade-explainer-link:hover {
  text-decoration: underline;
}
.qb-scatter-carousel {
  margin-top: 4px;
}
.qb-scatter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.qb-scatter-tab {
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #D1D5DB;
  background: #FFF;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.qb-scatter-tab[aria-pressed="true"] {
  border-color: #006BFF;
  background: #EEF4FF;
  color: #006BFF;
}
.qb-scatter-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  background: #FFF;
}
.qb-scatter-track::-webkit-scrollbar {
  display: none;
}
.qb-scatter-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
  padding: 16px 16px 12px;
  box-sizing: border-box;
}
.qb-scatter-chart-title {
  margin: 0 0 12px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #374151;
}
.qb-scatter-stage {
  position: relative;
}
.qb-scatter-chart {
  display: block;
}
.qb-scatter-avg-line {
  stroke: rgba(220, 38, 38, 0.35);
  stroke-width: 1.5;
  stroke-dasharray: 6 5;
}
.qb-scatter-point {
  cursor: pointer;
  transition: r 0.15s ease, fill 0.15s ease, stroke-width 0.15s ease;
}
.qb-scatter-point:hover,
.qb-scatter-point:focus-visible {
  stroke: #006BFF;
  stroke-width: 3;
}
.qb-scatter-point--featured {
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18));
}
.qb-scatter-axis-title {
  fill: #6B7280;
  font-family: "Archivo", sans-serif;
  font-size: 13px;
  font-weight: 700;
}
.qb-scatter-tick {
  fill: #9CA3AF;
  font-family: "Archivo", sans-serif;
  font-size: 12px;
  font-weight: 600;
}
.qb-scatter-panel-wrap {
  position: absolute;
  z-index: 3;
  width: 232px;
  pointer-events: none;
}
.qb-scatter-panel-wrap--hover {
  z-index: 4;
}
.qb-scatter-panel {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 28px rgba(15, 15, 16, 0.12);
}
.qb-scatter-panel-photo {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  object-position: top center;
  flex: 0 0 56px;
  background: #F3F4F6;
}
.qb-scatter-panel-name {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.2;
}
.qb-scatter-panel-team {
  margin: 2px 0 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6B7280;
}
.qb-scatter-panel-stats {
  margin: 0;
  display: grid;
  gap: 4px;
}
.qb-scatter-panel-stats div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.72rem;
}
.qb-scatter-panel-stats dt {
  margin: 0;
  color: #6B7280;
  font-weight: 600;
}
.qb-scatter-panel-stats dd {
  margin: 0;
  font-weight: 800;
  color: #111827;
}
.qb-metric-kicker {
  margin: -8px 0 24px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6B7280;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.qb-metric-block {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid #E5E7EB;
}
.qb-metric-block:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}
.qb-metric-block-title {
  margin: 0 0 14px;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.qb-metric-writeup {
  margin-bottom: 22px;
  padding: 16px 18px;
  border-radius: 10px;
  background: #F8F9FB;
  border: 1px solid #E5E7EB;
}
.qb-metric-writeup-text {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: #374151;
}
.qb-metric-bars {
  display: grid;
  gap: 12px;
}
.qb-metric-row {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 2fr) 44px;
  gap: 14px;
  align-items: center;
}
.qb-metric-label {
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.25;
  color: #111827;
}
.qb-metric-track {
  height: 14px;
  border-radius: 999px;
  background: #EEF0F3;
  overflow: hidden;
}
.qb-metric-fill {
  height: 100%;
  width: var(--metric-width, 0%);
  border-radius: inherit;
  background: var(--metric-color, #2D6A4F);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.qb-metric-row.is-empty .qb-metric-fill {
  opacity: 0.18;
}
.qb-metric-value {
  font-size: 0.92rem;
  font-weight: 800;
  text-align: right;
  color: #111827;
  font-variant-numeric: tabular-nums;
}
.qb-compare-carousel {
  margin-top: 4px;
}
.qb-compare-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.qb-compare-tab {
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #D1D5DB;
  background: #FFF;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.qb-compare-tab[aria-pressed="true"] {
  border-color: #006BFF;
  background: #EEF4FF;
  color: #006BFF;
}
.qb-compare-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  background: #FFF;
  box-shadow: 0 8px 28px rgba(15, 15, 16, 0.04);
}
.qb-compare-track::-webkit-scrollbar {
  display: none;
}
.qb-compare-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
  padding: 22px 24px 20px;
  box-sizing: border-box;
}
.qb-compare-slide-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #111827;
}
.qb-compare-slide-kicker {
  margin: 4px 0 18px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #9CA3AF;
}
.qb-compare-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  margin-bottom: 22px;
}
.qb-compare-pane {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 14px;
  border-radius: 14px;
  background: #F8F9FB;
  border: 1px solid #EEF0F3;
}
.qb-compare-pane-right {
  text-align: right;
  align-items: flex-end;
}
.qb-compare-pane-label {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.qb-compare-pane-grade {
  font-size: clamp(1.85rem, 4vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #111827;
}
.qb-compare-pane-meta {
  font-size: 0.72rem;
  font-weight: 600;
  color: #6B7280;
}
.qb-compare-hero-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 2px;
}
.qb-compare-hero-vs {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #D1D5DB;
}
.qb-compare-hero-delta {
  font-size: 0.82rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  padding: 4px 10px;
  border-radius: 999px;
  background: #F3F4F6;
  color: #374151;
  white-space: nowrap;
}
.qb-compare-hero-delta.is-positive {
  background: #ECFDF3;
  color: #166534;
}
.qb-compare-hero-delta.is-negative {
  background: #FEF2F2;
  color: #991B1B;
}
.qb-compare-table-wrap {
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
  background: #FFFFFF;
}
.qb-compare-table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.qb-compare-table th,
.qb-compare-table td {
  padding: 11px 14px;
  border-bottom: 1px solid #EEF0F3;
  text-align: right;
}
.qb-compare-table thead th {
  background: #F8F9FB;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6B7280;
}
.qb-compare-table tbody tr:last-child th,
.qb-compare-table tbody tr:last-child td {
  border-bottom: none;
}
.qb-compare-table-metric {
  text-align: left;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}
.qb-compare-table-val {
  font-size: 0.88rem;
  font-weight: 700;
  color: #111827;
}
.qb-compare-table-val.is-better {
  color: var(--compare-accent, #2D6A4F);
}
.qb-section-pass-tables .qb-compare-carousel--pass-tables .qb-compare-track {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--compare-accent, #2D6A4F) 10%, transparent), transparent 42%),
    linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%);
}
.qb-section-accuracy .qb-compare-carousel--accuracy .qb-compare-track {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--compare-accent, #2D6A4F) 10%, transparent), transparent 42%),
    linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%);
}
.qb-acc-table-kicker {
  margin: -4px 0 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #6B7280;
}
.qb-acc-share-val {
  font-weight: 800;
}
.qb-qb-align-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.qb-qb-align-mix {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qb-qb-align-bar {
  display: flex;
  width: 100%;
  height: 18px;
  overflow: hidden;
  border-radius: 999px;
  background: #EEF0F3;
  box-shadow: inset 0 1px 2px rgba(15, 15, 16, 0.06);
}
.qb-qb-align-seg {
  display: block;
  min-width: 2px;
  height: 100%;
}
.qb-qb-align-seg + .qb-qb-align-seg {
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.35);
}
.qb-qb-align-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}
.qb-qb-align-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  color: #374151;
}
.qb-qb-align-legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
}
.qb-pass-table-slide {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.qb-pass-table-wrap {
  overflow-x: auto;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  background: #FFFFFF;
  box-shadow: 0 10px 28px rgba(15, 15, 16, 0.06);
}
.qb-pass-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 320px;
  font-variant-numeric: tabular-nums;
}
.qb-pass-table th,
.qb-pass-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #EEF0F3;
  vertical-align: middle;
}
.qb-pass-table--visual thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6B7280;
  background: linear-gradient(180deg, #FAFBFC 0%, #F3F4F6 100%);
  border-bottom: 2px solid color-mix(in srgb, var(--pass-accent, #2D6A4F) 28%, #E5E7EB);
  text-align: left;
}
.qb-pass-table--visual thead th:nth-child(2),
.qb-pass-table--visual thead th:nth-child(3),
.qb-pass-table--visual thead th:nth-child(4),
.qb-pass-table--visual thead th:nth-child(5) {
  text-align: right;
}
.qb-pass-table-row {
  transition: background-color 0.14s ease;
}
.qb-pass-table-row:nth-child(even of .qb-pass-table-row) {
  background: #FAFBFC;
}
.qb-pass-table-row:hover {
  background: color-mix(in srgb, var(--grade-color, #9CA3AF) 6%, #FFFFFF);
}
.qb-pass-table-row--rank-1 {
  background: linear-gradient(90deg, rgba(245, 197, 24, 0.1), transparent 55%);
}
.qb-pass-table-row--rank-top:not(.qb-pass-table-row--rank-1) {
  background: linear-gradient(90deg, rgba(245, 197, 24, 0.05), transparent 45%);
}
.qb-pass-table-row:last-child th,
.qb-pass-table-row:last-child td {
  border-bottom: none;
}
.qb-pass-table-group th {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--pass-accent, #2D6A4F) 78%, #111827);
  background: color-mix(in srgb, var(--pass-accent, #2D6A4F) 10%, #F9FAFB);
  border-bottom: 1px solid color-mix(in srgb, var(--pass-accent, #2D6A4F) 18%, #E5E7EB);
  border-top: 1px solid color-mix(in srgb, var(--pass-accent, #2D6A4F) 12%, #E5E7EB);
}
.qb-pass-table-group:first-child th {
  border-top: none;
}
.qb-pass-table-label {
  position: relative;
  padding-left: 18px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #374151;
  text-align: left;
}
.qb-pass-table-label::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 62%;
  transform: translateY(-50%);
  border-radius: 999px;
  background: var(--grade-color, #9CA3AF);
}
.qb-pass-table-grade,
.qb-pass-table-att,
.qb-pass-table-rank {
  text-align: right;
  white-space: nowrap;
}
.qb-pass-table-att-wrap,
.qb-pass-table-rank-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 72px;
  min-height: 28px;
  padding: 4px 8px;
  border-radius: 8px;
  overflow: hidden;
}
.qb-pass-table-att-bar {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 8px;
  background: color-mix(in srgb, var(--pass-accent, #2D6A4F) 12%, #EEF0F3);
}
.qb-pass-table-att-val {
  position: relative;
  z-index: 1;
  font-size: 0.84rem;
  font-weight: 700;
  color: #111827;
}
.qb-pass-table-rank-bar {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--pass-accent, #2D6A4F) 18%, #FFFFFF),
    color-mix(in srgb, #F5C518 22%, #FFFFFF)
  );
}
.qb-pass-table-rank-text {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
}
.qb-pass-table-rank-label {
  font-size: 0.88rem;
  font-weight: 800;
  color: #B8860B;
}
.qb-pass-table-row--rank-1 .qb-pass-table-rank-label {
  color: #9A7200;
}
.qb-pass-table-rank-of {
  font-size: 0.72rem;
  font-weight: 700;
  color: #9CA3AF;
}
.qb-pass-table--ranked .qb-pass-table-label {
  width: 42%;
}
.qb-pass-grade-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--grade-color, #9CA3AF) 16%, #FFFFFF);
  border: 1px solid color-mix(in srgb, var(--grade-color, #9CA3AF) 38%, #FFFFFF);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset;
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--grade-color, #374151);
  font-variant-numeric: tabular-nums;
}
.qb-section-rushing .qb-compare-carousel--rushing .qb-compare-track {
  background: linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%);
}
.qb-rush-slide {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.qb-rush-hero-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.qb-rush-hero-caption {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6B7280;
}
/* rush ledger */
.qb-rush-hero-layout {
  display: flex;
  gap: 24px;
  align-items: center;
}
.qb-rush-hero-layout .qb-rush-hero-ring { flex-shrink: 0; }
.qb-rush-hero-layout .qb-rush-ledger { flex: 1; align-self: stretch; justify-content: center; }
.qb-rush-ledger {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.qb-rush-row {
  display: grid;
  grid-template-columns: minmax(100px, 0.85fr) minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 10px;
  background: #f7f8fa;
  transition: background 0.15s ease;
}
.qb-rush-row:hover { background: color-mix(in srgb, var(--rush-accent, #2D6A4F) 8%, #fff); }
.qb-rush-row-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qb-rush-row-bar-wrap {
  height: 6px;
  background: #E5E7EB;
  border-radius: 99px;
  overflow: hidden;
}
.qb-rush-row-bar {
  height: 100%;
  width: var(--rush-ring, 0%);
  background: var(--rush-accent, #2D6A4F);
  border-radius: 99px;
  transition: width 0.65s cubic-bezier(0.34, 1.1, 0.64, 1) 0.1s;
}
.qb-rush-row-value {
  font-size: 0.92rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: #111827;
  white-space: nowrap;
  text-align: right;
}
.qb-rush-row-rank {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--rush-accent, #2D6A4F) 12%, #fff);
  color: var(--rush-accent, #2D6A4F);
  white-space: nowrap;
}
.qb-rush-split-hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qb-rush-split-kicker {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #6B7280;
  text-align: center;
}
.qb-rush-split-sub {
  display: block;
  margin-top: 2px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #4B5563;
}
.qb-rush-split-delta-label {
  display: block;
  margin-top: 4px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #9CA3AF;
  text-align: center;
}
.qb-int-luck {
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  overflow: hidden;
  background: #FFFFFF;
  box-shadow: 0 8px 28px rgba(15, 15, 16, 0.04);
}
.qb-int-luck-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: end;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #EEF0F3;
  background: linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%);
}
.qb-int-luck-eyebrow {
  margin: 0 0 8px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6B7280;
}
.qb-int-luck-meta {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6B7280;
  line-height: 1.45;
}
.qb-int-luck-hero-stat {
  text-align: right;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  background: #F8F9FB;
  min-width: 128px;
}
.qb-int-luck-hero-stat.is-lucky {
  background: #ECFDF3;
  border-color: #A7F3D0;
}
.qb-int-luck-hero-stat.is-unlucky {
  background: #FEF2F2;
  border-color: #FECACA;
}
.qb-int-luck-hero-value {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: #111827;
}
.qb-int-luck-hero-stat.is-lucky .qb-int-luck-hero-value { color: #166534; }
.qb-int-luck-hero-stat.is-unlucky .qb-int-luck-hero-value { color: #991B1B; }
.qb-int-luck-hero-label {
  margin-top: 6px;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6B7280;
}
.qb-int-luck-hero-caption {
  margin: 6px 0 0;
  max-width: 150px;
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9CA3AF;
  line-height: 1.35;
}
.qb-int-luck-waterfall {
  padding: 18px 24px;
  background: #F8F9FB;
  border-bottom: 1px solid #EEF0F3;
}
.qb-int-luck-waterfall-title {
  margin: 0 0 12px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.qb-int-luck-waterfall-track {
  display: flex;
  align-items: stretch;
  gap: 0;
  min-height: 52px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
}
.qb-int-luck-waterfall-seg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 6px;
  min-width: 72px;
  opacity: 0;
  transform: scaleX(0.92);
  transform-origin: left center;
  transition: opacity 500ms ease, transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}
.qb-int-luck.is-visible .qb-int-luck-waterfall-seg { opacity: 1; transform: scaleX(1); }
.qb-int-luck.is-visible .qb-int-luck-waterfall-seg--bad { transition-delay: 80ms; }
.qb-int-luck.is-visible .qb-int-luck-waterfall-seg--good { transition-delay: 280ms; }
.qb-int-luck.is-visible .qb-int-luck-waterfall-seg--total { transition-delay: 520ms; }
.qb-int-luck-waterfall-seg--bad {
  background: #EEF2FF;
  color: #3730A3;
}
.qb-int-luck-waterfall-seg--good {
  background: #DCFCE7;
  color: #166534;
}
.qb-int-luck-waterfall-seg--total {
  background: #111827;
  color: #FFFFFF;
}
.qb-int-luck-waterfall-val {
  font-size: 1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.qb-int-luck-waterfall-lbl {
  margin-top: 4px;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.85;
  text-align: center;
}
.qb-int-luck-waterfall-eq {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #9CA3AF;
  flex-shrink: 0;
}
.qb-int-luck-waterfall-note {
  margin: 10px 0 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9CA3AF;
}
.qb-int-luck-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 20px 24px;
}
.qb-int-luck-card {
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  background: #FFFFFF;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 450ms ease, transform 450ms ease;
}
.qb-int-luck.is-visible .qb-int-luck-card:nth-child(1) {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 180ms;
}
.qb-int-luck.is-visible .qb-int-luck-card:nth-child(2) {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 360ms;
}
.qb-int-luck-card-head { margin-bottom: 12px; }
.qb-int-luck-card-title {
  margin: 0 0 4px;
  font-size: 0.88rem;
  font-weight: 800;
  color: #111827;
}
.qb-int-luck-card-formula {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 600;
  color: #6B7280;
  line-height: 1.4;
}
.qb-int-luck-card-formula strong { color: #111827; font-weight: 800; }
.qb-int-luck-table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.qb-int-luck-table th,
.qb-int-luck-table td {
  padding: 9px 10px;
  border-bottom: 1px solid #EEF0F3;
  text-align: right;
  font-size: 0.82rem;
}
.qb-int-luck-table thead th {
  background: #F8F9FB;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.qb-int-luck-table tbody tr:last-child th,
.qb-int-luck-table tbody tr:last-child td { border-bottom: none; }
.qb-int-luck-table tbody th[scope="row"] {
  text-align: left;
  font-weight: 600;
  color: #374151;
}
.qb-int-luck-table-luck td {
  font-weight: 800;
  color: #111827;
}
.qb-int-luck-table-luck.is-lucky td { color: #166534; }
.qb-int-luck-table-luck.is-unlucky td { color: #991B1B; }
.qb-int-luck-callout {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin: 0 24px 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
}
.qb-int-luck-callout-num {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
  color: #B45309;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.qb-int-luck-callout-text {
  margin: 0;
  font-size: 0.82rem;
  color: #92400E;
  line-height: 1.5;
}
.qb-int-luck-callout-text strong { font-weight: 800; }
.qb-int-luck-footer {
  margin: 0;
  padding: 16px 24px 22px;
  border-top: 1px solid #EEF0F3;
  font-size: 0.82rem;
  color: #6B7280;
  line-height: 1.55;
}
.qb-int-luck-footer strong { color: #111827; font-weight: 800; }
.qb-int-luck-footer em {
  font-style: normal;
  font-weight: 800;
  color: #166534;
}
/* ---- redesigned int luck layout ---- */
.qb-il-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #EEF0F3;
}
.qb-il-eyebrow {
  margin: 0 0 5px; font-size: 0.67rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: #6B7280;
}
.qb-il-meta {
  margin: 0; font-size: 0.82rem; font-weight: 600;
  color: #9CA3AF; line-height: 1.45;
}
/* net luck hero band */
.qb-il-net-hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 22px 24px 18px; text-align: center;
  background: #F9FAFB; border-bottom: 1px solid #EEF0F3;
}
.qb-il-net-hero.is-lucky   { background: color-mix(in srgb, #16A34A 9%, #fff); }
.qb-il-net-hero.is-unlucky { background: color-mix(in srgb, #DC2626 9%, #fff); }
.qb-il-net-hero-num {
  font-size: 3rem; font-weight: 900; line-height: 1;
  letter-spacing: -0.03em; font-variant-numeric: tabular-nums; color: #6B7280;
}
.qb-il-net-hero.is-lucky   .qb-il-net-hero-num { color: #166534; }
.qb-il-net-hero.is-unlucky .qb-il-net-hero-num { color: #991B1B; }
.qb-il-net-hero-lbl {
  margin-top: 5px; font-size: 0.72rem; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase; color: #9CA3AF;
}
.qb-il-net-hero.is-lucky   .qb-il-net-hero-lbl { color: #16A34A; }
.qb-il-net-hero.is-unlucky .qb-il-net-hero-lbl { color: #DC2626; }
/* dumbbell panels */
/* stacked bar panels */
.qb-il-bar-panels {
  display: flex; align-items: stretch;
  padding: 20px 24px 18px; border-bottom: 1px solid #EEF0F3;
  background: #FAFBFC; gap: 0;
}
.qb-il-bar-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.qb-il-bar-rows { display: flex; flex-direction: column; gap: 10px; }
.qb-il-bar-row {
  display: grid; grid-template-columns: 58px 1fr 32px;
  align-items: center; gap: 10px;
}
.qb-il-bar-lbl {
  font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #9CA3AF; white-space: nowrap;
}
.qb-il-bar-track {
  height: 10px; background: #F3F4F6; border-radius: 99px; overflow: hidden;
}
.qb-il-bar-track--actual { position: relative; }
.qb-il-bar-track--actual::after {
  content: ""; position: absolute; right: 0; top: -2px; bottom: -2px;
  width: 2px; background: #D1D5DB; border-radius: 99px;
}
.qb-il-bar-fill {
  height: 100%; border-radius: 99px;
  transition: width 0.75s cubic-bezier(0.34, 1.1, 0.64, 1) 0.15s;
}
.qb-il-bar-num {
  font-size: 0.82rem; font-weight: 900; font-variant-numeric: tabular-nums;
  text-align: right; color: #374151; white-space: nowrap;
}
.qb-il-split-divider { width: 1px; background: #EEF0F3; margin: 0 20px; flex-shrink: 0; }
.qb-il-split-title {
  margin: 0 0 3px; font-size: 0.78rem; font-weight: 800; color: #111827;
}
.qb-il-methodology {
  margin: 16px 20px 20px;
  padding: 14px 18px 16px 20px;
  border-radius: 12px;
  border-left: 4px solid var(--accent, #006bff);
  background: color-mix(in srgb, var(--accent, #006bff) 7%, #fff);
}
.qb-il-methodology-title {
  margin: 0 0 6px; font-size: 0.67rem; font-weight: 900;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--accent, #006bff);
}
.qb-il-methodology-body {
  margin: 0; font-size: 0.76rem; font-weight: 500;
  color: #374151; line-height: 1.7;
}
.qb-il-methodology-link {
  color: var(--accent, #006bff); font-weight: 800;
  text-decoration: underline; text-underline-offset: 3px;
  text-decoration-thickness: 1.5px;
}
.qb-il-compare { display: flex; flex-direction: column; gap: 9px; margin-bottom: 12px; }
.qb-il-compare-row {
  display: grid; grid-template-columns: 58px 1fr 36px;
  align-items: center; gap: 8px;
}
.qb-il-compare-lbl {
  font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #9CA3AF;
}
.qb-il-bar-wrap { height: 9px; background: #F3F4F6; border-radius: 99px; overflow: hidden; }
.qb-il-bar { height: 100%; border-radius: 99px; transition: width 0.75s cubic-bezier(0.34,1.2,0.64,1) 0.15s; }
.qb-il-bar--exp { background: #D1D5DB; }
.qb-il-bar--act { background: #374151; }
.qb-il-compare-num {
  font-size: 0.8rem; font-weight: 800; font-variant-numeric: tabular-nums;
  color: #374151; text-align: right;
}
.qb-il-split-result { margin: 0; font-size: 0.8rem; font-weight: 800; color: #374151; }
.qb-il-split-result.is-lucky   { color: #166534; }
.qb-il-split-result.is-unlucky { color: #991B1B; }
/* Equation tiles */
.qb-il-equation {
  display: flex; align-items: center; justify-content: center;
  gap: 0; padding: 20px 24px 18px;
  border-bottom: 1px solid #EEF0F3;
}
.qb-il-eq-tile {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 14px 22px; border-radius: 14px;
  background: #F9FAFB; border: 1.5px solid #EEF0F3;
  min-width: 90px; text-align: center;
}
.qb-il-eq-tile--net { border-color: transparent; }
.qb-il-eq-tile--net.is-lucky   { background: #F0FDF4; border-color: #86EFAC; }
.qb-il-eq-tile--net.is-unlucky { background: #FEF2F2; border-color: #FECACA; }
.qb-il-eq-lbl {
  font-size: 0.59rem; font-weight: 700; letter-spacing: 0.07em;
  text-transform: uppercase; color: #9CA3AF;
}
.qb-il-eq-val {
  font-size: 1.65rem; font-weight: 900; line-height: 1;
  font-variant-numeric: tabular-nums; color: #111827;
}
.qb-il-eq-tile--net.is-lucky   .qb-il-eq-val { color: #166534; }
.qb-il-eq-tile--net.is-unlucky .qb-il-eq-val { color: #991B1B; }
.qb-il-eq-op {
  font-size: 1.1rem; font-weight: 700; color: #D1D5DB;
  padding: 0 12px; flex-shrink: 0;
}
/* Luck scale */
.qb-il-scale {
  padding: 18px 24px 20px;
  border-bottom: 1px solid #EEF0F3;
}
.qb-il-scale-title {
  margin: 0 0 14px; font-size: 0.62rem; font-weight: 700;
  letter-spacing: 0.07em; text-transform: uppercase; color: #9CA3AF;
}
.qb-il-scale-track {
  position: relative; height: 10px; border-radius: 99px;
  background: linear-gradient(90deg, #DC2626 0%, #F87171 22%, #D1D5DB 42%, #D1D5DB 58%, #4ADE80 78%, #16A34A 100%);
  margin-top: 32px; /* clearance for the floating label + dot above the track */
}
.qb-il-scale-marker {
  position: absolute;
  left: var(--scale-pct, 50%);
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  animation: il-marker-appear 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) 0.5s both;
}
@keyframes il-marker-appear {
  from { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.3); }
  to   { opacity: 1; transform: translateX(-50%) translateY(-50%) scale(1); }
}
.qb-il-scale-marker-dot {
  width: 22px; height: 22px; border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.qb-il-scale-marker-val {
  font-size: 0.72rem; font-weight: 800; color: #111827;
  background: #fff; border-radius: 6px; padding: 2px 6px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.13);
  white-space: nowrap;
}
.qb-il-scale-ends {
  display: flex; justify-content: space-between; margin-top: 8px;
}
.qb-il-scale-end {
  font-size: 0.6rem; font-weight: 600; color: #9CA3AF;
}
.qb-il-scale-rank {
  margin: 10px 0 0; font-size: 0.68rem; font-weight: 700;
  color: #6B7280; text-align: center;
}
.qb-il-drops {
  margin: 0; padding: 12px 24px 16px;
  font-size: 0.8rem; font-weight: 600; color: #6B7280; line-height: 1.55;
}
.qb-il-drops strong { color: #92400E; font-weight: 800; }
/* ---- end redesigned int luck ---- */
.qb-int-luck-baselines {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 0;
  background: #0a101a;
  border-top: 1px solid #1e2a3a;
  border-bottom: 1px solid #1e2a3a;
}
.qb-int-luck-baselines-eyebrow {
  grid-column: 1 / -1;
  margin: 0;
  padding: 13px 22px 0;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.28);
}
.qb-int-luck-baseline {
  padding: 14px 22px 16px;
  border-right: 1px solid rgba(255,255,255,0.06);
}
.qb-int-luck-baseline:last-of-type { border-right: none; }
.qb-int-luck-baseline-pct {
  display: block;
  font-size: 1.7rem;
  font-weight: 900;
  color: #f1f5f9;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  margin-bottom: 7px;
  letter-spacing: -0.02em;
}
.qb-int-luck-baseline-lbl {
  display: block;
  font-size: 0.71rem;
  font-weight: 600;
  color: rgba(255,255,255,0.42);
  line-height: 1.4;
}
.qb-int-luck-baselines-note {
  grid-column: 1 / -1;
  margin: 0;
  padding: 0 22px 12px;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.18);
}

.qb-depth {
  --qb-depth-qb-h: 0px;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  background: #FFF;
  padding: 22px 24px 20px;
  box-shadow: 0 8px 28px rgba(15, 15, 16, 0.04);
}
.qb-depth-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.qb-depth-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
}
.qb-depth-meta {
  margin: 6px 0 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6B7280;
}
/* ── TARGET DEPTH — REFERENCE-FAITHFUL PERSPECTIVE FIELD ────────── */
.qb-depth-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1500 / 860;
  min-height: 420px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(8,12,20,.99) 0%, rgba(4,8,14,.99) 100%);
  box-shadow: 0 24px 64px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.04);
  margin-bottom: 4px;
}
.qb-target-map-slide[data-map-slide="depth"] {
  padding: 10px 14px 12px;
  min-height: 580px;
  display: flex;
  flex-direction: column;
}
.qb-target-map-slide[data-map-slide="depth"] .qb-depth {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.qb-target-map-slide[data-map-slide="depth"] .qb-depth-stage {
  flex: 1 1 auto;
  aspect-ratio: unset;
  min-height: clamp(520px, 58vh, 760px);
  height: 100%;
}
.qb-target-map-slide[data-map-slide="accuracy"] {
  padding: 10px 14px 12px;
  min-height: 580px;
  display: flex;
  flex-direction: column;
}
.qb-target-map-slide[data-map-slide="accuracy"] .qb-accuracy-depth,
.qb-target-map-slide[data-map-slide="accuracy"] .qb-depth {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.qb-target-map-slide[data-map-slide="accuracy"] .qb-depth-stage {
  flex: 1 1 auto;
  aspect-ratio: unset;
  min-height: clamp(520px, 58vh, 760px);
  height: 100%;
}
.qb-target-map-slide[data-map-slide="routes"] {
  padding: 10px 14px 12px;
  min-height: 580px;
  display: flex;
  flex-direction: column;
}
.qb-target-map-slide[data-map-slide="routes"] .qb-route-tree {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.qb-target-map-slide[data-map-slide="routes"] .qb-route-tree-stage {
  flex: 1 1 auto;
  aspect-ratio: unset;
  min-height: clamp(520px, 58vh, 760px);
  height: 100%;
}
.qb-depth-noise {
  position: absolute; inset: 0; opacity: .06; pointer-events: none;
  mix-blend-mode: overlay; z-index: 40;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.4'/%3E%3C/svg%3E");
}
.qb-depth-scanline { display: none; }
/* 2-column layout: field | legend */
.qb-depth-chrome {
  position: absolute;
  inset: 0;
  display: block;
  padding: 8px 12px 6px;
  z-index: 10;
}
/* ── Left sidebar: info ── */
.qb-depth-info {
  grid-column: 1;
  align-self: start;
  padding-right: 4px;
}
.qb-depth-title {
  margin: 0;
  font-size: clamp(15px, 1.9vw, 30px);
  line-height: 1.1;
  letter-spacing: .14em;
  font-weight: 900;
  text-transform: uppercase;
  color: #f5f7fb;
  text-shadow: 0 0 28px rgba(255,255,255,.14);
}
.qb-depth-info-season {
  margin: .8em 0 0;
  color: #58b7ff;
  letter-spacing: .22em;
  font-size: clamp(8px, .8vw, 11px);
  font-weight: 800;
  text-transform: uppercase;
}
.qb-depth-player-block {
  margin-top: 1.4em;
  padding-top: 1em;
  border-top: 1px solid rgba(88,183,255,.32);
}
.qb-depth-player-name {
  font-size: clamp(9px, .95vw, 13px);
  font-weight: 900;
  letter-spacing: .14em;
  text-transform: uppercase;
  line-height: 1.35;
  color: #f5f7fb;
}
.qb-depth-player-sub {
  margin-top: .4em;
  color: #b4c0cf;
  letter-spacing: .12em;
  font-weight: 700;
  font-size: clamp(7px, .72vw, 10px);
}
.qb-depth-note {
  margin-top: 1.2em;
  padding-top: 1em;
  border-top: 1px solid rgba(88,183,255,.32);
  color: rgba(218,229,240,.58);
  font-size: clamp(7px, .7vw, 10px);
  line-height: 1.7;
  letter-spacing: .03em;
}
/* ── Center: field area ── */
.qb-depth-field-area {
  position: relative;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.qb-depth-field-body {
  flex: 1 1 auto;
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.qb-depth-field-main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.qb-depth-scene-row {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 0;
}
/* Depth rail — outside field frame, aligned to scene rows */
.qb-depth-depth-rail {
  flex: 0 0 44px;
  position: relative;
  align-self: stretch;
  border-right: 1px solid rgba(255,255,255,.05);
  background: transparent;
  box-sizing: border-box;
}
.qb-dc-col-hdrs {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 30% 30% 30%;
  gap: 0 3.8%;
  text-align: center;
  margin: 0 1.2% 0 calc(44px + 1.2%);
  padding: 2px 0 0;
  pointer-events: none;
}
.qb-dc-col-hdr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.qb-dc-col-hdr strong {
  font-size: clamp(10px, 1.05vw, 14px);
  letter-spacing: .16em;
  font-weight: 900;
  text-transform: uppercase;
  color: #f5f7fb;
  line-height: 1;
}
.qb-dc-col-hdr span {
  color: rgba(167,213,255,.72);
  font-size: clamp(7px, .7vw, 10px);
  letter-spacing: .18em;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1;
}
/* Depth labels in external rail */
.qb-dc-row-lbl {
  position: absolute;
  right: 7px;
  transform: translateY(-50%);
  text-align: right;
  white-space: nowrap;
  pointer-events: none;
}
.qb-dc-row-lbl span {
  display: inline-block;
  font-size: clamp(7px, .68vw, 9px);
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(148,163,184,.72);
  line-height: 1.2;
  padding: 3px 0;
  border-right: 2px solid rgba(148,163,184,.22);
  padding-right: 8px;
}
.qb-dc-row-lbl.is-los span {
  color: rgba(120,210,255,.95);
  border-right-color: rgba(92,190,255,.65);
  font-size: clamp(7px, .72vw, 9.5px);
  letter-spacing: .12em;
  text-shadow: 0 0 12px rgba(92,190,255,.35);
}
/* Perspective scene */
.qb-depth-scene {
  flex: 1 1 auto;
  position: relative;
  min-width: 0;
  min-height: 0;
  perspective: 2000px;
  z-index: 8;
}
.qb-depth-field-frame {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  box-shadow:
    inset 0 0 0 2px rgba(255,255,255,.88),
    0 8px 28px rgba(0,0,0,.35);
}
/* Field stack — dark surface, markings in SVG */
.qb-depth-stack {
  position: absolute;
  inset: 0;
  transform-origin: 50% 100%;
  transform: rotateX(16deg);
  transform-style: preserve-3d;
  background: rgba(6,10,16,.92);
}
.qb-depth-turf { display: none; }
/* SVG field markings */
.qb-depth-grid-svg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 3;
}
.qb-depth-grid-svg .qb-grid-field-bg { fill: rgba(8,12,18,.72); }
.qb-depth-grid-svg .qb-grid-endzone-bg { fill: rgba(6,10,16,.88); }
.qb-depth-grid-svg .qb-grid-ez-label {
  fill: rgba(255,255,255,.32);
  font-family: "Archivo", system-ui, sans-serif;
  font-size: 3.2px;
  font-weight: 900;
  letter-spacing: .28em;
}
.qb-depth-grid-svg .qb-grid-ynum {
  fill: rgba(255,255,255,.82);
  font-family: "Archivo", system-ui, sans-serif;
  font-size: 4.8px;
  font-weight: 900;
  letter-spacing: .02em;
}
.qb-depth-grid-svg .qb-grid-sideline {
  stroke: rgba(255,255,255,.96);
  stroke-width: 2.2;
  vector-effect: non-scaling-stroke;
}
.qb-depth-grid-svg .qb-grid-sideline-cap {
  stroke: rgba(255,255,255,.96);
  stroke-width: 2.2;
  vector-effect: non-scaling-stroke;
}
.qb-depth-grid-svg .qb-grid-goal {
  stroke: rgba(255,255,255,.9);
  stroke-width: 1.8;
  vector-effect: non-scaling-stroke;
}
.qb-depth-grid-svg .qb-grid-yl {
  stroke: rgba(255,255,255,.9);
  stroke-width: 1.6;
  vector-effect: non-scaling-stroke;
}
.qb-depth-grid-svg .qb-grid-yl-5 {
  stroke: rgba(255,255,255,.38);
  stroke-width: 0.9;
  vector-effect: non-scaling-stroke;
}
.qb-depth-grid-svg .qb-grid-div {
  stroke: rgba(255,255,255,.1);
  stroke-width: 0.35;
  stroke-dasharray: 2 5;
  vector-effect: non-scaling-stroke;
}
.qb-depth-grid-svg .qb-grid-hash {
  stroke: rgba(255,255,255,.78);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}
.qb-depth-grid-svg .qb-grid-hash-v {
  stroke: rgba(255,255,255,.42);
  stroke-width: 0.85;
  vector-effect: non-scaling-stroke;
}
.qb-depth-grid-svg .qb-grid-los {
  stroke: rgba(120,210,255,.98);
  stroke-width: 2.4;
  filter: drop-shadow(0 0 6px rgba(92,190,255,.75));
  vector-effect: non-scaling-stroke;
}
/* Zones container */
.qb-depth-zones {
  position: absolute; inset: 0;
  z-index: 5;
}
/* Zone cells — styled cards on dark field */
.qb-depth-cell {
  position: absolute;
  appearance: none;
  font: inherit;
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--grade) calc(38% + var(--vol) * 35%), rgba(255,255,255,.16));
  background:
    linear-gradient(165deg,
      color-mix(in srgb, var(--grade) calc(16% + var(--vol) * 24%), rgba(14,20,32,.82)) 0%,
      color-mix(in srgb, var(--grade) calc(8% + var(--vol) * 14%), rgba(8,12,20,.88)) 100%);
  box-shadow:
    0 4px 14px rgba(0,0,0,.28),
    0 0 calc(4px + var(--vol) * 14px) color-mix(in srgb, var(--grade) calc(18% + var(--vol) * 40%), transparent),
    inset 0 1px 0 rgba(255,255,255,.1),
    inset 0 -1px 0 rgba(0,0,0,.22);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
  color: #fff;
  padding: 6px 8px;
  overflow: hidden;
  isolation: isolate;
  transition: filter .22s ease, transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease, border-color .22s ease;
  animation: qb-zone-in .55s cubic-bezier(.22,1,.36,1) both;
  animation-delay: calc(var(--i,0) * 45ms);
}
@keyframes qb-zone-in {
  from { opacity: 0; transform: scale(.97); }
  to   { opacity: 1; transform: scale(1); }
}
/* Corner bracket accent */
.qb-depth-cell::before {
  content: "";
  position: absolute;
  inset: 5px;
  border-radius: 7px;
  border: 1px solid color-mix(in srgb, var(--grade) calc(22% + var(--vol) * 30%), rgba(255,255,255,.06));
  pointer-events: none;
  z-index: 0;
  opacity: .85;
}
/* Top grade accent bar */
.qb-depth-cell::after {
  content: "";
  position: absolute;
  top: 0;
  left: 14%;
  right: 14%;
  height: 3px;
  border-radius: 10px 10px 0 0;
  background: linear-gradient(90deg,
    transparent,
    color-mix(in srgb, var(--grade) 88%, #fff) 18%,
    color-mix(in srgb, var(--grade) 88%, #fff) 82%,
    transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--grade) 55%, transparent);
  pointer-events: none;
  z-index: 1;
  opacity: calc(0.55 + var(--vol) * 0.45);
}
.qb-depth-cell:hover,
.qb-depth-cell:focus-visible {
  filter: brightness(1.18);
  transform: translateY(-2px) scale(1.01);
  z-index: 20;
  outline: none;
  border-color: color-mix(in srgb, var(--grade) 65%, rgba(255,255,255,.35));
  box-shadow:
    0 8px 22px rgba(0,0,0,.35),
    0 0 calc(8px + var(--vol) * 20px) color-mix(in srgb, var(--grade) calc(28% + var(--vol) * 45%), transparent),
    inset 0 1px 0 rgba(255,255,255,.14);
}
.qb-depth-cell.is-active {
  filter: brightness(1.28);
  transform: translateY(-2px) scale(1.02);
  z-index: 21;
  border-color: color-mix(in srgb, var(--grade) 88%, #fff);
  box-shadow:
    0 10px 28px rgba(0,0,0,.4),
    0 0 22px color-mix(in srgb, var(--grade) 50%, transparent),
    inset 0 0 0 1px rgba(255,255,255,.12);
}
/* Grade number */
.qb-dc-grade {
  position: relative; z-index: 2;
  font-size: clamp(16px, 2.2vw, 34px);
  line-height: 1;
  font-weight: 900;
  letter-spacing: .01em;
  color: var(--grade);
  text-shadow:
    0 0 18px color-mix(in srgb, var(--grade) 70%, transparent),
    0 0 2px rgba(255,255,255,.35);
}
/* Attempt count */
.qb-dc-att {
  position: relative; z-index: 2;
  font-size: clamp(7px, .72vw, 10px);
  letter-spacing: .12em;
  font-weight: 900;
  color: rgba(255,255,255,.78);
}
/* Stats rows */
.qb-dc-stats {
  position: relative; z-index: 2;
  color: rgba(212,221,229,.62);
  font-size: clamp(5px, .56vw, 8px);
  letter-spacing: .03em;
  line-height: 1.35;
  white-space: nowrap;
}
.qb-dc-rtg {
  position: relative; z-index: 2;
  color: rgba(190,212,235,.52);
  font-size: clamp(5px, .54vw, 7.5px);
  font-weight: 600;
  letter-spacing: .06em;
  line-height: 1.2;
  white-space: nowrap;
  margin-top: 1px;
}
/* QB marker — sits on the LOS inside the field stack */
.qb-depth-qb-wrap {
  position: absolute;
  left: 50%;
  top: var(--fd-los, 72.5%);
  transform: translate(-50%, -50%);
  z-index: 30;
  pointer-events: none;
  width: 0;
  height: 0;
}
.qb-depth-qb-ring {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%,-50%);
  border-radius: 50%;
  border: 1px solid rgba(92,190,255,.28);
  animation: qb-pulse-ring 3s ease-in-out infinite;
}
.qb-depth-qb-ring:nth-child(1) { width: 34px;  height: 34px;  animation-delay: 0s; }
.qb-depth-qb-ring:nth-child(2) { width: 50px;  height: 50px;  animation-delay: .4s; opacity: .6; }
.qb-depth-qb-ring:nth-child(3) { width: 66px;  height: 66px;  animation-delay: .8s; opacity: .35; }
@keyframes qb-pulse-ring {
  0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .5; }
  50%     { transform: translate(-50%,-50%) scale(1.04); opacity: .85; }
}
.qb-depth-qb {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: clamp(28px, 3.2vw, 38px);
  height: clamp(28px, 3.2vw, 38px);
  border-radius: 50%;
  border: 1.5px solid rgba(140,220,255,.55);
  display: grid;
  place-items: center;
  background: radial-gradient(circle, rgba(92,190,255,.18), rgba(8,16,24,.85));
  box-shadow: 0 0 0 4px rgba(92,190,255,.08), 0 0 24px rgba(92,190,255,.35);
  font-weight: 900;
  letter-spacing: .1em;
  font-size: clamp(7px, .78vw, 10px);
  color: rgba(180,230,255,.92);
}
.qb-depth-los-lbl { display: none; }
/* ── Right sidebar: legend ── */
.qb-depth-legend-panel {
  grid-column: 2;
  align-self: end;
  padding: .9em 1em;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 10px;
  background: rgba(6,11,17,.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.qb-depth-legend-title {
  margin: 0 0 .8em;
  color: #c9d4df;
  font-size: clamp(8px, .72vw, 10px);
  letter-spacing: .22em;
  text-transform: uppercase;
  font-weight: 800;
}
.qb-depth-legend-key {
  display: grid;
  grid-template-columns: 12px 1fr;
  align-items: center;
  gap: 7px;
  margin: .35em 0;
  color: #d4dbe4;
  font-size: clamp(8px, .75vw, 11px);
  font-weight: 700;
}
.qb-depth-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 99px;
  background: currentColor;
  box-shadow: 0 0 10px currentColor;
}
/* Legacy selectors — keep hidden */
.qb-depth-cell-line { display: none; }
.qb-depth-grade { display: none; }
.qb-depth-grade-dot { display: none; }
.qb-depth-grade-val { display: none; }
.qb-depth-label { display: none; }
.qb-depth-legend { display: none; }
.qb-depth-head { display: none; }
.qb-accuracy-cell-val {
  position: relative;
  z-index: 2;
  font-size: clamp(14px, 1.9vw, 30px);
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--grade);
  text-shadow:
    0 0 18px color-mix(in srgb, var(--grade) 70%, transparent),
    0 0 2px rgba(255,255,255,.35);
}
.qb-accuracy-cell-val.is-empty {
  color: rgba(255, 255, 255, 0.55);
  font-size: clamp(12px, 1.4vw, 22px);
  text-shadow: none;
}
.qb-accuracy-cell-delta {
  position: relative;
  z-index: 2;
  font-size: clamp(6px, .62vw, 8.5px);
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
}
.qb-accuracy-cell-delta.is-above { color: #fecaca; }
.qb-accuracy-cell-delta.is-below { color: #bfdbfe; }
.qb-accuracy-cell-delta.is-neutral { color: rgba(255, 255, 255, 0.72); }
.qb-accuracy-depth-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  margin-top: 8px;
  padding: 8px 4px 2px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #6B7280;
}
.qb-target-map-slide[data-map-slide="accuracy"] .qb-accuracy-depth {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
  box-shadow: none;
}
.qb-accuracy-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.qb-accuracy-legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex: 0 0 12px;
}
.qb-accuracy-legend-swatch.is-below { background: rgba(37, 99, 235, 0.55); }
.qb-accuracy-legend-swatch.is-neutral { background: rgba(156, 163, 175, 0.45); }
.qb-accuracy-legend-swatch.is-above { background: rgba(220, 38, 38, 0.55); }
.qb-target-map-slide .qb-depth {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
  box-shadow: none;
}
.qb-target-map-slide .qb-depth-cell {
  min-height: 130px;
}
.qb-depth-detail {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding: 18px 18px 14px;
  background: rgba(3, 7, 16, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  border-radius: 0;
  overflow-y: auto;
  animation: qb-depth-detail-in 0.2s ease;
}
.qb-depth-detail[hidden] {
  display: none !important;
}
@keyframes qb-depth-detail-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.qb-depth-detail-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 50%;
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.65);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  transition: background .15s, color .15s;
  display: grid;
  place-items: center;
}
.qb-depth-detail-close:hover,
.qb-depth-detail-close:focus-visible {
  background: rgba(255,255,255,.18);
  color: #fff;
  outline: none;
}
.qb-depth-detail-body {
  flex: 1 1 auto;
  min-height: 0;
}
.qb-depth-detail-placeholder {
  font-size: 0.86rem;
  font-weight: 600;
  color: rgba(255,255,255,.38);
}
.qb-depth-detail-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
  padding-right: 32px;
}
.qb-depth-detail-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.14);
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255,255,255,.8);
}
.qb-depth-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}
.qb-depth-detail-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.09);
  font-size: 0.78rem;
}
.qb-depth-detail-row span:first-child {
  color: rgba(255,255,255,.48);
  font-weight: 700;
}
.qb-depth-detail-row .value {
  color: rgba(255,255,255,.9);
  font-weight: 800;
  text-align: right;
}

.qb-target-map {
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  background: #FFF;
  padding: 22px 24px 20px;
  box-shadow: 0 8px 28px rgba(15, 15, 16, 0.04);
}
.qb-target-map-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.qb-target-map-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.qb-target-map-tab {
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #D1D5DB;
  background: #FFF;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.qb-target-map-tab[aria-pressed="true"] {
  border-color: #006BFF;
  background: #EEF4FF;
  color: #006BFF;
}
.qb-target-map-tab:focus-visible {
  outline: 2px solid #006BFF;
  outline-offset: 2px;
}
.qb-target-map-map-tools.is-hidden {
  display: none;
}
.qb-target-map-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  background: #FFF;
}
.qb-target-map-track::-webkit-scrollbar {
  display: none;
}
.qb-target-map-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
  padding: 22px 24px 20px;
  box-sizing: border-box;
}
.qb-target-map-slide-kicker {
  margin: 0 0 16px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #9CA3AF;
}
.qb-target-map-slide .qb-depth {
  margin: 0;
}
.qb-target-map-slide .qb-route-tree {
  margin: 0;
}
.qb-target-map-filter-details {
  margin-bottom: 14px;
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  background: #FFF;
  overflow: hidden;
}
.qb-target-map-filter-details[open] .qb-target-map-filter-trigger {
  border-bottom: 1px solid #EEF0F3;
}
.qb-target-map-filter-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  list-style: none;
  font-size: 0.82rem;
  font-weight: 800;
  color: #111827;
}
.qb-target-map-filter-trigger::-webkit-details-marker {
  display: none;
}
.qb-target-map-filter-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.qb-target-map-filter-badge.is-active {
  color: var(--qb-map-accent, #2D6A4F);
}
.qb-target-map-filter-panel {
  padding: 16px;
  background: #F8F9FB;
}
.qb-target-map-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.qb-target-map-title {
  margin: 6px 0 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #111827;
}
.qb-target-map-meta {
  margin: 6px 0 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6B7280;
}
.qb-target-map-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.qb-target-map-stat {
  background: #F8F9FB;
  border: 1px solid #EEF0F3;
  border-radius: 12px;
  padding: 12px 10px;
  text-align: center;
}
.qb-target-map-stat-label {
  display: block;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.qb-target-map-stat strong {
  display: block;
  margin-top: 6px;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #111827;
}
.qb-target-map-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 0;
  align-items: center;
}
.qb-target-map-filter-panel {
  padding: 16px;
  background: #F8F9FB;
}
.qb-target-map-filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.qb-target-map-filter-count {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #374151;
}
.qb-target-map-filter-clear {
  appearance: none;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #D1D5DB;
  background: #FFF;
  color: #374151;
  cursor: pointer;
}
.qb-target-map-filter-clear:hover,
.qb-target-map-filter-clear:focus-visible {
  border-color: var(--qb-map-accent, #2D6A4F);
  color: var(--qb-map-accent, #2D6A4F);
  outline: none;
}
.qb-target-map-result-filters {
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #E5E7EB;
}
.qb-target-map-filter-group-label {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9CA3AF;
  margin-right: 4px;
}
.qb-target-map-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 12px;
}
.qb-target-map-filter-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.qb-target-map-filter-label {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.qb-target-map-filter-field select {
  width: 100%;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  color: #111827;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #D1D5DB;
  background: #FFF;
  cursor: pointer;
}
.qb-target-map-filter-field select:focus-visible {
  outline: 2px solid #006BFF;
  border-color: #006BFF;
}
@media (max-width: 900px) {
  .qb-target-map-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.qb-target-map-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
}
.qb-target-map-filter input {
  accent-color: var(--qb-map-accent, #2D6A4F);
}
.qb-target-map-slide[data-map-slide="scatter"] {
  padding: 8px 0 10px;
  min-height: 580px;
  display: flex;
  flex-direction: column;
}
.qb-target-map-scatter-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: clamp(540px, 62vh, 780px);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 16px;
  overflow: hidden;
  background:
    radial-gradient(ellipse 92% 68% at 50% 42%, rgba(120,180,255,.07), transparent 62%),
    linear-gradient(180deg, rgba(10,14,24,.99) 0%, rgba(4,8,14,.99) 100%);
  box-shadow:
    0 28px 72px rgba(0,0,0,.5),
    inset 0 1px 0 rgba(255,255,255,.08),
    inset 0 0 0 1px rgba(255,255,255,.04);
}
.qb-target-map-scatter-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: radial-gradient(ellipse 78% 58% at 50% 44%, rgba(120,190,255,.055), transparent 70%);
}
.qb-target-map-scatter-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  box-shadow: inset 0 0 100px rgba(0,0,0,.28);
}
.qb-target-map-scatter-stage .qb-depth-noise {
  z-index: 1;
  opacity: .08;
}
.qb-target-map-chart-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
  border: none;
  min-height: clamp(500px, 56vh, 700px);
  z-index: 3;
}
.qb-target-map-chart-wrap::before {
  content: "";
  position: absolute;
  inset: 6% 0 10%;
  pointer-events: none;
  z-index: 4;
  border-radius: 12px;
  box-shadow: inset 0 0 48px rgba(120,190,255,.04);
}
.qb-target-map-chart {
  width: 100%;
  height: 100%;
  min-height: clamp(500px, 56vh, 700px);
}
.qb-target-map-chart .scatterlayer .point {
  cursor: pointer;
}
.qb-target-map-hover {
  position: absolute;
  inset: 0;
  z-index: 20;
  padding: 18px 18px 14px;
  background: rgba(3, 7, 16, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  border-radius: 0;
  overflow-y: auto;
  box-shadow: none;
}
.qb-target-map-hover.is-opening {
  animation: qb-depth-detail-in 0.2s ease;
}
.qb-target-map-hover[hidden] {
  display: none !important;
}
.qb-target-map-hover-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 50%;
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.65);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background .15s, color .15s;
}
.qb-target-map-hover-close:hover,
.qb-target-map-hover-close:focus-visible {
  background: rgba(255,255,255,.18);
  color: #fff;
  outline: none;
}
.qb-target-map-hover-header {
  padding-right: 32px;
  margin-bottom: 14px;
  text-align: left;
}
.qb-target-map-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.qb-target-map-pill {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.14);
  text-align: left;
}
.qb-target-map-pill-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: rgba(255,255,255,.48);
}
.qb-target-map-pill-value {
  font-size: 0.82rem;
  font-weight: 800;
  color: rgba(255,255,255,.88);
  line-height: 1.2;
}
.qb-target-map-pill.is-flag {
  min-width: 0;
  padding: 5px 10px;
}
.qb-target-map-pill.is-flag .qb-target-map-pill-label {
  font-size: 0.72rem;
  font-weight: 800;
  color: rgba(255,255,255,.8);
}
.qb-target-map-hover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}
.qb-target-map-hover-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.09);
  font-size: 0.78rem;
}
.qb-target-map-hover-row span:first-child {
  color: rgba(255,255,255,.48);
  font-weight: 700;
}
.qb-target-map-hover-row .value {
  color: rgba(255,255,255,.9);
  font-weight: 800;
  text-align: right;
}
.qb-route-tree {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
}
.qb-route-tree-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1500 / 860;
  min-height: 420px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 16px;
  overflow: visible;
  background: linear-gradient(180deg, rgba(8,12,20,.99) 0%, rgba(4,8,14,.99) 100%);
  box-shadow: 0 24px 64px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.04);
}
.qb-route-tree-chrome {
  position: absolute;
  inset: 0;
  z-index: 10;
  padding: 8px 12px 6px;
}
.qb-route-tree-scene {
  position: absolute;
  inset: 8px 12px 6px;
  perspective: 1800px;
}
.qb-route-tree-stack {
  position: absolute;
  inset: 0;
  transform-origin: 50% 100%;
  transform: rotateX(12deg);
  transform-style: preserve-3d;
  background: rgba(6,10,16,.92);
  border-radius: 4px 4px 0 0;
  overflow: visible;
  box-shadow:
    inset 0 0 0 2px rgba(255,255,255,.88),
    0 8px 28px rgba(0,0,0,.35);
}
.qb-route-tree-stack .qb-depth-grid-svg {
  z-index: 1;
}
.qb-route-tree-field {
  position: absolute;
  inset: 0;
  z-index: 5;
  overflow: visible;
}
.qb-route-tree-svg {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.qb-route-tree-svg .qb-route-tree-labels {
  pointer-events: none;
}
.qb-route-tree-fo {
  overflow: visible;
  pointer-events: none;
}
.qb-route-tree-fo-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}
.qb-route-tree-label-pill {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  pointer-events: auto;
  appearance: none;
  font: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  padding: 3px 5px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--grade, #9CA3AF) calc(38% + var(--vol, .2) * 35%), rgba(255,255,255,.16));
  background:
    linear-gradient(165deg,
      color-mix(in srgb, var(--grade, #9CA3AF) calc(16% + var(--vol, .2) * 24%), rgba(14,20,32,.82)) 0%,
      color-mix(in srgb, var(--grade, #9CA3AF) calc(8% + var(--vol, .2) * 14%), rgba(8,12,20,.88)) 100%);
  box-shadow:
    0 4px 14px rgba(0,0,0,.28),
    0 0 calc(4px + var(--vol, .2) * 14px) color-mix(in srgb, var(--grade, #9CA3AF) calc(18% + var(--vol, .2) * 40%), transparent),
    inset 0 1px 0 rgba(255,255,255,.1),
    inset 0 -1px 0 rgba(0,0,0,.22);
  color: #fff;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  z-index: 9;
  isolation: isolate;
  overflow: hidden;
  transition: filter .22s ease, transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease, border-color .22s ease;
}
.qb-route-tree-label-pill::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: 7px;
  border: 1px solid color-mix(in srgb, var(--grade, #9CA3AF) calc(22% + var(--vol, .2) * 30%), rgba(255,255,255,.06));
  pointer-events: none;
  opacity: .85;
}
.qb-route-tree-label-pill::after {
  content: "";
  position: absolute;
  top: 0;
  left: 14%;
  right: 14%;
  height: 3px;
  border-radius: 10px 10px 0 0;
  background: linear-gradient(90deg,
    transparent,
    color-mix(in srgb, var(--grade, #9CA3AF) 88%, #fff) 18%,
    color-mix(in srgb, var(--grade, #9CA3AF) 88%, #fff) 82%,
    transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--grade, #9CA3AF) 55%, transparent);
  pointer-events: none;
  opacity: calc(0.55 + var(--vol, .2) * 0.45);
}
.qb-route-tree-label-pill:hover,
.qb-route-tree-label-pill:focus-visible {
  filter: brightness(1.18);
  outline: none;
  z-index: 20;
  transform: scale(1.03);
}
.qb-route-tree-label-pill.is-active {
  filter: brightness(1.28);
  z-index: 21;
  border-color: color-mix(in srgb, var(--grade, var(--qb-route-accent, #2D6A4F)) 88%, #fff);
  box-shadow:
    0 10px 28px rgba(0,0,0,.4),
    0 0 22px color-mix(in srgb, var(--grade, var(--qb-route-accent, #2D6A4F)) 50%, transparent),
    inset 0 0 0 1px rgba(255,255,255,.12);
  transform: scale(1.04);
}
.qb-route-tree-label-pill:not(.has-data) {
  opacity: 0.34;
  cursor: default;
}
.qb-route-tree-label-name {
  position: relative;
  z-index: 2;
  font-size: clamp(5px, .52vw, 7px);
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(255,255,255,.78);
}
.qb-route-tree-label-grade {
  position: relative;
  z-index: 2;
  display: block;
  font-size: clamp(11px, 1.2vw, 17px);
  font-weight: 900;
  letter-spacing: -.01em;
  line-height: 1;
  color: var(--grade, #9CA3AF);
  text-shadow:
    0 0 18px color-mix(in srgb, var(--grade, #9CA3AF) 70%, transparent),
    0 0 2px rgba(255,255,255,.35);
  font-variant-numeric: tabular-nums;
}
.qb-route-tree-label-grade.is-empty {
  color: rgba(255, 255, 255, 0.55);
  font-size: clamp(10px, 1.1vw, 16px);
  text-shadow: none;
}
.qb-route-tree-stem,
.qb-route-tree-line {
  stroke: rgba(200, 220, 240, 0.78);
  fill: none;
  filter: drop-shadow(0 0 4px rgba(92,190,255,.15));
}
.qb-route-tree-line {
  stroke-width: 2.8;
  pointer-events: none;
}
.qb-route-tree-group.has-data {
  cursor: pointer;
}
.qb-route-tree-hit {
  fill: rgba(0, 0, 0, 0.001);
  stroke: rgba(0, 0, 0, 0.001);
  pointer-events: stroke;
}
.qb-route-tree-hit-tip,
.qb-route-tree-hit-node {
  pointer-events: all;
}
.qb-route-tree-group.is-active .qb-route-tree-line,
.qb-route-tree-line.is-active {
  stroke: var(--qb-route-accent, #5cb4ff) !important;
  stroke-width: 3.2 !important;
  filter: drop-shadow(0 0 8px rgba(92,190,255,.55));
}
.qb-route-tree-arrow {
  fill: rgba(200, 220, 240, 0.82);
  pointer-events: none;
}
.qb-route-tree-group.is-active .qb-route-tree-arrow,
.qb-route-tree-arrow.is-active {
  fill: var(--qb-route-accent, #5cb4ff) !important;
  filter: drop-shadow(0 0 6px rgba(92,190,255,.45));
}
.qb-route-tree-node,
.qb-route-tree-group-node {
  fill: rgba(200, 220, 240, 0.88);
  stroke: rgba(255,255,255,.55);
  stroke-width: 1;
  pointer-events: none;
}
.qb-route-tree-group.is-active .qb-route-tree-group-node,
.qb-route-tree-group-node.is-active {
  fill: var(--qb-route-accent, #5cb4ff) !important;
  stroke: rgba(255,255,255,.85) !important;
  filter: drop-shadow(0 0 8px rgba(92,190,255,.55));
}
.qb-route-tree-group:not(.has-data) .qb-route-tree-line,
.qb-route-tree-group:not(.has-data) .qb-route-tree-arrow {
  opacity: 0.22;
}
.qb-route-tree-qb-dot {
  fill: rgba(8,16,24,.85);
  stroke: rgba(140,220,255,.55);
  stroke-width: 2;
  filter: drop-shadow(0 0 12px rgba(92,190,255,.35));
}
.qb-route-tree-qb-text {
  fill: rgba(180,230,255,.92);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
}
.qb-route-tree-ball {
  fill: rgba(139, 69, 19, 0.72);
  stroke: rgba(255,255,255,.72);
  stroke-width: 1.5;
}
.qb-route-tree-ball-text {
  fill: rgba(255, 255, 255, 0.72);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.qb-route-tree-mini-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 7, 16, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 20;
  border-radius: 4px;
}
.qb-route-tree-mini-wrap[hidden] {
  display: none !important;
}
.qb-route-tree-mini {
  position: relative;
  background: rgba(8, 12, 20, 0.96);
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 14px;
  width: 260px;
  max-width: 90%;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
}
.qb-route-tree-mini-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  padding: 0;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 50%;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  color: rgba(255,255,255,.65);
}
.qb-route-tree-mini-close:hover,
.qb-route-tree-mini-close:focus-visible {
  background: rgba(255,255,255,.18);
  color: #fff;
  outline: none;
}
.qb-route-tree-mini-body {
  padding: 18px 16px 16px;
}
.qb-route-tree-mini-pill {
  display: inline-block;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.14);
  color: rgba(255,255,255,.88);
  font-weight: 800;
  font-size: 11px;
  letter-spacing: .04em;
  padding: 5px 10px;
  border-radius: 999px;
  margin-bottom: 10px;
}
.qb-route-tree-mini-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.09);
  font-size: 12px;
  color: rgba(255,255,255,.48);
  font-weight: 700;
}
.qb-route-tree-mini-row + .qb-route-tree-mini-row {
  margin-top: 6px;
}
.qb-route-tree-mini-row .value {
  color: rgba(255,255,255,.9);
  font-weight: 800;
}
.qb-route-tree-panel-wrap {
  padding: 18px 18px 14px;
}
.qb-route-tree-panel-wrap[hidden] {
  display: none !important;
}
.qb-route-tree-panel-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.qb-route-tree-detail-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.14);
  color: rgba(255,255,255,.8);
  font-weight: 700;
  font-size: 11px;
}
.qb-route-tree-detail-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
  padding-right: 32px;
}
.qb-route-tree-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}
.qb-route-tree-detail-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.09);
  font-size: 12px;
  color: rgba(255,255,255,.48);
  font-weight: 700;
}
.qb-route-tree-detail-row .value {
  color: rgba(255,255,255,.9);
  font-weight: 800;
  text-align: right;
}
.qb-route-tree-select-wrap {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  margin: 0 0 12px;
  z-index: 20;
}
.qb-route-tree-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 11px 16px;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  background: #FFF;
  color: #111827;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 1px 3px rgba(15, 15, 16, 0.04);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.qb-route-tree-select-trigger:hover,
.qb-route-tree-select-trigger:focus-visible {
  border-color: #D1D5DB;
  outline: none;
}
.qb-route-tree-select-wrap.is-open .qb-route-tree-select-trigger {
  border-color: var(--qb-route-accent, #2D6A4F);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--qb-route-accent, #2D6A4F) 12%, transparent);
}
.qb-route-tree-select-label {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qb-route-tree-select-chevron {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-right: 2px solid #9CA3AF;
  border-bottom: 2px solid #9CA3AF;
  transform: rotate(45deg) translateY(-2px);
  transition: transform .18s ease, border-color .15s ease;
}
.qb-route-tree-select-wrap.is-open .qb-route-tree-select-chevron {
  transform: rotate(225deg) translateY(2px);
  border-color: var(--qb-route-accent, #2D6A4F);
}
.qb-route-tree-select-wrap.is-open .qb-route-tree-options {
  display: block;
}
.qb-route-tree-options {
  display: none;
  margin-top: 8px;
  padding: 6px;
  background: #FFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  max-height: min(320px, 42vh);
  overflow-y: auto;
  position: absolute;
  left: 0;
  right: 0;
  z-index: 40;
  box-shadow: 0 16px 40px rgba(15, 15, 16, 0.12);
}
.qb-route-tree-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  text-align: left;
  transition: background .12s ease, color .12s ease;
}
.qb-route-tree-option:hover,
.qb-route-tree-option:focus-visible {
  background: #F8F9FB;
  color: #111827;
  outline: none;
}
.qb-route-tree-option.is-active {
  background: color-mix(in srgb, var(--qb-route-accent, #2D6A4F) 10%, #FFF);
  color: var(--qb-route-accent, #2D6A4F);
}
.qb-hero { padding: 8px 0 28px; }
.qb-hero-main { display: flex; gap: 28px; align-items: center; }
.qb-hero-photo-wrap {
  width: 220px; height: 220px; border-radius: 12px; overflow: hidden;
  background: #F3F4F6; box-shadow: inset 0 0 0 1px rgba(15,15,16,0.08);
}
.qb-hero-photo { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top center; }
.qb-hero-kicker {
  margin: 0 0 6px; font-size: 0.85rem; font-weight: 600; color: #6B7280;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.qb-hero-name {
  margin: 0; font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 800;
  letter-spacing: -0.03em; line-height: 1.05;
}
.qb-hero-position { margin: 8px 0 0; font-size: 1rem; font-weight: 600; color: var(--qb-team, #00338D); }
.qb-hero-stats {
  display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-top: 28px;
}
.qb-gen-acc {
  margin-top: 22px;
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  background: #FFFFFF;
  padding: 18px 20px 16px;
  box-shadow: 0 8px 28px rgba(15, 15, 16, 0.04);
}
.qb-gen-acc-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EEF0F3;
}
.qb-gen-acc-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.qb-gen-acc-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #F8F9FB;
  color: var(--qb-gen-acc-accent, #2D6A4F);
  flex-shrink: 0;
}
.qb-gen-acc-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.15;
  color: #111827;
}
.qb-gen-acc-sub {
  margin: 4px 0 0;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  color: #6B7280;
}
.qb-gen-acc-cols {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.qb-gen-acc-col {
  background: #F8F9FB;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 12px 10px 10px;
  text-align: center;
}
.qb-gen-acc-col-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--qb-gen-acc-accent, #2D6A4F);
  margin-bottom: 8px;
}
.qb-gen-acc-rate {
  display: block;
  font-size: clamp(1.1rem, 2vw, 1.25rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: #0B1533;
}
.qb-gen-acc-delta {
  display: block;
  margin-top: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #6B7280;
}
.qb-gen-acc-delta.is-above { color: #991B1B; }
.qb-gen-acc-delta.is-below { color: #1D4ED8; }
.qb-gen-acc-delta.is-neutral { color: #6B7280; }
.qb-gen-acc-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  justify-content: flex-end;
  flex-shrink: 0;
}
.qb-gen-acc-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #9CA3AF;
}
.qb-gen-acc-legend-swatch {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: 0 0 8px;
}
.qb-gen-acc-legend-swatch.is-rate { background: #0B1533; }
.qb-gen-acc-legend-swatch.is-delta { background: #9CA3AF; }
.qb-stat {
  background: #F8F9FB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px 12px; text-align: center;
}
.qb-stat-value {
  display: block; font-size: clamp(1.35rem, 2.5vw, 1.85rem); font-weight: 800; letter-spacing: -0.02em;
}
.qb-stat-label {
  display: block; margin-top: 6px; font-size: 0.72rem; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase; color: #6B7280;
}
.qb-donut-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 32px 48px;
  max-width: ${PROFILE_MAX}px;
  margin: 0 auto;
}
.qb-donut-row--scroll {
  flex-wrap: nowrap;
  justify-content: flex-start;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  padding: 4px 2px 12px;
  max-width: none;
}
.qb-donut-row--scroll .qb-donut {
  flex: 0 0 auto;
  scroll-snap-align: start;
}
.qb-donut { margin: 0; text-align: center; flex: 0 1 240px; }
.qb-donut--war,
.qb-donut--metric { flex: 0 1 240px; }
.qb-donut-war,
.qb-donut-metric { font-size: 22px; }
.qb-donut-metric--ttt { font-size: 20px; }
.qb-donut-metric--adot { font-size: 24px; }
.qb-donut-metric--pts { font-size: 22px; }
.qb-donut-interactive { cursor: pointer; }
.qb-donut-hit { cursor: pointer; outline: none; }
.qb-donut-center {
  transition: fill 0.18s ease, stroke 0.18s ease, stroke-width 0.18s ease;
}
.qb-donut-interactive:hover .qb-donut-center,
.qb-donut-interactive:focus-visible .qb-donut-center {
  fill: #17171A;
  stroke: #006BFF;
  stroke-width: 3;
}
.qb-donut-inner {
  transition: transform 0.18s ease;
  transform-origin: center;
  transform-box: fill-box;
}
.qb-donut-interactive:hover .qb-donut-inner,
.qb-donut-interactive:focus-visible .qb-donut-inner {
  transform: scale(1.06);
}
.qb-donut-interactive:hover .qb-donut-progress,
.qb-donut-interactive:focus-visible .qb-donut-progress {
  filter: brightness(1.08);
}
.qb-donut-cta {
  margin: 8px 0 0;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #9CA3AF;
  transition: color 0.18s ease;
}
.qb-donut-interactive:hover .qb-donut-cta,
.qb-donut-interactive:focus-visible .qb-donut-cta {
  color: #006BFF;
}
.qb-donut-interactive:focus-visible {
  outline: 2px solid #006BFF;
  outline-offset: 6px;
  border-radius: 12px;
}
.qb-donut-grade { fill: #FFF; font-family: "Archivo", sans-serif; font-size: 28px; font-weight: 800; }
.qb-donut-war { font-size: 22px; }
.qb-donut-rank { fill: #F5C518; font-family: "Archivo", sans-serif; font-size: 16px; font-weight: 700; }
.qb-donut-year { margin: 12px 0 0; font-size: 1.05rem; font-weight: 700; }
.qb-chart-wrap--interactive .qb-game-bar-fill {
  transition: filter 0.18s ease, opacity 0.18s ease;
}
.qb-chart-bar--game:hover .qb-game-bar-fill,
.qb-chart-bar--game:focus-within .qb-game-bar-fill {
  filter: brightness(1.18);
}
.qb-chart-bar--game .qb-bar-value,
.qb-chart-bar--game .qb-game-week-label {
  transition: opacity 0.18s ease, fill 0.18s ease;
}
.qb-chart-bar--game:hover .qb-bar-value,
.qb-chart-bar--game:focus-within .qb-bar-value {
  opacity: 1 !important;
  fill: #006BFF;
}
.qb-chart-bar--game:hover .qb-game-week-label,
.qb-chart-bar--game:focus-within .qb-game-week-label {
  fill: #006BFF;
  font-weight: 800;
}
.qb-game-bar-hit { cursor: pointer; }
.qb-game-bar-hit:hover,
.qb-game-bar-hit:focus-visible {
  fill: rgba(0, 107, 255, 0.06);
}
.qb-game-bar-hit:focus-visible { outline: 2px solid #006BFF; outline-offset: 1px; }
.qb-grid-line { stroke: #E5E7EB; stroke-width: 1; }
.qb-axis-label { fill: #6B7280; font-family: "Archivo", sans-serif; font-size: 12px; font-weight: 600; }
.qb-bar-value { fill: #374151; font-family: "Archivo", sans-serif; font-size: 11px; font-weight: 700; }
.qb-empty {
  margin: 0; padding: 24px 16px; font-size: 0.95rem; color: #64748B;
  background: #F8F9FB; border: 1px dashed #D1D5DB; border-radius: 8px;
}

/* Scroll-triggered animations (live preview) */
.qb-profile.is-animating .qb-animate-item {
  opacity: 0;
  transform: translateY(22px);
  transition:
    opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--delay, 0ms);
}
.qb-profile.is-animating .qb-animate-item.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.qb-profile.is-animating .qb-donut-inner {
  opacity: 0;
  transform: scale(0.88);
  transform-origin: center;
  transition:
    opacity 0.45s ease 0.15s,
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.15s;
  transition-delay: var(--delay, 150ms);
}
.qb-profile.is-animating .qb-donut-inner.is-visible {
  opacity: 1;
  transform: scale(1);
}
.qb-profile.is-animating .qb-chart-wrap .qb-grid-line {
  opacity: 0.15;
  transition: opacity 0.5s ease 0.1s;
}
.qb-profile.is-animating .qb-chart-wrap.is-visible .qb-grid-line {
  opacity: 1;
}
.qb-profile.is-animating .qb-chart-wrap.is-visible .qb-axis-label {
  opacity: 1;
}
.qb-profile.is-animating .qb-chart-wrap .qb-axis-label {
  opacity: 0.4;
  transition: opacity 0.4s ease;
}

@media (prefers-reduced-motion: reduce) {
  .qb-profile.is-animating .qb-animate-item,
  .qb-profile.is-animating .qb-donut-inner {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .qb-collapsible-details[open] .qb-collapsible-panel-inner {
    animation: none;
  }
  .qb-collapsible-chevron,
  .qb-collapsible-details {
    transition: none;
  }
  .qb-int-luck-waterfall-seg,
  .qb-int-luck-card {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .qb-donut-interactive:hover .qb-donut-inner,
  .qb-donut-interactive:focus-visible .qb-donut-inner {
    transform: none;
  }
}

@media (max-width: 900px) {
  .qb-hero-main { flex-direction: column; align-items: flex-start; }
  .qb-hero-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .qb-gen-acc-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .qb-gen-acc-legend {
    justify-content: flex-start;
  }
  .qb-gen-acc-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .qb-donut-row { justify-content: center; }
}
@media (max-width: 900px) {
  .qb-target-map-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .qb-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .qb-metric-row {
    grid-template-columns: minmax(0, 1fr) 40px;
    grid-template-areas:
      "label value"
      "track track";
    gap: 6px 10px;
  }
  .qb-metric-label { grid-area: label; }
  .qb-metric-value { grid-area: value; }
  .qb-metric-track { grid-area: track; }
  .qb-compare-slide {
    padding: 18px 16px 16px;
  }
  .qb-compare-hero {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "left right"
      "mid mid";
    gap: 10px;
  }
  .qb-compare-pane-left { grid-area: left; }
  .qb-compare-pane-right { grid-area: right; }
  .qb-compare-hero-divider {
    grid-area: mid;
    flex-direction: row;
    gap: 10px;
  }
  .qb-compare-table th,
  .qb-compare-table td {
    padding: 9px 10px;
  }
  .qb-compare-table-val {
    font-size: 0.82rem;
  }
  .qb-rush-hero-layout {
    flex-direction: column;
    align-items: stretch;
  }
  .qb-int-luck-hero {
    grid-template-columns: 1fr;
  }
  .qb-int-luck-hero-stat {
    text-align: left;
  }
  .qb-int-luck-hero-caption {
    margin-left: 0;
  }
  .qb-int-luck-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  .qb-int-luck-waterfall,
  .qb-int-luck-callout {
    margin-left: 0;
    margin-right: 0;
  }
  .qb-int-luck-callout {
    margin: 0 16px 16px;
  }
  .qb-int-luck-waterfall {
    padding-left: 16px;
    padding-right: 16px;
  }
  .qb-int-luck-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  .qb-depth {
    padding: 18px 14px 16px;
  }
  .qb-target-map-slide[data-map-slide="depth"] {
    min-height: 480px;
  }
  .qb-target-map-slide[data-map-slide="depth"] .qb-depth-stage,
  .qb-target-map-slide[data-map-slide="accuracy"] .qb-depth-stage,
  .qb-target-map-slide[data-map-slide="routes"] .qb-route-tree-stage,
  .qb-target-map-slide[data-map-slide="scatter"] .qb-target-map-scatter-stage {
    min-height: clamp(460px, 54vh, 640px);
  }
  .qb-target-map-slide[data-map-slide="accuracy"],
  .qb-target-map-slide[data-map-slide="routes"],
  .qb-target-map-slide[data-map-slide="scatter"] {
    min-height: 480px;
  }
  .qb-route-tree-detail-grid {
    grid-template-columns: 1fr;
  }
  .qb-depth-scene-row {
    flex-direction: row;
  }
  .qb-depth-depth-rail {
    flex-basis: 36px;
  }
  .qb-dc-col-hdrs {
    margin-left: calc(36px + 1.2%);
  }
  .qb-dc-row-lbl span {
    font-size: clamp(6px, 2.4vw, 8px);
    padding-right: 6px;
  }
  .qb-depth-field {
    grid-template-columns: repeat(3, minmax(0, 1fr)) 40px;
  }
  .qb-depth-cell {
    min-height: 100px;
    padding: 8px 8px;
  }
  .qb-target-map-slide .qb-depth-cell,
  .qb-accuracy-depth .qb-depth-cell {
    min-height: 100px;
  }
  .qb-depth-cell-line {
    font-size: 0.64rem;
  }
  .qb-depth-detail-grid {
    grid-template-columns: 1fr;
  }
  .qb-target-map-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .qb-target-map-filter-grid {
    grid-template-columns: 1fr;
  }
  .qb-target-map-filter-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .qb-target-map-head {
    flex-direction: column;
    align-items: stretch;
  }
  .qb-target-map-hover-grid {
    grid-template-columns: 1fr;
  }
}`;
    },

    buildExportProfile(profile) {
      return {
        playerId: profile.playerId,
        playerName: profile.playerName,
        seasonRankings: profile.seasonRankings || {},
        warSeasonRankings: profile.warSeasonRankings || {},
        timeToThrowRankings: profile.timeToThrowRankings || {},
        targetDepthRankings: profile.targetDepthRankings || {},
        pressureToSackRateRankings: profile.pressureToSackRateRankings || {},
        rushingRankings: profile.rushing?.rankings || {},
        rushingMetricLabels: profile.rushing?.metricLabels || {},
        gameGrades: profile.gameGrades || [],
      };
    },

    buildExportModalCss() {
      return `
.qb-modal-backdrop[hidden] {
  display: none !important;
  pointer-events: none;
}
.qb-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 15, 16, 0.45);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: auto;
}
.qb-modal-backdrop.is-open { opacity: 1; }
.qb-modal {
  position: relative;
  width: min(640px, 100%);
  max-height: min(82vh, 760px);
  overflow: auto;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  padding: 22px 22px 18px;
}
.qb-modal-close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: #f3f4f6;
  color: #111827;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}
.qb-modal-close:hover { background: #e5e7eb; }
.qb-modal-title {
  margin: 0 36px 14px 0;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
}
.qb-modal-sub {
  margin: 0 0 14px;
  font-size: 0.82rem;
  color: #6b7280;
}
.qb-modal-scroll {
  max-height: min(58vh, 560px);
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.qb-rank-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.qb-rank-table th,
.qb-rank-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eef0f3;
}
.qb-rank-table th {
  position: sticky;
  top: 0;
  background: #f8f9fb;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6b7280;
}
.qb-rank-table tr.is-current { background: #eef4ff; }
.qb-rank-table tr.is-current .qb-rank-player { font-weight: 800; }
.qb-rank-num {
  width: 52px;
  font-weight: 700;
  color: #6b7280;
}
.qb-rank-grade {
  width: 72px;
  font-weight: 800;
  text-align: right;
}
/* ===== game modal — full team-color redesign ===== */

/* Modal shell: strip padding, allow internal scroll, rounded clip */
.qb-modal:has(.qb-gm-wrap) {
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.qb-modal-body:has(.qb-gm-wrap) .qb-modal-title {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;
}
.qb-modal:has(.qb-gm-wrap) .qb-modal-close {
  z-index: 20;
  background: rgba(0,0,0,0.25);
  color: var(--sec, #fff);
  mix-blend-mode: normal;
}
.qb-modal:has(.qb-gm-wrap) .qb-modal-close:hover { background: rgba(0,0,0,0.4); }

/* Wrapper: entire modal background = team primary */
.qb-gm-wrap {
  background: var(--pri, #002244);
  border-radius: 14px;
  min-height: 100%;
}

/* Hero section */
.qb-gm-hero {
  position: relative;
  overflow: hidden;
  padding: 44px 28px 28px;
  text-align: center;
}
/* Subtle opponent color bloom on the right */
.qb-gm-hero::before {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 55% 100% at 88% 50%,
    color-mix(in srgb, var(--opp, #e31837) 22%, transparent) 0%, transparent 65%);
}

/* Week + pill row */
.qb-gm-meta {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  margin-bottom: 28px;
}
.qb-gm-week-lbl {
  font-size: 0.68rem; font-weight: 900; letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--sec, #fff) 55%, transparent);
  font-family: "Archivo", sans-serif;
}
.qb-gm-pill {
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; padding: 3px 10px; border-radius: 99px;
  font-family: "Archivo", sans-serif;
  background: color-mix(in srgb, var(--sec, #fff) 14%, transparent);
  color: var(--sec, #fff);
  border: 1px solid color-mix(in srgb, var(--sec, #fff) 28%, transparent);
}

/* Matchup row */
.qb-gm-matchup-row {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 28px;
}
.qb-gm-team-col {
  display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1;
}
.qb-gm-logo-ring {
  width: 88px; height: 88px; border-radius: 50%;
  background: color-mix(in srgb, var(--sec, #fff) 10%, transparent);
  border: 2px solid color-mix(in srgb, var(--sec, #fff) 30%, transparent);
  box-shadow: 0 0 24px color-mix(in srgb, var(--sec, #fff) 14%, transparent);
  display: flex; align-items: center; justify-content: center;
}
.qb-gm-logo-ring--opp {
  background: color-mix(in srgb, var(--opp, #e31837) 15%, transparent);
  border-color: color-mix(in srgb, var(--opp, #e31837) 40%, transparent);
  box-shadow: 0 0 24px color-mix(in srgb, var(--opp, #e31837) 20%, transparent);
}
.qb-gm-logo-img {
  width: 62px; height: 62px; object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.45));
}
.qb-gm-logo-fb {
  width: 54px; height: 54px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 900;
  color: var(--pri, #002244);
  background: var(--sec, #fff);
  font-family: "Archivo", sans-serif;
}
.qb-gm-team-lbl {
  font-size: 0.78rem; font-weight: 800; letter-spacing: 0.04em;
  color: var(--sec, #fff); font-family: "Archivo", sans-serif; text-align: center;
}
.qb-gm-vs-col {
  font-size: 0.62rem; font-weight: 900; letter-spacing: 0.18em;
  text-transform: uppercase; flex: 0 0 auto;
  color: color-mix(in srgb, var(--sec, #fff) 28%, transparent);
  font-family: "Archivo", sans-serif;
}

/* Grade card */
.qb-gm-grade-card {
  position: relative; z-index: 2;
  display: inline-flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 16px 52px 14px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--sec, #fff) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--sec, #fff) 25%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--sec, #fff) 18%, transparent);
}
.qb-gm-grade-eyebrow {
  font-size: 0.58rem; font-weight: 800; letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--sec, #fff) 50%, transparent);
  font-family: "Archivo", sans-serif;
}
.qb-gm-grade-num {
  font-size: 4rem; font-weight: 900; letter-spacing: -0.04em; line-height: 1.05;
  color: var(--sec, #fff); font-family: "Archivo", sans-serif;
}

/* Stats body — stays in the same team-color world */
.qb-gm-stats-body {
  padding: 20px 22px 22px;
  background: color-mix(in srgb, var(--pri, #002244) 100%, #000);
  border-top: 1px solid color-mix(in srgb, var(--sec, #fff) 12%, transparent);
  overflow-x: auto;
}
.qb-gm-stats-body .qb-game-stat-group-title {
  color: color-mix(in srgb, var(--sec, #fff) 55%, transparent);
}
.qb-gm-stats-body .qb-game-stat {
  background: color-mix(in srgb, var(--sec, #fff) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--sec, #fff) 18%, transparent);
}
.qb-gm-stats-body .qb-game-stat-abbr { color: color-mix(in srgb, var(--sec, #fff) 60%, transparent); }
.qb-gm-stats-body .qb-game-stat-value { color: var(--sec, #fff); }
.qb-gm-empty {
  color: color-mix(in srgb, var(--sec, #fff) 55%, transparent);
  font-size: 0.84rem; margin: 0; font-family: "Archivo", sans-serif;
}
.qb-game-stat-group + .qb-game-stat-group { margin-top: 16px; }
.qb-game-stat-group-title {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #374151;
}
.qb-game-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}
.qb-game-stat {
  padding: 9px 11px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.qb-game-stat-abbr {
  display: block;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
}
.qb-game-stat-value {
  display: block;
  margin-top: 4px;
  font-size: 1rem;
  font-weight: 800;
}
@media (max-width: 520px) {
  .qb-game-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}`;
    },

    buildHtmlBlock(profile, options = {}) {
      const bundle = global.QbAnnualExportBundleSource || "";
      const profileJson = JSON.stringify(this.buildExportProfile(profile)).replace(/</g, "\\u003c");

      return `<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${this.buildCss()}${this.buildExportModalCss()}</style>
<div class="qb-export-wrap">
${this.buildMarkup(profile, options)}
</div>
<script type="application/json" id="qb-export-profile">${profileJson}</script>
<script>${bundle}</script>
<script>
(function(){try{
  var profile=JSON.parse(document.getElementById("qb-export-profile").textContent);
  var root=document.querySelector(".qb-export-wrap");
  if(window.QbAnnualExport&&root){window.QbAnnualExport.init(root,profile);}
  else if(!window.QbAnnualExport){console.error("QB Annual export runtime missing. Run: python3 scripts/build-export-bundle.py");}
}catch(e){console.error("QB Annual export init failed",e);}})();
</script>`;
    },

    buildStandaloneDocument(profile, options = {}) {
      const block = this.buildHtmlBlock(profile, options);
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(profile.playerName || "QB")} · 2026 NFL QB Annual</title>
</head>
<body style="margin:0;padding:24px 16px 48px;background:#fff;">
${block}
</body>
</html>`;
    },
  };

  global.QbAnnualProfile = Profile;
})(window);
