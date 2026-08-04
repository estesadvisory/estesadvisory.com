/**
 * Estes Advisory — site interactions
 * Cal.com embed config lives here so one place updates for S3 deploys.
 */
(function () {
  "use strict";

  // ── Config (swap when your Cal.com event is live) ─────────────────
  window.ESTES_CONFIG = {
    calLink: "estesadvisory/intro", // e.g. username/event-slug
    calTheme: "light",
    email: "mike@estesadvisory.com",
    phoneDisplay: "+1 415.530.8743",
    phoneHref: "tel:+14155308743",
  };

  // ── Mobile nav ────────────────────────────────────────────────────
  const toggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      const open = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      const label = toggle.querySelector(".sr-only");
      if (label) label.textContent = open ? "Close menu" : "Open menu";
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ── Active section highlighting for hash nav ──────────────────────
  const sectionIds = ["about", "services", "approach", "partners", "book", "contact"];
  const navLinks = document.querySelectorAll('.nav-desktop a[href^="#"], .mobile-nav a[href^="#"]');

  function setCurrentFromHash() {
    const hash = (location.hash || "").replace("#", "");
    navLinks.forEach(function (a) {
      const id = (a.getAttribute("href") || "").replace("#", "");
      if (id && id === hash) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  window.addEventListener("hashchange", setCurrentFromHash);
  setCurrentFromHash();

  // Optional: highlight while scrolling
  if ("IntersectionObserver" in window) {
    const map = {};
    navLinks.forEach(function (a) {
      const id = (a.getAttribute("href") || "").replace("#", "");
      if (id) map[id] = a;
    });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          if (!map[id]) return;
          navLinks.forEach(function (a) {
            a.removeAttribute("aria-current");
          });
          // only desktop gets aria-current from scroll to avoid noise
          document.querySelectorAll('.nav-desktop a[href="#' + id + '"]').forEach(function (a) {
            a.setAttribute("aria-current", "page");
          });
        });
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: 0.01 }
    );

    sectionIds.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  // ── Cal.com inline embed ──────────────────────────────────────────
  function initCal() {
    const mount = document.getElementById("cal-inline");
    if (!mount) return;

    const link = window.ESTES_CONFIG.calLink;
    const theme = window.ESTES_CONFIG.calTheme || "light";

    // Official Cal.com embed pattern
    (function (C, A, L) {
      var p = function (a, ar) {
        a.q.push(ar);
      };
      var d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          var cal = C.Cal;
          var ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            var api = function () {
              p(api, arguments);
            };
            var namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    try {
      Cal("init", { origin: "https://cal.com" });
      Cal("inline", {
        elementOrSelector: "#cal-inline",
        calLink: link,
        layout: "month_view",
        config: {
          theme: theme,
        },
      });
      Cal("ui", {
        theme: theme,
        styles: {
          branding: { brandColor: "#2a6a94" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    } catch (err) {
      console.warn("Cal.com embed deferred:", err);
      showCalFallback(mount, link);
    }

    // If embed fails silently, show fallback after a delay
    setTimeout(function () {
      if (mount.childElementCount === 0) {
        showCalFallback(mount, link);
      }
    }, 4000);
  }

  function showCalFallback(mount, link) {
    if (mount.dataset.fallback === "1") return;
    mount.dataset.fallback = "1";
    const url = "https://cal.com/" + link;
    mount.innerHTML =
      '<div class="cal-fallback">' +
      '<p class="label">Scheduling</p>' +
      "<p>Open the booking calendar to pick a time that works for you.</p>" +
      '<a class="btn btn-primary btn-lg" href="' +
      url +
      '" target="_blank" rel="noopener noreferrer">Book on Cal.com</a>' +
      '<p style="font-size:0.8rem;color:var(--ink-subtle)">Or email <a href="mailto:mike@estesadvisory.com">mike@estesadvisory.com</a></p>' +
      "</div>";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCal);
  } else {
    initCal();
  }
})();
