/* =========================================================
   Chef Jay LeSoul Catering - site script (v2)
   Vanilla JS, no dependencies.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initDrawer();
    initMosaic();
    initBadgeVideo();
    initReveal();
    initOrderTabs();
    initFaq();
    initFormValidation();
    initQuantityBoxes();
    initGallery();
    initMobileBar();
    initBackToTop();
    initFooterYear();
  });

  /* ---------------- Header: transparent over home hero, solid on scroll ---------------- */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function update() { header.classList.toggle("is-solid", window.scrollY > 30); }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------------- Mobile full-screen menu ---------------- */
  function initDrawer() {
    var toggle = document.querySelector(".nav-toggle");
    var drawer = document.querySelector(".nav-drawer");
    if (!toggle || !drawer) return;

    function setOpen(open) {
      drawer.classList.toggle("open", open);
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.classList.toggle("nav-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    }
    toggle.addEventListener("click", function () { setOpen(!drawer.classList.contains("open")); });
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 992) setOpen(false); });
  }

  /* ---------------- Hero triangle mosaic ---------------- */
  function initMosaic() {
    var mosaic = document.querySelector("[data-mosaic]");
    if (!mosaic) return;

    // Assemble on load (one orchestrated moment)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { mosaic.classList.add("is-in"); });
    });
    if (reduceMotion) return;

    // Then quietly swap a photo every few seconds
    var tiles = Array.prototype.slice.call(mosaic.querySelectorAll(".tri:not(.gold):not(.red)"));
    var base = mosaic.getAttribute("data-pool") || "";
    var dir = "assets/images/";
    var extra = base.split(",").map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) { return dir + s; });
    if (!tiles.length) return;

    function currentSrcs() {
      return tiles.map(function (t) { var i = t.querySelector("img"); return i ? i.getAttribute("src") : ""; });
    }
    var all = currentSrcs().concat(extra);
    var last = -1;

    function swap() {
      if (document.hidden) return;
      var shown = currentSrcs();
      var candidates = all.filter(function (s) { return shown.indexOf(s) === -1; });
      var idx;
      do { idx = Math.floor(Math.random() * tiles.length); } while (idx === last && tiles.length > 1);
      last = idx;
      var tile = tiles[idx];
      var oldImg = tile.querySelector("img");
      var next;
      if (candidates.length) {
        next = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        // Nothing unused: trade photos with another tile
        var other = tiles[(idx + 3) % tiles.length].querySelector("img");
        next = other.getAttribute("src");
      }
      var img = new Image();
      img.alt = "";
      img.className = "is-fading";
      img.onload = function () {
        tile.appendChild(img);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { img.classList.remove("is-fading"); });
        });
        setTimeout(function () { if (oldImg && oldImg.parentNode) oldImg.parentNode.removeChild(oldImg); }, 1500);
      };
      img.src = next;
    }
    setTimeout(function () { setInterval(swap, 2600); }, 2400);
  }

  /* ---------------- Circular seasoning video ---------------- */
  function initBadgeVideo() {
    document.querySelectorAll(".spin-badge video").forEach(function (v) {
      if (reduceMotion) { v.removeAttribute("autoplay"); v.pause(); return; }
      // Only play while on screen (saves battery on phones)
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
            else v.pause();
          });
        }, { threshold: 0.2 }).observe(v);
      }
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Order page tabs + deep links ---------------- */
  function initOrderTabs() {
    var tabs = document.querySelectorAll("[data-order-tab]");
    var panels = document.querySelectorAll("[data-order-panel]");
    if (!tabs.length) return;

    function activate(name) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-order-tab") === name;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-order-panel") === name); });
    }
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { activate(tab.getAttribute("data-order-tab")); });
    });

    var hash = window.location.hash.replace("#", "");
    if (hash === "seasoning" || hash === "catering") activate(hash);

    // Pre-fill from links like order.html?package=corporate or ?qty=3#seasoning
    var params = new URLSearchParams(window.location.search);
    var pkg = params.get("package");
    var pkgSelect = document.getElementById("c-package");
    if (pkg && pkgSelect && pkgSelect.querySelector('option[value="' + pkg + '"]')) pkgSelect.value = pkg;
    var qty = parseInt(params.get("qty"), 10);
    var qtySelect = document.getElementById("s-qty");
    if (qty && qtySelect) qtySelect.value = qty >= 6 ? "6" : qty >= 3 ? "3" : "1";
  }

  /* ---------------- FAQ accordion ---------------- */
  function initFaq() {
    var items = document.querySelectorAll(".faq-item");
    items.forEach(function (item) {
      var btn = item.querySelector(".faq-q");
      var answer = item.querySelector(".faq-a");
      btn.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        items.forEach(function (o) {
          o.classList.remove("open");
          o.querySelector(".faq-a").style.maxHeight = null;
          o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("open");
          answer.style.maxHeight = answer.scrollHeight + "px";
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ---------------- Quantity stepper (shop) ---------------- */
  function initQuantityBoxes() {
    document.querySelectorAll("[data-qty-box]").forEach(function (box) {
      var input = box.querySelector("input");
      var min = parseInt(input.getAttribute("min") || "1", 10);
      var max = parseInt(input.getAttribute("max") || "99", 10);
      var link = document.querySelector("[data-order-link]");
      function sync() { if (link) link.setAttribute("href", "order.html?qty=" + input.value + "#seasoning"); }
      box.querySelector("[data-qty-minus]").addEventListener("click", function () {
        input.value = Math.max(min, (parseInt(input.value, 10) || min) - 1); sync();
      });
      box.querySelector("[data-qty-plus]").addEventListener("click", function () {
        input.value = Math.min(max, (parseInt(input.value, 10) || min) + 1); sync();
      });
      input.addEventListener("change", sync);
      sync();
    });
  }

  /* ---------------- Form validation ---------------- */
  function initFormValidation() {
    document.querySelectorAll("form[data-validate]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var valid = true, firstBad = null;
        form.querySelectorAll("[required]").forEach(function (input) {
          var field = input.closest(".field");
          var value = input.value.trim();
          var ok = value.length > 0;
          if (input.type === "email" && value) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          if (input.type === "tel" && value) ok = value.replace(/\D/g, "").length >= 10;
          if (field) field.classList.toggle("invalid", !ok);
          if (!ok) { valid = false; if (!firstBad) firstBad = input; }
        });
        if (!valid) { firstBad.focus(); return; }

        var success = form.parentElement.querySelector(".form-success");
        if (success) { success.classList.add("show"); success.scrollIntoView({ behavior: "smooth", block: "center" }); }
        form.reset();
        // INTEGRATION: post `new FormData(form)` to your form service
        // (Formspree, Netlify Forms, or your own endpoint) here.
      });
      form.querySelectorAll("[required]").forEach(function (input) {
        input.addEventListener("input", function () {
          var f = input.closest(".field"); if (f) f.classList.remove("invalid");
        });
      });
    });
  }

  /* ---------------- Gallery: filters + lightbox with swipe ---------------- */
  function initGallery() {
    var grid = document.querySelector("[data-gallery]");
    if (!grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll(".g-item"));
    var buttons = document.querySelectorAll("[data-filter]");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        items.forEach(function (it) {
          it.classList.toggle("is-hidden", f !== "all" && it.getAttribute("data-cat") !== f);
        });
      });
    });

    var lb = document.querySelector(".lightbox");
    if (!lb) return;
    var img = lb.querySelector("[data-lb-img]");
    var cap = lb.querySelector("[data-lb-cap]");
    var count = lb.querySelector("[data-lb-count]");
    var visible = [], index = 0, lastFocus = null;

    function show(i) {
      index = (i + visible.length) % visible.length;
      var it = visible[index];
      img.src = it.getAttribute("data-full");
      img.alt = it.getAttribute("data-caption");
      cap.textContent = it.getAttribute("data-caption");
      count.textContent = (index + 1) + " / " + visible.length;
    }
    function open(it) {
      visible = items.filter(function (x) { return !x.classList.contains("is-hidden"); });
      lastFocus = it;
      show(visible.indexOf(it));
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    items.forEach(function (it) { it.addEventListener("click", function () { open(it); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(index - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(index + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });

    // Swipe left/right on phones
    var startX = 0, startY = 0;
    lb.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    }, { passive: true });
  }

  /* ---------------- Sticky mobile action bar ---------------- */
  function initMobileBar() {
    var bar = document.querySelector(".mobile-bar");
    if (!bar) return;
    function update() { bar.classList.toggle("show", window.scrollY > 380); }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------------- Back to top ---------------- */
  function initBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () { btn.classList.toggle("show", window.scrollY > 900); }, { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
  }

  function initFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
