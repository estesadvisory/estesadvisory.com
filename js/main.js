/**
 * Estes Advisory — site interactions
 */
(function () {
  "use strict";

  window.ESTES_CONFIG = {
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
  const sectionIds = ["about", "services", "approach", "partners", "contact"];
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
})();
