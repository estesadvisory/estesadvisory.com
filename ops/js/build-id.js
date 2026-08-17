/**
 * Progressive enhancement for .ea-build-id stamps.
 * Spec: https://github.com/estesadvisory/portfolio-ops/blob/main/docs/BUILD_IDENTITY.md
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

  function enhanceBuildId(root) {
    var utc = root.getAttribute("data-built-utc");
    if (!utc) {
      // Parse from BUILD_ID text: "rev abc · v2026.8.17.1915 · 2026-08-17T19:15:24Z"
      var line = root.textContent || "";
      var m = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
      if (m) {
        utc = m[1];
        root.setAttribute("data-built-utc", utc);
      }
    }
    if (!utc) return;
    var human = formatLocal(utc);
    if (!human) return;
    var lineEl = root.querySelector(".ea-build-id__line") || root;
    var rev = root.getAttribute("data-rev");
    var ver = root.getAttribute("data-version");
    // If attributes empty, try parse from text
    if (!rev || rev === "unknown") {
      var rm = (root.textContent || "").match(/rev\s+([0-9a-f]{7})/i);
      if (rm) {
        rev = rm[1];
        root.setAttribute("data-rev", rev);
      }
    }
    if (!ver) {
      var vm = (root.textContent || "").match(/v(\d+\.\d+\.\d+\.\d+)/);
      if (vm) {
        ver = vm[1];
        root.setAttribute("data-version", ver);
      }
    }
    var prefix = lineEl.textContent.trim().toLowerCase().indexOf("page") === 0 ? "page " : "";
    lineEl.innerHTML =
      prefix +
      "rev " +
      (rev || "?") +
      (ver ? " · v" + ver : "") +
      " · " +
      human;
  }

  function enhanceDataFreshness(el) {
    var utc = el.getAttribute("data-generated-utc");
    if (!utc) return;
    var human = formatLocal(utc);
    if (human) {
      el.textContent = "data " + human + " UTC-source " + utc;
      // Prefer clean human line; keep machine in data attr + title
      el.textContent = "data " + human;
      el.title = "Data generated (UTC): " + utc;
    }
  }

  function run() {
    document.querySelectorAll(".ea-build-id").forEach(enhanceBuildId);
    document.querySelectorAll(".ea-data-freshness").forEach(enhanceDataFreshness);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  // Re-run when dashboard sets data-generated-utc
  document.addEventListener("ea-data-freshness", run);
})();
