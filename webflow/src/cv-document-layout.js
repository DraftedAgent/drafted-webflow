/* Shared document renderer. No editor state, endpoints or model calls.
 * Physical page geometry and typography live in cv-document-layout.css.
 * Pagination measures real, unscaled browser layout before fitting the viewer.
 */
(function (global) {
  'use strict';
  const viewers = new WeakMap();
  let fontReadiness;
  function fontsReady() {
    return fontReadiness ||= Promise.all([
      document.fonts.load('14px "Drafted Sans"'),
      document.fonts.load('700 14px "Drafted Sans"')
    ]).then(faces => {
      if (faces.some(list => !list.length)) throw Error('Document fonts are unavailable.');
      return document.fonts.ready;
    }).catch(error => { fontReadiness = null; throw error; });
  }
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  function unitsFromBlocks(blocks, title) {
    const units = [], seen = new Set();
    const add = (tag, cls, text, id = '', keep = false, source = false) => {
      if (text !== '') units.push({tag, cls, text, id, keep, source});
    };
    add('h1', 'cv-title', title, '', true);
    for (const b of [...blocks].sort((a, c) => a.order - c.order || (String(a.blockId) < String(c.blockId) ? -1 : String(a.blockId) > String(c.blockId) ? 1 : 0))) {
      const id = String(b.blockId), type = String(b.type);
      const metadata = type === 'experience' ? [b.title,b.employer,b.startDate,b.endDate] : type === 'education' ? [b.degree,b.program,b.institution,b.startDate,b.endDate] : [];
      if (![b.text,...metadata].some(value => String(value || '').trim())) continue;
      if (type !== 'summary' && !seen.has(type)) {
        add('h2', 'cv-section-heading', String(b.label || type), '', true);
        seen.add(type);
      }
      if (type === 'experience' || type === 'education') {
        const heading = type === 'experience' ? b.title : [b.degree, b.program].filter(Boolean).join(', ');
        add('h3', type === 'experience' ? 'cv-exp-title' : 'cv-edu-degree', String(heading || ''), id, true);
        const organization = type === 'experience' ? b.employer : b.institution;
        const period = [b.startDate, b.endDate].filter(Boolean).join(' – ');
        add('p', 'cv-entry-meta', [organization, period].filter(Boolean).join('  ·  '), id, true);
      }
      // Keep source characters, including bullet markers and line breaks, verbatim.
      // Lists get semantic <ul>/<li> structure; the original marker stays visible.
      const lines = String(b.text || '').match(/[^\n]*(?:\n|$)/g) || [];
      let paragraph = '';
      const flush = () => { add('p', 'cv-block-body', paragraph, id, false, true); paragraph = ''; };
      for (const line of lines.filter(Boolean)) {
        if (/^\s*(?:[-*•▪‣]|\d+[.)])\s+/.test(line)) {
          flush(); add('li', 'cv-block-body cv-list-item' + (/\S{120}/.test(line) ? ' cv-break-long-token' : ''), line, id, false, true);
        } else if (!line.trim()) { paragraph += line; flush(); }
        else paragraph += line;
      }
      flush();
    }
    return units;
  }

  function linkify(pages) {
    const groups = new Map();
    for (const page of pages) for (const el of page.querySelectorAll('[data-cv-source]')) {
      const id = el.dataset.cvSource;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(el);
    }
    // Resolve URLs against the complete source before distributing annotations
    // over its page fragments. A long URL remains one destination on every page.
    for (const elements of groups.values()) {
      const text = elements.map(el => el.textContent).join(''), links = [];
      for (const match of text.matchAll(/https?:\/\/[^\s<>]+|www\.[^\s<>]+|mailto:[^\s<>]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
        let visible = match[0].replace(/[.,;!?]+$/, '');
        while (visible.endsWith(')') && (visible.match(/\)/g) || []).length > (visible.match(/\(/g) || []).length) visible = visible.slice(0,-1);
        const href = /^(https?:|mailto:)/i.test(visible) ? visible : /^www\./i.test(visible) ? 'https://' + visible : 'mailto:' + visible;
        links.push({start:match.index,end:match.index + visible.length,href});
      }
      let offset = 0;
      for (const el of elements) {
        const value = el.textContent, end = offset + value.length, nodes = []; let cursor = 0;
        for (const link of links.filter(link => link.start < end && link.end > offset)) {
          const start = Math.max(0, link.start - offset), stop = Math.min(value.length, link.end - offset);
          nodes.push(document.createTextNode(value.slice(cursor, start)));
          const anchor = node('a', 'cv-document-link', value.slice(start, stop));
          anchor.href = link.href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
          nodes.push(anchor); cursor = stop;
        }
        nodes.push(document.createTextNode(value.slice(cursor))); el.replaceChildren(...nodes); offset = end;
      }
    }
  }

  function paginate(units, templateId) {
    if (!units.length) return [];
    const measure = node('div', 'cv-layout cv-layout-measure');
    measure.dataset.cvDesign = templateId;
    measure.setAttribute('aria-hidden', 'true');
    document.body.append(measure);
    const pages = [];
    let content;
    function newPage() {
      const page = node('article', 'cv-page');
      content = node('div', 'cv-page-content');
      page.append(content); measure.append(page); pages.push(page);
    }
    function append(unit, text = unit.text) {
      let block = content.lastElementChild;
      if (!block || block.dataset.blockId !== unit.id || !unit.id) {
        block = node('section', unit.id ? 'cv-block' : 'cv-document-heading');
        if (unit.id) block.dataset.blockId = unit.id;
        content.append(block);
      }
      const el = node(unit.tag, unit.cls, text);
      if (unit.source) el.dataset.cvSource = unit.id;
      let container = block;
      if (unit.tag === 'li') {
        container = block.lastElementChild;
        if (container?.tagName !== 'UL') { container = node('ul', 'cv-list'); block.append(container); }
      }
      container.append(el);
      return el;
    }
    function remove(el) {
      const parent = el.parentElement;
      el.remove();
      if (!parent.children.length) { const outer = parent.parentElement; parent.remove(); if (outer?.classList.contains('cv-block') && !outer.children.length) outer.remove(); }
    }
    function fits() {
      const last = content.lastElementChild;
      // offset geometry ignores the viewer transform. Include fractional margins.
      return !last || last.getBoundingClientRect().bottom <= content.getBoundingClientRect().bottom + 0.1;
    }
    function prefixLength(unit) {
      const el = append(unit, ''), text = document.createTextNode(unit.text);
      el.append(text);
      const boundaries = [0];
      // Never split a surrogate pair or a combining-character grapheme.
      for (const s of new Intl.Segmenter(undefined, {granularity:'grapheme'}).segment(unit.text)) boundaries.push(s.index + s.segment.length);
      let lo = 0, hi = boundaries.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        text.data = unit.text.slice(0, boundaries[mid]);
        if (fits()) lo = mid; else hi = mid - 1;
      }
      let end = boundaries[lo];
      // Prefer a word boundary, but allow genuinely unbroken words to wrap/split.
      const prefix = unit.text.slice(0, end), word = prefix.match(/\s+\S*$/);
      if (word && word.index > end / 2) end = word.index + word[0].match(/^\s*/)[0].length;
      text.data = unit.text.slice(0, end);
      const range = document.createRange(); range.selectNodeContents(el);
      const lines = [...range.getClientRects()].filter(r => r.width > 0).length;
      remove(el);
      return {end, lines};
    }
    newPage();
    try {
      for (let i = 0; i < units.length; i++) {
        const original = units[i];
        // Keep heading chains with at least two measured lines of their body.
        if (original.keep && content.childElementCount) {
          const probes = []; let j = i;
          while (j < units.length && units[j].keep) probes.push(append(units[j++]));
          let keepFits = fits();
          if (keepFits && j < units.length) {
            const probe = append(units[j]);
            if (!fits()) { remove(probe); const prefix = prefixLength(units[j]); keepFits = prefix.lines >= 2; }
            else probes.push(probe);
          }
          for (const el of probes.reverse()) remove(el);
          if (!keepFits) newPage();
        }
        let unit = original;
        while (unit.text) {
          const hadContent = content.childElementCount > 0;
          const el = append(unit);
          if (fits()) break;
          remove(el);
          const part = prefixLength(unit);
          if (!part.end || (part.lines < 2 && hadContent)) { newPage(); continue; }
          // If a short final line would be orphaned, move one measured line
          // from this fragment to the next page rather than shrinking type.
          let end = part.end;
          const tail = unit.text.slice(end);
          if (tail && !unit.keep) {
            const probe = append(unit, tail), range = document.createRange(); range.selectNodeContents(probe);
            const tailLines = [...range.getClientRects()].filter(r => r.width > 0).length;
            remove(probe);
            if (tailLines === 1 && part.lines > 2) {
              const probe = append(unit, unit.text.slice(0, end));
              const text = probe.firstChild, range = document.createRange();
              range.selectNodeContents(probe); const rects = [...range.getClientRects()].filter(r => r.width > 0);
              const lastTop = rects.at(-1).top;
              let lo = 0, hi = end;
              while (lo < hi) { const mid = Math.floor((lo + hi) / 2); range.setStart(text, mid); range.setEnd(text, Math.min(end, mid + 1)); if (range.getBoundingClientRect().top >= lastTop) hi = mid; else lo = mid + 1; }
              if (lo) {
                const boundaries = [...new Intl.Segmenter(undefined, {granularity:'grapheme'}).segment(unit.text)].map(s => s.index);
                end = boundaries.filter(index => index <= lo).at(-1) || end;
              }
              remove(probe);
            }
          }
          append(unit, unit.text.slice(0, end));
          unit = {...unit, text:unit.text.slice(end)};
          if (unit.text) newPage();
        }
      }
      // Pages are created only on overflow; remove a trailing page only if empty.
      if (pages.length > 1 && !pages.at(-1).firstElementChild.children.length) pages.pop().remove();
      pages.forEach((page, i) => {
        page.setAttribute('aria-label', `Page ${i + 1} of ${pages.length}`);
        page.append(node('div', 'cv-page-number', `${i + 1} / ${pages.length}`));
      });
      linkify(pages);
      return pages;
    } finally { measure.remove(); }
  }

  function render(host, model) {
    const templateId = model.templateId || 'classic_v1';
    if (!global.DraftedCvDesigns.some(design => design.id === templateId)) throw Error('Unknown CV design.');
    let viewer = viewers.get(host);
    if (!viewer) {
      const scale = () => {
        const width = host.clientWidth;
        for (const slot of host.querySelectorAll('.cv-page-slot')) {
          const page = slot.firstElementChild, factor = Math.min(1, width / page.offsetWidth);
          slot.style.width = `${page.offsetWidth * factor}px`;
          slot.style.height = `${page.offsetHeight * factor}px`;
          page.style.transform = `scale(${factor})`;
        }
      };
      viewer = {scale, generation:0}; viewers.set(host, viewer);
      new ResizeObserver(scale).observe(host);
    }
    viewer.model = model;
    const generation = ++viewer.generation;
    host.classList.add('cv-layout');
    host.dataset.layoutState = 'loading'; host.setAttribute('aria-busy', 'true'); model.onState?.('loading');
    viewer.pending = (model.blocks.length ? fontsReady() : Promise.resolve()).then(() => {
      if (generation !== viewer.generation) return;
      const pages = model.blocks.length ? paginate(unitsFromBlocks(model.blocks, model.title), templateId) : [];
      host.dataset.cvDesign = templateId;
      host.replaceChildren(...pages.map(page => { const slot = node('div', 'cv-page-slot'); slot.append(page); return slot; }));
      viewer.scale(); host.dataset.pageCount = String(pages.length); host.dataset.layoutState = 'ready';
      host.setAttribute('aria-busy', 'false'); model.onLayout?.(pages.length); model.onState?.('ready');
    }).catch(error => {
      if (generation !== viewer.generation) return;
      host.dataset.layoutState = 'error'; host.setAttribute('aria-busy', 'false'); model.onState?.('error');
      throw error;
    });
    // Readiness is exposed to export; keep a failed background font load from
    // becoming an unhandled rejection while retaining the explicit error state.
    viewer.pending.catch(() => {});
    return viewer.pending;
  }
  async function ready(host) {
    const viewer = viewers.get(host);
    if (!viewer) throw Error('Document layout is unavailable.');
    let generation;
    do { generation = viewer.generation; await viewer.pending; } while (generation !== viewer.generation);
    if (host.dataset.layoutState !== 'ready') throw Error('Document layout is not ready.');
  }
  global.DraftedCvLayout = {render, ready, version:'a4-v2'};
})(window);
