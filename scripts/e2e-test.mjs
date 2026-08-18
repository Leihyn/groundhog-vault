import process from "node:process";

const cdpOrigin = process.env.CDP_ORIGIN || "http://127.0.0.1:9228";
const appUrl = process.env.APP_URL || "http://127.0.0.1:4184";

const target = await fetch(`${cdpOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const failures = [];
const exceptions = [];
const badResponses = [];
let requestId = 0;
let checkCount = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") {
    exceptions.push(message.params.exceptionDetails.text);
  }
  if (message.method === "Network.responseReceived" && message.params.response.status >= 400) {
    badResponses.push({ url: message.params.response.url, status: message.params.response.status });
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function click(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}

async function waitFor(expression, timeout = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await pause(75);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function check(label, expression) {
  checkCount += 1;
  const passed = await evaluate(expression);
  if (!passed) failures.push(label);
}

const walletScript = `
(() => {
  let baseAdded = false;
  let chainId = "0x1";
  const contractAddress = "0x1111111111111111111111111111111111111111";
  const deploymentHash = "0x" + "aa".repeat(32);
  const receiptHash = "0x" + "bb".repeat(32);
  window.__walletCalls = [];
  const provider = {
    async request(request) {
      window.__walletCalls.push(JSON.parse(JSON.stringify(request)));
      const { method, params = [] } = request;
      if (method === "eth_requestAccounts") return ["0x2222222222222222222222222222222222222222"];
      if (method === "eth_chainId") return chainId;
      if (method === "wallet_switchEthereumChain") {
        if (!baseAdded) {
          const error = new Error("unknown chain");
          error.code = 4902;
          throw error;
        }
        chainId = params[0].chainId;
        return null;
      }
      if (method === "wallet_addEthereumChain") {
        baseAdded = true;
        return null;
      }
      if (method === "eth_sendTransaction") return params[0].to ? receiptHash : deploymentHash;
      if (method === "eth_getTransactionReceipt") {
        if (params[0] === deploymentHash) return { status: "0x1", contractAddress };
        if (params[0] === receiptHash) return { status: "0x1" };
      }
      throw new Error("Unexpected wallet method: " + method);
    },
  };
  window.__mockEthereum = provider;
  Object.defineProperty(window, "ethereum", { configurable: true, writable: true, value: provider });
})();
`;

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Storage.clearDataForOrigin", { origin: new URL(appUrl).origin, storageTypes: "all" });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", { source: walletScript });
await send("Page.navigate", { url: appUrl });
await waitFor("document.readyState === 'complete'");
await waitFor("document.querySelector('#record-base').textContent.includes('Deploy')");

await check("intro starts visible", "document.body.dataset.scene === 'intro'");
await check("all controls have accessible text", "[...document.querySelectorAll('button')].every((button) => button.textContent.trim().length > 0)");
await check("all form inputs have labels", "[...document.querySelectorAll('input')].every((input) => input.labels && input.labels.length > 0)");

await click("#enter-arena");
await send("Network.setBlockedURLs", { urls: ["*://*/api/runs"] });
await click("#advance-life");
await waitFor("document.body.dataset.phase === 'error'");
await waitFor("document.activeElement.id === 'retry-run'");
await check("error state moves focus to retry", "document.activeElement.id === 'retry-run'");
await check("error overlay is exposed", "document.querySelector('#error-overlay').getAttribute('aria-hidden') === 'false'");
await send("Network.setBlockedURLs", { urls: [] });
await click("#retry-run");
await waitFor("document.body.dataset.step === 'life-one'");
await check("life one allocations match", "document.querySelector('#groundhog-allocation').textContent.startsWith('30%') && document.querySelector('#amnesiac-allocation').textContent.startsWith('30%')");
await check("life one capital matches", "document.querySelector('#groundhog-capital').textContent === '$82,000' && document.querySelector('#amnesiac-capital').textContent === '$82,000'");

await click("#advance-life");
await waitFor("document.body.dataset.step === 'ready-two'");
await click("#advance-life");
await waitFor("document.body.dataset.step === 'life-two'");
await check("life two memory changes only Groundhog", "document.querySelector('#groundhog-allocation').textContent.startsWith('5%') && document.querySelector('#amnesiac-allocation').textContent.startsWith('30%')");
await check("memory lift is exact", "document.querySelector('#memory-lift').textContent === '+$12,300'");
const activeRun = await evaluate("localStorage.getItem('groundhog-active-run')");
checkCount += 1;
if (!/^[a-f0-9]{32}$/.test(activeRun)) failures.push("active run persisted in browser storage");

await send("Page.reload", { ignoreCache: true });
await waitFor("document.readyState === 'complete'");
await waitFor("document.body.dataset.step === 'life-two'");
await check("completed run restores after reload", "document.querySelector('#memory-lift').textContent === '+$12,300'");

await click("[data-screen-target='treasury']");
await evaluate("document.querySelector('#proposal-form').requestSubmit()");
await waitFor("document.querySelector('#proposal-status').classList.contains('is-success')");
await check("clean workspace has baseline decision", "document.querySelector('#treasury-allocation').textContent === '30%' && document.querySelector('#treasury-policy').textContent === 'No matching policy found'");
await evaluate("document.querySelector('#incident-form').requestSubmit()");
await waitFor("document.querySelector('#incident-status').classList.contains('is-success')");
await evaluate("document.querySelector('#proposal-form').requestSubmit()");
await waitFor("document.querySelector('#treasury-allocation').textContent === '5%'");
await check("stored incident changes fresh proposal", "document.querySelector('#treasury-policy').textContent.startsWith('Cited policy:')");

await evaluate("window.ethereum = undefined");
await click("#record-base");
await check("missing wallet has a clear error", "document.querySelector('#base-status').textContent.includes('browser wallet')");
await evaluate("window.ethereum = window.__mockEthereum");
await click("#record-base");
await waitFor("document.querySelector('#record-base').textContent === 'Record on Base'");
await check("deployed contract is retained", "localStorage.getItem('groundhog-base-contract') === '0x1111111111111111111111111111111111111111'");
await click("#record-base");
await waitFor("document.querySelector('#base-status').textContent.includes('confirmed on Base Sepolia')");
await check("transaction explorer link is correct", "document.querySelector('#base-transaction').href.endsWith('/tx/0x' + 'bb'.repeat(32))");
await check("wallet add and switch paths executed", "window.__walletCalls.some((call) => call.method === 'wallet_addEthereumChain') && window.__walletCalls.filter((call) => call.method === 'wallet_switchEthereumChain').length === 2");
await check("receipt calldata selector and values are correct", `(() => {
  const calls = window.__walletCalls.filter((call) => call.method === 'eth_sendTransaction');
  const data = calls[1]?.params[0]?.data?.slice(2) || '';
  return calls.length === 2 && calls[1].params[0].to === '0x1111111111111111111111111111111111111111'
    && data.slice(0, 8) === '49ff064d'
    && parseInt(data.slice(72, 136), 16) === 500
    && parseInt(data.slice(136, 200), 16) === 1
    && data.length === 328;
})()`);

await click("[data-screen-target='arena']");
await click("#new-run");
await check("new-run confirmation opens", "document.querySelector('#new-run-dialog').open");
await evaluate("document.querySelector('#confirm-new-run').click()");
await waitFor("document.body.dataset.step === 'ready-one'");
await check("new run clears active experiment", "localStorage.getItem('groundhog-active-run') === null && document.querySelector('#memory-lift').textContent === 'Not measured'");

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await click("[data-screen-target='treasury']");
await pause(200);
await check("mobile page has no global horizontal overflow", "document.documentElement.scrollWidth <= window.innerWidth");
await check("exactly one application screen is visible", "[...document.querySelectorAll('.screen')].filter((screen) => !screen.hidden).length === 1");
await check("active navigation is announced", "document.querySelectorAll('.nav-link[aria-current=\"page\"]').length === 1");

const unexpectedResponses = badResponses.filter(({ url, status }) => !(url.endsWith("/api/runs") && status === 0));
checkCount += 2;
if (exceptions.length) failures.push(`browser exceptions: ${exceptions.join(", ")}`);
if (unexpectedResponses.length) failures.push(`HTTP errors: ${JSON.stringify(unexpectedResponses)}`);

socket.close();

const result = {
  ok: failures.length === 0,
  checks: checkCount,
  failures,
  browserExceptions: exceptions,
  badResponses: unexpectedResponses,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
