(function () {
  var input = document.getElementById("nav-toggle");
  var label = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!input || !nav || !label) return;

  function sync() {
    label.setAttribute("aria-expanded", input.checked ? "true" : "false");
  }

  function closeMenu() {
    input.checked = false;
    sync();
  }

  input.addEventListener("change", sync);
  window.addEventListener("hashchange", closeMenu);
  nav.addEventListener("click", function (event) {
    if (!event.target.closest("a")) return;
    setTimeout(closeMenu, 60);
  });
  sync();
})();
