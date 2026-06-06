/// <reference lib="webworker" />
// Pyodide Web Worker — isolates Python execution so the UI never freezes.
// Communicates via postMessage. Parent can `terminate()` on timeout.

declare const self: DedicatedWorkerGlobalScope & {
  loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
  importScripts: (...urls: string[]) => void;
};

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodide: any = null;

async function ensureRuntime() {
  if (pyodide) return pyodide;
  self.postMessage({ type: "progress", msg: "Tải Pyodide runtime (~6MB)..." });
  self.importScripts(`${PYODIDE_INDEX}pyodide.js`);
  pyodide = await self.loadPyodide!({ indexURL: PYODIDE_INDEX });
  self.postMessage({ type: "progress", msg: "Tải numpy, pandas, matplotlib..." });
  await pyodide.loadPackage(["numpy", "pandas", "matplotlib"]);
  self.postMessage({ type: "progress", msg: "Khởi tạo backend Agg..." });
  await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import io, base64
def __collect_figs():
    out = []
    for n in plt.get_fignums():
        f = plt.figure(n)
        buf = io.BytesIO()
        f.savefig(buf, format="png", dpi=130, bbox_inches="tight",
                  facecolor="#0b1120", edgecolor="none")
        out.append("data:image/png;base64," + base64.b64encode(buf.getvalue()).decode())
        plt.close(f)
    return out
plt.rcParams.update({
    "axes.facecolor":  "#0f172a",
    "figure.facecolor":"#0b1120",
    "axes.edgecolor":  "#334155",
    "axes.labelcolor": "#cbd5e1",
    "xtick.color":     "#94a3b8",
    "ytick.color":     "#94a3b8",
    "axes.titlecolor": "#e2e8f0",
    "grid.color":      "#1e293b",
    "text.color":      "#e2e8f0",
})
`);
  return pyodide;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, code, ctx } = e.data || {};
  if (type !== "run") return;

  try {
    const py = await ensureRuntime();

    py.globals.set("symbol", ctx?.symbol ?? "");
    py.globals.set("closes", py.toPy(ctx?.closes ?? []));
    py.globals.set("returns", py.toPy(ctx?.returns ?? []));
    py.globals.set("current_price", ctx?.currentPrice ?? null);

    let buf = "";
    py.setStdout({ batched: (s: string) => { buf += s + "\n"; } });
    py.setStderr({ batched: (s: string) => { buf += s + "\n"; } });

    self.postMessage({ type: "progress", msg: "Đang chạy Python..." });

    await py.runPythonAsync(`metrics = None`);
    await py.runPythonAsync(code);

    const figsProxy = await py.runPythonAsync(`__collect_figs()`);
    const figs: string[] = figsProxy.toJs();
    figsProxy.destroy?.();

    let metrics: Record<string, any> | null = null;
    const mProxy = py.globals.get("metrics");
    if (mProxy && typeof mProxy.toJs === "function") {
      const js = mProxy.toJs({ dict_converter: Object.fromEntries });
      if (js && typeof js === "object") metrics = js;
      mProxy.destroy?.();
    }

    self.postMessage({ type: "done", stdout: buf.trim(), figures: figs, metrics });
  } catch (err: any) {
    self.postMessage({ type: "error", message: String(err?.message || err) });
  }
};
