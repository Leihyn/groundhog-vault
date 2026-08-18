const body = document.body;

function persistentWorkspaceId() {
  const stored = window.localStorage.getItem("groundhog-treasury-workspace") || "";
  if (/^[a-f0-9]{32}$/.test(stored)) return stored;
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  const created = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  window.localStorage.setItem("groundhog-treasury-workspace", created);
  return created;
}

const state = {
  screen: "arena",
  step: "ready-one",
  result: null,
  runId: null,
  treasuryIncident: null,
  treasuryEvaluation: null,
  baseConfig: null,
  treasuryWorkspaceId: persistentWorkspaceId(),
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
  incidentForm: document.querySelector("#incident-form"),
  proposalForm: document.querySelector("#proposal-form"),
  incidentStatus: document.querySelector("#incident-status"),
  proposalStatus: document.querySelector("#proposal-status"),
  treasuryAllocation: document.querySelector("#treasury-allocation"),
  treasuryReceiptTitle: document.querySelector("#decision-receipt-title"),
  treasuryRationale: document.querySelector("#treasury-rationale"),
  treasuryPolicy: document.querySelector("#treasury-policy"),
  baseStatus: document.querySelector("#base-status"),
  recordBase: document.querySelector("#record-base"),
  baseTransaction: document.querySelector("#base-transaction"),
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

async function postJson(path, bodyPayload = {}) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyPayload) });
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
    window.localStorage.setItem("groundhog-active-run", state.runId);
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
  window.localStorage.removeItem("groundhog-active-run");
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

function workflowPayload(form, includeLoss) {
  const values = new FormData(form);
  const payload = {
    workspace_id: state.treasuryWorkspaceId,
    protocol_name: values.get("protocol_name"),
    advertised_apy: Number(values.get("advertised_apy")) / 100,
    signals: {
      incentive_funded_yield: Number(values.get("incentive_funded_yield")) / 100,
      liquidity_concentration: Number(values.get("liquidity_concentration")) / 100,
      exit_liquidity: Number(values.get("exit_liquidity")) / 100,
      peg_instability: Number(values.get("peg_instability")) / 100,
    },
  };
  if (includeLoss) payload.loss = Number(values.get("loss"));
  return payload;
}

function setFormStatus(element, message, kind = "") {
  element.textContent = message;
  element.classList.toggle("is-success", kind === "success");
  element.classList.toggle("is-error", kind === "error");
}

elements.incidentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = elements.incidentForm.querySelector("button[type='submit']");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  setFormStatus(elements.incidentStatus, "Writing incident and risk policy…");
  try {
    const incident = await postJson("/api/treasury/incidents", workflowPayload(elements.incidentForm, true));
    state.treasuryIncident = incident;
    setFormStatus(elements.incidentStatus, `Stored ${incident.incident_id}. Policy cap: ${Math.round(incident.policy.maximum_exposure * 100)}%.`, "success");
    document.querySelector("#evidence-incident").textContent = `${incident.protocol_name} / −${money.format(incident.loss)}`;
    document.querySelector("#evidence-incident-copy").textContent = `User-submitted incident with signature ${incident.risk_signature}.`;
    document.querySelector("#evidence-policy").textContent = `Cap matching exposure at ${Math.round(incident.policy.maximum_exposure * 100)}%`;
    document.querySelector("#evidence-policy-copy").textContent = `Sibyl entity linked to ${incident.incident_id}.`;
    elements.evidenceNavState.textContent = "Available";
    announce("Incident stored in Sibyl. A reusable exposure policy is available to fresh sessions.");
  } catch (error) {
    setFormStatus(elements.incidentStatus, error instanceof Error ? error.message : "Incident could not be stored.", "error");
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
});

elements.proposalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = elements.proposalForm.querySelector("button[type='submit']");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  setFormStatus(elements.proposalStatus, "Constructing a fresh agent session…");
  try {
    const evaluation = await postJson("/api/treasury/evaluations", workflowPayload(elements.proposalForm, false));
    state.treasuryEvaluation = evaluation;
    const allocation = Math.round(evaluation.decision.allocation_fraction * 100);
    elements.treasuryAllocation.textContent = `${allocation}%`;
    elements.treasuryReceiptTitle.textContent = `${evaluation.protocol_name}: cap exposure at ${allocation}%`;
    elements.treasuryRationale.textContent = evaluation.decision.rationale;
    elements.treasuryPolicy.textContent = evaluation.recalled_policy
      ? `Cited ${evaluation.recalled_policy.policy_id} from ${evaluation.recalled_policy.source_incident_id}`
      : "No matching policy found";
    setFormStatus(elements.proposalStatus, `Fresh session ${evaluation.session_id} completed.`, "success");
    document.querySelector("#evidence-decision").textContent = `${evaluation.protocol_name} exposure: ${allocation}%`;
    document.querySelector("#evidence-decision-copy").textContent = evaluation.decision.rationale;
    refreshBaseAction();
    announce(`Fresh treasury review complete. Recommended allocation is ${allocation} percent.`);
  } catch (error) {
    setFormStatus(elements.proposalStatus, error instanceof Error ? error.message : "Proposal could not be evaluated.", "error");
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
});

async function loadBaseConfig() {
  try {
    const response = await fetch("/api/config");
    const payload = await response.json();
    state.baseConfig = payload.base;
    const localContract = window.localStorage.getItem("groundhog-base-contract") || "";
    if (!state.baseConfig.receipt_contract && /^0x[a-fA-F0-9]{40}$/.test(localContract)) {
      state.baseConfig.receipt_contract = localContract;
    }
    elements.baseStatus.textContent = state.baseConfig.receipt_contract
      ? `Contract ${state.baseConfig.receipt_contract} is ready on ${payload.base.network}.`
      : "Deploy the receipt contract from your wallet, then anchor evaluated recommendations.";
    refreshBaseAction();
  } catch {
    elements.baseStatus.textContent = "Base configuration could not be loaded.";
  }
}

function refreshBaseAction() {
  if (!state.baseConfig) {
    elements.recordBase.disabled = true;
    return;
  }
  if (!state.baseConfig.receipt_contract) {
    elements.recordBase.textContent = "Deploy receipt contract";
    elements.recordBase.disabled = false;
    return;
  }
  elements.recordBase.textContent = "Record on Base";
  elements.recordBase.disabled = !state.treasuryEvaluation;
}

async function sha256Word(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function uintWord(value) {
  return Math.round(value).toString(16).padStart(64, "0");
}

async function encodeDecisionReceipt(evaluation) {
  const selector = "49ff064d";
  const evaluationWord = evaluation.evaluation_id.padStart(64, "0");
  const allocationWord = uintWord(evaluation.decision.allocation_fraction * 10_000);
  const memoryWord = uintWord(evaluation.recalled_policy ? 1 : 0);
  const policyWord = await sha256Word(evaluation.recalled_policy?.policy_id || "none");
  const incidentWord = await sha256Word(evaluation.recalled_policy?.source_incident_id || "none");
  return `0x${selector}${evaluationWord}${allocationWord}${memoryWord}${policyWord}${incidentWord}`;
}

async function waitForTransaction(provider, transactionHash) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const receipt = await provider.request({ method: "eth_getTransactionReceipt", params: [transactionHash] });
    if (receipt) return receipt;
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }
  return null;
}

async function connectBaseWallet(provider) {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId !== state.baseConfig.chain_id_hex) {
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: state.baseConfig.chain_id_hex }] });
    } catch (switchError) {
      if (switchError.code !== 4902) throw switchError;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: state.baseConfig.chain_id_hex,
          chainName: state.baseConfig.network,
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [state.baseConfig.rpc_url],
          blockExplorerUrls: [state.baseConfig.explorer_url],
        }],
      });
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: state.baseConfig.chain_id_hex }] });
    }
  }
  return accounts[0];
}

async function deployReceiptContract(provider) {
  const account = await connectBaseWallet(provider);
  const bytecodeResponse = await fetch("/risk-receipt-bytecode.txt");
  if (!bytecodeResponse.ok) throw new Error("Contract bytecode is unavailable.");
  const bytecode = (await bytecodeResponse.text()).trim();
  elements.baseStatus.textContent = "Confirm the Base Sepolia contract deployment in your wallet…";
  const transactionHash = await provider.request({
    method: "eth_sendTransaction",
    params: [{ from: account, data: bytecode }],
  });
  elements.baseTransaction.href = `${state.baseConfig.explorer_url}/tx/${transactionHash}`;
  elements.baseTransaction.hidden = false;
  const receipt = await waitForTransaction(provider, transactionHash);
  if (receipt?.status !== "0x1" || !receipt.contractAddress) {
    throw new Error(receipt ? "Contract deployment reverted." : "Deployment submitted but confirmation is still pending.");
  }
  state.baseConfig.receipt_contract = receipt.contractAddress;
  window.localStorage.setItem("groundhog-base-contract", receipt.contractAddress);
  elements.baseStatus.textContent = `Receipt contract deployed at ${receipt.contractAddress}.`;
  refreshBaseAction();
}

elements.recordBase.addEventListener("click", async () => {
  if (!state.baseConfig) return;
  const provider = window.ethereum;
  if (!provider) {
    elements.baseStatus.textContent = "A browser wallet is required to record the receipt.";
    return;
  }
  elements.recordBase.disabled = true;
  try {
    if (!state.baseConfig.receipt_contract) {
      await deployReceiptContract(provider);
      return;
    }
    if (!state.treasuryEvaluation) return;
    elements.baseStatus.textContent = "Waiting for Base Sepolia wallet confirmation…";
    const account = await connectBaseWallet(provider);
    const transactionHash = await provider.request({
      method: "eth_sendTransaction",
      params: [{
        from: account,
        to: state.baseConfig.receipt_contract,
        data: await encodeDecisionReceipt(state.treasuryEvaluation),
      }],
    });
    elements.baseTransaction.href = `${state.baseConfig.explorer_url}/tx/${transactionHash}`;
    elements.baseTransaction.hidden = false;
    const receipt = await waitForTransaction(provider, transactionHash);
    elements.baseStatus.textContent = receipt?.status === "0x1"
      ? "Decision receipt confirmed on Base Sepolia."
      : receipt ? "The Base transaction reverted." : "Transaction submitted; confirmation is still pending.";
  } catch (error) {
    elements.baseStatus.textContent = error instanceof Error ? error.message : "Base transaction was not submitted.";
  } finally {
    refreshBaseAction();
  }
});

async function restoreActiveRun() {
  const runId = window.localStorage.getItem("groundhog-active-run");
  if (!runId) return;
  try {
    const response = await fetch(`/api/runs/${runId}`);
    if (!response.ok) throw new Error("run not found");
    const result = await response.json();
    const completedLives = result.groundhog.lives.length;
    if (completedLives === 0) return;
    state.runId = runId;
    state.result = result;
    body.dataset.scene = "app";
    showScreen("arena");
    renderLife(0);
    if (completedLives === 2) renderLife(1);
    announce(`Restored experiment ${runId} from disk.`);
  } catch {
    window.localStorage.removeItem("groundhog-active-run");
  }
}

loadBaseConfig();
restoreActiveRun();
