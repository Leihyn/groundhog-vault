import { writeFile } from "node:fs/promises";

const [debugOrigin, appUrl, outputPath, widthArg = "1440", heightArg = "1200"] = process.argv.slice(2);

if (!debugOrigin || !appUrl || !outputPath) {
  throw new Error("Usage: node scripts/capture-ui.mjs <debug-origin> <app-url> <output-path> [width] [height]");
}

const tabs = await fetch(`${debugOrigin}/json`).then((response) => response.json());
const tab = tabs.find((candidate) => candidate.type === "page");
if (!tab) throw new Error("No debuggable Chrome page found");

const socket = new WebSocket(tab.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(widthArg),
  height: Number(heightArg),
  deviceScaleFactor: 1,
  mobile: Number(widthArg) <= 540,
});
await send("Page.navigate", { url: appUrl });
await waitFor("document.readyState === 'complete'");
await evaluate("document.querySelector('#enter-arena').click()");
await evaluate("document.querySelector('#advance-life').click()");
await waitFor("document.body.dataset.step === 'life-one' && document.body.dataset.phase === 'success'");
await evaluate("document.querySelector('#advance-life').click()");
await waitFor("document.body.dataset.step === 'ready-two' && document.body.dataset.phase === 'ready'");
await evaluate("document.querySelector('#advance-life').click()");
await waitFor("document.body.dataset.step === 'life-two' && document.body.dataset.phase === 'success'");

const summary = await evaluate(`JSON.stringify({
  step: document.body.dataset.step,
  phase: document.body.dataset.phase,
  life: document.querySelector('#metric-life').textContent,
  groundhogAllocation: document.querySelector('#groundhog-allocation').textContent,
  amnesiacAllocation: document.querySelector('#amnesiac-allocation').textContent,
  memoryLift: document.querySelector('#memory-lift').textContent,
  horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
})`);

const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
socket.close();
process.stdout.write(`${summary}\n`);
