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
  { key: 'tableGroups', name: 'Table w/Group Headers' },
  { key: 'card', name: 'Card' },
  { key: 'dash', name: 'Dashboard Radial' },
  { key: 'dashBar', name: 'Dashboard Bar' },
];
const defaults = () => ({ option: 'A', render: 'icon', filter: null, page: 'table', loop: motionDefaults().loop, off: [] });   // off: legend items toggled off (CORE UI's legend behaviour)   // loop's default is saved with the motion table
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
    + radioGroup('render', 'UI Style', [{ value: 'icon', label: 'Icon' }, { value: 'lozenge', label: 'Lozenge' }], S.render)
    + (S.page === 'dash' ? motionControls() : '');
}
// Motion controls (Radial page only): sliders over the motion table's ring tracks, CORE UI's easing names, loop, replay.
function motionControls() {
  const tr = MOTION.radialEnter.tracks, ring = tr.find((t) => t.element === 'ring'), rows = tr.find((t) => t.element === 'legendRow'), rise = tr.find((t) => t.property === 'translateY'), glow = tr.find((t) => t.property === 'glow');
  const lift = tr.find((t) => t.trigger === 'hover' && t.property === 'liftOut');
  const urgent = tr.find((t) => t.element === 'urgentIcon'), urgentBounce = tr.find((t) => t.element === 'urgentIcon' && t.property === 'translateY'), urgentGlow = tr.find((t) => t.element === 'urgentIcon' && t.property === 'glow');
  // each block is a collapsible section; which ones are open is remembered per section (DC: the deck ran off screen)
  const section = (key, label, inner) => `<details class="dh-motion-section" data-section="${key}" ${MOTION_OPEN[key] ? 'open' : ''} data-dh="motion controls"><summary class="dh-ctl-label">${label}</summary>${inner}</details>`;
  // each slider carries a hollow ring at the SAVED default's position (DC): the thumb fits into it when at default
  const slider = (key, label, value, min, max, step, unit) => { const d = defaultFor(key), pct = d === null ? null : Math.min(1, Math.max(0, (d - min) / (max - min)));
    return `<div class="Core-FormField has-bottom-margin dh-motion-field" data-dh="motion control">
      <label class="Core-FormField-label"><span class="Core-FormField-labelValue">${label} <output>${value}${unit}</output></span>
      <span class="dh-range-wrap"><span class="dh-range-track"></span>${pct === null ? '' : `<span class="dh-range-default" style="left: calc(8px + (100% - 16px) * ${pct.toFixed(4)})" title="Saved default: ${d}${unit}"></span>`}<input type="range" class="dh-range" data-motion="${key}" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></span></label></div>`; };
  return `<fieldset class="Core-RadioGroup Core-RadioGroup--vertical has-bottom-margin dh-motion" data-dh="motion controls"><legend class="Core-RadioGroup-label"><span>Motion · ${MOTION.radialEnter.name}</span></legend>
    <div class="Core-RadioGroup-content">
      <div class="dh-motion-actions"><button type="button" class="Core-Button is-ready dh-replay" data-motion="replay" data-dh="motion control">Replay</button>
        <button type="button" class="Core-Button Core-Button--secondary is-ready dh-save" data-motion="save" data-dh="motion control">Save</button></div>
      <div class="dh-motion-saved" id="motionSaved" aria-live="polite"></div>
      <div class="Core-FormField has-bottom-margin dh-motion-field" data-dh="motion control"><label class="Core-FormField-label">
        <input type="checkbox" class="Core-Checkbox-input is-ready" data-motion="loop" ${S.loop ? 'checked' : ''}><span class="Core-FormField-labelValue">Loop (hold ${MOTION.loopHold} ms)</span></label></div>
      ${section('ring', 'Ring', `
      ${slider('ring.duration', 'Duration', ring.duration, 100, 1500, 50, ' ms')}
      ${slider('ring.delay', 'Delay after title', ring.delay, 0, 1000, 50, ' ms')}
      <div class="Core-FormField has-bottom-margin dh-motion-field" data-dh="motion control"><label class="Core-FormField-label"><span class="Core-FormField-labelValue">Easing</span>
        <div class="select-container"><select class="dh-easing" data-motion="ring.easing">${Object.keys(EASINGS).map((k) => `<option value="${k}" ${k === ring.easing ? 'selected' : ''}>${EASING_LABELS[k]}</option>`).join('')}</select></div></label></div>`)}
      ${section('legendRow', 'Legend rows', `
      ${slider('legendRow.duration', 'Duration', rows.duration, 100, 1500, 50, ' ms')}
      ${slider('legendRow.delay', 'Delay after ring', rows.delay, 0, 2000, 50, ' ms')}
      ${slider('legendRow.stagger', 'Stagger', rows.stagger, 0, 300, 10, ' ms')}
      ${slider('legendRow.from', 'Rise', rise.from, 0, 48, 2, ' px')}`)}
      ${section('segment', 'Ring glow', `
      ${slider('segment.duration', 'Duration', glow.duration, 100, 1500, 50, ' ms')}
      ${slider('segment.delay', 'Delay after ring', glow.delay, -1000, 1000, 50, ' ms')}
      ${slider('segment.stagger', 'Stagger', glow.stagger, 0, 400, 10, ' ms')}
      ${slider('segment.to:glow', 'Glow size', glow.to, 0, 24, 1, ' px')}`)}
      ${section('urgentIcon', 'Urgent icons', `
      ${slider('urgentIcon.duration', 'Duration', urgent.duration, 100, 1500, 50, ' ms')}
      ${slider('urgentIcon.delay', 'Delay after rows', urgent.delay, -1000, 1000, 50, ' ms')}
      ${slider('urgentIcon.stagger', 'Stagger', urgent.stagger, 0, 400, 10, ' ms')}
      ${slider('urgentIcon.to:translateY', 'Bounce', -urgentBounce.to, 0, 24, 1, ' px').replace('data-unit=" px"', 'data-unit=" px" data-negate="1"')}
      ${slider('urgentIcon.to:glow', 'Glow size', urgentGlow.to, 0, 24, 1, ' px')}`)}
      ${section('hoverSegment', 'Segment hover', `
      ${slider('hoverSegment.to', 'Lift out', lift.to, 0, 24, 1, ' px')}
      ${slider('hoverSegment.duration', 'Duration', lift.duration, 50, 1000, 50, ' ms')}`)}
    </div></fieldset>`;
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
// CORE UI's legend: clicking an item toggles its series off (the segment leaves the chart, the item takes is-disabled)
const legendItem = (key, inner) => `<div class="Core-DataViz-Legend-item ${S.filter === key ? 'is-selected' : ''} ${S.off.includes(key) ? 'is-disabled' : ''}">
    <button type="button" coreuibutton="text-primary" tabindex="0" class="Core-Button Core-Button--text-primary is-ready" data-key="${key}" aria-pressed="${!S.off.includes(key)}" data-dh="click toggles the state off and on (their legend's behaviour)">${inner}</button></div>`;

function renderDash() {
  for (const id of ['dash', 'dashBar']) el(id).classList.toggle('dh-narrowing', NARROWING);   // the pointer cursor promises a click only when one works
  el('dash').innerHTML = radialDash();
  el('dashBar').innerHTML = barDash();
}

function radialDash() {
  const counts = STATUSES.map((s) => ({ s, n: FLEET[s.key] }));
  const shown = counts.filter((c) => !S.off.includes(c.s.key));   // toggled-off states leave the ring; the legend keeps every row
  const total = shown.reduce((sum, c) => sum + c.n, 0);
  const R1 = 86.5, R0 = 70, PAD = 0.0225;   // half-gap between slices, radians
  const pt = (r, a) => `${(r * Math.sin(a)).toFixed(3)},${(-r * Math.cos(a)).toFixed(3)}`;
  let a0 = 0;
  const slices = shown.filter((c) => c.n > 0).map((c) => {
    const a1 = a0 + (c.n / total) * 2 * Math.PI;
    const s0 = a0 + PAD, s1 = a1 - PAD, big = s1 - s0 > Math.PI ? 1 : 0, mid = (a0 + a1) / 2;
    const d = `M${pt(R1, s0)}A${R1},${R1},0,${big},1,${pt(R1, s1)}L${pt(R0, s1)}A${R0},${R0},0,${big},0,${pt(R0, s0)}Z`;
    const [cx, cy] = pt((R0 + R1) / 2, mid).split(',');
    a0 = a1;
    return `<circle class="Core-DataViz-DonutSeriesPoint" cx="${cx}" cy="${cy}" r="8"></circle>
      <path d="${d}" class="Core-DataViz-DonutSeries ${S.filter === c.s.key ? 'is-active' : ''}" style="fill: ${statusHex(c.s.key)};" data-key="${c.s.key}" data-n="${c.n}" data-mid="${mid.toFixed(4)}"></path>`;
  }).join('');
  // icon: the icon takes the legend's colour slot, name and count beside it. lozenge: the pill replaces slot + name.
  const legend = counts.map(({ s, n }) => legendItem(s.key, S.render === 'lozenge'
    ? `<div class="Core-DataViz-Legend-item-name dh-legend-lozenge" data-dh="status lozenge in the name slot"><coreui-dataviz-series-name><div aria-label="${s.label} ${n}" class="legend-item"><span>${statusMark(s.key)}</span><span>${n}</span></div></coreui-dataviz-series-name></div>`
    : `<div class="Core-DataViz-Legend-item-color dh-legend-icon" data-dh="status icon">${iconEl(s.key)}</div>
        <div class="Core-DataViz-Legend-item-name"><coreui-dataviz-series-name><div aria-label="${s.label} ${n}" class="legend-item"><span>${s.label}</span><span>${n}</span></div></coreui-dataviz-series-name></div>`)).join('');
  return `<coreui-dataviz-card header="Data Health"><div class="Core-DataViz-Card">
    <div class="Core-DataViz-Card-header"><h3>Data Health</h3><div class="Core-DataViz-Card-info"></div></div>
    <coreui-dataviz-portal data-qa="data-viz-donut" class="is-vertical"><div class="Core-DataViz-Portal">
      <svg class="Core-DataViz-Portal-Viz" width="175" height="175" viewBox="0 0 175 175" role="img" data-dh="ring drawn by app.js" aria-label="${total} sources by Data Health status"><g class="Core-DataViz-Series-container" transform="translate(87.5, 87.5)" style="cursor: default;"><g class="dh-ring" data-dh="ring · animated from motion.js">${slices}</g></g></svg></div>
      <coreui-dataviz-legend position="right"><div class="Core-DataViz-Legend is-vertical">${legend}</div></coreui-dataviz-legend>
      ${chartTip(false)}
    </coreui-dataviz-portal></div></coreui-dataviz-card>`;
}

function barDash() {
  const W = 860, LEFT = 76, TOP = 40, BASE = 278, MAX = 500, STEP = W / (BAR_MONTHS.length - 0.5), BAR = STEP / 2, GAP = 2;
  const y = (v) => BASE - (v / MAX) * (BASE - TOP);
  const stackOrder = [...STATUSES].reverse().filter((s) => !S.off.includes(s.key));   // worst on top; toggled-off series leave the stacks
  const tops = BAR_MONTHS.map(() => BASE);
  const series = stackOrder.map((s) => {
    const rects = BAR_MONTHS.map((m, i) => {
      const n = m[s.key]; if (!n) return '';
      const bottom = tops[i], top = bottom - (BASE - y(n)); tops[i] = top;
      const h = bottom - top - (bottom < BASE ? GAP : 0);
      return `<rect x="${(LEFT + i * STEP).toFixed(2)}" y="${top.toFixed(2)}" height="${h.toFixed(2)}" width="${BAR.toFixed(2)}" data-name="${m.month}" data-key="${s.key}" data-n="${n}" style="cursor: default;"${S.filter === s.key ? ' class="is-active"' : ''}></rect>`;
    }).join('');
    return `<g class="Core-DataViz-VerticalBarSeries" fill="${statusHex(s.key)}">${rects}</g>`;
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
    <button type="button" coreuibutton="icon" aria-label="Previous" class="Core-PaginationLeft Core-Button Core-Button--icon is-ready" data-turn="-1">${chev('Left')}</button>
    ${PAGES.map((p, n) => `<button type="button" coreuibutton="icon" class="Core-PaginationItem ${p.key === S.page ? 'is-active' : ''} Core-Button Core-Button--icon is-ready" data-page="${p.key}" ${p.key === S.page ? 'aria-current="page"' : ''} aria-label="${p.name}">${n + 1}</button>`).join('')}
    <button type="button" coreuibutton="icon" aria-label="Next" class="Core-PaginationRight Core-Button Core-Button--icon is-ready" data-turn="1">${chev('Right')}</button>
  </nav></coreui-pagination>`;
}
// the pager WRAPS: Previous on the first page goes to the last, Next on the last to the first, and neither arrow ever disables
// (DC, 2026-09-14 — deliberately not CORE UI's stop-at-the-ends behaviour)
function turn(delta) { const i = PAGES.findIndex((p) => p.key === S.page); const n = (i + delta + PAGES.length) % PAGES.length; S.page = PAGES[n].key; renderAll(); }

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

function renderAll() { renderControls(); renderDash(); renderTable(); renderCards(); renderSurfaces(); renderCode(); playMotion(); }

/* ---- motion: plays the motion table (motion.js) on the Radial's ring ------------------------
 * One Web Animation per track. With Loop on, the finished state holds for MOTION.loopHold, then the motion replays.
 * Reduced motion collapses the whole thing to 1 ms, as CORE UI's rule does for its own transitions. */
let RING_ANIMS = [];
function playMotion() {
  for (const a of RING_ANIMS) a.cancel();
  RING_ANIMS = [];
  if (S.page !== 'dash') return;
  const dash = el('dash');
  // the elements each track name resolves to; a track with `stagger` starts later on each successive element
  const segs = [...dash.querySelectorAll('.dh-ring path[data-key]')];
  const targets = (t) => ({
    ring: [dash.querySelector('.dh-ring')],
    legendRow: [...dash.querySelectorAll('.Core-DataViz-Legend-item')],
    title: [dash.querySelector('.Core-DataViz-Card-header h3')],
    segment: (t.order || []).map((k) => segs.find((p) => p.dataset.key === k)),   // in the track's own order
    urgentIcon: (t.order || []).map((k) => dash.querySelector(`.Core-DataViz-Legend-item [data-key="${k}"] .dh-icon`)),   // the legend icons of the urgent states
  })[t.element] || [];
  const jobs = [];   // one per (track, element): the concrete start time
  const ends = {};   // when each element's own tracks finish — a track with `after: 'ring'` starts once the ring is at rest
  const lift = hoverTrack('liftOut');
  if (lift) { dash.style.setProperty('--dh-lift-ms', `${lift.duration}ms`); dash.style.setProperty('--dh-lift-ease', EASINGS[lift.easing]); }
  const tracks = [...MOTION.radialEnter.tracks].filter((t) => !t.trigger).sort((a, b) => (a.after ? 1 : 0) - (b.after ? 1 : 0));
  for (const t of tracks) targets(t).forEach((node, i) => {
    if (!node) return;
    const start = Math.max(0, (t.after ? ends[t.after] || 0 : 0) + t.delay + i * (t.stagger || 0));   // a negative delay reaches back into the ring; never before 0
    jobs.push({ t, node, start });
    ends[t.element] = Math.max(ends[t.element] || 0, start + t.duration);
  });
  if (!jobs.length) return;
  const end = Math.max(...jobs.map((j) => j.start + j.t.duration));
  const total = end + (S.loop ? MOTION.loopHold : 0);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // scale, rotate and translateY use CSS's individual transform properties, so tracks animate on their own without
  // fighting; glow is a drop-shadow in the segment's own colour, its size in px
  // the hover's selected look (shell.css .is-active) takes its dim from the segment opacity track, so both match (DC)
  const dim = MOTION.radialEnter.tracks.find((t) => t.element === 'segment' && t.property === 'opacity');
  dash.style.setProperty('--dh-selected-opacity', dim ? dim.to : 0.35);
  const css = (t, v, node) => ({
    scale: { scale: `${v}` }, rotate: { rotate: `${v}deg` }, translateY: { translate: `0 ${v}px` },
    // a slice LIGHTS UP by colour (its status colour lifted toward white by the track's dim amount) rather than going see-through:
    // a drop-shadow inherits the element's alpha, so a transparent slice made the halo muddy, and a blend toward the stage
    // went near-black in Dark (DC, 2026-09-14, ring only; "slice brightens" chosen over halo-only and CORE UI's dim). Same in
    // every theme. The hover's own selected look (opacity, shell.css) is untouched.
    opacity: node instanceof SVGPathElement ? { fill: `color-mix(in srgb, ${statusHex(node.dataset.key)} ${Math.round(v * 100)}%, white)` } : { opacity: v },
    glow: { filter: `drop-shadow(0 0 ${v}px ${(() => { const k = node.dataset.key || node.closest('[data-key]')?.dataset.key; return k && STATUS[k] ? statusHex(k) : 'currentColor'; })()})` },
  })[t.property] || { [t.property]: v };
  RING_ANIMS = jobs.map(({ t, node, start }) => node.animate(t.pulse
    ? [   // out and back: from → to at the midpoint → from
      { offset: 0, ...css(t, t.from, node) },
      { offset: start / total, ...css(t, t.from, node), easing: EASINGS[t.easing] },
      { offset: (start + t.duration / 2) / total, ...css(t, t.to, node), easing: EASINGS[t.easing] },
      { offset: (start + t.duration) / total, ...css(t, t.from, node) },
      { offset: 1, ...css(t, t.from, node) },
    ] : [
      { offset: 0, ...css(t, t.from, node) },
      { offset: start / total, ...css(t, t.from, node), easing: EASINGS[t.easing] },
      { offset: (start + t.duration) / total, ...css(t, t.to, node) },
      { offset: 1, ...css(t, t.to, node) },
    ], { duration: reduce ? 1 : total, iterations: S.loop ? Infinity : 1, fill: t.pulse ? 'none' : 'forwards' }));   // a pulse ends where it began, so it lets go of the element
}
// Slider and select changes write into the motion table and replay; nothing else re-renders, so the control keeps focus.
el('controlsMount').addEventListener('input', (e) => {
  const key = e.target.dataset.motion; if (!key || key === 'loop' || key === 'replay') return;
  const [group, rest] = key.split('.'), [field, onlyProp] = rest.split(':');   // "<element>.<field>[:<property>]": ring.duration, legendRow.from (the rise), segment.to:glow…
  const raw = field === 'easing' ? e.target.value : Number(e.target.value);
  const v = e.target.dataset.negate ? -raw : raw;   // a "Bounce" of 6 px is a translateY of −6
  for (const t of MOTION.radialEnter.tracks) {
    const linked = t.matches === group && (field === 'duration' || field === 'from');   // the title follows the rows' duration and rise (DC)
    if (t.element !== group && !linked) continue;
    if (onlyProp && t.property !== onlyProp) continue;               // a slider aimed at one property of the element
    if (field === 'easing' && t.property === 'opacity') continue;     // the fades stay linear (DC)
    if (field === 'from' && t.property !== 'translateY') continue;    // the rise slider moves only the rise track
    t[field] = v;
  }
  const out = e.target.closest('label')?.querySelector('output'); if (out) out.textContent = `${raw}${e.target.dataset.unit || ''}`;
  playMotion();
});
el('controlsMount').addEventListener('click', (e) => {
  const key = e.target.closest('[data-motion]')?.dataset.motion;
  if (key === 'replay') playMotion();
  if (key === 'save') saveMotion();
});
// The saved default behind a slider key — the value in motion.js's SAVED block (what Save last wrote)
function defaultFor(key) {
  const [group, rest] = key.split('.'), [field, onlyProp] = rest.split(':');
  const t = motionDefaults().radialEnter.tracks.find((t) => t.element === group && (!onlyProp || t.property === onlyProp) && (field !== 'from' || t.property === 'translateY'));
  if (!t || t[field] === undefined || typeof t[field] !== 'number') return null;
  return group === 'urgentIcon' && onlyProp === 'translateY' && field === 'to' ? -t[field] : t[field];   // Bounce shows as a positive height
}
/* ---- saving DC's tuned values: in the browser (survives reloads) and, on the dev server, INTO motion.js as the new
 * defaults (the server rewrites the SAVED block). The reset arrow clears the browser store and returns to the defaults.
 * On the published copy there is no server, so Save is browser-only there. */
const MOTION_STORE = 'dh-motion';
const MOTION_OPEN_STORE = 'dh-motion-open';
let MOTION_OPEN = { ring: true };   // which deck sections are open; Ring open by default, the rest closed
try { MOTION_OPEN = { ...MOTION_OPEN, ...JSON.parse(localStorage.getItem(MOTION_OPEN_STORE) || '{}') }; } catch (e) {}
el('controlsMount').addEventListener('toggle', (e) => {   // 'toggle' does not bubble: listen in the capture phase
  const d = e.target; if (!d.matches?.('.dh-motion-section')) return;
  MOTION_OPEN[d.dataset.section] = d.open;
  try { localStorage.setItem(MOTION_OPEN_STORE, JSON.stringify(MOTION_OPEN)); } catch (e) {}
}, true);
function motionSnapshot() { return { savedAt: new Date().toISOString(), loop: S.loop, loopHold: MOTION.loopHold, tracks: MOTION.radialEnter.tracks }; }
function restoreMotion() {
  try {
    const saved = JSON.parse(localStorage.getItem(MOTION_STORE) || 'null'); if (!saved) return;
    const tr = MOTION.radialEnter.tracks;
    if (saved.tracks?.length === tr.length) saved.tracks.forEach((s, i) => { if (s.element === tr[i].element && s.property === tr[i].property) Object.assign(tr[i], s); });
    if (typeof saved.loop === 'boolean') S.loop = saved.loop;
  } catch (e) {}
}
async function saveMotion() {
  const snap = motionSnapshot(), note = el('motionSaved');
  try { localStorage.setItem(MOTION_STORE, JSON.stringify(snap)); } catch (e) {}
  try {
    const r = await fetch('motion-save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snap, null, 2) });
    note.textContent = r.ok ? 'Saved — these are now the defaults (motion.js)' : 'Saved in this browser only';
    if (r.ok) { SAVED.loopHold = snap.loopHold; SAVED.loop = snap.loop; SAVED.tracks = JSON.parse(JSON.stringify(snap.tracks)); renderControls(); el('motionSaved').textContent = 'Saved — these are now the defaults (motion.js)'; }
  } catch (e) { note.textContent = 'Saved in this browser only'; }
}

/* ---- events -------------------------------------------------------------------------------- */
el('controlsMount').addEventListener('change', (e) => {
  if (e.target.name === 'option') { S.option = e.target.value; renderAll(); }
  if (e.target.name === 'render') { S.render = e.target.value; renderAll(); }
  if (e.target.dataset.motion === 'loop') { S.loop = e.target.checked; playMotion(); }
});
const DASHES = [el('dash'), el('dashBar')];
for (const d of DASHES) d.addEventListener('click', (e) => {
  const btn = e.target.closest('.Core-DataViz-Legend-item [data-key]');
  if (btn) {   // CORE UI's legend toggle: the state leaves the chart and the item goes disabled; click again to bring it back
    const k = btn.dataset.key; S.off = S.off.includes(k) ? S.off.filter((x) => x !== k) : [...S.off, k];
    for (const an of RING_ANIMS) an.cancel(); RING_ANIMS = [];   // the chart is redrawn at rest; the entrance show does not replay
    renderDash(); renderCode(); return;
  }
  const seg = e.target.closest('[data-key]'); if (!seg || !NARROWING) return;
  S.filter = (S.filter === seg.dataset.key) ? null : seg.dataset.key;   // mark the state here; the Table shows it narrowed when you turn to it
  animateFilter();
});
el('pager').addEventListener('click', (e) => {
  const t = e.target.closest('[data-turn]'); if (t) return turn(+t.dataset.turn);
  const p = e.target.closest('[data-page]'); if (p) { S.page = p.dataset.page; renderAll(); }
});
document.addEventListener('keydown', (e) => { if (e.target.matches('input, select, textarea, button')) return; if (e.key === 'ArrowLeft') turn(-1); if (e.key === 'ArrowRight') turn(1); });
el('resetBtn').addEventListener('click', () => { S = { ...defaults(), page: S.page }; MOTION = motionDefaults(); try { localStorage.removeItem(MOTION_STORE); } catch (e) {} renderAll(); });   // resets the deck, the motion table and the saved values; keeps the current preview page

/* ---- EXPERIMENT: swatch rail (experiment-themes.js + theme-layer.css) — an experiment palette over the preview surfaces.
 * Click a swatch to lay its six colours over CORE UI's tokens on the preview's components; click it again to take it
 * off. The Light/Dark theme is left alone (DC). Remembered per browser. Everything here is marked data-dh="experiment". */
const EXPERIMENT_STORE = 'dh-experiment-theme';
let EXPERIMENT_ACTIVE = null; try { EXPERIMENT_ACTIVE = localStorage.getItem(EXPERIMENT_STORE) || null; } catch (e) {}
if (EXPERIMENT_ACTIVE && !(typeof EXPERIMENT_THEMES !== 'undefined' && EXPERIMENT_THEMES.some((t) => t.name === EXPERIMENT_ACTIVE))) { EXPERIMENT_ACTIVE = null; try { localStorage.removeItem(EXPERIMENT_STORE); } catch (e) {} }   // a remembered name that no longer exists (the rail was cut and renamed 2026-09-14) is forgotten, not carried
const experimentTheme = () => (typeof EXPERIMENT_THEMES !== 'undefined' && EXPERIMENT_THEMES.find((x) => x.name === EXPERIMENT_ACTIVE)) || null;
// STATUS OVERRIDE (DC): with a theme on, each Data Health status takes one of the experiment's element-state roles.
// Data Health's own palette is two blues and two purples, so the second of each pair is the role tinted toward the fill.
const STATUS_ROLE = { failed: ['disagreed'], warning: ['warning'], healthy: ['success'], partial: ['cmedge'], pending: ['cmedge', 60] };   // unknown / undefined keep Data Health's own purple — the experiment has no purple role (DC, 2026-09-14)
const mixHex = (a, b, pctA) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * pctA / 100 + parseInt(b.slice(1 + i, 3 + i), 16) * (100 - pctA) / 100).toString(16).padStart(2, '0')).join('');
function statusHex(key) {   // the colour a status paints with right now: the theme's role when a swatch is on, else Data Health's own
  const t = experimentTheme(); if (!t) return STATUS[key].hex;
  const [role, pct] = STATUS_ROLE[key] || [];
  const base = t[role]; if (!base) return STATUS[key].hex;
  return pct ? mixHex(base, t.fill, pct) : base;
}
function renderThemeRail() {
  const rail = el('themeRail'); if (!rail || typeof EXPERIMENT_THEMES === 'undefined') return;
  // the experiment's tile stripe: ground 0–50%, edge to 66.667%, meta to 83.333%, sendfill to 100%, at −45°
  const stripe = (c) => `linear-gradient(-45deg, ${c[0]} 0 50%, ${c[1]} 50% 66.667%, ${c[2]} 66.667% 83.333%, ${c[3]} 83.333% 100%)`;
  // first on the rail: "CORE UI" — the stock theme, selected whenever no experiment is on; another way back to the regular look
  // (DC, 2026-09-14). Its tile wears CORE UI's own colours: white ground, slate edge, grey meta, CORE UI blue for the button fill.
  const coreui = `<button type="button" role="option" class="dh-swatch ${EXPERIMENT_ACTIVE ? '' : 'is-selected'}" data-experiment="" title="CORE UI" aria-label="CORE UI" aria-selected="${!EXPERIMENT_ACTIVE}" data-dh="experiment: the stock theme"><span class="chips" style="background:${stripe(['#ffffff', '#cfd4da', '#737373', '#0063e6'])}"></span></button>`;
  rail.innerHTML = coreui + EXPERIMENT_THEMES.map((t) => `<button type="button" role="option" class="dh-swatch ${t.name === EXPERIMENT_ACTIVE ? 'is-selected' : ''}" data-experiment="${t.name}" title="${t.name}" aria-label="${t.name}" aria-selected="${t.name === EXPERIMENT_ACTIVE}" data-dh="experiment: swatch"><span class="chips" style="background:${stripe(t.chips)}"></span></button>`).join('');
}
function applyExperimentTheme() {
  const t = experimentTheme(), p = el('preview');
  p.classList.toggle('dh-themed', !!t);
  for (const k of ['ground', 'fill', 'edge', 'content', 'body', 'meta', 'title', 'icon', 'cmedge', 'sendfill', 'sendtext', 'sendedge', 'secfill', 'sectext', 'secedge', 'focus']) p.style.setProperty(`--xp-${k}`, t ? t[k] : '');
  for (const k of Object.keys(STATUS)) p.style.setProperty(`--dh-c-${k}`, t ? statusHex(k) : '');
  if (t) p.setAttribute('data-dh', `experiment: ${t.name} palette over the preview's components`); else p.removeAttribute('data-dh');
  if (typeof renderDash === 'function' && el('dash').innerHTML) { for (const an of RING_ANIMS) an.cancel(); RING_ANIMS = []; renderDash(); renderCode(); }   // chart fills are inline: redraw at rest
}
el('themeRail').addEventListener('click', (e) => {
  const b = e.target.closest('[data-experiment]'); if (!b) return;
  const pick = b.dataset.experiment || null;   // the CORE UI swatch carries no name: picking it switches every experiment off
  EXPERIMENT_ACTIVE = (pick && EXPERIMENT_ACTIVE === pick) ? null : pick;
  try { EXPERIMENT_ACTIVE ? localStorage.setItem(EXPERIMENT_STORE, EXPERIMENT_ACTIVE) : localStorage.removeItem(EXPERIMENT_STORE); } catch (e) {}
  renderThemeRail(); applyExperimentTheme();
});

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
renderThemeRail(); applyExperimentTheme();        // EXPERIMENT: the swatch rail and any remembered palette
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
  panel.querySelector('.tooltip-color').style.backgroundColor = statusHex(p.dataset.key); panel.querySelector('.dh-tip-value').textContent = p.dataset.n; panel.querySelector('.dh-tip-label').textContent = v.label;
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
  if (p.dataset.mid) { const lift = hoverTrack('liftOut'), a = Number(p.dataset.mid); if (lift) p.style.translate = `${(lift.to * Math.sin(a)).toFixed(2)}px ${(-lift.to * Math.cos(a)).toFixed(2)}px`; }   // Sketch 07: the piece lifts out
});
for (const d of DASHES) d.addEventListener('mouseout', (e) => {
  const p = e.target.closest('[data-n]'); if (!p) return;
  d.querySelector('.dh-chart-tip').classList.remove('Core-DataViz-Tooltip-is-open');
  if (p.dataset.key !== S.filter) p.classList.remove('is-active');
  if (p.dataset.mid) p.style.translate = '0px 0px';
});
// hover tracks (trigger: 'hover') are not played by the show; the hover handlers read them
const hoverTrack = (prop) => MOTION.radialEnter.tracks.find((t) => t.trigger === 'hover' && t.property === prop);

/* summary -> details: rows fade out, re-render, fade in — the moment the motion spec attaches to */
function animateFilter() {
  document.querySelectorAll('#tableMount tbody tr, #tableGroupsMount tbody tr').forEach((r) => r.classList.add('dh-row-hidden'));
  setTimeout(renderAll, 180);
}

restoreMotion();
loadIcons().then(renderAll);
