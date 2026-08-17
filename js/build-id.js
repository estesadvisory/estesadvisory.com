/**
 * Progressive enhancement for .ea-build-id stamps.
 * Machine: data-built-utc + <time datetime>
 * Human: locale wall clock (en-US, 12h, with seconds)
 * Spec: portfolio-ops docs/BUILD_IDENTITY.md
 */
(function () {
  function formatLocal(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }

  function enhance(root) {
    var utc = root.getAttribute("data-built-utc");
    if (!utc) return;
    var human = formatLocal(utc);
    if (!human) return;
    var timeEl = root.querySelector(".ea-build-id__time, time");
    if (timeEl) {
      timeEl.textContent = human;
      timeEl.setAttribute("data-display", "local");
    }
  }

  function run() {
    document.querySelectorAll(".ea-build-id").forEach(enhance);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
