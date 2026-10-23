
(function () {
  "use strict";

  var form = document.querySelector("#order-form");
  var button = document.querySelector("#submit-btn");

  if (!form || !button) return;

  var armed = false;

  function isKeyboardField(el) {
    return !!(
      el &&
      el.matches &&
      el.matches(
        'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), textarea, select'
      )
    );
  }

  // Editing the form resets the two-tap sequence.
  form.addEventListener("input", function () {
    armed = false;
  });

  form.addEventListener("change", function () {
    armed = false;
  });

  document.addEventListener("click", function (e) {
    var hit = e.target && e.target.closest
      ? e.target.closest("#submit-btn")
      : null;

    if (!hit || hit.disabled) return;

    if (armed) {
      armed = false;
      return; // Second tap: let the existing submission proceed.
    }

    var active = document.activeElement;

    if (isKeyboardField(active)) {
      e.preventDefault();
      e.stopImmediatePropagation();

      active.blur(); // Hide the mobile keyboard.
      armed = true;
      return;
    }

    // No keyboard was open: first tap still does nothing.
    e.preventDefault();
    e.stopImmediatePropagation();
    armed = true;
  }, true);
})();
