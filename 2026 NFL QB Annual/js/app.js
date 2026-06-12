(function () {
  const STORAGE_KEY = "qb-annual-calculator:v1";
  const { loadJson, saveJson, copyText } = window.QbAnnualUtils;

  const DEFAULTS = {
    playerId: "46601",
    playerName: "Josh Allen",
    franchiseId: "4",
    team: "Bills",
    displaySeason: "2025",
    gameGradeSeason: "2025",
    barColor: "#2D6A4F",
    passingSummaryText: "",
    gameGradeFeedText: "",
    gradeDistributionFeedText: "",
    opponentsFeedText: "",
    gameGrades: [],
    gradeDistribution: null,
  };

  const els = {
    form: document.getElementById("settingsForm"),
    loadStatus: document.getElementById("loadStatus"),
    playerSearch: document.getElementById("playerSearch"),
    playerResults: document.getElementById("playerResults"),
    playerId: document.getElementById("playerId"),
    playerName: document.getElementById("playerName"),
    franchiseId: document.getElementById("franchiseId"),
    team: document.getElementById("team"),
    displaySeason: document.getElementById("displaySeason"),
    barColor: document.getElementById("barColor"),
    passingFile: document.getElementById("passingFile"),
    gameGradesFile: document.getElementById("gameGradesFile"),
    gradeDistFile: document.getElementById("gradeDistFile"),
    opponentsFile: document.getElementById("opponentsFile"),
    gradingProfileFile: document.getElementById("gradingProfileFile"),
    stableUnstableFile: document.getElementById("stableUnstableFile"),
    passingPressureFile: document.getElementById("passingPressureFile"),
    passingConceptFile: document.getElementById("passingConceptFile"),
    timeInPocketFile: document.getElementById("timeInPocketFile"),
    intLuckFile: document.getElementById("intLuckFile"),
    passingDepthFile: document.getElementById("passingDepthFile"),
    accuracyByDepthFile: document.getElementById("accuracyByDepthFile"),
    generalAccuracyFile: document.getElementById("generalAccuracyFile"),
    qbAccuracyFile: document.getElementById("qbAccuracyFile"),
    incompletionRatesFile: document.getElementById("incompletionRatesFile"),
    qbAlignmentFile: document.getElementById("qbAlignmentFile"),
    allowedPressureFile: document.getElementById("allowedPressureFile"),
    clutchFile: document.getElementById("clutchFile"),
    routeDataFile: document.getElementById("routeDataFile"),
    targetMapFile: document.getElementById("targetMapFile"),
    epaSeasonFile: document.getElementById("epaSeasonFile"),
    epaCareerFile: document.getElementById("epaCareerFile"),
    warSeasonFile: document.getElementById("warSeasonFile"),
    rushingSummaryFile: document.getElementById("rushingSummaryFile"),
    passingGradesSituationFile: document.getElementById("passingGradesSituationFile"),
    passingGradesReadsFile: document.getElementById("passingGradesReadsFile"),
    passingGradesCoverageFile: document.getElementById("passingGradesCoverageFile"),
    targetAlignmentFile: document.getElementById("targetAlignmentFile"),
    throwTypeFile: document.getElementById("throwTypeFile"),
    previewCanvas: document.getElementById("previewCanvas"),
    previewWrap: document.getElementById("previewWrap"),
    htmlOutput: document.getElementById("htmlOutput"),
    statusList: document.getElementById("statusList"),
    copyHtml: document.getElementById("copyHtml"),
    downloadHtml: document.getElementById("downloadHtml"),
    previewDesktop: document.getElementById("previewDesktop"),
    previewMobile: document.getElementById("previewMobile"),
  };

  let state = { ...DEFAULTS, ...loadJson(STORAGE_KEY, {}) };
  let qbList = [];
  let uploadOverrides = {
    passingSummaryText: "",
    gameGradeFeedText: "",
    gradeDistributionFeedText: "",
    opponentsFeedText: "",
    gradingProfileFeedText: "",
    stableUnstableFeedText: "",
    passingPressureFeedText: "",
    passingConceptFeedText: "",
    timeInPocketFeedText: "",
    intLuckFeedText: "",
    passingDepthFeedText: "",
    accuracyByDepthFeedText: "",
    generalAccuracyFeedText: "",
    qbAccuracyFeedText: "",
    incompletionRatesFeedText: "",
    qbAlignmentFeedText: "",
    allowedPressureFeedText: "",
    clutchFeedText: "",
    routeDataFeedText: "",
    targetMapFeedText: "",
    epaSeasonFeedText: "",
    epaCareerFeedText: "",
    warSeasonFeedText: "",
    rushingSummaryFeedText: "",
    passingGradesSituationFeedText: "",
    passingGradesReadsFeedText: "",
    passingGradesCoverageFeedText: "",
    targetAlignmentFeedText: "",
    throwTypeFeedText: "",
  };
  let dataReady = false;
  let renderTimer = null;
  let renderInFlight = false;
  let renderQueued = false;
  let lastExportProfile = null;

  const PERSIST_KEYS = [
    "playerId",
    "playerName",
    "franchiseId",
    "team",
    "displaySeason",
    "gameGradeSeason",
    "barColor",
  ];

  function persistState() {
    const payload = {};
    PERSIST_KEYS.forEach((key) => {
      payload[key] = state[key];
    });
    saveJson(STORAGE_KEY, payload);
  }

  function hydrateUploadOverridesFromLegacyState() {
    [
      "passingSummaryText",
      "gameGradeFeedText",
      "gradeDistributionFeedText",
      "opponentsFeedText",
      "gradingProfileFeedText",
      "stableUnstableFeedText",
      "passingPressureFeedText",
      "passingConceptFeedText",
      "timeInPocketFeedText",
      "intLuckFeedText",
      "passingDepthFeedText",
      "accuracyByDepthFeedText",
      "generalAccuracyFeedText",
      "qbAccuracyFeedText",
      "incompletionRatesFeedText",
      "qbAlignmentFeedText",
      "allowedPressureFeedText",
      "clutchFeedText",
      "routeDataFeedText",
      "targetMapFeedText",
      "epaSeasonFeedText",
      "epaCareerFeedText",
      "warSeasonFeedText",
      "rushingSummaryFeedText",
      "passingGradesSituationFeedText",
      "passingGradesReadsFeedText",
      "passingGradesCoverageFeedText",
      "targetAlignmentFeedText",
      "throwTypeFeedText",
    ].forEach((key) => {
      if (typeof state[key] === "string" && state[key].trim()) {
        uploadOverrides[key] = state[key];
      }
      delete state[key];
    });
  }

  function sanitizeStateOverrides() {
    ["passingSummaryText", "gameGradeFeedText", "gradeDistributionFeedText", "opponentsFeedText", "gradingProfileFeedText", "stableUnstableFeedText", "passingPressureFeedText", "passingConceptFeedText", "timeInPocketFeedText", "intLuckFeedText", "passingDepthFeedText", "accuracyByDepthFeedText", "generalAccuracyFeedText", "qbAccuracyFeedText", "incompletionRatesFeedText", "qbAlignmentFeedText", "allowedPressureFeedText", "clutchFeedText", "routeDataFeedText", "targetMapFeedText", "epaSeasonFeedText", "epaCareerFeedText", "warSeasonFeedText", "rushingSummaryFeedText", "passingGradesSituationFeedText", "passingGradesReadsFeedText", "passingGradesCoverageFeedText", "targetAlignmentFeedText", "throwTypeFeedText"].forEach(
      (key) => {
        if (typeof state[key] === "string" && !state[key].trim()) state[key] = "";
      }
    );
  }

  function isFileProtocol() {
    return window.location.protocol === "file:";
  }

  function readForm() {
    return {
      ...state,
      playerId: els.playerId.value,
      playerName: els.playerSearch.value.trim() || els.playerName.value,
      franchiseId: els.franchiseId.value,
      team: els.team.value,
      displaySeason: els.displaySeason.value,
      barColor: els.barColor.value,
    };
  }

  function syncFormFromState() {
    els.playerSearch.value = state.playerName || "";
    els.playerId.value = state.playerId || "";
    els.playerName.value = state.playerName || "";
    els.franchiseId.value = state.franchiseId || "";
    els.team.value = state.team || "";
    els.displaySeason.value = state.displaySeason || "2025";
    els.barColor.value = state.barColor || DEFAULTS.barColor;
  }

  function setLoadStatus(msg, isError) {
    if (!els.loadStatus) return;
    els.loadStatus.textContent = msg;
    els.loadStatus.style.color = isError ? "#7f1d1d" : "";
  }

  function renderStatus(profile) {
    const items = [];
    if (!profile?.playerId) {
      items.push({ level: "error", text: "Select a quarterback." });
    } else {
      (profile.errors || []).forEach((text) => items.push({ level: "warn", text }));
      if (!items.length) items.push({ level: "ok", text: "Profile sections loaded." });
    }
    els.statusList.innerHTML = items
      .map((i) => `<li data-level="${i.level}">${window.QbAnnualUtils.escapeHtml(i.text)}</li>`)
      .join("");
  }

  async function ensureDataLoaded(force) {
    if (dataReady && !force) return window.QbAnnualApi.getLastLoadErrors();

    const [mainResult, targetMapResult, routeDataResult] = await Promise.allSettled([
      window.QbAnnualApi.ensureAllDataLoaded({
        passingSummaryText: uploadOverrides.passingSummaryText,
        gameGradeFeedText: uploadOverrides.gameGradeFeedText,
        gradeDistributionFeedText: uploadOverrides.gradeDistributionFeedText,
        opponentsFeedText: uploadOverrides.opponentsFeedText,
        gradingProfileFeedText: uploadOverrides.gradingProfileFeedText,
        stableUnstableFeedText: uploadOverrides.stableUnstableFeedText,
        passingPressureFeedText: uploadOverrides.passingPressureFeedText,
        passingConceptFeedText: uploadOverrides.passingConceptFeedText,
        timeInPocketFeedText: uploadOverrides.timeInPocketFeedText,
        intLuckFeedText: uploadOverrides.intLuckFeedText,
        passingDepthFeedText: uploadOverrides.passingDepthFeedText,
        accuracyByDepthFeedText: uploadOverrides.accuracyByDepthFeedText,
        generalAccuracyFeedText: uploadOverrides.generalAccuracyFeedText,
        qbAccuracyFeedText: uploadOverrides.qbAccuracyFeedText,
        incompletionRatesFeedText: uploadOverrides.incompletionRatesFeedText,
        qbAlignmentFeedText: uploadOverrides.qbAlignmentFeedText,
        allowedPressureFeedText: uploadOverrides.allowedPressureFeedText,
        clutchFeedText: uploadOverrides.clutchFeedText,
        routeDataFeedText: uploadOverrides.routeDataFeedText,
        epaSeasonFeedText: uploadOverrides.epaSeasonFeedText,
        epaCareerFeedText: uploadOverrides.epaCareerFeedText,
        warSeasonFeedText: uploadOverrides.warSeasonFeedText,
        rushingSummaryFeedText: uploadOverrides.rushingSummaryFeedText,
        passingGradesSituationFeedText: uploadOverrides.passingGradesSituationFeedText,
        passingGradesReadsFeedText: uploadOverrides.passingGradesReadsFeedText,
        passingGradesCoverageFeedText: uploadOverrides.passingGradesCoverageFeedText,
        targetAlignmentFeedText: uploadOverrides.targetAlignmentFeedText,
        throwTypeFeedText: uploadOverrides.throwTypeFeedText,
      }),
      window.QbAnnualTargetMapApi.ensureTargetMapLoaded(uploadOverrides.targetMapFeedText),
      window.QbAnnualRouteTreeApi.ensureRouteDataLoaded(uploadOverrides.routeDataFeedText),
    ]);

    const loadErrors = [];
    if (mainResult.status === "rejected") {
      loadErrors.push(`profile feeds: ${mainResult.reason?.message || "load failed"}`);
    } else if (mainResult.value?.errors?.length) {
      loadErrors.push(...mainResult.value.errors);
    }
    if (targetMapResult.status === "rejected") {
      loadErrors.push(`target-map.csv: ${targetMapResult.reason?.message || "load failed"}`);
    }
    if (routeDataResult.status === "rejected") {
      loadErrors.push(`route-data.csv: ${routeDataResult.reason?.message || "load failed"}`);
    }

    dataReady = true;
    return loadErrors;
  }

  async function render({ reloadData = false } = {}) {
    state = readForm();
    sanitizeStateOverrides();
    persistState();

    if (isFileProtocol() && !window.QbAnnualBundledData) {
      const msg =
        "Bundled CSV data is missing. Run python3 scripts/bundle-data.py in this folder, or use a local server.";
      setLoadStatus(msg, true);
      els.previewCanvas.innerHTML = `<p class="qb-empty">${window.QbAnnualUtils.escapeHtml(msg)}</p>`;
      return;
    }

    try {
      if (reloadData || !dataReady) {
        setLoadStatus(isFileProtocol() ? "Loading bundled CSV data…" : "Loading CSV data…");
      }

      const loadErrors = await ensureDataLoaded(reloadData);

      const passingState = window.QbAnnualApi.getPassingSummaryState();
      const gameGradeFeedState = window.QbAnnualApi.getGameGradeFeedState();
      const gradeDistributionState = window.QbAnnualApi.getGradeDistributionState();
      const opponentsState = window.QbAnnualApi.getOpponentsState();
      const gradingProfileState = window.QbAnnualApi.getGradingProfileState();
      const stableUnstableState = window.QbAnnualApi.getStableUnstableState();
      const passingPressureState = window.QbAnnualApi.getPassingPressureState();
      const passingConceptState = window.QbAnnualApi.getPassingConceptState();
      const timeInPocketState = window.QbAnnualApi.getTimeInPocketState();
      const intLuckState = window.QbAnnualApi.getIntLuckState();
      const passingDepthState = window.QbAnnualApi.getPassingDepthState();
      const accuracyByDepthState = window.QbAnnualApi.getAccuracyByDepthState();
      const generalAccuracyState = window.QbAnnualApi.getGeneralAccuracyState();
      const qbAccuracyState = window.QbAnnualApi.getQbAccuracyState();
      const incompletionRatesState = window.QbAnnualApi.getIncompletionRatesState();
      const qbAlignmentState = window.QbAnnualApi.getQbAlignmentState();
      const allowedPressureState = window.QbAnnualApi.getAllowedPressureState();
      const clutchState = window.QbAnnualApi.getClutchState();
      const epaPerPlayState = window.QbAnnualApi.getEpaPerPlayState();
      const warSeasonState = window.QbAnnualApi.getWarSeasonState();
      const rushingSummaryState = window.QbAnnualApi.getRushingSummaryState();
      const passingGradesSituationState = window.QbAnnualApi.getPassingGradesSituationState();
      const passingGradesReadsState = window.QbAnnualApi.getPassingGradesReadsState();
      const passingGradesCoverageState = window.QbAnnualApi.getPassingGradesCoverageState();
      const targetAlignmentState = window.QbAnnualApi.getTargetAlignmentState();
      const throwTypeState = window.QbAnnualApi.getThrowTypeState();
      qbList = passingState?.qbs || qbList;

      if (loadErrors.length) {
        setLoadStatus(`Some CSVs failed to load: ${loadErrors.join(" · ")}`, true);
      } else if (isFileProtocol()) {
        setLoadStatus("Loaded from bundled data (index.html). Re-run scripts/bundle-data.py after CSV updates.");
      } else {
        setLoadStatus("All CSV data loaded.");
      }

      const profile = window.QbAnnualApi.buildProfile(
        state,
        passingState,
        gameGradeFeedState,
        gradeDistributionState,
        opponentsState,
        gradingProfileState,
        stableUnstableState,
        passingPressureState,
        passingConceptState,
        timeInPocketState,
        intLuckState,
        passingDepthState,
        epaPerPlayState,
        accuracyByDepthState,
        generalAccuracyState,
        warSeasonState,
        rushingSummaryState,
        passingGradesSituationState,
        passingGradesReadsState,
        passingGradesCoverageState,
        targetAlignmentState,
        throwTypeState,
        qbAccuracyState,
        incompletionRatesState,
        qbAlignmentState,
        allowedPressureState,
        clutchState
      );

      const targetMapState = window.QbAnnualTargetMapApi.getTargetMapState();
      const targetMapPlays = window.QbAnnualTargetMapApi.getTargetMapPlaysForPasser(
        targetMapState,
        profile.playerId,
        profile.playerName
      );
      profile.targetMap = window.QbAnnualTargetMapApi.buildTargetMapModel(
        targetMapPlays,
        profile
      );
      if (!profile.targetMap) {
        profile.errors.push("No target map data found in target-map.csv for this QB.");
      }

      const routeDataState = window.QbAnnualRouteTreeApi.getRouteDataState();
      profile.routeTree = window.QbAnnualRouteTreeApi.getRouteTreeForPlayer(
        routeDataState,
        profile.playerId,
        profile.playerName
      );
      if (!profile.routeTree) {
        profile.errors.push("No route tree data found in route-data.csv for this QB.");
      }

      lastExportProfile = profile;

      const options = {
        barColor: state.barColor,
      };

      document.getElementById("profileStyles").textContent = window.QbAnnualProfile.buildCss();
      els.previewCanvas.innerHTML = window.QbAnnualProfile.buildMarkup(profile, options);
      els.htmlOutput.value = window.QbAnnualProfile.buildHtmlBlock(profile, options);
      els.downloadHtml.disabled = !window.QbAnnualExportBundleSource;
      renderStatus(profile);

      const profileEl = els.previewCanvas.querySelector(".qb-profile");
      window.QbAnnualAnimations?.init(els.previewWrap, profileEl);
      window.QbAnnualModals?.init(els.previewWrap, profile);
      window.QbAnnualSections?.init(els.previewCanvas);
    } catch (err) {
      setLoadStatus(err.message || "Could not load data.", true);
      els.previewCanvas.innerHTML = `<p class="qb-empty">${window.QbAnnualUtils.escapeHtml(err.message)}</p>`;
    }
  }

  function selectPlayer(qb) {
    if (!qb) return;
    state.playerId = qb.playerId || "";
    state.playerName = qb.playerName || "";
    state.franchiseId = qb.franchiseId || "";
    const team = window.QbAnnualTeams.resolve(qb.franchiseId);
    state.team = team.nickname || qb.teamName || "";
    syncFormFromState();
    hideResults();
    queueRender({ immediate: true });
  }

  function hideResults() {
    els.playerResults.hidden = true;
    els.playerResults.innerHTML = "";
  }

  function wirePlayerSearch() {
    els.playerSearch.addEventListener("input", () => {
      const q = els.playerSearch.value.trim().toLowerCase();
      if (q.length < 1) {
        hideResults();
        return;
      }
      const matches = qbList
        .filter((p) => p.playerName.toLowerCase().includes(q))
        .slice(0, 12);
      if (!matches.length) {
        hideResults();
        return;
      }
      els.playerResults.innerHTML = matches
        .map(
          (p) =>
            `<li><button type="button" data-id="${window.QbAnnualUtils.escapeAttr(p.playerId)}">${window.QbAnnualUtils.escapeHtml(p.playerName)}</button></li>`
        )
        .join("");
      els.playerResults.hidden = false;
    });

    els.playerResults.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      const qb = qbList.find((p) => String(p.playerId) === btn.dataset.id);
      selectPlayer(qb);
    });

    els.playerSearch.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const typed = els.playerSearch.value.trim().toLowerCase();
      const exact = qbList.filter((p) => p.playerName.toLowerCase() === typed);
      if (exact.length === 1) selectPlayer(exact[0]);
    });
  }

  function wireUploads() {
    els.passingFile?.addEventListener("change", () => {
      const file = els.passingFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        window.QbAnnualApi.invalidatePassingSummary();
        uploadOverrides.passingSummaryText = String(reader.result || "");
        dataReady = false;
        els.passingFile.value = "";
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.gameGradesFile?.addEventListener("change", () => {
      const file = els.gameGradesFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateGameGradeFeed();
        uploadOverrides.gameGradeFeedText = text;
        state.gameGrades = [];
        dataReady = false;
        els.gameGradesFile.value = "";
        setLoadStatus("Game grade feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.gradeDistFile?.addEventListener("change", () => {
      const file = els.gradeDistFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateGradeDistributionFeed();
        uploadOverrides.gradeDistributionFeedText = text;
        state.gradeDistribution = null;
        dataReady = false;
        els.gradeDistFile.value = "";
        setLoadStatus("Grade distribution feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.opponentsFile?.addEventListener("change", () => {
      const file = els.opponentsFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateOpponentsFeed();
        uploadOverrides.opponentsFeedText = text;
        dataReady = false;
        els.opponentsFile.value = "";
        setLoadStatus("Opponents feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.gradingProfileFile?.addEventListener("change", () => {
      const file = els.gradingProfileFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateGradingProfileFeed();
        uploadOverrides.gradingProfileFeedText = text;
        dataReady = false;
        els.gradingProfileFile.value = "";
        setLoadStatus("Grading profile feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.stableUnstableFile?.addEventListener("change", () => {
      const file = els.stableUnstableFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateStableUnstableFeed();
        uploadOverrides.stableUnstableFeedText = text;
        dataReady = false;
        els.stableUnstableFile.value = "";
        setLoadStatus("Stable & unstable feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.passingPressureFile?.addEventListener("change", () => {
      const file = els.passingPressureFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidatePassingPressureFeed();
        uploadOverrides.passingPressureFeedText = text;
        dataReady = false;
        els.passingPressureFile.value = "";
        setLoadStatus("Passing pressure feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.passingConceptFile?.addEventListener("change", () => {
      const file = els.passingConceptFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidatePassingConceptFeed();
        uploadOverrides.passingConceptFeedText = text;
        dataReady = false;
        els.passingConceptFile.value = "";
        setLoadStatus("Passing concept feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.timeInPocketFile?.addEventListener("change", () => {
      const file = els.timeInPocketFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateTimeInPocketFeed();
        uploadOverrides.timeInPocketFeedText = text;
        dataReady = false;
        els.timeInPocketFile.value = "";
        setLoadStatus("Time in pocket feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.intLuckFile?.addEventListener("change", () => {
      const file = els.intLuckFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateIntLuckFeed();
        uploadOverrides.intLuckFeedText = text;
        dataReady = false;
        els.intLuckFile.value = "";
        setLoadStatus("Interception luck feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.passingDepthFile?.addEventListener("change", () => {
      const file = els.passingDepthFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidatePassingDepthFeed();
        uploadOverrides.passingDepthFeedText = text;
        dataReady = false;
        els.passingDepthFile.value = "";
        setLoadStatus("Target depth feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.accuracyByDepthFile?.addEventListener("change", () => {
      const file = els.accuracyByDepthFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateAccuracyByDepthFeed();
        uploadOverrides.accuracyByDepthFeedText = text;
        dataReady = false;
        els.accuracyByDepthFile.value = "";
        setLoadStatus("Accuracy by depth feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.generalAccuracyFile?.addEventListener("change", () => {
      const file = els.generalAccuracyFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateGeneralAccuracyFeed();
        uploadOverrides.generalAccuracyFeedText = text;
        dataReady = false;
        els.generalAccuracyFile.value = "";
        setLoadStatus("General accuracy feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.qbAccuracyFile?.addEventListener("change", () => {
      const file = els.qbAccuracyFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateQbAccuracyFeed();
        uploadOverrides.qbAccuracyFeedText = text;
        dataReady = false;
        els.qbAccuracyFile.value = "";
        setLoadStatus("QB Accuracy feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.incompletionRatesFile?.addEventListener("change", () => {
      const file = els.incompletionRatesFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateIncompletionRatesFeed();
        uploadOverrides.incompletionRatesFeedText = text;
        dataReady = false;
        els.incompletionRatesFile.value = "";
        setLoadStatus("Incompletion rates feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.qbAlignmentFile?.addEventListener("change", () => {
      const file = els.qbAlignmentFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateQbAlignmentFeed();
        uploadOverrides.qbAlignmentFeedText = text;
        dataReady = false;
        els.qbAlignmentFile.value = "";
        setLoadStatus("QB alignment feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.allowedPressureFile?.addEventListener("change", () => {
      const file = els.allowedPressureFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateAllowedPressureFeed();
        uploadOverrides.allowedPressureFeedText = text;
        dataReady = false;
        els.allowedPressureFile.value = "";
        setLoadStatus("Allowed pressure feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.clutchFile?.addEventListener("change", () => {
      const file = els.clutchFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateClutchFeed();
        uploadOverrides.clutchFeedText = text;
        dataReady = false;
        els.clutchFile.value = "";
        setLoadStatus("Clutch moments feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.routeDataFile?.addEventListener("change", () => {
      const file = els.routeDataFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualRouteTreeApi.invalidateRouteDataFeed();
        uploadOverrides.routeDataFeedText = text;
        dataReady = false;
        els.routeDataFile.value = "";
        setLoadStatus("Route data feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.targetMapFile?.addEventListener("change", () => {
      const file = els.targetMapFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualTargetMapApi.invalidateTargetMapFeed();
        uploadOverrides.targetMapFeedText = text;
        dataReady = false;
        els.targetMapFile.value = "";
        setLoadStatus("Target map feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.epaSeasonFile?.addEventListener("change", () => {
      const file = els.epaSeasonFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateEpaPerPlayFeed();
        uploadOverrides.epaSeasonFeedText = text;
        dataReady = false;
        els.epaSeasonFile.value = "";
        setLoadStatus("EPA per play season feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.epaCareerFile?.addEventListener("change", () => {
      const file = els.epaCareerFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateEpaPerPlayFeed();
        uploadOverrides.epaCareerFeedText = text;
        dataReady = false;
        els.epaCareerFile.value = "";
        setLoadStatus("EPA per play career feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.warSeasonFile?.addEventListener("change", () => {
      const file = els.warSeasonFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateWarSeasonFeed();
        uploadOverrides.warSeasonFeedText = text;
        dataReady = false;
        els.warSeasonFile.value = "";
        setLoadStatus("WAR by season feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.rushingSummaryFile?.addEventListener("change", () => {
      const file = els.rushingSummaryFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateRushingSummaryFeed();
        uploadOverrides.rushingSummaryFeedText = text;
        dataReady = false;
        els.rushingSummaryFile.value = "";
        setLoadStatus("Rushing summary feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.passingGradesSituationFile?.addEventListener("change", () => {
      const file = els.passingGradesSituationFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidatePassingGradesSituationFeed();
        uploadOverrides.passingGradesSituationFeedText = text;
        dataReady = false;
        els.passingGradesSituationFile.value = "";
        setLoadStatus("Passing grades by situation feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.passingGradesReadsFile?.addEventListener("change", () => {
      const file = els.passingGradesReadsFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidatePassingGradesReadsFeed();
        uploadOverrides.passingGradesReadsFeedText = text;
        dataReady = false;
        els.passingGradesReadsFile.value = "";
        setLoadStatus("Reads feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.passingGradesCoverageFile?.addEventListener("change", () => {
      const file = els.passingGradesCoverageFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidatePassingGradesCoverageFeed();
        uploadOverrides.passingGradesCoverageFeedText = text;
        dataReady = false;
        els.passingGradesCoverageFile.value = "";
        setLoadStatus("Throws vs. coverage feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.targetAlignmentFile?.addEventListener("change", () => {
      const file = els.targetAlignmentFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateTargetAlignmentFeed();
        uploadOverrides.targetAlignmentFeedText = text;
        dataReady = false;
        els.targetAlignmentFile.value = "";
        setLoadStatus("Target alignment feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });

    els.throwTypeFile?.addEventListener("change", () => {
      const file = els.throwTypeFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        window.QbAnnualApi.invalidateThrowTypeFeed();
        uploadOverrides.throwTypeFeedText = text;
        dataReady = false;
        els.throwTypeFile.value = "";
        setLoadStatus("Throw type feed loaded from upload.");
        queueRender({ reloadData: true });
      };
      reader.readAsText(file);
    });
  }

  function setPreviewMode(mode) {
    els.previewWrap.dataset.mode = mode;
    els.previewDesktop.setAttribute("aria-pressed", mode === "desktop");
    els.previewMobile.setAttribute("aria-pressed", mode === "mobile");
  }

  function queueRender(options = {}) {
    if (renderTimer) window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => {
      renderTimer = null;
      runRender(options);
    }, options.immediate ? 0 : 180);
  }

  async function runRender(options = {}) {
    if (renderInFlight) {
      renderQueued = true;
      return;
    }
    renderInFlight = true;
    try {
      await render(options);
    } finally {
      renderInFlight = false;
      if (renderQueued) {
        renderQueued = false;
        runRender(options);
      }
    }
  }

  function init() {
    hydrateUploadOverridesFromLegacyState();
    persistState();
    sanitizeStateOverrides();
    syncFormFromState();
    wirePlayerSearch();
    wireUploads();

    els.form.addEventListener("input", (e) => {
      if (e.target.id === "playerSearch") return;
      queueRender();
    });
    els.form.addEventListener("change", () => queueRender());

    els.copyHtml.addEventListener("click", async () => {
      try {
        await copyText(els.htmlOutput.value);
        els.copyHtml.textContent = "Copied!";
        setTimeout(() => {
          els.copyHtml.textContent = "Copy HTML";
        }, 2000);
      } catch {
        els.copyHtml.textContent = "Copy failed";
      }
    });

    els.downloadHtml?.addEventListener("click", () => {
      if (!lastExportProfile || !window.QbAnnualExportBundleSource) return;

      const html = window.QbAnnualProfile.buildStandaloneDocument(lastExportProfile, {
        barColor: state.barColor,
      });
      const slug = (lastExportProfile.playerName || "qb-profile")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug || "qb-profile"}.html`;
      link.click();
      URL.revokeObjectURL(url);
    });

    els.previewDesktop.addEventListener("click", () => setPreviewMode("desktop"));
    els.previewMobile.addEventListener("click", () => setPreviewMode("mobile"));

    runRender({ reloadData: true, immediate: true });
  }

  init();
})();
