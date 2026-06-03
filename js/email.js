(function () {
  function buildEmailLinks() {
    var links = document.querySelectorAll('.js-email');
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      var user = el.getAttribute('data-user');
      var domain = el.getAttribute('data-domain');
      if (!user || !domain) continue;
      var addr = user + '@' + domain;
      el.setAttribute('href', 'mailto:' + addr);
      var text = el.querySelector('.js-email-text');
      if (text) text.textContent = addr;
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildEmailLinks);
  } else {
    buildEmailLinks();
  }
})();
