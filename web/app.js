const body = document.body;

const state = {
  screen: "arena",
  step: "ready-one",
  result: null,
  runId: null,
  lastFocus: null,
  overlayFocus: null,
};

const elements = {
  advance: document.querySelector("#advance-life"),
  newRun: document.querySelector("#new-run"),
  newRunDialog: document.querySelector("#new-run-dialog"),
  confirmNewRun: document.querySelector("#confirm-new-run"),
  navStatus: document.querySelector("#nav-status"),
  metricLife: document.querySelector("#metric-life"),
  metricDatabase: document.querySelector("#metric-database"),
  phaseLabel: document.querySelector("#phase-label"),
  controllerTitle: document.querySelector("#controller-title"),
  controllerDetail: document.querySelector("#controller-detail"),
  memoryLift: document.querySelector("#memory-lift"),
  resultTitle: document.querySelector("#result-title"),
  resultCopy: document.querySelector("#result-copy"),
  errorDetail: document.querySelector("#error-detail"),
  appShell: document.querySelector(".app-shell"),
  intro: document.querySelector(".intro"),
  liveStatus: document.querySelector("#live-status"),
  loadingOverlay: document.querySelector("#loading-overlay"),
  resetOverlay: document.querySelector("#reset-overlay"),
  errorOverlay: document.querySelector("#error-overlay"),
  loadingCode: document.querySelector("#loading-code"),
  loadingTitle: document.querySelector("#loading-title"),
  loadingDetail: document.querySelector("#loading-detail"),
  evidenceNavState: document.querySelector("#evidence-nav-state"),
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function setPhase(phase) {
  const focusBeforeBlock = document.activeElement;
  body.dataset.phase = phase;
  const blocked = phase === "loading" || phase === "resetting" || phase === "error";
  elements.advance.disabled = blocked;
  elements.appShell.inert = blocked;
  elements.intro.inert = blocked;
  elements.loadingOverlay.setAttribute("aria-hidden", String(phase !== "loading"));
  elements.resetOverlay.setAttribute("aria-hidden", String(phase !== "resetting"));
  elements.errorOverlay.setAttribute("aria-hidden", String(phase !== "error"));
  if (phase === "error") {
    state.overlayFocus = focusBeforeBlock;
    window.requestAnimationFrame(() => document.querySelector("#retry-run").focus());
  }
}

function announce(message) {
  elements.liveStatus.textContent = "";
  window.requestAnimationFrame(() => { elements.liveStatus.textContent = message; });
}

function showScreen(screen) {
  state.screen = screen;
  body.dataset.screen = screen;
  document.querySelectorAll(".screen").forEach((panel) => {
    panel.hidden = panel.id !== screen;
  });
  document.querySelectorAll("[data-screen-target]").forEach((control) => {
    const isActive = control.dataset.screenTarget === screen;
    control.classList.toggle("is-active", isActive);
    if (control.classList.contains("nav-link")) {
      if (isActive) control.setAttribute("aria-current", "page");
      else control.removeAttribute("aria-current");
    }
  });
}

function armLife(result, arm, index) {
  return result[arm].lives[index];
}

function shortSession(sessionId) {
  const pieces = sessionId.split("-");
  return pieces.slice(-3).join("-");
}

function renderArm(arm, life) {
  const prefix = arm;
  const delta = life.ending_capital - 100_000;
  document.querySelector(`#${prefix}-capital`).textContent = money.format(life.ending_capital);
  document.querySelector(`#${prefix}-delta`).textContent = `${delta < 0 ? "−" : "+"} ${money.format(Math.abs(delta))}`;
  document.querySelector(`#${prefix}-bar`).style.transform = `scaleX(${life.ending_capital / 100_000})`;
  document.querySelector(`#${prefix}-allocation`).textContent = `${Math.round(life.decision.allocation_fraction * 100)}% to ${life.protocol_name}`;
  document.querySelector(`#${prefix}-session`).textContent = shortSession(life.session_id);
  document.querySelector(`#${prefix}-rationale`).textContent = life.decision.rationale;
  document.querySelector(`#${prefix}-memory`).textContent = life.decision.recalled_policy_ids.length
    ? `Cited ${life.decision.recalled_policy_ids.join(", ")}`
    : arm === "groundhog" ? "No matching memory in this life" : "Recall disabled by experiment";
}

function renderLife(index) {
  const groundhog = armLife(state.result, "groundhog", index);
  const amnesiac = armLife(state.result, "amnesiac", index);
  renderArm("groundhog", groundhog);
  renderArm("amnesiac", amnesiac);
  elements.metricLife.textContent = `${index + 1} / 02`;
  elements.metricDatabase.textContent = state.result.database_path;

  if (index === 0) {
    state.step = "life-one";
    body.dataset.step = state.step;
    elements.phaseLabel.textContent = "Life 1 settled";
    elements.navStatus.textContent = "Life 1 / policy formed";
    elements.controllerTitle.textContent = "Both vaults lost $18,000. One formed a memory.";
    elements.controllerDetail.textContent = "Destroy both runtimes before revealing the disguised-repeat scenario.";
    elements.advance.textContent = "Destroy sessions";
    elements.memoryLift.textContent = "Pending Life 2";
    elements.resultTitle.textContent = "The first loss is identical by design.";
    elements.resultCopy.textContent = "Groundhog wrote the incident to Sibyl and promoted one reusable exposure policy. Amnesiac retained nothing.";
    document.querySelector("#evidence-incident").textContent = "MoonPool depeg / −$18,000";
    document.querySelector("#evidence-incident-copy").textContent = "Incentive-funded yield, concentrated liquidity, shallow exits, and peg instability appeared together.";
    document.querySelector("#evidence-policy").textContent = "Cap matching exposure at 5%";
    document.querySelector("#evidence-policy-copy").textContent = "Sibyl WARM entity derived from the append-only Life 1 incident journal.";
    elements.evidenceNavState.textContent = "Available";
    announce("Life 1 complete. Both vaults lost 18,000 dollars. Groundhog formed a persistent risk policy.");
  } else {
    state.step = "life-two";
    body.dataset.step = state.step;
    elements.phaseLabel.textContent = "Experiment complete";
    elements.navStatus.textContent = "Complete / memory changed decision";
    elements.controllerTitle.textContent = "Same risk pattern. Different decision.";
    elements.controllerDetail.textContent = "Groundhog recalled Life 1 and capped SunPool at 5%. Amnesiac repeated the 30% allocation.";
    elements.advance.textContent = "Inspect evidence";
    elements.memoryLift.textContent = `+${money.format(state.result.memory_lift)}`;
    elements.resultTitle.textContent = "Persisted memory preserved $12,300.";
    elements.resultCopy.textContent = "The pool name changed. The causal risk signature did not. Groundhog recognized the pattern in a fresh session.";
    document.querySelector("#evidence-decision").textContent = "SunPool exposure: 30% → 5%";
    document.querySelector("#evidence-decision-copy").textContent = groundhog.decision.rationale;
    announce("Life 2 complete. Groundhog allocated 5 percent, Amnesiac allocated 30 percent. Memory preserved 12,300 dollars.");
  }
}

async function postJson(path) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || payload.error || "Experiment service returned an error.");
  return payload;
}

function configureLoading(lifeNumber) {
  elements.loadingCode.textContent = `RUN L0${lifeNumber} / ${lifeNumber === 1 ? "SIBYL DATABASE INITIALIZING" : "FRESH CLIENT RECALL"}`;
  elements.loadingTitle.textContent = lifeNumber === 1 ? "Fresh agents are deciding." : "Memory is changing the decision.";
  elements.loadingDetail.textContent = lifeNumber === 1
    ? "The current inputs are identical. Neither agent has encountered MoonPool before."
    : "Both runtimes are new. Groundhog opens the persisted Sibyl database; Amnesiac receives no historical channel.";
}

async function loadLifeOne() {
  configureLoading(1);
  setPhase("loading");
  try {
    const created = await postJson("/api/runs");
    state.runId = created.run_id;
    state.result = await postJson(`/api/runs/${state.runId}/lives`);
    renderLife(0);
    setPhase("success");
  } catch (error) {
    elements.errorDetail.textContent = error instanceof Error ? error.message : "Unknown experiment failure.";
    setPhase("error");
  }
}

async function loadLifeTwo() {
  configureLoading(2);
  setPhase("loading");
  try {
    state.result = await postJson(`/api/runs/${state.runId}/lives`);
    renderLife(1);
    setPhase("success");
  } catch (error) {
    elements.errorDetail.textContent = error instanceof Error ? error.message : "Unknown experiment failure.";
    setPhase("error");
  }
}

function destroySessions() {
  setPhase("resetting");
  announce("Both agent runtimes destroyed. Conversation context cleared. Sibyl memory remains.");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => {
    state.step = "ready-two";
    body.dataset.step = state.step;
    elements.phaseLabel.textContent = "Fresh sessions ready";
    elements.navStatus.textContent = "Life 2 / fresh runtimes";
    elements.controllerTitle.textContent = "SunPool offers 22% APY under a new name.";
    elements.controllerDetail.textContent = "Both agents receive the same market input. Only Groundhog can recall the Life 1 risk policy.";
    elements.advance.textContent = "Run Life 2";
    document.querySelector("#groundhog-session").textContent = "GH-fresh-new";
    document.querySelector("#amnesiac-session").textContent = "AM-fresh-new";
    setPhase("ready");
    elements.advance.focus();
  }, reducedMotion ? 20 : 700);
}

function resetInterface() {
  state.step = "ready-one";
  state.result = null;
  state.runId = null;
  body.dataset.step = state.step;
  setPhase("ready");
  showScreen("arena");
  elements.metricLife.textContent = "— / 02";
  elements.metricDatabase.textContent = "Not created";
  elements.phaseLabel.textContent = "Ready";
  elements.navStatus.textContent = "Ready / no run";
  elements.controllerTitle.textContent = "Two funded vaults. Zero prior incidents.";
  elements.controllerDetail.textContent = "Life 1 exposes both arms to a 30% allocation and the same deterministic depeg.";
  elements.advance.textContent = "Run Life 1";
  elements.memoryLift.textContent = "Not measured";
  elements.resultTitle.textContent = "The causal result appears after Life 2.";
  elements.resultCopy.textContent = "Groundhog and Amnesiac currently have identical information and capital.";
  ["groundhog", "amnesiac"].forEach((arm) => {
    document.querySelector(`#${arm}-capital`).textContent = "$100,000";
    document.querySelector(`#${arm}-delta`).textContent = "± $0";
    document.querySelector(`#${arm}-bar`).style.transform = "scaleX(1)";
    document.querySelector(`#${arm}-allocation`).textContent = "Awaiting run";
    document.querySelector(`#${arm}-session`).textContent = arm === "groundhog" ? "GH-fresh-000" : "AM-fresh-000";
  });
  document.querySelector("#groundhog-rationale").textContent = "No market has been evaluated. Run Life 1 to begin the controlled experiment.";
  document.querySelector("#groundhog-memory").textContent = "No memory cited";
  document.querySelector("#amnesiac-rationale").textContent = "This control arm receives the current market state but no historical channel.";
  document.querySelector("#amnesiac-memory").textContent = "Recall disabled by experiment";
  document.querySelector("#evidence-incident").textContent = "No incident recorded";
  document.querySelector("#evidence-incident-copy").textContent = "Run Life 1 to create the append-only failure record.";
  document.querySelector("#evidence-policy").textContent = "No policy promoted";
  document.querySelector("#evidence-policy-copy").textContent = "A causal signature becomes one current risk policy.";
  document.querySelector("#evidence-decision").textContent = "No decision influenced";
  document.querySelector("#evidence-decision-copy").textContent = "Life 2 will cite the policy if it changes allocation.";
  elements.evidenceNavState.textContent = "Pending";
  announce("New controlled run ready. Both vaults are funded with no prior incidents.");
}

document.querySelector("#enter-arena").addEventListener("click", () => {
  body.dataset.scene = "app";
  showScreen("arena");
  elements.advance.focus();
});

document.querySelector("#skip-to-experiment").addEventListener("click", (event) => {
  event.preventDefault();
  body.dataset.scene = "app";
  showScreen("arena");
  document.querySelector("#arena-title").focus();
});

document.querySelectorAll("[data-screen-target]").forEach((control) => {
  control.addEventListener("click", (event) => {
    event.preventDefault();
    if (body.dataset.scene === "intro") body.dataset.scene = "app";
    showScreen(control.dataset.screenTarget);
  });
});

elements.advance.addEventListener("click", () => {
  if (state.step === "ready-one") loadLifeOne();
  else if (state.step === "life-one") destroySessions();
  else if (state.step === "ready-two") loadLifeTwo();
  else if (state.step === "life-two") showScreen("evidence");
});

elements.newRun.addEventListener("click", () => {
  state.lastFocus = document.activeElement;
  elements.newRunDialog.showModal();
});

elements.newRunDialog.addEventListener("close", () => {
  if (elements.newRunDialog.returnValue === "confirm") resetInterface();
  if (state.lastFocus instanceof HTMLElement) state.lastFocus.focus();
});

function dismissError() {
  setPhase("ready");
  if (state.overlayFocus instanceof HTMLElement) state.overlayFocus.focus();
}

document.querySelector("#dismiss-error").addEventListener("click", dismissError);
document.querySelector("#retry-run").addEventListener("click", () => {
  if (state.step === "ready-two") loadLifeTwo();
  else loadLifeOne();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && body.dataset.phase === "error") dismissError();
  if (event.key === "Tab" && body.dataset.phase === "error") {
    const controls = [...elements.errorOverlay.querySelectorAll("button:not([disabled])")];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
