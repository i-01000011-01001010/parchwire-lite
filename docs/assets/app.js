// Parchwire Lite. Reads data/resume.json (and, if present, links.json and verify.json) every time the page loads,
// so updating the site means replacing a file. Everything is added to the page as plain text, never as HTML.
(function () {
  'use strict';
  var PAGE = document.body.getAttribute('data-page');
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var main = document.getElementById('main');

  // ---- small helpers ---------------------------------------------------------------------
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var str = function (x) { return x === null || x === undefined ? '' : String(x).trim(); };
  var list = function (x) { return Array.isArray(x) ? x : []; };
  // Links must be http, https, mailto or tel. Anything else is dropped.
  function safeUrl(u) { var s = str(u); return /^(https?:\/\/|mailto:|tel:)/i.test(s) ? s : ''; }
  // The photo must be a file in this site's own folder.
  function safeImg(u) { var s = str(u); return s && !/^[a-z][a-z0-9+.-]*:/i.test(s) && s.indexOf('//') !== 0 && s.indexOf('..') < 0 ? s : ''; }
  function link(text, url, opts) {
    var href = safeUrl(url);
    if (!href) return h('span', { text: text });
    var external = /^https?:/i.test(href);
    var newTab = external && !(opts && opts.newTab === false);
    return h('a', { href: href, rel: newTab ? 'noopener noreferrer' + (opts && opts.me ? ' me' : '') : (opts && opts.me ? 'me' : null), target: newTab ? '_blank' : null, text: text });
  }

  // ---- data ------------------------------------------------------------------------------
  function getJson(name, optional) {
    return fetch('data/' + name, { cache: 'no-cache' }).then(function (r) {
      if (r.status === 404) { if (optional) return null; throw new Error(name + ' was not found in the data folder.'); }
      if (!r.ok) throw new Error(name + ' could not be loaded (HTTP ' + r.status + ').');
      return r.text().then(function (t) {
        try { return JSON.parse(t); } catch (e) {
          if (optional && /^\s*</.test(t)) return null; // some hosts answer a missing file with a web page
          throw new Error(name + ' is not valid JSON: ' + e.message);
        }
      });
    });
  }
  function fileExists(path) {
    return fetch(path, { method: 'HEAD', cache: 'no-cache' }).then(function (r) { return r.ok && !/text\/html/i.test(r.headers.get('content-type') || ''); }, function () { return false; });
  }

  // ---- dates -----------------------------------------------------------------------------
  function parts(d) { var m = /^(\d{4})(?:-(\d{2}))?/.exec(str(d)); return m ? { y: +m[1], m: m[2] ? +m[2] : 0 } : null; }
  function fmtDate(d) { var p = parts(d); return p ? (p.m >= 1 && p.m <= 12 ? MONTHS[p.m - 1] + ' ' + p.y : String(p.y)) : ''; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function span(start, end) {
    var s = parts(start); if (!s) return '';
    var e = parts(end), now = new Date();
    var months = ((e ? e.y : now.getFullYear()) - s.y) * 12 + ((e ? (e.m || 1) : now.getMonth() + 1) - (s.m || 1));
    var bits = [];
    if (months >= 12) bits.push(plural(Math.floor(months / 12), 'yr'));
    if (months % 12 > 0 && months > 0) bits.push(plural(months % 12, 'mo'));
    return bits.length ? ' (' + bits.join(' ') + ')' : '';
  }
  function dates(start, end) {
    if (!parts(start) && !parts(end)) return null;
    var text = (parts(start) ? fmtDate(start) : '') + (parts(start) ? ' to ' : '') + (parts(end) ? fmtDate(end) : 'Present') + span(start, end);
    return h('p', { class: 'dates', text: text });
  }

  // ---- resume sections -------------------------------------------------------------------
  function bullets(items) {
    var li = list(items).map(str).filter(Boolean).map(function (t) { return h('li', { text: t }); });
    return li.length ? h('ul', { class: 'bullets' }, li) : null;
  }
  function tags(items) {
    var li = list(items).map(str).filter(Boolean).map(function (t) { return h('li', { text: t }); });
    return li.length ? h('ul', { class: 'tags' }, li) : null;
  }
  function section(id, title, kids) {
    kids = kids.filter(Boolean);
    return kids.length ? h('section', { id: id, 'aria-labelledby': id + '-h' }, [h('h2', { id: id + '-h', text: title })].concat(kids)) : null;
  }
  function entry(title, metaParts, start, end, body) {
    var meta = metaParts.map(str).filter(Boolean).join(', ');
    return h('article', { class: 'entry' }, [h('h3', { text: title }), meta ? h('p', { class: 'meta', text: meta }) : null, dates(start, end)].concat(body || []));
  }
  var para = function (t) { return str(t) ? h('p', { text: str(t) }) : null; };

  function renderMasthead(b) {
    var loc = b.location || {}, items = [];
    var place = [loc.city, loc.region].map(str).filter(Boolean).join(', ');
    if (place) items.push(h('li', { text: place }));
    if (str(b.email)) items.push(h('li', {}, [link(str(b.email), 'mailto:' + str(b.email))]));
    if (str(b.phone)) items.push(h('li', {}, [link(str(b.phone), 'tel:' + str(b.phone).replace(/[^\d+]/g, ''))]));
    if (safeUrl(b.url)) items.push(h('li', {}, [link(str(b.url).replace(/^https?:\/\//i, '').replace(/\/$/, ''), b.url, { me: true })]));
    list(b.profiles).forEach(function (p) {
      if (!p || !safeUrl(p.url)) return;
      items.push(h('li', {}, [link(str(p.network) || str(p.username) || str(p.url), p.url, { me: true })]));
    });
    var img = safeImg(b.image);
    return h('header', { class: 'masthead' }, [
      img ? h('img', { class: 'portrait', src: img, alt: '', width: '104', height: '104' }) : null,
      h('h1', { text: str(b.name) }),
      str(b.label) ? h('p', { class: 'label', text: str(b.label) }) : null,
      items.length ? h('ul', { class: 'contact', 'aria-label': 'Contact' }, items) : null
    ]);
  }
  function renderResume(d) {
    var b = d.basics;
    var out = [];
    out.push(section('summary', 'Summary', [para(b.summary)]));
    out.push(section('work', 'Work', list(d.work).map(function (j) {
      return entry(str(j.position) || str(j.name), [str(j.position) ? j.name : '', j.location], j.startDate, j.endDate, [para(j.summary), bullets(j.highlights)]);
    })));
    out.push(section('volunteer', 'Volunteer', list(d.volunteer).map(function (v) {
      return entry(str(v.organization), [v.position], v.startDate, v.endDate, [para(v.summary), bullets(v.highlights)]);
    })));
    out.push(section('education', 'Education', list(d.education).map(function (e) {
      return entry(str(e.institution), [[e.studyType, e.area].map(str).filter(Boolean).join(' in ')], e.startDate, e.endDate, []);
    })));
    out.push(section('projects', 'Projects', list(d.projects).map(function (p) {
      var art = entry(str(p.name), [], p.startDate, p.endDate, [para(p.description), bullets(p.highlights), tags(p.keywords)]);
      if (safeUrl(p.url)) art.insertBefore(h('p', { class: 'meta' }, [link(str(p.url).replace(/^https?:\/\//i, ''), p.url)]), art.children[1] || null);
      return art;
    })));
    out.push(section('certificates', 'Certificates', list(d.certificates).map(function (c) {
      var meta = str(c.issuer) ? 'Issued by ' + str(c.issuer) : '';
      var art = entry(str(c.name), [meta], '', '', []);
      if (parts(c.date)) art.appendChild(h('p', { class: 'dates', text: fmtDate(c.date) }));
      return art;
    })));
    [['skills', 'Skills', d.skills], ['interests', 'Interests', d.interests]].forEach(function (g) {
      out.push(section(g[0], g[1], [list(g[2]).length ? h('div', { class: 'groups' }, list(g[2]).map(function (s) {
        return h('div', {}, [h('h3', { text: str(s.name) }), tags(s.keywords)]);
      })) : null]));
    });
    return out.filter(Boolean);
  }

  // ---- verify page -----------------------------------------------------------------------
  function renderVerify(v) {
    var out = [h('h1', { text: str(v.title) || 'Verify it’s me' })];
    if (str(v.intro)) out.push(h('p', { class: 'lead', text: str(v.intro) }));
    list(v.sections).forEach(function (s) {
      var items = list(s.items).filter(function (i) { return i && str(i.label); }).map(function (i) {
        return h('li', {}, [h('strong', { text: str(i.label) }), ' ', safeUrl(i.url) ? link(str(i.value) || str(i.url), i.url, { me: true }) : h('span', { text: str(i.value) }), str(i.note) ? h('span', { class: 'note', text: str(i.note) }) : null]);
      });
      if (!items.length) return;
      out.push(h('section', {}, [h('h2', { text: str(s.title) }), str(s.intro) ? h('p', { text: str(s.intro) }) : null, h('ul', { class: 'verify-list' }, items)]));
    });
    if (str(v.footer)) out.push(h('p', { class: 'note', text: str(v.footer) }));
    return out;
  }

  // ---- navigation ------------------------------------------------------------------------
  function menu(label, kids) {
    var d = h('details', {}, [h('summary', { text: label }), h('div', { class: 'panel' }, kids)]);
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      document.querySelectorAll('.navlist details[open]').forEach(function (o) { if (o !== d) o.removeAttribute('open'); });
    });
    return h('li', {}, [d]);
  }
  function buildNav(name, links, downloads, hasVerify) {
    var items = [];
    if (PAGE === 'resume' && hasVerify) items.push(h('li', {}, [h('a', { href: 'verify.html', text: 'Verify' })]));
    if (PAGE === 'verify') items.push(h('li', {}, [h('a', { href: 'index.html', text: 'Resume' })]));
    var linkKids = [];
    list(links).forEach(function (l) {
      if (!l) return;
      if (str(l.heading)) linkKids.push(h('p', { class: 'heading', text: str(l.heading) }));
      else if (str(l.label) && safeUrl(l.url)) linkKids.push(link(str(l.label), l.url, { newTab: l.newTab }));
    });
    if (linkKids.some(function (k) { return k.tagName === 'A' || k.tagName === 'SPAN'; })) items.push(menu('Links', linkKids));
    if (downloads.length) items.push(menu('Download', downloads.map(function (f) { return h('a', { href: f.href, download: '', text: f.label }); })));
    document.getElementById('bar').appendChild(h('nav', { class: 'sitenav', 'aria-label': 'Site' }, [h('div', { class: 'sitenav-in' }, [
      h('a', { class: 'brand', href: 'index.html', text: name || 'Home' }),
      items.length ? h('ul', { class: 'navlist' }, items) : null
    ])]));
    document.addEventListener('click', function (e) {
      document.querySelectorAll('.navlist details[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var o = document.querySelector('.navlist details[open]');
      if (o) { o.removeAttribute('open'); o.querySelector('summary').focus(); }
    });
  }

  // ---- light and dark button -------------------------------------------------------------
  function themeButton() {
    var root = document.documentElement;
    var dark = function () { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); };
    var b = h('button', { type: 'button', class: 'themebtn', 'aria-label': 'Dark mode', 'aria-pressed': String(dark()), title: 'Switch between light and dark' });
    b.innerHTML = '<svg class="i-moon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
      + '<svg class="i-sun" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    b.addEventListener('click', function () {
      var next = dark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      b.setAttribute('aria-pressed', String(next === 'dark'));
      try { localStorage.setItem('pw-lite-theme', next); } catch (e) { /* storage blocked: the choice lasts for this visit */ }
    });
    document.body.appendChild(b);
  }

  // ---- start -----------------------------------------------------------------------------
  function fail(message) {
    main.textContent = '';
    main.appendChild(h('p', { class: 'status error', role: 'alert', text: message }));
  }
  function init() {
    themeButton();
    Promise.all([getJson('resume.json', PAGE === 'verify'), getJson('links.json', true), getJson('verify.json', PAGE === 'resume'), fileExists('downloads/resume.pdf'), fileExists('downloads/resume.docx')])
      .then(function (r) {
        var resume = r[0], links = r[1], verify = r[2];
        var name = resume && resume.basics ? str(resume.basics.name) : '';
        var files = [];
        if (r[3]) files.push({ href: 'downloads/resume.pdf', label: 'PDF' });
        if (r[4]) files.push({ href: 'downloads/resume.docx', label: 'Word (DOCX)' });
        buildNav(name, Array.isArray(links) ? links : [], files, !!verify);
        main.textContent = '';
        if (PAGE === 'verify') {
          if (!verify) return fail('There is no verify page here yet.');
          document.title = (str(verify.title) || 'Verify') + (name ? ' | ' + name : '');
          renderVerify(verify).forEach(function (n) { main.appendChild(n); });
          return;
        }
        if (!resume || !resume.basics || !str(resume.basics.name)) return fail('resume.json needs a "basics" section with a "name".');
        document.title = name + ' | Resume';
        document.getElementById('masthead').appendChild(renderMasthead(resume.basics));
        document.getElementById('foot-name').textContent = name;
        renderResume(resume).forEach(function (n) { main.appendChild(n); });
      })
      .catch(function (err) {
        var msg = String(err && err.message || err);
        if (/failed to fetch|networkerror|load failed/i.test(msg)) msg = 'The data files could not be read. If you opened this page straight from your computer, run a small web server instead (see the README), or put the site on a host.';
        fail(msg);
      });
  }
  init();
})();
