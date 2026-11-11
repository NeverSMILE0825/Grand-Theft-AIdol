(() => {
  'use strict';

  if (window.__GTA_TRACKING__) return;
  window.__GTA_TRACKING__ = true;

  const HOSTED = 'https://gtaidol.103.161.35.238.sslip.io';
  const VISITOR_KEY = 'gta_aidol_vid';
  const SECTIONS = [
    ['#home', 'home'],
    ['#story', 'story'],
    ['#evidence', 'evidence'],
    ['#wanted', 'wanted'],
    ['#tokenomics', 'tokenomics'],
    ['#idol', 'idol'],
    ['#missions', 'missions'],
    ['#archive', 'archive'],
    ['#crew', 'crew']
  ];

  function origin() {
    const host = location.hostname.toLowerCase();
    if (
      host === 'grandtheftaidol.xyz' ||
      host === 'www.grandtheftaidol.xyz' ||
      host === '127.0.0.1' ||
      host === 'localhost'
    ) {
      return HOSTED;
    }
    return '';
  }

  function refused() {
    if (navigator.globalPrivacyControl) return true;
    const dnt = navigator.doNotTrack;
    return dnt === '1' || dnt === 'yes';
  }

  if (refused() || /\/dashboard\/?$/.test(location.pathname)) return;

  const api = origin();
  if (!api && location.protocol === 'file:') return;

  function readStored(storage, key) {
    try {
      return storage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  function writeStored(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch {
      /* ignore quota / private mode */
    }
  }

  function visitorId() {
    const existing = readStored(localStorage, VISITOR_KEY);
    if (/^[A-Za-z0-9_-]{16,80}$/.test(existing)) return existing;
    const created = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '').slice(0, 32);
    writeStored(localStorage, VISITOR_KEY, created);
    return created;
  }

  const vid = visitorId();
  let latestSection = 'home';
  let pageViewSent = false;
  let pageReady = false;
  const clickGuard = new Map();

  function fields() {
    const params = new URLSearchParams(location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined
    };
  }

  function payload(type, eventId, click) {
    const body = {
      type,
      eventId,
      visitorId: vid,
      path: location.pathname + location.search,
      section: latestSection,
      referrer: document.referrer,
      ...fields()
    };
    if (click) body.click = click;
    return body;
  }

  function post(route, body) {
    return fetch((api || '') + route, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: api ? 'include' : 'same-origin',
      cache: 'no-store',
      keepalive: true
    }).then((response) => response.ok).catch(() => false);
  }

  function noteSection(section) {
    if (!section || section === latestSection) return;
    latestSection = section;
    if (!pageReady) return;
    post('/api/analytics/collect', payload('section', crypto.randomUUID()));
  }

  function trackClick(click) {
    if (!pageReady) return;
    const now = Date.now();
    const previous = clickGuard.get(click) || 0;
    if (now - previous < 1200) return;
    clickGuard.set(click, now);
    post('/api/analytics/collect', payload('click', crypto.randomUUID(), click));
  }

  let heartbeatId = crypto.randomUUID();
  let timer = 0;

  function beat() {
    if (!pageReady || document.visibilityState !== 'visible') return;
    const id = heartbeatId;
    post('/api/analytics/heartbeat', payload('heartbeat', id)).then((ok) => {
      if (ok) heartbeatId = crypto.randomUUID();
    });
  }

  function arm() {
    window.clearInterval(timer);
    if (!pageReady || document.visibilityState !== 'visible') return;
    timer = window.setInterval(beat, 30000);
  }

  function sendPageview() {
    if (pageViewSent) return;
    pageViewSent = true;
    const pageId = crypto.randomUUID();
    post('/api/analytics/collect', payload('pageview', pageId)).then((ok) => {
      if (!ok) {
        pageViewSent = false;
        return;
      }
      pageReady = true;
      if (document.visibilityState === 'visible') beat();
      arm();
    });
  }

  sendPageview();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      beat();
      arm();
    } else {
      window.clearInterval(timer);
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.45) return;
        noteSection(entry.target.getAttribute('data-section'));
      });
    }, { threshold: [0.45] });
    SECTIONS.forEach(([selector, name]) => {
      const node = document.querySelector(selector);
      if (!node) return;
      node.setAttribute('data-section', name);
      observer.observe(node);
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const copy = target.closest('[data-copy-contract]');
    if (copy && !copy.disabled) {
      trackClick('copy');
      return;
    }
    const social = target.closest('[data-social]');
    if (social && (social.dataset.social === 'telegram' || social.dataset.social === 'x')) {
      trackClick(social.dataset.social);
      return;
    }
    if (target.closest('.archive-shot, #openGallery, #galleryPrev, #galleryNext')) {
      trackClick('gallery');
      return;
    }
    if (target.closest('.mission-tab, #missionPrev, #missionNext')) {
      trackClick('mission');
    }
  });
})();
