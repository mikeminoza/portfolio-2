/*
 * Runs visitor JavaScript against a problem's test cases.
 *
 * Served from /public rather than a blob: URL — a blob worker has an opaque
 * origin, and importScripts from one is blocked, which the Python runner
 * beside this file depends on. Same-origin workers keep both paths uniform.
 */
self.onmessage = (event) => {
  const { code, entry, tests } = event.data;
  let solution;

  try {
    solution = new Function(
      code + "\nreturn typeof " + entry + " === 'function' ? " + entry + " : null;",
    )();
  } catch (error) {
    self.postMessage({ type: "error", message: String(error) });
    return;
  }

  if (!solution) {
    self.postMessage({
      type: "error",
      message: "No function named '" + entry + "' was defined.",
    });
    return;
  }

  const results = tests.map((test) => {
    try {
      // Copy the arguments so a mutating solution can't corrupt later cases.
      const value = solution(...JSON.parse(JSON.stringify(test.args)));
      return { json: JSON.stringify(value === undefined ? null : value) };
    } catch (error) {
      return { error: String(error) };
    }
  });

  self.postMessage({ type: "done", results });
};
