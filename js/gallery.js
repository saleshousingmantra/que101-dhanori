/* UQE101 gallery: category filters + full-screen image viewer
   (keyboard arrows / Esc, swipe on phones). */
(function () {
  "use strict";
  var root = document.getElementById("gallery");
  var lb = document.getElementById("galleryLightbox");
  if (!root || !lb) return;

  var items = Array.prototype.slice.call(root.querySelectorAll(".g-it"));
  var filters = Array.prototype.slice.call(root.querySelectorAll(".g-f"));
  var img = lb.querySelector("img");
  var capB = lb.querySelector("figcaption b");
  var capI = lb.querySelector("figcaption i");
  var count = lb.querySelector(".g-count");
  var list = items, index = 0, lastFocus = null;

  /* ---------- filters ---------- */
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.getAttribute("data-f");
      filters.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      items.forEach(function (it) {
        it.hidden = !(f === "all" || it.getAttribute("data-cat") === f);
      });
    });
  });

  /* ---------- viewer ---------- */
  function show(i) {
    index = (i + list.length) % list.length;
    var it = list[index];
    var src = it.querySelector("img");
    img.onload = function () {
      /* Small source images look soft when blown up, so cap them at 2x. */
      img.style.maxWidth = Math.min(img.naturalWidth * 2, window.innerWidth) + "px";
    };
    img.src = src.getAttribute("src");
    img.alt = src.alt;
    capB.textContent = it.querySelector(".g-cap b").textContent;
    capI.textContent = it.querySelector(".g-cap i").textContent;
    count.textContent = (index + 1) + " / " + list.length;
  }

  function open(it) {
    list = items.filter(function (x) { return !x.hidden; });
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.documentElement.classList.add("g-lock");
    requestAnimationFrame(function () { lb.classList.add("open"); });
    show(list.indexOf(it));
    lb.querySelector(".g-x").focus();
  }

  function close() {
    lb.classList.remove("open");
    document.documentElement.classList.remove("g-lock");
    setTimeout(function () { lb.hidden = true; img.removeAttribute("src"); }, 250);
    if (lastFocus) lastFocus.focus();
  }

  items.forEach(function (it) {
    it.querySelector(".g-btn").addEventListener("click", function () { open(it); });
  });
  lb.querySelector(".g-x").addEventListener("click", close);
  lb.querySelector(".g-prev").addEventListener("click", function () { show(index - 1); });
  lb.querySelector(".g-next").addEventListener("click", function () { show(index + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });

  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "Tab") {
      /* keep focus inside the viewer */
      var f = lb.querySelectorAll("button"), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* swipe */
  var x0 = null;
  lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  /* stop page scrolling behind the viewer (incl. smooth-scroll wheel) */
  lb.addEventListener("wheel", function (e) { e.preventDefault(); e.stopPropagation(); }, { passive: false });
  lb.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
})();
