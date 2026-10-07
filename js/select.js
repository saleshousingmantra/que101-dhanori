/* UQE101 custom dropdown.
   Upgrades every <select data-custom> into a styled, accessible listbox.
   The real <select> stays in the form (visually hidden), so form.js keeps
   reading its value, validation and "required" logic are unchanged, and
   anything that sets select.value (e.g. the pricing-card CTAs) still works. */
(function () {
  "use strict";

  function splitLabel(text) {
    // "2 BHK (828 – 838 sq.ft carpet)" -> ["2 BHK", "828 – 838 sq.ft carpet"]
    var m = text.match(/^(.*?)\s*\((.*)\)\s*$/);
    return m ? [m[1], m[2]] : [text, ""];
  }

  function enhance(select, n) {
    var wrap = document.createElement("div");
    wrap.className = "cs";
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add("cs-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    var label = document.querySelector('label[for="' + select.id + '"]');
    var listId = select.id + "-list";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cs-btn";
    btn.id = select.id + "-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", listId);
    if (label) {
      label.id = label.id || select.id + "-label";
      label.setAttribute("for", btn.id);
      btn.setAttribute("aria-labelledby", label.id + " " + btn.id);
    }
    btn.innerHTML = '<span class="cs-val"></span><span class="cs-sub"></span><i class="cs-chev" aria-hidden="true"></i>';
    wrap.insertBefore(btn, select);

    var list = document.createElement("ul");
    list.className = "cs-list";
    list.id = listId;
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;
    list.setAttribute("data-lenis-prevent", ""); // smooth-scroll must not swallow list scrolling
    if (label) list.setAttribute("aria-labelledby", label.id);
    wrap.appendChild(list);

    var opts = [];
    Array.prototype.forEach.call(select.options, function (o, i) {
      if (o.disabled && !o.value) return; // placeholder
      var parts = splitLabel(o.textContent.trim());
      var li = document.createElement("li");
      li.id = select.id + "-opt-" + i;
      li.setAttribute("role", "option");
      li.dataset.value = o.value;
      li.innerHTML = "<b></b><span></span>";
      li.firstChild.textContent = parts[0];
      li.lastChild.textContent = parts[1];
      list.appendChild(li);
      opts.push(li);
    });

    var placeholder = (select.querySelector("option[value='']") || {}).textContent || "Select";
    var active = -1;

    function sync() {
      var o = select.options[select.selectedIndex];
      var has = o && o.value;
      var parts = has ? splitLabel(o.textContent.trim()) : [placeholder, ""];
      btn.querySelector(".cs-val").textContent = parts[0];
      btn.querySelector(".cs-sub").textContent = parts[1];
      btn.classList.toggle("is-empty", !has);
      opts.forEach(function (li) {
        li.setAttribute("aria-selected", String(has && li.dataset.value === o.value));
      });
    }

    function setActive(i) {
      if (!opts.length) return;
      active = (i + opts.length) % opts.length;
      opts.forEach(function (li, k) { li.classList.toggle("active", k === active); });
      list.setAttribute("aria-activedescendant", opts[active].id);
      opts[active].scrollIntoView({ block: "nearest" });
    }

    function open() {
      if (wrap.classList.contains("open")) return;
      document.querySelectorAll(".cs.open").forEach(function (w) { w._csClose && w._csClose(); });
      /* Open upward when there isn't room below, and fit the viewport. */
      var r = btn.getBoundingClientRect(), vh = window.innerHeight;
      var below = vh - r.bottom - 12, above = r.top - 12, want = Math.min(280, list.scrollHeight || 280);
      var up = below < want && above > below;
      wrap.classList.toggle("up", up);
      list.style.maxHeight = Math.max(140, Math.min(280, up ? above : below)) + "px";
      wrap.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      var sel = opts.findIndex(function (li) { return li.getAttribute("aria-selected") === "true"; });
      setActive(sel >= 0 ? sel : 0);
      list.focus({ preventScroll: true });
    }

    function close(refocus) {
      if (!wrap.classList.contains("open")) return;
      wrap.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      list.removeAttribute("aria-activedescendant");
      if (refocus) btn.focus({ preventScroll: true });
    }
    wrap._csClose = function () { close(false); };

    function choose(i) {
      var v = opts[i].dataset.value;
      if (select.value !== v) {
        select.value = v;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      sync();
      close(true);
    }

    btn.addEventListener("click", function () {
      wrap.classList.contains("open") ? close(true) : open();
    });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault(); open();
      }
    });
    list.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Home") { e.preventDefault(); setActive(0); }
      else if (e.key === "End") { e.preventDefault(); setActive(opts.length - 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (active >= 0) choose(active); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === "Tab") { close(false); }
      else if (/^[0-9a-z]$/i.test(e.key)) {
        var k = opts.findIndex(function (li, idx) {
          return idx > active && li.textContent.trim().toLowerCase().indexOf(e.key.toLowerCase()) === 0;
        });
        if (k < 0) k = opts.findIndex(function (li) { return li.textContent.trim().toLowerCase().indexOf(e.key.toLowerCase()) === 0; });
        if (k >= 0) setActive(k);
      }
    });
    opts.forEach(function (li, i) {
      li.addEventListener("click", function () { choose(i); });
      li.addEventListener("mousemove", function () { if (active !== i) setActive(i); });
    });
    document.addEventListener("pointerdown", function (e) {
      if (!wrap.contains(e.target)) close(false);
    });
    list.addEventListener("wheel", function (e) { e.stopPropagation(); }, { passive: true });

    /* Keep the custom UI in step with the real <select>. */
    select.addEventListener("change", sync);
    select.addEventListener("focus", function () { btn.focus(); }); // form.js focuses the select on errors
    var form = select.form;
    if (form) form.addEventListener("reset", function () { setTimeout(sync, 0); });
    /* Mirror the invalid state that form.js puts on the select. */
    new MutationObserver(function () {
      btn.classList.toggle("is-invalid", select.classList.contains("is-invalid"));
      var d = select.getAttribute("aria-describedby");
      d ? btn.setAttribute("aria-describedby", d) : btn.removeAttribute("aria-describedby");
      btn.setAttribute("aria-invalid", select.getAttribute("aria-invalid") || "false");
    }).observe(select, { attributes: true, attributeFilter: ["class", "aria-invalid", "aria-describedby"] });
    /* Catch programmatic value changes that don't fire events. */
    var desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    Object.defineProperty(select, "value", {
      configurable: true,
      get: function () { return desc.get.call(this); },
      set: function (v) { desc.set.call(this, v); sync(); }
    });

    sync();
  }

  document.querySelectorAll("select[data-custom]").forEach(enhance);
})();
