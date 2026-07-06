(function () {
  var toggle = document.getElementById('theme-toggle');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return prefersDark.matches ? 'dark' : 'light';
  }

  function updateIcon() {
    toggle.textContent = currentTheme() === 'dark' ? '☀️' : '🌙';
  }

  toggle.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    updateIcon();
  });

  updateIcon();
})();
