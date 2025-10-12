// Documentation page script: theme init + sync across pages
(function(){
  const themeSelect = document.getElementById('themeSelect');

  function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-dark','theme-dracula','theme-vscode','theme-pink');
    switch(theme) {
      case 'dark': body.classList.add('theme-dark'); break;
      case 'dracula': body.classList.add('theme-dracula'); break;
      case 'vscode': body.classList.add('theme-vscode'); break;
      case 'pink': body.classList.add('theme-pink'); break;
      default: /* light */ break;
    }
  }
  function initTheme() {
    let stored = '';
    try { stored = localStorage.getItem('et_theme') || ''; } catch {}
    if (!['light','dark','dracula','vscode','pink'].includes(stored)) stored = 'light';
    if (themeSelect) themeSelect.value = stored;
    applyTheme(stored);
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      const val = themeSelect.value;
      applyTheme(val);
      try { localStorage.setItem('et_theme', val); } catch {}
    });
  }

  // Cross-tab/page sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'et_theme') {
      const t = e.newValue && ['light','dark','dracula','vscode','pink'].includes(e.newValue) ? e.newValue : 'light';
      applyTheme(t);
      if (themeSelect) themeSelect.value = t;
    }
  });

  initTheme();
})();
