/* UQE101: the page-load progress bar that used to sit here is
   replaced by the site's own loader (fx script), so it is removed. */

/* Lead-source capture (first-touch attribution + form-field fill) now
   lives in config.js, since it's reusable boilerplate for the next
   project rather than something specific to this site's UI. It runs
   before this file (config.js loads first) and fills any [name="source"]
   / [name="source_link"] field on the page — see config.js for details. */

document.addEventListener('DOMContentLoaded', function () {

  /* Fill "Project", "Developer" and "Relationship Manager" fields
     from config.js so there is one place to change any of them,
     instead of editing each form in index.html. Falls back to
     whatever is already in the HTML if config.js hasn't loaded.
     Project/Developer are shown to the visitor (readonly, so they
     can see which project and builder they're enquiring about)
     as well as sent with the enquiry. */
  var cfg = window.SITE_CONFIG || {};
  if (cfg.PROJECT_NAME) {
    document.querySelectorAll('[name="project"]').forEach(function (el) {
      el.value = cfg.PROJECT_NAME;
    });
  }
  if (cfg.DEFAULT_DEVELOPER_NAME) {
    document.querySelectorAll('[name="developer"]').forEach(function (el) {
      el.value = cfg.DEFAULT_DEVELOPER_NAME;
    });
  }
  if (cfg.DEFAULT_MANAGER_NAME) {
    document.querySelectorAll('[name="manager_name"]').forEach(function (el) {
      el.value = cfg.DEFAULT_MANAGER_NAME;
    });
  }
  if (cfg.DEFAULT_MANAGER_EMAIL) {
    document.querySelectorAll('[name="manager_email"]').forEach(function (el) {
      el.value = cfg.DEFAULT_MANAGER_EMAIL;
    });
  }

  /* Mobile nav toggle */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    /* Close mobile nav after tapping a link */
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* UQE101: in-page smooth scrolling is handled by the site's own
     smooth-scroll (Lenis) in the fx script, so it is not repeated here. */

  /* Back-to-top button */
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 600) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =====================================================
     ENQUIRY POPUP MODAL
     Note: form validation, the Supabase insert, and the
     success message are all handled by form.js. This file
     opens/closes the popup, pre-fills the "Interested In"
     field, and — the important part — decides what happens
     AFTER a successful submit based on which button opened
     the popup ("intent"): a plain enquiry, or a WhatsApp chat.
     WhatsApp never fires on its own — it only runs once
     form.js confirms the enquiry was saved to Supabase, so
     every WhatsApp click still becomes a captured lead.

     Call is the one exception: data-intent="call" buttons skip
     this popup entirely and dial the number directly (see the
     click handler below) — a call button should behave like a
     phone number, not an enquiry form.
  ===================================================== */
  var CONTACT_NUMBER = '917264011256';        // +91 7264011256, no symbols, for wa.me / tel:
  var pendingWaWindow = null;

  var modalOverlay = document.getElementById('modalOverlay');
  var modalClose = document.getElementById('modalClose');
  var modalForm = document.getElementById('modalForm');
  var modalInterest = document.getElementById('modal-interest');
  var modalTitle = document.getElementById('modalTitle');
  var modalSub = document.getElementById('modalSub');
  var modalSubmit = document.getElementById('modalSubmit');

  var INTENT_COPY = {
    enquire: {
      title: 'Enquire about UQE101',
      sub: 'Share your details and our team will call you with pre-launch pricing and floor plans.',
      submit: 'Send enquiry'
    },
    whatsapp: {
      title: 'Chat with us on WhatsApp',
      sub: 'Share your details and WhatsApp will open with your enquiry ready to send.',
      submit: 'Continue to WhatsApp'
    }
    /* No "call" entry: data-intent="call" buttons dial directly and
       never open this popup at all — see the click handler below. */
  };

  function openModal(plan, intent, auto) {
    if (!modalOverlay) return;

    var activeIntent = intent || 'enquire';
    modalOverlay.dataset.intent = activeIntent;

    var copy = INTENT_COPY[activeIntent] || INTENT_COPY.enquire;
    if (modalTitle) modalTitle.innerHTML = copy.title;
    if (modalSub) modalSub.textContent = copy.sub;
    if (modalSubmit) modalSubmit.textContent = copy.submit;

    if (plan && modalInterest) {
      modalInterest.value = plan;
    }

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    var firstField = document.getElementById('modal-name');
    /* When the popup opens by itself on a phone, don't pop the keyboard
       up over the form; focus the first field only on a deliberate open
       or on devices with a mouse. */
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (firstField && !(auto && touch)) {
      window.setTimeout(function () { firstField.focus(); }, 100);
    }
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });

  /* Any element marked data-open-modal opens the popup — EXCEPT
     data-intent="call", which dials the number directly with no
     form in the way. Optional data-plan pre-selects a unit type
     (used by the pricing card CTAs). Optional data-intent
     otherwise decides what runs after a successful submit —
     defaults to a plain enquiry. */
  document.querySelectorAll('[data-open-modal]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (el.getAttribute('data-intent') === 'call') {
        window.location.href = 'tel:+' + CONTACT_NUMBER;
        return;
      }
      openModal(el.getAttribute('data-plan'), el.getAttribute('data-intent'));
    });
  });

  /* form.js's own "submit" listener on this same form runs first
     (it was attached first, since form.js loads before this file)
     and does the async Supabase insert. This second listener runs
     synchronously right after it, in the same click — so we grab
     a blank tab HERE, while the browser still trusts this as a
     real user gesture, rather than after the async insert resolves
     (by which point some browsers block window.open as a popup). */
  if (modalForm) {
    modalForm.addEventListener('submit', function () {
      var intent = modalOverlay ? modalOverlay.dataset.intent : 'enquire';
      if (intent === 'whatsapp') {
        pendingWaWindow = window.open('', '_blank');
      }
    });
  }

  /* form.js dispatches "enquirySubmitted" on the form right after
     a successful Supabase insert. We listen for it here, and only
     act on it for the popup form — the footer form has no
     WhatsApp intent tied to it. The message is built from what
     they just typed, so it's already filled in — nothing left
     for the visitor to type once WhatsApp opens. */
  if (modalForm) {
    modalForm.addEventListener('enquirySubmitted', function (e) {
      var intent = modalOverlay ? modalOverlay.dataset.intent : 'enquire';
      var detail = e.detail || {};

      if (intent === 'whatsapp') {
        /* UQE101: greeting requested by the owner, then the form details. */
        var message =
          'Hello Manik ji,\n\n' +
          'I would like to enquire about ' + (detail.project || 'UQE101, Dhanori, Pune') + '.\n\n' +
          'Name: ' + (detail.name || '') + '\n' +
          'Mobile: ' + (detail.phone || '') + '\n' +
          'Email: ' + (detail.email || '') + '\n' +
          'Configuration: ' + (detail.interest || '');
        var waUrl = 'https://wa.me/' + CONTACT_NUMBER + '?text=' + encodeURIComponent(message);

        if (pendingWaWindow && !pendingWaWindow.closed) {
          pendingWaWindow.location.href = waUrl;
        } else {
          window.open(waUrl, '_blank');
        }
        pendingWaWindow = null;
      }
      /* No "call" branch here: call buttons dial directly on click
         (see the [data-open-modal] handler above) and never reach
         this popup or its submit flow at all. */
    });
  }

  /* If the save fails, close the blank tab that was opened for
     WhatsApp on submit, so the visitor isn't left with an empty tab. */
  if (modalForm) {
    modalForm.addEventListener('enquiryFailed', function () {
      if (pendingWaWindow && !pendingWaWindow.closed) {
        pendingWaWindow.close();
      }
      pendingWaWindow = null;
    });
  }

  /* Auto-open the popup ONCE, 20 seconds after the page loads (or is
     refreshed). It never re-opens by itself, and it stays away if the
     visitor already opened it, is filling in a form, is using a dropdown,
     or has the menu or gallery viewer open. */
  var AUTO_OPEN_DELAY_MS = 20000;
  window.setTimeout(function () {
    var a = document.activeElement;
    var busy =
      (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || (a.closest && a.closest('form, .cs')))) ||
      document.querySelector('.cs.open') ||
      document.documentElement.classList.contains('menu-open') ||
      document.documentElement.classList.contains('g-lock');
    if (modalOverlay && !modalOverlay.classList.contains('open') && !busy) {
      openModal(null, null, true);
    }
  }, AUTO_OPEN_DELAY_MS);

  /* =====================================================
     IMAGE LOAD SHIMMER
     Every <img> keeps its real src/alt in the DOM at all
     times (nothing here touches that), so this is a pure
     visual affordance: a shimmer placeholder while an image
     is loading, then a soft fade-in once it's ready.
  ===================================================== */
  document.querySelectorAll('img').forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('img-loaded');
      return;
    }
    img.classList.add('img-loading');
    function done() {
      img.classList.remove('img-loading');
      img.classList.add('img-loaded');
    }
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* UQE101: scroll-reveal and the hero carousel are handled by the
     site's own fx script (random reveals + arch slideshow), so the
     generic versions from the template are removed here. */

});
