/* Data Health prototype — behaviour. Everything in this file is Data Health's: it stands in for the Angular
 * behaviour CORE UI's components carry (tooltips, page turning, the chart, the narrowing). CORE UI's own markup is
 * reproduced as captured from its Storybook (coreui-markup.js); every element Data Health adds or changes carries a
 * data-dh attribute.
 *   Controls (right panel, CORE UI RadioGroup markup):
 *     Option    — which icon family: A Classic · B Stack · C Hybrid (data.js OPTIONS; assets/status/<a|b|c>/)
 *     Rendering — icon: the icon, its name beside it · lozenge: icon and name in a tinted, bordered pill
 *   Every row and card carries its own state (data.js).
 *   Summary → details: with NARROWING on, clicking a state on the dashboard narrows the Table to it. It is OFF — the
 *   Table always shows every row.
 * State: `S` — option, render, filter (narrowing), page. */

const NARROWING = false;
const PAGES = [
  { key: 'table', name: 'Table' },
  { key: 'tableGroups', name: 'Table w/ Group Headers' },
  { key: 'card', name: 'Card' },
  { key: 'dash', name: 'Dashboard Summary: Radial' },
  { key: 'dashBar', name: 'Dashboard Summary: Bar' },
];
const defaults = () => ({ option: 'A', render: 'icon', filter: null, page: 'table' });
let S = defaults();

const el = (id) => document.getElementById(id);

/* ---- the icons: fetched once per option and state, then inlined so CSS can recolour parts of them ------------- */
const ICON_SVG = {};   // `${dir}/${key}` → svg markup
async function loadIcons() {
  await Promise.all(OPTIONS.flatMap((o) => STATUSES.map(async (s) => {
    const id = `${o.dir}/${s.key}`;
    if (ICON_SVG[id]) return;
    const r = await fetch(`assets/status/${id}.svg`);
    ICON_SVG[id] = r.ok ? (await r.text()).replace(/<\?xml[^>]*>/, '').trim() : '';
  })));
}
const iconSvg = (key) => ICON_SVG[`${OPTION[S.option].dir}/${key}`] || '';
const iconEl = (key, cls = '') => `<span class="dh-icon ${cls}" aria-hidden="true">${iconSvg(key)}</span>`;

/* ---- CORE UI form-control builders (their rendered markup) ------------------------------- */
function radioGroup(name, legend, items, current) {
  return `<fieldset class="Core-RadioGroup Core-RadioGroup--vertical has-bottom-margin"><legend class="Core-RadioGroup-label"><span>${legend}</span></legend>
    <div class="Core-RadioGroup-content">${items.map((it) => `<div class="Core-FormField has-bottom-margin"><label class="Core-FormField-label">
      <span class="Core-FormField-labelValue">${it.label}</span>
      <input type="radio" class="Core-Radio-input is-ready" name="${name}" value="${it.value}" ${it.value === current ? 'checked' : ''}></label></div>`).join('')}</div></fieldset>`;
}

/* ---- the status indicator (data-health.css) ----------------------------------------------- */
function statusMark(key) {
  const s = STATUS[key], kind = S.render;
  return `<span class="dh-status dh-status--${kind} dh-status--${s.key}" data-dh="status ${kind} · option ${S.option}">${iconEl(key)}<span>${s.label}</span></span>`;
}
// The bare icon (the design file's Table and Card, icon rendering): no label; CORE UI's tooltip names the state on
// hover or focus — "Data Health: <State>", the text the design file's Tooltip carries.
function statusIcon(key) {
  const s = STATUS[key];
  return `<span class="dh-status dh-status--bare dh-status--${s.key} Core-ToolTip-trigger" role="img" aria-label="Data Health: ${s.label}" tabindex="0" data-tip="Data Health: ${s.label}" data-dh="status icon · option ${S.option} · tooltip">${iconEl(key)}</span>`;
}
// What the table's Status column shows: the bare icon with its tooltip, or the lozenge.
const statusCell = (key) => S.render === 'lozenge' ? statusMark(key) : statusIcon(key);

/* ---- controls panel ------------------------------------------------------------------------ */
function renderControls() {
  el('controlsMount').innerHTML = radioGroup('option', 'Option', OPTIONS.map((o) => ({ value: o.key, label: o.label })), S.option)
    + radioGroup('render', 'UI Style', [{ value: 'icon', label: 'Icon' }, { value: 'lozenge', label: 'Lozenge' }], S.render);
}

/* ---- dashboard summary ---------------------------------------------------------------------
 * A: CORE UI's Data Visualizations · Radial card. Ring geometry is their donut's: outer 86.5, inner 70, centred at
 *    87.5. The state's icon sits in the legend's colour slot.
 * B: CORE UI's Data Visualizations · stacked vertical Bar card — one series per state, one bar per month, geometry as
 *    their demo draws it. The legend is a row of lozenges.
 * Legend items are their text buttons. With NARROWING on, clicking one (or a slice, or a bar segment) marks that state
 * and narrows the Table; clicking it again clears it. */
// The tooltip's text classes follow each chart's own demo: the Radial's value is `tooltip-xvalue` over a
// `tooltip-yvalue` label; the Bar's value is `tooltip-yvalue` over a `tooltip-series-name`. Same look, their names.
// Both charts are mounted at once (two pages), so the tooltip parts are found by class inside each chart, not by id.
const chartTip = (bar) => `<coreui-dataviz-tooltip><coreui-panel overlaystyle="none" class="Core-DataViz-Tooltip-panel dh-chart-tip" data-dh="placed by app.js"><div class="Core-Panel-content is-visible"><div class="Core-DataViz-Tooltip-content">
    <div class="tooltip"><div class="tooltip-color"></div><div class="tooltip-display"><span class="${bar ? 'tooltip-yvalue' : 'tooltip-xvalue'} dh-tip-value"></span><span class="${bar ? 'tooltip-series-name' : 'tooltip-yvalue'} dh-tip-label"></span></div></div>
  </div></div></coreui-panel></coreui-dataviz-tooltip>`;
const legendItem = (key, inner) => `<div class="Core-DataViz-Legend-item ${S.filter === key ? 'is-selected' : ''}">
    <button type="button" coreuibutton="text-primary" tabindex="0" class="Core-Button Core-Button--text-primary is-ready" data-key="${key}"${NARROWING ? ` aria-pressed="${S.filter === key}" data-dh="click narrows the table"` : ''}>${inner}</button></div>`;

function renderDash() {
  for (const id of ['dash', 'dashBar']) el(id).classList.toggle('dh-narrowing', NARROWING);   // the pointer cursor promises a click only when one works
  el('dash').innerHTML = radialDash();
  el('dashBar').innerHTML = barDash();
}

function radialDash() {
  const counts = STATUSES.map((s) => ({ s, n: FLEET[s.key] }));
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
      <path d="${d}" class="Core-DataViz-DonutSeries ${S.filter === c.s.key ? 'is-active' : ''}" style="fill: ${c.s.hex};" data-key="${c.s.key}" data-n="${c.n}"></path>`;
  }).join('');
  // icon: the icon takes the legend's colour slot, name and count beside it. lozenge: the pill replaces slot + name.
  const legend = counts.map(({ s, n }) => legendItem(s.key, S.render === 'lozenge'
    ? `<div class="dh-legend-lozenge" data-dh="status lozenge">${statusMark(s.key)}<coreui-dataviz-series-name><div aria-label="${s.label} ${n}" class="legend-item"><span>${n}</span></div></coreui-dataviz-series-name></div>`
    : `<div class="Core-DataViz-Legend-item-color dh-legend-icon" data-dh="status icon">${iconEl(s.key)}</div>
        <div class="Core-DataViz-Legend-item-name"><coreui-dataviz-series-name><div aria-label="${s.label} ${n}" class="legend-item"><span>${s.label}</span><span>${n}</span></div></coreui-dataviz-series-name></div>`)).join('');
  return `<coreui-dataviz-card header="Data Health"><div class="Core-DataViz-Card">
    <div class="Core-DataViz-Card-header"><h3>Data Health</h3><div class="Core-DataViz-Card-info"></div></div>
    <coreui-dataviz-portal data-qa="data-viz-donut" class="is-vertical"><div class="Core-DataViz-Portal">
      <svg class="Core-DataViz-Portal-Viz" width="175" height="175" viewBox="0 0 175 175" role="img" data-dh="ring drawn by app.js" aria-label="${total} sources by Data Health status"><g class="Core-DataViz-Series-container" transform="translate(87.5, 87.5)" style="cursor: default;">${slices}</g></svg></div>
      <coreui-dataviz-legend position="right"><div class="Core-DataViz-Legend is-vertical">${legend}</div></coreui-dataviz-legend>
      ${chartTip(false)}
    </coreui-dataviz-portal></div></coreui-dataviz-card>`;
}

function barDash() {
  const W = 860, LEFT = 76, TOP = 40, BASE = 278, MAX = 500, STEP = W / (BAR_MONTHS.length - 0.5), BAR = STEP / 2, GAP = 2;
  const y = (v) => BASE - (v / MAX) * (BASE - TOP);
  const stackOrder = [...STATUSES].reverse();   // worst on top
  const tops = BAR_MONTHS.map(() => BASE);
  const series = stackOrder.map((s) => {
    const rects = BAR_MONTHS.map((m, i) => {
      const n = m[s.key]; if (!n) return '';
      const bottom = tops[i], top = bottom - (BASE - y(n)); tops[i] = top;
      const h = bottom - top - (bottom < BASE ? GAP : 0);
      return `<rect x="${(LEFT + i * STEP).toFixed(2)}" y="${top.toFixed(2)}" height="${h.toFixed(2)}" width="${BAR.toFixed(2)}" data-name="${m.month}" data-key="${s.key}" data-n="${n}" style="cursor: default;"${S.filter === s.key ? ' class="is-active"' : ''}></rect>`;
    }).join('');
    return `<g class="Core-DataViz-VerticalBarSeries" fill="${s.hex}">${rects}</g>`;
  }).join('');
  const xTicks = BAR_MONTHS.map((m, i) => `<g class="tick" opacity="1" transform="translate(${(i * STEP + BAR / 2).toFixed(2)},0)"><line stroke="currentColor" y2="0"></line><text fill="currentColor" y="16" dy="0.71em">${m.month}</text></g>`).join('');
  const yTicks = [0, 100, 200, 300, 400, 500].map((v) => `<g class="tick" opacity="1" transform="translate(0, ${(y(v) - TOP + 0.5).toFixed(2)})"><line stroke="currentColor" x2="0"></line><text fill="currentColor" x="-20" dy="0.32em">${v}</text></g>`).join('');
  const legend = STATUSES.map((s) => legendItem(s.key, statusMark(s.key))).join('');
  return `<coreui-sb-stacked-vertical-bar><coreui-dataviz-card header="Data Health"><div class="Core-DataViz-Card">
    <div class="Core-DataViz-Card-header"><h3>Data Health</h3><div class="Core-DataViz-Card-info"></div></div>
    <coreui-dataviz-portal><div class="Core-DataViz-Portal">
      <svg class="Core-DataViz-Portal-Viz" viewBox="0 0 ${LEFT + W + 24} 345" role="img" data-dh="bars drawn by app.js" aria-label="Customers by Data Health status, per month">
        <g class="Core-DataViz-Series-container" transform="translate(76, 40)"><g class="Core-DataViz-VerticalBarStackedGroup" style="transform: translate(-76px, -40px);">${series}</g></g>
        <g class="Core-DataViz-Axis Core-DataViz-Axis--bottom Core-DataViz-AxisScale--ordinal" transform="translate(76,287)" fill="none" font-size="10" font-family="sans-serif" text-anchor="middle"><path class="domain" stroke="currentColor" d="M0.5,0.5H${W + 0.5}"></path>${xTicks}<rect x="0" y="-3" width="${W}" height="4" rx="1" class="Core-DataViz-Axis-border"></rect><text class="Core-DataViz-Axis-Label" text-anchor="middle" transform="translate(${W / 2},48)">Month</text></g>
        <g class="Core-DataViz-Axis Core-DataViz-Axis--left Core-DataViz-AxisScale--linear-stacked" transform="translate(72,40)" fill="none" font-size="10" font-family="sans-serif" text-anchor="end"><path class="domain" stroke="currentColor" d="M0.5,239.5V0.5"></path>${yTicks}<text class="Core-DataViz-Axis-Label" transform="translate(-62,119.5) rotate(-90)" text-anchor="middle">Customers</text></g>
      </svg></div>
      <coreui-dataviz-legend><div class="Core-DataViz-Legend">${legend}</div></coreui-dataviz-legend>
      ${chartTip(true)}
    </coreui-dataviz-portal></div></coreui-dataviz-card></coreui-sb-stacked-vertical-bar>`;
}

/* ---- table ------------------------------------------------------------------------------- *
 * A: CORE UI's Table live demo (Checkbox Column · Table Header · Group Headers · Column Borders · row actions), its rows
 *    grouped by state; the state sits in each group header.
 * B: CORE UI's Filters & Action Bar live demo; the state sits in its Status column.
 * A narrowed-away group or row stays in the markup, hidden, so the narrowing can animate. */
const narrowed = (key) => S.filter && S.filter !== key;
const rowAttrs = (key) => narrowed(key) ? 'class="Core-Table-row dh-row-anim dh-row-hidden" hidden data-dh="narrowed away"' : 'class="Core-Table-row dh-row-anim"';

function renderTable() { el('tableMount').innerHTML = filtersTable(); el('tableGroupsMount').innerHTML = groupedTable(); }

function groupedTable() {
  let menu = 0;
  const row = (key, name) => {
    const r = DEMO_ROWS[name];
    return `<tr coreuitablerow="" ${rowAttrs(key)}><td coreuitablecheckboxcolumn="" class="Core-Table-checkboxColumn"><label><input type="checkbox" coreuicheckbox="" aria-label="Select ${name} row" aria-checked="false" class="Core-Checkbox-input"></label></td>`
      + `<td>${name}<div class="secondary-text">${r.ai ? '<i coreuiicon="wand" class="Core-ToolTip-trigger Core-Icon--wand Core-Icon" aria-label="wand" role="img" tabindex="0" data-tip="Generated with AI"></i>' : ''}${r.shared ? '<i coreuiicon="audiences" class="Core-ToolTip-trigger Core-Icon--audiences Core-Icon" aria-label="audiences" role="img" tabindex="0" data-tip="Shared"></i>' : ''}</div></td>`
      + `<td>${r.budget}</td><td>${r.spend}</td><td>${r.views}</td><td>${r.clicks}</td>`
      + `<td>${r.updated}<div class="text-style-muted-3">by username</div></td>`
      + `<td coreuitableactioncolumn="" class="Core-Table-actionColumn">${TABLE_ROW_MENU.replaceAll('coreui-menu-panel-0', `coreui-menu-panel-${menu++}`)}</td></tr>`;
  };
  const group = ([key, names]) => `<tr${narrowed(key) ? ' hidden data-dh="narrowed away"' : ''}><th scope="colgroup" colspan="8" id="${key}-group" class="Core-Table-group-headerRow-titleSpacing">`
    + `<coreui-table-group-header title="${STATUS[key].label}" class="Core-Table-group-headerRow-badge"><div class="Core-Table-group-headerRow"><div class="Core-Table-group-headerRow-container"><div class="Core-Table-group-headerRow-icon-container">${statusMark(key)}</div></div></div></coreui-table-group-header></th></tr>`
    + names.map((name) => row(key, name)).join('');
  return `<coreui-table class="tables-fixed-header is-medium-row-spaced"><div aria-live="polite" aria-atomic="true" class="Core-Table-sr-only"></div><div class="Core-Table"><coreui-scroll-indicator class="Core-ScrollIndicator"><div class="Core-ScrollIndicator-wrapper"><div coreuiscrollindicatortarget="" class="Core-Table-wrapper" tabindex="-1">`
    + `<table class="has-vertical-lines"><caption>Campaign Performance Data</caption>${TABLE_COLGROUP}${TABLE_HEAD}`
    + `<tbody coreuicheckboxmultipleselection="" class="Core-Table-body--single-row">${TABLE_GROUPS.map(group).join('')}</tbody></table>`
    + `</div></div></coreui-scroll-indicator></div></coreui-table>`;
}

function filtersTable() {
  const row = (r) => `<tr coreuitablerow="" ${rowAttrs(r.status)}><td coreuitablecheckboxcolumn="" class="Core-Table-checkboxColumn"><label><input type="checkbox" coreuicheckbox="" aria-label="Select ${r.name} row" aria-checked="false" class="Core-Checkbox-input"></label></td>`
    + `<td coreuitableiconcolumn="" class="Core-Table-iconColumn"><div class="Core-Badge"><coreui-badge color="Blueberry" size="small"><div class="Core-Badge Core-Badge-color--Blueberry is-border is-bold is-icon-status"><div class="Core-Badge-label is-small">${FAB_CHANNEL[r.channel]}</div></div></coreui-badge></div></td>`
    + `<td><div class="campaign-cell"><div><span>${r.name}</span></div></div></td>`
    + `<td>${statusCell(r.status)}</td>`
    + `<td>${r.budget}</td><td>${r.spend}</td><td>${r.pacing}</td><td>${r.views}</td><td>${r.clicks}</td></tr>`;
  return `<coreui-sb-filter-action-bar-live-demo><form novalidate="">${FAB_ACTION_BAR}`
    + `<coreui-table coreuiinfinitescroll="" data-qa="table-liveDemo" class="scroll-table is-medium-row-spaced"><div aria-live="polite" aria-atomic="true" class="Core-Table-sr-only"></div><div class="Core-Table Core-Table--fixedHeader"><coreui-scroll-indicator class="Core-ScrollIndicator"><div class="Core-ScrollIndicator-wrapper"><div coreuiscrollindicatortarget="" class="Core-Table-wrapper" tabindex="0" style="max-height: 600px;">`
    + `<table class="has-vertical-lines"><caption></caption>${FAB_COLGROUP}${FAB_HEAD}<tbody coreuicheckboxmultipleselection="">${FAB_ROWS.map(row).join('')}</tbody></table>`
    + `</div></div></coreui-scroll-indicator></div></coreui-table></form></coreui-sb-filter-action-bar-live-demo>`;
}

/* ---- cards -------------------------------------------------------------------------------
 * CORE UI's Card live demo. A: the state's icon on the corner of the card's own icon. B: a lozenge in the card's
 * top-right corner. */
function renderCards() {
  const B = S.render === 'lozenge';
  const icon = (key) => `<span class="dh-icon dh-card-icon Core-ToolTip-trigger" role="img" aria-label="Data Health: ${STATUS[key].label}" tabindex="0" data-tip="Data Health: ${STATUS[key].label}" data-dh="status icon · option ${S.option} · tooltip">${iconSvg(key)}</span>`;
  const card = (key) => `<coreui-card borderstyle="primary"><div class="Core-Card is-borderStyle-primary is-bg-primary is-border-primary">
      <div class="Core-Card-top"><div class="Core-Card-topHeader">
        <div class="Core-Card-iconContainer">${CARD_ICON}${B ? '' : icon(key)}</div>
        <div class="Core-Card-subHeader"><div class="Core-Card-subHeaderContent"><p>Subheader</p></div></div></div>
        <div class="Core-Card-headerContainer"><div class="Core-Card-subHeaderContent"><h3 class="Core-Card-header">Header</h3></div></div></div>
      <div class="Core-Card-body"><div class="Core-Card-content"><div class="Core-Card-text">Body Text</div></div></div>
      <div class="Core-Card-bottom dh-card-footer" data-dh="footer layout"><button type="button" class="Core-Button is-ready">Footer</button></div>
      ${B ? `<div class="dh-card-lozenge" data-dh="status placement">${statusMark(key)}</div>` : ''}
    </div></coreui-card>`;
  el('cardMount').innerHTML = CARD_STATUSES[S.render].map(card).join('');
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
  if (e.target.name === 'option') { S.option = e.target.value; renderAll(); }
  if (e.target.name === 'render') { S.render = e.target.value; renderAll(); }
});
const DASHES = [el('dash'), el('dashBar')];
for (const d of DASHES) d.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-key]'); if (!btn || !NARROWING) return;
  S.filter = (S.filter === btn.dataset.key) ? null : btn.dataset.key;   // mark the state here; the Table shows it narrowed when you turn to it
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
  // Light and Dark are CORE UI's own themes.
  const d = t !== 'Light'; const h = document.documentElement;
  document.body.classList.remove('Core-Theme--Light', 'Core-Theme--Dark');
  document.body.classList.add(d ? 'Core-Theme--Dark' : 'Core-Theme--Light');
  h.style.background = d ? '#1a1a1a' : '#f7f7f7'; h.style.colorScheme = d ? 'dark' : 'light'; h.setAttribute('data-theme', t);
  document.body.style.background = d ? '#1a1a1a' : '#f7f7f7';
  try { localStorage.setItem('dh-theme', t); } catch (e) {}
}
el('theme-switcher').value = document.documentElement.getAttribute('data-theme') || 'Light';
applyTheme(el('theme-switcher').value);   // the boot script painted the stage; this dresses the preview for the stored theme
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

/* tooltip: one floating .Core-ToolTip, shown above whichever trigger is hovered or focused.
 * Timing and motion are CORE UI's own, read from their Storybook bundle (TooltipDirective + PanelComponent):
 *   - the directive waits `displayDelay` = 100ms before showing;
 *   - the panel then takes `is-open-up` (its position is "top"), which runs their `panel-open-up` keyframes — opacity
 *     0→1 while rising from translateY(10px) — over $timingFast 200ms, $easingStandard cubic-bezier(.4,0,.2,1);
 *   - hiding runs `panel-close-up` (the reverse) and the panel is removed on `animationend`.
 * The keyframes and classes are copied verbatim into shell.css. */
const tip = el('tip');
const TIP_DELAY = 100;   // CORE UI TooltipDirective displayDelay default
let tipTimer = null;
function placeTip(t) {
  const r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  // centred over the trigger, arrow on its midpoint; kept inside the window
  const wantLeft = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
  const wantTop = Math.max(8, r.top - h - 10);
  tip.style.left = `${wantLeft}px`; tip.style.top = `${wantTop}px`;
  // the fixed box does not land exactly where it is put (the page's reserved scrollbar gutter shifts it, as it does
  // the chart tooltip), so correct by however far it actually landed from the target
  const got = tip.getBoundingClientRect();
  tip.style.left = `${wantLeft + (wantLeft - got.left)}px`; tip.style.top = `${wantTop + (wantTop - got.top)}px`;
}
function showTip(t) {
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => {
    el('tipText').textContent = t.dataset.tip;
    tip.classList.remove('is-close-up'); tip.hidden = false;
    placeTip(t);
    tip.classList.add('is-open-up');
  }, TIP_DELAY);
}
let tipSettle = null;
function settleTip() { clearTimeout(tipSettle); tip.hidden = true; tip.classList.remove('is-close-up'); }
function hideTip() {
  clearTimeout(tipTimer);
  if (tip.hidden) return;
  tip.classList.remove('is-open-up'); tip.classList.add('is-close-up');
  // their PanelComponent settles on animationend, with a 400ms timer as the fallback (a hidden window runs no animations)
  clearTimeout(tipSettle); tipSettle = setTimeout(settleTip, 400);
}
tip.addEventListener('animationend', (e) => { if (e.animationName === 'panel-close-up') settleTip(); });
document.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-tip]'); if (t) showTip(t); else if (!e.target.closest('#tip')) hideTip(); });
document.addEventListener('focusin', (e) => { const t = e.target.closest('[data-tip]'); if (t) showTip(t); });
document.addEventListener('focusout', () => { hideTip(); });
document.addEventListener('scroll', () => { hideTip(); document.querySelectorAll('.dh-chart-tip').forEach((p) => p.classList.remove('Core-DataViz-Tooltip-is-open')); }, true);

/* chart tooltip: their coreui-panel is a fixed 0x0 anchor at the window origin, so the content box is placed in window
 * coordinates (their panel service does this in CORE UI) — beside a slice's point, or left of a bar stack. The hovered
 * slice or segment takes is-active. */
for (const d of DASHES) d.addEventListener('mouseover', (e) => {
  const p = e.target.closest('[data-n]'); if (!p) return;
  const v = STATUS[p.dataset.key], panel = d.querySelector('.dh-chart-tip'), box = panel.querySelector('.Core-Panel-content');
  panel.querySelector('.tooltip-color').style.backgroundColor = v.hex; panel.querySelector('.dh-tip-value').textContent = p.dataset.n; panel.querySelector('.dh-tip-label').textContent = v.label;
  const card = p.closest('.Core-DataViz-Card').getBoundingClientRect();
  let x, top;
  if (p.matches('.Core-DataViz-DonutSeries')) {
    const point = p.previousElementSibling.getBoundingClientRect(), ring = p.closest('svg').getBoundingClientRect();
    const px = point.left + point.width / 2, py = point.top + point.height / 2;
    const above = py < ring.top + ring.height / 2, leftSide = px < ring.left + ring.width / 2;
    x = leftSide ? px + 12 - box.offsetWidth : px - 12;
    top = above ? point.top - box.offsetHeight - 8 : point.bottom + 8;
  } else {
    // left of the bar stack, level with the hovered segment; the right side only when the left has no room
    const r = p.getBoundingClientRect();
    x = r.left - 8 - box.offsetWidth < card.left + 8 ? r.right + 8 : r.left - 8 - box.offsetWidth;
    top = Math.min(Math.max(r.top + r.height / 2 - box.offsetHeight / 2, card.top + 8), card.bottom - box.offsetHeight - 8);
  }
  const wantLeft = Math.min(Math.max(x, card.left + 8), card.right - box.offsetWidth - 8);
  box.style.left = `${wantLeft}px`; box.style.top = `${top}px`;
  // the anchor is not exactly at the window origin (the page's reserved scrollbar gutter, its scroll), so correct the
  // box by however far it actually landed from where it was put
  const got = box.getBoundingClientRect();
  box.style.left = `${2 * wantLeft - got.left}px`; box.style.top = `${2 * top - got.top}px`;
  panel.classList.add('Core-DataViz-Tooltip-is-open');
  p.classList.add('is-active');
});
for (const d of DASHES) d.addEventListener('mouseout', (e) => {
  const p = e.target.closest('[data-n]'); if (!p) return;
  d.querySelector('.dh-chart-tip').classList.remove('Core-DataViz-Tooltip-is-open');
  if (p.dataset.key !== S.filter) p.classList.remove('is-active');
});

/* summary -> details: rows fade out, re-render, fade in — the moment the motion spec attaches to */
function animateFilter() {
  document.querySelectorAll('#tableMount tbody tr, #tableGroupsMount tbody tr').forEach((r) => r.classList.add('dh-row-hidden'));
  setTimeout(renderAll, 180);
}

loadIcons().then(renderAll);
