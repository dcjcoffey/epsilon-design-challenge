/* Data Health prototype — behaviour. Everything in this file is Data Health's: it stands in for the Angular
 * behaviour CORE UI's components carry (tooltips, page turning, the chart, the narrowing). CORE UI's own markup is
 * reproduced as captured from its Storybook; every element Data Health adds or changes carries a data-dh attribute.
 *   Controls (right panel, CORE UI RadioGroup / CheckboxGroup markup):
 *     UI Style   — A: status as icon-status chip · B: status as dot+text badge
 *     Status     — a SWITCHER: every place the Data Health status is shown takes this status
 *   Dashboard summary: one Card with a Radial + legend (ruled). Legend rows mark a status; the Table shows it narrowed.
 * State: `S` — style, selectedKey (the switcher), filter (narrowing), page. */

const PAGES = [{ key: 'table', name: 'Table' }, { key: 'card', name: 'Card' }, { key: 'dash', name: 'Dashboard summary' }];
const LEGEND_ORDER = ['failed', 'warning', 'healthy', 'pending', 'partial', 'unverified', 'unknown'];
const defaults = () => ({ style: 'A', selectedKey: STATUSES[0].key, filter: null, page: 'table' });
let S = defaults();

const el = (id) => document.getElementById(id);
const view = (key) => STATUS[key];
const shown = () => view(S.selectedKey);          // the status the switcher is presenting everywhere

// CORE UI's own Table demo rows, verbatim (Campaign Performance Data, BASE_CAMPAIGNS in their live demo). Used by the VANILLA table.
const DEMO_ROWS = [
  { name: 'Birthday Discount', icon: 'display', group: 'Active', budget: '$50,000',  spend: '$25,000', views: '500',    clicks: '1,200', updated: '01/15/24 11:05 AM CDT' },
  { name: 'Dog Lovers',        icon: 'mobile',  group: 'Active', budget: '$10,000',  spend: '$0',      views: '0',      clicks: '0',     updated: '01/14/24 09:30 AM CDT' },
  { name: "Father's Day Sale", icon: 'video',   group: 'Active', budget: '$30,500',  spend: '$22,100', views: '6,000',  clicks: '4,000', updated: '01/13/24 02:22 PM CDT' },
  { name: "Mother's Day Sale", icon: 'video',   group: 'Active', budget: '$30,000',  spend: '$15,000', views: '4,500',  clicks: '3,000', updated: '01/13/24 08:15 AM CDT', ai: true },
  { name: 'New Arrivals',      icon: 'mobile',  group: 'Paused', budget: '$100,000', spend: '$42,600', views: '12,000', clicks: '9,650', updated: '01/12/24 04:45 PM CDT' },
  { name: 'Summer Deals',      icon: 'display', group: 'Paused', budget: '$45,000',  spend: '$23,500', views: '5,600',  clicks: '960',   updated: '01/11/24 01:00 PM CDT', ai: true, shared: true },
];
const DEMO_TOTALS = { budget: '$265,500', spend: '$128,200', views: '28,600', clicks: '18,810' };

/* ---- CORE UI form-control builders (their rendered markup) ------------------------------- */
function radioGroup(name, legend, items, current) {
  return `<fieldset class="Core-RadioGroup Core-RadioGroup--vertical has-bottom-margin"><legend class="Core-RadioGroup-label"><span>${legend}</span></legend>
    <div class="Core-RadioGroup-content">${items.map((it) => `<div class="Core-FormField has-bottom-margin"><label class="Core-FormField-label">
      <span class="Core-FormField-labelValue">${it.label}</span>
      <input type="radio" class="Core-Radio-input is-ready" name="${name}" value="${it.value}" ${it.value === current ? 'checked' : ''}></label></div>`).join('')}</div></fieldset>`;
}

/* ---- the status indicator ----------------------------------------------------------------
 * A and C — icon-status chip: pale chip, coloured status icon  (Badge · Type Status · Symbol Icon)
 * B       — dot + text badge: coloured dot, status word         (Badge · Type Status · Symbol Dot)
 * Every one is a tooltip trigger (coreui-badge.Core-ToolTip-trigger). Vanilla tip = the status name only. */
function statusBadge(key, size) {
  const v = view(key);
  const colourClass = `Core-Badge-color--${v.badge}`;
  const tipText = v.label;
  const trigger = (inner) => `<coreui-badge class="Core-ToolTip-trigger" tabindex="0" data-tip="${tipText}" aria-label="${v.label}" data-dh="status badge">${inner}</coreui-badge>`;
  if (S.style === 'B') {
    return trigger(`<span class="Core-Badge ${colourClass} is-border is-bold"><span class="Core-Badge-label is-small">${v.label}</span></span>`);
  }
  const tint = v.hex;
  return trigger(`<span class="Core-Badge ${colourClass} is-border is-bold is-icon-status"><span class="Core-Badge-label is-${size}" style="color:${tint}">${iconSvg(v.icon, size === 'medium' ? 16 : 14)}</span></span>`);
}

/* ---- controls panel ------------------------------------------------------------------------ */
function renderControls() {
  el('controlsMount').innerHTML =
    radioGroup('style', 'UI Style', [{ value: 'A', label: 'Option A' }, { value: 'B', label: 'Option B' }], S.style) +
    radioGroup('status', 'Status', STATUSES.map((s) => ({ value: s.key, label: s.label })), S.selectedKey);
}

/* ---- dashboard summary: CORE UI's Data Visualizations · Radial card (their markup + CSS) --------
 * Ring geometry is their donut's: outer 86.5, inner 70, centred at 87.5. Legend rows are their text buttons;
 * the status mark sits in the legend's colour slot. Clicking a row marks that status and narrows the Table. */
function renderDash() {
  const counts = LEGEND_ORDER.map((k) => ({ s: STATUS[k], n: FLEET.find(([key]) => key === k)[1] }));
  const total = counts.reduce((sum, c) => sum + c.n, 0);
  const R1 = 86.5, R0 = 70, PAD = 0.0225;   // half-gap between slices, radians
  const pt = (r, a) => `${(r * Math.sin(a)).toFixed(3)},${(-r * Math.cos(a)).toFixed(3)}`;
  let a0 = 0;
  const slices = counts.filter((c) => c.n > 0).map((c) => {
    const a1 = a0 + (c.n / total) * 2 * Math.PI;
    const s0 = a0 + PAD, s1 = a1 - PAD, big = s1 - s0 > Math.PI ? 1 : 0, mid = (a0 + a1) / 2;
    const d = `M${pt(R1, s0)}A${R1},${R1},0,${big},1,${pt(R1, s1)}L${pt(R0, s1)}A${R0},${R0},0,${big},0,${pt(R0, s0)}Z`;
    const [cx, cy] = pt((R0 + R1) / 2, mid).split(',');
    a0 = a1;
    return `<circle class="Core-DataViz-DonutSeriesPoint" cx="${cx}" cy="${cy}" r="8"></circle>
      <path d="${d}" class="Core-DataViz-DonutSeries ${S.selectedKey === c.s.key ? 'is-active' : ''}" style="fill: ${c.s.hex};" data-key="${c.s.key}" data-n="${c.n}"></path>`;
  }).join('');
  const legend = counts.map(({ s, n }) => `<div class="Core-DataViz-Legend-item ${S.selectedKey === s.key ? 'is-selected' : ''}">
      <button type="button" coreuibutton="text-primary" tabindex="0" class="Core-Button Core-Button--text-primary is-ready" data-key="${s.key}" aria-pressed="${S.selectedKey === s.key}" data-dh="click narrows the table">
        ${S.style === 'B' ? `<div class="Core-DataViz-Legend-item-color" style="background-color: ${s.hex};"></div>`
                          : `<div class="Core-DataViz-Legend-item-color dh-legend-icon" style="color: ${s.hex};" data-dh="status icon">${iconSvg(s.icon, 16)}</div>`}
        <div class="Core-DataViz-Legend-item-name"><coreui-dataviz-series-name><div aria-label="${s.label} ${n}" class="legend-item"><span>${s.label}</span><span>${n}</span></div></coreui-dataviz-series-name></div>
      </button></div>`).join('');
  el('dash').innerHTML = `<coreui-dataviz-card header="Data Health"><div class="Core-DataViz-Card">
    <div class="Core-DataViz-Card-header"><h3>Data Health</h3><div class="Core-DataViz-Card-info"></div></div>
    <coreui-dataviz-portal data-qa="data-viz-donut" class="is-vertical"><div class="Core-DataViz-Portal">
      <svg class="Core-DataViz-Portal-Viz" width="175" height="175" viewBox="0 0 175 175" role="img" data-dh="ring drawn by app.js" aria-label="${total} sources by Data Health status"><g class="Core-DataViz-Series-container" transform="translate(87.5, 87.5)" style="cursor: default;">${slices}</g></svg></div>
      <coreui-dataviz-legend position="right"><div class="Core-DataViz-Legend is-vertical">${legend}</div></coreui-dataviz-legend>
      <coreui-dataviz-tooltip><coreui-panel overlaystyle="none" class="Core-DataViz-Tooltip-panel" id="chartTip" data-dh="placed by app.js"><div class="Core-Panel-content is-visible"><div class="Core-DataViz-Tooltip-content">
        <div class="tooltip"><div class="tooltip-color" id="chartTipColor"></div><div class="tooltip-display"><span class="tooltip-xvalue" id="chartTipValue"></span><span class="tooltip-yvalue" id="chartTipLabel"></span></div></div>
      </div></div></coreui-panel></coreui-dataviz-tooltip>
    </coreui-dataviz-portal></div></coreui-dataviz-card>`;
}

/* ---- table ------------------------------------------------------------------------------- */
const th = (t) => `<th scope="col"><coreui-table-header-column><div class="Core-Table-headerColumn"><div class="Core-Table-headerContent">${t}<div class="Core-Table-headerButtonsWrapper"></div></div></div></coreui-table-header-column></th>`;
const tableShell = (cols, head, rows) => `<coreui-table class="tables-fixed-header is-medium-row-spaced"><div class="Core-Table"><table class="has-vertical-lines" style="table-layout:fixed;width:100%">
    <caption class="Core-Table-sr-only">Campaign Performance Data</caption><colgroup>${cols}</colgroup>
    <thead coreuitablesort><tr coreuitableheaderrow class="Core-Table-headerRow">${head}</tr></thead>
    <tbody class="Core-Table-body--single-row">${rows}</tbody></table></div></coreui-table>`;

function renderTable() {
  const badge = statusBadge(S.selectedKey, 'medium');
  // VANILLA: their Table live demo, as rendered with Checkbox Column · Icon Column · Table Header · Group Headers · Totals Row · Column Borders.
  // A: the status chip takes the icon column. B: their icon column stays; a Status column carries the dot + text badge.
  const B = S.style === 'B';
  const hcol = (t, cls = '', dh = '') => `<th scope="col"${cls ? ` class="${cls}"` : ''}${t === 'Metrics' ? ' colspan="2"' : ''}${dh ? ` data-dh="${dh}"` : ''}><coreui-table-header-column><div class="Core-Table-headerColumn"><div class="Core-Table-headerContent"> ${t} <div class="Core-Table-headerButtonsWrapper"></div></div></div></coreui-table-header-column></th>`;
  const groupHeader = (title, icon) => `<tr><th scope="colgroup" colspan="9" id="${title.toLowerCase()}-group" class="Core-Table-group-headerRow-titleSpacing"><coreui-table-group-header title="${title}" class="Core-Table-group-headerRow-badge"><div class="Core-Table-group-headerRow"><div class="Core-Table-group-headerRow-container">${icon ? `<div class="Core-Table-group-headerRow-icon-container"><coreui-badge color="Plum"><div class="Core-Badge Core-Badge-color--Plum is-border is-bold is-icon-status"><div class="Core-Badge-label is-small"><i coreuiicon="${icon}" color="Apple" scale="1.3" class="Core-Icon--${icon} Core-Icon" aria-label="${icon}" role="img" style="transform: scale(1.3);"></i></div></div></coreui-badge></div>` : ''}<div class="Core-Table-group-headerRow-title"><span>${title}</span></div></div></div></coreui-table-group-header></th></tr>`;
  const row = (r, i) => {
    const hidden = S.filter && LEGEND_ORDER[i % LEGEND_ORDER.length] !== S.filter;   // narrowing over demo rows, round-robin by status
    const channel = `<coreui-badge><div class="Core-Badge Core-Badge-color--Blueberry is-border is-bold is-icon-status"><div class="Core-Badge-label is-medium"><i class="Core-Icon--${r.icon} Core-Icon" aria-label="${r.icon}" role="img"></i></div></div></coreui-badge>`;
    return `<tr coreuitablerow class="Core-Table-row has-disabled-hover dh-row-anim ${hidden ? 'dh-row-hidden' : ''}" ${hidden ? 'hidden data-dh="narrowed away"' : ''}>
      <td coreuitablecheckboxcolumn class="Core-Table-checkboxColumn"><label><input type="checkbox" coreuicheckbox aria-label="Select ${r.name} row" class="Core-Checkbox-input"></label></td>
      <td coreuitableiconcolumn class="Core-Table-iconColumn">${B ? channel : badge}</td>
      <td> ${r.name} <div class="secondary-text">${r.ai ? '<i coreuiicon="wand" class="Core-ToolTip-trigger Core-Icon--wand Core-Icon" aria-label="wand" role="img" tabindex="0" data-tip="Generated with AI"></i>' : ''}${r.shared ? '<i coreuiicon="audiences" class="Core-ToolTip-trigger Core-Icon--audiences Core-Icon" aria-label="audiences" role="img" tabindex="0" data-tip="Shared"></i>' : ''}</div></td>${B ? `<td data-dh="status column">${badge}</td>` : ''}
      <td>${r.budget}</td><td>${r.spend}</td><td>${r.views}</td><td>${r.clicks}</td>
      <td> ${r.updated} <div class="text-style-muted-3">by username</div></td></tr>`; };
  const rows = DEMO_ROWS.map((r, i) => ({ r, i }));
  const body = groupHeader('Active', 'success') + rows.filter(({ r }) => r.group === 'Active').map(({ r, i }) => row(r, i)).join('')
    + groupHeader('Paused') + rows.filter(({ r }) => r.group === 'Paused').map(({ r, i }) => row(r, i)).join('')
    + `<tr coreuitablerow class="is-totals-row Core-Table-row"><td></td><td></td><td>Total</td>${B ? '<td data-dh="status column"></td>' : ''}<td>${DEMO_TOTALS.budget}</td><td>${DEMO_TOTALS.spend}</td><td>${DEMO_TOTALS.views}</td><td>${DEMO_TOTALS.clicks}</td><td></td></tr>`;
  el('tableMount').innerHTML = `<coreui-table class="tables-fixed-header is-medium-row-spaced"><div aria-live="polite" aria-atomic="true" class="Core-Table-sr-only"></div><div class="Core-Table Core-Table--totalsRow"><coreui-scroll-indicator class="Core-ScrollIndicator"><div class="Core-ScrollIndicator-wrapper"><div coreuiscrollindicatortarget class="Core-Table-wrapper" tabindex="-1">
    <table class="has-vertical-lines"><caption>Campaign Performance Data</caption>
    <colgroup><col width="40px"><col width="60px"><col width="${B ? '20%' : '30%'}">${B ? '<col width="10%" data-dh="status column">' : ''}<col width="10%"><col width="10%"><col width="10%"><col width="10%"><col width="35%"></colgroup>
    <thead><tr coreuitableheaderrow class="Core-Table-headerRow">
      <th scope="col" coreuitablecheckboxcolumn class="Core-Table-checkboxColumn"><label><input type="checkbox" coreuicheckbox aria-label="Check All Campaigns" class="Core-Checkbox-input"></label></th>
      <th scope="col" coreuitableiconcolumn class="Core-Table-iconColumn"></th>
      ${hcol('Campaign', 'Core-Table-demo-stickyWideColumn')}${B ? hcol('Status', '', 'status column') : ''}${hcol('Budget')}${hcol('Spend')}${hcol('Metrics')}${hcol('Updated', 'Core-Table-demo-stickyWideColumn')}
    </tr></thead>
    <tbody coreuicheckboxmultipleselection class="Core-Table-body--single-row">${body}</tbody></table>
  </div></div></coreui-scroll-indicator></div></coreui-table>`;
}

/* ---- cards ------------------------------------------------------------------------------- */
function renderCards() {
  const card = () => `<coreui-card borderstyle="primary"><div class="Core-Card is-borderStyle-primary is-bg-primary is-border-primary">
      <div class="Core-Card-top"><div class="Core-Card-topHeader">
        <div class="Core-Card-iconContainer">${statusBadge(S.selectedKey, 'medium')}</div>
        <div class="Core-Card-subHeader"><div class="Core-Card-subHeaderContent"><p>Subheader</p></div></div></div>
        <div class="Core-Card-headerContainer"><div class="Core-Card-subHeaderContent"><h3 class="Core-Card-header">Header</h3></div></div></div>
      <div class="Core-Card-body"><div class="Core-Card-content"><div class="Core-Card-text">Body Text</div></div></div>
      <div class="Core-Card-bottom dh-card-footer" data-dh="footer layout"><button type="button" class="Core-Button is-ready">Footer</button></div>
    </div></coreui-card>`;
  el('cardMount').innerHTML = [1, 2, 3, 4].map(card).join('');
}

function renderSurfaces() {
  document.querySelectorAll('.dh-surface').forEach((s) => { s.hidden = s.dataset.surface !== S.page; });
  const i = PAGES.findIndex((p) => p.key === S.page);
  el('pname').textContent = PAGES[i].name;
  const chev = (d) => `<div coreuisvgicon="chevron${d}" aria-hidden="true" class="Core-SVG Core-SVG--chevron${d}"><svg viewBox="0 0 24 24"><path d="${d === 'Left'
    ? 'M7.9,12c0-.2,0-.4.1-.5,0-.2.2-.3.3-.4l5.7-5.7c.2-.2.6-.4.9-.3.3,0,.6.2.9.4.2.3.3.6.3.9,0,.3-.2.7-.4.9l-4.7,4.7,4.7,4.7c.2.2.4.6.4.9,0,.3-.1.7-.3.9-.2.3-.5.4-.9.4-.3,0-.6-.1-.9-.3l-5.7-5.7c-.1-.1-.2-.3-.3-.4,0-.2-.1-.3-.1-.5Z'
    : 'M16.1,12c0-.2,0-.4-.1-.5,0-.2-.2-.3-.3-.4l-5.7-5.7c-.2-.2-.6-.4-.9-.3-.3,0-.6.2-.9.4-.2.3-.3.6-.3.9,0,.3.2.7.4.9l4.7,4.7-4.7,4.7c-.2.2-.4.6-.4.9,0,.3.1.7.3.9.2.3.5.4.9.4.3,0,.6-.1.9-.3l5.7-5.7c.1-.1.2-.3.3-.4,0-.2.1-.3.1-.5Z'}"/></svg></div>`;
  el('pager').innerHTML = `<coreui-pagination><nav aria-label="Preview pages" class="Core-Pagination">
    <button type="button" coreuibutton="icon" aria-label="Previous" class="Core-PaginationLeft Core-Button Core-Button--icon is-ready" data-turn="-1" ${i === 0 ? 'disabled' : ''}>${chev('Left')}</button>
    ${PAGES.map((p, n) => `<button type="button" coreuibutton="icon" class="Core-PaginationItem ${p.key === S.page ? 'is-active' : ''} Core-Button Core-Button--icon is-ready" data-page="${p.key}" ${p.key === S.page ? 'aria-current="page"' : ''} aria-label="${p.name}">${n + 1}</button>`).join('')}
    <button type="button" coreuibutton="icon" aria-label="Next" class="Core-PaginationRight Core-Button Core-Button--icon is-ready" data-turn="1" ${i === PAGES.length - 1 ? 'disabled' : ''}>${chev('Right')}</button>
  </nav></coreui-pagination>`;
}
function turn(delta) { const i = PAGES.findIndex((p) => p.key === S.page); const n = i + delta; if (n < 0 || n >= PAGES.length) return; S.page = PAGES[n].key; renderAll(); }

/* ---- Show code: the live HTML of the page on show, exactly as it stands in the DOM, formatted and coloured ------- */
const VOID_TAGS = new Set(['input', 'col', 'br', 'img', 'hr', 'path', 'circle', 'rect', 'line', 'polygon', 'use']);
function prettyHtml(html) {
  const out = []; let depth = 0;
  for (const tok of html.split(/(<[^>]+>)/)) {
    if (!tok.trim()) continue;
    if (tok[0] !== '<') { out.push('  '.repeat(depth) + tok.trim().replace(/\s+/g, ' ')); continue; }
    const closing = tok[1] === '/', name = tok.match(/^<\/?([\w-]+)/)?.[1] || '';
    if (closing) depth = Math.max(0, depth - 1);
    out.push('  '.repeat(depth) + tok.replace(/\s+/g, ' '));
    if (!closing && !tok.endsWith('/>') && !VOID_TAGS.has(name)) depth++;
  }
  return out.join('\n');
}
const escapeHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function highlightHtml(text) {
  let ours = 0;
  const lines = text.split('\n').map((line) => {
    const m = line.match(/^(\s*)<(\/?)([\w-]+)(.*?)(\/?>)$/);
    if (!m) return escapeHtml(line);
    const attrs = m[4].replace(/([\w:-]+)(="[^"]*")?/g, (_, k, v) => `<span class="k">${k}</span>${v ? `<span class="v">${escapeHtml(v)}</span>` : ''}`);
    const html = `${m[1]}<span class="t">&lt;${m[2]}${m[3]}</span>${attrs}<span class="t">${escapeHtml(m[5])}</span>`;
    if (/ data-dh="/.test(line)) { ours++; return `<span class="dh">${html}</span>`; }
    return html;
  });
  return { html: lines.join('\n'), total: lines.length, ours };
}
function renderCode() {
  const surface = document.querySelector('.dh-surface:not([hidden])');
  const { html, total, ours } = highlightHtml(prettyHtml(surface.innerHTML));
  el('spec').innerHTML = html;
  el('codeCount').textContent = `${total} lines · ${total - ours} CORE UI · ${ours} Data Health (marked data-dh)`;
}

function renderAll() { renderControls(); renderDash(); renderTable(); renderCards(); renderSurfaces(); renderCode(); }

/* ---- events -------------------------------------------------------------------------------- */
el('controlsMount').addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 'style') S.style = t.value;
  else if (t.name === 'status') { S.selectedKey = t.value; S.filter = null; }   // the switcher: every badge takes this status
  renderAll();
});
el('dash').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-key]'); if (!btn) return;
  S.filter = (S.filter === btn.dataset.key) ? null : btn.dataset.key;
  if (S.filter) S.selectedKey = S.filter;   // mark the status here; the Table shows it narrowed when you turn to it (no automatic page turn)
  animateFilter();
});
el('pager').addEventListener('click', (e) => {
  const t = e.target.closest('[data-turn]'); if (t) return turn(+t.dataset.turn);
  const p = e.target.closest('[data-page]'); if (p) { S.page = p.dataset.page; renderAll(); }
});
document.addEventListener('keydown', (e) => { if (e.target.matches('input, select, textarea, button')) return; if (e.key === 'ArrowLeft') turn(-1); if (e.key === 'ArrowRight') turn(1); });
el('resetBtn').addEventListener('click', () => { S = { ...defaults(), page: S.page }; renderAll(); });   // resets the deck, keeps the current preview page

// theme: applied at load by the inline script in index.html (before first paint); this keeps the select in step,
// paints root + body inline for the embedded pane, and remembers the choice for the next load
function applyTheme(t) {
  document.body.classList.remove('Core-Theme--Light', 'Core-Theme--Dark');
  document.body.classList.add(`Core-Theme--${t}`);
  const d = t === 'Dark'; const h = document.documentElement;
  h.style.background = d ? '#1a1a1a' : '#f7f7f7'; h.style.colorScheme = d ? 'dark' : 'light'; h.setAttribute('data-theme', t);
  document.body.style.background = d ? '#1a1a1a' : '#f7f7f7';
  try { localStorage.setItem('dh-theme', t); } catch (e) {}
}
el('theme-switcher').value = document.documentElement.getAttribute('data-theme') || 'Light';
el('theme-switcher').addEventListener('change', (e) => applyTheme(e.target.value));

/* Show code / Copy code: Storybook's row under the preview; the code surface opens above it */
el('codeToggle').addEventListener('click', () => {
  const open = el('codePanel').hidden;
  el('codePanel').hidden = !open;
  el('codeToggle').setAttribute('aria-expanded', String(open));
  el('codeToggle').classList.toggle('docblock-code-toggle--expanded', open);
  el('codeToggleText').textContent = open ? 'Hide code' : 'Show code';
});
el('codeCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(el('spec').innerText); el('codeCopyText').textContent = 'Copied'; }
  catch (e) { el('codeCopyText').textContent = 'Copy failed'; }
  setTimeout(() => { el('codeCopyText').textContent = 'Copy code'; }, 1500);
});

/* tooltip: one floating .Core-ToolTip, shown above whichever trigger is hovered or focused */
const tip = el('tip');
function showTip(t) {
  el('tipText').textContent = t.dataset.tip; tip.hidden = false;
  const r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
  tip.style.top = `${Math.max(8, r.top - h - 10)}px`;
}
document.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-tip]'); if (t) showTip(t); else if (!e.target.closest('#tip')) tip.hidden = true; });
document.addEventListener('focusin', (e) => { const t = e.target.closest('[data-tip]'); if (t) showTip(t); });
document.addEventListener('focusout', () => { tip.hidden = true; });
document.addEventListener('scroll', () => { tip.hidden = true; el('chartTip').classList.remove('Core-DataViz-Tooltip-is-open'); }, true);

/* chart tooltip: their coreui-panel is a fixed 0x0 anchor at the window origin, so the content box is placed in window
 * coordinates above the hovered slice's point (their panel service does this in CORE UI); the slice takes is-active */
el('dash').addEventListener('mouseover', (e) => {
  const p = e.target.closest('.Core-DataViz-DonutSeries'); if (!p) return;
  const v = view(p.dataset.key), panel = el('chartTip');
  el('chartTipColor').style.backgroundColor = v.hex; el('chartTipValue').textContent = p.dataset.n; el('chartTipLabel').textContent = v.label;
  const point = p.previousElementSibling.getBoundingClientRect(), box = panel.querySelector('.Core-Panel-content');
  const ring = p.closest('svg').getBoundingClientRect(), card = p.closest('.Core-DataViz-Card').getBoundingClientRect();
  const px = point.left + point.width / 2, py = point.top + point.height / 2;
  const above = py < ring.top + ring.height / 2, leftSide = px < ring.left + ring.width / 2;
  const x = leftSide ? px + 12 - box.offsetWidth : px - 12;
  box.style.left = `${Math.min(Math.max(x, card.left + 8), card.right - box.offsetWidth - 8)}px`;
  box.style.top = `${above ? point.top - box.offsetHeight - 8 : point.bottom + 8}px`;
  panel.classList.add('Core-DataViz-Tooltip-is-open');
  p.classList.add('is-active');
});
el('dash').addEventListener('mouseout', (e) => {
  const p = e.target.closest('.Core-DataViz-DonutSeries'); if (!p) return;
  el('chartTip').classList.remove('Core-DataViz-Tooltip-is-open');
  if (p.dataset.key !== S.selectedKey) p.classList.remove('is-active');
});

/* summary -> details: rows fade out, re-render, fade in — the moment the motion spec attaches to */
function animateFilter() {
  document.querySelectorAll('#tableMount tbody tr').forEach((r) => r.classList.add('dh-row-hidden'));
  setTimeout(renderAll, 180);
}

renderAll();
