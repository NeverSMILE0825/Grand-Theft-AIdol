/* Grand Theft AIdol / $GTA — cinematic site interactions, no libraries needed. */
(() => {
  'use strict';
  const doc = document;
  const root = doc.documentElement;
  const $ = (query, parent = doc) => parent.querySelector(query);
  const $$ = (query, parent = doc) => [...parent.querySelectorAll(query)];
  const settings = window.GTA_SITE_CONFIG || {};
  const reduceByOS = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let reducedMotion = reduceByOS;
  try { if (localStorage.getItem('gta-reduce-motion') === 'true') reducedMotion = true; }
  catch (_) { /* localStorage can be blocked by the browser */ }
  if (reducedMotion) root.classList.add('motion-reduced');
  root.classList.add('has-js');

  const showToast = (message) => {
    const element = $('#toast');
    if (!element) return;
    element.textContent = message;
    element.classList.add('is-shown');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => element.classList.remove('is-shown'), 2600);
  };

  // Opening sequence: deliberately brief, skippable for reduced-motion users.
  const boot = $('#boot');
  if (boot) {
    if (reducedMotion) boot.remove();
    else {
      doc.body.classList.add('is-booting');
      const fill = $('#bootFill');
      const percent = $('#bootPercent');
      const start = performance.now();
      const duration = 1030;
      const paint = (time) => {
        const t = Math.min(1, (time - start) / duration);
        const value = Math.round((1 - Math.pow(1 - t, 3)) * 100);
        fill.style.width = `${value}%`;
        percent.textContent = `${String(value).padStart(2, '0')}%`;
        if (t < 1) requestAnimationFrame(paint);
        else {
          boot.classList.add('is-leaving');
          doc.body.classList.remove('is-booting');
          setTimeout(() => boot.remove(), 720);
        }
      };
      requestAnimationFrame(paint);
    }
  }

  // Intersection observer adds reveal timing only when animations are enabled.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.07, rootMargin: '0px 0px -22px 0px' });
    revealItems.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min((index % 3) * 60, 120)}ms`;
      observer.observe(element);
    });
  } else revealItems.forEach(element => element.classList.add('is-visible'));

  // Nav, scroll progress, ambient motion.
  const header = $('#header');
  const readingBar = $('#readingBar');
  const hero = $('#home');
  const heroCutout = $('#heroCutout');
  const nav = $('#mainNav');
  const navToggle = $('#menuToggle');
  let scrollTicking = false;

  const updateScroll = () => {
    const scrollY = window.scrollY;
    const distance = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
    readingBar.style.width = `${Math.min(100, (scrollY / distance) * 100)}%`;
    header.classList.toggle('is-scrolled', scrollY > 30);
    if (!reducedMotion && hero && scrollY < hero.offsetHeight * 1.4) {
      hero.style.setProperty('--hero-photo-y', `${Math.min(95, scrollY * .095).toFixed(1)}px`);
      hero.style.setProperty('--hero-y', `${Math.min(75, scrollY * .065).toFixed(1)}px`);
    }
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) { requestAnimationFrame(updateScroll); scrollTicking = true; }
  }, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  if (hero && heroCutout && !reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    let pointerTick = false;
    let newX = 0;
    let newY = 0;
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      newX = ((event.clientX - rect.left) / rect.width - .5) * -22;
      newY = ((event.clientY - rect.top) / rect.height - .5) * -13;
      if (!pointerTick) {
        pointerTick = true;
        requestAnimationFrame(() => {
          hero.style.setProperty('--hero-x', `${newX.toFixed(1)}px`);
          if (window.scrollY < 30) hero.style.setProperty('--hero-y', `${newY.toFixed(1)}px`);
          pointerTick = false;
        });
      }
    }, { passive: true });
    hero.addEventListener('pointerleave', () => hero.style.setProperty('--hero-x', '0px'));
  }

  const setMobileMenu = (open) => {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    doc.body.classList.toggle('nav-open', open);
  };
  navToggle.addEventListener('click', () => setMobileMenu(!nav.classList.contains('is-open')));
  $$('#mainNav a').forEach(a => a.addEventListener('click', () => setMobileMenu(false)));
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) setMobileMenu(false);
  });
  doc.addEventListener('click', (event) => {
    if (nav.classList.contains('is-open') && !nav.contains(event.target) && !navToggle.contains(event.target)) setMobileMenu(false);
  });

  const activeLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activeLinks.forEach(link => link.classList.toggle('is-active', link.dataset.nav === entry.target.id));
      });
    }, { rootMargin: '-34% 0px -55% 0px', threshold: 0 });
    ['story', 'evidence', 'tokenomics', 'missions', 'crew'].forEach(id => { const el = doc.getElementById(id); if (el) navObserver.observe(el); });
  }

  const motionToggle = $('#motionToggle');
  const updateMotionButton = () => {
    root.classList.toggle('motion-reduced', reducedMotion);
    motionToggle.setAttribute('aria-pressed', String(reducedMotion));
    motionToggle.setAttribute('aria-label', reducedMotion ? 'Enable site animations' : 'Reduce site animations');
    motionToggle.title = reducedMotion ? 'Enable animations' : 'Reduce animations';
    if (reducedMotion) revealItems.forEach(el => el.classList.add('is-visible'));
  };
  updateMotionButton();
  motionToggle.addEventListener('click', () => {
    reducedMotion = !reducedMotion;
    try { localStorage.setItem('gta-reduce-motion', String(reducedMotion)); } catch (_) { /* optional */ }
    updateMotionButton();
    showToast(reducedMotion ? 'Animations reduced' : 'Animations enabled');
  });

  // Token configuration. No fictional contract address, links, metrics, or launch claims.
  const cleanUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' ? url.href : '';
    } catch (_) { return ''; }
  };
  const contract = typeof settings.contractAddress === 'string' && /^0x[0-9a-fA-F]{40}$/.test(settings.contractAddress.trim()) ? settings.contractAddress.trim() : '';
  const contractText = $('#contractText');
  const copyButton = $('#copyContract');
  const contractStatus = $('#contractStatus');
  const tradeLink = $('#tradeLink');
  const tradeUrl = cleanUrl(settings.uniswapUrl) || (contract ? `https://app.uniswap.org/swap?chain=ethereum&inputCurrency=ETH&outputCurrency=${encodeURIComponent(contract)}` : '');
  if (contract) {
    contractText.textContent = contract;
    contractStatus.textContent = 'Ethereum mainnet · public address';
    copyButton.disabled = false;
    copyButton.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(contract);
        else {
          const input = doc.createElement('textarea'); input.value = contract; doc.body.appendChild(input);
          input.select(); if (!doc.execCommand('copy')) throw new Error('Copy unsupported'); input.remove();
        }
        showToast('Contract address copied');
      } catch (_) { showToast('Could not copy. Select the address instead.'); }
    });
  }
  if (contract && tradeUrl) {
    tradeLink.href = tradeUrl;
    tradeLink.target = '_blank';
    tradeLink.rel = 'noopener noreferrer';
    tradeLink.classList.remove('is-unavailable');
    tradeLink.removeAttribute('aria-disabled');
    tradeLink.textContent = 'Trade on Uniswap';
    $('.token__cta-row>span').textContent = 'Verify the contract address yourself before swapping.';
  }

  const social = $('#communityLinks');
  if (social) {
    const links = [{ name: 'X', value: cleanUrl(settings.xUrl) }, { name: 'Telegram', value: cleanUrl(settings.telegramUrl) }];
    social.replaceChildren();
    links.forEach(({ name, value }) => {
      const item = doc.createElement(value ? 'a' : 'span');
      item.className = `btn btn--outline${value ? '' : ' btn--pending'}`;
      item.dataset.social = name.startsWith('X') ? 'x' : 'telegram';
      item.textContent = value ? name : name + ' — Coming soon';
      if (value) { item.href = value; item.target = '_blank'; item.rel = 'noopener noreferrer'; }
      social.appendChild(item);
    });
  }

  // Mission carousel/tabpanel is keyboard-operable.
  const missions = [
    { eyebrow: 'Mission 01 — The arrival', title: 'Touchdown<br>in Vice', desc: 'The jet lands, the cameras turn, and Claudia makes her first entrance into the city.', image: 'mission-arrival.webp', alt: 'Claudia arriving beside a private jet at sunset in a neon coastal city.' },
    { eyebrow: 'Mission 02 — The takeover', title: 'Light up<br>the skyline', desc: 'From a rooftop to a city-sized hologram, Claudia’s signal reaches every corner of the night.', image: 'mission-takeover.webp', alt: 'Claudia overlooking an illuminated city from a rooftop as her giant projection lights up the skyline.' },
    { eyebrow: 'Mission 03 — Five stars', title: 'Sirens after<br>the show', desc: 'The spotlight follows her onto the streets. So do the sirens.', image: 'mission-five-stars.webp', alt: 'A pink speedboat racing across the bay pursued by police boats and helicopters.' },
    { eyebrow: 'Mission 04 — City legend', title: 'The night belongs<br>to the show', desc: 'One last performance. One unforgettable view. Claudia leaves her mark on the skyline.', image: 'mission-city-legend.webp', alt: 'Claudia above a waterfront skyline illuminated by a giant neon portrait of her.' }
  ];
  const missionTabs = $$('.mission-tab');
  const missionView = $('#missionPanel');
  const missionImage = $('#missionImage');
  let missionIndex = 0;
  let missionTimeout = null;
  const setMission = (index, focus = false) => {
    index = (index + missions.length) % missions.length;
    const mission = missions[index];
    missionIndex = index;
    missionTabs.forEach((tab, position) => {
      tab.classList.toggle('is-active', position === index);
      tab.setAttribute('aria-selected', String(position === index));
      tab.tabIndex = position === index ? 0 : -1;
    });
    missionView.setAttribute('aria-labelledby', missionTabs[index].id);
    missionView.classList.add('is-switching');
    clearTimeout(missionTimeout);
    missionTimeout = setTimeout(() => {
      missionImage.src = `assets/images/${mission.image}`;
      missionImage.alt = mission.alt;
      $('#missionEyebrow').textContent = mission.eyebrow;
      $('#missionTitle').innerHTML = mission.title;
      $('#missionDescription').textContent = mission.desc;
      $('#missionCounter').textContent = `${String(index + 1).padStart(2, '0')} / 04`;
      missionView.classList.remove('is-switching');
    }, reducedMotion ? 0 : 190);
    if (focus) missionTabs[index].focus();
  };
  missionTabs.forEach((tab, position) => {
    tab.addEventListener('click', () => setMission(position));
    tab.addEventListener('keydown', event => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? missions.length - 1 : position + (event.key === 'ArrowRight' ? 1 : -1);
        setMission(index, true);
      }
    });
  });
  $('#missionPrev').addEventListener('click', () => setMission(missionIndex - 1));
  $('#missionNext').addEventListener('click', () => setMission(missionIndex + 1));
  missions.slice(1).forEach(m => { const img = new Image(); img.src = `assets/images/${m.image}`; });

  // Lightbox: image gallery with keyboard arrows, ESC, backdrop click, and focus restoration.
  const galleryItems = [
    { title: '01 / The Strip', file: 'city-nightlife.webp', alt: 'Neon nightlife street, sports cars and moonlit coastal skyline' },
    { title: '02 / Rooftop sunset', file: 'rooftop-sunset.webp', alt: 'Claudia looking at a glowing bay from a rooftop at sunset' },
    { title: '03 / After hours', file: 'nightclub.webp', alt: 'Claudia at a neon nightclub bar overlooking the waterfront' },
    { title: '04 / The blue hour', file: 'city-night.webp', alt: 'Moonlit Vice City skyline reflected on the ocean' },
    { title: '05 / Waterfront arrival', file: 'arrival-supercar.webp', alt: 'Claudia leaning against her pink sports car' },
    { title: '06 / The show', file: 'stage-idol.webp', alt: 'Claudia performing onstage' },
    { title: '07 / The chase', file: 'police-chase.webp', alt: 'High-speed nighttime police pursuit' },
    { title: '08 / The casefile', file: 'wanted-dossier.webp', alt: 'Vice City police dossier containing Claudia photographs' }
  ];
  const dialog = $('#galleryDialog');
  const galleryImage = $('#galleryImage');
  const galleryCaption = $('#galleryCaption');
  let galleryIndex = 0;
  let focusBeforeDialog = null;
  const paintGallery = (index) => {
    galleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[galleryIndex];
    galleryImage.src = `assets/images/${item.file}`;
    galleryImage.alt = item.alt;
    galleryCaption.textContent = item.title + ' / ' + String(galleryIndex + 1).padStart(2, '0') + ' OF ' + String(galleryItems.length).padStart(2, '0');
  };
  const openGallery = (index) => {
    focusBeforeDialog = doc.activeElement;
    paintGallery(index);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    $('#closeGallery').focus();
  };
  const closeGallery = () => {
    if (dialog.open) dialog.close();
    if (focusBeforeDialog?.focus) focusBeforeDialog.focus();
  };
  $$('[data-gallery]').forEach(button => button.addEventListener('click', () => openGallery(Number(button.dataset.gallery))));
  $('#openGallery').addEventListener('click', () => openGallery(0));
  $('#closeGallery').addEventListener('click', closeGallery);
  $('#galleryPrev').addEventListener('click', () => paintGallery(galleryIndex - 1));
  $('#galleryNext').addEventListener('click', () => paintGallery(galleryIndex + 1));
  dialog.addEventListener('click', event => { if (event.target === dialog) closeGallery(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); paintGallery(galleryIndex - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); paintGallery(galleryIndex + 1); }
  });

  // Story picture cards open a relevant image instead of being inert focus targets.
  $$('.episode').forEach((episode, index) => {
    episode.setAttribute('role', 'button');
    const sceneNames = ['the arrival', 'the show', 'the chase'];
    episode.setAttribute('aria-label', `Open ${sceneNames[index]} scene`);
    const galleryIndexForEpisode = [4, 5, 6][index];
    episode.addEventListener('click', () => openGallery(galleryIndexForEpisode));
    episode.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openGallery(galleryIndexForEpisode); }
    });
  });

  $('#year').textContent = String(new Date().getFullYear());
})();
