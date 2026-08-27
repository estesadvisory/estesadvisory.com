/* Portfolio ops dashboard — client-side charts + markdown. No cookies. */
(function () {
  "use strict";

  const MANIFEST_URL = "data/manifest.json";
  const palette = [
    "#3d8bfd", "#3dd68c", "#f0b429", "#f07178", "#c792ea",
    "#89ddff", "#ffcb6b", "#82aaff", "#c3e88d", "#ff9cac",
  ];

  const els = {
    weekSelect: document.getElementById("week-select"),
    status: document.getElementById("status-pill"),
    kpis: document.getElementById("kpis"),
    reportMd: document.getElementById("report-md"),
    reportSource: document.getElementById("report-source"),
    generatedAt: document.getElementById("generated-at"),
    repoTableBody: document.querySelector("#repo-table tbody"),
  };

  function newestFirst(weeks) {
    return weeks.slice().sort(function (a, b) {
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }

  function hoursSince(iso) {
    var then = Date.parse(iso);
    if (!iso || isNaN(then)) return null;
    return Math.max(0, (Date.now() - then) / 36e5);
  }

  function formatHoursSince(h) {
    if (h == null) return "";
    if (h < 1) return Math.round(h * 60) + "m since collect";
    if (h < 48) return (Math.round(h * 10) / 10) + "h since collect";
    return Math.round(h / 24) + "d since collect";
  }


  /** @type {Record<string, import('chart.js').Chart>} */
  const charts = {};

  function setStatus(text, kind) {
    els.status.textContent = text;
    els.status.className = "pill " + (kind === "ok" ? "pill-ok" : kind === "err" ? "pill-err" : "pill-muted");
  }

  function destroyChart(key) {
    if (charts[key]) {
      charts[key].destroy();
      delete charts[key];
    }
  }

  function fmt(n) {
    if (n == null || Number.isNaN(n)) return "—";
    return Number(n).toLocaleString();
  }

  function sumCategories(repos) {
    const totals = {};
    for (const r of Object.values(repos || {})) {
      const cats = (r.github && r.github.closed_by_category) || {};
      for (const [k, v] of Object.entries(cats)) {
        totals[k] = (totals[k] || 0) + (Number(v) || 0);
      }
    }
    return totals;
  }

  function aggregate(data) {
    const repos = data.repos || {};
    let commits = 0;
    let created = 0;
    let closed = 0;
    let prs = 0;
    let open = 0;
    const byRepo = [];

    for (const [name, r] of Object.entries(repos)) {
      const c = (r.git && r.git.commits_window) || 0;
      const ic = (r.github && r.github.issues_created_week) || 0;
      const ix = (r.github && r.github.issues_closed_week) || 0;
      const pm = (r.github && r.github.prs_merged_week) || 0;
      const io = (r.github && r.github.issues_open) || 0;
      commits += c;
      created += ic;
      closed += ix;
      prs += pm;
      open += io;
      byRepo.push({ name, commits: c, created: ic, closed: ix, prs: pm, open: io });
    }
    byRepo.sort((a, b) => b.commits - a.commits);
    return {
      commits,
      created,
      closed,
      prs,
      open,
      byRepo,
      categories: sumCategories(repos),
      week: data.windows && data.windows.calendar_week,
      generatedAt: data.generated_at,
      reportId: data.report_id,
    };
  }

  function renderKpis(agg) {
    const items = [
      { label: "Commits", value: agg.commits },
      { label: "Issues created", value: agg.created },
      { label: "Issues closed", value: agg.closed },
      { label: "PRs merged", value: agg.prs },
      { label: "Issues open", value: agg.open },
      { label: "Repos", value: agg.byRepo.length },
    ];
    els.kpis.innerHTML = items
      .map(
        (i) =>
          `<div class="kpi"><div class="label">${i.label}</div><div class="value">${fmt(i.value)}</div></div>`
      )
      .join("");
  }

  function renderTable(byRepo) {
    els.repoTableBody.innerHTML = byRepo
      .map(
        (r) => `<tr>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td class="num">${fmt(r.commits)}</td>
          <td class="num">${fmt(r.created)}</td>
          <td class="num">${fmt(r.closed)}</td>
          <td class="num">${fmt(r.prs)}</td>
          <td class="num">${fmt(r.open)}</td>
        </tr>`
      )
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function barChart(canvasId, key, labels, values, label) {
    destroyChart(key);
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === "undefined") return;
    charts[key] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            backgroundColor: labels.map((_, i) => palette[i % palette.length]),
            borderRadius: 6,
            maxBarThickness: 42,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: { color: "#8b9bb0", maxRotation: 45, minRotation: 0 },
            grid: { color: "rgba(42,53,68,0.6)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#8b9bb0", precision: 0 },
            grid: { color: "rgba(42,53,68,0.6)" },
          },
        },
      },
    });
  }

  function doughnutChart(canvasId, key, labels, values) {
    destroyChart(key);
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === "undefined") return;
    charts[key] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((_, i) => palette[i % palette.length]),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: { color: "#c5d0de", boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    });
  }

  function renderCharts(agg) {
    barChart(
      "chart-commits",
      "commits",
      agg.byRepo.map((r) => r.name),
      agg.byRepo.map((r) => r.commits),
      "Commits"
    );
    barChart(
      "chart-prs",
      "prs",
      agg.byRepo.map((r) => r.name),
      agg.byRepo.map((r) => r.prs),
      "PRs merged"
    );
    const catEntries = Object.entries(agg.categories).sort((a, b) => b[1] - a[1]);
    doughnutChart(
      "chart-categories",
      "cats",
      catEntries.map((e) => e[0]),
      catEntries.map((e) => e[1])
    );
  }

  async function loadMarkdown(path) {
    els.reportSource.textContent = path;
    try {
      const res = await fetch(path, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      if (typeof marked !== "undefined") {
        marked.setOptions({ gfm: true, breaks: false });
        els.reportMd.innerHTML = marked.parse(text);
      } else {
        els.reportMd.innerHTML = "<pre>" + escapeHtml(text) + "</pre>";
      }
    } catch (err) {
      els.reportMd.innerHTML =
        '<div class="error-box">Could not load report markdown: ' +
        escapeHtml(err.message) +
        "</div>";
    }
  }

  async function loadWeek(entry) {
    setStatus("Loading " + entry.id + "…", "muted");
    try {
      const res = await fetch(entry.json, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error("JSON HTTP " + res.status);
      const data = await res.json();
      const agg = aggregate(data);
      renderKpis(agg);
      renderTable(agg.byRepo);
      renderCharts(agg);
      if (agg.generatedAt) {
        els.generatedAt.setAttribute("data-generated-utc", agg.generatedAt);
        var age = formatHoursSince(hoursSince(agg.generatedAt));
        els.generatedAt.textContent =
          "scoreboard data " + agg.generatedAt + (age ? " · " + age : "");
        els.generatedAt.title =
          "Scoreboard JSON generated_at (UTC). Living issue board is OPS_BOARD.md, not this chart.";
        document.dispatchEvent(new Event("ea-data-freshness"));
      } else {
        els.generatedAt.textContent = "";
        els.generatedAt.removeAttribute("data-generated-utc");
      }
      if (entry.md) await loadMarkdown(entry.md);
      else els.reportMd.innerHTML = "<p class='muted'>No markdown report for this week.</p>";
      setStatus(entry.id + " · ready", "ok");
    } catch (err) {
      setStatus("Error", "err");
      els.kpis.innerHTML =
        '<div class="error-box" style="grid-column:1/-1">Failed to load scoreboard: ' +
        escapeHtml(err.message) +
        "</div>";
    }
  }

  async function init() {
    try {
      const res = await fetch(MANIFEST_URL, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error("manifest HTTP " + res.status);
      const manifest = await res.json();
      const weeks = newestFirst(manifest.weeks || []);
      if (!weeks.length) throw new Error("manifest has no weeks");

      els.weekSelect.innerHTML = weeks
        .map((w) => `<option value="${escapeHtml(w.id)}">${escapeHtml(w.label || w.id)}</option>`)
        .join("");
      els.weekSelect.value = weeks[0].id;

      els.weekSelect.addEventListener("change", () => {
        const w = weeks.find((x) => x.id === els.weekSelect.value);
        if (w) loadWeek(w);
      });

      await loadWeek(weeks[0]);
    } catch (err) {
      setStatus("Manifest error", "err");
      els.kpis.innerHTML =
        '<div class="error-box" style="grid-column:1/-1">' +
        escapeHtml(err.message) +
        ". Run <code>make ops-data</code> then redeploy.</div>";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
