/**
 * Estes Advisory — site interactions
 */
(function () {
  "use strict";

  // ── Mobile nav ────────────────────────────────────────────────────
  const toggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  let lastFocus = null;

  function setMenuOpen(open) {
    if (!toggle || !mobileNav) return;
    mobileNav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
    const label = toggle.querySelector(".sr-only");
    if (label) label.textContent = open ? "Close menu" : "Open menu";

    if (open) {
      lastFocus = document.activeElement;
      const first = mobileNav.querySelector("a, button");
      if (first) first.focus();
    } else if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
      lastFocus = null;
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      const open = !mobileNav.classList.contains("open");
      setMenuOpen(open);
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) {
        e.preventDefault();
        closeMenu();
        toggle.focus();
      }
    });

    // Basic focus trap while mobile menu is open
    mobileNav.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !mobileNav.classList.contains("open")) return;
      const focusable = mobileNav.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // ── Privacy toast (no storage; auto-dismiss; never traps focus) ───
  (function initPrivacyToast() {
    // Skip pure redirect helper pages
    if (!document.getElementById("main")) return;

    const toast = document.createElement("div");
    toast.className = "privacy-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    toast.innerHTML =
      '<p>No cookies or trackers on this site. <a href="#privacy">Privacy</a></p>' +
      '<button type="button" class="privacy-toast-dismiss" aria-label="Dismiss">' +
      "×</button>";

    document.body.appendChild(toast);

    const dismissBtn = toast.querySelector(".privacy-toast-dismiss");
    let hideTimer = null;
    let removed = false;

    function removeToast() {
      if (removed) return;
      removed = true;
      if (hideTimer) window.clearTimeout(hideTimer);
      toast.classList.remove("is-visible");
      toast.classList.add("is-leaving");
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }

    // Show after a short delay so it is not the first thing you fight
    window.setTimeout(function () {
      if (removed) return;
      toast.classList.add("is-visible");
      hideTimer = window.setTimeout(removeToast, 7000);
    }, 1200);

    if (dismissBtn) {
      dismissBtn.addEventListener("click", function (e) {
        e.preventDefault();
        removeToast();
      });
    }
  })();

  // ── Active section highlighting for hash nav ──────────────────────
  const sectionIds = [
    "about",
    "services",
    "approach",
    "engagements",
    "partners",
    "contact",
    "privacy",
  ];
  const navLinks = document.querySelectorAll(
    '.nav-desktop a[href^="#"], .mobile-nav a[href^="#"]'
  );

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
          document
            .querySelectorAll(
              '.nav-desktop a[href="#' + id + '"], .mobile-nav a[href="#' + id + '"]'
            )
            .forEach(function (a) {
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
