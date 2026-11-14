/* WebHíd public-site analytics v1. No Google request before opt-in. */
(() => {
  'use strict';
  const id = 'G-F9HG3CVR96', key = 'webhid-analytics-consent-v1';
  const host = location.hostname.replace(/^www\./, '');
  const paths = {
    'barmiar.hu': null,
    'guestike.com': ['/', '/utmutato', '/utmutato.html', '/indulas', '/indulas.html'],
    'gesztike.com': ['/', '/utmutato', '/utmutato.html', '/indulas', '/indulas.html'],
    'magorg.hu': ['/'], 'perudo.hu': ['/'], 'xeretem.hu': ['/']
  };
  if (!Object.hasOwn(paths, host) || (paths[host] && !paths[host].includes(location.pathname))) return;
  if (window.__webhidAnalytics || navigator.webdriver) return;
  window.__webhidAnalytics = true;
  let loaded = false, sent = false, choice = null;
  try { const saved = JSON.parse(localStorage.getItem(key)); if (saved && saved.until > Date.now()) choice = saved.value; } catch {}
  const safePage = location.origin + location.pathname;
  let referrer = '';
  try { referrer = new URL(document.referrer).origin + '/'; } catch {}
  function start() {
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!loaded) {
      loaded = true;
      gtag('consent', 'default', {analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      gtag('js', new Date());
      gtag('config', id, {send_page_view:false,page_location:safePage,page_title:host,page_referrer:referrer,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:15552000,cookie_update:false,linker:{domains:[]}});
      const script = document.createElement('script');
      script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
      script.referrerPolicy = 'no-referrer'; document.head.append(script);
    }
    if (!sent) { sent = true; gtag('event', 'page_view', {send_to:id,page_location:safePage,page_title:host,page_referrer:referrer}); }
  }
  function save(value) {
    choice = value;
    try { localStorage.setItem(key, JSON.stringify({value,until:Date.now()+15552000000})); } catch {}
    if (value === 'accepted') start();
    else {
      window['ga-disable-' + id] = true;
      // Stop subsequent events and remove this site's Analytics cookies.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const domain of ['', location.hostname, '.'+location.hostname, host, '.'+host])
          document.cookie = name+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'');
      }
    }
    panel.hidden = true; settings.hidden = false;
  }
  const wrapper = document.createElement('div'); wrapper.id = 'webhid-analytics-consent';
  const root = wrapper.attachShadow({mode:'open'});
  root.innerHTML = `<style>:host{position:fixed;z-index:2147483000;bottom:12px;left:12px;max-width:calc(100vw - 24px);font:14px/1.5 system-ui,sans-serif;color:#172332}*{box-sizing:border-box}[hidden]{display:none!important}.panel{width:420px;max-width:100%;padding:18px;background:#fff;border:1px solid #667788;border-radius:12px;box-shadow:0 6px 30px #0003}h2{font-size:17px;margin:0 0 8px}p{margin:0 0 12px}.buttons{display:flex;flex-wrap:wrap;gap:8px}button{font:inherit;border:1px solid #42556a;background:#fff;color:#172332;border-radius:6px;padding:9px 12px;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #2684ff;outline-offset:2px}.settings{font-size:12px;padding:6px 9px;background:#fff}a{color:#164bb0}</style><section class="panel" role="region" aria-label="Látogatottság mérése"><h2>Látogatottság mérése</h2><p>Hozzájárulsz, hogy a Google Analytics sütikkel mérje az oldal látogatottságát? Csak a nyilvános oldalmegnyitást mérjük; űrlapadatot nem küldünk. A Google az eszköz és a hálózat adatait is feldolgozza. A döntést 180 napig megőrizzük, és a „Mérés beállítása” gombbal bármikor módosíthatod.</p><p><a href="https://policies.google.com/technologies/partner-sites?hl=hu" target="_blank" rel="noopener noreferrer">A Google adatkezelése</a></p><div class="buttons"><button type="button" data-choice="declined">Nem kérem</button><button type="button" data-choice="accepted">Hozzájárulok</button></div></section><button type="button" class="settings">Mérés beállítása</button>`;
  const panel = root.querySelector('.panel'), settings = root.querySelector('.settings');
  panel.hidden = choice !== null; settings.hidden = choice === null;
  root.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => save(button.dataset.choice)));
  settings.addEventListener('click', () => {panel.hidden=false;settings.hidden=true;root.querySelector('[data-choice]').focus();});
  document.body.append(wrapper);
  if (choice === 'accepted') start();
})();
