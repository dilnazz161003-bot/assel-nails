(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* приватный режим */ } },
  };

  const state = {
    lang: store.get('lang') === 'kk' ? 'kk' : 'ru',
    selected: new Set(),
    step: 1,
    viewMonth: null, // Date — первое число отображаемого месяца
    date: null,      // 'YYYY-MM-DD'
    time: null,      // 'HH:MM'
    filter: 'all',
    shadeMode: 'mood',
    shadeId: 'calm',
  };

  const t = (key) => I18N[state.lang][key] ?? I18N.ru[key] ?? key;
  const tx = (obj) => obj[state.lang] ?? obj.ru;

  /* ---------- Форматирование ---------- */
  const formatPrice = (n) => new Intl.NumberFormat('ru-RU').format(n).replace(/ /g, ' ') + ' ₸';

  const formatDuration = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const parts = [];
    if (h) parts.push(`${h} ${t('services.h')}`);
    if (m) parts.push(`${m} ${t('services.min')}`);
    return parts.join(' ') || `0 ${t('services.min')}`;
  };

  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const fromMin = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

  const formatDateLong = (iso) => {
    const d = parseIso(iso);
    const day = d.getDate();
    const month = t('monthsGen')[d.getMonth()];
    const weekday = t('weekdaysLong')[d.getDay()];
    return `${day} ${month}, ${weekday}`;
  };

  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

  /* ---------- Язык ---------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
    $$('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        el.setAttribute(attr, t(key));
      });
    });
    $$('.lang__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    $('.brand').setAttribute('aria-label', `${t('brand.name')} — nail studio`);
    const burger = $('.burger');
    burger.setAttribute('aria-label', t(burger.getAttribute('aria-expanded') === 'true' ? 'nav.close' : 'nav.open'));

    renderServices();
    renderGallery();
    renderShadeOptions();
    renderShades();
    renderReviews();
    renderPickList();
    renderCalendar();
    renderSlots();
    renderSummary();
    updateStepUI();
    if (state.step === 4) renderConfirm();
  }

  $$('.lang__btn').forEach((btn) => btn.addEventListener('click', () => {
    if (state.lang === btn.dataset.lang) return;
    state.lang = btn.dataset.lang;
    store.set('lang', state.lang);
    applyLang();
  }));

  /* ---------- Мобильное меню ---------- */
  const burger = $('.burger');
  const nav = $('#nav');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', t(open ? 'nav.close' : 'nav.open'));
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Услуги ---------- */
  function toggleService(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    // Длительность изменилась — выбранное время может перестать помещаться
    if (state.time && !slotFits(state.date, state.time)) state.time = null;
    renderServices();
    renderPickList();
    renderSlots();
    renderSummary();
    $('#err1').textContent = '';
  }

  // Флакон и ноготь в цвете услуги/оттенка — вместо фотографии продукта
  function bottleArt(color, bg) {
    return `
      <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="200" height="150" fill="${bg}"/>
        <ellipse cx="100" cy="134" rx="74" ry="7" fill="#000" opacity=".12"/>
        <use href="#bottle" x="40" y="12" width="62" height="124"/>
        <use href="#nail" x="114" y="40" width="46" height="92" fill="${color}"/>
      </svg>`;
  }

  // Широкий баннер для раздела прайса
  function menuArt(color, bg) {
    return `
      <svg viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="300" height="120" fill="${bg}"/>
        <ellipse cx="150" cy="110" rx="80" ry="5" fill="#000" opacity=".12"/>
        <use href="#bottle" x="100" y="8" width="52" height="104"/>
        <use href="#nail" x="162" y="30" width="40" height="80" fill="${color}"/>
      </svg>`;
  }

  // Цена услуги так, как в прайсе: «от 500 ₸», «+1 000 ₸», «10 000 – 11 000 ₸»
  function priceLabel(sv) {
    if (sv.priceTo) return `${formatPrice(sv.price).replace(' ₸', '')} – ${formatPrice(sv.priceTo)}`;
    return (sv.priceFrom ? t('services.from') + ' ' : '') + (sv.plus ? '+' : '') + formatPrice(sv.price);
  }

  function renderServices() {
    $('#serviceList').innerHTML = CATEGORIES.map((c, i) => `
      <li class="menu" style="--i:${i}">
        <div class="menu__art">${menuArt(c.swatch, c.bg)}</div>
        <h3 class="menu__title">${tx(c.name)}</h3>
        <ul class="menu__list">
          ${SERVICES.filter((sv) => sv.cat === c.id).map((sv) => {
            const on = state.selected.has(sv.id);
            return `
            <li>
              <button type="button" class="menu__item ${on ? 'is-selected' : ''}" data-id="${sv.id}" aria-pressed="${on}" style="--c:${sv.swatch}">
                <span class="menu__check" aria-hidden="true"></span>
                <span class="menu__name">${tx(sv.name)}${sv.note ? `<small>${tx(sv.note)}</small>` : ''}</span>
                <span class="menu__price">${priceLabel(sv)}</span>
              </button>
            </li>`;
          }).join('')}
        </ul>
      </li>`).join('');
    $('#priceDate').textContent = tx(PRICE_DATE);
  }
  $('#serviceList').addEventListener('click', (e) => {
    const btn = e.target.closest('.menu__item');
    if (btn) toggleService(btn.dataset.id);
  });

  /* ---------- Портфолио ---------- */
  // Абстрактный «эскиз» работы: несколько ногтей в палитре
  function nailArt(item, idx) {
    const n = 4;
    const nails = [];
    for (let i = 0; i < n; i++) {
      const color = item.palette[i % item.palette.length];
      const x = 30 + i * 62;
      const y = 70 - Math.abs(i - 1.5) * 18 + (i === 3 ? 22 : 0);
      const rot = (i - 1.5) * 7;
      const cx = x + 25;
      const cy = y + 50;
      let extra = '';
      if (item.tip) {
        extra = `<path d="M${x + 4} ${y + 26}c3-16 11-24 21-24s18 8 21 24c-7-6-14-8-21-8s-14 2-21 8Z" fill="${item.tip}"/>`;
      }
      if (item.deco === 'line' && i % 2 === 1) {
        extra = `<path d="M${x + 25} ${y + 10} V${y + 92}" stroke="${item.palette[(i + 1) % item.palette.length]}" stroke-width="2.5"/>`;
      }
      if (item.deco === 'dots' && i % 2 === 0) {
        extra = `<circle cx="${cx}" cy="${y + 72}" r="5" fill="#6E2A30"/><circle cx="${cx}" cy="${y + 56}" r="3" fill="#6E2A30"/>`;
      }
      if (item.deco === 'moon') {
        extra = `<path d="M${x + 6} ${y + 100}c4-10 11-15 19-15s15 5 19 15Z" fill="#F7F2EC" opacity=".85"/>`;
      }
      nails.push(`<g transform="rotate(${rot} ${cx} ${cy})"><use href="#nail" x="${x}" y="${y}" width="50" height="100" fill="${color}"/>${extra}</g>`);
    }
    const orb = ['#A4553A', '#6E2A30', '#C99A86', '#E6CDB9'][idx % 4];
    return `
      <svg viewBox="0 0 300 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <rect width="300" height="220" fill="${item.bg}"/>
        <circle cx="${idx % 2 ? 250 : 50}" cy="${idx % 3 ? 190 : 34}" r="${18 + (idx % 3) * 8}" fill="${orb}" opacity=".9"/>
        ${nails.join('')}
      </svg>`;
  }

  function renderGallery() {
    const items = PORTFOLIO
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => state.filter === 'all' || item.style === state.filter);
    $('#gallery').innerHTML = items.map(({ item, idx }, i) => `
      <li class="tile ${state.filter === 'all' && item.size ? `tile--${item.size}` : ''}" style="--i:${i}">
        <figure style="background:${item.bg}">
          ${nailArt(item, idx)}
          <figcaption><span>${tx(item.title)}</span><small>${t('portfolio.' + item.style)}</small></figcaption>
        </figure>
      </li>`).join('');
  }

  $('#portfolioFilter').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.filter = chip.dataset.filter;
    $$('.chip', $('#portfolioFilter')).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    renderGallery();
  });

  /* ---------- Подбери оттенок ---------- */
  const currentShadeSet = () => SHADES[state.shadeMode].find((s) => s.id === state.shadeId) || SHADES[state.shadeMode][0];

  function renderShadeOptions() {
    $('#shadeOptions').setAttribute('aria-label', t(state.shadeMode === 'mood' ? 'shade.byMood' : 'shade.bySeason'));
    $('#shadeOptions').innerHTML = SHADES[state.shadeMode].map((o) => `
      <button type="button" class="pill" data-id="${o.id}" aria-pressed="${o.id === currentShadeSet().id}">
        <span class="pill__dots" aria-hidden="true">${o.shades.map((s) => `<i style="--c:${s.hex}"></i>`).join('')}</span>
        ${tx(o.label)}
      </button>`).join('');
  }

  function renderShades() {
    const set = currentShadeSet();
    $('#shadeSwatches').innerHTML = set.shades.map((s, i) => `
      <li class="swatch" style="--c:${s.hex}; --i:${i}">
        <span class="swatch__art">${bottleArt(s.hex, '#EFE6DB')}</span>
        <span class="swatch__name">${tx(s.name)}</span>
        <span class="swatch__hex">${s.hex}</span>
      </li>`).join('');
  }

  $$('.segmented__btn').forEach((btn) => btn.addEventListener('click', () => {
    state.shadeMode = btn.dataset.mode;
    state.shadeId = SHADES[state.shadeMode][0].id;
    $$('.segmented__btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    renderShadeOptions();
    renderShades();
  }));

  $('#shadeOptions').addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    state.shadeId = pill.dataset.id;
    renderShadeOptions();
    renderShades();
  });

  $('#shadeUse').addEventListener('click', () => {
    const set = currentShadeSet();
    const line = t('shade.comment')
      .replace('{name}', tx(set.label))
      .replace('{shades}', set.shades.map((s) => tx(s.name)).join(', '));
    const field = $('#fComment');
    field.value = field.value ? `${field.value}\n${line}` : line;
    $('#booking').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });

  /* ---------- Отзывы ---------- */
  function renderReviews() {
    $('#reviewList').innerHTML = REVIEWS.map((r, i) => `
      <li class="review" style="--c:${r.swatch}; --i:${i}">
        <p class="review__stars" role="img" aria-label="${t('reviews.rating')}">${'<svg aria-hidden="true"><use href="#i-star"/></svg>'.repeat(5)}</p>
        <blockquote>
          <p>${tx(r.text)}</p>
        </blockquote>
        <p class="review__author"><span class="review__swatch" aria-hidden="true"></span><b>${r.name}</b><small>${tx(r.service)}</small></p>
      </li>`).join('');
  }

  /* ---------- Запись: расчёты ---------- */
  const selectedServices = () => SERVICES.filter((s) => state.selected.has(s.id));
  const totalPrice = () => selectedServices().reduce((sum, s) => sum + s.price, 0);
  const totalDuration = () => selectedServices().reduce((sum, s) => sum + s.duration, 0);
  const totalPriceMax = () => selectedServices().reduce((sum, s) => sum + (s.priceTo || s.price), 0);
  const hasFromPrice = () => selectedServices().some((s) => s.priceFrom);

  // Детерминированный «шум», чтобы демо-занятость не прыгала при перерисовке
  function pseudoBusy(iso, time) {
    let h = 0;
    const str = iso + time;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % 100 < 28;
  }

  function isBusy(iso, time) {
    if ((CONFIG.bookedSlots[iso] || []).includes(time)) return true;
    return CONFIG.demoBusy && pseudoBusy(iso, time);
  }

  function isWorkDay(d) {
    const today = startOfToday();
    const last = new Date(today);
    last.setDate(last.getDate() + CONFIG.bookingHorizonDays);
    return CONFIG.workDays.includes(d.getDay()) && d >= today && d <= last;
  }

  // Все стартовые времена дня с отметкой, свободно ли окно нужной длины
  function daySlots(iso) {
    if (!iso) return [];
    const duration = Math.max(totalDuration(), CONFIG.slotStepMin);
    const open = CONFIG.openHour * 60;
    const close = CONFIG.closeHour * 60;
    const now = new Date();
    const isToday = iso === isoDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes() + 60; // не раньше чем через час

    const slots = [];
    for (let start = open; start + duration <= close; start += CONFIG.slotStepMin) {
      let free = !(isToday && start < nowMin);
      for (let m = start; free && m < start + duration; m += CONFIG.slotStepMin) {
        if (isBusy(iso, fromMin(m))) free = false;
      }
      slots.push({ time: fromMin(start), free });
    }
    return slots;
  }

  const slotFits = (iso, time) => daySlots(iso).some((s) => s.time === time && s.free);
  const dayHasFree = (iso) => daySlots(iso).some((s) => s.free);

  /* ---------- Шаг 1 ---------- */
  function renderPickList() {
    $('#pickList').innerHTML = CATEGORIES.map((c) => `
      <p class="pick-group">${tx(c.name)}</p>
      ${SERVICES.filter((sv) => sv.cat === c.id).map((sv) => {
        const on = state.selected.has(sv.id);
        return `
        <label class="pick ${on ? 'is-on' : ''}" style="--c:${sv.swatch}">
          <input type="checkbox" value="${sv.id}" ${on ? 'checked' : ''}>
          <span class="pick__swatch" aria-hidden="true"></span>
          <span class="pick__name">${tx(sv.name)}</span>
          <span class="pick__meta">${priceLabel(sv)} · ${formatDuration(sv.duration)}</span>
        </label>`;
      }).join('')}`).join('');
  }
  $('#pickList').addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      toggleService(e.target.value);
      $(`#pickList input[value="${e.target.value}"]`)?.focus();
    }
  });

  /* ---------- Шаг 2: календарь ---------- */
  function renderCalendar() {
    if (!state.viewMonth) {
      const d = startOfToday();
      state.viewMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const vm = state.viewMonth;
    $('#calMonth').textContent = `${t('months')[vm.getMonth()]} ${vm.getFullYear()}`;
    $('#calWeekdays').innerHTML = t('weekdays').map((w) => `<span>${w}</span>`).join('');

    const today = startOfToday();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today);
    lastDay.setDate(lastDay.getDate() + CONFIG.bookingHorizonDays);
    $('#calPrev').disabled = vm <= thisMonth;
    $('#calNext').disabled = new Date(vm.getFullYear(), vm.getMonth() + 1, 1) > lastDay;

    const offset = (new Date(vm.getFullYear(), vm.getMonth(), 1).getDay() + 6) % 7; // неделя с понедельника
    const days = new Date(vm.getFullYear(), vm.getMonth() + 1, 0).getDate();
    let html = '<span></span>'.repeat(offset);
    for (let day = 1; day <= days; day++) {
      const d = new Date(vm.getFullYear(), vm.getMonth(), day);
      const iso = isoDate(d);
      const available = isWorkDay(d) && dayHasFree(iso);
      const cls = ['day'];
      if (iso === isoDate(today)) cls.push('day--today');
      if (iso === state.date) cls.push('is-selected');
      html += `<button type="button" class="${cls.join(' ')}" data-date="${iso}" ${available ? '' : 'disabled'}
        aria-pressed="${iso === state.date}" aria-label="${formatDateLong(iso)}">${day}</button>`;
    }
    $('#calGrid').innerHTML = html;
  }

  $('#calPrev').addEventListener('click', () => {
    state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  $('#calNext').addEventListener('click', () => {
    state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  $('#calGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.day');
    if (!btn || btn.disabled) return;
    state.date = btn.dataset.date;
    if (state.time && !slotFits(state.date, state.time)) state.time = null;
    renderCalendar();
    renderSlots();
    renderSummary();
    $(`#calGrid [data-date="${state.date}"]`)?.focus();
    $('#err2').textContent = '';
  });

  function renderSlots() {
    const grid = $('#slotGrid');
    if (!state.date) {
      grid.innerHTML = `<p class="slots__empty">${t('booking.s2.pickDate')}</p>`;
      return;
    }
    const slots = daySlots(state.date);
    if (!slots.some((s) => s.free)) {
      grid.innerHTML = `<p class="slots__empty">${t('booking.s2.noSlots')}</p>`;
      return;
    }
    grid.innerHTML = slots.map((s) => `
      <button type="button" class="slot ${s.time === state.time ? 'is-selected' : ''}" data-time="${s.time}"
        ${s.free ? '' : 'disabled'} aria-pressed="${s.time === state.time}">${s.time}</button>`).join('');
  }

  $('#slotGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.slot');
    if (!btn || btn.disabled) return;
    state.time = btn.dataset.time;
    renderSlots();
    renderSummary();
    $(`#slotGrid [data-time="${state.time}"]`)?.focus();
    $('#err2').textContent = '';
  });

  /* ---------- Итог ---------- */
  function priceText() {
    if (hasFromPrice()) return `${t('services.from')} ${formatPrice(totalPrice())}`;
    const max = totalPriceMax();
    if (max > totalPrice()) return `${formatPrice(totalPrice()).replace(' ₸', '')} – ${formatPrice(max)}`;
    return formatPrice(totalPrice());
  }

  function timeRange() {
    if (!state.time) return '';
    return `${state.time}–${fromMin(toMin(state.time) + totalDuration())}`;
  }

  function renderSummary() {
    const list = selectedServices();
    $('#summaryList').innerHTML = list.length
      ? list.map((s) => `<li style="--c:${s.swatch}"><span>${tx(s.name)}</span><b>${priceLabel(s)}</b></li>`).join('')
      : `<li class="summary__empty">${t('booking.empty')}</li>`;
    $('#sumDuration').textContent = list.length ? `${t('booking.approx')} ${formatDuration(totalDuration())}` : '—';
    $('#sumDate').textContent = state.date && state.time ? `${formatDateLong(state.date)}, ${timeRange()}` : (state.date ? formatDateLong(state.date) : '—');
    $('#sumPrice').textContent = priceText();
  }

  /* ---------- Шаги ---------- */
  const form = $('#bookingForm');
  const phoneInput = $('#fPhone');

  // Возвращает 11 цифр вида 7XXXXXXXXXX (или меньше, пока номер не дописан)
  function phoneDigits() {
    const raw = phoneInput.value.trim();
    let d = raw.replace(/\D/g, '');
    if (d.length >= 11) d = d.slice(-10);           // номер целиком (в т.ч. вставка поверх «+7»)
    else if (raw.startsWith('+7')) d = d.slice(1);
    if (d.length < 10 && d.startsWith('8')) d = d.slice(1); // привычка набирать «8» в начале
    return ('7' + d).slice(0, 11);
  }

  phoneInput.addEventListener('input', () => {
    const d = phoneDigits();
    const p = d.slice(1);
    let out = '+7';
    if (p.length) out += ' (' + p.slice(0, 3);
    if (p.length > 3) out += ') ' + p.slice(3, 6);
    if (p.length > 6) out += '-' + p.slice(6, 8);
    if (p.length > 8) out += '-' + p.slice(8, 10);
    phoneInput.value = out;
  });
  phoneInput.addEventListener('focus', () => { if (!phoneInput.value) phoneInput.value = '+7 '; });
  phoneInput.addEventListener('blur', () => { if (phoneDigits().length <= 1) phoneInput.value = ''; });

  function validate(step) {
    if (step === 1 && !state.selected.size) {
      $('#err1').textContent = t('booking.errServices');
      return false;
    }
    if (step === 2 && !(state.date && state.time && slotFits(state.date, state.time))) {
      $('#err2').textContent = t('booking.errSlot');
      return false;
    }
    if (step === 3) {
      const name = $('#fName');
      const okName = name.value.trim().length >= 2;
      const okPhone = phoneDigits().length === 11;
      name.setAttribute('aria-invalid', String(!okName));
      phoneInput.setAttribute('aria-invalid', String(!okPhone));
      if (!okName || !okPhone) {
        $('#err3').textContent = !okName ? t('booking.errName') : t('booking.errPhone');
        (!okName ? name : phoneInput).focus();
        return false;
      }
      $('#err3').textContent = '';
    }
    return true;
  }

  function updateStepUI() {
    $$('.step', form).forEach((fs) => { fs.hidden = Number(fs.dataset.step) !== state.step; });
    $$('.progress__step').forEach((li) => {
      const n = Number(li.dataset.step);
      li.classList.toggle('is-done', n < state.step);
      li.classList.toggle('is-current', n === state.step);
      if (n === state.step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    $('.progress').style.setProperty('--p', (state.step - 1) / 3);
    $('#stepText').textContent = t('booking.stepOf').replace('{n}', state.step);
    $('#btnBack').hidden = state.step === 1;
    $('#btnNext').hidden = state.step === 4;
    $('#btnSend').hidden = state.step !== 4;
    $('.booking__layout').classList.toggle('is-final', state.step === 4);
  }

  function goTo(step, focus = true) {
    state.step = step;
    if (step === 2) { renderCalendar(); renderSlots(); }
    if (step === 4) renderConfirm();
    $('#sentNote').textContent = '';
    updateStepUI();
    if (focus) {
      const legend = $(`.step[data-step="${step}"] .step__title`);
      legend.setAttribute('tabindex', '-1');
      legend.focus({ preventScroll: true });
      const top = form.getBoundingClientRect().top + window.scrollY - 90;
      if (form.getBoundingClientRect().top < 0) window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validate(state.step) && state.step < 4) goTo(state.step + 1);
  });
  $('#btnBack').addEventListener('click', () => { if (state.step > 1) goTo(state.step - 1); });

  function confirmRows() {
    const comment = $('#fComment').value.trim();
    return [
      { key: 'booking.services', step: 1, value: selectedServices().map((s) => tx(s.name)).join(', ') },
      { key: 'booking.date', step: 2, value: `${formatDateLong(state.date)}, ${timeRange()}` },
      { key: 'booking.duration', step: 1, value: `${t('booking.approx')} ${formatDuration(totalDuration())}` },
      { key: 'booking.client', step: 3, value: `${$('#fName').value.trim()}, ${phoneInput.value}` },
      ...(comment ? [{ key: 'booking.comment', step: 3, value: comment }] : []),
      { key: 'booking.total', step: 1, value: priceText(), total: true },
    ];
  }

  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderConfirm() {
    $('#confirmList').innerHTML = confirmRows().map((r) => `
      <div class="confirm__row ${r.total ? 'confirm__row--total' : ''}">
        <dt>${t(r.key)}</dt>
        <dd>${escapeHtml(r.value)}</dd>
        ${r.total ? '' : `<button type="button" class="link-btn" data-goto="${r.step}">${t('booking.edit')}<span class="sr-only">: ${t(r.key)}</span></button>`}
      </div>`).join('');
    $('#btnSend').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(whatsappText())}`;
  }
  $('#confirmList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto]');
    if (b) goTo(Number(b.dataset.goto));
  });

  function whatsappText() {
    const comment = $('#fComment').value.trim();
    const lines = [
      t('booking.wa.hello'),
      '',
      `${t('booking.wa.services')}: ${selectedServices().map((s) => tx(s.name)).join(', ')}`,
      `${t('booking.wa.date')}: ${formatDateLong(state.date)}, ${timeRange()}`,
      `${t('booking.wa.duration')}: ${t('booking.approx')} ${formatDuration(totalDuration())}`,
      `${t('booking.wa.total')}: ${priceText()}`,
      '',
      `${t('booking.wa.name')}: ${$('#fName').value.trim()}`,
      `${t('booking.wa.phone')}: ${phoneInput.value}`,
    ];
    if (comment) lines.push(`${t('booking.wa.comment')}: ${comment}`);
    return lines.join('\n');
  }

  // Обычная ссылка, а не window.open: её не режут блокировщики всплывающих окон
  $('#btnSend').addEventListener('click', (e) => {
    if (!validate(1) || !validate(2) || !validate(3)) { e.preventDefault(); return; }
    $('#btnSend').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(whatsappText())}`;
    $('#sentNote').textContent = t('booking.sent');
  });

  /* ---------- Ссылки ---------- */
  const igUrl = `https://instagram.com/${CONFIG.instagram}`;
  $('#lnkInstagram').href = igUrl;
  $('#lnkInstagramText').href = igUrl;
  $('#lnkWhatsapp').href = `https://wa.me/${CONFIG.whatsapp}`;
  $('#lnkPhone').href = `tel:+${CONFIG.whatsapp}`;
  $('#lnkPhone').lastChild.textContent = CONFIG.phone;
  $('#lnkMap').href = CONFIG.twoGisUrl;
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Анимации и навигация при скролле ---------- */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;

  function observeReveal(root = document) {
    $$('.reveal:not(.is-in)', root).forEach((el) => {
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-in');
    });
  }

  // Подсветка активного пункта меню
  const navLinks = $$('.nav__link');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          const active = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => sectionObserver.observe(s));

    // Плавающая кнопка «Записаться» на телефоне: после первого экрана и не над формой
    const cta = $('#mobileCta');
    let pastHero = false;
    let atBooking = false;
    let atFooter = false;
    const syncCta = () => {
      const show = pastHero && !atBooking && !atFooter;
      cta.classList.toggle('is-visible', show);
      cta.setAttribute('aria-hidden', String(!show));
      $('a', cta).tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; syncCta(); }).observe($('.hero'));
    new IntersectionObserver(([e]) => { atBooking = e.isIntersecting; syncCta(); }, { threshold: 0 }).observe($('#booking'));
    new IntersectionObserver(([e]) => { atFooter = e.isIntersecting; syncCta(); }).observe($('.footer'));
  }

  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Старт ---------- */
  applyLang();
  observeReveal();
  document.documentElement.classList.add('js-ready');
})();
