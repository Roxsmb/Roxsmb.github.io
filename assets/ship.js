/* ==========================================================================
   ship.js — room camera, power state, fault sparks
   No dependencies. Everything degrades to a static, readable page.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rooms = Array.prototype.slice.call(document.querySelectorAll(".room"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("main > section[data-room]"));
  var byRoom = {};
  rooms.forEach(function (r) { byRoom[r.getAttribute("data-room")] = r; });

  /* ---------- compartment crossfade ---------------------------------- */
  var live = null;
  function setRoom(name) {
    if (!name || name === live) return;
    live = name;
    rooms.forEach(function (r) { r.classList.toggle("is-live", r === byRoom[name]); });
    document.body.setAttribute("data-room", name);
  }

  /* ---------- power arrives with the scroll --------------------------- */
  var awake = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-awake");
          setRoom(e.target.getAttribute("data-room"));
          awake.unobserve(e.target);
        });
      }, { threshold: 0.12, rootMargin: "-8% 0px -18% 0px" })
    : null;

  sections.forEach(function (s) {
    if (awake) awake.observe(s);
    else { s.classList.add("is-awake"); setRoom(s.getAttribute("data-room")); }
  });

  /* the hero is on before you touch anything */
  var hero = document.querySelector(".hero");
  if (hero) { hero.classList.add("is-awake"); setRoom(hero.getAttribute("data-room")); }

  /* ---------- parallax ------------------------------------------------ */
  var ticking = false;
  function drift() {
    ticking = false;
    if (reduce) return;
    var y = window.pageYOffset || 0;
    var dy = (-y * 0.014).toFixed(1) + "px";
    var dy2 = (-y * 0.03).toFixed(1) + "px";
    rooms.forEach(function (r) { r.style.setProperty("--dy", dy); });
    document.querySelectorAll(".ship-cables").forEach(function (c) {
      c.style.setProperty("--dy2", dy2);
    });
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(drift); }
  }, { passive: true });
  drift();

  /* ---------- rail selector dial -------------------------------------- */
  var rail = document.getElementById("rail");
  var dial = document.getElementById("rail-dial");
  var posLabel = document.getElementById("rail-pos");
  var select = document.getElementById("rail-next");

  if (rail && dial) {
    var step = 0;
    function measure() {
      var card = rail.querySelector(".card");
      if (!card) return 400;
      var gap = parseFloat(getComputedStyle(rail).columnGap || "12") || 12;
      step = card.getBoundingClientRect().width + gap;
    }
    var syncTicking = false;
    function syncDial() {
      syncTicking = false;
      measure();
      var count = rail.querySelectorAll(".card:not([data-clone])").length || 4;
      var origin = parseFloat(rail.dataset.snapBase || "0") || 0;
      var index = step ? Math.round((rail.scrollLeft - origin) / step) : 0;
      index = ((index % count) + count) % count;
      dial.style.setProperty("--turn", (index * 45) + "deg");
      if (posLabel) posLabel.textContent = ("0" + (index + 1)).slice(-2);
      /* the name repeats the visible "01 / 06" readout: a screen reader user
         gets the same position the dial shows */
      if (select) select.setAttribute("aria-label", "Next project: " + ("0" + (index + 1)).slice(-2) + " / " + ("0" + count).slice(-2));
    }
    rail.addEventListener("scroll", function () {
      if (!syncTicking) { syncTicking = true; requestAnimationFrame(syncDial); }
    }, { passive: true });
    window.addEventListener("resize", syncDial);
    syncDial();

    /* a small mechanical kick when the selector is pressed */
    if (select) {
      select.addEventListener("pointerdown", function () { select.classList.add("is-turning"); });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
        select.addEventListener(ev, function () { select.classList.remove("is-turning"); });
      });
    }
  }

  /* ---------- lights in the dark --------------------------------------- */
  var ship = document.querySelector(".ship");
  if (ship && !reduce) {
    var PALETTE = ["255, 186, 116", "255, 152, 88", "132, 236, 172", "200, 214, 222"];
    var pick = function () { return PALETTE[Math.floor(Math.random() * PALETTE.length)]; };
    var span = function (a, b) { return a + Math.random() * (b - a); };

    var spawn = function () {
      var kind = Math.random() < 0.36 ? "blink" : "glow";
      var el = document.createElement("span");
      el.className = "light light--" + kind;
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("--x", span(3, 97).toFixed(2) + "%");
      el.style.setProperty("--y", span(5, 95).toFixed(2) + "%");
      el.style.setProperty("--l", pick());

      var life;
      if (kind === "blink") {
        el.style.setProperty("--s", Math.round(span(40, 90)) + "px");
        life = 1600 + Math.random() * 1600;
      } else {
        el.style.setProperty("--s", Math.round(span(420, 900)) + "px");
        life = 2000 + Math.random() * 2800;
      }
      el.style.setProperty("--d", (life / 1000).toFixed(2) + "s");

      ship.appendChild(el);
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, life + 500);

      /* now and then a second light answers across the room */
      if (Math.random() < 0.18) window.setTimeout(spawn, 140 + Math.random() * 320);
    };

    (function loop() {
      window.setTimeout(function () { spawn(); loop(); }, 850 + Math.random() * 2300);
    })();
  }

  /* ---------- brownouts: the deck loses power for a heartbeat ---------- */
  if (!reduce) {
    (function brownout() {
      var gap = 16000 + Math.random() * 22000;
      window.setTimeout(function () {
        document.body.classList.add("is-brownout");
        var len = 260 + Math.random() * 620;
        window.setTimeout(function () {
          document.body.classList.remove("is-brownout");
          /* sometimes it comes back badly */
          if (Math.random() < 0.45) {
            window.setTimeout(function () {
              document.body.classList.add("is-brownout");
              window.setTimeout(function () { document.body.classList.remove("is-brownout"); },
                120 + Math.random() * 180);
            }, 420 + Math.random() * 500);
          }
          brownout();
        }, len);
      }, gap);
    })();
  }

  /* ---------- master power from the ignition knob ---------------------- */
  window.addEventListener("rig:ignite", function () {
    document.body.classList.add("is-powered");
  });
})();
