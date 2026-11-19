/* Underlight 0.1 runtime. No dependencies. Scroll position drives every leaf, the cut, the lamps and the rail */
(function () {
  "use strict";
  var root = document.documentElement,
    body = document.body,
    stage = document.querySelector(".ul-stage"),
    rail = document.querySelector(".ul-rail"),
    L = [].slice.call(document.querySelectorAll(".ul-leaf")),
    N = L.length,
    links = [].slice.call(document.querySelectorAll(".ul-nav a")),
    step =
      parseFloat(getComputedStyle(root).getPropertyValue("--ul-step")) || 0.75,
    th = null,
    tick = 0,
    act = -1,
    railH = 0,
    thH = 0,
    ax = false,
    ticks = [],
    space = document.querySelector(".ul-space");
  function cl(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  var modes = {},
    first = true,
    pkT = 0,
    dragging = false,
    settleT = 0,
    lastIn = 0,
    tp = document.querySelector(".ul-top");
  try {
    modes = JSON.parse((tp && tp.dataset.ulModes) || "{}");
  } catch (e) {}
  function peek(ms) {
    if (!tp) return;
    tp.classList.add("open");
    clearTimeout(pkT);
    pkT = setTimeout(function () {
      tp.classList.remove("open");
    }, ms || 1700);
  }
  function nmw() {
    var n = tp && tp.querySelector(".nm");
    if (n) root.style.setProperty("--ul-nmw", n.offsetWidth + "px");
  }

  root.style.setProperty("--ul-n", Math.max(1, N - 1));

  [].forEach.call(document.querySelectorAll("[data-ul-letters]"), function (h) {
    var s = h.textContent;
    h.textContent = "";
    h.setAttribute("role", "img");
    s.split(" ").forEach(function (word, wi) {
      if (wi) h.appendChild(document.createTextNode(" "));
      var w = document.createElement("span");
      w.className = "ul-w";
      w.setAttribute("aria-hidden", "true");
      word.split("").forEach(function (c) {
        var e = document.createElement("span");
        e.className = "ul-l";
        e.textContent = c;
        e.style.setProperty("--r", Math.random().toFixed(2));
        e.style.setProperty("--q", Math.random().toFixed(2));
        e.style.setProperty("--d", Math.round(Math.random() * 90));
        w.appendChild(e);
      });
      h.appendChild(w);
    });
  });
  [].forEach.call(document.querySelectorAll("[data-layer]"), function (el) {
    var s = document.createElement("span");
    s.className = "ul-lbl";
    s.setAttribute("aria-hidden", "true");
    s.textContent = el.dataset.layer;
    el.appendChild(s);
  });
  if (rail) {
    ax = rail.dataset.axis === "x";
    th = document.createElement("i");
    rail.appendChild(th);
    L.forEach(function (x, i) {
      var u = document.createElement("u");
      u.style[ax ? "left" : "top"] = (i / Math.max(1, N - 1)) * 100 + "%";
      u.dataset.n = ("0" + (i + 1)).slice(-2);
      rail.appendChild(u);
      ticks.push(u);
    });
  }

  function size() {
    if (rail) {
      railH = ax ? rail.clientWidth : rail.clientHeight;
      thH = ax ? th.offsetWidth : th.offsetHeight;
    }
  }
  function upd() {
    tick = 0;
    var max = root.scrollHeight - innerHeight,
      p = max > 0 ? cl(scrollY / max) : 0,
      idx = scrollY / (innerHeight * step);
    root.style.setProperty("--ul-p", p.toFixed(4));
    var i0 = Math.min(N - 1, Math.max(0, Math.floor(idx))),
      i1 = Math.min(N - 1, i0 + 1),
      g = cl((idx - i0 - 0.25) / 0.5);
    g = g * g * (3 - 2 * g);
    var s0 = L[i0].dataset.state || "cut",
      s1 = L[i1].dataset.state || "cut";
    root.style.setProperty(
      "--ul-open",
      ((s0 === "cut" ? 1 : 0) * (1 - g) + (s1 === "cut" ? 1 : 0) * g).toFixed(
        3,
      ),
    );
    root.style.setProperty(
      "--ul-lit",
      (
        (s0 === "sealed" ? 0 : 1) * (1 - g) +
        (s1 === "sealed" ? 0 : 1) * g
      ).toFixed(3),
    );
    root.style.setProperty("--ul-m", cl(1 - idx * 2.4).toFixed(3));
    L.forEach(function (el, i) {
      var d = idx - i,
        ad = Math.abs(d),
        side = el.dataset.enter,
        a,
        c = 1,
        x = 0;
      if (side === "left" || side === "right") {
        a = cl(1.8 - 2 * ad);
        c = cl(1.5 - 2.7 * ad);
        x = (d < 0 ? -1 : 1) * (1 - a) * 60 * (side === "right" ? -1 : 1);
      } else a = cl(1.7 - 2.4 * ad);
      el.style.setProperty("--ul-a", a.toFixed(3));
      el.style.setProperty("--ul-c", c.toFixed(3));
      el.style.setProperty("--ul-x", x.toFixed(1) + "px");
      el.inert = ad >= 0.5;
    });
    if (th)
      th.style.transform =
        "translate" +
        (ax ? "X" : "Y") +
        "(" +
        (p * (railH - thH)).toFixed(1) +
        "px)";
    var k = Math.min(N - 1, Math.max(0, Math.round(idx)));
    if (k !== act) {
      act = k;
      var e = L[k];
      body.dataset.ulState = e.dataset.state || "cut";
      var sc = e.dataset.scene;
      if (stage && sc)
        [].forEach.call(stage.querySelectorAll(".ul-scene"), function (s) {
          s.classList.toggle("on", s.dataset.scene === sc);
        });
      links.forEach(function (a, j) {
        if (j === k) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      ticks.forEach(function (u, j) {
        u.classList.toggle("on", j === k);
      });
      setT("[data-ul-index]", ("0" + (k + 1)).slice(-2));
      setT(
        "[data-ul-title]",
        links[k] ? links[k].textContent.toLowerCase() : e.id,
      );
      setT(
        "[data-ul-label]",
        modes[e.dataset.state || "cut"] || e.dataset.state || "cut",
      );
      if (first) first = false;
      else peek();
    }
  }
  function setT(sel, v) {
    [].forEach.call(document.querySelectorAll(sel), function (n) {
      if (n.textContent === v) return;
      n.textContent = v;
      n.classList.remove("roll");
      void n.offsetWidth;
      n.classList.add("roll");
    });
  }
  function req() {
    if (!tick) {
      tick = 1;
      requestAnimationFrame(upd);
    }
  }
  function settle() {
    if (
      Date.now() - lastIn < 320 ||
      dragging ||
      matchMedia("(prefers-reduced-motion:reduce)").matches
    )
      return;
    var idx = scrollY / (innerHeight * step),
      k = Math.round(idx),
      d = Math.abs(idx - k);
    if (d > 0.03 && d < 0.22)
      scrollTo({ top: k * innerHeight * step, behavior: "smooth" });
  }
  ["wheel", "touchstart", "touchmove", "keydown", "pointerdown"].forEach(
    function (t) {
      addEventListener(
        t,
        function () {
          lastIn = Date.now();
        },
        { passive: true },
      );
    },
  );
  addEventListener(
    "scroll",
    function () {
      req();
      clearTimeout(settleT);
      settleT = setTimeout(settle, 360);
    },
    { passive: true },
  );
  addEventListener("resize", function () {
    size();
    nmw();
    req();
  });
  links.forEach(function (a, i) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      scrollTo({ top: i * innerHeight * step, behavior: "smooth" });
    });
  });

  function seek(ev) {
    var r = rail.getBoundingClientRect(),
      f = cl(
        ax ? (ev.clientX - r.left) / r.width : (ev.clientY - r.top) / r.height,
      );
    scrollTo({
      top: f * (root.scrollHeight - innerHeight),
      behavior: "instant",
    });
  }
  if (rail) {
    rail.addEventListener("pointerdown", function (ev) {
      dragging = true;
      rail.setPointerCapture(ev.pointerId);
      seek(ev);
      rail.onpointermove = seek;
    });
    function drop() {
      rail.onpointermove = null;
      dragging = false;
    }
    rail.addEventListener("pointerup", drop);
    rail.addEventListener("pointercancel", drop);
  }

  var lb = document.querySelector(".ul-layers");
  function lay(on) {
    body.toggleAttribute("data-layers", on);
    if (lb) lb.setAttribute("aria-pressed", String(on));
  }
  if (lb)
    lb.addEventListener("click", function () {
      lay(!body.hasAttribute("data-layers"));
    });
  addEventListener("keydown", function (e) {
    if (
      (e.key === "l" || e.key === "L") &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)
    )
      lay(!body.hasAttribute("data-layers"));
  });

  [].forEach.call(document.querySelectorAll("[data-ul-total]"), function (n) {
    n.textContent = ("0" + N).slice(-2);
  });
  size();
  upd();
  nmw();
  setTimeout(function () {
    peek(2800);
  }, 350);
  if (document.fonts) document.fonts.ready.then(nmw);
})();
