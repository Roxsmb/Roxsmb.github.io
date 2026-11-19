/* ==========================================================================
   Emre Melik Nameli (ROXSMB) — interaction layer
   Vanilla JS, no dependencies. Everything degrades without it.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- page ready: hero reveal sequence -------------------------------- */
  function markLoaded() {
    requestAnimationFrame(function () {
      document.body.classList.add("loaded");
    });
  }
  if (document.readyState === "complete") {
    markLoaded();
  } else {
    window.addEventListener("load", markLoaded, { once: true });
    /* fallback if a large asset stalls the load event */
    setTimeout(markLoaded, 900);
  }

  /* --- terminal boot lines -------------------------------------------- */
  var termLines = document.querySelectorAll("#terminal-body .term-line");
  function runTerminal() {
    if (reduceMotion) {
      termLines.forEach(function (line) { line.classList.add("on"); });
      return;
    }
    termLines.forEach(function (line, i) {
      setTimeout(function () {
        line.classList.add("on");
      }, 320 + i * 190);
    });
  }
  runTerminal();

  /* --- scroll reveal --------------------------------------------------- */
  var revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add("in"); });
  }

  /* --- ignition key ---------------------------------------------------- */
  var ignKey = document.getElementById("ignition-key");
  var ignHint = document.getElementById("ignition-hint");
  var IGN_MIN = -42;
  var IGN_MAX = 78;
  var ignValue = 0;
  var ignited = false;

  function setIgn(value) {
    ignValue = Math.max(0, Math.min(100, value));
    ignKey.style.transform = "rotate(" + (IGN_MIN + (ignValue / 100) * (IGN_MAX - IGN_MIN)).toFixed(1) + "deg)";
    ignKey.setAttribute("aria-valuenow", Math.round(ignValue));
  }

  function ignite() {
    if (ignited) return;
    ignited = true;
    ignKey.classList.remove("is-turning");
    setIgn(100);
    document.body.classList.add("ignited");
    if (ignHint) ignHint.textContent = "power on";
    document.dispatchEvent(new CustomEvent("rig:ignite"));
    termLines.forEach(function (line) { line.classList.remove("on"); });
    void document.body.offsetWidth;
    runTerminal();
  }

  if (ignKey) {
    var dragging = false;
    var moved = 0;
    var startX = 0;
    var startY = 0;
    var centreX = 0;
    var centreY = 0;

    setIgn(0);

    function pointerAngle(x, y) {
      return (Math.atan2(y - centreY, x - centreX) * 180) / Math.PI;
    }

    ignKey.addEventListener("pointerdown", function (event) {
      if (ignited) return;
      var box = ignKey.getBoundingClientRect();
      centreX = box.left + box.width / 2;
      centreY = box.top + box.height / 2;
      dragging = true;
      moved = 0;
      startX = event.clientX;
      startY = event.clientY;
      ignKey.classList.add("is-turning");
      if (ignKey.setPointerCapture) {
        try { ignKey.setPointerCapture(event.pointerId); } catch (err) {}
      }
      event.preventDefault();
    });

    ignKey.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      moved = Math.max(moved, Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY));
      var angle = pointerAngle(event.clientX, event.clientY);
      setIgn(((angle - IGN_MIN) / (IGN_MAX - IGN_MIN)) * 100);
    });

    function releaseKey() {
      if (!dragging) return;
      dragging = false;
      ignKey.classList.remove("is-turning");
      if (ignValue >= 52 || moved < 6) ignite();
      else setIgn(0);
    }

    ignKey.addEventListener("pointerup", releaseKey);
    ignKey.addEventListener("pointercancel", releaseKey);

    ignKey.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        ignite();
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        if (ignValue + 12 >= 52) ignite();
        else setIgn(ignValue + 12);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        setIgn(ignValue - 12);
      }
    });
  }

  /* --- header state + reading progress --------------------------------- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");
  var alley = document.getElementById("alley");
  var root = document.documentElement;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = root.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(y / max, 1) : 0;

    if (nav) nav.classList.toggle("is-stuck", y > 12);
    if (progress) progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";

    /* lower city fades in with reading depth */
    if (alley) {
      var t = Math.min(Math.max((ratio - 0.26) / 0.5, 0), 1);
      t = t * t * (3 - 2 * t);
      alley.style.opacity = (t * 0.92).toFixed(3);
      root.style.setProperty("--p", ratio.toFixed(4));
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* --- active section in navigation ------------------------------------ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var current = null;
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (current === entry.target.id) return;
        current = entry.target.id;
        navLinks.forEach(function (link) {
          var active = link.getAttribute("href") === "#" + current;
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* --- work rail (drag / arrows / progress) ---------------------------- */
  var rail = document.getElementById("rail");
  var railDragged = false;

  if (rail) {
    var railPrev = document.getElementById("rail-prev");
    var railNext = document.getElementById("rail-next");
    var railBar = document.getElementById("rail-progress");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var realCards = Array.prototype.slice.call(rail.querySelectorAll(".card"));
    var realCount = realCards.length || 1;
    var period = 0;

    function railStep() {
      var card = rail.querySelector(".card");
      if (!card) return 400;
      var gap = parseFloat(getComputedStyle(rail).columnGap || "12") || 12;
      return card.getBoundingClientRect().width + gap;
    }

    function measureReel() {
      period = railStep() * realCount;
    }

    /* the set repeats, so the reel can run in one direction forever. four
       copies leave the spin room to land on a card that is always ahead of
       the current position */
    function buildReel() {
      realCards.forEach(function (card) { card.classList.add("in"); });
      for (var c = 1; c < 4; c++) {
        realCards.forEach(function (card) {
          var clone = card.cloneNode(true);
          clone.setAttribute("data-clone", "true");
          clone.setAttribute("aria-hidden", "true");
          clone.setAttribute("tabindex", "-1");
          clone.removeAttribute("data-reveal");
          clone.style.removeProperty("--d");
          Array.prototype.forEach.call(clone.querySelectorAll("img"), function (img) {
            img.setAttribute("loading", "lazy");
            img.setAttribute("decoding", "async");
          });
          rail.appendChild(clone);
        });
      }
      measureReel();
      /* start in the middle copy: the rail can now travel either way forever */
      rail.scrollLeft = period;
    }

    function wrapReel() {
      if (!period || rail.classList.contains("is-spinning")) return;
      if (rail.scrollLeft < period * 0.35) rail.scrollLeft += period;
      else if (rail.scrollLeft > period * 1.65) rail.scrollLeft -= period;
    }

    function railUpdate() {
      var unit = period || 1;
      var p = (((rail.scrollLeft % unit) + unit) % unit) / unit;
      if (railBar) {
        var w = railBar.offsetWidth || 1;
        var span = Math.max(0, rail.clientWidth - w);
        railBar.style.transform = "translateX(" + (p * span).toFixed(1) + "px)";
      }
      if (railPrev) railPrev.disabled = false;
      if (railNext) railNext.disabled = false;
    }

    function railBy(dir) {
      if (!period) return;
      /* slide the identical copy under the viewport first, so the smooth
         scroll never has to fight the wrap-around */
      if (dir < 0 && rail.scrollLeft - railStep() < period * 0.45) rail.scrollLeft += period;
      if (dir > 0 && rail.scrollLeft + railStep() > period * 1.55) rail.scrollLeft -= period;
      rail.scrollBy({ left: dir * railStep(), behavior: reduce ? "auto" : "smooth" });
    }

    if (railPrev) railPrev.addEventListener("click", function () { railBy(-1); });
    if (railNext) railNext.addEventListener("click", function () { railBy(1); });

    /* the dial stops inviting once it has been turned */
    var panelEl = document.getElementById("rail-console");
    if (panelEl) {
      var used = function () { panelEl.classList.add("is-used"); };
      if (railNext) railNext.addEventListener("pointerdown", used);
      if (railPrev) railPrev.addEventListener("pointerdown", used);
      if (railNext) railNext.addEventListener("click", used);
      rail.addEventListener("focusin", used);
    }

    /* the lever spins the reel, then the piece lands */
    var lever = document.getElementById("rail-lever");
    var leverWrap = (lever && lever.closest(".tv-lever")) || lever;
    var tvScreen = rail.closest(".tv-screen");
    var dropImg = document.getElementById("drop-img");
    var tvDrop = document.getElementById("tv-drop");
    var leverBusy = false;

    function easeInOutSine(t) {
      return 0.5 - 0.5 * Math.cos(Math.PI * t);
    }

    function cardSource(card) {
      var img = card.querySelector("img");
      if (!img) return "";
      var srcset = img.getAttribute("srcset");
      if (srcset) {
        var parts = srcset.split(",");
        var last = parts[parts.length - 1].trim().split(/\s+/)[0];
        if (last) return last;
      }
      return img.currentSrc || img.src;
    }

    /* scrollLeft that puts a card exactly under the middle of the window.
       The cards are centre-snapped, so this is the position the browser
       itself settles on; "index * step" is off by half the free space and
       lands the reel on a different card than the one that was drawn. */
    function centerOffset(el) {
      var box = rail.getBoundingClientRect();
      var card = el.getBoundingClientRect();
      return card.left - box.left + rail.scrollLeft + card.width / 2 - rail.clientWidth / 2;
    }

    /* always land on the chosen project, in a copy that is far enough ahead
       that the reel never runs off the end of the set mid flight */
    function reelTarget(project) {
      var card = realCards[project] || realCards[0];
      var max = rail.scrollWidth - rail.clientWidth;
      var target = centerOffset(card) + period;
      /* keep the reel turning the same way (scrollLeft grows) for at least
         a full revolution, while staying inside the copied set */
      while (target - rail.scrollLeft < period * 0.9 && target + period <= max) {
        target += period;
      }
      return target;
    }

    function spinTo(project, duration, done) {
      var start = rail.scrollLeft;
      var target = reelTarget(project);
      /* always forward: the reel runs to the right, never rewinds */
      var travel = Math.max(0, target - start);
      var t0 = 0;

      rail.classList.add("is-spinning");
      rail.style.scrollSnapType = "none";

      function frame(now) {
        if (!t0) t0 = now;
        var t = duration ? Math.min(1, (now - t0) / duration) : 1;
        rail.scrollLeft = start + travel * easeInOutSine(t);
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          rail.scrollLeft = target;
          rail.classList.remove("is-spinning");
          /* let the browser see the exact landing position before snap comes
             back, otherwise mandatory snap yanks the reel to another card */
          window.requestAnimationFrame(function () {
            rail.style.scrollSnapType = "";
            window.requestAnimationFrame(function () {
              if (done) done();
            });
          });
        }
      }
      requestAnimationFrame(frame);
    }

    if (lever && tvScreen && dropImg) {
      var pullLever = function () {
        if (leverBusy || tvScreen.classList.contains("is-film")) return;
        leverBusy = true;
        if (leverWrap) leverWrap.classList.add("is-pulled");
        /* the reel stays lit while it spins: the win only lands on the screen
           once the reel has actually stopped on the card */
        if (panelEl) panelEl.classList.add("is-used");

        var project = Math.floor(Math.random() * realCount);
        var card = realCards[project];
        var key = card ? card.getAttribute("data-project") : "";
        var gallery = (galleries && galleries[key] && galleries[key].images) || [];
        var shots = gallery.slice();
        var cover = cardSource(card);
        if (!shots.length && cover) shots = [{ src: cover, alt: "" }];

        /* the whole breakdown is warmed up while the reel spins */
        shots.forEach(function (shot) {
          var pre = new Image();
          pre.src = shot.src;
        });

        if (shots.length) {
          dropImg.src = shots[0].src;
          dropImg.alt = shots[0].alt || "";
        }

        window.setTimeout(function () {
          spinTo(project, reduce ? 0 : 2300, function () {
            tvScreen.classList.add("is-drawn", "is-open");
            if (tvDrop) tvDrop.setAttribute("aria-hidden", "false");

            /* bang bang bang: the rest of the set, hard cuts */
            if (!reduce && shots.length > 1) {
              var i = 1;
              var cut = function () {
                if (i >= shots.length) return;
                dropImg.src = shots[i].src;
                dropImg.alt = shots[i].alt || "";
                tvScreen.classList.remove("is-cut");
                void tvScreen.offsetWidth;
                tvScreen.classList.add("is-cut");
                i++;
                window.setTimeout(cut, 330);
              };
              window.setTimeout(cut, 330);
            }
          });
        }, reduce ? 0 : 120);

        var landed = reduce ? 60 : 2420;
        var hold = reduce ? 500 : Math.max(1650, shots.length * 330 + 700);

        window.setTimeout(function () {
          tvScreen.classList.remove("is-open", "is-cut", "is-drawn");
          if (tvDrop) tvDrop.setAttribute("aria-hidden", "true");
        }, landed + hold);

        window.setTimeout(function () {
          if (leverWrap) leverWrap.classList.remove("is-pulled");
        }, reduce ? 40 : 1450);

        window.setTimeout(function () { leverBusy = false; }, landed + hold + 420);
      };

      if (lever.parentElement && lever.parentElement.classList.contains("tv-lever")) {
        lever.parentElement.addEventListener("click", pullLever);
      } else {
        lever.addEventListener("click", pullLever);
      }
    }

    buildReel();
    rail.addEventListener("scroll", function () {
      wrapReel();
      window.requestAnimationFrame(railUpdate);
    }, { passive: true });
    window.addEventListener("resize", function () { measureReel(); railUpdate(); });
    railUpdate();

    /* the dial stops inviting once it has been turned */
    var panelEl = document.getElementById("rail-console");
    if (panelEl) {
      var used = function () { panelEl.classList.add("is-used"); };
      if (railNext) railNext.addEventListener("pointerdown", used);
      if (railPrev) railPrev.addEventListener("pointerdown", used);
      if (railNext) railNext.addEventListener("click", used);
      rail.addEventListener("focusin", used);
    }

    
    railUpdate();

    /* pointer drag */
    var down = false, startX = 0, startScroll = 0, moved = 0;
    rail.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      down = true;
      moved = 0;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      rail.classList.add("is-dragging");
    });
    rail.addEventListener("pointermove", function (event) {
      if (!down) return;
      var dx = event.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) {
        if (!rail.hasPointerCapture || !rail.hasPointerCapture(event.pointerId)) {
          try { rail.setPointerCapture(event.pointerId); } catch (e) {}
        }
        rail.scrollLeft = startScroll - dx;
      }
    });
    function endDrag() {
      if (!down) return;
      down = false;
      rail.classList.remove("is-dragging");
      railDragged = moved > 8;
      setTimeout(function () { railDragged = false; }, 60);
    }
    rail.addEventListener("pointerup", endDrag);
    rail.addEventListener("pointercancel", endDrag);
    rail.addEventListener("pointerleave", endDrag);
  }

  /* --- project lightbox ------------------------------------------------ */
  var galleries = {
    elias: {
      title: "Elias",
      href: "https://www.artstation.com/artwork/eRE9qX",
      images: [
        { src: "assets/work/elias-gameready-3d-character-cover-1600.webp", alt: "Elias game-ready 3D character, full PBR render" },
        { src: "assets/work/elias-3d-character-portrait-1600.webp", alt: "Elias character portrait, close view of the face and materials" },
        { src: "assets/work/elias-3d-character-pbr-detail-1600.webp", alt: "Elias costume detail: leather, metal and fabric materials" }
      ]
    },
    erlikhan: {
      title: "Erlikhan",
      href: "https://www.artstation.com/artwork/AZOnny",
      images: [
        { src: "assets/work/erlikhan-3d-character-environment-cover-1600.webp", alt: "Erlikhan high-poly character sculpt, upper body" },
        { src: "assets/work/erlikhan-3d-character-statue-1600.webp", alt: "Erlikhan full character statue with skull base" },
        { src: "assets/work/erlikhan-3d-character-final-1600.webp", alt: "Erlikhan clay render showing full sculpt silhouette" }
      ]
    },
    sax: {
      title: "Saxophone Robot",
      href: "https://www.artstation.com/artwork/YGkZnq",
      images: [
        { src: "assets/work/junk-collector-robot-character-cover-1600.webp", alt: "Saxophone-playing robot in a red coat, bust view" },
        { src: "assets/work/saxophone-robot-3d-character-1600.webp", alt: "Saxophone-playing robot, full character render" }
      ]
    },
    city: {
      title: "Industrial City",
      href: "https://www.artstation.com/artwork/nJAbZr",
      images: [
        { src: "assets/work/industrial-city-3d-environment-cover-1600.webp", alt: "Industrial city 3D environment at sunset" }
      ]
    },
    hurdaci: {
      title: "The Junk Collector and His Robot",
      href: "https://www.artstation.com/artwork/a0n4YX",
      images: [
        { src: "assets/work/junk-collector-and-his-robot-cover-1600.webp", alt: "The Junk Collector and His Robot, stylized character render" },
        { src: "assets/work/junk-collector-and-his-robot-expression-1600.webp", alt: "Junk Collector close-up, lifting his round glasses" },
        { src: "assets/work/junk-collector-and-his-robot-mech-1600.webp", alt: "Junk Collector standing beside his robot" },
        { src: "assets/work/junk-collector-and-his-robot-wireframe-1600.webp", alt: "Junk Collector and robot with wireframe overlay" }
      ]
    },
    anim: {
      title: "Animation",
      href: "https://www.artstation.com/artwork/yA4J3x",
      images: [
        { src: "assets/work/animation-reel-cover-1600.webp", alt: "Walk cycle on a white mannequin rig" },
        { src: "assets/work/animation-reel-run-1600.webp", alt: "Run cycle on a white mannequin rig" },
        { src: "assets/work/animation-reel-idle-1600.webp", alt: "Idle pose from three angles on a white mannequin rig" }
      ]
    }
  };

  var dialog = document.getElementById("lightbox");
  if (dialog && typeof dialog.showModal === "function") {
    var lbImg = document.getElementById("lb-img");
    var lbTitle = document.getElementById("lb-title");
    var lbCount = document.getElementById("lb-count");
    var lbLink = document.getElementById("lb-link");
    var current = null;
    var index = 0;

    function render() {
      var item = current.images[index];
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbCount.textContent = (index + 1) + " / " + current.images.length;
      var multi = current.images.length > 1;
      document.getElementById("lb-prev").hidden = !multi;
      document.getElementById("lb-next").hidden = !multi;
      var prev = current.images[(index - 1 + current.images.length) % current.images.length];
      var next = current.images[(index + 1) % current.images.length];
      var pre = new Image(), nex = new Image();
      pre.src = prev.src;
      nex.src = next.src;
    }

    function step(dir) {
      index = (index + dir + current.images.length) % current.images.length;
      render();
    }

    function open(key, trigger) {
      current = galleries[key];
      if (!current) return;
      index = 0;
      lbTitle.textContent = current.title;
      lbLink.href = current.href;
      render();
      dialog.showModal();
      dialog.dataset.trigger = trigger;
    }

    document.querySelectorAll("[data-project]").forEach(function (card) {
      card.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        if (!galleries[card.dataset.project]) return;
        event.preventDefault();
        open(card.dataset.project, card.dataset.project);
      });
    });

    document.getElementById("lb-close").addEventListener("click", function () { dialog.close(); });
    document.getElementById("lb-prev").addEventListener("click", function () { step(-1); });
    document.getElementById("lb-next").addEventListener("click", function () { step(1); });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
    });

    dialog.addEventListener("close", function () {
      var trigger = dialog.dataset.trigger && document.querySelector('[data-project="' + dialog.dataset.trigger + '"]');
      if (trigger) trigger.focus({ preventScroll: true });
      lbImg.removeAttribute("src");
    });
  }

  /* --- year ------------------------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* --- anchor focus for keyboard users -------------------------------- */
  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    target.setAttribute("tabindex", "-1");
    setTimeout(function () { target.focus({ preventScroll: true }); }, 420);
  });
})();


/* --- the film in the case ------------------------------------------------
   The console has a DVD case parked in its film bay. Pressing it swaps the
   portfolio on the monitor for the YouTube player: sound and fullscreen stay
   in the player's own control bar, and the case turns into the eject button.
   The iframe is only created on demand, so the page ships no third-party
   requests or cookies until someone actually asks for the film. */
(function () {
  var rack = document.querySelector(".rack.tv");
  var screen = rack && rack.querySelector(".tv-screen");
  var toggle = document.getElementById("dvd-film");
  var film = document.getElementById("film-player");
  var frame = document.getElementById("film-frame");
  var eject = document.getElementById("film-eject");
  var status = document.getElementById("film-status");
  var rail = document.getElementById("rail");
  var railBack = document.getElementById("rail-prev");
  var railNext = document.getElementById("rail-next");
  var lever = document.getElementById("rail-lever");
  if (!rack || !screen || !toggle || !film || !frame || !rail) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var baseSrc = frame.getAttribute("data-src") || "";
  /* YouTube checks the embedding origin. Sending it explicitly keeps the
     player happy behind strict referrer policies; a file:// page has no
     origin at all, so there the set shows a local-preview slate instead. */
  var fileMode = window.location.protocol === "file:";
  var src = baseSrc;
  if (!fileMode && /^https?:$/.test(window.location.protocol)) {
    src += (baseSrc.indexOf("?") === -1 ? "?" : "&") + "origin=" + encodeURIComponent(window.location.origin);
  }
  var playing = false;
  var readyTimer = 0;

  function announce(text) {
    if (!status) return;
    status.textContent = "";
    window.setTimeout(function () { status.textContent = text; }, 80);
  }

  function markReady() {
    if (!playing) return;
    window.clearTimeout(readyTimer);
    film.classList.remove("is-loading");
    film.classList.add("is-ready");
  }

  /* the channel controls belong to the portfolio, so they leave the tab
     order and the accessibility tree while the film owns the monitor */
  function lockControls(lock) {
    [rail, railBack, railNext, lever].forEach(function (el) {
      if (!el) return;
      if (lock) {
        el.setAttribute("inert", "");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
    });
  }

  function openFilm() {
    if (playing) return;
    playing = true;
    rack.classList.add("is-film");
    screen.classList.add("is-film");
    film.setAttribute("aria-hidden", "false");
    toggle.classList.add("is-playing");
    toggle.setAttribute("aria-pressed", "true");
    lockControls(true);
    screen.classList.remove("is-open", "is-cut", "is-drawn");

    if (fileMode) {
      film.classList.remove("is-ready", "is-loading");
      film.classList.add("is-local");
      announce("Local file preview. YouTube cannot play inside a file; use the YouTube link to watch TFHDB, or open the site through a local server.");
    } else {
      film.classList.remove("is-ready", "is-local");
      film.classList.add("is-loading");
      frame.setAttribute("src", src);
      readyTimer = window.setTimeout(markReady, 3200);
      announce("Playing TFHDB on the monitor. Use the player controls for sound, or press Escape to return to the portfolio.");
    }

    /* the overlay turns visible with the classes above; flush that layout so
       the eject control can take focus in the same beat as the take-over */
    void film.offsetHeight;
    if (eject) eject.focus({ preventScroll: true });

    /* the film lives at the top of the set: on a phone the case can be a
       full screen below it, so pull the monitor back into view */
    var box = screen.getBoundingClientRect();
    if (box.top < 54 || box.bottom > (window.innerHeight || 800) + 24) {
      var top = box.top + (window.pageYOffset || 0) - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
  }

  function closeFilm(returnFocus) {
    if (!playing) return;
    playing = false;
    window.clearTimeout(readyTimer);
    rack.classList.remove("is-film");
    screen.classList.remove("is-film");
    film.setAttribute("aria-hidden", "true");
    film.classList.remove("is-ready", "is-loading", "is-local");
    /* dropping the src stops playback and releases the player */
    frame.removeAttribute("src");
    toggle.classList.remove("is-playing");
    toggle.setAttribute("aria-pressed", "false");
    lockControls(false);
    announce("Film stopped. The portfolio is back on the monitor.");
    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  frame.addEventListener("load", markReady);

  toggle.addEventListener("click", function () {
    if (playing) closeFilm(false);
    else openFilm();
  });

  if (eject) eject.addEventListener("click", function () { closeFilm(true); });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && playing) {
      event.preventDefault();
      closeFilm(true);
    }
  });
})();


/* --- the disc rides the scroll from the terminal into the set -----------
   The drive in the hero and the slot on the monitor share one vertical
   axis, so the disc travels straight down: no perspective, no sideways
   drift, no timer to fall out of sync. Position comes from the scroll
   itself, which means scrolling back up reverses it for free. */
(function () {
  var rack = document.querySelector(".rack.tv");
  var deck = document.querySelector(".terminal-deck");
  var deckSlot = document.getElementById("cd-slot");
  var stage = document.querySelector(".cd-stage");
  var disc = document.getElementById("cd-disc");
  var slot = document.getElementById("tv-slot");
  if (!rack || !deck || !deckSlot || !stage || !disc || !slot) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var powered = false;

  function power(on) {
    if (on === powered) return;
    powered = on;
    rack.classList.toggle("is-cold", !on);
    slot.classList.toggle("is-loaded", on);
    rack.classList.remove("is-waking");
    if (on) {
      void rack.offsetWidth;
      rack.classList.add("is-waking");
      window.setTimeout(function () { rack.classList.remove("is-waking"); }, 1000);
    }
  }

  if (reduce) {
    rack.classList.remove("is-cold");
    slot.classList.add("is-loaded");
    disc.classList.add("is-taken");
    powered = true;
    return;
  }

  var fly = document.createElement("div");
  fly.className = "cd-fly";
  fly.setAttribute("aria-hidden", "true");
  var copy = disc.cloneNode(true);
  copy.removeAttribute("id");
  fly.appendChild(copy);
  document.body.appendChild(fly);

  var visible = false;

  function draw() {
    var sc = window.scrollY || window.pageYOffset || 0;
    var vh = window.innerHeight || 800;
    var slotR = slot.getBoundingClientRect();
    var discR = disc.getBoundingClientRect();

    /* the disc keeps its own size at the drive and ends as wide as the
       monitor slot, so it drops in edge to edge */
    var size0 = discR.width || 198;
    var size1 = slotR.width || size0;

    /* everything is measured in document space, so the flight cannot drift
       when the viewport scrolls: startTop is where the disc rests in the
       drive, lip is the top edge of the monitor slot */
    var startTop = discR.top + sc;
    var lip = slotR.top + sc + slotR.height * 0.55;
    var endTop = lip;

    /* the drive keeps the disc until it is a third of the way up the screen;
       the disc lands when the slot reaches the middle of the screen */
    var from = Math.max(0, startTop - vh * 0.62);
    var to = endTop - vh * 0.42;
    if (to < from + 160) to = from + 160;

    var p = (sc - from) / (to - from);
    p = p < 0 ? 0 : p > 1 ? 1 : p;

    if (p < 0.001) {
      if (visible) { fly.classList.remove("is-live"); visible = false; }
      disc.classList.remove("is-taken");
      power(false);
      return;
    }

    if (!visible) { fly.classList.add("is-live"); visible = true; }
    disc.classList.add("is-taken");

    var size = size0 + (size1 - size0) * p;
    /* the disc starts on the drive axis and ends on the monitor axis: on
       narrow layouts the two are not lined up, so it drifts across while it
       falls instead of snapping sideways at the end */
    var startCx = discR.left + discR.width / 2;
    var endCx = slotR.left + slotR.width / 2;
    var x = startCx + (endCx - startCx) * p - size / 2;
    var y = startTop + (endTop - startTop) * p - sc;
    /* the disc sinks behind the monitor lip: only the part above it shows */
    var clipBottom = Math.max(0, Math.min(size, y + sc - lip + size));
    /* and it slides out of the drive slot exactly like the parked disc is
       masked there, so the hand-over at either end is invisible */
    var clipTop = Math.max(0, stage.getBoundingClientRect().top - y);

    fly.style.width = size + "px";
    fly.style.height = size + "px";
    fly.style.setProperty("--cd", size + "px");
    fly.style.clipPath = (clipTop > 0.4 || clipBottom > 0.4)
      ? "inset(" + clipTop.toFixed(1) + "px 0 " + clipBottom.toFixed(1) + "px 0)"
      : "none";
    fly.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";

    if (!powered && p > 0.985) power(true);
    else if (powered && p < 0.92) power(false);
  }

  var ticking = false;
  function queue() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      draw();
    });
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("orientationchange", queue);
  /* late layout shifts (web fonts, images) move the two slots, so measure
     again instead of trusting the frame drawn during the shift */
  window.addEventListener("load", queue);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  if ("ResizeObserver" in window) new ResizeObserver(queue).observe(document.body);
  draw();
})();
