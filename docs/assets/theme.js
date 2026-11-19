// Runs before the page is drawn so a saved light or dark choice never flashes the wrong colors.
(function () {
  try {
    var t = localStorage.getItem('pw-lite-theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* storage blocked: follow the device */ }
})();
