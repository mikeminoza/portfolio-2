/*
 * Runs visitor Python by loading Pyodide (CPython on WebAssembly).
 *
 * This is a MODULE worker, and that is not incidental: Pyodide 314 refuses to
 * initialise in a classic worker ("Classic web workers are not supported"), so
 * `importScripts` of pyodide.js cannot work. The ESM build loaded through a
 * dynamic import is the supported path.
 *
 * The runtime is several megabytes, so it is fetched on first use and the
 * worker is kept alive between runs.
 */
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

let ready;

async function boot() {
  const { loadPyodide } = await import(PYODIDE_URL);
  return loadPyodide();
}

self.onmessage = async (event) => {
  const { code, entry, tests } = event.data;

  try {
    ready = ready || boot();
    const py = await ready;

    py.globals.set("__cases", py.toPy(tests.map((t) => t.args)));

    const program = [
      "import json, traceback",
      code,
      "__out = []",
      "for __args in __cases:",
      "    try:",
      "        __value = " + entry + "(*__args)",
      "        __out.append({'json': json.dumps(__value)})",
      "    except Exception as __e:",
      "        __out.append({'error': traceback.format_exception_only(type(__e), __e)[-1].strip()})",
      "json.dumps(__out)",
    ].join("\n");

    self.postMessage({ type: "done", results: JSON.parse(py.runPython(program)) });
  } catch (error) {
    self.postMessage({ type: "error", message: String(error) });
  }
};
